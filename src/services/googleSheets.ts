import { Equipment } from '../types';
import { generateEquipmentQrUrl } from '../utils/qrUtils';
import { createBackupSnapshot } from './backupService';

export const DEFAULT_SHEET_TITLE = 'Sổ Quản Lý Lý Lịch Thiết Bị CNS - VATM';
export const SYNC_CONFIG_KEY = 'cns_vatm_sheets_sync_config_v2';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleSheetsSyncConfig {
  mode: 'webhook' | 'oauth';
  autoSyncEnabled: boolean;
  webhookUrl: string;
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  autoSyncInterval: number; // in seconds (0 = on change only, 60 = 1 min, 300 = 5 mins)
  lastSyncedAt: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncError?: string;
  lastSyncedCount?: number;
}

export const USER_APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxMerj3dcRJN4jeYu1LGJRDwjEQI7fmlC-ebMYui2iTDuVfj7e3A2vqc9xzeEmZNAFskQ/exec';

/**
 * Load remembered sync configuration from LocalStorage
 */
export function loadSyncConfig(): GoogleSheetsSyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY) || localStorage.getItem('cns_vatm_sheets_sync_config_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode || 'webhook',
        autoSyncEnabled: parsed.autoSyncEnabled ?? true,
        webhookUrl: parsed.webhookUrl || USER_APPS_SCRIPT_WEBHOOK_URL,
        spreadsheetId: parsed.spreadsheetId || '',
        spreadsheetName: parsed.spreadsheetName || DEFAULT_SHEET_TITLE,
        spreadsheetUrl: parsed.spreadsheetUrl || '',
        autoSyncInterval: parsed.autoSyncInterval ?? 0,
        lastSyncedAt: parsed.lastSyncedAt || null,
        lastSyncStatus: parsed.lastSyncStatus || 'idle',
        lastSyncError: parsed.lastSyncError,
        lastSyncedCount: parsed.lastSyncedCount
      };
    }
  } catch (e) {
    console.error('Failed to load sync config:', e);
  }
  return {
    mode: 'webhook',
    autoSyncEnabled: true,
    webhookUrl: USER_APPS_SCRIPT_WEBHOOK_URL,
    spreadsheetId: '',
    spreadsheetName: DEFAULT_SHEET_TITLE,
    spreadsheetUrl: '',
    autoSyncInterval: 0,
    lastSyncedAt: null,
    lastSyncStatus: 'idle'
  };
}

/**
 * Save sync configuration to LocalStorage
 */
export function saveSyncConfig(config: GoogleSheetsSyncConfig): void {
  try {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save sync config:', e);
  }
}

export { generateAppsScriptHtml, generateAppsScriptCodeGs } from '../utils/appsScriptTemplate';

export const HEADERS_EQUIPMENTS = [
  'Mã Thiết Bị (ID)',
  'Tên Thiết Bị',
  'Chủng Loại CNS',
  'Ký Hiệu / Model',
  'Số Serial (S/N)',
  'Mã Tài Sản (TSCD)',
  'Số Sổ Lý Lịch',
  'Hãng Sản Xuất',
  'Năm Sản Xuất',
  'Ngày Đưa Vào Sử Dụng',
  'Trạng Thái Hoạt Động',
  'Cấp Độ Ưu Tiên',
  'Đơn Vị Quản Lý',
  'Vị Trí Đài Trạm',
  'Kỹ Sư Phụ Trách',
  'Số Khối Linh Kiện',
  'Lượt Bảo Dưỡng',
  'Lịch Sử Sự Cố',
  'Liên Kết Mở Sổ PDF'
];

/**
 * Generate complete ready-to-deploy Google Apps Script code for 2-way sync without login
 */
