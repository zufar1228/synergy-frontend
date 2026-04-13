# Panduan Halaman Kalibrasi — MPU6050 Calibration Control

> **Untuk siapa panduan ini?**
> Panduan ini ditujukan untuk siapa saja yang ingin menggunakan halaman kalibrasi, termasuk yang tidak memiliki latar belakang teknis. Semua istilah teknis akan dijelaskan dengan bahasa yang mudah dipahami.

---

## Apa itu Halaman Kalibrasi?

Halaman Kalibrasi adalah panel kontrol berbasis web untuk mengoperasikan sensor getar (MPU6050) yang terpasang pada pintu gudang. Sensor ini digunakan untuk **mengumpulkan data getaran/benturan pintu** guna menentukan **nilai ambang batas (threshold)** sistem deteksi intrusi.

### Mengapa perlu kalibrasi?

Sistem keamanan pintu gudang ini menggunakan **algoritma berbasis threshold** (tanpa Machine Learning). Prinsipnya sederhana:

> Jika getaran **melewati threshold lebih dari 1 kali** dalam sebuah **jendela waktu tertentu**, maka alarm dibunyikan.

Tujuan kalibrasi adalah **mengumpulkan data nyata** untuk membuktikan bahwa:

1. **Getaran derau lingkungan** (angin, kendaraan lewat, dll.) **tidak melewati threshold** — sehingga tidak memicu alarm palsu
2. **Benturan tunggal tidak disengaja** (seseorang tidak sengaja menyenggol pintu) **hanya melewati threshold 1 kali** — sehingga tidak memicu alarm karena syaratnya harus lebih dari 1x
3. **Upaya intrusi nyata** (pemahatan, pendobrakan) **melewati threshold berkali-kali** dalam jendela waktu — sehingga alarm benar-benar berbunyi

Dengan data dari 3 sesi percobaan (ambient, pendobrakan, pemahatan), kita bisa menentukan **nilai threshold yang tepat** — cukup tinggi agar tidak terganggu derau, tapi cukup rendah agar bisa mendeteksi upaya intrusi.

Dengan halaman ini, kamu bisa:

- Memerintahkan sensor untuk mulai atau berhenti merekam data
- Memilih jenis percobaan yang ingin dilakukan
- Memantau status sensor secara real-time
- Melihat semua data yang sudah terkumpul
- **Membandingkan nilai getaran antar sesi** untuk menentukan threshold optimal

---

## Gambaran Umum Tampilan Halaman

