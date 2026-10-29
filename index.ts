/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 
  | 'DIREKSI' 
  | 'PROJECT_MANAGER' 
  | 'FINANCE' 
  | 'ACCOUNTANT' 
  | 'CASHIER' 
  | 'PROCUREMENT' 
  | 'SURVEYOR' 
  | 'AUDITOR' 
  | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  entityId: string;
}

export interface LegalEntity {
  id: string;
  code: string;
  name: string;
  taxId: string; // NPWP
  address: string;
  phone: string;
  email: string;
  functionalCurrency: 'IDR';
}

export interface BankAccount {
  id: string;
  entityId: string;
  bankName: string;
  accountNumber: string; // e.g. BCA 883-019-2819
  accountHolder: string;
  type: 'OPERASIONAL' | 'PROYEK' | 'PENAMPUNGAN' | 'KAS_KECIL';
  custodian: string; // Siapa pemegang fisik kas / pengelola rekening
  bookBalance: number; // Disimpan dalam integer Rupiah
  statementBalance: number; // Saldo rekening koran terakhir
  restrictedAmount: number; // Dana terikat (jaminan, retensi, pajak)
  lastReconciledAt: string;
}

export interface BankMovement {
  id: string;
  bankAccountId: string;
  date: string;
  referenceNo: string;
  description: string;
  type: 'IN' | 'OUT';
  amount: number;
  category: 'OPERASIONAL' | 'PENCAIRAN_PPB' | 'PELUNASAN_PIUTANG' | 'TRANSFER_INTERNAL' | 'TALANGAN' | 'PAJAK';
  relatedParty?: string;
  isReconciled: boolean;
  journalEntryId?: string;
}

export interface Project {
  id: string;
  entityId: string;
  code: string; // PRJ-2026-001
  name: string;
  location: string;
  totalUnits: number;
  startDate: string;
  targetCompletionDate: string;
  managerId: string;
  managerName: string;
  status: 'PERENCANAAN' | 'PEMBEBASAN_LAHAN' | 'EARTHWORKS' | 'KONSTRUKSI' | 'SERAH_TERIMA' | 'SELESAI';
  totalPaguRAB: number;
  totalRealisasi: number;
  totalKomitmen: number;
  progressPercentage: number;
}

export interface WBSItem {
  id: string;
  projectId: string;
  code: string; // 01.01
  name: string;
  weightPercentage: number;
  progressPercentage: number;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  wbsId: string;
  costCode: string; // e.g. EW-CUT-01, MAT-SEMEN-01, UPAH-TUKANG-01
  description: string;
  category: 'LAHAN' | 'EARTHWORKS' | 'MATERIAL' | 'UPAH' | 'SUBKONTRAKTOR' | 'ALAT_BERAT' | 'OVERHEAD';
  quantity: number;
  unit: string; // m3, m2, sak, trip, oh
  unitPrice: number; // Rupiah integer
  paguDisetujui: number; // qty * unitPrice
  realisasi: number; // Terposting dari transaksi sah
  komitmenTerbuka: number; // Dari PO / Kontrak yang belum dibayar
  // Formula: sisaTersedia = paguDisetujui - realisasi - komitmenTerbuka
}

export type PPBStatus = 
  | 'DRAFT' 
  | 'MENUNGGU_REVIEW_PM' 
  | 'MENUNGGU_APPROVAL_FINANCE' 
  | 'MENUNGGU_APPROVAL_DIREKSI' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'PAID';

export interface PaymentRequestItem {
  id: string;
  budgetItemId: string;
  costCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  evidenceDocName?: string;
}

export interface PaymentRequest {
  id: string;
  documentNo: string; // PPB-PT01-202611-000123
  projectId: string;
  projectName: string;
  requestedBy: string; // UserId
  requestedByName: string;
  requestDate: string;
  dueDate: string;
  payeeName: string;
  payeeBank: string;
  payeeAccountNo: string;
  purpose: string;
  items: PaymentRequestItem[];
  totalAmount: number;
  status: PPBStatus;
  approvalChain: {
    role: UserRole;
    approverName?: string;
    approvedAt?: string;
    decision: 'PENDING' | 'APPROVED' | 'REJECTED';
    notes?: string;
  }[];
  paidAt?: string;
  paymentBankAccountId?: string;
  journalEntryId?: string;
  isEmergencyException?: boolean;
  exceptionReason?: string;
}

