import { Equipment } from '../types';

export const INITIAL_EQUIPMENTS: Equipment[] = [
  // ==========================================
  // ĐÀI TRẠM 1: AACC HCM (Tiếp cận & Tại sân)
  // ==========================================
  {
    id: 'EQ-AACC-PARK-AIR-T6T',
    createdAt: '2014-11-01T08:00:00.000Z',
    updatedAt: '2025-04-03T10:30:00.000Z',
    pdfFileName: 'So_Ly_Lich_VHF_PARK_AIR_T6T_AACC.pdf',
    pdfUrl: 'https://cdn.vatm.vn/docs/cns/sample_vhf_t6t_booklet.pdf',
    general: {
      name: 'Máy phát VHF liên lạc không - địa T6T (VHF PARK AIR T6T)',
      category: 'VHF',
      model: 'T6T MK6 50W',
      manufacturer: 'PARK AIR',
      serial: '6U11654',
      assetNo: '10314082501420',
      bookletNo: '09 (120.9 TxM)',
      yearMade: '2014',
      origin: 'ENGLAND (Vương Quốc Anh)',
      commissioned: '2014-11-15',
      usageTime: 'Sử dụng từ 11/2014',
      warrantyPeriod: '12 tháng',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'ĐÀI THÔNG TIN / TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
      location: 'Đài KSKL Tân Sơn Nhất (Trạm VHF B9)',
      stationName: 'AACC HCM',
      primaryEngineer: 'Đội Thông Tin (Đội TT)',
      supervisor: 'KS. Trần Minh Trí',
      contactPhone: '028.3848.5383'
    },
    spec: {
      power: '50W',
      channelFreq: '118.000 – 136.975 MHz (Kênh 120.900 MHz)',
      mgmtIp: '192.168.10.19',
      interface: 'VoIP ED-137B/C, E&M 4-wire, V.24, LAN/RS-232',
      coverage: 'Tầm phủ liên lạc không - địa 150 NM',
      vswr: '1.12 : 1',
      text: 'Liên lạc thoại không - địa; điều chế AM; Tần số VHF; Dải tần 118 – 136.975 MHz; Phân cực đứng; Công suất 50W; Công nghệ thể rắn; Nguồn điện AC 220V/50Hz; DC 24 – 31V.',
      fullSpecText: 'Liên lạc thoại không - địa; điều chế AM; Tần số VHF; Dải tần 118 – 136.975 MHz; Phân cực đứng; Công suất 50W; Công nghệ thể rắn; Nguồn điện AC 220V/50Hz; DC 24 – 31V.'
    },
    managingUnits: [
      { id: 'mu-1', date: '2014', unitName: 'Đài Thông Tin AACC HCM', status: 'Tốt' }
    ],
    licenseFrequency: [
      { id: 'lf-1', no: '220043/GP', expireDate: '30/06/2016' },
      { id: 'lf-7', no: '373205/GP', expireDate: '30/06/2026' }
    ],
    licenseOperation: [
      { id: 'lo-1', no: '4380/GP-CHK', expireDate: '03/11/2016' },
      { id: 'lo-8', no: '5503/GP-CHK', expireDate: '28/10/2026' }
    ],
    technicalDocs: [
      { id: 'td-1', no: 1, name: 'T6T MK6 50W VHF Transmitter User Documentation', qty: '01', notes: 'Tài liệu hướng dẫn kỹ thuật và vận hành kèm theo máy' }
    ],
    components: [
      { id: 'c-t6t-1', no: 1, name: 'VHF Tx Park Air T6T (Máy phát VHF đồng bộ)', partNo: 'T6T-MK6-50W', serial: '6U11654', qty: 1, healthStatus: 'Tốt', notes: 'Đồng bộ nguyên bộ máy chính' },
      { id: 'c-t6t-2', no: 2, name: 'Bộ nguồn chuyển mạch PSU AC/DC 28V', partNo: 'PSU-T6-28V', serial: '6P9921', qty: 1, healthStatus: 'Tốt', notes: 'Nguồn chính hoạt động ổn định' }
    ],
    maintenance: [
      { id: 'm-01', date: '20/03/2025', cycle: 'Định kỳ', content: 'Kiểm tra thông số & kết nối: OK. Vệ sinh thiết bị: OK', measuredParams: 'P: 50W; f: 120.900MHz; VSWR: 1.12; AC: 220V; DC: 28V', result: 'Đạt yêu cầu', person: 'Đội TT', signed: true }
    ],
    repair: [
      { id: 'rep-01', date: '10/10/2017', incidentDescription: 'Hỏng máy phát VHF, báo lỗi khối công suất RF', rootCause: 'Lỗi suy giảm công suất RF trong ca trực', actionTaken: 'Hỏng, đã gửi đi sửa chữa tại xưởng kỹ thuật', replacedParts: 'Khối PA và bộ lọc đầu ra', person: 'Đội TT', status: 'Đã hoàn thành' }
    ]
  },
  {
    id: 'EQ-AACC-RS-4200',
    createdAt: '2021-06-10T08:00:00.000Z',
    updatedAt: '2025-02-15T14:30:00.000Z',
    general: {
      name: 'Máy phát VHF Không Địa Chính (Main Tx TWR TSN)',
      category: 'VHF/UHF',
      model: 'R&S Series 4200 (XU4200)',
      manufacturer: 'Rohde & Schwarz',
      serial: 'RS-4200-VN-8849',
      assetNo: 'TSCD-VHF-001',
      bookletNo: '12 (118.1 Tx)',
      yearMade: '2021',
      origin: 'CHLB Đức (Germany)',
      commissioned: '2021-06-15',
      usageTime: 'Sử dụng từ 06/2021',
      warrantyPeriod: '24 tháng',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
      location: 'Đài KSKL Tân Sơn Nhất (TWR SGN)',
      stationName: 'AACC HCM',
      primaryEngineer: 'KS. Nguyễn Văn An',
      supervisor: 'KS. Trần Minh Trí',
      contactPhone: '028.3848.5383'
    },
    spec: {
      power: '50W (CW/AM)',
      channelFreq: '118.100 MHz (Tower Frequency)',
      mgmtIp: '192.168.10.25',
      interface: 'VoIP ED-137C, E&M, V.24, LAN 1Gbps',
      coverage: 'Tầm phủ quang học 150 NM',
      vswr: '1.15 : 1',
      text: 'Máy phát chính duy trì liên lạc không - địa điều hành bay kiểm soát tại sân (Tower Air-Ground Voice Comms). Thiết bị hoạt động 24/7 với chế độ chuyển mạch tự động Main/Standby.',
      fullSpecText: 'Liên lạc thoại không - địa; điều chế AM; Tần số VHF; Dải tần 118 – 137 MHz; Phân cực đứng; Công suất phát 50W; Công nghệ thể rắn; Nguồn điện AC 220V/50Hz; DC 24-28V.'
    },
    managingUnits: [
      { id: 'mu-001', date: '2021', unitName: 'Đài Kiểm Soát Không Lưu AACC HCM', status: 'Tốt' }
    ],
    licenseFrequency: [
      { id: 'lf-001', no: '310452/GP-TSN', expireDate: '30/06/2026' }
    ],
    licenseOperation: [
      { id: 'lo-001', no: '4890/GP-CHK-VN', expireDate: '15/06/2026' }
    ],
    technicalDocs: [
      { id: 'td-001', no: 1, name: 'Tài liệu hướng dẫn sử dụng và bảo dưỡng R&S Series 4200', qty: '01', notes: 'Bản gốc tiếng Anh & tiếng Việt' }
    ],
    components: [
      { id: 'c1', no: 1, name: 'Khối khuếch đại công suất PA 50W (Power Amplifier)', partNo: 'PA-4200-50W', serial: 'SN-PA-99120', qty: 1, healthStatus: 'Tốt', notes: 'Nhiệt độ hoạt động 42°C, ổn định' },
      { id: 'c2', no: 2, name: 'Bo xử lý trung tâm Synthesizer & CPU Controller', partNo: 'CPU-SYN-4200', serial: 'SN-CPU-88741', qty: 1, healthStatus: 'Tốt', notes: 'Firmware v4.82 mới nhất' },
      { id: 'c3', no: 3, name: 'Khối nguồn cung cấp PSU AC/DC 28V 15A', partNo: 'PSU-28V-4200', serial: 'SN-PSU-33219', qty: 1, healthStatus: 'Tốt', notes: 'Điện áp ra 28.1V DC' }
    ],
    maintenance: [
      { id: 'm1', date: '15/01/2025', cycle: '6 tháng', content: 'Bảo dưỡng định kỳ: Vệ sinh quạt làm mát, đo độ sâu điều chế AM, kiểm tra VSWR.', measuredParams: 'Tx Power: 50.4W; AM Mod: 88%; VSWR: 1.12', result: 'Đạt yêu cầu', person: 'KS. Nguyễn Văn An', signed: true }
    ],
    repair: []
  },

  // ==========================================
  // ĐÀI TRẠM 2: ATCC HCM (Kiểm soát Đường dài)
  // ==========================================
  {
    id: 'EQ-ATCC-ATM-TOPSKY',
    createdAt: '2020-03-10T08:00:00.000Z',
    updatedAt: '2025-03-12T09:00:00.000Z',
    general: {
      name: 'Hệ thống Xử lý Dữ liệu Kế hoạch Bay & Radar ATM TopSky-ATC (ACC HCM)',
      category: 'Thiết bị khác',
      model: 'TopSky-ATC (Eurocat-X Upgrade)',
      manufacturer: 'Thales ATM',
      serial: 'TH-TOPSKY-HCM-01',
      assetNo: 'TSCD-ATM-ATCC-001',
      bookletNo: '01/ATCC',
      yearMade: '2020',
      origin: 'CH Pháp (France)',
      commissioned: '2020-09-01',
      usageTime: 'Sử dụng từ 09/2020',
      warrantyPeriod: '36 tháng',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT / ĐỘI TỰ ĐỘNG HÓA',
      location: 'Phòng Thiết bị Trung tâm ATCC HCM (Tầng 3)',
      stationName: 'ATCC HCM',
      primaryEngineer: 'KS. Nguyễn Hoàng Nam',
      supervisor: 'KS. Nguyễn Hoàng Nam',
      contactPhone: '028.3844.2464'
    },
    spec: {
      power: '3-Phase 380V / UPS 120kVA',
      channelFreq: 'Mạng LAN quang Gigabit Redundant',
      mgmtIp: '10.200.1.10',
      interface: 'ASTERIX Cat 001, 002, 034, 048, 062, AFTN, OLDI, FDP/SDP',
      coverage: 'Toàn bộ Vùng thông báo bay FIR Hồ Chí Minh',
      text: 'Hệ thống xử lý dữ liệu kiểm soát không lưu đường dài tự động hóa cao độ, tích hợp dữ liệu từ 8 trạm radar sơ/thứ cấp và 12 trạm ADS-B trên toàn quốc.',
      fullSpecText: 'Hệ thống ATM TopSky-ATC; Cấu trúc xử lý phân tán Active-Active; Dung lượng xử lý > 1000 kế hoạch bay đồng thời; Giao diện chuẩn EUROCONTROL.'
    },
    managingUnits: [
      { id: 'mu-atcc-1', date: '2020', unitName: 'Trung Tâm Kiểm Soát Đường Dài ATCC HCM', status: 'Tốt' }
    ],
    licenseFrequency: [],
    licenseOperation: [
      { id: 'lo-atcc-1', no: '6612/GP-CHK-ATM', expireDate: '01/09/2027' }
    ],
    technicalDocs: [
      { id: 'td-atcc-1', no: 1, name: 'Thales TopSky-ATC Maintenance & System Administration Manual', qty: '02', notes: 'Bản mềm & bản cứng lưu tại phòng máy' }
    ],
    components: [
      { id: 'c-topsky-1', no: 1, name: 'Máy chủ xử lý dữ liệu radar đa cảm biến (MSDP Server A)', partNo: 'HP-DL380-GEN10', serial: 'CZ2019A101', qty: 1, healthStatus: 'Tốt', notes: 'Master SDP' },
      { id: 'c-topsky-2', no: 2, name: 'Máy chủ xử lý dữ liệu radar đa cảm biến (MSDP Server B)', partNo: 'HP-DL380-GEN10', serial: 'CZ2019A102', qty: 1, healthStatus: 'Tốt', notes: 'Standby SDP' },
      { id: 'c-topsky-3', no: 3, name: 'Máy chủ xử lý dữ liệu kế hoạch bay (FDP Server A/B)', partNo: 'HP-DL380-GEN10', serial: 'CZ2019F201', qty: 2, healthStatus: 'Tốt', notes: 'Cluster dự phòng nóng' }
    ],
    maintenance: [
      { id: 'm-atcc-1', date: '10/02/2025', cycle: 'Hàng tháng', content: 'Kiểm tra tải CPU, dung lượng ổ đĩa SAN/NAS, kiểm tra chuyển mạch dự phòng máy chủ SDP A/B, sao lưu log hệ thống.', measuredParams: 'CPU Load: 18%; RAM: 42%; Disk: 34%; Jitter: <1ms', result: 'Đạt yêu cầu', person: 'KS. Nguyễn Hoàng Nam', signed: true }
    ],
    repair: []
  },
  {
    id: 'EQ-ATCC-VCCS-3020X',
    createdAt: '2021-01-15T08:00:00.000Z',
    updatedAt: '2025-02-28T16:00:00.000Z',
    general: {
      name: 'Hệ thống Chuyển mạch Thoại Điều hành Bay VCCS Frequentis VCS 3020X',
      category: 'Tổng đài',
      model: 'VCS 3020X VoIP',
      manufacturer: 'Frequentis AG',
      serial: 'FQ-VCS-HCM-992',
      assetNo: 'TSCD-VCCS-002',
      bookletNo: '02/ATCC',
      yearMade: '2021',
      origin: 'Cộng hòa Áo (Austria)',
      commissioned: '2021-08-20',
      usageTime: 'Sử dụng từ 08/2021',
      warrantyPeriod: '24 tháng',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
      location: 'Phòng VCCS Trung tâm ATCC HCM',
      stationName: 'ATCC HCM',
      primaryEngineer: 'KS. Lê Văn Cường',
      supervisor: 'KS. Nguyễn Hoàng Nam',
      contactPhone: '028.3844.2464'
    },
    spec: {
      power: 'Kép AC 220V & DC 48V',
      channelFreq: '48 kênh VHF Không-Địa + 64 đường Hotline Liên lạc Địa-Địa',
      mgmtIp: '10.200.2.1',
      interface: 'VoIP ED-137B/C, E1/PRI, E&M 4-wire, SIP ATC',
      coverage: 'Kết nối toàn bộ vị trí Kiểm soát viên Không lưu ACC & APP HCM',
      text: 'Hệ thống chuyển mạch thoại kỹ thuật số phục vụ điều hành bay an toàn tuyệt đối, dự phòng 100% phần cứng Main/Standby và đường truyền.',
      fullSpecText: 'Frequentis VCS 3020X; Băng thông thoại 300Hz - 3400Hz; Chuẩn ED-137C; 32 bàn điều khiển CWP màn hình cảm ứng.'
    },
    managingUnits: [
      { id: 'mu-atcc-vccs-1', date: '2021', unitName: 'Đài Thông Tin ATCC HCM', status: 'Tốt' }
    ],
    licenseFrequency: [],
    licenseOperation: [
      { id: 'lo-atcc-vccs-1', no: '5120/GP-CHK-VCCS', expireDate: '20/08/2026' }
    ],
    technicalDocs: [
      { id: 'td-vccs-1', no: 1, name: 'Frequentis VCS 3020X Maintenance and Admin Guide', qty: '01', notes: 'Tài liệu hướng dẫn kỹ thuật' }
    ],
    components: [
      { id: 'c-vccs-1', no: 1, name: 'Khung máy chủ trung tâm VCCS Core Rack A', partNo: 'VCS-CORE-RACK', serial: 'FQ-RACK-01', qty: 1, healthStatus: 'Tốt', notes: 'Hệ thống Core A' },
      { id: 'c-vccs-2', no: 2, name: 'Khung máy chủ trung tâm VCCS Core Rack B', partNo: 'VCS-CORE-RACK', serial: 'FQ-RACK-02', qty: 1, healthStatus: 'Tốt', notes: 'Hệ thống Core B dự phòng nóng' }
    ],
    maintenance: [
      { id: 'm-vccs-1', date: '18/01/2025', cycle: '3 tháng', content: 'Đo kiểm độ suy hao âm thanh, kiểm tra chất lượng thoại PTT và ghi âm tự động tất cả các kênh.', measuredParams: 'Voice Quality: MOS 4.4; Latency: 8ms; PTT delay: 12ms', result: 'Đạt yêu cầu', person: 'KS. Lê Văn Cường', signed: true }
    ],
    repair: []
  },

  // ==========================================
  // ĐÀI TRẠM 3: BQ old (Cụm thiết bị Hiện hữu)
  // ==========================================
  {
    id: 'EQ-BQ-OLD-DVOR-1150',
    createdAt: '2019-11-01T08:00:00.000Z',
    updatedAt: '2025-02-20T10:00:00.000Z',
    general: {
      name: 'Đài Dẫn Đường Đa Hướng Doppler D-VOR/DME Thales 1150 (Trạm BQ Cũ)',
      category: 'Viba',
      model: 'Thales 1150 DVOR / 4150 DME',
      manufacturer: 'Thales ATM',
      serial: 'TH-DVOR-7720-VN',
      assetNo: 'TSCD-DVOR-BQ-OLD',
      bookletNo: '01/BQ-OLD',
      yearMade: '2019',
      origin: 'CH Pháp (France)',
      commissioned: '2019-11-20',
      usageTime: 'Sử dụng từ 11/2019',
      warrantyPeriod: '24 tháng',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
      location: 'Khu vực Đài trạm BQ (Vị trí trạm BQ Cũ)',
      stationName: 'BQ old',
      primaryEngineer: 'KS. Lê Quốc Hưng',
      supervisor: 'KS. Lê Quốc Hưng',
      contactPhone: '0908.120.900'
    },
    spec: {
      power: '100W DVOR / 1kW Peak DME',
      channelFreq: '114.700 MHz (CH 94X)',
      mgmtIp: '192.168.20.10',
      interface: 'RCMS SNMP, Modem 4-wire, RS-232',
      coverage: 'Tầm phủ 200 NM độ cao FL200',
      vswr: '1.08 : 1',
      text: 'Đài dẫn đường đa hướng sóng cực ngắn Doppler (D-VOR) kết hợp đài đo cự ly (DME) phục vụ dẫn đường đường dài en-route và tiếp cận khu vực kiểm soát.',
      fullSpecText: 'Đài D-VOR/DME dẫn đường vô tuyến hàng không; Tần số 114.7 MHz; Công suất phát sóng mang 100W; Sai số góc phương vị < 0.5 độ.'
    },
    managingUnits: [
      { id: 'mu-bq-old-1', date: '2019', unitName: 'Trạm Kỹ Thuật CNS BQ old', status: 'Tốt' }
    ],
    licenseFrequency: [
      { id: 'lf-bq-old-1', no: '289100/GP-DVOR-BQ', expireDate: '30/11/2026' }
    ],
    licenseOperation: [
      { id: 'lo-bq-old-1', no: '4112/GP-CHK-BQ', expireDate: '20/11/2026' }
    ],
    technicalDocs: [
      { id: 'td-bq-1', no: 1, name: 'Thales 1150 Doppler VOR Technical Manual & Maintenance Book', qty: '01', notes: 'Kèm sơ đồ đấu nối nguyên lý' }
    ],
    components: [
      { id: 'c-bq-1', no: 1, name: 'Khối tạo dao động sóng mang Carrier Transmitter', partNo: 'TX-CAR-1150', serial: 'SN-TX-3301', qty: 1, healthStatus: 'Tốt', notes: 'Công suất ra chuẩn 100W' },
      { id: 'c-bq-2', no: 2, name: 'Khối điều chế tần số phụ Sideband Transmitter (USB/LSB)', partNo: 'TX-SB-1150', serial: 'SN-SB-9912', qty: 2, healthStatus: 'Tốt', notes: 'Độ lệch pha < 0.2°' }
    ],
    maintenance: [
      { id: 'm-bq-1', date: '05/02/2025', cycle: '3 tháng', content: 'Bảo dưỡng định kỳ quý: Đo kiểm tra sai số góc phương vị Azimuth Error, công suất phát Carrier/Sideband, kiểm tra máy bay bay hiệu chuẩn.', measuredParams: 'Bearing Error: ±0.3°; Tx Pwr: 100.5W; DME Pulse Spacing: 12.00 µs', result: 'Đạt yêu cầu', person: 'KS. Lê Quốc Hưng', signed: true }
    ],
    repair: []
  },
  {
    id: 'EQ-BQ-OLD-VHF-T6T',
    createdAt: '2016-08-10T08:00:00.000Z',
    updatedAt: '2025-01-18T14:00:00.000Z',
    general: {
      name: 'Máy phát VHF Dự phòng Điều hành Bay Park Air T6T (Trạm BQ Cũ)',
      category: 'VHF',
      model: 'Park Air T6T 50W',
      manufacturer: 'PARK AIR',
      serial: '6U-BQ-8812',
      assetNo: 'TSCD-VHF-BQ-OLD-02',
      bookletNo: '02/BQ-OLD',
      yearMade: '2016',
      origin: 'Vương Quốc Anh (UK)',
      commissioned: '2016-09-01',
      usageTime: 'Sử dụng từ 09/2016',
      warrantyPeriod: '12 tháng',
      status: 'Dự phòng nóng',
      priority: 'Hệ thống phụ (Level 2)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
      location: 'Phòng Máy VHF Trạm BQ (Khu BQ Cũ)',
      stationName: 'BQ old',
      primaryEngineer: 'KS. Lê Quốc Hưng',
      supervisor: 'KS. Lê Quốc Hưng',
      contactPhone: '0908.120.900'
    },
    spec: {
      power: '50W',
      channelFreq: '127.500 MHz (Backup Sector 2)',
      mgmtIp: '192.168.20.15',
      interface: 'VoIP ED-137B, E&M 4-wire, RS-232',
      coverage: 'Tầm phủ 160 NM',
      vswr: '1.14 : 1',
      text: 'Máy phát VHF dự phòng sẵn sàng nóng chuyển mạch tức thì khi kênh chính có sự cố.',
      fullSpecText: 'Park Air T6T VHF Transmitter; 50W AM; 118-137 MHz; 220VAC / 24VDC.'
    },
    managingUnits: [
      { id: 'mu-bq-2', date: '2016', unitName: 'Trạm BQ old', status: 'Tốt' }
    ],
    licenseFrequency: [
      { id: 'lf-bq-2', no: '190822/GP-VHF-BQ', expireDate: '30/08/2026' }
    ],
    licenseOperation: [
      { id: 'lo-bq-2', no: '3811/GP-CHK-BQ', expireDate: '01/09/2026' }
    ],
    technicalDocs: [],
    components: [
      { id: 'c-bq-v-1', no: 1, name: 'Khối máy phát VHF T6T đồng bộ', partNo: 'T6T-50W', serial: '6U-BQ-8812', qty: 1, healthStatus: 'Tốt', notes: 'Sẵn sàng nóng' }
    ],
    maintenance: [
      { id: 'm-bq-v-1', date: '12/01/2025', cycle: 'Hàng tháng', content: 'Kiểm tra công suất phát P=50W, kiểm tra chuyển mạch PTT từ xa qua đường truyền quang.', measuredParams: 'P: 50.2W; VSWR: 1.14; Độ méo: <2%', result: 'Đạt yêu cầu', person: 'KS. Lê Quốc Hưng', signed: true }
    ],
    repair: []
  },

  // ==========================================
  // ĐÀI TRẠM 4: BQ New (Cụm thiết bị Nâng cấp)
  // ==========================================
  {
    id: 'EQ-BQ-NEW-ADSB-ERA',
    createdAt: '2022-04-10T08:00:00.000Z',
    updatedAt: '2025-03-01T11:00:00.000Z',
    general: {
      name: 'Trạm Giám Sát Tự Động Phụ Thuộc ADS-B Đa Điểm (Trạm BQ Mới)',
      category: 'ADS-B',
      model: 'MSS ADS-B Ground Station (Dual Redundant)',
      manufacturer: 'ERA Corporation',
      serial: 'ERA-ADSB-BQ-2022',
      assetNo: 'TSCD-ADSB-BQ-NEW-01',
      bookletNo: '01/BQ-NEW',
      yearMade: '2022',
      origin: 'Cộng hòa Séc (Czech Republic)',
      commissioned: '2022-07-15',
      usageTime: 'Sử dụng từ 07/2022',
      warrantyPeriod: '24 tháng',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
      location: 'Tháp Ăng-ten Trạm BQ Mới',
      stationName: 'BQ New',
      primaryEngineer: 'KS. Phạm Quốc Huy',
      supervisor: 'KS. Phạm Quốc Huy',
      contactPhone: '0912.888.999'
    },
    spec: {
      power: 'Nguồn AC 220V + Năng lượng mặt trời Solar Backup 48V',
      channelFreq: 'Tần số thu 1090 MHz Extended Squitter',
      mgmtIp: '192.168.30.10',
      interface: 'ASTERIX Cat 021, ASTERIX Cat 023, SNMP v3, Fiber Optic',
      coverage: 'Tầm phủ giám sát 250 NM độ cao FL450',
      text: 'Trạm thu ADS-B thế hệ mới thu nhận tín hiệu định vị vệ tinh GNSS phát từ máy bay, cung cấp vị trí 3D chính xác về trung tâm ATCC HCM.',
      fullSpecText: 'ERA MSS ADS-B Dual Station; Độ nhạy thu -91 dBm; Chuẩn DO-260B / ED-102A; Tốc độ cập nhật 1 giây.'
    },
    managingUnits: [
      { id: 'mu-bq-new-1', date: '2022', unitName: 'Trạm Kỹ Thuật Công Nghệ Mới BQ New', status: 'Tốt' }
    ],
    licenseFrequency: [
      { id: 'lf-bq-new-1', no: '330112/GP-ADSB-BQ', expireDate: '15/07/2027' }
    ],
    licenseOperation: [
      { id: 'lo-bq-new-1', no: '5819/GP-CHK-ADSB', expireDate: '15/07/2027' }
    ],
    technicalDocs: [
      { id: 'td-adsb-1', no: 1, name: 'ERA MSS ADS-B Ground Station User & Maintenance Manual', qty: '01', notes: 'Tài liệu chuẩn kỹ thuật ERA' }
    ],
    components: [
      { id: 'c-adsb-1', no: 1, name: 'Khối xử lý thu tín hiệu 1090MHz Receiver Unit A', partNo: 'MSS-RX-1090', serial: 'ERA-RX-019', qty: 1, healthStatus: 'Tốt', notes: 'Kênh thu A' },
      { id: 'c-adsb-2', no: 2, name: 'Khối xử lý thu tín hiệu 1090MHz Receiver Unit B', partNo: 'MSS-RX-1090', serial: 'ERA-RX-020', qty: 1, healthStatus: 'Tốt', notes: 'Kênh thu B dự phòng nóng' },
      { id: 'c-adsb-3', no: 3, name: 'Bộ thu đồng bộ thời gian chuẩn GPS/GNSS Time Receiver', partNo: 'GNSS-SYNC-01', serial: 'ERA-GPS-991', qty: 2, healthStatus: 'Tốt', notes: 'Độ chính xác nano-giây' }
    ],
    maintenance: [
      { id: 'm-adsb-1', date: '25/02/2025', cycle: 'Hàng tháng', content: 'Kiểm tra tỷ lệ thu bản tin ADS-B Message Rate, kiểm tra thời gian đồng bộ GNSS lock, vệ sinh tủ thiết bị ngoài trời IP67.', measuredParams: 'Msg Rate: 1,450 msg/sec; GNSS Lock: 14 Satellites; Sensitivity: -92dBm', result: 'Đạt yêu cầu', person: 'KS. Phạm Quốc Huy', signed: true }
    ],
    repair: []
  },
  {
    id: 'EQ-BQ-NEW-VHF-5200',
    createdAt: '2023-05-15T08:00:00.000Z',
    updatedAt: '2025-03-05T15:00:00.000Z',
    general: {
      name: 'Cụm Máy phát VHF Kỹ thuật số VoIP ED-137C (Trạm BQ Mới)',
      category: 'VHF',
      model: 'R&S Series 5200 (XU5200 50W)',
      manufacturer: 'Rohde & Schwarz',
      serial: 'RS-5200-VN-2023-09',
      assetNo: 'TSCD-VHF-BQ-NEW-02',
      bookletNo: '02/BQ-NEW',
      yearMade: '2023',
      origin: 'CHLB Đức (Germany)',
      commissioned: '2023-08-10',
      usageTime: 'Sử dụng từ 08/2023',
      warrantyPeriod: '36 tháng',
      status: 'Đang khai thác',
      priority: 'Hệ thống chính (Level 1)'
    },
    org: {
      companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
      unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
      location: 'Phòng Máy VHF Kỹ Thuật Số Trạm BQ Mới',
      stationName: 'BQ New',
      primaryEngineer: 'KS. Phạm Quốc Huy',
      supervisor: 'KS. Phạm Quốc Huy',
      contactPhone: '0912.888.999'
    },
    spec: {
      power: '50W (Kỹ thuật số VoIP ED-137C)',
      channelFreq: '132.300 MHz (Sector 3 En-route)',
      mgmtIp: '192.168.30.25',
      interface: 'VoIP ED-137C SIP, LAN kép Redundant, SNMP v3, Web GUI',
      coverage: 'Tầm phủ liên lạc thoại 180 NM',
      vswr: '1.09 : 1',
      text: 'Máy phát VHF thế hệ mới nhất của Rohde & Schwarz, hỗ trợ điều chế thuần IP VoIP ED-137C, bảo mật an ninh mạng và tiết kiệm năng lượng.',
      fullSpecText: 'R&S Series 5200; Dải tần 118-137 MHz; 8.33 kHz & 25 kHz Channel Spacing; Công suất 50W; AC 100-240V / DC 24V.'
    },
    managingUnits: [
      { id: 'mu-bq-new-2', date: '2023', unitName: 'Trạm BQ New', status: 'Tốt' }
    ],
    licenseFrequency: [
      { id: 'lf-bq-new-2', no: '381900/GP-VHF-5200', expireDate: '10/08/2028' }
    ],
    licenseOperation: [
      { id: 'lo-bq-new-2', no: '6120/GP-CHK-5200', expireDate: '10/08/2028' }
    ],
    technicalDocs: [
      { id: 'td-rs5200-1', no: 1, name: 'Rohde & Schwarz Series 5200 Radio System Manual', qty: '01', notes: 'Tài liệu hướng dẫn kỹ thuật điện tử' }
    ],
    components: [
      { id: 'c-5200-1', no: 1, name: 'Khối máy phát VHF R&S Series 5200 Transceiver', partNo: 'XU5200-50W', serial: 'RS-5200-09', qty: 1, healthStatus: 'Tốt', notes: 'Hoạt động 24/7' },
      { id: 'c-5200-2', no: 2, name: 'Bộ lọc cộng hưởng RF Cavity Filter 132.300 MHz', partNo: 'FLT-CAV-132M', serial: 'FLT-0992', qty: 1, healthStatus: 'Tốt', notes: 'Độ chọn lọc cao' }
    ],
    maintenance: [
      { id: 'm-5200-1', date: '01/03/2025', cycle: 'Hàng tháng', content: 'Kiểm tra thông số kỹ thuật qua giao diện Web GUI, đo công suất phát và đo hệ số sóng đứng VSWR.', measuredParams: 'P: 50.1W; VSWR: 1.09; IP Delay: 4ms', result: 'Đạt yêu cầu', person: 'KS. Phạm Quốc Huy', signed: true }
    ],
    repair: []
  }
];

export const SAMPLE_EQUIPMENTS = INITIAL_EQUIPMENTS;
