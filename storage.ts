/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LegalEntity,
  BankAccount,
  BankMovement,
  Project,
  WBSItem,
  BudgetItem,
  PaymentRequest,
  Party,
  PropertyUnit,
  CustomerInvoice,
  VendorInvoice,
  FixedAsset,
  TaxRegisterItem,
  AccountCOA,
  JournalEntry,
  PrintSettings,
  AuditEvent,
  User,
  AccountingPeriod,
  LandParcel,
} from '../types';

const STORAGE_PREFIX = 'dev_akuntansi_';

// Initial Seed Data representing a true Indonesian Real Estate & Construction enterprise
export const DEFAULT_ENTITY: LegalEntity = {
  id: 'ent_cgm_01',
  code: 'PT-CGM',
  name: 'PT Cipta Graha Mandiri',
  taxId: '01.892.481.9-403.000',
  address: 'Jl. Raya Pemda No. 88, Cibinong, Kabupaten Bogor, Jawa Barat 16911',
  phone: '(021) 8792-4100',
  email: 'finance@ciptagrahamandiri.co.id',
  functionalCurrency: 'IDR',
};

export const DEFAULT_USERS: User[] = [
  { id: 'usr_dir', name: 'Ir. Hendrawan Santoso', email: 'hendrawan@ciptagrahamandiri.co.id', role: 'DIREKSI', entityId: DEFAULT_ENTITY.id },
  { id: 'usr_pm', name: 'Bambang Triyono, S.T.', email: 'bambang.pm@ciptagrahamandiri.co.id', role: 'PROJECT_MANAGER', entityId: DEFAULT_ENTITY.id },
  { id: 'usr_fin', name: 'Siti Rahmawati, S.E.', email: 'siti.finance@ciptagrahamandiri.co.id', role: 'FINANCE', entityId: DEFAULT_ENTITY.id },
  { id: 'usr_acc', name: 'Agus Priyanto, Ak., CA', email: 'agus.acc@ciptagrahamandiri.co.id', role: 'ACCOUNTANT', entityId: DEFAULT_ENTITY.id },
  { id: 'usr_cashier', name: 'Dewi Lestari', email: 'dewi.kasir@ciptagrahamandiri.co.id', role: 'CASHIER', entityId: DEFAULT_ENTITY.id },
  { id: 'usr_audit', name: 'Ferry Darmawan, CIA', email: 'ferry.audit@ciptagrahamandiri.co.id', role: 'AUDITOR', entityId: DEFAULT_ENTITY.id },
];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_bca_ops',
    entityId: DEFAULT_ENTITY.id,
    bankName: 'BCA KCP Cibinong',
    accountNumber: '883-019-2819',
    accountHolder: 'PT Cipta Graha Mandiri',
    type: 'OPERASIONAL',
    custodian: 'Siti Rahmawati (Head of Finance)',
    bookBalance: 1250000000, // Rp 1.250.000.000
    statementBalance: 1250000000,
    restrictedAmount: 180000000, // Dana cadangan retensi kontraktor
    lastReconciledAt: '2026-10-25',
  },
  {
    id: 'bank_mandiri_prj',
    entityId: DEFAULT_ENTITY.id,
    bankName: 'Bank Mandiri KC Bogor',
    accountNumber: '137-00-192837-1',
    accountHolder: 'PT Cipta Graha Mandiri - Proyek Harmoni',
    type: 'PROYEK',
    custodian: 'Bambang Triyono (Project Manager)',
    bookBalance: 840000000, // Rp 840.000.000
    statementBalance: 840000000,
    restrictedAmount: 250000000, // Dana terikat pembayaran termin tanah
    lastReconciledAt: '2026-10-25',
  },
  {
    id: 'bank_kas_kecil',
    entityId: DEFAULT_ENTITY.id,
    bankName: 'Brankas Kas Kecil Proyek',
    accountNumber: 'KAS-KECIL-PRJ-01',
    accountHolder: 'Kasir Lapangan',
    type: 'KAS_KECIL',
    custodian: 'Dewi Lestari (Kasir Proyek)',
    bookBalance: 25000000, // Rp 25.000.000
    statementBalance: 25000000,
    restrictedAmount: 0,
    lastReconciledAt: '2026-10-28',
  },
];

