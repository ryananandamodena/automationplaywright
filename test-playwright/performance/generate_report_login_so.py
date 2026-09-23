# -*- coding: utf-8 -*-
"""Generate detailed Excel report for the Login + Sales Order scale test
(50 / 100 / 200 / 300 concurrent sessions)."""
import json
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import LineChart, BarChart, Reference
from openpyxl.utils import get_column_letter

BASE = os.path.dirname(os.path.abspath(__file__))
RESULTS = os.path.join(BASE, "results")

HEADER_FILL = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
HEADER_FONT = Font(color="FFFFFF", bold=True)
TITLE_FONT = Font(size=14, bold=True, color="1F4E78")
RED_FONT = Font(bold=True, color="C00000")
GREEN_FILL = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
RED_FILL = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
THIN = Side(style="thin", color="B7B7B7")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def style_header(ws, row, ncols, start_col=1):
    for c in range(start_col, start_col + ncols):
        cell = ws.cell(row=row, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = BORDER


def autofit(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def load_json(fname):
    with open(os.path.join(RESULTS, fname), encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------- Load data
SCALES = [30, 50, 100, 200, 300]

# 30-session run uses the old aggregate-only script; hardcode from earlier run.
scale_30 = {
    "sessions": 30, "succeeded": 30, "failed": 0, "successRatePct": 100.0,
    "totalDurationMs": 50953,
    "stageStats": {
        "gotoHome": {"avg": None, "median": None, "p90": None, "p95": None, "min": None, "max": None},
        "login": {"avg": 42805, "median": None, "p90": None, "p95": None, "min": None, "max": None},
        "salesOrder": {"avg": 2029, "median": None, "p90": None, "p95": None, "min": None, "max": None},
    },
    "errorGroups": {},
    "perSession": None,
}

detailed = {30: scale_30}
for s in [50, 100, 200, 300]:
    detailed[s] = load_json(f"mhc-login-so-{s}sessions-detailed.json")

wb = Workbook()

# ============================================================ SHEET 1: Ringkasan
ws = wb.active
ws.title = "Ringkasan"
ws["A1"] = "Laporan Detail Stress Test - Login + Sales Order (MHC Portal)"
ws["A1"].font = TITLE_FONT
ws["A2"] = "Target: more-dev.modena.com | Flow: Login -> Sales Order | Skala: 30, 50, 100, 200, 300 sesi bersamaan | Tanggal: 2026-07-30"
ws["A2"].font = Font(italic=True, color="666666")

row = 4
ws.cell(row=row, column=1, value="A. Ringkasan Hasil per Skala").font = Font(bold=True, size=12)
row += 1

headers = ["Concurrent Sessions", "Berhasil", "Gagal", "Success Rate (%)",
           "Avg Login (ms)", "Median Login (ms)", "P95 Login (ms)",
           "Avg Sales Order (ms)", "Total Durasi Test (ms)"]
for c, h in enumerate(headers, start=1):
    ws.cell(row=row, column=c, value=h)
style_header(ws, row, len(headers))
row += 1
data_start = row
for s in SCALES:
    d = detailed[s]
    ws.cell(row=row, column=1, value=s)
    ws.cell(row=row, column=2, value=d["succeeded"])
    ws.cell(row=row, column=3, value=d["failed"])
    rate_cell = ws.cell(row=row, column=4, value=round(d["successRatePct"], 1))
    ws.cell(row=row, column=5, value=d["stageStats"]["login"]["avg"])
    ws.cell(row=row, column=6, value=d["stageStats"]["login"]["median"])
    ws.cell(row=row, column=7, value=d["stageStats"]["login"]["p95"])
    ws.cell(row=row, column=8, value=d["stageStats"]["salesOrder"]["avg"])
    ws.cell(row=row, column=9, value=d["totalDurationMs"])
    fill = GREEN_FILL if d["successRatePct"] >= 90 else RED_FILL
    rate_cell.fill = fill
    for c in range(1, len(headers) + 1):
        ws.cell(row=row, column=c).border = BORDER
        ws.cell(row=row, column=c).alignment = Alignment(horizontal="center")
    row += 1
data_end = row - 1

row += 2
ws.cell(row=row, column=1, value="B. Breakdown Jenis Error per Skala").font = Font(bold=True, size=12)
row += 1
err_headers = ["Sessions", "Jenis Error", "Jumlah"]
for c, h in enumerate(err_headers, start=1):
    ws.cell(row=row, column=c, value=h)
style_header(ws, row, len(err_headers))
row += 1
for s in SCALES:
    eg = detailed[s].get("errorGroups") or {}
    if not eg:
        ws.cell(row=row, column=1, value=s)
        ws.cell(row=row, column=2, value="(tidak ada kegagalan)")
        ws.cell(row=row, column=3, value=0)
        row += 1
        continue
    for err, count in eg.items():
        ws.cell(row=row, column=1, value=s)
        ws.cell(row=row, column=2, value=err)
        ws.cell(row=row, column=3, value=count)
        row += 1

row += 2
ws.cell(row=row, column=1, value="C. Temuan & Analisis").font = RED_FONT
row += 1
findings = [
    "1. Titik kritis (breaking point) ada di ANTARA 30 dan 50 sesi bersamaan: 30 sesi = 100% sukses (login rata-rata "
    "42.8 detik), 50 sesi turun ke 32% sukses (16/50 berhasil, 34 gagal timeout).",
    "2. Pada 100, 200, dan 300 sesi bersamaan: KOLAPS TOTAL - 0% sukses (100% gagal) di ketiganya. Semua sesi gagal "
    "di langkah paling awal (page.goto ke halaman home), bahkan SEBELUM sempat mengisi form login.",
    "3. Sinyal penting: total durasi test di 100/200/300 sesi hanya 37-53 detik - HAMPIR SAMA dengan batas timeout "
    "(30 detik) per request, bukan bertambah lama sesuai jumlah sesi. Ini pola khas SATURASI TOTAL "
    "(sistem/koneksi macet total), bukan sekadar respons yang melambat bertahap.",
    "4. Di 50 sesi, jenis error mulai bervariasi: 10 gagal di 'page.goto' (load halaman awal) dan 24 gagal di "
    "'locator.click' (klik tombol Sign In macet/hang) - menunjukkan proses LOGIN/AUTH mulai jadi bottleneck utama "
    "begitu beban naik, bahkan untuk sesi yang berhasil load halaman awal.",
    "5. Sales Order tetap konsisten cepat (rata-rata 1.8-2 detik) di SEMUA skala yang datanya tersedia (30 & 50 sesi) "
    "- mengonfirmasi ulang bahwa bottleneck ada di tahap LOGIN, bukan di halaman Sales Order itu sendiri.",
    "6. CATATAN METODOLOGI PENTING: seluruh sesi (termasuk yang 300 sekaligus) dijalankan dari SATU mesin client yang "
    "sama. Kegagalan identik 100% di 100/200/300 sangat mungkin juga mencerminkan mesin client kehabisan resource "
    "(CPU/RAM untuk menjalankan ratusan proses Chromium headless sekaligus), bukan murni kegagalan server. Untuk "
    "memastikan murni server-side, disarankan uji ulang dari beberapa mesin/agent load-generator terpisah, atau "
    "minta tim infra memonitor metrik server (CPU, RAM, connection pool, response time endpoint login) selama test "
    "berjalan.",
    "7. Rekomendasi tindak lanjut: (a) uji titik presisi antara 30-50 sesi (mis. 35, 40, 45) untuk menemukan angka "
    "breaking point yang lebih akurat; (b) investigasi endpoint/API yang dipanggil saat klik Sign In - kemungkinan "
    "ada query database/company-lookup yang tidak efisien di bawah beban; (c) uji dari minimal 2-3 mesin berbeda "
    "untuk memisahkan bottleneck client vs server secara definitif.",
]
for f in findings:
    ws.cell(row=row, column=1, value=f)
    ws.cell(row=row, column=1).alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=9)
    ws.row_dimensions[row].height = 60
    row += 1

autofit(ws, [20, 12, 12, 16, 14, 16, 14, 18, 18])

# ============================================================ SHEET 2: Grafik
ws2 = wb.create_sheet("Grafik")
ws2["A1"] = "Grafik Performa vs Concurrency"
ws2["A1"].font = TITLE_FONT

chdr = ["Sessions", "Success Rate (%)", "Failed Count", "Avg Login (ms)", "Avg Sales Order (ms)"]
for c, h in enumerate(chdr, start=1):
    ws2.cell(row=3, column=c, value=h)
style_header(ws2, 3, len(chdr))
for i, s in enumerate(SCALES):
    d = detailed[s]
    rr = 4 + i
    ws2.cell(row=rr, column=1, value=s)
    ws2.cell(row=rr, column=2, value=round(d["successRatePct"], 1))
    ws2.cell(row=rr, column=3, value=d["failed"])
    ws2.cell(row=rr, column=4, value=d["stageStats"]["login"]["avg"])
    ws2.cell(row=rr, column=5, value=d["stageStats"]["salesOrder"]["avg"])
last_row = 3 + len(SCALES)

bar = BarChart()
bar.title = "Success Rate (%) vs Jumlah Sesi Bersamaan"
bar.style = 10
bar.y_axis.title = "Success Rate (%)"
bar.x_axis.title = "Concurrent Sessions"
bdata = Reference(ws2, min_col=2, min_row=3, max_row=last_row)
cats = Reference(ws2, min_col=1, min_row=4, max_row=last_row)
bar.add_data(bdata, titles_from_data=True)
bar.set_categories(cats)
bar.width = 22
bar.height = 11
ws2.add_chart(bar, "A9")

bar2 = BarChart()
bar2.title = "Jumlah Sesi Gagal vs Jumlah Sesi Bersamaan"
bar2.style = 11
bar2.y_axis.title = "Sesi Gagal"
bar2.x_axis.title = "Concurrent Sessions"
bdata2 = Reference(ws2, min_col=3, min_row=3, max_row=last_row)
bar2.add_data(bdata2, titles_from_data=True)
bar2.set_categories(cats)
bar2.width = 22
bar2.height = 11
ws2.add_chart(bar2, "A28")

line = LineChart()
line.title = "Avg Login & Sales Order Time (ms) vs Concurrency (hanya skala dgn data sukses)"
line.style = 12
line.y_axis.title = "ms"
line.x_axis.title = "Concurrent Sessions"
ldata = Reference(ws2, min_col=4, max_col=5, min_row=3, max_row=last_row)
line.add_data(ldata, titles_from_data=True)
line.set_categories(cats)
line.width = 22
line.height = 11
ws2.add_chart(line, "A47")

autofit(ws2, [12, 16, 14, 16, 20])

# ============================================================ SHEET 3: Detail 50 sesi (percentile & per-session)
ws3 = wb.create_sheet("Detail 50 Sesi")
ws3["A1"] = "Detail Lengkap - 50 Concurrent Sessions (Login + Sales Order)"
ws3["A1"].font = TITLE_FONT

d50 = detailed[50]
ws3["A3"] = "Statistik Waktu per Tahap (ms)"
ws3["A3"].font = Font(bold=True, size=12)
sh = ["Tahap", "Count", "Min", "Median", "Avg", "P90", "P95", "Max"]
for c, h in enumerate(sh, start=1):
    ws3.cell(row=4, column=c, value=h)
style_header(ws3, 4, len(sh))
stage_names = {"gotoHome": "Load Halaman Awal", "login": "Login", "salesOrder": "Sales Order"}
row = 5
for key, label in stage_names.items():
    st = d50["stageStats"][key]
    ws3.cell(row=row, column=1, value=label)
    ws3.cell(row=row, column=2, value=st["count"])
    ws3.cell(row=row, column=3, value=st["min"])
    ws3.cell(row=row, column=4, value=st["median"])
    ws3.cell(row=row, column=5, value=st["avg"])
    ws3.cell(row=row, column=6, value=st["p90"])
    ws3.cell(row=row, column=7, value=st["p95"])
    ws3.cell(row=row, column=8, value=st["max"])
    row += 1

row += 2
ws3.cell(row=row, column=1, value="Data Mentah per Sesi (50 sesi)").font = Font(bold=True, size=12)
row += 1
ph = ["Session ID", "Status", "Load Home (ms)", "Login (ms)", "Sales Order (ms)", "HTTP Calls", "HTTP Failures", "Error"]
for c, h in enumerate(ph, start=1):
    ws3.cell(row=row, column=c, value=h)
style_header(ws3, row, len(ph))
row += 1
for p in d50["perSession"]:
    ws3.cell(row=row, column=1, value=p["id"])
    status_cell = ws3.cell(row=row, column=2, value="OK" if p["ok"] else "GAGAL")
    status_cell.fill = GREEN_FILL if p["ok"] else RED_FILL
    ws3.cell(row=row, column=3, value=p["gotoHomeMs"])
    ws3.cell(row=row, column=4, value=p["loginMs"])
    ws3.cell(row=row, column=5, value=p["salesOrderMs"])
    ws3.cell(row=row, column=6, value=p["httpCallCount"])
    ws3.cell(row=row, column=7, value=p["httpFailureCount"])
    err = (p["errors"][0].split("\n")[0] if p["errors"] else "")
    ws3.cell(row=row, column=8, value=err)
    for c in range(1, len(ph) + 1):
        ws3.cell(row=row, column=c).border = BORDER
    row += 1

autofit(ws3, [12, 10, 16, 14, 16, 12, 14, 55])

# ============================================================ SHEET 4: Detail kegagalan 100/200/300
for s in [100, 200, 300]:
    wsx = wb.create_sheet(f"Kegagalan {s} Sesi")
    wsx["A1"] = f"Detail Kegagalan Total - {s} Concurrent Sessions"
    wsx["A1"].font = TITLE_FONT
    d = detailed[s]
    wsx["A2"] = (f"Success rate: {d['successRatePct']}% ({d['succeeded']}/{d['sessions']}) | "
                 f"Total durasi test: {d['totalDurationMs']} ms")
    wsx["A2"].font = Font(italic=True)
    fh = ["Session ID", "Error"]
    for c, h in enumerate(fh, start=1):
        wsx.cell(row=4, column=c, value=h)
    style_header(wsx, 4, 2)
    row = 5
    for p in d["perSession"]:
        if p["ok"]:
            continue
        wsx.cell(row=row, column=1, value=p["id"])
        err = p["errors"][0].split("\n")[0] if p["errors"] else ""
        wsx.cell(row=row, column=2, value=err)
        row += 1
    autofit(wsx, [14, 60])

out_path = os.path.join(RESULTS, "MHC-Login-SalesOrder-Stress-Report-Detailed.xlsx")
wb.save(out_path)
print("Saved:", out_path)
