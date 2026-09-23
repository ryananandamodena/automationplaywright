# -*- coding: utf-8 -*-
"""Generate Excel stress-test report (tables + charts) for MHC portal."""
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
THIN = Side(style="thin", color="B7B7B7")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def style_header(ws, row, ncols):
    for c in range(1, ncols + 1):
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


# ---- Source data --------------------------------------------------------
browser_runs = [
    {"sessions": 3, "succeeded": 3, "failed": 0, "avgLogin": 6432, "avgSO": 1056, "avgPO": 1053, "totalDuration": 9034},
    {"sessions": 30, "succeeded": 30, "failed": 0, "avgLogin": 42805, "avgSO": 2029, "avgPO": 1736, "totalDuration": 50953},
    {"sessions": 100, "succeeded": 16, "failed": 84, "avgLogin": 40606, "avgSO": 1735, "avgPO": 1348, "totalDuration": 46483},
]

# Try to load the actual 100-session JSON to pull real failure list/count
try:
    r100 = load_json("mhc-browser-stress-100sessions.json")
    browser_runs[2]["succeeded"] = r100["succeeded"]
    browser_runs[2]["failed"] = r100["failed"]
    browser_runs[2]["avgLogin"] = r100["avgLoginMs"]
    browser_runs[2]["avgSO"] = r100["avgSalesOrderMs"]
    browser_runs[2]["avgPO"] = r100["avgPurchaseOrderMs"]
    browser_runs[2]["totalDuration"] = r100["totalDurationMs"]
    failures_100 = r100["failures"]
except FileNotFoundError:
    failures_100 = []

k6_summary = {
    "app": "MHC (more-dev.modena.com)",
    "vus_peak": 10,
    "hold_duration": "20s (ramp 30s + hold 20s + rampdown 30s)",
    "checks_pass_pct": 100.0,
    "total_requests": 507,
    "req_per_sec": 6.22,
    "avg_ms": 26.88,
    "median_ms": 13.5,
    "p90_ms": 52.96,
    "p95_ms": 103.81,
    "max_ms": 288.61,
    "failed_pct": 0.0,
    "pages_tested": "home, sales-order, purchase-order (unauthenticated route hit)",
}

wb = Workbook()

# ============================================================ SHEET 1: Summary
ws = wb.active
ws.title = "Ringkasan"
ws["A1"] = "Laporan Stress Test - MHC Portal (more-dev.modena.com)"
ws["A1"].font = TITLE_FONT
ws["A2"] = "Target: Login + Sales Order + Purchase Order | Tanggal: 2026-07-30"
ws["A2"].font = Font(italic=True, color="666666")

row = 4
ws.cell(row=row, column=1, value="A. Browser-Based Stress Test (sesi login penuh, paralel)")
ws.cell(row=row, column=1).font = Font(bold=True, size=12)
row += 1

headers = ["Concurrent Sessions", "Berhasil", "Gagal", "Success Rate (%)",
           "Avg Login (ms)", "Avg Sales Order (ms)", "Avg Purchase Order (ms)", "Total Durasi Test (ms)"]
for c, h in enumerate(headers, start=1):
    ws.cell(row=row, column=c, value=h)
style_header(ws, row, len(headers))
header_row = row
row += 1
data_start = row
for r in browser_runs:
    ws.cell(row=row, column=1, value=r["sessions"])
    ws.cell(row=row, column=2, value=r["succeeded"])
    ws.cell(row=row, column=3, value=r["failed"])
    ws.cell(row=row, column=4, value=round(r["succeeded"] / r["sessions"] * 100, 1))
    ws.cell(row=row, column=5, value=r["avgLogin"])
    ws.cell(row=row, column=6, value=r["avgSO"])
    ws.cell(row=row, column=7, value=r["avgPO"])
    ws.cell(row=row, column=8, value=r["totalDuration"])
    for c in range(1, len(headers) + 1):
        ws.cell(row=row, column=c).border = BORDER
        ws.cell(row=row, column=c).alignment = Alignment(horizontal="center")
    row += 1
data_end = row - 1

row += 2
ws.cell(row=row, column=1, value="B. HTTP-Level Load Test (k6, unauthenticated route hit)")
ws.cell(row=row, column=1).font = Font(bold=True, size=12)
row += 1
k6_headers = ["Metric", "Value"]
for c, h in enumerate(k6_headers, start=1):
    ws.cell(row=row, column=c, value=h)
