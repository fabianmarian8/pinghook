import { Resend } from 'resend'

let resendInstance: Resend | null = null

export function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

interface WebhookAlertEmailParams {
  to: string
  webhookName: string
  method: string
  sourceIp: string
  receivedAt: Date
  endpointUrl: string
  viewUrl: string
}

export async function sendWebhookAlertEmail({
  to,
  webhookName,
  method,
  sourceIp,
  receivedAt,
  endpointUrl,
  viewUrl,
}: WebhookAlertEmailParams) {
  const resend = getResend()

  await resend.emails.send({
    from: 'PingHook <alerts@pinghook.dev>',
    to,
    subject: `[PingHook] New ${method} request to ${webhookName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Webhook Request Received</h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Webhook:</strong> ${webhookName}</p>
          <p style="margin: 0 0 10px;"><strong>Method:</strong> <span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${method}</span></p>
          <p style="margin: 0 0 10px;"><strong>Source IP:</strong> ${sourceIp}</p>
          <p style="margin: 0 0 10px;"><strong>Received:</strong> ${receivedAt.toISOString()}</p>
          <p style="margin: 0;"><strong>Endpoint:</strong> <code style="background: #e5e5e5; padding: 2px 6px; border-radius: 4px;">${endpointUrl}</code></p>
        </div>

        <a href="${viewUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
          View Request Details
        </a>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You're receiving this because you enabled email alerts for this webhook.
          <br>
          <a href="${viewUrl.split('/webhooks/')[0]}/webhooks/${viewUrl.split('/webhooks/')[1]?.split('/')[0]}" style="color: #666;">Manage alert settings</a>
        </p>
      </div>
    `,
  })
}

interface CronDownAlertEmailParams {
  to: string
  monitorName: string
  expectedInterval: number
  lastPing: Date | null
  viewUrl: string
}

export async function sendCronDownAlertEmail({
  to,
  monitorName,
  expectedInterval,
  lastPing,
  viewUrl,
}: CronDownAlertEmailParams) {
  const resend = getResend()

  const intervalMinutes = expectedInterval / 60
  const lastPingText = lastPing
    ? lastPing.toISOString()
    : 'Never'

  await resend.emails.send({
    from: 'PingHook <alerts@pinghook.dev>',
    to,
    subject: `[PingHook] ALERT: ${monitorName} missed its scheduled ping`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Cron Monitor Alert</h2>

        <p>Your cron job <strong>${monitorName}</strong> has missed its expected ping.</p>

        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Monitor:</strong> ${monitorName}</p>
          <p style="margin: 0 0 10px;"><strong>Expected Interval:</strong> Every ${intervalMinutes} minutes</p>
          <p style="margin: 0;"><strong>Last Ping:</strong> ${lastPingText}</p>
        </div>

        <a href="${viewUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
          View Monitor Status
        </a>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You're receiving this because you enabled email alerts for this cron monitor.
        </p>
      </div>
    `,
  })
}
