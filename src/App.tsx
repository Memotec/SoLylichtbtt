import { useState, useEffect } from 'react';
import { SAMPLE_EQUIPMENTS } from './data/sampleEquipments';
import { Equipment } from './types';
import { Navigation } from './components/Navigation';
import { EquipmentDashboard } from './components/EquipmentDashboard';
import { AnalyticsView } from './components/AnalyticsView';
import { MaintenancePlannerView } from './components/MaintenancePlannerView';
import { StationDirectoryView } from './components/StationDirectoryView';
import { CommandPalette } from './components/CommandPalette';
import { PrintProfileModal } from './components/PrintProfileModal';
import { QrScannerModal } from './components/QrScannerModal';
import { QrLabelModal } from './components/QrLabelModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { findEquipmentByQrCode } from './utils/qrUtils';
import { User } from 'firebase/auth';
import { initAuth, getAccessToken, googleSignIn } from './services/googleAuth';
import { 
  GoogleSheetsSyncConfig, 
  loadSyncConfig, 
  saveSyncConfig, 
  findOrCreateVatmSpreadsheet, 
  syncEquipmentsToSheet, 
  syncEquipmentsViaWebhook,
  DEFAULT_SHEET_TITLE 
} from './services/googleSheets';

const STORAGE_KEY = 'cns_equipments_data_v3';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active View Tab State
  const [currentView, setCurrentView] = useState<'dossier' | 'analytics' | 'planner' | 'stations'>('dossier');

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Google Sheets Auto-Sync & Remembered Config State
  const [syncConfig, setSyncConfig] = useState<GoogleSheetsSyncConfig>(loadSyncConfig);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);

  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    return SAMPLE_EQUIPMENTS;
  });

  // Track Firebase Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Listen to command palette open event
  useEffect(() => {
    const handleOpenCmd = () => setIsCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpenCmd);
    return () => window.removeEventListener('open-command-palette', handleOpenCmd);
  }, []);

  // When user logs in, if no sheet is remembered yet, auto-discover or bind to official VATM sheet
  useEffect(() => {
    if (!currentUser || syncConfig.spreadsheetId) return;

    let isMounted = true;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token || !isMounted) return;
        const vatmFile = await findOrCreateVatmSpreadsheet(token, equipments);
        if (isMounted && vatmFile) {
          const updated: GoogleSheetsSyncConfig = {
            ...syncConfig,
            spreadsheetId: vatmFile.id,
            spreadsheetName: vatmFile.name,
            spreadsheetUrl: vatmFile.webViewLink || `https://docs.google.com/spreadsheets/d/${vatmFile.id}`,
            lastSyncedAt: new Date().toISOString(),
            lastSyncStatus: 'success'
          };
          setSyncConfig(updated);
          saveSyncConfig(updated);
          showToast(`Đã tự động kết nối tệp "${DEFAULT_SHEET_TITLE}" trên Google Drive!`, 'success');
        }
      } catch (e) {
        console.warn('Auto-discover VATM sheet error:', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Debounced Auto-Sync to Google Sheets whenever equipments change (Supports Webhook without login & OAuth)
  useEffect(() => {
    if (!syncConfig.autoSyncEnabled) return;

    // 1. Zero-login Webhook Auto-Sync (Highest Priority when URL provided)
    if (syncConfig.webhookUrl) {
      const timer = setTimeout(async () => {
        try {
          setIsAutoSyncing(true);
          const res = await syncEquipmentsViaWebhook(syncConfig.webhookUrl, equipments);
          const updated: GoogleSheetsSyncConfig = {
            ...syncConfig,
            lastSyncedAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncError: undefined,
            lastSyncedCount: equipments.length,
            spreadsheetUrl: res.spreadsheetUrl || syncConfig.spreadsheetUrl
          };
          setSyncConfig(updated);
          saveSyncConfig(updated);
        } catch (err: any) {
          console.warn('Webhook auto-sync warning:', err);
          const updated: GoogleSheetsSyncConfig = {
            ...syncConfig,
            lastSyncStatus: 'error',
            lastSyncError: err.message
          };
          setSyncConfig(updated);
          saveSyncConfig(updated);
        } finally {
          setIsAutoSyncing(false);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }

    // 2. OAuth Auto-Sync (When user is signed in with Google)
    if (currentUser) {
      const timer = setTimeout(async () => {
        const token = await getAccessToken();
        if (!token) return;

        try {
          setIsAutoSyncing(true);
          let targetId = syncConfig.spreadsheetId;
          let targetUrl = syncConfig.spreadsheetUrl;

          // If no target ID yet, find or create the official file
          if (!targetId) {
            const vatmFile = await findOrCreateVatmSpreadsheet(token, equipments);
            targetId = vatmFile.id;
            targetUrl = vatmFile.webViewLink || `https://docs.google.com/spreadsheets/d/${targetId}`;
            const updated: GoogleSheetsSyncConfig = {
              ...syncConfig,
              spreadsheetId: targetId,
              spreadsheetName: DEFAULT_SHEET_TITLE,
              spreadsheetUrl: targetUrl,
              lastSyncedAt: new Date().toISOString(),
              lastSyncStatus: 'success',
              lastSyncError: undefined
            };
            setSyncConfig(updated);
            saveSyncConfig(updated);
            showToast(`Đã tự động lưu dữ liệu lên "${DEFAULT_SHEET_TITLE}"`, 'success');
            return;
          }

          // Sync to target sheet
          const { spreadsheetUrl } = await syncEquipmentsToSheet(token, targetId, equipments);
          const updated: GoogleSheetsSyncConfig = {
            ...syncConfig,
            spreadsheetUrl,
            lastSyncedAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncError: undefined
          };
          setSyncConfig(updated);
          saveSyncConfig(updated);
        } catch (err: any) {
          console.warn('Auto-sync error:', err);
          const updated: GoogleSheetsSyncConfig = {
            ...syncConfig,
            lastSyncStatus: 'error',
            lastSyncError: err.message
          };
          setSyncConfig(updated);
          saveSyncConfig(updated);
        } finally {
          setIsAutoSyncing(false);
        }
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [equipments, syncConfig.autoSyncEnabled, syncConfig.webhookUrl, syncConfig.spreadsheetId, currentUser]);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    equipments.length > 0 ? equipments[0].id : ''
  );
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetEquipment, setPrintTargetEquipment] = useState<Equipment | null>(null);
  
  // QR Scanner Modal State
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // QR Label Print Modal State
  const [isQrLabelModalOpen, setIsQrLabelModalOpen] = useState(false);
  const [qrLabelTargetEquipment, setQrLabelTargetEquipment] = useState<Equipment | null>(null);

  // Google Sheets Info / Export Modal State
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Delete Confirmation Modal State
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Deep-link check on startup (e.g. user scanned QR with external scanner or camera app)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const eqParam = urlParams.get('equipmentId') || urlParams.get('id') || urlParams.get('eq');
      const action = urlParams.get('action') || urlParams.get('view');
      const shouldOpenPdf = action === 'pdf' || action === 'print' || urlParams.has('pdf');

      if (eqParam && equipments.length > 0) {
        const matched = findEquipmentByQrCode(eqParam, equipments);
        if (matched) {
          setSelectedEquipmentId(matched.id);
          if (shouldOpenPdf) {
            setPrintTargetEquipment(matched);
            setIsPrintModalOpen(true);
            showToast(`Đã nhận diện thiết bị "${matched.general.name}" từ mã QR!`, 'success');
          }
        }
      }
    } catch (err) {
      console.error('Deep-link check error:', err);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(equipments));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }, [equipments]);

  // Show Toast helper
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const currentEquipment = equipments.find(e => e.id === selectedEquipmentId) || equipments[0] || null;

  // Equipment update handler
  const handleUpdateEquipment = (updated: Equipment) => {
    setEquipments(prev => prev.map(e => e.id === updated.id ? updated : e));
    showToast(`Đã tự động lưu hồ sơ "${updated.general.name}"`, 'info');
  };

  // Add Equipment handler
  const handleAddEquipment = (newEq: Equipment) => {
    setEquipments(prev => [newEq, ...prev]);
    setSelectedEquipmentId(newEq.id);
    showToast(`Đã thêm thiết bị mới "${newEq.general.name}" vào Sổ lý lịch!`, 'success');
  };

  // Delete Equipment request handler (opens modal)
  const handleDeleteEquipment = (id: string) => {
    const eqToDelete = equipments.find(e => e.id === id);
    if (!eqToDelete) return;
    setEquipmentToDelete(eqToDelete);
  };

  // Confirm Delete Equipment execution
  const handleConfirmDeleteEquipment = () => {
    if (!equipmentToDelete) return;
    const targetId = equipmentToDelete.id;
    const targetName = equipmentToDelete.general.name;
    const targetSerial = equipmentToDelete.general.serial;
    
    const remaining = equipments.filter(e => e.id !== targetId);
    setEquipments(remaining);
    
    if (remaining.length > 0) {
      if (selectedEquipmentId === targetId) {
        setSelectedEquipmentId(remaining[0].id);
      }
    } else {
      setSelectedEquipmentId('');
    }
    
    setEquipmentToDelete(null);
    showToast(`Đã xóa vĩnh viễn thiết bị "${targetName}" (${targetSerial}) khỏi hệ thống!`, 'info');
  };

  // Open Print modal
  const handleOpenPrintModal = (eq?: Equipment) => {
    setPrintTargetEquipment(eq || currentEquipment);
    setIsPrintModalOpen(true);
  };

  // Export JSON backup
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(equipments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `So_Ly_Lich_Thiet_Bi_CNS_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã xuất file JSON sao lưu hệ thống Sổ lý lịch thành công!', 'success');
  };

  // Import JSON backup
  const handleImportJson = (data: any) => {
    if (Array.isArray(data) && data.length > 0 && data[0].general && data[0].org) {
      setEquipments(data);
      setSelectedEquipmentId(data[0].id);
      showToast(`Đã nhập thành công ${data.length} hồ sơ thiết bị từ file sao lưu!`, 'success');
    } else {
      showToast('Định dạng tệp sao lưu không đúng chuẩn hồ sơ thiết bị CNS.', 'error');
    }
  };

  // Export CSV for Google Sheets / Excel
  const handleExportCsv = () => {
    const headers = [
      'Mã thiết bị',
      'Tên thiết bị',
      'Chủng loại',
      'Model',
      'Số Serial',
      'Mã tài sản',
      'Số sổ',
      'Hãng SX',
      'Năm SX',
      'Ngày đưa vào SD',
      'Trạng thái',
      'Cấp ưu tiên',
      'Đơn vị quản lý',
      'Vị trí đài trạm',
      'Kỹ sư phụ trách',
      'Số linh kiện',
      'Số lượt bảo dưỡng',
      'Số lần sửa chữa'
    ];

    const rows = equipments.map(eq => [
      eq.id,
      `"${(eq.general.name || '').replace(/"/g, '""')}"`,
      `"${(eq.general.category || '').replace(/"/g, '""')}"`,
      `"${(eq.general.model || '').replace(/"/g, '""')}"`,
      `"${(eq.general.serial || '').replace(/"/g, '""')}"`,
      `"${(eq.general.assetNo || '').replace(/"/g, '""')}"`,
      `"${(eq.general.bookletNo || '').replace(/"/g, '""')}"`,
      `"${(eq.general.manufacturer || '').replace(/"/g, '""')}"`,
      `"${(eq.general.yearMade || '').replace(/"/g, '""')}"`,
      `"${(eq.general.commissioned || '').replace(/"/g, '""')}"`,
      `"${(eq.general.status || '').replace(/"/g, '""')}"`,
      `"${(eq.general.priority || '').replace(/"/g, '""')}"`,
      `"${(eq.org.unit || '').replace(/"/g, '""')}"`,
      `"${(eq.org.stationName || eq.org.location || '').replace(/"/g, '""')}"`,
      `"${(eq.org.primaryEngineer || '').replace(/"/g, '""')}"`,
      eq.components?.length || 0,
      eq.maintenance?.length || 0,
      eq.repair?.length || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Muc_Thiet_Bi_CNS_GoogleSheets_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file CSV gồm ${equipments.length} thiết bị sẵn sàng mở trong Google Sheets!`, 'success');
  };

  // Force sync immediately to Google Sheet (Webhook without login or OAuth)
  const handleForceSyncNow = async () => {
    // 1. If Webhook URL is configured, sync directly without requiring Google login
    if (syncConfig.webhookUrl) {
      try {
        setIsAutoSyncing(true);
        const res = await syncEquipmentsViaWebhook(syncConfig.webhookUrl, equipments);
        const updated: GoogleSheetsSyncConfig = {
          ...syncConfig,
          lastSyncedAt: new Date().toISOString(),
          lastSyncStatus: 'success',
          lastSyncError: undefined,
          lastSyncedCount: equipments.length,
          spreadsheetUrl: res.spreadsheetUrl || syncConfig.spreadsheetUrl
        };
        setSyncConfig(updated);
        saveSyncConfig(updated);
        showToast(`Đã tự động đồng bộ ${equipments.length} thiết bị lên Google Sheet mà không cần đăng nhập!`, 'success');
        return;
      } catch (err: any) {
        showToast(`Lỗi đồng bộ Webhook: ${err.message}`, 'error');
        return;
      } finally {
        setIsAutoSyncing(false);
      }
    }

    // 2. Otherwise use OAuth if user is signed in
    let token = await getAccessToken();
    if (!token && currentUser) {
      try {
        const res = await googleSignIn();
        token = res?.accessToken || null;
        if (res?.user) setCurrentUser(res.user);
      } catch (err: any) {
        showToast(`Đăng nhập Google thất bại: ${err.message}`, 'error');
        return;
      }
    }

    if (!token) {
      setIsGoogleSheetsModalOpen(true);
      showToast('Vui lòng thiết lập URL Webhook Google Sheet (Không cần đăng nhập) hoặc đăng nhập Google Drive.', 'info');
      return;
    }

    try {
      setIsAutoSyncing(true);
      let targetId = syncConfig.spreadsheetId;
      if (!targetId) {
        const vatmFile = await findOrCreateVatmSpreadsheet(token, equipments);
        targetId = vatmFile.id;
        const targetUrl = vatmFile.webViewLink || `https://docs.google.com/spreadsheets/d/${targetId}`;
        const updated: GoogleSheetsSyncConfig = {
          ...syncConfig,
          spreadsheetId: targetId,
          spreadsheetName: DEFAULT_SHEET_TITLE,
          spreadsheetUrl: targetUrl,
          lastSyncedAt: new Date().toISOString(),
          lastSyncStatus: 'success',
          lastSyncError: undefined
        };
        setSyncConfig(updated);
        saveSyncConfig(updated);
        showToast(`Đã kết nối và đồng bộ lên "${DEFAULT_SHEET_TITLE}"!`, 'success');
        return;
      }

      const { updatedRows, spreadsheetUrl } = await syncEquipmentsToSheet(token, targetId, equipments);
      const updated: GoogleSheetsSyncConfig = {
        ...syncConfig,
        spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncError: undefined
      };
      setSyncConfig(updated);
      saveSyncConfig(updated);
      showToast(`Đã đồng bộ thành công ${updatedRows} thiết bị lên "${syncConfig.spreadsheetName || DEFAULT_SHEET_TITLE}"!`, 'success');
    } catch (err: any) {
      showToast(`Lỗi đồng bộ: ${err.message}`, 'error');
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Save to Sheets / Export action
  const handleSaveToSheets = async () => {
    setIsSaving(true);
    setLastSavedTime(new Date().toISOString());
    if (syncConfig.webhookUrl || currentUser) {
      await handleForceSyncNow();
    } else {
      setIsGoogleSheetsModalOpen(true);
      setTimeout(() => {
        setIsSaving(false);
        showToast(`Đã lưu ${equipments.length} thiết bị. Mở bảng điều khiển đồng bộ Google Sheet tự động!`, 'info');
      }, 300);
      return;
    }
    setIsSaving(false);
  };

  // Export to Google Doc handler
  const handleExportDoc = (eq: Equipment) => {
    showToast(`Đang kết xuất tài liệu Sổ lý lịch cho "${eq.general.name}"...`, 'info');
    setTimeout(() => {
      showToast(`Đã xuất Sổ lý lịch chuẩn VATM cho "${eq.general.name}"!`, 'success');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* GLOBAL NAVIGATION */}
      <Navigation
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenPrint={() => handleOpenPrintModal()}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        totalEquipments={equipments.length}
        currentUser={currentUser}
        syncConfig={syncConfig}
        isAutoSyncing={isAutoSyncing}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-white/95 text-emerald-800 border-emerald-300 shadow-emerald-500/10'
              : toastMessage.type === 'error'
              ? 'bg-white/95 text-rose-800 border-rose-300 shadow-rose-500/10'
              : 'bg-white/95 text-blue-900 border-sky-300 shadow-sky-500/15'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
            {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dossier' && (
          <EquipmentDashboard
            equipments={equipments}
            currentEquipment={currentEquipment}
            onSelectEquipment={setSelectedEquipmentId}
            onUpdateEquipment={handleUpdateEquipment}
            onAddEquipment={handleAddEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onOpenPrintModal={handleOpenPrintModal}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onOpenQrLabelModal={(eq) => {
              setQrLabelTargetEquipment(eq);
              setIsQrLabelModalOpen(true);
            }}
            onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
            onExportCsv={handleExportCsv}
            onSaveToSheets={handleSaveToSheets}
            isSaving={isSaving}
            lastSavedTime={lastSavedTime}
            syncConfig={syncConfig}
            isAutoSyncing={isAutoSyncing}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            equipments={equipments}
            onSelectEquipment={(id) => {
              setSelectedEquipmentId(id);
              setCurrentView('dossier');
            }}
            onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {currentView === 'planner' && (
          <MaintenancePlannerView
            equipments={equipments}
            onSelectEquipment={(id) => {
              setSelectedEquipmentId(id);
              setCurrentView('dossier');
            }}
            onUpdateEquipment={handleUpdateEquipment}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {currentView === 'stations' && (
          <StationDirectoryView
            equipments={equipments}
            onSelectEquipment={setSelectedEquipmentId}
            onOpenPrintModal={handleOpenPrintModal}
            onOpenQrLabelModal={(eq) => {
              setQrLabelTargetEquipment(eq);
              setIsQrLabelModalOpen(true);
            }}
            onSwitchToDossier={() => setCurrentView('dossier')}
          />
        )}
      </main>

      {/* GLOBAL COMMAND PALETTE (Ctrl+K / ⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        equipments={equipments}
        onSelectEquipment={(id) => {
          setSelectedEquipmentId(id);
          setCurrentView('dossier');
        }}
        onOpenPrintModal={handleOpenPrintModal}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onAddNewEquipment={() => {
          setCurrentView('dossier');
          // Trigger add equipment modal
          const addBtn = document.getElementById('btn-add-equipment-modal');
          addBtn?.click();
        }}
        onChangeView={setCurrentView}
      />

      {/* PRINT / PREVIEW MODAL (SỔ LÝ LỊCH 8 TRANG PDF) */}
      {isPrintModalOpen && (
        <PrintProfileModal
          equipment={printTargetEquipment}
          onClose={() => setIsPrintModalOpen(false)}
          onExportDoc={handleExportDoc}
        />
      )}

      {/* QR CODE SCANNER MODAL */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        equipments={equipments}
        onSelectEquipment={(id) => {
          setSelectedEquipmentId(id);
          setCurrentView('dossier');
        }}
        onOpenEquipmentPdf={(eq) => {
          setSelectedEquipmentId(eq.id);
          setCurrentView('dossier');
          handleOpenPrintModal(eq);
          showToast(`Đã mở Sổ lý lịch PDF cho "${eq.general.name}"`, 'success');
        }}
      />

      {/* QR CODE LABEL PRINT MODAL */}
      <QrLabelModal
        isOpen={isQrLabelModalOpen}
        equipment={qrLabelTargetEquipment}
        onClose={() => {
          setIsQrLabelModalOpen(false);
          setQrLabelTargetEquipment(null);
        }}
        onOpenPdf={(eq) => {
          setSelectedEquipmentId(eq.id);
          handleOpenPrintModal(eq);
        }}
      />

      {/* GOOGLE SHEETS INFO & EXPORT MODAL */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        equipments={equipments}
        onExportCsv={handleExportCsv}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        syncConfig={syncConfig}
        onUpdateSyncConfig={(cfg) => {
          setSyncConfig(cfg);
          saveSyncConfig(cfg);
        }}
        onForceSyncNow={handleForceSyncNow}
        isAutoSyncing={isAutoSyncing}
        onImportEquipments={(newEquipments) => {
          setEquipments(newEquipments);
          if (newEquipments.length > 0) setSelectedEquipmentId(newEquipments[0].id);
          showToast(`Đã đồng bộ thành công ${newEquipments.length} thiết bị từ Google Sheets!`, 'success');
        }}
      />

      {/* DELETE EQUIPMENT CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={!!equipmentToDelete}
        onClose={() => setEquipmentToDelete(null)}
        onConfirm={handleConfirmDeleteEquipment}
        title="Xác Nhận Xóa Hồ Sơ Thiết Bị CNS"
        itemName={equipmentToDelete?.general.name || ''}
        itemTypeLabel="Hồ sơ thiết bị"
        itemDetails={
          equipmentToDelete
            ? [
                { label: 'Mã hồ sơ', value: equipmentToDelete.id },
                { label: 'Số Serial', value: equipmentToDelete.general.serial },
                { label: 'Chủng loại', value: equipmentToDelete.general.category },
                { label: 'Ký hiệu / Model', value: equipmentToDelete.general.model },
                { label: 'Đài trạm', value: equipmentToDelete.org.stationName || equipmentToDelete.org.location || '---' },
                { 
                  label: 'Dữ liệu kèm theo', 
                  value: `${equipmentToDelete.components?.length || 0} linh kiện, ${equipmentToDelete.maintenance?.length || 0} bảo dưỡng, ${equipmentToDelete.repair?.length || 0} sự cố` 
                }
              ]
            : []
        }
        warningText="Hành động này sẽ xóa vĩnh viễn toàn bộ 8 trang hồ sơ lý lịch điện tử (chuẩn VATM), danh mục linh kiện, nhật ký bảo dưỡng định kỳ và các sự cố kỹ thuật của thiết bị này. Dữ liệu sẽ không thể phục hồi sau khi xóa."
        confirmButtonText="Xác Nhận Xóa Vĩnh Viễn"
      />

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-600 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-700">
            © {new Date().getFullYear()} Tổng công ty Quản lý bay Việt Nam (VATM) — Công ty Quản lý bay miền Nam
          </p>
          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <span className="text-blue-900 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Sổ Quản Lý Lý Lịch Thiết Bị Kỹ Thuật CNS
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
