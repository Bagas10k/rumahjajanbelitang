const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Load .env file manually (zero-dependency)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith('#')) return;
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

// 2. Start HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/payment') {
    let bodyData = '';
    req.on('data', (chunk) => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyData);
        const { name, phone, email, amount, items } = payload;

        const va = process.env.IPAYMU_VA || '';
        const apiKey = process.env.IPAYMU_API_KEY || '';
        const isSandbox = process.env.IPAYMU_IS_SANDBOX !== 'false';

        const activeVa = va || '0000002410313837';
        const activeApiKey = apiKey || 'SANDBOX913F1F10-67B4-4B7C-A5D8-3DB5E86E2024';

        const host = isSandbox ? 'https://sandbox.ipaymu.com' : 'https://my.ipaymu.com';
        const url = `${host}/api/v2/payment`;

        const productNames = items.map((item) => `${item.product.name} (${item.selectedVariant.name})`);
        const quantities = items.map((item) => String(item.quantity));
        const prices = items.map((item) => {
          const activePrice = item.selectedVariant.discountPrice !== null 
            ? item.selectedVariant.discountPrice 
            : item.selectedVariant.price;
          return String(activePrice);
        });

        const body = {
          product: productNames,
          qty: quantities,
          price: prices,
          amount: String(amount),
          returnUrl: `${req.headers.origin || 'http://localhost:5173'}/?page=status`,
          cancelUrl: `${req.headers.origin || 'http://localhost:5173'}/`,
          notifyUrl: 'https://webhook.site/dummy-notify',
          buyerName: name,
          buyerPhone: phone,
          buyerEmail: email || 'customer@email.com',
        };

        const bodyJson = JSON.stringify(body);
        const bodyHash = crypto.createHash('sha256').update(bodyJson).digest('hex').toLowerCase();
        const stringToSign = `POST:${activeVa}:${bodyHash}:${activeApiKey}`;
        const signature = crypto.createHmac('sha256', activeApiKey).update(stringToSign).digest('hex');

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'va': activeVa,
            'signature': signature,
            'timestamp': timestamp,
          },
          body: bodyJson,
        });

        const data = await response.json();

        if (response.ok && data.Status === 200) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            paymentUrl: data.Data.Url,
            sessionID: data.Data.SessionID,
          }));
        } else {
          res.writeHead(response.status || 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: data.Message || 'Failed to create payment session from iPaymu.',
            raw: data,
          }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Local iPaymu API Runner is listening on http://localhost:${PORT}`);
});
