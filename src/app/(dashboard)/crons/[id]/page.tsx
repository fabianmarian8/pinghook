import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { CopyButton } from '@/components/webhook/CopyButton'
import { DeleteCronButton } from '@/components/cron/DeleteCronButton'

export default async function CronDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get cron monitor
  const { data: monitorData, error } = await supabase
    .from('cron_monitors')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (error || !monitorData) {
    return notFound()
  }

  const monitor = monitorData!

  // Get recent pings
  const { data: pings } = await supabase
    .from('cron_pings')
    .select('*')
    .eq('monitor_id', monitor.id)
    .order('received_at', { ascending: false })
    .limit(20)

  const { count: totalPings } = await supabase
    .from('cron_pings')
    .select('*', { count: 'exact', head: true })
    .eq('monitor_id', monitor.id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const pingUrl = `${appUrl}/api/ping/${monitor.ping_url}`

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
        return <Badge className="bg-green-500 text-white">Healthy</Badge>
      case 'late':
        return <Badge className="bg-yellow-500 text-black">Late</Badge>
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
      {/* Back button */}
      <Link href="/crons" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to monitors
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            monitor.status === 'healthy' ? 'bg-green-500/10' :
            monitor.status === 'late' ? 'bg-yellow-500/10' :
            monitor.status === 'down' ? 'bg-red-500/10' : 'bg-muted'
          }`}>
            <Clock className={`h-6 w-6 ${
              monitor.status === 'healthy' ? 'text-green-500' :
              monitor.status === 'late' ? 'text-yellow-500' :
              monitor.status === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{monitor.name}</h1>
              {getStatusBadge(monitor.status)}
            </div>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(monitor.created_at))} ago
            </p>
          </div>
        </div>
        <DeleteCronButton monitorId={monitor.id} />
      </div>

      {/* Ping URL */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Ping URL</CardTitle>
          <CardDescription>
            Call this URL from your cron job when it runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
            <code className="flex-1 text-sm break-all">{pingUrl}</code>
            <CopyButton text={pingUrl} />
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Usage examples:</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`# Bash/curl
curl -fsS --retry 3 "${pingUrl}"

# wget
wget -q "${pingUrl}" -O /dev/null

# Add to your cron job:
0 * * * * /path/to/your/script.sh && curl -fsS "${pingUrl}"`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(monitor.status)}`} />
              <span className="text-lg font-semibold capitalize">{monitor.status}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected Interval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatInterval(monitor.expected_interval)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Ping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {monitor.last_ping
                ? formatDistanceToNow(new Date(monitor.last_ping)) + ' ago'
                : 'Never'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{totalPings || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ping History */}
      <Card>
        <CardHeader>
          <CardTitle>Ping History</CardTitle>
          <CardDescription>Recent ping activity (last 20)</CardDescription>
        </CardHeader>
        <CardContent>
          {pings && pings.length > 0 ? (
            <div className="space-y-2">
              {pings.map((ping) => (
                <div
                  key={ping.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-medium">Ping received</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(ping.received_at), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pings received yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Use the ping URL above in your cron job
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
