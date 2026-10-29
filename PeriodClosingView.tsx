/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  FileText,
  Clock,
  Sparkles,
  BookOpenCheck,
} from 'lucide-react';
import { AccountingPeriod, User, JournalEntry, AccountCOA } from '../types';
import { formatRupiah } from '../services/currency';
import {
  closeAccountingPeriod,
  reopenAccountingPeriod,
  previewPeriodClosing,
} from '../services/ledgerEngine';

interface PeriodClosingViewProps {
  periods: AccountingPeriod[];
  coa: AccountCOA[];
  journalEntries: JournalEntry[];
  currentUser: User;
  onRefreshData: () => void;
}

export const PeriodClosingView: React.FC<PeriodClosingViewProps> = ({
  periods,
  coa,
  journalEntries,
  currentUser,
  onRefreshData,
}) => {
  const [selectedPeriodCode, setSelectedPeriodCode] = useState<string>('2026-10');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPeriod = periods.find((p) => p.periodCode === selectedPeriodCode) || periods[0];
  const preview = previewPeriodClosing(selectedPeriodCode);

  const isDireksiOrFinance =
    currentUser.role === 'DIREKSI' ||
    currentUser.role === 'FINANCE' ||
    currentUser.role === 'ACCOUNTANT';

  // Closing journals in history
  const closingJournals = journalEntries.filter((j) => j.referenceType === 'TUTUP_BUKU');

  const handleClosePeriod = () => {
    try {
      setErrorMessage(null);
      const res = closeAccountingPeriod(selectedPeriodCode, currentUser);
      setIsConfirmModalOpen(false);
      setSuccessMessage(
        `Periode ${selectedPeriodCode} berhasil DITUTUP & TERKUNCI! Laba/Rugi ${formatRupiah(
          res.netIncome
        )} telah dipindahkan ke Saldo Laba Ditahan (Akun 3200).`
      );
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal melakukan tutup buku.');
    }
  };

  const handleReopenPeriod = () => {
    try {
      setErrorMessage(null);
      reopenAccountingPeriod(selectedPeriodCode, reopenReason, currentUser);
      setIsReopenModalOpen(false);
      setReopenReason('');
      setSuccessMessage(
        `Periode ${selectedPeriodCode} berhasil dibuka kembali. Jejak audit otorisasi telah tersimpan.`
      );
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuka kembali periode.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              SAK EP 2025 · Bagian 3 & 4
            </span>
            <span className="text-xs text-slate-500 font-medium">Modul Tutup Buku & Ledger Lock</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Tutup Buku Bulanan & Penguncian Periode</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Menjalankan proses penutupan akun nominal (Pendapatan & Beban/HPP), pemindahan laba bersih ke{' '}
            <strong className="text-slate-900 font-semibold">Akun 3200 (Saldo Laba Ditahan)</strong>, serta
            mengunci periode akuntansi untuk mencegah modifikasi mundur (<span className="italic">anti-backdating</span>).
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-center border border-slate-200">
          {periods.map((p) => (
            <button
              key={p.periodCode}
              onClick={() => {
                setSelectedPeriodCode(p.periodCode);
                setSuccessMessage(null);
                setErrorMessage(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedPeriodCode === p.periodCode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.status === 'TERKUNCI' ? (
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {p.periodCode}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Sukses Tutup Buku</div>
            <div>{successMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Peringatan Operasi</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Current Selected Period Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status Periode</div>
          <div className="mt-2 flex items-center gap-2">
            {selectedPeriod.status === 'TERKUNCI' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Lock className="w-3.5 h-3.5" /> TERKUNCI (CLOSED)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Unlock className="w-3.5 h-3.5" /> TERBUKA (ACTIVE)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {selectedPeriod.status === 'TERKUNCI'
              ? `Terkunci pada: ${selectedPeriod.closedAt?.slice(0, 10)} oleh ${selectedPeriod.closedBy || 'Sistem'}`
              : 'Transaksi jurnal umum masih dapat dibukukan'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pendapatan (4100)</div>
          <div className="mt-2 text-xl font-bold text-emerald-600">
            {formatRupiah(preview.totalRevenue)}
          </div>
          <div className="text-xs text-slate-500 mt-2">Saldo nominal akun pendapatan periode ini</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Beban & HPP (5100, 6100)</div>
          <div className="mt-2 text-xl font-bold text-rose-600">
            {formatRupiah(preview.totalExpense)}
          </div>
          <div className="text-xs text-slate-500 mt-2">HPP proyek dan beban operasional</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Laba Bersih Ditutup (3200)</div>
          <div className={`mt-2 text-xl font-bold ${preview.netIncome >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
            {formatRupiah(preview.netIncome)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {preview.netIncome >= 0 ? 'Surplus Laba Ditahan' : 'Defisit Rugi Periode'}
          </div>
        </div>
      </div>

      {/* Action and Preview Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-emerald-600" />
              Rancangan Jurnal Penutup (<span className="font-mono">Closing Entry</span>) — Periode {selectedPeriodCode}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Otomatis mendebit akun pendapatan, mengkredit akun beban, dan menyeimbangkan selisih ke Akun 3200 Saldo Laba Ditahan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedPeriod.status === 'TERBUKA' ? (
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Tutup Buku Periode {selectedPeriodCode}
              </button>
            ) : (
              isDireksiOrFinance && (
                <button
                  onClick={() => setIsReopenModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  Buka Kembali Periode (Reopen)
                </button>
              )
            )}
          </div>
        </div>

        {/* Journal Lines Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Kode Akun</th>
                <th className="px-4 py-3">Nama Akun COA</th>
                <th className="px-4 py-3">Keterangan Baris Jurnal</th>
                <th className="px-4 py-3 text-right">Debit (Rp)</th>
                <th className="px-4 py-3 text-right">Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {preview.lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans">
                    Tidak ada saldo nominal berjalan pada periode {selectedPeriodCode} (semua akun nominal nol atau sudah ditutup).
                  </td>
                </tr>
              ) : (
                preview.lines.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{l.accountCode}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-800">{l.accountName}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-600">{l.description}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {l.debit > 0 ? formatRupiah(l.debit) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {l.credit > 0 ? formatRupiah(l.credit) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right font-sans text-slate-700">
                  Total Debit & Kredit (Keseimbangan Jurnal Sempurna):
                </td>
                <td className="px-4 py-3 text-right text-emerald-700 font-mono">
                  {formatRupiah(preview.totalDebit)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-700 font-mono">
                  {formatRupiah(preview.totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Status Verification Badge */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {preview.isBalanced ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SAK EP Seimbang: Total Debit == Total Kredit (Selisih Rp 0)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-100 px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Jurnal Tidak Seimbang!
              </span>
            )}
          </div>
          <div className="text-slate-500 font-medium">
            Aturan Bisnis: Akun 4100 di-debit, Akun 5100 & 6100 di-kredit, Saldo Laba Ditahan (3200) menampung net profit.
          </div>
        </div>
      </div>

      {/* History of Period Closings & Journals */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Riwayat Penutupan Buku & Jurnal Penutup</h3>
            <p className="text-xs text-slate-500">Daftar periode yang telah ditutup dan dikunci dalam sistem</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full">
            {periods.filter((p) => p.status === 'TERKUNCI').length} Periode Terkunci
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Rentang Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waktu Penutupan</th>
                <th className="px-4 py-3">Petugas Penutup</th>
                <th className="px-4 py-3 text-right">Laba Ditutup (Rp)</th>
                <th className="px-4 py-3">Catatan / Reopen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map((p) => (
                <tr key={p.periodCode} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{p.periodCode}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {p.startDate} s/d {p.endDate}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'TERKUNCI' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                        <Lock className="w-3 h-3" /> TERKUNCI
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <Unlock className="w-3 h-3" /> TERBUKA
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.closedAt ? p.closedAt.slice(0, 16).replace('T', ' ') : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.closedBy || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {p.netIncomeClosed !== undefined ? formatRupiah(p.netIncomeClosed) : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.reopenReason ? (
                      <span className="text-amber-700 italic">Dibuka kembali: {p.reopenReason}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Closing */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Konfirmasi Tutup Buku Periode {selectedPeriodCode}</h3>
                <p className="text-xs text-slate-500">Penguncian Buku Besar & Pemindahan Laba Ditahan</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex justify-between">
                <span>Pendapatan dipindahkan:</span>
                <span className="font-bold text-emerald-600">{formatRupiah(preview.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Beban & HPP dinolkan:</span>
                <span className="font-bold text-rose-600">{formatRupiah(preview.totalExpense)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span>Ditransfer ke Saldo Laba Ditahan (3200):</span>
                <span className="text-blue-700">{formatRupiah(preview.netIncome)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Konsekuensi Penguncian Periode:</strong> Setelah periode berstatus{' '}
                <span className="font-bold">TERKUNCI</span>, sistem akan menolak seluruh pencatatan jurnal baru bertanggal pada periode ini untuk mencegah manipulasi mundur (<span className="italic">anti-backdating</span>).
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClosePeriod}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ya, Kunci Periode & Tutup Buku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Buka Kembali Periode {selectedPeriodCode}</h3>
                <p className="text-xs text-slate-500">Otorisasi Khusus Direksi / Pejabat Akuntansi</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Alasan Pembukaan Kembali Periode (Wajib untuk Audit Forensik):
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Contoh: Koreksi faktur pajak masukan terlewat dari supplier beton sesuai persetujuan Direksi No. 44/SK/DIR."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500">
                Alasan ini akan dicatat permanen dalam Jejak Audit (Audit Trail) beserta identitas login Anda ({currentUser.name} - {currentUser.role}).
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReopenPeriod}
                disabled={reopenReason.trim().length < 10}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                Buka Kembali Periode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
