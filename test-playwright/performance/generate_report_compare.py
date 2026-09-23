# -*- coding: utf-8 -*-
"""Generate comparison Excel report: MHC vs MCI (same host, different company/module)."""
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
YELLOW_FILL = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
RED_FILL = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
THIN = Side(style="thin", color="B7B7B7")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

SCALES = [30, 50, 100, 200, 300]


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


def load(company, s):
    with open(os.path.join(RESULTS, f"more-{company.lower()}-{s}sessions-detailed.json"), encoding="utf-8") as f:
        return json.load(f)


data = {c: {s: load(c, s) for s in SCALES} for c in ("mhc", "mci")}

wb = Workbook()

# ============================================================ SHEET 1: Ringkasan
ws = wb.active
ws.title = "Perbandingan MHC vs MCI"
ws["A1"] = "Perbandingan Stress Test: MHC vs MCI (more-dev.modena.com)"
ws["A1"].font = TITLE_FONT
ws["A2"] = ("MHC -> /mhc/sales-order | MCI (\"More 2.0\") -> /sales/dashboard | Skala: 30-300 sesi bersamaan | "
            "Tanggal: 2026-07-31")
ws["A2"].font = Font(italic=True, color="666666")

row = 4
ws.cell(row=row, column=1, value="A. Success Rate & Waktu Login - Side by Side").font = Font(bold=True, size=12)
row += 1

headers = ["Sessions",
           "MHC Berhasil", "MHC Gagal", "MHC Success %", "MHC Avg Login (ms)", "MHC Avg Target Page (ms)",
           "MCI Berhasil", "MCI Gagal", "MCI Success %", "MCI Avg Login (ms)", "MCI Avg Target Page (ms)"]
for c, h in enumerate(headers, start=1):
    ws.cell(row=row, column=c, value=h)
style_header(ws, row, len(headers))
row += 1
for s in SCALES:
    m = data["mhc"][s]
    k = data["mci"][s]
    ws.cell(row=row, column=1, value=s)
    ws.cell(row=row, column=2, value=m["succeeded"])
    ws.cell(row=row, column=3, value=m["failed"])
    mrate = ws.cell(row=row, column=4, value=round(m["successRatePct"], 1))
    ws.cell(row=row, column=5, value=m["stageStats"]["login"]["avg"])
    ws.cell(row=row, column=6, value=m["stageStats"]["targetPage"]["avg"])
    ws.cell(row=row, column=7, value=k["succeeded"])
    ws.cell(row=row, column=8, value=k["failed"])
    krate = ws.cell(row=row, column=9, value=round(k["successRatePct"], 1))
    ws.cell(row=row, column=10, value=k["stageStats"]["login"]["avg"])
    ws.cell(row=row, column=11, value=k["stageStats"]["targetPage"]["avg"])

    for cell, rate in ((mrate, m["successRatePct"]), (krate, k["successRatePct"])):
        if rate >= 90:
            cell.fill = GREEN_FILL
        elif rate >= 30:
            cell.fill = YELLOW_FILL
        else:
            cell.fill = RED_FILL

    for c in range(1, len(headers) + 1):
        ws.cell(row=row, column=c).border = BORDER
        ws.cell(row=row, column=c).alignment = Alignment(horizontal="center")
    row += 1

row += 2
ws.cell(row=row, column=1, value="B. Breakdown Jenis Error").font = Font(bold=True, size=12)
row += 1
eh = ["Company", "Sessions", "Jenis Error", "Jumlah"]
for c, h in enumerate(eh, start=1):
    ws.cell(row=row, column=c, value=h)
style_header(ws, row, len(eh))
row += 1
for company_label, key in (("MHC", "mhc"), ("MCI", "mci")):
    for s in SCALES:
        eg = data[key][s].get("errorGroups") or {}
        if not eg:
            ws.cell(row=row, column=1, value=company_label)
            ws.cell(row=row, column=2, value=s)
            ws.cell(row=row, column=3, value="(tidak ada kegagalan)")
            ws.cell(row=row, column=4, value=0)
            row += 1
            continue
        for err, count in eg.items():
            ws.cell(row=row, column=1, value=company_label)
            ws.cell(row=row, column=2, value=s)
            ws.cell(row=row, column=3, value=err)
            ws.cell(row=row, column=4, value=count)
            row += 1

