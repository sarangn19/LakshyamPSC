import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature (skip if no secret configured)
    if (RAZORPAY_KEY_SECRET) {
      const expectedSig = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(body + RAZORPAY_KEY_SECRET)
      ).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));

      if (signature !== expectedSig) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const subscriptionId = event.payload?.subscription?.entity?.id;
    const paymentId = event.payload?.payment?.entity?.id;

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subEntity = event.payload.subscription.entity;
        const userId = subEntity.notes?.user_id;

        if (userId) {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            status: 'active',
            plan: 'premium',
            razorpay_subscription_id: subscriptionId,
            razorpay_payment_id: paymentId,
            current_period_start: new Date(subEntity.current_start * 1000).toISOString(),
            current_period_end: new Date(subEntity.current_end * 1000).toISOString(),
            trial_end: null,
          }, { onConflict: 'user_id' });
        }
        break;
      }

      case 'subscription.completed':
      case 'subscription.expired': {
        const expEntity = event.payload.subscription.entity;
        const expUserId = expEntity.notes?.user_id;
        if (expUserId) {
          await supabase.from('subscriptions').update({
            status: 'expired',
            razorpay_payment_id: paymentId,
          }).eq('user_id', expUserId);
        }
        break;
      }

      case 'subscription.cancelled': {
        const canEntity = event.payload.subscription.entity;
        const canUserId = canEntity.notes?.user_id;
        if (canUserId) {
          await supabase.from('subscriptions').update({
            status: 'canceled',
            cancel_at_period_end: true,
          }).eq('user_id', canUserId);
        }
        break;
      }

      case 'payment.failed': {
        const failEntity = event.payload.subscription?.entity;
        const failUserId = failEntity?.notes?.user_id;
        if (failUserId) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
          }).eq('user_id', failUserId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
