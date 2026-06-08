// Vercel Serverless Function: POST /api/pay/token
// Membuat Midtrans Snap transaction token via Server Key (aman, server-side only)

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS header — dibutuhkan agar frontend Vercel bisa hit API ini
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return res.status(500).json({ error: 'MIDTRANS_SERVER_KEY belum diset di Vercel env' });
  }

  const orderId = `MEMO4-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  try {
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    const midtransRes = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: 20000,
        },
        enabled_payments: ['qris'],
        expiry: { unit: 'minute', duration: 15 },
      }),
    });

    const data = await midtransRes.json();

    if (data.token) {
      return res.status(200).json({ success: true, orderId, snapToken: data.token });
    } else {
      console.error('[token] Midtrans error:', JSON.stringify(data));
      return res.status(502).json({ error: 'Midtrans gagal membuat token', detail: data });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
