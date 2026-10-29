# Rencana & Status Implementasi DevAkuntansi ERP

## Fitur Ekspansi Modul Lahan & Pematangan Tanah (Data Input, Edit, Audit Forensik & Cetak)

### 1. Data Input (Tambah Bidang Lahan Baru)
- Modal formulir lengkap terintegrasi:
  - **Identitas & Alas Hak**: Kode bidang unik (misal `BIDANG-015`), nama pemilik asal, NIK KTP, nomor telepon, deskripsi lokasi kavling, jenis alas hak (SHM, Girik, Letter C, HGB, AJB Lama), dan nomor surat.
  - **Pengukuran & Toleransi Ukur Real-Time**: Luas dokumen vs luas hasil ukur fisik BPN, perhitungan otomatis selisih luas ($m^2$), persentase deviasi, dan penetapan status toleransi otomatis (`LOLOS` jika $\le 1.0\%$ vs `HOLD_SELISIH_LUAS` jika $> 1.0\%$).
  - **Topografi & Pematangan Lahan (Cut & Fill)**: Tipe kontur (Datar, Berkontur, Lembah/Rawa, Perbukitan), estimasi volume $m^3$, tarif per $m^3$, total biaya pematangan lahan, dan persentase progres pekerjaan.
  - **Batas Patok & GPS**: Titik koordinat GPS BPN, batas utara, selatan, timur, dan barat, serta nama surveyor dan tanggal ukur fisik.
  - **Status Sengketa UUPA**: Aman Clear & Clean, Klaim Ahli Waris, Tumpang Tindih Batas, atau Mediasi Desa.
  - **Notaris & Perpajakan**: Honorarium notaris PPAT, estimasi BPHTB pembeli 5% (dengan pengurangan NPOPTKP 80jt), dan PPh Final 2.5%.

### 2. Data Edit (Pembaruan Data Lahan dengan Kontrol Audit)
- Modal pengeditan data bidang tanah untuk luas dokumen, hasil ukur fisik, harga kesepakatan, batas-batas patok, status sengketa, dan progres Cut & Fill.
- **Kepatuhan Jejak Audit Forensik**: Mewajibkan input alasan perubahan data (*Audit Reason*) minimal 8 karakter.
- Otomatis menghitung ulang selisih luas, persentase variansi, status toleransi, nilai kesepakatan baru, dan sisa kewajiban.
- Mencatat riwayat ke tabel audit log (`audit_events`) dengan waktu, nama aktor, dan ringkasan mutasi (*diff summary*).

### 3. Data Audit (Jejak Audit Forensik Portofolio Lahan)
- Modal dan linimasa khusus "Jejak Audit Forensik Bidang Tanah" (`getLandAuditEvents`) yang menampilkan seluruh mutasi secara *append-only*:
  - Pembuatan bidang lahan (`CREATE`)
  - Pembaruan spesifikasi fisik/finansial (`UPDATE`)
  - Pembayaran termin tanah & honorarium PPAT (`DISBURSE`)
  - Verifikasi checklist dokumen legalitas (`VERIFY_DOC`)
  - Pembaruan tahapan akta dan balik nama BPN (`UPDATE`)
  - Kalkulasi pematangan lahan & sinkronisasi RAB (`UPDATE`)
- Menampilkan rincian aktor pengguna (Nama & Role), timestamp presisi, deskripsi, dan catatan audit.

### 4. Pusat Cetak Dokumen A4 (Berita Acara Lahan / BA-LAHAN)
- Template cetak resmi A4 untuk Berita Acara Pengukuran Fisik & Inventarisasi Lahan:
  - Kop surat resmi PT Cipta Graha Mandiri lengkap dengan NPWP dan alamat.
  - Stempel dinamis status toleransi variansi (`LOLOS TOLERANSI` atau `HOLD SELISIH LUAS`).
  - Tabel rincian hasil ukur dokumen vs BPN, batas-batas patok fisik, koordinat GPS, dan topografi pematangan lahan.
  - Blok tanda tangan 4 pihak: Pemilik Asal/Ahli Waris, Surveyor BPN, Notaris/PPAT Pendamping, dan Direksi Pengembang.

