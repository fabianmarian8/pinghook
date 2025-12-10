import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// For backwards compatibility
export const stripe = {
  get instance() {
    return getStripe()
  }
}

export const STRIPE_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    name: 'Pro',
    price: 9,
  },
  team: {
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    name: 'Team',
    price: 29,
  },
} as const
