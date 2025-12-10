import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get webhook alert settings
    // Note: alert_email and slack_webhook_url are added via migration
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single() as { data: { id: string; alert_email?: string; slack_webhook_url?: string } | null; error: any }

    if (error || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json({
      alert_email: webhook.alert_email || null,
      slack_webhook_url: webhook.slack_webhook_url || null,
    })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { alert_email, slack_webhook_url } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = profile?.plan || 'free'

    // Email alerts are Pro+ feature
    if (alert_email && plan === 'free') {
      return NextResponse.json(
        { error: 'Email alerts are a Pro feature. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Slack is Team feature
    if (slack_webhook_url && plan !== 'team') {
      return NextResponse.json(
        { error: 'Slack integration is a Team feature. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Update webhook alert settings (fields added via migration)
    const { error } = await (supabase as any)
      .from('webhooks')
      .update({
        alert_email: alert_email || null,
        slack_webhook_url: slack_webhook_url || null,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Update alerts error:', error)
      return NextResponse.json({ error: 'Failed to update alerts' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
