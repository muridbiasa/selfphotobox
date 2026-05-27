import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limit for JSON body to accept large base64 image strings!
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // In-memory data store for self-contained and instant activities
  interface Order {
    id: string;
    amount: number;
    status: "pending" | "paid";
    image?: string; // composite image base64
    createdAt: number;
  }
  const orders = new Map<string, Order>();

  // API Route - Create payment token with support for a simulated transaction
  app.post("/api/pay/token", (req, res) => {
    const orderId = "MEMO-" + Date.now() + Math.floor(Math.random() * 1000);
    const order: Order = {
      id: orderId,
      amount: 20000,
      status: "pending",
      createdAt: Date.now(),
    };
    orders.set(orderId, order);
    console.log(`[Order Created] ${orderId}`);
    res.json({
      token: "simulated_token_" + orderId,
      orderId: orderId,
      amount: 20000,
    });
  });

  // API Route - Poll payment status
  app.get("/api/pay/status/:orderId", (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ status: order.status });
  });

  // API Route - Simulate payment success (this is called by scanning the emulator QR code)
  app.post("/api/pay/simulate-success/:orderId", (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    order.status = "paid";
    orders.set(orderId, order);
    console.log(`[Order Paid] ${orderId}`);
    res.json({ success: true, status: "paid" });
  });

  // API Route - Upload photo composite
  app.post("/api/upload", (req, res) => {
    const { orderId, image } = req.body;
    if (!image) {
      res.status(400).json({ error: "Image data required" });
      return;
    }
    
    // Check if it's a specific order or a guest upload
    const targetOrderId = orderId || "GUEST-" + Date.now();
    let order = orders.get(targetOrderId);
    if (!order) {
      order = {
        id: targetOrderId,
        amount: 0,
        status: "paid",
        createdAt: Date.now(),
      };
    }
    order.image = image;
    orders.set(targetOrderId, order);

    console.log(`[Image Uploaded] Size: ${image.length} characters for ${targetOrderId}`);
    res.json({
      success: true,
      orderId: targetOrderId,
      downloadUrl: `/api/download/${targetOrderId}`,
    });
  });

  // API Route - Download / view image
  app.get("/api/download/:orderId", (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    if (!order || !order.image) {
      res.status(404).send("<h3>Photo not found or expired</h3>");
      return;
    }

    try {
      const base64Data = order.image.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, "base64");

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": imgBuffer.length,
        "Content-Disposition": `attachment; filename="Memo4Frame_${orderId}.png"`,
      });
      res.end(imgBuffer);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error generating image download");
    }
  });

  // Serve the payment simulator page over HTTP so scanning the QR code works on mobile!
  app.get("/pay-simulate", (req, res) => {
    const { orderId } = req.query;
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MEMO 4 FRAME - QRIS Payment Emulator</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              background-color: #FFE5F1;
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #1A1A1A;
              margin: 0;
              padding: 24px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .card {
              background: #FFFFFF;
              border: 4px solid #1A1A1A;
              box-shadow: 8px 8px 0px #1A1A1A;
              padding: 24px;
              max-width: 400px;
              width: 100%;
              box-sizing: border-box;
              border-radius: 12px;
              text-align: center;
            }
            h1 {
              font-weight: 800;
              font-size: 28px;
              margin: 0 0 8px 0;
              text-transform: uppercase;
              letter-spacing: -0.02em;
            }
            .subtitle {
              font-size: 14px;
              color: #555;
              margin-bottom: 24px;
            }
            .box {
              background: #FFFC00;
              border: 3px solid #1A1A1A;
              padding: 16px;
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 24px;
              box-shadow: 4px 4px 0px #1A1A1A;
            }
            .badge {
              background: #00E5FF;
              border: 2px solid #1A1A1A;
              padding: 4px 12px;
              font-weight: 700;
              font-size: 12px;
              display: inline-block;
              margin-bottom: 16px;
              border-radius: 999px;
            }
            button {
              background: #FF3366;
              color: white;
              border: 3px solid #1A1A1A;
              box-shadow: 4px 4px 0px #1A1A1A;
              padding: 16px 24px;
              font-size: 18px;
              font-weight: 800;
              cursor: pointer;
              width: 100%;
              transition: all 0.1s;
              border-radius: 8px;
              text-transform: uppercase;
            }
            button:active {
              transform: translate(2px, 2px);
              box-shadow: 2px 2px 0px #1A1A1A;
            }
            .success-msg {
              display: none;
              color: #00B14F;
              font-weight: 700;
              font-size: 18px;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">MEMO 4 FRAME KIOSK</div>
            <h1>E-WALLET QRIS</h1>
            <p class="subtitle">Simulasi pembayaran aman untuk photobox</p>
            <div class="box">Rp 20.000</div>
            <p style="font-size: 13px; font-weight:700; margin-bottom: 12px;">ID ORDER: ${orderId}</p>
            <button id="payBtn">BAYAR SEKARANG</button>
            <div id="success" class="success-msg">✔ PEMBAYARAN BERHASIL!<br><span style="font-size:12px;color:#555">Kiosk akan otomatis melanjutkan ke pemilihan template</span></div>
          </div>
          <script>
            document.getElementById('payBtn').addEventListener('click', async () => {
              try {
                const res = await fetch('/api/pay/simulate-success/${orderId}', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                  document.getElementById('payBtn').style.display = 'none';
                  document.getElementById('success').style.display = 'block';
                }
              } catch (e) {
                alert('Gagal membayar: ' + e);
              }
            });
          </script>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
