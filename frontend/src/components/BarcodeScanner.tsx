'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertCircle, Keyboard, RefreshCw, ImageIcon, Upload } from 'lucide-react';
import { analyzeFromImage } from '@/lib/api';

interface BarcodeScannerProps {
  onClose?: () => void;
}

type Mode = 'camera' | 'manual' | 'upload';

export default function BarcodeScanner({ onClose }: BarcodeScannerProps) {
  const router        = useRouter();
  const scannerRef    = useRef<{ stop: () => Promise<void> } | null>(null);
  const mountedRef    = useRef(false);
  const startingRef   = useRef(false); // guard against StrictMode double-invoke
  const dropRef       = useRef<HTMLDivElement>(null);

  const [status,     setStatus]    = useState<'idle' | 'starting' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMsg,   setErrorMsg]  = useState('');
  const [mode,       setMode]      = useState<Mode>('camera');
  const [manualCode, setManualCode] = useState('');

  // Upload-tab state
  const [uploadFile,    setUploadFile]    = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadStatus,  setUploadStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadError,   setUploadError]   = useState('');
  const [isDragging,    setIsDragging]    = useState(false);

  const manualMode = mode === 'manual';

  const navigateTo = useCallback((input: string) => {
    const cleaned = input.trim();
    if (!cleaned) return;
    setStatus('success');
    // If input is all digits it's a barcode, otherwise treat as product name
    const isBarcode = /^\d+$/.test(cleaned.replace(/\s+/g, ''));
    const param = isBarcode
      ? `barcode=${encodeURIComponent(cleaned.replace(/\s+/g, ''))}`
      : `name=${encodeURIComponent(cleaned)}`;
    setTimeout(() => {
      if (mountedRef.current) router.push(`/dashboard?${param}`);
    }, 800);
  }, [router]);

  const stopScanner = useCallback(async () => {
    startingRef.current = false;
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (_) { /* ignore */ }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (startingRef.current || scannerRef.current) return; // already running / starting
    startingRef.current = true;
    if (mountedRef.current) { setStatus('starting'); setErrorMsg(''); }

    try {
      // Verify browser supports camera
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('no_support');
      }

      const { Html5Qrcode } = await import('html5-qrcode');

      // Bail out if the component unmounted while we were importing
      if (!mountedRef.current) { startingRef.current = false; return; }

      const scanner = new Html5Qrcode('qr-reader', { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decoded) => {
          if (!mountedRef.current) return;
          stopScanner();
          navigateTo(decoded);
        },
        () => { /* ignore per-frame decode failures — normal for non-barcode frames */ }
      );

      if (mountedRef.current) setStatus('scanning');
    } catch (err: unknown) {
      startingRef.current = false;
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      let friendly = 'Could not start camera. Try switching to Manual mode.';
      if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
        friendly = 'Camera permission denied. Please allow camera access in your browser settings, then tap Try Again.';
      } else if (msg.includes('no_support') || msg.includes('mediadevices')) {
        friendly = 'Your browser does not support camera scanning. Please use Manual mode instead.';
      } else if (msg.includes('notfound') || msg.includes('no camera')) {
        friendly = 'No camera found on this device. Please use Manual mode.';
      }
      setErrorMsg(friendly);
      setStatus('error');
    }
  }, [stopScanner, navigateTo]);

  useEffect(() => {
    mountedRef.current = true;
    if (mode === 'camera') startScanner();
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.trim().replace(/\s+/g, '');
    if (!cleaned) return;
    navigateTo(cleaned);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPEG, PNG, WebP, etc.).');
      return;
    }
    setUploadFile(file);
    setUploadError('');
    setUploadStatus('idle');
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || uploadStatus === 'loading') return;
    setUploadStatus('loading');
    setUploadError('');
    try {
      const result = await analyzeFromImage(uploadFile);
      // Store result so dashboard can display it without a second API call.
      try { sessionStorage.setItem('nutriscan_image_result', JSON.stringify(result)); } catch (_) {}
      setUploadStatus('success');
      setTimeout(() => {
        if (mountedRef.current) router.push('/dashboard?image=1');
      }, 600);
    } catch (err: unknown) {
      setUploadStatus('error');
      let msg = 'Image analysis failed. Please try a different image.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
        if (axiosErr.response?.data?.detail) {
          msg = axiosErr.response.data.detail;
        } else if (axiosErr.response?.status === 422) {
          msg = 'Could not extract food info from image. Make sure it clearly shows a barcode or nutrition label.';
        }
      }
      setUploadError(msg);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 glass rounded-xl">
        <button
          onClick={() => { setMode('camera'); setStatus('idle'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === 'camera' ? 'bg-green-500 text-black shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera size={15} /> Camera
        </button>
        <button
          onClick={() => { setMode('manual'); stopScanner(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === 'manual' ? 'bg-blue-500 text-white shadow-glow-blue' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Keyboard size={15} /> Manual
        </button>
        <button
          onClick={() => { setMode('upload'); stopScanner(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === 'upload' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon size={15} /> Upload
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'camera' ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            {/* Scan frame — rectangular for barcodes */}
            <div className="relative w-full rounded-2xl overflow-hidden glass border border-white/10" style={{ aspectRatio: '4/3' }}>
              {/* html5-qrcode mounts its own video here */}
              <div id="qr-reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden [&_div[style]]:hidden" />

              {/* Corner bracket overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Barcode guide box in the centre */}
                <div className="absolute inset-x-10 inset-y-12 border border-dashed border-white/10 rounded-sm" />

                {/* TL */}
                <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-green-400" />
                {/* TR */}
                <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-green-400" />
                {/* BL */}
                <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-green-400" />
                {/* BR */}
                <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-green-400" />

                {/* Scan line */}
                {status === 'scanning' && (
                  <motion.div
                    className="absolute left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_8px_#22c55e]"
                    animate={{ top: ['25%', '75%', '25%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>

              {/* Status overlays */}
              {status === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <div className="w-9 h-9 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Requesting camera…</span>
                  </div>
                </div>
              )}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/70"
                >
                  <div className="flex flex-col items-center gap-3 text-green-400">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                      <CheckCircle size={56} strokeWidth={1.5} />
                    </motion.div>
                    <span className="text-sm font-semibold">Barcode detected!</span>
                  </div>
                </motion.div>
              )}
              {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <AlertCircle size={40} className="text-red-400" />
                    <p className="text-sm text-red-300 leading-relaxed">{errorMsg}</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => { setStatus('idle'); startScanner(); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-black text-sm font-semibold"
                      >
                        <RefreshCw size={13} /> Try Again
                      </button>
                      <button
                        onClick={() => { setMode('manual'); stopScanner(); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg glass text-slate-300 text-sm font-medium"
                      >
                        <Keyboard size={13} /> Manual
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-slate-500 text-xs mt-3">
              Hold the barcode horizontally in the centre of the frame
            </p>
          </motion.div>
        ) : mode === 'manual' ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <div className="glass rounded-2xl p-8 flex flex-col gap-5 border border-white/10">
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Barcode or Product Name</p>
                <p className="text-slate-400 text-sm mt-1">Type a barcode number <span className="text-slate-500">or</span> a product name like <span className="text-green-400 font-medium">Lays</span>, <span className="text-green-400 font-medium">Nutella</span></p>
              </div>
              <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="e.g.  Lays  or  3017620422003"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 text-center text-lg tracking-wide focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all duration-200"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || status === 'success'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-black font-bold text-base disabled:opacity-40 hover:shadow-glow hover:scale-[1.02] transition-all duration-200"
                >
                  {status === 'success' ? '✓ Redirecting…' : 'Analyse Product'}
                </button>
              </form>
              <p className="text-center text-slate-600 text-xs">
                Supports EAN-8, EAN-13, UPC-A/E and most product barcodes
              </p>
            </div>
          </motion.div>
        ) : mode === 'upload' ? (
          /* ── Upload tab ────────────────────────────────────────────── */
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <div className="glass rounded-2xl p-6 flex flex-col gap-5 border border-white/10">
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Upload a Photo</p>
                <p className="text-slate-400 text-sm mt-1">
                  Photo of a <span className="text-purple-400 font-medium">barcode</span> or&nbsp;
                  <span className="text-purple-400 font-medium">nutrition label</span>
                </p>
              </div>

              <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
                {/* Drop zone */}
                <div
                  ref={dropRef}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-file-input')?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 overflow-hidden
                    ${isDragging ? 'border-purple-400 bg-purple-500/10' : 'border-white/15 hover:border-purple-400/60 hover:bg-white/5'}
                    ${uploadPreview ? 'p-0' : 'py-10 px-4'}`}
                  style={{ minHeight: uploadPreview ? 200 : undefined }}
                >
                  <input
                    id="image-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {uploadPreview ? (
                    /* Image preview */
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadPreview}
                        alt="preview"
                        className="w-full rounded-xl object-contain max-h-64"
                      />
                      <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent rounded-xl">
                        <span className="text-xs text-white font-medium">Click to change image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Upload size={24} className="text-purple-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-300 text-sm font-medium">
                          Drag &amp; drop or <span className="text-purple-400">click to browse</span>
                        </p>
                        <p className="text-slate-600 text-xs mt-1">JPEG · PNG · WebP · BMP</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Error message */}
                {(uploadError || uploadStatus === 'error') && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-xs leading-relaxed">{uploadError || 'Analysis failed.'}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!uploadFile || uploadStatus === 'loading' || uploadStatus === 'success'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base disabled:opacity-40 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {uploadStatus === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Analysing image…
                    </>
                  ) : uploadStatus === 'success' ? (
                    <>
                      <CheckCircle size={16} /> Redirecting…
                    </>
                  ) : (
                    <>
                      <ImageIcon size={16} /> Analyse Image
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-600 text-xs">
                AI reads barcodes and nutrition/ingredients labels
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {onClose && (
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors"
        >
          <X size={14} /> Cancel
        </button>
      )}
    </div>
  );
}
