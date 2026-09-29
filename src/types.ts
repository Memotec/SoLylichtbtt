export interface ComponentItem {
  id: string;
  no: number;
  name: string;
  partNo: string;
  serial: string;
  qty: number;
  healthStatus: 'Tốt' | 'Cần theo dõi' | 'Dự phòng' | 'Hỏng' | 'Đang sửa chữa';
  notes?: string;
}

export interface ManagingUnit {
  id: string;
  date: string;
  unitName: string;
  status: string;
}

export interface LicenseItem {
  id: string;
  no: string;
  expireDate: string;
}

export interface TechnicalDocItem {
  id: string;
  no: number;
  name: string;
  qty: number | string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  cycle: 'Hàng ngày' | 'Hàng tuần' | 'Hàng tháng' | '3 tháng' | '6 tháng' | '1 năm' | 'Đột xuất' | 'Định kỳ';
  content: string;
  measuredParams: string;
  result: 'Đạt yêu cầu' | 'Chưa đạt' | 'Cần hiệu chuẩn' | 'Đã xử lý';
  person: string;
  signed?: boolean;
}

export interface RepairRecord {
  id: string;
  date: string;
  incidentDescription: string;
  rootCause: string;
  actionTaken: string;
  replacedParts?: string;
  person: string;
  status: 'Đã hoàn thành' | 'Đang xử lý' | 'Chờ linh kiện' | 'Theo dõi';
}

export const CNS_STATIONS = [
  'AACC HCM',
  'ATCC HCM',
  'BQ old',
  'BQ New'
] as const;

export type CnsStationName = typeof CNS_STATIONS[number];

export interface StationMetadata {
  id: string;
  name: CnsStationName;
  code: string;
  fullName: string;
  role: string;
  location: string;
  supervisor: string;
  primaryEngineer: string;
  contactPhone: string;
  description: string;
  establishedYear: string;
}

export const STATION_METADATA_LIST: StationMetadata[] = [
  {
    id: 'AACC_HCM',
    name: 'AACC HCM',
    code: 'AACC-HCM',
    fullName: 'Trung tâm Kiểm soát Tiếp cận - Tại sân Hồ Chí Minh (AACC HCM)',
    role: 'Kiểm soát Tiếp cận (APP) & Tại sân (TWR Tân Sơn Nhất)',
    location: 'Sân bay Quốc tế Tân Sơn Nhất, TP. Hồ Chí Minh',
    supervisor: 'KS. Trần Minh Trí',
    primaryEngineer: 'Đội Kỹ thuật Tiếp cận & Đài KSKL',
    contactPhone: '028.3848.5383',
    description: 'Chịu trách nhiệm quản lý khai thác các hệ thống thông tin liên lạc VHF không - địa, chuyển mạch thoại VCCS, radar sơ cấp/thứ cấp và hệ thống dẫn đường tiếp cận hạ cánh TSN.',
    establishedYear: '2006'
  },
  {
    id: 'ATCC_HCM',
    name: 'ATCC HCM',
    code: 'ATCC-HCM',
    fullName: 'Trung tâm Kiểm soát Đường dài Hồ Chí Minh (ATCC HCM)',
    role: 'Kiểm soát Vùng thông báo bay (FIR Hồ Chí Minh - ACC HCM)',
    location: 'Số 22 Trần Quốc Hoàn, Phường 4, Q. Tân Bình, TP. Hồ Chí Minh',
    supervisor: 'KS. Nguyễn Hoàng Nam',
    primaryEngineer: 'Đội Kỹ thuật Tự động hóa & Đường dài',
    contactPhone: '028.3844.2464',
    description: 'Trung tâm quản lý điều hành các hệ thống xử lý dữ liệu bay ATM/ATC, mạng viễn thông hàng không cố định AFTN/AMHS, radar giám sát đường dài và liên lạc tầm xa.',
    establishedYear: '2015'
  },
  {
    id: 'BQ_OLD',
    name: 'BQ old',
    code: 'BQ-OLD',
    fullName: 'Đài / Trạm CNS BQ Cũ (Trạm BQ old)',
    role: 'Đài Thông tin - Dẫn đường - Giám sát khu vực BQ (Cụm thiết bị Hiện hữu)',
    location: 'Khu vực đài trạm BQ (Vị trí trạm BQ Cũ)',
    supervisor: 'KS. Lê Quốc Hưng',
    primaryEngineer: 'Đội Kỹ thuật Đài Trạm BQ',
    contactPhone: '0908.120.900',
    description: 'Trạm kỹ thuật CNS phụ trách các đài phát/thu VHF dự phòng, hệ thống nguồn điện đảm bảo hoạt động liên tục và thiết bị dẫn đường phụ trợ.',
    establishedYear: '2010'
  },
  {
    id: 'BQ_NEW',
    name: 'BQ New',
    code: 'BQ-NEW',
    fullName: 'Đài / Trạm CNS BQ Mới (Trạm BQ New)',
    role: 'Đài Thông tin - Dẫn đường - Giám sát thế hệ mới BQ (Cụm thiết bị Nâng cấp)',
    location: 'Khu vực đài trạm BQ mới (Vị trí trạm BQ New)',
    supervisor: 'KS. Phạm Quốc Huy',
    primaryEngineer: 'Đội Kỹ thuật Công nghệ Mới BQ',
    contactPhone: '0912.888.999',
    description: 'Trạm kỹ thuật CNS hiện đại hóa với các máy phát/thu VHF kỹ thuật số VoIP ED-137C, trạm giám sát ADS-B đa điểm, hệ thống đo cự ly DME và năng lượng xanh.',
    establishedYear: '2022'
  }
];

