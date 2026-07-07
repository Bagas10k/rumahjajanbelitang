import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    // Use service role key to bypass RLS, or fallback to anon key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ 
        success: false,
        message: 'Supabase credentials are missing in environment variables.' 
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const payload = req.body;

    // Parse mutations (supports Moota array, Cekmutasi wrapping object, or direct mutation object)
    let mutations: any[] = [];
    if (Array.isArray(payload)) {
      mutations = payload;
    } else if (payload && Array.isArray(payload.data)) {
      mutations = payload.data;
    } else if (payload) {
      mutations = [payload];
    }

    let processedCount = 0;

    for (const item of mutations) {
      const type = String(item.type || '').toUpperCase();
      const amount = Number(item.amount || 0);

      // Check if transaction is a credit (CR / CREDIT / IN / Uang Masuk)
      if (type === 'CR' || type === 'CREDIT' || type === 'IN') {
        
        // Search for a pending order matching this exact total amount (which includes the unique code)
        const { data: matchedOrders, error: fetchError } = await supabase
          .from('orders')
          .select('id, total_amount, payment_status')
          .eq('payment_status', 'pending')
          .eq('total_amount', amount);

        if (fetchError) throw fetchError;

        if (matchedOrders && matchedOrders.length > 0) {
          // Update the first matching pending order to PAID
          const orderToUpdate = matchedOrders[0];
          const { error: updateError } = await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', orderToUpdate.id);

          if (updateError) throw updateError;
          processedCount++;
          console.log(`Order ${orderToUpdate.id} successfully marked as PAID via Bank Mutation (Amount: Rp ${amount})`);
        } else {
          console.log(`No pending order found matching unique transfer amount: Rp ${amount}`);
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Processed webhook successfully. Updated ${processedCount} orders.` 
    });
  } catch (error: any) {
    console.error('Webhook Bank Mutation Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
}
