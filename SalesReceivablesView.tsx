/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BadgeDollarSign,
  Building,
  CreditCard,
  Printer,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PropertyUnit, CustomerInvoice, BankAccount, User } from '../types';
import { formatRupiah, terbilang } from '../services/currency';
import { postJournalEntry, logAuditEvent } from '../services/ledgerEngine';

interface SalesReceivablesViewProps {
  units: PropertyUnit[];
  invoices: CustomerInvoice[];
  bankAccounts: BankAccount[];
  currentUser: User;
  onUpdateInvoices: (invoices: CustomerInvoice[]) => void;
  onSelectPrintDoc: (type: string, docData: any) => void;
}

export const SalesReceivablesView: React.FC<SalesReceivablesViewProps> = ({
  units,
  invoices,
  bankAccounts,
  currentUser,
  onUpdateInvoices,
  onSelectPrintDoc,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payBankId, setPayBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const totalReceivables = invoices.filter((i) => i.status !== 'LUNAS').reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    const actualPay = Math.min(payAmount, selectedInvoice.remainingAmount);
    const updated = invoices.map((inv) => {
      if (inv.id === selectedInvoice.id) {
        const newPaid = inv.paidAmount + actualPay;
        const newRemaining = inv.grossAmount - newPaid;
        return {
          ...inv,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? ('LUNAS' as const) : ('DIBAYAR_SEBAGIAN' as const),
        };
      }
      return inv;
    });

    onUpdateInvoices(updated);

    // Double-entry: Debit Kas (1111), Kredit Piutang Usaha (1120) -> BUKAN pendapatan ganda!
    postJournalEntry(
      {
        referenceType: 'PELUNASAN_PIUTANG',
        referenceNo: selectedInvoice.documentNo,
        description: `Penerimaan Pelunasan Piutang Konsumen: ${selectedInvoice.customerName} (${selectedInvoice.termDescription})`,
        lines: [
          {
            accountId: 'acc_1111',
            accountCode: '1111',
            accountName: 'Kas & Rekening Bank',
            description: `Setoran via bank atas ${selectedInvoice.documentNo}`,
            debit: actualPay,
            credit: 0,
          },
          {
            accountId: 'acc_1120',
            accountCode: '1120',
            accountName: 'Piutang Usaha Konsumen',
            description: `Pengurangan piutang ${selectedInvoice.customerName}`,
            debit: 0,
            credit: actualPay,
          },
        ],
      },
      currentUser
    );

    logAuditEvent(
      currentUser,
      'POST_GL',
      'INVOICE',
      selectedInvoice.id,
      `Penerimaan Pelunasan Piutang ${selectedInvoice.documentNo} senilai Rp ${actualPay.toLocaleString('id-ID')}`
    );

    setStatusMessage(`Pelunasan Rp ${actualPay.toLocaleString('id-ID')} berhasil dibukukan!`);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Modul Penjualan & Piutang (AR)
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Pengawasan Jadwal Termin Konsumen</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Piutang Konsumen & Inventaris Unit
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Penelusuran umur piutang kavling, jadwal penagihan termin KPR/Inhouse, dan penerbitan kuitansi pelunasan berstempel.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 2 Stats */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Total Piutang Belum Tertagih</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">{formatRupiah(totalReceivables)}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Total Realisasi Penerimaan Kas</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">{formatRupiah(totalCollected)}</div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Jadwal Tagihan & Kartu Piutang Konsumen</h2>
          <span className="text-xs text-slate-500">{invoices.length} tagihan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">No. Invoice</th>
                <th className="px-4 py-3">Nama Konsumen</th>
                <th className="px-4 py-3">Termin Pembayaran</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3 text-right">Nilai Tagihan</th>
                <th className="px-4 py-3 text-right">Sudah Dibayar</th>
                <th className="px-4 py-3 text-right">Sisa Piutang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{inv.documentNo}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{inv.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.termDescription}</td>
                  <td className="px-4 py-3 text-slate-500">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(inv.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold tabular-nums">{formatRupiah(inv.paidAmount)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{formatRupiah(inv.remainingAmount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        inv.status === 'LUNAS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.status === 'DIBAYAR_SEBAGIAN'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {inv.remainingAmount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setPayAmount(inv.remainingAmount);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                      >
                        Terima Bayar
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPrintDoc('KUITANSI', inv)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100"
                      title="Cetak Kuitansi Resmi"
                    >
                      <Printer className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Terima Bayar Konsumen */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Catat Penerimaan Kas dari Konsumen</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pelunasan akan mengurangi piutang konsumen dan mendebit rekening bank penerima secara atomik.
            </p>

            <form onSubmit={handlePayInvoice} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedInvoice.documentNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Konsumen:</span>
                  <span className="font-semibold text-slate-900">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                  <span>Sisa Piutang:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(selectedInvoice.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Rekening Bank Penerima</label>
                <select
                  value={payBankId}
                  onChange={(e) => setPayBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - Saldo: Rp {b.bookBalance.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Nominal yang Diterima (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  max={selectedInvoice.remainingAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Konfirmasi Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
