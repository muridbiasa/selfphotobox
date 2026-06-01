import React from 'react';
import { motion } from 'motion/react';
import { Star, Camera, Heart, Sparkles } from 'lucide-react';

interface IdleScreenProps {
  onStart: () => void;
}

export default function IdleScreen({ onStart }: IdleScreenProps) {
  return (
    <div
      id="idle-screen-container"
      onClick={onStart}
      className="relative flex flex-col justify-between items-center min-h-screen w-full bg-[#FFE5F1] cursor-pointer overflow-hidden p-6 select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.1) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Decorative Neo-Brutalist Stars and Stickers */}
      <div className="absolute top-10 left-10 hidden md:block">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="p-3 bg-[#FFFC00] border-4 border-[#1A1A1A] neo-shadow rounded-xl flex items-center justify-center -rotate-12"
        >
          <Star className="w-10 h-10 text-[#1A1A1A] fill-[#1a1a1a]" />
        </motion.div>
      </div>

      <div className="absolute top-14 right-14 hidden md:block">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="px-4 py-2 bg-[#00E5FF] border-4 border-[#1A1A1A] neo-shadow font-display font-extrabold text-[#1A1A1A] rounded-lg rotate-12"
        >
          ⚡ NEW RELEASES ⚡
        </motion.div>
      </div>

      <div className="absolute bottom-28 left-16 hidden lg:block">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="px-5 py-3 bg-[#FF3366] text-white border-4 border-[#1A1A1A] neo-shadow font-mono font-bold rounded-full -rotate-6 flex items-center gap-2"
        >
          <Camera className="w-5 h-5 fill-white" />
          <span>TABLET KIOSK v2</span>
        </motion.div>
      </div>

      <div className="absolute bottom-32 right-16 hidden lg:block">
        <div className="p-4 bg-white border-4 border-[#1A1A1A] neo-shadow rounded-full rotate-6">
          <Heart className="w-8 h-8 text-[#FF3366] fill-[#FF3366] animate-pulse" />
        </div>
      </div>

      {/* Header Brand */}
      <div id="idle-brand" className="w-full max-w-4xl text-center mt-12 z-10">
        <div className="inline-block px-6 py-2 bg-[#8A2BE2] text-white font-mono font-extrabold border-4 border-[#1A1A1A] neo-shadow text-sm uppercase tracking-widest rounded-md mb-6">
          ★ DIGITAL PHOTO KIOSK ★
        </div>
        <h2 
          className="font-sans font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mb-1 text-center"
          style={{
            color: "#FF6F61",
            WebkitTextStroke: "2px #000000",
            textShadow: "4px 4px 0px #000000",
            letterSpacing: "-1px",
          }}
        >
          MEMO 4 FRAME
        </h2>
      </div>

      {/* Central Visual Poster Block */}
      <motion.div
        id="idle-start-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center max-w-2xl w-full bg-white border-4 border-[#1A1A1A] neo-shadow rounded-2xl p-8 sm:p-12 z-10 my-8 text-center"
      >
        <div className="w-full flex justify-center gap-4 mb-6">
          <span className="w-4 h-4 rounded-full bg-[#FF3366] border-2 border-[#1A1A1A]" />
          <span className="w-4 h-4 rounded-full bg-[#00E5FF] border-2 border-[#1A1A1A]" />
          <span className="w-4 h-4 rounded-full bg-[#FFFC00] border-2 border-[#1A1A1A]" />
        </div>

        <h1 className="font-display font-black text-5xl sm:text-7xl leading-none text-[#1A1A1A] uppercase tracking-tighter mb-4">
          SELF<br />PHOTOBOX
        </h1>

        {/* Tap Badge Button */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block mt-4 px-8 py-4 bg-[#FFFC00] text-[#1A1A1A] font-display font-black text-xl sm:text-3xl border-4 border-[#1A1A1A] neo-shadow uppercase cursor-pointer rounded-xl hover:bg-[#fffa00]"
        >
          TAP ANYWHERE TO START
        </motion.div>

        <p className="font-sans font-bold text-sm sm:text-base text-[#555] mt-6 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF3366] fill-[#FF3366]" />
          Hanya Rp 20.000 untuk 4 capture terbaikmu.
        </p>
      </motion.div>

      {/* Footer Instructions Badge & Marquee */}
      <div id="idle-footer" className="w-full mt-auto">
        <div className="w-full border-t-4 border-b-4 border-[#1A1A1A] bg-[#FF3366] py-3 overflow-hidden select-none whitespace-nowrap">
          <div className="inline-block animate-marquee uppercase text-white font-display font-black text-base sm:text-lg tracking-wider">
            CAPTURE YOUR MOODS • 4 FRAMES MEMORY • SCAN QR CODE TO DOWNLOAD INSTANTLY • PLAYFUL NEO-BRUTALIST VIBES • NO COMPLEX LOGIN REQUIRED • TABLET VERSION • CAPTURE YOUR MOODS • 4 FRAMES MEMORY • SCAN QR CODE TO DOWNLOAD INSTANTLY • PLAYFUL NEO-BRUTALIST VIBES • NO COMPLEX LOGIN REQUIRED • TABLET VERSION • 
          </div>
        </div>
      </div>
    </div>
  );
}