style_header(ws, row, 2)
row += 1
k6_rows = [
    ("App / Target", k6_summary["app"]),
    ("Halaman diuji", k6_summary["pages_tested"]),
    ("Peak Virtual Users", k6_summary["vus_peak"]),
    ("Durasi", k6_summary["hold_duration"]),
    ("Total Requests", k6_summary["total_requests"]),
    ("Requests/sec", k6_summary["req_per_sec"]),
    ("Checks Pass (%)", k6_summary["checks_pass_pct"]),
    ("Failed Requests (%)", k6_summary["failed_pct"]),
    ("Avg Response (ms)", k6_summary["avg_ms"]),
    ("Median Response (ms)", k6_summary["median_ms"]),
    ("P90 Response (ms)", k6_summary["p90_ms"]),
    ("P95 Response (ms)", k6_summary["p95_ms"]),
    ("Max Response (ms)", k6_summary["max_ms"]),
]
for k, v in k6_rows:
    ws.cell(row=row, column=1, value=k).border = BORDER
    ws.cell(row=row, column=2, value=v).border = BORDER
    row += 1

row += 2
ws.cell(row=row, column=1, value="C. Temuan Utama (Key Findings)")
ws.cell(row=row, column=1).font = Font(bold=True, size=12, color="C00000")
row += 1
findings = [
    "1. Login degradasi tajam seiring kenaikan concurrency: ~6.4 detik (3 sesi) -> ~42.8 detik (30 sesi) -> masih ~40.6 detik "
    "(100 sesi, tapi mayoritas gagal). Endpoint login/auth adalah bottleneck utama, bukan halaman Sales Order/Purchase Order "
    "yang tetap stabil di 1-2 detik di semua skala.",
    "2. Pada 100 sesi paralel, hanya 16/100 (16%) sesi berhasil login. 84 sesi gagal dengan error "
    "\"Timeout 30000ms exceeded\" saat mencoba membuka halaman awal (belum sempat login). Ini menunjukkan sistem "
    "mulai kolaps / tidak responsif di beban ~100 concurrent login.",
    "3. Uji HTTP murni (k6, tanpa login) di 10 VU menunjukkan performa server/CDN sangat sehat (p95 ~104ms, 0% gagal). "
    "Ini menguatkan bahwa bottleneck ada di proses AUTHENTICATION/APPLICATION LAYER (mis. query user/company saat login), "
    "bukan di infrastruktur jaringan/CDN dasar.",
    "4. Catatan metodologi: 100 sesi browser dijalankan dari satu mesin client yang sama; sebagian kegagalan bisa juga "
    "dipengaruhi oleh keterbatasan resource client (CPU/RAM Chromium headless) selain beban di sisi server. Disarankan "
    "validasi ulang dari beberapa mesin/agent load-generator untuk memisahkan bottleneck client vs server.",
]
for f in findings:
    ws.cell(row=row, column=1, value=f)
    ws.cell(row=row, column=1).alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)
    ws.row_dimensions[row].height = 45
    row += 1

autofit(ws, [20, 12, 12, 16, 14, 18, 20, 18])

# ============================================================ SHEET 2: Chart data + charts
ws2 = wb.create_sheet("Grafik")
ws2["A1"] = "Performa vs Concurrency"
ws2["A1"].font = TITLE_FONT

chdr = ["Sessions", "Avg Login (ms)", "Avg Sales Order (ms)", "Avg Purchase Order (ms)", "Success Rate (%)", "Failed"]
for c, h in enumerate(chdr, start=1):
    ws2.cell(row=3, column=c, value=h)
style_header(ws2, 3, len(chdr))
for i, r in enumerate(browser_runs):
    rr = 4 + i
    ws2.cell(row=rr, column=1, value=r["sessions"])
    ws2.cell(row=rr, column=2, value=r["avgLogin"])
    ws2.cell(row=rr, column=3, value=r["avgSO"])
    ws2.cell(row=rr, column=4, value=r["avgPO"])
    ws2.cell(row=rr, column=5, value=round(r["succeeded"] / r["sessions"] * 100, 1))
    ws2.cell(row=rr, column=6, value=r["failed"])

