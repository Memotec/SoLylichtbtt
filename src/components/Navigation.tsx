import { 
  Printer, 
  Download, 
  Upload, 
  QrCode, 
  FileSpreadsheet,
  Radio,
  RefreshCw,
  Search,
  Activity,
  Calendar,
  MapPin,
  FileText,
  Clock
} from 'lucide-react';
import { useRef, ChangeEvent, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { GoogleSheetsSyncConfig, DEFAULT_SHEET_TITLE } from '../services/googleSheets';

interface NavigationProps {
  currentView: 'dossier' | 'analytics' | 'planner' | 'stations' | 'report';
  onChangeView: (view: 'dossier' | 'analytics' | 'planner' | 'stations' | 'report') => void;
  onOpenPrint: () => void;
  onOpenQrScanner: () => void;
  onOpenGoogleSheets: () => void;
  onOpenCommandPalette: () => void;
  onExportJson: () => void;
  onImportJson: (data: any) => void;
  totalEquipments: number;
  currentUser: User | null;
  syncConfig?: GoogleSheetsSyncConfig;
  isAutoSyncing?: boolean;
}

export function Navigation({
  currentView,
  onChangeView,
  onOpenPrint,
  onOpenQrScanner,
  onOpenGoogleSheets,
  onOpenCommandPalette,
  onExportJson,
  onImportJson,
  totalEquipments,
  currentUser,
  syncConfig,
  isAutoSyncing = false
}: NavigationProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Real-time aviation clocks (UTC Zulu & Local VN Time)
  const [time, setTime] = useState<{ vn: string; utc: string }>({
    vn: '--:--:--',
    utc: '--:--:--Z'
  });

  useEffect(() => {
    const update = () => {
      try {
        const now = new Date();
        
        // Purely mathematical UTC extraction to guarantee 100% reliability
        const utcHours = String(now.getUTCHours()).padStart(2, '0');
        const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
        const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
        
        // Purely mathematical VN (UTC+7) calculation independent of system/browser locale
        const utcTimeMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        const vnTime = new Date(utcTimeMs + (3600000 * 7));
        const vnHours = String(vnTime.getHours()).padStart(2, '0');
        const vnMins = String(vnTime.getMinutes()).padStart(2, '0');
        const vnSecs = String(vnTime.getSeconds()).padStart(2, '0');

        setTime({
          vn: `${vnHours}:${vnMins}:${vnSecs}`,
          utc: `${utcHours}:${utcMins}:${utcSecs}Z`
        });
      } catch (err) {
        console.error('Error updating real-time aviation clock:', err);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportJson(json);
      } catch (err) {
        alert('Tệp sao lưu không hợp lệ hoặc bị lỗi định dạng JSON!');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      
      {/* Top Operations Telemetry Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 sm:px-8 py-1 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            HỆ THỐNG TRỰC KỸ THUẬT CNS
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            CÔNG TY QUẢN LÝ BAY MIỀN NAM (VATM)
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <span className="text-sky-400 font-bold hidden md:inline">
            UTC: {time.utc}
          </span>
          <span className="text-slate-200 font-medium">
            VN: {time.vn}
          </span>
          {currentUser && (
            <span className="text-emerald-400 font-medium hidden lg:inline">
              ● {currentUser.email}
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Radio className="w-4 h-4 text-cyan-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                SỔ LÝ LỊCH THIẾT BỊ CNS
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                VATM · Quản lý bay miền Nam
              </span>
            </div>
          </div>

          {/* Core Navigation Views */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onChangeView('dossier')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'dossier'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Hồ Sơ Kỹ Thuật ({totalEquipments})</span>
            </button>

            <button
              onClick={() => onChangeView('analytics')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'analytics'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Độ Tin Cậy & MTBF</span>
            </button>

            <button
              onClick={() => onChangeView('planner')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'planner'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch Bảo Dưỡng</span>
            </button>

            <button
              onClick={() => onChangeView('stations')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'stations'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Đài Trạm</span>
            </button>

            <button
              onClick={() => onChangeView('report')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'report'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Báo Cáo Tổng Hợp</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            {/* Quick Command Palette Button */}
            <button
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Tìm kiếm nhanh toàn hệ thống (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Tìm nhanh...</span>
              <kbd className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Google Sheets Trigger */}
            <button
              onClick={onOpenGoogleSheets}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                isAutoSyncing
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 animate-pulse'
                  : syncConfig?.webhookUrl
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : currentUser
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={
                syncConfig?.webhookUrl
                  ? `Đồng bộ Google Sheets tự động (Không cần đăng nhập)`
                  : `Đồng bộ Google Sheets: ${syncConfig?.spreadsheetName || DEFAULT_SHEET_TITLE}`
              }
            >
              {isAutoSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
              ) : (
                <FileSpreadsheet className={`w-3.5 h-3.5 ${syncConfig?.webhookUrl || currentUser ? 'text-emerald-600' : 'text-slate-600'}`} />
              )}
              <span className="hidden md:inline">
                {isAutoSyncing 
                  ? 'Đang đồng bộ...'
                  : syncConfig?.webhookUrl && syncConfig?.autoSyncEnabled
                  ? 'Sheets (Tự động)'
                  : syncConfig?.webhookUrl
                  ? 'Sheets (Webhook)'
                  : currentUser && syncConfig?.autoSyncEnabled
                  ? 'Sheets (Tự động)'
                  : currentUser
                  ? 'Sheets (Đã nối)'
                  : 'Google Sheets'}
              </span>
            </button>

            {/* QR Scanner Trigger */}
            <button
              onClick={onOpenQrScanner}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Quét mã QR để mở Sổ PDF"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Quét QR</span>
            </button>

            {/* Print Official Booklet Trigger */}
            <button
              id="btn-nav-print"
              onClick={onOpenPrint}
              title="Xem và in biểu mẫu Sổ lý lịch 8 trang chuẩn khổ A4"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>In Sổ A4</span>
            </button>
          </div>

        </div>

        {/* Mobile View Selector Pills */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-1 text-xs scrollbar-none">
          <button
            onClick={() => onChangeView('dossier')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1.5 transition shrink-0 ${
              currentView === 'dossier' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Hồ Sơ ({totalEquipments})</span>
          </button>
          <button
            onClick={() => onChangeView('analytics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1.5 transition shrink-0 ${
              currentView === 'analytics' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Độ Tin Cậy</span>
          </button>
          <button
            onClick={() => onChangeView('planner')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1.5 transition shrink-0 ${
              currentView === 'planner' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch Bảo Dưỡng</span>
          </button>
          <button
            onClick={() => onChangeView('stations')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1.5 transition shrink-0 ${
              currentView === 'stations' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Đài Trạm</span>
          </button>
          <button
            onClick={() => onChangeView('report')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1.5 transition shrink-0 ${
              currentView === 'report' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Báo Cáo Tổng Hợp</span>
          </button>
        </div>

      </div>
    </header>
  );
}
