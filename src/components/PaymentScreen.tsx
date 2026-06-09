import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface PaymentScreenProps {
  onBack:           () => void;
  onPaymentSuccess: (orderId: string) => void;
}

export default function PaymentScreen({ onBack, onPaymentSuccess }: PaymentScreenProps) {
  // Generate a simple order ID for tracking
  const orderId = 'QRIS-' + Date.now().toString().slice(-6);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-[#FFE5F1] p-6 select-none relative"
      style={{ backgroundImage: 'radial-gradient(rgba(26,26,26,0.1) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
    >
      {/* Tombol Lanjut di Pojok Kanan Atas */}
      <button
        onClick={() => onPaymentSuccess(orderId)}
        className="absolute top-6 right-6 px-6 py-3 bg-white text-[#1A1A1A] font-black border-4 border-[#1A1A1A] rounded-lg text-lg shadow-[6px_6px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all z-50"
      >
        Lanjut ➔
      </button>

      {/* Tombol Kembali */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white text-[#1A1A1A] font-bold border-4 border-[#1A1A1A] rounded-lg text-sm shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        <ArrowLeft className="w-4 h-4" /><span>Kembali</span>
      </button>

      {/* Main QRIS Card - Neo-Brutalism Style */}
      <div className="w-full max-w-md bg-[#FFFC00] border-4 border-[#1A1A1A] rounded-2xl p-8 flex flex-col items-center gap-6 shadow-[12px_12px_0px_#1A1A1A]">
        
        {/* Header Badge */}
        <div className="flex items-center gap-2 px-5 py-2 bg-[#1C2459] border-3 border-[#1A1A1A] rounded-full font-mono text-sm font-extrabold text-white">
          <ShieldCheck className="w-5 h-5" /><span>PEMBAYARAN QRIS</span>
        </div>

        {/* Judul Utama */}
        <h2 className="font-black text-3xl text-[#1A1A1A] uppercase tracking-tight text-center leading-tight">
          Scan QRIS untuk<br/>Membayar
        </h2>

        {/* Harga */}
        <p className="text-xl font-bold text-[#1A1A1A]">
          Rp 20.000
        </p>

        {/* QRIS Image - Ukuran Besar untuk Mudah Scan */}
        <div className="w-72 h-72 bg-white border-4 border-[#1A1A1A] rounded-xl flex items-center justify-center shadow-[6px_6px_0px_#1A1A1A]">
          <img 
            src="/qris-gopay.png" 
            alt="QRIS Code" 
            className="w-64 h-64 object-contain"
          />
        </div>

        {/* Instruksi */}
        <div className="text-center space-y-2">
          <p className="font-bold text-[#1A1A1A] text-lg uppercase">
            📱 Scan dengan E-Wallet Apapun!
          </p>
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            Gunakan GoPay, OVO, DANA, ShopeePay,<br/>atau aplikasi banking yang mendukung QRIS.
          </p>
        </div>

        {/* Footer - Supported Payment Methods */}
        <div className="w-full border-t-4 border-[#1A1A1A] pt-4 flex justify-center gap-3 text-xs font-black text-[#1A1A1A] flex-wrap">
          <span>GOPAY</span><span>•</span><span>OVO</span><span>•</span>
          <span>DANA</span><span>•</span><span>SHOPEEPAY</span><span>•</span><span>QRIS</span>
        </div>

        {/* Order ID Display */}
        <p
          className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2"
        >
          ORDER: {orderId}
        </p>
      </div>

      {/* Helper Text di Bawah */}
      <p className="mt-6 text-sm font-bold text-[#1A1A1A] text-center max-w-md">
        Setelah scan dan bayar, klik tombol <span className="bg-white px-2 py-1 border-2 border-[#1A1A1A] rounded">Lanjut ➔</span> di pojok kanan atas.
      </p>
    </div>
  );
}

/* 
==========================================================================
DEPRECATED - MIDTRANS CODE (Commented Out for Future Use)
==========================================================================

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError:   (result: any) => void;
        onClose:   () => void;
      }) => void;
    };
  }
}

type Phase = 'loading' | 'waiting_scan' | 'polling' | 'error';

const GAS_URL = import.meta.env.VITE_GAS_URL as string;
const PAYMENT_API_URL = '/api/pay/token';

function PaymentScreenMidtrans({ onBack, onPaymentSuccess }: PaymentScreenProps) {
  const [phase,    setPhase]    = useState<Phase>('loading');
  const [orderId,  setOrderId]  = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  useEffect(() => {
    let active = true;

    async function initPayment() {
      try {
        if (!PAYMENT_API_URL) throw new Error('Payment API URL belum diset');

        setPhase('loading');

        const res  = await fetch(PAYMENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 20000 }),
        });
        const data = await res.json();

        if (!active) return;
        if (!data.snapToken && !data.token) throw new Error(data.error || 'Gagal membuat token pembayaran');

        const snapToken = data.snapToken || data.token;
        const order_id = data.orderId || data.order_id;
        
        setOrderId(order_id);
        setPhase('waiting_scan');

        // ─── 2. Buka Midtrans Snap popup ──────────────
        if (!window.snap) throw new Error('Snap SDK belum termuat. Cek index.html.');

        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            if (!active) return;
            stopPolling();
            onPaymentSuccess(order_id);
          },
          onPending: () => {
            if (!active) return;
            setPhase('polling');
            startPolling(order_id);
          },
          onError: () => {
            if (!active) return;
            setErrorMsg('Pembayaran gagal. Silakan coba lagi.');
            setPhase('error');
          },
          onClose: () => {
            if (!active) return;
            setPhase('polling');
            startPolling(order_id);
          },
        });
      } catch (err: any) {
        if (active) { setErrorMsg(err.message); setPhase('error'); }
      }
    }

    initPayment();
    return () => { active = false; stopPolling(); };
  }, []);

  function startPolling(id: string) {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch('/api/pay/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id }),
        });
        const data = await res.json();
        if (data.status === 'paid') {
          stopPolling();
          onPaymentSuccess(id);
        }
      } catch (e) {
        console.warn('[polling] error:', e);
      }
    }, 2500);
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-[#1C2459] p-6 select-none"
      style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">

        <button
          onClick={() => { stopPolling(); onBack(); }}
          className="self-start flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-bold border-2 border-white/30 rounded-lg text-sm hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" /><span>Kembali</span>
        </button>

        <div className="w-full bg-white border-4 border-[#FFFC00] rounded-2xl p-8 flex flex-col items-center gap-5 shadow-[8px_8px_0px_#FFFC00]">

          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#FFFC00] border-2 border-[#1A1A1A] rounded-full font-mono text-xs font-extrabold">
            <ShieldCheck className="w-4 h-4" /><span>PEMBAYARAN QRIS AMAN</span>
          </div>

          <h2 className="font-black text-2xl text-[#1A1A1A] uppercase tracking-tight text-center">
            Bayar Rp 20.000
          </h2>

          {orderId && (
            <p
              className="text-[11px] font-mono text-gray-400 uppercase tracking-widest"
              onClick={() => {
                stopPolling();
                onPaymentSuccess(orderId || 'BYPASS');
              }}
            >
              ORDER: {orderId}
            </p>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-12 h-12 animate-spin text-[#1C2459]" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Membuat transaksi...</p>
            </div>
          )}

          {phase === 'waiting_scan' && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#1C2459] flex items-center justify-center border-3 border-[#FFFC00]">
                <span className="text-4xl">📱</span>
              </div>
              <p className="font-black text-lg text-[#1A1A1A] uppercase">Scan QRIS di Popup!</p>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Window pembayaran Midtrans sudah terbuka. Scan QRIS pakai GoPay, OVO, DANA, atau ShopeePay.
              </p>
              <p className="text-xs font-mono text-gray-400">Popup tertutup? Sistem tetap mendeteksi pembayaran.</p>
            </div>
          )}

          {phase === 'polling' && (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <div className="flex items-center gap-2 text-[#1C2459]">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="font-bold text-sm uppercase tracking-wider">Mendeteksi pembayaran...</span>
              </div>
              <p className="text-xs text-gray-500 max-w-xs">Sudah bayar? Sistem akan otomatis lanjut.</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="font-bold text-red-600 text-sm">{errorMsg}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-[#FF3366] text-white font-bold border-2 border-[#1A1A1A] rounded-lg text-sm"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {(phase === 'waiting_scan' || phase === 'polling') && (
            <div className="w-full border-t-2 border-dashed border-gray-200 pt-4 flex justify-center gap-4 text-xs font-mono font-bold text-gray-400 flex-wrap">
              <span>GOPAY</span><span>·</span><span>OVO</span><span>·</span>
              <span>DANA</span><span>·</span><span>SHOPEEPAY</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
*/