last_row = 3 + len(browser_runs)

# Line chart: response time trend
line = LineChart()
line.title = "Waktu Respon vs Jumlah Sesi Bersamaan"
line.style = 12
line.y_axis.title = "Waktu (ms)"
line.x_axis.title = "Concurrent Sessions"
data = Reference(ws2, min_col=2, max_col=4, min_row=3, max_row=last_row)
cats = Reference(ws2, min_col=1, min_row=4, max_row=last_row)
line.add_data(data, titles_from_data=True)
line.set_categories(cats)
line.width = 22
line.height = 11
ws2.add_chart(line, "A9")

# Bar chart: success rate
bar = BarChart()
bar.title = "Success Rate (%) vs Jumlah Sesi Bersamaan"
bar.style = 10
bar.y_axis.title = "Success Rate (%)"
bar.x_axis.title = "Concurrent Sessions"
bdata = Reference(ws2, min_col=5, min_row=3, max_row=last_row)
bar.add_data(bdata, titles_from_data=True)
bar.set_categories(cats)
bar.width = 22
bar.height = 11
ws2.add_chart(bar, "A28")

# Bar chart: failed count
bar2 = BarChart()
bar2.title = "Jumlah Sesi Gagal vs Jumlah Sesi Bersamaan"
bar2.style = 11
bar2.y_axis.title = "Sesi Gagal"
bar2.x_axis.title = "Concurrent Sessions"
bdata2 = Reference(ws2, min_col=6, min_row=3, max_row=last_row)
bar2.add_data(bdata2, titles_from_data=True)
bar2.set_categories(cats)
bar2.width = 22
bar2.height = 11
ws2.add_chart(bar2, "A47")

autofit(ws2, [12, 16, 18, 20, 16, 10])

# ============================================================ SHEET 3: k6 raw metrics chart
ws3 = wb.create_sheet("Grafik HTTP (k6)")
ws3["A1"] = "Distribusi Response Time - HTTP Load Test (k6, 10 VU)"
ws3["A1"].font = TITLE_FONT
khdr = ["Metric", "ms"]
for c, h in enumerate(khdr, start=1):
    ws3.cell(row=3, column=c, value=h)
style_header(ws3, 3, 2)
kvals = [
    ("Min", 0.94),
    ("Median (p50)", 13.5),
    ("Avg", 26.88),
    ("P90", 52.96),
    ("P95", 103.81),
    ("Max", 288.61),
]
for i, (k, v) in enumerate(kvals):
    ws3.cell(row=4 + i, column=1, value=k)
    ws3.cell(row=4 + i, column=2, value=v)
last_k = 3 + len(kvals)

kbar = BarChart()
kbar.title = "HTTP Response Time Percentiles (ms) - unauthenticated route hit"
kbar.style = 10
kbar.y_axis.title = "ms"
kdata = Reference(ws3, min_col=2, min_row=3, max_row=last_k)
kcats = Reference(ws3, min_col=1, min_row=4, max_row=last_k)
kbar.add_data(kdata, titles_from_data=True)
kbar.set_categories(kcats)
kbar.width = 22
kbar.height = 11
ws3.add_chart(kbar, "A11")
autofit(ws3, [20, 14])

# ============================================================ SHEET 4: Failure detail (100 sessions)
ws4 = wb.create_sheet("Detail Kegagalan (100 sesi)")
ws4["A1"] = "Detail Kegagalan - 100 Concurrent Sessions"
ws4["A1"].font = TITLE_FONT
ws4["A2"] = f"Total gagal: {len(failures_100)} dari 100 sesi. Semua gagal pada tahap page.goto awal (belum sempat login)."
ws4["A2"].font = Font(italic=True)
fh = ["Session ID", "Error"]
for c, h in enumerate(fh, start=1):
    ws4.cell(row=4, column=c, value=h)
style_header(ws4, 4, 2)
row = 5
for f in failures_100:
    ws4.cell(row=row, column=1, value=f["id"])
    err = f["errors"][0].split("\n")[0] if f.get("errors") else ""
    ws4.cell(row=row, column=2, value=err)
    row += 1
autofit(ws4, [14, 60])

out_path = os.path.join(BASE, "results", "MHC-Stress-Test-Report.xlsx")
wb.save(out_path)
print("Saved:", out_path)
