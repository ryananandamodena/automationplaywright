# Playwright Test Dashboard

Web UI untuk menjalankan test Playwright dari browser — tanpa perlu buka terminal.
Dibuat untuk dipakai bersama tim QA di jaringan kantor (LAN).

## Menjalankan

Dari root repo (`test-playwright/`):

```bash
npm run dashboard
```

Server akan jalan di `http://0.0.0.0:4300`. Kamu bisa akses dari:
- Komputer sendiri: `http://localhost:4300`
- Komputer lain di jaringan kantor: `http://<IP-komputer-kamu>:4300`

Ganti port dengan env var kalau perlu: `DASHBOARD_PORT=5000 npm run dashboard`.

Server harus dijalankan manual oleh siapa saja yang mau host (tidak auto-start). Tutup terminal = server berhenti.

## Cara pakai

1. Pilih project dari dropdown.
2. Centang test file yang mau dijalankan (kosongkan semua untuk run seluruh project).
3. Klik **Run**.
4. Log muncul live di panel "Log Live". Kalau ada run lain yang sedang jalan, run barumu otomatis antre (queued) — cuma 1 run jalan dalam satu waktu.
5. Setelah selesai, klik **Buka Report** untuk lihat HTML report Playwright yang sesungguhnya (screenshot, video, trace).
6. Panel "Riwayat Run" menampilkan run-run sebelumnya beserta ringkasan pass/fail dan link report masing-masing.

## Project yang terdaftar

Total 15 project:

| Punya `playwright.config` sendiri | Numpang config root (`playwright.config.js`) |
|---|---|
| gccs, gccs-grading, gccs-mobile (+bluestacks), mhc-full | fms, merchandise, scb, sfa, scmp, prive, service_1, tersbarumobile, test, root-misc |

Spec file di dalam subfolder (misal `fms/building/branch_improvment/...`) otomatis terdeteksi rekursif dan ditampilkan dengan path relatifnya — bukan cuma nama filenya — supaya tidak rancu kalau ada nama file yang sama di folder berbeda.

## Menambah project baru

Edit `dashboard/projects.config.js`, tambahkan satu entry baru:

```js
{
  id: 'nama-unik',              // dipakai di URL /reports/<id>/
  label: 'Nama yang ditampilkan di dropdown',
  cwd: 'path/relatif/dari/root/repo',
  config: 'nama-file-playwright.config.js', // relatif terhadap cwd di atas
  testDir: 'folder-test',        // relatif terhadap cwd, sesuai testDir di config aslinya
  reportDir: 'folder-report',    // relatif terhadap cwd, sesuai reporter html outputFolder di config aslinya
  // shallow: true,              // opsional — hanya untuk kasus khusus seperti root-misc,
                                  // supaya TIDAK menyusuri subfolder (default: recursive)
}
```

Kalau project baru ini tidak punya `playwright.config` sendiri (jalan numpang config root seperti fms/merchandise/dst di atas), pakai `cwd: '.'`, `config: 'playwright.config.js'`, dan `testDir: '<nama-folder>'`.

Tidak perlu restart kode lain — cukup restart `npm run dashboard`.

## Catatan penting: report dibagi (shared) untuk project yang numpang config root

Semua project di kolom kanan tabel di atas menghasilkan report ke folder yang **sama**
(`playwright-report` di root repo), karena mereka semua jalan lewat config root yang sama.
Ini aman karena dashboard cuma menjalankan **1 run dalam satu waktu** (antre kalau ada yang jalan
bersamaan) — jadi "Buka Report" selalu menunjukkan hasil run yang baru saja kamu jalankan.
Yang TIDAK aman: kalau ada orang lain menjalankan `npx playwright test` manual dari terminal
ke folder yang sama persis saat dashboard sedang jalan — laporannya bisa tertimpa. Untuk
penggunaan normal (semua orang lewat dashboard), ini bukan masalah.

## Yang sengaja belum di-cover

- `more1/mhc` — config-nya (`playwright.config.mhc.js`) ternyata **rusak**: `testDir` menunjuk ke folder yang tidak ada (`mhc/staging`, seharusnya `staging/staging`). Perlu diperbaiki di project itu sendiri dulu sebelum didaftarkan ke dashboard.
- `gccs/gccs/` — folder duplikat identik dari `gccs/`, sengaja tidak didaftarkan.
- Autentikasi — tidak ada, dashboard ini murni untuk penggunaan internal di jaringan kantor yang dipercaya. Jangan expose port ini ke internet.
