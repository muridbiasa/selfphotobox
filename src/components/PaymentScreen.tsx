import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface PaymentScreenProps {
  onBack: () => void;
  onPaymentSuccess: (orderId: string) => void;
}

export default function PaymentScreen({ onBack, onPaymentSuccess }: PaymentScreenProps) {
  const [orderId, setOrderId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [qrCodeDataUrl, setQrCodeDataURL] = useState<string>('');
  const [, setError] = useState<string>('');
  const [simulationUrl, setSimulationUrl] = useState<string>('');
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize order and generate QR Code
  useEffect(() => {
    let active = true;

    async function initializeOrder() {
      try {
        setLoading(true);
        const res = await fetch('/api/pay/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        
        if (!active) return;

        if (data.orderId) {
          setOrderId(data.orderId);
          
          // Generate simulated payment URL (works beautifully on mobile phones!)
          const baseUrl = window.location.origin;
          const simPath = `${baseUrl}/pay-simulate?orderId=${data.orderId}`;
          setSimulationUrl(simPath);

          // Render QR Code 
          const qrDataUrl = await QRCode.toDataURL(simPath, {
            width: 320,
            margin: 2,
            color: {
              dark: '#1A1A1A',
              light: '#FFFFFF',
            },
          });
          
          if (active) {
            setQrCodeDataURL(qrDataUrl);
            setLoading(false);
          }
        } else {
          throw new Error('No Order ID returned');
        }
      } catch (err: any) {
        console.error('Payment initialization error:', err);
        if (active) {
          setError(err.message || 'Gagal tersambung ke backend');
          setLoading(false);
        }
      }
    }

    initializeOrder();

    return () => {
      active = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll status every 1.5s
  useEffect(() => {
    if (!orderId) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay/status/${orderId}`);
        const data = await res.json();
        
        if (data.status === 'paid') {
          // Play a small success sound if possible, or trigger callback
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          onPaymentSuccess(orderId);
        }
      } catch (err) {
        console.error('Polling payment state error:', err);
      }
    }, 1500);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [orderId, onPaymentSuccess]);

  // Handle direct client-side button click simulation
  const handleSimulatePaymentSuccess = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/pay/simulate-success/${orderId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onPaymentSuccess(orderId);
      }
    } catch (e) {
      alert('Simulation call error: ' + e);
    }
  };

  return (
    <div
      id="payment-screen-container"
      className="flex flex-col items-center justify-center min-h-screen w-full bg-[#FFE5F1] p-6 font-sans select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.1) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div className="w-full max-w-lg">
        {/* Navigation Action */}
        <button
          id="pay-back-btn"
          onClick={onBack}
          className="mb-6 flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#1A1A1A] font-bold border-3 border-[#1A1A1A] neo-shadow-sm neo-button rounded-lg text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Home</span>
        </button>

        {/* Master Box container */}
        <div
          id="payment-card"
          className="w-full bg-white border-4 border-[#1A1A1A] neo-shadow rounded-2xl p-6 sm:p-8 flex flex-col items-center"
        >
          {/* Header Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#00E5FF] border-2 border-[#1A1A1A] rounded-full font-mono text-xs font-extrabold max-w-max mb-4 rotate-1">
            <ShieldCheck className="w-4 h-4 text-[#1a1a1a]" />
            <span>TRANSAKSI AMAN via QRIS</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl text-[#1A1A1A] uppercase tracking-tight text-center mb-1">
            Satu Langkah Lagi!
          </h2>
          <p className="text-xs text-gray-500 font-bold mb-6 uppercase tracking-wider">
            ID ORDER: {orderId || '...' }
          </p>

          {/* Amount Box */}
          <div className="w-full bg-[#FFFC00] border-3 border-[#1A1A1A] py-4 text-center neo-shadow-sm mb-6 rounded-xl">
            <p className="text-xs font-extrabold text-[#1A1A1A] tracking-wider uppercase opacity-80 mb-0.5">
              TOTAL TRANSAKSI
            </p>
            <p className="font-display font-black text-3xl sm:text-4xl text-[#1A1A1A] leading-none">
              Rp 20.000
            </p>
          </div>

          {/* QR Code Container Block */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-4 border-[#1A1A1A] bg-white flex items-center justify-center neo-border rounded-xl p-4 mb-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF3366]" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">MEMBUAT ORDER...</p>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                <img
                  src={qrCodeDataUrl}
                  alt="QRIS Payment QR Code"
                  className="w-full h-full object-contain filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                />
                
                {/* Floating QRIS Corner Badge */}
                <div className="absolute inset-0 border-2 border-dashed border-red-400 pointer-events-none rounded-md m-2"></div>
              </div>
            )}
          </div>

          {/* Scan instruction badge */}
          <div className="px-5 py-2.5 bg-[#FF3366] text-white font-display font-black text-sm uppercase border-3 border-[#1A1A1A] neo-shadow-sm rounded-lg mb-6 text-center tracking-tight rotate-1">
            SCAN QRIS VIA SMARTPHONE ANDA
          </div>

          {/* E-wallet helper indicators */}
          <div className="w-full border-t-2 border-dashed border-gray-200 pt-5 text-center">
            <div className="flex justify-center items-center gap-4 text-xs font-mono font-bold text-gray-500 uppercase flex-wrap mb-4">
              <span>📱 GOPAY</span>
              <span>●</span>
              <span>📱 OVO</span>
              <span>●</span>
              <span>📱 SHOPEEPAY</span>
              <span>●</span>
              <span>📱 DANA</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#FF3366] uppercase bg-[#FFE5F1] p-2.5 rounded-lg border-2 border-dashed border-[#FF3366] max-w-sm mx-auto">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sistem mendeteksi bayar secara real-time</span>
            </div>
          </div>
        </div>

        {/* Emulator Dashboard Block */}
        <div id="emulator-panel" className="mt-8 bg-[#FFFC00] border-4 border-[#1A1A1A] neo-shadow rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 shrink-0 text-[#1a1a1a]" />
            <div>
              <p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">KONTROL TESTING KIOSK</p>
              <p className="text-xs text-[#555] font-medium leading-normal">
                Anda dapat <span className="font-bold underline text-black">scan QR</span> di atas jika memakai HP (anda akan menuju panel mobile simulasi bayar) atau ketuk tombol simulasi di samping untuk bypass instan!
              </p>
            </div>
          </div>
          <button
            onClick={handleSimulatePaymentSuccess}
            className="w-full md:w-auto shrink-0 px-5 py-3 bg-[#8A2BE2] text-white font-bold border-3 border-[#1A1A1A] neo-shadow-sm neo-button rounded-xl text-xs uppercase"
          >
            BAYAR INSTAN (MOCK SUCCESS)
          </button>
        </div>
      </div>
    </div>
  );
}