export const EQUIPMENT_CATEGORIES = [
  'VHF',
  'HF',
  'VIBA',
  'VSAT',
  'Ghép kênh',
  'ADS-B',
  'Nokia',
  'Firewall',
  'Tổng Đài',
  'Thiết bị khác'
] as const;

export type EquipmentCategory = typeof EQUIPMENT_CATEGORIES[number];

export interface Equipment {
  id: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
  pdfFileName?: string;
  technicalNotes?: string;
  general: {
    name: string;
    category: EquipmentCategory | string;
    model: string;
    manufacturer: string;
    serial: string;
    assetNo: string;
    bookletNo?: string;
    yearMade: string;
    origin: string;
    commissioned: string;
    usageTime?: string;
    warrantyPeriod?: string;
    status: 'Đang khai thác' | 'Đang bảo dưỡng' | 'Chờ sửa chữa' | 'Dự phòng nóng' | 'Ngừng hoạt động';
    priority: 'Thiết bị nhóm 1' | 'Thiết bị nhóm 2' | 'Thiết bị nhóm 3' | 'Thiết bị khác' | string;
  };
  org: {
    companyName: string;
    unit: string;
    location: string;
    stationName?: CnsStationName | string;
    primaryEngineer: string;
    supervisor: string;
    contactPhone?: string;
  };
  spec: {
    power?: string;
    channelFreq?: string;
    mgmtIp?: string;
    interface?: string;
    coverage?: string;
    vswr?: string;
    powerSupply?: string;
    modulation?: string;
    polarization?: string;
    sensitivity?: string;
    text?: string;
    fullSpecText?: string;
    customLines?: string[];
    technicalNotes?: string;
  };
  managingUnits?: ManagingUnit[];
  licenseFrequency?: LicenseItem[];
  licenseOperation?: LicenseItem[];
  technicalDocs?: TechnicalDocItem[];
  components: ComponentItem[];
  maintenance: MaintenanceRecord[];
  repair: RepairRecord[];
}

export interface PerformanceBenchmark {
  title: string;
  category: string;
  oldDurationMs: number;
  optimizedDurationMs: number;
  speedupMultiplier: number;
  oldMethod: string;
  optimizedMethod: string;
  description: string;
  gasImpact: string;
}

export interface ScriptFileItem {
  name: string;
  type: 'gs' | 'html' | 'json';
  description: string;
  code: string;
  tags: string[];
}
