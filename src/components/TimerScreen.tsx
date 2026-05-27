import React from 'react';
import { motion } from 'motion/react';
import { Clock, Zap, Laugh } from 'lucide-react';

interface TimerScreenProps {
  onSelectTimer: (seconds: number) => void;
  onBack: () => void;
}

export default function TimerScreen({ onSelectTimer, onBack }: TimerScreenProps) {
  return (
    <div
      id="timer-screen-container"
      className="flex flex-col items-center justify-center min-h-screen w-full bg-[#FFE5F1] p-6 font-sans select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.1) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Step Badge */}
        <div className="px-5 py-1.5 bg-[#FFFC00] border-3 border-[#1A1A1A] rounded-full font-mono text-xs font-black max-w-max mb-3 uppercase tracking-wider rotate-[1deg]">
          Langkah 2 dari 2
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#1A1A1A] uppercase tracking-tighter filter drop-shadow-[3px_3px_0px_#FFFFFF] leading-none mb-1 text-center">
          SET DURASI ABA-ABA
        </h1>
        <p className="text-sm font-bold text-gray-700 tracking-tight text-center mb-10 uppercase">
          Tentukan jeda waktu berpose sebelum kamera menjepret foto
        </p>

        {/* Dual Option Cards side-by-side */}
        <div id="timers-container" className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl mb-12">
          {/* Card 1: 5 Seconds */}
          <motion.div
            id="timer-5s"
            whileHover={{ scale: 1.04, rotate: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectTimer(5)}
            className="cursor-pointer bg-[#FFFC00] border-4 border-[#1A1A1A] neo-shadow rounded-2xl p-6 flex flex-col items-center justify-center text-center group"
          >
            <div className="p-4 bg-white border-3 border-[#1A1A1A] rounded-full mb-4 group-hover:bg-[#00E5FF] transition-colors">
              <Zap className="w-8 h-8 text-[#1A1A1A] fill-[#1A1A1A]" />
            </div>
            <h2 className="font-display font-black text-4xl text-[#1A1A1A] uppercase mb-1">
              5 DETIK
            </h2>
            <div className="px-3 py-1 bg-white border-2 border-[#1A1A1A] rounded-md text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
              SESI CEPAT
            </div>
            <p className="text-xs font-semibold text-gray-700 leading-normal max-w-[150px]">
              Cocok untuk pose instan dan ekspresi candid yang natural!
            </p>
          </motion.div>

          {/* Card 2: 10 Seconds */}
          <motion.div
            id="timer-10s"
            whileHover={{ scale: 1.04, rotate: 1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectTimer(10)}
            className="cursor-pointer bg-[#00E5FF] border-4 border-[#1A1A1A] neo-shadow rounded-2xl p-6 flex flex-col items-center justify-center text-center group"
          >
            <div className="p-4 bg-white border-3 border-[#1A1A1A] rounded-full mb-4 group-hover:bg-[#FF3366] group-hover:text-white transition-colors">
              <Clock className="w-8 h-8 text-[#1A1A1A]" />
            </div>
            <h2 className="font-display font-black text-4xl text-[#1A1A1A] uppercase mb-1">
              10 DETIK
            </h2>
            <div className="px-3 py-1 bg-white border-2 border-[#1A1A1A] rounded-md text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
              SIAPKAN POSE
            </div>
            <p className="text-xs font-semibold text-gray-700 leading-normal max-w-[150px]">
              Gunakan waktu ekstra untuk bersiap dengan properti atau gaya maksimal!
            </p>
          </motion.div>
        </div>

        {/* Back Link */}
        <button
          onClick={onBack}
          className="text-xs font-bold uppercase underline tracking-wider text-gray-600 hover:text-black transition-colors"
        >
          ← GANTI DESAIN TEMPLATE
        </button>
      </div>
    </div>
  );
}
