/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AccountCOA,
  BudgetItem,
  JournalEntry,
  JournalLine,
  PaymentRequest,
  BankAccount,
  AuditEvent,
  User,
  FixedAsset,
  TaxRegisterItem,
  AccountingPeriod,
  LandParcel,
  CutFillCalculationDetail,
} from '../types';
import {
  getStorageItem,
  setStorageItem,
  DEFAULT_COA,
  DEFAULT_BUDGET_ITEMS,
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_FIXED_ASSETS,
  DEFAULT_TAX_REGISTERS,
  DEFAULT_PERIODS,
  DEFAULT_LAND_PARCELS,
} from './storage';

export class PeriodLockedError extends Error {
  constructor(message: string, public periodCode: string) {
    super(message);
    this.name = 'PeriodLockedError';
  }
}

export class BudgetOverrunError extends Error {
  constructor(message: string, public available: number, public requested: number) {
    super(message);
    this.name = 'BudgetOverrunError';
  }
}

export class JournalBalanceError extends Error {
  constructor(message: string, public totalDebit: number, public totalCredit: number) {
    super(message);
    this.name = 'JournalBalanceError';
  }
}

export class SeparationOfDutiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeparationOfDutiesError';
  }
}

// Log audit event
export function logAuditEvent(
  actor: User,
  action: AuditEvent['action'],
  entityType: AuditEvent['entityType'],
  entityId: string,
  description: string,
  diffSummary?: string
): void {
  const events = getStorageItem<AuditEvent[]>('audit_events', []);
  const newEvent: AuditEvent = {
    id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    actorName: actor.name,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    description,
    diffSummary,
  };
  events.unshift(newEvent);
  setStorageItem('audit_events', events);
}

// Helper: generate unique document numbers
export function generateDocNumber(prefix: string, entityCode: string = 'PT01'): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${entityCode}-${yearMonth}-${randSeq}`;
}

// POST JOURNAL ENTRY (STRICT DOUBLE-ENTRY ATOMIC RULE)
export function postJournalEntry(
  entryData: {
    referenceType: JournalEntry['referenceType'];
    referenceNo: string;
    description: string;
    lines: Omit<JournalLine, 'id'>[];
  },
  actor: User
): JournalEntry {
  // 0. Strict Accounting Period Lock Check (FR-106 & BR-013)
  const todayPeriod = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const periods = getStorageItem<AccountingPeriod[]>('accounting_periods', DEFAULT_PERIODS);
  const matchedPeriod = periods.find((p) => p.periodCode === todayPeriod);
  if (matchedPeriod && matchedPeriod.status === 'TERKUNCI' && entryData.referenceType !== 'TUTUP_BUKU') {
    throw new PeriodLockedError(
      `Posting ditolak! Periode akuntansi ${todayPeriod} telah DITUTUP & TERKUNCI. Transaksi baru tidak dapat dibukukan pada periode ini kecuali periode dibuka kembali secara resmi.`,
      todayPeriod
    );
  }

  // 1. Calculate Debit & Credit
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of entryData.lines) {
    if (line.debit < 0 || line.credit < 0) {
      throw new Error('Nilai debit dan kredit tidak boleh negatif.');
    }
    if (line.debit > 0 && line.credit > 0) {
      throw new Error('Satu baris jurnal tidak boleh memiliki debit dan kredit sekaligus.');
    }
    totalDebit += Math.round(line.debit);
    totalCredit += Math.round(line.credit);
  }

  // 2. Strict Balance Check
  if (totalDebit !== totalCredit) {
    throw new JournalBalanceError(
      `Jurnal tidak seimbang! Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) != Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')}). Selisih: Rp ${Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}`,
      totalDebit,
      totalCredit
    );
  }

  const entries = getStorageItem<JournalEntry[]>('journal_entries', []);
  const coa = getStorageItem<AccountCOA[]>('coa', DEFAULT_COA);

  const entryId = 'je_' + Date.now();
  const fullLines: JournalLine[] = entryData.lines.map((l, idx) => ({
    ...l,
    id: `${entryId}_line_${idx + 1}`,
    debit: Math.round(l.debit),
    credit: Math.round(l.credit),
  }));

  const newEntry: JournalEntry = {
    id: entryId,
    entryNo: generateDocNumber('JE'),
    date: new Date().toISOString().split('T')[0],
    postingDate: new Date().toISOString().split('T')[0],
    referenceType: entryData.referenceType,
    referenceNo: entryData.referenceNo,
    description: entryData.description,
    lines: fullLines,
    totalDebit,
    totalCredit,
    status: 'POSTED',
    createdBy: actor.name,
    postedBy: actor.name,
  };

  // 3. Atomically Update COA Balances
  for (const line of fullLines) {
    const acc = coa.find((a) => a.id === line.accountId || a.code === line.accountCode);
    if (acc) {
      if (acc.normalBalance === 'DEBIT') {
        acc.balance += line.debit - line.credit;
      } else {
        acc.balance += line.credit - line.debit;
      }
    }
  }

  entries.unshift(newEntry);
  setStorageItem('journal_entries', entries);
  setStorageItem('coa', coa);

  logAuditEvent(actor, 'POST_GL', 'JOURNAL', newEntry.id, `Posting Jurnal Umum: ${newEntry.entryNo} senilai Rp ${totalDebit.toLocaleString('id-ID')}`);

  return newEntry;
}

// REVERSE JOURNAL ENTRY (NO SILENT DELETION)
export function reverseJournalEntry(originalEntryId: string, reason: string, actor: User): JournalEntry {
  const entries = getStorageItem<JournalEntry[]>('journal_entries', []);
  const origIndex = entries.findIndex((e) => e.id === originalEntryId);

  if (origIndex === -1) {
    throw new Error('Jurnal asli tidak ditemukan.');
  }

  const original = entries[origIndex];
  if (original.status === 'REVERSED') {
    throw new Error('Jurnal ini sudah pernah dibalik (sudah berstatus REVERSED).');
  }

  // Create reversal lines (flip debit and credit)
  const reversalLines: Omit<JournalLine, 'id'>[] = original.lines.map((l) => ({
    accountId: l.accountId,
    accountCode: l.accountCode,
    accountName: l.accountName,
    description: `Pembalikan (${reason}): ${l.description}`,
    debit: l.credit, // Invert
    credit: l.debit, // Invert
    projectId: l.projectId,
  }));

  const reversal = postJournalEntry(
    {
      referenceType: 'REVERSAL',
      referenceNo: original.entryNo,
      description: `Jurnal Pembalik untuk ${original.entryNo}: ${reason}`,
      lines: reversalLines,
    },
    actor
  );

  // Mark original as REVERSED
  original.status = 'REVERSED';
  original.reversalOfEntryId = reversal.id;
  entries[origIndex] = original;
  setStorageItem('journal_entries', entries);

  logAuditEvent(actor, 'REVERSE_GL', 'JOURNAL', original.id, `Pembalikan Jurnal ${original.entryNo} melalui Reversal ${reversal.entryNo}`);

  return reversal;
}

