import { useState, useMemo, FormEvent, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  FileText, 
  Save, 
  Trash2, 
  Edit3, 
  Radio, 
  Cpu, 
  Activity, 
  Settings2, 
  ShieldAlert, 
  Printer, 
  Sparkles,
  Server,
  MapPin,
  User,
  Zap,
  ExternalLink,
  ChevronRight,
  X,
  SlidersHorizontal,
  RotateCcw,
  QrCode,
  Tag,
  Paperclip,
  Check,
  FileSpreadsheet,
  RefreshCw,
  Copy,
  ShieldCheck,
  FolderOpen,
  Send
} from 'lucide-react';
import { Equipment, ComponentItem, MaintenanceRecord, RepairRecord, ManagingUnit, LicenseItem, TechnicalDocItem, CNS_STATIONS, CnsStationName, EQUIPMENT_CATEGORIES } from '../types';
import { generateEquipmentQrUrl, generateEquipmentQrDataUrl } from '../utils/qrUtils';
import { GoogleSheetsSyncConfig, DEFAULT_SHEET_TITLE } from '../services/googleSheets';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface EquipmentDashboardProps {
  equipments: Equipment[];
  currentEquipment: Equipment | null;
  onSelectEquipment: (id: string) => void;
  onUpdateEquipment: (updated: Equipment) => void;
  onAddEquipment: (newEq: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
  onOpenPrintModal: (equipment: Equipment) => void;
  onOpenQrScanner: () => void;
  onOpenQrLabelModal: (equipment: Equipment) => void;
  onOpenGoogleSheets: () => void;
  onExportCsv: () => void;
  onSaveToSheets: () => void;
  onExportGoogleDoc?: (equipment: Equipment) => void;
  isSaving: boolean;
  lastSavedTime: string | null;
  syncConfig?: GoogleSheetsSyncConfig;
  isAutoSyncing?: boolean;
}

export function EquipmentDashboard({
  equipments,
  currentEquipment,
  onSelectEquipment,
  onUpdateEquipment,
  onAddEquipment,
  onDeleteEquipment,
  onOpenPrintModal,
  onOpenQrScanner,
  onOpenQrLabelModal,
  onOpenGoogleSheets,
  onExportCsv,
  onSaveToSheets,
  onExportGoogleDoc,
  isSaving,
  lastSavedTime,
  syncConfig,
  isAutoSyncing = false
}: EquipmentDashboardProps) {
  const [subTab, setSubTab] = useState<'general' | 'specs' | 'components' | 'maintenance' | 'repair' | 'transfer' | 'licenses'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [isAddingEqModal, setIsAddingEqModal] = useState(false);
  const [isAddingCompModal, setIsAddingCompModal] = useState(false);
  const [isAddingMaintModal, setIsAddingMaintModal] = useState(false);
  const [isAddingRepairModal, setIsAddingRepairModal] = useState(false);
  const [isAddingUnitModal, setIsAddingUnitModal] = useState(false);
  const [isAddingLicenseModal, setIsAddingLicenseModal] = useState<'frequency' | 'operation' | null>(null);

  // Sub-item Delete Confirmation Modal State
  const [subItemToDelete, setSubItemToDelete] = useState<{
    type: 'component' | 'maint' | 'repair' | 'unit' | 'licenseFrequency' | 'licenseOperation';
    id: string;
    name: string;
    itemTypeLabel: string;
    details?: { label: string; value: string }[];
  } | null>(null);

  // New Equipment Form State
  const [newEqForm, setNewEqForm] = useState({
    name: '',
    category: 'VHF' as Equipment['general']['category'],
    model: '',
    serial: '',
    assetNo: '',
    priority: 'Thiết bị nhóm 1',
    manufacturer: '',
    yearMade: '2023',
    origin: 'CHLB Đức',
    commissioned: new Date().toISOString().split('T')[0],
    stationName: 'AACC HCM' as CnsStationName,
    location: 'Sân bay Quốc tế Tân Sơn Nhất',
    primaryEngineer: 'KS. Trực ban kỹ thuật',
    power: '50W',
    channelFreq: '118.100 MHz'
  });

  // Active Equipment QR Code state
  const [currentQrDataUrl, setCurrentQrDataUrl] = useState<string>('');
  const [qrCopied, setQrCopied] = useState(false);

  useEffect(() => {
    if (currentEquipment) {
      const qrUrl = generateEquipmentQrUrl(currentEquipment);
      generateEquipmentQrDataUrl(qrUrl, {
        width: 240,
        margin: 1,
        color: { dark: '#032b69', light: '#ffffff' }
      }).then(setCurrentQrDataUrl).catch(console.error);
    }
  }, [currentEquipment]);

  const handleCopyCurrentQrLink = () => {
    if (!currentEquipment) return;
    navigator.clipboard.writeText(generateEquipmentQrUrl(currentEquipment));
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  // Duplicate / Clone Equipment (for rapid creation of Dual Standby channel pairs)
  const handleDuplicateEquipment = (eq: Equipment) => {
    const cloneId = 'EQ-CNS-' + Date.now().toString().slice(-4);
    const cloned: Equipment = {
      ...JSON.parse(JSON.stringify(eq)),
      id: cloneId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      general: {
        ...eq.general,
        name: `${eq.general.name} (Dự phòng / Standby)`,
        serial: `${eq.general.serial}-SB`,
        assetNo: `${eq.general.assetNo || 'TS'}-SB`,
        status: 'Dự phòng nóng',
        priority: 'Dự phòng (Level 3)'
      },
      maintenance: [],
      repair: []
    };
    onAddEquipment(cloned);
  };

  // Filtered Equipment List (Real-time by Name, Serial Number, Model, Location, Components, Station)
  const filteredEquipments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return equipments.filter(eq => {
      const matchCategory = categoryFilter === 'ALL' || eq.general.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || eq.general.status === statusFilter;
      const rawStation = eq.org.stationName || eq.org.location || '';
      const matchStation = stationFilter === 'ALL' || eq.org.stationName === stationFilter || rawStation.includes(stationFilter);

      if (!q) {
        return matchCategory && matchStatus && matchStation;
      }

      const matchName = eq.general.name?.toLowerCase().includes(q);
      const matchSerial = eq.general.serial?.toLowerCase().includes(q);
      const matchModel = eq.general.model?.toLowerCase().includes(q);
      const matchId = eq.id?.toLowerCase().includes(q);
      const matchLocation = eq.org.location?.toLowerCase().includes(q) || eq.org.stationName?.toLowerCase().includes(q);
      const matchComponents = eq.components?.some(c => 
        c.name.toLowerCase().includes(q) || 
        c.serial.toLowerCase().includes(q) ||
        c.partNo.toLowerCase().includes(q)
      );

      const matchSearch = matchName || matchSerial || matchModel || matchId || matchLocation || matchComponents;

      return matchSearch && matchCategory && matchStatus && matchStation;
    });
  }, [equipments, searchQuery, categoryFilter, statusFilter, stationFilter]);

  // Highlight matching text helper
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 text-slate-950 px-0.5 rounded font-bold">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Statistics KPI
  const stats = useMemo(() => {
    const total = equipments.length;
    const active = equipments.filter(e => e.general.status === 'Đang khai thác').length;
    const maint = equipments.filter(e => e.general.status === 'Đang bảo dưỡng').length;
    const repair = equipments.filter(e => e.general.status === 'Chờ sửa chữa').length;
    const totalComps = equipments.reduce((sum, e) => sum + (e.components?.length || 0), 0);
    const totalMaints = equipments.reduce((sum, e) => sum + (e.maintenance?.length || 0), 0);
    return { total, active, maint, repair, totalComps, totalMaints };
  }, [equipments]);

  // Field change helpers for currently selected equipment
  const handleFieldChange = (section: 'general' | 'org' | 'spec', field: string, value: any) => {
    if (!currentEquipment) return;
    const updated: Equipment = {
      ...currentEquipment,
      updatedAt: new Date().toISOString(),
      [section]: {
        ...currentEquipment[section],
        [field]: value
      }
    };
    onUpdateEquipment(updated);
  };

  // Add Component Handler
  const handleAddComponentSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEquipment) return;
    const formData = new FormData(e.currentTarget);
    const newComp: ComponentItem = {
      id: 'comp-' + Date.now(),
      no: (currentEquipment.components?.length || 0) + 1,
      name: String(formData.get('name') || ''),
      partNo: String(formData.get('partNo') || '---'),
      serial: String(formData.get('serial') || '---'),
      qty: Number(formData.get('qty') || 1),
      healthStatus: (formData.get('healthStatus') as any) || 'Tốt',
      notes: String(formData.get('notes') || '')
    };
    const updated: Equipment = {
      ...currentEquipment,
      updatedAt: new Date().toISOString(),
      components: [...(currentEquipment.components || []), newComp]
    };
    onUpdateEquipment(updated);
    setIsAddingCompModal(false);
  };

  // Delete Component Request
  const handleDeleteComponent = (compId: string) => {
    if (!currentEquipment) return;
    const comp = currentEquipment.components?.find(c => c.id === compId);
    if (!comp) return;
    setSubItemToDelete({
      type: 'component',
      id: compId,
      name: comp.name,
      itemTypeLabel: 'Khối linh kiện',
      details: [
        { label: 'Ký hiệu Part No', value: comp.partNo },
        { label: 'Số Serial', value: comp.serial },
        { label: 'Tình trạng', value: comp.healthStatus }
      ]
    });
  };

  // Add Maintenance Log Handler
  const handleAddMaintSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEquipment) return;
    const formData = new FormData(e.currentTarget);
    const newMaint: MaintenanceRecord = {
      id: 'maint-' + Date.now(),
      date: String(formData.get('date') || new Date().toISOString().split('T')[0]),
      cycle: (formData.get('cycle') as any) || 'Định kỳ',
      content: String(formData.get('content') || ''),
      measuredParams: String(formData.get('measuredParams') || '---'),
      result: (formData.get('result') as any) || 'Đạt yêu cầu',
      person: String(formData.get('person') || currentEquipment.org.primaryEngineer),
      signed: true
    };
    const updated: Equipment = {
      ...currentEquipment,
      updatedAt: new Date().toISOString(),
      maintenance: [newMaint, ...(currentEquipment.maintenance || [])]
    };
    onUpdateEquipment(updated);
    setIsAddingMaintModal(false);
  };

  // Delete Maintenance Record Request
  const handleDeleteMaint = (maintId: string) => {
    if (!currentEquipment) return;
    const maint = currentEquipment.maintenance?.find(m => m.id === maintId);
    if (!maint) return;
    setSubItemToDelete({
      type: 'maint',
      id: maintId,
      name: `Đợt bảo dưỡng ngày ${maint.date} (${maint.cycle})`,
      itemTypeLabel: 'Bản ghi bảo dưỡng',
      details: [
        { label: 'Nội dung', value: maint.content || 'Kiểm tra bảo dưỡng' },
        { label: 'Kết quả', value: maint.result },
        { label: 'Người thực hiện', value: maint.person }
      ]
    });
  };

  // Add Repair Incident Handler
  const handleAddRepairSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEquipment) return;
    const formData = new FormData(e.currentTarget);
    const newRepair: RepairRecord = {
      id: 'repair-' + Date.now(),
      date: String(formData.get('date') || new Date().toISOString().split('T')[0]),
      incidentDescription: String(formData.get('incidentDescription') || ''),
      rootCause: String(formData.get('rootCause') || 'Đang theo dõi'),
      actionTaken: String(formData.get('actionTaken') || ''),
      replacedParts: String(formData.get('replacedParts') || ''),
      person: String(formData.get('person') || currentEquipment.org.primaryEngineer),
      status: (formData.get('status') as any) || 'Đã hoàn thành'
    };
    const updated: Equipment = {
      ...currentEquipment,
      updatedAt: new Date().toISOString(),
      repair: [newRepair, ...(currentEquipment.repair || [])]
    };
    onUpdateEquipment(updated);
    setIsAddingRepairModal(false);
  };

  // Delete Repair Record Request
  const handleDeleteRepair = (repairId: string) => {
    if (!currentEquipment) return;
    const rep = currentEquipment.repair?.find(r => r.id === repairId);
    if (!rep) return;
    setSubItemToDelete({
      type: 'repair',
      id: repairId,
      name: `Sự cố ngày ${rep.date}: ${rep.incidentDescription}`,
      itemTypeLabel: 'Nhật ký sự cố & sửa chữa',
      details: [
        { label: 'Nguyên nhân', value: rep.rootCause },
        { label: 'Biện pháp xử lý', value: rep.actionTaken || 'Đã khắc phục' },
        { label: 'Trạng thái', value: rep.status }
      ]
    });
  };

  // Confirm Sub-item Delete
  const handleConfirmDeleteSubItem = () => {
    if (!currentEquipment || !subItemToDelete) return;
    const { type, id } = subItemToDelete;
    let updated: Equipment = {
      ...currentEquipment,
      updatedAt: new Date().toISOString()
    };

    if (type === 'component') {
      updated.components = (currentEquipment.components || []).filter(c => c.id !== id);
    } else if (type === 'maint') {
      updated.maintenance = (currentEquipment.maintenance || []).filter(m => m.id !== id);
    } else if (type === 'repair') {
      updated.repair = (currentEquipment.repair || []).filter(r => r.id !== id);
    } else if (type === 'unit') {
      updated.managingUnits = (currentEquipment.managingUnits || []).filter(u => u.id !== id);
    } else if (type === 'licenseFrequency') {
      updated.licenseFrequency = (currentEquipment.licenseFrequency || []).filter(l => l.id !== id);
    } else if (type === 'licenseOperation') {
      updated.licenseOperation = (currentEquipment.licenseOperation || []).filter(l => l.id !== id);
    }

    onUpdateEquipment(updated);
    setSubItemToDelete(null);
  };

  // Add Managing Unit History Handler
  const handleAddUnitSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEquipment) return;
    const formData = new FormData(e.currentTarget);
    const newUnit: ManagingUnit = {
      id: 'unit-' + Date.now(),
      date: String(formData.get('date') || new Date().getFullYear().toString()),
      unitName: String(formData.get('unitName') || ''),
      status: String(formData.get('status') || 'Tốt')
    };
    const updated: Equipment = {
      ...currentEquipment,
      updatedAt: new Date().toISOString(),
      managingUnits: [...(currentEquipment.managingUnits || []), newUnit]
    };
    onUpdateEquipment(updated);
    setIsAddingUnitModal(false);
  };

  // Add License Handler
  const handleAddLicenseSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEquipment || !isAddingLicenseModal) return;
    const formData = new FormData(e.currentTarget);
    const newLic: LicenseItem = {
      id: 'lic-' + Date.now(),
      no: String(formData.get('no') || ''),
      expireDate: String(formData.get('expireDate') || '')
    };
    const field = isAddingLicenseModal === 'frequency' ? 'licenseFrequency' : 'licenseOperation';
    const updated: Equipment = {
      ...currentEquipment,
      updatedAt: new Date().toISOString(),
      [field]: [...(currentEquipment[field] || []), newLic]
    };
    onUpdateEquipment(updated);
    setIsAddingLicenseModal(null);
  };

  // Add New Equipment
  const handleCreateNewEquipment = (e: FormEvent) => {
    e.preventDefault();
    const newId = 'EQ-CNS-' + Date.now().toString().slice(-4);
    const newEquipment: Equipment = {
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      general: {
        name: newEqForm.name || 'Thiết bị CNS Mới',
        category: newEqForm.category,
        model: newEqForm.model || 'Model Chuẩn',
        manufacturer: newEqForm.manufacturer || 'Chưa rõ',
        serial: newEqForm.serial || 'SN-' + Date.now().toString().slice(-6),
        assetNo: newEqForm.assetNo || 'TSCD-' + Date.now().toString().slice(-4),
        yearMade: newEqForm.yearMade,
        origin: newEqForm.origin,
        commissioned: newEqForm.commissioned,
        status: 'Đang khai thác',
        priority: newEqForm.priority
      },
      org: {
        companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
        unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
        location: newEqForm.location || (newEqForm.stationName ? `Đài trạm ${newEqForm.stationName}` : 'Đài KSKL TSN'),
        stationName: newEqForm.stationName || 'AACC HCM',
        primaryEngineer: newEqForm.primaryEngineer,
        supervisor: 'KS. Trần Minh Trí',
        contactPhone: '028.3848.5383'
      },
      spec: {
        power: newEqForm.power,
        channelFreq: newEqForm.channelFreq,
        mgmtIp: '192.168.10.100',
        interface: 'VoIP ED-137C, LAN, E&M'
      },
      components: [
        { id: 'c1', no: 1, name: 'Khối máy chính Main Unit', partNo: 'MU-01', serial: 'SN-MU-' + Date.now().toString().slice(-4), qty: 1, healthStatus: 'Tốt' }
      ],
      maintenance: [],
      repair: []
    };
    onAddEquipment(newEquipment);
    setIsAddingEqModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* TOP KPI METRICS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left bg-white border rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer ${
            statusFilter === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-slate-500">Tổng Thiết Bị</p>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">{stats.total}</p>
          <span className="text-[11px] text-slate-500">Xem tất cả</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Đang khai thác')}
          className={`text-left bg-white border rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer ${
            statusFilter === 'Đang khai thác' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đang Khai Thác
          </p>
          <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">{stats.active}</p>
          <span className="text-[11px] text-slate-500">Lọc Online 24/7</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Đang bảo dưỡng')}
          className={`text-left bg-white border rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer ${
            statusFilter === 'Đang bảo dưỡng' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Đang Bảo Dưỡng
          </p>
          <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-0.5">{stats.maint}</p>
          <span className="text-[11px] text-slate-500">Lọc định kỳ</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Chờ sửa chữa')}
          className={`text-left bg-white border rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer ${
            statusFilter === 'Chờ sửa chữa' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-rose-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Chờ Sửa Chữa
          </p>
          <p className="text-2xl font-bold text-rose-700 font-mono tabular-nums mt-0.5">{stats.repair}</p>
          <span className="text-[11px] text-slate-500">Lọc sự cố</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-700">Khối Linh Kiện</p>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">{stats.totalComps}</p>
          <span className="text-[11px] text-slate-500">Phụ tùng & modul</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-700">Lượt Bảo Dưỡng</p>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">{stats.totalMaints}</p>
          <span className="text-[11px] text-slate-500">Nhật ký kỹ thuật</span>
        </div>
      </div>

      {/* TOP CONTROL & ACTIONS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-1 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="inp-search-equipment-top"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo Tên thiết bị, Tần số, Model hoặc Số Serial (SN)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 transition cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              id="filter-station"
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              aria-label="Lọc theo đài trạm CNS"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-900 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả 4 đài trạm</option>
              {CNS_STATIONS.map(st => (
                <option key={st} value={st}>Đài: {st}</option>
              ))}
            </select>

            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Lọc theo chủng loại CNS"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả chủng loại</option>
              {EQUIPMENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái khai thác"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đang khai thác">Đang khai thác</option>
              <option value="Đang bảo dưỡng">Đang bảo dưỡng</option>
              <option value="Chờ sửa chữa">Chờ sửa chữa</option>
              <option value="Dự phòng nóng">Dự phòng nóng</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap sm:flex-nowrap">
          <button
            id="btn-scan-qr-dashboard"
            onClick={onOpenQrScanner}
            title="Quét mã QR bằng Camera hoặc tải ảnh để mở trực tiếp file PDF của Sổ lý lịch"
            className="px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-200" />
            <span>Quét QR (Mở Sổ PDF)</span>
          </button>

          <button
            id="btn-add-equipment-modal"
            onClick={() => setIsAddingEqModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thiết Bị</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-save-sheets-batch"
              onClick={onOpenGoogleSheets}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isAutoSyncing
                  ? 'bg-emerald-700 text-white shadow-emerald-700/30 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={`Quản lý và đồng bộ Google Sheets: ${syncConfig?.spreadsheetName || DEFAULT_SHEET_TITLE}`}
            >
              {isAutoSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>
                {isAutoSyncing 
                  ? 'Đang đồng bộ...' 
                  : syncConfig?.autoSyncEnabled 
                  ? 'Google Sheets (Auto-Sync)' 
                  : 'Google Sheets'}
              </span>
            </button>

            {syncConfig?.spreadsheetUrl && (
              <a
                href={syncConfig.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl transition cursor-pointer shadow-2xs"
                title={`Mở trực tiếp file Google Sheet "${syncConfig.spreadsheetName || DEFAULT_SHEET_TITLE}"`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EQUIPMENT LIST SELECTOR */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Danh Sách Hồ Sơ Thiết Bị
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {filteredEquipments.length}/{equipments.length}
              </span>
            </div>
            {lastSavedTime && (
              <span className="text-[10px] text-emerald-700 font-mono font-medium">
                Đồng bộ: {new Date(lastSavedTime).toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>

          {/* Quick List Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="inp-search-equipment-list"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc nhanh tên thiết bị hoặc serial..."
              className="w-full pl-8.5 pr-7 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                title="Xóa bộ lọc"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[660px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredEquipments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs space-y-3 shadow-2xs">
                <Search className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <div>
                  <p className="font-semibold text-slate-800">Không tìm thấy thiết bị phù hợp</p>
                  <p className="text-[11px] text-slate-500 mt-1">Không có kết quả nào khớp với "{searchQuery}".</p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa tất cả bộ lọc</span>
                </button>
              </div>
            ) : (
              filteredEquipments.map((eq) => {
                const isSelected = currentEquipment?.id === eq.id;
                return (
                  <div
                    key={eq.id}
                    id={`eq-card-${eq.id}`}
                    onClick={() => onSelectEquipment(eq.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-50 border-blue-600 shadow-2xs ring-1 ring-blue-600'
                        : 'bg-white hover:bg-slate-50/70 border-slate-200 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{eq.general.category}</span>
                      <span className="flex items-center gap-1.5 font-medium text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          eq.general.status === 'Đang khai thác' ? 'bg-emerald-500' :
                          eq.general.status === 'Đang bảo dưỡng' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className={
                          eq.general.status === 'Đang khai thác' ? 'text-emerald-700 font-semibold' :
                          eq.general.status === 'Đang bảo dưỡng' ? 'text-amber-700 font-semibold' : 'text-rose-700 font-semibold'
                        }>{eq.general.status}</span>
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mt-1.5 line-clamp-1">
                      {renderHighlightedText(eq.general.name, searchQuery)}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-1">
                      <span>Model: <strong className="text-slate-700">{eq.general.model}</strong></span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>S/N: <strong className="text-slate-900 tabular-nums">{renderHighlightedText(eq.general.serial, searchQuery)}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 truncate max-w-[120px] font-medium text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{eq.org.stationName || eq.org.location}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums font-mono text-[11px] text-slate-600">
                          {eq.components?.length || 0} LK
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEquipment(eq.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title={`Xóa hồ sơ thiết bị "${eq.general.name}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE EQUIPMENT DETAILS & 7 SUB-TABS */}
        <div className="lg:col-span-8">
          {currentEquipment ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
              
              {/* Profile Header Banner */}
              <div className="bg-slate-900 p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <span className="font-semibold text-sky-400">{currentEquipment.general.category}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>ID: {currentEquipment.id}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-amber-300 font-medium">{currentEquipment.general.priority}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {currentEquipment.general.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{currentEquipment.org.companyName}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-200 font-medium">{currentEquipment.org.stationName || currentEquipment.org.location}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                  {/* Clone / Duplicate Button */}
                  <button
                    onClick={() => handleDuplicateEquipment(currentEquipment)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    title="Nhân bản thiết bị dự phòng (Standby Channel)"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Nhân Bản</span>
                  </button>

                  {onExportGoogleDoc && (
                    <button
                      onClick={() => onExportGoogleDoc(currentEquipment)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Xuất hồ sơ lý lịch thiết bị sang Google Docs (soạn thảo trực tuyến)"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Xuất Google Doc</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenQrLabelModal(currentEquipment)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    title="Xem mã QR & In tem dán thiết bị"
                  >
                    <QrCode className="w-3.5 h-3.5 text-sky-400" />
                    <span>Mã QR & Tem Nhãn</span>
                  </button>

                  <button
                    id="btn-print-active-eq"
                    onClick={() => onOpenPrintModal(currentEquipment)}
                    className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Mở Sổ lý lịch 8 trang chuẩn VATM dạng PDF và in ấn"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-700" />
                    <span>Mở Sổ PDF (A4)</span>
                  </button>

                  <button
                    id="btn-delete-active-eq"
                    onClick={() => onDeleteEquipment(currentEquipment.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Xóa thiết bị"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Tab Navigation (7 Comprehensive Sub-Tabs) */}
              <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2 gap-1 text-xs">
                <button
                  onClick={() => setSubTab('general')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    subTab === 'general'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  1. Lý Lịch Chung
                </button>

                <button
                  onClick={() => setSubTab('specs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    subTab === 'specs'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  2. Thông Số Kỹ Thuật
                </button>

                <button
                  onClick={() => setSubTab('components')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    subTab === 'components'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  3. Khối Linh Kiện ({currentEquipment.components?.length || 0})
                </button>

                <button
                  onClick={() => setSubTab('maintenance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    subTab === 'maintenance'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  4. Nhật Ký Bảo Dưỡng ({currentEquipment.maintenance?.length || 0})
                </button>

                <button
                  onClick={() => setSubTab('repair')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    subTab === 'repair'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  5. Sự Cố & Sửa Chữa ({currentEquipment.repair?.length || 0})
                </button>

                <button
                  onClick={() => setSubTab('transfer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    subTab === 'transfer'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  6. Điều Chuyển Đơn Vị ({currentEquipment.managingUnits?.length || 0})
                </button>

                <button
                  onClick={() => setSubTab('licenses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                    subTab === 'licenses'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  7. Giấy Phép & Tài Liệu ({ (currentEquipment.licenseFrequency?.length || 0) + (currentEquipment.licenseOperation?.length || 0) })
                </button>
              </div>

              {/* Sub-Tab Content Area */}
              <div className="p-5">
                
                {/* SUBTAB 1: LÝ LỊCH CHUNG */}
                {subTab === 'general' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Tên thiết bị:</label>
                        <input
                          type="text"
                          value={currentEquipment.general.name}
                          onChange={(e) => handleFieldChange('general', 'name', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Chủng loại CNS:</label>
                        <select
                          value={currentEquipment.general.category}
                          onChange={(e) => handleFieldChange('general', 'category', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        >
                          {EQUIPMENT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Ký hiệu / Model:</label>
                        <input
                          type="text"
                          value={currentEquipment.general.model}
                          onChange={(e) => handleFieldChange('general', 'model', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Số Serial:</label>
                        <input
                          type="text"
                          value={currentEquipment.general.serial}
                          onChange={(e) => handleFieldChange('general', 'serial', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-blue-700 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Mã tài sản (Mã TS):</label>
                        <input
                          type="text"
                          value={currentEquipment.general.assetNo || ''}
                          onChange={(e) => handleFieldChange('general', 'assetNo', e.target.value)}
                          placeholder="VD: TSCD-VHF-01"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Hãng sản xuất:</label>
                        <input
                          type="text"
                          value={currentEquipment.general.manufacturer}
                          onChange={(e) => handleFieldChange('general', 'manufacturer', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Nước sản xuất:</label>
                        <input
                          type="text"
                          value={currentEquipment.general.origin}
                          onChange={(e) => handleFieldChange('general', 'origin', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Năm sản xuất:</label>
                        <input
                          type="text"
                          value={currentEquipment.general.yearMade}
                          onChange={(e) => handleFieldChange('general', 'yearMade', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Ngày đưa vào khai thác:</label>
                        <input
                          type="date"
                          value={currentEquipment.general.commissioned}
                          onChange={(e) => handleFieldChange('general', 'commissioned', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Trạng thái khai thác:</label>
                        <select
                          value={currentEquipment.general.status}
                          onChange={(e) => handleFieldChange('general', 'status', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        >
                          <option value="Đang khai thác">Đang khai thác</option>
                          <option value="Đang bảo dưỡng">Đang bảo dưỡng</option>
                          <option value="Chờ sửa chữa">Chờ sửa chữa</option>
                          <option value="Dự phòng nóng">Dự phòng nóng</option>
                          <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Cấp độ ưu tiên:</label>
                        <select
                          value={currentEquipment.general.priority}
                          onChange={(e) => handleFieldChange('general', 'priority', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        >
                          <option value="Thiết bị nhóm 1">Thiết bị nhóm 1</option>
                          <option value="Thiết bị nhóm 2">Thiết bị nhóm 2</option>
                          <option value="Thiết bị nhóm 3">Thiết bị nhóm 3</option>
                          <option value="Thiết bị khác">Thiết bị khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Tổ Chức Quản Lý & Phân Công Trách Nhiệm Theo Đài Trạm
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Đài trạm CNS trực thuộc:</label>
                          <select
                            value={currentEquipment.org.stationName || 'AACC HCM'}
                            onChange={(e) => handleFieldChange('org', 'stationName', e.target.value)}
                            className="w-full bg-blue-50/70 border border-blue-300 focus:bg-white rounded-xl px-3.5 py-2 text-blue-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          >
                            {CNS_STATIONS.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Đơn vị quản lý:</label>
                          <input
                            type="text"
                            value={currentEquipment.org.unit}
                            onChange={(e) => handleFieldChange('org', 'unit', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Vị trí lắp đặt chi tiết:</label>
                          <input
                            type="text"
                            value={currentEquipment.org.location}
                            onChange={(e) => handleFieldChange('org', 'location', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Kỹ sư phụ trách:</label>
                          <input
                            type="text"
                            value={currentEquipment.org.primaryEngineer}
                            onChange={(e) => handleFieldChange('org', 'primaryEngineer', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-blue-700 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* MÃ QR ĐỊNH DANH & FILE PDF SỔ LÝ LỊCH */}
                    <div className="border border-slate-200 bg-slate-50/60 rounded-2xl p-4 sm:p-5 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              Mã QR Định Danh Sổ & File PDF Thiết Bị
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Quét mã QR từ điện thoại hoặc máy quét mã vạch để mở trực tiếp file PDF Sổ lý lịch tương ứng
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenQrLabelModal(currentEquipment)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            <span>In Tem Nhãn QR Dán Máy</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenPrintModal(currentEquipment)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-cyan-200" />
                            <span>Mở Sổ PDF (8 Trang)</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        {/* QR Code Preview Thumbnail */}
                        <div className="md:col-span-4 bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs flex flex-col items-center">
                          {currentQrDataUrl ? (
                            <img
                              src={currentQrDataUrl}
                              alt="QR Code"
                              className="w-36 h-36 object-contain rounded-lg border border-slate-100 p-1"
                            />
                          ) : (
                            <div className="w-36 h-36 bg-slate-100 rounded-lg flex items-center justify-center">
                              <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            </div>
                          )}

                          <span className="text-[10px] font-mono text-slate-500 mt-2 font-bold uppercase">
                            ID: {currentEquipment.id}
                          </span>

                          <div className="mt-2.5 w-full flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={handleCopyCurrentQrLink}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            >
                              {qrCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Paperclip className="w-3 h-3" />}
                              <span>{qrCopied ? 'Đã chép link' : 'Sao chép link'}</span>
                            </button>

                            <a
                              href={currentQrDataUrl}
                              download={`QR_${currentEquipment.general.model || currentEquipment.id}.png`}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>Tải ảnh QR</span>
                            </a>
                          </div>
                        </div>

                        {/* File PDF Attachment Configuration */}
                        <div className="md:col-span-8 space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                              <span>File PDF Đính Kèm (Bản scan sổ lý lịch gốc hoặc tài liệu kỹ thuật):</span>
                              {currentEquipment.pdfUrl && (
                                <a
                                  href={currentEquipment.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Mở tệp PDF ngay</span>
                                </a>
                              )}
                            </label>
                            <input
                              type="text"
                              value={currentEquipment.pdfUrl || ''}
                              onChange={(e) => {
                                const updated: Equipment = {
                                  ...currentEquipment,
                                  updatedAt: new Date().toISOString(),
                                  pdfUrl: e.target.value
                                };
                                onUpdateEquipment(updated);
                              }}
                              placeholder="Dán link Google Drive PDF, URL máy chủ nội bộ hoặc Cloud Storage..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              * Khi kỹ sư quét mã QR, hệ thống sẽ mở trực tiếp Sổ lý lịch điện tử PDF chuẩn VATM và cung cấp nút mở tệp PDF scan gốc này nếu có.
                            </span>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                              Tên hiển thị của tệp PDF scan:
                            </label>
                            <input
                              type="text"
                              value={currentEquipment.pdfFileName || ''}
                              onChange={(e) => {
                                const updated: Equipment = {
                                  ...currentEquipment,
                                  updatedAt: new Date().toISOString(),
                                  pdfFileName: e.target.value
                                };
                                onUpdateEquipment(updated);
                              }}
                              placeholder="VD: So_Ly_Lich_VHF_T6T_2014_Scan_Goc.pdf"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: THÔNG SỐ KỸ THUẬT */}
                {subTab === 'specs' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Công suất danh định:</label>
                        <input
                          type="text"
                          value={currentEquipment.spec.power || ''}
                          onChange={(e) => handleFieldChange('spec', 'power', e.target.value)}
                          placeholder="VD: 50W (CW/AM)"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Tần số hoạt động:</label>
                        <input
                          type="text"
                          value={currentEquipment.spec.channelFreq || ''}
                          onChange={(e) => handleFieldChange('spec', 'channelFreq', e.target.value)}
                          placeholder="VD: 118.100 MHz"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-blue-700 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Địa chỉ Quản lý IP:</label>
                        <input
                          type="text"
                          value={currentEquipment.spec.mgmtIp || ''}
                          onChange={(e) => handleFieldChange('spec', 'mgmtIp', e.target.value)}
                          placeholder="VD: 192.168.10.25"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Giao diện kết nối:</label>
                        <input
                          type="text"
                          value={currentEquipment.spec.interface || ''}
                          onChange={(e) => handleFieldChange('spec', 'interface', e.target.value)}
                          placeholder="VD: VoIP ED-137C, E&M, LAN"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Tầm phủ / Độ lợi:</label>
                        <input
                          type="text"
                          value={currentEquipment.spec.coverage || ''}
                          onChange={(e) => handleFieldChange('spec', 'coverage', e.target.value)}
                          placeholder="VD: Tầm phủ 150 NM"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Hệ số sóng đứng (VSWR):</label>
                        <input
                          type="text"
                          value={currentEquipment.spec.vswr || ''}
                          onChange={(e) => handleFieldChange('spec', 'vswr', e.target.value)}
                          placeholder="VD: 1.15 : 1"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">Mô tả tính năng và nguyên lý hoạt động:</label>
                      <textarea
                        rows={4}
                        value={currentEquipment.spec.text || ''}
                        onChange={(e) => handleFieldChange('spec', 'text', e.target.value)}
                        placeholder="Nhập ghi chú hoặc tính năng kỹ thuật chi tiết của thiết bị..."
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: DANH MỤC LINH KIỆN */}
                {subTab === 'components' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Danh sách các khối modul phần cứng, bo mạch xử lý, nguồn và linh kiện thay thế.
                      </p>
                      <button
                        id="btn-open-add-comp-modal"
                        onClick={() => setIsAddingCompModal(true)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Linh Kiện</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">STT</th>
                            <th className="p-3">Tên Khối / Linh Kiện</th>
                            <th className="p-3">Part No.</th>
                            <th className="p-3">Số Serial</th>
                            <th className="p-3">SL</th>
                            <th className="p-3">Tình Trạng</th>
                            <th className="p-3">Ghi Chú</th>
                            <th className="p-3 text-right">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(!currentEquipment.components || currentEquipment.components.length === 0) ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400">
                                Chưa có linh kiện nào được ghi nhận. Bấm "Thêm Linh Kiện" để bổ sung.
                              </td>
                            </tr>
                          ) : (
                            currentEquipment.components.map((comp, idx) => (
                              <tr key={comp.id || idx} className="hover:bg-slate-50/70 transition">
                                <td className="p-3 font-mono text-slate-500">{comp.no || idx + 1}</td>
                                <td className="p-3 font-semibold text-slate-900">{comp.name}</td>
                                <td className="p-3 font-mono text-slate-600">{comp.partNo || '---'}</td>
                                <td className="p-3 font-mono text-blue-700 font-bold">{comp.serial || '---'}</td>
                                <td className="p-3 font-mono text-slate-700">{comp.qty || 1}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    comp.healthStatus === 'Tốt' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                    comp.healthStatus === 'Cần theo dõi' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                    comp.healthStatus === 'Dự phòng' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                                    'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}>
                                    {comp.healthStatus || 'Tốt'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600">{comp.notes || '---'}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteComponent(comp.id)}
                                    className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Xóa linh kiện"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 4: NHẬT KÝ BẢO DƯỠNG */}
                {subTab === 'maintenance' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Theo dõi công tác bảo dưỡng kỹ thuật theo định kỳ hàng ngày, tuần, tháng, quý và năm.
                      </p>
                      <button
                        id="btn-open-add-maint-modal"
                        onClick={() => setIsAddingMaintModal(true)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Lượt Bảo Dưỡng</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Ngày</th>
                            <th className="p-3">Chu Kỳ</th>
                            <th className="p-3">Nội Dung Công Việc</th>
                            <th className="p-3">Thông Số Đo Kiểm</th>
                            <th className="p-3">Kết Quả</th>
                            <th className="p-3">Kỹ Sư Thực Hiện</th>
                            <th className="p-3 text-right">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(!currentEquipment.maintenance || currentEquipment.maintenance.length === 0) ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-400">
                                Chưa có ghi nhận bảo dưỡng phát sinh.
                              </td>
                            </tr>
                          ) : (
                            currentEquipment.maintenance.map((maint, idx) => (
                              <tr key={maint.id || idx} className="hover:bg-slate-50/70 transition">
                                <td className="p-3 font-mono text-slate-700 whitespace-nowrap">{maint.date}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200 whitespace-nowrap">
                                    {maint.cycle}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-900 max-w-xs">{maint.content}</td>
                                <td className="p-3 font-mono text-slate-600 text-[11px] max-w-xs">{maint.measuredParams || '---'}</td>
                                <td className="p-3">
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    {maint.result}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-700">{maint.person}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteMaint(maint.id)}
                                    className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Xóa bản ghi bảo dưỡng"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 5: SỰ CỐ & SỬA CHỮA */}
                {subTab === 'repair' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Hồ sơ sự cố bất thường, nguyên nhân, biện pháp khắc phục và linh kiện thay thế.
                      </p>
                      <button
                        id="btn-open-add-repair-modal"
                        onClick={() => setIsAddingRepairModal(true)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ghi Nhận Sự Cố</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-rose-200 shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-rose-50/80 text-slate-700 uppercase text-[10px] font-bold border-b border-rose-200">
                          <tr>
                            <th className="p-3">Ngày</th>
                            <th className="p-3">Hiện Tượng Sự Cố</th>
                            <th className="p-3">Nguyên Nhân Gốc</th>
                            <th className="p-3">Biện Pháp Khắc Phục</th>
                            <th className="p-3">Linh Kiện Thay Thế</th>
                            <th className="p-3">Người Xử Lý</th>
                            <th className="p-3">Trạng Thái</th>
                            <th className="p-3 text-right">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100 bg-white">
                          {(!currentEquipment.repair || currentEquipment.repair.length === 0) ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400">
                                Không có sự cố hỏng hóc nào được ghi nhận. Hệ thống đang hoạt động tin cậy 100%.
                              </td>
                            </tr>
                          ) : (
                            currentEquipment.repair.map((rep, idx) => (
                              <tr key={rep.id || idx} className="hover:bg-rose-50/40 transition">
                                <td className="p-3 font-mono text-slate-700 whitespace-nowrap">{rep.date}</td>
                                <td className="p-3 font-semibold text-rose-700 max-w-xs">{rep.incidentDescription}</td>
                                <td className="p-3 text-slate-600">{rep.rootCause || '---'}</td>
                                <td className="p-3 text-slate-800 font-medium">{rep.actionTaken || '---'}</td>
                                <td className="p-3 font-mono text-amber-700 font-semibold">{rep.replacedParts || '---'}</td>
                                <td className="p-3 text-slate-700">{rep.person}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {rep.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteRepair(rep.id)}
                                    className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Xóa nhật ký sự cố"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 6: QUẢN LÝ ĐIỀU CHUYỂN ĐƠN VỊ */}
                {subTab === 'transfer' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Theo dõi lịch sử bàn giao, điều chuyển giữa các đài trạm và đơn vị quản lý vận hành.
                      </p>
                      <button
                        onClick={() => setIsAddingUnitModal(true)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Lịch Sử Bàn Giao</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Thời Gian</th>
                            <th className="p-3">Đơn Vị Quản Lý / Tiếp Nhận</th>
                            <th className="p-3">Tình Trạng Khi Bàn Giao</th>
                            <th className="p-3 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(!currentEquipment.managingUnits || currentEquipment.managingUnits.length === 0) ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400">
                                Chưa có bản ghi điều chuyển đài trạm nào.
                              </td>
                            </tr>
                          ) : (
                            currentEquipment.managingUnits.map((u, idx) => (
                              <tr key={u.id || idx} className="hover:bg-slate-50/70 transition">
                                <td className="p-3 font-mono text-slate-700 font-bold">{u.date}</td>
                                <td className="p-3 font-semibold text-slate-900">{u.unitName}</td>
                                <td className="p-3 text-slate-700">{u.status}</td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubItemToDelete({
                                        type: 'unit',
                                        id: u.id,
                                        name: `Đơn vị: ${u.unitName}`,
                                        itemTypeLabel: 'Bản ghi điều chuyển bàn giao',
                                        details: [
                                          { label: 'Thời gian', value: u.date },
                                          { label: 'Đơn vị tiếp nhận', value: u.unitName },
                                          { label: 'Tình trạng', value: u.status }
                                        ]
                                      });
                                    }}
                                    className="p-1 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Xóa lịch sử bàn giao"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 7: GIẤY PHÉP & TÀI LIỆU KỸ THUẬT */}
                {subTab === 'licenses' && (
                  <div className="space-y-6">
                    {/* Giấy phép tần số & Khai thác */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Frequency Licenses */}
                      <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-blue-600" />
                            Giấy Phép Tần Số Vô Tuyến
                          </h4>
                          <button
                            onClick={() => setIsAddingLicenseModal('frequency')}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            + Thêm
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(!currentEquipment.licenseFrequency || currentEquipment.licenseFrequency.length === 0) ? (
                            <p className="text-[11px] text-slate-400 text-center py-4">Chưa có giấy phép tần số nào.</p>
                          ) : (
                            currentEquipment.licenseFrequency.map((lic, idx) => (
                              <div key={lic.id || idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-800 font-mono">{lic.no}</span>
                                  <span className="text-[10px] text-slate-500 block">Hạn: {lic.expireDate}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubItemToDelete({
                                      type: 'licenseFrequency',
                                      id: lic.id,
                                      name: `Giấy phép tần số số ${lic.no}`,
                                      itemTypeLabel: 'Giấy phép tần số',
                                      details: [
                                        { label: 'Số giấy phép', value: lic.no },
                                        { label: 'Hạn sử dụng', value: lic.expireDate }
                                      ]
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Xóa giấy phép"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Operation Licenses */}
                      <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Giấy Phép Khai Thác Đài Trạm (Cục HKVN)
                          </h4>
                          <button
                            onClick={() => setIsAddingLicenseModal('operation')}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            + Thêm
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(!currentEquipment.licenseOperation || currentEquipment.licenseOperation.length === 0) ? (
                            <p className="text-[11px] text-slate-400 text-center py-4">Chưa có giấy phép khai thác nào.</p>
                          ) : (
                            currentEquipment.licenseOperation.map((lic, idx) => (
                              <div key={lic.id || idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-800 font-mono">{lic.no}</span>
                                  <span className="text-[10px] text-slate-500 block">Hạn: {lic.expireDate}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubItemToDelete({
                                      type: 'licenseOperation',
                                      id: lic.id,
                                      name: `Giấy phép khai thác số ${lic.no}`,
                                      itemTypeLabel: 'Giấy phép khai thác đài trạm',
                                      details: [
                                        { label: 'Số giấy phép', value: lic.no },
                                        { label: 'Hạn sử dụng', value: lic.expireDate }
                                      ]
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Xóa giấy phép"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Technical Documents List */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-sky-600" />
                        Danh Mục Tài Liệu Kỹ Thuật Đi Kèm Thiết Bị
                      </h4>
                      <div className="space-y-2">
                        {(!currentEquipment.technicalDocs || currentEquipment.technicalDocs.length === 0) ? (
                          <p className="text-xs text-slate-400 py-2">Chưa có tài liệu hướng dẫn kỹ thuật nào.</p>
                        ) : (
                          currentEquipment.technicalDocs.map((doc, idx) => (
                            <div key={doc.id || idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{doc.name}</span>
                                <span className="text-[11px] text-slate-500 block">Số lượng: {doc.qty} · Ghi chú: {doc.notes || '---'}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3 shadow-2xs">
              <Server className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Chưa chọn thiết bị</h3>
              <p className="text-xs">Vui lòng chọn một thiết bị từ danh sách bên trái để xem và chỉnh sửa hồ sơ lý lịch chi tiết.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: THÊM THIẾT BỊ MỚI */}
      {isAddingEqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Thêm Hồ Sơ Thiết Bị CNS Mới
              </h3>
              <button
                onClick={() => setIsAddingEqModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <form onSubmit={handleCreateNewEquipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Tên thiết bị (*):</label>
                  <input
                    required
                    type="text"
                    value={newEqForm.name}
                    onChange={(e) => setNewEqForm({...newEqForm, name: e.target.value})}
                    placeholder="VD: Đài Radar Giám sát Tiếp cận PSR/SSR..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chủng loại CNS:</label>
                  <select
                    value={newEqForm.category}
                    onChange={(e) => setNewEqForm({...newEqForm, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {EQUIPMENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Model / Ký hiệu:</label>
                  <input
                    type="text"
                    value={newEqForm.model}
                    onChange={(e) => setNewEqForm({...newEqForm, model: e.target.value})}
                    placeholder="VD: STAR 2000 / RSM 970"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số Serial:</label>
                  <input
                    type="text"
                    value={newEqForm.serial}
                    onChange={(e) => setNewEqForm({...newEqForm, serial: e.target.value})}
                    placeholder="VD: SN-TH-2023-889"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-blue-700 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mã tài sản (Mã TS):</label>
                  <input
                    type="text"
                    value={newEqForm.assetNo}
                    onChange={(e) => setNewEqForm({...newEqForm, assetNo: e.target.value})}
                    placeholder="VD: TSCD-VHF-01"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cấp độ ưu tiên:</label>
                  <select
                    value={newEqForm.priority}
                    onChange={(e) => setNewEqForm({...newEqForm, priority: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Thiết bị nhóm 1">Thiết bị nhóm 1</option>
                    <option value="Thiết bị nhóm 2">Thiết bị nhóm 2</option>
                    <option value="Thiết bị nhóm 3">Thiết bị nhóm 3</option>
                    <option value="Thiết bị khác">Thiết bị khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hãng sản xuất:</label>
                  <input
                    type="text"
                    value={newEqForm.manufacturer}
                    onChange={(e) => setNewEqForm({...newEqForm, manufacturer: e.target.value})}
                    placeholder="VD: Thales / Rohde & Schwarz"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Đài trạm CNS trực thuộc (*):</label>
                  <select
                    value={newEqForm.stationName}
                    onChange={(e) => setNewEqForm({...newEqForm, stationName: e.target.value as any})}
                    className="w-full bg-blue-50/70 border border-blue-300 focus:bg-white rounded-xl px-3 py-2 text-blue-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {CNS_STATIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vị trí lắp đặt chi tiết:</label>
                  <input
                    type="text"
                    value={newEqForm.location}
                    onChange={(e) => setNewEqForm({...newEqForm, location: e.target.value})}
                    placeholder="VD: Trạm Radar Tân Sơn Nhất"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kỹ sư phụ trách:</label>
                  <input
                    type="text"
                    value={newEqForm.primaryEngineer}
                    onChange={(e) => setNewEqForm({...newEqForm, primaryEngineer: e.target.value})}
                    placeholder="VD: KS. Nguyễn Văn An"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingEqModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer transition"
                >
                  Lưu Thiết Bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM LINH KIỆN */}
      {isAddingCompModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Thêm Khối / Bo Mạch Linh Kiện
              </h3>
              <button onClick={() => setIsAddingCompModal(false)} className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer">✕ Đóng</button>
            </div>

            <form onSubmit={handleAddComponentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên khối linh kiện (*):</label>
                <input required name="name" placeholder="VD: Khối tiền khuếch đại LNA" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mã Part No:</label>
                  <input name="partNo" placeholder="VD: LNA-4200" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số Serial:</label>
                  <input name="serial" placeholder="VD: SN-9981" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-blue-700 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số lượng:</label>
                  <input type="number" name="qty" defaultValue={1} min={1} className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tình trạng:</label>
                  <select name="healthStatus" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                    <option value="Tốt">Tốt</option>
                    <option value="Cần theo dõi">Cần theo dõi</option>
                    <option value="Dự phòng">Dự phòng</option>
                    <option value="Hỏng">Hỏng</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ghi chú:</label>
                <input name="notes" placeholder="VD: Thay mới tháng 01/2025" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingCompModal(false)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM BẢO DƯỠNG */}
      {isAddingMaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Ghi Nhận Lượt Bảo Dưỡng Kỹ Thuật
              </h3>
              <button onClick={() => setIsAddingMaintModal(false)} className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer">✕ Đóng</button>
            </div>

            <form onSubmit={handleAddMaintSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ngày thực hiện:</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chu kỳ:</label>
                  <select name="cycle" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                    <option value="Hàng ngày">Hàng ngày</option>
                    <option value="Hàng tuần">Hàng tuần</option>
                    <option value="Hàng tháng">Hàng tháng</option>
                    <option value="3 tháng">3 tháng</option>
                    <option value="6 tháng">6 tháng</option>
                    <option value="1 năm">1 năm</option>
                    <option value="Đột xuất">Đột xuất</option>
                    <option value="Định kỳ">Định kỳ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nội dung bảo dưỡng (*):</label>
                <textarea required name="content" rows={2} placeholder="Mô tả các hạng mục kiểm tra, vệ sinh, đo kiểm..." className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-2.5 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Thông số đo đạc:</label>
                <input name="measuredParams" placeholder="VD: Tx Power: 50.2W; VSWR: 1.12; Mod: 88%" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kết quả:</label>
                  <select name="result" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                    <option value="Đạt yêu cầu">Đạt yêu cầu</option>
                    <option value="Chưa đạt">Chưa đạt</option>
                    <option value="Cần hiệu chuẩn">Cần hiệu chuẩn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kỹ sư thực hiện:</label>
                  <input name="person" defaultValue={currentEquipment?.org.primaryEngineer || 'Kỹ sư trực'} className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingMaintModal(false)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm">Lưu Ghi Nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM SỰ CỐ */}
      {isAddingRepairModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Ghi Nhận Sự Cố & Công Tác Sửa Chữa
              </h3>
              <button onClick={() => setIsAddingRepairModal(false)} className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer">✕ Đóng</button>
            </div>

            <form onSubmit={handleAddRepairSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ngày xảy ra sự cố:</label>
                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-rose-50/30 border border-rose-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mô tả hiện tượng sự cố (*):</label>
                <textarea required name="incidentDescription" rows={2} placeholder="Mô tả chi tiết cảnh báo, đèn báo hỏng, hiện tượng mất sóng..." className="w-full bg-rose-50/30 border border-rose-200 focus:bg-white rounded-xl p-2.5 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nguyên nhân gốc rễ:</label>
                <input name="rootCause" placeholder="VD: Hơi ẩm ngấm vào đầu nối cáp Feeder RF" className="w-full bg-rose-50/30 border border-rose-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Biện pháp khắc phục đã xử lý:</label>
                <textarea name="actionTaken" rows={2} placeholder="VD: Thay thế đầu nối N-Type, quấn băng cách điện 3M chống thấm..." className="w-full bg-rose-50/30 border border-rose-200 focus:bg-white rounded-xl p-2.5 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Linh kiện thay thế:</label>
                  <input name="replacedParts" placeholder="VD: Jack N-Type" className="w-full bg-rose-50/30 border border-rose-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Trạng thái:</label>
                  <select name="status" className="w-full bg-rose-50/30 border border-rose-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none">
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Chờ linh kiện">Chờ linh kiện</option>
                    <option value="Theo dõi">Theo dõi</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingRepairModal(false)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm">Ghi Nhận Sự Cố</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM LỊCH SỬ BÀN GIAO */}
      {isAddingUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Thêm Lịch Sử Bàn Giao / Điều Chuyển
              </h3>
              <button onClick={() => setIsAddingUnitModal(false)} className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer">✕ Đóng</button>
            </div>

            <form onSubmit={handleAddUnitSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Thời gian (Năm hoặc Ngày):</label>
                <input required name="date" placeholder="VD: 2024 hoặc 15/08/2024" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên đơn vị tiếp nhận:</label>
                <input required name="unitName" placeholder="VD: Đài KSKL Cần Thơ / Đài Thông Tin" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tình trạng thiết bị:</label>
                <input name="status" defaultValue="Tốt" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingUnitModal(false)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm">Lưu Bàn Giao</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM GIẤY PHÉP */}
      {isAddingLicenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                {isAddingLicenseModal === 'frequency' ? 'Thêm Giấy Phép Tần Số' : 'Thêm Giấy Phép Khai Thác'}
              </h3>
              <button onClick={() => setIsAddingLicenseModal(null)} className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer">✕ Đóng</button>
            </div>

            <form onSubmit={handleAddLicenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Số giấy phép (*):</label>
                <input required name="no" placeholder="VD: 373205/GP hoặc 5503/GP-CHK" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ngày hết hạn:</label>
                <input required name="expireDate" placeholder="VD: 30/06/2026 hoặc 28/10/2026" className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingLicenseModal(null)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition">Hủy</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm">Lưu Giấy Phép</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-ITEM DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={!!subItemToDelete}
        onClose={() => setSubItemToDelete(null)}
        onConfirm={handleConfirmDeleteSubItem}
        title={`Xác Nhận Xóa ${subItemToDelete?.itemTypeLabel || 'Dữ Liệu'}`}
        itemName={subItemToDelete?.name || ''}
        itemTypeLabel={subItemToDelete?.itemTypeLabel || 'Mục'}
        itemDetails={subItemToDelete?.details || []}
        warningText={`Hành động này sẽ xóa vĩnh viễn ${subItemToDelete?.itemTypeLabel.toLowerCase() || 'mục này'} khỏi hồ sơ thiết bị hiện tại. Thao tác này không thể hoàn tác.`}
        confirmButtonText="Xác Nhận Xóa"
      />

    </div>
  );
}
