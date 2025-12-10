'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Headphones, Mail, MessageSquare, Clock, CheckCircle } from 'lucide-react'

interface PrioritySupportProps {
  userPlan: string
  userEmail: string
}

export function PrioritySupport({ userPlan, userEmail }: PrioritySupportProps) {
  const isTeam = userPlan === 'team'

  if (!isTeam) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            <CardTitle>Priority Support</CardTitle>
            <Badge variant="secondary">Team</Badge>
          </div>
          <CardDescription>
            Get faster response times and dedicated support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Priority support is available on the Team plan.</p>
            <p className="text-sm mt-1">Upgrade for faster response times and dedicated assistance.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          <CardTitle>Priority Support</CardTitle>
          <Badge className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          You have access to priority support as a Team plan subscriber.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Support Benefits */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Response Time</p>
              <p className="text-sm text-muted-foreground">
                &lt; 4 hours during business hours
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Priority Queue</p>
              <p className="text-sm text-muted-foreground">
                Your tickets are handled first
              </p>
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <div className="space-y-3">
          <p className="font-medium">Contact Support</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `mailto:support@pinghook.dev?subject=Priority Support Request&body=Account: ${userEmail}`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open('https://discord.gg/pinghook', '_blank')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Discord Community
            </Button>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-sm">
            <span className="font-medium text-green-600 dark:text-green-400">Your Priority Status: </span>
            When contacting support, mention your email ({userEmail}) to receive priority handling.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
