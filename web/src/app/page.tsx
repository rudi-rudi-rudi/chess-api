import { Shield, Clock3, KeyRound, Zap, CheckCircle2, Rocket, Crown, Swords } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Nav } from '@/components/nav'

const features = [
  {
    icon: Shield,
    title: 'Secure Match Infrastructure',
    text: 'Google auth, scoped API keys, and strict backend guards designed for real production traffic.',
  },
  {
    icon: Clock3,
    title: 'Tournament-Ready Clocks',
    text: 'Blitz, rapid, and classical support with increment, timeout handling, and deterministic turn flow.',
  },
  {
    icon: Swords,
    title: 'PvP + PvE in One API',
    text: 'Create player-vs-player rooms or engine games from the same endpoint contracts.',
  },
  {
    icon: KeyRound,
    title: 'SaaS API Business Model',
    text: 'Built for productization: per-user keys, plan-aware limits, and clean customer onboarding.',
  },
]

const stats = [
  { label: 'Move Validation', value: 'Legal-by-Engine' },
  { label: 'Game Modes', value: 'PvP + PvE' },
  { label: 'Timing', value: 'Increment Clocks' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#2563eb40,transparent_35%),radial-gradient(circle_at_85%_15%,#7c3aed33,transparent_35%),radial-gradient(circle_at_50%_100%,#0ea5e922,transparent_45%)]">
      <Nav />

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-24">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
          <p className="mb-4 inline-flex items-center rounded-full border border-border bg-muted/70 px-3 py-1 text-xs text-muted-foreground">
            <Rocket className="mr-2 h-3.5 w-3.5" />
            Chess API for SaaS Builders
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            The backend to
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"> launch your chess product</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Skip backend complexity. Start games, validate moves, run clocks, and ship multiplayer or AI chess apps on top of a production-ready API.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard"><Button size="lg">Start Building</Button></Link>
            <Link href="/docs"><Button size="lg" variant="outline">View API Docs</Button></Link>
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
              <Crown className="mr-2 h-5 w-5" />
              What your customers can build
            </h2>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              {[
                'Online chess trainers with move-by-move progression',
                'Competitive game apps with rapid matchmaking and clocks',
                'AI sparring tools for opening prep and practice sessions',
                'Chess features inside existing apps without writing backend logic',
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
