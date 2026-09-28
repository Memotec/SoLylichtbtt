import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink, 
  Radio, 
  Tag, 
  ShieldCheck 
} from 'lucide-react';
import { Equipment } from '../types';
import { generateEquipmentQrUrl, generateEquipmentQrDataUrl } from '../utils/qrUtils';

interface QrLabelModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPdf: (equipment: Equipment) => void;
}

export function QrLabelModal({
  equipment,
  isOpen,
  onClose,
  onOpenPdf
}: QrLabelModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoadingQr, setIsLoadingQr] = useState(true);

  const qrUrl = equipment ? generateEquipmentQrUrl(equipment) : '';

  useEffect(() => {
    if (!isOpen || !equipment || !qrUrl) return;
    let isMounted = true;
    setIsLoadingQr(true);

    generateEquipmentQrDataUrl(qrUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#032b69', // Brand Navy
        light: '#ffffff'
      }
    }).then(url => {
      if (isMounted) {
        setQrDataUrl(url);
        setIsLoadingQr(false);
      }
    }).catch(err => {
      console.error('Error generating QR:', err);
      if (isMounted) setIsLoadingQr(false);
    });

    return () => {
      isMounted = false;
    };
  }, [equipment, qrUrl, isOpen]);

  // Copy deep-link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Download QR PNG image
  const handleDownloadPng = () => {
    if (!qrDataUrl || !equipment) return;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = qrDataUrl;
    downloadAnchor.download = `QR_${equipment.general.model || equipment.id}_${equipment.general.serial || 'cns'}.png`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print Label Handler
  const handlePrintLabel = () => {
    if (!equipment) return;
    const printWindow = window.open('', '_blank', 'width=700,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tem Nhãn Thiết Bị - ${equipment.general.name}</title>
        <style>
          @page {
            size: 100mm 70mm;
            margin: 4mm;
          }
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 8px;
            color: #000;
            background: #fff;
          }
          .label-card {
            border: 2px solid #000;
            border-radius: 6px;
            padding: 8px 10px;
            max-width: 96mm;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            border-bottom: 1.5px solid #000;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          .header h4 {
            font-size: 11pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
          }
          .header p {
            font-size: 8.5pt;
            margin: 2px 0 0 0;
            font-weight: 600;
          }
          .content {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .qr-box {
            text-align: center;
            flex-shrink: 0;
          }
          .qr-box img {
            width: 110px;
            height: 110px;
            display: block;
          }
          .qr-box span {
            font-size: 7.5pt;
            font-weight: bold;
            display: block;
            margin-top: 3px;
          }
          .details {
            flex-grow: 1;
            font-size: 9.5pt;
            line-height: 1.45;
          }
          .details p {
            margin: 2px 0;
          }
          .details strong {
            font-size: 9pt;
          }
          .badge {
            font-size: 8pt;
            font-family: monospace;
            font-weight: bold;
          }
          .footer-note {
            margin-top: 6px;
            border-top: 1px dashed #666;
            padding-top: 4px;
            font-size: 7.5pt;
            text-align: center;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="label-card">
          <div class="header">
            <h4>TỔNG CÔNG TY QUẢN LÝ BAY VIỆT NAM</h4>
            <p>CÔNG TY QUẢN LÝ BAY MIỀN NAM • ĐÀI THÔNG TIN</p>
          </div>
          <div class="content">
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="QR Code" />
              <span>QUÉT MỞ SỔ PDF</span>
            </div>
            <div class="details">
              <p><strong>TÊN TB:</strong> ${equipment.general.name}</p>
              <p><strong>MODEL:</strong> <b>${equipment.general.model}</b> | <strong>S/N:</strong> <span class="badge">${equipment.general.serial}</span></p>
              <p><strong>VỊ TRÍ:</strong> ${equipment.org.stationName || equipment.org.location}</p>
              <p><strong>SỔ SỐ:</strong> ${equipment.general.bookletNo || '---'} | <strong>MÃ TS:</strong> ${equipment.general.assetNo || '---'}</p>
              <p><strong>NGÀY ĐƯA VÀO SD:</strong> ${equipment.general.commissioned || equipment.general.yearMade || '---'}</p>
            </div>
          </div>
          <div class="footer-note">
            Quét mã QR bằng điện thoại hoặc máy quét để xem Sổ lý lịch kỹ thuật & lịch sử bảo dưỡng
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-sky-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-inner">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tem Nhãn & Mã QR Sổ Lý Lịch</h3>
              <p className="text-xs text-slate-300 font-mono">
                {equipment.general.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* PHYSICAL LABEL PREVIEW CARD */}
          <div className="border-2 border-slate-900 rounded-2xl p-4 bg-slate-50 shadow-sm relative overflow-hidden">
            <div className="text-center border-b border-slate-300 pb-2 mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Tổng công ty Quản lý bay Việt Nam
              </h4>
              <p className="text-[10px] font-semibold text-slate-600 uppercase">
                Công ty Quản lý bay miền Nam • Sổ Lý Lịch Thiết Bị Kỹ Thuật
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0 bg-white p-2 rounded-xl border border-slate-200 text-center shadow-xs">
                {isLoadingQr ? (
                  <div className="w-28 h-28 flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                ) : (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-28 h-28 object-contain rounded-lg"
                  />
                )}
                <span className="block text-[9px] font-extrabold text-blue-900 mt-1 uppercase tracking-tighter">
                  Quét mở Sổ PDF
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-700 min-w-0 flex-1">
                <p className="font-bold text-slate-900 leading-snug truncate">
                  {equipment.general.name}
                </p>
                <p className="text-[11px] font-mono">
                  <span className="text-slate-500">Model:</span> <strong>{equipment.general.model}</strong>
                </p>
                <p className="text-[11px] font-mono">
                  <span className="text-slate-500">S/N:</span> <strong className="text-blue-700 font-bold">{equipment.general.serial}</strong>
                </p>
                <p className="text-[11px]">
                  <span className="text-slate-500">Đài trạm:</span> {equipment.org.stationName || equipment.org.location}
                </p>
                <p className="text-[11px]">
                  <span className="text-slate-500">Sổ số:</span> <span className="font-bold text-slate-800">{equipment.general.bookletNo || '---'}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-[10px] text-center text-slate-500 italic">
              Dán tem nhãn này lên mặt trước chassis/rack máy để kỹ sư quét kiểm tra nhanh
            </div>
          </div>

          {/* QUICK LINK BAR */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-mono text-[11px] truncate max-w-[280px]">
              {qrUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 bg-white hover:bg-sky-100 text-blue-700 border border-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handlePrintLabel}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>In Tem Dán Thiết Bị</span>
            </button>

            <button
              onClick={handleDownloadPng}
              className="py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-blue-900 border border-sky-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Tải Ảnh Mã QR (.PNG)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPdf(equipment);
              }}
              className="sm:col-span-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-200" />
              <span>Mở Sổ Lý Lịch PDF Của Thiết Bị Này</span>
            </button>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tem nhãn chuẩn hóa phục vụ kiểm tra an toàn kỹ thuật CNS
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