```
┌──────────────────────────────────────────────────────────────┐
│  MPU6050 Calibration Control                                 │
│  [Input Device ID]                                           │
├──────────────────────────────────┬───────────────────────────┤
│  CALIBRATION CONTROL             │  DEVICE STATUS            │
│  (Panel Kontrol)                 │  (Status Sensor)          │
├──────────────────────────────────┴───────────────────────────┤
│  CALIBRATION DATA TABLE                                      │
│  (Tabel Data Kalibrasi — 6 tab)                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Bagian 1: Device ID (ID Perangkat)

Di bagian paling atas terdapat kotak input bertuliskan **Device ID**.

- **Fungsi:** Menentukan sensor mana yang ingin kamu kendalikan
- **Isi default:** UUID panjang seperti `8e819e4a-9710-491f-9fbc-741892ae6195` — ini adalah ID unik sensor yang terpasang
- **Kapan diubah?** Hanya jika kamu punya lebih dari satu sensor/perangkat. Untuk penggunaan normal, biarkan saja isinya (jangan diubah)

> 💡 UUID adalah semacam "nomor KTP" untuk sensor. Setiap sensor punya nomor unik yang berbeda.

---

## Bagian 2: Panel Kontrol Kalibrasi (Calibration Control)

Ini adalah panel utama untuk **mengirim perintah ke sensor**. Terletak di sisi kiri.

### 2.1 Tombol STOP (Besar, Merah)

```
[ ⏹ STOP ]
```

- **Fungsi:** Menghentikan perekaman data seketika
- **Kapan digunakan:** Tekan tombol ini kapan saja ketika ingin menghentikan sesi yang sedang berjalan
- **Posisi:** Sudut kanan atas panel kontrol — mudah dijangkau
- **Efek suara:** Bunyi "bip" pendek saat berhasil

> ⚠️ Tombol STOP akan selalu aktif (tidak abu-abu). Tekan kapanpun kamu perlu menghentikan rekaman.

---

### 2.2 Kotak Pesan Status

Di bawah judul panel, ada kotak kecil yang muncul setelah kamu menekan tombol apapun:

- **Latar hijau + tanda ✓** → Perintah berhasil dikirim ke sensor
  - Contoh: `✓ B/3 started — senggolan_bahu`
- **Latar merah + tanda ✗** → Terjadi kesalahan
  - Contoh: `✗ Device ID is required`

---

### 2.3 Tab Sesi (Session Tabs)

Ada 3 tab sesi yang merepresentasikan **jenis percobaan** berbeda:

| Tab   | Nama    | Penjelasan                                                                                                                                                                                               |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Ambient | Rekam derau/kebisingan alami lingkungan — **pintu tertutup, tanpa gangguan apapun**. Data ini menjadi dasar untuk memastikan threshold **di atas** level derau                                           |
| **B** | Ramming | Rekam data benturan **tunggal** pada pintu (pukulan, senggolan, tendangan). Tujuannya membuktikan bahwa benturan tunggal tidak disengaja **hanya melewati threshold 1x** sehingga **tidak memicu alarm** |
| **C** | Chisel  | Rekam data **pemahatan/gesekan berulang** menggunakan obeng atau alat lain. Simulasi upaya intrusi nyata yang harus **melewati threshold berkali-kali** dan **memicu alarm**                             |

Klik tab yang sesuai dengan jenis percobaan yang ingin kamu lakukan.

---

### 2.4 Tombol Trial (Percobaan Preset)

Setiap sesi memiliki daftar tombol percobaan yang sudah disiapkan. Ini adalah tombol besar berbentuk kartu yang mudah ditekan.

**Cara menggunakan:**

1. Pilih tab sesi (A / B / C / D)
2. Lihat daftar kartu percobaan yang tersedia
3. Klik kartu percobaan yang ingin dilakukan
4. Sensor akan otomatis mulai merekam

**Contoh untuk Sesi B (Impact):**

| Tombol              | Penjelasan                                          |
| ------------------- | --------------------------------------------------- |
| 1. Pukulan Tengah   | Pukul pintu di bagian tengah dengan tangan          |
| 2. Pukulan Pinggir  | Pukul pintu di bagian pinggir/tepi                  |
| 3. Senggolan Bahu   | Senggol pintu dengan bahu seperti orang lewat biasa |
| 4. Tendangan Ringan | Tendang ringan bagian bawah pintu                   |
| 5. Tendangan Keras  | Tendangan keras pada pintu                          |
| 6. Pukulan Keras    | Pukul keras sekali dengan tangan                    |
| 7. Ketukan Jari     | Ketuk pintu dengan jari keras 1x                    |

> 💡 Saat tombol ditekan:
>
> - Kartu berkedip kuning = perintah sedang dikirim
> - Kartu berubah hijau + badge **Done** = berhasil dimulai
> - Bunyi nada 2x = konfirmasi sukses

**Sesi A** hanya memiliki 1 percobaan (Baseline), **Sesi B** memiliki 7, dan **Sesi C** memiliki 7 percobaan.

---

### 2.5 Tombol Mark Done (T1, T2, ...)

Di bawah daftar kartu percobaan, ada barisan tombol kecil berlabel **T1, T2, T3, ...** dst.

- **Fungsi:** Menandai percobaan tertentu sebagai "sudah selesai" secara manual
- **Cara pakai:** Klik tombol `T3` misalnya, maka tombol berubah menjadi `✓ T3` (warna gelap = sudah selesai)
- **Ini hanya penanda lokal** — tidak mengirim perintah ke sensor, hanya membantu kamu melacak progress percobaan yang sudah dilakukan

---

### 2.6 Menu "Manual Control & Markers" (Kontrol Manual)

Ini adalah bagian tersembunyi yang bisa dibuka dengan mengklik tulisan **"Manual Control & Markers"**.

> Bagian ini untuk pengguna lanjutan. Jika kamu hanya mengikuti protokol percobaan standar, bagian ini **tidak perlu digunakan**.

Isinya:

| Kontrol                | Fungsi                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **Trial #**            | Masukkan nomor percobaan secara manual (angka bebas)                                                     |
| **Note**               | Masukkan catatan/keterangan percobaan bebas                                                              |
| **Set + Start Manual** | Mulai rekam dengan nomor trial dan catatan yang kamu masukkan sendiri                                    |
| **Mark**               | Sisipkan penanda (marker) di tengah rekaman yang sedang berjalan — berguna untuk menandai momen tertentu |
| **Recalibrate**        | Perintahkan sensor untuk mengkalibrasi ulang garis dasar (baseline) getarannya                           |

---

## Bagian 3: Status Sensor (Device Status)

Panel ini terletak di sisi kanan dan **otomatis diperbarui setiap 5 detik** tanpa perlu refresh halaman.

### Informasi yang Ditampilkan

| Label         | Arti                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **State**     | Status perekaman saat ini: `RECORDING` (sedang merekam) atau `IDLE/PAUSED` (standby/berhenti)                                 |
| **Session**   | Sesi yang aktif saat ini (A / B / C / D), atau `none` jika belum ada                                                          |
| **Trial**     | Nomor percobaan yang sedang berjalan                                                                                          |
| **Door**      | Status pintu: 🔒 `CLOSED` (tertutup) atau 🔓 `OPEN` (terbuka)                                                                 |
| **WiFi RSSI** | Kekuatan sinyal WiFi sensor dalam satuan dBm — semakin mendekati 0 semakin kuat (contoh: `-55 dBm` lebih baik dari `-80 dBm`) |
| **Uptime**    | Sudah berapa lama sensor menyala tanpa mati (contoh: `2h 15m`)                                                                |
| **Free Heap** | Sisa memori bebas pada sensor dalam KB — jika sangat kecil (< 20 KB) sensor mungkin perlu di-restart                          |
| **Last Seen** | Jam terakhir sensor mengirimkan sinyal hidup (heartbeat)                                                                      |

> 🔄 Tanda jam di sudut kanan atas panel (`Updated: 14:32:10`) menunjukkan kapan terakhir data diperbarui.

---

## Bagian 4: Tabel Data Kalibrasi (Calibration Data)

Bagian paling bawah halaman ini menampilkan **semua data yang sudah terkumpul** dari sensor. Ada 6 tab/tombol tampilan:

---

### Tab 1: Session Stats (Statistik per Sesi)

> **Cocok untuk:** Melihat gambaran besar setiap sesi setelah data terkumpul

Menampilkan **1 baris per sesi** (A, B, C, D) dengan kolom:

| Kolom   | Arti                                             |
| ------- | ------------------------------------------------ |
| Session | Nama sesi (A / B / C / D)                        |
| Trials  | Jumlah percobaan dalam sesi ini                  |
| Samples | Total jumlah titik data yang terekam             |
| Min Δg  | Nilai getaran terkecil yang terekam              |
| Max Δg  | Nilai getaran terbesar yang terekam              |
| Mean Δg | Rata-rata nilai getaran                          |
| StdDev  | Standar deviasi (seberapa bervariasi getarannya) |
| Median  | Nilai tengah getaran                             |
| P95     | 95% data berada di bawah nilai ini               |
| P99     | 99% data berada di bawah nilai ini               |

> `—` pada kolom berarti data belum cukup untuk dihitung (sesi baru dimulai)

---

### Tab 2: Summary (A) — Ringkasan Sesi A

> **Cocok untuk:** Menganalisis derau ambient dalam jendela waktu 5 detik

Menampilkan ringkasan periodik **setiap 5 detik** khusus untuk Sesi A (ambient noise). Kolom meliputi:

| Kolom           | Arti                                             |
| --------------- | ------------------------------------------------ |
| Session         | Nama sesi                                        |
| Trial           | Nomor percobaan                                  |
| Type            | Jenis ringkasan                                  |
| Samples         | Jumlah data dalam jendela 5 detik ini            |
| Min/Max/Mean Δg | Statistik dalam jendela waktu tersebut           |
| Window          | Durasi jendela waktu (biasanya 5000ms = 5 detik) |
| Time            | Jam saat data dihasilkan                         |

**Navigasi:**

- Tombol **← Prev** dan **Next →** untuk berpindah halaman jika data banyak
- Tombol **Refresh** untuk memuat ulang data terbaru

---

### Tab 3: Per-Trial (Statistik per Percobaan)

> **Cocok untuk:** Membandingkan hasil antar percobaan dalam satu sesi

Menampilkan statistik tiap percobaan dengan filter sesi.

**Filter tersedia:**

- Dropdown **Filter session**: Pilih `All`, `A`, `B`, `C`, atau `D`

Kolom yang ditampilkan sama dengan Session Stats, tapi lebih detail per nomor percobaan.

---

### Tab 4: Trial Peaks (Puncak per Percobaan)

> **Cocok untuk:** Melihat benturan terkuat dari setiap percobaan

Menampilkan **nilai getaran tertinggi (peak)** dari setiap percobaan.

| Kolom   | Arti                                        |
| ------- | ------------------------------------------- |
| Session | Nama sesi                                   |
| Trial   | Nomor percobaan                             |
| Peak Δg | Nilai getaran tertinggi dalam percobaan ini |
| Samples | Total data yang dianalisis                  |

---

### Tab 5: Peak Summary (Ringkasan Puncak per Sesi)

> **Cocok untuk:** Melihat variasi kekuatan benturan antar sesi secara keseluruhan

Satu baris per sesi, menunjukkan statistik dari nilai-nilai **peak** (puncak) across semua percobaan dalam sesi tersebut.

| Kolom       | Arti                                           |
| ----------- | ---------------------------------------------- |
| Session     | Nama sesi                                      |
| Trials      | Jumlah percobaan yang dianalisis               |
| Peak Min    | Nilai peak terkecil di semua percobaan         |
| Peak Max    | Nilai peak terbesar di semua percobaan         |
| Peak Mean   | Rata-rata peak                                 |
| Peak StdDev | Seberapa bervariasi nilai peak antar percobaan |

---

### Tab 6: Raw Data (Data Mentah)

> **Cocok untuk:** Inspeksi langsung data sensor titik per titik

Ini adalah **data paling lengkap** — setiap baris adalah 1 pembacaan sensor.

**Filter tersedia:**

- Dropdown **Session**: Pilih sesi tertentu atau `All`
- Input **Trial**: Ketik nomor percobaan untuk memfilter
- Tombol **Refresh**: Muat ulang data

| Kolom   | Arti                                          |
| ------- | --------------------------------------------- |
| Session | Nama sesi                                     |
| Trial   | Nomor percobaan                               |
| Δg      | Nilai getaran terukur (satuan gravitasi)      |
| Marker  | 📌 Jika ada, baris ini ditandai secara khusus |
| Note    | Catatan percobaan                             |
| Time    | Waktu pembacaan                               |

> Baris berwarna kuning = baris yang memiliki **Marker** (penanda khusus)

**Navigasi:** Tombol **← Prev** dan **Next →** tersedia karena data bisa mencapai ribuan baris.

---

## Alur Kerja Standar (Langkah demi Langkah)

Berikut urutan penggunaan halaman ini untuk satu sesi percobaan:

### Sebelum Mulai

1. Pastikan sensor sudah menyala dan terhubung ke WiFi
2. Buka halaman Kalibrasi di browser
3. Periksa panel **Device Status** — pastikan **State** menampilkan `IDLE/PAUSED` dan sinyal WiFi terdeteksi

### Melakukan Percobaan

1. **Pilih tab sesi** yang sesuai (contoh: klik tab **B — Impact**)
2. **Baca deskripsi percobaan** di bawah tab (contoh: "Benturan tunggal (pukulan, senggolan)")
3. **Siapkan posisi** — berdiri di depan pintu sesuai jenis percobaan
4. **Klik tombol percobaan** (contoh: "3. Senggolan Bahu")
5. Tunggu hingga kartu berubah hijau dan ada bunyi konfirmasi
6. **Lakukan aksi fisiknya** (dalam contoh ini: senggol pintu dengan bahu)
7. Setelah selesai, **tekan tombol ⏹ STOP** untuk mengakhiri rekaman
8. Klik tombol `T3` di bawah untuk menandai percobaan ini sebagai selesai
9. Ulangi untuk percobaan berikutnya

### Setelah Selesai

1. Buka tab **Session Stats** di tabel bawah untuk melihat ringkasan data
2. **Bandingkan nilai Δg antar sesi** — ini inti dari kalibrasi:
   - **Sesi A (Max Δg)** = batas atas derau lingkungan
   - **Sesi B (Max Δg)** = kekuatan benturan tunggal tidak disengaja
   - **Sesi C (Mean/P95 Δg)** = kekuatan getaran upaya intrusi
   - **Threshold ideal** = di atas Max Δg Sesi A, tapi di bawah Peak Δg Sesi C
3. Periksa tab **Peak Summary** untuk memastikan puncak getaran derau (A) **tidak bersinggungan** dengan puncak getaran intrusi (C)
4. Gunakan tab **Raw Data** jika ingin melihat data mentah secara detail

---

## Referensi Cepat: Semua Tombol

| Tombol                      | Di mana                  | Fungsi                                           |
| --------------------------- | ------------------------ | ------------------------------------------------ |
| **⏹ STOP**                  | Kanan atas panel kontrol | Hentikan rekaman sekarang                        |
| **A / B / C** (tab)       | Tengah panel kontrol     | Pilih jenis sesi percobaan                       |
| **Kartu Percobaan** (besar) | Di dalam tab sesi        | Mulai percobaan tertentu (Set + Start otomatis)  |
| **T1, T2, ... Tn**          | Di bawah kartu sesi      | Tandai percobaan sebagai selesai (penanda lokal) |
| **▶ Manual Control**        | Bawah panel kontrol      | Buka kontrol manual (klik untuk expand)          |
| **Set + Start Manual**      | Dalam Manual Control     | Mulai rekaman dengan parameter bebas             |
| **Mark**                    | Dalam Manual Control     | Sisipkan penanda di tengah rekaman aktif         |
| **Recalibrate**             | Dalam Manual Control     | Reset baseline sensor                            |
| **Session Stats**           | Tabel data               | Lihat statistik per sesi                         |
| **Summary (A)**             | Tabel data               | Lihat ringkasan berkala Sesi A                   |
| **Per-Trial**               | Tabel data               | Lihat statistik per percobaan                    |
| **Trial Peaks**             | Tabel data               | Lihat nilai puncak per percobaan                 |
| **Peak Summary**            | Tabel data               | Lihat ringkasan puncak per sesi                  |
| **Raw Data**                | Tabel data               | Lihat data mentah sensor                         |
| **Refresh**                 | Di dalam tabel data      | Muat ulang data terbaru                          |
| **← Prev / Next →**         | Di dalam tabel data      | Navigasi halaman data                            |

---

## Penjelasan Istilah Teknis

| Istilah          | Penjelasan Sederhana                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Δg (Delta-g)** | Satuan ukur getaran/percepatan dalam kelipatan gravitasi bumi. Nilai besar = getaran kuat. Ini adalah nilai yang dibandingkan dengan threshold untuk mendeteksi intrusi  |
| **Session**      | Kelompok percobaan dengan jenis yang sama (A=ambient, B=pendobrakan, C=pemahatan)                                                                    |
| **Trial**        | Satu kali percobaan individual dalam sebuah sesi                                                                                                                         |
| **MQTT**         | Protokol komunikasi yang digunakan untuk mengirim perintah dari web ke sensor                                                                                            |
| **UUID**         | ID unik berbentuk huruf dan angka panjang yang mengidentifikasi perangkat sensor                                                                                         |
| **Baseline**     | Garis dasar — nilai getaran "normal" saat tidak ada benturan, digunakan sebagai referensi untuk menentukan threshold                                                     |
| **Threshold**    | Nilai ambang batas getaran. Jika getaran melebihi threshold lebih dari 1x dalam jendela waktu tertentu, sistem menganggapnya sebagai upaya intrusi dan membunyikan alarm |
| **Heartbeat**    | Sinyal periodik yang dikirim sensor setiap beberapa detik untuk menandakan masih aktif                                                                                   |
| **RSSI**         | Kekuatan sinyal WiFi. Nilai -40 sampai -60 dBm = bagus; di bawah -80 dBm = lemah                                                                                         |
| **Free Heap**    | Sisa memori bebas di sensor. Jika sangat kecil, kinerja sensor bisa terganggu                                                                                            |
| **Marker**       | Penanda waktu yang disisipkan di data untuk menandai momen tertentu                                                                                                      |
| **StdDev**       | Standar deviasi — mengukur seberapa "tidak konsisten" nilai getaran (tinggi = bervariasi)                                                                                |
| **P95 / P99**    | Persentil ke-95/ke-99 — artinya 95%/99% data berada di bawah nilai ini                                                                                                   |

---

## Pertanyaan Umum (FAQ)

**Q: Tombol percobaan tidak bisa ditekan / abu-abu?**

> A: Ada proses yang sedang berjalan (loading ditunjukkan dengan warna kuning berkedip). Tunggu hingga selesai, atau tekan STOP terlebih dahulu.

**Q: Pesan "✗ Device ID is required" muncul?**

> A: Kotak Device ID di bagian atas halaman kosong. Isi dengan UUID sensor yang benar.

**Q: Panel Device Status menampilkan "No status data available yet"?**

> A: Sensor belum mengirimkan data status. Kemungkinan sensor baru saja dinyalakan dan belum kirim heartbeat pertama, atau koneksi WiFi bermasalah.

**Q: Data di tabel kosong semua?**

> A: Belum ada data yang terkumpul. Lakukan percobaan terlebih dahulu menggunakan panel kontrol.

**Q: Bagaimana cara mengetahui apakah sensor benar-benar merekam?**

> A: Periksa panel **Device Status** — kolom **State** harus menampilkan badge `RECORDING`.

**Q: Apakah menandai trial sebagai "Done" menghentikan rekaman?**

> A: Tidak. Tombol T1, T2, dst. hanya penanda visual lokal di browser. Untuk menghentikan rekaman, wajib tekan tombol **⏹ STOP**.

---

_Disusun berdasarkan kode sumber frontend `features/calibration/` — versi April 2026_
