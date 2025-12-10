import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { confirmation } = await request.json()

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation text' },
        { status: 400 }
      )
    }

    // Use admin client to delete user
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Delete all user data (cascades will handle related records)
    // The database has ON DELETE CASCADE so this will clean up everything

    // Delete the user from auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    // Sign out the current session
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
