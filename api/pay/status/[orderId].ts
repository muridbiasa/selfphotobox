// Vercel Serverless: GET /api/pay/status/:orderId
// Frontend polling tiap 1.5 detik → cek status pembayaran ke Midtrans

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { orderId } = req.query;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'orderId wajib diisi' });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return res.status(500).json({ error: 'Server key tidak ada' });

  try {
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
    const midRes = await fetch(`https://api.midtrans.com/v2/${orderId}/status`, {
      headers: { Authorization: authHeader },
    });
    const data = await midRes.json();

    const txStatus    = data.transaction_status;
    const fraudStatus = data.fraud_status;
    const isPaid      =
      txStatus === 'settlement' ||
      (txStatus === 'capture' && fraudStatus === 'accept');

    return res.status(200).json({
      orderId,
      status: isPaid ? 'paid' : 'pending',
      raw: txStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
