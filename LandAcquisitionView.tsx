/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  FileCheck,
  Scale,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Scroll,
  BadgeCheck,
  Building,
  UserCheck,
  Plus,
  Layers,
  Edit,
  History,
  Search,
  Filter,
  Compass,
  Shovel,
  Info,
  Calendar,
  X,
  Eye,
  Truck,
  Fuel,
  Wrench,
  HardHat,
  Activity,
  Calculator,
  Sliders,
  ArrowUpDown,
  Flame,
} from 'lucide-react';
import {
  LandParcel,
  BankAccount,
  User,
  LandDocumentItem,
  LandDocType,
  AuditEvent,
  CutFillCalculationDetail,
  SoilCategory,
  HeavyEquipmentItem,
  SupportToolItem,
  LaborRateItem,
  BudgetItem,
  Project,
} from '../types';
import { formatRupiah } from '../services/currency';
import {
  recordLandParcelPayment,
  recordNotaryFeePayment,
  updateLandDocumentChecklist,
  updateLandConveyanceStage,
  createLandParcel,
  updateLandParcel,
  getLandAuditEvents,
  saveLandCutFillCalculation,
} from '../services/ledgerEngine';

interface LandAcquisitionViewProps {
  parcels: LandParcel[];
  bankAccounts: BankAccount[];
  currentUser: User;
  onRefreshData: () => void;
  budgetItems?: BudgetItem[];
  project?: Project;
}