row += 2
ws.cell(row=row, column=1, value="C. Temuan & Analisis Perbandingan").font = RED_FONT
row += 1
findings = [
    "1. Kedua module berada di HOST YANG SAMA (more-dev.modena.com) dan menunjukkan pola kegagalan yang SANGAT MIRIP: "
    "stabil/nyaris sempurna di 30 sesi, mulai retak di 50 sesi, dan runtuh ke single-digit success rate (~3-4%) di "
    "200 dan 300 sesi. Ini kuat mengindikasikan bottleneck ada di INFRASTRUKTUR BERSAMA (server/reverse-proxy/DB "
    "dev environment), bukan di kode spesifik salah satu module.",
    "2. MHC sedikit lebih baik di titik tengah: pada 100 sesi, MHC masih 34% berhasil sedangkan MCI sudah 0% "
    "(gagal total). Namun di 30 sesi MHC punya 1 kegagalan (96.7%) sementara MCI justru 100% - jadi tidak konsisten "
    "satu arah; kemungkinan ini disebabkan variasi urutan proses & beban lain di host dev pada saat masing-masing "
    "test dijalankan (test dijalankan berurutan, bukan benar-benar bersamaan), bukan perbedaan kapasitas riil.",
    "3. Waktu LOGIN untuk kedua company meningkat drastis seiring concurrency (dari ~2-7 detik di skala kecil ke "
    "20-30+ detik begitu mendekati titik jenuh) - konsisten dengan temuan sebelumnya bahwa proses AUTH adalah "
    "tahap paling sensitif terhadap beban di kedua module.",
    "4. Target halaman (Sales Order untuk MHC, Dashboard untuk MCI) SAMA-SAMA tetap relatif cepat (1-3 detik) "
    "ketika sesi berhasil login - menguatkan bahwa bottleneck bukan di halaman konten, tapi di gerbang "
    "login/autentikasi bersama kedua module.",
    "5. CATATAN METODOLOGI: kesepuluh test (5 skala x 2 company) dijalankan BERURUTAN dari satu mesin yang sama, "
    "bukan bersamaan. Perbandingan MHC vs MCI di angka yang sama (mis. sama-sama 100 sesi) valid untuk melihat pola "
    "umum, tapi TIDAK bisa dipakai untuk klaim 'company A pasti lebih tahan beban dari B' secara presisi karena "
    "kondisi server saat masing-masing giliran test bisa sedikit berbeda (cache warm-up, koneksi sisa dari test "
    "sebelumnya, dll).",
    "6. Kesimpulan utama: MASALAH KAPASITAS DI SEKITAR 50-100 SESI BERSAMAAN BERSIFAT SISTEM-WIDE (mempengaruhi "
    "MHC maupun MCI secara setara), bukan bug spesifik satu module. Rekomendasi: investigasi dan perbaikan "
    "prioritas di layer INFRASTRUKTUR/AUTH BERSAMA (mis. connection pool database, worker/thread limit reverse "
    "proxy, atau kapasitas compute environment dev), karena perbaikan di satu module saja tidak akan menyelesaikan "
    "masalah untuk module lainnya.",
]
for f in findings:
    ws.cell(row=row, column=1, value=f)
    ws.cell(row=row, column=1).alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=11)
    ws.row_dimensions[row].height = 60
    row += 1

autofit(ws, [12, 14, 12, 14, 18, 20, 14, 12, 14, 18, 20])

# ============================================================ SHEET 2: Grafik
ws2 = wb.create_sheet("Grafik Perbandingan")
ws2["A1"] = "Grafik Perbandingan MHC vs MCI"
ws2["A1"].font = TITLE_FONT

chdr = ["Sessions", "MHC Success %", "MCI Success %", "MHC Avg Login (ms)", "MCI Avg Login (ms)",
        "MHC Avg Target Page (ms)", "MCI Avg Target Page (ms)"]
for c, h in enumerate(chdr, start=1):
    ws2.cell(row=3, column=c, value=h)
