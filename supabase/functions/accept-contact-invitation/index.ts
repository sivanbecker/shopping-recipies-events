import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Calls accept_invitation SECURITY DEFINER RPC — no service role key needed.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  try {
    const { token, action } = await req.json()

    if (!token || !action) {
      return new Response(JSON.stringify({ error: 'token and action are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Call the SECURITY DEFINER RPC directly via PostgREST, forwarding the caller's JWT
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/accept_invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': authHeader,
      },
      body: JSON.stringify({ p_token: token, p_action: action }),
    })

    const result = await rpcRes.json()
    console.log('RPC result:', JSON.stringify(result), 'status:', rpcRes.status)

    // PostgREST returns the jsonb value directly — normalize to object
    const body = typeof result === 'object' && result !== null ? result : { ok: result }

    if (!rpcRes.ok) {
      console.error('RPC HTTP error:', rpcRes.status, body)
    }
    if (body.error) {
      console.error('RPC business error:', body.error)
    }

    // Always return 200 with the body so supabase.functions.invoke puts it in data (not error)
    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Caught error:', (err as Error).message)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