export const DEFAULT_PROJECT: Project = {
  id: 'prj_ghr_01',
  entityId: DEFAULT_ENTITY.id,
  code: 'PRJ-2026-001',
  name: 'Grand Harmoni Residence',
  location: 'Kawasan Cibinong Raya, Bogor',
  totalUnits: 150,
  startDate: '2026-01-10',
  targetCompletionDate: '2027-06-30',
  managerId: 'usr_pm',
  managerName: 'Bambang Triyono, S.T.',
  status: 'KONSTRUKSI',
  totalPaguRAB: 8900000000, // Rp 8.900.000.000
  totalRealisasi: 3120000000, // Rp 3.120.000.000
  totalKomitmen: 1450000000, // Rp 1.450.000.000
  progressPercentage: 42.5,
};

export const DEFAULT_WBS: WBSItem[] = [
  { id: 'wbs_01', projectId: DEFAULT_PROJECT.id, code: '01.00', name: 'Pembebasan Lahan & Pra-Konstruksi', weightPercentage: 25, progressPercentage: 85 },
  { id: 'wbs_02', projectId: DEFAULT_PROJECT.id, code: '02.00', name: 'Pekerjaan Tanah & Cut and Fill', weightPercentage: 15, progressPercentage: 60 },
  { id: 'wbs_03', projectId: DEFAULT_PROJECT.id, code: '03.00', name: 'Infrastruktur Jalan, Saluran & PJU', weightPercentage: 20, progressPercentage: 35 },
  { id: 'wbs_04', projectId: DEFAULT_PROJECT.id, code: '04.00', name: 'Struktur Bangunan Kavling Blok A-C', weightPercentage: 40, progressPercentage: 20 },
];

export const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  {
    id: 'bitem_01',
    projectId: DEFAULT_PROJECT.id,
    wbsId: 'wbs_01',
    costCode: 'LAND-ACQ-01',
    description: 'Pembebasan Lahan Bidang 12 s/d 18',
    category: 'LAHAN',
    quantity: 4500,
    unit: 'm2',
    unitPrice: 500000,
    paguDisetujui: 2250000000,
    realisasi: 1800000000,
    komitmenTerbuka: 450000000,
  },
  {
    id: 'bitem_02',
    projectId: DEFAULT_PROJECT.id,
    wbsId: 'wbs_02',
    costCode: 'EW-HAUL-02',
    description: 'Pekerjaan Cut and Fill & Hauling Tanah Galian',
    category: 'EARTHWORKS',
    quantity: 12000,
    unit: 'm3',
    unitPrice: 55000,
    paguDisetujui: 660000000,
    realisasi: 396000000,
    komitmenTerbuka: 165000000,
  },
  {
    id: 'bitem_03',
    projectId: DEFAULT_PROJECT.id,
    wbsId: 'wbs_03',
    costCode: 'INFRA-ROAD-01',
    description: 'Pekerjaan Paving Block Jalan Utama K-300',
    category: 'SUBKONTRAKTOR',
    quantity: 3200,
    unit: 'm2',
    unitPrice: 185000,
    paguDisetujui: 592000000,
    realisasi: 148000000,
    komitmenTerbuka: 296000000,
  },
  {
    id: 'bitem_04',
    projectId: DEFAULT_PROJECT.id,
    wbsId: 'wbs_04',
    costCode: 'MAT-SEMEN-01',
    description: 'Pengadaan Semen Portland Tiga Roda 50kg',
    category: 'MATERIAL',
    quantity: 6000,
    unit: 'sak',
    unitPrice: 68000,
    paguDisetujui: 408000000,
    realisasi: 204000000,
    komitmenTerbuka: 102000000,
  },
  {
    id: 'bitem_05',
    projectId: DEFAULT_PROJECT.id,
    wbsId: 'wbs_04',
    costCode: 'MAT-BESI-01',
    description: 'Pengadaan Besi Beton Ulir D13 SNI',
    category: 'MATERIAL',
    quantity: 1800,
    unit: 'btg',
    unitPrice: 125000,
    paguDisetujui: 225000000,
    realisasi: 125000000,
    komitmenTerbuka: 50000000,
  },
];

