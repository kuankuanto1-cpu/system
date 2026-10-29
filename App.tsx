/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProjectBudgetView } from './components/ProjectBudgetView';
import { PaymentRequestView } from './components/PaymentRequestView';
import { CashBankView } from './components/CashBankView';
import { SalesReceivablesView } from './components/SalesReceivablesView';
import { PurchasePayablesView } from './components/PurchasePayablesView';
import { AssetsInventoryView } from './components/AssetsInventoryView';
import { TaxReportsView } from './components/TaxReportsView';
import { DocumentPrintView } from './components/DocumentPrintView';
import { SettingsView } from './components/SettingsView';
import { AcceptanceTestView } from './components/AcceptanceTestView';
import { PeriodClosingView } from './components/PeriodClosingView';
import { LandAcquisitionView } from './components/LandAcquisitionView';
import {
  User,
  BankAccount,
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
  AccountingPeriod,
  LandParcel,
} from './types';
import {
  getStorageItem,
  setStorageItem,
  DEFAULT_ENTITY,
  DEFAULT_USERS,
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_PROJECT,
  DEFAULT_WBS,
  DEFAULT_BUDGET_ITEMS,
  DEFAULT_COA,
  DEFAULT_PARTIES,
  DEFAULT_FIXED_ASSETS,
  DEFAULT_TAX_REGISTERS,
  DEFAULT_PRINT_SETTINGS,
  DEFAULT_PERIODS,
  DEFAULT_LAND_PARCELS,
} from './services/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS[0]); // Direksi
  const [activeTab, setActiveTab] = useState<ActiveTab>('beranda');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Core Data Collections
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() =>
    getStorageItem('bank_accounts', DEFAULT_BANK_ACCOUNTS)
  );
  const [accountingPeriods, setAccountingPeriods] = useState<AccountingPeriod[]>(() =>
    getStorageItem('accounting_periods', DEFAULT_PERIODS)
  );
  const [landParcels, setLandParcels] = useState<LandParcel[]>(() =>
    getStorageItem('land_parcels', DEFAULT_LAND_PARCELS)
  );
  const [project, setProject] = useState<Project>(() =>
    getStorageItem('project', DEFAULT_PROJECT)
  );
  const [wbsList, setWbsList] = useState<WBSItem[]>(() =>
    getStorageItem('wbs', DEFAULT_WBS)
  );
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() =>
    getStorageItem('budget_items', DEFAULT_BUDGET_ITEMS)
  );
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() =>
    getStorageItem('payment_requests', [
      {
        id: 'ppb_seed_01',
        documentNo: 'PPB-PT01-202610-001088',
        projectId: DEFAULT_PROJECT.id,
        projectName: DEFAULT_PROJECT.name,
        requestedBy: DEFAULT_USERS[1].id,
        requestedByName: DEFAULT_USERS[1].name,
        requestDate: '2026-10-24',
        dueDate: '2026-10-31',
        payeeName: 'PT Mitra Beton Konstruksi',
        payeeBank: 'Bank Mandiri',
        payeeAccountNo: '133-00-998822-1',
        purpose: 'Pembayaran Cor Ready Mix Blok B Kavling 1-5',
        items: [
          {
            id: 'item_seed_01',
            budgetItemId: 'bitem_03',
            costCode: 'INFRA-ROAD-01',
            description: 'Paving Block & Cor K-300',
            quantity: 500,
            unit: 'm2',
            unitPrice: 185000,
            amount: 92500000,
          },
        ],
        totalAmount: 92500000,
        status: 'MENUNGGU_APPROVAL_FINANCE',
        approvalChain: [
          { role: 'PROJECT_MANAGER', approverName: DEFAULT_USERS[1].name, approvedAt: '2026-10-24', decision: 'APPROVED' },
          { role: 'FINANCE', decision: 'PENDING' },
          { role: 'DIREKSI', decision: 'PENDING' },
        ],
      },
    ])
  );
  const [parties, setParties] = useState<Party[]>(() =>
    getStorageItem('parties', DEFAULT_PARTIES)
  );
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() =>
    getStorageItem('fixed_assets', DEFAULT_FIXED_ASSETS)
  );
  const [taxRegisters, setTaxRegisters] = useState<TaxRegisterItem[]>(() =>
    getStorageItem('tax_registers', DEFAULT_TAX_REGISTERS)
  );
  const [coa, setCoa] = useState<AccountCOA[]>(() =>
    getStorageItem('coa', DEFAULT_COA)
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    getStorageItem('journal_entries', [])
  );
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() =>
    getStorageItem('print_settings', DEFAULT_PRINT_SETTINGS)
  );

  // Subledgers
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([
    {
      id: 'inv_c_01',
      documentNo: 'INV-SALES-2026-0041',
      projectId: DEFAULT_PROJECT.id,
      unitId: 'unit_a1',
      customerId: 'pty_cust_01',
      customerName: 'Dr. Budi Pratama, Sp.A',
      invoiceDate: '2026-10-15',
      dueDate: '2026-11-01',
      termDescription: 'Uang Muka Tahap 2 (Kavling Blok A1-02)',
      grossAmount: 150000000,
      paidAmount: 150000000,
      remainingAmount: 0,
      status: 'LUNAS',
    },
    {
      id: 'inv_c_02',
      documentNo: 'INV-SALES-2026-0042',
      projectId: DEFAULT_PROJECT.id,
      unitId: 'unit_b3',
      customerId: 'pty_cust_01',
      customerName: 'Dr. Budi Pratama, Sp.A',
      invoiceDate: '2026-10-20',
      dueDate: '2026-11-15',
      termDescription: 'Termin Konstruksi 50% (Kavling Blok B3)',
      grossAmount: 300000000,
      paidAmount: 0,
      remainingAmount: 300000000,
      status: 'BELUM_DIBAYAR',
    },
  ]);

  const [vendorInvoices, setVendorInvoices] = useState<VendorInvoice[]>([
    {
      id: 'inv_v_01',
      documentNo: 'INV-MBK-2026-092',
      poNumber: 'PO-PT01-202610-0048',
      vendorId: 'pty_ven_01',
      vendorName: 'PT Mitra Beton Konstruksi',
      projectId: DEFAULT_PROJECT.id,
      invoiceDate: '2026-10-18',
      dueDate: '2026-11-05',
      description: 'Pengiriman Cor Beton Mutu K-300 Jalan Utama',
      grossAmount: 185000000,
      taxDeduction: 4902500, // PPh 2.65% PP 9/2022
      netPayableAmount: 180097500,
      paidAmount: 0,
      remainingAmount: 180097500,
      status: 'BELUM_DIBAYAR',
    },
  ]);

  const [printDocSelection, setPrintDocSelection] = useState<{ type: string; data: any } | null>(null);

  // Sync state to storage
  const refreshFromStorage = () => {
    setBankAccounts(getStorageItem('bank_accounts', DEFAULT_BANK_ACCOUNTS));
    setProject(getStorageItem('project', DEFAULT_PROJECT));
    setBudgetItems(getStorageItem('budget_items', DEFAULT_BUDGET_ITEMS));
    setPaymentRequests(getStorageItem('payment_requests', []));
    setFixedAssets(getStorageItem('fixed_assets', DEFAULT_FIXED_ASSETS));
    setTaxRegisters(getStorageItem('tax_registers', DEFAULT_TAX_REGISTERS));
    setCoa(getStorageItem('coa', DEFAULT_COA));
    setJournalEntries(getStorageItem('journal_entries', []));
    setPrintSettings(getStorageItem('print_settings', DEFAULT_PRINT_SETTINGS));
    setAccountingPeriods(getStorageItem('accounting_periods', DEFAULT_PERIODS));
    setLandParcels(getStorageItem('land_parcels', DEFAULT_LAND_PARCELS));
  };

  const handleUpdateBudgetItems = (updated: BudgetItem[]) => {
    setBudgetItems(updated);
    setStorageItem('budget_items', updated);
  };

  const handleUpdateBankAccounts = (updated: BankAccount[]) => {
    setBankAccounts(updated);
    setStorageItem('bank_accounts', updated);
  };

  const handleUpdatePrintSettings = (updated: PrintSettings) => {
    setPrintSettings(updated);
    setStorageItem('print_settings', updated);
  };

  const handleSelectPrintDoc = (type: string, docData: any) => {
    setPrintDocSelection({ type, data: docData });
    setActiveTab('dokumen');
  };

  const pendingPPBCount = paymentRequests.filter((p) => p.status.startsWith('MENUNGGU')).length;

  // Breadcrumbs text
  const breadcrumbMap: Record<ActiveTab, string> = {
    beranda: 'Beranda & Eksekutif',
    lahan: 'Pembebasan Lahan, Notaris PPAT & Verifikasi Hak',
    proyek: 'Proyek & Anggaran RAB',
    ppb: 'Permohonan Pencairan Biaya',
    kas_bank: 'Kas & Rekening Bank',
    penjualan: 'Penjualan & Piutang (AR)',
    pembelian: 'Pembelian & Utang (AP)',
    aset_gudang: 'Aset Tetap & Gudang',
    pajak_laporan: 'Pajak & Laporan Keuangan',
    tutup_buku: 'Tutup Buku Bulanan & Penguncian Periode',
    dokumen: 'Pusat Cetak Dokumen A4',
    pengaturan: 'Pengaturan & Identitas Perusahaan',
    pengujian: 'Uji Penerimaan 20 Skenario (AT-01 s/d AT-20)',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        pendingPPBCount={pendingPPBCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onToggleMobileMenu={() => setIsOpenMobile(true)}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          breadcrumbs={breadcrumbMap[activeTab]}
          onNewPPBClick={() => setActiveTab('ppb')}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'beranda' && (
            <DashboardView
              bankAccounts={bankAccounts}
              project={project}
              budgetItems={budgetItems}
              paymentRequests={paymentRequests}
              vendorInvoices={vendorInvoices}
              customerInvoices={customerInvoices}
              taxRegisters={taxRegisters}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'lahan' && (
            <LandAcquisitionView
              parcels={landParcels}
              bankAccounts={bankAccounts}
              currentUser={currentUser}
              onRefreshData={refreshFromStorage}
              budgetItems={budgetItems}
              project={project}
            />
          )}

          {activeTab === 'proyek' && (
            <ProjectBudgetView
              project={project}
              wbsList={wbsList}
              budgetItems={budgetItems}
              currentUser={currentUser}
              onUpdateBudgetItems={handleUpdateBudgetItems}
            />
          )}

          {activeTab === 'ppb' && (
            <PaymentRequestView
              paymentRequests={paymentRequests}
              budgetItems={budgetItems}
              bankAccounts={bankAccounts}
              currentUser={currentUser}
              project={project}
              onRefreshData={refreshFromStorage}
              onSelectPrintDoc={handleSelectPrintDoc}
            />
          )}

          {activeTab === 'kas_bank' && (
            <CashBankView
              bankAccounts={bankAccounts}
              currentUser={currentUser}
              onUpdateBankAccounts={handleUpdateBankAccounts}
            />
          )}

          {activeTab === 'penjualan' && (
            <SalesReceivablesView
              units={[]}
              invoices={customerInvoices}
              bankAccounts={bankAccounts}
              currentUser={currentUser}
              onUpdateInvoices={setCustomerInvoices}
              onSelectPrintDoc={handleSelectPrintDoc}
            />
          )}

          {activeTab === 'pembelian' && (
            <PurchasePayablesView
              invoices={vendorInvoices}
              parties={parties}
              bankAccounts={bankAccounts}
              currentUser={currentUser}
              onUpdateInvoices={setVendorInvoices}
              onSelectPrintDoc={handleSelectPrintDoc}
            />
          )}

          {activeTab === 'aset_gudang' && (
            <AssetsInventoryView
              assets={fixedAssets}
              currentUser={currentUser}
              onRefreshData={refreshFromStorage}
            />
          )}

          {activeTab === 'pajak_laporan' && (
            <TaxReportsView
              taxRegisters={taxRegisters}
              coa={coa}
              journalEntries={journalEntries}
              currentUser={currentUser}
              onRefreshData={refreshFromStorage}
            />
          )}

          {activeTab === 'tutup_buku' && (
            <PeriodClosingView
              periods={accountingPeriods}
              coa={coa}
              journalEntries={journalEntries}
              currentUser={currentUser}
              onRefreshData={refreshFromStorage}
            />
          )}

          {activeTab === 'dokumen' && (
            <DocumentPrintView
              printSettings={printSettings}
              paymentRequests={paymentRequests}
              customerInvoices={customerInvoices}
              landParcels={landParcels}
              initialDocType={printDocSelection?.type || 'PPB'}
              initialDocData={printDocSelection?.data}
            />
          )}

          {activeTab === 'pengaturan' && (
            <SettingsView
              printSettings={printSettings}
              currentUser={currentUser}
              onUpdatePrintSettings={handleUpdatePrintSettings}
              onResetDatabase={refreshFromStorage}
            />
          )}

          {activeTab === 'pengujian' && <AcceptanceTestView />}
        </main>
      </div>
    </div>
  );
}
