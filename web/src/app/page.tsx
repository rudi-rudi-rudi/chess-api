import { Shield, Clock3, KeyRound, Zap, CheckCircle2, Rocket, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Nav } from '@/components/nav'

const features = [
  {
    icon: Shield,
    title: 'Secure by Default',
    text: 'Google auth, scoped API keys, and modular NestJS guards built for production workloads.',
  },
  {
    icon: Clock3,
    title: 'Timed Chess Core',
    text: 'Increment clocks, timeout handling, and reliable move lifecycle for real chess products.',
  },
  {
    icon: Zap,
    title: 'Fast Integration',
    text: 'Clean REST contracts and DTO validation let teams ship clients quickly with fewer errors.',
  },
  {
    icon: KeyRound,
    title: 'SaaS API Model',
    text: 'Per-user key management, usage controls, and account-ready architecture from day one.',
  },
]

const stats = [
  { label: 'Core Routes', value: '12+' },
  { label: 'Auth Model', value: 'Google + API Keys' },
  { label: 'Architecture', value: 'NestJS Modular' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#1d4ed844,transparent_35%),radial-gradient(circle_at_80%_20%,#7c3aed33,transparent_30%),radial-gradient(circle_at_50%_100%,#0ea5e922,transparent_40%)]">
      <Nav />

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-24">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
          <p className="mb-4 inline-flex items-center rounded-full border border-border bg-muted/70 px-3 py-1 text-xs text-muted-foreground">
            <Rocket className="mr-2 h-3.5 w-3.5" />
            SaaS-ready Chess Infrastructure
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Build a Modern Chess API Business
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"> without backend chaos</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Production-focused API stack with auth, API keys, timed games, PvP/PvE logic, and a modular architecture your team can scale.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard"><Button size="lg">Open Dashboard</Button></Link>
            <Link href="/docs"><Button size="lg" variant="outline">Read Documentation</Button></Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-border/80 bg-background/40 p-4">
                <p className="text-xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="bg-card/70 transition hover:-translate-y-0.5 hover:border-blue-400/50">
              <CardContent>
                <div className="mb-3 inline-flex rounded-md border border-border p-2">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <Card className="bg-card/70">
          <CardContent>
            <h2 className="flex items-center text-2xl font-semibold">
              <BarChart3 className="mr-2 h-5 w-5" />
              Why teams pick this stack
            </h2>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              {[
                'Clean module boundaries (Auth, Users, Chess, Database)',
                'Fast onboarding with Google login + generated API keys',
                'Persistent game state in Postgres with typed schema',
                'Timed game support for blitz/rapid/classical products',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
