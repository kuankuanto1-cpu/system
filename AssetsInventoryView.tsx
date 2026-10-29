/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Boxes,
  Truck,
  Calculator,
  CheckCircle2,
  AlertCircle,
  FileText,
  Warehouse,
} from 'lucide-react';
import { FixedAsset, User } from '../types';
import { formatRupiah } from '../services/currency';
import { runAssetDepreciation } from '../services/ledgerEngine';

interface AssetsInventoryViewProps {
  assets: FixedAsset[];
  currentUser: User;
  onRefreshData: () => void;
}

export const AssetsInventoryView: React.FC<AssetsInventoryViewProps> = ({
  assets,
  currentUser,
  onRefreshData,
}) => {
  const [statusMessage, setStatusMessage] = useState<string>('');

  const totalAcquisition = assets.reduce((sum, a) => sum + a.acquisitionCost, 0);
  const totalDepreciation = assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  const totalBookValue = assets.reduce((sum, a) => sum + a.bookValue, 0);

  const handleRunDepreciation = (assetId: string) => {
    setStatusMessage('');
    try {
      const res = runAssetDepreciation(assetId, currentUser);
      setStatusMessage(
        `Penyusutan berhasil dibukukan! Komersial: Rp ${res.commercialAmount.toLocaleString('id-ID')}, Fiskal PMK 72: Rp ${res.fiscalAmount.toLocaleString('id-ID')}. Jurnal terposting: ${res.journal.entryNo}.`
      );
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
                Register Aset Tetap & Fiskal PMK 72/2023
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">SAK Entitas Privat (SAK EP 2025)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Register Aset Tetap & Inventaris Proyek
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Pemisahan penyusutan pembukuan komersial dan penyusutan fiskal, nilai buku terkini, serta penanggung jawab fisik aset.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Total Harga Perolehan Aset</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">{formatRupiah(totalAcquisition)}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Akumulasi Penyusutan Berjalan</div>
            <div className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">{formatRupiah(totalDepreciation)}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Nilai Buku Bersih (Net Book Value)</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">{formatRupiah(totalBookValue)}</div>
          </div>
        </div>
      </div>

      {/* Asset Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Daftar Register Aset Alat Berat & Kendaraan</h2>
          </div>
          <span className="text-xs text-slate-500">{assets.length} aset aktif</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Kode & Nama Aset</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Tgl Siap Pakai</th>
                <th className="px-4 py-3">Fiskal (PMK 72/2023)</th>
                <th className="px-4 py-3 text-right">Harga Perolehan</th>
                <th className="px-4 py-3 text-right">Akumulasi Penyusutan</th>
                <th className="px-4 py-3 text-right">Nilai Buku</th>
                <th className="px-4 py-3">Lokasi & Pemegang</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-900">{asset.assetCode}</span>
                    <div className="font-semibold text-slate-800">{asset.name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{asset.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-500">{asset.readyForUseDate}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {asset.fiscalGroup} ({asset.fiscalDepreciationRate}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{formatRupiah(asset.acquisitionCost)}</td>
                  <td className="px-4 py-3 text-right text-amber-700 tabular-nums">{formatRupiah(asset.accumulatedDepreciation)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-800 tabular-nums">{formatRupiah(asset.bookValue)}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{asset.location}</div>
                    <div className="text-[11px] text-slate-400">PIC: {asset.custodian}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRunDepreciation(asset.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs"
                      title="Hitung & Posting Depresiasi Bulanan ke Jurnal GL"
                    >
                      Penyusutan Bulanan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gudang & Material Inventory Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Kartu Stok Gudang Bahan Bangunan (WIP Inventory)</h2>
          </div>
          <span className="text-xs text-slate-500">Metode Penilaian: Rata-Rata Tertimbang</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-900">Semen Portland Tiga Roda</div>
            <div className="text-[11px] text-slate-500">Satuan: Sak 50kg</div>
            <div className="text-lg font-bold text-slate-900 mt-2 tabular-nums">1.250 Sak</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">Nilai: {formatRupiah(85000000)}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-900">Besi Beton Ulir D13 SNI</div>
            <div className="text-[11px] text-slate-500">Satuan: Batang 12m</div>
            <div className="text-lg font-bold text-slate-900 mt-2 tabular-nums">480 Batang</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">Nilai: {formatRupiah(60000000)}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-900">Pasir Pasang Super Bangka</div>
            <div className="text-[11px] text-slate-500">Satuan: Dump Truck (m3)</div>
            <div className="text-lg font-bold text-slate-900 mt-2 tabular-nums">85 m3</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">Nilai: {formatRupiah(25500000)}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-900">Paving Block K-300 Tebal 8cm</div>
            <div className="text-[11px] text-slate-500">Satuan: Meter Persegi (m2)</div>
            <div className="text-lg font-bold text-slate-900 mt-2 tabular-nums">200 m2</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">Nilai: {formatRupiah(14500000)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
