import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  token: string
  action: 'accept' | 'decline'
}

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
  // APP_SERVICE_KEY holds the new Supabase secret key (replaces legacy service_role key)
  // APP_PUBLISHABLE_KEY holds the new Supabase publishable key (replaces legacy anon key)
  const secretKey = Deno.env.get('APP_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const publishableKey = Deno.env.get('APP_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!

  const serviceClient = createClient(supabaseUrl, secretKey)

  // Resolve calling user from their JWT
  const anonClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userError } = await anonClient.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  try {
    const { token, action } = (await req.json()) as RequestBody

    if (!token || !action) {
      return new Response(JSON.stringify({ error: 'token and action are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Fetch the invitation
    const { data: invitation, error: fetchError } = await serviceClient
      .from('contact_invitations')
      .select('id, inviter_id, invitee_email, label, status, expires_at')
      .eq('token', token)
      .single()

    if (fetchError || !invitation) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    if (invitation.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'already_responded', status: invitation.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      })
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      await serviceClient
        .from('contact_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return new Response(JSON.stringify({ error: 'expired' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 410,
      })
    }

    // Verify the authenticated user matches the invitee email
    if (user.email?.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'email_mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    if (action === 'decline') {
      await serviceClient
        .from('contact_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id)

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // action === 'accept'

    // Fetch inviter profile for the contact name
    const { data: inviterProfile } = await serviceClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', invitation.inviter_id)
      .single()

    // Fetch invitee (current user) profile for the inviter's contact row
    const { data: inviteeProfile } = await serviceClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()

    // Fetch inviter's email from auth.users via service role
    const { data: inviterAuthUser } = await serviceClient.auth.admin.getUserById(invitation.inviter_id)
    const inviterEmail = inviterAuthUser?.user?.email ?? null

    const inviterName = inviterProfile?.display_name ?? inviterEmail ?? 'Unknown'
    const inviteeName = inviteeProfile?.display_name ?? user.email ?? 'Unknown'

    // Mark invitation accepted
    await serviceClient
      .from('contact_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString(), invitee_id: user.id })
      .eq('id', invitation.id)

    // Upsert: invitee appears in inviter's contacts
    // Match on owner_id + linked_user_id to avoid duplicates
    const { data: existingForInviter } = await serviceClient
      .from('contacts')
      .select('id')
      .eq('owner_id', invitation.inviter_id)
      .eq('linked_user_id', user.id)
      .maybeSingle()

    if (existingForInviter) {
      await serviceClient
        .from('contacts')
        .update({ label: invitation.label, email: user.email })
        .eq('id', existingForInviter.id)
    } else {
      await serviceClient
        .from('contacts')
        .insert({
          owner_id: invitation.inviter_id,
          name: inviteeName,
          email: user.email,
          label: invitation.label,
          linked_user_id: user.id,
        })
    }

    // Upsert: inviter appears in invitee's contacts (symmetric)
    const { data: existingForInvitee } = await serviceClient
      .from('contacts')
      .select('id')
      .eq('owner_id', user.id)
      .eq('linked_user_id', invitation.inviter_id)
      .maybeSingle()

    if (existingForInvitee) {
      await serviceClient
        .from('contacts')
        .update({ label: invitation.label, email: inviterEmail })
        .eq('id', existingForInvitee.id)
    } else {
      await serviceClient
        .from('contacts')
        .insert({
          owner_id: user.id,
          name: inviterName,
          email: inviterEmail,
          label: invitation.label,
          linked_user_id: invitation.inviter_id,
        })
    }

    return new Response(JSON.stringify({ ok: true, inviter_name: inviterName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Caught error:', (err as Error).message)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
