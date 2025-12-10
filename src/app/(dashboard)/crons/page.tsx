import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { PLAN_LIMITS } from '@/lib/constants'

export default async function CronsPage() {
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

  // Get cron monitors
  const { data: cronMonitors } = await supabase
    .from('cron_monitors')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { count: cronCount } = await supabase
    .from('cron_monitors')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const canCreate = limits.cronMonitors === -1 || (cronCount || 0) < limits.cronMonitors
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>
      case 'down':
        return <Badge variant="destructive">Down</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
    return `${Math.floor(seconds / 86400)} days`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cron Monitors</h1>
          <p className="text-muted-foreground">
            Monitor your scheduled jobs and get alerts when they fail
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {cronCount || 0}/{limits.cronMonitors === -1 ? '∞' : limits.cronMonitors} used
          </span>
          {canCreate ? (
            <Link href="/crons/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Monitor
              </Button>
            </Link>
          ) : (
            <Link href="/settings">
              <Button variant="outline">Upgrade Plan</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cron Monitors List */}
      {cronMonitors && cronMonitors.length > 0 ? (
        <div className="grid gap-4">
          {cronMonitors.map((monitor) => (
            <Card key={monitor.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      monitor.status === 'healthy' ? 'bg-green-500/10' :
                      monitor.status === 'late' ? 'bg-yellow-500/10' :
                      monitor.status === 'down' ? 'bg-red-500/10' : 'bg-muted'
                    }`}>
                      <Clock className={`h-5 w-5 ${
                        monitor.status === 'healthy' ? 'text-green-500' :
                        monitor.status === 'late' ? 'text-yellow-500' :
                        monitor.status === 'down' ? 'text-red-500' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{monitor.name}</CardTitle>
                        {getStatusBadge(monitor.status)}
                      </div>
                      <CardDescription>
                        Expected every {formatInterval(monitor.expected_interval)}
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/crons/${monitor.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                    <code className="text-sm">
                      {appUrl}/api/ping/{monitor.ping_url}
                    </code>
                  </div>
                  <div className="text-muted-foreground">
                    {monitor.last_ping
                      ? `Last ping: ${formatDistanceToNow(new Date(monitor.last_ping))} ago`
                      : 'Waiting for first ping'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cron monitors yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create a cron monitor to track your scheduled jobs and get alerted when they fail.
            </p>
            <Link href="/crons/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Monitor
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
