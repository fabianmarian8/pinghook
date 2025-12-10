'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow, format } from 'date-fns'
import type { WebhookLog } from '@/types/database'
import { Eye, RefreshCw, Download, Play, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface WebhookLogsProps {
  webhookId: string
  initialLogs: WebhookLog[]
  userPlan?: string
}

export function WebhookLogs({ webhookId, initialLogs, userPlan = 'free' }: WebhookLogsProps) {
  const [logs, setLogs] = useState<WebhookLog[]>(initialLogs)
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)
  const [replayUrl, setReplayUrl] = useState('')
  const [replayLoading, setReplayLoading] = useState(false)
  const [replayResult, setReplayResult] = useState<{
    success: boolean
    status?: number
    body?: string
  } | null>(null)
  const [replayDialogOpen, setReplayDialogOpen] = useState(false)
  const [replayLogId, setReplayLogId] = useState<string | null>(null)

  const supabase = createClient()
  const isPro = userPlan === 'pro' || userPlan === 'team'

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`webhook-logs-${webhookId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_logs',
          filter: `webhook_id=eq.${webhookId}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as WebhookLog, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [webhookId, supabase])

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500'
      case 'POST':
        return 'bg-green-500'
      case 'PUT':
        return 'bg-yellow-500'
      case 'PATCH':
        return 'bg-orange-500'
      case 'DELETE':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    window.open(`/api/webhooks/${webhookId}/export?format=${format}`, '_blank')
  }

  const handleReplay = async () => {
    if (!replayLogId || !replayUrl) return

    setReplayLoading(true)
    setReplayResult(null)

    try {
      const response = await fetch(`/api/webhooks/logs/${replayLogId}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: replayUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setReplayResult({ success: false, body: data.error })
      } else {
        setReplayResult({
          success: true,
          status: data.replay.status,
          body: data.replay.body,
        })
      }
    } catch (error) {
      setReplayResult({ success: false, body: 'Network error' })
    } finally {
      setReplayLoading(false)
    }
  }

  const openReplayDialog = (logId: string) => {
    setReplayLogId(logId)
    setReplayUrl('')
    setReplayResult(null)
    setReplayDialogOpen(true)
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">Waiting for requests...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Send a request to your webhook URL to see it here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('json')}
          disabled={!isPro}
          title={!isPro ? 'Pro feature' : 'Export as JSON'}
        >
          <Download className="h-4 w-4 mr-2" />
          JSON
          {!isPro && <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          disabled={!isPro}
          title={!isPro ? 'Pro feature' : 'Export as CSV'}
        >
          <Download className="h-4 w-4 mr-2" />
          CSV
          {!isPro && <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>}
        </Button>
      </div>

      {/* Logs list */}
      <div className="space-y-2">
        {logs.map((log) => (
          <Dialog key={log.id}>
            <DialogTrigger asChild>
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-center gap-3">
                  <Badge className={getMethodColor(log.method)}>{log.method}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(log.received_at), 'MMM d, HH:mm:ss')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    from {log.source_ip || 'unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openReplayDialog(log.id)
                    }}
                    disabled={!isPro}
                    title={!isPro ? 'Pro feature' : 'Replay request'}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge className={getMethodColor(log.method)}>{log.method}</Badge>
                  Request Details
                </DialogTitle>
                <DialogDescription>
                  Received {formatDistanceToNow(new Date(log.received_at))} ago
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="body" className="flex-1 overflow-hidden">
                <TabsList>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="query">Query Params</TabsTrigger>
                </TabsList>
                <TabsContent value="body" className="overflow-auto max-h-[50vh]">
                  {log.body ? (
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                      {log.body}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground p-4">No body</p>
                  )}
                </TabsContent>
                <TabsContent value="headers" className="overflow-auto max-h-[50vh]">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(log.headers, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="query" className="overflow-auto max-h-[50vh]">
                  {log.query_params ? (
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(log.query_params, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground p-4">No query parameters</p>
                  )}
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button
                  onClick={() => openReplayDialog(log.id)}
                  disabled={!isPro}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Replay Request
                  {!isPro && <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {/* Replay Dialog */}
      <Dialog open={replayDialogOpen} onOpenChange={setReplayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replay Request</DialogTitle>
            <DialogDescription>
              Send this request to a different URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="replayUrl">Target URL</Label>
              <Input
                id="replayUrl"
                placeholder="https://your-server.com/webhook"
                value={replayUrl}
                onChange={(e) => setReplayUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The original request will be sent to this URL with the same method, headers, and body.
              </p>
            </div>
            {replayResult && (
              <div className={`p-4 rounded-lg ${replayResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {replayResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {replayResult.success ? `Status: ${replayResult.status}` : 'Failed'}
                  </span>
                </div>
                {replayResult.body && (
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {replayResult.body.substring(0, 500)}
                    {replayResult.body.length > 500 && '...'}
                  </pre>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReplay} disabled={!replayUrl || replayLoading}>
              {replayLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
