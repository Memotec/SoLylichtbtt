import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  Download, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Check, 
  Copy,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { Equipment } from '../types';
import { generateEquipmentQrUrl, generateEquipmentQrDataUrl } from '../utils/qrUtils';

interface PrintProfileModalProps {
  equipment: Equipment | null;
  onClose: () => void;
  onExportDoc?: (equipment: Equipment) => void;
}

const defaultEquipmentFallback: Equipment = {
  id: '',
  createdAt: '',
  updatedAt: '',
  general: {
    name: '',
    category: 'VHF/UHF',
    model: '',
    manufacturer: '',
    serial: '',
    assetNo: '',
    bookletNo: '',
    yearMade: '',
    origin: '',
    commissioned: '',
    status: 'Đang khai thác',
    priority: 'Hệ thống chính (Level 1)'
  },
  org: {
    companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
    unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
    location: '',
    primaryEngineer: '',
    supervisor: ''
  },
  spec: {},
  components: [],
  maintenance: [],
  repair: []
};

export function PrintProfileModal({
  equipment,
  onClose,
  onExportDoc
}: PrintProfileModalProps) {
  const [viewMode, setViewMode] = useState<'all' | 'page'>('all');
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Local editable copy for live tweaks
  const [formData, setFormData] = useState<Equipment>(() => equipment ? { ...equipment } : defaultEquipmentFallback);

  useEffect(() => {
    if (equipment) {
      setFormData({ ...equipment });
    }
  }, [equipment]);

  const totalPages = 8;

  // Generate QR code for this equipment booklet
  useEffect(() => {
    let isMounted = true;
    const qrUrl = generateEquipmentQrUrl(formData);
    generateEquipmentQrDataUrl(qrUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    }).then(url => {
      if (isMounted) setQrDataUrl(url);
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [formData]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download Word / Google Docs .doc file
  const handleDownloadWordDoc = () => {
    const fileName = `Ly_Lich_Thiet_Bi_${formData.general.model || formData.general.serial || 'CNS'}_${new Date().toISOString().split('T')[0]}.doc`;

    const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Lý Lịch Thiết Bị</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4 */
          margin: 42.5pt 42.5pt 42.5pt 42.5pt;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        .page-break { page-break-after: always; break-after: page; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000000;
          margin: 0;
          padding: 0;
        }
        h1, h2, h3, h4, p { margin: 0 0 8pt 0; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8pt;
          margin-bottom: 12pt;
        }
        th, td {
          border: 1px solid #000000;
          padding: 6pt 8pt;
          font-size: 11pt;
          vertical-align: middle;
        }
        th {
          font-weight: bold;
          text-align: center;
          background-color: #f2f2f2;
        }
        .cover-box {
          border: 4px double #000000;
          padding: 24pt;
          min-height: 700pt;
          text-align: center;
        }
        .dotted-field {
          border-bottom: 1px dotted #000000;
          display: inline-block;
          font-weight: bold;
        }
        .page-number {
          text-align: center;
          font-size: 11pt;
          margin-top: 15pt;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        
        <!-- TRANG 1: BÌA SỔ -->
        <div class="cover-box">
          <table style="border:none; margin:0; width:100%;">
            <tr style="border:none;">
              <td style="border:none; text-align:center;">
                <p style="font-size:14pt; font-weight:bold; text-transform:uppercase;">${formData.org.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}</p>
                <p style="text-align:right; font-size:12pt; font-weight:bold; font-style:italic;">${formData.general.bookletNo ? formData.general.bookletNo : 'VHF'}</p>
              </td>
            </tr>
          </table>

          <div style="height: 120pt;"></div>

          <h1 style="font-size:26pt; font-weight:bold; text-transform:uppercase; letter-spacing:2px; margin-bottom:40pt;">
            LÝ LỊCH THIẾT BỊ
          </h1>

          <div style="border-top:1px dotted #000000; width:60%; margin:0 auto 50pt auto;"></div>

          <div style="text-align:left; font-size:13pt; margin-left:40pt; line-height:2.2;">
            <p><strong>Tên thiết bị:</strong> .................... <span style="font-weight:bold;">${formData.general.name}</span> ....................</p>
            <p><strong>Hãng sản xuất:</strong> .................... <span style="font-weight:bold;">${formData.general.manufacturer}</span> ....................</p>
            <p><strong>Số hiệu:</strong> .................... <span style="font-weight:bold;">${formData.general.model}</span> ....................</p>
            <p><strong>Mã số (S/N):</strong> .................... <span style="font-weight:bold;">${formData.general.serial}</span> ....................</p>
            <p><strong>Mã TS:</strong> .................... <span style="font-weight:bold;">${formData.general.assetNo || '....................'}</span> ....................</p>
          </div>

          <div style="height: 40pt;"></div>

          <div style="border:2px solid #000000; width:180pt; margin:0 auto; padding:8pt; text-align:center; font-size:12pt; font-weight:bold;">
            Số: <strong>${formData.general.bookletNo || '................'}</strong>
          </div>
          ${qrDataUrl ? `
          <div style="text-align:center; margin-top:15pt;">
            <img src="${qrDataUrl}" width="140" height="140" style="border:2.5px solid #000000; padding:4px; display:inline-block; background-color:#ffffff;" />
            <p style="font-size:10pt; font-weight:bold; margin-top:5pt; letter-spacing:0.5px;">MÃ QR TRUY XUẤT LÝ LỊCH ĐIỆN TỬ</p>
          </div>
          ` : ''}
        </div>

        <div class="page-break"></div>

        <!-- TRANG 2: MỤC LỤC & 1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ -->
        <div>
          <h2 style="text-align:center; font-size:16pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">MỤC LỤC</h2>
          <table style="border:none; width:100%; font-size:12pt; line-height:1.8;">
            <tr style="border:none;"><td style="border:none;"><strong>1. Cơ quan, đơn vị quản lý</strong></td><td style="border:none; text-align:right;"><strong>2</strong></td></tr>
            <tr style="border:none;"><td style="border:none;"><strong>2. Sơ lược thiết bị</strong></td><td style="border:none; text-align:right;"><strong>3</strong></td></tr>
            <tr style="border:none;"><td style="border:none; padding-left:20pt;">2.1. Đặc tính kỹ thuật</td><td style="border:none; text-align:right;">4</td></tr>
            <tr style="border:none;"><td style="border:none; padding-left:20pt;">2.2. Thành phần thiết bị</td><td style="border:none; text-align:right;">5</td></tr>
            <tr style="border:none;"><td style="border:none; padding-left:20pt;">2.3. Tài liệu kỹ thuật kèm theo</td><td style="border:none; text-align:right;">6</td></tr>
            <tr style="border:none;"><td style="border:none;"><strong>3. Bảo dưỡng</strong></td><td style="border:none; text-align:right;"><strong>7</strong></td></tr>
            <tr style="border:none;"><td style="border:none;"><strong>4. Kiểm tra - Sửa chữa - Thay thế - Thay đổi</strong></td><td style="border:none; text-align:right;"><strong>8</strong></td></tr>
          </table>

          <div style="height: 25pt;"></div>

          <h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:10pt;">
            1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ
          </h3>

          <table>
            <thead>
              <tr>
                <th style="width:25%;">NGÀY THÁNG</th>
                <th style="width:50%;">ĐƠN VỊ</th>
                <th style="width:25%;">TÌNH TRẠNG</th>
              </tr>
            </thead>
            <tbody>
              ${(formData.managingUnits && formData.managingUnits.length > 0)
                ? formData.managingUnits.map(u => `
                  <tr>
                    <td style="text-align:center;">${u.date}</td>
                    <td>${u.unitName}</td>
                    <td style="text-align:center;">${u.status}</td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td style="text-align:center;">${formData.general.commissioned || formData.general.yearMade || '2014'}</td>
                    <td>${formData.org.unit || 'Đài Thông Tin'}</td>
                    <td style="text-align:center;">Tốt</td>
                  </tr>
                `
              }
              ${Array.from({ length: 8 }).map(() => `
                <tr>
                  <td style="height:24pt;">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="page-number">2</div>
        </div>

        <div class="page-break"></div>

        <!-- TRANG 3: 2- SƠ LƯỢC THIẾT BỊ & GIẤY PHÉP -->
        <div>
          <h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">
            2 - SƠ LƯỢC THIẾT BỊ
          </h3>

          <div style="font-size:12pt; line-height:2.0; margin-bottom:15pt;">
            <p><strong>Tên thiết bị:</strong> .................... <span style="font-weight:bold;">${formData.general.name}</span> ....................</p>
            <p><strong>Hãng sản xuất:</strong> .................... <span style="font-weight:bold;">${formData.general.manufacturer}</span> ....................</p>
            <p><strong>Ký hiệu (Model):</strong> .................... <span style="font-weight:bold;">${formData.general.model}</span> ....................</p>
            <p><strong>Mã số (S/N):</strong> .................... <span style="font-weight:bold;">${formData.general.serial}</span> ....................</p>
            <p><strong>Năm sản xuất:</strong> .................... <span style="font-weight:bold;">${formData.general.yearMade || '................'}</span> ....................</p>
            <p><strong>Nước sản xuất:</strong> .................... <span style="font-weight:bold;">${formData.general.origin || 'ENGLAND'}</span> ....................</p>
            <p><strong>Thời gian sử dụng:</strong> .................... <span style="font-weight:bold;">${formData.general.usageTime || `Sử dụng từ ${formData.general.commissioned || '11/2014'}`}</span> ....................</p>
            <p><strong>Thời gian bảo hành:</strong> .................... <span style="font-weight:bold;">${formData.general.warrantyPeriod || '12 tháng'}</span> ....................</p>
          </div>

          <table>
            <thead>
              <tr>
                <th colspan="2" style="width:50%;">Giấy phép sử dụng tần số và thiết bị VTĐ</th>
                <th colspan="2" style="width:50%;">Giấy phép khai thác hệ thống kỹ thuật, thiết bị</th>
              </tr>
              <tr>
                <th style="width:25%;">Số</th>
                <th style="width:25%;">Ngày hết hạn</th>
                <th style="width:25%;">Số</th>
                <th style="width:25%;">Ngày hết hạn</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: Math.max(7, formData.licenseFrequency?.length || 0, formData.licenseOperation?.length || 0) }).map((_, idx) => {
                const freq = formData.licenseFrequency?.[idx];
                const oper = formData.licenseOperation?.[idx];
                return `
                  <tr>
                    <td style="text-align:center;">${freq ? freq.no : '&nbsp;'}</td>
                    <td style="text-align:center;">${freq ? freq.expireDate : '&nbsp;'}</td>
                    <td style="text-align:center;">${oper ? oper.no : '&nbsp;'}</td>
                    <td style="text-align:center;">${oper ? oper.expireDate : '&nbsp;'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="page-number">3</div>
        </div>

        <div class="page-break"></div>

        <!-- TRANG 4: 2.1 - ĐẶC TÍNH KỸ THUẬT -->
        <div>
          <h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">
            2.1 - ĐẶC TÍNH KỸ THUẬT
          </h3>

          <div style="font-size:12pt; line-height:2.4; padding:0 10pt;">
            ${Array.from({ length: 15 }).map(() => `
              <p style="border-bottom:1px dotted #000; height:24pt; margin:0;">&nbsp;</p>
            `).join('')}
          </div>

          <div class="page-number">4</div>
        </div>

        <div class="page-break"></div>

        <!-- TRANG 5: 2.2 - THÀNH PHẦN THIẾT BỊ -->
        <div>
          <h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">
            2.2 - THÀNH PHẦN THIẾT BỊ
          </h3>

          <table>
            <thead>
              <tr>
                <th style="width:8%;">TT</th>
                <th style="width:52%;">TÊN THIẾT BỊ</th>
                <th style="width:12%;">ĐVT</th>
                <th style="width:10%;">SL</th>
                <th style="width:18%;">GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              ${(formData.components && formData.components.length > 0)
                ? formData.components.map((c, i) => `
                  <tr>
                    <td style="text-align:center;">${(i + 1).toString().padStart(2, '0')}</td>
                    <td><strong>${c.name}</strong> ${c.partNo ? `(PN: ${c.partNo})` : ''} ${c.serial ? `(SN: ${c.serial})` : ''}</td>
                    <td style="text-align:center;">bộ</td>
                    <td style="text-align:center;">${(c.qty || 1).toString().padStart(2, '0')}</td>
                    <td>${c.notes || c.healthStatus || 'Tốt'}</td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td style="text-align:center;">01</td>
                    <td>${formData.general.name}</td>
                    <td style="text-align:center;">bộ</td>
                    <td style="text-align:center;">01</td>
                    <td>Đồng bộ</td>
                  </tr>
                `
              }
              ${Array.from({ length: Math.max(2, 14 - (formData.components?.length || 0)) }).map(() => `
                <tr>
                  <td style="height:22pt;">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="page-number">5</div>
        </div>

        <div class="page-break"></div>

        <!-- TRANG 6: 2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO -->
        <div>
          <h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">
            2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO
          </h3>

          <table>
            <thead>
              <tr>
                <th style="width:10%;">TT</th>
                <th style="width:60%;">TÊN TÀI LIỆU</th>
                <th style="width:12%;">SL</th>
                <th style="width:18%;">GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              ${(formData.technicalDocs && formData.technicalDocs.length > 0)
                ? formData.technicalDocs.map((doc, i) => `
                  <tr>
                    <td style="text-align:center;">${(i + 1).toString().padStart(2, '0')}</td>
                    <td><strong>${doc.name}</strong></td>
                    <td style="text-align:center;">${doc.qty}</td>
                    <td>${doc.notes || '---'}</td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td style="text-align:center;">01</td>
                    <td>T6T MK6 50W VHF Transmitter User Documentation</td>
                    <td style="text-align:center;">01</td>
                    <td>Kèm máy</td>
                  </tr>
                `
              }
              ${Array.from({ length: Math.max(2, 14 - (formData.technicalDocs?.length || 0)) }).map(() => `
                <tr>
                  <td style="height:22pt;">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="page-number">6</div>
        </div>

        <div class="page-break"></div>

        <!-- TRANG 7: 3 - BẢO DƯỠNG -->
        <div>
          <h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">
            3 - BẢO DƯỠNG
          </h3>

          <table>
            <thead>
              <tr>
                <th style="width:20%;">THỜI GIAN</th>
                <th style="width:60%;">KẾT LUẬN KẾT QUẢ BẢO DƯỠNG</th>
                <th style="width:20%;">NGƯỜI THỰC HIỆN</th>
              </tr>
            </thead>
            <tbody>
              ${(formData.maintenance && formData.maintenance.length > 0)
                ? formData.maintenance.slice(0, 10).map(m => `
                  <tr>
                    <td style="text-align:center;">${m.date}</td>
                    <td>
                      - ${m.content}<br/>
                      ${m.measuredParams ? `<span style="font-style:italic; font-size:10pt;">(Thông số: ${m.measuredParams})</span>` : ''}
                    </td>
                    <td style="text-align:center; font-weight:bold;">${m.person}</td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td colspan="3" style="text-align:center; font-style:italic;">Chưa có dữ liệu</td>
                  </tr>
                `
              }
              ${Array.from({ length: Math.max(1, 10 - Math.min(10, formData.maintenance?.length || 0)) }).map(() => `
                <tr>
                  <td style="height:22pt;">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="page-number">7</div>
        </div>

        <div class="page-break"></div>

        <!-- TRANG 8: 4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI -->
        <div>
          <h3 style="text-align:center; font-size:14pt; font-weight:bold; text-transform:uppercase; margin-bottom:15pt;">
            4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI
          </h3>

          <table>
            <thead>
              <tr>
                <th style="width:20%;">THỜI GIAN</th>
                <th style="width:60%;">NỘI DUNG THỰC HIỆN</th>
                <th style="width:20%;">NGƯỜI THỰC HIỆN</th>
              </tr>
            </thead>
            <tbody>
              ${(formData.repair && formData.repair.length > 0)
                ? formData.repair.map(r => `
                  <tr>
                    <td style="text-align:center;">${r.date}</td>
                    <td>
                      <strong>${r.incidentDescription}</strong><br/>
                      - Xử lý: ${r.actionTaken} ${r.replacedParts ? `(Thay: ${r.replacedParts})` : ''}
                    </td>
                    <td style="text-align:center; font-weight:bold;">${r.person}</td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td style="text-align:center;">10/10/17</td>
                    <td>Hỏng, đã gửi đi sửa chữa</td>
                    <td style="text-align:center;">Đội TT</td>
                  </tr>
                  <tr>
                    <td style="text-align:center;">02/04/19</td>
                    <td>Sửa xong, đưa vào hoạt động</td>
                    <td style="text-align:center;">Đội TT</td>
                  </tr>
                `
              }
              ${Array.from({ length: Math.max(2, 12 - (formData.repair?.length || 0)) }).map(() => `
                <tr>
                  <td style="height:22pt;">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="page-number">8</div>
        </div>

      </div>
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // Copy HTML content to clipboard
  const handleCopyHtml = () => {
    const el = document.getElementById('printBookletContainer');
    if (el) {
      navigator.clipboard.writeText(el.innerHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-sky-200 rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* TOP MODAL HEADER & CONTROLS (NO PRINT) */}
        <div className="bg-white px-4 py-3 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Sổ Lý Lịch Thiết Bị Kỹ Thuật (Chuẩn Form PDF VATM)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                  Chuẩn Sổ 8 Trang
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {formData.general.name} • SN: {formData.general.serial} • Model: {formData.general.model}
              </p>
            </div>
          </div>

          {/* VIEW MODE & EXPORT ACTIONS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Paper Size Selector */}
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  paperSize === 'A4' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Khổ giấy A4 tiêu chuẩn (210 x 297 mm)"
              >
                Khổ A4
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('A5')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  paperSize === 'A5' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Khổ giấy A5 sổ nhỏ bỏ túi (148 x 210 mm)"
              >
                Khổ A5 (Sổ Nhỏ)
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-sky-50/80 p-0.5 rounded-xl border border-sky-200 flex items-center text-xs">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất Cả 8 Trang
              </button>
              <button
                onClick={() => setViewMode('page')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'page' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Từng Trang (Lật sổ)
              </button>
            </div>

            {/* Page Navigator when in Single Page Mode */}
            {viewMode === 'page' && (
              <div className="flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-xl border border-sky-200 text-xs">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-1 text-blue-700 font-bold">
                  Trang {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PDF Attachment button if available */}
            {formData.pdfUrl && (
              <a
                href={formData.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Mở file scan PDF gốc đính kèm của thiết bị"
              >
                <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden md:inline">File PDF Gốc</span>
              </a>
            )}

            {/* Export Word Doc Button */}
            <button
              onClick={handleDownloadWordDoc}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Tải file Word (.doc) mở bằng Microsoft Word hoặc Google Docs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất Word / Docs (.doc)</span>
            </button>

            {/* Print to PDF / Hardcopy Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
              title="In ra giấy A4 hoặc chọn 'Lưu dưới dạng PDF' (Save as PDF)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Sổ / Lưu File PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QUICK PAGE SELECTION TAB BAR (NO PRINT) */}
        {viewMode === 'page' && (
          <div className="bg-sky-50/50 px-4 py-2 border-b border-sky-100 flex items-center gap-1 overflow-x-auto text-[11px] no-print scrollbar-none">
            {[
              { num: 1, label: 'Trang Bìa' },
              { num: 2, label: '1. Đơn Vị Quản Lý' },
              { num: 3, label: '2. Sơ Lược & Giấy Phép' },
              { num: 4, label: '2.1. Đặc Tính Kỹ Thuật' },
              { num: 5, label: '2.2. Thành Phần Thiết Bị' },
              { num: 6, label: '2.3. Tài Liệu Kỹ Thuật' },
              { num: 7, label: '3. Bảo Dưỡng' },
              { num: 8, label: '4. Sửa Chữa - Thay Thế' }
            ].map(tab => (
              <button
                key={tab.num}
                onClick={() => setCurrentPage(tab.num)}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition font-medium cursor-pointer ${
                  currentPage === tab.num
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/60'
                }`}
              >
                {tab.num}. {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Print CSS for A4 / A5 */}
        <style>{`
          /* Screen preview styles */
          .print-cover-page, .print-page {
            width: 100%;
            min-height: ${paperSize === 'A5' ? '740px' : '1050px'} !important;
            padding: ${paperSize === 'A5' ? '24px 32px' : '48px 60px'} !important;
            font-size: ${paperSize === 'A5' ? '11px' : '14px'} !important;
            line-height: ${paperSize === 'A5' ? '1.4' : '1.8'} !important;
          }
          
          /* Compact spacing for A5 on screen */
          ${paperSize === 'A5' ? `
            .print-page h2, .print-page h3 {
              font-size: 13px !important;
              margin-bottom: 8px !important;
            }
            .print-page p {
              margin-bottom: 4px !important;
              line-height: 1.4 !important;
            }
            .print-page table {
              margin-top: 4px !important;
              margin-bottom: 6px !important;
            }
            .print-page th, .print-page td {
              padding: 4px 6px !important;
              font-size: 10px !important;
            }
          ` : ''}

          @media print {
            @page {
              size: ${paperSize === 'A5' ? 'A5 portrait' : 'A4 portrait'};
              margin: ${paperSize === 'A5' ? '5mm' : '10mm'};
            }
            body {
              background: #ffffff !important;
            }
            .no-print {
              display: none !important;
            }
            
            .print-cover-page, .print-page {
              min-height: ${paperSize === 'A5' ? '195mm' : '272mm'} !important;
              padding: ${paperSize === 'A5' ? '8mm 10mm' : '15mm 20mm'} !important;
              font-size: ${paperSize === 'A5' ? '8.5pt' : '12pt'} !important;
              line-height: ${paperSize === 'A5' ? '1.4' : '1.8'} !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
            }

            /* Adjust cover border for print */
            .print-cover-page {
              border: 4px double #000000 !important;
            }

            ${paperSize === 'A5' ? `
              .print-page h2, .print-page h3 {
                font-size: 10pt !important;
                margin-bottom: 6pt !important;
              }
              .print-page table th, .print-page table td {
                padding: 2.5pt 4pt !important;
                font-size: 8pt !important;
              }
              .print-page .page-number {
                margin-top: 6pt !important;
              }
            ` : `
              .print-page h2, .print-page h3 {
                font-size: 14pt !important;
                margin-bottom: 12pt !important;
              }
              .print-page table th, .print-page table td {
                padding: 6pt 8pt !important;
                font-size: 11pt !important;
              }
            `}
          }
        `}</style>

        {/* PRINTABLE BOOKLET CONTAINER */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-100/80 flex-1">
          <div 
            id="printBookletContainer"
            className={`mx-auto transition-all duration-300 ${
              paperSize === 'A5' ? 'max-w-xl space-y-5 text-xs' : 'max-w-3xl space-y-8 text-sm'
            }`}
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >

            {/* ================================================================ */}
            {/* TRANG 1: BÌA SỔ LÝ LỊCH (COVER PAGE) */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 1) && (
              <div className="print-cover-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border-4 border-double border-black relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                
                {/* Header Bìa */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="text-center w-full">
                      <h2 className="text-lg font-bold uppercase tracking-wider text-black">
                        {formData.org.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}
                      </h2>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <span className="text-sm font-bold italic font-mono text-black">
                      {formData.general.bookletNo ? formData.general.bookletNo : 'B9 VHF'}
                    </span>
                  </div>
                </div>

                {/* Tiêu đề LÝ LỊCH THIẾT BỊ */}
                <div className="text-center my-auto py-12">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest uppercase text-black mb-6">
                    LÝ LỊCH THIẾT BỊ
                  </h1>
                  <div className="w-3/5 mx-auto border-b border-dotted border-black my-8"></div>

                  {/* Form thông tin bìa */}
                  <div className="text-left max-w-md mx-auto space-y-5 text-sm sm:text-base leading-relaxed">
                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 uppercase text-black">
                        {formData.general.name}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.manufacturer}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Số hiệu:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.model}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Mã số (S/N):</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 font-mono text-black">
                        {formData.general.serial}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Mã TS:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 font-mono text-black">
                        {formData.general.assetNo || '...........................................'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Khung Số & Mã QR số hóa ở chân bìa */}
                <div className="text-center pt-6 pb-2 flex flex-col items-center gap-3">
                  <div className="inline-block border border-black px-8 py-2 text-sm font-semibold">
                    Số: <span className="font-bold">{formData.general.bookletNo || '.........................'}</span>
                  </div>

                  {qrDataUrl && (
                    <div className="flex flex-col items-center pt-2 mt-1 border-t border-dotted border-black/30 w-32">
                      <img 
                        src={qrDataUrl} 
                        alt="Mã QR Sổ Lý Lịch" 
                        className="w-16 h-16 border border-black p-0.5 bg-white shrink-0 shadow-sm" 
                      />
                      <p className="text-[9px] font-bold uppercase tracking-tight text-black mt-1">MÃ QR SỔ LÝ LỊCH</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ================================================================ */}
            {/* TRANG 2: MỤC LỤC & 1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 2) && (
              <div className="print-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                <div className="space-y-6">
                  
                  {/* Mục Lục */}
                  <div className="text-center border-b border-black pb-4">
                    <h2 className="text-base font-bold uppercase tracking-wider mb-4">MỤC LỤC</h2>
                    <div className="text-left text-xs sm:text-sm space-y-1.5 max-w-lg mx-auto font-medium">
                      <div className="flex justify-between">
                        <span><strong>1. Cơ quan, đơn vị quản lý</strong></span>
                        <span><strong>2</strong></span>
                      </div>
                      <div className="flex justify-between">
                        <span><strong>2. Sơ lược thiết bị</strong></span>
                        <span><strong>3</strong></span>
                      </div>
                      <div className="flex justify-between pl-6 text-slate-700">
                        <span>2.1. Đặc tính kỹ thuật</span>
                        <span>4</span>
                      </div>
                      <div className="flex justify-between pl-6 text-slate-700">
                        <span>2.2. Thành phần thiết bị</span>
                        <span>5</span>
                      </div>
                      <div className="flex justify-between pl-6 text-slate-700">
                        <span>2.3. Tài liệu kỹ thuật kèm theo</span>
                        <span>6</span>
                      </div>
                      <div className="flex justify-between">
                        <span><strong>3. Bảo dưỡng</strong></span>
                        <span><strong>7</strong></span>
                      </div>
                      <div className="flex justify-between">
                        <span><strong>4. Kiểm tra - Sửa chữa - Thay thế - Thay đổi</strong></span>
                        <span><strong>8</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ */}
                  <div className="pt-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-center mb-3">
                      1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ
                    </h3>

                    <table className="w-full border-collapse border border-black text-xs text-left">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-center">
                          <th className="border border-black p-2 w-1/4">NGÀY THÁNG</th>
                          <th className="border border-black p-2 w-1/2">ĐƠN VỊ</th>
                          <th className="border border-black p-2 w-1/4">TÌNH TRẠNG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.managingUnits && formData.managingUnits.length > 0)
                          ? formData.managingUnits.map(u => (
                            <tr key={u.id}>
                              <td className="border border-black p-2 text-center font-semibold">{u.date}</td>
                              <td className="border border-black p-2 font-bold">{u.unitName}</td>
                              <td className="border border-black p-2 text-center font-semibold">{u.status}</td>
                            </tr>
                          ))
                          : (
                            <tr>
                              <td className="border border-black p-2 text-center font-semibold">
                                {formData.general.commissioned ? new Date(formData.general.commissioned).getFullYear() : '2014'}
                              </td>
                              <td className="border border-black p-2 font-bold">{formData.org.unit || 'Đài Thông Tin'}</td>
                              <td className="border border-black p-2 text-center font-semibold">Tốt</td>
                            </tr>
                          )
                        }
                        {/* Dòng kẻ trống đúng như sổ thực tế */}
                        {Array.from({ length: 8 }).map((_, idx) => (
                          <tr key={`empty-mu-${idx}`}>
                            <td className="border border-black p-2.5 text-center">&nbsp;</td>
                            <td className="border border-black p-2.5">&nbsp;</td>
                            <td className="border border-black p-2.5 text-center">&nbsp;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>

                <div className="text-center font-bold text-sm pt-4">2</div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TRANG 3: 2 - SƠ LƯỢC THIẾT BỊ & GIẤY PHÉP */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 3) && (
              <div className="print-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                <div className="space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-center">
                    2 - SƠ LƯỢC THIẾT BỊ
                  </h3>

                  {/* Dòng thông tin sơ lược có chấm */}
                  <div className="text-xs sm:text-sm space-y-2.5 leading-relaxed">
                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.name}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.manufacturer}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Ký hiệu (Model):</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.model}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Mã số (S/N):</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 font-mono text-black">
                        {formData.general.serial}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Năm sản xuất:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.yearMade || '...........................................'}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Nước sản xuất:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.origin || 'ENGLAND (Vương Quốc Anh)'}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Thời gian sử dụng:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.usageTime || `Sử dụng từ ${formData.general.commissioned || '11/2014'}`}
                      </span>
                    </div>

                    <div className="flex items-baseline">
                      <span className="font-semibold whitespace-nowrap">Thời gian bảo hành:</span>
                      <span className="border-b border-dotted border-black flex-1 ml-2 font-bold px-2 text-black">
                        {formData.general.warrantyPeriod || '12 tháng'}
                      </span>
                    </div>
                  </div>

                  {/* Bảng Giấy Phép Kép Chuẩn Scan PDF */}
                  <div className="pt-2">
                    <table className="w-full border-collapse border border-black text-[11px] text-center">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th colSpan={2} className="border border-black p-2 w-1/2">
                            Giấy phép sử dụng tần số<br />và thiết bị VTĐ
                          </th>
                          <th colSpan={2} className="border border-black p-2 w-1/2">
                            Giấy phép khai thác<br />hệ thống kỹ thuật, thiết bị
                          </th>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <th className="border border-black p-1.5 w-1/4">Số</th>
                          <th className="border border-black p-1.5 w-1/4">Ngày hết hạn</th>
                          <th className="border border-black p-1.5 w-1/4">Số</th>
                          <th className="border border-black p-1.5 w-1/4">Ngày hết hạn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ 
                          length: Math.max(7, formData.licenseFrequency?.length || 0, formData.licenseOperation?.length || 0) 
                        }).map((_, idx) => {
                          const freq = formData.licenseFrequency?.[idx];
                          const oper = formData.licenseOperation?.[idx];
                          return (
                            <tr key={`lic-${idx}`}>
                              <td className="border border-black p-1.5 font-semibold text-center font-mono">
                                {freq ? freq.no : ''}
                              </td>
                              <td className="border border-black p-1.5 text-center font-mono">
                                {freq ? freq.expireDate : ''}
                              </td>
                              <td className="border border-black p-1.5 font-semibold text-center font-mono">
                                {oper ? oper.no : ''}
                              </td>
                              <td className="border border-black p-1.5 text-center font-mono">
                                {oper ? oper.expireDate : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>

                <div className="text-center font-bold text-sm pt-4">3</div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TRANG 4: 2.1 - ĐẶC TÍNH KỸ THUẬT */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 4) && (
              <div className="print-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-center">
                    2.1 - ĐẶC TÍNH KỸ THUẬT
                  </h3>

                  {/* Các dòng kẻ chấm trống hoàn toàn để người dùng tự viết tay */}
                  <div className="space-y-4 font-normal pt-2">
                    {Array.from({ length: 15 }).map((_, idx) => (
                      <div key={`dot-line-${idx}`} className="border-b border-dotted border-black h-8"></div>
                    ))}
                  </div>

                </div>

                <div className="text-center font-bold text-sm pt-4">4</div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TRANG 5: 2.2 - THÀNH PHẦN THIẾT BỊ */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 5) && (
              <div className="print-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-center">
                    2.2 - THÀNH PHẦN THIẾT BỊ
                  </h3>

                  <table className="w-full border-collapse border border-black text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black p-2 w-12">TT</th>
                        <th className="border border-black p-2">TÊN THIẾT BỊ</th>
                        <th className="border border-black p-2 w-16">ĐVT</th>
                        <th className="border border-black p-2 w-14">SL</th>
                        <th className="border border-black p-2 w-28">GHI CHÚ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.components && formData.components.length > 0)
                        ? formData.components.map((c, i) => (
                          <tr key={c.id || i}>
                            <td className="border border-black p-2 text-center font-mono">
                              {(i + 1).toString().padStart(2, '0')}
                            </td>
                            <td className="border border-black p-2">
                              <span className="font-bold">{c.name}</span>
                              {c.partNo && <span className="text-[11px] font-mono text-slate-600 block">PN: {c.partNo}</span>}
                              {c.serial && <span className="text-[11px] font-mono text-slate-800 block">SN: {c.serial}</span>}
                            </td>
                            <td className="border border-black p-2 text-center">bộ</td>
                            <td className="border border-black p-2 text-center font-mono font-bold">
                              {(c.qty || 1).toString().padStart(2, '0')}
                            </td>
                            <td className="border border-black p-2 text-[11px]">
                              {c.notes || c.healthStatus || 'Tốt'}
                            </td>
                          </tr>
                        ))
                        : (
                          <tr>
                            <td className="border border-black p-2 text-center font-mono">01</td>
                            <td className="border border-black p-2 font-bold">{formData.general.name}</td>
                            <td className="border border-black p-2 text-center">bộ</td>
                            <td className="border border-black p-2 text-center font-mono font-bold">01</td>
                            <td className="border border-black p-2">Đồng bộ máy chính</td>
                          </tr>
                        )
                      }
                      {/* Dòng kẻ trống để ghi thêm */}
                      {Array.from({ length: Math.max(2, 13 - (formData.components?.length || 0)) }).map((_, idx) => (
                        <tr key={`empty-comp-${idx}`}>
                          <td className="border border-black p-2 text-center">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

                <div className="text-center font-bold text-sm pt-4">5</div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TRANG 6: 2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 6) && (
              <div className="print-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-center">
                    2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO
                  </h3>

                  <table className="w-full border-collapse border border-black text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black p-2 w-12">TT</th>
                        <th className="border border-black p-2">TÊN TÀI LIỆU</th>
                        <th className="border border-black p-2 w-16">SL</th>
                        <th className="border border-black p-2 w-28">GHI CHÚ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.technicalDocs && formData.technicalDocs.length > 0)
                        ? formData.technicalDocs.map((doc, i) => (
                          <tr key={doc.id || i}>
                            <td className="border border-black p-2 text-center font-mono">
                              {(i + 1).toString().padStart(2, '0')}
                            </td>
                            <td className="border border-black p-2 font-bold">
                              {doc.name}
                            </td>
                            <td className="border border-black p-2 text-center font-mono font-bold">
                              {doc.qty}
                            </td>
                            <td className="border border-black p-2 text-[11px]">
                              {doc.notes || 'Bản cứng kèm máy'}
                            </td>
                          </tr>
                        ))
                        : (
                          <tr>
                            <td className="border border-black p-2 text-center font-mono">01</td>
                            <td className="border border-black p-2 font-bold">
                              T6T MK6 50W VHF Transmitter User Documentation
                            </td>
                            <td className="border border-black p-2 text-center font-mono font-bold">01</td>
                            <td className="border border-black p-2">Bản cứng kèm máy</td>
                          </tr>
                        )
                      }
                      {/* Dòng kẻ trống dự phòng */}
                      {Array.from({ length: Math.max(2, 13 - (formData.technicalDocs?.length || 0)) }).map((_, idx) => (
                        <tr key={`empty-doc-${idx}`}>
                          <td className="border border-black p-2 text-center">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

                <div className="text-center font-bold text-sm pt-4">6</div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TRANG 7: 3 - BẢO DƯỠNG */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 7) && (
              <div className="print-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-center">
                    3 - BẢO DƯỠNG
                  </h3>

                  <table className="w-full border-collapse border border-black text-[11px] text-left">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black p-2 w-28">THỜI GIAN</th>
                        <th className="border border-black p-2">KẾT LUẬN KẾT QUẢ BẢO DƯỠNG</th>
                        <th className="border border-black p-2 w-28">NGƯỜI THỰC HIỆN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.maintenance && formData.maintenance.length > 0)
                        ? formData.maintenance.slice(0, 10).map((m, i) => (
                          <tr key={m.id || i}>
                            <td className="border border-black p-2 text-center font-mono font-semibold whitespace-nowrap">
                              {m.date}
                            </td>
                            <td className="border border-black p-2 leading-relaxed">
                              - {m.content}
                              {m.measuredParams && (
                                <span className="block text-[10px] text-slate-700 italic mt-0.5">
                                  ({m.measuredParams})
                                </span>
                              )}
                            </td>
                            <td className="border border-black p-2 text-center font-bold">
                              {m.person}
                            </td>
                          </tr>
                        ))
                        : (
                          <tr>
                            <td colSpan={3} className="border border-black p-3 text-center italic text-slate-500">
                              Chưa có nhật ký bảo dưỡng
                            </td>
                          </tr>
                        )
                      }
                      {/* Dòng kẻ trống để ghi tiếp */}
                      {Array.from({ length: Math.max(1, 10 - Math.min(10, formData.maintenance?.length || 0)) }).map((_, idx) => (
                        <tr key={`empty-maint-${idx}`}>
                          <td className="border border-black p-2 text-center">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                          <td className="border border-black p-2 text-center">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

                <div className="text-center font-bold text-sm pt-4">7</div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TRANG 8: 4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI */}
            {/* ================================================================ */}
            {(viewMode === 'all' || currentPage === 8) && (
              <div className="print-page bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 relative flex flex-col justify-between" style={{ minHeight: '1050px' }}>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-center">
                    4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI
                  </h3>

                  <table className="w-full border-collapse border border-black text-[11px] text-left">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black p-2 w-28">THỜI GIAN</th>
                        <th className="border border-black p-2">NỘI DUNG THỰC HIỆN</th>
                        <th className="border border-black p-2 w-28">NGƯỜI THỰC HIỆN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.repair && formData.repair.length > 0)
                        ? formData.repair.map((r, i) => (
                          <tr key={r.id || i}>
                            <td className="border border-black p-2 text-center font-mono font-semibold whitespace-nowrap">
                              {r.date}
                            </td>
                            <td className="border border-black p-2 leading-relaxed">
                              <span className="font-bold">{r.incidentDescription}</span>
                              <span className="block mt-0.5">
                                - Biện pháp: {r.actionTaken} {r.replacedParts ? `(Thay thế: ${r.replacedParts})` : ''}
                              </span>
                            </td>
                            <td className="border border-black p-2 text-center font-bold">
                              {r.person}
                            </td>
                          </tr>
                        ))
                        : (
                          <>
                            <tr>
                              <td className="border border-black p-2 text-center font-mono font-semibold">10/10/17</td>
                              <td className="border border-black p-2 font-semibold">Hỏng, đã gửi đi sửa chữa</td>
                              <td className="border border-black p-2 text-center font-bold">Đội TT</td>
                            </tr>
                            <tr>
                              <td className="border border-black p-2 text-center font-mono font-semibold">02/4/19</td>
                              <td className="border border-black p-2 font-semibold">Sửa xong, đưa vào hoạt động</td>
                              <td className="border border-black p-2 text-center font-bold">Đội TT</td>
                            </tr>
                          </>
                        )
                      }
                      {/* Dòng kẻ trống dự phòng */}
                      {Array.from({ length: Math.max(2, 11 - (formData.repair?.length || 0)) }).map((_, idx) => (
                        <tr key={`empty-repair-${idx}`}>
                          <td className="border border-black p-2 text-center">&nbsp;</td>
                          <td className="border border-black p-2">&nbsp;</td>
                          <td className="border border-black p-2 text-center">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

                <div className="text-center font-bold text-sm pt-4">8</div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