// CHECK BUDGET GATE (BR-001)
export function checkBudgetGate(budgetItemId: string, requestedAmount: number): { available: number; passed: boolean } {
  const budgetItems = getStorageItem<BudgetItem[]>('budget_items', DEFAULT_BUDGET_ITEMS);
  const item = budgetItems.find((b) => b.id === budgetItemId);

  if (!item) {
    throw new Error(`Item anggaran dengan ID ${budgetItemId} tidak ditemukan di master RAB.`);
  }

  const available = item.paguDisetujui - item.realisasi - item.komitmenTerbuka;

  if (requestedAmount > available) {
    throw new BudgetOverrunError(
      `Permohonan ditolak oleh Budget Gate! Nilai diminta (Rp ${requestedAmount.toLocaleString('id-ID')}) melebihi sisa anggaran tersedia (Rp ${available.toLocaleString('id-ID')}) untuk kode biaya ${item.costCode}.`,
      available,
      requestedAmount
    );
  }

  return { available, passed: true };
}

// CREATE PAYMENT REQUEST (PPB)
export function createPaymentRequest(
  ppbData: Omit<PaymentRequest, 'id' | 'documentNo' | 'status' | 'approvalChain'>,
  actor: User
): PaymentRequest {
  if (!ppbData.items || ppbData.items.length === 0) {
    throw new Error('No RAB & No Detail: Permohonan pencairan wajib menyertakan rincian item anggaran.');
  }

  // 1. Budget check for all items
  const budgetItems = getStorageItem<BudgetItem[]>('budget_items', DEFAULT_BUDGET_ITEMS);

  for (const item of ppbData.items) {
    if (!ppbData.isEmergencyException) {
      checkBudgetGate(item.budgetItemId, item.amount);
    }
  }

  // 2. Reserve commitment
  for (const item of ppbData.items) {
    const bIndex = budgetItems.findIndex((b) => b.id === item.budgetItemId);
    if (bIndex !== -1) {
      budgetItems[bIndex].komitmenTerbuka += item.amount;
    }
  }
  setStorageItem('budget_items', budgetItems);

  // 3. Create PPB
  const requests = getStorageItem<PaymentRequest[]>('payment_requests', []);
  const newPPB: PaymentRequest = {
    ...ppbData,
    id: 'ppb_' + Date.now(),
    documentNo: generateDocNumber('PPB'),
    status: 'MENUNGGU_REVIEW_PM',
    approvalChain: [
      { role: 'PROJECT_MANAGER', decision: 'PENDING' },
      { role: 'FINANCE', decision: 'PENDING' },
      { role: 'DIREKSI', decision: 'PENDING' },
    ],
  };

  requests.unshift(newPPB);
  setStorageItem('payment_requests', requests);

  logAuditEvent(actor, 'CREATE', 'PPB', newPPB.id, `Penerbitan PPB Baru: ${newPPB.documentNo} senilai Rp ${newPPB.totalAmount.toLocaleString('id-ID')}`);

  return newPPB;
}

// APPROVE PAYMENT REQUEST (WITH SEPARATION OF DUTIES BR-003)
export function approvePaymentRequest(ppbId: string, approver: User, decision: 'APPROVED' | 'REJECTED', notes?: string): PaymentRequest {
  const requests = getStorageItem<PaymentRequest[]>('payment_requests', []);
  const ppbIndex = requests.findIndex((p) => p.id === ppbId);

  if (ppbIndex === -1) {
    throw new Error('Dokumen PPB tidak ditemukan.');
  }

  const ppb = requests[ppbIndex];

  // Separation of duties rule: Requester cannot approve own PPB!
  if (ppb.requestedBy === approver.id) {
    throw new SeparationOfDutiesError(`Pemisahan Tugas: Pemohon (${ppb.requestedByName}) dilarang menyetujui permohonannya sendiri.`);
  }

  // Find corresponding step in approval chain
  const step = ppb.approvalChain.find((s) => s.role === approver.role && s.decision === 'PENDING');
  if (!step) {
    throw new Error(`Pengguna dengan role ${approver.role} tidak memiliki antrean persetujuan pada status dokumen saat ini.`);
  }

  step.approverName = approver.name;
  step.approvedAt = new Date().toISOString();
  step.decision = decision;
  step.notes = notes;

  if (decision === 'REJECTED') {
    ppb.status = 'REJECTED';
    // Release reserved commitment back to budget
    const budgetItems = getStorageItem<BudgetItem[]>('budget_items', DEFAULT_BUDGET_ITEMS);
    for (const item of ppb.items) {
      const bIndex = budgetItems.findIndex((b) => b.id === item.budgetItemId);
      if (bIndex !== -1) {
        budgetItems[bIndex].komitmenTerbuka = Math.max(0, budgetItems[bIndex].komitmenTerbuka - item.amount);
      }
    }
    setStorageItem('budget_items', budgetItems);
    logAuditEvent(approver, 'REJECT', 'PPB', ppb.id, `Penolakan PPB ${ppb.documentNo}: ${notes || 'Tanpa catatan'}`);
  } else {
    // Advance status
    const pendingSteps = ppb.approvalChain.filter((s) => s.decision === 'PENDING');
    if (pendingSteps.length === 0) {
      ppb.status = 'APPROVED';
    } else {
      const nextRole = pendingSteps[0].role;
      if (nextRole === 'FINANCE') ppb.status = 'MENUNGGU_APPROVAL_FINANCE';
      else if (nextRole === 'DIREKSI') ppb.status = 'MENUNGGU_APPROVAL_DIREKSI';
    }
    logAuditEvent(approver, 'APPROVE', 'PPB', ppb.id, `Persetujuan PPB ${ppb.documentNo} oleh ${approver.role}`);
  }

  requests[ppbIndex] = ppb;
  setStorageItem('payment_requests', requests);
  return ppb;
}