export const DEFAULT_COA: AccountCOA[] = [
  // 1. AKTIVA LANCAR
  { id: 'acc_1111', code: '1111', name: 'Kas & Rekening Bank', classification: 'AKTIVA_LANCAR', normalBalance: 'DEBIT', balance: 2115000000 },
  { id: 'acc_1120', code: '1120', name: 'Piutang Usaha Konsumen', classification: 'AKTIVA_LANCAR', normalBalance: 'DEBIT', balance: 450000000 },
  { id: 'acc_1130', code: '1130', name: 'Piutang Retensi Proyek', classification: 'AKTIVA_LANCAR', normalBalance: 'DEBIT', balance: 65000000 },
  { id: 'acc_1140', code: '1140', name: 'Uang Muka Vendor & Pemasok', classification: 'AKTIVA_LANCAR', normalBalance: 'DEBIT', balance: 120000000 },
  { id: 'acc_1150', code: '1150', name: 'Persediaan Material Gudang', classification: 'AKTIVA_LANCAR', normalBalance: 'DEBIT', balance: 185000000 },
  { id: 'acc_1160', code: '1160', name: 'Pekerjaan Dalam Pelaksanaan (WIP Konstruksi)', classification: 'AKTIVA_LANCAR', normalBalance: 'DEBIT', balance: 3120000000 },
  // 2. AKTIVA TETAP
  { id: 'acc_1210', code: '1210', name: 'Aset Tetap - Alat Berat & Kendaraan', classification: 'AKTIVA_TETAP', normalBalance: 'DEBIT', balance: 1450000000 },
  { id: 'acc_1220', code: '1220', name: 'Akumulasi Penyusutan Alat & Kendaraan', classification: 'AKTIVA_TETAP', normalBalance: 'KREDIT', balance: -245000000 },
  // 3. KEWAJIBAN LANCAR
  { id: 'acc_2110', code: '2110', name: 'Utang Usaha Pemasok & Vendor', classification: 'KEWAJIBAN_LANCAR', normalBalance: 'KREDIT', balance: 340000000 },
  { id: 'acc_2120', code: '2120', name: 'Utang Retensi Kontraktor (5%)', classification: 'KEWAJIBAN_LANCAR', normalBalance: 'KREDIT', balance: 180000000 },
  { id: 'acc_2130', code: '2130', name: 'Utang Pajak (PPN & PPh Final Konstruksi)', classification: 'KEWAJIBAN_LANCAR', normalBalance: 'KREDIT', balance: 145000000 },
  { id: 'acc_2140', code: '2140', name: 'Uang Muka Konsumen (Kewajiban Kontrak)', classification: 'KEWAJIBAN_LANCAR', normalBalance: 'KREDIT', balance: 750000000 },
  // 4. EKUITAS
  { id: 'acc_3100', code: '3100', name: 'Modal Saham Disetor', classification: 'EKUITAS', normalBalance: 'KREDIT', balance: 4500000000 },
  { id: 'acc_3200', code: '3200', name: 'Saldo Laba Ditahan', classification: 'EKUITAS', normalBalance: 'KREDIT', balance: 1345000000 },
  // 5. PENDAPATAN & BIAYA
  { id: 'acc_4100', code: '4100', name: 'Pendapatan Penjualan Properti', classification: 'PENDAPATAN', normalBalance: 'KREDIT', balance: 0 },
  { id: 'acc_5100', code: '5100', name: 'Beban Pokok Penjualan (HPP Proyek)', classification: 'HPP_PROYEK', normalBalance: 'DEBIT', balance: 0 },
  { id: 'acc_6100', code: '6100', name: 'Beban Operasional & Administrasi Kantor', classification: 'BEBAN_OPERASIONAL', normalBalance: 'DEBIT', balance: 0 },
];

