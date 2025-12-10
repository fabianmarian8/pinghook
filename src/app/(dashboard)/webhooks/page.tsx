import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Webhook, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { PLAN_LIMITS } from '@/lib/constants'

export default async function WebhooksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get profile for plan limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()

  const plan = (profile?.plan || 'free') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan]

  // Get webhooks
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { count: webhookCount } = await supabase
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const canCreate = limits.webhooks === -1 || (webhookCount || 0) < limits.webhooks
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Capture and inspect incoming webhook requests
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {webhookCount || 0}/{limits.webhooks === -1 ? '∞' : limits.webhooks} used
          </span>
          {canCreate ? (
            <Link href="/webhooks/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Webhook
              </Button>
            </Link>
          ) : (
            <Link href="/settings">
              <Button variant="outline">Upgrade Plan</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Webhooks List */}
      {webhooks && webhooks.length > 0 ? (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Webhook className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription>
                        Created {formatDistanceToNow(new Date(webhook.created_at))} ago
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/webhooks/${webhook.id}`}>
                    <Button variant="outline" size="sm">
                      View Logs
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <code className="text-sm flex-1 truncate">
                    {appUrl}/api/hook/{webhook.endpoint_id}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No webhooks yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create a webhook endpoint to start capturing and inspecting incoming requests.
            </p>
            <Link href="/webhooks/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Webhook
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