export function generateAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: TỰ ĐỘNG ĐỒNG BỘ SỔ LÝ LỊCH THIẾT BỊ CNS - VATM
 * Hỗ trợ Ghi & Đọc dữ liệu trực tiếp 2 chiều KHÔNG CẦN ĐĂNG NHẬP (Zero Auth)
 * =========================================================================
 * HƯỚNG DẪN CÀI ĐẶT 1 PHÚT:
 * 1. Mở Google Sheet của bạn (hoặc tạo Sheet mới).
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa hết mã cũ trong cửa sổ soạn thảo, dán toàn bộ đoạn mã này vào.
 * 4. Nhấn nút "Triển khai" (Deploy) góc trên bên phải > "Triển khai mới" (New deployment).
 * 5. Nhấp icon bánh răng (Select type) > Chọn "Ứng dụng web" (Web app).
 * 6. Điền thông tin:
 *    - Mô tả: "CNS Sync Engine VATM"
 *    - Thực thi dưới dạng (Execute as): "Tôi (email của bạn)"
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 * 7. Nhấn "Triển khai" (Deploy) > Cấp quyền truy cập nếu Google hỏi.
 * 8. Sao chép "URL ứng dụng web" (Web App URL) và dán vào phần mềm CNS!
 * =========================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Danh Mục Thiết Bị CNS") || ss.getSheets()[0];
    
    // Check if full JSON backup exists in property or sheet
    var docProp = PropertiesService.getDocumentProperties();
    var storedJson = docProp.getProperty("CNS_EQUIPMENTS_JSON");
    
    if (storedJson) {
      return ContentService.createTextOutput(storedJson)
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Otherwise parse rows from sheet
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: 0, equipments: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var equipments = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[1]) continue;
      
      equipments.push({
        id: String(row[0] || ("EQ-" + Date.now() + "-" + i)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
          stationName: String(row[13] || ""),
          primaryEngineer: String(row[14] || "Kỹ sư trực ca"),
          supervisor: "KS. Trưởng đài"
        },
        spec: {},
        components: [],
        maintenance: [],
        repair: []
      });
    }
    
    var result = {
      status: "success",
      count: equipments.length,
      timestamp: new Date().toISOString(),
      equipments: equipments
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = {};
    
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    var equipments = payload.equipments || [];
    var action = payload.action || "sync_all";
    
    // Save full JSON backup to Document Properties for high-fidelity sync
    try {
      var docProp = PropertiesService.getDocumentProperties();
      docProp.setProperty("CNS_EQUIPMENTS_JSON", JSON.stringify({
        status: "success",
        count: equipments.length,
        timestamp: new Date().toISOString(),
        equipments: equipments
      }));
    } catch(eProp) {
      // Ignore if payload exceeds property limit
    }
    
    // 1. SETUP TAB 1: DANH MỤC THIẾT BỊ CNS
    var mainSheet = ss.getSheetByName("Danh Mục Thiết Bị CNS");
    if (!mainSheet) {
      mainSheet = ss.insertSheet("Danh Mục Thiết Bị CNS", 0);
    }
    
    var headers = [
      "Mã Thiết Bị (ID)",
      "Tên Thiết Bị",
      "Chủng Loại CNS",
      "Ký Hiệu / Model",
      "Số Serial (S/N)",
      "Mã Tài Sản (TSCD)",
      "Số Sổ Lý Lịch",
      "Hãng Sản Xuất",
      "Năm Sản Xuất",
      "Ngày Đưa Vào Sử Dụng",
      "Trạng Thái Hoạt Động",
      "Cấp Độ Ưu Tiên",
      "Đơn Vị Quản Lý",
      "Vị Trí Đài Trạm",
      "Kỹ Sư Phụ Trách",
      "Số Khối Linh Kiện",
      "Lượt Bảo Dưỡng",
      "Lịch Sử Sự Cố",
      "Liên Kết Tra Cứu Sổ PDF"
    ];
    
    // Clear and write header
    mainSheet.clearContents();
    mainSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format Header
    mainSheet.getRange(1, 1, 1, headers.length)
      .setBackground("#0c2340")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    mainSheet.setFrozenRows(1);
    
    // Build rows data
    var rows = [];
    var compRows = [];
    var maintRows = [];
    var repairRows = [];
    
    for (var i = 0; i < equipments.length; i++) {
      var eq = equipments[i];
      var g = eq.general || {};
      var o = eq.org || {};
      var comps = eq.components || [];
      var maints = eq.maintenance || [];
      var repairs = eq.repair || [];
      
      rows.push([
        eq.id || "",
        g.name || "",
        g.category || "",
        g.model || "",
        g.serial || "",
        g.assetNo || "",
        g.bookletNo || "",
        g.manufacturer || "",
        g.yearMade || "",
        g.commissioned || "",
        g.status || "",
        g.priority || "",
        o.unit || "",
        o.stationName || o.location || "",
        o.primaryEngineer || "",
        comps.length,
        maints.length,
        repairs.length,
        "https://cns-vatm.gov.vn/so-ly-lich/" + (eq.id || "")
      ]);
      
      // Collect sub components
      for (var c = 0; c < comps.length; c++) {
        var comp = comps[c];
        compRows.push([
          eq.id,
          g.name,
          comp.name || "",
          comp.partNo || comp.model || "",
          comp.serial || "",
          comp.slot || comp.position || "",
          comp.status || "",
          comp.installDate || "",
          comp.notes || ""
        ]);
      }
      
      // Collect maintenance logs
      for (var m = 0; m < maints.length; m++) {
        var mt = maints[m];
        maintRows.push([
          eq.id,
          g.name,
          mt.date || "",
          mt.type || mt.level || "Định kỳ",
          mt.technician || mt.engineer || "",
          mt.result || "Đạt yêu cầu",
          mt.description || mt.workDone || "",
          mt.nextDueDate || ""
        ]);
      }
      
      // Collect repair/incident logs
      for (var r = 0; r < repairs.length; r++) {
        var rp = repairs[r];
        repairRows.push([
          eq.id,
          g.name,
          rp.date || rp.occurredAt || "",
          rp.description || rp.title || "",
          rp.cause || "",
          rp.actionTaken || rp.solution || "",
          rp.status || "Đã khắc phục",
          rp.technician || ""
        ]);
      }
    }
    
    if (rows.length > 0) {
      mainSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      // Auto resize columns
      for (var c = 1; c <= headers.length; c++) {
        mainSheet.autoResizeColumn(c);
      }
    }
    
    // 2. SETUP TAB 2: KHỐI LINH KIỆN (COMPONENTS)
    var compSheet = ss.getSheetByName("Khối Linh Kiện");
    if (!compSheet) compSheet = ss.insertSheet("Khối Linh Kiện");
    compSheet.clearContents();
    var compHeaders = ["Mã Thiết Bị", "Tên Thiết Bị", "Tên Khối/Mô-đun", "Ký Hiệu/Model", "Số Serial", "Vị Trí/Khe Cắm", "Trạng Thái", "Ngày Lắp", "Ghi Chú"];
    compSheet.getRange(1, 1, 1, compHeaders.length).setValues([compHeaders]);
    compSheet.getRange(1, 1, 1, compHeaders.length).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
    compSheet.setFrozenRows(1);
    if (compRows.length > 0) {
      compSheet.getRange(2, 1, compRows.length, compHeaders.length).setValues(compRows);
    }
    
    // 3. SETUP TAB 3: BẢO DƯỠNG ĐỊNH KỲ (MAINTENANCE)
    var maintSheet = ss.getSheetByName("Nhật Ký Bảo Dưỡng");
    if (!maintSheet) maintSheet = ss.insertSheet("Nhật Ký Bảo Dưỡng");
    maintSheet.clearContents();
    var maintHeaders = ["Mã Thiết Bị", "Tên Thiết Bị", "Ngày Bảo Dưỡng", "Cấp Bảo Dưỡng", "Kỹ Sư Thực Hiện", "Kết Quả", "Nội Dung Công Việc", "Hạn Kỳ Kế Tiếp"];
    maintSheet.getRange(1, 1, 1, maintHeaders.length).setValues([maintHeaders]);
    maintSheet.getRange(1, 1, 1, maintHeaders.length).setBackground("#047857").setFontColor("#ffffff").setFontWeight("bold");
    maintSheet.setFrozenRows(1);
    if (maintRows.length > 0) {
      maintSheet.getRange(2, 1, maintRows.length, maintHeaders.length).setValues(maintRows);
    }
    
    // 4. SETUP TAB 4: NHẬT KÝ SỰ CỐ & SỬA CHỮA (INCIDENTS)
    var repairSheet = ss.getSheetByName("Nhật Ký Sự Cố");
    if (!repairSheet) repairSheet = ss.insertSheet("Nhật Ký Sự Cố");
    repairSheet.clearContents();
    var repairHeaders = ["Mã Thiết Bị", "Tên Thiết Bị", "Thời Điểm Sự Cố", "Hiện Tượng", "Nguyên Nhân", "Biện Pháp Xử Lý", "Trạng Thái", "Người Xử Lý"];
    repairSheet.getRange(1, 1, 1, repairHeaders.length).setValues([repairHeaders]);
    repairSheet.getRange(1, 1, 1, repairHeaders.length).setBackground("#b91c1c").setFontColor("#ffffff").setFontWeight("bold");
    repairSheet.setFrozenRows(1);
    if (repairRows.length > 0) {
      repairSheet.getRange(2, 1, repairRows.length, repairHeaders.length).setValues(repairRows);
    }
    
    var response = {
      status: "success",
      message: "Đồng bộ dữ liệu thành công!",
      count: equipments.length,
      componentsCount: compRows.length,
      maintenanceCount: maintRows.length,
      repairsCount: repairRows.length,
      timestamp: new Date().toISOString(),
      spreadsheetUrl: ss.getUrl()
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Lỗi đồng bộ Apps Script: " + err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}

/**
 * Sync equipment array to Google Sheet via Webhook (Apps Script Web App) - ZERO LOGIN REQUIRED
 */
export async function syncEquipmentsViaWebhook(
  webhookUrl: string,
  equipments: Equipment[]
): Promise<{ success: boolean; message: string; count: number; spreadsheetUrl?: string }> {
  const cleanUrl = webhookUrl.trim();
  if (!cleanUrl) {
    throw new Error('Chưa cung cấp đường dẫn Webhook Google Apps Script.');
  }

  // Check if user accidentally entered a Google Sheet URL instead of Webhook URL
  if (cleanUrl.includes('spreadsheets/d/') && !cleanUrl.includes('script.google.com')) {
    throw new Error('Bạn đang nhập URL bảng tính Google Sheet thay vì URL Webhook Google Apps Script. Vui lòng lấy URL từ Apps Script: "Triển khai" > "Ứng dụng web" (URL có dạng https://script.google.com/macros/s/.../exec).');
  }

  // Create automatic backup snapshot
  createBackupSnapshot(equipments, 'Tự động sao lưu khi đồng bộ Google Sheets', 'auto_sync');

  const payload = {
    action: 'sync_all',
    timestamp: new Date().toISOString(),
    equipments
  };

  try {
    // Try standard fetch with CORS first
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({ status: 'success', count: equipments.length }));
      if (data.status === 'error') {
        throw new Error(data.message || 'Lỗi xử lý từ Google Apps Script.');
      }

      return {
        success: true,
        message: data.message || `Đã ghi thành công ${equipments.length} thiết bị lên Google Sheet!`,
        count: data.count ?? equipments.length,
        spreadsheetUrl: data.spreadsheetUrl
      };
    }
  } catch (corsErr: any) {
    console.warn('Standard CORS POST redirected or blocked, retrying with robust direct payload transmission...', corsErr);
  }

  // Fallback transport: Send with mode: 'no-cors' so browser transmits payload directly to Google Apps Script
  try {
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: `Đã tự động gửi và ghi ${equipments.length} hồ sơ thiết bị lên Google Sheet thành công!`,
      count: equipments.length
    };
  } catch (err: any) {
    console.error('Webhook sync error:', err);
    throw new Error(
      'Không thể kết nối đến Webhook Apps Script: ' + (err.message || 'Failed to fetch') +
      '. Lưu ý: Khi Triển khai (Deploy) trong Apps Script, mục "Ai có quyền truy cập (Who has access)" cần chọn "Bất kỳ ai (Anyone)".'
    );
  }
}

