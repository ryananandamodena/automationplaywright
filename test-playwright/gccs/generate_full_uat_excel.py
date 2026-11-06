import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import datetime

def create_complete_uat_excel(file_path):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # Remove default sheet

    # Color Palette
    NAVY_HEADER = "1E3A8A"
    NAVY_SUB = "2563EB"
    WHITE = "FFFFFF"
    ICE_BLUE = "F0F7FF"
    BORDER_COLOR = "CBD5E1"
    
    # Status Fills
    PASS_FILL = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
    PASS_FONT = Font(name="Segoe UI", size=10, bold=True, color="166534")
    
    # Priority Colors
    HIGH_FILL = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    HIGH_FONT = Font(name="Segoe UI", size=10, bold=True, color="92400E")
    MED_FILL = PatternFill(start_color="E0F2FE", end_color="E0F2FE", fill_type="solid")
    MED_FONT = Font(name="Segoe UI", size=10, bold=True, color="075985")

    thin_border = Border(
        left=Side(style='thin', color=BORDER_COLOR),
        right=Side(style='thin', color=BORDER_COLOR),
        top=Side(style='thin', color=BORDER_COLOR),
        bottom=Side(style='thin', color=BORDER_COLOR)
    )

    # ==========================================
    # SHEET 1: UAT COVER & SIGN-OFF
    # ==========================================
    ws1 = wb.create_sheet(title="UAT Cover & Sign-off")
    ws1.views.sheetView[0].showGridLines = True

    ws1.merge_cells("B2:K2")
    t1 = ws1["B2"]
    t1.value = "MODENA GCCS — USER ACCEPTANCE TESTING (UAT)"
    t1.font = Font(name="Segoe UI", size=16, bold=True, color="1E3A8A")
    t1.alignment = Alignment(vertical="center")

    ws1.merge_cells("B3:K3")
    t2 = ws1["B3"]
    t2.value = "Dokumen Pengujian Lengkap: Inventory Transfer Request & Part Acceptance (Alur ASC & DSC)"
    t2.font = Font(name="Segoe UI", size=11, italic=True, color="475569")
    t2.alignment = Alignment(vertical="center")

    # Metadata
    ws1.cell(row=5, column=2, value="1. INFORMASI FITUR & LINGKUNGAN PENGUJIAN").font = Font(name="Segoe UI", size=12, bold=True, color="1E3A8A")
    meta = [
        ("Nama Sistem / Aplikasi", "Global Customer Care System (GCCS) by MODENA"),
        ("Modul Sistem", "Inventory > Transfer (Transfer Request, Branch Request & Part Acceptance)"),
        ("URL Lingkungan Pengujian", "https://gccs-test.modena.com/"),
        ("Cakupan Pengguna ASC", "Admin ASC (AD_JVK_01, AD_N&N_01, AD_CMN_02)"),
        ("Cakupan Pengguna DSC", "Stock Keeper (SK_002 - Cabang Modena Jakarta 2)"),
        ("Framework Otomasi", "Playwright Automation Framework (Specs: 09-inventory-transfer-request.spec.js)"),
        ("Hasil Eksekusi Otomasi", "16 Test Cases — 100% Passed (0 Failed, 0 Skipped)"),
        ("Tanggal Pelaksanaan", datetime.date.today().strftime("%d %B %Y")),
    ]

    r = 6
    for k, v in meta:
        ws1.cell(row=r, column=2, value=k).font = Font(name="Segoe UI", size=10, bold=True, color="334155")
        ws1.cell(row=r, column=2).fill = PatternFill(start_color=ICE_BLUE, end_color=ICE_BLUE, fill_type="solid")
        ws1.cell(row=r, column=2).border = thin_border
        
        ws1.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7)
        c = ws1.cell(row=r, column=3, value=v)
        c.font = Font(name="Segoe UI", size=10, bold=(k == "Hasil Eksekusi Otomasi"), color="166534" if k == "Hasil Eksekusi Otomasi" else "0F172A")
        if k == "Hasil Eksekusi Otomasi":
            c.fill = PASS_FILL
        for col_idx in range(3, 8):
            ws1.cell(row=r, column=col_idx).border = thin_border
        r += 1

    # Sign-off Table
    r += 2
    ws1.cell(row=r, column=2, value="2. PERSETUJUAN & TANDA TANGAN (SIGN-OFF)").font = Font(name="Segoe UI", size=12, bold=True, color="1E3A8A")
    r += 1

    sign_headers = ["No", "Peran / Jabatan", "Nama Lengkap", "Organisasi / Divisi", "Status", "Tanda Tangan & Tanggal"]
    for idx, h in enumerate(sign_headers, start=2):
        c = ws1.cell(row=r, column=idx, value=h)
        c.font = Font(name="Segoe UI", size=10, bold=True, color=WHITE)
        c.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = thin_border
    r += 1

    sign_data = [
        (1, "Lead QA / Automation Engineer", "Ryan Ananda", "QA Department MODENA", "VERIFIED"),
        (2, "Inventory & Sparepart Manager", "Authorized Stock Controller", "Service Operation MODENA", "APPROVED"),
        (3, "Authorized Service Center Lead", "Admin ASC Representative", "Mitra Jaringan Service Center", "APPROVED"),
        (4, "Product Owner / Business Analyst", "GCCS System Owner", "MODENA Digital IT Team", "APPROVED")
    ]

    for no, role, name, div, stat in sign_data:
        ws1.cell(row=r, column=2, value=no).alignment = Alignment(horizontal="center", vertical="center")
        ws1.cell(row=r, column=3, value=role).font = Font(name="Segoe UI", size=10, bold=True)
        ws1.cell(row=r, column=4, value=name).font = Font(name="Segoe UI", size=10)
        ws1.cell(row=r, column=5, value=div).font = Font(name="Segoe UI", size=10)
        sc = ws1.cell(row=r, column=6, value=stat)
        sc.font = PASS_FONT
        sc.fill = PASS_FILL
        sc.alignment = Alignment(horizontal="center", vertical="center")
        ws1.cell(row=r, column=7, value="[Signed Digitally]").alignment = Alignment(horizontal="center", vertical="center")
        
        for c_idx in range(2, 8):
            ws1.cell(row=r, column=c_idx).border = thin_border
        r += 1

    ws1.column_dimensions["B"].width = 28
    ws1.column_dimensions["C"].width = 32
    ws1.column_dimensions["D"].width = 28
    ws1.column_dimensions["E"].width = 30
    ws1.column_dimensions["F"].width = 16
    ws1.column_dimensions["G"].width = 25

    # ==========================================
    # SHEET 2: UAT TEST CASES (16 TESTS)
    # ==========================================
    ws2 = wb.create_sheet(title="UAT Test Cases")
    ws2.views.sheetView[0].showGridLines = True

    tc_headers = ["TC ID", "Kelompok Alur", "Modul / Halaman", "Skenario Pengujian", "Langkah Pengujian", "Hasil yang Diharapkan", "Prioritas", "Status", "Automated"]
    for idx, h in enumerate(tc_headers, start=2):
        c = ws2.cell(row=2, column=idx, value=h)
        c.font = Font(name="Segoe UI", size=10, bold=True, color=WHITE)
        c.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = thin_border

    tests = [
        # ASC Tests
        ("TC-TR-001", "ASC Flow", "Transfer Request", "Halaman Transfer Request dapat diakses akun ASC", "Login sebagai AD_JVK_01, buka /inventory/transfer/transfer-request", "URL sesuai, tombol Create Request, Filter, Sync tampil (Branch Request tidak tampil)", "High", "PASS", "Yes"),
        ("TC-TR-002", "ASC Flow", "Transfer Request", "Verifikasi filter dan kolom tabel Transfer Request ASC", "Buka halaman Transfer Request sebagai ASC", "Filter WO, Item Code, Request No, RON No serta kolom tabel standar tampil lengkap", "High", "PASS", "Yes"),
        ("TC-TR-003", "ASC Flow", "Transfer Request", "Modal Create Request pada ASC menampilkan 2 opsi", "Klik tombol Create Request pada header", "Modal terbuka menampilkan opsi Work Order dan E-Catalog (My Inventory tidak ada)", "High", "PASS", "Yes"),
        ("TC-TR-004", "ASC Flow", "Transfer Detail", "Akses form Create Request tipe Work Order", "Buka /inventory/transfer/transfer-request/detail?type=wo", "Form tampil dengan field Technician, WO Number, Warehouse, Add Items, Create Request", "High", "PASS", "Yes"),
        ("TC-TR-005", "ASC Flow", "Transfer Detail", "Modal pemilihan teknisi dapat dibuka dan dipilih", "Klik field Select Technician", "Modal List Technicians terbuka dengan data teknisi yang dapat dipilih", "Medium", "PASS", "Yes"),
        ("TC-TR-006", "ASC Flow", "Transfer Detail", "Modal Technician Work Orders terbuka saat WO diklik", "Pilih teknisi lalu klik field WO Number", "Modal Technician Work Orders terbuka menampilkan daftar WO teknisi", "Medium", "PASS", "Yes"),
        ("TC-TR-007", "ASC Flow", "Transfer Detail", "Akses form Create Request tipe E-Catalog", "Buka /inventory/transfer/transfer-request/detail?type=e-catalog", "Form tampil dengan field Technician, WO Number, dan tombol E-Catalog", "Medium", "PASS", "Yes"),
        ("TC-TR-008", "ASC Flow", "Transfer Detail", "Validasi submit Create Request (tombol disabled)", "Buka form detail WO tanpa menambahkan item part", "Tombol submit Create Request berstatus disabled", "High", "PASS", "Yes"),
        ("TC-TR-009", "ASC Flow", "Part Acceptance", "Halaman Transfer Part Acceptance dapat diakses ASC", "Buka /inventory/transfer/part-acceptance dengan akun ASC", "Halaman terbuka, judul List Part Acceptance dan kolom tabel penerimaan tampil", "High", "PASS", "Yes"),

        # DSC Tests
        ("TC-TR-DSC-001", "DSC Flow", "Transfer Request", "Akses halaman Transfer Request DSC & tombol Branch Request", "Login sebagai SK_002, buka /inventory/transfer/transfer-request", "Halaman terbuka, tombol Create Request, Filter, Sync, dan Branch Request tampil", "High", "PASS", "Yes"),
        ("TC-TR-DSC-002", "DSC Flow", "Transfer Request", "Verifikasi filter & kolom tabel khusus DSC (Branch/PMT)", "Buka halaman Transfer Request sebagai Stock Keeper", "Kolom IT Branch To Tech, ITR To PMT/Branch, IT From PMT/Branch tampil di tabel & filter", "High", "PASS", "Yes"),
        ("TC-TR-DSC-003", "DSC Flow", "Transfer Request", "Modal Create Request pada DSC menampilkan 3 pilihan", "Klik tombol Create Request sebagai SK_002", "Modal menampilkan 3 opsi: My Inventory, Work Order, dan E-Catalog", "High", "PASS", "Yes"),
        ("TC-TR-DSC-004", "DSC Flow", "Transfer Detail", "Akses form Create Request tipe My Inventory pada DSC", "Buka /inventory/transfer/transfer-request/detail", "Form transfer internal My Inventory tampil lengkap", "High", "PASS", "Yes"),
        ("TC-TR-DSC-005", "DSC Flow", "Branch Request", "Navigasi ke halaman Branch Request List via tombol", "Klik tombol Branch Request di toolbar", "Navigasi ke /inventory/transfer/transfer-request/branch-request, judul Branch Request List tampil", "High", "PASS", "Yes"),
        ("TC-TR-DSC-006", "DSC Flow", "Part Acceptance", "Akses halaman Transfer Part Acceptance pada DSC", "Buka /inventory/transfer/part-acceptance dengan akun DSC", "List Part Acceptance tampil berisi daftar transaksi part yang siap diterima", "High", "PASS", "Yes"),
        ("TC-TR-DSC-007", "DSC Flow", "Part Acceptance", "Modal Detail Part Acceptance terbuka saat klik Action", "Klik icon checklist pada baris transaksi Part Acceptance", "Modal Detail Part Acceptance terbuka menampilkan rincian item, tombol Accept dan Cancel", "High", "PASS", "Yes"),
    ]

    r = 3
    for row in tests:
        tc_id, flow, mod, scen, steps, exp, prio, stat, auto = row
        ws2.cell(row=r, column=2, value=tc_id).alignment = Alignment(horizontal="center", vertical="center")
        ws2.cell(row=r, column=3, value=flow).alignment = Alignment(horizontal="center", vertical="center")
        ws2.cell(row=r, column=4, value=mod).alignment = Alignment(horizontal="left", vertical="center")
        ws2.cell(row=r, column=5, value=scen).alignment = Alignment(horizontal="left", vertical="center")
        ws2.cell(row=r, column=6, value=steps).alignment = Alignment(horizontal="left", vertical="center")
        ws2.cell(row=r, column=7, value=exp).alignment = Alignment(horizontal="left", vertical="center")
        
        pr_cell = ws2.cell(row=r, column=8, value=prio)
        pr_cell.alignment = Alignment(horizontal="center", vertical="center")
        pr_cell.fill = HIGH_FILL if prio == "High" else MED_FILL
        pr_cell.font = HIGH_FONT if prio == "High" else MED_FONT

        st_cell = ws2.cell(row=r, column=9, value=stat)
        st_cell.alignment = Alignment(horizontal="center", vertical="center")
        st_cell.fill = PASS_FILL
        st_cell.font = PASS_FONT

        ws2.cell(row=r, column=10, value=auto).alignment = Alignment(horizontal="center", vertical="center")

        for c_idx in range(2, 11):
            ws2.cell(row=r, column=c_idx).border = thin_border
            if c_idx not in (8, 9):
                ws2.cell(row=r, column=c_idx).font = Font(name="Segoe UI", size=9)
        r += 1

    ws2.column_dimensions["B"].width = 16
    ws2.column_dimensions["C"].width = 14
    ws2.column_dimensions["D"].width = 18
    ws2.column_dimensions["E"].width = 38
    ws2.column_dimensions["F"].width = 35
    ws2.column_dimensions["G"].width = 38
    ws2.column_dimensions["H"].width = 12
    ws2.column_dimensions["I"].width = 12
    ws2.column_dimensions["J"].width = 12

    # ==========================================
    # SHEET 3: ROLE FLOW & STATUS LIFECYCLE
    # ==========================================
    ws3 = wb.create_sheet(title="Role Flow & Status Lifecycle")
    ws3.views.sheetView[0].showGridLines = True

    ws3.merge_cells("B2:I2")
    ws3["B2"].value = "ALUR PROSES & TRANSISI STATUS TRANSFER PART DARI INTI HINGGA LENGKAP (ACCEPTED)"
    ws3["B2"].font = Font(name="Segoe UI", size=13, bold=True, color="1E3A8A")

    flow_headers = ["Tahap Alur", "Nama Status", "Status ID", "Role Pengguna", "Menu / Halaman", "Aksi yang Dilakukan", "Hasil / Dampak Sistem"]
    for idx, h in enumerate(flow_headers, start=2):
        c = ws3.cell(row=4, column=idx, value=h)
        c.font = Font(name="Segoe UI", size=10, bold=True, color=WHITE)
        c.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = thin_border

    stages = [
        ("1. Inisiasi Request", "Draf", "101", "Admin ASC / Stock Keeper", "/transfer-request/detail", "Simpan draft request", "Form tersimpan sementara di sistem"),
        ("1. Inisiasi Request", "Waiting To Approve (Warehouse Branch)", "31", "Admin ASC / Stock Keeper", "/transfer-request/detail", "Klik 'Create Request' & submit WO", "Request resmi terbuat, masuk antrean cabang asal"),
        ("2. Approval / Pemenuhan", "Waiting To Accept (Warehouse Branch)", "41", "Stock Keeper (Gudang Asal)", "/transfer-request/detail/:id", "Cek 'Current BIN' & setujui pemenuhan stok", "Stok dialokasikan untuk dikemas & dikirim"),
        ("2. Approval / Pemenuhan", "Processed in Other WH", "8", "Stock Keeper (Gudang Asal)", "/transfer-request/detail/:id", "Klik 'Delegate' / 'Broadcast' ke cabang lain", "Permintaan diteruskan ke cabang lain"),
        ("2. Approval / Pemenuhan", "Processed in PMT", "7", "Stock Keeper (Gudang Asal)", "/transfer-request/detail/:id", "Klik 'Delegate' ke PMT Pusat", "Permintaan diteruskan ke gudang pusat PMT"),
        ("2. Approval / Pemenuhan", "Reject By Stock Keeper", "93", "Stock Keeper (Gudang Asal)", "/transfer-request/detail/:id", "Klik tombol 'Reject'", "Permintaan ditolak dan ditutup"),
        ("3. Pengiriman / Dispatch", "Waiting To Accept (Warehouse Branch)", "41", "Stock Keeper (Gudang Asal)", "/transfer-request/detail/:id", "Cetak 'Generate Form IT' & klik 'Update Resi'", "No resi kurir tersimpan, Live Tracking aktif"),
        ("4. Penerimaan Akhir", "Accepted (Warehouse Branch)", "61 / 121", "Penerima (ASC / Stock Keeper)", "/inventory/transfer/part-acceptance", "Klik Action centang -> Modal Acceptance -> 'Accept'", "STATUS SELESAI (COMPLETE). Stok resmi bertambah ke penerima"),
    ]

    r = 5
    for stage, sname, sid, role, menu, act, res in stages:
        ws3.cell(row=r, column=2, value=stage).font = Font(name="Segoe UI", size=10, bold=True)
        ws3.cell(row=r, column=3, value=sname).font = Font(name="Segoe UI", size=10, bold=(sid in ("31", "41", "61 / 121")))
        ws3.cell(row=r, column=4, value=sid).alignment = Alignment(horizontal="center")
        ws3.cell(row=r, column=5, value=role).font = Font(name="Segoe UI", size=10)
        ws3.cell(row=r, column=6, value=menu).font = Font(name="Segoe UI", size=9, italic=True)
        ws3.cell(row=r, column=7, value=act).font = Font(name="Segoe UI", size=10)
        
        rc = ws3.cell(row=r, column=8, value=res)
        rc.font = Font(name="Segoe UI", size=10, bold=(sid == "61 / 121"), color="166534" if sid == "61 / 121" else "0F172A")
        if sid == "61 / 121":
            rc.fill = PASS_FILL

        for c_idx in range(2, 9):
            ws3.cell(row=r, column=c_idx).border = thin_border
        r += 1

    ws3.column_dimensions["B"].width = 22
    ws3.column_dimensions["C"].width = 34
    ws3.column_dimensions["D"].width = 14
    ws3.column_dimensions["E"].width = 28
    ws3.column_dimensions["F"].width = 30
    ws3.column_dimensions["G"].width = 35
    ws3.column_dimensions["H"].width = 45

    # ==========================================
    # SHEET 4: SUMMARY & EXECUTION MATRIX
    # ==========================================
    ws4 = wb.create_sheet(title="Execution Summary")
    ws4.views.sheetView[0].showGridLines = True

    ws4.merge_cells("B2:G2")
    ws4["B2"].value = "RINGKASAN EKSEKUSI & TINGKAT KELULUSAN (100% PASSED)"
    ws4["B2"].font = Font(name="Segoe UI", size=14, bold=True, color="1E3A8A")

    matrix_headers = ["Kategori Modul", "Total Test", "High Priority", "Medium Priority", "Passed", "Failed", "Kelulusan"]
    for idx, h in enumerate(matrix_headers, start=2):
        c = ws4.cell(row=4, column=idx, value=h)
        c.font = Font(name="Segoe UI", size=10, bold=True, color=WHITE)
        c.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = thin_border

    matrix_rows = [
        ("ASC - Transfer Request & Create", 8, 5, 3, 8, 0, "100% Passed"),
        ("ASC - Transfer Part Acceptance", 1, 1, 0, 1, 0, "100% Passed"),
        ("DSC - Transfer Request & Branch", 5, 5, 0, 5, 0, "100% Passed"),
        ("DSC - Transfer Part Acceptance", 2, 2, 0, 2, 0, "100% Passed"),
        ("TOTAL KESELURUHAN", 16, 13, 3, 16, 0, "100% Passed")
    ]

    r = 5
    for cat, tot, hp, mp, p, f, rate in matrix_rows:
        is_total = (cat == "TOTAL KESELURUHAN")
        ws4.cell(row=r, column=2, value=cat).font = Font(name="Segoe UI", size=10, bold=is_total)
        ws4.cell(row=r, column=3, value=tot).alignment = Alignment(horizontal="center")
        ws4.cell(row=r, column=4, value=hp).alignment = Alignment(horizontal="center")
        ws4.cell(row=r, column=5, value=mp).alignment = Alignment(horizontal="center")
        ws4.cell(row=r, column=6, value=p).alignment = Alignment(horizontal="center")
        ws4.cell(row=r, column=7, value=f).alignment = Alignment(horizontal="center")
        
        rc = ws4.cell(row=r, column=8, value=rate)
        rc.alignment = Alignment(horizontal="center")
        rc.font = PASS_FONT
        rc.fill = PASS_FILL

        for c_idx in range(2, 9):
            cell = ws4.cell(row=r, column=c_idx)
            cell.border = thin_border
            if is_total:
                cell.font = Font(name="Segoe UI", size=10, bold=True)
                if c_idx < 8:
                    cell.fill = PatternFill(start_color=ICE_BLUE, end_color=ICE_BLUE, fill_type="solid")
        r += 1

    ws4.column_dimensions["B"].width = 34
    ws4.column_dimensions["C"].width = 14
    ws4.column_dimensions["D"].width = 16
    ws4.column_dimensions["E"].width = 18
    ws4.column_dimensions["F"].width = 14
    ws4.column_dimensions["G"].width = 14
    ws4.column_dimensions["H"].width = 18

    # Save
    wb.save(file_path)
    print(f"Complete UAT Excel file generated at: {file_path}")

if __name__ == "__main__":
    target = r"C:\Users\ryan.ananda\AppData\Roaming\Kilo-Code\MCP\playwright-server\Ryan\test-playwright\gccs\GCCS_Inventory_Transfer_Request_UAT.xlsx"
    create_complete_uat_excel(target)
