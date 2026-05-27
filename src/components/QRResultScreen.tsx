import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { generateCompositeImage } from '../utils/canvas';
import { FrameTemplate } from '../types';
import { Loader2, Download, RefreshCw, FileImage, Sparkles, Check } from 'lucide-react';

interface QRResultScreenProps {
  photos: string[];
  template: FrameTemplate;
  orderId: string;
  onFinish: () => void;
}

export default function QRResultScreen({
  photos,
  template,
  orderId,
  onFinish
}: QRResultScreenProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [statusText, setStatusText] = useState<string>('Menggabungkan foto...');
  const [compositeUrl, setCompositeUrl] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [autoResetTimer, setAutoResetTimer] = useState<number>(60);

  // 1. Core composite rendering & upload logic on screen mount
  useEffect(() => {
    let isActive = true;

    async function processAndUpload() {
      let mergedBase64 = '';
      try {
        // Step A: Draw onto 1000px composite canvas
        if (isActive) setStatusText('Menggabungkan capture ke frame...');
        mergedBase64 = await generateCompositeImage(photos, template);
        
        if (!isActive) return;
        setCompositeUrl(mergedBase64);

        // Step B: Upload composite to our full-stack server
        if (isActive) setStatusText('Mengunggah ke database awan...');
        const hostUrl = `${window.location.origin}/api/upload`;
        
        const response = await fetch(hostUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId || 'GUEST-' + Date.now(),
            image: mergedBase64
          })
        });
        
        const uploadResult = await response.json();
        if (!isActive) return;

        if (uploadResult.success) {
          // Construct download link
          const downloadLink = `${window.location.origin}${uploadResult.downloadUrl}`;
          setDownloadUrl(downloadLink);

          // Step C: Convert download link to scannable QRCode
          if (isActive) setStatusText('Membuat QR Code unduhan...');
          const qrCodeBase64 = await QRCode.toDataURL(downloadLink, {
            width: 320,
            margin: 2,
            color: {
              dark: '#1A1A1A',
              light: '#FFFFFF',
            }
          });

          if (isActive) {
            setQrCodeUrl(qrCodeBase64);
            setLoading(false);
            
            // Pop confetti celebration!
            try {
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch (e) {
              console.warn('Confetti fail', e);
            }
          }
        } else {
          throw new Error('Upload error returned from Server API');
        }
      } catch (err) {
        console.error('Composite / upload failure: ', err);
        if (isActive) {
          setStatusText('Gagal mengunggah photo, memuat tautan darurat...');
          // Fallback to offline inline base64 if upload fails
          setDownloadUrl(mergedBase64 || '');
          setLoading(false);
        }
      }
    }

    processAndUpload();

    return () => {
      isActive = false;
    };
  }, [photos, template, orderId]);

  // 2. Auto-reset countdown timer (60s limit)
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setAutoResetTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  // Safe side-effect to trigger onFinish once the countdown reaches zero
  useEffect(() => {
    if (autoResetTimer === 0 && !loading) {
      onFinish();
    }
  }, [autoResetTimer, loading, onFinish]);

  return (
    <div
      id="qr-result-screen-container"
      className="flex flex-col items-center justify-center min-h-screen w-full bg-[#FFE5F1] p-4 sm:p-6 font-sans select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.1) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          /* STATE 1: UPLOADING Loading Panel (Y2K continuous motion marquee style) */
          <motion.div
            key="loading-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center max-w-md w-full bg-white border-4 border-[#1A1A1A] neo-shadow rounded-2xl p-8 text-center"
          >
            {/* Spinning Star logo */}
            <div className="relative p-6 bg-[#FFFC00] border-3 border-[#1A1A1A] rounded-full mb-6 animate-bounce">
              <Loader2 className="w-12 h-12 text-[#1A1A1A] animate-spin" />
            </div>

            <h2 className="font-display font-black text-2xl text-[#1A1A1A] uppercase tracking-tight mb-2">
              PROSES UNGGAH CLOUD
            </h2>
            <div className="w-full border-t-3 border-b-3 border-[#1A1A1A] bg-[#00E5FF] py-2 overflow-hidden select-none whitespace-nowrap mb-6">
              <div className="inline-block animate-marquee uppercase text-black font-mono text-xs font-black tracking-widest">
                MENCAMPUR CAPTURES • SAVING TO GOOGLE DRIVE CLOUD • KOMPILASI CANVAS • MOHON TUNGGU SEBENTAR • 
              </div>
            </div>

            <p className="text-sm font-bold text-gray-700 bg-gray-50 px-4 py-2 border-2 border-dashed border-[#1A1A1A] rounded">
              {statusText}
            </p>
          </motion.div>
        ) : (
          /* STATE 2: QR RESULT GRID PANEL (Show photo cards & mobile download scans) */
          <motion.div
            key="result-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center max-w-4xl w-full"
          >
            {/* Header Badge */}
            <div className="px-6 py-2 bg-[#00FF66] text-black border-4 border-[#1A1A1A] rounded-full font-display font-black text-lg sm:text-2xl uppercase tracking-tighter mb-4 flex items-center gap-2 rotate-[-1deg] neo-shadow-sm">
              <Check className="w-6 h-6 stroke-[4px]" />
              <span>FOTO BERHASIL DISIMPAN!</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl text-[#1A1A1A] uppercase text-center mb-8 drop-shadow-sm">
              AMBIL PRINT DIGITAL KAMU DARI HP
            </h1>

            {/* Main Visual Layout (Split preview vs QR Code column) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full bg-white border-4 border-[#1A1A1A] neo-shadow rounded-2xl p-6 sm:p-8 mb-8">
              
              {/* LEFT COLUMN: QR Scan code */}
              <div className="flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-dashed border-[#1A1A1A] pb-6 md:pb-0 md:pr-8 text-center">
                <div className="px-4 py-1.5 bg-[#FFFC00] border-2 border-[#1A1A1A] rounded font-mono text-xs font-extrabold max-w-max mb-5 uppercase rotate-1">
                  ORDER ID: {orderId || 'NEW_PRINT'}
                </div>

                <div className="relative w-60 h-60 border-4 border-[#1A1A1A] rounded-xl p-3 bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform duration-150">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Scannable Download QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="mt-5 px-5 py-2.5 bg-[#00E5FF] text-black border-3 border-[#1A1A1A] neo-shadow-sm font-display font-black text-xs sm:text-sm uppercase rounded-xl tracking-tight max-w-xs rotate-[-1deg]">
                  SCAN QR DI ATAS DENGAN KAMERA HP UNTUK DOWNLOAD !
                </div>

                <div className="mt-4 flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">ATAU DOWNLOAD VIA TAUTAN LANGSUNG:</span>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#8A2BE2] hover:underline break-all max-w-[280px]"
                  >
                    {downloadUrl}
                  </a>
                </div>
              </div>

              {/* RIGHT COLUMN: Composite Preview Polaroid card */}
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <p className="text-xs font-mono font-black text-[#555] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-[#FF3366]" />
                  PRINTOUT PREVIEW (COMPOSITE)
                </p>

                <div className={`w-full border-3 border-[#1A1A1A] rounded-lg overflow-hidden shadow-[8px_8px_0px_#1A1A1A] relative bg-gray-50 ${
                  template.id === 'sedes-run' ? 'max-w-[170px] aspect-[500/1500]' : 'max-w-[280px] aspect-[1000/1100]'
                }`}>
                  {compositeUrl ? (
                    <img
                      src={compositeUrl}
                      alt="Master Polaroid Composite print image"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-xs">
                      Generating...
                    </div>
                  )}
                </div>

                {/* Direct download Button */}
                <a
                  href={compositeUrl}
                  download={`Memo4Frame_${orderId || Date.now()}.png`}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#8A2BE2] text-white font-mono text-xs font-black border-3 border-[#1A1A1A] neo-shadow-sm neo-button rounded-xl uppercase hover:bg-[#6c1bb8]"
                >
                  <Download className="w-4 h-4" />
                  <span>SIMPAN KE KOMPUTER</span>
                </a>
              </div>
            </div>

            {/* Bottom Reset Actions bar */}
            <div className="w-full max-w-md flex flex-col items-center">
              {/* Selesai Button with Countdown */}
              <button
                id="finish-reset-btn"
                onClick={onFinish}
                className="w-full py-4 bg-[#FF3366] text-white font-display font-black text-xl uppercase border-4 border-[#1A1A1A] neo-shadow rounded-2xl cursor-pointer duration-75 text-center tracking-tight flex items-center justify-center gap-2 hover:bg-[#e02b59]"
              >
                <span>SELESAI ({autoResetTimer}s)</span>
              </button>
              
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide text-center mt-3">
                Kiosk akan otomatis reset ke halaman utama jika ditinggalkan
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