export const DEFAULT_PARTIES: Party[] = [
  {
    id: 'pty_ven_01',
    entityId: DEFAULT_ENTITY.id,
    type: 'VENDOR',
    name: 'PT Mitra Beton Konstruksi',
    npwp: '02.482.193.8-013.000',
    phone: '0812-9988-7711',
    email: 'sales@mitrabeton.com',
    address: 'Jl. Industri Sentul No. 12, Sentul, Bogor',
    bankName: 'Bank Mandiri',
    bankAccountNo: '133-00-998822-1',
    bankAccountName: 'PT Mitra Beton Konstruksi',
    constructionQualification: 'MENENGAH',
    totalOutstandingReceivable: 0,
    totalOutstandingPayable: 185000000,
  },
  {
    id: 'pty_ven_02',
    entityId: DEFAULT_ENTITY.id,
    type: 'VENDOR',
    name: 'CV Sumber Tanah Mandiri',
    npwp: '71.293.882.1-404.000',
    phone: '0813-2211-4455',
    email: 'sumbertanah@gmail.com',
    address: 'Jl. Raya Cikaret No. 45, Cibinong',
    bankName: 'BCA',
    bankAccountNo: '883-112-9011',
    bankAccountName: 'CV Sumber Tanah Mandiri',
    constructionQualification: 'KECIL',
    totalOutstandingReceivable: 0,
    totalOutstandingPayable: 75000000,
  },
  {
    id: 'pty_cust_01',
    entityId: DEFAULT_ENTITY.id,
    type: 'CUSTOMER',
    name: 'Dr. Budi Pratama, Sp.A',
    npwp: '31.882.910.4-012.000',
    phone: '0811-987-654',
    email: 'dr.budi@gmail.com',
    address: 'Apartemen Belleza Lt. 12, Permata Hijau, Jakarta Selatan',
    bankName: 'BCA',
    bankAccountNo: '001-928-1122',
    bankAccountName: 'Budi Pratama',
    totalOutstandingReceivable: 450000000,
    totalOutstandingPayable: 0,
  },
];

export const DEFAULT_FIXED_ASSETS: FixedAsset[] = [
  {
    id: 'ast_exc_01',
    entityId: DEFAULT_ENTITY.id,
    assetCode: 'AST-ALAT-001',
    name: 'Excavator Komatsu PC200-8M0',
    category: 'ALAT_BERAT',
    acquisitionDate: '2024-03-15',
    readyForUseDate: '2024-03-20',
    acquisitionCost: 1100000000, // Rp 1.100.000.000
    salvageValue: 100000000, // Rp 100.000.000
    usefulLifeMonths: 60, // 5 tahun
    fiscalGroup: 'KELOMPOK_2', // PMK 72/2023 (8 tahun / 12.5% per tahun)
    fiscalDepreciationRate: 12.5,
    accumulatedDepreciation: 180000000,
    bookValue: 920000000,
    location: 'Area Kavling Blok C - Proyek Harmoni',
    custodian: 'Mandor Alat (Subhan)',
  },
  {
    id: 'ast_truck_01',
    entityId: DEFAULT_ENTITY.id,
    assetCode: 'AST-KDR-002',
    name: 'Dump Truck Hino 500 FM 260 JD',
    category: 'KENDARAAN_OPERASIONAL',
    acquisitionDate: '2024-06-10',
    readyForUseDate: '2024-06-15',
    acquisitionCost: 350000000,
    salvageValue: 50000000,
    usefulLifeMonths: 48,
    fiscalGroup: 'KELOMPOK_2',
    fiscalDepreciationRate: 12.5,
    accumulatedDepreciation: 65000000,
    bookValue: 285000000,
    location: 'Pool Logistik Proyek Harmoni',
    custodian: 'Sopir Lapangan (Yanto)',
  },
];

