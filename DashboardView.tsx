/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wallet,
  AlertTriangle,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarClock,
  Percent,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { BankAccount, Project, BudgetItem, PaymentRequest, VendorInvoice, CustomerInvoice, TaxRegisterItem } from '../types';
import { formatRupiah } from '../services/currency';

interface DashboardViewProps {
  bankAccounts: BankAccount[];
  project: Project;
  budgetItems: BudgetItem[];
  paymentRequests: PaymentRequest[];
  vendorInvoices: VendorInvoice[];
  customerInvoices: CustomerInvoice[];
  taxRegisters: TaxRegisterItem[];
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bankAccounts,
  project,
  budgetItems,
  paymentRequests,
  vendorInvoices,
  customerInvoices,
  taxRegisters,
  onNavigateTab,
}) => {
  // 1. Kas Analysis
  const totalBookCash = bankAccounts.reduce((sum, b) => sum + b.bookBalance, 0);
  const totalRestrictedCash = bankAccounts.reduce((sum, b) => sum + b.restrictedAmount, 0);
  const safeToSpendCash = Math.max(0, totalBookCash - totalRestrictedCash);

  // 2. Budget Analysis
  const totalPagu = budgetItems.reduce((sum, b) => sum + b.paguDisetujui, 0);
  const totalRealisasi = budgetItems.reduce((sum, b) => sum + b.realisasi, 0);
  const totalKomitmen = budgetItems.reduce((sum, b) => sum + b.komitmenTerbuka, 0);
  const sisaPaguTersedia = Math.max(0, totalPagu - totalRealisasi - totalKomitmen);
  const budgetUtilizationRate = totalPagu > 0 ? Math.round(((totalRealisasi + totalKomitmen) / totalPagu) * 100) : 0;

  // 3. AP/AR Aging & Due
  const totalAP = vendorInvoices.filter((v) => v.status !== 'LUNAS').reduce((sum, v) => sum + v.remainingAmount, 0);
  const totalAR = customerInvoices.filter((c) => c.status !== 'LUNAS').reduce((sum, c) => sum + c.remainingAmount, 0);

  // 4. Tax Liabilities
  const unpaidTax = taxRegisters.filter((t) => t.status !== 'DIBAYAR' && t.status !== 'DILAPORKAN_CORETAX').reduce((sum, t) => sum + t.taxAmount, 0);

  // 5. Pending approvals
  const pendingPPB = paymentRequests.filter((p) => p.status.startsWith('MENUNGGU'));

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Key Health Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Laporan Eksekutif Harian
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Periode Berjalan: Oktober 2026</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {project.name} (PT Cipta Graha Mandiri)
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Kendali terpadu kas, komitmen anggaran RAB, verifikasi dokumen, dan kepatuhan SAK EP 2025.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('dokumen')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 whitespace-nowrap"
            >
              Cetak Dokumen A4
            </button>
            <button
              onClick={() => onNavigateTab('pajak_laporan')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Buka Laporan Keuangan
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Financial KPI Cards (Answers: Uang ada di mana? Kas bebas vs terikat?) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kas Aman Digunakan */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kas Aman Dipakai (Free Cash)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(safeToSpendCash)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Terikat: {formatRupiah(totalRestrictedCash)}</span>
          </div>
        </div>

        {/* Card 2: Sisa Pagu Anggaran RAB */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sisa Anggaran RAB Tersedia</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(sisaPaguTersedia)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Terikat Komitmen: {formatRupiah(totalKomitmen)}
          </div>
        </div>

        {/* Card 3: Utang Vendor Jatuh Tempo */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Utang Usaha Vendor (AP)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(totalAP)}
          </div>
          <div className="mt-1 text-xs text-rose-600 font-medium">
            Wajib dijadwalkan bayar
          </div>
        </div>

        {/* Card 4: Piutang Konsumen Belum Tertagih */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Piutang Konsumen (AR)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(totalAR)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Termin & KPR berjalan
          </div>
        </div>
      </div>

      {/* Grid: Rekening Bank Detail & Kendali Anggaran RAB 4 Nilai */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Di mana Uang Berada & Siapa Pemegangnya */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Distribusi Rekening Bank & Kas</h2>
            </div>
            <button
              onClick={() => onNavigateTab('kas_bank')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Lihat Mutasi Kas →
            </button>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{acc.bankName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{acc.accountNumber}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Pemegang Kas: {acc.custodian}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatRupiah(acc.bookBalance)}
                  </div>
                  {acc.restrictedAmount > 0 && (
                    <div className="text-[10px] text-amber-600 font-medium">
                      Terikat: {formatRupiah(acc.restrictedAmount)}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Rekonsiliasi: {acc.lastReconciledAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Total Saldo Buku Tersimpan:</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">{formatRupiah(totalBookCash)}</span>
          </div>
        </div>

        {/* Right: Kendali 4 Indikator Anggaran RAB */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Kendali 4 Nilai Anggaran Proyek</h2>
            </div>
            <button
              onClick={() => onNavigateTab('proyek')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Rincian RAB & WBS →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Penyerapan Anggaran ({budgetUtilizationRate}%)</span>
                <span className="font-semibold text-slate-900">
                  {formatRupiah(totalRealisasi + totalKomitmen)} / {formatRupiah(totalPagu)}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full"
                  style={{ width: `${Math.min(100, (totalRealisasi / totalPagu) * 100)}%` }}
                  title="Realisasi Aktual"
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{ width: `${Math.min(100, (totalKomitmen / totalPagu) * 100)}%` }}
                  title="Komitmen Terbuka"
                />
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-xs bg-emerald-600" />
                  <span>Realisasi Terposting ({Math.round((totalRealisasi / totalPagu) * 100)}%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-xs bg-amber-400" />
                  <span>Komitmen Terbuka ({Math.round((totalKomitmen / totalPagu) * 100)}%)</span>
                </div>
              </div>
            </div>

            {/* 4 Values Breakdown Table */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 divide-y divide-slate-200/60 text-xs">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-600">1. Pagu Anggaran Disetujui</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(totalPagu)}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-600">2. Realisasi Biaya Aktual (Posted)</span>
                <span className="font-semibold text-emerald-700 tabular-nums">{formatRupiah(totalRealisasi)}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-600">3. Komitmen Terbuka (PO & SPK Berjalan)</span>
                <span className="font-semibold text-amber-700 tabular-nums">{formatRupiah(totalKomitmen)}</span>
              </div>
              <div className="py-1.5 flex justify-between font-bold text-slate-900">
                <span className="text-slate-800">4. Sisa Anggaran Bebas Tersedia</span>
                <span className="text-emerald-700 tabular-nums">{formatRupiah(sisaPaguTersedia)}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              *Aturan Sistem: Permohonan pencairan (PPB) yang melebihi Sisa Anggaran Bebas akan ditolak otomatis oleh Budget Gate.
            </div>
          </div>
        </div>
      </div>

      {/* Operational Alerts & Pending Actions (Separation of duties & governance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Approval Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Permohonan Menunggu Persetujuan ({pendingPPB.length})</h2>
            </div>
            <button
              onClick={() => onNavigateTab('ppb')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Proses Persetujuan →
            </button>
          </div>
          {pendingPPB.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              Tidak ada permohonan pencairan yang tertunda. Semua telah diproses.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {pendingPPB.map((ppb) => (
                <div key={ppb.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{ppb.documentNo}</div>
                    <div className="text-slate-500 text-[11px] truncate">{ppb.purpose} · Pemohon: {ppb.requestedByName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 tabular-nums">{formatRupiah(ppb.totalAmount)}</div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {ppb.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tax Obligations & Coretax Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Kewajiban Pajak Terutang (Coretax Ready)</h2>
            </div>
            <button
              onClick={() => onNavigateTab('pajak_laporan')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Lihat Register Pajak →
            </button>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {taxRegisters.map((tax) => (
              <div key={tax.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{tax.taxType.replace(/_/g, ' ')} ({tax.taxRatePercentage}%)</div>
                  <div className="text-slate-500 text-[11px]">Rujukan: {tax.taxRuleReference}</div>
                  <div className="text-[10px] text-slate-400">Jatuh Tempo Bayar: {tax.paymentDueDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 tabular-nums">{formatRupiah(tax.taxAmount)}</div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Status: {tax.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Total Pajak Terutang:</span>
            <span className="font-bold text-rose-700 tabular-nums">{formatRupiah(unpaidTax)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
