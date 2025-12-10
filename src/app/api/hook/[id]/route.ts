import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isResendConfigured, sendWebhookAlertEmail } from '@/lib/resend'

// Handle all HTTP methods for webhook capture
async function handleWebhook(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: endpointId } = await params

  try {
    const supabase = createAdminClient()

    // Find the webhook by endpoint_id with user info for alerts
    // Note: alert_email and slack_webhook_url are added via migration
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('endpoint_id', endpointId)
      .single() as { data: { id: string; name: string; user_id: string; alert_email?: string; slack_webhook_url?: string } | null; error: any }

    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      )
    }

    // Get request details
    const method = request.method
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      // Skip some internal headers
      if (!key.startsWith('x-vercel') && !key.startsWith('x-forwarded')) {
        headers[key] = value
      }
    })

    // Get body
    let body: string | null = null
    const contentType = request.headers.get('content-type') || ''

    if (method !== 'GET' && method !== 'HEAD') {
      try {
        if (contentType.includes('application/json')) {
          const json = await request.json()
          body = JSON.stringify(json, null, 2)
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          const obj: Record<string, string> = {}
          formData.forEach((value, key) => {
            obj[key] = value.toString()
          })
          body = JSON.stringify(obj, null, 2)
        } else {
          body = await request.text()
        }
      } catch {
        body = await request.text().catch(() => null)
      }
    }

    // Get query params
    const queryParams: Record<string, string> = {}
    request.nextUrl.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    // Get source IP
    const sourceIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Log the webhook
    const { data: logEntry, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        method,
        headers,
        body,
        query_params: Object.keys(queryParams).length > 0 ? queryParams : null,
        source_ip: sourceIp,
      })
      .select('id')
      .single()

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // Check user plan for notifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', webhook.user_id)
      .single()

    const plan = profile?.plan || 'free'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Send email alert if configured (Pro+ feature)
    const alertEmail = webhook.alert_email
    if (alertEmail && isResendConfigured() && logEntry && (plan === 'pro' || plan === 'team')) {
      try {
        await sendWebhookAlertEmail({
          to: alertEmail,
          webhookName: webhook.name,
          method,
          sourceIp,
          receivedAt: new Date(),
          endpointUrl: `${appUrl}/api/hook/${endpointId}`,
          viewUrl: `${appUrl}/webhooks/${webhook.id}`,
        })
      } catch (emailError) {
        console.error('Failed to send webhook alert email:', emailError)
      }
    }

    // Send Slack notification if configured (Team feature)
    const slackWebhookUrl = webhook.slack_webhook_url
    if (slackWebhookUrl && plan === 'team') {
      try {
        await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `New ${method} request to *${webhook.name}*`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*New Webhook Request*\n\n*Webhook:* ${webhook.name}\n*Method:* \`${method}\`\n*Source IP:* ${sourceIp}\n*Time:* ${new Date().toISOString()}`,
                },
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: 'View Details' },
                    url: `${appUrl}/webhooks/${webhook.id}`,
                  },
                ],
              },
            ],
          }),
        })
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError)
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook received',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = handleWebhook
export const POST = handleWebhook
export const PUT = handleWebhook
export const PATCH = handleWebhook
export const DELETE = handleWebhook