export const DEFAULT_TAX_REGISTERS: TaxRegisterItem[] = [
  {
    id: 'tax_01',
    entityId: DEFAULT_ENTITY.id,
    taxType: 'PPH_FINAL_KONSTRUKSI',
    period: '2026-10',
    sourceDocumentNo: 'PPB-PT01-202610-000088',
    dpp: 150000000,
    taxRatePercentage: 2.65, // PP 9/2022 Kualifikasi Menengah
    taxAmount: 3975000,
    taxRuleReference: 'PP 9/2022 Pasal 3 Ayat 1 Huruf c',
    withholdingSlipNo: 'BPU-PPH-202610-0042',
    status: 'DIVERIFIKASI',
    paymentDueDate: '2026-11-10',
    reportingDueDate: '2026-11-20',
  },
  {
    id: 'tax_02',
    entityId: DEFAULT_ENTITY.id,
    taxType: 'PPN',
    period: '2026-10',
    sourceDocumentNo: 'INV-MAT-2026-091',
    dpp: 85000000,
    taxRatePercentage: 11.0, // PMK 11/2025
    taxAmount: 9350000,
    taxRuleReference: 'PMK 11/2025 tentang PPN Tertentu',
    status: 'DISIAPKAN',
    paymentDueDate: '2026-11-30',
    reportingDueDate: '2026-11-30',
  },
];

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  companyName: 'PT CIPTA GRAHA MANDIRI',
  legalEntityName: 'PT CIPTA GRAHA MANDIRI (DEVELOPER & CONTRACTOR)',
  taxId: '01.892.481.9-403.000',
  addressLine1: 'Graha Harmoni Lt. 3, Jl. Raya Pemda No. 88, Cibinong',
  addressLine2: 'Kabupaten Bogor, Jawa Barat 16911 | Telp: (021) 8792-4100',
  phone: '(021) 8792-4100',
  email: 'official@ciptagrahamandiri.co.id',
  primaryBankAccountId: 'bank_bca_ops',
  authorizedSignerName: 'Ir. Hendrawan Santoso',
  authorizedSignerTitle: 'Direktur Utama',
  financeApproverName: 'Siti Rahmawati, S.E.',
  financeApproverTitle: 'Manager Keuangan & Akuntansi',
};

export const DEFAULT_PERIODS: AccountingPeriod[] = [
  {
    id: 'prd_2026_09',
    periodCode: '2026-09',
    year: 2026,
    month: 9,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'TERKUNCI',
    closedAt: '2026-09-30T23:59:59Z',
    closedBy: 'Agus Priyanto, Ak., CA',
    closingJournalId: 'je_close_2026_09',
    netIncomeClosed: 240000000,
  },
  {
    id: 'prd_2026_10',
    periodCode: '2026-10',
    year: 2026,
    month: 10,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: 'TERBUKA',
  },
  {
    id: 'prd_2026_11',
    periodCode: '2026-11',
    year: 2026,
    month: 11,
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    status: 'TERBUKA',
  },
];

