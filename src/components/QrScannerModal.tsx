import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Camera, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  ZapOff, 
  FileText, 
  Printer, 
  Radio, 
  ExternalLink,
  QrCode,
  ScanLine,
  ChevronRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { Equipment } from '../types';
import { findEquipmentByQrCode, playBeepSuccess } from '../utils/qrUtils';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  onOpenEquipmentPdf: (equipment: Equipment) => void;
  onSelectEquipment: (id: string) => void;
}

export function QrScannerModal({
  isOpen,
  onClose,
  equipments,
  onOpenEquipmentPdf,
  onSelectEquipment
}: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'quick-select'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  
  // Scan result state
  const [scannedResult, setScannedResult] = useState<{
    rawCode: string;
    equipment: Equipment | null;
    timestamp: Date;
  } | null>(null);

  // Quick search filter for tab 3
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for video & canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop current video stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // Ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  };

  // Start video stream
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraError(null);

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt của bạn không hỗ trợ API Camera trực tiếp. Vui lòng sử dụng tính năng "Tải ảnh QR" hoặc "Chọn nhanh thiết bị".');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check for torch/flash capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setHasTorch(Boolean(capabilities && capabilities.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        // Start decoding loop
        requestScanFrame();
      }

      // Enumerate camera devices for switcher
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn('Failed to enumerate devices:', err);
      }
    } catch (err: any) {
      console.warn('Camera access unavailable:', err?.name || err?.message || err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied')) {
        setCameraError('Quyền truy cập Camera chưa được cấp trên trình duyệt. Bạn có thể bấm nút "Tải Ảnh Mã QR" hoặc "Chọn Nhanh Thiết Bị" bên dưới để tiếp tục.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Không tìm thấy thiết bị camera nào trên máy tính hoặc điện thoại của bạn.');
      } else {
        setCameraError(`Không thể mở camera (${err.message || 'Lỗi thiết bị'}). Vui lòng tải ảnh mã QR lên.`);
      }
    }
  };

  // Toggle torch/flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Continuous frame scanning loop
  const requestScanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(requestScanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameId.current = requestAnimationFrame(requestScanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      handleCodeScanned(code.data);
      return; // Stop loop after detected
    }

    animationFrameId.current = requestAnimationFrame(requestScanFrame);
  };

  // When a code is detected (via camera, file, or quick select)
  const handleCodeScanned = (rawCode: string) => {
    playBeepSuccess();
    stopCamera();

    const matchedEq = findEquipmentByQrCode(rawCode, equipments);
    setScannedResult({
      rawCode,
      equipment: matchedEq,
      timestamp: new Date()
    });

    if (matchedEq) {
      onSelectEquipment(matchedEq.id);
    }
  };

  // Handle Image File Upload & Decode
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleCodeScanned(code.data);
        } else {
          alert('Không tìm thấy mã QR hợp lệ trong bức ảnh này. Vui lòng thử ảnh khác có độ tương phản và góc chụp rõ hơn.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera(selectedCameraId);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, selectedCameraId]);

  // Reset scan to scan again
  const handleScanAgain = () => {
    setScannedResult(null);
    if (activeTab === 'camera') {
      startCamera(selectedCameraId);
    }
  };

  // Confirm open PDF
  const handleConfirmOpenPdf = (eq: Equipment) => {
    onClose();
    onOpenEquipmentPdf(eq);
  };

  // Filtered equipment for quick test select
  const filteredQuickList = equipments.filter(eq => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      eq.general.name?.toLowerCase().includes(q) ||
      eq.general.model?.toLowerCase().includes(q) ||
      eq.general.serial?.toLowerCase().includes(q) ||
      eq.org.stationName?.toLowerCase().includes(q) ||
      eq.org.location?.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-sky-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-900 via-sky-800 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-cyan-300 shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Quét Mã QR Sổ Lý Lịch</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  Auto Open PDF
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                Quét mã định danh thiết bị để mở trực tiếp Sổ lý lịch kỹ thuật PDF
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-sky-200 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB CONTROLS (Hide if already scanned a result) */}
        {!scannedResult && (
          <div className="bg-sky-50/60 p-2 border-b border-sky-100 flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/50'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera Trực Tiếp</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Tải Ảnh Mã QR</span>
            </button>

            <button
              onClick={() => setActiveTab('quick-select')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'quick-select'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Chọn Nhanh ({equipments.length})</span>
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 flex-1">

          {/* ========================================================== */}
          {/* CASE 1: SCANNED RESULT IS DETECTED */}
          {/* ========================================================== */}
          {scannedResult ? (
            <div className="space-y-4">
              {scannedResult.equipment ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-emerald-950">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                          Nhận diện thành công
                        </span>
                        <span className="text-xs font-mono text-emerald-600">
                          {scannedResult.equipment.general.category}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
                        {scannedResult.equipment.general.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span><strong>Model:</strong> {scannedResult.equipment.general.model}</span>
                        <span>•</span>
                        <span><strong>S/N:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono text-emerald-800 font-bold">{scannedResult.equipment.general.serial}</code></span>
                        <span>•</span>
                        <span><strong>Vị trí:</strong> {scannedResult.equipment.org.stationName || scannedResult.equipment.org.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions for detected equipment */}
                  <div className="mt-5 pt-4 border-t border-emerald-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                    <button
                      onClick={handleScanAgain}
                      className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Quét Mã Khác</span>
                    </button>

                    {scannedResult.equipment.pdfUrl && (
                      <a
                        href={scannedResult.equipment.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2.5 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở PDF Scan Gốc</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleConfirmOpenPdf(scannedResult.equipment!)}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition cursor-pointer transform hover:scale-[1.02]"
                    >
                      <Printer className="w-4 h-4 text-cyan-200" />
                      <span>Mở Sổ Lý Lịch PDF (8 Trang Chuẩn VATM)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-950">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        Đã quét mã, nhưng không tìm thấy thiết bị tương ứng trong hệ thống
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        Mã vừa đọc được: <code className="bg-white/80 px-2 py-0.5 rounded font-mono text-amber-900 border border-amber-300 break-all">{scannedResult.rawCode}</code>
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        Hãy đảm bảo mã QR chứa ID thiết bị (VD: <code>EQ-CNS-PARK-AIR-T6T</code>) hoặc số Serial chính xác của thiết bị trong danh mục.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-end gap-2">
                    <button
                      onClick={handleScanAgain}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Thử Quét Lại</span>
                    </button>
                    <button
                      onClick={() => {
                        setScannedResult(null);
                        setActiveTab('quick-select');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Chọn Từ Danh Sách</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ========================================================== */}
              {/* CASE 2: TAB CAMERA */}
              {/* ========================================================== */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  {cameraError ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-rose-900">Không thể bật Camera</h4>
                        <p className="text-xs text-rose-700 mt-1">{cameraError}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('upload');
                            setTimeout(() => fileInputRef.current?.click(), 100);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải Ảnh Mã QR Từ Máy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('quick-select')}
                          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Search className="w-3.5 h-3.5 text-blue-600" />
                          <span>Chọn Nhanh Thiết Bị</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId)}
                          className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Thử lại Camera</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] max-h-[340px] flex items-center justify-center shadow-inner">
                      
                      {/* Live Video Element */}
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />

                      {/* Hidden canvas for jsQR analysis */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Target Viewfinder Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-56 h-56 border-2 border-cyan-400/50 rounded-2xl bg-cyan-500/5 backdrop-blur-[0.5px]">
                          
                          {/* Corner brackets */}
                          <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg"></span>
                          <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg"></span>
                          <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg"></span>
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg"></span>

                          {/* Animated Scanning Laser Beam */}
                          <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-pulse top-1/2 -translate-y-1/2"></div>
                        </div>
                      </div>

                      {/* Camera Toolbar Overlay */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-cyan-300 border border-cyan-500/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>Đang nhận diện QR...</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {hasTorch && (
                            <button
                              onClick={toggleTorch}
                              className={`p-2 rounded-xl backdrop-blur-md border transition cursor-pointer ${
                                isTorchOn 
                                  ? 'bg-amber-400 text-slate-950 border-amber-300' 
                                  : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                              }`}
                              title={isTorchOn ? 'Tắt đèn Flash' : 'Bật đèn Flash'}
                            >
                              {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                            </button>
                          )}

                          {cameras.length > 1 && (
                            <button
                              onClick={() => {
                                const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId);
                                const nextIndex = (currentIndex + 1) % cameras.length;
                                const nextId = cameras[nextIndex].deviceId;
                                setSelectedCameraId(nextId);
                                startCamera(nextId);
                              }}
                              className="p-2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 rounded-xl transition cursor-pointer"
                              title="Chuyển đổi camera"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Instruction */}
                      <div className="absolute bottom-3 inset-x-4 text-center pointer-events-none">
                        <span className="inline-block bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-slate-200 border border-white/10">
                          Di chuyển camera hướng thẳng vào tem nhãn QR của thiết bị
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 text-center">
                    Gợi ý: Nếu không có camera, hãy dùng tab <strong>"Tải Ảnh Mã QR"</strong> hoặc tab <strong>"Chọn Nhanh"</strong> để trải nghiệm mở Sổ PDF.
                  </p>
                </div>
              )}

              {/* ========================================================== */}
              {/* CASE 3: TAB UPLOAD QR IMAGE */}
              {/* ========================================================== */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && fileInputRef.current) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        fileInputRef.current.files = dt.files;
                        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                    }}
                    className="border-2 border-dashed border-sky-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-sky-50/40 hover:bg-sky-50/80 transition cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 border border-sky-200 flex items-center justify-center mx-auto shadow-sm group-hover:scale-105 transition">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mt-3">
                      Tải ảnh hoặc Kéo thả ảnh mã QR vào đây
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Hỗ trợ tệp ảnh PNG, JPG, JPEG chụp tem thiết bị, ảnh màn hình hoặc ảnh mã QR tải về từ hệ thống.
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Chọn Tệp Ảnh
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* CASE 4: TAB QUICK SELECT (INSTANT TEST) */}
              {/* ========================================================== */}
              {activeTab === 'quick-select' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm thiết bị theo tên, model, serial hoặc đài trạm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-sky-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {filteredQuickList.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Không tìm thấy thiết bị nào khớp với từ khóa tìm kiếm.
                      </p>
                    ) : (
                      filteredQuickList.map(eq => (
                        <div
                          key={eq.id}
                          className="p-3 bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 rounded-xl flex items-center justify-between gap-3 transition group shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                                {eq.general.category}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {eq.general.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
                              Model: <span className="text-slate-700 font-semibold">{eq.general.model}</span> • S/N: <span className="text-blue-700 font-bold">{eq.general.serial}</span> • {eq.org.stationName || eq.org.location}
                            </p>
                          </div>

                          <button
                            onClick={() => handleCodeScanned(eq.id)}
                            className="px-3 py-1.5 bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white border border-blue-200 group-hover:border-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                            title="Mô phỏng quét mã QR để mở Sổ lý lịch PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Quét & Mở PDF</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tương thích máy quét mã vạch 2D & camera thiết bị di động
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
