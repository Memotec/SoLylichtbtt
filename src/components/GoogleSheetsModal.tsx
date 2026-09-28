import { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  Code, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Plus,
  LogIn,
  LogOut,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  Zap,
  ArrowDownToLine,
  ArrowUpFromLine,
  Radio,
  Clock,
  HelpCircle,
  Link2,
  CheckCheck,
  Globe,
  FileCode,
  Eye,
  Layers,
  Terminal,
  Share2,
  History,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { Equipment } from '../types';
import { User } from 'firebase/auth';
import { googleSignIn, logoutGoogle, getAccessToken } from '../services/googleAuth';
import { 
  getBackupHistory, 
  createBackupSnapshot, 
  deleteBackupSnapshot, 
  clearAllBackups, 
  exportBackupAsJson, 
  BackupSnapshot 
} from '../services/backupService';
import { 
  listGoogleSpreadsheets, 
  createGoogleSpreadsheet, 
  syncEquipmentsToSheet, 
  fetchEquipmentsFromSheet,
  findOrCreateVatmSpreadsheet,
  syncEquipmentsViaWebhook,
  fetchEquipmentsViaWebhook,
  fetchEquipmentsFromPublicSheet,
  generateAppsScriptCode,
  generateAppsScriptHtml,
  generateAppsScriptCodeGs,
  DEFAULT_SHEET_TITLE,
  DriveSpreadsheetFile,
  GoogleSheetsSyncConfig,
  saveSyncConfig
} from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  onExportCsv: () => void;
  onImportEquipments?: (equipments: Equipment[]) => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  syncConfig: GoogleSheetsSyncConfig;
  onUpdateSyncConfig: (config: GoogleSheetsSyncConfig) => void;
  onForceSyncNow: () => Promise<void>;
  isAutoSyncing?: boolean;
}

