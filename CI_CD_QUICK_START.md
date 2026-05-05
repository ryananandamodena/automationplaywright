# CI/CD Quick Start Guide

## ✅ File Workflow Sudah Siap!

File `.github/workflows/e2e-tests.yml` sudah dikonfigurasi dengan benar.

---

## 🚀 Langkah Setup (5 Menit)

### Step 1: Setup GitHub Secrets

1. Buka repository GitHub Anda
2. Klik **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Tambahkan secrets berikut:

| Secret Name | Value |
|-------------|-------|
| `ADMIN_EMAIL` | ryan.ananda@modena.com |
| `ADMIN_PASSWORD` | P@ssw0rd_ryan.ananda |
| `APPROVER1_EMAIL` | novyan.ramdhan@modena.com |
| `APPROVER1_PASSWORD` | P@ssw0rd_novyan.ramdhan |
| `APPROVER2_EMAIL` | daniel.aritonga@modena.com |
| `APPROVER2_PASSWORD` | P@ssw0rd_daniel.aritonga |
| `BASE_URL` | https://portal-dev.modena.com |

### Step 2: Push ke GitHub

```bash
git add .github/workflows/e2e-tests.yml
git commit -m "Add E2E test workflow"
git push origin main
```

### Step 3: Monitor Pipeline

1. Buka repository GitHub
2. Klik tab **Actions**
3. Lihat workflow "E2E Tests - FMS Contract & Service"
4. Klik run terbaru untuk melihat progress

---

## 📋 Konfigurasi Workflow

### Triggers
- ✅ Push ke `main`, `master`, `develop`
- ✅ Pull Request
- ✅ Manual trigger (workflow_dispatch)
- ✅ Scheduled: Setiap hari jam 2 AM WIB

### Tests yang Dijalankan
1. **contract** - Create Contract Simple
2. **service** - Full E2E (Contract + Service)
3. **approval** - Contract Approval Flow

### Artifacts
- Screenshots disimpan 7 hari
- Test results disimpan 7 hari

---

## 🔧 Troubleshooting

### Test Gagal?
1. Cek logs di Actions tab
2. Download screenshots dari artifacts
3. Pastikan secrets sudah benar

### Browser Installation Failed?
Workflow sudah menggunakan `npx playwright install --with-deps chromium`

### Timeout?
Default timeout sudah dikonfigurasi di script test

---

## 📞 Optional: Slack Notifications

Uncomment bagian Slack notification di file workflow:

```yaml
- name: Send Slack notification
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "E2E Tests Failed on ${{ matrix.test }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*E2E Tests Failed* :x:\n*Test:* ${{ matrix.test }}\n*Branch:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}"
            }
          }
        ]
      }
```

Tambahkan secret `SLACK_WEBHOOK_URL` di GitHub Secrets.

---

## ✅ Checklist

- [x] File workflow sudah dibuat
- [ ] Setup GitHub Secrets (6 secrets)
- [ ] Push ke repository
- [ ] Verify pipeline running
- [ ] (Optional) Setup Slack notifications

---

**Status: READY TO DEPLOY** 🚀