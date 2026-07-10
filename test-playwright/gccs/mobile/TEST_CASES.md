# GCCS Mobile - Test Case Documentation

## Overview
Dokumentasi lengkap test case untuk GCCS Mobile Application

**Test Environment**: Android Emulator (BlueStacks)  
**Testing Framework**: Playwright  
**Test Type**: End-to-End Functional Testing  
**Last Updated**: 2026-06-08  

---

## Test Credentials

| Field | Value |
|-------|-------|
| **Username** | TEC_IDR002 |
| **Password** | password.1 |
| **Environment URL** | https://gccs-mobile-test.modena.com |

---

## Positive Test Cases

### TC-MOB-001: Login Application - Valid Credentials

**Priority**: Critical  
**Severity**: High  
**Type**: Functional

#### Prerequisites
- GCCS Mobile app is accessible
- Valid test credentials available
- Network connection stable

#### Test Steps
1. Launch BlueStacks Emulator
2. Open aplikasi GCCS
3. Tunggu hingga halaman login tampil sempurna
4. Input username: `TEC_IDR002`
5. Input password: `password.1`
6. Klik tombol Login

#### Expected Results
- ✓ Login berhasil
- ✓ User diarahkan ke Dashboard
- ✓ Tidak muncul error message
- ✓ Session user berhasil dibuat
- ✓ Dashboard tampil sempurna

#### Test Data
```javascript
{
  username: "TEC_IDR002",
  password: "password.1"
}
```

---

### TC-MOB-002: Dashboard Display Verification

**Priority**: High  
**Severity**: High  
**Type**: Functional

#### Prerequisites
- User sudah login ke aplikasi

#### Test Steps
1. Setelah login berhasil
2. Verifikasi seluruh komponen Dashboard tampil
3. Pastikan data order muncul

#### Expected Results
- ✓ Dashboard berhasil dimuat
- ✓ Tidak ada loading infinite
- ✓ Data order tampil
- ✓ Tidak ada error popup
- ✓ Semua komponen UI tampil dengan benar

#### Validation Points
- Dashboard header visible
- Navigation menu accessible
- Order list displayed
- Filter/search components present
- No loading spinners after page load

---

### TC-MOB-003: Select RON with Waiting Confirmation Status

**Priority**: High  
**Severity**: Medium  
**Type**: Functional

#### Prerequisites
- User sudah login
- Dashboard sudah loaded
- Minimal ada 1 RON dengan status "Waiting Confirmation"

#### Test Steps
1. Pada Dashboard
2. Cari data RON dengan status: `Waiting Confirmation`
3. Pilih salah satu record pertama yang ditemukan
4. Klik record tersebut

#### Expected Results
- ✓ Detail RON terbuka
- ✓ Status masih Waiting Confirmation
- ✓ Detail customer tampil
- ✓ Detail visit tampil
- ✓ All RON information displayed correctly

#### Validation Points
- RON Number visible
- Customer name displayed
- Customer address shown
- Visit schedule information
- Product/service details
- Status badge showing "Waiting Confirmation"

---

### TC-MOB-004: Confirmation Process

**Priority**: Critical  
**Severity**: High  
**Type**: Functional

#### Prerequisites
- User sudah login
- RON detail page terbuka
- RON status = "Waiting Confirmation"
- Confirmation button tersedia

#### Test Steps
1. Pada halaman detail RON
2. Klik tombol: `Confirmation`
3. Tunggu proses selesai
4. Dismiss confirmation dialog jika ada

#### Expected Results
- ✓ Status berhasil berubah
- ✓ Tidak muncul error
- ✓ Success message muncul
- ✓ Data tersimpan ke database
- ✓ Confirmation timestamp recorded

#### Validation Points
- Success message displayed
- Status changed from "Waiting Confirmation"
- No error messages
- Data persisted to backend
- UI updated accordingly

---

### TC-MOB-005: Start Visit Process

**Priority**: Critical  
**Severity**: High  
**Type**: Functional

#### Prerequisites
- User sudah login
- RON sudah di-confirm
- Start Visit button tersedia
- GPS/Location enabled

#### Test Steps
1. Setelah confirmation berhasil
2. Klik tombol: `Start Visit`
3. Izinkan GPS jika diminta
4. Tunggu proses selesai

#### Expected Results
- ✓ Visit berhasil dimulai
- ✓ Status berubah menjadi: `In Progress`
- ✓ Timestamp visit tercatat
- ✓ Lokasi GPS tersimpan
- ✓ Success notification muncul

#### Validation Points
- Success notification shown
- Status = "In Progress"
- Start time recorded
- GPS coordinates captured
- Visit data saved to backend

#### Test Data
```javascript
{
  geolocation: {
    longitude: 106.8456,
    latitude: -6.2088
  }
}
```

---

## Negative Test Cases

### TC-MOB-NEG-001: Invalid Login - Wrong Password

**Priority**: High  
**Severity**: Medium  
**Type**: Negative

#### Prerequisites
- GCCS Mobile app is accessible
- Valid username available

#### Test Steps
1. Navigate to login page
2. Input username: `TEC_IDR002`
3. Input password: `wrongpassword`
4. Klik tombol Login

#### Expected Results
- ✓ Login gagal
- ✓ Error message tampil
- ✓ User tetap di halaman login
- ✓ No session created
- ✓ No redirect to dashboard

#### Test Data
```javascript
{
  username: "TEC_IDR002",
  password: "wrongpassword"
}
```

