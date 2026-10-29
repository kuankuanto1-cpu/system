/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Building2, CheckCircle2 } from 'lucide-react';
import { PrintSettings, User } from '../types';
import { resetAllStorageToDefaults } from '../services/storage';
import { logAuditEvent } from '../services/ledgerEngine';

interface SettingsViewProps {
  printSettings: PrintSettings;
  currentUser: User;
  onUpdatePrintSettings: (settings: PrintSettings) => void;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  printSettings,
  currentUser,
  onUpdatePrintSettings,
  onResetDatabase,
}) => {
  const [formData, setFormData] = useState<PrintSettings>(printSettings);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePrintSettings(formData);
    logAuditEvent(currentUser, 'UPDATE', 'PPB', 'settings', 'Pembaruan Konfigurasi Kop Surat & Identitas Cetak');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin me-reset seluruh database ke data awal standar? Seluruh transaksi baru akan dikembalikan ke data baseline.')) {
      resetAllStorageToDefaults();
      onResetDatabase();
      alert('Database telah di-reset ke baseline standar operasional.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Pengaturan Mandiri Administrator
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-medium">Kop Surat, Logo & Pejabat Berwenang</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
          Pengaturan Perusahaan & Identitas Cetak
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Kelola informasi legalitas yang tampil pada kop surat dokumen resmi A4, invoice, kuitansi, dan voucher pencairan.
        </p>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengaturan identitas perusahaan dan kop surat berhasil disimpan.</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Identitas Resmi Perusahaan</h2>
            <p className="text-[11px] text-slate-500">Nama entitas dan nomor pokok wajib pajak pada kop surat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nama Perusahaan (Brand)</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nama Badan Hukum Lengkap</label>
              <input
                type="text"
                required
                value={formData.legalEntityName}
                onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nomor Pokok Wajib Pajak (NPWP)</label>
              <input
                type="text"
                required
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nomor Telepon Kantor</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Alamat Kantor Baris 1</label>
            <input
              type="text"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Alamat Kantor Baris 2 (Kota & Kontak)</label>
            <input
              type="text"
              required
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Pejabat Berwenang Tanda Tangan</h2>
            <p className="text-[11px] text-slate-500">Nama dan jabatan yang dicantumkan pada blok pengesahan dokumen.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nama Direktur Utama (Pemberi Otorisasi)</label>
              <input
                type="text"
                required
                value={formData.authorizedSignerName}
                onChange={(e) => setFormData({ ...formData, authorizedSignerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Jabatan Direktur</label>
              <input
                type="text"
                required
                value={formData.authorizedSignerTitle}
                onChange={(e) => setFormData({ ...formData, authorizedSignerTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nama Pejabat Keuangan (Pemeriksa)</label>
              <input
                type="text"
                required
                value={formData.financeApproverName}
                onChange={(e) => setFormData({ ...formData, financeApproverName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Jabatan Keuangan</label>
              <input
                type="text"
                required
                value={formData.financeApproverTitle}
                onChange={(e) => setFormData({ ...formData, financeApproverTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-800 text-xs font-semibold px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data ke Standar Uji</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
