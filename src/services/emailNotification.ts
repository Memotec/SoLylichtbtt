import { Equipment, MaintenanceRecord } from '../types';

export interface EmailNotificationConfig {
  enabled: boolean;
  receiverEmails: string; // Comma-separated emails
  daysBeforeDue: number;  // Notify this many days before due (e.g. 7 days, 3 days, 0 = on due day)
  autoCheckOnLoad: boolean;
  lastCheckedAt: string | null;
}

const EMAIL_CONFIG_KEY = 'cns_email_notification_config_v1';

export const DEFAULT_EMAIL_CONFIG: EmailNotificationConfig = {
  enabled: true,
  receiverEmails: 'TAILIEUTBTT@gmail.com',
  daysBeforeDue: 7,
  autoCheckOnLoad: true,
  lastCheckedAt: null
};

/**
 * Load email notification configuration from localStorage
 */
export function loadEmailConfig(): EmailNotificationConfig {
  try {
    const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? true,
        receiverEmails: parsed.receiverEmails || 'TAILIEUTBTT@gmail.com',
        daysBeforeDue: parsed.daysBeforeDue ?? 7,
        autoCheckOnLoad: parsed.autoCheckOnLoad ?? true,
        lastCheckedAt: parsed.lastCheckedAt || null
      };
    }
  } catch (e) {
    console.error('Failed to load email config:', e);
  }
  return { ...DEFAULT_EMAIL_CONFIG };
}

/**
 * Save email notification configuration to localStorage
 */
export function saveEmailConfig(config: EmailNotificationConfig): void {
  try {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save email config:', e);
  }
}

/**
 * Calculate the next due date for a maintenance record based on its cycle
 */
export function calculateNextDueDate(dateStr: string, cycle: string): Date {
  const baseDate = new Date(dateStr);
  if (isNaN(baseDate.getTime())) return new Date();

  const nextDate = new Date(baseDate);
  switch (cycle) {
    case 'Hàng ngày':
      nextDate.setDate(baseDate.getDate() + 1);
      break;
    case 'Hàng tuần':
      nextDate.setDate(baseDate.getDate() + 7);
      break;
    case 'Hàng tháng':
      nextDate.setMonth(baseDate.getMonth() + 1);
      break;
    case '3 tháng':
      nextDate.setMonth(baseDate.getMonth() + 3);
      break;
    case '6 tháng':
      nextDate.setMonth(baseDate.getMonth() + 6);
      break;
    case '1 năm':
      nextDate.setFullYear(baseDate.getFullYear() + 1);
      break;
    case 'Định kỳ':
    default:
      nextDate.setMonth(baseDate.getMonth() + 1); // default to 1 month
      break;
  }
  return nextDate;
}

export interface UpcomingMaintenance {
  equipment: Equipment;
  lastRecord: MaintenanceRecord;
  nextDueDate: Date;
  daysRemaining: number;
  status: 'overdue' | 'due_soon' | 'safe';
}

/**
 * Analyze equipment list to find upcoming maintenance schedules
 */