// DISBURSE PAYMENT REQUEST (CASHIER DISBURSEMENT & ATOMIC GL POSTING)
export function disbursePaymentRequest(ppbId: string, bankAccountId: string, cashier: User): { ppb: PaymentRequest; journal: JournalEntry } {
  const requests = getStorageItem<PaymentRequest[]>('payment_requests', []);
  const banks = getStorageItem<BankAccount[]>('bank_accounts', DEFAULT_BANK_ACCOUNTS);
  const budgetItems = getStorageItem<BudgetItem[]>('budget_items', DEFAULT_BUDGET_ITEMS);

  const ppbIndex = requests.findIndex((p) => p.id === ppbId);
  if (ppbIndex === -1) throw new Error('Dokumen PPB tidak ditemukan.');

  const ppb = requests[ppbIndex];
  if (ppb.status !== 'APPROVED') {
    throw new Error(`Pencairan gagal: Dokumen PPB ${ppb.documentNo} belum berstatus APPROVED.`);
  }

  const bankIndex = banks.findIndex((b) => b.id === bankAccountId);
  if (bankIndex === -1) throw new Error('Rekening bank sumber pencairan tidak valid.');

  const bank = banks[bankIndex];
  if (bank.bookBalance < ppb.totalAmount) {
    throw new Error(`Saldo bank (${bank.bankName}: Rp ${bank.bookBalance.toLocaleString('id-ID')}) tidak mencukupi untuk pembayaran Rp ${ppb.totalAmount.toLocaleString('id-ID')}.`);
  }

  // 1. Deduct Bank Balance
  bank.bookBalance -= ppb.totalAmount;
  banks[bankIndex] = bank;
  setStorageItem('bank_accounts', banks);

  // 2. Transfer from commitment to realization
  for (const item of ppb.items) {
    const bIndex = budgetItems.findIndex((b) => b.id === item.budgetItemId);
    if (bIndex !== -1) {
      budgetItems[bIndex].komitmenTerbuka = Math.max(0, budgetItems[bIndex].komitmenTerbuka - item.amount);
      budgetItems[bIndex].realisasi += item.amount;
    }
  }
  setStorageItem('budget_items', budgetItems);

  // 3. Atomic Double-Entry Journal:
  // Debit: WIP Konstruksi / Beban Proyek (1160)
  // Credit: Kas & Bank (1111)
  const journal = postJournalEntry(
    {
      referenceType: 'PENCAIRAN_PPB',
      referenceNo: ppb.documentNo,
      description: `Pencairan PPB: ${ppb.documentNo} kepada ${ppb.payeeName} (${ppb.purpose}) via ${bank.bankName}`,
      lines: [
        {
          accountId: 'acc_1160',
          accountCode: '1160',
          accountName: 'Pekerjaan Dalam Pelaksanaan (WIP Konstruksi)',
          description: `Beban realisasi proyek - ${ppb.purpose}`,
          debit: ppb.totalAmount,
          credit: 0,
          projectId: ppb.projectId,
        },
        {
          accountId: 'acc_1111',
          accountCode: '1111',
          accountName: 'Kas & Rekening Bank',
          description: `Pengeluaran via ${bank.bankName} (${bank.accountNumber})`,
          debit: 0,
          credit: ppb.totalAmount,
          projectId: ppb.projectId,
        },
      ],
    },
    cashier
  );

  // 4. Update PPB state to PAID
  ppb.status = 'PAID';
  ppb.paidAt = new Date().toISOString();
  ppb.paymentBankAccountId = bankAccountId;
  ppb.journalEntryId = journal.id;
  requests[ppbIndex] = ppb;
  setStorageItem('payment_requests', requests);

  logAuditEvent(cashier, 'DISBURSE', 'PPB', ppb.id, `Pembayaran PPB ${ppb.documentNo} senilai Rp ${ppb.totalAmount.toLocaleString('id-ID')} via ${bank.bankName}`);

  return { ppb, journal };
}

// FIXED ASSET MONTHLY DEPRECIATION (COMMERCIAL SL & FISCAL PMK 72/2023)
export function runAssetDepreciation(assetId: string, actor: User): { commercialAmount: number; fiscalAmount: number; journal: JournalEntry } {
  const assets = getStorageItem<FixedAsset[]>('fixed_assets', DEFAULT_FIXED_ASSETS);
  const aIndex = assets.findIndex((a) => a.id === assetId);
  if (aIndex === -1) throw new Error('Aset tidak ditemukan.');

  const asset = assets[aIndex];

  // Commercial Straight Line: (Cost - Salvage) / Months
  const commercialAmount = Math.round((asset.acquisitionCost - asset.salvageValue) / asset.usefulLifeMonths);
  // Fiscal PMK 72/2023: Cost * (Rate / 100) / 12
  const fiscalAmount = Math.round((asset.acquisitionCost * (asset.fiscalDepreciationRate / 100)) / 12);

  asset.accumulatedDepreciation += commercialAmount;
  asset.bookValue = Math.max(asset.salvageValue, asset.acquisitionCost - asset.accumulatedDepreciation);
  assets[aIndex] = asset;
  setStorageItem('fixed_assets', assets);

  // Post Journal Entry
  // Debit: Beban Operasional / Penyusutan (6100)
  // Credit: Akumulasi Penyusutan (1220)
  const journal = postJournalEntry(
    {
      referenceType: 'DEPRESIASI_ASET',
      referenceNo: asset.assetCode,
      description: `Penyusutan Bulanan Aset ${asset.name} (${asset.assetCode}) Periode Berjalan`,
      lines: [
        {
          accountId: 'acc_6100',
          accountCode: '6100',
          accountName: 'Beban Operasional & Administrasi Kantor',
          description: `Beban penyusutan ${asset.name}`,
          debit: commercialAmount,
          credit: 0,
        },
        {
          accountId: 'acc_1220',
          accountCode: '1220',
          accountName: 'Akumulasi Penyusutan Alat & Kendaraan',
          description: `Akumulasi penyusutan ${asset.name}`,
          debit: 0,
          credit: commercialAmount,
        },
      ],
    },
    actor
  );

  logAuditEvent(actor, 'POST_GL', 'ASSET', asset.id, `Depresiasi Aset ${asset.assetCode} Komersial: Rp ${commercialAmount.toLocaleString('id-ID')}, Fiskal PMK 72: Rp ${fiscalAmount.toLocaleString('id-ID')}`);

  return { commercialAmount, fiscalAmount, journal };
}

// GET RECONCILED FINANCIAL STATEMENTS FROM GL LINES
export function calculateFinancialStatements() {
  const coa = getStorageItem<AccountCOA[]>('coa', DEFAULT_COA);

  const aktivaLancar = coa.filter((a) => a.classification === 'AKTIVA_LANCAR').reduce((sum, a) => sum + a.balance, 0);
  const aktivaTetap = coa.filter((a) => a.classification === 'AKTIVA_TETAP').reduce((sum, a) => sum + a.balance, 0);
  const totalAktiva = aktivaLancar + aktivaTetap;

  const kewajibanLancar = coa.filter((a) => a.classification === 'KEWAJIBAN_LANCAR').reduce((sum, a) => sum + a.balance, 0);
  const ekuitas = coa.filter((a) => a.classification === 'EKUITAS').reduce((sum, a) => sum + a.balance, 0);
  const totalPasiva = kewajibanLancar + ekuitas;

  const pendapatan = coa.filter((a) => a.classification === 'PENDAPATAN').reduce((sum, a) => sum + a.balance, 0);
  const hpp = coa.filter((a) => a.classification === 'HPP_PROYEK').reduce((sum, a) => sum + a.balance, 0);
  const bebanOperasional = coa.filter((a) => a.classification === 'BEBAN_OPERASIONAL').reduce((sum, a) => sum + a.balance, 0);
  const labaBersih = pendapatan - (hpp + bebanOperasional);

  return {
    aktivaLancar,
    aktivaTetap,
    totalAktiva,
    kewajibanLancar,
    ekuitas,
    totalPasiva,
    pendapatan,
    hpp,
    bebanOperasional,
    labaBersih,
    isBalanced: totalAktiva === totalPasiva,
  };
}

