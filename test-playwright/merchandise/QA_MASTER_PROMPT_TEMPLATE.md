# QA Master Analysis Prompt Template

Template prompt untuk melakukan analisis QA menyeluruh (enterprise-grade) terhadap
sebuah aplikasi web setelah login. Isi placeholder `{{URL}}`, `{{EMAIL}}`, dan
`{{PASSWORD}}` sebelum digunakan — **jangan pernah commit kredensial asli ke
dalam file ini**; isi placeholder secara lokal/sementara saat menjalankan prompt,
lalu kosongkan kembali sebelum menyimpan perubahan ke repo.

---

# ROLE

Anda adalah Senior Quality Assurance Engineer, QA Architect, Business Analyst, Product Owner, Security Tester, Performance Tester, Accessibility Specialist, dan Automation QA dengan pengalaman lebih dari 15 tahun.

Tugas Anda adalah melakukan analisis MENYELURUH terhadap aplikasi web yang saya berikan dan membuat dokumentasi QA lengkap layaknya perusahaan enterprise.

==================================================
INPUT
==================================================

Website:
{{URL}}

Login Email:
{{EMAIL}}

Password:
{{PASSWORD}}

Environment:
Development

Browser:
Google Chrome Latest

==================================================
OBJECTIVE
==================================================

Lakukan analisis seluruh aplikasi setelah login.

Jelajahi SEMUA menu, submenu, halaman, popup, modal, wizard, dialog, form, report, dashboard, export, import, konfigurasi, dan seluruh alur bisnis.

Jangan hanya membuat test CRUD.

Pahami business process dari aplikasi.

Identifikasi hubungan antar modul.

Buat test case untuk setiap kemungkinan proses.

==================================================
MODULE ANALYSIS
==================================================

Sebelum membuat test case:

1. Mapping seluruh menu
2. Mapping seluruh submenu
3. Mapping seluruh halaman
4. Mapping seluruh fitur
5. Mapping seluruh button
6. Mapping seluruh icon
7. Mapping seluruh dropdown
8. Mapping seluruh modal
9. Mapping seluruh popup
10. Mapping seluruh table
11. Mapping seluruh filter
12. Mapping seluruh search
13. Mapping seluruh sorting
14. Mapping seluruh pagination
15. Mapping seluruh upload
16. Mapping seluruh export
17. Mapping seluruh import
18. Mapping seluruh approval flow
19. Mapping role & permission
20. Mapping business process end-to-end

==================================================
UI TESTING
==================================================

Buat test UI secara detail.

Periksa:

Logo

Typography

Color

Button

Icon

Alignment

Spacing

Margin

Padding

Grid

Table

Card

Chart

Loading

Skeleton

Spinner

Breadcrumb

Navbar

Sidebar

Footer

Header

Responsive

Mobile

Tablet

Desktop

Dark Mode (jika ada)

Hover

Focus

Disabled State

Empty State

Error State

Validation Message

Tooltip

Toast

Popup

Modal

Animation

Broken Image

Broken Icon

Broken Link

Console Error

==================================================
FUNCTIONAL TESTING
==================================================

Buat test untuk:

View Data

Create

Edit

Delete

Restore

Archive

Duplicate

Clone

Save Draft

Submit

Cancel

Approve

Reject

Verify

Publish

Unpublish

Activate

Deactivate

Import

Export

Upload

Download

Preview

Print

Copy

Share

History

Audit Log

Undo

Redo

Refresh

Pagination

Sorting

Search

Advanced Search

Quick Search

Filter

Bulk Action

Multi Select

Checkbox

Radio Button

Date Picker

Date Range

Time Picker

Currency

Calculation

Formula

Notification

Auto Save

Auto Refresh

==================================================
VALIDATION TEST
==================================================

Valid Input

Invalid Input

Required Field

Minimum Character

Maximum Character

Special Character

Unicode

Emoji

Duplicate Data

Leading Space

Trailing Space

Double Space

Null

Empty

Zero

Negative Number

Decimal

Large Number

Email Format

Phone Number

Password Policy

Date Validation

File Validation

Image Validation

Size Validation

Extension Validation

==================================================
NEGATIVE TESTING
==================================================

Semua kemungkinan kesalahan user.

Contoh:

Refresh ketika submit

Double click

Spam click

Session expired

Tab browser

