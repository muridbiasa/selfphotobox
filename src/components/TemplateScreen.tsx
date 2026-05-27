import React from 'react';
import { motion } from 'motion/react';
import { FRAME_TEMPLATES } from '../templates';
import { FrameTemplate } from '../types';
import { Sparkles } from 'lucide-react';

interface TemplateScreenProps {
  onSelectTemplate: (template: FrameTemplate) => void;
}

/**
 * TemplateScreen — hanya menampilkan satu template (Sedes Run Unity 75th).
 * Preview menggunakan gambar asli /frame1.png dari public/.
 */
export default function TemplateScreen({ onSelectTemplate }: TemplateScreenProps) {
  const template = FRAME_TEMPLATES[0];

  return (
    <div
      id="template-screen-container"
      className="flex flex-col items-center justify-center min-h-screen w-full bg-[#1C2459] p-6 font-sans select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Step Badge */}
        <div className="px-5 py-1.5 bg-[#FFFC00] border-2 border-[#1A1A1A] rounded-full font-mono text-xs font-black uppercase tracking-wider rotate-[-1deg]">
          Pilih Template
        </div>

        <h1 className="font-black text-3xl text-white uppercase tracking-tighter text-center leading-tight">
          {template.name}
        </h1>
        <p className="text-sm font-medium text-white/70 text-center">
          {template.styleName}
        </p>

        {/* Real frame preview — /frame1.png */}
        <div className="w-48 rounded-2xl overflow-hidden border-4 border-[#FFFC00] shadow-[0_0_30px_rgba(255,252,0,0.3)]">
          <img
            src="/frame1.png"
            alt="Preview bingkai Sedes Run Unity 75th"
            className="w-full h-auto block"
            draggable={false}
          />
        </div>

        {/* Confirm CTA */}
        <motion.button
          id="confirm-template-btn"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectTemplate(template)}
          className="w-full py-4 bg-[#FF3366] text-white font-black text-xl uppercase border-4 border-[#1A1A1A] rounded-2xl cursor-pointer tracking-tight flex items-center justify-center gap-3 hover:bg-[#e02b59] shadow-[6px_6px_0px_#1A1A1A]"
        >
          <Sparkles className="w-6 h-6 fill-white text-white" />
          <span>MULAI SESI FOTO</span>
        </motion.button>

      </div>
    </div>
  );
}
