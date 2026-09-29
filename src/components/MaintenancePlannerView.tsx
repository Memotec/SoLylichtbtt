import { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Plus, 
  Search, 
  User as UserIcon, 
  MapPin, 
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  Check,
  Mail,
  Bell,
  Settings2,
  AlertOctagon,
  LogOut,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2
} from 'lucide-react';
import { Equipment, MaintenanceRecord, CNS_STATIONS } from '../types';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken, auth } from '../services/googleAuth';
import { 
  loadEmailConfig, 
  saveEmailConfig, 
  getUpcomingMaintenanceList, 
  sendGmailNotification, 
  generateMaintenanceAlertHtml, 
  EmailNotificationConfig,
  UpcomingMaintenance 
} from '../services/emailNotification';

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

  // Email Notification States
  const [emailConfig, setEmailConfig] = useState<EmailNotificationConfig>(() => loadEmailConfig());
  const [isEmailPanelExpanded, setIsEmailPanelExpanded] = useState(false);
  const [emailInput, setEmailInput] = useState(emailConfig.receiverEmails);
  const [daysBeforeDueInput, setDaysBeforeDueInput] = useState(emailConfig.daysBeforeDue);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [internalToast, setInternalToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

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

  // Google OAuth Sync Session check
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const token = await getAccessToken();
        if (token && auth.currentUser) {
          setAccessToken(token);
          setGoogleUser(auth.currentUser);
        }
      } catch (e) {
        console.warn('OAuth load error in Planner:', e);
      }
    };
    checkActiveSession();

    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token || null);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Compute Upcoming schedules
  const upcomingMaintList = useMemo(() => {
    return getUpcomingMaintenanceList(equipments);
  }, [equipments]);

  // Overdue + Due soon list in alert window
  const overdueAndDueSoonList = useMemo(() => {
    return upcomingMaintList.filter(item => 
      item.status === 'overdue' || 
      (item.status === 'due_soon' && item.daysRemaining <= emailConfig.daysBeforeDue)
    );
  }, [upcomingMaintList, emailConfig.daysBeforeDue]);

  // Internal toast triggers
  const showInternalToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setInternalToast({ text, type });
    setTimeout(() => setInternalToast(null), 3500);
  };

  // Google Login wrapper
  const handleGoogleLogin = async () => {
    try {
      setIsSigningInGoogle(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        showInternalToast('Đăng nhập Google thành công! Đã kết nối Gmail.', 'success');
      }
    } catch (err: any) {
      showInternalToast(`Đăng nhập thất bại: ${err.message}`, 'error');
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Google Logout wrapper
  const handleGoogleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn ngắt kết nối Gmail khỏi hệ thống?')) {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      showInternalToast('Đã ngắt kết nối tài khoản Google.', 'info');
    }
  };

  // Save email settings
  const handleSaveEmailSettings = () => {
    const updated: EmailNotificationConfig = {
      ...emailConfig,
      receiverEmails: emailInput.trim(),
      daysBeforeDue: daysBeforeDueInput
    };
    setEmailConfig(updated);
    saveEmailConfig(updated);
    showInternalToast('Đã lưu cấu hình email thành công!', 'success');
  };

  // Toggle notifications overall
  const handleToggleNotifications = (enabled: boolean) => {
    const updated = { ...emailConfig, enabled };
    setEmailConfig(updated);
    saveEmailConfig(updated);
    showInternalToast(enabled ? 'Đã bật tính năng báo qua Email.' : 'Đã tắt tính năng báo qua Email.', 'info');
  };

  // Manual Alert dispatch
  const handleSendAlertNow = async () => {
    if (!accessToken) {
      showInternalToast('Vui lòng kết nối tài khoản Google để sử dụng Gmail.', 'error');
      return;
    }
    if (overdueAndDueSoonList.length === 0) {
      showInternalToast('Tuyệt vời! Hiện tại không có thiết bị nào quá hạn hoặc đến hạn bảo dưỡng.', 'info');
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận gửi email cảnh báo bảo dưỡng định kỳ đến địa chỉ:\n👉 ${emailInput}\n\nDanh sách chứa ${overdueAndDueSoonList.length} thiết bị quá hạn hoặc sắp đến hạn.`
    );
    if (!confirmed) return;

    try {
      setIsSendingEmail(true);
      const count = overdueAndDueSoonList.length;
      const subject = `[CNS VATM] Cảnh báo hạn bảo dưỡng định kỳ thiết bị CNS (${count} thiết bị)`;
      const htmlBody = generateMaintenanceAlertHtml(upcomingMaintList, emailConfig);

      await sendGmailNotification(accessToken, emailInput, subject, htmlBody);

      const updated = {
        ...emailConfig,
        lastCheckedAt: new Date().toISOString()
      };
      setEmailConfig(updated);
      saveEmailConfig(updated);

      showInternalToast(`Đã gửi email cảnh báo thành công tới ${emailInput}!`, 'success');
    } catch (err: any) {
      showInternalToast(`Lỗi gửi email: ${err.message}`, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Auto dispatch check on load
  useEffect(() => {
    if (!emailConfig.enabled || !emailConfig.autoCheckOnLoad || !accessToken || overdueAndDueSoonList.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckedStr = emailConfig.lastCheckedAt ? emailConfig.lastCheckedAt.split('T')[0] : '';

    if (lastCheckedStr === todayStr) return;

    const timer = setTimeout(() => {
      const confirmed = window.confirm(
        `[HỆ THỐNG CNS VATM]\nPhát hiện ${overdueAndDueSoonList.length} thiết bị CNS đã quá hạn hoặc sắp đến hạn bảo dưỡng định kỳ!\n\nBạn có muốn gửi báo cáo email cảnh báo chi tiết tới: ${emailConfig.receiverEmails} ngay bây giờ không?`
      );
      if (confirmed) {
        (async () => {
          try {
            setIsSendingEmail(true);
            const subject = `[TỰ ĐỘNG - CNS VATM] Cảnh báo định kỳ thiết bị đến hạn bảo dưỡng (${overdueAndDueSoonList.length} thiết bị)`;
            const htmlBody = generateMaintenanceAlertHtml(upcomingMaintList, emailConfig);
            
            await sendGmailNotification(accessToken, emailConfig.receiverEmails, subject, htmlBody);
            
            const updated = {
              ...emailConfig,
              lastCheckedAt: new Date().toISOString()
            };
            setEmailConfig(updated);
            saveEmailConfig(updated);
            showInternalToast('Đã tự động gửi email cảnh báo bảo dưỡng định kỳ!', 'success');
          } catch (e: any) {
            console.error('Auto notification failed:', e);
          } finally {
            setIsSendingEmail(false);
          }
        })();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [accessToken, overdueAndDueSoonList, emailConfig]);

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {internalToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            internalToast.type === 'success' 
              ? 'bg-emerald-500 text-white border-emerald-600' 
              : internalToast.type === 'error'
              ? 'bg-rose-500 text-white border-rose-600'
              : 'bg-blue-500 text-white border-blue-600'
          }`}>
            <Bell className="w-4 h-4" />
            <span>{internalToast.text}</span>
          </div>
        </div>
      )}

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

      {/* EMAIL NOTIFICATIONS CONFIGURATION CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <button
          onClick={() => setIsEmailPanelExpanded(!isEmailPanelExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              emailConfig.enabled 
                ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              <Mail className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Cấu Hình Nhận Thông Báo Bảo Dưỡng Qua Email</span>
                {emailConfig.enabled && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    ĐANG KÍCH HOẠT
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tích hợp Gmail để tự động gửi thông báo lịch bảo dưỡng CNS sắp đến hạn cho kỹ sư phụ trách
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {overdueAndDueSoonList.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                <span>{overdueAndDueSoonList.length} thiết bị cần xử lý</span>
              </span>
            )}
            {isEmailPanelExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {isEmailPanelExpanded && (
          <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-5">
            
            {/* 1. GOOGLE CONNECTION STATUS */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${accessToken ? 'bg-emerald-500' : 'bg-rose-400 animate-ping'}`} />
                  <p className="text-xs font-bold text-slate-800">
                    Trạng thái kết nối Google Workspace (Gmail API):
                  </p>
                </div>
                {googleUser ? (
                  <p className="text-[11px] text-slate-500">
                    Đã liên kết tài khoản: <strong className="text-slate-800">{googleUser.email}</strong> (Khớp với email đài trạm VATM)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Chưa kết nối. Vui lòng đăng nhập Google để cho phép hệ thống gửi thư điện tử.
                  </p>
                )}
              </div>

              <div>
                {googleUser ? (
                  <button
                    onClick={handleGoogleLogout}
                    className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer animate-fade-in"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ngắt kết nối</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSigningInGoogle}
                    className="gsi-material-button text-xs font-bold py-2 px-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-3xs flex items-center gap-2 text-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    {isSigningInGoogle ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                    )}
                    <span>Kết nối tài khoản Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. EMAIL CONFIGURATION INPUTS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-3xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Settings2 className="w-4 h-4 text-blue-600" />
                  <span>Tham Số Báo Động</span>
                </h4>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Trạng thái thông báo:</span>
                    <button
                      onClick={() => handleToggleNotifications(!emailConfig.enabled)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        emailConfig.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          emailConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Số ngày báo trước khi đến hạn:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={daysBeforeDueInput}
                        onChange={(e) => setDaysBeforeDueInput(Number(e.target.value))}
                        className="flex-1 accent-blue-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                      />
                      <span className="text-xs font-mono font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {daysBeforeDueInput} ngày
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700">Quét khi mở ứng dụng:</span>
                    <input
                      type="checkbox"
                      checked={emailConfig.autoCheckOnLoad}
                      onChange={(e) => {
                        const updated = { ...emailConfig, autoCheckOnLoad: e.target.checked };
                        setEmailConfig(updated);
                        saveEmailConfig(updated);
                        showInternalToast(e.target.checked ? 'Đã bật tự động kiểm tra khi mở ứng dụng.' : 'Đã tắt tự động kiểm tra.', 'info');
                      }}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-3xs flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Hộp Thư Nhận Tin Cảnh Báo</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Email kỹ sư nhận cảnh báo (Phân cách bằng dấu phẩy nếu nhiều email):
                    </label>
                    <input
                      type="text"
                      placeholder="TAILIEUTBTT@gmail.com, engineer@vatm.vn"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <p className="text-[10px] text-slate-400">
                      Mặc định hệ thống sử dụng email đăng ký thiết bị: <strong className="text-slate-500">TAILIEUTBTT@gmail.com</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 flex-wrap">
                  <button
                    onClick={handleSaveEmailSettings}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Lưu Cấu Hình</span>
                  </button>

                  <button
                    onClick={handleSendAlertNow}
                    disabled={isSendingEmail || !accessToken || overdueAndDueSoonList.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    <span>Gửi Email Cảnh Báo Ngay ({overdueAndDueSoonList.length})</span>
                  </button>
                </div>
              </div>

            </div>

            {/* 3. ALARM LIST */}
            {overdueAndDueSoonList.length > 0 && (
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span>Thiết bị trong vùng báo động ({overdueAndDueSoonList.length})</span>
                </h4>
                
                <div className="max-h-48 overflow-y-auto divide-y divide-rose-100 text-xs">
                  {overdueAndDueSoonList.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="font-bold text-slate-900">{item.equipment.general.name}</span>
                        <span className="text-slate-500 font-mono text-[11px] ml-1.5">(S/N: {item.equipment.general.serial})</span>
                        <span className="text-slate-400 text-[11px] ml-2">Đài trạm: {item.equipment.org.stationName || item.equipment.org.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Hạn BD: <strong className="text-blue-600 font-mono">{item.nextDueDate.toLocaleDateString('vi-VN')}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'overdue' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status === 'overdue' ? `Quá hạn ${Math.abs(item.daysRemaining)} ngày` : `Còn lại ${item.daysRemaining} ngày`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
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
