/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Building2,
  CalendarClock,
  CreditCard,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { VendorInvoice, Party, BankAccount, User } from '../types';
import { formatRupiah } from '../services/currency';
import { postJournalEntry, logAuditEvent } from '../services/ledgerEngine';

interface PurchasePayablesViewProps {
  invoices: VendorInvoice[];
  parties: Party[];
  bankAccounts: BankAccount[];
  currentUser: User;
  onUpdateInvoices: (invoices: VendorInvoice[]) => void;
  onSelectPrintDoc: (type: string, docData: any) => void;
}

export const PurchasePayablesView: React.FC<PurchasePayablesViewProps> = ({
  invoices,
  parties,
  bankAccounts,
  currentUser,
  onUpdateInvoices,
  onSelectPrintDoc,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payBankId, setPayBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const totalOutstandingAP = invoices.filter((i) => i.status !== 'LUNAS').reduce((sum, i) => sum + i.remainingAmount, 0);

  const handlePayVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    const actualPay = Math.min(payAmount, selectedInvoice.remainingAmount);
    const updated = invoices.map((inv) => {
      if (inv.id === selectedInvoice.id) {
        const newPaid = inv.paidAmount + actualPay;
        const newRemaining = inv.netPayableAmount - newPaid;
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

    // Double-entry: Debit Utang Usaha (2110), Kredit Kas & Bank (1111) -> TIDAK mencatat beban ganda!
    postJournalEntry(
      {
        referenceType: 'PEMBAYARAN_UTANG',
        referenceNo: selectedInvoice.documentNo,
        description: `Pembayaran Utang Vendor: ${selectedInvoice.vendorName} (${selectedInvoice.description})`,
        lines: [
          {
            accountId: 'acc_2110',
            accountCode: '2110',
            accountName: 'Utang Usaha Pemasok & Vendor',
            description: `Pelunasan tagihan ${selectedInvoice.documentNo}`,
            debit: actualPay,
            credit: 0,
          },
          {
            accountId: 'acc_1111',
            accountCode: '1111',
            accountName: 'Kas & Rekening Bank',
            description: `Pengeluaran kas via bank`,
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
      `Pembayaran Utang Vendor ${selectedInvoice.documentNo} senilai Rp ${actualPay.toLocaleString('id-ID')}`
    );

    setStatusMessage(`Pembayaran tagihan vendor Rp ${actualPay.toLocaleString('id-ID')} berhasil diposting ke GL.`);
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
                Modul Pembelian & Utang (AP)
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">3-Way Matching & Pemotongan Pajak</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Hutang Usaha Vendor & Pemasok
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Jadwal jatuh tempo kewajiban, potongan pajak PP 9/2022, dan pelunasan utang tanpa pengakuan biaya ganda.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Total Utang Usaha Tersisa (AP)</div>
            <div className="text-lg font-bold text-rose-700 mt-0.5 tabular-nums">{formatRupiah(totalOutstandingAP)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Wajib dijadwalkan sesuai arus kas</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Jumlah Mitra Vendor Terdaftar</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
              {parties.filter((p) => p.type === 'VENDOR').length} Rekanan
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Kualifikasi konstruksi & NPWP terverifikasi</div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Daftar Tagihan Vendor (Accounts Payable)</h2>
          <span className="text-xs text-slate-500">{invoices.length} tagihan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">No. Invoice & PO</th>
                <th className="px-4 py-3">Nama Vendor</th>
                <th className="px-4 py-3">Uraian Transaksi</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3 text-right">Nilai Bruto</th>
                <th className="px-4 py-3 text-right">Potongan Pajak</th>
                <th className="px-4 py-3 text-right">Netto Utang</th>
                <th className="px-4 py-3 text-right">Sisa Tagihan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                    {inv.documentNo}
                    <span className="block text-[10px] text-slate-400 font-mono">PO: {inv.poNumber}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{inv.vendorName}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.description}</td>
                  <td className="px-4 py-3 text-slate-500">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(inv.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-rose-600 tabular-nums">{formatRupiah(inv.taxDeduction)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatRupiah(inv.netPayableAmount)}</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-700 tabular-nums">{formatRupiah(inv.remainingAmount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        inv.status === 'LUNAS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                        Bayar Utang
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPrintDoc('PO', inv)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100"
                      title="Cetak Purchase Order / Invoice"
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

      {/* Modal Bayar Utang Vendor */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Pembayaran Kewajiban Utang Vendor</h3>
            <p className="text-xs text-slate-500 mt-1">
              Aturan Akuntansi: Pelunasan utang mengurangi liabilitas dan kas tanpa menduplikasi pencatatan biaya.
            </p>

            <form onSubmit={handlePayVendor} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Vendor:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedInvoice.documentNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penerima:</span>
                  <span className="font-semibold text-slate-900">{selectedInvoice.vendorName}</span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                  <span>Sisa Tagihan:</span>
                  <span className="font-bold text-rose-700 tabular-nums">{formatRupiah(selectedInvoice.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Rekening Bank Pengeluaran</label>
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
                <label className="block text-slate-700 font-medium mb-1">Nominal yang Dibayarkan (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  max={selectedInvoice.remainingAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-rose-800"
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
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
