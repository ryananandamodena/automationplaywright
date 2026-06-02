# Automation Scripts - Ryan

Folder ini digunakan oleh **Ryan** untuk menyimpan script automation testing.

## Struktur Folder

Simpan script sesuai kategori atau fitur yang diuji, misalnya:

```
Ryan/
├── login/
├── checkout/
├── regression/
└── utils/
```

## Panduan

- Beri nama file yang deskriptif, contoh: `test_login_valid.py`
- Setiap script sebaiknya berdiri sendiri dan bisa dijalankan secara independen
- Tambahkan komentar singkat di bagian atas script untuk menjelaskan tujuan test
- Gunakan folder terpisah untuk setiap modul atau fitur yang diuji

## Konvensi Penamaan

| Tipe | Contoh |
|------|--------|
| Test file | `test_<fitur>_<skenario>.py` |
| Utility | `utils_<nama>.py` |
| Config | `config_<env>.json` |
