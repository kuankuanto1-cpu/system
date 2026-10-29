/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Landmark,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
  Plus,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { BankAccount, User } from '../types';
import { formatRupiah } from '../services/currency';
import { postJournalEntry, logAuditEvent } from '../services/ledgerEngine';

interface CashBankViewProps {
  bankAccounts: BankAccount[];
  currentUser: User;
  onUpdateBankAccounts: (accounts: BankAccount[]) => void;
}

export const CashBankView: React.FC<CashBankViewProps> = ({
  bankAccounts,
  currentUser,
  onUpdateBankAccounts,
}) => {
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [sourceBankId, setSourceBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [targetBankId, setTargetBankId] = useState<string>(bankAccounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(50000000);
  const [transferType, setTransferType] = useState<'INTERNAL' | 'TALANGAN'>('INTERNAL');
  const [transferNotes, setTransferNotes] = useState<string>('Pemindahan kas operasional ke kas proyek');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const totalBookCash = bankAccounts.reduce((sum, b) => sum + b.bookBalance, 0);
  const totalRestricted = bankAccounts.reduce((sum, b) => sum + b.restrictedAmount, 0);
  const freeCash = Math.max(0, totalBookCash - totalRestricted);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceBankId === targetBankId) {
      alert('Rekening sumber dan tujuan tidak boleh sama.');
      return;
    }

    const source = bankAccounts.find((b) => b.id === sourceBankId);
    const target = bankAccounts.find((b) => b.id === targetBankId);

    if (!source || !target) return;
    if (source.bookBalance < transferAmount) {
      alert(`Saldo ${source.bankName} tidak mencukupi untuk transfer Rp ${transferAmount.toLocaleString('id-ID')}.`);
      return;
    }

    // 1. Mutate balances
    const updated = bankAccounts.map((b) => {
      if (b.id === sourceBankId) return { ...b, bookBalance: b.bookBalance - transferAmount };
      if (b.id === targetBankId) return { ...b, bookBalance: b.bookBalance + transferAmount };
      return b;
    });

    onUpdateBankAccounts(updated);

    // 2. Post Journal Entry
    // Transfer internal: Bank Tujuan (Debit), Bank Asal (Kredit) -> BUKAN PENDAPATAN / BEBAN!
    postJournalEntry(
      {
        referenceType: 'PENYESUAIAN',
        referenceNo: `TRF-${Date.now().toString().slice(-6)}`,
        description: `Transfer Kas ${transferType === 'TALANGAN' ? 'Dana Talangan' : 'Internal'}: ${source.bankName} ke ${target.bankName} (${transferNotes})`,
        lines: [
          {
            accountId: 'acc_1111',
            accountCode: '1111',
            accountName: 'Kas & Rekening Bank',
            description: `Penerimaan transfer pada ${target.bankName}`,
            debit: transferAmount,
            credit: 0,
          },
          {
            accountId: 'acc_1111',
            accountCode: '1111',
            accountName: 'Kas & Rekening Bank',
            description: `Pengeluaran transfer dari ${source.bankName}`,
            debit: 0,
            credit: transferAmount,
          },
        ],
      },
      currentUser
    );

    logAuditEvent(
      currentUser,
      'POST_GL',
      'BANK',
      source.id,
      `Transfer Kas Rp ${transferAmount.toLocaleString('id-ID')} dari ${source.bankName} ke ${target.bankName} (Bukan Pendapatan/Beban)`
    );

    setStatusMessage(`Transfer kas Rp ${transferAmount.toLocaleString('id-ID')} berhasil dibukukan dengan aman.`);
    setShowTransferModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pusat Rekonsiliasi Kas & Bank
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Pengawasan Dana Terikat</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Kas & Rekening Bank Perusahaan
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Penelusuran fisik keberadaan uang, pejabat pemegang rekening, rekonsiliasi berkala, dan pemisahan dana aman digunakan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer Kas / Antar-Rekening</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 3 Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Total Kas di Bank (Saldo Buku)</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">{formatRupiah(totalBookCash)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Akumulasi seluruh rekening resmi</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Dana Terikat (Restricted Cash)</div>
            <div className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">{formatRupiah(totalRestricted)}</div>
            <div className="text-[10px] text-amber-600 mt-1">Cadangan retensi vendor & pajak</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Kas Bebas Aman Digunakan</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">{formatRupiah(freeCash)}</div>
            <div className="text-[10px] text-emerald-600 mt-1">Boleh dipakai belanja operasional</div>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {bankAccounts.map((acc) => {
          const isReconciled = acc.bookBalance === acc.statementBalance;

          return (
            <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {acc.bankName.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{acc.bankName}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">{acc.accountNumber}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {acc.type}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Saldo Buku Ledger</div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums">{formatRupiah(acc.bookBalance)}</div>
                  </div>

                  <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-slate-600">
                      <span>Pemegang Fisik:</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[150px]">{acc.custodian}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Dana Terikat:</span>
                      <span className="font-semibold text-amber-700 tabular-nums">{formatRupiah(acc.restrictedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Saldo Rekening Koran:</span>
                      <span className="font-mono text-slate-900 tabular-nums">{formatRupiah(acc.statementBalance)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  {isReconciled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Cocok (Reconciled)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-rose-700 font-medium">Ada Selisih</span>
                    </>
                  )}
                </div>
                <span className="text-slate-400">{acc.lastReconciledAt}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Transfer Kas Internal / Talangan */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Transfer Kas / Pemindahan Dana</h3>
            <p className="text-xs text-slate-500 mt-1">
              Aturan Akuntansi: Transfer antar-rekening milik entitas yang sama bukan merupakan pendapatan atau beban.
            </p>

            <form onSubmit={handleTransfer} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Jenis Transfer</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferType('INTERNAL')}
                    className={`py-2 rounded-lg font-semibold border ${
                      transferType === 'INTERNAL'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Transfer Internal Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('TALANGAN')}
                    className={`py-2 rounded-lg font-semibold border ${
                      transferType === 'TALANGAN'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Dana Talangan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Rekening Sumber (Pengeluaran)</label>
                <select
                  value={sourceBankId}
                  onChange={(e) => setSourceBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} (Saldo: Rp {b.bookBalance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Rekening Tujuan (Penerimaan)</label>
                <select
                  value={targetBankId}
                  onChange={(e) => setTargetBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} (Saldo: Rp {b.bookBalance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Nominal Transfer (Rp)</label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Catatan / Referensi Transfer</label>
                <input
                  type="text"
                  required
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Eksekusi Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
