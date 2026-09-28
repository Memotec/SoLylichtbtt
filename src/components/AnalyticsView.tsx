import { useMemo } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Award,
  AlertOctagon,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';
import { Equipment } from '../types';

interface AnalyticsViewProps {
  equipments: Equipment[];
  onSelectEquipment: (id: string) => void;
  onOpenGoogleSheets: () => void;
  onOpenPrintModal: (equipment?: Equipment) => void;
}

export function AnalyticsView({
  equipments,
  onSelectEquipment,
  onOpenGoogleSheets,
  onOpenPrintModal
}: AnalyticsViewProps) {
  // Analytical Calculations
  const stats = useMemo(() => {
    const total = equipments.length;
    const active = equipments.filter(e => e.general.status === 'Đang khai thác').length;
    const maint = equipments.filter(e => e.general.status === 'Đang bảo dưỡng').length;
    const repair = equipments.filter(e => e.general.status === 'Chờ sửa chữa').length;
    const standby = equipments.filter(e => e.general.status === 'Dự phòng nóng').length;

    // Availability Rate (% Uptime)
    const availabilityRate = total > 0 ? ((active + standby) / total) * 100 : 100;

    // Category Breakdown
    const categories: Record<string, number> = {};
    equipments.forEach(eq => {
      const cat = eq.general.category || 'Khác';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Total components and health breakdown
    let totalComps = 0;
    let goodComps = 0;
    let warnComps = 0;
    let faultComps = 0;
    let spareComps = 0;

    equipments.forEach(eq => {
      (eq.components || []).forEach(comp => {
        totalComps++;
        if (comp.healthStatus === 'Tốt') goodComps++;
        else if (comp.healthStatus === 'Cần theo dõi') warnComps++;
        else if (comp.healthStatus === 'Hỏng' || comp.healthStatus === 'Đang sửa chữa') faultComps++;
        else spareComps++;
      });
    });

    // Maintenance compliance and recent activity
    let totalMaintRecords = 0;
    let totalRepairs = 0;
    let openRepairs = 0;

    equipments.forEach(eq => {
      totalMaintRecords += eq.maintenance?.length || 0;
      totalRepairs += eq.repair?.length || 0;
      openRepairs += eq.repair?.filter(r => r.status !== 'Đã hoàn thành').length || 0;
    });

    // Licenses expiring check
    const currentYear = new Date().getFullYear();
    const expiringLicenses: { eqName: string; type: string; licenseNo: string; expireDate: string; eqId: string }[] = [];

    equipments.forEach(eq => {
      eq.licenseFrequency?.forEach(lf => {
        if (lf.expireDate && (lf.expireDate.includes(String(currentYear)) || lf.expireDate.includes(String(currentYear + 1)))) {
          expiringLicenses.push({
            eqName: eq.general.name,
            type: 'Giấy phép tần số',
            licenseNo: lf.no,
            expireDate: lf.expireDate,
            eqId: eq.id
          });
        }
      });
      eq.licenseOperation?.forEach(lo => {
        if (lo.expireDate && (lo.expireDate.includes(String(currentYear)) || lo.expireDate.includes(String(currentYear + 1)))) {
          expiringLicenses.push({
            eqName: eq.general.name,
            type: 'Giấy phép khai thác',
            licenseNo: lo.no,
            expireDate: lo.expireDate,
            eqId: eq.id
          });
        }
      });
    });

    return {
      total,
      active,
      maint,
      repair,
      standby,
      availabilityRate: availabilityRate.toFixed(2),
      categories,
      totalComps,
      goodComps,
      warnComps,
      faultComps,
      spareComps,
      totalMaintRecords,
      totalRepairs,
      openRepairs,
      expiringLicenses
    };
  }, [equipments]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ĐỘ TIN CẬY KHAI THÁC 24/7
            </span>
            <span className="text-xs text-slate-400">Chuẩn Hàng Không ICAO & Cục HKVN</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Bảng Chỉ Số Tin Cậy & Khả Dụng Hệ Thống CNS
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Giám sát độ khả dụng (Operational Availability), theo dõi thời gian hoạt động ổn định (MTBF), 
            quản lý hạn giấy phép tần số/khai thác và chất lượng linh kiện toàn bộ đài trạm.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-xs min-w-[200px]">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tỷ lệ khả dụng toàn mạng</span>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight mt-1">
            {stats.availabilityRate}%
          </div>
          <span className="text-[10px] text-emerald-300/80 font-medium mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đạt tiêu chuẩn an toàn bay
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đang Khai Thác & Dự Phòng</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{stats.active + stats.standby}</span>
            <span className="text-xs text-slate-500">/ {stats.total} hệ thống</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.availabilityRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bảo Dưỡng & Hiệu Chuẩn</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{stats.maint}</span>
            <span className="text-xs text-slate-500">hệ thống đang bảo dưỡng</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Tổng cộng <strong className="text-slate-800 font-mono">{stats.totalMaintRecords}</strong> lượt kiểm tra kỹ thuật
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sự Cố Đang Xử Lý</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600">{stats.openRepairs}</span>
            <span className="text-xs text-slate-500">vấn đề mở</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Tổng số sự cố lịch sử: <strong className="text-slate-800 font-mono">{stats.totalRepairs}</strong> (Đã khắc phục {stats.totalRepairs - stats.openRepairs})
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Linh Kiện & Khối Modul</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{stats.totalComps}</span>
            <span className="text-xs text-slate-500">khối linh kiện</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            <span className="text-emerald-700 font-semibold">{stats.goodComps} tốt</span> · <span className="text-amber-700 font-semibold">{stats.warnComps} theo dõi</span> · <span className="text-rose-700 font-semibold">{stats.faultComps} hỏng</span>
          </p>
        </div>
      </div>

      {/* Breakdown Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Chủng loại thiết bị & Ma trận linh kiện */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Chủng loại CNS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600" />
                Phân Bố Thiết Bị Theo Chuyên Ngành CNS
              </h3>
              <span className="text-xs text-slate-500 font-medium">Toàn mạng quản lý</span>
            </div>

            <div className="space-y-3">
              {Object.entries(stats.categories).map(([catName, count]) => {
                const numCount = Number(count) || 0;
                const totalCount = Number(stats.total) || 1;
                const pct = ((numCount / totalCount) * 100).toFixed(0);
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{catName}</span>
                      <span className="font-mono text-slate-600 font-bold">{numCount} hệ thống ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sức khỏe linh kiện */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-blue-600" />
              Tình Trạng Sức Khỏe Khối Linh Kiện & Modul Dự Phòng
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-800">Tốt & Đạt Chuẩn</span>
                <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{stats.goodComps}</p>
                <span className="text-[10px] text-emerald-600">{((stats.goodComps / Math.max(1, stats.totalComps)) * 100).toFixed(0)}%</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[11px] font-semibold text-amber-800">Cần Theo Dõi</span>
                <p className="text-xl font-bold font-mono text-amber-700 mt-1">{stats.warnComps}</p>
                <span className="text-[10px] text-amber-600">{((stats.warnComps / Math.max(1, stats.totalComps)) * 100).toFixed(0)}%</span>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl">
                <span className="text-[11px] font-semibold text-sky-800">Dự Phòng Kho</span>
                <p className="text-xl font-bold font-mono text-sky-700 mt-1">{stats.spareComps}</p>
                <span className="text-[10px] text-sky-600">{((stats.spareComps / Math.max(1, stats.totalComps)) * 100).toFixed(0)}%</span>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[11px] font-semibold text-rose-800">Hỏng / Sửa Chữa</span>
                <p className="text-xl font-bold font-mono text-rose-700 mt-1">{stats.faultComps}</p>
                <span className="text-[10px] text-rose-600">{((stats.faultComps / Math.max(1, stats.totalComps)) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Theo dõi hạn Giấy phép tần số & Giấy phép khai thác */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Giám Sát Hạn Giấy Phép Kỹ Thuật
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {stats.expiringLicenses.length} Hồ sơ
              </span>
            </div>

            <p className="text-xs text-slate-500 my-3">
              Tự động rà soát hạn hiệu lực Giấy phép tần số vô tuyến điện và Giấy phép khai thác đài trạm CNS từ Cục Hàng không VN:
            </p>

            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {stats.expiringLicenses.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <FileCheck2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  Tất cả các giấy phép đều còn hạn sử dụng hợp lệ.
                </div>
              ) : (
                stats.expiringLicenses.map((lic, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectEquipment(lic.eqId)}
                    className="p-3 bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-sky-300 rounded-xl transition cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 line-clamp-1">{lic.eqName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 whitespace-nowrap">
                        {lic.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 font-mono">
                      <span>Số: <strong className="text-slate-800">{lic.licenseNo}</strong></span>
                      <span className="text-amber-700 font-bold">Hạn: {lic.expireDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={onOpenGoogleSheets}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất báo cáo Giấy phép</span>
              </button>

              <button
                onClick={() => onOpenPrintModal()}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Xem Sổ Lý Lịch</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
