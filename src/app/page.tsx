import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Webhook,
  Bell,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Github
} from 'lucide-react'

const features = [
  {
    icon: Webhook,
    title: 'Webhook Inspector',
    description: 'Get unique URLs to capture and inspect incoming webhooks. See headers, body, and metadata in real-time.',
  },
  {
    icon: Clock,
    title: 'Cron Monitor',
    description: 'Dead man\'s switch for your cron jobs. Get alerted instantly when scheduled tasks fail to run.',
  },
  {
    icon: Zap,
    title: 'Real-time Logs',
    description: 'Watch webhook requests arrive live. No refresh needed. Debug integrations faster than ever.',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'Email notifications when cron jobs miss their schedule. Never miss a failed backup again.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data stays yours. Automatic log expiration. No tracking, no ads.',
  },
  {
    icon: Github,
    title: 'Developer First',
    description: 'Built by developers, for developers. Simple API. Works with any stack.',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for side projects',
    features: [
      '3 webhook endpoints',
      '2 cron monitors',
      '24-hour log retention',
      'Email alerts',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For professional developers',
    features: [
      '25 webhook endpoints',
      '20 cron monitors',
      '30-day log retention',
      'Priority email alerts',
      'Request replay',
      'Export logs',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For growing teams',
    features: [
      'Unlimited webhooks',
      'Unlimited cron monitors',
      '90-day log retention',
      'Team members (5)',
      'Slack integration',
      'Custom domains',
      'Priority support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Webhook className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">PingHook</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-24 md:py-32">
          <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
            <Badge variant="secondary" className="px-4 py-1">
              Now in Public Beta
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Debug Webhooks.
              <br />
              <span className="text-primary">Monitor Crons.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Capture, inspect, and replay webhooks. Get instant alerts when your cron jobs fail.
              Built for developers who ship fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start for Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  See Features
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required. Free forever plan available.
            </p>
          </div>
        </section>

        {/* Demo Preview */}
        <section className="container py-12">
          <div className="rounded-xl border bg-muted/30 p-4 max-w-5xl mx-auto">
            <div className="rounded-lg bg-background border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-muted-foreground ml-2">PingHook Dashboard</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Stripe Webhook</span>
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground block truncate">
                      https://pinghook.io/h/abc123xyz
                    </code>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Last hit: 2 minutes ago • 47 requests today
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">DB Backup Cron</span>
                      <Badge variant="default" className="bg-green-500">Healthy</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground block">
                      Expected: Every 1 hour
                    </code>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Last ping: 45 minutes ago • Uptime: 99.9%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple tools that just work. No complex setup, no bloated features.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container py-24 bg-muted/30">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.highlighted ? 'border-primary border-2 shadow-lg' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to debug smarter?</h2>
            <p className="text-muted-foreground mb-8">
              Join developers who use PingHook to ship faster and sleep better.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started for Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <span className="font-semibold">PingHook</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with care for developers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
