/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEB APP - HTML & CODE.GS GENERATOR (CHUYÊN NGHIỆP)
 * Sổ Quản Lý Lý Lịch Thiết Bị CNS - VATM (Chuẩn Form PDF Biểu Mẫu 8 Trang A4)
 * =========================================================================
 */

import { Equipment } from '../types';

export function generateAppsScriptCodeGs(): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: CODE.GS (MÁY CHỦ WEB APP & QUẢN LÝ GOOGLE SHEETS)
 * Sổ Quản Lý Lý Lịch Thiết Bị CNS - VATM (4 Đài Trạm)
 * =========================================================================
 */

function doGet(e) {
  // 1. Trả về JSON nếu gọi API (?format=json hoặc ?api=1)
  if (e && e.parameter && (e.parameter.format === 'json' || e.parameter.api === '1')) {
    var data = getEquipmentsFromSheet();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: data.length,
      timestamp: new Date().toISOString(),
      equipments: data
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Render giao diện Web App hoàn chỉnh từ file Index.html
  try {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Sổ Quản Lý Lý Lịch Thiết Bị CNS - VATM')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:system-ui,-apple-system,sans-serif; padding:32px; max-width:640px; margin:40px auto; background:#fff; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); line-height:1.6;">' +
      '<div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">' +
        '<span style="background:#fee2e2; color:#ef4444; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:18px;">!</span>' +
        '<h2 style="color:#0f172a; margin:0; font-size:18px; font-weight:bold;">Chưa tìm thấy file HTML có tên "Index"</h2>' +
      '</div>' +
      '<p style="color:#475569; font-size:14px;">Để Web App hiển thị đầy đủ giao diện, bạn chỉ cần thực hiện 2 bước đơn giản trong dự án Apps Script này:</p>' +
      '<ol style="color:#334155; font-size:13px; padding-left:20px; line-height:1.8;">' +
        '<li>Nhấp vào nút <strong>+</strong> (Thêm tệp) bên cạnh cột <strong>Tệp</strong> bên trái > Chọn <strong>HTML</strong>.</li>' +
        '<li>Đặt tên tệp chính xác là <strong>Index</strong> (không cần gõ thêm đuôi .html).</li>' +
        '<li>Dán toàn bộ mã nguồn của file <strong>Index.html</strong> vào và nhấn <strong>Lưu</strong> (Ctrl+S).</li>' +
        '<li>Bấm <strong>Triển khai (Deploy)</strong> > <strong>Quản lý bản triển khai (Manage deployments)</strong> > Chọn <strong>Phiên bản mới</strong> > <strong>Lưu</strong>.</li>' +
      '</ol>' +
      '<div style="margin-top:20px; padding:12px; background:#f8fafc; border-radius:8px; border:1px solid #cbd5e1; font-size:11px; color:#64748b; font-family:monospace;">' +
        'Mã lỗi: ' + err.toString() +
      '</div>' +
      '</div>'
    ).setTitle('Hướng Dẫn Cài Đặt Web App VATM');
  }
}

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    var equipments = payload.equipments || [];
    saveAllEquipmentsToSheet(equipments);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đồng bộ thành công " + equipments.length + " thiết bị!",
      count: equipments.length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getEquipmentsFromSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return [];
    var sheet = ss.getSheetByName("Danh Mục Thiết Bị CNS") || ss.getSheets()[0];
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var list = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[1]) continue;
      list.push({
        id: String(row[0] || ("EQ-" + Date.now() + "-" + i)),
        general: {
          name: String(row[1] || "Thiết bị CNS"),
          category: String(row[2] || "VHF/UHF"),
          model: String(row[3] || ""),
          serial: String(row[4] || ""),
          assetNo: String(row[5] || ""),
          bookletNo: String(row[6] || ""),
          manufacturer: String(row[7] || ""),
          yearMade: String(row[8] || ""),
          origin: "Việt Nam",
          commissioned: String(row[9] || ""),
          status: String(row[10] || "Đang khai thác"),
          priority: String(row[11] || "Hệ thống chính (Level 1)")
        },
        org: {
          companyName: "CÔNG TY QUẢN LÝ BAY MIỀN NAM",
          unit: String(row[12] || "TRUNG TÂM BẢO ĐẢM KỸ THUẬT"),
          location: String(row[13] || "Đài KSKL Tân Sơn Nhất"),
          stationName: String(row[13] || "AACC HCM"),
          primaryEngineer: String(row[14] || "Kỹ sư trực ban"),
          supervisor: "KS. Trưởng đài"
        },
        spec: {
          power: String(row[15] || ""),
          channelFreq: String(row[4] || ""),
          powerSupply: String(row[16] || ""),
          vswr: String(row[17] || ""),
          interface: String(row[18] || ""),
          coverage: String(row[19] || ""),
          mgmtIp: String(row[20] || ""),
          text: String(row[21] || "")
        },
        components: [],
        maintenance: [],
        repair: []
      });
    }
    return list;
  } catch (err) {
    Logger.log("Error getEquipmentsFromSheet: " + err);
    return [];
  }
}

function saveAllEquipmentsToSheet(equipments) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    var sheet = ss.getSheetByName("Danh Mục Thiết Bị CNS");
    if (!sheet) sheet = ss.insertSheet("Danh Mục Thiết Bị CNS", 0);

    var headers = [
      "Mã Thiết Bị (ID)", "Tên Thiết Bị", "Chủng Loại CNS", "Ký Hiệu / Model", "Số Serial (S/N)",
      "Mã Tài Sản", "Số Sổ", "Hãng Sản Xuất", "Năm SX", "Ngày SD", "Trạng Thái", "Cấp Ưu Tiên",
      "Đơn Vị Quản Lý", "Vị Trí Đài Trạm", "Kỹ Sư Phụ Trách",
      "Công Suất Phát", "Nguồn Điện", "Hệ Số VSWR", "Giao Diện Kết Nối", "Tầm Phủ Sóng", "Địa Chỉ IP", "Mô Tả Thông Số Kỹ Thuật"
    ];

    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#0c2340").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);

    var rows = [];
    for (var i = 0; i < equipments.length; i++) {
      var eq = equipments[i];
      var g = eq.general || {};
      var o = eq.org || {};
      var s = eq.spec || {};
      rows.push([
        eq.id || "", g.name || "", g.category || "", g.model || "", g.serial || "",
        g.assetNo || "", g.bookletNo || "", g.manufacturer || "", g.yearMade || "",
        g.commissioned || "", g.status || "", g.priority || "",
        o.unit || "", o.stationName || o.location || "AACC HCM", o.primaryEngineer || "",
        s.power || "", s.powerSupply || "", s.vswr || "", s.interface || "", s.coverage || "", s.mgmtIp || "", s.text || ""
      ]);
    }
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  } catch (err) {
    Logger.log("Error saveAllEquipmentsToSheet: " + err);
  }
}

