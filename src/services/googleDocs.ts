import { Equipment } from '../types';

/**
 * Creates a beautiful Google Doc containing the complete equipment dossier.
 * @param accessToken Google OAuth2 Access Token
 * @param equipment The equipment object to export
 */
export async function exportEquipmentToGoogleDoc(
  accessToken: string,
  equipment: Equipment
): Promise<{ documentId: string; documentUrl: string }> {
  if (!accessToken) {
    throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn.');
  }

  const docTitle = `Sổ Lý Lịch: ${equipment.general.name} [${equipment.general.model}]`;

  // Step 1: Create a blank Google Document
  const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Không thể tạo Google Doc mới. Mã lỗi: ${createResponse.status}`
    );
  }

  const docData = await createResponse.json();
  const documentId = docData.documentId;

  // Step 2: Prepare the document content block by block
  // We will build a list of insertion requests. To make it extremely robust and avoid index shift calculations,
  // we will compile the entire document body text, insert it at index 1, and then apply paragraph styles.
  
  const segments: string[] = [];

  segments.push(`SỔ LÝ LỊCH THIẾT BỊ CNS`);
  segments.push(`==================================================================`);
  segments.push(`Tên thiết bị: ${equipment.general.name}`);
  segments.push(`Ký hiệu / Model: ${equipment.general.model}`);
  segments.push(`Số Serial: ${equipment.general.serial}`);
  segments.push(`Mã tài sản: ${equipment.general.assetNo}`);
  segments.push(`Trạng thái hoạt động: ${equipment.general.status}`);
  segments.push(``);

  segments.push(`1. THÔNG TIN QUẢN LÝ & KHAI THÁC`);
  segments.push(`------------------------------------------------------------------`);
  segments.push(`- Đơn vị quản lý: ${equipment.org.companyName}`);
  segments.push(`- Bộ phận kỹ thuật: ${equipment.org.unit}`);
  segments.push(`- Vị trí lắp đặt: ${equipment.org.location}`);
  segments.push(`- Đài / Trạm CNS: ${equipment.org.stationName || 'N/A'}`);
  segments.push(`- Nhân viên chịu trách nhiệm: ${equipment.org.primaryEngineer}`);
  segments.push(`- Người giám sát: ${equipment.org.supervisor}`);
  if (equipment.org.contactPhone) {
    segments.push(`- Điện thoại liên hệ: ${equipment.org.contactPhone}`);
  }
  segments.push(``);

  segments.push(`2. THÔNG SỐ KỸ THUẬT CHÍNH`);
  segments.push(`------------------------------------------------------------------`);
  if (equipment.spec.power) segments.push(`- Công suất phát/tiêu thụ: ${equipment.spec.power}`);
  if (equipment.spec.channelFreq) segments.push(`- Tần số hoạt động / Kênh: ${equipment.spec.channelFreq}`);
  if (equipment.spec.mgmtIp) segments.push(`- Địa chỉ IP Quản trị: ${equipment.spec.mgmtIp}`);
  if (equipment.spec.interface) segments.push(`- Cổng kết nối / Giao tiếp: ${equipment.spec.interface}`);
  if (equipment.spec.coverage) segments.push(`- Tầm phủ / Cự ly: ${equipment.spec.coverage}`);
  if (equipment.spec.vswr) segments.push(`- Chỉ số VSWR: ${equipment.spec.vswr}`);
  if (equipment.spec.text) {
    segments.push(`- Mô tả kỹ thuật: ${equipment.spec.text}`);
  }
  segments.push(``);

  segments.push(`3. DANH SÁCH KHỐI LINH KIỆN ĐỒNG BỘ`);
  segments.push(`------------------------------------------------------------------`);
  if (!equipment.components || equipment.components.length === 0) {
    segments.push(`(Không có bản ghi linh kiện nào)`);
  } else {
    equipment.components.forEach((c) => {
      segments.push(`[+] ${c.no}. ${c.name} (Part No: ${c.partNo}) | S/N: ${c.serial} | SL: ${c.qty} | Trạng thái: ${c.healthStatus}`);
      if (c.notes) segments.push(`    Ghi chú: ${c.notes}`);
    });
  }
  segments.push(``);

  segments.push(`4. LỊCH SỬ BẢO DƯỠNG ĐỊNH KỲ`);
  segments.push(`------------------------------------------------------------------`);
  if (!equipment.maintenance || equipment.maintenance.length === 0) {
    segments.push(`(Chưa có bản ghi bảo dưỡng nào)`);
  } else {
    equipment.maintenance.forEach((m, idx) => {
      segments.push(`[✔] Đợt ${idx + 1} - Ngày: ${m.date} | Chu kỳ: ${m.cycle} | Người thực hiện: ${m.person}`);
      segments.push(`    - Nội dung: ${m.content}`);
      segments.push(`    - Tham số đo đạc: ${m.measuredParams}`);
      segments.push(`    - Kết quả đánh giá: ${m.result}`);
    });
  }
  segments.push(``);

  segments.push(`5. NHẬT KÝ SỰ CỐ & SỬA CHỮA`);
  segments.push(`------------------------------------------------------------------`);
  if (!equipment.repair || equipment.repair.length === 0) {
    segments.push(`(Chưa ghi nhận sự cố nào)`);
  } else {
    equipment.repair.forEach((r, idx) => {
      segments.push(`[✘] Vụ việc ${idx + 1} - Ngày xảy ra: ${r.date} | Trạng thái: ${r.status}`);
      segments.push(`    - Mô tả sự cố: ${r.incidentDescription}`);
      segments.push(`    - Nguyên nhân: ${r.rootCause}`);
      segments.push(`    - Biện pháp khắc phục: ${r.actionTaken}`);
      if (r.replacedParts) segments.push(`    - Linh kiện thay thế: ${r.replacedParts}`);
      segments.push(`    - Người xử lý trực tiếp: ${r.person}`);
    });
  }
  segments.push(``);
  segments.push(`==================================================================`);
  segments.push(`Tài liệu được xuất tự động từ phần mềm Quản lý Sổ Lý Lịch Thiết Bị CNS.`);
  segments.push(`Thời gian xuất bản: ${new Date().toLocaleString('vi-VN')} (Giờ Việt Nam)`);

  const fullBodyText = segments.join('\n');

  // Step 3: Insert the text using batchUpdate API
  const requests = [
    {
      insertText: {
        location: {
          index: 1,
        },
        text: fullBodyText,
      },
    },
  ];

  const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests,
    }),
  });

  if (!updateResponse.ok) {
    throw new Error(`Lỗi cập nhật nội dung tài liệu Google Doc. Mã lỗi: ${updateResponse.status}`);
  }

  return {
    documentId,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}
