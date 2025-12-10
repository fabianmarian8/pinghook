import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLAN_LIMITS } from '@/lib/constants'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const plan = (profile.plan || 'free') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan]

  // Get usage counts
  const { count: webhookCount } = await supabase
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: cronCount } = await supabase
    .from('cron_monitors')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Check if Stripe is configured
  const stripeEnabled = !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRO_PRICE_ID &&
    process.env.STRIPE_TEAM_PRICE_ID
  )

  return (
    <SettingsClient
      profile={profile}
      webhookCount={webhookCount || 0}
      cronCount={cronCount || 0}
      limits={limits}
      plan={plan}
      stripeEnabled={stripeEnabled}
      stripePrices={{
        pro: process.env.STRIPE_PRO_PRICE_ID || '',
        team: process.env.STRIPE_TEAM_PRICE_ID || '',
      }}
    />
  )
}
