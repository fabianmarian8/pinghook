import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PLAN_LIMITS } from '@/lib/constants'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

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

    // Export is Pro+ feature
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'Export logs is a Pro feature. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Verify webhook belongs to user
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('id, name, endpoint_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Get all logs for this webhook
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('webhook_id', id)
      .order('received_at', { ascending: false })
      .limit(1000)

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['id', 'method', 'source_ip', 'received_at', 'body', 'headers', 'query_params']
      const csvRows = [headers.join(',')]

      for (const log of logs || []) {
        const row = [
          log.id,
          log.method,
          log.source_ip || '',
          log.received_at,
          `"${(log.body || '').replace(/"/g, '""')}"`,
          `"${JSON.stringify(log.headers || {}).replace(/"/g, '""')}"`,
          `"${JSON.stringify(log.query_params || {}).replace(/"/g, '""')}"`,
        ]
        csvRows.push(row.join(','))
      }

      const csv = csvRows.join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${webhook.name}-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Default: JSON format
    return new NextResponse(JSON.stringify({ webhook, logs }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${webhook.name}-logs-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
