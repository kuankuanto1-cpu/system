/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Percent,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Project, WBSItem, BudgetItem, User } from '../types';
import { formatRupiah } from '../services/currency';
import { logAuditEvent } from '../services/ledgerEngine';

interface ProjectBudgetViewProps {
  project: Project;
  wbsList: WBSItem[];
  budgetItems: BudgetItem[];
  currentUser: User;
  onUpdateBudgetItems: (items: BudgetItem[]) => void;
}

export const ProjectBudgetView: React.FC<ProjectBudgetViewProps> = ({
  project,
  wbsList,
  budgetItems,
  currentUser,
  onUpdateBudgetItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [wbsId, setWbsId] = useState<string>(wbsList[0]?.id || '');
  const [costCode, setCostCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<BudgetItem['category']>('MATERIAL');
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<string>('m3');
  const [unitPrice, setUnitPrice] = useState<number>(150000);

  const filteredItems = selectedCategory === 'ALL'
    ? budgetItems
    : budgetItems.filter((b) => b.category === selectedCategory);

  const totalPagu = filteredItems.reduce((sum, b) => sum + b.paguDisetujui, 0);
  const totalRealisasi = filteredItems.reduce((sum, b) => sum + b.realisasi, 0);
  const totalKomitmen = filteredItems.reduce((sum, b) => sum + b.komitmenTerbuka, 0);
  const totalSisa = Math.max(0, totalPagu - totalRealisasi - totalKomitmen);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costCode || !description) return;

    const newItem: BudgetItem = {
      id: 'bitem_' + Date.now(),
      projectId: project.id,
      wbsId,
      costCode,
      description,
      category,
      quantity,
      unit,
      unitPrice,
      paguDisetujui: quantity * unitPrice,
      realisasi: 0,
      komitmenTerbuka: 0,
    };

    const updated = [...budgetItems, newItem];
    onUpdateBudgetItems(updated);
    logAuditEvent(currentUser, 'CREATE', 'BUDGET', newItem.id, `Penambahan Item RAB Baru: ${newItem.costCode} - ${newItem.description} Pagu Rp ${newItem.paguDisetujui.toLocaleString('id-ID')}`);
    setShowAddModal(false);
    setCostCode('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {project.code}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Status: {project.status}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span>Lokasi: {project.location}</span>
              <span>·</span>
              <span>Kapasitas: {project.totalUnits} Kavling Unit</span>
              <span>·</span>
              <span>Project Manager: {project.managerName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item RAB</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Pagu Disetujui (Baseline)</div>
            <div className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">{formatRupiah(totalPagu)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Realisasi Aktual (Posted)</div>
            <div className="text-base font-bold text-emerald-700 mt-0.5 tabular-nums">{formatRupiah(totalRealisasi)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Komitmen Terbuka (PO/SPK)</div>
            <div className="text-base font-bold text-amber-700 mt-0.5 tabular-nums">{formatRupiah(totalKomitmen)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Sisa Pagu Tersedia (Bebas)</div>
            <div className="text-base font-bold text-blue-700 mt-0.5 tabular-nums">{formatRupiah(totalSisa)}</div>
          </div>
        </div>
      </div>

      {/* WBS Progress Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Work Breakdown Structure (WBS) & Progres Fisik</h2>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Total Progres Proyek: {project.progressPercentage}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wbsList.map((wbs) => (
            <div key={wbs.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {wbs.code}
                </span>
                <span className="text-xs font-bold text-slate-900">{wbs.progressPercentage}% Fisik</span>
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-2 truncate">{wbs.name}</div>
              <div className="text-[11px] text-slate-500">Bobot Pekerjaan: {wbs.weightPercentage}%</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${wbs.progressPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Items Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Kategori Biaya:</span>
            {['ALL', 'LAHAN', 'EARTHWORKS', 'MATERIAL', 'UPAH', 'SUBKONTRAKTOR'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">{filteredItems.length} baris anggaran</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Cost Code</th>
                <th className="px-4 py-3">Uraian Pekerjaan / Material</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-right">Harga Satuan</th>
                <th className="px-4 py-3 text-right">Pagu Disetujui</th>
                <th className="px-4 py-3 text-right">Realisasi (Posted)</th>
                <th className="px-4 py-3 text-right">Komitmen PO</th>
                <th className="px-4 py-3 text-right">Sisa Pagu Tersedia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => {
                const sisa = Math.max(0, item.paguDisetujui - item.realisasi - item.komitmenTerbuka);
                const isOverused = sisa === 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{item.costCode}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {item.quantity.toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(item.paguDisetujui)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-semibold tabular-nums">
                      {formatRupiah(item.realisasi)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700 font-semibold tabular-nums">
                      {formatRupiah(item.komitmenTerbuka)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      <span className={isOverused ? 'text-rose-600' : 'text-blue-700'}>
                        {formatRupiah(sisa)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Budget Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Tambah Item Rencana Anggaran Biaya (RAB)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Item baru akan disimpan dengan status baseline resmi untuk kontrol pagu pencairan biaya.
            </p>

            <form onSubmit={handleAddItem} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Paket Pekerjaan (WBS)</label>
                <select
                  value={wbsId}
                  onChange={(e) => setWbsId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {wbsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kode Biaya (Cost Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: MAT-PASIR-01"
                    value={costCode}
                    onChange={(e) => setCostCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="MATERIAL">MATERIAL</option>
                    <option value="UPAH">UPAH</option>
                    <option value="SUBKONTRAKTOR">SUBKONTRAKTOR</option>
                    <option value="EARTHWORKS">EARTHWORKS</option>
                    <option value="LAHAN">LAHAN</option>
                    <option value="ALAT_BERAT">ALAT BERAT</option>
                    <option value="OVERHEAD">OVERHEAD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Uraian Detail Item</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pasir Pasang Super Bangka"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kuantitas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="m3 / sak / btg"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-900">Total Pagu Baru:</span>
                <span className="font-bold text-emerald-800 text-sm tabular-nums">
                  {formatRupiah(quantity * unitPrice)}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Simpan ke RAB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
