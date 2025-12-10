'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow, format } from 'date-fns'
import type { WebhookLog } from '@/types/database'
import { Eye, RefreshCw } from 'lucide-react'

interface WebhookLogsProps {
  webhookId: string
  initialLogs: WebhookLog[]
}

export function WebhookLogs({ webhookId, initialLogs }: WebhookLogsProps) {
  const [logs, setLogs] = useState<WebhookLog[]>(initialLogs)
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)

  const supabase = createClient()

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
              <Eye className="h-4 w-4 text-muted-foreground" />
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
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
