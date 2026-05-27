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

interface PaymentScreenProps {
  onBack:           () => void;
  onPaymentSuccess: (orderId: string) => void;
}

type Phase = 'loading' | 'waiting_scan' | 'polling' | 'error';

// GAS URL — dibaca dari env variable Vite
const GAS_URL = import.meta.env.VITE_GAS_URL as string;

export default function PaymentScreen({ onBack, onPaymentSuccess }: PaymentScreenProps) {
  const [phase,    setPhase]    = useState<Phase>('loading');
  const [orderId,  setOrderId]  = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  // ─── 1. Minta token ke GAS ────────────────────────────
  useEffect(() => {
    let active = true;

    async function initPayment() {
      try {
        if (!GAS_URL) throw new Error('VITE_GAS_URL belum diset di Vercel env');

        setPhase('loading');

        const res  = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' }, // GAS butuh text/plain bukan application/json
          body: JSON.stringify({ action: 'createToken' }),
        });
        const data = await res.json();

        if (!active) return;
        if (!data.snapToken) throw new Error(data.error || 'GAS gagal buat token');

        setOrderId(data.orderId);
        setPhase('waiting_scan');

        // ─── 2. Buka Midtrans Snap popup ──────────────
        if (!window.snap) throw new Error('Snap SDK belum termuat. Cek index.html.');

        window.snap.pay(data.snapToken, {
          onSuccess: (result) => {
            if (!active) return;
            stopPolling();
            onPaymentSuccess(data.orderId);
          },
          onPending: () => {
            if (!active) return;
            setPhase('polling');
            startPolling(data.orderId);
          },
          onError: () => {
            if (!active) return;
            setErrorMsg('Pembayaran gagal. Silakan coba lagi.');
            setPhase('error');
          },
          onClose: () => {
            if (!active) return;
            setPhase('polling');
            startPolling(data.orderId);
          },
        });
      } catch (err: any) {
        if (active) { setErrorMsg(err.message); setPhase('error'); }
      }
    }

    initPayment();
    return () => { active = false; stopPolling(); };
  }, []);

  // ─── 3. Polling status via GAS ────────────────────────
  function startPolling(id: string) {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'checkStatus', orderId: id }),
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
            <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
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
