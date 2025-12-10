import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan

        if (userId && plan) {
          await supabaseAdmin
            .from('profiles')
            .update({
              plan: plan,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId)

          console.log(`User ${userId} upgraded to ${plan}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        const plan = subscription.metadata?.plan

        if (userId && plan && subscription.status === 'active') {
          await supabaseAdmin
            .from('profiles')
            .update({ plan: plan })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          // Downgrade to free plan
          await supabaseAdmin
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', userId)

          console.log(`User ${userId} downgraded to free`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Get user by customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          console.log(`Payment failed for user ${profile.id} (${profile.email})`)
          // Could send email notification here
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