// PREVIEW PERIOD CLOSING JOURNAL LINES
export function previewPeriodClosing(periodCode: string) {
  const coa = getStorageItem<AccountCOA[]>('coa', DEFAULT_COA);

  const revenueAccounts = coa.filter((a) => a.classification === 'PENDAPATAN' && a.balance !== 0);
  const expenseAccounts = coa.filter(
    (a) => (a.classification === 'HPP_PROYEK' || a.classification === 'BEBAN_OPERASIONAL') && a.balance !== 0
  );

  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpense = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
  const netIncome = totalRevenue - totalExpense;

  const lines: Omit<JournalLine, 'id'>[] = [];

  // Debit all revenue accounts to zero them out
  for (const rev of revenueAccounts) {
    if (rev.balance > 0) {
      lines.push({
        accountId: rev.id,
        accountCode: rev.code,
        accountName: rev.name,
        description: `Tutup Buku Periode ${periodCode} - Pemindahan Pendapatan`,
        debit: rev.balance,
        credit: 0,
      });
    }
  }

  // Credit all expense accounts to zero them out
  for (const exp of expenseAccounts) {
    if (exp.balance > 0) {
      lines.push({
        accountId: exp.id,
        accountCode: exp.code,
        accountName: exp.name,
        description: `Tutup Buku Periode ${periodCode} - Pemindahan Beban/HPP`,
        debit: 0,
        credit: exp.balance,
      });
    }
  }

  // Find Retained Earnings Account 3200
  const retainedEarningsAcc = coa.find((a) => a.code === '3200') || {
    id: 'acc_3200',
    code: '3200',
    name: 'Saldo Laba Ditahan',
    classification: 'EKUITAS' as const,
    normalBalance: 'KREDIT' as const,
    balance: 0,
  };

  if (netIncome > 0) {
    // Net Profit: Credit Retained Earnings
    lines.push({
      accountId: retainedEarningsAcc.id,
      accountCode: retainedEarningsAcc.code,
      accountName: retainedEarningsAcc.name,
      description: `Tutup Buku Periode ${periodCode} - Pemindahan Laba Bersih ke Laba Ditahan`,
      debit: 0,
      credit: netIncome,
    });
  } else if (netIncome < 0) {
    // Net Loss: Debit Retained Earnings
    lines.push({
      accountId: retainedEarningsAcc.id,
      accountCode: retainedEarningsAcc.code,
      accountName: retainedEarningsAcc.name,
      description: `Tutup Buku Periode ${periodCode} - Pembebanan Rugi Bersih ke Laba Ditahan`,
      debit: Math.abs(netIncome),
      credit: 0,
    });
  }

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

  return {
    periodCode,
    totalRevenue,
    totalExpense,
    netIncome,
    lines,
    totalDebit,
    totalCredit,
    isBalanced: totalDebit === totalCredit,
  };
}

// CLOSE ACCOUNTING PERIOD & POST CLOSING JOURNAL
export function closeAccountingPeriod(periodCode: string, actor: User) {
  const periods = getStorageItem<AccountingPeriod[]>('accounting_periods', DEFAULT_PERIODS);
  const targetPeriodIndex = periods.findIndex((p) => p.periodCode === periodCode);

  if (targetPeriodIndex === -1) {
    throw new Error(`Periode akuntansi ${periodCode} tidak ditemukan.`);
  }

  const targetPeriod = periods[targetPeriodIndex];
  if (targetPeriod.status === 'TERKUNCI') {
    throw new Error(`Periode akuntansi ${periodCode} sudah dalam status TERKUNCI.`);
  }

  const preview = previewPeriodClosing(periodCode);
  let closingJournal: JournalEntry | undefined;

  // If there are nominal balances to transfer, post the closing journal entry
  if (preview.lines.length > 0 && preview.totalDebit > 0) {
    closingJournal = postJournalEntry(
      {
        referenceType: 'TUTUP_BUKU',
        referenceNo: `TB-${periodCode.replace('-', '')}`,
        description: `Jurnal Penutup Tutup Buku Akhir Periode ${periodCode} ke Akun 3200 Saldo Laba Ditahan`,
        lines: preview.lines,
      },
      actor
    );
  }

  // Update period status to TERKUNCI
  targetPeriod.status = 'TERKUNCI';
  targetPeriod.closedAt = new Date().toISOString();
  targetPeriod.closedBy = actor.name;
  targetPeriod.closingJournalId = closingJournal?.id;
  targetPeriod.netIncomeClosed = preview.netIncome;

  periods[targetPeriodIndex] = targetPeriod;
  setStorageItem('accounting_periods', periods);

  logAuditEvent(
    actor,
    'CLOSE_PERIOD',
    'PERIOD',
    periodCode,
    `Tutup buku bulanan periode ${periodCode} berhasil dilakukan. Status TERKUNCI. Laba/Rugi ditutup: Rp ${preview.netIncome.toLocaleString('id-ID')}`,
    closingJournal ? `No Jurnal Penutup: ${closingJournal.entryNo}` : 'Tidak ada saldo nominal berjalan'
  );

  return {
    period: targetPeriod,
    closingJournal,
    netIncome: preview.netIncome,
  };
}

// REOPEN ACCOUNTING PERIOD (RESTRICTED TO DIREKSI / ACCOUNTANT WITH AUDIT REASON)
export function reopenAccountingPeriod(periodCode: string, reason: string, actor: User) {
  if (actor.role !== 'DIREKSI' && actor.role !== 'FINANCE' && actor.role !== 'ACCOUNTANT') {
    throw new SeparationOfDutiesError('Pembukaan kembali periode akuntansi yang telah dikunci hanya berhak dilakukan oleh Direksi atau Pejabat Akuntansi.');
  }

  if (!reason || reason.trim().length < 10) {
    throw new Error('Alasan pembukaan kembali periode akuntansi wajib diisi minimal 10 karakter untuk kepatuhan jejak audit forensik.');
  }

  const periods = getStorageItem<AccountingPeriod[]>('accounting_periods', DEFAULT_PERIODS);
  const targetPeriodIndex = periods.findIndex((p) => p.periodCode === periodCode);

  if (targetPeriodIndex === -1) {
    throw new Error(`Periode akuntansi ${periodCode} tidak ditemukan.`);
  }

  const targetPeriod = periods[targetPeriodIndex];
  if (targetPeriod.status === 'TERBUKA') {
    throw new Error(`Periode akuntansi ${periodCode} sudah dalam status TERBUKA.`);
  }

  targetPeriod.status = 'TERBUKA';
  targetPeriod.reopenedAt = new Date().toISOString();
  targetPeriod.reopenedBy = actor.name;
  targetPeriod.reopenReason = reason;

  periods[targetPeriodIndex] = targetPeriod;
  setStorageItem('accounting_periods', periods);

  logAuditEvent(
    actor,
    'REOPEN_PERIOD',
    'PERIOD',
    periodCode,
    `Pembukaan kembali periode akuntansi ${periodCode} oleh ${actor.name} (${actor.role}). Alasan: ${reason}`,
    `Alasan otorisasi: ${reason}`
  );

  return targetPeriod;
}

