/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memformat integer Rupiah ke tampilan standar Indonesia:
 * Contoh: 150000000 -> "Rp 150.000.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Menghitung PPN 11% (PMK 11/2025) dengan integer rounding aman
 */
export function calculatePPN(dpp: number): number {
  return Math.round((dpp * 11) / 100);
}

/**
 * Menghitung PPh Final Jasa Konstruksi (PP 9/2022)
 * Kualifikasi Kecil: 1.75%
 * Kualifikasi Menengah/Besar: 2.65%
 * Tidak Bersertifikat: 4%
 */
export function calculatePPhKonstruksi(dpp: number, qualification: 'KECIL' | 'MENENGAH' | 'BESAR' | 'TIDAK_BERSERTIFIKAT'): number {
  let rate = 0.04;
  if (qualification === 'KECIL') rate = 0.0175;
  else if (qualification === 'MENENGAH' || qualification === 'BESAR') rate = 0.0265;
  return Math.round(dpp * rate);
}

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

/**
 * Mengonversi angka integer Rupiah menjadi teks terbilang resmi Indonesia:
 * Contoh: 25000000 -> "Dua Puluh Lima Juta Rupiah"
 */
export function terbilang(nominal: number): string {
  if (nominal === 0) return 'Nol Rupiah';
  const abs = Math.abs(Math.round(nominal));
  
  function convert(n: number): string {
    if (n < 12) {
      return SATUAN[n];
    } else if (n < 20) {
      return convert(n - 10) + ' Belas';
    } else if (n < 100) {
      return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + convert(n - 100);
    } else if (n < 1000) {
      return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + convert(n - 1000);
    } else if (n < 1000000) {
      return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    } else if (n < 1000000000) {
      return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    } else if (n < 1000000000000) {
      return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000);
    } else {
      return convert(Math.floor(n / 1000000000000)) + ' Triliun ' + convert(n % 1000000000000);
    }
  }

  const result = convert(abs).replace(/\s+/g, ' ').trim();
  return `${result} Rupiah`;
}
