import React, { useState, useEffect, useMemo, useRef, KeyboardEvent } from 'react';
import { 
  Search, 
  Radio, 
  Printer, 
  QrCode, 
  FileSpreadsheet, 
  Plus, 
  AlertTriangle, 
  Wrench, 
  ArrowRight, 
  MapPin, 
  X,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { Equipment } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  onSelectEquipment: (id: string) => void;
  onOpenPrintModal: (equipment?: Equipment) => void;
  onOpenQrScanner: () => void;
  onOpenGoogleSheets: () => void;
  onAddNewEquipment: () => void;
  onChangeView: (view: 'dossier' | 'analytics' | 'planner' | 'stations') => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  equipments,
  onSelectEquipment,
  onOpenPrintModal,
  onOpenQrScanner,
  onOpenGoogleSheets,
  onAddNewEquipment,
  onChangeView
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          const evt = new CustomEvent('open-command-palette');
          window.dispatchEvent(evt);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items based on query
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    // Quick Actions
    const quickActions = [
      {
        id: 'act-add',
        type: 'action' as const,
        title: 'Thêm thiết bị CNS mới vào Sổ lý lịch',
        category: 'Hành động nhanh',
        icon: Plus,
        action: () => { onAddNewEquipment(); onClose(); }
      },
      {
        id: 'act-scan',
        type: 'action' as const,
        title: 'Quét mã QR (Camera / Tải ảnh để mở Sổ PDF)',
        category: 'Hành động nhanh',
        icon: QrCode,
        action: () => { onOpenQrScanner(); onClose(); }
      },
      {
        id: 'act-sheets',
        type: 'action' as const,
        title: 'Quản lý & Tự động đồng bộ Google Sheets',
        category: 'Hành động nhanh',
        icon: FileSpreadsheet,
        action: () => { onOpenGoogleSheets(); onClose(); }
      },
      {
        id: 'act-print-all',
        type: 'action' as const,
        title: 'Xem và in biểu mẫu Sổ lý lịch 8 trang chuẩn VATM',
        category: 'Hành động nhanh',
        icon: Printer,
        action: () => { onOpenPrintModal(); onClose(); }
      },
      {
        id: 'act-view-analytics',
        type: 'action' as const,
        title: 'Bảng điều khiển độ tin cậy kỹ thuật & Chỉ số MTBF/MTTR',
        category: 'Chuyển màn hình',
        icon: Sparkles,
        action: () => { onChangeView('analytics'); onClose(); }
      },
      {
        id: 'act-view-planner',
        type: 'action' as const,
        title: 'Lịch bảo dưỡng định kỳ & Cảnh báo hạn kiểm tra',
        category: 'Chuyển màn hình',
        icon: Wrench,
        action: () => { onChangeView('planner'); onClose(); }
      },
      {
        id: 'act-view-stations',
        type: 'action' as const,
        title: 'Danh mục phân bố thiết bị theo Đài Trạm hàng không',
        category: 'Chuyển màn hình',
        icon: MapPin,
        action: () => { onChangeView('stations'); onClose(); }
      }
    ];

    if (!q) {
      return quickActions;
    }

    const filteredActions = quickActions.filter(a => 
      a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );

    const matchedEquipments = equipments.filter(eq => {
      const nameMatch = eq.general.name?.toLowerCase().includes(q);
      const serialMatch = eq.general.serial?.toLowerCase().includes(q);
      const modelMatch = eq.general.model?.toLowerCase().includes(q);
      const freqMatch = eq.spec?.channelFreq?.toLowerCase().includes(q);
      const stationMatch = eq.org.stationName?.toLowerCase().includes(q) || eq.org.location?.toLowerCase().includes(q);
      const catMatch = eq.general.category?.toLowerCase().includes(q);
      const assetMatch = eq.general.assetNo?.toLowerCase().includes(q);
      const ipMatch = eq.spec?.mgmtIp?.toLowerCase().includes(q);
      const engineerMatch = eq.org.primaryEngineer?.toLowerCase().includes(q);
      const compMatch = eq.components?.some(c => 
        c.name.toLowerCase().includes(q) || 
        c.partNo.toLowerCase().includes(q) || 
        c.serial.toLowerCase().includes(q)
      );
      return nameMatch || serialMatch || modelMatch || freqMatch || stationMatch || catMatch || assetMatch || ipMatch || engineerMatch || compMatch;
    }).map(eq => ({
      id: `eq-${eq.id}`,
      type: 'equipment' as const,
      title: eq.general.name,
      subtitle: `S/N: ${eq.general.serial} · Model: ${eq.general.model} · ${eq.org.stationName || eq.org.location}`,
      badge: eq.general.category,
      status: eq.general.status,
      icon: Radio,
      action: () => {
        onChangeView('dossier');
        onSelectEquipment(eq.id);
        onClose();
      }
    }));

    return [...filteredActions, ...matchedEquipments];
  }, [query, equipments, onAddNewEquipment, onOpenQrScanner, onOpenGoogleSheets, onOpenPrintModal, onChangeView, onSelectEquipment, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm nhanh thiết bị, số serial, tần số, đài trạm hoặc lệnh thao tác... (Ctrl+K)"
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-semibold bg-white border border-slate-200 rounded-md text-slate-500 shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800">Không tìm thấy kết quả nào</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử tìm theo tên thiết bị, model, số serial hoặc tần số (VD: 120.900, T6T, 6U11654).</p>
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition gap-3 ${
                    isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                        {item.title}
                      </p>
                      {'subtitle' in item && item.subtitle && (
                        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                      {'category' in item && (
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {'badge' in item && item.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        {item.badge}
                      </span>
                    )}
                    {'status' in item && item.status && (
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'Đang khai thác' ? 'bg-emerald-500' :
                        item.status === 'Đang bảo dưỡng' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'} transition-transform`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">↑</kbd> <kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">↓</kbd> để di chuyển</span>
            <span><kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">↵</kbd> để chọn</span>
          </div>
          <span className="font-semibold text-slate-600">Sổ Quản Lý Lý Lịch CNS · VATM</span>
        </div>
      </div>
    </div>
  );
}