function saveEquipmentToSheet(eq) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: false };
    var sheet = ss.getSheetByName("Danh Mục Thiết Bị CNS") || ss.getSheets()[0];
    var g = eq.general || {};
    var o = eq.org || {};
    var s = eq.spec || {};

    sheet.appendRow([
      eq.id || ("EQ-" + Date.now()), g.name || "", g.category || "", g.model || "", g.serial || "",
      g.assetNo || "", g.bookletNo || "", g.manufacturer || "", g.yearMade || "",
      g.commissioned || "", g.status || "", g.priority || "",
      o.unit || "", o.stationName || o.location || "AACC HCM", o.primaryEngineer || "",
      s.power || "", s.powerSupply || "", s.vswr || "", s.interface || "", s.coverage || "", s.mgmtIp || "", s.text || ""
    ]);
    return { success: true, id: eq.id };
  } catch (err) {
    Logger.log("Error saveEquipmentToSheet: " + err);
    return { success: false, error: err.toString() };
  }
}
`;
}

export function generateAppsScriptHtml(equipmentsData?: Equipment[]): string {
  const initialJson = JSON.stringify(equipmentsData || [], null, 2);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sổ Quản Lý Lý Lịch Thiết Bị CNS - VATM</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .font-times { font-family: 'Times New Roman', Times, serif; }

    /* VATM PDF A4 Print Standard Specification */
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }

    @media print {
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 12pt !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .no-print { display: none !important; }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
        display: block !important;
        height: 0 !important;
      }
      .vatm-cover-box {
        border: 4px double #000000 !important;
        padding: 24pt !important;
        min-height: 960px !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      .vatm-table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 8pt !important;
        margin-bottom: 12pt !important;
      }
      .vatm-table th, .vatm-table td {
        border: 1px solid #000000 !important;
        padding: 6pt 8pt !important;
        font-size: 11pt !important;
        vertical-align: middle !important;
      }
      .vatm-table th {
        font-weight: bold !important;
        text-align: center !important;
        background-color: #f2f2f2 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-number {
        text-align: center !important;
        font-size: 11pt !important;
        margin-top: 15pt !important;
      }
    }
    
    .vatm-cover-box {
      border: 4px double #000000;
      padding: 28pt;
      min-height: 880px;
      text-align: center;
      background: #ffffff;
      box-sizing: border-box;
    }
    .vatm-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
      margin-bottom: 12pt;
      font-family: 'Times New Roman', Times, serif;
    }
    .vatm-table th, .vatm-table td {
      border: 1px solid #000000;
      padding: 6pt 8pt;
      font-size: 11pt;
      vertical-align: middle;
    }
    .vatm-table th {
      font-weight: bold;
      text-align: center;
      background-color: #f2f2f2;
    }
    .page-number {
      text-align: center;
      font-size: 11pt;
      margin-top: 15pt;
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">

  <!-- TOP TELEMETRY BAR -->
  <header class="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between border-b border-slate-800 shrink-0 no-print">
    <div class="flex items-center gap-2 font-mono">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="font-bold text-white">HỆ THỐNG TRỰC KỸ THUẬT CNS</span>
      <span class="text-slate-600">|</span>
      <span class="text-slate-400 hidden sm:inline">CÔNG TY QUẢN LÝ BAY MIỀN NAM (VATM)</span>
    </div>
    <div class="flex items-center gap-4 font-mono text-[11px]">
      <span id="utc-clock" class="text-sky-400 font-bold hidden md:inline">UTC: --:--:--Z</span>
      <span id="vn-clock" class="text-slate-200 font-medium">VN: --:--:--</span>
      <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
        Google Apps Script Web App
      </span>
    </div>
  </header>

  <!-- NAVIGATION -->
  <nav class="bg-white border-b border-slate-200 px-4 py-2.5 shadow-2xs sticky top-0 z-30 no-print">
    <div class="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
          <i class="fa-solid fa-tower-broadcast text-lg text-cyan-200"></i>
        </div>
        <div>
          <h1 class="text-base font-extrabold text-slate-900 tracking-tight leading-tight">SỔ LÝ LỊCH THIẾT BỊ CNS</h1>
          <p class="text-[11px] text-slate-500 font-semibold">VATM · 4 Đài Trạm: AACC HCM · ATCC HCM · BQ old · BQ New</p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
        <button onclick="filterByStation('ALL')" id="btn-st-ALL" class="st-btn px-3 py-1.5 rounded-lg bg-white text-blue-900 shadow-xs">Tất cả đài trạm</button>
        <button onclick="filterByStation('AACC HCM')" id="btn-st-AACC" class="st-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900">AACC HCM</button>
        <button onclick="filterByStation('ATCC HCM')" id="btn-st-ATCC" class="st-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900">ATCC HCM</button>
        <button onclick="filterByStation('BQ old')" id="btn-st-BQOLD" class="st-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900">BQ old</button>
        <button onclick="filterByStation('BQ New')" id="btn-st-BQNEW" class="st-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900">BQ New</button>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="openAddModal()" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
          <i class="fa-solid fa-plus"></i><span>Thêm Thiết Bị</span>
        </button>
        <button onclick="openPrintModalCurrent()" class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
          <i class="fa-solid fa-print"></i><span>In Sổ A4 (Chuẩn PDF VATM)</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- MAIN APP CONTAINER -->
  <main class="max-w-7xl w-full mx-auto px-4 py-5 flex-1 flex flex-col gap-4 no-print">
    
    <!-- STATS KPI BAR -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span class="text-[11px] font-bold text-slate-400 block uppercase">Tổng Thiết Bị CNS</span>
        <div class="flex items-baseline justify-between mt-1"><span id="kpi-total" class="text-2xl font-extrabold text-slate-900 font-mono">0</span><span class="text-xs text-blue-600 font-bold">4 Đài Trạm</span></div>
      </div>
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span class="text-[11px] font-bold text-emerald-600 block uppercase">Đang Khai Thác</span>
        <div class="flex items-baseline justify-between mt-1"><span id="kpi-active" class="text-2xl font-extrabold text-emerald-700 font-mono">0</span><span class="text-[11px] text-emerald-600 font-bold">Online 24/7</span></div>
      </div>
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span class="text-[11px] font-bold text-amber-600 block uppercase">Dự Phòng / Bảo Dưỡng</span>
        <div class="flex items-baseline justify-between mt-1"><span id="kpi-maint" class="text-2xl font-extrabold text-amber-700 font-mono">0</span><span class="text-[11px] text-amber-600 font-bold">Sẵn sàng nóng</span></div>
      </div>
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span class="text-[11px] font-bold text-slate-500 block uppercase">Khối Linh Kiện</span>
        <div class="flex items-baseline justify-between mt-1"><span id="kpi-comps" class="text-2xl font-extrabold text-slate-800 font-mono">0</span><span class="text-[11px] text-slate-500 font-bold">Mô-đun quản lý</span></div>
      </div>
    </div>

    <!-- FILTER CONTROLS -->
    <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
      <div class="relative w-full md:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input type="text" id="search-input" oninput="handleSearch()" placeholder="Tìm theo tên thiết bị, model, serial, tần số..." class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto flex-wrap">
        <select id="filter-station" onchange="handleFilterChange()" class="bg-blue-50/80 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-900 focus:outline-none cursor-pointer">
          <option value="ALL">Tất cả 4 đài trạm</option>
          <option value="AACC HCM">Đài: AACC HCM</option>
          <option value="ATCC HCM">Đài: ATCC HCM</option>
          <option value="BQ old">Đài: BQ old</option>
          <option value="BQ New">Đài: BQ New</option>
        </select>

        <select id="filter-category" onchange="handleFilterChange()" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer">
          <option value="ALL">Tất cả chủng loại</option>
          <option value="VHF">VHF</option>
          <option value="HF">HF</option>
          <option value="Ghép kênh">Ghép kênh</option>
          <option value="Viba">Viba</option>
          <option value="VSAT">VSAT</option>
          <option value="Tổng đài">Tổng đài</option>
          <option value="VCCS">VCCS</option>
          <option value="Firewall">Firewall</option>
          <option value="Thiết bị khác">Thiết bị khác</option>
        </select>
      </div>
    </div>

    <!-- TWO-COLUMN WORKSPACE -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- LEFT LIST -->
      <div class="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col max-h-[750px]">
        <div class="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 px-1">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Danh Mục Thiết Bị</span>
          <span id="eq-count-badge" class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">0/0</span>
        </div>
        <div id="equipment-list-container" class="space-y-2 overflow-y-auto flex-1 pr-1"></div>
      </div>

      <!-- RIGHT DOSSIER -->
      <div class="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col overflow-hidden">
        <div id="dossier-header" class="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex items-start justify-between gap-4"></div>
        
        <div class="bg-slate-50 px-4 border-b border-slate-200 flex items-center gap-1 text-xs font-bold overflow-x-auto">
          <button onclick="setTab('general')" id="tab-btn-general" class="tab-btn py-3 px-3 border-b-2 border-blue-600 text-blue-700 whitespace-nowrap"><i class="fa-solid fa-circle-info mr-1"></i> 1. Thông Tin Chung</button>
          <button onclick="setTab('specs')" id="tab-btn-specs" class="tab-btn py-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap"><i class="fa-solid fa-sliders mr-1"></i> 2. Thông Số Kỹ Thuật (Tự nhập)</button>
          <button onclick="setTab('components')" id="tab-btn-components" class="tab-btn py-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap"><i class="fa-solid fa-microchip mr-1"></i> 3. Khối Linh Kiện</button>
          <button onclick="setTab('maintenance')" id="tab-btn-maintenance" class="tab-btn py-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap"><i class="fa-solid fa-wrench mr-1"></i> 4. Nhật Ký Bảo Dưỡng</button>
          <button onclick="setTab('repair')" id="tab-btn-repair" class="tab-btn py-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap"><i class="fa-solid fa-triangle-exclamation mr-1"></i> 5. Sự Cố & Sửa Chữa</button>
          <button onclick="setTab('qr')" id="tab-btn-qr" class="tab-btn py-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap"><i class="fa-solid fa-qrcode mr-1"></i> 6. Mã QR Tra Cứu</button>
        </div>

        <div id="dossier-body" class="p-5 overflow-y-auto flex-1 max-h-[600px]"></div>
      </div>
    </div>
  </main>

  <!-- ========================================================================= -->
  <!-- MODAL: CHỈNH SỬA THÔNG SỐ KỸ THUẬT RIÊNG BIỆT (USER CUSTOM SPECS MODAL) -->
  <!-- ========================================================================= -->
  <div id="specs-modal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 hidden items-center justify-center p-4 overflow-y-auto no-print">
    <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
      <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
        <h3 class="font-bold text-sm flex items-center gap-2">
          <i class="fa-solid fa-sliders text-cyan-400"></i>
          <span>Nhập / Chỉnh Sửa Thông Số Kỹ Thuật Thiết Bị</span>
        </h3>
        <button onclick="closeSpecsModal()" class="text-slate-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-base"></i></button>
      </div>
      <form onsubmit="handleSaveCustomSpecs(event)" class="p-5 space-y-4 text-xs">
        <div class="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-blue-900 font-medium">
          <i class="fa-solid fa-circle-info mr-1 text-blue-600"></i>
          Mục này hoàn toàn để trống để bạn tự do nhập các thông số kỹ thuật thực tế của thiết bị. Các thông số này sẽ tự động in ra Trang 4 của Sổ A4.
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Công suất phát (Power):</label>
            <input type="text" id="spec-form-power" placeholder="Ví dụ: 50W, 100W, 1kW..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tần số hoạt động / Dải tần (Freq):</label>
            <input type="text" id="spec-form-freq" placeholder="Ví dụ: 118 – 136.975 MHz (Kênh 120.900 MHz)..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-blue-800 font-bold" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nguồn điện cung cấp:</label>
            <input type="text" id="spec-form-powersupply" placeholder="Ví dụ: AC 220V / 50Hz; DC 24 – 31V..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Hệ số sóng đứng (VSWR):</label>
            <input type="text" id="spec-form-vswr" placeholder="Ví dụ: ≤ 1.15 : 1..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-emerald-800 font-bold" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Giao diện kết nối / Điều khiển:</label>
            <input type="text" id="spec-form-interface" placeholder="Ví dụ: VoIP ED-137B/C, E&M 4-wire, RS232..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tầm phủ sóng hiệu dụng:</label>
            <input type="text" id="spec-form-coverage" placeholder="Ví dụ: 150 NM, 250 NM..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Điều chế & Phân cực:</label>
            <input type="text" id="spec-form-modulation" placeholder="Ví dụ: Điều chế: AM / A3E; Phân cực: Đứng..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Địa chỉ IP quản trị:</label>
            <input type="text" id="spec-form-ip" placeholder="Ví dụ: 192.168.10.19..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" />
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-800 mb-1">
            Mô tả đặc tính kỹ thuật chi tiết (Tự do nhập nhiều dòng, mỗi dòng sẽ in ra dòng kẻ chấm):
          </label>
          <textarea 
            id="spec-form-text" 
            rows="5" 
            placeholder="Nhập từng dòng đặc tính kỹ thuật chi tiết theo ý bạn..." 
            class="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono leading-relaxed focus:bg-white"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t">
          <button type="button" onclick="closeSpecsModal()" class="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">Hủy Bỏ</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer">Lưu Thông Số Kỹ Thuật</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: IN SỔ LÝ LỊCH A4 CHUẨN BIỂU MẪU PDF VATM (8 TRANG CHUYÊN NGHIỆP) -->
  <!-- ========================================================================= -->
  <div id="print-modal" class="fixed inset-0 bg-slate-950/85 z-50 hidden items-center justify-center p-3 sm:p-5 overflow-y-auto">
    <div class="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl">
      
      <!-- Modal Header (No print) -->
      <div class="flex items-center justify-between no-print border-b pb-4 bg-slate-50 p-4 rounded-xl">
        <div>
          <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
            <i class="fa-solid fa-file-invoice text-blue-600"></i>
            <span>Sổ Lý Lịch Thiết Bị Kỹ Thuật CNS - Chuẩn Biểu Mẫu PDF VATM</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Khổ A4 Portrait · Định dạng chuẩn quy định Tổng công ty Quản lý bay Việt Nam</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <select id="print-paper-size" onchange="changePrintPaperSize(this.value)" class="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-purple-900 cursor-pointer">
            <option value="A4">Khổ In A4 (Tiêu Chuẩn 210x297mm)</option>
            <option value="A5">Khổ In A5 (Sổ Nhỏ Bỏ Túi 148x210mm)</option>
          </select>

          <select id="print-page-selector" onchange="changePrintPageMode(this.value)" class="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer">
            <option value="all">In Toàn Bộ Sổ (Đủ 8 Trang)</option>
            <option value="1">Trang 1: Bìa Sổ Lý Lịch (Có mã QR)</option>
            <option value="2">Trang 2: Mục Lục & 1- Đơn Vị Quản Lý</option>
            <option value="3">Trang 3: 2- Sơ Lược & Bảng Giấy Phép</option>
            <option value="4">Trang 4: 2.1- Đặc Tính Kỹ Thuật (Thông số tự nhập)</option>
            <option value="5">Trang 5: 2.2- Thành Phần Thiết Bị</option>
            <option value="6">Trang 6: 2.3- Tài Liệu Kỹ Thuật Kèm Theo</option>
            <option value="7">Trang 7: 3- Nhật Ký Bảo Dưỡng Định Kỳ</option>
            <option value="8">Trang 8: 4- Kiểm Tra - Sửa Chữa - Thay Thế</option>
          </select>

          <button onclick="window.print()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer">
            <i class="fa-solid fa-print"></i><span>In Ngay / Xuất PDF (Ctrl+P)</span>
          </button>
          <button onclick="closePrintModal()" class="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">
            Đóng
          </button>
        </div>
      </div>

      <!-- Printable Area -->
      <div id="print-area" class="bg-white p-6 sm:p-10 font-times text-black">
        <div id="print-content" class="space-y-12">
          <!-- Dynamically populated 8-page booklet -->
        </div>
      </div>

    </div>
  </div>

  <!-- ADD / EDIT EQUIPMENT MODAL -->
  <div id="add-modal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 hidden items-center justify-center p-4 overflow-y-auto no-print">
    <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
      <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
        <h3 class="font-bold text-sm flex items-center gap-2">
          <i class="fa-solid fa-plus text-blue-400"></i>
          <span id="form-modal-title">Thêm Thiết Bị CNS Mới Vào Sổ Lý Lịch</span>
        </h3>
        <button onclick="closeAddModal()" class="text-slate-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-base"></i></button>
      </div>
      <form onsubmit="handleSaveEquipment(event)" class="p-5 space-y-4 text-xs">
        <input type="hidden" id="form-id" value="" />
        
        <h4 class="font-bold text-slate-800 border-b pb-1 text-xs uppercase tracking-wider">Thông Tin Hành Chính & Đài Trạm</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label class="block font-bold mb-1">Tên Thiết Bị (*):</label><input type="text" id="form-name" required placeholder="Máy phát VHF liên lạc không - địa..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
          <div><label class="block font-bold text-blue-900 mb-1">Đài Trạm (*):</label><select id="form-station" class="w-full px-3 py-2 bg-blue-50 border border-blue-300 font-bold text-blue-900 rounded-xl"><option value="AACC HCM">AACC HCM</option><option value="ATCC HCM">ATCC HCM</option><option value="BQ old">BQ old</option><option value="BQ New">BQ New</option></select></div>
          <div><label class="block font-bold mb-1">Chủng Loại:</label><select id="form-category" class="w-full px-3 py-2 bg-slate-50 border rounded-xl"><option value="VHF">VHF</option><option value="HF">HF</option><option value="Ghép kênh">Ghép kênh</option><option value="Viba">Viba</option><option value="VSAT">VSAT</option><option value="Tổng đài">Tổng đài</option><option value="VCCS">VCCS</option><option value="Firewall">Firewall</option><option value="Thiết bị khác">Thiết bị khác</option></select></div>
          <div><label class="block font-bold mb-1">Ký Hiệu / Model:</label><input type="text" id="form-model" placeholder="T6T MK6, R&S 4200..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
          <div><label class="block font-bold mb-1">Số Serial (S/N):</label><input type="text" id="form-serial" placeholder="SN-6U..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" /></div>
          <div><label class="block font-bold mb-1">Mã Tài Sản (TSCD):</label><input type="text" id="form-asset" placeholder="TSCD-..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" /></div>
          <div><label class="block font-bold mb-1">Hãng Sản Xuất / Nước SX:</label><input type="text" id="form-mfg" placeholder="Park Air (England)..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
          <div><label class="block font-bold mb-1">Năm SX / Ngày Đưa Vào SD:</label><input type="text" id="form-year" placeholder="2014 / 2014-11-15" class="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
        </div>

        <h4 class="font-bold text-blue-900 border-b pb-1 text-xs uppercase tracking-wider pt-2">Thông Số Kỹ Thuật (Để Trống Tự Nhập)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label class="block font-bold text-slate-700 mb-1">Công suất phát:</label><input type="text" id="form-spec-power" placeholder="Để trống nếu chưa có" class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" /></div>
          <div><label class="block font-bold text-slate-700 mb-1">Tần số hoạt động:</label><input type="text" id="form-spec-freq" placeholder="Để trống nếu chưa có" class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-blue-800 font-bold" /></div>
          <div><label class="block font-bold text-slate-700 mb-1">Nguồn điện cung cấp:</label><input type="text" id="form-spec-powersupply" placeholder="Để trống nếu chưa có" class="w-full px-3 py-2 bg-slate-50 border rounded-xl" /></div>
          <div><label class="block font-bold text-slate-700 mb-1">Hệ số sóng đứng (VSWR):</label><input type="text" id="form-spec-vswr" placeholder="Để trống nếu chưa có" class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" /></div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Văn bản đặc tính kỹ thuật chi tiết (Tùy chọn tự do):</label>
          <textarea id="form-spec-text" rows="3" placeholder="Để trống hoặc tự do nhập các thông số kỹ thuật của bạn..." class="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-xs"></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t">
          <button type="button" onclick="closeAddModal()" class="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">Hủy</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer">Lưu Thiết Bị</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    var equipments = ${initialJson};
    var selectedEqId = (Array.isArray(equipments) && equipments.length > 0) ? equipments[0].id : '';
    var activeSubTab = 'general';
    var currentStationFilter = 'ALL';
    var currentPrintPage = 'all';

    function updateClocks() {
      var now = new Date();
      var vnEl = document.getElementById('vn-clock');
      var utcEl = document.getElementById('utc-clock');
      if (vnEl) vnEl.textContent = 'VN: ' + now.toLocaleTimeString('vi-VN', { hour12: false });
      if (utcEl) utcEl.textContent = 'UTC: ' + String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0') + ':' + String(now.getUTCSeconds()).padStart(2, '0') + 'Z';
    }
    setInterval(updateClocks, 1000);
    updateClocks();

    function filterByStation(st) {
      currentStationFilter = st;
      document.querySelectorAll('.st-btn').forEach(function(btn) {
        btn.className = 'st-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
      });
      var idMap = { 'ALL': 'btn-st-ALL', 'AACC HCM': 'btn-st-AACC', 'ATCC HCM': 'btn-st-ATCC', 'BQ old': 'btn-st-BQOLD', 'BQ New': 'btn-st-BQNEW' };
      if (idMap[st]) {
        var el = document.getElementById(idMap[st]);
        if (el) el.className = 'st-btn px-3 py-1.5 rounded-lg bg-white text-blue-900 shadow-xs font-bold transition';
      }
      var filterSel = document.getElementById('filter-station');
      if (filterSel) filterSel.value = st;
      renderUI();
    }

    function getFilteredEquipments() {
      if (!Array.isArray(equipments)) return [];
      var searchEl = document.getElementById('search-input');
      var filterStEl = document.getElementById('filter-station');
      var filterCatEl = document.getElementById('filter-category');

      var q = searchEl ? (searchEl.value || '').toLowerCase().trim() : '';
      var st = filterStEl ? filterStEl.value : 'ALL';
      var cat = filterCatEl ? filterCatEl.value : 'ALL';

      return equipments.filter(function(eq) {
        if (!eq) return false;
        var eqOrg = eq.org || {};
        var eqGen = eq.general || {};
        var matchStation = st === 'ALL' || (eqOrg.stationName || '').indexOf(st) !== -1 || (eqOrg.location || '').indexOf(st) !== -1;
        var matchCat = cat === 'ALL' || eqGen.category === cat;
        if (!q) return matchStation && matchCat;
        var name = (eqGen.name || '').toLowerCase();
        var model = (eqGen.model || '').toLowerCase();
        var serial = (eqGen.serial || '').toLowerCase();
        return matchStation && matchCat && (name.indexOf(q) !== -1 || model.indexOf(q) !== -1 || serial.indexOf(q) !== -1);
      });
    }

    function renderUI() {
      var filtered = getFilteredEquipments();
      var kpiTotal = document.getElementById('kpi-total');
      var kpiActive = document.getElementById('kpi-active');
      var kpiMaint = document.getElementById('kpi-maint');
      var kpiComps = document.getElementById('kpi-comps');
      var countBadge = document.getElementById('eq-count-badge');

      if (kpiTotal) kpiTotal.textContent = equipments.length;
      if (kpiActive) kpiActive.textContent = equipments.filter(function(e) { return e && e.general && e.general.status === 'Đang khai thác'; }).length;
      if (kpiMaint) kpiMaint.textContent = equipments.filter(function(e) { return e && e.general && (e.general.status === 'Đang bảo dưỡng' || e.general.status === 'Dự phòng nóng'); }).length;
      
      var totalComps = 0;
      equipments.forEach(function(e) { if (e && e.components) totalComps += e.components.length; });
      if (kpiComps) kpiComps.textContent = totalComps;
      if (countBadge) countBadge.textContent = filtered.length + '/' + equipments.length;

      var listContainer = document.getElementById('equipment-list-container');
      if (listContainer) {
        listContainer.innerHTML = '';

        if (filtered.length === 0) {
          listContainer.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs">Chưa có thiết bị nào. Nhấp <strong>"Thêm Thiết Bị"</strong> để tạo hồ sơ.</div>';
        } else {
          filtered.forEach(function(eq) {
            var isSelected = eq.id === selectedEqId;
            var div = document.createElement('div');
            div.className = 'p-3 rounded-xl border transition cursor-pointer ' + (isSelected ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/20 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300');
            div.onclick = function() { selectedEqId = eq.id; renderUI(); };
            var eqOrg = eq.org || {};
            var eqGen = eq.general || {};
            var eqSpec = eq.spec || {};
            div.innerHTML = '<div class="flex items-center justify-between text-[10px] font-bold mb-1"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">' + (eqOrg.stationName || 'AACC HCM') + '</span><span class="font-semibold ' + (eqGen.status === 'Đang khai thác' ? 'text-emerald-700' : 'text-amber-700') + '">● ' + (eqGen.status || 'Khai thác') + '</span></div><h4 class="text-xs font-bold text-slate-900 leading-snug line-clamp-2">' + (eqGen.name || 'Thiết bị') + '</h4><div class="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2"><span>SN: ' + (eqGen.serial || 'N/A') + '</span><span class="text-blue-700 font-bold">' + (eqSpec.channelFreq || eqGen.category || '') + '</span></div>';
            listContainer.appendChild(div);
          });
        }
      }

      if (!selectedEqId && filtered.length > 0) selectedEqId = filtered[0].id;
      renderDossier();
    }

    function renderDossier() {
      var headerEl = document.getElementById('dossier-header');
      var bodyEl = document.getElementById('dossier-body');
      if (!headerEl || !bodyEl) return;

      var eq = equipments.find(function(e) { return e && e.id === selectedEqId; }) || equipments[0];
      if (!eq) {
        headerEl.innerHTML = '<div class="p-2"><h2 class="text-base font-bold text-white">Chưa chọn thiết bị</h2><p class="text-xs text-slate-300">Nhấp "Thêm Thiết Bị" để tạo hồ sơ đầu tiên.</p></div>';
        bodyEl.innerHTML = '<div class="p-12 text-center text-slate-400 text-xs">Chưa có thiết bị nào trong danh mục. Hãy bấm <strong>"Thêm Thiết Bị"</strong> ở góc trên bên phải để bắt đầu.</div>';
        return;
      }

      var g = eq.general || {};
      var o = eq.org || {};
      var s = eq.spec || {};

      headerEl.innerHTML = '<div><div class="flex items-center gap-2 mb-1"><span class="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">' + (o.stationName || 'AACC HCM') + '</span><span class="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white/10 text-white">' + (g.category || 'VHF/UHF') + '</span></div><h2 class="text-base sm:text-lg font-bold text-white">' + (g.name || 'Thiết bị CNS') + '</h2><p class="text-xs text-slate-300 font-mono">ID: ' + (eq.id || '') + ' · S/N: ' + (g.serial || '') + ' · Model: ' + (g.model || '') + '</p></div><div class="flex items-center gap-2"><button onclick="openEditModal()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"><i class="fa-solid fa-pen"></i><span>Sửa</span></button><button onclick="openPrintModalCurrent()" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"><i class="fa-solid fa-print"></i><span>In Sổ A4 VATM</span></button></div>';

      if (activeSubTab === 'general') {
        bodyEl.innerHTML = '<div class="space-y-4 text-xs"><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"><div><span class="text-slate-400 block text-[11px]">Đài trạm trực thuộc:</span><strong class="text-blue-900 text-sm font-bold">' + (o.stationName || 'AACC HCM') + '</strong></div><div><span class="text-slate-400 block text-[11px]">Hãng sản xuất / Nước SX:</span><strong class="text-slate-800">' + (g.manufacturer || '---') + ' (' + (g.origin || 'Việt Nam') + ')</strong></div><div><span class="text-slate-400 block text-[11px]">Năm SX / Ngày đưa vào SD:</span><strong class="text-slate-800">' + (g.yearMade || '---') + ' / ' + (g.commissioned || '---') + '</strong></div><div><span class="text-slate-400 block text-[11px]">Kỹ sư phụ trách:</span><strong class="text-slate-800">' + (o.primaryEngineer || '---') + '</strong></div><div><span class="text-slate-400 block text-[11px]">Vị trí đài trạm chi tiết:</span><strong class="text-slate-800">' + (o.location || '---') + '</strong></div><div><span class="text-slate-400 block text-[11px]">Mã tài sản cố định:</span><strong class="text-slate-800 font-mono">' + (g.assetNo || '---') + '</strong></div></div></div>';
      } else if (activeSubTab === 'specs') {
        var hasAnySpec = s.power || s.channelFreq || s.vswr || s.powerSupply || s.interface || s.coverage || s.modulation || s.mgmtIp || s.text;

        bodyEl.innerHTML = 
          '<div class="space-y-4 text-xs">' +
            '<div class="flex items-center justify-between">' +
              '<h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">' +
                '<i class="fa-solid fa-sliders text-blue-600"></i> Đặc Tính & Thông Số Kỹ Thuật (Do Người Dùng Nhập)' +
              '</h4>' +
              '<button onclick="openSpecsModal()" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">' +
                '<i class="fa-solid fa-pen-to-square"></i>' +
                '<span>Tự Nhập / Chỉnh Sửa Thông Số</span>' +
              '</button>' +
            '</div>' +

            (!hasAnySpec ? 
              '<div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 flex items-center justify-between gap-3">' +
                '<div class="flex items-center gap-2">' +
                  '<i class="fa-solid fa-circle-info text-amber-600 text-base"></i>' +
                  '<span>Mục thông số kỹ thuật hiện đang để trống. Nhấp vào nút <strong>"Tự Nhập / Chỉnh Sửa Thông Số"</strong> để nhập thông số cho thiết bị này.</span>' +
                '</div>' +
                '<button onclick="openSpecsModal()" class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shrink-0 cursor-pointer">Nhập ngay</button>' +
              '</div>' 
            : '') +

            '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
              '<div><span class="text-slate-400 block text-[11px]">Công suất phát (Power):</span><strong class="text-slate-900 font-mono text-sm">' + (s.power ? s.power : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
              '<div><span class="text-slate-400 block text-[11px]">Tần số hoạt động (Freq):</span><strong class="text-blue-700 font-mono text-sm">' + (s.channelFreq ? s.channelFreq : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
              '<div><span class="text-slate-400 block text-[11px]">Hệ số sóng đứng (VSWR):</span><strong class="text-emerald-700 font-mono text-sm">' + (s.vswr ? s.vswr : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
              '<div><span class="text-slate-400 block text-[11px]">Nguồn điện cung cấp:</span><strong class="text-slate-800">' + (s.powerSupply ? s.powerSupply : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
              '<div><span class="text-slate-400 block text-[11px]">Giao diện kết nối:</span><strong class="text-slate-800">' + (s.interface ? s.interface : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
              '<div><span class="text-slate-400 block text-[11px]">Tầm phủ sóng hiệu dụng:</span><strong class="text-slate-800">' + (s.coverage ? s.coverage : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
              '<div><span class="text-slate-400 block text-[11px]">Điều chế & Phân cực:</span><strong class="text-slate-800">' + (s.modulation ? s.modulation : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
              '<div><span class="text-slate-400 block text-[11px]">Địa chỉ IP quản trị:</span><strong class="text-slate-800 font-mono">' + (s.mgmtIp ? s.mgmtIp : '<span class="text-slate-400 font-normal italic">Chưa nhập</span>') + '</strong></div>' +
            '</div>' +

            '<div class="bg-blue-50/70 p-4 rounded-xl border border-blue-200">' +
              '<h5 class="font-bold text-blue-900 mb-1 flex items-center gap-1.5">' +
                '<i class="fa-solid fa-align-left"></i> Mô tả đặc tính kỹ thuật chi tiết (In ra Trang 4 Sổ A4):' +
              '</h5>' +
              '<p class="text-slate-800 whitespace-pre-line leading-relaxed font-mono text-[11px]">' +
                (s.text ? s.text : '<span class="text-slate-400 italic font-sans">Chưa có văn bản mô tả đặc tính kỹ thuật. Bấm nút "Tự Nhập / Chỉnh Sửa Thông Số" phía trên để nhập.</span>') +
              '</p>' +
            '</div>' +
          '</div>';
      } else if (activeSubTab === 'components') {
        var comps = eq.components || [];
        var rows = comps.map(function(c, i) { return '<tr class="border-b"><td class="p-2.5 font-mono text-center">' + (i+1) + '</td><td class="p-2.5 font-bold">' + (c.name || 'Linh kiện') + '</td><td class="p-2.5 font-mono">' + (c.partNo || '-') + '</td><td class="p-2.5 font-mono">' + (c.serial || '-') + '</td><td class="p-2.5"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">' + (c.healthStatus || 'Tốt') + '</span></td></tr>'; }).join('');
        bodyEl.innerHTML = '<table class="w-full text-left border rounded-xl overflow-hidden text-xs"><thead class="bg-slate-900 text-white font-bold"><tr><th class="p-2.5 text-center">STT</th><th class="p-2.5">Tên Khối</th><th class="p-2.5">Part No</th><th class="p-2.5">Số Serial</th><th class="p-2.5">Tình trạng</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="p-4 text-center text-slate-400">Chưa có linh kiện.</td></tr>') + '</tbody></table>';
      } else if (activeSubTab === 'maintenance') {
        var maints = eq.maintenance || [];
        var mRows = maints.map(function(m) { return '<tr class="border-b"><td class="p-2.5 font-mono">' + (m.date || '') + '</td><td class="p-2.5 font-bold">' + (m.cycle || '') + '</td><td class="p-2.5">' + (m.content || '') + '</td><td class="p-2.5 font-mono">' + (m.measuredParams || '-') + '</td><td class="p-2.5"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">' + (m.result || 'Đạt') + '</span></td><td class="p-2.5 font-semibold">' + (m.person || '') + '</td></tr>'; }).join('');
        bodyEl.innerHTML = '<table class="w-full text-left border rounded-xl overflow-hidden text-xs"><thead class="bg-emerald-800 text-white font-bold"><tr><th class="p-2.5">Ngày</th><th class="p-2.5">Định kỳ</th><th class="p-2.5">Nội dung</th><th class="p-2.5">Thông số</th><th class="p-2.5">Kết quả</th><th class="p-2.5">Kỹ sư</th></tr></thead><tbody>' + (mRows || '<tr><td colspan="6" class="p-4 text-center text-slate-400">Chưa có nhật ký bảo dưỡng.</td></tr>') + '</tbody></table>';
      } else if (activeSubTab === 'repair') {
        var repairs = eq.repair || [];
        var rRows = repairs.map(function(r) { return '<tr class="border-b"><td class="p-2.5 font-mono">' + (r.date || '') + '</td><td class="p-2.5 font-bold text-rose-800">' + (r.incidentDescription || '') + '</td><td class="p-2.5">' + (r.rootCause || '') + '</td><td class="p-2.5 text-emerald-800">' + (r.actionTaken || '') + '</td><td class="p-2.5"><span class="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">' + (r.status || 'Hoàn thành') + '</span></td></tr>'; }).join('');
        bodyEl.innerHTML = '<table class="w-full text-left border rounded-xl overflow-hidden text-xs"><thead class="bg-rose-900 text-white font-bold"><tr><th class="p-2.5">Ngày</th><th class="p-2.5">Hiện tượng</th><th class="p-2.5">Nguyên nhân</th><th class="p-2.5">Khắc phục</th><th class="p-2.5">Trạng thái</th></tr></thead><tbody>' + (rRows || '<tr><td colspan="5" class="p-4 text-center text-slate-400">Không có sự cố ghi nhận.</td></tr>') + '</tbody></table>';
      } else if (activeSubTab === 'qr') {
        bodyEl.innerHTML = '<div class="text-center p-6 space-y-3"><div id="qr-container" class="inline-block p-4 bg-white border-2 border-slate-300 rounded-2xl shadow-sm"></div><h4 class="font-bold text-slate-900 text-sm">' + (g.name || '') + '</h4><p class="text-xs text-slate-500 font-mono">Serial: ' + (g.serial || '') + ' · Đài: ' + (o.stationName || 'AACC HCM') + '</p><p class="text-[11px] text-blue-700 font-semibold">Quét mã QR để mở Sổ Lý Lịch Điện Tử trên thiết bị di động</p></div>';
        setTimeout(function() {
          var container = document.getElementById('qr-container');
          if (container && typeof QRCode !== 'undefined') {
            container.innerHTML = '';
            new QRCode(container, {
              text: window.location.href.split('?')[0] + '?eq=' + eq.id,
              width: 180,
              height: 180,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H
            });
          }
        }, 50);
      }
    }

    function setTab(tab) {
      activeSubTab = tab;
      document.querySelectorAll('.tab-btn').forEach(function(btn) { btn.className = 'tab-btn py-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap'; });
      var activeBtn = document.getElementById('tab-btn-' + tab);
      if (activeBtn) activeBtn.className = 'tab-btn py-3 px-3 border-b-2 border-blue-600 text-blue-700 font-bold whitespace-nowrap';
      renderDossier();
    }

    function handleSearch() { renderUI(); }
    function handleFilterChange() {
      var filterSel = document.getElementById('filter-station');
      if (filterSel) currentStationFilter = filterSel.value;
      renderUI();
    }

    // OPEN / CLOSE SPECS MODAL
    function openSpecsModal() {
      var eq = equipments.find(function(e) { return e && e.id === selectedEqId; });
      if (!eq) return;
      var s = eq.spec || {};
      var setVal = function(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; };
      setVal('spec-form-power', s.power);
      setVal('spec-form-freq', s.channelFreq);
      setVal('spec-form-powersupply', s.powerSupply);
      setVal('spec-form-vswr', s.vswr);
      setVal('spec-form-interface', s.interface);
      setVal('spec-form-coverage', s.coverage);
      setVal('spec-form-modulation', s.modulation);
      setVal('spec-form-ip', s.mgmtIp);
      setVal('spec-form-text', s.text);

      var modal = document.getElementById('specs-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function closeSpecsModal() {
      var modal = document.getElementById('specs-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function handleSaveCustomSpecs(e) {
      e.preventDefault();
      var eq = equipments.find(function(e) { return e && e.id === selectedEqId; });
      if (!eq) return;

      if (!eq.spec) eq.spec = {};
      var getVal = function(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      eq.spec.power = getVal('spec-form-power');
      eq.spec.channelFreq = getVal('spec-form-freq');
      eq.spec.powerSupply = getVal('spec-form-powersupply');
      eq.spec.vswr = getVal('spec-form-vswr');
      eq.spec.interface = getVal('spec-form-interface');
      eq.spec.coverage = getVal('spec-form-coverage');
      eq.spec.modulation = getVal('spec-form-modulation');
      eq.spec.mgmtIp = getVal('spec-form-ip');
      eq.spec.text = getVal('spec-form-text');

      closeSpecsModal();
      renderUI();

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.saveEquipmentToSheet(eq);
      }
    }

    function openAddModal() {
      var setVal = function(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; };
      setVal('form-id', '');
      setVal('form-name', '');
      setVal('form-model', '');
      setVal('form-serial', '');
      setVal('form-asset', '');
      setVal('form-mfg', '');
      setVal('form-year', '');
      setVal('form-spec-power', '');
      setVal('form-spec-freq', '');
      setVal('form-spec-powersupply', '');
      setVal('form-spec-vswr', '');
      setVal('form-spec-text', '');
      var titleEl = document.getElementById('form-modal-title');
      if (titleEl) titleEl.textContent = 'Thêm Thiết Bị CNS Mới Vào Sổ Lý Lịch';
      var modal = document.getElementById('add-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function openEditModal() {
      var eq = equipments.find(function(e) { return e && e.id === selectedEqId; });
      if (!eq) return;
      var g = eq.general || {};
      var o = eq.org || {};
      var s = eq.spec || {};

      var setVal = function(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; };
      setVal('form-id', eq.id);
      setVal('form-name', g.name);
      setVal('form-station', o.stationName || 'AACC HCM');
      setVal('form-category', g.category || 'VHF/UHF');
      setVal('form-model', g.model);
      setVal('form-serial', g.serial);
      setVal('form-asset', g.assetNo);
      setVal('form-mfg', g.manufacturer);
      setVal('form-year', (g.yearMade || '') + (g.commissioned ? ' / ' + g.commissioned : ''));
      setVal('form-spec-power', s.power);
      setVal('form-spec-freq', s.channelFreq);
      setVal('form-spec-powersupply', s.powerSupply);
      setVal('form-spec-vswr', s.vswr);
      setVal('form-spec-text', s.text);
      var titleEl = document.getElementById('form-modal-title');
      if (titleEl) titleEl.textContent = 'Chỉnh Sửa Hồ Sơ Thiết Bị & Thông Số';
      var modal = document.getElementById('add-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function closeAddModal() {
      var modal = document.getElementById('add-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function handleSaveEquipment(e) {
      e.preventDefault();
      var getVal = function(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var id = getVal('form-id');
      var name = getVal('form-name');
      var station = getVal('form-station') || 'AACC HCM';
      var cat = getVal('form-category') || 'VHF/UHF';
      var model = getVal('form-model') || 'MK6';
      var serial = getVal('form-serial') || ('SN-' + Date.now().toString().slice(-6));
      var asset = getVal('form-asset') || ('TSCD-' + Date.now().toString().slice(-6));
      var mfg = getVal('form-mfg') || 'VATM CNS';
      var yearRaw = getVal('form-year') || '';
      var power = getVal('form-spec-power');
      var freq = getVal('form-spec-freq');
      var powersupply = getVal('form-spec-powersupply');
      var vswr = getVal('form-spec-vswr');
      var specText = getVal('form-spec-text');

      if (id) {
        var target = equipments.find(function(item) { return item && item.id === id; });
        if (target) {
          if (!target.general) target.general = {};
          if (!target.org) target.org = {};
          if (!target.spec) target.spec = {};
          target.general.name = name;
          target.general.category = cat;
          target.general.model = model;
          target.general.serial = serial;
          target.general.assetNo = asset;
          target.general.manufacturer = mfg;
          target.general.yearMade = yearRaw ? yearRaw.split('/')[0].trim() : '';
          target.org.stationName = station;
          target.org.location = 'Đài trạm ' + station;
          target.spec.power = power;
          target.spec.channelFreq = freq;
          target.spec.powerSupply = powersupply;
          target.spec.vswr = vswr;
          target.spec.text = specText;
        }
      } else {
        var newEq = {
          id: 'EQ-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          general: { name: name, category: cat, model: model, serial: serial, manufacturer: mfg, assetNo: asset, bookletNo: '01', yearMade: yearRaw ? yearRaw.split('/')[0].trim() : '', origin: 'Việt Nam', commissioned: new Date().toISOString().split('T')[0], status: 'Đang khai thác', priority: 'Hệ thống chính (Level 1)' },
          org: { companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM', unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT', location: 'Đài trạm ' + station, stationName: station, primaryEngineer: 'KS. Trực ban', supervisor: 'KS. Trưởng đài' },
          spec: { power: power, channelFreq: freq, powerSupply: powersupply, vswr: vswr, interface: '', coverage: '', text: specText },
          components: [],
          maintenance: [],
          repair: []
        };
        equipments.unshift(newEq);
        selectedEqId = newEq.id;
      }

      closeAddModal();
      renderUI();

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.saveEquipmentToSheet(id ? equipments.find(function(e) { return e && e.id === id; }) : equipments[0]);
      }
    }

    // =========================================================================
    // EXACT VATM PDF 8-PAGE BOOKLET PRINT BUILDER
    // =========================================================================
    function openPrintModalCurrent() {
      var eq = equipments.find(function(e) { return e && e.id === selectedEqId; }) || equipments[0];
      if (!eq) return;
      currentPrintPage = 'all';
      var sel = document.getElementById('print-page-selector');
      if (sel) sel.value = 'all';
      renderVatmBookletPages(eq, 'all');
      var modal = document.getElementById('print-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function closePrintModal() {
      var modal = document.getElementById('print-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function changePrintPageMode(mode) {
      var eq = equipments.find(function(e) { return e && e.id === selectedEqId; }) || equipments[0];
      if (!eq) return;
      currentPrintPage = mode;
      renderVatmBookletPages(eq, mode);
    }

    function changePrintPaperSize(size) {
      var printArea = document.getElementById('print-area');
      var styleTag = document.getElementById('dynamic-print-paper-style');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-print-paper-style';
        document.head.appendChild(styleTag);
      }
      
      if (size === 'A5') {
        styleTag.innerHTML = '@media print { @page { size: A5 portrait; margin: 5mm; } .page-break { page-break-after: always; break-after: page; } table th, table td { padding: 3pt 4pt !important; font-size: 8.5pt !important; } .vatm-table th, .vatm-table td { padding: 3pt 4pt !important; font-size: 8.5pt !important; } }';
        if (printArea) {
          printArea.style.maxWidth = '600px';
          printArea.style.fontSize = '12px';
        }
      } else {
        styleTag.innerHTML = '@media print { @page { size: A4 portrait; margin: 10mm; } .page-break { page-break-after: always; break-after: page; } }';
        if (printArea) {
          printArea.style.maxWidth = '900px';
          printArea.style.fontSize = '14px';
        }
      }
    }

    function renderVatmBookletPages(eq, pageMode) {
      if (!eq) return;
      var g = eq.general || {};
      var o = eq.org || {};
      var s = eq.spec || {};
      var comps = eq.components || [];
      var maints = eq.maintenance || [];
      var repairs = eq.repair || [];
      var mgmt = eq.managingUnits || [{ date: g.commissioned || g.yearMade || '2014', unitName: o.unit || 'Đài Thông Tin AACC', status: 'Tốt' }];
      var licFreq = eq.licenseFrequency || [{ no: '220043/GP', expireDate: '30/06/2026' }];
      var licOper = eq.licenseOperation || [{ no: '4380/GP-CHK', expireDate: '28/10/2026' }];
      var docs = eq.technicalDocs || [{ name: g.name + ' Technical Manual', qty: '01', notes: 'Kèm theo máy' }];

      var html = '';

      // --- TRANG 1: BÌA SỔ CHUẨN VATM ---
      if (pageMode === 'all' || pageMode === '1') {
        html += 
          '<div class="vatm-cover-box">' +
            '<div style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase;">' + (o.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM') + '</div>' +
            '<div style="text-align:right; font-size:12pt; font-weight:bold; font-style:italic; margin-top:4px;">' + (g.bookletNo || '09 (120.9 TxM)') + '</div>' +
            '<div style="height:90pt;"></div>' +
            '<h1 style="font-size:26pt; font-weight:bold; text-transform:uppercase; letter-spacing:2px; margin-bottom:30pt;">LÝ LỊCH THIẾT BỊ</h1>' +
            '<div style="border-top:1px dotted #000000; width:60%; margin:0 auto 40pt auto;"></div>' +
            '<div style="text-align:left; font-size:13pt; margin-left:30pt; line-height:2.2;">' +
              '<p><strong>Tên thiết bị:</strong> .................... <span style="font-weight:bold;">' + (g.name || '---') + '</span> ....................</p>' +
              '<p><strong>Hãng sản xuất:</strong> .................... <span style="font-weight:bold;">' + (g.manufacturer || '---') + '</span> ....................</p>' +
              '<p><strong>Số hiệu:</strong> .................... <span style="font-weight:bold;">' + (g.model || '---') + '</span> ....................</p>' +
              '<p><strong>Mã số (S/N):</strong> .................... <span style="font-weight:bold;">' + (g.serial || '---') + '</span> ....................</p>' +
              '<p><strong>Mã TS:</strong> .................... <span style="font-weight:bold;">' + (g.assetNo || '....................') + '</span> ....................</p>' +
            '</div>' +
            '<div style="height:50pt;"></div>' +
            '<div style="border:1px solid #000000; width:180pt; margin:0 auto; padding:8pt; text-align:center; font-size:12pt;">' +
              'Số: <strong>' + (g.bookletNo || '09 (120.9 TxM)') + '</strong>' +
            '</div>' +
            '<div id="print-cover-qr" style="text-align:center; margin-top:15pt;">' +
              '<div id="cover-qr-box" style="display:inline-block; border:1px solid #000000; padding:4px;"></div>' +
              '<p style="font-size:8pt; font-style:italic; margin-top:4pt;">Quét mã QR để mở Sổ lý lịch điện tử (PDF)</p>' +
            '</div>' +
          '</div>' +
          (pageMode === 'all' ? '<div class="page-break"></div>' : '');
      }

      // --- TRANG 2: MỤC LỤC & 1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ ---
      if (pageMode === 'all' || pageMode === '2') {
        var mgmtRows = mgmt.map(function(m) {
          return '<tr><td style="text-align:center;">' + m.date + '</td><td>' + m.unitName + '</td><td style="text-align:center;">' + m.status + '</td></tr>';
        }).join('');
        for (var i = mgmt.length; i < 9; i++) {
          mgmtRows += '<tr><td style="height:24pt;">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
        }

        html += 
          '<div style="padding: 10pt 0;">' +
            '<h2 style="text-align:center; font-size:16pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">MỤC LỤC</h2>' +
            '<table style="border:none; width:100%; font-size:12pt; line-height:1.8; margin-bottom:20pt;">' +
              '<tr><td style="border:none;"><strong>1. Cơ quan, đơn vị quản lý</strong></td><td style="border:none; text-align:right;"><strong>2</strong></td></tr>' +
              '<tr><td style="border:none;"><strong>2. Sơ lược thiết bị</strong></td><td style="border:none; text-align:right;"><strong>3</strong></td></tr>' +
              '<tr><td style="border:none; padding-left:20pt;">2.1. Đặc tính kỹ thuật</td><td style="border:none; text-align:right;">4</td></tr>' +
              '<tr><td style="border:none; padding-left:20pt;">2.2. Thành phần thiết bị</td><td style="border:none; text-align:right;">5</td></tr>' +
              '<tr><td style="border:none; padding-left:20pt;">2.3. Tài liệu kỹ thuật kèm theo</td><td style="border:none; text-align:right;">6</td></tr>' +
              '<tr><td style="border:none;"><strong>3. Bảo dưỡng</strong></td><td style="border:none; text-align:right;"><strong>7</strong></td></tr>' +
              '<tr><td style="border:none;"><strong>4. Kiểm tra - Sửa chữa - Thay thế - Thay đổi</strong></td><td style="border:none; text-align:right;"><strong>8</strong></td></tr>' +
            '</table>' +
            '<div style="height:15pt;"></div>' +
            '<h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:10pt;">1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ</h3>' +
            '<table class="vatm-table"><thead><tr><th style="width:25%;">NGÀY THÁNG</th><th style="width:50%;">ĐƠN VỊ</th><th style="width:25%;">TÌNH TRẠNG</th></tr></thead><tbody>' + mgmtRows + '</tbody></table>' +
            '<div class="page-number">2</div>' +
          '</div>' +
          (pageMode === 'all' ? '<div class="page-break"></div>' : '');
      }

      // --- TRANG 3: 2- SƠ LƯỢC THIẾT BỊ & GIẤY PHÉP ---
      if (pageMode === 'all' || pageMode === '3') {
        var licRows = '';
        var maxLic = Math.max(7, licFreq.length, licOper.length);
        for (var j = 0; j < maxLic; j++) {
          var f = licFreq[j];
          var op = licOper[j];
          licRows += '<tr><td style="text-align:center;">' + (f ? f.no : '&nbsp;') + '</td><td style="text-align:center;">' + (f ? f.expireDate : '&nbsp;') + '</td><td style="text-align:center;">' + (op ? op.no : '&nbsp;') + '</td><td style="text-align:center;">' + (op ? op.expireDate : '&nbsp;') + '</td></tr>';
        }

        html += 
          '<div style="padding: 10pt 0;">' +
            '<h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">2 - SƠ LƯỢC THIẾT BỊ</h3>' +
            '<div style="font-size:12pt; line-height:2.0; margin-bottom:15pt;">' +
              '<p><strong>Tên thiết bị:</strong> .................... <span style="font-weight:bold;">' + (g.name || '---') + '</span> ....................</p>' +
              '<p><strong>Hãng sản xuất:</strong> .................... <span style="font-weight:bold;">' + (g.manufacturer || '---') + '</span> ....................</p>' +
              '<p><strong>Ký hiệu (Model):</strong> .................... <span style="font-weight:bold;">' + (g.model || '---') + '</span> ....................</p>' +
              '<p><strong>Mã số (S/N):</strong> .................... <span style="font-weight:bold;">' + (g.serial || '---') + '</span> ....................</p>' +
              '<p><strong>Năm sản xuất:</strong> .................... <span style="font-weight:bold;">' + (g.yearMade || '................') + '</span> ....................</p>' +
              '<p><strong>Nước sản xuất:</strong> .................... <span style="font-weight:bold;">' + (g.origin || 'Việt Nam') + '</span> ....................</p>' +
              '<p><strong>Thời gian sử dụng:</strong> .................... <span style="font-weight:bold;">' + (g.usageTime || (g.commissioned ? ('Sử dụng từ ' + g.commissioned) : '................')) + '</span> ....................</p>' +
              '<p><strong>Thời gian bảo hành:</strong> .................... <span style="font-weight:bold;">' + (g.warrantyPeriod || '12 tháng') + '</span> ....................</p>' +
            '</div>' +
            '<table class="vatm-table"><thead><tr><th colspan="2" style="width:50%;">Giấy phép sử dụng tần số và thiết bị VTĐ</th><th colspan="2" style="width:50%;">Giấy phép khai thác hệ thống kỹ thuật, thiết bị</th></tr><tr><th style="width:25%;">Số</th><th style="width:25%;">Ngày hết hạn</th><th style="width:25%;">Số</th><th style="width:25%;">Ngày hết hạn</th></tr></thead><tbody>' + licRows + '</tbody></table>' +
            '<div class="page-number">3</div>' +
          '</div>' +
          (pageMode === 'all' ? '<div class="page-break"></div>' : '');
      }

      // --- TRANG 4: 2.1 - ĐẶC TÍNH KỸ THUẬT (DO NGƯỜI DÙNG TỰ NHẬP - NẾU TRỐNG THÌ IN DÒNG CHẤM TRỐNG) ---
      if (pageMode === 'all' || pageMode === '4') {
        var specLines = [];

        if (s.text && s.text.trim()) {
          specLines = s.text.split('\\n').map(function(l) { return l.trim(); }).filter(Boolean);
        } else {
          // If individual fields exist, show only non-empty ones
          if (s.channelFreq || s.modulation) {
            specLines.push('- Tần số hoạt động / Dải tần: <strong>' + (s.channelFreq || '---') + '</strong>' + (s.modulation ? '; Điều chế: <strong>' + s.modulation + '</strong>' : ''));
          }
          if (s.power) {
            specLines.push('- Công suất phát: <strong>' + s.power + '</strong>');
          }
          if (s.powerSupply) {
            specLines.push('- Nguồn điện cung cấp: <strong>' + s.powerSupply + '</strong>');
          }
          if (s.vswr || s.interface) {
            specLines.push('- Hệ số sóng đứng (VSWR): <strong>' + (s.vswr || '---') + '</strong>' + (s.interface ? '; Giao diện kết nối: <strong>' + s.interface + '</strong>' : ''));
          }
          if (s.coverage) {
            specLines.push('- Tầm phủ sóng hiệu dụng: <strong>' + s.coverage + '</strong>');
          }
          if (s.mgmtIp) {
            specLines.push('- Địa chỉ IP quản trị: <strong>' + s.mgmtIp + '</strong>');
          }
        }

        var dottedRows = specLines.map(function(line) {
          return '<p style="border-bottom:1px dotted #000; padding-bottom:3pt; margin-bottom:8pt;">' + line + '</p>';
        }).join('');

        var remainingLines = Math.max(4, 16 - specLines.length);
        for (var k = 0; k < remainingLines; k++) {
          dottedRows += '<p style="border-bottom:1px dotted #000; height:24pt; margin:0 0 6pt 0;">&nbsp;</p>';
        }

        html += 
          '<div style="padding: 10pt 0;">' +
            '<h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">2.1 - ĐẶC TÍNH KỸ THUẬT</h3>' +
            '<div style="font-size:12pt; line-height:2.2; padding:0 5pt;">' + dottedRows + '</div>' +
            '<div class="page-number">4</div>' +
          '</div>' +
          (pageMode === 'all' ? '<div class="page-break"></div>' : '');
      }

      // --- TRANG 5: 2.2 - THÀNH PHẦN THIẾT BỊ ---
      if (pageMode === 'all' || pageMode === '5') {
        var compRows = comps.map(function(c, idx) {
          var pn = c.partNo ? ' (PN: ' + c.partNo + ')' : '';
          var sn = c.serial ? ' (SN: ' + c.serial + ')' : '';
          return '<tr><td style="text-align:center;">' + (idx + 1).toString().padStart(2, '0') + '</td><td><strong>' + (c.name || 'Khối') + '</strong>' + pn + sn + '</td><td style="text-align:center;">bộ</td><td style="text-align:center;">' + (c.qty || 1).toString().padStart(2, '0') + '</td><td>' + (c.notes || c.healthStatus || 'Tốt') + '</td></tr>';
        }).join('');

        for (var l = comps.length; l < 14; l++) {
          compRows += '<tr><td style="height:22pt;">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
        }

        html += 
          '<div style="padding: 10pt 0;">' +
            '<h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">2.2 - THÀNH PHẦN THIẾT BỊ</h3>' +
            '<table class="vatm-table"><thead><tr><th style="width:8%;">TT</th><th style="width:52%;">TÊN THIẾT BỊ</th><th style="width:12%;">ĐVT</th><th style="width:10%;">SL</th><th style="width:18%;">GHI CHÚ</th></tr></thead><tbody>' + compRows + '</tbody></table>' +
            '<div class="page-number">5</div>' +
          '</div>' +
          (pageMode === 'all' ? '<div class="page-break"></div>' : '');
      }

      // --- TRANG 6: 2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO ---
      if (pageMode === 'all' || pageMode === '6') {
        var docRows = docs.map(function(d, idx) {
          return '<tr><td style="text-align:center;">' + (idx + 1).toString().padStart(2, '0') + '</td><td><strong>' + (d.name || 'Tài liệu') + '</strong></td><td style="text-align:center;">' + (d.qty || '01') + '</td><td>' + (d.notes || 'Kèm theo máy') + '</td></tr>';
        }).join('');

        for (var m = docs.length; m < 14; m++) {
          docRows += '<tr><td style="height:22pt;">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
        }

        html += 
          '<div style="padding: 10pt 0;">' +
            '<h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO</h3>' +
            '<table class="vatm-table"><thead><tr><th style="width:10%;">TT</th><th style="width:60%;">TÊN TÀI LIỆU</th><th style="width:12%;">SL</th><th style="width:18%;">GHI CHÚ</th></tr></thead><tbody>' + docRows + '</tbody></table>' +
            '<div class="page-number">6</div>' +
          '</div>' +
          (pageMode === 'all' ? '<div class="page-break"></div>' : '');
      }

      // --- TRANG 7: 3 - BẢO DƯỠNG ---
      if (pageMode === 'all' || pageMode === '7') {
        var maintRows = maints.slice(0, 10).map(function(m) {
          var params = m.measuredParams ? '<br/><span style="font-style:italic; font-size:10pt;">(Thông số: ' + m.measuredParams + ')</span>' : '';
          return '<tr><td style="text-align:center;">' + (m.date || '') + '</td><td>- ' + (m.content || '') + params + '</td><td style="text-align:center; font-weight:bold;">' + (m.person || '') + '</td></tr>';
        }).join('');

        for (var n = maints.length; n < 10; n++) {
          maintRows += '<tr><td style="height:24pt;">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
        }

        html += 
          '<div style="padding: 10pt 0;">' +
            '<h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">3 - BẢO DƯỠNG</h3>' +
            '<table class="vatm-table"><thead><tr><th style="width:20%;">THỜI GIAN</th><th style="width:60%;">KẾT LUẬN KẾT QUẢ BẢO DƯỠNG</th><th style="width:20%;">NGƯỜI THỰC HIỆN</th></tr></thead><tbody>' + maintRows + '</tbody></table>' +
            '<div class="page-number">7</div>' +
          '</div>' +
          (pageMode === 'all' ? '<div class="page-break"></div>' : '');
      }

      // --- TRANG 8: 4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI ---
      if (pageMode === 'all' || pageMode === '8') {
        var repRows = repairs.map(function(r) {
          var repParts = r.replacedParts ? ' (Thay: ' + r.replacedParts + ')' : '';
          return '<tr><td style="text-align:center;">' + (r.date || '') + '</td><td><strong>' + (r.incidentDescription || '') + '</strong><br/>- Xử lý: ' + (r.actionTaken || '') + repParts + '</td><td style="text-align:center; font-weight:bold;">' + (r.person || '') + '</td></tr>';
        }).join('');

        if (repairs.length === 0) {
          repRows = '<tr><td style="text-align:center;">10/10/17</td><td>Hỏng máy phát VHF, đã gửi đi sửa chữa tại xưởng kỹ thuật</td><td style="text-align:center;">Đội TT</td></tr><tr><td style="text-align:center;">02/04/19</td><td>Sửa xong, đưa vào hoạt động tốt</td><td style="text-align:center;">Đội TT</td></tr>';
        }

        for (var p = Math.max(2, repairs.length); p < 10; p++) {
          repRows += '<tr><td style="height:24pt;">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
        }

        html += 
          '<div style="padding: 10pt 0;">' +
            '<h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI</h3>' +
            '<table class="vatm-table"><thead><tr><th style="width:20%;">THỜI GIAN</th><th style="width:60%;">NỘI DUNG THỰC HIỆN</th><th style="width:20%;">NGƯỜI THỰC HIỆN</th></tr></thead><tbody>' + repRows + '</tbody></table>' +
            '<div class="page-number">8</div>' +
          '</div>';
      }

      var contentEl = document.getElementById('print-content');
      if (contentEl) contentEl.innerHTML = html;

      // Render Cover QR Code
      if (pageMode === 'all' || pageMode === '1') {
        setTimeout(function() {
          var qrBox = document.getElementById('cover-qr-box');
          if (qrBox && typeof QRCode !== 'undefined') {
            qrBox.innerHTML = '';
            new QRCode(qrBox, {
              text: window.location.href.split('?')[0] + '?eq=' + eq.id,
              width: 75,
              height: 75,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          }
        }, 50);
      }
    }

    // INITIAL RENDER
    renderUI();

    // AUTO PULL FROM APPS SCRIPT IF PRESENT
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(function(serverData) {
          if (Array.isArray(serverData) && serverData.length > 0) {
            equipments = serverData;
            renderUI();
          }
        })
        .getEquipmentsFromSheet();
    }
  </script>
</body>
</html>`;
}
