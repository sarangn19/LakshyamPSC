import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await supabase.rpc('refresh_repository_coverage');
  return new Response(error ? JSON.stringify({ error: error.message }) : 'OK', {
    headers: { 'Content-Type': 'application/json' },
  });
});