// LAND ACQUISITION: RECORD LAND PARCEL PAYMENT
export function recordLandParcelPayment(
  parcelId: string,
  amount: number,
  bankAccountId: string,
  actor: User,
  notes?: string
) {
  if (amount <= 0) {
    throw new Error('Jumlah pembayaran tanah harus lebih besar dari Rp 0.');
  }

  const parcels = getStorageItem<LandParcel[]>('land_parcels', DEFAULT_LAND_PARCELS);
  const parcelIndex = parcels.findIndex((p) => p.id === parcelId);
  if (parcelIndex === -1) throw new Error('Data bidang tanah tidak ditemukan.');

  const parcel = parcels[parcelIndex];
  const bankAccounts = getStorageItem<BankAccount[]>('bank_accounts', DEFAULT_BANK_ACCOUNTS);
  const bankIndex = bankAccounts.findIndex((b) => b.id === bankAccountId);
  if (bankIndex === -1) throw new Error('Rekening bank sumber dana tidak ditemukan.');

  const bank = bankAccounts[bankIndex];
  if (bank.bookBalance < amount) {
    throw new Error(`Saldo rekening ${bank.bankName} (${bank.accountNumber}) tidak mencukupi. Saldo: Rp ${bank.bookBalance.toLocaleString('id-ID')}, Dibutuhkan: Rp ${amount.toLocaleString('id-ID')}`);
  }

  // Deduct Bank
  bank.bookBalance -= amount;
  bankAccounts[bankIndex] = bank;
  setStorageItem('bank_accounts', bankAccounts);

  // Update Parcel
  parcel.paidAmount += amount;
  parcel.remainingAmount = Math.max(0, parcel.agreedTotalAmount - parcel.paidAmount);
  if (parcel.paidAmount >= parcel.agreedTotalAmount) {
    parcel.paymentStatus = 'LUNAS';
  } else if (parcel.paidAmount > 0) {
    parcel.paymentStatus = 'TERMIN_BERJALAN';
  }
  parcels[parcelIndex] = parcel;
  setStorageItem('land_parcels', parcels);

  // Post Journal Entry (Debit WIP Lahan / Persediaan Tanah, Credit Bank)
  const journal = postJournalEntry(
    {
      referenceType: 'PEMBELIAN_LAHAN',
      referenceNo: parcel.parcelCode,
      description: `Pembayaran Pembebasan Lahan ${parcel.parcelCode} an. ${parcel.sellerName} (${notes || 'Termin Pembelian'})`,
      lines: [
        {
          accountId: 'acc_1160',
          accountCode: '1160',
          accountName: 'Pekerjaan Dalam Pelaksanaan (WIP Konstruksi & Lahan)',
          description: `Perolehan Lahan ${parcel.parcelCode} (${parcel.surveyedArea} m2)`,
          debit: amount,
          credit: 0,
        },
        {
          accountId: 'acc_1111',
          accountCode: '1111',
          accountName: 'Kas & Rekening Bank',
          description: `Pengeluaran via ${bank.bankName} - ${bank.accountNumber}`,
          debit: 0,
          credit: amount,
        },
      ],
    },
    actor
  );

  logAuditEvent(
    actor,
    'DISBURSE',
    'LAND',
    parcel.id,
    `Pembayaran Lahan ${parcel.parcelCode} Rp ${amount.toLocaleString('id-ID')} via ${bank.bankName}`,
    `Sisa utang lahan: Rp ${parcel.remainingAmount.toLocaleString('id-ID')}`
  );

  return { parcel, bank, journal };
}

// LAND ACQUISITION: RECORD NOTARY / PPAT FEE PAYMENT
export function recordNotaryFeePayment(
  parcelId: string,
  bankAccountId: string,
  actor: User
) {
  const parcels = getStorageItem<LandParcel[]>('land_parcels', DEFAULT_LAND_PARCELS);
  const parcelIndex = parcels.findIndex((p) => p.id === parcelId);
  if (parcelIndex === -1) throw new Error('Data bidang tanah tidak ditemukan.');

  const parcel = parcels[parcelIndex];
  if (parcel.notaryFeePaid) {
    throw new Error('Biaya notaris untuk bidang tanah ini sudah berstatus LUNAS.');
  }

  const bankAccounts = getStorageItem<BankAccount[]>('bank_accounts', DEFAULT_BANK_ACCOUNTS);
  const bankIndex = bankAccounts.findIndex((b) => b.id === bankAccountId);
  if (bankIndex === -1) throw new Error('Rekening bank sumber dana tidak ditemukan.');

  const bank = bankAccounts[bankIndex];
  const fee = parcel.notaryFee;
  if (bank.bookBalance < fee) {
    throw new Error(`Saldo rekening ${bank.bankName} tidak mencukupi untuk biaya notaris Rp ${fee.toLocaleString('id-ID')}.`);
  }

  // Deduct Bank
  bank.bookBalance -= fee;
  bankAccounts[bankIndex] = bank;
  setStorageItem('bank_accounts', bankAccounts);

  // Update Parcel
  parcel.notaryFeePaid = true;
  parcels[parcelIndex] = parcel;
  setStorageItem('land_parcels', parcels);

  // Post Journal (Kapitalisasi Biaya Notaris PPAT ke Aset Lahan sesuai SAK EP)
  const journal = postJournalEntry(
    {
      referenceType: 'BIAYA_NOTARIS',
      referenceNo: `NOTARIS-${parcel.parcelCode}`,
      description: `Pembayaran Honorarium Notaris & PPAT ${parcel.notaryName} untuk Akta Lahan ${parcel.parcelCode}`,
      lines: [
        {
          accountId: 'acc_1160',
          accountCode: '1160',
          accountName: 'Pekerjaan Dalam Pelaksanaan (WIP Konstruksi & Lahan)',
          description: `Kapitalisasi Biaya Akta PPJB/AJB Notaris ${parcel.notaryName}`,
          debit: fee,
          credit: 0,
        },
        {
          accountId: 'acc_1111',
          accountCode: '1111',
          accountName: 'Kas & Rekening Bank',
          description: `Pembayaran honorarium PPAT via ${bank.bankName}`,
          debit: 0,
          credit: fee,
        },
      ],
    },
    actor
  );

  logAuditEvent(
    actor,
    'DISBURSE',
    'NOTARY',
    parcel.id,
    `Pelunasan Honorarium Notaris/PPAT ${parcel.notaryName} Rp ${fee.toLocaleString('id-ID')} untuk ${parcel.parcelCode}`,
    `No Jurnal: ${journal.entryNo}`
  );

  return { parcel, bank, journal };
}

