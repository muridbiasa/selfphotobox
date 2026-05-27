// Vercel Serverless Function: POST /api/pay/notify
// Menerima webhook Midtrans setelah pembayaran settlement
// Wajib didaftarkan di dashboard Midtrans: Settings → Configuration → Payment Notification URL

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// In-memory store untuk status order (ganti dengan KV/DB jika butuh persistent)
// Karena Vercel serverless stateless, pakai GAS Sheets sebagai persistent store
const orderStatusCache: Record<string, string> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const body = req.body;

  // ─── Validasi signature Midtrans ───────────────────────
  const signatureInput = body.order_id + body.status_code + body.gross_amount + serverKey;
  const expectedSig = crypto.createHash('sha512').update(signatureInput).digest('hex');

  if (body.signature_key !== expectedSig) {
    console.error('[notify] Signature mismatch — kemungkinan request palsu');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const { order_id, transaction_status, fraud_status } = body;
  const isPaid =
    (transaction_status === 'settlement') ||
    (transaction_status === 'capture' && fraud_status === 'accept');

  if (isPaid) {
    orderStatusCache[order_id] = 'paid';
    console.log(`[notify] Order ${order_id} → PAID`);

    // Log ke GAS Sheets jika GAS_URL tersedia
    const gasUrl = process.env.GAS_URL;
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'logTransaction',
            orderId: order_id,
            amount: body.gross_amount,
            status: 'paid',
            method: body.payment_type,
          }),
        });
      } catch (e) {
        console.warn('[notify] GAS log gagal:', e);
      }
    }
  }

  return res.status(200).json({ status: 'ok' });
}

// Export cache agar bisa diakses oleh /api/pay/status
export { orderStatusCache };
