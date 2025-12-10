import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Webhook, Copy, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { WebhookLogs } from '@/components/webhook/WebhookLogs'
import { WebhookAlerts } from '@/components/webhook/WebhookAlerts'
import { DeleteWebhookButton } from '@/components/webhook/DeleteWebhookButton'
import { CopyButton } from '@/components/webhook/CopyButton'

export default async function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile for plan info
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()

  const userPlan = profile?.plan || 'free'

  // Get webhook
  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (error || !webhook) {
    notFound()
  }

  // Get recent logs
  const { data: logs } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('webhook_id', webhook.id)
    .order('received_at', { ascending: false })
    .limit(50)

  const { count: totalLogs } = await supabase
    .from('webhook_logs')
    .select('*', { count: 'exact', head: true })
    .eq('webhook_id', webhook.id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const webhookUrl = `${appUrl}/api/hook/${webhook.endpoint_id}`

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/webhooks" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to webhooks
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Webhook className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{webhook.name}</h1>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(webhook.created_at))} ago
            </p>
          </div>
        </div>
        <DeleteWebhookButton webhookId={webhook.id} />
      </div>

      {/* Endpoint URL */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Endpoint URL</CardTitle>
          <CardDescription>
            Send webhooks to this URL to capture them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
            <code className="flex-1 text-sm break-all">{webhookUrl}</code>
            <CopyButton text={webhookUrl} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Supports GET, POST, PUT, PATCH, DELETE methods
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs?.[0]
                ? formatDistanceToNow(new Date(logs[0].received_at)) + ' ago'
                : 'Never'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Endpoint ID</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-lg font-mono">{webhook.endpoint_id}</code>
          </CardContent>
        </Card>
      </div>

      {/* Alert Settings */}
      <WebhookAlerts webhookId={webhook.id} userPlan={userPlan} />

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Request Logs</CardTitle>
          <CardDescription>
            Recent webhook requests (showing last 50)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebhookLogs webhookId={webhook.id} initialLogs={logs || []} userPlan={userPlan} />
        </CardContent>
      </Card>
    </div>
  )
}