export function GoogleSheetsModal({
  isOpen,
  onClose,
  equipments,
  onExportCsv,
  onImportEquipments,
  currentUser,
  onUserChange,
  syncConfig,
  onUpdateSyncConfig,
  onForceSyncNow,
  isAutoSyncing = false
}: GoogleSheetsModalProps) {
  const [activeTab, setActiveTab] = useState<'htmlWebApp' | 'webhook' | 'backupHistory' | 'oauth' | 'export'>('htmlWebApp');
  const [htmlSubTab, setHtmlSubTab] = useState<'indexHtml' | 'codeGs'>('indexHtml');
  const [webhookInputUrl, setWebhookInputUrl] = useState(syncConfig.webhookUrl || '');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheetFile[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>(syncConfig.spreadsheetId || '');
  const [currentSheetUrl, setCurrentSheetUrl] = useState<string>(syncConfig.spreadsheetUrl || '');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Backup History States
  const [backups, setBackups] = useState<BackupSnapshot[]>(() => getBackupHistory());
  const [restoreConfirmBackup, setRestoreConfirmBackup] = useState<BackupSnapshot | null>(null);
  const [previewBackup, setPreviewBackup] = useState<BackupSnapshot | null>(null);

  useEffect(() => {
    setBackups(getBackupHistory());
  }, [isOpen]);

  // Create Manual Backup
  const handleCreateManualBackup = () => {
    const snap = createBackupSnapshot(equipments, 'Tạo thủ công từ cấu hình', 'manual');
    setBackups(getBackupHistory());
    setStatusMessage({
      text: `Đã tạo thành công bản sao lưu lúc ${snap.dateFormatted} (${snap.equipmentsCount} thiết bị)!`,
      type: 'success'
    });
  };

  // Confirm Restore Snapshot
  const handleConfirmRestoreSnapshot = () => {
    if (!restoreConfirmBackup) return;
    if (onImportEquipments) {
      // 1. Save safety snapshot before restoring
      createBackupSnapshot(
        equipments, 
        `Tự động lưu trước khi khôi phục về ngày ${restoreConfirmBackup.dateFormatted}`, 
        'pre_restore'
      );

      // 2. Perform restore
      onImportEquipments(restoreConfirmBackup.equipments);
      setBackups(getBackupHistory());
      setStatusMessage({
        text: `Đã khôi phục thành công ${restoreConfirmBackup.equipmentsCount} thiết bị từ phiên bản ngày ${restoreConfirmBackup.dateFormatted}!`,
        type: 'success'
      });
    }
    setRestoreConfirmBackup(null);
  };

  // Delete Snapshot
  const handleDeleteSnapshot = (id: string) => {
    deleteBackupSnapshot(id);
    setBackups(getBackupHistory());
    setStatusMessage({ text: 'Đã xóa bản sao lưu khỏi lịch sử.', type: 'info' });
  };

  useEffect(() => {
    setWebhookInputUrl(syncConfig.webhookUrl || '');
    setSelectedSheetId(syncConfig.spreadsheetId || '');
    setCurrentSheetUrl(syncConfig.spreadsheetUrl || '');
  }, [syncConfig]);

  // Load existing spreadsheets when signed in via OAuth
  const loadDriveSpreadsheets = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      setIsLoadingDrive(true);
      const files = await listGoogleSpreadsheets(token);
      setSpreadsheets(files);
      
      if (!syncConfig.spreadsheetId) {
        const vatmFile = files.find(f => f.name.includes(DEFAULT_SHEET_TITLE) || f.name.includes('Sổ Quản Lý Lý Lịch'));
        if (vatmFile) {
          setSelectedSheetId(vatmFile.id);
          setCurrentSheetUrl(vatmFile.webViewLink || `https://docs.google.com/spreadsheets/d/${vatmFile.id}`);
          const updated: GoogleSheetsSyncConfig = {
            ...syncConfig,
            spreadsheetId: vatmFile.id,
            spreadsheetName: vatmFile.name,
            spreadsheetUrl: vatmFile.webViewLink || `https://docs.google.com/spreadsheets/d/${vatmFile.id}`
          };
          onUpdateSyncConfig(updated);
          saveSyncConfig(updated);
        }
      }
    } catch (err: any) {
      console.warn('Drive list warning:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === 'oauth') {
      loadDriveSpreadsheets();
    }
  }, [currentUser, activeTab]);

  // Handle saving Webhook URL configuration
  const handleSaveWebhookConfig = (newUrl?: string) => {
    const urlToSave = (newUrl !== undefined ? newUrl : webhookInputUrl).trim();
    const updated: GoogleSheetsSyncConfig = {
      ...syncConfig,
      mode: 'webhook',
      webhookUrl: urlToSave,
      autoSyncEnabled: true
    };
    onUpdateSyncConfig(updated);
    saveSyncConfig(updated);
    setStatusMessage({
      text: urlToSave 
        ? 'Đã lưu cấu hình! Chế độ Tự động đồng bộ không cần đăng nhập đang HOẠT ĐỘNG.' 
        : 'Đã xóa đường dẫn Webhook.',
      type: 'success'
    });
  };

  // Push data to Google Sheet via Webhook (No login needed)
  const handlePushToWebhook = async () => {
    const url = webhookInputUrl.trim();
    if (!url) {
      setStatusMessage({ text: 'Vui lòng nhập URL Webhook Google Apps Script trước khi ghi.', type: 'error' });
      return;
    }
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await syncEquipmentsViaWebhook(url, equipments);
      const updated: GoogleSheetsSyncConfig = {
        ...syncConfig,
        mode: 'webhook',
        webhookUrl: url,
        spreadsheetUrl: res.spreadsheetUrl || syncConfig.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncError: undefined,
        lastSyncedCount: equipments.length
      };
      onUpdateSyncConfig(updated);
      saveSyncConfig(updated);
      setStatusMessage({
        text: `Đã tự động ghi thành công ${equipments.length} hồ sơ thiết bị lên Google Sheet!`,
        type: 'success'
      });
    } catch (err: any) {
      setStatusMessage({
        text: `Lỗi ghi dữ liệu lên Google Sheet: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull data from Google Sheet via Webhook or Public Link (No login needed)
  const handlePullFromWebhook = async () => {
    const url = webhookInputUrl.trim();
    if (!url) {
      setStatusMessage({ text: 'Vui lòng nhập URL Webhook hoặc URL Google Sheet.', type: 'error' });
      return;
    }
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      let imported: Equipment[] = [];
      if (url.includes('script.google.com')) {
        imported = await fetchEquipmentsViaWebhook(url);
      } else if (url.includes('spreadsheets/d/')) {
        imported = await fetchEquipmentsFromPublicSheet(url);
      } else {
        imported = await fetchEquipmentsViaWebhook(url);
      }

      if (imported.length === 0) {
        setStatusMessage({ text: 'Không tìm thấy dòng thiết bị nào trong Google Sheet.', type: 'error' });
      } else {
        if (onImportEquipments) {
          onImportEquipments(imported);
        }
        const updated: GoogleSheetsSyncConfig = {
          ...syncConfig,
          mode: 'webhook',
          webhookUrl: url,
          lastSyncedAt: new Date().toISOString(),
          lastSyncStatus: 'success',
          lastSyncError: undefined,
          lastSyncedCount: imported.length
        };
        onUpdateSyncConfig(updated);
        saveSyncConfig(updated);
        setStatusMessage({
          text: `Đã nạp và đồng bộ ${imported.length} thiết bị từ Google Sheet về hệ thống!`,
          type: 'success'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Lỗi đọc dữ liệu từ Google Sheet: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Test Webhook Connection
  const handleTestConnection = async () => {
    const url = webhookInputUrl.trim();
    if (!url) {
      setStatusMessage({ text: 'Vui lòng nhập URL Webhook để kiểm tra.', type: 'error' });
      return;
    }
    setTestingConnection(true);
    setStatusMessage(null);
    try {
      if (url.includes('script.google.com')) {
        const data = await fetchEquipmentsViaWebhook(url);
        setStatusMessage({
          text: `Kết nối thành công! Đã tìm thấy ${Array.isArray(data) ? data.length : 0} thiết bị trong Google Sheet.`,
          type: 'success'
        });
      } else if (url.includes('spreadsheets/d/')) {
        const data = await fetchEquipmentsFromPublicSheet(url);
        setStatusMessage({
          text: `Kết nối Google Sheet công khai thành công! Đọc được ${data.length} dòng.`,
          type: 'success'
        });
      } else {
        setStatusMessage({
          text: 'Đã gửi yêu cầu kiểm tra tới Webhook URL.',
          type: 'info'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Kiểm tra kết nối thất bại: ${err.message}`,
        type: 'error'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Copy Index.html
  const handleCopyHtml = () => {
    const code = generateAppsScriptHtml(equipments);
    navigator.clipboard.writeText(code);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 3000);
  };

  // Download Index.html
  const handleDownloadHtml = () => {
    const code = generateAppsScriptHtml(equipments);
    const blob = new Blob([code], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Code.gs
  const handleCopyGs = () => {
    const code = generateAppsScriptCodeGs();
    navigator.clipboard.writeText(code);
    setCopiedGs(true);
    setTimeout(() => setCopiedGs(false), 3000);
  };

  // Download Code.gs
  const handleDownloadGs = () => {
    const code = generateAppsScriptCodeGs();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Code.gs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Google OAuth Sign In
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onUserChange(result.user);
        setStatusMessage({
          text: `Đăng nhập thành công với tài khoản ${result.user.email}!`,
          type: 'success'
        });
        loadDriveSpreadsheets();
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Đăng nhập không thành công: ${err.message || 'Lỗi kết nối Google'}`,
        type: 'error'
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutGoogle();
    onUserChange(null);
    setSpreadsheets([]);
    setStatusMessage({
      text: 'Đã đăng xuất khỏi tài khoản Google.',
      type: 'info'
    });
  };

  // Toggle Auto Sync Switch
  const handleToggleAutoSync = () => {
    const nextState = !syncConfig.autoSyncEnabled;
    const updated: GoogleSheetsSyncConfig = {
      ...syncConfig,
      autoSyncEnabled: nextState
    };
    onUpdateSyncConfig(updated);
    saveSyncConfig(updated);
    setStatusMessage({
      text: nextState 
        ? 'Đã BẬT tính năng Tự động đồng bộ. Mọi thay đổi dữ liệu thiết bị sẽ tự ghi lên Google Sheet!'
        : 'Đã TẮT tính năng tự động đồng bộ.',
      type: 'info'
    });
  };

  if (!isOpen) return null;

  const htmlContent = generateAppsScriptHtml(equipments);
  const codeGsContent = generateAppsScriptCodeGs();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Globe className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Xuất Bản Web App Trên Google Apps Script</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-400/30 font-mono">
                  Index.html + Code.gs
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Trang web HTML độc lập chạy trực tiếp trên máy chủ Google Apps Script, quản lý 4 đài trạm CNS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-slate-50 px-4 border-b border-slate-200 flex items-center gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('htmlWebApp')}
            className={`py-3 px-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'htmlWebApp'
                ? 'border-blue-600 text-blue-700 bg-white/50 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Trang HTML Web App (Google Apps Script)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Mới
            </span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-3 px-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-700 bg-white/50 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Đồng Bộ Webhook (Không cần login)</span>
          </button>

          <button
            onClick={() => setActiveTab('backupHistory')}
            className={`py-3 px-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backupHistory'
                ? 'border-purple-600 text-purple-700 bg-white/50 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Lịch Sử Sao Lưu & Khôi Phục</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {backups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('oauth')}
            className={`py-3 px-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'oauth'
                ? 'border-amber-600 text-amber-700 bg-white/50 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Đăng Nhập Google Drive (OAuth)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-slate-800 text-slate-900 bg-white/50 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất File CSV / Excel</span>
          </button>
        </div>

        {/* STATUS BANNER */}
        {statusMessage && (
          <div className={`p-3 text-xs font-medium flex items-center gap-2 border-b shrink-0 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: HTML WEB APP (GOOGLE APPS SCRIPT PUBLISHING) */}
          {activeTab === 'htmlWebApp' && (
            <div className="space-y-6">
              
              {/* Highlight Hero Card */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono border border-cyan-400/30">
                        HTML SERVICE + GOOGLE APPS SCRIPT
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">Tích hợp sẵn 4 đài trạm</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                      Trang Web Độc Lập Chạy Trực Tiếp Trên Google Apps Script (script.google.com)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Mã nguồn HTML nguyên khối chuẩn responsive, giao diện chuẩn hàng không VATM, hỗ trợ tra cứu theo 4 đài trạm (<strong>AACC HCM</strong>, <strong>ATCC HCM</strong>, <strong>BQ old</strong>, <strong>BQ New</strong>), in biểu mẫu Sổ lý lịch khổ A4 và đọc/ghi tức thì vào Google Sheet qua <code className="font-mono text-cyan-300 bg-white/10 px-1 py-0.5 rounded">google.script.run</code>.
                    </p>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={handleCopyHtml}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      {copiedHtml ? <CheckCheck className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedHtml ? 'Đã sao chép Index.html!' : 'Sao chép Index.html'}</span>
                    </button>
                    <button
                      onClick={handleDownloadHtml}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải Index.html</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-tabs: Index.html vs Code.gs */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <button
                      onClick={() => setHtmlSubTab('indexHtml')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        htmlSubTab === 'indexHtml'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>1. File: Index.html (Giao diện người dùng)</span>
                    </button>

                    <button
                      onClick={() => setHtmlSubTab('codeGs')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        htmlSubTab === 'codeGs'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>2. File: Code.gs (Mã máy chủ)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {htmlSubTab === 'indexHtml' ? (
                      <>
                        <button
                          onClick={handleCopyHtml}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedHtml ? 'Đã sao chép' : 'Sao chép'}</span>
                        </button>
                        <button
                          onClick={handleDownloadHtml}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Tải về</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleCopyGs}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedGs ? 'Đã sao chép' : 'Sao chép'}</span>
                        </button>
                        <button
                          onClick={handleDownloadGs}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Tải về</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Code Display Area */}
                <div className="relative">
                  <pre className="bg-slate-950 text-slate-200 p-4 text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed select-all">
                    {htmlSubTab === 'indexHtml' ? htmlContent : codeGsContent}
                  </pre>
                </div>
              </div>

              {/* 3-Step Publishing Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Hướng dẫn xuất bản trang web trên Google Apps Script trong 1 phút:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                    <h6 className="font-bold text-slate-800">Tạo File Code.gs</h6>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Trên Google Sheets, chọn <strong>Tiện ích mở rộng &gt; Apps Script</strong>. Dán toàn bộ mã ở tab <strong>Code.gs</strong> vào.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                    <h6 className="font-bold text-slate-800">Tạo File Index.html</h6>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Bấm dấu <strong>+ (Thêm tệp) &gt; HTML</strong>, đặt tên là <code className="font-mono font-bold text-blue-700 bg-blue-50 px-1">Index</code>. Dán toàn bộ mã <strong>Index.html</strong> vào.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                    <h6 className="font-bold text-slate-800">Triển khai Web App</h6>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Nhấn <strong>Triển khai (Deploy) &gt; Triển khai mới</strong>. Chọn loại <strong>Ứng dụng web</strong>, quyền truy cập <strong>Bất kỳ ai (Anyone)</strong> và nhấn <strong>Triển khai</strong>!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ZERO-LOGIN WEBHOOK SYNC */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              
              {/* Highlight Banner */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Đồng Bộ 2 Chiều Không Cần Đăng Nhập Tài Khoản Google
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Trực tiếp qua Webhook Apps Script
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Sử dụng Google Apps Script Web App để đọc và ghi tự động dữ liệu thiết bị, linh kiện, bảo dưỡng và sự cố trực tiếp vào bảng tính Google Sheets của bạn mà <strong>không cần người dùng phải đăng nhập Google OAuth</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* URL Input Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-emerald-600" />
                      Đường Dẫn Webhook Google Apps Script (Web App URL):
                    </span>
                    <button
                      onClick={() => setActiveTab('htmlWebApp')}
                      className="text-blue-600 hover:text-blue-800 underline text-xs font-medium cursor-pointer"
                    >
                      Chưa có? Nhấn để lấy mã Apps Script
                    </button>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec hoặc link Google Sheet"
                      value={webhookInputUrl}
                      onChange={(e) => setWebhookInputUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                    <button
                      onClick={() => handleSaveWebhookConfig()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Lưu cấu hình
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Ví dụ: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">https://script.google.com/macros/s/.../exec</code>
                  </p>
                </div>

                {/* Switch Auto-Sync */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleToggleAutoSync}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        syncConfig.autoSyncEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          syncConfig.autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Tự động đồng bộ tức thì khi có thay đổi dữ liệu</span>
                        {syncConfig.autoSyncEnabled && (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
                            ĐANG BẬT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Khi thêm, sửa hoặc xóa hồ sơ thiết bị, hệ thống tự động ghi đè lên Google Sheet mà không cần bấm thủ công.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handlePushToWebhook}
                  disabled={isSyncing || isAutoSyncing || !webhookInputUrl}
                  className="p-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition cursor-pointer shadow-md flex flex-col items-center text-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
                    <ArrowUpFromLine className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : ''}`} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Ghi Dữ Liệu Lên Sheet (Push)</span>
                    <span className="text-[11px] text-emerald-100 block mt-0.5">
                      Đẩy {equipments.length} thiết bị & nhật ký lên Sheet
                    </span>
                  </div>
                </button>

                <button
                  onClick={handlePullFromWebhook}
                  disabled={isSyncing || isAutoSyncing || !webhookInputUrl}
                  className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition cursor-pointer shadow-md flex flex-col items-center text-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
                    <ArrowDownToLine className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : ''}`} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Đọc Dữ Liệu Từ Sheet (Pull)</span>
                    <span className="text-[11px] text-blue-100 block mt-0.5">
                      Nạp dữ liệu mới nhất từ Google Sheet về
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !webhookInputUrl}
                  className="p-4 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition cursor-pointer shadow-md flex flex-col items-center text-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
                    <Radio className={`w-5 h-5 ${testingConnection ? 'animate-pulse text-emerald-400' : ''}`} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Kiểm Tra Kết Nối</span>
                    <span className="text-[11px] text-slate-300 block mt-0.5">
                      {testingConnection ? 'Đang kiểm tra...' : 'Xác thực Webhook Google Sheet'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Status & Telemetry Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Trạng Thái Đồng Bộ Hệ Thống:</span>
                  <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Sẵn sàng (Zero Auth)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Số thiết bị hiện tại:</span>
                    <span className="font-bold text-slate-800">{equipments.length} thiết bị</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Lần đồng bộ gần nhất:</span>
                    <span className="font-bold text-slate-800">
                      {syncConfig.lastSyncedAt 
                        ? new Date(syncConfig.lastSyncedAt).toLocaleTimeString('vi-VN') + ' ' + new Date(syncConfig.lastSyncedAt).toLocaleDateString('vi-VN')
                        : 'Chưa đồng bộ'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Chế độ đồng bộ:</span>
                    <span className="font-bold text-emerald-700">Tự động khi có thay đổi</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Quyền tài khoản:</span>
                    <span className="font-bold text-slate-800">Không cần đăng nhập</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: OAUTH GOOGLE DRIVE */}
          {activeTab === 'oauth' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Đăng Nhập Tài Khoản Google (OAuth 2.0)</h4>
                    <p className="text-xs text-slate-500">
                      {currentUser 
                        ? `Đang kết nối: ${currentUser.email}`
                        : 'Đăng nhập để tự động tạo file và quản lý tệp trên Google Drive cá nhân'}
                    </p>
                  </div>
                </div>

                <div>
                  {currentUser ? (
                    <button
                      onClick={handleLogout}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất Google</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                    >
                      <LogIn className="w-4 h-4 text-emerald-400" />
                      <span>{isSigningIn ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
                    </button>
                  )}
                </div>
              </div>

              {currentUser && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Danh sách tệp trên Google Drive:</span>
                    <button
                      onClick={loadDriveSpreadsheets}
                      disabled={isLoadingDrive}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>

                  {spreadsheets.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                      Chưa tìm thấy tệp Google Sheet nào trong Drive của bạn.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {spreadsheets.map((file) => (
                        <div
                          key={file.id}
                          className={`p-3 border rounded-xl flex items-center justify-between transition ${
                            selectedSheetId === file.id
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <div>
                              <div className="font-semibold text-xs text-slate-900">{file.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {file.id}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedSheetId(file.id);
                              setCurrentSheetUrl(file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`);
                              const updated: GoogleSheetsSyncConfig = {
                                ...syncConfig,
                                mode: 'oauth',
                                spreadsheetId: file.id,
                                spreadsheetName: file.name,
                                spreadsheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`
                              };
                              onUpdateSyncConfig(updated);
                              saveSyncConfig(updated);
                              setStatusMessage({ text: `Đã chọn tệp "${file.name}"`, type: 'info' });
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            Chọn tệp này
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPORT CSV & BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Xuất Tệp Dữ Liệu CSV / Excel</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Tải về tệp CSV mã hóa UTF-8 với đầy đủ {equipments.length} hồ sơ thiết bị, tương thích hoàn toàn với Microsoft Excel và Google Sheets.
                  </p>
                </div>
                <button
                  onClick={onExportCsv}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Về File CSV ({equipments.length} thiết bị)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: LỊCH SỬ SAO LƯU & KHÔI PHỤC */}
          {activeTab === 'backupHistory' && (
            <div className="space-y-4">
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600" />
                    <span>Lịch Sử Sao Lưu & Khôi Phục Phiên Bản Dữ Liệu</span>
                  </h4>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    Mỗi khi đồng bộ hoặc thao tác, hệ thống tự động lưu lại một snapshot dữ liệu. Bạn có thể chọn bất kỳ phiên bản nào trong quá khứ để khôi phục.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCreateManualBackup}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Bản Sao Lưu Hiện Tại</span>
                  </button>
                  {backups.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử sao lưu?')) {
                          clearAllBackups();
                          setBackups([]);
                          setStatusMessage({ text: 'Đã xóa sạch lịch sử sao lưu.', type: 'info' });
                        }
                      }}
                      className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Xóa tất cả bản sao lưu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* LIST OF BACKUPS */}
              {backups.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 text-xs">Chưa có bản sao lưu nào trong lịch sử.</p>
                  <p className="text-[11px] text-slate-500">
                    Bấm nút <strong>"Tạo Bản Sao Lưu Hiện Tại"</strong> ở trên để tạo snapshot đầu tiên.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {backups.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            {item.dateFormatted}
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {item.equipmentsCount} thiết bị
                          </span>

                          {item.source === 'auto_sync' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Tự động đồng bộ
                            </span>
                          )}
                          {item.source === 'manual' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              Tạo thủ công
                            </span>
                          )}
                          {item.source === 'pre_restore' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Tự lưu trước khôi phục
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 font-medium">
                          {item.note || 'Bản ghi snapshot'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => setPreviewBackup(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Xem danh sách thiết bị trong bản lưu này"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Xem</span>
                        </button>

                        <button
                          onClick={() => exportBackupAsJson(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Tải về file JSON"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>JSON</span>
                        </button>

                        <button
                          onClick={() => setRestoreConfirmBackup(item)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Khôi phục hệ thống về phiên bản này"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSnapshot(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Xóa bản lưu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Hệ Thống Sổ Lý Lịch Điện Tử CNS - VATM (4 Đài Trạm)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>

      {/* MODAL: CONFIRM RESTORE BACKUP SNAPSHOT */}
      {restoreConfirmBackup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-purple-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                Xác Nhận Khôi Phục Dữ Liệu
              </h4>
              <button
                onClick={() => setRestoreConfirmBackup(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-1">
                <p><strong>Ngày sao lưu:</strong> {restoreConfirmBackup.dateFormatted}</p>
                <p><strong>Số lượng thiết bị:</strong> {restoreConfirmBackup.equipmentsCount} thiết bị</p>
                <p><strong>Ghi chú:</strong> {restoreConfirmBackup.note}</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                <p className="font-bold mb-0.5">⚠️ Lưu ý an toàn:</p>
                Hệ thống sẽ ghi đè danh mục hiện tại bằng phiên bản này. Đồng thời, một bản sao lưu an toàn tự động cho dữ liệu hiện tại sẽ được tạo ngay trước khi khôi phục.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setRestoreConfirmBackup(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRestoreSnapshot}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xác Nhận Khôi Phục Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW BACKUP SNAPSHOT */}
      {previewBackup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Xem Bản Lưu Ngày {previewBackup.dateFormatted}
                </h4>
                <p className="text-[11px] text-slate-500">Tổng số {previewBackup.equipmentsCount} thiết bị CNS</p>
              </div>
              <button
                onClick={() => setPreviewBackup(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1 text-xs">
              {previewBackup.equipments.map((eq, idx) => (
                <div key={eq.id || idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{idx + 1}. {eq.general.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {eq.org.stationName || 'AACC HCM'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-3">
                    <span>S/N: {eq.general.serial || 'N/A'}</span>
                    <span>Model: {eq.general.model || 'N/A'}</span>
                    <span>Loại: {eq.general.category}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t shrink-0">
              <button
                onClick={() => setPreviewBackup(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
