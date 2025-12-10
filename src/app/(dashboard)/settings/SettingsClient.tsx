'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { User, Mail, Shield, CreditCard, Trash2, Key, Check, Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { TeamMembers } from '@/components/settings/TeamMembers'
import { CustomDomains } from '@/components/settings/CustomDomains'
import { PrioritySupport } from '@/components/settings/PrioritySupport'

interface SettingsClientProps {
  profile: Profile
  webhookCount: number
  cronCount: number
  limits: {
    webhooks: number
    cronMonitors: number
    logRetentionHours?: number
    logRetentionDays?: number
  }
  plan: string
  stripeEnabled: boolean
  stripePrices: {
    pro: string
    team: string
  }
}

export function SettingsClient({
  profile,
  webhookCount,
  cronCount,
  limits,
  plan,
  stripeEnabled,
  stripePrices,
}: SettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // Profile state
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Upgrade state
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)

  // Update profile
  const handleUpdateProfile = async () => {
    setProfileLoading(true)
    setProfileSuccess(false)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id)

    setProfileLoading(false)

    if (!error) {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
      router.refresh()
    }
  }

  // Change password
  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setPasswordLoading(true)

    const response = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await response.json()

    setPasswordLoading(false)

    if (!response.ok) {
      setPasswordError(data.error || 'Failed to change password')
      return
    }

    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => {
      setPasswordDialogOpen(false)
      setPasswordSuccess(false)
    }, 2000)
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type "DELETE MY ACCOUNT" to confirm')
      return
    }

    setDeleteError('')
    setDeleteLoading(true)

    const response = await fetch('/api/account/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: deleteConfirmation }),
    })

    const data = await response.json()

    if (!response.ok) {
      setDeleteError(data.error || 'Failed to delete account')
      setDeleteLoading(false)
      return
    }

    // Redirect to home after deletion
    router.push('/')
  }

  // Upgrade plan
  const handleUpgrade = async (targetPlan: 'pro' | 'team') => {
    if (!stripeEnabled) return

    setUpgradeLoading(targetPlan)

    const priceId = targetPlan === 'pro' ? stripePrices.pro : stripePrices.team

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, plan: targetPlan }),
    })

    const data = await response.json()

    setUpgradeLoading(null)

    if (data.url) {
      window.location.href = data.url
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button onClick={handleUpdateProfile} disabled={profileLoading}>
            {profileLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : profileSuccess ? (
              <Check className="h-4 w-4 mr-2" />
            ) : null}
            {profileSuccess ? 'Saved!' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Plan Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plan & Usage
          </CardTitle>
          <CardDescription>Your current plan and resource usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">
                {plan === 'free' && 'Free tier with basic features'}
                {plan === 'pro' && 'Pro plan with advanced features'}
                {plan === 'team' && 'Team plan with unlimited resources'}
              </p>
            </div>
            <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="text-sm">
              {plan.toUpperCase()}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Webhooks</span>
                <span className="text-sm text-muted-foreground">
                  {webhookCount} / {limits.webhooks === -1 ? '∞' : limits.webhooks}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: limits.webhooks === -1
                      ? '10%'
                      : `${Math.min((webhookCount / limits.webhooks) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Cron Monitors</span>
                <span className="text-sm text-muted-foreground">
                  {cronCount} / {limits.cronMonitors === -1 ? '∞' : limits.cronMonitors}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: limits.cronMonitors === -1
                      ? '10%'
                      : `${Math.min((cronCount / limits.cronMonitors) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-1">Log Retention</p>
            <p className="text-sm text-muted-foreground">
              {'logRetentionDays' in limits
                ? `${limits.logRetentionDays} days`
                : `${limits.logRetentionHours} hours`}
            </p>
          </div>

          {/* Upgrade Options */}
          {plan === 'free' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="font-medium text-primary mb-1">Pro Plan</p>
                <p className="text-2xl font-bold mb-2">$9<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• 25 webhooks</li>
                  <li>• 20 cron monitors</li>
                  <li>• 30 days log retention</li>
                </ul>
                <Button
                  onClick={() => handleUpgrade('pro')}
                  disabled={!stripeEnabled || upgradeLoading !== null}
                  className="w-full"
                >
                  {upgradeLoading === 'pro' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {stripeEnabled ? 'Upgrade to Pro' : 'Coming Soon'}
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="font-medium text-primary mb-1">Team Plan</p>
                <p className="text-2xl font-bold mb-2">$29<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Unlimited webhooks</li>
                  <li>• Unlimited monitors</li>
                  <li>• 90 days log retention</li>
                </ul>
                <Button
                  onClick={() => handleUpgrade('team')}
                  disabled={!stripeEnabled || upgradeLoading !== null}
                  variant="outline"
                  className="w-full"
                >
                  {upgradeLoading === 'team' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {stripeEnabled ? 'Upgrade to Team' : 'Coming Soon'}
                </Button>
              </div>
            </div>
          )}

          {plan === 'pro' && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="font-medium text-primary mb-1">Upgrade to Team</p>
              <p className="text-sm text-muted-foreground mb-3">
                Get unlimited webhooks, monitors, and extended log retention.
              </p>
              <Button
                onClick={() => handleUpgrade('team')}
                disabled={!stripeEnabled || upgradeLoading !== null}
                size="sm"
              >
                {upgradeLoading === 'team' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {stripeEnabled ? 'Upgrade to Team' : 'Coming Soon'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Change your account password</p>
              </div>
            </div>
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and a new password.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-green-600">Password changed successfully!</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={passwordLoading}>
                    {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Change Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <TeamMembers userPlan={plan} ownerEmail={profile.email} />

      {/* Custom Domains */}
      <CustomDomains userPlan={plan} />

      {/* Priority Support */}
      <PrioritySupport userPlan={plan} userEmail={profile.email} />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete Account
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      This action is <strong>permanent and irreversible</strong>. All your data including:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All webhooks and their logs</li>
                      <li>All cron monitors and their history</li>
                      <li>Your profile and settings</li>
                    </ul>
                    <p>will be permanently deleted.</p>
                    <div className="space-y-2 pt-4">
                      <Label htmlFor="deleteConfirm">
                        Type <strong>DELETE MY ACCOUNT</strong> to confirm:
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE MY ACCOUNT"
                      />
                    </div>
                    {deleteError && (
                      <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmation !== 'DELETE MY ACCOUNT'}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
