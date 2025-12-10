// Plan limits
export const PLAN_LIMITS = {
  free: {
    webhooks: 3,
    cronMonitors: 2,
    logRetentionHours: 24,
    emailAlerts: false,
    requestReplay: false,
    exportLogs: false,
    slackIntegration: false,
    teamMembers: 0,
    customDomains: false,
    prioritySupport: false,
  },
  pro: {
    webhooks: 25,
    cronMonitors: 20,
    logRetentionDays: 30,
    emailAlerts: true,
    requestReplay: true,
    exportLogs: true,
    slackIntegration: false,
    teamMembers: 0,
    customDomains: false,
    prioritySupport: false,
  },
  team: {
    webhooks: -1, // unlimited
    cronMonitors: -1,
    logRetentionDays: 90,
    emailAlerts: true,
    requestReplay: true,
    exportLogs: true,
    slackIntegration: true,
    teamMembers: 5,
    customDomains: true,
    prioritySupport: true,
  },
} as const

// Pricing
export const PRICING = {
  pro: {
    monthly: 9,
    yearly: 90, // 2 months free
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  team: {
    monthly: 29,
    yearly: 290,
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID || '',
  },
} as const

// App config
export const APP_CONFIG = {
  name: 'PingHook',
  description: 'Webhook Inspector & Cron Monitor for Developers',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const
