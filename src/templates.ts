import { FrameTemplate } from './types';

/**
 * Hanya satu template aktif: Sedes Run Unity 75th.
 * Bingkai desain asli diambil dari /frame1.png (public/).
 * Template lain dihapus karena aset overlay hanya satu file.
 */
export const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    id: 'sedes-run',
    name: 'Sedes Run Unity 75th',
    bgColor: '#1C2459',
    borderColor: '#FFFC00',
    textColor: '#FFFFFF',
    fontFamily: '"Space Grotesk", sans-serif',
    label: 'SEDES RUN UNITY 75th',
    styleName: 'Strip vertikal 5×15 cm • 4 foto • Event Run 6 Juni 2026',
    decor: 'sedes-run',
  },
];