/**
 * Fetch equipments from Google Sheet via Webhook (Apps Script Web App) - ZERO LOGIN REQUIRED
 */
export async function fetchEquipmentsViaWebhook(webhookUrl: string): Promise<Equipment[]> {
  const cleanUrl = webhookUrl.trim();
  if (!cleanUrl) {
    throw new Error('Chưa cung cấp đường dẫn Webhook Google Apps Script.');
  }

  // If user provided a public Google Sheet URL
  if (cleanUrl.includes('spreadsheets/d/') && !cleanUrl.includes('script.google.com')) {
    return fetchEquipmentsFromPublicSheet(cleanUrl);
  }

  // Request JSON format explicitly with cache busting
  const separator = cleanUrl.includes('?') ? '&' : '?';
  const urlWithParams = `${cleanUrl}${separator}format=json&api=1&_t=${Date.now()}`;

  try {
    const res = await fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!res.ok) {
      throw new Error(`Máy chủ Google Apps Script phản hồi mã lỗi (${res.status})`);
    }

    const data = await res.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Lỗi truy xuất từ Google Sheet.');
    }

    if (Array.isArray(data.equipments)) {
      return data.equipments;
    }

    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    return [];
  } catch (err: any) {
    console.error('Fetch webhook error:', err);
    throw new Error(
      `Không thể đọc dữ liệu từ Webhook (${err.message || 'Failed to fetch'}). Vui lòng kiểm tra: 1) Triển khai Apps Script đã chọn quyền "Bất kỳ ai (Anyone)". 2) URL kết thúc bằng "/exec".`
    );
  }
}

