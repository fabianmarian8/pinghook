import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await params
    const { targetUrl } = await request.json()

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Target URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(targetUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid target URL' },
        { status: 400 }
      )
    }

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

    // Replay is Pro+ feature
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'Request replay is a Pro feature. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get the log entry
    const { data: log, error: logError } = await supabase
      .from('webhook_logs')
      .select('*, webhooks!inner(user_id)')
      .eq('id', logId)
      .single()

    if (logError || !log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    // Verify ownership
    if ((log as any).webhooks.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Replay the request
    const headers: Record<string, string> = {}
    const originalHeaders = log.headers as Record<string, string> || {}

    // Copy relevant headers, skip hop-by-hop headers
    const skipHeaders = ['host', 'connection', 'keep-alive', 'transfer-encoding', 'content-length']
    for (const [key, value] of Object.entries(originalHeaders)) {
      if (!skipHeaders.includes(key.toLowerCase())) {
        headers[key] = value
      }
    }

    const response = await fetch(targetUrl, {
      method: log.method,
      headers,
      body: log.method !== 'GET' && log.method !== 'HEAD' ? log.body : undefined,
    })

    const responseBody = await response.text()

    return NextResponse.json({
      success: true,
      replay: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      },
    })
  } catch (error) {
    console.error('Replay error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Replay failed' },
      { status: 500 }
    )
  }
}
