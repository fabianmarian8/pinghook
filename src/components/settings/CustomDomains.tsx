'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Globe, Plus, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

interface CustomDomainsProps {
  userPlan: string
}

export function CustomDomains({ userPlan }: CustomDomainsProps) {
  const [domains, setDomains] = useState<{ domain: string; verified: boolean }[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)

  const isTeam = userPlan === 'team'

  // Custom domains feature is in development
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.trim()) return

    setAdding(true)
    // Simulate adding domain
    setTimeout(() => {
      setDomains([...domains, { domain: newDomain.toLowerCase(), verified: false }])
      setNewDomain('')
      setAdding(false)
    }, 1000)
  }

  if (!isTeam) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Custom Domains</CardTitle>
            <Badge variant="secondary">Team</Badge>
          </div>
          <CardDescription>
            Use your own domain for webhook endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Custom domains are available on the Team plan.</p>
            <p className="text-sm mt-1">Upgrade to use your own domain for webhook endpoints.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <CardTitle>Custom Domains</CardTitle>
        </div>
        <CardDescription>
          Use your own domain for webhook endpoints (e.g., hooks.yourcompany.com).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coming Soon Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-600 dark:text-blue-400">Coming Soon</p>
              <p className="text-sm text-muted-foreground mt-1">
                Custom domains feature is currently in development. You&apos;ll be notified when it&apos;s available.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Domains */}
        {domains.map((d, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {d.verified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">{d.domain}</p>
                <p className="text-sm text-muted-foreground">
                  {d.verified ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDomains(domains.filter((_, idx) => idx !== i))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add Domain Form */}
        <form onSubmit={handleAddDomain} className="flex gap-2">
          <Input
            type="text"
            placeholder="hooks.yourcompany.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            disabled={adding || true} // Disabled until feature is ready
          />
          <Button type="submit" disabled={adding || !newDomain.trim() || true}>
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Domain
          </Button>
        </form>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">How it will work:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Add your custom domain above</li>
            <li>Add a CNAME record pointing to pinghook.dev</li>
            <li>We&apos;ll verify and activate your domain</li>
            <li>Use your domain for webhook endpoints</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
