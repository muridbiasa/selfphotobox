// Vercel Serverless: POST /api/upload
// Menerima Base64 foto dari frontend → forward ke GAS → dapat Drive URL
// Lalu catat transaksi ke GAS Sheets

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { orderId, image } = req.body;

  if (!orderId || !image) {
    return res.status(400).json({ error: 'orderId dan image wajib diisi' });
  }

  const gasUrl = process.env.GAS_URL;
  if (!gasUrl) {
    return res.status(500).json({ error: 'GAS_URL belum diset di Vercel env' });
  }

  try {
    // ─── Upload foto ke Google Drive via GAS ──────────────
    const uploadRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'uploadPhoto', orderId, image }),
    });

    const uploadData = await uploadRes.json();

    if (!uploadData.success) {
      throw new Error('GAS upload gagal: ' + (uploadData.error || 'Unknown'));
    }

    // ─── Log transaksi ke Google Sheets via GAS ──────────
    // Fire-and-forget — tidak blocking response ke frontend
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:      'logTransaction',
        orderId,
        amount:      20000,
        status:      'paid',
        method:      'QRIS',
        fileId:      uploadData.fileId,
        downloadUrl: uploadData.downloadUrl,
      }),
    }).catch((e) => console.warn('[upload] log transaksi gagal:', e));

    return res.status(200).json({
      success:     true,
      downloadUrl: uploadData.downloadUrl,
      viewUrl:     uploadData.viewUrl,
      fileId:      uploadData.fileId,
    });
  } catch (err: any) {
    console.error('[/api/upload] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
