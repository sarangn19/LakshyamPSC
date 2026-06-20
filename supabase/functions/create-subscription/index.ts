import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check existing subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (sub?.status === 'active') {
      return new Response(JSON.stringify({ error: 'Already subscribed' }), { status: 400 });
    }

    // Create Razorpay subscription
    const planId = Deno.env.get('RAZORPAY_PLAN_ID') || '';
    const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const razorpayRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12,
        expire_by: Math.floor(Date.now() / 1000) + 86400, // 24h to pay
        notes: {
          user_id: user.id,
          email: user.email || '',
        },
      }),
    });

    if (!razorpayRes.ok) {
      const errText = await razorpayRes.text();
      // If no Razorpay keys configured, return mock for development
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        const mockSubscription = {
          id: `sub_mock_${crypto.randomUUID().slice(0, 8)}`,
          status: 'created',
          short_url: '#',
        };
        // Store pending subscription
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          status: 'incomplete',
          plan: 'premium',
          razorpay_subscription_id: mockSubscription.id,
        }, { onConflict: 'user_id' });

        return new Response(JSON.stringify(mockSubscription), { status: 200 });
      }
      return new Response(JSON.stringify({ error: 'Failed to create subscription', details: errText }), { status: 500 });
    }

    const subscription = await razorpayRes.json();

    // Store pending subscription
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      status: 'incomplete',
      plan: 'premium',
      razorpay_subscription_id: subscription.id,
      trial_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      id: subscription.id,
      short_url: subscription.short_url,
      status: subscription.status,
    }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
