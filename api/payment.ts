import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, phone, email, amount, items } = req.body;

    if (!name || !phone || !amount || !items || !Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request body. Fields name, phone, amount, and items are required.' 
      });
    }

    // Retrieve credentials from environment variables
    const va = process.env.IPAYMU_VA || '';
    const apiKey = process.env.IPAYMU_API_KEY || '';
    const isSandbox = process.env.IPAYMU_IS_SANDBOX !== 'false'; // defaults to true (Sandbox)

    // Fallback sandbox credentials for local development if not configured yet
    const activeVa = va || '0000002185504003';
    const activeApiKey = apiKey || 'SANDBOX1776E990-0C70-478B-8DDB-E7701953AD6E';

    const host = isSandbox ? 'https://sandbox.ipaymu.com' : 'https://my.ipaymu.com';
    const url = `${host}/api/v2/payment`;

    // Map item details to format required by iPaymu
    const productNames = items.map((item: any) => `${item.product.name} (${item.selectedVariant.name})`);
    const quantities = items.map((item: any) => String(item.quantity));
    const prices = items.map((item: any) => {
      const activePrice = item.selectedVariant.discountPrice !== null 
        ? item.selectedVariant.discountPrice 
        : item.selectedVariant.price;
      return String(activePrice);
    });

    // Request payload structure
    const body = {
      product: productNames,
      qty: quantities,
      price: prices,
      amount: String(amount),
      returnUrl: `${req.headers.origin || 'http://localhost:5173'}/?page=status`,
      cancelUrl: `${req.headers.origin || 'http://localhost:5173'}/`,
      notifyUrl: 'https://webhook.site/dummy-notify', // Place your webhook endpoint URL if any
      buyerName: name,
      buyerPhone: phone,
      buyerEmail: email || 'customer@email.com',
    };

    const bodyJson = JSON.stringify(body);
    const bodyHash = crypto.createHash('sha256').update(bodyJson).digest('hex').toLowerCase();

    // Create signature format v2: POST:va:bodyHash:apiKey
    const stringToSign = `POST:${activeVa}:${bodyHash}:${activeApiKey}`;
    const signature = crypto.createHmac('sha256', activeApiKey).update(stringToSign).digest('hex');

    // Create YYYYMMDDhhmmss timestamp
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
      return res.status(200).json({
        success: true,
        paymentUrl: data.Data.Url,
        sessionID: data.Data.SessionID,
      });
    } else {
      return res.status(response.status || 400).json({
        success: false,
        message: data.Message || 'Failed to create payment session from iPaymu.',
        raw: data,
      });
    }
  } catch (error: any) {
    console.error('iPaymu Payment Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
}
