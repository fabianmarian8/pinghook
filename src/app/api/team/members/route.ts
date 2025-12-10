import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'team') {
      return NextResponse.json(
        { error: 'Team members are available on Team plan only' },
        { status: 403 }
      )
    }

    // Get team members (table added via migration)
    const { data: members, error } = await (supabase as any)
      .from('team_members')
      .select('*, profiles:member_id(email, full_name, avatar_url)')
      .eq('owner_id', user.id)

    if (error) {
      // Table might not exist yet
      return NextResponse.json({ members: [], pendingInvites: [] })
    }

    // Get pending invitations (table added via migration)
    const { data: invites } = await (supabase as any)
      .from('team_invitations')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'pending')

    return NextResponse.json({
      members: members || [],
      pendingInvites: invites || [],
      limit: 5,
    })
  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'team') {
      return NextResponse.json(
        { error: 'Team members are available on Team plan only' },
        { status: 403 }
      )
    }

    // Check member limit
    const { count: memberCount } = await (supabase as any)
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    const { count: inviteCount } = await (supabase as any)
      .from('team_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('status', 'pending')

    if ((memberCount || 0) + (inviteCount || 0) >= 5) {
      return NextResponse.json(
        { error: 'Team member limit reached (5 members)' },
        { status: 400 }
      )
    }

    // Check if already invited
    const { data: existingInvite } = await (supabase as any)
      .from('team_invitations')
      .select('id')
      .eq('owner_id', user.id)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      )
    }

    // Create invitation
    const { error: inviteError } = await (supabase as any)
      .from('team_invitations')
      .insert({
        owner_id: user.id,
        email: email.toLowerCase(),
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })

    if (inviteError) {
      console.error('Invite error:', inviteError)
      return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
    }

    // TODO: Send invitation email via Resend

    return NextResponse.json({ success: true, message: 'Invitation sent' })
  } catch (error) {
    console.error('Invite team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const inviteId = searchParams.get('inviteId')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (memberId) {
      // Remove team member
      const { error } = await (supabase as any)
        .from('team_members')
        .delete()
        .eq('owner_id', user.id)
        .eq('member_id', memberId)

      if (error) {
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
      }
    } else if (inviteId) {
      // Cancel invitation
      const { error } = await (supabase as any)
        .from('team_invitations')
        .delete()
        .eq('owner_id', user.id)
        .eq('id', inviteId)

      if (error) {
        return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Member ID or Invite ID required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