### 5. Sub-Fitur Pematangan Tanah (Cut & Fill) & Integrasi Realisasi RAB Proyek
- **Navigasi Sub-Tab Lahan**:
  - `Tab 1: Register Lahan & Notaris`: Mengelola inventarisasi kepemilikan, toleransi variansi ukur, dan status akta BPN.
  - `Tab 2: Pematangan Tanah (Cut & Fill) & Integrasi RAB`: Pusat kendali volume galian/urugan, neraca tanah, status alat berat, dan dampak anggaran.
- **Kalkulasi Biaya Operasional Berdasarkan Kategori Karakteristik Tanah**:
  - *Tanah Biasa / Sedang* (Koefisien dasar 1.00x)
  - *Tanah Keras / Cadas Berbatu* (Koefisien 1.50x, kebutuhan breaker hidrolik)
  - *Tanah Lembek / Rawa / Lumpur* (Koefisien 1.35x, dewatering pump & pembuangan deposit)
  - *Tanah Urug Pilihan / Sirtu* (Koefisien 1.15x, pemadatan bertahap per ketebalan 30 cm)
- **4 Pilar Rincian Biaya Operasional Lengkap**:
  1. **Sewa Alat Berat**:
     - Excavator Komatsu PC200 (jam kerja & tarif per jam)
     - Bulldozer Komatsu D65P (jam kerja & tarif per jam)
     - Vibro Roller Compactor 10 Ton (jam kerja & tarif per jam)
     - Dump Truck Hauling indeks 8 $m^3$ (ritase pembuangan atau sirtu urug & tarif per rit)
  2. **Bahan Bakar Minyak (Solar Industri Non-Subsidi)**:
     - Estimasi konsumsi liter (dihitung berbasis rata-rata 14-16 liter/jam alat berat)
     - Tarif solar industri per liter (standar non-subsidi Rp 15.500/liter)
  3. **Sewa Alat Lain & Penunjang Lapangan**:
     - Total Station & Waterpass digital surveyor topografi (hari & tarif harian)
     - Pompa celup / dewatering lumpur alkon (hari & tarif harian)
     - Plate compactor / stamper kodok pemadat tepi kavling (hari & tarif harian)
     - Material pembantu: patok kayu bowplank, benang elevasi & rambu K3 (lump sum)
  4. **Jasa & Upah SDM Lapangan**:
     - Upah operator alat berat (jumlah operator, hari kerja, upah harian)
     - Uang makan & tunjangan lembur operator alat (harian)
     - Mandor lapangan pekerjaan tanah & pengawasan ritase (hari kerja & upah harian)
     - Surveyor topografi & tim helper ukur elevasi (hari kerja & upah harian)
- **Indikator Kinerja & Efisiensi Otomatis**:
  - Neraca tanah bersih (*net balance*): mendeteksi surplus galian (perlu hauling buang keluar) atau defisit urugan (butuh tanah urug borrow pit).
  - Grand total biaya operasional pematangan tanah.
  - Biaya efektif per $m^3$ tanah olah.
- **Integrasi Langsung ke Komponen Anggaran RAB Proyek**:
  - Pilihan pembebanan anggaran: `Realisasi Langsung` atau `Komitmen Terbuka (PO/Kontrak)`.
  - Terhubung ke cost code `EW-HAUL-02` (*Pekerjaan Cut and Fill & Hauling Tanah Galian*) atau item pekerjaan tanah lainnya.
  - Simulasi dampak anggaran langsung di modal: memperlihatkan pergeseran nilai realisasi, komitmen, dan sisa pagu anggaran tersedia.
  - Pencatatan otomatis ke jejak audit forensik (`audit_events`) dan sinkronisasi data persistensi.

### 6. Pengujian Mutu & Skenario Uji Penerimaan (Acceptance Testing)
- **AT-21**: Skenario uji otomatis `Pematangan Tanah (Cut & Fill) & Integrasi Realisasi RAB`:
  - Memverifikasi eksekusi kalkulasi galian dan urugan.
  - Memverifikasi akurasi penjumlahan 4 pilar biaya operasional.
  - Memverifikasi penambahan otomatis nilai realisasi pada anggaran proyek `EW-HAUL-02`.
