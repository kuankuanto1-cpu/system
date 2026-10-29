/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Printer, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { PrintSettings, PaymentRequest, CustomerInvoice, LandParcel } from '../types';
import { formatRupiah, terbilang } from '../services/currency';

interface DocumentPrintViewProps {
  printSettings: PrintSettings;
  paymentRequests: PaymentRequest[];
  customerInvoices: CustomerInvoice[];
  landParcels?: LandParcel[];
  initialDocType?: string;
  initialDocData?: any;
}

export const DocumentPrintView: React.FC<DocumentPrintViewProps> = ({
  printSettings,
  paymentRequests,
  customerInvoices,
  landParcels = [],
  initialDocType = 'PPB',
  initialDocData,
}) => {
  const [docType, setDocType] = useState<string>(initialDocType);
  const [selectedPPBId, setSelectedPPBId] = useState<string>(
    initialDocData?.documentNo?.startsWith('PPB') ? initialDocData.id : paymentRequests[0]?.id || ''
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    initialDocData?.documentNo?.startsWith('INV') ? initialDocData.id : customerInvoices[0]?.id || ''
  );
  const [selectedParcelId, setSelectedParcelId] = useState<string>(
    initialDocData?.parcelCode ? initialDocData.id : landParcels[0]?.id || ''
  );

  const activePPB = paymentRequests.find((p) => p.id === selectedPPBId) || paymentRequests[0];
  const activeInvoice = customerInvoices.find((i) => i.id === selectedInvoiceId) || customerInvoices[0];
  const activeParcel = landParcels.find((p) => p.id === selectedParcelId) || landParcels[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden during print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pusat Dokumen Resmi A4
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Stempel Dinamis LUNAS & DRAFT</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Pratinjau & Cetak Dokumen Perusahaan
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Tata letak baku A4 dengan kop surat resmi, stempel pembayaran terverifikasi, dan blok tanda tangan pengesahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setDocType('PPB')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  docType === 'PPB' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Voucher PPB
              </button>
              <button
                onClick={() => setDocType('KUITANSI')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  docType === 'KUITANSI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kuitansi Pelunasan
              </button>
              <button
                onClick={() => setDocType('BA_LAHAN')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  docType === 'BA_LAHAN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Berita Acara Lahan
              </button>
            </div>

            {docType === 'PPB' && (
              <select
                value={selectedPPBId}
                onChange={(e) => setSelectedPPBId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              >
                {paymentRequests.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.documentNo} - {p.payeeName} ({formatRupiah(p.totalAmount)})
                  </option>
                ))}
              </select>
            )}

            {docType === 'KUITANSI' && (
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              >
                {customerInvoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.documentNo} - {i.customerName} ({i.status})
                  </option>
                ))}
              </select>
            )}

            {docType === 'BA_LAHAN' && (
              <select
                value={selectedParcelId}
                onChange={(e) => setSelectedParcelId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              >
                {landParcels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.parcelCode} - {l.sellerName} ({l.surveyedArea} m²)
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* A4 Printable Document Container */}
      <div className="bg-slate-100 p-4 sm:p-8 rounded-xl flex justify-center overflow-x-auto no-print:bg-slate-200/50">
        <div className="print-container bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md border border-slate-200 text-slate-900 relative">
          
          {/* 1. KOP SURAT RESMI PERUSAHAAN */}
          <div className="pb-4 border-b-2 border-slate-900 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xl tracking-tighter">
                  CGM
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">
                    {printSettings.legalEntityName}
                  </h1>
                  <div className="text-[11px] text-slate-600 font-medium">{printSettings.addressLine1}</div>
                  <div className="text-[10px] text-slate-500">{printSettings.addressLine2}</div>
                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">NPWP: {printSettings.taxId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Formulir Resmi
                </div>
                <div className="text-xs font-bold text-emerald-800 font-mono mt-1">
                  {docType === 'PPB' ? activePPB?.documentNo : activeInvoice?.documentNo}
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC WATERMARK STAMP (LUNAS / DRAFT) */}
          {docType === 'PPB' && activePPB && (
            <div className="absolute top-48 right-12 pointer-events-none select-none opacity-85 rotate-[-12deg]">
              {activePPB.status === 'PAID' ? (
                <div className="border-4 border-emerald-600 rounded-lg px-6 py-2 text-center text-emerald-700 font-black tracking-widest text-2xl uppercase">
                  L U N A S
                  <div className="text-[9px] font-mono tracking-normal font-bold">
                    VERIFIED: {activePPB.paidAt?.split('T')[0]}
                  </div>
                </div>
              ) : activePPB.status === 'APPROVED' ? (
                <div className="border-4 border-blue-600 rounded-lg px-4 py-2 text-center text-blue-700 font-black tracking-widest text-xl uppercase">
                  DISETUJUI
                </div>
              ) : (
                <div className="border-4 border-amber-600 rounded-lg px-4 py-2 text-center text-amber-700 font-black tracking-widest text-xl uppercase">
                  D R A F T
                </div>
              )}
            </div>
          )}

          {docType === 'KUITANSI' && activeInvoice && (
            <div className="absolute top-48 right-12 pointer-events-none select-none opacity-85 rotate-[-12deg]">
              {activeInvoice.status === 'LUNAS' ? (
                <div className="border-4 border-emerald-600 rounded-lg px-6 py-2 text-center text-emerald-700 font-black tracking-widest text-2xl uppercase">
                  L U N A S
                  <div className="text-[9px] font-mono tracking-normal font-bold">
                    KASIR TERVERIFIKASI
                  </div>
                </div>
              ) : (
                <div className="border-4 border-amber-600 rounded-lg px-4 py-2 text-center text-amber-700 font-black tracking-widest text-xl uppercase">
                  BELUM LUNAS
                </div>
              )}
            </div>
          )}

          {/* 2. DOCUMENT BODY */}
          {docType === 'PPB' && activePPB && (
            <div className="space-y-5 text-xs">
              <div className="text-center pb-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 underline decoration-slate-900 decoration-1 underline-offset-4">
                  Surat Permohonan Pencairan Biaya (PPB)
                </h2>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Nomor: {activePPB.documentNo}</div>
              </div>

              {/* Header Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Nama Proyek:</span>{' '}
                    <span className="font-bold text-slate-900">{activePPB.projectName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pemohon (PIC):</span>{' '}
                    <span className="font-semibold text-slate-900">{activePPB.requestedByName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tanggal Pengajuan:</span>{' '}
                    <span className="font-mono text-slate-800">{activePPB.requestDate}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Dibayarkan Kepada:</span>{' '}
                    <span className="font-bold text-slate-900">{activePPB.payeeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Rekening Tujuan:</span>{' '}
                    <span className="font-mono font-bold text-slate-800">{activePPB.payeeBank} - {activePPB.payeeAccountNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Jatuh Tempo:</span>{' '}
                    <span className="font-mono text-slate-800">{activePPB.dueDate}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Tujuan / Keperluan:</span>
                <p className="mt-0.5 text-slate-900 font-medium italic bg-slate-50/50 p-2 rounded border border-slate-100">
                  "{activePPB.purpose}"
                </p>
              </div>

              {/* Rincian Item Anggaran Table */}
              <div>
                <div className="font-bold text-slate-900 mb-1.5 uppercase text-[11px]">Rincian Item Anggaran Biaya</div>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-300">Cost Code</th>
                      <th className="px-3 py-2 border-r border-slate-300">Uraian Barang / Jasa</th>
                      <th className="px-3 py-2 border-r border-slate-300 text-right">Volume</th>
                      <th className="px-3 py-2 border-r border-slate-300 text-right">Harga Satuan</th>
                      <th className="px-3 py-2 text-right">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activePPB.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-mono font-bold border-r border-slate-300">{item.costCode}</td>
                        <td className="px-3 py-2 border-r border-slate-300 font-medium">{item.description}</td>
                        <td className="px-3 py-2 text-right border-r border-slate-300 tabular-nums">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-3 py-2 text-right border-r border-slate-300 tabular-nums">
                          {formatRupiah(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums">
                          {formatRupiah(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right border-r border-slate-300">
                        TOTAL DICAIRKAN:
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-900 tabular-nums">
                        {formatRupiah(activePPB.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terbilang Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Terbilang Resmi:</span>
                <span className="font-bold text-slate-900 text-xs italic">
                  # {terbilang(activePPB.totalAmount)} #
                </span>
              </div>

              {/* 3. TANDA TANGAN PENGESAHAN */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="text-slate-500 mb-16">Diajukan Oleh:</div>
                  <div className="font-bold text-slate-900 underline underline-offset-2">
                    {activePPB.requestedByName}
                  </div>
                  <div className="text-[10px] text-slate-500">Project Manager / Pemohon</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-16">Diperiksa (Finance):</div>
                  <div className="font-bold text-slate-900 underline underline-offset-2">
                    {printSettings.financeApproverName}
                  </div>
                  <div className="text-[10px] text-slate-500">{printSettings.financeApproverTitle}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-16">Disetujui Oleh:</div>
                  <div className="font-bold text-slate-900 underline underline-offset-2">
                    {printSettings.authorizedSignerName}
                  </div>
                  <div className="text-[10px] text-slate-500">{printSettings.authorizedSignerTitle}</div>
                </div>
              </div>
            </div>
          )}

          {/* KUITANSI PELUNASAN KONSUMEN */}
          {docType === 'KUITANSI' && activeInvoice && (
            <div className="space-y-6 text-xs">
              <div className="text-center pb-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 underline decoration-slate-900 decoration-1 underline-offset-4">
                  Kuitansi Pembayaran Properti
                </h2>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Nomor: {activeInvoice.documentNo}</div>
              </div>

              <div className="space-y-3.5 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <div className="flex">
                  <span className="w-40 text-slate-500 font-medium">Telah Diterima Dari:</span>
                  <span className="font-bold text-slate-900 text-sm">{activeInvoice.customerName}</span>
                </div>
                <div className="flex">
                  <span className="w-40 text-slate-500 font-medium">Uang Sejumlah:</span>
                  <span className="font-bold text-slate-900 italic">
                    # {terbilang(activeInvoice.paidAmount || activeInvoice.grossAmount)} #
                  </span>
                </div>
                <div className="flex">
                  <span className="w-40 text-slate-500 font-medium">Untuk Pembayaran:</span>
                  <span className="font-semibold text-slate-800">
                    {activeInvoice.termDescription} Proyek Grand Harmoni Residence
                  </span>
                </div>
                <div className="flex">
                  <span className="w-40 text-slate-500 font-medium">Status Pembayaran:</span>
                  <span className="font-bold text-emerald-800">{activeInvoice.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-sm font-bold text-emerald-950">JUMLAH DITERIMA:</span>
                <span className="text-xl font-black text-emerald-900 font-mono tabular-nums">
                  {formatRupiah(activeInvoice.paidAmount || activeInvoice.grossAmount)}
                </span>
              </div>

              {/* Tanda Tangan Kasir & Cap */}
              <div className="pt-10 flex justify-between items-end">
                <div className="text-[11px] text-slate-500">
                  *Kuitansi ini adalah bukti pembayaran sah setelah divalidasi oleh Bagian Keuangan.
                </div>
                <div className="text-center w-48">
                  <div className="text-slate-500 mb-16">Bogor, {activeInvoice.invoiceDate}</div>
                  <div className="font-bold text-slate-900 underline underline-offset-2">
                    {printSettings.financeApproverName}
                  </div>
                  <div className="text-[10px] text-slate-500">Kasir / Bendahara Penerima</div>
                </div>
              </div>
            </div>
          )}

          {/* BERITA ACARA PENGUKURAN & PEMBEBASAN LAHAN (BA-LAHAN) */}
          {docType === 'BA_LAHAN' && activeParcel && (
            <div className="space-y-5 text-xs">
              <div className="text-center pb-2 border-b border-slate-300">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 underline decoration-slate-900 decoration-1 underline-offset-4">
                  Berita Acara Pengukuran Fisik & Inventarisasi Lahan
                </h2>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Nomor: BA-LAHAN-{activeParcel.parcelCode}-{activeParcel.surveyDate ? activeParcel.surveyDate.replace(/-/g, '') : '20261029'}
                </div>
              </div>

              {/* Status Stamp */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-slate-500 text-[11px]">Kode Bidang Registrasi:</span>
                  <div className="text-sm font-bold text-slate-900 font-mono">{activeParcel.parcelCode}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px]">Status Toleransi Variansi:</span>
                  <div>
                    {activeParcel.areaToleranceStatus === 'HOLD_SELISIH_LUAS' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        HOLD SELISIH LUAS (&gt;1%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        LOLOS TOLERANSI (&le;1%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabel Informasi Pemilik & Alas Hak */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-xs">I. Identitas Pemilik & Alas Hak Asal</div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-slate-200 rounded-lg text-[11px]">
                  <div>Pemilik Asal: <strong>{activeParcel.sellerName}</strong></div>
                  <div>NIK KTP: <strong className="font-mono">{activeParcel.sellerIdCard}</strong></div>
                  <div>Jenis Alas Hak: <strong>{activeParcel.originalTitleType}</strong></div>
                  <div>Nomor Surat: <strong className="font-mono">{activeParcel.originalTitleNo}</strong></div>
                  <div className="col-span-2">Deskripsi Lokasi: <strong>{activeParcel.locationDescription}</strong></div>
                </div>
              </div>

              {/* Tabel Pengukuran & Toleransi */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-xs">II. Hasil Pengukuran Fisik BPN & Topografi</div>
                <table className="w-full text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border border-slate-300">Parameter Ukur</th>
                      <th className="p-2 border border-slate-300 text-right">Hasil Ukur</th>
                      <th className="p-2 border border-slate-300">Keterangan / Kepatuhan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-2 border border-slate-300 font-sans">Luas Dokumen (Sertifikat/Girik)</td>
                      <td className="p-2 border border-slate-300 text-right font-bold">{activeParcel.documentArea} m²</td>
                      <td className="p-2 border border-slate-300 font-sans">Alas hak asal tercantum</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-sans">Luas Hasil Ukur Fisik BPN</td>
                      <td className="p-2 border border-slate-300 text-right font-bold text-emerald-700">{activeParcel.surveyedArea} m²</td>
                      <td className="p-2 border border-slate-300 font-sans">Surveyor: {activeParcel.surveyorName || 'BPN'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-sans">Selisih & Variansi</td>
                      <td className="p-2 border border-slate-300 text-right font-bold">
                        {activeParcel.areaVariance > 0 ? `+${activeParcel.areaVariance}` : activeParcel.areaVariance} m² ({activeParcel.areaVariancePercentage}%)
                      </td>
                      <td className="p-2 border border-slate-300 font-sans">
                        {Math.abs(activeParcel.areaVariancePercentage) <= 1 ? 'Dalam batas toleransi wajar 1%' : 'Wajib adendum Berita Acara'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-sans">Topografi & Pematangan Lahan</td>
                      <td className="p-2 border border-slate-300 text-right font-bold font-sans">{activeParcel.topographyType || 'DATAR'}</td>
                      <td className="p-2 border border-slate-300 font-sans">
                        Cut/Fill: {activeParcel.cutFillVolumeM3 ? `${activeParcel.cutFillVolumeM3.toLocaleString('id-ID')} m³` : '0 m³'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Batas Patok Fisik */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-xs">III. Batas-Batas Patok Fisik di Lapangan</div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                  <div>Utara: <strong>{activeParcel.northBoundary || '-'}</strong></div>
                  <div>Selatan: <strong>{activeParcel.southBoundary || '-'}</strong></div>
                  <div>Timur: <strong>{activeParcel.eastBoundary || '-'}</strong></div>
                  <div>Barat: <strong>{activeParcel.westBoundary || '-'}</strong></div>
                  <div className="col-span-2 text-slate-600 font-mono">
                    Titik Koordinat GPS BPN: {activeParcel.gpsCoordinates || '-'}
                  </div>
                </div>
              </div>

              {/* Finansial & Notaris PPAT */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-xs">IV. Ketentuan Pembayaran & Notaris PPAT</div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg grid grid-cols-2 gap-2 text-[11px]">
                  <div>Harga Kesepakatan: <strong>Rp {activeParcel.pricePerMeter.toLocaleString('id-ID')}/m²</strong></div>
                  <div>Total Kesepakatan: <strong className="text-slate-900">{formatRupiah(activeParcel.agreedTotalAmount)}</strong></div>
                  <div>Realisasi Bayar: <strong className="text-emerald-700">{formatRupiah(activeParcel.paidAmount)}</strong></div>
                  <div>Sisa Kewajiban: <strong className="text-amber-700">{formatRupiah(activeParcel.remainingAmount)}</strong></div>
                  <div>Notaris/PPAT: <strong>{activeParcel.notaryName}</strong></div>
                  <div>Status Akta: <strong>{activeParcel.conveyanceStatus}</strong></div>
                </div>
              </div>

              {/* 4 Pihak Tanda Tangan */}
              <div className="pt-6">
                <div className="text-[10px] text-slate-500 mb-2 text-center">
                  Berita acara ini dibuat dengan sebenar-benarnya dan disahkan oleh para pihak:
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div>
                    <div className="text-slate-500 mb-14">Pemilik Asal:</div>
                    <div className="font-bold text-slate-900 underline">{activeParcel.sellerName}</div>
                    <div className="text-slate-400">Pihak Pertama</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-14">Surveyor BPN:</div>
                    <div className="font-bold text-slate-900 underline">{activeParcel.surveyorName || 'Petugas Ukur'}</div>
                    <div className="text-slate-400">Pengukur Fisik</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-14">Notaris & PPAT:</div>
                    <div className="font-bold text-slate-900 underline">{activeParcel.notaryName}</div>
                    <div className="text-slate-400">Saksi Notariil</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-14">Direksi Pengembang:</div>
                    <div className="font-bold text-slate-900 underline">{printSettings.authorizedSignerName}</div>
                    <div className="text-slate-400">{printSettings.authorizedSignerTitle}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="absolute bottom-6 left-12 right-12 text-[10px] text-slate-400 text-center border-t border-slate-200 pt-2">
            Dokumen sah diterbitkan otomatis melalui DevAkuntansi ERP · SAK EP 2025 · {new Date().toLocaleDateString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
};