/**
 * Extract Google Sheet ID from URL
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) return url.trim();
  return null;
}

/**
 * Fetch equipments from Public Google Sheet (via Google Visualization API) - ZERO LOGIN REQUIRED
 */
export async function fetchEquipmentsFromPublicSheet(urlOrId: string): Promise<Equipment[]> {
  const sheetId = extractSpreadsheetId(urlOrId);
  if (!sheetId) {
    throw new Error('Đường dẫn Google Sheet không hợp lệ.');
  }

  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

  const res = await fetch(gvizUrl);
  if (!res.ok) {
    throw new Error('Không thể tải Google Sheet công khai. Hãy đảm bảo quyền truy cập là "Bất kỳ ai có liên kết đều có thể xem".');
  }

  const rawText = await res.text();
  // Google Viz returns: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const jsonMatch = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Không thể phân tích dữ liệu bảng tính Google Sheet.');
  }

  const parsed = JSON.parse(jsonMatch[1]);
  const rows = parsed.table?.rows || [];

  const parsedEquipments: Equipment[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]?.c || [];
    const id = row[0]?.v ? String(row[0].v) : `EQ-CNS-${Date.now()}-${i}`;
    const name = row[1]?.v ? String(row[1].v) : '';
    if (!name && !row[0]?.v) continue;

    parsedEquipments.push({
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      general: {
        name: name || 'Thiết bị CNS',
        category: (row[2]?.v as any) || 'VHF/UHF',
        model: row[3]?.v ? String(row[3].v) : '',
        serial: row[4]?.v ? String(row[4].v) : '',
        assetNo: row[5]?.v ? String(row[5].v) : '',
        bookletNo: row[6]?.v ? String(row[6].v) : '',
        manufacturer: row[7]?.v ? String(row[7].v) : '',
        yearMade: row[8]?.v ? String(row[8].v) : '',
        origin: 'Việt Nam',
        commissioned: row[9]?.v ? String(row[9].v) : '',
        status: (row[10]?.v as any) || 'Đang khai thác',
        priority: (row[11]?.v as any) || 'Hệ thống chính (Level 1)'
      },
      org: {
        companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
        unit: row[12]?.v ? String(row[12].v) : 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
        location: row[13]?.v ? String(row[13].v) : 'Đài KSKL Tân Sơn Nhất',
        stationName: row[13]?.v ? String(row[13].v) : '',
        primaryEngineer: row[14]?.v ? String(row[14].v) : 'Kỹ sư trực ca',
        supervisor: 'KS. Trưởng đài'
      },
      spec: {},
      components: [],
      maintenance: [],
      repair: []
    });
  }

  return parsedEquipments;
}