export const DEFAULT_LAND_PARCELS: LandParcel[] = [
  {
    id: 'lnd_parcel_12',
    projectId: DEFAULT_PROJECT.id,
    parcelCode: 'BIDANG-012',
    sellerName: 'H. Syamsuddin',
    sellerIdCard: '3201011804650003',
    sellerPhone: '0812-3344-5566',
    locationDescription: 'Blok Barat, berbatasan dengan Jalan Desa RT 03/RW 04',
    documentArea: 2500,
    surveyedArea: 2490,
    areaVariance: -10,
    areaVariancePercentage: -0.4,
    areaToleranceStatus: 'LOLOS',
    pricePerMeter: 500000,
    agreedTotalAmount: 1250000000,
    paidAmount: 1000000000,
    remainingAmount: 250000000,
    paymentStatus: 'TERMIN_BERJALAN',
    originalTitleType: 'SHM',
    originalTitleNo: 'SHM No. 4812/Cibinong',
    notaryName: 'Farida Arifin, S.H., M.Kn.',
    notaryOffice: 'Kantor Notaris & PPAT Farida Arifin, Jl. Tegar Beriman No. 12',
    notaryFee: 15000000,
    notaryFeePaid: true,
    bphtbAmount: 57500000,
    bphtbPaid: true,
    pphPenjualAmount: 31250000,
    pphPenjualPaid: true,
    bpnCheckingFee: 500000,
    bpnTransferFee: 4500000,
    conveyanceStatus: 'AJB_SELESAI',
    newCertificateNo: 'Proses Balik Nama BPN (No Berkas: 2026/8912)',
    documentChecklist: [
      { id: 'chk_12_1', documentType: 'KTP_KK_PEMILIK', documentName: 'KTP & KK Pemilik (H. Syamsuddin)', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-09-10' },
      { id: 'chk_12_2', documentType: 'SURAT_PERSETUJUAN_AHLI_WARIS', documentName: 'Surat Persetujuan Istri & Ahli Waris', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-09-10' },
      { id: 'chk_12_3', documentType: 'SERTIFIKAT_ASLI_GIRIK', documentName: 'Sertifikat Asli SHM No. 4812', isVerified: true, verifiedBy: 'Notaris Farida', verifiedAt: '2026-09-12' },
      { id: 'chk_12_4', documentType: 'SPPT_PBB_LUNAS', documentName: 'Bukti Lunas PBB 5 Tahun Terakhir', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-09-12' },
      { id: 'chk_12_5', documentType: 'BERITA_ACARA_UKUR_BATAS', documentName: 'Berita Acara Pengukuran Batas (BA-MEAS)', isVerified: true, verifiedBy: 'Surveyor BPN', verifiedAt: '2026-09-15' },
      { id: 'chk_12_6', documentType: 'AKTA_PPJB_NOTARIS', documentName: 'Akta PPJB Notaris No. 18/2026', isVerified: true, verifiedBy: 'Notaris Farida', verifiedAt: '2026-09-20' },
      { id: 'chk_12_7', documentType: 'BUKTI_BAYAR_BPHTB', documentName: 'SSPD BPHTB & Validasi Bapenda', isVerified: true, verifiedBy: 'Finance Dept', verifiedAt: '2026-10-02' },
      { id: 'chk_12_8', documentType: 'AKTA_JUAL_BELI_AJB', documentName: 'Akta Jual Beli (AJB) No. 45/2026 PPAT', isVerified: true, verifiedBy: 'Notaris Farida', verifiedAt: '2026-10-05' },
    ],
    overallVerificationStatus: 'LENGKAP',
    topographyType: 'BERKONTUR',
    cutFillVolumeM3: 3200,
    cutFillCostPerM3: 45000,
    cutFillTotalCost: 144000000,
    cutFillProgressPercentage: 75,
    gpsCoordinates: '-6.48291, 106.84512',
    northBoundary: 'Jalan Desa RT 03/RW 04 (Lebar 5m)',
    southBoundary: 'Kavling Tanah Bpk. H. Rojali',
    eastBoundary: 'Rencana Jalan Bouleward Utama Proyek',
    westBoundary: 'Saluran Irigasi Desa Cibinong',
    surveyorName: 'Ir. Hendra Kusuma (BPN Kab. Bogor)',
    surveyDate: '2026-09-15',
    legalDisputeStatus: 'AMAN_CLEAR_AND_CLEAN',
    createdAt: '2026-09-01T08:30:00.000Z',
    createdBy: 'Farhan (Legal)',
  },
  {
    id: 'lnd_parcel_13',
    projectId: DEFAULT_PROJECT.id,
    parcelCode: 'BIDANG-013',
    sellerName: 'Ibu Warsih (Ahli Waris Alm. Sukardi)',
    sellerIdCard: '3201015509720001',
    sellerPhone: '0813-8877-1122',
    locationDescription: 'Blok Timur, berbatasan dengan Sungai Ciliwung kecil',
    documentArea: 1200,
    surveyedArea: 1280,
    areaVariance: 80,
    areaVariancePercentage: 6.67,
    areaToleranceStatus: 'HOLD_SELISIH_LUAS',
    pricePerMeter: 480000,
    agreedTotalAmount: 576000000,
    paidAmount: 100000000,
    remainingAmount: 476000000,
    paymentStatus: 'UANG_MUKA',
    originalTitleType: 'GIRIK',
    originalTitleNo: 'Girik C No. 289 Persil 14',
    notaryName: 'Bachtiar Yusuf, S.H.',
    notaryOffice: 'Kantor Notaris Bachtiar Yusuf, Jl. Raya Bogor KM 44',
    notaryFee: 8000000,
    notaryFeePaid: false,
    bphtbAmount: 23800000,
    bphtbPaid: false,
    pphPenjualAmount: 14400000,
    pphPenjualPaid: false,
    bpnCheckingFee: 500000,
    bpnTransferFee: 3500000,
    conveyanceStatus: 'PPJB_NOTARIIL',
    documentChecklist: [
      { id: 'chk_13_1', documentType: 'KTP_KK_PEMILIK', documentName: 'KTP & KK Ibu Warsih', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-10-01' },
      { id: 'chk_13_2', documentType: 'SURAT_PERSETUJUAN_AHLI_WARIS', documentName: 'Surat Keterangan Waris Desa & Persetujuan Anak', isVerified: false, notes: 'Menunggu tanda tangan anak ke-3 di Surabaya' },
      { id: 'chk_13_3', documentType: 'SERTIFIKAT_ASLI_GIRIK', documentName: 'Kutipan Letter C Asli Kelurahan', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-10-02' },
      { id: 'chk_13_4', documentType: 'SPPT_PBB_LUNAS', documentName: 'PBB Tahun Berjalan', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-10-02' },
      { id: 'chk_13_5', documentType: 'BERITA_ACARA_UKUR_BATAS', documentName: 'Hasil Ukur Fisik Topografi', isVerified: false, notes: 'Hold selisih luas +80m2 (6.67%) melebihi toleransi 1%' },
      { id: 'chk_13_6', documentType: 'AKTA_PPJB_NOTARIS', documentName: 'Draft PPJB Notaris Pengikatan Awal', isVerified: true, verifiedBy: 'Notaris Bachtiar', verifiedAt: '2026-10-10' },
      { id: 'chk_13_7', documentType: 'BUKTI_BAYAR_BPHTB', documentName: 'Validasi BPHTB Bapenda', isVerified: false, notes: 'Belum dibayar' },
      { id: 'chk_13_8', documentType: 'AKTA_JUAL_BELI_AJB', documentName: 'Akta Jual Beli Resmi', isVerified: false, notes: 'Syarat belum lengkap' },
    ],
    overallVerificationStatus: 'DOKUMEN_KURANG',
    topographyType: 'LEMBAH_RAWA',
    cutFillVolumeM3: 4500,
    cutFillCostPerM3: 50000,
    cutFillTotalCost: 225000000,
    cutFillProgressPercentage: 10,
    gpsCoordinates: '-6.48415, 106.84650',
    northBoundary: 'Tanah Girik Alm. Sukardi',
    southBoundary: 'Sempadan Sungai Ciliwung Kecil',
    eastBoundary: 'Sungai Ciliwung Kecil',
    westBoundary: 'Batas Patok Blok C Harmoni',
    surveyorName: 'Bambang Sudibyo, S.T. (Surveyor Topografi)',
    surveyDate: '2026-10-05',
    legalDisputeStatus: 'KLAIM_AHLI_WARIS',
    createdAt: '2026-10-01T09:15:00.000Z',
    createdBy: 'Farhan (Legal)',
  },
  {
    id: 'lnd_parcel_14',
    projectId: DEFAULT_PROJECT.id,
    parcelCode: 'BIDANG-014',
    sellerName: 'Suparman & Keluarga',
    sellerIdCard: '3201010507680002',
    sellerPhone: '0812-7766-3322',
    locationDescription: 'Blok Utara, pintu gerbang utama proyek',
    documentArea: 800,
    surveyedArea: 800,
    areaVariance: 0,
    areaVariancePercentage: 0,
    areaToleranceStatus: 'LOLOS',
    pricePerMeter: 520000,
    agreedTotalAmount: 416000000,
    paidAmount: 416000000,
    remainingAmount: 0,
    paymentStatus: 'LUNAS',
    originalTitleType: 'SHM',
    originalTitleNo: 'SHM No. 1190/Cibinong',
    notaryName: 'Farida Arifin, S.H., M.Kn.',
    notaryOffice: 'Kantor Notaris & PPAT Farida Arifin',
    notaryFee: 7500000,
    notaryFeePaid: true,
    bphtbAmount: 18300000,
    bphtbPaid: true,
    pphPenjualAmount: 10400000,
    pphPenjualPaid: true,
    bpnCheckingFee: 500000,
    bpnTransferFee: 3000000,
    conveyanceStatus: 'SHGB_TERBIT_ATAS_NAMA_PT',
    newCertificateNo: 'SHGB No. 102/PT CGM (Terbit BPN 18 Okt 2026)',
    documentChecklist: [
      { id: 'chk_14_1', documentType: 'KTP_KK_PEMILIK', documentName: 'KTP & KK Pemilik', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-08-05' },
      { id: 'chk_14_2', documentType: 'SURAT_PERSETUJUAN_AHLI_WARIS', documentName: 'Persetujuan Keluarga Lengkap', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-08-05' },
      { id: 'chk_14_3', documentType: 'SERTIFIKAT_ASLI_GIRIK', documentName: 'SHM Asli No. 1190', isVerified: true, verifiedBy: 'Notaris Farida', verifiedAt: '2026-08-10' },
      { id: 'chk_14_4', documentType: 'SPPT_PBB_LUNAS', documentName: 'PBB Lunas', isVerified: true, verifiedBy: 'Legal Dept', verifiedAt: '2026-08-10' },
      { id: 'chk_14_5', documentType: 'BERITA_ACARA_UKUR_BATAS', documentName: 'Pengukuran Batas BPN (Cocok 800m2)', isVerified: true, verifiedBy: 'Surveyor BPN', verifiedAt: '2026-08-15' },
      { id: 'chk_14_6', documentType: 'AKTA_PPJB_NOTARIS', documentName: 'PPJB Notariil', isVerified: true, verifiedBy: 'Notaris Farida', verifiedAt: '2026-08-20' },
      { id: 'chk_14_7', documentType: 'BUKTI_BAYAR_BPHTB', documentName: 'SSPD BPHTB Lunas', isVerified: true, verifiedBy: 'Finance Dept', verifiedAt: '2026-09-01' },
      { id: 'chk_14_8', documentType: 'AKTA_JUAL_BELI_AJB', documentName: 'AJB No. 29/2026', isVerified: true, verifiedBy: 'Notaris Farida', verifiedAt: '2026-09-05' },
      { id: 'chk_14_9', documentType: 'SERTIFIKAT_HGB_PT', documentName: 'Sertifikat Baru SHGB No. 102/PT CGM', isVerified: true, verifiedBy: 'BPN Cibinong', verifiedAt: '2026-10-18' },
    ],
    overallVerificationStatus: 'LENGKAP',
    topographyType: 'DATAR',
    cutFillVolumeM3: 650,
    cutFillCostPerM3: 40000,
    cutFillTotalCost: 26000000,
    cutFillProgressPercentage: 100,
    gpsCoordinates: '-6.48120, 106.84390',
    northBoundary: 'Jalan Raya Utama Pemda Cibinong',
    southBoundary: 'Pintu Gerbang Utama Gerbang Cluster',
    eastBoundary: 'Tanah Fasos/Fasum Desa',
    westBoundary: 'Ruko Pertokoan Warga',
    surveyorName: 'Drs. Wahyudi (BPN Kab. Bogor)',
    surveyDate: '2026-08-15',
    legalDisputeStatus: 'AMAN_CLEAR_AND_CLEAN',
    createdAt: '2026-08-01T07:45:00.000Z',
    createdBy: 'Farhan (Legal)',
  },
];

// Safe LocalStorage helpers
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

export function resetAllStorageToDefaults(): void {
  localStorage.clear();
  setStorageItem('entity', DEFAULT_ENTITY);
  setStorageItem('bank_accounts', DEFAULT_BANK_ACCOUNTS);
  setStorageItem('project', DEFAULT_PROJECT);
  setStorageItem('wbs', DEFAULT_WBS);
  setStorageItem('budget_items', DEFAULT_BUDGET_ITEMS);
  setStorageItem('coa', DEFAULT_COA);
  setStorageItem('parties', DEFAULT_PARTIES);
  setStorageItem('fixed_assets', DEFAULT_FIXED_ASSETS);
  setStorageItem('tax_registers', DEFAULT_TAX_REGISTERS);
  setStorageItem('print_settings', DEFAULT_PRINT_SETTINGS);
  setStorageItem('accounting_periods', DEFAULT_PERIODS);
  setStorageItem('land_parcels', DEFAULT_LAND_PARCELS);
  setStorageItem('payment_requests', []);
  setStorageItem('journal_entries', []);
  setStorageItem('audit_events', []);
}

