/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  FileCheck2,
  Landmark,
  BadgeDollarSign,
  ShoppingCart,
  Boxes,
  FileSpreadsheet,
  Printer,
  Settings,
  ShieldCheck,
  X,
  MapPin,
  CalendarCheck2,
} from 'lucide-react';

export type ActiveTab =
  | 'beranda'
  | 'lahan'
  | 'proyek'
  | 'ppb'
  | 'kas_bank'
  | 'penjualan'
  | 'pembelian'
  | 'aset_gudang'
  | 'pajak_laporan'
  | 'tutup_buku'
  | 'dokumen'
  | 'pengaturan'
  | 'pengujian';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  pendingPPBCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  pendingPPBCount,
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'beranda', label: 'Beranda & Eksekutif', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'lahan', label: 'Pembebasan Lahan & Legal', icon: <MapPin className="w-4 h-4 text-emerald-400" /> },
    { id: 'proyek', label: 'Proyek & Anggaran RAB', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'ppb', label: 'Pencairan Biaya (PPB)', icon: <FileCheck2 className="w-4 h-4" />, badge: pendingPPBCount },
    { id: 'kas_bank', label: 'Kas & Rekening Bank', icon: <Landmark className="w-4 h-4" /> },
    { id: 'penjualan', label: 'Penjualan & Piutang (AR)', icon: <BadgeDollarSign className="w-4 h-4" /> },
    { id: 'pembelian', label: 'Pembelian & Utang (AP)', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'aset_gudang', label: 'Aset Tetap & Gudang', icon: <Boxes className="w-4 h-4" /> },
    { id: 'pajak_laporan', label: 'Pajak & Laporan Keuangan', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'tutup_buku', label: 'Tutup Buku Bulanan', icon: <CalendarCheck2 className="w-4 h-4 text-amber-400" /> },
    { id: 'dokumen', label: 'Pusat Cetak Dokumen A4', icon: <Printer className="w-4 h-4" /> },
    { id: 'pengaturan', label: 'Pengaturan & Identitas', icon: <Settings className="w-4 h-4" /> },
    { id: 'pengujian', label: 'Uji Penerimaan (AT-01 s/d 20)', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-base tracking-tight shadow-xs">
              DA
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight leading-tight">DevAkuntansi</div>
              <div className="text-[10px] text-emerald-400 font-medium">SAK EP 2025 · PP 9/2022</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
            Modul Operasional
          </div>
          {menuItems.slice(0, 8).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
            Tata Kelola & Validasi
          </div>
          {menuItems.slice(8).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* System Footer info */}
        <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">PT Cipta Graha Mandiri</span>
            <span className="text-[10px] text-emerald-400 font-mono">v2.0-STABLE</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">Ledger Double-Entry Terintegrasi</div>
        </div>
      </aside>
    </>
  );
};