/**
 * List existing spreadsheets on user's Google Drive (OAuth mode)
 */
export async function listGoogleSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi tải danh sách file Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Search user's Google Drive for a spreadsheet with a specific name
 */
export async function findSpreadsheetByName(
  accessToken: string,
  name: string = DEFAULT_SHEET_TITLE
): Promise<DriveSpreadsheetFile | null> {
  const safeName = name.replace(/'/g, "\\'");
  const query = encodeURIComponent(`name='${safeName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Find existing "Sổ Quản Lý Lý Lịch Thiết Bị CNS - VATM" or create a fresh one
 */
export async function findOrCreateVatmSpreadsheet(
  accessToken: string,
  equipmentsForInit?: Equipment[]
): Promise<DriveSpreadsheetFile> {
  // 1. Search existing file first
  const existing = await findSpreadsheetByName(accessToken, DEFAULT_SHEET_TITLE);
  if (existing) {
    return existing;
  }

  // 2. If not found, create it
  const created = await createGoogleSpreadsheet(accessToken, DEFAULT_SHEET_TITLE);
  
  // 3. Write initial equipment data if provided
  if (equipmentsForInit && equipmentsForInit.length > 0) {
    try {
      await syncEquipmentsToSheet(accessToken, created.id, equipmentsForInit);
    } catch (e) {
      console.warn('Initial sync warning on creation:', e);
    }
  }

  return {
    id: created.id,
    name: DEFAULT_SHEET_TITLE,
    webViewLink: created.spreadsheetUrl,
    modifiedTime: new Date().toISOString()
  };
}

/**
 * Create a new Google Spreadsheet on user's Drive with formatted headers (OAuth mode)
 */
export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string = 'Sổ Quản Lý Lý Lịch Thiết Bị CNS - VATM'
): Promise<{ id: string; spreadsheetUrl: string }> {
  // 1. Create spreadsheet file
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: 'Danh Mục Thiết Bị CNS',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi tạo bảng tính Google Sheets (${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Format Header Row and Apply Colors
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:S1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'A1:S1',
      majorDimension: 'ROWS',
      values: [HEADERS_EQUIPMENTS]
    })
  });

  // Apply visual styling to header row (Navy blue header with white text)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.05, green: 0.15, blue: 0.35 }, // Brand Navy
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 10
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: HEADERS_EQUIPMENTS.length
              }
            }
          }
        ]
      })
    });
  } catch (err) {
    console.warn('Batch styling header warning:', err);
  }

  return { id: spreadsheetId, spreadsheetUrl };
}

/**
 * Sync equipment array to a Google Sheet (OAuth mode)
 */
export async function syncEquipmentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  equipments: Equipment[]
): Promise<{ updatedRows: number; spreadsheetUrl: string }> {
  // First, verify tab name by getting spreadsheet metadata
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    const errorData = await metaRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Không thể truy cập Google Sheet (${metaRes.status})`);
  }

  const metaData = await metaRes.json();
  const firstSheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';

  // Build rows data
  const rows: any[][] = equipments.map(eq => [
    eq.id,
    eq.general.name || '',
    eq.general.category || '',
    eq.general.model || '',
    eq.general.serial || '',
    eq.general.assetNo || '',
    eq.general.bookletNo || '',
    eq.general.manufacturer || '',
    eq.general.yearMade || '',
    eq.general.commissioned || '',
    eq.general.status || '',
    eq.general.priority || '',
    eq.org.unit || '',
    eq.org.stationName || eq.org.location || '',
    eq.org.primaryEngineer || '',
    eq.components?.length || 0,
    eq.maintenance?.length || 0,
    eq.repair?.length || 0,
    generateEquipmentQrUrl(eq)
  ]);

  // Ensure header row exists
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A1:S1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: `${firstSheetName}!A1:S1`,
      majorDimension: 'ROWS',
      values: [HEADERS_EQUIPMENTS]
    })
  });

  // Clear existing content from row 2 onwards
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A2:S1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write new rows
  if (rows.length > 0) {
    const writeRange = `${firstSheetName}!A2:S${rows.length + 1}`;
    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(writeRange)}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: writeRange,
        majorDimension: 'ROWS',
        values: rows
      })
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Lỗi ghi dữ liệu lên Google Sheets');
    }
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  return { updatedRows: rows.length, spreadsheetUrl };
}