// UPDATE DOCUMENT CHECKLIST ITEM IN LAND PARCEL
export function updateLandDocumentChecklist(
  parcelId: string,
  docId: string,
  isVerified: boolean,
  actor: User,
  notes?: string
) {
  const parcels = getStorageItem<LandParcel[]>('land_parcels', DEFAULT_LAND_PARCELS);
  const parcelIndex = parcels.findIndex((p) => p.id === parcelId);
  if (parcelIndex === -1) throw new Error('Data bidang tanah tidak ditemukan.');

  const parcel = parcels[parcelIndex];
  const docIndex = parcel.documentChecklist.findIndex((d) => d.id === docId);
  if (docIndex === -1) throw new Error('Item checklist dokumen tidak ditemukan.');

  const doc = parcel.documentChecklist[docIndex];
  doc.isVerified = isVerified;
  doc.verifiedBy = isVerified ? actor.name : undefined;
  doc.verifiedAt = isVerified ? new Date().toISOString().split('T')[0] : undefined;
  if (notes !== undefined) {
    doc.notes = notes;
  }

  parcel.documentChecklist[docIndex] = doc;

  // Re-evaluate overall status
  const verifiedCount = parcel.documentChecklist.filter((d) => d.isVerified).length;
  const totalDocs = parcel.documentChecklist.length;

  if (verifiedCount === totalDocs) {
    parcel.overallVerificationStatus = 'LENGKAP';
  } else if (verifiedCount > 0) {
    parcel.overallVerificationStatus = 'DALAM_PROSES';
  } else {
    parcel.overallVerificationStatus = 'DOKUMEN_KURANG';
  }

  parcels[parcelIndex] = parcel;
  setStorageItem('land_parcels', parcels);

  logAuditEvent(
    actor,
    'VERIFY_DOC',
    'LAND',
    parcel.id,
    `Verifikasi Dokumen [${doc.documentName}] pada ${parcel.parcelCode}: ${isVerified ? 'SAH & TERVERIFIKASI' : 'BELUM TERVERIFIKASI'} oleh ${actor.name}`,
    doc.notes
  );

  return parcel;
}

// UPDATE CONVEYANCE STAGE (PROSES PERALIHAN HAK PPJB -> AJB -> BPN -> SHGB PT)
export function updateLandConveyanceStage(
  parcelId: string,
  stage: LandParcel['conveyanceStatus'],
  newCertNo: string | undefined,
  actor: User
) {
  const parcels = getStorageItem<LandParcel[]>('land_parcels', DEFAULT_LAND_PARCELS);
  const parcelIndex = parcels.findIndex((p) => p.id === parcelId);
  if (parcelIndex === -1) throw new Error('Data bidang tanah tidak ditemukan.');

  const parcel = parcels[parcelIndex];
  const oldStage = parcel.conveyanceStatus;
  parcel.conveyanceStatus = stage;
  if (newCertNo) {
    parcel.newCertificateNo = newCertNo;
  }

  parcels[parcelIndex] = parcel;
  setStorageItem('land_parcels', parcels);

  logAuditEvent(
    actor,
    'UPDATE',
    'LAND',
    parcel.id,
    `Pembaruan Tahapan Akta/Sertifikat ${parcel.parcelCode}: ${oldStage} -> ${stage}`,
    newCertNo ? `Nomor Sertifikat/Berkas: ${newCertNo}` : undefined
  );

  return parcel;
}

// CREATE NEW LAND PARCEL (INPUT DATA LAHAN BARU)
export function createLandParcel(
  input: {
    projectId: string;
    parcelCode: string;
    sellerName: string;
    sellerIdCard: string;
    sellerPhone: string;
    locationDescription: string;
    documentArea: number;
    surveyedArea: number;
    pricePerMeter: number;
    originalTitleType: LandParcel['originalTitleType'];
    originalTitleNo: string;
    notaryName: string;
    notaryOffice: string;
    notaryFee: number;
    topographyType?: LandParcel['topographyType'];
    cutFillVolumeM3?: number;
    cutFillCostPerM3?: number;
    cutFillProgressPercentage?: number;
    gpsCoordinates?: string;
    northBoundary?: string;
    southBoundary?: string;
    eastBoundary?: string;
    westBoundary?: string;
    surveyorName?: string;
    surveyDate?: string;
    legalDisputeStatus: LandParcel['legalDisputeStatus'];
  },
  actor: User
): LandParcel {
  if (!input.parcelCode.trim()) throw new Error('Kode bidang tanah wajib diisi.');
  if (!input.sellerName.trim()) throw new Error('Nama pemilik asal wajib diisi.');
  if (input.documentArea <= 0 || input.surveyedArea <= 0) {
    throw new Error('Luas dokumen dan luas ukur fisik harus lebih besar dari 0 m².');
  }
  if (input.pricePerMeter <= 0) {
    throw new Error('Harga kesepakatan per meter harus lebih besar dari Rp 0.');
  }

  const parcels = getStorageItem<LandParcel[]>('land_parcels', DEFAULT_LAND_PARCELS);
  const exists = parcels.some((p) => p.parcelCode.toUpperCase() === input.parcelCode.trim().toUpperCase());
  if (exists) {
    throw new Error(`Kode bidang tanah "${input.parcelCode}" sudah digunakan. Gunakan kode unik.`);
  }

  const areaVariance = input.surveyedArea - input.documentArea;
  const areaVariancePercentage = Number(((areaVariance / input.documentArea) * 100).toFixed(2));
  const areaToleranceStatus = Math.abs(areaVariancePercentage) > 1.0 ? 'HOLD_SELISIH_LUAS' : 'LOLOS';

  const agreedTotalAmount = Math.round(input.surveyedArea * input.pricePerMeter);
  const cutFillCostPerM3 = input.cutFillCostPerM3 || 45000;
  const cutFillVolumeM3 = input.cutFillVolumeM3 || 0;
  const cutFillTotalCost = Math.round(cutFillVolumeM3 * cutFillCostPerM3);

  // Pajak otomatis
  const bphtbAmount = Math.round(Math.max(0, agreedTotalAmount - 80000000) * 0.05); // NPOPTKP 80jt x 5%
  const pphPenjualAmount = Math.round(agreedTotalAmount * 0.025); // PPh Final 2.5%

  const id = 'lnd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  const defaultChecklist: LandParcel['documentChecklist'] = [
    { id: `${id}_chk_1`, documentType: 'KTP_KK_PEMILIK', documentName: `KTP & KK Pemilik (${input.sellerName})`, isVerified: false },
    { id: `${id}_chk_2`, documentType: 'SURAT_PERSETUJUAN_AHLI_WARIS', documentName: 'Surat Persetujuan Suami/Istri & Ahli Waris Lengkap', isVerified: false },
    { id: `${id}_chk_3`, documentType: 'SERTIFIKAT_ASLI_GIRIK', documentName: `Alas Hak Asli: ${input.originalTitleType} (${input.originalTitleNo})`, isVerified: false },
    { id: `${id}_chk_4`, documentType: 'SPPT_PBB_LUNAS', documentName: 'SPPT PBB 5 Tahun Terakhir & Bukti Lunas', isVerified: false },
    { id: `${id}_chk_5`, documentType: 'BERITA_ACARA_UKUR_BATAS', documentName: `Berita Acara Pengukuran Batas Fisik (${input.surveyedArea} m²)`, isVerified: false },
    { id: `${id}_chk_6`, documentType: 'AKTA_PPJB_NOTARIS', documentName: `Akta PPJB Notariil (${input.notaryName})`, isVerified: false },
    { id: `${id}_chk_7`, documentType: 'BUKTI_BAYAR_BPHTB', documentName: 'SSPD BPHTB & Validasi Pembayaran Bapenda', isVerified: false },
    { id: `${id}_chk_8`, documentType: 'AKTA_JUAL_BELI_AJB', documentName: 'Akta Jual Beli (AJB PPAT Resmi)', isVerified: false },
    { id: `${id}_chk_9`, documentType: 'SERTIFIKAT_HGB_PT', documentName: 'Sertifikat Induk HGB Terbit an. PT Developer', isVerified: false },
  ];

  const newParcel: LandParcel = {
    id,
    projectId: input.projectId,
    parcelCode: input.parcelCode.trim().toUpperCase(),
    sellerName: input.sellerName.trim(),
    sellerIdCard: input.sellerIdCard.trim(),
    sellerPhone: input.sellerPhone.trim(),
    locationDescription: input.locationDescription.trim(),
    documentArea: input.documentArea,
    surveyedArea: input.surveyedArea,
    areaVariance,
    areaVariancePercentage,
    areaToleranceStatus,
    pricePerMeter: input.pricePerMeter,
    agreedTotalAmount,
    paidAmount: 0,
    remainingAmount: agreedTotalAmount,
    paymentStatus: 'BELUM_DIBAYAR',
    originalTitleType: input.originalTitleType,
    originalTitleNo: input.originalTitleNo,
    notaryName: input.notaryName,
    notaryOffice: input.notaryOffice,
    notaryFee: input.notaryFee,
    notaryFeePaid: false,
    bphtbAmount,
    bphtbPaid: false,
    pphPenjualAmount,
    pphPenjualPaid: false,
    bpnCheckingFee: 500000,
    bpnTransferFee: 3000000,
    conveyanceStatus: 'DOKUMEN_AWAL',
    documentChecklist: defaultChecklist,
    overallVerificationStatus: 'DOKUMEN_KURANG',
    topographyType: input.topographyType || 'DATAR',
    cutFillVolumeM3,
    cutFillCostPerM3,
    cutFillTotalCost,
    cutFillProgressPercentage: input.cutFillProgressPercentage || 0,
    gpsCoordinates: input.gpsCoordinates,
    northBoundary: input.northBoundary,
    southBoundary: input.southBoundary,
    eastBoundary: input.eastBoundary,
    westBoundary: input.westBoundary,
    surveyorName: input.surveyorName,
    surveyDate: input.surveyDate || new Date().toISOString().split('T')[0],
    legalDisputeStatus: input.legalDisputeStatus,
    createdAt: new Date().toISOString(),
    createdBy: actor.name,
  };

  parcels.push(newParcel);
  setStorageItem('land_parcels', parcels);

  logAuditEvent(
    actor,
    'CREATE',
    'LAND',
    newParcel.id,
    `Pendaftaran Bidang Lahan Baru: ${newParcel.parcelCode} an. ${newParcel.sellerName} (${newParcel.surveyedArea} m²)`,
    `Toleransi: ${newParcel.areaToleranceStatus} (${newParcel.areaVariancePercentage > 0 ? `+${newParcel.areaVariancePercentage}%` : `${newParcel.areaVariancePercentage}%`}) · Nilai Kesepakatan: Rp ${agreedTotalAmount.toLocaleString('id-ID')}`
  );

  return newParcel;
}

