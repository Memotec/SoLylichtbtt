import { useState, useMemo } from 'react';
import { 
  MapPin, 
  Radio, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Printer, 
  QrCode, 
  User, 
  Phone,
  Shield,
  Layers,
  ChevronRight,
  Building2,
  Calendar,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { Equipment, CNS_STATIONS, STATION_METADATA_LIST, CnsStationName } from '../types';

interface StationDirectoryViewProps {
  equipments: Equipment[];
  onSelectEquipment: (id: string) => void;
  onOpenPrintModal: (equipment: Equipment) => void;
  onOpenQrLabelModal: (equipment: Equipment) => void;
  onSwitchToDossier: () => void;
}

export function StationDirectoryView({
  equipments,
  onSelectEquipment,
  onOpenPrintModal,
  onOpenQrLabelModal,
  onSwitchToDossier
}: StationDirectoryViewProps) {
  const [selectedStation, setSelectedStation] = useState<string>('ALL');

  // Group equipment by the 4 standard stations (fallback for legacy names)
  const stationGroups = useMemo(() => {
    const groups: Record<string, Equipment[]> = {};
    
    // Initialize standard 4 stations
    CNS_STATIONS.forEach(st => {
      groups[st] = [];
    });

    equipments.forEach(eq => {
      const rawStation = eq.org.stationName || eq.org.location || '';
      let matchedStation: string = 'AACC HCM';

      if (rawStation.includes('AACC') || rawStation.includes('Tân Sơn Nhất') || rawStation.includes('TSN')) {
        matchedStation = 'AACC HCM';
      } else if (rawStation.includes('ATCC') || rawStation.includes('Trần Quốc Hoàn') || rawStation.includes('ACC')) {
        matchedStation = 'ATCC HCM';
      } else if (rawStation.includes('BQ New') || rawStation.includes('BQ Mới')) {
        matchedStation = 'BQ New';
      } else if (rawStation.includes('BQ') || rawStation.includes('BQ old') || rawStation.includes('BQ Cũ')) {
        matchedStation = 'BQ old';
      } else {
        matchedStation = 'AACC HCM';
      }

      if (!groups[matchedStation]) {
        groups[matchedStation] = [];
      }
      groups[matchedStation].push(eq);
    });

    return groups;
  }, [equipments]);

  const stationsList = CNS_STATIONS;

  const displayedStations = useMemo(() => {
    if (selectedStation === 'ALL') return stationsList;
    return [selectedStation as CnsStationName];
  }, [selectedStation, stationsList]);

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Danh Mục 4 Đài Trạm CNS - Quản Lý Bay Miền Nam
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Quản lý tập trung hạ tầng thiết bị kỹ thuật theo 4 cụm đài trạm trọng điểm: <strong>AACC HCM</strong>, <strong>ATCC HCM</strong>, <strong>BQ old</strong>, và <strong>BQ New</strong>.
          </p>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          <button
            onClick={() => setSelectedStation('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedStation === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả đài trạm ({equipments.length})
          </button>
          {stationsList.map(st => (
            <button
              key={st}
              onClick={() => setSelectedStation(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedStation === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{st}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedStation === st ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {stationGroups[st]?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4 STATIONS KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATION_METADATA_LIST.map((meta) => {
          const count = stationGroups[meta.name]?.length || 0;
          const active = (stationGroups[meta.name] || []).filter(e => e.general.status === 'Đang khai thác').length;
          const isSelected = selectedStation === meta.name;

          return (
            <div
              key={meta.id}
              onClick={() => setSelectedStation(selectedStation === meta.name ? 'ALL' : meta.name)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {meta.code}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {active}/{count} online
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  {meta.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {meta.role}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-0.5 font-medium">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Phụ trách:</span>
                  <strong className="text-slate-800">{meta.supervisor}</strong>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Hotline:</span>
                  <span className="font-mono text-slate-700">{meta.contactPhone}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* STATION DETAILED CARDS */}
      <div className="space-y-6">
        {displayedStations.map(stationName => {
          const eqList = stationGroups[stationName] || [];
          const meta = STATION_METADATA_LIST.find(m => m.name === stationName);
          const activeCount = eqList.filter(e => e.general.status === 'Đang khai thác').length;
          const supervisor = meta?.supervisor || eqList[0]?.org.supervisor || 'KS. Trực ban đài';
          const primaryEngineer = meta?.primaryEngineer || eqList[0]?.org.primaryEngineer || 'Đội Kỹ thuật';
          const phone = meta?.contactPhone || eqList[0]?.org.contactPhone || '028.3848.5383';
          const location = meta?.location || eqList[0]?.org.location || 'TP. Hồ Chí Minh';
          const description = meta?.description || '';

          return (
            <div key={stationName} className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
              
              {/* Station Header Bar */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-sky-400 font-bold uppercase tracking-wider">
                      Cụm Đài Trạm Kỹ Thuật CNS
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-300 font-medium">
                      Công ty Quản lý bay miền Nam (VATM)
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-sky-400" />
                    <span>{meta ? meta.fullName : stationName}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 font-mono">
                    <span className="text-emerald-400 font-bold">{activeCount} / {eqList.length}</span>
                    <span>Hệ thống online</span>
                  </div>
                </div>
              </div>

              {/* Station Description & Location Bar */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Vị trí: <strong>{location}</strong></span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phụ trách đài: <strong className="text-slate-900">{supervisor}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Đội kỹ thuật: <strong className="text-slate-900">{primaryEngineer}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-bold text-slate-800">{phone}</span>
                    </span>
                  </div>
                </div>
                {description && (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {/* Equipment Grid for this Station */}
              {eqList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Chưa có thiết bị nào được gán cho đài trạm {stationName}.
                </div>
              ) : (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eqList.map(eq => (
                    <div
                      key={eq.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            {eq.general.category}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${
                            eq.general.status === 'Đang khai thác' ? 'bg-emerald-500' :
                            eq.general.status === 'Đang bảo dưỡng' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2">
                          {eq.general.name}
                        </h4>

                        <div className="mt-2 space-y-1 text-[11px] text-slate-500 font-mono">
                          <p>Model: <strong className="text-slate-700">{eq.general.model}</strong></p>
                          <p>S/N: <strong className="text-slate-900">{eq.general.serial}</strong></p>
                          {eq.spec.channelFreq && (
                            <p className="text-blue-700 font-semibold truncate">f: {eq.spec.channelFreq}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            onSelectEquipment(eq.id);
                            onSwitchToDossier();
                          }}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem hồ sơ</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenQrLabelModal(eq)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="In tem nhãn QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenPrintModal(eq)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Mở Sổ PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
