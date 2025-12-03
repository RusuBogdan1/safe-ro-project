import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, email, region_id, hazard_types, unsubscribe_token } = await req.json()

    console.log(`[manage-subscription] Action: ${action}, Region: ${region_id}`)

    if (action === 'subscribe') {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email || !emailRegex.test(email)) {
        console.log('[manage-subscription] Invalid email format')
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!region_id) {
        return new Response(
          JSON.stringify({ error: 'Region ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check for existing subscription
      const { data: existing } = await supabase
        .from('alert_subscriptions')
        .select('id')
        .eq('email', email)
        .eq('region_id', region_id)
        .single()

      if (existing) {
        console.log('[manage-subscription] Subscription already exists')
        return new Response(
          JSON.stringify({ message: 'Already subscribed to this region' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create subscription
      const { error: insertError } = await supabase
        .from('alert_subscriptions')
        .insert({
          email,
          region_id,
          hazard_types: hazard_types || ['flood', 'vegetation'],
          is_active: true
        })

      if (insertError) {
        console.error('[manage-subscription] Insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[manage-subscription] Subscription created successfully')
      return new Response(
        JSON.stringify({ message: 'Subscribed successfully' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'unsubscribe') {
      if (!unsubscribe_token) {
        return new Response(
          JSON.stringify({ error: 'Unsubscribe token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: deleteError, count } = await supabase
        .from('alert_subscriptions')
        .delete()
        .eq('unsubscribe_token', unsubscribe_token)

      if (deleteError) {
        console.error('[manage-subscription] Delete error:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to unsubscribe' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[manage-subscription] Unsubscribed successfully')
      return new Response(
        JSON.stringify({ message: 'Unsubscribed successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[manage-subscription] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
