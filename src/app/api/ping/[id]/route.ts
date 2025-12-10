import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pingUrl } = await params

  try {
    const supabase = createAdminClient()

    // Find the cron monitor by ping_url
    const { data: monitor, error: monitorError } = await supabase
      .from('cron_monitors')
      .select('id, status')
      .eq('ping_url', pingUrl)
      .single()

    if (monitorError || !monitor) {
      return NextResponse.json(
        { error: 'Cron monitor not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    // Log the ping
    const { error: pingError } = await supabase
      .from('cron_pings')
      .insert({
        monitor_id: monitor.id,
        received_at: now,
      })

    if (pingError) {
      console.error('Error logging ping:', pingError)
    }

    // Update the monitor status and last_ping
    const { error: updateError } = await supabase
      .from('cron_monitors')
      .update({
        last_ping: now,
        status: 'healthy',
      })
      .eq('id', monitor.id)

    if (updateError) {
      console.error('Error updating monitor:', updateError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Ping received',
        timestamp: now,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ping error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export const POST = GET