// UPDATE LAND PARCEL (EDIT DATA LAHAN DENGAN ALASAN AUDIT)
export function updateLandParcel(
  parcelId: string,
  updates: Partial<LandParcel>,
  auditReason: string,
  actor: User
): LandParcel {
  if (!auditReason || auditReason.trim().length < 8) {
    throw new Error('Alasan perubahan data lahan wajib diisi minimal 8 karakter untuk memenuhi kepatuhan jejak audit.');
  }

  const parcels = getStorageItem<LandParcel[]>('land_parcels', DEFAULT_LAND_PARCELS);
  const parcelIndex = parcels.findIndex((p) => p.id === parcelId);
  if (parcelIndex === -1) throw new Error('Data bidang tanah tidak ditemukan.');

  const parcel = parcels[parcelIndex];
  const changesLog: string[] = [];

  // Update luas & toleransi
  const docArea = updates.documentArea !== undefined ? updates.documentArea : parcel.documentArea;
  const survArea = updates.surveyedArea !== undefined ? updates.surveyedArea : parcel.surveyedArea;

  if (updates.documentArea !== undefined && updates.documentArea !== parcel.documentArea) {
    changesLog.push(`Luas Dokumen: ${parcel.documentArea} m² -> ${updates.documentArea} m²`);
    parcel.documentArea = updates.documentArea;
  }
  if (updates.surveyedArea !== undefined && updates.surveyedArea !== parcel.surveyedArea) {
    changesLog.push(`Luas Ukur Fisik: ${parcel.surveyedArea} m² -> ${updates.surveyedArea} m²`);
    parcel.surveyedArea = updates.surveyedArea;
  }

  const newVariance = survArea - docArea;
  const newVariancePct = Number(((newVariance / docArea) * 100).toFixed(2));
  parcel.areaVariance = newVariance;
  parcel.areaVariancePercentage = newVariancePct;
  parcel.areaToleranceStatus = Math.abs(newVariancePct) > 1.0 ? 'HOLD_SELISIH_LUAS' : 'LOLOS';

  // Update harga / nilai
  if (updates.pricePerMeter !== undefined && updates.pricePerMeter !== parcel.pricePerMeter) {
    changesLog.push(`Harga/m²: Rp ${parcel.pricePerMeter.toLocaleString('id-ID')} -> Rp ${updates.pricePerMeter.toLocaleString('id-ID')}`);
    parcel.pricePerMeter = updates.pricePerMeter;
    parcel.agreedTotalAmount = Math.round(parcel.surveyedArea * updates.pricePerMeter);
    parcel.remainingAmount = Math.max(0, parcel.agreedTotalAmount - parcel.paidAmount);
    parcel.bphtbAmount = Math.round(Math.max(0, parcel.agreedTotalAmount - 80000000) * 0.05);
    parcel.pphPenjualAmount = Math.round(parcel.agreedTotalAmount * 0.025);
  }

  // Update pemilik / kontak
  if (updates.sellerName && updates.sellerName !== parcel.sellerName) {
    changesLog.push(`Pemilik: ${parcel.sellerName} -> ${updates.sellerName}`);
    parcel.sellerName = updates.sellerName;
  }
  if (updates.sellerIdCard && updates.sellerIdCard !== parcel.sellerIdCard) {
    parcel.sellerIdCard = updates.sellerIdCard;
  }
  if (updates.sellerPhone && updates.sellerPhone !== parcel.sellerPhone) {
    parcel.sellerPhone = updates.sellerPhone;
  }
  if (updates.locationDescription && updates.locationDescription !== parcel.locationDescription) {
    parcel.locationDescription = updates.locationDescription;
  }

  // Update legalitas & sengketa
  if (updates.legalDisputeStatus && updates.legalDisputeStatus !== parcel.legalDisputeStatus) {
    changesLog.push(`Status Hukum: ${parcel.legalDisputeStatus} -> ${updates.legalDisputeStatus}`);
    parcel.legalDisputeStatus = updates.legalDisputeStatus;
  }
  if (updates.originalTitleType && updates.originalTitleType !== parcel.originalTitleType) {
    parcel.originalTitleType = updates.originalTitleType;
  }
  if (updates.originalTitleNo && updates.originalTitleNo !== parcel.originalTitleNo) {
    parcel.originalTitleNo = updates.originalTitleNo;
  }

  // Update Cut and Fill
  if (updates.topographyType) parcel.topographyType = updates.topographyType;
  if (updates.cutFillVolumeM3 !== undefined) parcel.cutFillVolumeM3 = updates.cutFillVolumeM3;
  if (updates.cutFillCostPerM3 !== undefined) parcel.cutFillCostPerM3 = updates.cutFillCostPerM3;
  parcel.cutFillTotalCost = Math.round((parcel.cutFillVolumeM3 || 0) * (parcel.cutFillCostPerM3 || 0));
  if (updates.cutFillProgressPercentage !== undefined) {
    parcel.cutFillProgressPercentage = updates.cutFillProgressPercentage;
  }

  // Update Batas & GPS
  if (updates.gpsCoordinates !== undefined) parcel.gpsCoordinates = updates.gpsCoordinates;
  if (updates.northBoundary !== undefined) parcel.northBoundary = updates.northBoundary;
  if (updates.southBoundary !== undefined) parcel.southBoundary = updates.southBoundary;
  if (updates.eastBoundary !== undefined) parcel.eastBoundary = updates.eastBoundary;
  if (updates.westBoundary !== undefined) parcel.westBoundary = updates.westBoundary;
  if (updates.surveyorName !== undefined) parcel.surveyorName = updates.surveyorName;
  if (updates.surveyDate !== undefined) parcel.surveyDate = updates.surveyDate;

  // Update Notaris
  if (updates.notaryName) parcel.notaryName = updates.notaryName;
  if (updates.notaryOffice) parcel.notaryOffice = updates.notaryOffice;
  if (updates.notaryFee !== undefined) parcel.notaryFee = updates.notaryFee;

  parcel.updatedAt = new Date().toISOString();
  parcel.updatedBy = actor.name;

  parcels[parcelIndex] = parcel;
  setStorageItem('land_parcels', parcels);

  logAuditEvent(
    actor,
    'UPDATE',
    'LAND',
    parcel.id,
    `Edit Data Bidang Lahan ${parcel.parcelCode} oleh ${actor.name}. Alasan: ${auditReason}`,
    changesLog.length > 0 ? changesLog.join('; ') : 'Pembaruan data teknis/batas lahan'
  );

  return parcel;
}