#### Validation Points
- Error message visible
- Error message text appropriate
- Login button still enabled
- Form fields not cleared
- URL remains on login page

---

### TC-MOB-NEG-002: Double Click Confirmation Prevention

**Priority**: Medium  
**Severity**: Medium  
**Type**: Negative

#### Prerequisites
- User sudah login
- RON detail page terbuka dengan Confirmation button

#### Test Steps
1. Pada halaman detail RON
2. Klik tombol Confirmation
3. Segera klik tombol Confirmation lagi (double click)

#### Expected Results
- ✓ Tidak membuat data duplikat
- ✓ Hanya satu proses confirmation
- ✓ Button disabled after first click
- ✓ No duplicate API calls

#### Validation Points
- Button disabled after click
- Loading state shown
- Only one confirmation record created
- No duplicate transactions

---

### TC-MOB-NEG-003: Double Click Start Visit Prevention

**Priority**: Medium  
**Severity**: Medium  
**Type**: Negative

#### Prerequisites
- User sudah login
- Start Visit button tersedia

#### Test Steps
1. Klik tombol Start Visit
2. Segera klik lagi (double click)

#### Expected Results
- ✓ Tidak membuat visit ganda
- ✓ Sistem menolak request kedua
- ✓ Button disabled after first click
- ✓ Only one visit record created

#### Validation Points
- Button disabled after click
- Loading indicator shown
- Only one visit created
- Second request rejected or ignored

---

## Test Execution Summary

### Test Coverage

| Module | Test Cases | Passed | Failed | Skipped |
|--------|-----------|--------|--------|---------|
| Login | 2 | - | - | - |
| Dashboard | 1 | - | - | - |
| RON Selection | 1 | - | - | - |
| Confirmation | 2 | - | - | - |
| Start Visit | 2 | - | - | - |
| **Total** | **8** | - | - | - |

### Priority Distribution

| Priority | Count |
|----------|-------|
| Critical | 3 |
| High | 4 |
| Medium | 3 |

### Test Type Distribution

| Type | Count |
|------|-------|
| Functional | 5 |
| Negative | 3 |

---

## Test Environment

### Hardware
- **Device**: BlueStacks 5 Emulator
- **OS**: Android 11
- **RAM**: Minimum 4GB
- **CPU**: 4 cores

### Software
- **Browser**: Chrome Android
- **Node.js**: v18+
- **Playwright**: ^1.40.0

### Network
- **Environment**: Test/Staging
- **Base URL**: https://gccs-mobile-test.modena.com
- **API Endpoint**: [To be configured]

---

## Bug Reporting Template

### Bug Severity Levels
- **Critical**: System crash, data loss, security issue
- **High**: Major functionality broken
- **Medium**: Feature not working as expected
- **Low**: Minor UI/UX issue

### Bug Report Format

```
BUG ID: BUG-GCCS-MOB-XXX
Module: [Login/Dashboard/RON/Confirmation/Visit]
Feature: [Feature name]
Severity: [Critical/High/Medium/Low]
Priority: [P1/P2/P3/P4]

Steps To Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Actual Result:
[What actually happened]

Expected Result:
[What should have happened]

Attachments:
- Screenshot: [path/to/screenshot.png]
- Video: [path/to/video.webm]
- Network Log: [path/to/network.har]

Environment:
- Device: BlueStacks Android
- Browser: Chrome Android
- App Version: [version]
- Test Date: [YYYY-MM-DD]

Additional Notes:
[Any additional information]
```

---

## Validation Checklist

### Login Validation
- [ ] Username field tersedia dan berfungsi
- [ ] Password field tersedia dan berfungsi
- [ ] Login button aktif dan clickable
- [ ] Login berhasil dengan credentials valid
- [ ] Error message untuk credentials invalid
- [ ] Session token tersimpan
- [ ] Redirect ke dashboard setelah login

### Dashboard Validation
- [ ] Dashboard page loaded completely
- [ ] No infinite loading
- [ ] Data order/RON tampil
- [ ] Navigation menu accessible
- [ ] Search/Filter berfungsi
- [ ] No JavaScript errors in console
- [ ] No broken UI elements

### Waiting Confirmation Validation
- [ ] Record dengan status "Waiting Confirmation" ditemukan
- [ ] Status badge tampil dengan benar
- [ ] Detail page terbuka saat record diklik
- [ ] Customer information complete
- [ ] Visit details displayed
- [ ] All fields populated correctly

### Confirmation Validation
- [ ] Confirmation button tersedia
- [ ] Button enabled dan clickable
- [ ] Confirmation process sukses
- [ ] Status berubah setelah confirmation
- [ ] Success message tampil
- [ ] Data tersimpan di backend
- [ ] No error messages

### Start Visit Validation
- [ ] Start Visit button tersedia
- [ ] GPS permission granted
- [ ] Location coordinates captured
- [ ] Visit started successfully
- [ ] Status berubah ke "In Progress"
- [ ] Timestamp tercatat
- [ ] Success notification muncul
- [ ] Data tersimpan di backend

---

## Additional Notes

### Performance Benchmarks
- Login time: < 3 seconds
- Dashboard load time: < 5 seconds
- RON detail load time: < 2 seconds
- Confirmation processing: < 3 seconds
- Start Visit processing: < 5 seconds

### Known Issues
[Document any known issues or limitations]

### Future Enhancements
- Add test for End Visit
- Add test for RON completion
- Add test for offline mode
- Add performance testing
- Add accessibility testing

---

**Document Owner**: QA Team  
**Reviewers**: [Names]  
**Approval**: [Name, Date]
