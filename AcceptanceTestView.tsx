/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { AcceptanceTestResult } from '../types';
import { runAllAcceptanceTests, runAcceptanceTest } from '../services/testRunner';

export const AcceptanceTestView: React.FC = () => {
  const [testResults, setTestResults] = useState<AcceptanceTestResult[]>([
    { id: 'AT-01', name: 'Login dan Hak Akses (RBAC)', description: 'Pengguna hanya dapat mengakses tindakan dan data yang diizinkan sesuai perannya.', expectedResult: 'Akses approval ditolak jika role tidak sesuai matriks otorisasi.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-02', name: 'Integritas Jurnal Double-Entry', description: 'Total debit sama dengan kredit pada setiap transaksi yang diposting ke GL.', expectedResult: 'Sistem menolak posting dan memunculkan JournalBalanceError.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-03', name: 'Pencegahan Pembayaran Ganda', description: 'Invoice duplikat ditolak atau memerlukan jalur pengecualian.', expectedResult: 'Invoice dengan nomor sama diblokir oleh unique constraint.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-04', name: 'Formula Kontrol Anggaran RAB', description: 'Pagu, realisasi, dan komitmen menghasilkan sisa tersedia yang benar.', expectedResult: 'Sisa tersedia = Pagu - Realisasi - Komitmen tanpa double-counting.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-05', name: 'Kelebihan Anggaran (Budget Gate)', description: 'Pembayaran yang melampaui batas tidak dapat lolos tanpa otorisasi khusus.', expectedResult: 'Pencairan melebihi pagu ditolak otomatis oleh Budget Gate (422).', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-06', name: 'Pemisahan Tugas (Separation of Duties)', description: 'Pemohon tidak dapat menyetujui permohonannya sendiri.', expectedResult: 'Sistem menolak persetujuan oleh pembuat dokumen yang sama.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-07', name: 'Rekonsiliasi Kas & Bank', description: 'Saldo buku cocok dengan mutasi yang telah direkonsiliasi; selisih terlihat.', expectedResult: 'Pencocokan saldo buku dengan rekening koran dan pemisahan dana terikat.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-08', name: 'Pelunasan Piutang Konsumen', description: 'Pembayaran sebagian memperbarui saldo invoice dengan tepat.', expectedResult: 'Saldo piutang berkurang tanpa menggandakan pendapatan.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-09', name: 'Pembayaran Utang Vendor', description: 'Pembayaran mengurangi utang tanpa menggandakan beban.', expectedResult: 'Utang usaha berkurang; beban tidak dicatat dua kali.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-10', name: 'Register Aset & Penyusutan PMK 72/2023', description: 'Perolehan, penyusutan, dan pelepasan tercermin dengan benar dalam buku besar.', expectedResult: 'Jurnal penyusutan terposting dan nilai buku terbarui sesuai SAK EP & PMK 72.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-11', name: 'Kepatuhan Pajak Konstruksi PP 9/2022', description: 'Nilai, periode, dan referensi aturan dapat ditelusuri dan direkonsiliasi.', expectedResult: 'Tarif PPh Final 2.65% / 1.75% terhitung presisi pada register pajak.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-12', name: 'Template Dokumen Cetak A4', description: 'Logo, kop, nomor dokumen, nilai, halaman, dan status tampil sesuai template.', expectedResult: 'Template A4 terkonfigurasi dengan kop surat, tabel item, dan tanda tangan.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-13', name: 'Stempel Dinamis LUNAS / DRAFT', description: 'Status Lunas tidak muncul sebelum pembayaran terverifikasi kasir.', expectedResult: 'Stempel LUNAS hanya tampil setelah dokumen dibayar kasir.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-14', name: 'Pencatatan Jejak Audit (Audit Trail)', description: 'Perubahan dan koreksi memiliki pengguna, waktu, alasan, dan referensi.', expectedResult: 'Semua mutasi finansial tercatat di tabel audit append-only.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-15', name: 'Pemulihan Transaksi (Reversal)', description: 'Koreksi transaksi posted menggunakan reversal tanpa menghapus data historis.', expectedResult: 'Jurnal pembalik terbit dengan pasangan debit-kredit terbalik.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-16', name: 'Integritas Transaksi Atomik (Rollback)', description: 'Kegagalan koneksi atau validasi tidak menghasilkan data ganda.', expectedResult: 'Rollback atomik membatalkan seluruh mutasi saat terjadi kegagalan.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-17', name: 'Rekonsiliasi Laporan ke Buku Besar', description: 'Total laporan konsisten dengan buku besar dan transaksi sumber.', expectedResult: 'Neraca 100% seimbang (Total Aktiva == Total Pasiva).', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-18', name: 'Responsivitas Antarmuka (HP & Komputer)', description: 'Form, tabel, filter, dan cetak dapat digunakan tanpa elemen terpotong.', expectedResult: 'Tata letak beradaptasi pada mobile view dan desktop console.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-19', name: 'Tutup Buku Bulanan & Penguncian Periode', description: 'Otomatis menutup akun nominal ke Laba Ditahan (3200) dan menolak transaksi mundur.', expectedResult: 'Periode TERKUNCI, jurnal penutup seimbang, posting baru pada periode ditolak.', actualResult: 'Siap diuji.', status: 'PENDING' },
    { id: 'AT-20', name: 'Toleransi Lahan & Verifikasi Legalitas Notaris', description: 'Selisih ukur fisik > 1% otomatis memicu HOLD pelunasan hingga Berita Acara revisi.', expectedResult: 'BIDANG-013 (+6.67%) HOLD, BIDANG-012 (-0.4%) LOLOS toleransi.', actualResult: 'Siap diuji.', status: 'PENDING' },
  ]);

  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunAll = async () => {
    setIsRunning(true);
    const results = await runAllAcceptanceTests();
    setTestResults(results);
    setIsRunning(false);
  };

  const handleRunSingle = async (id: string) => {
    const res = await runAcceptanceTest(id);
    setTestResults((prev) => prev.map((t) => (t.id === id ? res : t)));
  };

  const verifiedCount = testResults.filter((t) => t.status === 'VERIFIED').length;
  const failedCount = testResults.filter((t) => t.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                SRS Bab 14 & 15 Acceptance Tests
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">20 Skenario Kepatuhan Bisnis Nyata</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Suite Pengujian Otomatis Penerimaan Sistem (AT-01 s/d AT-20)
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Eksekusi nyata terhadap aturan akuntansi, pembatasan anggaran, pemisahan tugas, rekonsiliasi GL, tutup buku bulanan, dan audit lahan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className={`inline-flex items-center gap-2 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-xs ${
                isRunning
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? 'Menjalankan Pengujian...' : 'Jalankan Seluruh 20 Pengujian'}</span>
            </button>
          </div>
        </div>

        {/* Status Scoreboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Total Skenario Uji Wajib</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">20 Skenario (AT-01 - AT-20)</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Hasil Terverifikasi (VERIFIED)</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">
              {verifiedCount} Skenario Lulus
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Hasil Gagal (FAILED)</div>
            <div className="text-lg font-bold text-rose-700 mt-0.5 tabular-nums">
              {failedCount} Skenario Gagal
            </div>
          </div>
        </div>
      </div>

      {/* Test Execution Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Matriks Verifikasi Penerimaan Sistem</h2>
          <span className="text-xs text-slate-500">Hasil Eksekusi Langsung ke Database</span>
        </div>

        <div className="divide-y divide-slate-100">
          {testResults.map((t) => (
            <div key={t.id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {t.id}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">{t.name}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                      t.status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : t.status === 'FAILED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {t.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {t.status === 'FAILED' && <XCircle className="w-3 h-3 text-rose-600" />}
                    {t.status === 'PENDING' && <Clock className="w-3 h-3 text-slate-400" />}
                    <span>{t.status}</span>
                  </span>

                  <button
                    onClick={() => handleRunSingle(t.id)}
                    disabled={isRunning}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50"
                  >
                    Uji Ulang
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 mt-1">{t.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2.5 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                <div>
                  <span className="text-slate-500 font-medium">Kriteria Diharapkan:</span>{' '}
                  <span className="text-slate-800">{t.expectedResult}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Hasil Aktual:</span>{' '}
                  <span className="font-semibold text-slate-900">{t.actualResult}</span>
                </div>
              </div>

              {t.evidenceLog && (
                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-slate-900 text-slate-300 p-2 rounded flex items-center gap-1.5 overflow-x-auto">
                  <Terminal className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{t.evidenceLog}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
