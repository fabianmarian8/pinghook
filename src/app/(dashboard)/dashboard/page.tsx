import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Webhook, Clock, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { PLAN_LIMITS } from '@/lib/constants'

export default async function DashboardPage() {
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
    .select('*, webhook_logs(count)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get cron monitors
  const { data: cronMonitors } = await supabase
    .from('cron_monitors')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get counts
  const { count: webhookCount } = await supabase
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: cronCount } = await supabase
    .from('cron_monitors')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'late':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {plan.toUpperCase()} Plan
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhookCount || 0}
              <span className="text-sm font-normal text-muted-foreground">
                /{limits.webhooks === -1 ? '∞' : limits.webhooks}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cron Monitors</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cronCount || 0}
              <span className="text-sm font-normal text-muted-foreground">
                /{limits.cronMonitors === -1 ? '∞' : limits.cronMonitors}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Healthy Crons</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cronMonitors?.filter(c => c.status === 'healthy').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <div className="h-3 w-3 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cronMonitors?.filter(c => c.status === 'down' || c.status === 'late').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Webhooks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Your webhook endpoints</CardDescription>
            </div>
            <Link href="/webhooks/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {webhooks && webhooks.length > 0 ? (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <Link
                    key={webhook.id}
                    href={`/webhooks/${webhook.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{webhook.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        /h/{webhook.endpoint_id}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
                {(webhookCount || 0) > 5 && (
                  <Link href="/webhooks" className="block">
                    <Button variant="ghost" className="w-full">
                      View all webhooks
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No webhooks yet</p>
                <Link href="/webhooks/new">
                  <Button size="sm">Create your first webhook</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cron Monitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cron Monitors</CardTitle>
              <CardDescription>Your scheduled job monitors</CardDescription>
            </div>
            <Link href="/crons/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {cronMonitors && cronMonitors.length > 0 ? (
              <div className="space-y-3">
                {cronMonitors.map((monitor) => (
                  <Link
                    key={monitor.id}
                    href={`/crons/${monitor.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(monitor.status)}`} />
                        <p className="font-medium">{monitor.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {monitor.last_ping
                          ? `Last ping: ${formatDistanceToNow(new Date(monitor.last_ping))} ago`
                          : 'Waiting for first ping'}
                      </p>
                    </div>
                    <Badge variant={monitor.status === 'healthy' ? 'default' : 'destructive'}>
                      {monitor.status}
                    </Badge>
                  </Link>
                ))}
                {(cronCount || 0) > 5 && (
                  <Link href="/crons" className="block">
                    <Button variant="ghost" className="w-full">
                      View all monitors
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No cron monitors yet</p>
                <Link href="/crons/new">
                  <Button size="sm">Create your first monitor</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