export function getUpcomingMaintenanceList(equipments: Equipment[]): UpcomingMaintenance[] {
  const list: UpcomingMaintenance[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  equipments.forEach(eq => {
    const records = eq.maintenance || [];
    if (records.length === 0) return;

    // Sort records to find the latest one (by date descending)
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const lastRecord = sorted[0];

    if (!lastRecord.date || !lastRecord.cycle) return;

    const nextDueDate = calculateNextDueDate(lastRecord.date, lastRecord.cycle);
    const nextDateClear = new Date(nextDueDate);
    nextDateClear.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = nextDateClear.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: 'overdue' | 'due_soon' | 'safe' = 'safe';
    if (daysRemaining < 0) {
      status = 'overdue';
    } else if (daysRemaining <= 7) {
      status = 'due_soon';
    }

    list.push({
      equipment: eq,
      lastRecord,
      nextDueDate: nextDateClear,
      daysRemaining,
      status
    });
  });

  // Sort by days remaining (closest/overdue first)
  return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Send email notification using Google Gmail API Client-Side
 */
export async function sendGmailNotification(
  accessToken: string,
  toEmails: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string }> {
  if (!accessToken) {
    throw new Error('Bạn cần đăng nhập Google Workspace trước khi thực hiện thao tác này.');
  }

  // Support multiple comma-separated emails
  const formattedTo = toEmails.split(',').map(e => e.trim()).join(', ');

  // Create UTF-8 Subject Base64 Header for proper accent encoding
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const emailLines = [
    `To: ${formattedTo}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    htmlBody
  ];

  const email = emailLines.join('\r\n');
  
  // Safe base64url encoding for Gmail API
  const base64Safe = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: base64Safe
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gửi email qua Gmail thất bại (Mã lỗi ${response.status})`);
  }

  const resData = await response.json();
  return { success: true, messageId: resData.id };
}

/**
 * Generate beautifully styled email HTML body for CNS scheduled maintenance alert
 */
export function generateMaintenanceAlertHtml(
  upcomingList: UpcomingMaintenance[],
  config: EmailNotificationConfig
): string {
  const overdueItems = upcomingList.filter(item => item.status === 'overdue');
  const dueSoonItems = upcomingList.filter(item => item.status === 'due_soon' && item.daysRemaining >= 0 && item.daysRemaining <= config.daysBeforeDue);

  const formatVietnameseDate = (d: Date) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const todayStr = formatVietnameseDate(new Date());

  let rowsHtml = '';

  const addRow = (item: UpcomingMaintenance) => {
    const statusText = item.status === 'overdue' 
      ? `<span style="color: #ef4444; font-weight: bold; background-color: #fef2f2; border: 1px solid #fee2e2; padding: 2px 6px; borderRadius: 4px;">QUÁ HẠN (${Math.abs(item.daysRemaining)} ngày)</span>`
      : `<span style="color: #d97706; font-weight: bold; background-color: #fffbeb; border: 1px solid #fef3c7; padding: 2px 6px; borderRadius: 4px;">SẮP ĐẾN HẠN (${item.daysRemaining} ngày)</span>`;

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${item.equipment.general.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.equipment.general.serial}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.equipment.org.stationName || item.equipment.org.location || 'Chưa rõ'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e3a8a;">${item.lastRecord.cycle}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.lastRecord.date}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #2563eb;">${formatVietnameseDate(item.nextDueDate)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${statusText}</td>
      </tr>
    `;
  };

  overdueItems.forEach(item => {
    rowsHtml += addRow(item);
  });

  dueSoonItems.forEach(item => {
    rowsHtml += addRow(item);
  });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="background-color: #0c2340; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18pt; letter-spacing: 0.5px; text-transform: uppercase;">CẢNH BÁO HẠN BẢO DƯỠNG ĐỊNH KỲ THIẾT BỊ CNS</h2>
        <p style="margin: 5px 0 0 0; font-size: 10pt; color: #94a3b8; font-style: italic;">Hệ thống quản lý lý lịch kỹ thuật điện tử VATM</p>
      </div>

      <div style="padding: 20px 10px;">
        <p style="font-size: 11pt; line-height: 1.6;">Kính gửi <strong>Tổ Kỹ thuật Đài trạm CNS / Kỹ sư phụ trách</strong>,</p>
        <p style="font-size: 11pt; line-height: 1.6; margin-bottom: 15px;">
          Hệ thống ghi nhận tại ngày <strong>${todayStr}</strong> có danh sách các thiết bị CNS đã quá hạn hoặc chuẩn bị đến hạn bảo dưỡng định kỳ tiếp theo theo quy chế khai thác hàng không:
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 10px; font-weight: bold; color: #334155;">Tên Thiết Bị</th>
              <th style="padding: 10px; font-weight: bold; color: #334155;">Số Serial</th>
              <th style="padding: 10px; font-weight: bold; color: #334155;">Đài Trạm</th>
              <th style="padding: 10px; font-weight: bold; color: #334155;">Chu Kỳ</th>
              <th style="padding: 10px; font-weight: bold; color: #334155;">Ngày BD Trước</th>
              <th style="padding: 10px; font-weight: bold; color: #334155;">Hạn Bảo Dưỡng</th>
              <th style="padding: 10px; font-weight: bold; color: #334155; text-align: center;">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Tuyệt vời! Không có thiết bị nào quá hạn hoặc sắp đến hạn cần bảo dưỡng trong chu kỳ này.</td></tr>`}
          </tbody>
        </table>

        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 5px 0; font-size: 11pt; color: #1e3a8a;">⚠️ Hướng dẫn xử lý:</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 10pt; line-height: 1.5; color: #475569;">
            <li>Đề nghị kiểm tra thông số kỹ thuật thực tế của thiết bị tại đài trạm.</li>
            <li>Thực hiện các bước bảo dưỡng định kỳ tương ứng theo quy trình công nghệ kỹ thuật quy định.</li>
            <li>Cập nhật số liệu đo kiểm và ký xác nhận điện tử vào <strong>Sổ Lý Lịch Thiết Bị CNS Điện Tử</strong> ngay trên phần mềm để tự động làm mới chu kỳ bảo dưỡng.</li>
          </ol>
        </div>

        <p style="font-size: 10pt; color: #64748b; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          Đây là thư tự động được gửi từ hệ thống quản lý CNS VATM. Vui lòng không trả lời thư này.<br/>
          <strong>Địa điểm Đài trạm:</strong> Trung tâm Bảo đảm Kỹ thuật miền Nam.
        </p>
      </div>
    </div>
  `;
}
