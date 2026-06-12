import { FrameTemplate } from '../types';

/**
 * Loads an image URL / base64 dataURL into an HTMLImageElement.
 * Rejects with a raw network error if the asset fails to load.
 * NO programmatic vector fallback — strict policy per PRD Bug #B-001.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error(`[canvas.ts] Gagal memuat aset gambar: ${src}`, e);
      reject(new Error(`Gagal memuat aset gambar: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Menggabungkan 4 foto jepretan pengguna + overlay bingkai asli
 * menjadi satu strip vertikal HD 1000 × 3000 px (rasio 1:3).
 *
 * Struktur Layer:
 *   LAYER BAWAH  → Foto-foto user (center-crop, mirrored)
 *   LAYER ATAS   → Overlay bingkai /frame1.png (transparan, menutupi seluruh kanvas)
 *
 * LARANGAN KERAS:
 *   - Tidak ada ctx.fillText / ctx.rect / ctx.stroke untuk dekorasi buatan.
 *   - Jika /frame1.png gagal dimuat, fungsi melempar error murni tanpa fallback grafis.
 */
export async function generateCompositeImage(
  photos: string[],
  template: FrameTemplate
): Promise<string> {
  // ─── 1. INISIALISASI KANVAS MASTER (1000 × 3000 px) ───────────────────────
  const canvas = document.createElement('canvas');
  canvas.width = 2000;
  canvas.height = 6000;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('[canvas.ts] Gagal mendapatkan 2D context pada canvas.');

  // Aktifkan anti-aliasing kualitas tinggi untuk scaling gambar
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ─── 2. LATAR BELAKANG DASAR: Putih bersih ────────────────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ─── 3. DATA KOORDINAT LUBANG FOTO (HD Pixel Calibration — PRD §4.2) ──────
  const holeCoordinates = [
    { x: 180,  y: 704,  width: 1640, height: 1036 }, // Lubang 1 (Atas) — 2× dari 90,352,820,518
    { x: 200,  y: 1996, width: 1640, height: 1036 }, // Lubang 2 (Offset X+10) — 2× dari 100,998,820,518
    { x: 180,  y: 3284, width: 1640, height: 1036 }, // Lubang 3 — 2× dari 90,1642,820,518
    { x: 180,  y: 4576, width: 1640, height: 1036 }, // Lubang 4 (Bawah) — 2× dari 90,2288,820,518
  ];

  // ─── 4. LAYER BAWAH: Render foto-foto pengguna ────────────────────────────
  for (let i = 0; i < 4; i++) {
    const hole = holeCoordinates[i];
    const photoDataUrl = photos[i];
    if (!photoDataUrl) continue;

    const img = await loadImage(photoDataUrl);

    ctx.save();

    // Clip agar gambar tidak meluber keluar batas lubang
    ctx.beginPath();
    ctx.rect(hole.x, hole.y, hole.width, hole.height);
    ctx.clip();

    // Mirror horizontal (kamera depan / selfie mode)
    ctx.translate(hole.x + hole.width / 2, hole.y + hole.height / 2);
    ctx.scale(-1, 1);

    // Aspect Ratio Fill (object-fit: cover) menggunakan 9 parameter drawImage
    const srcW = img.width;
    const srcH = img.height;
    const targetRatio = hole.width / hole.height;
    const srcRatio = srcW / srcH;

    let sx, sy, sWidth, sHeight;

    if (srcRatio > targetRatio) {
      // Foto lebih lebar dari target -> crop samping (kiri-kanan)
      sHeight = srcH;
      sWidth = srcH * targetRatio;
      sx = (srcW - sWidth) / 2;
      sy = 0;
    } else {
      // Foto lebih tinggi dari target -> crop atas-bawah
      sWidth = srcW;
      sHeight = srcW / targetRatio;
      sx = 0;
      sy = (srcH - sHeight) / 2;
    }

    // Draw image dengan crop presisi: (img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    // Karena sudah translate ke tengah dan scale(-1, 1), kita gambar dari (-width/2, -height/2)
    ctx.drawImage(img, sx, sy, sWidth, sHeight, -hole.width / 2, -hole.height / 2, hole.width, hole.height);
    
    ctx.restore();
  }

  // ─── 5. LAYER ATAS: Overlay bingkai sesuai template yang dipilih ──────────────────────
  // Area lubang pada file ini sudah 100% transparan → foto user otomatis terlihat.
  // Jika file gagal dimuat, error dilempar langsung — TANPA fallback grafis.
  const frameImageUrl = template.frameImage || '/frame1.png';
  const frameOverlay = await loadImage(frameImageUrl);
  ctx.drawImage(frameOverlay, 0, 0, canvas.width, canvas.height);

  // ─── 6. OUTPUT: JPEG 100% quality (maximum) ─────────────────────────────────────────
  return canvas.toDataURL('image/jpeg', 1.0);
}
