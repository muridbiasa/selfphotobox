import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import { FrameTemplate, CapturedPhoto } from '../types';

interface PhotoSessionScreenProps {
  template: FrameTemplate;
  timerValue: number;
  onPhotosComplete: (photos: string[]) => void;
}

export default function PhotoSessionScreen({
  template,
  timerValue,
  onPhotosComplete
}: PhotoSessionScreenProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  
  // States of the state loop
  const [countdown, setCountdown] = useState<number>(timerValue);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(true);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [capturedTempUrl, setCapturedTempUrl] = useState<string>('');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  
  // Real camera vs simulator Fallback
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [usingMockCamera, setUsingMockCamera] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mockCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mockSimIntervalRef = useRef<number | null>(null);

  // 1. Initialize camera stream or fallback
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // tablet kiosk front camera
            width: { ideal: 1920 },  // Request HD resolution for better print quality
            height: { ideal: 1080 }
          },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraStream(stream);
        setCameraError(false);
        setUsingMockCamera(false);
      } catch (err) {
        console.warn('Physical camera stream access failed, starting animated Y2K simulation', err);
        setCameraError(true);
        setUsingMockCamera(true);
      }
    }

    initCamera();

    return () => {
      // Cleanup WebRTC stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (mockSimIntervalRef.current) {
        window.clearInterval(mockSimIntervalRef.current);
      }
    };
  }, []);

  // 2. Animate mock visual feed if camera is unavailable
  useEffect(() => {
    if (!usingMockCamera) return;

    let frame = 0;
    const canvas = mockCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    mockSimIntervalRef.current = window.setInterval(() => {
      frame++;
      // Draw simulated retro background
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moving colorful stripes
      ctx.fillStyle = template.bgColor;
      ctx.fillRect((frame * 2) % canvas.width, 50, 100, canvas.height - 100);
      ctx.fillStyle = template.borderColor;
      ctx.fillRect((frame * 3 + 200) % canvas.width, 150, 60, canvas.height - 300);

      // Star icon moving around
      ctx.fillStyle = '#FFFC00';
      ctx.beginPath();
      const starX = canvas.width / 2 + Math.sin(frame * 0.05) * 120;
      const starY = canvas.height / 2 + Math.cos(frame * 0.05) * 60;
      ctx.arc(starX, starY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Simple avatar outline representing user pose
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const headX = canvas.width / 2;
      const headY = canvas.height / 2 - 20;
      ctx.arc(headX, headY, 40, 0, Math.PI * 2); // Head
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX - 60, headY + 120);
      ctx.quadraticCurveTo(headX, headY + 50, headX + 60, headY + 120); // Shoulders
      ctx.stroke();

      // Floating instructions text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[ KAMERA SIMULATOR KIOSK ]', canvas.width / 2, 40);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#00E5FF';
      ctx.fillText('ACTIVE POSE REPLICATOR - SNAP #' + (activePhotoIndex + 1), canvas.width / 2, canvas.height - 30);
    }, 33); // ~30 fps

    return () => {
      if (mockSimIntervalRef.current) {
        window.clearInterval(mockSimIntervalRef.current);
      }
    };
  }, [usingMockCamera, activePhotoIndex, template]);

  // 3. Main Snapshot loop mechanics
  useEffect(() => {
    if (!isCountingDown || isReviewMode) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSnapshotCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountingDown, isReviewMode]);

  // Capture snapshot from stream
  const triggerSnapshotCapture = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300); // end splash color in 300ms

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (usingMockCamera) {
      const srcCanvas = mockCanvasRef.current;
      if (srcCanvas) {
        // Use simulator canvas dimensions
        canvas.width = srcCanvas.width;
        canvas.height = srcCanvas.height;
        // Draw simulator contents
        ctx.drawImage(srcCanvas, 0, 0, canvas.width, canvas.height);
      }
    } else if (videoRef.current && videoRef.current.videoWidth > 0) {
      // CRITICAL: Use actual video resolution, NOT CSS dimensions
      // This ensures maximum quality capture for printing
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Draw from real camera feed
      // Draw mirrored images so it matches screen poses
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Fallback dimensions if video not ready
      canvas.width = 1920;
      canvas.height = 1080;
    }

    // Export at maximum quality - use PNG for lossless or JPEG with quality 1.0
    const snapBase64 = canvas.toDataURL('image/png');
    setCapturedTempUrl(snapBase64);
    setIsReviewMode(true);
    setIsCountingDown(false);
  };

  // 4. Retake or Save callbacks
  const handleRetake = () => {
    // Redo index action
    setCapturedTempUrl('');
    setIsReviewMode(false);
    setCountdown(timerValue);
    setIsCountingDown(true);
  };

  const handleSaveAndProceed = () => {
    const updatedPhotos = [...photos];
    updatedPhotos[activePhotoIndex] = capturedTempUrl;
    setPhotos(updatedPhotos);

    setCapturedTempUrl('');
    setIsReviewMode(false);

    if (activePhotoIndex >= 3) {
      // All 4 photos captured completely!
      onPhotosComplete(updatedPhotos);
    } else {
      // Advance stage
      setActivePhotoIndex((prev) => prev + 1);
      setCountdown(timerValue);
      setIsCountingDown(true);
    }
  };

  // 5. Ctrl+Z keyboard shortcut hook for instant retake trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        if (isReviewMode) {
          e.preventDefault();
          handleRetake();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewMode]);

  return (
    <div
      id="photo-session-container"
      className="flex flex-col xl:flex-row items-center justify-center min-h-screen w-full bg-[#FFE5F1] p-4 font-sans select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.1) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Absolute Capture White Bulb Flash Overlay */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col xl:flex-row gap-6 max-w-6xl w-full">
        {/* LEFT AREA (80% / Main Area): Real-time live camera feed or simulated avatar screen */}
        <div className="flex-grow flex flex-col items-center">
          
          {/* Header Progress panel */}
          <div className="w-full flex items-center justify-between bg-white border-4 border-[#1A1A1A] neo-shadow-sm rounded-xl p-4 mb-4">
            <div>
              <span className="font-mono text-xs font-black uppercase text-[#8A2BE2]">SESI FOTO AKTIF</span>
              <h2 className="font-display font-black text-lg text-[#1A1A1A] uppercase tracking-tight">
                FRAME KE {activePhotoIndex + 1} DARI 4
              </h2>
            </div>
            {/* Status ticker */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping border border-black" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                {isReviewMode ? '🔴 FREEZE REVIEW' : '🟢 COUNTDOWN LIVE'}
              </span>
            </div>
          </div>

          {/* Live webcam feed box */}
          <div className="relative w-full aspect-[4/3] bg-[#1A1A1A] border-4 border-[#1A1A1A] neo-shadow rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            
            {/* Real WebRTC camera view (mirrored for ease of use) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              id="webcam-live-feed"
              style={{ transform: 'scaleX(-1)' }}
              className={`w-full h-full object-cover ${
                usingMockCamera || isReviewMode ? 'hidden' : 'block'
              }`}
            />

            {/* Simulated camera canvas */}
            <canvas
              ref={mockCanvasRef}
              width={640}
              height={480}
              className={`w-full h-full object-cover ${
                usingMockCamera && !isReviewMode ? 'block' : 'hidden'
              }`}
            />

            {/* Freeze snap review layout */}
            {isReviewMode && capturedTempUrl && (
              <img
                src={capturedTempUrl}
                alt="Captured Snapshot for frame"
                className="w-full h-full object-cover"
              />
            )}

            {/* Giant CountDown Numbers Overlay */}
            {!isReviewMode && isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#FFFC00] border-6 border-[#1A1A1A] flex items-center justify-center text-7xl sm:text-8xl font-display font-black text-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A]"
                >
                  {countdown}
                </motion.div>
              </div>
            )}

            {/* Corner Info Badge */}
            <div className="absolute bottom-4 left-4 inline-block px-3 py-1 bg-[#00E5FF] text-[#1A1A1A] font-mono text-xs font-bold border-2 border-[#1A1A1A] rounded">
              LENS ASPECT_4:3
            </div>

            {/* Template overlay badge frame */}
            <div className="absolute top-4 right-4 inline-block px-3 py-1 bg-[#FFE5F1] text-pink-600 font-mono text-[10px] font-bold border-2 border-pink-600 rounded">
              {template.name.toUpperCase()} tpl
            </div>
          </div>

          {/* BELOW CAMERA: Review Mode Controls or Posing status warnings */}
          <div className="w-full mt-6">
            {!isReviewMode ? (
              <div className="bg-white border-3 border-[#1A1A1A] p-4 rounded-xl text-center shadow-sm">
                <p className="font-display font-extrabold text-[#1A1A1A] uppercase text-base flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-400 fill-orange-400" />
                  Siapkan gayamu! Kamera menjepret otomatis saat hitung mundur selesai.
                </p>
              </div>
            ) : (
              <div
                id="review-panel"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
              >
                {/* BUTTON LEFT: Reject / REDO (Ctrl+Z) */}
                <button
                  id="action-redo"
                  onClick={handleRetake}
                  className="py-4.5 sm:py-5 bg-[#FF3366] text-white font-display font-black text-lg sm:text-xl uppercase border-4 border-[#1A1A1A] neo-shadow rounded-2xl cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#e02b59]"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>ULANGI FOTO INI (Ctrl+Z)</span>
                </button>

                {/* BUTTON RIGHT: Accept / Continue */}
                <button
                  id="action-save-photo"
                  onClick={handleSaveAndProceed}
                  className="py-4.5 sm:py-5 bg-[#00FF66] text-black font-display font-black text-lg sm:text-xl uppercase border-4 border-[#1A1A1A] neo-shadow rounded-2xl cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#00e059]"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>SIMPAN & LANJUT</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AREA (20%): Vertical Thumbnail strip representation of completed indices */}
        <div className="w-full xl:w-64 shrink-0 flex flex-col">
          <h3 className="font-display font-black text-[#1A1A1A] text-lg uppercase mb-3 text-center xl:text-left">
            🎞️ STRIP PREVIEW
          </h3>

          <div
            id="vertical-thumbnail-strip"
            className="flex flex-row xl:flex-col gap-3 justify-center xl:justify-start w-full bg-white border-4 border-[#1A1A1A] neo-shadow-sm p-4 rounded-2xl flex-grow overflow-y-auto"
            style={{ backgroundColor: template.bgColor }}
          >
            {[0, 1, 2, 3].map((index) => {
              const photoDataUrl = photos[index];
              const isSlotActive = activePhotoIndex === index && !isReviewMode;
              const isSlotReview = activePhotoIndex === index && isReviewMode;

              return (
                <div
                  key={index}
                  className={`relative aspect-[4/3] w-24 sm:w-28 xl:w-full border-3 rounded-lg overflow-hidden transition-all duration-150 ${
                    isSlotActive
                      ? 'border-[#FF3366] scale-105 shadow-[4px_4px_0px_rgba(26,26,26,1)] outline-dashed outline-3 outline-offset-3 outline-[#FF3366]'
                      : isSlotReview
                      ? 'border-[#00FF5E] scale-105 shadow-[4px_4px_0px_rgba(26,26,26,1)]'
                      : photoDataUrl
                      ? 'border-[#1A1A1A]'
                      : 'border-gray-300 opacity-60'
                  }`}
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  {/* Small tag number badge */}
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold rounded z-10">
                    #{index + 1}
                  </span>

                  {/* Thumbnail Image display */}
                  {photoDataUrl ? (
                    <img
                      src={photoDataUrl}
                      alt={`Thumbnail slice ${index}`}
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                  ) : isSlotReview && capturedTempUrl ? (
                    <img
                      src={capturedTempUrl}
                      alt={`Thumbnail freeze ${index}`}
                      className="w-full h-full object-cover transform scale-x-[-1] opacity-70"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-mono">
                      <Camera className="w-5 h-5 mb-0.5 opacity-50" />
                      <span className="text-[8px] font-bold">KOSONG</span>
                    </div>
                  )}

                  {/* Active highlight animation pulse */}
                  {isSlotActive && (
                    <div className="absolute inset-0 border-2 border-[#FF3366] animate-pulse pointer-events-none rounded" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Backup utility simulator details badge */}
          {usingMockCamera && (
            <div className="mt-4 p-3 bg-white border-2 border-[#1A1A1A] rounded-lg text-[10px] text-gray-500 font-medium leading-normal flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FF3366]" />
              <div>
                <span className="font-bold text-black uppercase block mb-0.5">EMULASI KAMERA</span>
                Kamera fisik ditutup browser/perangkat atau tidak terpasang. Mesin otomatis memulihkan visual avatar neon agar flow pemotretan bisa ditest!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden processing canvas used for sizing WebRTC captures */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