// GET LAND AUDIT TRAIL FOR A SPECIFIC PARCEL OR ENTIRE LAND INVENTORY
export function getLandAuditEvents(parcelId?: string): AuditEvent[] {
  const events = getStorageItem<AuditEvent[]>('audit_events', []);
  return events.filter(
    (e) => (e.entityType === 'LAND' || e.entityType === 'NOTARY') && (!parcelId || e.entityId === parcelId)
  );
}

// SAVE LAND CUT & FILL CALCULATION WITH DETAILED COSTS & RAB INTEGRATION
export function saveLandCutFillCalculation(
  parcelId: string,
  calculation: CutFillCalculationDetail,
  actor: User
): { parcel: LandParcel; budgetItem?: BudgetItem } {
  const parcels = getStorageItem<LandParcel[]>('land_parcels', DEFAULT_LAND_PARCELS);
  const parcelIndex = parcels.findIndex((p) => p.id === parcelId);
  if (parcelIndex === -1) throw new Error('Data bidang tanah tidak ditemukan.');

  const parcel = parcels[parcelIndex];

  // Set calculation metadata
  calculation.parcelId = parcelId;
  calculation.calculatedAt = new Date().toISOString();
  calculation.calculatedBy = actor.name;

  // Recalculate summary metrics on parcel
  parcel.cutFillVolumeM3 = calculation.cutVolumeM3 + calculation.fillVolumeM3;
  parcel.cutFillCostPerM3 = calculation.effectiveCostPerM3;
  parcel.cutFillTotalCost = calculation.grandTotalCost;
  parcel.cutFillDetail = calculation;
  parcel.updatedAt = new Date().toISOString();
  parcel.updatedBy = actor.name;

  let targetBudgetItem: BudgetItem | undefined;

  if (calculation.integrateToRAB) {
    calculation.integratedAt = new Date().toISOString();
    calculation.integratedBy = actor.name;

    const budgetItems = getStorageItem<BudgetItem[]>('budget_items', DEFAULT_BUDGET_ITEMS);
    let itemIndex = budgetItems.findIndex((b) => b.id === calculation.targetBudgetItemId);

    if (itemIndex === -1) {
      itemIndex = budgetItems.findIndex(
        (b) => b.costCode === calculation.targetCostCode || b.category === 'EARTHWORKS'
      );
    }

    if (itemIndex !== -1) {
      targetBudgetItem = { ...budgetItems[itemIndex] };
      if (calculation.allocationType === 'REALISASI') {
        targetBudgetItem.realisasi += calculation.grandTotalCost;
      } else {
        targetBudgetItem.komitmenTerbuka += calculation.grandTotalCost;
      }
      budgetItems[itemIndex] = targetBudgetItem;
      setStorageItem('budget_items', budgetItems);
    }
  }

  parcels[parcelIndex] = parcel;
  setStorageItem('land_parcels', parcels);

  const integrationNote =
    calculation.integrateToRAB && targetBudgetItem
      ? `Terintegrasi ke Komponen RAB [${targetBudgetItem.costCode} - ${targetBudgetItem.description}] senilai Rp ${calculation.grandTotalCost.toLocaleString('id-ID')} (${calculation.allocationType}).`
      : 'Tersimpan secara internal pada kartu inventaris bidang tanah.';

  logAuditEvent(
    actor,
    'UPDATE',
    'LAND',
    parcel.id,
    `Kalkulasi Pematangan Lahan (Cut & Fill) Bidang ${parcel.parcelCode} oleh ${actor.name}`,
    `Vol Galian: ${calculation.cutVolumeM3} m³, Vol Urugan: ${calculation.fillVolumeM3} m³ (Netto: ${calculation.netBalanceM3 >= 0 ? '+' : ''}${calculation.netBalanceM3} m³), Kondisi: ${calculation.soilCategory}. Rincian: Sewa Alat Berat Rp ${calculation.totalEquipmentCost.toLocaleString('id-ID')}, BBM Solar Rp ${calculation.totalFuelCost.toLocaleString('id-ID')}, Alat Penunjang Rp ${calculation.totalSupportToolsCost.toLocaleString('id-ID')}, Jasa & Upah SDM Rp ${calculation.totalLaborCost.toLocaleString('id-ID')}. Grand Total: Rp ${calculation.grandTotalCost.toLocaleString('id-ID')} (Rp ${calculation.effectiveCostPerM3.toLocaleString('id-ID')}/m³). ${integrationNote}`
  );

  return { parcel, budgetItem: targetBudgetItem };
}