style_header(ws2, 3, len(chdr))
for i, s in enumerate(SCALES):
    m = data["mhc"][s]
    k = data["mci"][s]
    rr = 4 + i
    ws2.cell(row=rr, column=1, value=s)
    ws2.cell(row=rr, column=2, value=round(m["successRatePct"], 1))
    ws2.cell(row=rr, column=3, value=round(k["successRatePct"], 1))
    ws2.cell(row=rr, column=4, value=m["stageStats"]["login"]["avg"])
    ws2.cell(row=rr, column=5, value=k["stageStats"]["login"]["avg"])
    ws2.cell(row=rr, column=6, value=m["stageStats"]["targetPage"]["avg"])
    ws2.cell(row=rr, column=7, value=k["stageStats"]["targetPage"]["avg"])
last_row = 3 + len(SCALES)
cats = Reference(ws2, min_col=1, min_row=4, max_row=last_row)

bar = BarChart()
bar.title = "Success Rate (%): MHC vs MCI"
bar.style = 10
bar.y_axis.title = "Success Rate (%)"
bar.x_axis.title = "Concurrent Sessions"
bdata = Reference(ws2, min_col=2, max_col=3, min_row=3, max_row=last_row)
bar.add_data(bdata, titles_from_data=True)
bar.set_categories(cats)
bar.width = 24
bar.height = 12
ws2.add_chart(bar, "A9")

line = LineChart()
line.title = "Avg Login Time (ms): MHC vs MCI"
line.style = 12
line.y_axis.title = "ms"
line.x_axis.title = "Concurrent Sessions"
ldata = Reference(ws2, min_col=4, max_col=5, min_row=3, max_row=last_row)
line.add_data(ldata, titles_from_data=True)
line.set_categories(cats)
line.width = 24
line.height = 12
ws2.add_chart(line, "A29")

line2 = LineChart()
line2.title = "Avg Target Page Time (ms): MHC Sales Order vs MCI Dashboard"
line2.style = 13
line2.y_axis.title = "ms"
line2.x_axis.title = "Concurrent Sessions"
ldata2 = Reference(ws2, min_col=6, max_col=7, min_row=3, max_row=last_row)
line2.add_data(ldata2, titles_from_data=True)
line2.set_categories(cats)
line2.width = 24
line2.height = 12
ws2.add_chart(line2, "A49")

autofit(ws2, [12, 16, 16, 18, 18, 22, 22])

# ============================================================ SHEET per scale: detail perSession untuk MHC & MCI
for s in SCALES:
    wsx = wb.create_sheet(f"Detail {s} Sesi")
    wsx["A1"] = f"Detail Per-Sesi - {s} Concurrent Sessions"
    wsx["A1"].font = TITLE_FONT

    col_offset = 1
    for company_label, key in (("MHC", "mhc"), ("MCI", "mci")):
        d = data[key][s]
        wsx.cell(row=3, column=col_offset, value=f"{company_label} (success rate {d['successRatePct']}%)")
        wsx.cell(row=3, column=col_offset).font = Font(bold=True, size=12)
        ph = ["ID", "Status", "Home (ms)", "Login (ms)", "Target Page (ms)", "Error"]
        for c, h in enumerate(ph, start=col_offset):
            wsx.cell(row=4, column=c, value=h)
        style_header(wsx, 4, len(ph), start_col=col_offset)
        row = 5
        for p in d["perSession"]:
            wsx.cell(row=row, column=col_offset, value=p["id"])
            status_cell = wsx.cell(row=row, column=col_offset + 1, value="OK" if p["ok"] else "GAGAL")
            status_cell.fill = GREEN_FILL if p["ok"] else RED_FILL
            wsx.cell(row=row, column=col_offset + 2, value=p["gotoHomeMs"])
            wsx.cell(row=row, column=col_offset + 3, value=p["loginMs"])
            wsx.cell(row=row, column=col_offset + 4, value=p["targetPageMs"])
            err = p["errors"][0].split("\n")[0] if p["errors"] else ""
            wsx.cell(row=row, column=col_offset + 5, value=err)
            row += 1
        col_offset += 7  # 6 cols + 1 spacer

    autofit(wsx, [8, 9, 11, 11, 14, 45, 3, 8, 9, 11, 11, 14, 45])

out_path = os.path.join(RESULTS, "MORE-MHC-vs-MCI-Comparison-Report.xlsx")
wb.save(out_path)
print("Saved:", out_path)
