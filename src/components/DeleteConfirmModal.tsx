import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, Check } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemTypeLabel?: string;
  itemDetails?: { label: string; value: string }[];
  warningText?: string;
  confirmButtonText?: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác Nhận Xóa Thiết Bị',
  itemName,
  itemTypeLabel = 'Hồ sơ thiết bị',
  itemDetails = [],
  warningText = 'Hành động này sẽ xóa vĩnh viễn hồ sơ và toàn bộ dữ liệu lịch sử liên quan (thông số, linh kiện, bảo dưỡng, sự cố). Không thể hoàn tác sau khi xóa.',
  confirmButtonText = 'Xác Nhận Xóa Vĩnh Viễn',
  isLoading = false
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        {/* Header with Red Accent */}
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Cảnh báo thao tác xóa dữ liệu hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white/80 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {itemTypeLabel} được chọn:
            </span>
            <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-sm font-bold text-slate-900 break-words">
                {itemName}
              </h4>

              {itemDetails.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                  {itemDetails.map((detail, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="text-slate-500 text-[11px] block">{detail.label}:</span>
                      <span className="font-semibold text-slate-800 font-mono text-xs">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Warning Box */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              {warningText}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer shadow-2xs"
          >
            Hủy Bỏ (Esc)
          </button>

          <button
            id="btn-confirm-delete-dialog"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