export interface Party {
  id: string;
  entityId: string;
  type: 'VENDOR' | 'CUSTOMER' | 'LAND_OWNER' | 'PARTNER';
  name: string;
  npwp: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  // Khusus Konstruksi: PP 9/2022
  constructionQualification?: 'KECIL' | 'MENENGAH' | 'BESAR' | 'TIDAK_BERSERTIFIKAT';
  totalOutstandingReceivable: number;
  totalOutstandingPayable: number;
}

export interface PropertyUnit {
  id: string;
  projectId: string;
  block: string;
  unitNo: string;
  type: string; // Tipe 36/72, Tipe 45/90
  landArea: number; // m2
  buildingArea: number; // m2
  price: number;
  status: 'TERSEDIA' | 'BOOKING' | 'KONTRAK' | 'LUNAS' | 'SERAH_TERIMA';
  customerId?: string;
  customerName?: string;
  bookingDate?: string;
  totalPaid: number;
}

export interface CustomerInvoice {
  id: string;
  documentNo: string; // INV-SALES-2026-001
  projectId: string;
  unitId: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  termDescription: string; // Booking Fee, DP 1, DP 2, KPR / Termin 1
  grossAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'BELUM_DIBAYAR' | 'DIBAYAR_SEBAGIAN' | 'LUNAS' | 'JATUH_TEMPO';
}

export interface VendorInvoice {
  id: string;
  documentNo: string; // INV-VEND-2026-0042
  poNumber: string;
  vendorId: string;
  vendorName: string;
  projectId: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  grossAmount: number;
  taxDeduction: number; // PPh 23 atau PPh Final Konstruksi
  netPayableAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'BELUM_DIBAYAR' | 'DIBAYAR_SEBAGIAN' | 'LUNAS' | 'JATUH_TEMPO';
}

export interface FixedAsset {
  id: string;
  entityId: string;
  assetCode: string; // AST-ALAT-001
  name: string;
  category: 'ALAT_BERAT' | 'KENDARAAN_OPERASIONAL' | 'PERALATAN_KANTOR' | 'BANGUNAN_PERMANEN';
  acquisitionDate: string;
  readyForUseDate: string;
  acquisitionCost: number; // Harga perolehan
  salvageValue: number; // Nilai residu
  usefulLifeMonths: number; // Umur ekonomis komersial (bulan)
  // Fiskal PMK 72/2023
  fiscalGroup: 'KELOMPOK_1' | 'KELOMPOK_2' | 'KELOMPOK_3' | 'KELOMPOK_4' | 'BANGUNAN';
  fiscalDepreciationRate: number; // misal 25%, 12.5%, 6.25%, 5%
  accumulatedDepreciation: number;
  bookValue: number;
  location: string;
  custodian: string;
}

export interface TaxRegisterItem {
  id: string;
  entityId: string;
  taxType: 'PPN' | 'PPH_FINAL_KONSTRUKSI' | 'PPH_21' | 'PPH_23' | 'PPH_FINAL_PROPERTI';
  period: string; // YYYY-MM
  sourceDocumentNo: string;
  dpp: number; // Dasar Pengenaan Pajak
  taxRatePercentage: number;
  taxAmount: number;
  taxRuleReference: string; // e.g. "PP 9/2022 Ps. 3", "PMK 11/2025"
  withholdingSlipNo?: string; // Nomor Bukti Potong
  ntpn?: string; // Nomor Transaksi Penerimaan Negara
  status: 'DISIAPKAN' | 'DIVERIFIKASI' | 'DIBAYAR' | 'DILAPORKAN_CORETAX';
  paymentDueDate: string;
  reportingDueDate: string;
}

export interface AccountCOA {
  id: string;
  code: string; // e.g. 1111, 1120, 2110, 5100
  name: string;
  classification: 'AKTIVA_LANCAR' | 'AKTIVA_TETAP' | 'KEWAJIBAN_LANCAR' | 'KEWAJIBAN_JANGKA_PANJANG' | 'EKUITAS' | 'PENDAPATAN' | 'HPP_PROYEK' | 'BEBAN_OPERASIONAL';
  normalBalance: 'DEBIT' | 'KREDIT';
  balance: number;
}

export interface AccountingPeriod {
  id: string;
  periodCode: string; // e.g. "2026-10"
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: 'TERBUKA' | 'TERKUNCI';
  closedAt?: string;
  closedBy?: string;
  closingJournalId?: string;
  netIncomeClosed?: number;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
}

