'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Bell, Mail, MessageSquare, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface WebhookAlertsProps {
  webhookId: string
  userPlan: string
}

export function WebhookAlerts({ webhookId, userPlan }: WebhookAlertsProps) {
  const [alertEmail, setAlertEmail] = useState('')
  const [slackUrl, setSlackUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isPro = userPlan === 'pro' || userPlan === 'team'
  const isTeam = userPlan === 'team'

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`/api/webhooks/${webhookId}/alerts`)
        if (response.ok) {
          const data = await response.json()
          setAlertEmail(data.alert_email || '')
          setSlackUrl(data.slack_webhook_url || '')
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [webhookId])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/webhooks/${webhookId}/alerts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_email: alertEmail || null,
          slack_webhook_url: slackUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Alert settings saved successfully' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Alert Settings</CardTitle>
        </div>
        <CardDescription>
          Get notified when new webhook requests arrive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Alerts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="alertEmail">Email Alerts</Label>
            {!isPro && <Badge variant="secondary" className="text-xs">Pro</Badge>}
          </div>
          <Input
            id="alertEmail"
            type="email"
            placeholder="alerts@example.com"
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            disabled={!isPro}
          />
          <p className="text-xs text-muted-foreground">
            Receive an email notification for every incoming webhook request.
            {!isPro && ' Upgrade to Pro to enable.'}
          </p>
        </div>

        {/* Slack Integration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="slackUrl">Slack Webhook URL</Label>
            {!isTeam && <Badge variant="secondary" className="text-xs">Team</Badge>}
          </div>
          <Input
            id="slackUrl"
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={slackUrl}
            onChange={(e) => setSlackUrl(e.target.value)}
            disabled={!isTeam}
          />
          <p className="text-xs text-muted-foreground">
            Send notifications to a Slack channel.
            {!isTeam && ' Upgrade to Team plan to enable.'}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Save button */}
        <Button onClick={handleSave} disabled={saving || (!isPro && !alertEmail && !slackUrl)}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Alert Settings
        </Button>
      </CardContent>
    </Card>
  )
}