export const LandAcquisitionView: React.FC<LandAcquisitionViewProps> = ({
  parcels,
  bankAccounts,
  currentUser,
  onRefreshData,
  budgetItems = [],
  project,
}) => {
  // Modal states
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isPayLandModalOpen, setIsPayLandModalOpen] = useState(false);
  const [isPayNotaryModalOpen, setIsPayNotaryModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'INVENTARISASI' | 'CUT_FILL'>('INVENTARISASI');

  // Cut & Fill Modal state
  const [isCutFillModalOpen, setIsCutFillModalOpen] = useState(false);
  const [selectedCutFillParcel, setSelectedCutFillParcel] = useState<LandParcel | null>(null);

  const defaultTargetBudgetItem =
    budgetItems.find((b) => b.costCode === 'EW-HAUL-02' || b.category === 'EARTHWORKS') ||
    budgetItems[1] ||
    budgetItems[0];

  const [cutFillForm, setCutFillForm] = useState({
    cutVolumeM3: 2000,
    fillVolumeM3: 1500,
    soilCategory: 'TANAH_BIASA' as SoilCategory,
    notes: '',
    // 1. Sewa Alat Berat
    excavatorHours: 40,
    excavatorRate: 185000,
    bulldozerHours: 45,
    bulldozerRate: 220000,
    vibroHours: 25,
    vibroRate: 165000,
    dumpTruckTrips: 65,
    dumpTruckRate: 250000,
    // 2. BBM Solar Industri
    fuelLiters: 1600,
    fuelPricePerLiter: 15500,
    // 3. Sewa Alat Penunjang Lapangan
    theodoliteDays: 5,
    theodoliteRate: 350000,
    mudPumpDays: 0,
    mudPumpRate: 200000,
    plateCompactorDays: 4,
    plateCompactorRate: 150000,
    supportSuppliesCost: 1500000,
    // 4. Jasa & Upah SDM
    operatorCount: 3,
    operatorDays: 7,
    operatorDailyWage: 300000,
    operatorFoodDaily: 50000,
    mandorDays: 7,
    mandorDailyWage: 225000,
    surveyorDays: 4,
    surveyorDailyWage: 350000,
    // Integrasi RAB
    integrateToRAB: true,
    targetBudgetItemId: defaultTargetBudgetItem?.id || 'bitem_02',
    allocationType: 'REALISASI' as 'REALISASI' | 'KOMITMEN',
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [toleranceFilter, setToleranceFilter] = useState<'ALL' | 'LOLOS' | 'HOLD_SELISIH_LUAS'>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [disputeFilter, setDisputeFilter] = useState<string>('ALL');

  // Operational Form states
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>('');
  const [newStage, setNewStage] = useState<LandParcel['conveyanceStatus']>('AJB_SELESAI');
  const [newCertificateNo, setNewCertificateNo] = useState<string>('');
  const [auditReason, setAuditReason] = useState<string>('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    parcelCode: '',
    sellerName: '',
    sellerIdCard: '',
    sellerPhone: '',
    locationDescription: '',
    documentArea: 1000,
    surveyedArea: 1000,
    pricePerMeter: 500000,
    originalTitleType: 'SHM' as LandParcel['originalTitleType'],
    originalTitleNo: '',
    notaryName: 'Farida Arifin, S.H., M.Kn.',
    notaryOffice: 'Kantor Notaris & PPAT Farida Arifin',
    notaryFee: 10000000,
    topographyType: 'BERKONTUR' as LandParcel['topographyType'],
    cutFillVolumeM3: 1500,
    cutFillCostPerM3: 45000,
    cutFillProgressPercentage: 0,
    gpsCoordinates: '-6.48200, 106.84500',
    northBoundary: 'Jalan Lingkungan Desa',
    southBoundary: 'Kavling Milik Warga',
    eastBoundary: 'Rencana Jalan Bouleward Proyek',
    westBoundary: 'Saluran Irigasi Tersier',
    surveyorName: 'BPN Cibinong (Seksi Pengukuran)',
    surveyDate: new Date().toISOString().split('T')[0],
    legalDisputeStatus: 'AMAN_CLEAR_AND_CLEAN' as LandParcel['legalDisputeStatus'],
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<LandParcel>>({});

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Summary Metrics
  const totalParcels = parcels.length;
  const totalDocArea = parcels.reduce((sum, p) => sum + p.documentArea, 0);
  const totalSurveyedArea = parcels.reduce((sum, p) => sum + p.surveyedArea, 0);
  const totalAgreed = parcels.reduce((sum, p) => sum + p.agreedTotalAmount, 0);
  const totalPaid = parcels.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalRemaining = parcels.reduce((sum, p) => sum + p.remainingAmount, 0);
  const totalNotaryFee = parcels.reduce((sum, p) => sum + p.notaryFee, 0);
  const totalNotaryPaid = parcels.filter((p) => p.notaryFeePaid).reduce((sum, p) => sum + p.notaryFee, 0);
  const totalCutFillCost = parcels.reduce((sum, p) => sum + (p.cutFillTotalCost || 0), 0);
  const holdCount = parcels.filter((p) => p.areaToleranceStatus === 'HOLD_SELISIH_LUAS').length;

  // Filtered Parcels
  const filteredParcels = parcels.filter((p) => {
    const matchSearch =
      searchQuery === '' ||
      p.parcelCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.locationDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originalTitleNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTolerance = toleranceFilter === 'ALL' || p.areaToleranceStatus === toleranceFilter;
    const matchStage = stageFilter === 'ALL' || p.conveyanceStatus === stageFilter;
    const matchDispute = disputeFilter === 'ALL' || p.legalDisputeStatus === disputeFilter;

    return matchSearch && matchTolerance && matchStage && matchDispute;
  });

  // Handlers for Opening Modals
  const openCreateModal = () => {
    const nextSeq = parcels.length + 12;
    setCreateForm({
      parcelCode: `BIDANG-${String(nextSeq).padStart(3, '0')}`,
      sellerName: '',
      sellerIdCard: '',
      sellerPhone: '',
      locationDescription: 'Blok Pengembangan Baru Harmoni Green Valley',
      documentArea: 1000,
      surveyedArea: 1000,
      pricePerMeter: 500000,
      originalTitleType: 'SHM',
      originalTitleNo: '',
      notaryName: 'Farida Arifin, S.H., M.Kn.',
      notaryOffice: 'Kantor Notaris & PPAT Farida Arifin',
      notaryFee: 10000000,
      topographyType: 'BERKONTUR',
      cutFillVolumeM3: 1500,
      cutFillCostPerM3: 45000,
      cutFillProgressPercentage: 0,
      gpsCoordinates: '-6.48200, 106.84500',
      northBoundary: 'Jalan Lingkungan Desa',
      southBoundary: 'Kavling Milik Warga',
      eastBoundary: 'Rencana Jalan Bouleward Proyek',
      westBoundary: 'Saluran Irigasi Tersier',
      surveyorName: 'BPN Cibinong (Seksi Pengukuran)',
      surveyDate: new Date().toISOString().split('T')[0],
      legalDisputeStatus: 'AMAN_CLEAR_AND_CLEAN',
    });
    setIsCreateModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const openEditModal = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setEditForm({ ...parcel });
    setAuditReason('');
    setIsEditModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const openAuditModal = (parcel?: LandParcel) => {
    setSelectedParcel(parcel || null);
    setIsAuditModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const openDetailModal = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setIsDetailModalOpen(true);
  };

  const openChecklistModal = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setIsChecklistModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const openPayLandModal = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setPayAmount(parcel.remainingAmount > 0 ? Math.min(parcel.remainingAmount, 100000000) : 0);
    setPayNotes('Pembayaran termin pembelian lahan');
    setIsPayLandModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const openPayNotaryModal = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setIsPayNotaryModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const openStageModal = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    setNewStage(parcel.conveyanceStatus);
    setNewCertificateNo(parcel.newCertificateNo || '');
    setIsStageModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Helper Methods for Cut & Fill
  const getSoilMultiplier = (category: SoilCategory): number => {
    switch (category) {
      case 'TANAH_KERAS_BERBATU':
        return 1.5;
      case 'TANAH_LEMBEK_RAWA':
        return 1.35;
      case 'TANAH_URUG_PILIHAN':
        return 1.15;
      case 'TANAH_BIASA':
      default:
        return 1.0;
    }
  };

  const getSoilCategoryLabel = (category: SoilCategory) => {
    switch (category) {
      case 'TANAH_KERAS_BERBATU':
        return {
          title: 'Tanah Keras / Berbatu',
          desc: 'Struktur cadas/batu kapur keras. Memerlukan breaker dan jam kerja alat berat +50%.',
          badge: 'bg-stone-100 text-stone-800 border-stone-300',
          koef: '1.50x',
        };
      case 'TANAH_LEMBEK_RAWA':
        return {
          title: 'Tanah Lembek / Rawa / Lumpur',
          desc: 'Kadar air tinggi dan daya dukung rendah. Memerlukan pompa dewatering lumpur & buang sedimen.',
          badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
          koef: '1.35x',
        };
      case 'TANAH_URUG_PILIHAN':
        return {
          title: 'Tanah Urug Pilihan / Sirtu',
          desc: 'Material sirtu pilihan dari borrow pit luar. Pemadatan lapis per lapis 30 cm.',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          koef: '1.15x',
        };
      case 'TANAH_BIASA':
      default:
        return {
          title: 'Tanah Biasa / Sedang',
          desc: 'Tanah lempung/pasir standar perumahan tanpa hambatan batuan atau muka air tinggi.',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          koef: '1.00x',
        };
    }
  };

  const calculateAutoPreset = (cutM3: number, fillM3: number, cat: SoilCategory) => {
    const mult = getSoilMultiplier(cat);
    const excHours = Math.max(10, Math.ceil((cutM3 / 50) * mult));
    const bdzHours = Math.max(10, Math.ceil(((cutM3 + fillM3) / 80) * mult));
    const vibHours = Math.max(8, Math.ceil((fillM3 / 70) * mult));
    const netDiff = Math.abs(cutM3 - fillM3);
    const dtTrips = Math.max(5, Math.ceil((netDiff / 8) * (cat === 'TANAH_URUG_PILIHAN' ? 1.25 : 1.0)));
    const totalEqHours = excHours + bdzHours + vibHours;
    const estLiters = Math.round(totalEqHours * 15);
    const daysReq = Math.max(3, Math.ceil(Math.max(excHours, bdzHours) / 7));
    const pumpDays = cat === 'TANAH_LEMBEK_RAWA' ? Math.max(3, Math.ceil(daysReq * 0.75)) : 0;
    const plateDays = Math.max(2, Math.ceil(daysReq * 0.5));
    const survDays = Math.max(2, Math.ceil(daysReq * 0.35));

    return {
      excavatorHours: excHours,
      bulldozerHours: bdzHours,
      vibroHours: vibHours,
      dumpTruckTrips: dtTrips,
      fuelLiters: estLiters,
      theodoliteDays: survDays,
      mudPumpDays: pumpDays,
      plateCompactorDays: plateDays,
      operatorDays: daysReq,
      mandorDays: daysReq,
      surveyorDays: survDays,
    };
  };

  const openCutFillModal = (parcel: LandParcel) => {
    setSelectedCutFillParcel(parcel);
    const targetItem =
      budgetItems.find((b) => b.costCode === 'EW-HAUL-02' || b.category === 'EARTHWORKS') ||
      budgetItems[1] ||
      budgetItems[0];

    if (parcel.cutFillDetail) {
      const d = parcel.cutFillDetail;
      const exc = d.heavyEquipments.find((e) => e.type === 'EXCAVATOR') || { hoursOrTrips: 40, unitRate: 185000 };
      const bdz = d.heavyEquipments.find((e) => e.type === 'BULLDOZER') || { hoursOrTrips: 45, unitRate: 220000 };
      const vib = d.heavyEquipments.find((e) => e.type === 'VIBRO_ROLLER') || { hoursOrTrips: 25, unitRate: 165000 };
      const dt = d.heavyEquipments.find((e) => e.type === 'DUMP_TRUCK') || { hoursOrTrips: 60, unitRate: 250000 };

      const theo = d.supportTools.find((s) => s.id === 'st_1') || { days: 5, dailyRate: 350000 };
      const pump = d.supportTools.find((s) => s.id === 'st_2') || { days: 0, dailyRate: 200000 };
      const plate = d.supportTools.find((s) => s.id === 'st_3') || { days: 4, dailyRate: 150000 };
      const supplies = d.supportTools.find((s) => s.id === 'st_4') || { dailyRate: 1500000 };

      const op = d.labors.find((l) => l.id === 'lb_1') || { personCount: 3, days: 7, dailyWage: 300000 };
      const opFood = d.labors.find((l) => l.id === 'lb_2') || { dailyWage: 50000 };
      const mdr = d.labors.find((l) => l.id === 'lb_3') || { days: 7, dailyWage: 225000 };
      const srv = d.labors.find((l) => l.id === 'lb_4') || { days: 4, dailyWage: 350000 };

      setCutFillForm({
        cutVolumeM3: d.cutVolumeM3,
        fillVolumeM3: d.fillVolumeM3,
        soilCategory: d.soilCategory,
        notes: d.notes || '',
        excavatorHours: exc.hoursOrTrips,
        excavatorRate: exc.unitRate,
        bulldozerHours: bdz.hoursOrTrips,
        bulldozerRate: bdz.unitRate,
        vibroHours: vib.hoursOrTrips,
        vibroRate: vib.unitRate,
        dumpTruckTrips: dt.hoursOrTrips,
        dumpTruckRate: dt.unitRate,
        fuelLiters: d.fuelLiters,
        fuelPricePerLiter: d.fuelPricePerLiter,
        theodoliteDays: theo.days,
        theodoliteRate: theo.dailyRate,
        mudPumpDays: pump.days,
        mudPumpRate: pump.dailyRate,
        plateCompactorDays: plate.days,
        plateCompactorRate: plate.dailyRate,
        supportSuppliesCost: supplies.dailyRate,
        operatorCount: op.personCount,
        operatorDays: op.days,
        operatorDailyWage: op.dailyWage,
        operatorFoodDaily: opFood.dailyWage,
        mandorDays: mdr.days,
        mandorDailyWage: mdr.dailyWage,
        surveyorDays: srv.days,
        surveyorDailyWage: srv.dailyWage,
        integrateToRAB: d.integrateToRAB !== undefined ? d.integrateToRAB : true,
        targetBudgetItemId: d.targetBudgetItemId || targetItem?.id || 'bitem_02',
        allocationType: d.allocationType || 'REALISASI',
      });
    } else {
      let cat: SoilCategory = 'TANAH_BIASA';
      if (parcel.topographyType === 'LEMBAH_RAWA') cat = 'TANAH_LEMBEK_RAWA';
      else if (parcel.topographyType === 'PERBUKITAN') cat = 'TANAH_KERAS_BERBATU';

      const cutM3 = parcel.cutFillVolumeM3
        ? Math.round(parcel.cutFillVolumeM3 * 0.58)
        : Math.round(parcel.surveyedArea * 1.4);
      const fillM3 = parcel.cutFillVolumeM3
        ? Math.round(parcel.cutFillVolumeM3 * 0.42)
        : Math.round(parcel.surveyedArea * 0.9);

      const presets = calculateAutoPreset(cutM3, fillM3, cat);

      setCutFillForm({
        cutVolumeM3: cutM3,
        fillVolumeM3: fillM3,
        soilCategory: cat,
        notes: `Pematangan lahan kontur ${parcel.topographyType || 'DATAR'} di ${parcel.locationDescription}`,
        excavatorHours: presets.excavatorHours,
        excavatorRate: 185000,
        bulldozerHours: presets.bulldozerHours,
        bulldozerRate: 220000,
        vibroHours: presets.vibroHours,
        vibroRate: 165000,
        dumpTruckTrips: presets.dumpTruckTrips,
        dumpTruckRate: 250000,
        fuelLiters: presets.fuelLiters,
        fuelPricePerLiter: 15500,
        theodoliteDays: presets.theodoliteDays,
        theodoliteRate: 350000,
        mudPumpDays: presets.mudPumpDays,
        mudPumpRate: 200000,
        plateCompactorDays: presets.plateCompactorDays,
        plateCompactorRate: 150000,
        supportSuppliesCost: 1500000,
        operatorCount: 3,
        operatorDays: presets.operatorDays,
        operatorDailyWage: 300000,
        operatorFoodDaily: 50000,
        mandorDays: presets.mandorDays,
        mandorDailyWage: 225000,
        surveyorDays: presets.surveyorDays,
        surveyorDailyWage: 350000,
        integrateToRAB: true,
        targetBudgetItemId: targetItem?.id || 'bitem_02',
        allocationType: 'REALISASI',
      });
    }

    setIsCutFillModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Live calculation of Cut & Fill modal costs
  const cfExcavatorCost = cutFillForm.excavatorHours * cutFillForm.excavatorRate;
  const cfBulldozerCost = cutFillForm.bulldozerHours * cutFillForm.bulldozerRate;
  const cfVibroCost = cutFillForm.vibroHours * cutFillForm.vibroRate;
  const cfDumpTruckCost = cutFillForm.dumpTruckTrips * cutFillForm.dumpTruckRate;
  const cfTotalEquipmentCost = cfExcavatorCost + cfBulldozerCost + cfVibroCost + cfDumpTruckCost;

  const cfTotalFuelCost = cutFillForm.fuelLiters * cutFillForm.fuelPricePerLiter;

  const cfTheodoliteCost = cutFillForm.theodoliteDays * cutFillForm.theodoliteRate;
  const cfMudPumpCost = cutFillForm.mudPumpDays * cutFillForm.mudPumpRate;
  const cfPlateCompactorCost = cutFillForm.plateCompactorDays * cutFillForm.plateCompactorRate;
  const cfTotalSupportCost = cfTheodoliteCost + cfMudPumpCost + cfPlateCompactorCost + cutFillForm.supportSuppliesCost;

  const cfOperatorCost =
    cutFillForm.operatorCount *
    cutFillForm.operatorDays *
    (cutFillForm.operatorDailyWage + cutFillForm.operatorFoodDaily);
  const cfMandorCost = cutFillForm.mandorDays * cutFillForm.mandorDailyWage;
  const cfSurveyorCost = cutFillForm.surveyorDays * cutFillForm.surveyorDailyWage;
  const cfTotalLaborCost = cfOperatorCost + cfMandorCost + cfSurveyorCost;

  const cfGrandTotalCost = cfTotalEquipmentCost + cfTotalFuelCost + cfTotalSupportCost + cfTotalLaborCost;
  const cfTotalGrossVolume = cutFillForm.cutVolumeM3 + cutFillForm.fillVolumeM3;
  const cfEffectiveCostPerM3 = cfTotalGrossVolume > 0 ? Math.round(cfGrandTotalCost / cfTotalGrossVolume) : 0;
  const cfNetBalance = cutFillForm.cutVolumeM3 - cutFillForm.fillVolumeM3;

  // Form Submissions
  const handleSaveCutFillCalculation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCutFillParcel) return;
    try {
      setErrorMessage(null);
      const targetBudgetItem =
        (budgetItems || []).find((b) => b.id === cutFillForm.targetBudgetItemId) ||
        (budgetItems || [])[1] ||
        (budgetItems || [])[0];

      const calculationDetail: CutFillCalculationDetail = {
        id: `calc_cf_${Date.now()}`,
        parcelId: selectedCutFillParcel.id,
        calculatedAt: new Date().toISOString(),
        calculatedBy: currentUser.name,
        cutVolumeM3: cutFillForm.cutVolumeM3,
        fillVolumeM3: cutFillForm.fillVolumeM3,
        netBalanceM3: cutFillForm.cutVolumeM3 - cutFillForm.fillVolumeM3,
        soilCategory: cutFillForm.soilCategory,
        soilDifficultyMultiplier: getSoilMultiplier(cutFillForm.soilCategory),
        notes: cutFillForm.notes,
        heavyEquipments: [
          {
            id: 'eq_1',
            name: 'Excavator Komatsu PC200 (Bucket 0.9 m³)',
            type: 'EXCAVATOR',
            quantity: 1,
            hoursOrTrips: cutFillForm.excavatorHours,
            unitRate: cutFillForm.excavatorRate,
            unitLabel: 'jam',
            subtotal: cutFillForm.excavatorHours * cutFillForm.excavatorRate,
          },
          {
            id: 'eq_2',
            name: 'Bulldozer Komatsu D65P (Blade Perata)',
            type: 'BULLDOZER',
            quantity: 1,
            hoursOrTrips: cutFillForm.bulldozerHours,
            unitRate: cutFillForm.bulldozerRate,
            unitLabel: 'jam',
            subtotal: cutFillForm.bulldozerHours * cutFillForm.bulldozerRate,
          },
          {
            id: 'eq_3',
            name: 'Vibro Roller Compactor 10 Ton',
            type: 'VIBRO_ROLLER',
            quantity: 1,
            hoursOrTrips: cutFillForm.vibroHours,
            unitRate: cutFillForm.vibroRate,
            unitLabel: 'jam',
            subtotal: cutFillForm.vibroHours * cutFillForm.vibroRate,
          },
          {
            id: 'eq_4',
            name: 'Dump Truck Indeks 8 m³ (Hauling/Disposal)',
            type: 'DUMP_TRUCK',
            quantity: Math.max(1, Math.ceil(cutFillForm.dumpTruckTrips / 10)),
            hoursOrTrips: cutFillForm.dumpTruckTrips,
            unitRate: cutFillForm.dumpTruckRate,
            unitLabel: 'rit',
            subtotal: cutFillForm.dumpTruckTrips * cutFillForm.dumpTruckRate,
          },
        ],
        totalEquipmentCost: cfTotalEquipmentCost,
        fuelLiters: cutFillForm.fuelLiters,
        fuelPricePerLiter: cutFillForm.fuelPricePerLiter,
        totalFuelCost: cfTotalFuelCost,
        supportTools: [
          {
            id: 'st_1',
            name: 'Waterpass & Total Station Digital Topografi',
            quantity: 1,
            days: cutFillForm.theodoliteDays,
            dailyRate: cutFillForm.theodoliteRate,
            subtotal: cutFillForm.theodoliteDays * cutFillForm.theodoliteRate,
          },
          {
            id: 'st_2',
            name: 'Pompa Celup Dewatering Sedot Lumpur Alkon',
            quantity: 1,
            days: cutFillForm.mudPumpDays,
            dailyRate: cutFillForm.mudPumpRate,
            subtotal: cutFillForm.mudPumpDays * cutFillForm.mudPumpRate,
          },
          {
            id: 'st_3',
            name: 'Plate Compactor (Stamper Kodok Pemadat Sudut)',
            quantity: 1,
            days: cutFillForm.plateCompactorDays,
            dailyRate: cutFillForm.plateCompactorRate,
            subtotal: cutFillForm.plateCompactorDays * cutFillForm.plateCompactorRate,
          },
          {
            id: 'st_4',
            name: 'Patok Kayu Bouwplank, Benang Elevasi & Rambu K3',
            quantity: 1,
            days: 1,
            dailyRate: cutFillForm.supportSuppliesCost,
            subtotal: cutFillForm.supportSuppliesCost,
          },
        ],
        totalSupportToolsCost: cfTotalSupportCost,
        labors: [
          {
            id: 'lb_1',
            role: 'Operator Alat Berat (Excavator, Bulldozer, Vibro)',
            personCount: cutFillForm.operatorCount,
            days: cutFillForm.operatorDays,
            dailyWage: cutFillForm.operatorDailyWage,
            subtotal: cutFillForm.operatorCount * cutFillForm.operatorDays * cutFillForm.operatorDailyWage,
          },
          {
            id: 'lb_2',
            role: 'Uang Makan & Lembur Operator Alat',
            personCount: cutFillForm.operatorCount,
            days: cutFillForm.operatorDays,
            dailyWage: cutFillForm.operatorFoodDaily,
            subtotal: cutFillForm.operatorCount * cutFillForm.operatorDays * cutFillForm.operatorFoodDaily,
          },
          {
            id: 'lb_3',
            role: 'Mandor Lapangan Pekerjaan Tanah & Galian',
            personCount: 1,
            days: cutFillForm.mandorDays,
            dailyWage: cutFillForm.mandorDailyWage,
            subtotal: cutFillForm.mandorDays * cutFillForm.mandorDailyWage,
          },
          {
            id: 'lb_4',
            role: 'Surveyor Topografi & Helper Ukur Elevasi',
            personCount: 2,
            days: cutFillForm.surveyorDays,
            dailyWage: cutFillForm.surveyorDailyWage,
            subtotal: cutFillForm.surveyorDays * cutFillForm.surveyorDailyWage,
          },
        ],
        totalLaborCost: cfTotalLaborCost,
        grandTotalCost: cfGrandTotalCost,
        effectiveCostPerM3: cfEffectiveCostPerM3,
        integrateToRAB: cutFillForm.integrateToRAB,
        targetBudgetItemId: targetBudgetItem ? targetBudgetItem.id : 'bitem_02',
        targetCostCode: targetBudgetItem ? targetBudgetItem.costCode : 'EW-HAUL-02',
        targetDescription: targetBudgetItem ? targetBudgetItem.description : 'Pekerjaan Cut and Fill & Hauling Tanah Galian',
        allocationType: cutFillForm.allocationType,
      };

      saveLandCutFillCalculation(selectedCutFillParcel.id, calculationDetail, currentUser);
      setIsCutFillModalOpen(false);
      setSuccessMessage(
        `Kalkulasi Pematangan Lahan (Cut & Fill) untuk ${selectedCutFillParcel.parcelCode} berhasil disimpan! Total biaya: ${formatRupiah(cfGrandTotalCost)} (${formatRupiah(cfEffectiveCostPerM3)}/m³). ${
          cutFillForm.integrateToRAB
            ? `Telah diintegrasikan ke komponen RAB [${calculationDetail.targetCostCode} - ${calculationDetail.targetDescription}] sebagai ${cutFillForm.allocationType}.`
            : 'Tersimpan secara internal pada inventaris lahan.'
        }`
      );
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan kalkulasi Cut & Fill.');
    }
  };
  const handleCreateLandParcel = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      const newP = createLandParcel(
        {
          ...createForm,
          projectId: parcels[0]?.projectId || 'prj_01',
        },
        currentUser
      );
      setIsCreateModalOpen(false);
      setSuccessMessage(
        `Bidang lahan baru "${newP.parcelCode}" an. ${newP.sellerName} berhasil didaftarkan! Status toleransi: ${newP.areaToleranceStatus}`
      );
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftarkan bidang lahan baru.');
    }
  };

  const handleUpdateLandParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel) return;
    try {
      setErrorMessage(null);
      const updated = updateLandParcel(selectedParcel.id, editForm, auditReason, currentUser);
      setIsEditModalOpen(false);
      setSuccessMessage(
        `Data bidang lahan "${updated.parcelCode}" berhasil diperbarui. Perubahan tersimpan dalam jejak audit.`
      );
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memperbarui data bidang lahan.');
    }
  };

  const handleToggleDoc = (docId: string, currentStatus: boolean, docName: string) => {
    if (!selectedParcel) return;
    try {
      const updated = updateLandDocumentChecklist(
        selectedParcel.id,
        docId,
        !currentStatus,
        currentUser,
        `Diverifikasi oleh ${currentUser.name} (${currentUser.role})`
      );
      setSelectedParcel(updated);
      setSuccessMessage(`Dokumen "${docName}" berhasil ${!currentStatus ? 'DIVERIFIKASI' : 'DIBATALKAN'}.`);
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memperbarui status dokumen.');
    }
  };

  const handleExecuteLandPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel) return;
    try {
      setErrorMessage(null);
      const res = recordLandParcelPayment(selectedParcel.id, payAmount, selectedBankId, currentUser, payNotes);
      setIsPayLandModalOpen(false);
      setSuccessMessage(
        `Pembayaran Lahan ${selectedParcel.parcelCode} senilai ${formatRupiah(payAmount)} berhasil dibukukan! Jurnal: ${res.journal.entryNo}`
      );
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran tanah.');
    }
  };

  const handleExecuteNotaryPayment = () => {
    if (!selectedParcel) return;
    try {
      setErrorMessage(null);
      const res = recordNotaryFeePayment(selectedParcel.id, selectedBankId, currentUser);
      setIsPayNotaryModalOpen(false);
      setSuccessMessage(
        `Biaya Notaris ${formatRupiah(selectedParcel.notaryFee)} untuk ${selectedParcel.parcelCode} berhasil dibayar! Jurnal: ${res.journal.entryNo}`
      );
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran notaris.');
    }
  };

  const handleExecuteStageUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel) return;
    try {
      setErrorMessage(null);
      const updated = updateLandConveyanceStage(selectedParcel.id, newStage, newCertificateNo, currentUser);
      setIsStageModalOpen(false);
      setSuccessMessage(`Tahapan legalitas ${selectedParcel.parcelCode} diperbarui ke "${newStage}".`);
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memperbarui tahapan legalitas.');
    }
  };

  const getStageLabel = (stage: LandParcel['conveyanceStatus']) => {
    switch (stage) {
      case 'DOKUMEN_AWAL':
        return { label: '1. Dokumen Awal', color: 'bg-slate-100 text-slate-800 border-slate-200' };
      case 'PPJB_NOTARIIL':
        return { label: '2. PPJB Notaris', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'VALIDASI_PAJAK':
        return { label: '3. Validasi Pajak BPHTB', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'AJB_SELESAI':
        return { label: '4. Akta Jual Beli (AJB)', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'PROSES_BALIK_NAMA_BPN':
        return { label: '5. Balik Nama BPN', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'SHGB_TERBIT_ATAS_NAMA_PT':
        return { label: '6. SHGB Terbit an. PT', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: stage, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getDisputeBadge = (status: LandParcel['legalDisputeStatus']) => {
    switch (status) {
      case 'AMAN_CLEAR_AND_CLEAN':
        return { label: 'Clear & Clean', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'KLAIM_AHLI_WARIS':
        return { label: 'Klaim Waris', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'TUMPANG_TINDIH_BATAS':
        return { label: 'Tumpang Tindih', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'MEDIASI_DESA':
        return { label: 'Mediasi Desa', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  // Audit Events for Modal
  const auditEvents = getLandAuditEvents(selectedParcel?.id);

  // Real-time calculations for Create Modal
  const createVariance = createForm.surveyedArea - createForm.documentArea;
  const createVariancePct = createForm.documentArea > 0 ? (createVariance / createForm.documentArea) * 100 : 0;
  const createToleranceStatus = Math.abs(createVariancePct) > 1.0 ? 'HOLD_SELISIH_LUAS' : 'LOLOS';
  const createTotalAgreed = createForm.surveyedArea * createForm.pricePerMeter;
  const createBphtb = Math.max(0, (createTotalAgreed - 80000000) * 0.05);
  const createPph = createTotalAgreed * 0.025;
  const createCutFillCost = (createForm.cutFillVolumeM3 || 0) * (createForm.cutFillCostPerM3 || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Modul Pembebasan Lahan & Legalitas Notaris (PPAT)
            </span>
            <span className="text-xs text-slate-500 font-medium">SAK EP Persediaan · PP 24/1997 · Cut & Fill Pematangan</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Pembebasan Lahan, Cut & Fill, Notaris & Audit Forensik</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Sistem terintegrasi input data bidang tanah, audit perubahan luas fisik BPN, toleransi variansi (&le;1%), estimasi pematangan lahan (Cut & Fill),
            pembiayaan honorarium PPAT, hingga verifikasi dokumen alas hak asli dan sertifikasi SHGB PT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openAuditModal()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-600" />
            Audit Forensik Seluruh Lahan
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Input Data Lahan Baru
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Operasi Berhasil</div>
            <div>{successMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Peringatan Operasi</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('INVENTARISASI')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'INVENTARISASI'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>1. Register Lahan & Notaris ({parcels.length} Bidang)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CUT_FILL')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'CUT_FILL'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Shovel className="w-4 h-4" />
          <span>2. Pematangan Tanah (Cut & Fill) & Integrasi RAB</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSubTab === 'CUT_FILL' ? 'bg-amber-800/80 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {parcels.reduce((s, p) => s + (p.cutFillVolumeM3 || 0), 0).toLocaleString('id-ID')} m³
          </span>
        </button>
      </div>

      {activeSubTab === 'INVENTARISASI' && (
        <>
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Luas Lahan Fisik (BPN)</div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            {totalSurveyedArea.toLocaleString('id-ID')} m²
          </div>
          <div className="text-xs text-slate-500 mt-2 flex justify-between">
            <span>Dokumen: {totalDocArea.toLocaleString('id-ID')} m²</span>
            <span className={`font-semibold ${totalSurveyedArea - totalDocArea > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              Deviasi: {totalSurveyedArea - totalDocArea > 0 ? `+${totalSurveyedArea - totalDocArea}` : totalSurveyedArea - totalDocArea} m²
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Kesepakatan Tanah</div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            {formatRupiah(totalAgreed)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex justify-between">
            <span>Terbayar:</span>
            <span className="font-bold text-emerald-600">{formatRupiah(totalPaid)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sisa Utang Tanah / Pemilik</div>
          <div className="mt-2 text-xl font-bold text-amber-600">
            {formatRupiah(totalRemaining)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Status Toleransi:</span>
            {holdCount > 0 ? (
              <span className="font-bold text-rose-600">{holdCount} Bidang HOLD</span>
            ) : (
              <span className="font-bold text-emerald-600">Semua Lolos</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Biaya Cut & Fill & Notaris</div>
          <div className="mt-2 text-xl font-bold text-indigo-700">
            {formatRupiah(totalCutFillCost + totalNotaryFee)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex justify-between">
            <span>Pematangan: {formatRupiah(totalCutFillCost)}</span>
            <span>PPAT: {formatRupiah(totalNotaryFee)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode bidang, pemilik, alas hak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tolerance Filter */}
          <select
            value={toleranceFilter}
            onChange={(e) => setToleranceFilter(e.target.value as any)}
            className="text-xs p-1.5 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="ALL">Semua Toleransi</option>
            <option value="LOLOS">Hanya Lolos (&le;1%)</option>
            <option value="HOLD_SELISIH_LUAS">Hanya HOLD (&gt;1%)</option>
          </select>

          {/* Dispute Filter */}
          <select
            value={disputeFilter}
            onChange={(e) => setDisputeFilter(e.target.value)}
            className="text-xs p-1.5 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="ALL">Semua Status Legal</option>
            <option value="AMAN_CLEAR_AND_CLEAN">Aman Clear & Clean</option>
            <option value="KLAIM_AHLI_WARIS">Klaim Ahli Waris</option>
            <option value="TUMPANG_TINDIH_BATAS">Tumpang Tindih Batas</option>
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs p-1.5 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="ALL">Semua Tahapan Akta</option>
            <option value="DOKUMEN_AWAL">1. Dokumen Awal</option>
            <option value="PPJB_NOTARIIL">2. PPJB Notaris</option>
            <option value="VALIDASI_PAJAK">3. Validasi Pajak</option>
            <option value="AJB_SELESAI">4. AJB Selesai</option>
            <option value="PROSES_BALIK_NAMA_BPN">5. Balik Nama BPN</option>
            <option value="SHGB_TERBIT_ATAS_NAMA_PT">6. SHGB Terbit PT</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Register Inventarisasi Tanah, Topografi & Kepemilikan Legal
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredParcels.length} dari {parcels.length} bidang tanah terdaftar
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
            {parcels.length} Total Bidang
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Kode & Lokasi</th>
                <th className="px-4 py-3">Pemilik & Legalitas</th>
                <th className="px-4 py-3 text-right">Luas Dok vs Fisik</th>
                <th className="px-4 py-3">Toleransi Ukur</th>
                <th className="px-4 py-3">Topografi & Cut/Fill</th>
                <th className="px-4 py-3">Tahapan Akta / SHGB</th>
                <th className="px-4 py-3">Verifikasi Dokumen</th>
                <th className="px-4 py-3 text-right">Nilai / Sisa</th>
                <th className="px-4 py-3 text-center">Aksi Manajemen Lahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data bidang tanah yang sesuai dengan kriteria pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredParcels.map((parcel) => {
                  const stage = getStageLabel(parcel.conveyanceStatus);
                  const dispute = getDisputeBadge(parcel.legalDisputeStatus);
                  const verifiedDocsCount = parcel.documentChecklist.filter((d) => d.isVerified).length;
                  const totalDocsCount = parcel.documentChecklist.length;

                  return (
                    <tr key={parcel.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Kode & Lokasi */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {parcel.parcelCode}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[180px]">
                          {parcel.locationDescription}
                        </div>
                        {parcel.gpsCoordinates && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Compass className="w-3 h-3 text-slate-400" />
                            {parcel.gpsCoordinates}
                          </div>
                        )}
                      </td>

                      {/* Pemilik & Legalitas */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{parcel.sellerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {parcel.originalTitleType}: {parcel.originalTitleNo}
                        </div>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border inline-block mt-0.5 ${dispute.color}`}>
                          {dispute.label}
                        </span>
                      </td>

                      {/* Luas */}
                      <td className="px-4 py-3 text-right font-mono">
                        <div className="font-bold text-slate-900">{parcel.surveyedArea} m²</div>
                        <div className="text-[10px] text-slate-500">Dokumen: {parcel.documentArea} m²</div>
                      </td>

                      {/* Toleransi */}
                      <td className="px-4 py-3">
                        {parcel.areaToleranceStatus === 'HOLD_SELISIH_LUAS' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> HOLD ({parcel.areaVariancePercentage > 0 ? `+${parcel.areaVariancePercentage}%` : `${parcel.areaVariancePercentage}%`})
                            </span>
                            <div className="text-[10px] text-amber-700 leading-tight">
                              Selisih &gt; 1% ({parcel.areaVariance} m²)
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LOLOS ({parcel.areaVariancePercentage}%)
                          </span>
                        )}
                      </td>

                      {/* Topografi & Cut Fill */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Shovel className="w-3 h-3 text-amber-600" />
                          <span>{parcel.topographyType || 'DATAR'}</span>
                        </div>
                        <button
                          onClick={() => openCutFillModal(parcel)}
                          className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline text-left block mt-0.5 cursor-pointer"
                          title="Buka kalkulator biaya operasional Cut & Fill"
                        >
                          {parcel.cutFillVolumeM3
                            ? `${parcel.cutFillVolumeM3.toLocaleString('id-ID')} m³ (${formatRupiah(parcel.cutFillTotalCost || 0)})`
                            : 'Hitung Cut & Fill'}
                        </button>
                        {parcel.cutFillDetail?.integrateToRAB && (
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5 font-bold">
                            RAB: {parcel.cutFillDetail.targetCostCode}
                          </span>
                        )}
                      </td>

                      {/* Tahapan Akta */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${stage.color}`}>
                          {stage.label}
                        </span>
                        {parcel.newCertificateNo && (
                          <div className="text-[10px] text-slate-600 mt-1 font-mono truncate max-w-[150px]" title={parcel.newCertificateNo}>
                            {parcel.newCertificateNo}
                          </div>
                        )}
                      </td>

                      {/* Verifikasi Dokumen */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openChecklistModal(parcel)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold border border-slate-200 transition-all cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{verifiedDocsCount}/{totalDocsCount} Dokumen</span>
                        </button>
                      </td>

                      {/* Nilai / Sisa */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900 font-mono">{formatRupiah(parcel.agreedTotalAmount)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Sisa: <span className={parcel.remainingAmount > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-bold'}>{formatRupiah(parcel.remainingAmount)}</span>
                        </div>
                      </td>

                      {/* Aksi Operasional & Manajemen Lahan */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {/* Detail Button */}
                          <button
                            onClick={() => openDetailModal(parcel)}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-300 transition-all cursor-pointer"
                            title="Lihat rincian lengkap bidang lahan"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(parcel)}
                            className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold border border-blue-200 transition-all cursor-pointer"
                            title="Edit data teknis & finansial bidang lahan"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Cut & Fill Calculator Button */}
                          <button
                            onClick={() => openCutFillModal(parcel)}
                            className="p-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200 transition-all cursor-pointer flex items-center gap-1"
                            title="Kalkulasi Biaya Operasional Cut & Fill (Alat Berat, Solar, Jasa & RAB)"
                          >
                            <Shovel className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden xl:inline">Cut & Fill</span>
                          </button>

                          {/* Audit Trail Button */}
                          <button
                            onClick={() => openAuditModal(parcel)}
                            className="p-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-semibold border border-purple-200 transition-all cursor-pointer"
                            title="Lihat riwayat jejak audit forensik bidang ini"
                          >
                            <History className="w-3.5 h-3.5 text-purple-600" />
                          </button>

                          {/* Bayar Termin Tanah */}
                          {parcel.remainingAmount > 0 && (
                            <button
                              onClick={() => openPayLandModal(parcel)}
                              className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                              title="Bayar termin pembelian tanah"
                            >
                              Bayar
                            </button>
                          )}

                          {/* Bayar Notaris */}
                          {!parcel.notaryFeePaid ? (
                            <button
                              onClick={() => openPayNotaryModal(parcel)}
                              className="px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                              title="Bayar honorarium notaris PPAT"
                            >
                              Notaris
                            </button>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                              PPAT Lunas
                            </span>
                          )}

                          {/* Update Tahapan */}
                          <button
                            onClick={() => openStageModal(parcel)}
                            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-300 transition-all cursor-pointer"
                            title="Perbarui tahapan akta / sertifikat BPN"
                          >
                            Tahapan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* SUB-TAB 2: PEMATANGAN TANAH (CUT & FILL) & INTEGRASI RAB */}
      {activeSubTab === 'CUT_FILL' && (
        <div className="space-y-6">
          {/* Earthworks KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Total Volume Galian (Cut)</span>
                <Shovel className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {parcels
                  .reduce(
                    (sum, p) =>
                      sum +
                      (p.cutFillDetail?.cutVolumeM3 ||
                        (p.cutFillVolumeM3 ? Math.round(p.cutFillVolumeM3 * 0.58) : 0)),
                    0
                  )
                  .toLocaleString('id-ID')}{' '}
                m³
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Pengerukan kontur bukit & perataan elevasi tanah
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Total Volume Urugan (Fill)</span>
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {parcels
                  .reduce(
                    (sum, p) =>
                      sum +
                      (p.cutFillDetail?.fillVolumeM3 ||
                        (p.cutFillVolumeM3 ? Math.round(p.cutFillVolumeM3 * 0.42) : 0)),
                    0
                  )
                  .toLocaleString('id-ID')}{' '}
                m³
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Penimbunan lembah/kavling & pemadatan lapis tanah
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Neraca Tanah (Net Balance)</span>
                <ArrowUpDown className="w-4 h-4 text-blue-600" />
              </div>
              {(() => {
                const totalCut = parcels.reduce(
                  (sum, p) =>
                    sum +
                    (p.cutFillDetail?.cutVolumeM3 ||
                      (p.cutFillVolumeM3 ? Math.round(p.cutFillVolumeM3 * 0.58) : 0)),
                  0
                );
                const totalFill = parcels.reduce(
                  (sum, p) =>
                    sum +
                    (p.cutFillDetail?.fillVolumeM3 ||
                      (p.cutFillVolumeM3 ? Math.round(p.cutFillVolumeM3 * 0.42) : 0)),
                  0
                );
                const net = totalCut - totalFill;
                return (
                  <>
                    <div
                      className={`mt-2 text-2xl font-bold font-mono ${
                        net >= 0 ? 'text-blue-700' : 'text-amber-700'
                      }`}
                    >
                      {net >= 0 ? `+${net.toLocaleString('id-ID')}` : net.toLocaleString('id-ID')} m³
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-medium">
                      {net >= 0
                        ? 'Surplus: Perlu Hauling Buang Keluar (Disposal)'
                        : 'Defisit: Butuh Tanah Urug Pilihan (Borrow Pit)'}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Total Estimasi Biaya Cut & Fill</span>
                <Calculator className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-indigo-700">
                {formatRupiah(parcels.reduce((sum, p) => sum + (p.cutFillTotalCost || 0), 0))}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex justify-between">
                <span>Rata-rata/m³:</span>
                <span className="font-bold text-slate-700">
                  {formatRupiah(
                    Math.round(
                      parcels.reduce((sum, p) => sum + (p.cutFillTotalCost || 0), 0) /
                        Math.max(1, parcels.reduce((sum, p) => sum + (p.cutFillVolumeM3 || 0), 0))
                    )
                  )}{' '}
                  / m³
                </span>
              </div>
            </div>
          </div>

          {/* RAB Proyek Earthworks Connection Card */}
          {(() => {
            const rabItem =
              budgetItems.find((b) => b.costCode === 'EW-HAUL-02' || b.category === 'EARTHWORKS') ||
              budgetItems[1];
            const pagu = rabItem?.paguDisetujui || 660000000;
            const realisasi = rabItem?.realisasi || 0;
            const komitmen = rabItem?.komitmenTerbuka || 0;
            const sisa = Math.max(0, pagu - realisasi - komitmen);
            const usagePct = Math.min(100, Math.round(((realisasi + komitmen) / pagu) * 100));

            return (
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                          Koneksi Anggaran RAB Proyek
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                          Cost Code: {rabItem?.costCode || 'EW-HAUL-02'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {rabItem?.description || 'Pekerjaan Cut and Fill & Hauling Tanah Galian'}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Pagu Disetujui RAB:</div>
                    <div className="text-xl font-extrabold text-amber-400 font-mono">
                      {formatRupiah(pagu)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-2">
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                    <div className="text-[11px] text-slate-400">Realisasi Terserap</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                      {formatRupiah(realisasi)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Sudah dibukukan / SPK sah</div>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                    <div className="text-[11px] text-slate-400">Komitmen Terbuka</div>
                    <div className="text-sm font-bold text-amber-400 font-mono mt-1">
                      {formatRupiah(komitmen)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">PO sewa alat & kontrak berjalan</div>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                    <div className="text-[11px] text-slate-400">Sisa Pagu Tersedia</div>
                    <div className="text-sm font-bold text-white font-mono mt-1">
                      {formatRupiah(sisa)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Batas aman pencairan</div>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-center">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Penyerapan:</span>
                      <span className="font-bold text-amber-400">{usagePct}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePct > 90 ? 'bg-rose-500' : usagePct > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Kategori Kondisi Tanah Standar Lapangan */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Klasifikasi Mekanika Tanah & Koefisien Beban Alat Berat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    🟢 Tanah Biasa / Sedang
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    1.00x
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Lempung berpasir atau humus normal tanpa batuan keras. Produktivitas excavator standar 50-60 m³/jam.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-800 flex items-center gap-1">
                    🪨 Tanah Keras / Berbatu
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-800">
                    1.50x
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Lapisan padas/batu cadas. Memerlukan hidrolik breaker dan durasi jam alat berat +50% lebih tinggi.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-cyan-800 flex items-center gap-1">
                    💧 Tanah Lembek / Rawa
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    1.35x
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Kadar air tinggi & lumpur. Memerlukan pompa dewatering alkon 3 inch, hauling lumpur buang, dan alas mat logging.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    🚛 Tanah Urug Pilihan (Sirtu)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    1.15x
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Material urugan borrow pit luar proyek. Pemadatan vibro roller bertahap per ketebalan hamparan 30 cm.
                </p>
              </div>
            </div>
          </div>

          {/* Earthworks Parcels Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shovel className="w-5 h-5 text-amber-600" />
                  Rincian Pematangan Tanah (Cut & Fill) Seluruh Bidang Lahan
                </h3>
                <p className="text-xs text-slate-500">
                  Input volume galian/urugan, kalkulasi biaya operasional terperinci (alat berat, BBM, alat penunjang, upah SDM) dan integrasi ke RAB Proyek
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                {parcels.length} Bidang Tanah
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Kode Bidang & Lokasi</th>
                    <th className="px-4 py-3">Luas & Topografi</th>
                    <th className="px-4 py-3">Kategori Tanah</th>
                    <th className="px-4 py-3 text-right">Galian (Cut)</th>
                    <th className="px-4 py-3 text-right">Urugan (Fill)</th>
                    <th className="px-4 py-3 text-right">Netto & Status</th>
                    <th className="px-4 py-3 text-right">Total Biaya Operasional</th>
                    <th className="px-4 py-3 text-right">Biaya / m³</th>
                    <th className="px-4 py-3">Integrasi RAB Proyek</th>
                    <th className="px-4 py-3 text-center">Aksi Kalkulator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parcels.map((parcel) => {
                    const cut =
                      parcel.cutFillDetail?.cutVolumeM3 ||
                      (parcel.cutFillVolumeM3 ? Math.round(parcel.cutFillVolumeM3 * 0.58) : 0);
                    const fill =
                      parcel.cutFillDetail?.fillVolumeM3 ||
                      (parcel.cutFillVolumeM3 ? Math.round(parcel.cutFillVolumeM3 * 0.42) : 0);
                    const net = cut - fill;
                    const cat: SoilCategory =
                      parcel.cutFillDetail?.soilCategory ||
                      (parcel.topographyType === 'LEMBAH_RAWA'
                        ? 'TANAH_LEMBEK_RAWA'
                        : parcel.topographyType === 'PERBUKITAN'
                        ? 'TANAH_KERAS_BERBATU'
                        : 'TANAH_BIASA');
                    const catInfo = getSoilCategoryLabel(cat);
                    const totalCost = parcel.cutFillTotalCost || 0;
                    const costPerM3 =
                      parcel.cutFillCostPerM3 ||
                      (cut + fill > 0 ? Math.round(totalCost / (cut + fill)) : 0);
                    const isIntegrated = parcel.cutFillDetail?.integrateToRAB;

                    return (
                      <tr key={parcel.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{parcel.parcelCode}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[160px]">
                            {parcel.sellerName} · {parcel.locationDescription}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          <div className="font-semibold text-slate-900">{parcel.surveyedArea} m²</div>
                          <span className="text-[10px] text-slate-500 font-sans">{parcel.topographyType || 'DATAR'}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${catInfo.badge}`}>
                            {catInfo.title}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                          {cut.toLocaleString('id-ID')} m³
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                          {fill.toLocaleString('id-ID')} m³
                        </td>

                        <td className="px-4 py-3 text-right font-mono">
                          <div className={`font-bold ${net >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                            {net >= 0 ? `+${net.toLocaleString('id-ID')}` : net.toLocaleString('id-ID')} m³
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {net >= 0 ? 'Surplus Buang' : 'Defisit Urug'}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(totalCost)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-slate-600 text-[11px]">
                          {formatRupiah(costPerM3)}/m³
                        </td>

                        <td className="px-4 py-3">
                          {isIntegrated ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {parcel.cutFillDetail?.targetCostCode}
                              </span>
                              <div className="text-[9px] text-slate-500">
                                {parcel.cutFillDetail?.allocationType === 'REALISASI' ? 'Realisasi Langsung' : 'Komitmen Terbuka'}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                              Belum Ditautkan
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openCutFillModal(parcel)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer mx-auto"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Hitung Cut & Fill</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: INPUT DATA LAHAN BARU (CREATE MODAL) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Input Data Bidang Lahan Baru</h3>
                  <p className="text-xs text-slate-500">Pendaftaran alas hak, toleransi ukur, Cut & Fill, dan estimasi pajak</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLandParcel} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-xs">
              {/* Section 1: Identitas & Lokasi */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-emerald-800">
                  1. Identitas Kepemilikan & Alas Hak Asal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kode Bidang Tanah:</label>
                    <input
                      type="text"
                      required
                      value={createForm.parcelCode}
                      onChange={(e) => setCreateForm({ ...createForm, parcelCode: e.target.value })}
                      placeholder="Contoh: BIDANG-015"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Pemilik Asal:</label>
                    <input
                      type="text"
                      required
                      value={createForm.sellerName}
                      onChange={(e) => setCreateForm({ ...createForm, sellerName: e.target.value })}
                      placeholder="Nama lengkap sesuai KTP"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK KTP Pemilik:</label>
                    <input
                      type="text"
                      required
                      value={createForm.sellerIdCard}
                      onChange={(e) => setCreateForm({ ...createForm, sellerIdCard: e.target.value })}
                      placeholder="16 digit NIK KTP"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Telepon / HP:</label>
                    <input
                      type="text"
                      value={createForm.sellerPhone}
                      onChange={(e) => setCreateForm({ ...createForm, sellerPhone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Alas Hak Asal:</label>
                    <select
                      value={createForm.originalTitleType}
                      onChange={(e) => setCreateForm({ ...createForm, originalTitleType: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="SHM">SHM (Sertifikat Hak Milik)</option>
                      <option value="HGB">HGB (Hak Guna Bangunan)</option>
                      <option value="GIRIK">Girik Adat</option>
                      <option value="LETTER_C">Letter C Kelurahan</option>
                      <option value="AJB_LAMA">AJB Notaris Lama</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Surat Alas Hak:</label>
                    <input
                      type="text"
                      value={createForm.originalTitleNo}
                      onChange={(e) => setCreateForm({ ...createForm, originalTitleNo: e.target.value })}
                      placeholder="Nomor SHM / Girik Persil"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi Lokasi Kavling:</label>
                    <input
                      type="text"
                      value={createForm.locationDescription}
                      onChange={(e) => setCreateForm({ ...createForm, locationDescription: e.target.value })}
                      placeholder="Blok / RT / RW / Ciri lokasi patok fisik"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pengukuran & Toleransi Ukur */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-emerald-800">
                  2. Pengukuran Luas & Toleransi Variansi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Luas Dokumen (m²):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={createForm.documentArea}
                      onChange={(e) => setCreateForm({ ...createForm, documentArea: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Luas Ukur Fisik BPN (m²):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={createForm.surveyedArea}
                      onChange={(e) => setCreateForm({ ...createForm, surveyedArea: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Harga per Meter (Rp):</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={createForm.pricePerMeter}
                      onChange={(e) => setCreateForm({ ...createForm, pricePerMeter: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Surveyor / Petugas BPN:</label>
                    <input
                      type="text"
                      value={createForm.surveyorName}
                      onChange={(e) => setCreateForm({ ...createForm, surveyorName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Real-time Tolerance Alert */}
                <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between ${
                  createToleranceStatus === 'HOLD_SELISIH_LUAS' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {createToleranceStatus === 'HOLD_SELISIH_LUAS' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <div>
                      <strong>Status Toleransi Ukur: {createToleranceStatus}</strong>
                      <div className="text-[11px]">
                        Selisih: {createVariance > 0 ? `+${createVariance}` : createVariance} m² ({createVariancePct.toFixed(2)}%)
                        {createToleranceStatus === 'HOLD_SELISIH_LUAS' && ' — Melebihi batas wajar 1%, pelunasan akan di-HOLD sampai revisi batas.'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Nilai Kesepakatan:</div>
                    <div className="font-bold text-slate-900">{formatRupiah(createTotalAgreed)}</div>
                  </div>
                </div>
              </div>

              {/* Section 3: Cut & Fill & Patok Batas */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-emerald-800">
                  3. Pematangan Lahan (Cut & Fill) & Batas Patok
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Topografi Kontur:</label>
                    <select
                      value={createForm.topographyType}
                      onChange={(e) => setCreateForm({ ...createForm, topographyType: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="DATAR">Datar (Minimal Cut/Fill)</option>
                      <option value="BERKONTUR">Berkontur Miring</option>
                      <option value="LEMBAH_RAWA">Lembah / Rawa (Perlu Urugan)</option>
                      <option value="PERBUKITAN">Perbukitan (Perlu Cut Banyak)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Volume Cut/Fill (m³):</label>
                    <input
                      type="number"
                      value={createForm.cutFillVolumeM3}
                      onChange={(e) => setCreateForm({ ...createForm, cutFillVolumeM3: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Biaya per m³ (Rp):</label>
                    <input
                      type="number"
                      value={createForm.cutFillCostPerM3}
                      onChange={(e) => setCreateForm({ ...createForm, cutFillCostPerM3: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Pematangan:</label>
                    <div className="p-2 bg-slate-100 rounded-lg font-bold font-mono text-slate-800">
                      {formatRupiah(createCutFillCost)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Titik Koordinat GPS:</label>
                    <input
                      type="text"
                      value={createForm.gpsCoordinates}
                      onChange={(e) => setCreateForm({ ...createForm, gpsCoordinates: e.target.value })}
                      placeholder="-6.48xxx, 106.84xxx"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Batas Utara:</label>
                    <input
                      type="text"
                      value={createForm.northBoundary}
                      onChange={(e) => setCreateForm({ ...createForm, northBoundary: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Batas Selatan:</label>
                    <input
                      type="text"
                      value={createForm.southBoundary}
                      onChange={(e) => setCreateForm({ ...createForm, southBoundary: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Sengketa:</label>
                    <select
                      value={createForm.legalDisputeStatus}
                      onChange={(e) => setCreateForm({ ...createForm, legalDisputeStatus: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="AMAN_CLEAR_AND_CLEAN">Aman Clear & Clean</option>
                      <option value="KLAIM_AHLI_WARIS">Klaim Ahli Waris</option>
                      <option value="TUMPANG_TINDIH_BATAS">Tumpang Tindih Batas</option>
                      <option value="MEDIASI_DESA">Mediasi Desa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Notaris & Pajak */}
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-emerald-800">
                  4. Notaris PPAT & Estimasi Kewajiban Pajak
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Notaris & PPAT:</label>
                    <input
                      type="text"
                      value={createForm.notaryName}
                      onChange={(e) => setCreateForm({ ...createForm, notaryName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kantor Notaris:</label>
                    <input
                      type="text"
                      value={createForm.notaryOffice}
                      onChange={(e) => setCreateForm({ ...createForm, notaryOffice: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Honorarium Notaris (Rp):</label>
                    <input
                      type="number"
                      value={createForm.notaryFee}
                      onChange={(e) => setCreateForm({ ...createForm, notaryFee: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700">
                  <div>Estimasi BPHTB Pembeli (5% di atas 80jt): <strong className="text-slate-900">{formatRupiah(createBphtb)}</strong></div>
                  <div>Estimasi PPh Final Penjual (2.5%): <strong className="text-slate-900">{formatRupiah(createPph)}</strong></div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  Simpan & Daftarkan Bidang Lahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DATA BIDANG LAHAN (EDIT MODAL DENGAN REASON AUDIT) */}
      {isEditModalOpen && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Data Lahan — {selectedParcel.parcelCode}
                  </h3>
                  <p className="text-xs text-slate-500">Perubahan data teknis, finansial, dan pematangan lahan</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLandParcel} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Kepatuhan Jejak Audit Forensik
                </div>
                <div className="text-[11px] mt-0.5">
                  Setiap perubahan data fisik, batas, dan nilai lahan akan dicatat permanen dalam tabel jejak audit dengan identitas Anda ({currentUser.name} - {currentUser.role}).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Pemilik:</label>
                  <input
                    type="text"
                    value={editForm.sellerName || ''}
                    onChange={(e) => setEditForm({ ...editForm, sellerName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK KTP Pemilik:</label>
                  <input
                    type="text"
                    value={editForm.sellerIdCard || ''}
                    onChange={(e) => setEditForm({ ...editForm, sellerIdCard: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Luas Dokumen (m²):</label>
                  <input
                    type="number"
                    value={editForm.documentArea || 0}
                    onChange={(e) => setEditForm({ ...editForm, documentArea: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Luas Hasil Ukur Fisik BPN (m²):</label>
                  <input
                    type="number"
                    value={editForm.surveyedArea || 0}
                    onChange={(e) => setEditForm({ ...editForm, surveyedArea: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Harga per Meter (Rp):</label>
                  <input
                    type="number"
                    value={editForm.pricePerMeter || 0}
                    onChange={(e) => setEditForm({ ...editForm, pricePerMeter: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Sengketa UUPA:</label>
                  <select
                    value={editForm.legalDisputeStatus || 'AMAN_CLEAR_AND_CLEAN'}
                    onChange={(e) => setEditForm({ ...editForm, legalDisputeStatus: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="AMAN_CLEAR_AND_CLEAN">Aman Clear & Clean</option>
                    <option value="KLAIM_AHLI_WARIS">Klaim Ahli Waris</option>
                    <option value="TUMPANG_TINDIH_BATAS">Tumpang Tindih Batas</option>
                    <option value="MEDIASI_DESA">Mediasi Desa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Topografi Kontur:</label>
                  <select
                    value={editForm.topographyType || 'DATAR'}
                    onChange={(e) => setEditForm({ ...editForm, topographyType: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="DATAR">Datar</option>
                    <option value="BERKONTUR">Berkontur</option>
                    <option value="LEMBAH_RAWA">Lembah Rawa</option>
                    <option value="PERBUKITAN">Perbukitan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Progres Cut & Fill (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.cutFillProgressPercentage || 0}
                    onChange={(e) => setEditForm({ ...editForm, cutFillProgressPercentage: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alasan Perubahan Data (Wajib untuk Kepatuhan Audit):
                </label>
                <textarea
                  required
                  rows={2}
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="Contoh: Koreksi luas berdasarkan Berita Acara Ukur Ulang BPN No. 41/BA/2026 disaksikan tetangga batas."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={auditReason.trim().length < 8}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  Simpan Perubahan & Catat Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT FORENSIK JEJAK MUTASI LAHAN (AUDIT MODAL) */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Jejak Audit Forensik — {selectedParcel ? selectedParcel.parcelCode : 'Seluruh Portofolio Lahan'}
                  </h3>
                  <p className="text-xs text-slate-500">Log historis append-only aktivitas input, edit, pembayaran, dan verifikasi dokumen</p>
                </div>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1 text-xs">
              {auditEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Belum ada catatan log audit khusus untuk bidang tanah ini.
                </div>
              ) : (
                auditEvents.map((ev) => (
                  <div key={ev.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800'
                            : ev.action === 'DISBURSE'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {ev.action}
                        </span>
                        <span className="font-bold text-slate-900">{ev.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {ev.timestamp.slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Aktor: <strong className="text-slate-700">{ev.actorName}</strong> ({ev.actorRole})</span>
                      <span>Target: <strong className="text-slate-700">{ev.entityType} ({ev.entityId})</strong></span>
                    </div>

                    {ev.diffSummary && (
                      <div className="p-2 bg-white rounded border border-slate-200 text-slate-700 font-mono text-[11px] mt-1">
                        {ev.diffSummary}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Tutup Jejak Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAIL LENGKAP BIDANG LAHAN (DETAIL MODAL) */}
      {isDetailModalOpen && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kartu Inventaris Lahan — {selectedParcel.parcelCode}
                  </h3>
                  <p className="text-xs text-slate-500">Pemilik: {selectedParcel.sellerName} · NIK: {selectedParcel.sellerIdCard}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-xs">
              {/* Toleransi & Luas */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Luas Dokumen:</span>
                  <div className="font-bold text-slate-900">{selectedParcel.documentArea} m²</div>
                </div>
                <div>
                  <span className="text-slate-500">Luas Hasil Ukur BPN:</span>
                  <div className="font-bold text-slate-900">{selectedParcel.surveyedArea} m²</div>
                </div>
                <div>
                  <span className="text-slate-500">Selisih & Variansi:</span>
                  <div className={`font-bold ${selectedParcel.areaVariancePercentage > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {selectedParcel.areaVariance} m² ({selectedParcel.areaVariancePercentage}%) — {selectedParcel.areaToleranceStatus}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Alas Hak Asal:</span>
                  <div className="font-bold text-slate-900">{selectedParcel.originalTitleType} ({selectedParcel.originalTitleNo})</div>
                </div>
              </div>

              {/* Batas Patok & GPS */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-emerald-800">
                  <Compass className="w-4 h-4" /> Batas Patok Fisik & Koordinat GPS BPN
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div>Batas Utara: <strong>{selectedParcel.northBoundary || '-'}</strong></div>
                  <div>Batas Selatan: <strong>{selectedParcel.southBoundary || '-'}</strong></div>
                  <div>Batas Timur: <strong>{selectedParcel.eastBoundary || '-'}</strong></div>
                  <div>Batas Barat: <strong>{selectedParcel.westBoundary || '-'}</strong></div>
                  <div className="col-span-2 text-slate-600 font-mono">
                    Koordinat GPS: {selectedParcel.gpsCoordinates || '-'} · Surveyor: {selectedParcel.surveyorName || '-'} ({selectedParcel.surveyDate || '-'})
                  </div>
                </div>
              </div>

              {/* Cut & Fill */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-emerald-800">
                  <Shovel className="w-4 h-4" /> Pematangan Lahan & Cut/Fill
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
                  <div>Kontur: <strong>{selectedParcel.topographyType || 'DATAR'}</strong></div>
                  <div>Volume: <strong>{selectedParcel.cutFillVolumeM3 ? `${selectedParcel.cutFillVolumeM3.toLocaleString('id-ID')} m³` : '-'}</strong></div>
                  <div>Biaya Cut/Fill: <strong>{formatRupiah(selectedParcel.cutFillTotalCost || 0)}</strong></div>
                  <div className="col-span-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progres Pematangan:</span>
                      <span>{selectedParcel.cutFillProgressPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${selectedParcel.cutFillProgressPercentage || 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Keuangan & Pajak */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-emerald-800">
                  <DollarSign className="w-4 h-4" /> Rincian Finansial & Notaris
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nilai Kesepakatan Lahan:</span>
                    <strong className="text-slate-900">{formatRupiah(selectedParcel.agreedTotalAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Realisasi Terbayar:</span>
                    <strong className="text-emerald-600">{formatRupiah(selectedParcel.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sisa Kewajiban:</span>
                    <strong className="text-amber-700">{formatRupiah(selectedParcel.remainingAmount)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-600">Honorarium PPAT ({selectedParcel.notaryName}):</span>
                    <strong className={selectedParcel.notaryFeePaid ? 'text-emerald-700' : 'text-slate-900'}>
                      {formatRupiah(selectedParcel.notaryFee)} ({selectedParcel.notaryFeePaid ? 'Lunas' : 'Belum Dibayar'})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">BPHTB Pembeli 5%:</span>
                    <strong>{formatRupiah(selectedParcel.bphtbAmount)} ({selectedParcel.bphtbPaid ? 'Lunas' : 'Belum'})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">PPh Final Penjual 2.5%:</span>
                    <strong>{formatRupiah(selectedParcel.pphPenjualAmount)} ({selectedParcel.pphPenjualPaid ? 'Lunas' : 'Belum'})</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Tutup Kartu Lahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: CHECKLIST VERIFIKASI BUKTI DOKUMEN LEGALITAS */}
      {isChecklistModalOpen && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Checklist Dokumen Legalitas — {selectedParcel.parcelCode}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pemilik: {selectedParcel.sellerName} · Alas Hak: {selectedParcel.originalTitleType} ({selectedParcel.originalTitleNo})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChecklistModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <strong>Status Kelengkapan: </strong>
                  <span className="font-semibold uppercase">{selectedParcel.overallVerificationStatus}</span>
                  <div className="text-[11px] text-blue-700">
                    {selectedParcel.documentChecklist.filter((d) => d.isVerified).length} dari{' '}
                    {selectedParcel.documentChecklist.length} item bukti fisik terverifikasi oleh tim Legal / Notaris.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">PPAT Pendamping:</div>
                  <div className="font-bold text-slate-800">{selectedParcel.notaryName}</div>
                </div>
              </div>

              <div className="space-y-2">
                {selectedParcel.documentChecklist.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      doc.isVerified
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={doc.isVerified}
                      onChange={() => handleToggleDoc(doc.id, doc.isVerified, doc.documentName)}
                      className="mt-1 w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      id={`chk_${doc.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`chk_${doc.id}`}
                          className={`text-xs font-bold cursor-pointer ${
                            doc.isVerified ? 'text-emerald-950 font-bold' : 'text-slate-900'
                          }`}
                        >
                          {doc.documentName}
                        </label>
                        {doc.isVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                            Belum Ada / Kurang
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {doc.verifiedBy && (
                          <span>
                            Diverifikasi oleh: <strong className="text-slate-700">{doc.verifiedBy}</strong>
                          </span>
                        )}
                        {doc.verifiedAt && <span>Tanggal: {doc.verifiedAt}</span>}
                        {doc.notes && (
                          <span className="text-slate-600 italic">
                            Catatan: {doc.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsChecklistModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: BAYAR TERMIN TANAH */}
      {isPayLandModalOpen && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pembayaran Termin — {selectedParcel.parcelCode}
                </h3>
                <p className="text-xs text-slate-500">Penerima: {selectedParcel.sellerName}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteLandPayment} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Kesepakatan:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(selectedParcel.agreedTotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sudah Terbayar:</span>
                  <span className="font-bold text-emerald-600">{formatRupiah(selectedParcel.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                  <span className="text-slate-700">Sisa Kewajiban:</span>
                  <span className="text-amber-700">{formatRupiah(selectedParcel.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rekening Bank Sumber Dana:
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} ({formatRupiah(b.bookBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Pembayaran (Rp):
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedParcel.remainingAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Transaksi / Bukti Transfer:
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Contoh: Transfer termin 2 disaksikan Notaris Farida"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPayLandModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Bayar & Posting Jurnal Lahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: BAYAR NOTARIS */}
      {isPayNotaryModalOpen && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pembayaran Honorarium Notaris / PPAT
                </h3>
                <p className="text-xs text-slate-500">PPAT: {selectedParcel.notaryName}</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1 text-indigo-950">
                <div className="flex justify-between">
                  <span>Kantor Notaris:</span>
                  <span className="font-semibold">{selectedParcel.notaryOffice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Honorarium Akta PPJB/AJB:</span>
                  <span className="font-bold text-indigo-900">{formatRupiah(selectedParcel.notaryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-indigo-200 pt-1 text-[11px] text-indigo-800">
                  <span>Perlakuan Akuntansi SAK EP:</span>
                  <span className="italic">Dikapitalisasi ke Aset Lahan (WIP 1160)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rekening Bank Pembayar:
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} ({formatRupiah(b.bookBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPayNotaryModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteNotaryPayment}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Lunasi Honorarium Notaris
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: UPDATE TAHAPAN KEPEMILIKAN */}
      {isStageModalOpen && selectedParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Update Tahapan Legalitas & Sertifikat BPN
                </h3>
                <p className="text-xs text-slate-500">Bidang: {selectedParcel.parcelCode}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteStageUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahapan Akta / Kepemilikan:
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as LandParcel['conveyanceStatus'])}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="DOKUMEN_AWAL">1. DOKUMEN_AWAL (Alas Hak Awal)</option>
                  <option value="PPJB_NOTARIIL">2. PPJB_NOTARIIL (Pengikatan Jual Beli Notaris)</option>
                  <option value="VALIDASI_PAJAK">3. VALIDASI_PAJAK (Validasi SSPD BPHTB & PPh)</option>
                  <option value="AJB_SELESAI">4. AJB_SELESAI (Penandatanganan Akta Jual Beli PPAT)</option>
                  <option value="PROSES_BALIK_NAMA_BPN">5. PROSES_BALIK_NAMA_BPN (Pendaftaran Balik Nama ke BPN)</option>
                  <option value="SHGB_TERBIT_ATAS_NAMA_PT">6. SHGB_TERBIT_ATAS_NAMA_PT (Sertifikat Induk HGB Terbit an. PT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Sertifikat Baru / Nomor Berkas Pendaftaran BPN:
                </label>
                <input
                  type="text"
                  value={newCertificateNo}
                  onChange={(e) => setNewCertificateNo(e.target.value)}
                  placeholder="Contoh: SHGB No. 105/PT CGM atau Berkas BPN No. 2026/9110"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Simpan Tahapan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KALKULASI PEMATANGAN TANAH (CUT & FILL) & ALAT BERAT & RAB */}
      {isCutFillModalOpen && selectedCutFillParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Shovel className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                      Kalkulator Pematangan Tanah (Cut & Fill)
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {selectedCutFillParcel.parcelCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pemilik: {selectedCutFillParcel.sellerName} · Luas Fisik: {selectedCutFillParcel.surveyedArea} m² · Topografi: {selectedCutFillParcel.topographyType || 'DATAR'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCutFillModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSaveCutFillCalculation} className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 text-xs">
              {/* BAGIAN 1: PARAMETER VOLUME TANAH & KATEGORI MEKANIKA */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                    <Activity className="w-4 h-4 text-amber-600" />
                    1. Parameter Volume Galian / Urugan & Kategori Tanah
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = calculateAutoPreset(
                        cutFillForm.cutVolumeM3,
                        cutFillForm.fillVolumeM3,
                        cutFillForm.soilCategory
                      );
                      setCutFillForm((prev) => ({
                        ...prev,
                        ...presets,
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs self-start"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Rekalkulasi Estimasi Jam Kerja Otomatis</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Volume Galian (Cut) [m³]:
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={cutFillForm.cutVolumeM3}
                      onChange={(e) =>
                        setCutFillForm({ ...cutFillForm, cutVolumeM3: Number(e.target.value) || 0 })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-500">Pengerukan punggung bukit / elevasi tinggi</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Volume Urugan (Fill) [m³]:
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={cutFillForm.fillVolumeM3}
                      onChange={(e) =>
                        setCutFillForm({ ...cutFillForm, fillVolumeM3: Number(e.target.value) || 0 })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-500">Penimbunan cekungan & pemadatan per lapis</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Neraca Volume Bersih (Net Balance):
                    </label>
                    <div className="p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-xs flex items-center justify-between">
                      <span className={cfNetBalance >= 0 ? 'text-blue-700' : 'text-amber-700'}>
                        {cfNetBalance >= 0 ? `+${cfNetBalance.toLocaleString('id-ID')} m³` : `${cfNetBalance.toLocaleString('id-ID')} m³`}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold bg-slate-100 text-slate-700">
                        {cfNetBalance >= 0 ? 'Surplus Buang' : 'Defisit Urug'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Total Volume Olah: {cfTotalGrossVolume.toLocaleString('id-ID')} m³
                    </span>
                  </div>
                </div>

                {/* Pemilihan Kategori Tanah */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Kategori & Kondisi Karakteristik Tanah di Lapangan:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      {
                        cat: 'TANAH_BIASA' as SoilCategory,
                        label: 'Tanah Biasa / Sedang',
                        badge: 'Koef. 1.00x',
                        desc: 'Lempung/pasir gembur normal',
                      },
                      {
                        cat: 'TANAH_KERAS_BERBATU' as SoilCategory,
                        label: 'Tanah Keras / Cadas',
                        badge: 'Koef. 1.50x',
                        desc: 'Batu padas butuh breaker ekstra',
                      },
                      {
                        cat: 'TANAH_LEMBEK_RAWA' as SoilCategory,
                        label: 'Tanah Rawa / Lumpur',
                        badge: 'Koef. 1.35x',
                        desc: 'Muka air tinggi & pompa dewatering',
                      },
                      {
                        cat: 'TANAH_URUG_PILIHAN' as SoilCategory,
                        label: 'Tanah Urug Sirtu',
                        badge: 'Koef. 1.15x',
                        desc: 'Borrow pit luar & pemadatan lapis',
                      },
                    ].map((item) => (
                      <div
                        key={item.cat}
                        onClick={() => {
                          const presets = calculateAutoPreset(
                            cutFillForm.cutVolumeM3,
                            cutFillForm.fillVolumeM3,
                            item.cat
                          );
                          setCutFillForm((prev) => ({
                            ...prev,
                            soilCategory: item.cat,
                            ...presets,
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          cutFillForm.soilCategory === item.cat
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-slate-800 text-[11px]">{item.label}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: 4 PILAR BIAYA OPERASIONAL PEMATANGAN TANAH */}
              <div className="space-y-4">
                {/* PILAR A: SEWA ALAT BERAT */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-slate-800">
                      <Truck className="w-4 h-4 text-amber-600" />
                      Pilar A: Sewa Alat Berat (Excavator, Dozer, Vibro & Dump Truck)
                    </h5>
                    <span className="font-bold text-amber-800 text-xs font-mono">
                      Subtotal: {formatRupiah(cfTotalEquipmentCost)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Excavator PC200 */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">1. Excavator PC200 (Bucket 0.9 m³)</span>
                        <span className="text-[10px] text-slate-500 font-mono">Galian & Pemuatan</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block">Jam Kerja (Jam):</label>
                          <input
                            type="number"
                            min={0}
                            value={cutFillForm.excavatorHours}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, excavatorHours: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Tarif Sewa (Rp/Jam):</label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={cutFillForm.excavatorRate}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, excavatorRate: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-800 font-mono">
                        Biaya: {formatRupiah(cfExcavatorCost)}
                      </div>
                    </div>

                    {/* Bulldozer D65P */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">2. Bulldozer D65P (Blade Perata)</span>
                        <span className="text-[10px] text-slate-500 font-mono">Pengupasan & Dozing</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block">Jam Kerja (Jam):</label>
                          <input
                            type="number"
                            min={0}
                            value={cutFillForm.bulldozerHours}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, bulldozerHours: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Tarif Sewa (Rp/Jam):</label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={cutFillForm.bulldozerRate}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, bulldozerRate: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-800 font-mono">
                        Biaya: {formatRupiah(cfBulldozerCost)}
                      </div>
                    </div>

                    {/* Vibro Roller 10T */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">3. Vibro Roller Compactor 10 Ton</span>
                        <span className="text-[10px] text-slate-500 font-mono">Pemadatan Subgrade</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block">Jam Kerja (Jam):</label>
                          <input
                            type="number"
                            min={0}
                            value={cutFillForm.vibroHours}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, vibroHours: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Tarif Sewa (Rp/Jam):</label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={cutFillForm.vibroRate}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, vibroRate: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-800 font-mono">
                        Biaya: {formatRupiah(cfVibroCost)}
                      </div>
                    </div>

                    {/* Dump Truck Hauling */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">4. Dump Truck Indeks 8 m³</span>
                        <span className="text-[10px] text-slate-500 font-mono">Hauling & Disposal</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block">Jumlah Ritase (Rit):</label>
                          <input
                            type="number"
                            min={0}
                            value={cutFillForm.dumpTruckTrips}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, dumpTruckTrips: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Tarif per Rit (Rp/Rit):</label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={cutFillForm.dumpTruckRate}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, dumpTruckRate: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-800 font-mono">
                        Biaya: {formatRupiah(cfDumpTruckCost)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PILAR B: BBM SOLAR INDUSTRI NON-SUBSIDI */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-slate-800">
                      <Fuel className="w-4 h-4 text-rose-600" />
                      Pilar B: Bahan Bakar Minyak (Solar Industri Non-Subsidi)
                    </h5>
                    <span className="font-bold text-rose-800 text-xs font-mono">
                      Subtotal: {formatRupiah(cfTotalFuelCost)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Estimasi Konsumsi Solar Industri (Liter):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={cutFillForm.fuelLiters}
                        onChange={(e) =>
                          setCutFillForm({ ...cutFillForm, fuelLiters: Number(e.target.value) || 0 })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500">
                        Rata-rata 14 - 16 liter/jam kerja unit alat berat
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Harga Solar Industri Non-Subsidi (Rp/Liter):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={cutFillForm.fuelPricePerLiter}
                        onChange={(e) =>
                          setCutFillForm({ ...cutFillForm, fuelPricePerLiter: Number(e.target.value) || 0 })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white"
                      />
                      <span className="text-[10px] text-slate-500">
                        Standar Pertamina Dex / Solar B35 industri perkantoran
                      </span>
                    </div>
                  </div>
                </div>

                {/* PILAR C: SEWA ALAT LAIN & PENUNJANG */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-slate-800">
                      <Wrench className="w-4 h-4 text-indigo-600" />
                      Pilar C: Sewa Alat Lain & Perlengkapan Penunjang Lapangan
                    </h5>
                    <span className="font-bold text-indigo-800 text-xs font-mono">
                      Subtotal: {formatRupiah(cfTotalSupportCost)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Theodolite / Waterpass */}
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div className="font-bold text-slate-800 text-[11px]">Waterpass & Total Station</div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari Sewa:</label>
                        <input
                          type="number"
                          min={0}
                          value={cutFillForm.theodoliteDays}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, theodoliteDays: Number(e.target.value) || 0 })
                          }
                          className="w-full p-1 border border-slate-300 rounded font-mono text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif/Hari (Rp):</label>
                        <input
                          type="number"
                          min={0}
                          value={cutFillForm.theodoliteRate}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, theodoliteRate: Number(e.target.value) || 0 })
                          }
                          className="w-full p-1 border border-slate-300 rounded font-mono text-xs bg-white"
                        />
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-700 font-mono">
                        {formatRupiah(cfTheodoliteCost)}
                      </div>
                    </div>

                    {/* Mud Pump Dewatering */}
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div className="font-bold text-slate-800 text-[11px]">Pompa Celup Dewatering</div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari Sewa:</label>
                        <input
                          type="number"
                          min={0}
                          value={cutFillForm.mudPumpDays}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, mudPumpDays: Number(e.target.value) || 0 })
                          }
                          className="w-full p-1 border border-slate-300 rounded font-mono text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif/Hari (Rp):</label>
                        <input
                          type="number"
                          min={0}
                          value={cutFillForm.mudPumpRate}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, mudPumpRate: Number(e.target.value) || 0 })
                          }
                          className="w-full p-1 border border-slate-300 rounded font-mono text-xs bg-white"
                        />
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-700 font-mono">
                        {formatRupiah(cfMudPumpCost)}
                      </div>
                    </div>

                    {/* Plate Compactor Stamper */}
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div className="font-bold text-slate-800 text-[11px]">Plate Compactor (Stamper)</div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hari Sewa:</label>
                        <input
                          type="number"
                          min={0}
                          value={cutFillForm.plateCompactorDays}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, plateCompactorDays: Number(e.target.value) || 0 })
                          }
                          className="w-full p-1 border border-slate-300 rounded font-mono text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tarif/Hari (Rp):</label>
                        <input
                          type="number"
                          min={0}
                          value={cutFillForm.plateCompactorRate}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, plateCompactorRate: Number(e.target.value) || 0 })
                          }
                          className="w-full p-1 border border-slate-300 rounded font-mono text-xs bg-white"
                        />
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-700 font-mono">
                        {formatRupiah(cfPlateCompactorCost)}
                      </div>
                    </div>

                    {/* Patok & Material Bantu */}
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div className="font-bold text-slate-800 text-[11px]">Patok Kayu & Bouwplank</div>
                      <div className="pt-2">
                        <label className="text-[10px] text-slate-500 block">Total Biaya Material Bantu (Rp):</label>
                        <input
                          type="number"
                          min={0}
                          step={100000}
                          value={cutFillForm.supportSuppliesCost}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, supportSuppliesCost: Number(e.target.value) || 0 })
                          }
                          className="w-full p-1 border border-slate-300 rounded font-mono text-xs bg-white"
                        />
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-700 font-mono pt-3">
                        {formatRupiah(cutFillForm.supportSuppliesCost)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PILAR D: JASA & UPAH SDM (OPERATOR, MANDOR, SURVEYOR) */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-slate-800">
                      <HardHat className="w-4 h-4 text-emerald-600" />
                      Pilar D: Jasa & Upah SDM Lapangan (Operator Alat, Uang Makan, Mandor & Surveyor)
                    </h5>
                    <span className="font-bold text-emerald-800 text-xs font-mono">
                      Subtotal: {formatRupiah(cfTotalLaborCost)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Operator Alat Berat */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="font-bold text-slate-800">Operator Alat & Uang Makan</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block">Jumlah Orang:</label>
                          <input
                            type="number"
                            min={1}
                            value={cutFillForm.operatorCount}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, operatorCount: Number(e.target.value) || 1 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Hari Kerja:</label>
                          <input
                            type="number"
                            min={1}
                            value={cutFillForm.operatorDays}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, operatorDays: Number(e.target.value) || 1 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Upah/Hari (Rp):</label>
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            value={cutFillForm.operatorDailyWage}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, operatorDailyWage: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Uang Makan/Hari (Rp):</label>
                          <input
                            type="number"
                            min={0}
                            step={5000}
                            value={cutFillForm.operatorFoodDaily}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, operatorFoodDaily: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-800 font-mono">
                        Total Upah Operator: {formatRupiah(cfOperatorCost)}
                      </div>
                    </div>

                    {/* Mandor Lapangan Tanah */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="font-bold text-slate-800">Mandor Lapangan Tanah & Galian</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block">Hari Kerja:</label>
                          <input
                            type="number"
                            min={1}
                            value={cutFillForm.mandorDays}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, mandorDays: Number(e.target.value) || 1 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Upah Harian (Rp):</label>
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            value={cutFillForm.mandorDailyWage}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, mandorDailyWage: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">Pengawasan ritase truck & elevasi galian</p>
                      <div className="text-right text-[11px] font-bold text-slate-800 font-mono pt-1">
                        Total Upah Mandor: {formatRupiah(cfMandorCost)}
                      </div>
                    </div>

                    {/* Surveyor Topografi & Helper */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="font-bold text-slate-800">Surveyor Topografi & Helper</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block">Hari Kerja:</label>
                          <input
                            type="number"
                            min={1}
                            value={cutFillForm.surveyorDays}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, surveyorDays: Number(e.target.value) || 1 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block">Upah Tim/Hari (Rp):</label>
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            value={cutFillForm.surveyorDailyWage}
                            onChange={(e) =>
                              setCutFillForm({ ...cutFillForm, surveyorDailyWage: Number(e.target.value) || 0 })
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">Pengukuran kontur pra & pasca galian</p>
                      <div className="text-right text-[11px] font-bold text-slate-800 font-mono pt-1">
                        Total Upah Surveyor: {formatRupiah(cfSurveyorCost)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 3: RINGKASAN GRAND TOTAL & BIAYA EFEKTIF PER M3 */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs flex-1">
                    <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-[10px] text-slate-500 block">Alat Berat:</span>
                      <span className="font-bold text-slate-800 font-mono">{formatRupiah(cfTotalEquipmentCost)}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-[10px] text-slate-500 block">BBM Solar:</span>
                      <span className="font-bold text-slate-800 font-mono">{formatRupiah(cfTotalFuelCost)}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-[10px] text-slate-500 block">Alat Penunjang:</span>
                      <span className="font-bold text-slate-800 font-mono">{formatRupiah(cfTotalSupportCost)}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-[10px] text-slate-500 block">Jasa & Upah SDM:</span>
                      <span className="font-bold text-slate-800 font-mono">{formatRupiah(cfTotalLaborCost)}</span>
                    </div>
                  </div>

                  <div className="text-right md:pl-4 border-t md:border-t-0 md:border-l border-amber-200 pt-2 md:pt-0">
                    <div className="text-[11px] font-bold text-slate-600">Grand Total Biaya Pematangan:</div>
                    <div className="text-2xl font-extrabold text-amber-900 font-mono">
                      {formatRupiah(cfGrandTotalCost)}
                    </div>
                    <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                      Biaya Efektif: {formatRupiah(cfEffectiveCostPerM3)} / m³
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 4: INTEGRASI KE KOMPONEN REALISASI RAB PROYEK */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="integrateRAB"
                      checked={cutFillForm.integrateToRAB}
                      onChange={(e) =>
                        setCutFillForm({ ...cutFillForm, integrateToRAB: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <label htmlFor="integrateRAB" className="font-bold text-xs text-white cursor-pointer">
                      Integrasikan Nilai Biaya Operasional ini ke Komponen RAB Proyek
                    </label>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-400 text-slate-950">
                    RAB Integration
                  </span>
                </div>

                {cutFillForm.integrateToRAB && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">
                          Pilih Item Anggaran Proyek (RAB):
                        </label>
                        <select
                          value={cutFillForm.targetBudgetItemId}
                          onChange={(e) =>
                            setCutFillForm({ ...cutFillForm, targetBudgetItemId: e.target.value })
                          }
                          className="w-full p-2 border border-slate-700 rounded-lg text-xs bg-slate-800 text-white font-mono"
                        >
                          {budgetItems.map((b) => (
                            <option key={b.id} value={b.id}>
                              [{b.costCode}] {b.description} ({formatRupiah(b.paguDisetujui)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">
                          Alokasikan Pembebanan Biaya Sebagai:
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <label className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-700 bg-slate-800/80 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name="allocType"
                              value="REALISASI"
                              checked={cutFillForm.allocationType === 'REALISASI'}
                              onChange={() =>
                                setCutFillForm({ ...cutFillForm, allocationType: 'REALISASI' })
                              }
                              className="text-emerald-500"
                            />
                            <span>Realisasi Langsung</span>
                          </label>

                          <label className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-700 bg-slate-800/80 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name="allocType"
                              value="KOMITMEN"
                              checked={cutFillForm.allocationType === 'KOMITMEN'}
                              onChange={() =>
                                setCutFillForm({ ...cutFillForm, allocationType: 'KOMITMEN' })
                              }
                              className="text-amber-500"
                            />
                            <span>Komitmen Terbuka</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Preview Simulasi Dampak RAB */}
                    {(() => {
                      const selectedItem =
                        budgetItems.find((b) => b.id === cutFillForm.targetBudgetItemId) ||
                        budgetItems[1] ||
                        budgetItems[0];
                      if (!selectedItem) return null;

                      const curReal = selectedItem.realisasi;
                      const curKom = selectedItem.komitmenTerbuka;
                      const newReal =
                        cutFillForm.allocationType === 'REALISASI'
                          ? curReal + cfGrandTotalCost
                          : curReal;
                      const newKom =
                        cutFillForm.allocationType === 'KOMITMEN'
                          ? curKom + cfGrandTotalCost
                          : curKom;
                      const newSisa = Math.max(0, selectedItem.paguDisetujui - newReal - newKom);

                      return (
                        <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px]">
                          <div className="flex justify-between items-center text-slate-300 mb-1">
                            <span>Simulasi Dampak pada [{selectedItem.costCode}]:</span>
                            <span className="font-mono text-amber-400 font-bold">
                              Pagu: {formatRupiah(selectedItem.paguDisetujui)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Realisasi Baru:</span>
                              <span className="text-emerald-400 font-bold">{formatRupiah(newReal)}</span>
                              <span className="text-[9px] text-slate-500 block">
                                (+{formatRupiah(cutFillForm.allocationType === 'REALISASI' ? cfGrandTotalCost : 0)})
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Komitmen Baru:</span>
                              <span className="text-amber-400 font-bold">{formatRupiah(newKom)}</span>
                              <span className="text-[9px] text-slate-500 block">
                                (+{formatRupiah(cutFillForm.allocationType === 'KOMITMEN' ? cfGrandTotalCost : 0)})
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Sisa Anggaran:</span>
                              <span className="text-white font-bold">{formatRupiah(newSisa)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Catatan Teknis / Notula Operasional */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Teknis / Notula Lapangan Pematangan:
                </label>
                <textarea
                  rows={2}
                  value={cutFillForm.notes}
                  onChange={(e) => setCutFillForm({ ...cutFillForm, notes: e.target.value })}
                  placeholder="Contoh: Kondisi bukit terjal bagian utara, perataan bertahap, pembuangan sisa tanah ke area kavling timur"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCutFillModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Kalkulasi & Sinkronisasi RAB</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
