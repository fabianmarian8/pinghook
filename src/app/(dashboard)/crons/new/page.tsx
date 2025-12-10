'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'

const intervalOptions = [
  { label: 'Every minute', value: '60' },
  { label: 'Every 5 minutes', value: '300' },
  { label: 'Every 15 minutes', value: '900' },
  { label: 'Every 30 minutes', value: '1800' },
  { label: 'Every hour', value: '3600' },
  { label: 'Every 6 hours', value: '21600' },
  { label: 'Every 12 hours', value: '43200' },
  { label: 'Every day', value: '86400' },
  { label: 'Every week', value: '604800' },
]

export default function NewCronPage() {
  const [name, setName] = useState('')
  const [interval, setInterval] = useState('3600')
  const [gracePeriod, setGracePeriod] = useState('300')
  const [alertEmail, setAlertEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a name for your monitor')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        router.push('/login')
        return
      }

      // Generate unique ping URL
      const pingUrl = nanoid(12)

      const { data, error } = await supabase
        .from('cron_monitors')
        .insert({
          user_id: user.id,
          name: name.trim(),
          ping_url: pingUrl,
          expected_interval: parseInt(interval),
          grace_period: parseInt(gracePeriod),
          alert_email: alertEmail.trim() || null,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Monitor created successfully!')
      router.push(`/crons/${data.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link href="/crons" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to monitors
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Create New Monitor</CardTitle>
              <CardDescription>
                Set up monitoring for your scheduled job
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name</Label>
              <Input
                id="name"
                placeholder="e.g., Database Backup, Report Generator"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Give your monitor a descriptive name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Expected Interval</Label>
              <Select value={interval} onValueChange={setInterval} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often should your job run?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grace">Grace Period</Label>
              <Select value={gracePeriod} onValueChange={setGracePeriod} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="900">15 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How long to wait after expected time before alerting.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alert Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="alerts@example.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Email to notify when the job fails. Leave empty to use your account email.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Monitor
              </Button>
              <Link href="/crons">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