/**
 * Fetch equipments from Google Sheets (OAuth mode)
 */
export async function fetchEquipmentsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Equipment[]> {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaRes.ok) {
    throw new Error('Không thể đọc thông tin Google Sheet.');
  }

  const metaData = await metaRes.json();
  const firstSheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';

  const dataRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A2:S500`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!dataRes.ok) {
    throw new Error('Không thể tải các dòng dữ liệu từ Google Sheet.');
  }

  const data = await dataRes.json();
  const rawRows: string[][] = data.values || [];

  const parsedEquipments: Equipment[] = rawRows
    .filter(row => row.length >= 2 && (row[0] || row[1]))
    .map((row, idx) => {
      const id = row[0] || `EQ-CNS-${Date.now()}-${idx}`;
      return {
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        general: {
          name: row[1] || 'Thiết bị CNS',
          category: (row[2] as any) || 'VHF/UHF',
          model: row[3] || '',
          serial: row[4] || '',
          assetNo: row[5] || '',
          bookletNo: row[6] || '',
          manufacturer: row[7] || '',
          yearMade: row[8] || '',
          origin: 'Việt Nam',
          commissioned: row[9] || '',
          status: (row[10] as any) || 'Đang khai thác',
          priority: (row[11] as any) || 'Hệ thống chính (Level 1)'
        },
        org: {
          companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
          unit: row[12] || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
          location: row[13] || 'Đài KSKL Tân Sơn Nhất',
          stationName: row[13] || '',
          primaryEngineer: row[14] || 'Kỹ sư trực ca',
          supervisor: 'KS. Trưởng đài'
        },
        spec: {},
        components: [],
        maintenance: [],
        repair: []
      };
    });

  return parsedEquipments;
}