export type LandDocType =
  | 'KTP_KK_PEMILIK'
  | 'SURAT_PERSETUJUAN_AHLI_WARIS'
  | 'SERTIFIKAT_ASLI_GIRIK'
  | 'SPPT_PBB_LUNAS'
  | 'BERITA_ACARA_UKUR_BATAS'
  | 'AKTA_PPJB_NOTARIS'
  | 'BUKTI_BAYAR_BPHTB'
  | 'AKTA_JUAL_BELI_AJB'
  | 'SERTIFIKAT_HGB_PT';

export interface LandDocumentItem {
  id: string;
  documentType: LandDocType;
  documentName: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface LandParcel {
  id: string;
  projectId: string;
  parcelCode: string; // e.g. BIDANG-012
  sellerName: string; // Pemilik Asal
  sellerIdCard: string; // KTP
  sellerPhone: string;
  locationDescription: string;
  // Pengukuran & Toleransi
  documentArea: number; // m2 Luas tercantum di sertifikat/girik
  surveyedArea: number; // m2 Luas hasil ukur fisik BPN/surveyor
  areaVariance: number; // surveyedArea - documentArea
  areaVariancePercentage: number;
  areaToleranceStatus: 'LOLOS' | 'HOLD_SELISIH_LUAS';
  // Nilai Tanah & Termin Bayar
  pricePerMeter: number; // Rp/m2
  agreedTotalAmount: number; // Nilai kesepakatan
  paidAmount: number; // Yang sudah dibayar
  remainingAmount: number; // Sisa kewajiban
  paymentStatus: 'BELUM_DIBAYAR' | 'UANG_MUKA' | 'TERMIN_BERJALAN' | 'LUNAS';
  // Dokumen Alas Hak
  originalTitleType: 'SHM' | 'HGB' | 'GIRIK' | 'LETTER_C' | 'AJB_LAMA';
  originalTitleNo: string;
  // Notaris & PPAT
  notaryName: string;
  notaryOffice: string;
  notaryFee: number;
  notaryFeePaid: boolean;
  // Pajak & Biaya BPN
  bphtbAmount: number; // 5% BPHTB pembeli
  bphtbPaid: boolean;
  pphPenjualAmount: number; // 2.5% PPh final penjual
  pphPenjualPaid: boolean;
  bpnCheckingFee: number; // SKPT BPN
  bpnTransferFee: number; // Biaya balik nama PT
  // Status Akta & Kepemilikan
  conveyanceStatus:
    | 'DOKUMEN_AWAL'
    | 'PPJB_NOTARIIL'
    | 'VALIDASI_PAJAK'
    | 'AJB_SELESAI'
    | 'PROSES_BALIK_NAMA_BPN'
    | 'SHGB_TERBIT_ATAS_NAMA_PT';
  newCertificateNo?: string;
  documentChecklist: LandDocumentItem[];
  overallVerificationStatus: 'LENGKAP' | 'DALAM_PROSES' | 'DOKUMEN_KURANG' | 'SENGKETA';
  // Cut & Fill / Pematangan Lahan & Topografi
  topographyType?: 'DATAR' | 'BERKONTUR' | 'LEMBAH_RAWA' | 'PERBUKITAN';
  cutFillVolumeM3?: number; // m3 estimasi galian & urugan
  cutFillCostPerM3?: number; // Rp/m3 tarif pekerjaan alat berat
  cutFillTotalCost?: number; // Volume * Biaya per m3
  cutFillProgressPercentage?: number; // 0 - 100%
  cutFillDetail?: CutFillCalculationDetail;
  // Batas Patok & Koordinat GPS BPN
  gpsCoordinates?: string; // Titik GPS, misal: -6.48291, 106.84512
  northBoundary?: string; // Batas Utara
  southBoundary?: string; // Batas Selatan
  eastBoundary?: string; // Batas Timur
  westBoundary?: string; // Batas Barat
  // Legalitas & Surveyor
  surveyorName?: string;
  surveyDate?: string;
  legalDisputeStatus: 'AMAN_CLEAR_AND_CLEAN' | 'KLAIM_AHLI_WARIS' | 'TUMPANG_TINDIH_BATAS' | 'MEDIASI_DESA';
  // Audit Trail & Jejak Modifikasi
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type SoilCategory =
  | 'TANAH_BIASA'
  | 'TANAH_KERAS_BERBATU'
  | 'TANAH_LEMBEK_RAWA'
  | 'TANAH_URUG_PILIHAN';

export interface HeavyEquipmentItem {
  id: string;
  name: string; // e.g. 'Excavator PC200', 'Bulldozer D65', 'Vibro Roller 10 Ton', 'Dump Truck 8 m3'
  type: 'EXCAVATOR' | 'BULLDOZER' | 'VIBRO_ROLLER' | 'DUMP_TRUCK';
  quantity: number;
  hoursOrTrips: number;
  unitRate: number; // Rp / jam atau Rp / rit
  unitLabel: string; // 'jam' atau 'rit'
  subtotal: number;
}

export interface SupportToolItem {
  id: string;
  name: string; // e.g. 'Waterpass & Total Station', 'Pompa Celup Dewatering Lumpuk', 'Plate Compactor Stamper'
  quantity: number;
  days: number;
  dailyRate: number;
  subtotal: number;
}

export interface LaborRateItem {
  id: string;
  role: string; // 'Operator Alat Berat', 'Uang Makan & Lembur Operator', 'Mandor Pekerjaan Tanah', 'Surveyor Topografi & Helper'
  personCount: number;
  days: number;
  dailyWage: number;
  subtotal: number;
}

export interface CutFillCalculationDetail {
  id: string;
  parcelId: string;
  calculatedAt: string;
  calculatedBy: string;
  // Volume tanah
  cutVolumeM3: number; // Volume Galian (m3)
  fillVolumeM3: number; // Volume Urugan (m3)
  netBalanceM3: number; // cut - fill
  // Kondisi & Kategori Tanah
  soilCategory: SoilCategory;
  soilDifficultyMultiplier: number;
  notes?: string;
  // Rincian Biaya
  heavyEquipments: HeavyEquipmentItem[];
  totalEquipmentCost: number;
  // BBM Solar
  fuelLiters: number;
  fuelPricePerLiter: number;
  totalFuelCost: number;
  // Alat Lain & Penunjang
  supportTools: SupportToolItem[];
  totalSupportToolsCost: number;
  // Upah & Jasa
  labors: LaborRateItem[];
  totalLaborCost: number;
  // Total & Efektif
  grandTotalCost: number;
  effectiveCostPerM3: number;
  // Integrasi RAB
  integrateToRAB: boolean;
  targetBudgetItemId: string;
  targetCostCode: string;
  targetDescription: string;
  allocationType: 'REALISASI' | 'KOMITMEN';
  integratedAt?: string;
  integratedBy?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  projectId?: string;
}

export interface JournalEntry {
  id: string;
  entryNo: string; // JE-202611-00084
  date: string;
  postingDate: string;
  referenceType:
    | 'PENCAIRAN_PPB'
    | 'PELUNASAN_PIUTANG'
    | 'PEMBAYARAN_UTANG'
    | 'DEPRESIASI_ASET'
    | 'PENYESUAIAN'
    | 'REVERSAL'
    | 'TUTUP_BUKU'
    | 'PEMBELIAN_LAHAN'
    | 'BIAYA_NOTARIS';
  referenceNo: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  createdBy: string;
  postedBy?: string;
  reversalOfEntryId?: string;
}

export interface PrintSettings {
  companyName: string;
  legalEntityName: string;
  taxId: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  logoUrl?: string;
  primaryBankAccountId: string;
  authorizedSignerName: string;
  authorizedSignerTitle: string;
  financeApproverName: string;
  financeApproverTitle: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string; // ISO UTC
  actorName: string;
  actorRole: UserRole;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'APPROVE'
    | 'REJECT'
    | 'DISBURSE'
    | 'POST_GL'
    | 'REVERSE_GL'
    | 'RECONCILE'
    | 'DELETE_BLOCKED'
    | 'CLOSE_PERIOD'
    | 'REOPEN_PERIOD'
    | 'VERIFY_DOC';
  entityType: 'PPB' | 'JOURNAL' | 'BUDGET' | 'BANK' | 'INVOICE' | 'ASSET' | 'TAX' | 'PERIOD' | 'LAND' | 'NOTARY';
  entityId: string;
  description: string;
  diffSummary?: string;
}

export interface AcceptanceTestResult {
  id: string; // AT-01 to AT-18
  name: string;
  description: string;
  expectedResult: string;
  actualResult: string;
  status: 'VERIFIED' | 'FAILED' | 'RUNNING' | 'PENDING';
  executedAt?: string;
  evidenceLog?: string;
}

