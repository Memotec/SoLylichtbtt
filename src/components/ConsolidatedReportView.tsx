import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Search, 
  X, 
  ArrowLeft,
  Cpu,
  FileSpreadsheet,
  LayoutGrid,
  FileCode,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Equipment, CNS_STATIONS, EQUIPMENT_CATEGORIES } from '../types';

interface ConsolidatedReportViewProps {
  equipments: Equipment[];
  onSelectEquipment: (id: string) => void;
  onSwitchToDossier: () => void;
  onOpenPrintIndividualBooklet?: (equipment: Equipment) => void;
}

export function ConsolidatedReportView({
  equipments,
  onSelectEquipment,
  onSwitchToDossier,
  onOpenPrintIndividualBooklet
}: ConsolidatedReportViewProps) {
  // Filters state
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'station' | 'category'>('none');

  // Print & Layout Customization State
  const [paperOrientation, setPaperOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [paginationMode, setPaginationMode] = useState<'paged' | 'continuous'>('paged');
  const [rowsPerPage, setRowsPerPage] = useState<number>(8);
  const [fontScale, setFontScale] = useState<'standard' | 'compact'>('standard');
  const [activeScreenTab, setActiveScreenTab] = useState<'all' | 'paged_preview'>('all');
  const [previewPageIdx, setPreviewPageIdx] = useState<number>(0);

  // Filtered equipment list
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return equipments.filter(eq => {
      const matchCat = categoryFilter === 'ALL' || eq.general.category === categoryFilter;
      const matchStat = statusFilter === 'ALL' || eq.general.status === statusFilter;
      const rawStation = eq.org.stationName || eq.org.location || '';
      const matchSt = stationFilter === 'ALL' || eq.org.stationName === stationFilter || rawStation.includes(stationFilter);

      if (!q) return matchCat && matchStat && matchSt;

      const matchName = eq.general.name?.toLowerCase().includes(q);
      const matchSerial = eq.general.serial?.toLowerCase().includes(q);
      const matchModel = eq.general.model?.toLowerCase().includes(q);
      const matchAsset = eq.general.assetNo?.toLowerCase().includes(q);
      const matchFreq = eq.spec?.channelFreq?.toLowerCase().includes(q);
      const matchLocation = eq.org.location?.toLowerCase().includes(q) || eq.org.stationName?.toLowerCase().includes(q);
      const matchEngineer = eq.org.primaryEngineer?.toLowerCase().includes(q);
      const matchNotes = eq.technicalNotes?.toLowerCase().includes(q) || eq.spec?.technicalNotes?.toLowerCase().includes(q);

      return (matchName || matchSerial || matchModel || matchAsset || matchFreq || matchLocation || matchEngineer || matchNotes) && matchCat && matchStat && matchSt;
    });
  }, [equipments, searchQuery, categoryFilter, statusFilter, stationFilter]);

  // Executive summary statistics
  const summary = useMemo(() => {
    const total = filteredList.length;
    const active = filteredList.filter(e => e.general.status === 'Đang khai thác').length;
    const maint = filteredList.filter(e => e.general.status === 'Đang bảo dưỡng').length;
    const repair = filteredList.filter(e => e.general.status === 'Chờ sửa chữa').length;
    const standby = filteredList.filter(e => e.general.status === 'Dự phòng nóng').length;
    const stopped = filteredList.filter(e => e.general.status === 'Ngừng hoạt động').length;
    const totalComps = filteredList.reduce((acc, e) => acc + (e.components?.length || 0), 0);
    const activeRate = total > 0 ? (((active + standby) / total) * 100).toFixed(1) : '100.0';

    return { total, active, maint, repair, standby, stopped, totalComps, activeRate };
  }, [filteredList]);

  // Grouped equipment if grouping is selected
  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupName: 'Tất cả thiết bị', items: filteredList }];
    }

    const map: Record<string, Equipment[]> = {};
    filteredList.forEach(eq => {
      let key = '';
      if (groupBy === 'station') {
        key = eq.org.stationName || eq.org.location || 'Chưa phân đài trạm';
      } else {
        key = eq.general.category || 'Khác';
      }
      if (!map[key]) map[key] = [];
      map[key].push(eq);
    });

    return Object.entries(map).map(([groupName, items]) => ({
      groupName,
      items
    }));
  }, [filteredList, groupBy]);

  // Chunked pages for Smart Pagination mode (A4 Paged Book Mode)
  const pagedChunks = useMemo(() => {
    const chunks: Equipment[][] = [];
    for (let i = 0; i < filteredList.length; i += rowsPerPage) {
      chunks.push(filteredList.slice(i, i + rowsPerPage));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [filteredList, rowsPerPage]);

  const totalPages = pagedChunks.length;

  // Ensure preview page index is in range
  useEffect(() => {
    if (previewPageIdx >= totalPages) {
      setPreviewPageIdx(Math.max(0, totalPages - 1));
    }
  }, [totalPages, previewPageIdx]);

  // Dynamic Print Injection: forces browser print dialog to adopt exact orientation & margins
  const handlePrint = () => {
    let styleTag = document.getElementById('report-page-print-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'report-page-print-style';
      document.head.appendChild(styleTag);
    }
    
    if (paperOrientation === 'landscape') {
      styleTag.innerHTML = `
        @page {
          size: A4 landscape !important;
          margin: 6mm 8mm !important;
        }
      `;
    } else {
      styleTag.innerHTML = `
        @page {
          size: A4 portrait !important;
          margin: 8mm 8mm !important;
        }
      `;
    }

    setTimeout(() => {
      window.print();
    }, 60);
  };

  // Export report to CSV / Excel
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'Mã Thiết Bị (ID)',
      'Tên Trang Thiết Bị',
      'Chủng Loại CNS',
      'Ký Hiệu / Model',
      'Số Serial (S/N)',
      'Mã Tài Sản (TSCD)',
      'Số Sổ Lý Lịch',
      'Hãng Sản Xuất',
      'Nước Sản Xuất',
      'Năm Sản Xuất',
      'Ngày Đưa Vào Sử Dụng',
      'Đài Trạm / Vị Trí',
      'Tần Số / Tham Số',
      'Trạng Thái',
      'Cấp Ưu Tiên',
      'Số Khối Linh Kiện',
      'Lần Bảo Dưỡng Gần Nhất',
      'Giấy Phép VTĐ',
      'Giấy Phép Khai Thác',
      'Kỹ Sư Phụ Trách',
      'Ghi Chú Kỹ Thuật'
    ];

    const rows = filteredList.map((eq, idx) => {
      const latestMaint = eq.maintenance && eq.maintenance.length > 0
        ? `${eq.maintenance[eq.maintenance.length - 1].date} (${eq.maintenance[eq.maintenance.length - 1].result})`
        : 'Chưa có';
      const freqLic = eq.licenseFrequency && eq.licenseFrequency.length > 0
        ? `${eq.licenseFrequency[0].no} (Hạn: ${eq.licenseFrequency[0].expireDate})`
        : '---';
      const operLic = eq.licenseOperation && eq.licenseOperation.length > 0
        ? `${eq.licenseOperation[0].no} (Hạn: ${eq.licenseOperation[0].expireDate})`
        : '---';

      return [
        idx + 1,
        eq.id,
        `"${(eq.general.name || '').replace(/"/g, '""')}"`,
        `"${(eq.general.category || '').replace(/"/g, '""')}"`,
        `"${(eq.general.model || '').replace(/"/g, '""')}"`,
        `"${(eq.general.serial || '').replace(/"/g, '""')}"`,
        `"${(eq.general.assetNo || '').replace(/"/g, '""')}"`,
        `"${(eq.general.bookletNo || '').replace(/"/g, '""')}"`,
        `"${(eq.general.manufacturer || '').replace(/"/g, '""')}"`,
        `"${(eq.general.origin || '').replace(/"/g, '""')}"`,
        `"${(eq.general.yearMade || '').replace(/"/g, '""')}"`,
        `"${(eq.general.commissioned || '').replace(/"/g, '""')}"`,
        `"${(eq.org.stationName || eq.org.location || '').replace(/"/g, '""')}"`,
        `"${(eq.spec?.channelFreq || eq.spec?.power || '').replace(/"/g, '""')}"`,
        `"${(eq.general.status || '').replace(/"/g, '""')}"`,
        `"${(eq.general.priority || '').replace(/"/g, '""')}"`,
        eq.components?.length || 0,
        `"${latestMaint.replace(/"/g, '""')}"`,
        `"${freqLic.replace(/"/g, '""')}"`,
        `"${operLic.replace(/"/g, '""')}"`,
        `"${(eq.org.primaryEngineer || '').replace(/"/g, '""')}"`,
        `"${(eq.technicalNotes || eq.spec?.technicalNotes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_Tong_Hop_So_Ly_Lich_CNS_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  }, []);

  // Render Table Header Helper
  const renderTableHeader = () => (
    <thead className="bg-slate-100 text-black uppercase font-bold text-[9.5px] border-b border-black">
      <tr>
        <th className="border border-black p-1.5 text-center w-8">STT</th>
        <th className="border border-black p-1.5 min-w-[130px]">Tên Thiết Bị / Loại</th>
        <th className="border border-black p-1.5 min-w-[110px]">Model & Serial</th>
        <th className="border border-black p-1.5 min-w-[90px]">Mã TS / Số Sổ</th>
        <th className="border border-black p-1.5 min-w-[100px]">Hãng & Nước SX / Năm</th>
        <th className="border border-black p-1.5 min-w-[110px]">Đài Trạm & Vị Trí</th>
        <th className="border border-black p-1.5 min-w-[95px]">Tần Số / P danh định</th>
        <th className="border border-black p-1.5 text-center min-w-[90px]">Trạng Thái</th>
        <th className="border border-black p-1.5 text-center w-10">LK</th>
        <th className="border border-black p-1.5 min-w-[100px]">Bảo Dưỡng Gần Nhất</th>
        <th className="border border-black p-1.5 min-w-[120px]">Giấy Phép VTĐ & Khai Thác</th>
        <th className="border border-black p-1.5 min-w-[130px]">Kỹ Sư & Ghi Chú KT</th>
      </tr>
    </thead>
  );

  // Render Table Row Helper
  const renderTableRow = (eq: Equipment, overallIdx: number) => {
    const latestMaint = eq.maintenance && eq.maintenance.length > 0
      ? eq.maintenance[eq.maintenance.length - 1]
      : null;
    const freqLic = eq.licenseFrequency && eq.licenseFrequency.length > 0
      ? eq.licenseFrequency[0]
      : null;
    const operLic = eq.licenseOperation && eq.licenseOperation.length > 0
      ? eq.licenseOperation[0]
      : null;

    return (
      <tr 
        key={eq.id}
        onClick={() => {
          onSelectEquipment(eq.id);
          onSwitchToDossier();
        }}
        className="hover:bg-blue-50/50 transition cursor-pointer group break-inside-avoid"
        title="Bấm để xem chi tiết hồ sơ thiết bị này"
      >
        <td className="border border-black p-1.5 text-center font-mono font-medium">
          {overallIdx + 1}
        </td>

        <td className="border border-black p-1.5">
          <div className="font-bold text-slate-900 group-hover:text-blue-700 transition leading-snug">
            {eq.general.name}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Loại: <span className="font-semibold text-slate-700">{eq.general.category}</span>
          </div>
        </td>

        <td className="border border-black p-1.5 font-mono">
          <div className="font-bold text-slate-800 leading-snug">{eq.general.model}</div>
          <div className="text-[9px] text-blue-900 font-bold mt-0.5">
            SN: {eq.general.serial}
          </div>
        </td>

        <td className="border border-black p-1.5 font-mono text-[9.5px]">
          <div>TS: <strong className="text-slate-900">{eq.general.assetNo || '---'}</strong></div>
          {eq.general.bookletNo && (
            <div className="text-slate-600 text-[9px]">Sổ: {eq.general.bookletNo}</div>
          )}
        </td>

        <td className="border border-black p-1.5 text-[9.5px]">
          <div className="font-semibold text-slate-800 leading-snug">{eq.general.manufacturer}</div>
          <div className="text-slate-600 text-[9px]">{eq.general.origin} ({eq.general.yearMade})</div>
        </td>

        <td className="border border-black p-1.5">
          <div className="font-bold text-blue-900 leading-snug">{eq.org.stationName || 'AACC HCM'}</div>
          <div className="text-[9px] text-slate-600 line-clamp-1">{eq.org.location}</div>
        </td>

        <td className="border border-black p-1.5 font-mono text-[9.5px]">
          <div className="font-bold text-blue-800 leading-snug">{eq.spec?.channelFreq || '---'}</div>
          {eq.spec?.power && (
            <div className="text-slate-600 text-[9px]">P: {eq.spec.power}</div>
          )}
        </td>

        <td className="border border-black p-1.5 text-center">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
            eq.general.status === 'Đang khai thác' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            eq.general.status === 'Đang bảo dưỡng' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
            eq.general.status === 'Chờ sửa chữa' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
            'bg-slate-100 text-slate-800 border border-slate-300'
          }`}>
            {eq.general.status}
          </span>
        </td>

        <td className="border border-black p-1.5 text-center font-mono font-bold">
          {eq.components?.length || 0}
        </td>

        <td className="border border-black p-1.5 text-[9.5px]">
          {latestMaint ? (
            <div>
              <span className="font-mono font-bold text-slate-900">{latestMaint.date}</span>
              <div className="text-emerald-700 font-semibold text-[9px]">{latestMaint.result}</div>
            </div>
          ) : (
            <span className="text-slate-400 italic">Chưa ghi nhận</span>
          )}
        </td>

        <td className="border border-black p-1.5 text-[9px] font-mono">
          {freqLic ? (
            <div>
              VTĐ: <strong className="text-slate-900">{freqLic.no}</strong>
              <span className="block text-slate-500 text-[8.5px]">Hạn: {freqLic.expireDate}</span>
            </div>
          ) : null}
          {operLic ? (
            <div className="mt-0.5">
              KT: <strong className="text-slate-900">{operLic.no}</strong>
              <span className="block text-slate-500 text-[8.5px]">Hạn: {operLic.expireDate}</span>
            </div>
          ) : null}
          {!freqLic && !operLic && (
            <span className="text-slate-400 italic">Theo giấy phép đài</span>
          )}
        </td>

        <td className="border border-black p-1.5 text-[9.5px]">
          <div className="font-bold text-blue-900">{eq.org.primaryEngineer}</div>
          {(eq.technicalNotes || eq.spec?.technicalNotes) ? (
            <div className="text-slate-700 italic line-clamp-1 mt-0.5 bg-slate-50 p-0.5 rounded border border-slate-200 text-[8.5px]">
              {eq.technicalNotes || eq.spec?.technicalNotes}
            </div>
          ) : (
            <span className="text-slate-400 italic">---</span>
          )}
        </td>
      </tr>
    );
  };

  // Render Official Signature Block Helper
  const renderSignatureBlock = () => (
    <div className="report-signature-block pt-6 mt-6 border-t border-black space-y-4 break-inside-avoid">
      <div className="text-[11px] leading-relaxed space-y-0.5">
        <p><strong>* Ghi chú và khuyến nghị của bộ phận kỹ thuật:</strong></p>
        <p className="italic text-slate-700">
          1. Báo cáo tổng hợp số liệu kỹ thuật, tình trạng vận hành và nhật ký bảo dưỡng được trích xuất trực tiếp từ Hệ thống Sổ lý lịch thiết bị CNS điện tử - VATM.
        </p>
        <p className="italic text-slate-700">
          2. Các thiết bị đang trong trạng thái "Đang bảo dưỡng" hoặc "Chờ sửa chữa" phải được tổ chức kỹ thuật trực ban theo dõi sát sao, tuân thủ đúng quy trình an toàn bảo đảm hoạt động bay.
        </p>
      </div>

      {/* 3 Signature Boxes */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs pt-2">
        <div className="space-y-1">
          <p className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</p>
          <p className="text-[10px] italic text-slate-600">(Ký, ghi rõ họ tên)</p>
          <div className="h-16"></div>
          <p className="font-bold text-slate-800">KS. Trực ban Kỹ thuật CNS</p>
        </div>

        <div className="space-y-1">
          <p className="font-bold uppercase">ĐỘI TRƯỞNG / TRƯỞNG ĐÀI TRẠM</p>
          <p className="text-[10px] italic text-slate-600">(Ký, ghi rõ họ tên)</p>
          <div className="h-16"></div>
          <p className="font-bold text-slate-800">KS. Phụ trách Đài Trạm</p>
        </div>

        <div className="space-y-1">
          <p className="font-bold uppercase">GIÁM ĐỐC TRUNG TÂM / PHÊ DUYỆT</p>
          <p className="text-[10px] italic text-slate-600">(Ký tên, đóng dấu)</p>
          <div className="h-16"></div>
          <p className="font-bold text-slate-800">Lãnh Đạo Trung Tâm BĐKT</p>
        </div>
      </div>

      <div className="text-center text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-200">
        HỆ THỐNG QUẢN LÝ SỔ LÝ LỊCH THIẾT BỊ CNS · CÔNG TY QUẢN LÝ BAY MIỀN NAM (VATM)
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* TOP HEADER CONTROLS (SCREEN ONLY - HIDDEN IN PRINT) */}
      {/* ========================================================================= */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchToDossier}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="Quay lại danh mục hồ sơ kỹ thuật"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Biểu Mẫu Chuẩn VATM
                </span>
                <span className="text-xs text-slate-500 font-mono">CNS Dossier Master Report</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                Báo Cáo Tổng Hợp Sổ Lý Lịch Thiết Bị
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Xuất bảng báo cáo ra file Excel / CSV chuẩn UTF-8"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="In báo cáo trực tiếp hoặc xuất PDF chuẩn A4 không bị nhảy trang"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>In Báo Cáo / Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* PRINT SETTINGS DEDICATED PANEL */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-blue-900">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              Cấu hình Trang In & Xuất PDF Chuẩn Khổ A4 (Chống Nhảy Trang):
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Định dạng sẽ tự động đồng bộ khi mở hộp thoại in
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Hướng Giấy In */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Hướng trang in A4:</label>
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setPaperOrientation('landscape')}
                  className={`flex-1 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    paperOrientation === 'landscape'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Khổ Ngang</span>
                  <span className="text-[9px] opacity-80">(Đề xuất)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperOrientation('portrait')}
                  className={`flex-1 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    paperOrientation === 'portrait'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Khổ Dọc</span>
                </button>
              </div>
            </div>

            {/* Chế Độ Ngắt Trang */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Kiểu ngắt trang:</label>
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setPaginationMode('paged')}
                  className={`flex-1 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    paginationMode === 'paged'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Phân trang A4 độc lập, có tiêu đề và số trang trên từng trang in, không bao giờ bị nhảy trang"
                >
                  <span>Trang A4 Chuẩn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaginationMode('continuous')}
                  className={`flex-1 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    paginationMode === 'continuous'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="In liên tục dòng chảy tự nhiên"
                >
                  <span>Dòng Chảy</span>
                </button>
              </div>
            </div>

            {/* Số Dòng / Trang (Khi dùng Trang A4 chuẩn) */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Số thiết bị / trang in:</label>
              <select
                disabled={paginationMode !== 'paged'}
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-500 focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                <option value={6}>6 thiết bị / trang (Thoáng đãng, rộng rãi)</option>
                <option value={8}>8 thiết bị / trang (Chuẩn khổ ngang)</option>
                <option value={10}>10 thiết bị / trang (Tối ưu số trang)</option>
                <option value={12}>12 thiết bị / trang (Thu gọn tối đa)</option>
              </select>
            </div>

            {/* Cỡ Chữ Bảng In */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Cỡ chữ in ấn:</label>
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setFontScale('standard')}
                  className={`flex-1 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                    fontScale === 'standard'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Chuẩn (10pt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale('compact')}
                  className={`flex-1 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                    fontScale === 'compact'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Thu Gọn (9pt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, serial, model, tần số..."
              className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Station Filter */}
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-900 font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả đài trạm ({equipments.length})</option>
            {CNS_STATIONS.map(st => (
              <option key={st} value={st}>Đài trạm: {st}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả chủng loại</option>
            {EQUIPMENT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Đang khai thác">Đang khai thác</option>
            <option value="Đang bảo dưỡng">Đang bảo dưỡng</option>
            <option value="Chờ sửa chữa">Chờ sửa chữa</option>
            <option value="Dự phòng nóng">Dự phòng nóng</option>
            <option value="Ngừng hoạt động">Ngừng hoạt động</option>
          </select>

          {/* Group By Filter */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="none">Không nhóm (Danh sách liên tục)</option>
            <option value="station">Nhóm theo Đài trạm</option>
            <option value="category">Nhóm theo Chủng loại</option>
          </select>
        </div>

      </div>

      {/* KPI STATS OVERVIEW (SCREEN ONLY) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Tổng Thiết Bị Báo Cáo</p>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">{summary.total}</p>
          <span className="text-[11px] text-slate-400">Hồ sơ sổ lý lịch</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đang Khai Thác
          </p>
          <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">{summary.active}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Sẵn sàng 24/7 ({summary.activeRate}%)</span>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Đang Bảo Dưỡng
          </p>
          <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-0.5">{summary.maint}</p>
          <span className="text-[11px] text-amber-700">Định kỳ kỹ thuật</span>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-rose-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Chờ Sửa Chữa
          </p>
          <p className="text-2xl font-bold text-rose-700 font-mono tabular-nums mt-0.5">{summary.repair}</p>
          <span className="text-[11px] text-rose-700">Theo dõi sự cố</span>
        </div>

        <div className="bg-white border border-sky-200 bg-sky-50/20 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-sky-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Dự Phòng Nóng
          </p>
          <p className="text-2xl font-bold text-sky-700 font-mono tabular-nums mt-0.5">{summary.standby}</p>
          <span className="text-[11px] text-sky-700">Standby Channel</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            Khối Linh Kiện
          </p>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">{summary.totalComps}</p>
          <span className="text-[11px] text-slate-500">Modul & phụ tùng</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHUẨN FORM BÁO CÁO HÀNH CHÍNH & IN ẤN CHỐNG NHẢY TRANG                   */}
      {/* ========================================================================= */}

      {/* CASE 1: PAGED A4 BOOK MODE (CHẾ ĐỘ TỪNG TRANG A4 - CHỐNG NHẢY TRANG 100%) */}
      {paginationMode === 'paged' ? (
        <div className="report-print-container space-y-8">
          {pagedChunks.map((chunk, pageIdx) => {
            const isFirstPage = pageIdx === 0;
            const isLastPage = pageIdx === totalPages - 1;
            const startIdx = pageIdx * rowsPerPage;

            return (
              <div 
                key={`report-page-${pageIdx}`}
                className={`report-page-sheet bg-white border border-slate-300 rounded-2xl shadow-sm p-6 sm:p-8 text-black font-sans relative flex flex-col justify-between ${
                  fontScale === 'compact' ? 'text-[10px]' : 'text-[11px]'
                } ${paperOrientation === 'landscape' ? 'landscape' : 'portrait'}`}
                style={{
                  minHeight: paperOrientation === 'landscape' ? '680px' : '980px'
                }}
              >
                <div className="space-y-4 flex-1">
                  
                  {/* HEADER BANNER: FULL ON PAGE 1, COMPACT ON SUBSEQUENT PAGES */}
                  {isFirstPage ? (
                    <div className="space-y-4 report-header-banner">
                      {/* TIÊU NGỮ & CƠ QUAN BAN HÀNH CHUẨN QUỐC GIA / VATM */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-black">
                        <div className="text-center sm:text-left text-xs uppercase leading-relaxed font-bold">
                          <p className="text-[11px] font-medium text-slate-700">TỔNG CÔNG TY QUẢN LÝ BAY VIỆT NAM</p>
                          <p className="text-xs font-bold text-black">CÔNG TY QUẢN LÝ BAY MIỀN NAM</p>
                          <p className="text-[11px] text-slate-800 border-b border-black inline-block pb-0.5">TRUNG TÂM BẢO ĐẢM KỸ THUẬT</p>
                          <p className="text-[10px] normal-case text-slate-600 font-mono mt-1">Số: ... /BC-BĐKT-CNS</p>
                        </div>

                        <div className="text-center text-xs leading-relaxed">
                          <p className="font-bold uppercase text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                          <p className="font-bold border-b border-black inline-block pb-0.5">Độc lập - Tự do - Hạnh phúc</p>
                          <p className="italic text-[11px] mt-1.5 text-slate-700">
                            TP. Hồ Chí Minh, {todayStr}
                          </p>
                        </div>
                      </div>

                      {/* REPORT TITLE */}
                      <div className="text-center py-2 space-y-1">
                        <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
                          BÁO CÁO TỔNG HỢP THEO DÕI SỔ LÝ LỊCH TRANG THIẾT BỊ CNS
                        </h1>
                        <p className="text-xs text-slate-800 italic">
                          (Bảng kê hiện trạng kỹ thuật, linh kiện, kiểm tra bảo dưỡng và giấy phép khai thác)
                        </p>
                        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-600 font-mono pt-0.5">
                          <span>Phạm vi: <strong>{stationFilter === 'ALL' ? 'Toàn bộ các Đài trạm' : `Đài trạm ${stationFilter}`}</strong></span>
                          <span>·</span>
                          <span>Tổng số: <strong>{filteredList.length} thiết bị</strong></span>
                          <span>·</span>
                          <span>Ngày xuất: <strong>{new Date().toLocaleDateString('vi-VN')}</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* COMPACT RUNNING HEADER ON PAGE > 1 */
                    <div className="flex items-center justify-between pb-3 border-b border-black text-[10px] uppercase font-bold text-slate-700 report-header-banner">
                      <span>CÔNG TY QUẢN LÝ BAY MIỀN NAM · TRUNG TÂM BẢO ĐẢM KỸ THUẬT</span>
                      <span className="normal-case italic font-normal text-slate-500">
                        Báo Cáo Tổng Hợp Sổ Lý Lịch Thiết Bị CNS (Tiếp theo - Trang {pageIdx + 1}/{totalPages})
                      </span>
                    </div>
                  )}

                  {/* BẢNG DỮ LIỆU CỦA TRANG HIỆN TẠI */}
                  <div className="overflow-x-auto border border-black rounded-lg">
                    <table className="w-full text-left border-collapse border border-black">
                      {renderTableHeader()}
                      <tbody className="divide-y divide-black/30">
                        {chunk.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="p-8 text-center text-slate-400">
                              Không có dữ liệu thiết bị phù hợp với bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          chunk.map((eq, cIdx) => renderTableRow(eq, startIdx + cIdx))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* NẾU LÀ TRANG CUỐI: HIỂN THỊ KHỐI CHỮ KÝ PHÊ DUYỆT */}
                  {isLastPage && renderSignatureBlock()}
                </div>

                {/* FOOTER OF EACH A4 PAGE */}
                <div className="pt-3 mt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>HỆ THỐNG SỔ LÝ LỊCH THIẾT BỊ CNS · VATM</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    Trang {pageIdx + 1} / {totalPages}
                  </span>
                  <span>{new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CASE 2: CONTINUOUS FLOW MODE */
        <div className="report-print-container bg-white border border-slate-300 rounded-2xl shadow-sm p-6 sm:p-10 text-black font-sans">
          
          {/* TIÊU NGỮ & CƠ QUAN */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-black report-header-banner">
            <div className="text-center sm:text-left text-xs uppercase leading-relaxed font-bold">
              <p className="text-[11px] font-medium text-slate-700">TỔNG CÔNG TY QUẢN LÝ BAY VIỆT NAM</p>
              <p className="text-xs font-bold text-black">CÔNG TY QUẢN LÝ BAY MIỀN NAM</p>
              <p className="text-[11px] text-slate-800 border-b border-black inline-block pb-0.5">TRUNG TÂM BẢO ĐẢM KỸ THUẬT</p>
              <p className="text-[10px] normal-case text-slate-600 font-mono mt-1">Số: ... /BC-BĐKT-CNS</p>
            </div>

            <div className="text-center text-xs leading-relaxed">
              <p className="font-bold uppercase text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-bold border-b border-black inline-block pb-0.5">Độc lập - Tự do - Hạnh phúc</p>
              <p className="italic text-[11px] mt-2 text-slate-700">
                TP. Hồ Chí Minh, {todayStr}
              </p>
            </div>
          </div>

          {/* REPORT TITLE BANNER */}
          <div className="text-center py-6 space-y-1.5 report-header-banner">
            <h1 className="text-base sm:text-xl font-bold uppercase tracking-wide text-black">
              BÁO CÁO TỔNG HỢP THEO DÕI SỔ LÝ LỊCH TRANG THIẾT BỊ CNS
            </h1>
            <p className="text-xs sm:text-sm text-slate-800 italic">
              (Bảng kê hiện trạng kỹ thuật, linh kiện, kiểm tra bảo dưỡng và giấy phép khai thác)
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-600 font-mono pt-1">
              <span>Phạm vi: <strong>{stationFilter === 'ALL' ? 'Toàn bộ các Đài trạm' : `Đài trạm ${stationFilter}`}</strong></span>
              <span>·</span>
              <span>Tổng số: <strong>{filteredList.length} thiết bị</strong></span>
              <span>·</span>
              <span>Ngày kết xuất: <strong>{new Date().toLocaleDateString('vi-VN')}</strong></span>
            </div>
          </div>

          {/* CONTINUOUS TABLE */}
          <div className="space-y-6">
            {groupedData.map((group) => (
              <div key={group.groupName} className="space-y-2">
                {groupBy !== 'none' && (
                  <div className="bg-slate-100 border border-slate-300 px-3.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold text-slate-900 break-inside-avoid">
                    <span className="uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      {group.groupName}
                    </span>
                    <span className="font-mono text-slate-600 font-semibold">{group.items.length} thiết bị</span>
                  </div>
                )}

                <div className="overflow-x-auto border border-black rounded-lg">
                  <table className="w-full text-left border-collapse border border-black">
                    {renderTableHeader()}
                    <tbody className="divide-y divide-black/30">
                      {group.items.map((eq, idx) => renderTableRow(eq, idx))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* SIGNATURE BLOCK */}
          {renderSignatureBlock()}
        </div>
      )}

    </div>
  );
}
