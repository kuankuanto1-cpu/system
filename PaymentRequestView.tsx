/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  Building2,
  Printer,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { PaymentRequest, BudgetItem, BankAccount, User, Project } from '../types';
import { formatRupiah, terbilang } from '../services/currency';
import {
  createPaymentRequest,
  approvePaymentRequest,
  disbursePaymentRequest,
  checkBudgetGate,
} from '../services/ledgerEngine';

interface PaymentRequestViewProps {
  paymentRequests: PaymentRequest[];
  budgetItems: BudgetItem[];
  bankAccounts: BankAccount[];
  currentUser: User;
  project: Project;
  onRefreshData: () => void;
  onSelectPrintDoc: (type: string, docData: any) => void;
}

export const PaymentRequestView: React.FC<PaymentRequestViewProps> = ({
  paymentRequests,
  budgetItems,
  bankAccounts,
  currentUser,
  project,
  onRefreshData,
  onSelectPrintDoc,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDisburseModal, setShowDisburseModal] = useState<PaymentRequest | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // PPB Creation State
  const [payeeName, setPayeeName] = useState<string>('');
  const [payeeBank, setPayeeBank] = useState<string>('BCA');
  const [payeeAccountNo, setPayeeAccountNo] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState<string>(budgetItems[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(100000);
  const [itemDescription, setItemDescription] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [exceptionReason, setExceptionReason] = useState<string>('');

  // Selected budget info for real-time validation preview
  const currentBudgetItem = budgetItems.find((b) => b.id === selectedBudgetItemId);
  const requestedTotal = itemQty * itemUnitPrice;
  const currentAvailable = currentBudgetItem
    ? Math.max(0, currentBudgetItem.paguDisetujui - currentBudgetItem.realisasi - currentBudgetItem.komitmenTerbuka)
    : 0;
  const isBudgetExceeded = requestedTotal > currentAvailable && !isEmergency;

  const handleCreatePPB = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentBudgetItem) {
      setErrorMessage('Pilih item anggaran RAB.');
      return;
    }

    try {
      createPaymentRequest(
        {
          projectId: project.id,
          projectName: project.name,
          requestedBy: currentUser.id,
          requestedByName: currentUser.name,
          requestDate: new Date().toISOString().split('T')[0],
          dueDate,
          payeeName,
          payeeBank,
          payeeAccountNo,
          purpose,
          items: [
            {
              id: 'item_' + Date.now(),
              budgetItemId: currentBudgetItem.id,
              costCode: currentBudgetItem.costCode,
              description: itemDescription || currentBudgetItem.description,
              quantity: itemQty,
              unit: currentBudgetItem.unit,
              unitPrice: itemUnitPrice,
              amount: requestedTotal,
              evidenceDocName: 'Kuitansi & Surat Jalan Terlampir',
            },
          ],
          totalAmount: requestedTotal,
          isEmergencyException: isEmergency,
          exceptionReason: isEmergency ? exceptionReason : undefined,
        },
        currentUser
      );

      setSuccessMessage('Permohonan Pencairan Biaya (PPB) berhasil diterbitkan dan masuk ke antrean persetujuan.');
      setShowCreateModal(false);
      onRefreshData();
      // Reset form
      setPayeeName('');
      setPurpose('');
      setItemDescription('');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleApprove = (ppbId: string, decision: 'APPROVED' | 'REJECTED') => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      approvePaymentRequest(ppbId, currentUser, decision, decision === 'APPROVED' ? 'Disetujui sesuai pagu' : 'Ditolak');
      setSuccessMessage(`Dokumen PPB berhasil di-${decision === 'APPROVED' ? 'setujui' : 'tolak'} oleh ${currentUser.role}.`);
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDisburse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDisburseModal) return;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = disbursePaymentRequest(showDisburseModal.id, selectedBankId, currentUser);
      setSuccessMessage(`Pembayaran berhasil dicairkan! Jurnal umum ${res.journal.entryNo} otomatis terposting ke Buku Besar.`);
      setShowDisburseModal(null);
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Principle Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Prinsip: No RAB & No Detail = No Cash Release
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Separation of Duties (BR-003)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Permohonan Pencairan Biaya (PPB)
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Setiap pengeluaran kas wajib terikat pada cost code RAB, pagu anggaran tersedia, dan persetujuan bertingkat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setErrorMessage('');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan PPB Baru</span>
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="font-medium">{successMessage}</div>
          </div>
        )}
      </div>

      {/* PPB Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Daftar Transaksi Permohonan Pencairan</h2>
          <span className="text-xs text-slate-500">{paymentRequests.length} permohonan tercatat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">No. Dokumen</th>
                <th className="px-4 py-3">Tanggal & Jatuh Tempo</th>
                <th className="px-4 py-3">Penerima & Rekening</th>
                <th className="px-4 py-3">Keperluan / Uraian</th>
                <th className="px-4 py-3 text-right">Total Nominal</th>
                <th className="px-4 py-3">Status Otorisasi</th>
                <th className="px-4 py-3 text-right">Tindakan Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paymentRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                    Belum ada permohonan pencairan. Klik tombol <strong>+ Ajukan PPB Baru</strong> untuk memulai alur transaksi.
                  </td>
                </tr>
              ) : (
                paymentRequests.map((ppb) => {
                  const isRequester = ppb.requestedBy === currentUser.id;
                  const canApprove =
                    ppb.status.startsWith('MENUNGGU') &&
                    ppb.approvalChain.some((s) => s.role === currentUser.role && s.decision === 'PENDING') &&
                    !isRequester;

                  const canDisburse =
                    ppb.status === 'APPROVED' &&
                    (currentUser.role === 'CASHIER' || currentUser.role === 'FINANCE' || currentUser.role === 'DIREKSI');

                  return (
                    <tr key={ppb.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {ppb.documentNo}
                        {ppb.isEmergencyException && (
                          <span className="block text-[10px] font-sans font-bold text-rose-600">
                            [EXCEPTION DARURAT]
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">{ppb.requestDate}</div>
                        <div className="text-[11px] text-slate-400">Jatuh Tempo: {ppb.dueDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{ppb.payeeName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {ppb.payeeBank} - {ppb.payeeAccountNo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{ppb.purpose}</div>
                        <div className="text-[11px] text-slate-400">Pemohon: {ppb.requestedByName}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatRupiah(ppb.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold border ${
                            ppb.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ppb.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : ppb.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ppb.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* Approval actions */}
                        {canApprove && (
                          <>
                            <button
                              onClick={() => handleApprove(ppb.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleApprove(ppb.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {/* Governance disabled indicator if requester */}
                        {isRequester && ppb.status.startsWith('MENUNGGU') && (
                          <span className="text-[10px] text-amber-600 font-semibold italic">
                            (Pemohon dilarang approve)
                          </span>
                        )}

                        {/* Cashier disbursement action */}
                        {canDisburse && (
                          <button
                            onClick={() => setShowDisburseModal(ppb)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
                          >
                            Cairkan Kasir
                          </button>
                        )}

                        {/* Print action */}
                        <button
                          onClick={() => onSelectPrintDoc('PPB', ppb)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100"
                          title="Cetak Voucher PPB"
                        >
                          <Printer className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create PPB */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <h3 className="text-base font-bold text-slate-900">Pengajuan Permohonan Pencairan Biaya (PPB)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pastikan rincian item merujuk pada kode biaya RAB yang memiliki saldo pagu mencukupi.
            </p>

            <form onSubmit={handleCreatePPB} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nama Penerima / Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: CV Sumber Tanah Mandiri"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Bank & No. Rekening Penerima</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      required
                      placeholder="Bank"
                      value={payeeBank}
                      onChange={(e) => setPayeeBank(e.target.value)}
                      className="px-2 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="No. Rekening"
                      value={payeeAccountNo}
                      onChange={(e) => setPayeeAccountNo(e.target.value)}
                      className="col-span-2 px-2 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Keperluan Pembayaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran termin 2 hauling material tanah padat"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tanggal Jatuh Tempo Bayar</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Pilih Cost Code RAB Terkait</label>
                  <select
                    value={selectedBudgetItemId}
                    onChange={(e) => setSelectedBudgetItemId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  >
                    {budgetItems.map((b) => {
                      const avail = b.paguDisetujui - b.realisasi - b.komitmenTerbuka;
                      return (
                        <option key={b.id} value={b.id}>
                          {b.costCode} - {b.description} (Sisa: Rp {avail.toLocaleString('id-ID')})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Rincian Item Finansial */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                <div className="font-semibold text-slate-800 text-xs">Rincian Volume & Harga Satuan</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-0.5">Kuantitas ({currentBudgetItem?.unit})</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-600 text-[11px] mb-0.5">Harga Satuan (Rp)</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      required
                      value={itemUnitPrice}
                      onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">Sisa Pagu Item: </span>
                    <span className="font-bold text-slate-800 tabular-nums">{formatRupiah(currentAvailable)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold">Total Diminta: </span>
                    <span className="font-bold text-emerald-800 text-sm tabular-nums">
                      {formatRupiah(requestedTotal)}
                    </span>
                  </div>
                </div>

                {isBudgetExceeded && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-start gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Budget Overrun: Permohonan melebihi sisa anggaran tersedia! Transaksi akan diblokir oleh Budget Gate kecuali disetujui sebagai Exception Darurat.
                    </span>
                  </div>
                )}
              </div>

              {/* Exception override toggle */}
              <div className="p-3 border border-slate-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800 text-xs">
                    Pengajuan Exception Darurat (Lewati Budget Gate)
                  </span>
                </label>
                {isEmergency && (
                  <div className="mt-2">
                    <label className="block text-slate-600 text-[11px] mb-0.5">Alasan Darurat & Bukti Otorisasi</label>
                    <textarea
                      required
                      placeholder="Jelaskan alasan penambahan biaya darurat yang telah diizinkan Direksi..."
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBudgetExceeded && !isEmergency}
                  className={`px-4 py-2 rounded-lg font-semibold shadow-xs ${
                    isBudgetExceeded && !isEmergency
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  Terbitkan Permohonan (PPB)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Disburse PPB (Cashier Execution) */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Eksekusi Pencairan Kasir & Jurnal GL</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pencairan akan mendebit akun WIP Konstruksi dan mengkredit rekening bank sumber secara atomik.
            </p>

            <form onSubmit={handleDisburse} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. PPB:</span>
                  <span className="font-mono font-semibold text-slate-900">{showDisburseModal.documentNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penerima:</span>
                  <span className="font-semibold text-slate-900">{showDisburseModal.payeeName}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-800">Nominal Transfer:</span>
                  <span className="font-bold text-emerald-800 tabular-nums">
                    {formatRupiah(showDisburseModal.totalAmount)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 italic mt-1">
                  Terbilang: {terbilang(showDisburseModal.totalAmount)}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Pilih Rekening Bank Sumber</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - Saldo: Rp {b.bookBalance.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] space-y-1">
                <div className="font-bold">Otomatisasi Mesin Jurnal (Double-Entry):</div>
                <div className="font-mono text-[10px]">
                  [D] 1160 WIP Konstruksi: {formatRupiah(showDisburseModal.totalAmount)}
                  <br />
                  [K] 1111 Kas & Bank: {formatRupiah(showDisburseModal.totalAmount)}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(null)}
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
