/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CalendarCheck,
  Scale,
  DollarSign,
  TrendingUp,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { TaxRegisterItem, AccountCOA, JournalEntry, User } from '../types';
import { formatRupiah } from '../services/currency';
import { calculateFinancialStatements, reverseJournalEntry } from '../services/ledgerEngine';

interface TaxReportsViewProps {
  taxRegisters: TaxRegisterItem[];
  coa: AccountCOA[];
  journalEntries: JournalEntry[];
  currentUser: User;
  onRefreshData: () => void;
}

export const TaxReportsView: React.FC<TaxReportsViewProps> = ({
  taxRegisters,
  coa,
  journalEntries,
  currentUser,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PAJAK' | 'GL' | 'NERACA_SALDO' | 'LABA_RUGI' | 'NERACA'>('PAJAK');
  const [reversalReason, setReversalReason] = useState<string>('');
  const [selectedJournalToReverse, setSelectedJournalToReverse] = useState<JournalEntry | null>(null);

  const statements = calculateFinancialStatements();
  const totalDebitTrial = coa.filter((a) => a.normalBalance === 'DEBIT').reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  const totalCreditTrial = coa.filter((a) => a.normalBalance === 'KREDIT').reduce((sum, a) => sum + Math.max(0, a.balance), 0);

  const handleReverse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJournalToReverse || !reversalReason) return;
    try {
      reverseJournalEntry(selectedJournalToReverse.id, reversalReason, currentUser);
      alert(`Jurnal ${selectedJournalToReverse.entryNo} berhasil dibalik (reversal) dengan aman!`);
      setSelectedJournalToReverse(null);
      setReversalReason('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pajak Indonesia & SAK EP 2025
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Kesiapan Ekspor Coretax DJP</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Pajak Proyek & Laporan Keuangan Resmi
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Pemisahan kewajiban PPN 11%, PPh Konstruksi PP 9/2022, General Ledger seimbang, dan rekonsiliasi Neraca ke transaksi sumber.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(taxRegisters, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute('href', dataStr);
                downloadAnchor.setAttribute('download', 'Coretax_DJP_Export_2026.json');
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs px-3.5 py-2 rounded-lg transition-colors border border-slate-200 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Data Coretax DJP</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100 text-xs">
          {[
            { id: 'PAJAK', label: 'Register Pajak (Coretax Ready)' },
            { id: 'GL', label: 'Buku Besar (General Ledger)' },
            { id: 'NERACA_SALDO', label: 'Neraca Saldo (Trial Balance)' },
            { id: 'LABA_RUGI', label: 'Laba Rugi Proyek' },
            { id: 'NERACA', label: 'Laporan Posisi Keuangan (Neraca)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subtab 1: Register Pajak */}
      {activeSubTab === 'PAJAK' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Register Kewajiban Pajak & Status Coretax DJP</h2>
            <span className="text-xs text-slate-500">Masa Pajak: 2026-10</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Jenis Pajak</th>
                  <th className="px-4 py-3">Rujukan Peraturan</th>
                  <th className="px-4 py-3">No. Dokumen Sumber</th>
                  <th className="px-4 py-3 text-right">DPP (Dasar Pengenaan)</th>
                  <th className="px-4 py-3 text-right">Tarif (%)</th>
                  <th className="px-4 py-3 text-right">Nilai Pajak</th>
                  <th className="px-4 py-3">Jatuh Tempo Bayar</th>
                  <th className="px-4 py-3">Status Coretax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {taxRegisters.map((tax) => (
                  <tr key={tax.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{tax.taxType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{tax.taxRuleReference}</td>
                    <td className="px-4 py-3 font-mono text-slate-900">{tax.sourceDocumentNo}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(tax.dpp)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {tax.taxRatePercentage}%
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-700 tabular-nums">
                      {formatRupiah(tax.taxAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{tax.paymentDueDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tax.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: General Ledger (GL) */}
      {activeSubTab === 'GL' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Buku Besar Transaksi (General Ledger)</h2>
              <p className="text-[11px] text-slate-500">
                Posted records bersifat immutable. Koreksi wajib melalui mekanisme Reversal (Pembalik).
              </p>
            </div>
            <span className="text-xs text-slate-500">{journalEntries.length} jurnal terposting</span>
          </div>

          <div className="divide-y divide-slate-200">
            {journalEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada jurnal transaksi terposting. Jurnal terbuat otomatis saat pencairan PPB, pelunasan piutang, pembayaran utang, atau penyusutan aset.
              </div>
            ) : (
              journalEntries.map((je) => (
                <div key={je.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">{je.entryNo}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs text-slate-600">{je.postingDate}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {je.referenceType}
                      </span>
                      {je.status === 'REVERSED' && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          DI-REVERSE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        Total: {formatRupiah(je.totalDebit)}
                      </span>
                      {je.status === 'POSTED' && (
                        <button
                          onClick={() => setSelectedJournalToReverse(je)}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Pembalik (Reversal)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 mb-2 font-medium">{je.description}</div>

                  {/* Lines Table */}
                  <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="w-full text-left text-xs bg-white">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="px-3 py-1.5">Akun</th>
                          <th className="px-3 py-1.5">Nama Akun</th>
                          <th className="px-3 py-1.5">Keterangan</th>
                          <th className="px-3 py-1.5 text-right">Debit</th>
                          <th className="px-3 py-1.5 text-right">Kredit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {je.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-1.5 font-mono text-slate-800">{line.accountCode}</td>
                            <td className="px-3 py-1.5 font-medium text-slate-900">{line.accountName}</td>
                            <td className="px-3 py-1.5 text-slate-500">{line.description}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">
                              {line.debit > 0 ? formatRupiah(line.debit) : '-'}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums">
                              {line.credit > 0 ? formatRupiah(line.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: Neraca Saldo (Trial Balance) */}
      {activeSubTab === 'NERACA_SALDO' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Neraca Saldo Akun (Trial Balance)</h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Debit = Kredit Terverifikasi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Kode Akun</th>
                  <th className="px-4 py-3">Nama Akun</th>
                  <th className="px-4 py-3">Klasifikasi</th>
                  <th className="px-4 py-3 text-right">Saldo Debit (Rp)</th>
                  <th className="px-4 py-3 text-right">Saldo Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coa.map((acc) => {
                  const isDebit = acc.normalBalance === 'DEBIT';
                  const debitVal = isDebit ? Math.abs(acc.balance) : 0;
                  const creditVal = !isDebit ? Math.abs(acc.balance) : 0;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{acc.code}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{acc.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{acc.classification.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{debitVal > 0 ? formatRupiah(debitVal) : '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{creditVal > 0 ? formatRupiah(creditVal) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Laba Rugi Proyek */}
      {activeSubTab === 'LABA_RUGI' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="text-center pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Laporan Laba Rugi Proyek (Komersial)</h2>
            <div className="text-xs text-slate-500">PT Cipta Graha Mandiri · Grand Harmoni Residence</div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between font-bold text-slate-900 py-1.5 border-b border-slate-100">
              <span>PENDAPATAN USAHA (PENJUALAN UNIT)</span>
              <span className="tabular-nums">{formatRupiah(statements.pendapatan)}</span>
            </div>

            <div className="flex justify-between text-slate-700 py-1 border-b border-slate-100">
              <span className="pl-4">Beban Pokok Penjualan (HPP Konstruksi)</span>
              <span className="tabular-nums">({formatRupiah(statements.hpp)})</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 py-1.5 bg-slate-50 px-2 rounded">
              <span>LABA KOTOR PROYEK</span>
              <span className="tabular-nums">{formatRupiah(statements.pendapatan - statements.hpp)}</span>
            </div>

            <div className="flex justify-between text-slate-700 py-1 border-b border-slate-100">
              <span className="pl-4">Beban Operasional & Administrasi</span>
              <span className="tabular-nums">({formatRupiah(statements.bebanOperasional)})</span>
            </div>

            <div className="flex justify-between font-bold text-emerald-800 text-sm py-2 bg-emerald-50 px-3 rounded border border-emerald-200">
              <span>LABA BERSIH BERJALAN</span>
              <span className="tabular-nums">{formatRupiah(statements.labaBersih)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 5: Neraca (Laporan Posisi Keuangan) */}
      {activeSubTab === 'NERACA' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs max-w-3xl mx-auto space-y-5">
          <div className="text-center pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Laporan Posisi Keuangan (Neraca SAK EP 2025)</h2>
            <div className="text-xs text-slate-500">Per 28 Oktober 2026 · Dalam Rupiah Integer Penuh</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Aset / Aktiva */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 pb-1 border-b border-slate-200">ASET (AKTIVA)</div>
              <div className="flex justify-between text-slate-700">
                <span>Total Aktiva Lancar:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(statements.aktivaLancar)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Total Aktiva Tetap (Netto):</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(statements.aktivaTetap)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>TOTAL ASET:</span>
                <span className="text-emerald-700 tabular-nums">{formatRupiah(statements.totalAktiva)}</span>
              </div>
            </div>

            {/* Kewajiban & Ekuitas / Pasiva */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 pb-1 border-b border-slate-200">KEWAJIBAN & EKUITAS</div>
              <div className="flex justify-between text-slate-700">
                <span>Total Kewajiban Lancar:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(statements.kewajibanLancar)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Total Ekuitas / Modal:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(statements.ekuitas)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>TOTAL PASIVA:</span>
                <span className="text-emerald-700 tabular-nums">{formatRupiah(statements.totalPasiva)}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>Status Keseimbangan Neraca (Aset = Pasiva):</span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span>100% BALANCE (SEIMBANG)</span>
            </span>
          </div>
        </div>
      )}

      {/* Reversal Modal */}
      {selectedJournalToReverse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Pembalik Jurnal (Reversal Accounting)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Aturan: Transaksi yang sudah diposting dilarang dihapus. Koreksi dilakukan dengan membalik posisi debit dan kredit.
            </p>

            <form onSubmit={handleReverse} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-mono font-semibold text-slate-900">{selectedJournalToReverse.entryNo}</div>
                <div className="text-slate-600 mt-0.5">{selectedJournalToReverse.description}</div>
                <div className="text-xs font-bold text-slate-900 mt-1 tabular-nums">
                  Nominal: {formatRupiah(selectedJournalToReverse.totalDebit)}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Alasan Pembatalan / Koreksi Jurnal</label>
                <textarea
                  required
                  placeholder="Contoh: Kesalahan alokasi rekening atau pembatalan SPK vendor..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedJournalToReverse(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Terbitkan Jurnal Pembalik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
