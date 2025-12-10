'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, UserPlus, Mail, Loader2, X, Clock, Crown } from 'lucide-react'

interface TeamMember {
  id: string
  member_id: string
  profiles: {
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface TeamInvite {
  id: string
  email: string
  status: string
  expires_at: string
}

interface TeamMembersProps {
  userPlan: string
  ownerEmail: string
}

export function TeamMembers({ userPlan, ownerEmail }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTeam = userPlan === 'team'
  const totalSlots = 5
  const usedSlots = members.length + invites.length

  useEffect(() => {
    if (isTeam) {
      fetchTeamMembers()
    } else {
      setLoading(false)
    }
  }, [isTeam])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
        setInvites(data.pendingInvites || [])
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setError(null)

    try {
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error)
      } else {
        setInviteEmail('')
        fetchTeamMembers()
      }
    } catch (err) {
      setError('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (memberId?: string, inviteId?: string) => {
    const params = new URLSearchParams()
    if (memberId) params.set('memberId', memberId)
    if (inviteId) params.set('inviteId', inviteId)

    try {
      const response = await fetch(`/api/team/members?${params.toString()}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTeamMembers()
      }
    } catch (err) {
      console.error('Failed to remove:', err)
    }
  }

  if (!isTeam) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Team Members</CardTitle>
            <Badge variant="secondary">Team</Badge>
          </div>
          <CardDescription>
            Invite team members to collaborate on your webhooks and monitors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Team members are available on the Team plan.</p>
            <p className="text-sm mt-1">Upgrade to invite up to 5 team members.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <Badge variant="outline">{usedSlots} / {totalSlots} seats</Badge>
        </div>
        <CardDescription>
          Invite team members to collaborate on your webhooks and monitors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{ownerEmail.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{ownerEmail}</p>
              <p className="text-sm text-muted-foreground">You</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        </div>

        {/* Team Members */}
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {(member.profiles.full_name || member.profiles.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.profiles.full_name || member.profiles.email}</p>
                <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(member.member_id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Pending Invites */}
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-3 border border-dashed rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending invitation
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(undefined, invite.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Invite Form */}
        {usedSlots < totalSlots && (
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting}
            />
            <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Invite
            </Button>
          </form>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {usedSlots >= totalSlots && (
          <p className="text-sm text-muted-foreground text-center py-2">
            All team seats are in use. Remove a member to invite someone new.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
