import React from 'react';
import { motion } from 'motion/react';
import { FRAME_TEMPLATES } from '../templates';
import { FrameTemplate } from '../types';
import { Sparkles } from 'lucide-react';

interface TemplateScreenProps {
  onSelectTemplate: (template: FrameTemplate) => void;
}

/**
 * TemplateScreen — menampilkan 4 pilihan template frame (frame1.png sampai frame4.png).
 * User bisa memilih salah satu frame untuk digunakan dalam sesi foto.
 */
export default function TemplateScreen({ onSelectTemplate }: TemplateScreenProps) {
  return (
    <div
      id="template-screen-container"
      className="flex flex-col items-center justify-center min-h-screen w-full bg-[#1C2459] p-6 font-sans select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">

        {/* Step Badge */}
        <div className="px-5 py-1.5 bg-[#FFFC00] border-2 border-[#1A1A1A] rounded-full font-mono text-xs font-black uppercase tracking-wider rotate-[-1deg]">
          Pilih Template
        </div>

        <h1 className="font-black text-3xl text-white uppercase tracking-tighter text-center leading-tight">
          Sedes Run Unity 75th
        </h1>
        <p className="text-sm font-medium text-white/70 text-center">
          Strip vertikal 5×15 cm • 4 foto • Event Run 6 Juni 2026
        </p>

        {/* Grid 4 frame choices */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {FRAME_TEMPLATES.map((template) => (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectTemplate(template)}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-full aspect-[500/1500] rounded-xl overflow-hidden border-4 border-[#FFFC00] shadow-[0_0_20px_rgba(255,252,0,0.2)] group-hover:shadow-[0_0_30px_rgba(255,252,0,0.5)] transition-shadow">
                <img
                  src={template.frameImage || '/frame1.png'}
                  alt={template.name}
                  className="w-full h-auto block"
                  draggable={false}
                />
              </div>
              <span className="text-white font-bold text-sm uppercase tracking-tight text-center">
                {template.name.replace('Sedes Run Unity 75th - ', '')}
              </span>
            </motion.button>
          ))}
        </div>

        <p className="text-xs font-medium text-white/60 text-center mt-4">
          Klik pada frame untuk memilih dan memulai sesi foto
        </p>

      </div>
    </div>
  );
}