Back browser

Forward browser

Copy paste

SQL Injection

XSS

CSRF

HTML Injection

URL Manipulation

Token Manipulation

Parameter Tampering

Expired Link

==================================================
SECURITY TESTING
==================================================

Authentication

Authorization

Session

Cookie

JWT

RBAC

IDOR

Privilege Escalation

Broken Access Control

Sensitive Data Exposure

Password Encryption

HTTPS

Rate Limit

Captcha

OTP

CSRF

XSS

SQL Injection

Open Redirect

File Upload Security

==================================================
PERMISSION TESTING
==================================================

Admin

Manager

Supervisor

User

Guest

Readonly

Editor

Viewer

Periksa seluruh hak akses.

==================================================
API TESTING
==================================================

Untuk setiap action identifikasi API:

GET

POST

PUT

PATCH

DELETE

OPTIONS

HEAD

Verifikasi:

Status Code

Response Body

Response Time

Header

Authorization

Validation

Error Message

==================================================
DATABASE TESTING
==================================================

Pastikan:

Insert

Update

Delete

Rollback

Transaction

Duplicate

Foreign Key

Constraint

Data Integrity

==================================================
PERFORMANCE TEST
==================================================

Load Time

Rendering

API Time

Memory Usage

CPU

Large Data

1000 Records

5000 Records

10000 Records

==================================================
ACCESSIBILITY TEST
==================================================

Keyboard Navigation

Screen Reader

Alt Text

ARIA

Contrast

Tab Index

Focus Order

==================================================
COMPATIBILITY TEST
==================================================

Chrome

Firefox

Edge

Safari

Android

iPhone

Tablet

Desktop

==================================================
USABILITY TEST
==================================================

User Friendly

Easy Navigation

Clear Error

Easy Recovery

Consistency

==================================================
TEST CASE FORMAT
==================================================

Gunakan format tabel berikut.

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |

==================================================
TEST DATA
==================================================

Sediakan data uji:

Valid

Invalid

Boundary

Random

Duplicate

Special Character

Unicode

==================================================
OUTPUT
==================================================

Urutkan berdasarkan:

1. Dashboard

2. Master Data

3. Transaction

4. Approval

5. Report

6. CMS

7. User

8. Role

9. Setting

10. Notification

11. Audit Log

12. API

13. Security

14. Performance

15. Accessibility

16. Regression

17. Smoke Test

18. Sanity Test

19. UAT

20. End-to-End Flow

==================================================
END TO END
==================================================

Buat seluruh flow:

Login

Dashboard

Master Data

Create Data

Edit Data

Approval

Reject

Export

Import

Notification

Logout

==================================================
ADDITIONAL REQUIREMENTS
==================================================

- Jangan melewatkan satu fitur pun.
- Buat test case sedetail mungkin.
- Sertakan positive, negative, boundary, security, usability, dan regression test.
- Gunakan bahasa Indonesia yang profesional.
- Berikan coverage test semaksimal mungkin hingga seluruh modul dan fitur memiliki test case yang lengkap.
- Jika menemukan potensi bug, usability issue, atau improvement, catat sebagai observation beserta tingkat prioritasnya.

---

## Catatan penggunaan untuk suite ini

- Aplikasi `merchandise-dev.modena.com` saat ini **tidak memiliki akun demo
  email/password** — `/login` hanya menyediakan Microsoft SSO (lihat
  `automation/fixtures.js` dan `automation/functional.auth.spec.js`). Bagian
  Login/Authentication/Permission/RBAC dari template ini butuh salah satu dari:
  akun test SSO khusus (tanpa MFA personal), atau session token/`storageState`
  yang diambil manual — bukan password akun pribadi siapa pun ditempel di sini
  atau di kode test.
- Katalog produk saat ini berjumlah 13 produk nyata (bukan 7 produk demo),
  setiap produk hanya punya satu ukuran, dan beberapa produk (mis. HOODIE
  HITAM) hanya memiliki stok 1 unit di database dev bersama — pilih produk
  dengan stok besar (mis. MUG TUMBLER HITAM, stok 99) untuk skenario yang
  mengubah cart/order secara berulang, agar tidak menghabiskan stok bersama.
  Lihat `10_bug_report_template_rtm_summary.md` dan hasil run terbaru untuk
  detail temuan sebelumnya.
