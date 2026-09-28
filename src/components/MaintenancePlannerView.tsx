import { useState, useMemo } from 'react';
import { 
  Wrench, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Plus, 
  Search, 
  User, 
  MapPin, 
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { Equipment, MaintenanceRecord, CNS_STATIONS } from '../types';

interface MaintenancePlannerViewProps {
  equipments: Equipment[];
  onSelectEquipment: (id: string) => void;
  onUpdateEquipment: (updated: Equipment) => void;
  onOpenPrintModal: (equipment: Equipment) => void;
}

export function MaintenancePlannerView({
  equipments,
  onSelectEquipment,
  onUpdateEquipment,
  onOpenPrintModal
}: MaintenancePlannerViewProps) {
  const [cycleFilter, setCycleFilter] = useState<string>('ALL');
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickSignSuccessId, setQuickSignSuccessId] = useState<string | null>(null);

  // Extract all unique stations (standard 4 stations)
  const stations = CNS_STATIONS;

  // Aggregate all maintenance records with equipment references
  const allMaintRecords = useMemo(() => {
    const list: {
      equipment: Equipment;
      record: MaintenanceRecord;
    }[] = [];

    equipments.forEach(eq => {
      (eq.maintenance || []).forEach(m => {
        list.push({ equipment: eq, record: m });
      });
    });

    // Sort by date descending (newest first)
    return list.sort((a, b) => {
      return (b.record.date || '').localeCompare(a.record.date || '');
    });
  }, [equipments]);

  // Filtered maintenance list
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allMaintRecords.filter(({ equipment, record }) => {
      const matchCycle = cycleFilter === 'ALL' || record.cycle === cycleFilter;
      const rawStation = equipment.org.stationName || equipment.org.location || '';
      const matchStation = stationFilter === 'ALL' || equipment.org.stationName === stationFilter || rawStation.includes(stationFilter);
      
      if (!q) return matchCycle && matchStation;

      const matchText = 
        equipment.general.name.toLowerCase().includes(q) ||
        equipment.general.serial.toLowerCase().includes(q) ||
        record.content.toLowerCase().includes(q) ||
        record.person.toLowerCase().includes(q) ||
        (record.measuredParams || '').toLowerCase().includes(q);

      return matchCycle && matchStation && matchText;
    });
  }, [allMaintRecords, cycleFilter, stationFilter, searchQuery]);

  // Quick Sign Ca Trực Handler (Adds today's maintenance check)
  const handleQuickSignToday = (equipment: Equipment) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: MaintenanceRecord = {
      id: 'maint-quick-' + Date.now(),
      date: todayStr,
      cycle: 'Hàng ngày',
      content: 'Kiểm tra thông số kỹ thuật, công suất phát, nguồn điện và độ ổn định liên lạc ca trực.',
      measuredParams: 'Thông số RF & nguồn điện ổn định, đạt tiêu chuẩn khai thác.',
      result: 'Đạt yêu cầu',
      person: equipment.org.primaryEngineer || 'Kỹ sư trực ca',
      signed: true
    };

    const updated: Equipment = {
      ...equipment,
      updatedAt: new Date().toISOString(),
      maintenance: [newRecord, ...(equipment.maintenance || [])]
    };

    onUpdateEquipment(updated);
    setQuickSignSuccessId(equipment.id);
    setTimeout(() => setQuickSignSuccessId(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Kế Hoạch & Nhật Ký Bảo Dưỡng Kỹ Thuật Định Kỳ
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Quản lý quy trình bảo dưỡng phòng ngừa (Preventative Maintenance) theo chu kỳ Hàng ngày, Tuần, Tháng, Quý và Năm.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-slate-500 block text-[10px]">Tổng Lượt Bảo Dưỡng</span>
            <span className="font-bold text-slate-900 text-base">{allMaintRecords.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-emerald-700 block text-[10px]">Tỷ Lệ Đạt Chuẩn</span>
            <span className="font-bold text-emerald-800 text-base">100%</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung bảo dưỡng, tên thiết bị, kỹ sư..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả chu kỳ</option>
            <option value="Hàng ngày">Hàng ngày</option>
            <option value="Hàng tuần">Hàng tuần</option>
            <option value="Hàng tháng">Hàng tháng</option>
            <option value="3 tháng">3 tháng (Quý)</option>
            <option value="6 tháng">6 tháng (Bán niên)</option>
            <option value="1 năm">1 năm (Hàng năm)</option>
            <option value="Định kỳ">Định kỳ tổng thể</option>
          </select>

          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả đài trạm</option>
            {stations.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Equipment Quick Sign Section */}
      <div className="bg-gradient-to-br from-sky-50/70 via-blue-50/40 to-white border border-sky-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Ký Xác Nhận Nhanh Ca Trực (Quick Daily Sign-Off)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chọn thiết bị để tự động thêm nhật ký kiểm tra định kỳ hôm nay ({new Date().toLocaleDateString('vi-VN')})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipments.slice(0, 6).map(eq => {
            const isJustSigned = quickSignSuccessId === eq.id;
            return (
              <div 
                key={eq.id}
                className="p-3 bg-white border border-sky-100 rounded-xl flex items-center justify-between shadow-2xs hover:border-blue-300 transition"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{eq.general.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    SN: {eq.general.serial} · {eq.org.stationName || eq.org.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickSignToday(eq)}
                  disabled={isJustSigned}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                    isJustSigned
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-transparent'
                  }`}
                >
                  {isJustSigned ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã ký</span>
                    </>
                  ) : (
                    <span>Ký ca trực</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Nhật Ký Bảo Dưỡng Toàn Hệ Thống ({filteredRecords.length} Bản Ghi)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Sắp xếp theo ngày gần nhất</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Ngày</th>
                <th className="p-3">Thiết Bị & Đài Trạm</th>
                <th className="p-3">Chu Kỳ</th>
                <th className="p-3">Nội Dung Thực Hiện</th>
                <th className="p-3">Thông Số Đo Kiểm</th>
                <th className="p-3">Kết Quả</th>
                <th className="p-3">Kỹ Sư Trực</th>
                <th className="p-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy bản ghi bảo dưỡng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(({ equipment, record }, idx) => (
                  <tr key={record.id || idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-slate-700 font-bold whitespace-nowrap">
                      {record.date}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 line-clamp-1">{equipment.general.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        SN: {equipment.general.serial} · {equipment.org.stationName || equipment.org.location}
                      </p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 whitespace-nowrap">
                        {record.cycle}
                      </span>
                    </td>
                    <td className="p-3 text-slate-800 font-medium max-w-xs">{record.content}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px] max-w-xs">{record.measuredParams || '---'}</td>
                    <td className="p-3">
                      <span className="text-emerald-700 font-bold flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {record.result}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{record.person}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          onSelectEquipment(equipment.id);
                          onOpenPrintModal(equipment);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition cursor-pointer"
                      >
                        Mở Sổ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
