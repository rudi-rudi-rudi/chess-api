import { Shield, Clock3, KeyRound, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Shield,
    title: 'Google Auth + API Keys',
    text: 'Secure user onboarding with social auth, then generate and rotate API keys for all chess routes.',
  },
  {
    icon: Clock3,
    title: 'Timed Games',
    text: 'Built-in chess clocks with increment and timeout handling for serious game play.',
  },
  {
    icon: Zap,
    title: 'Fast NestJS Backend',
    text: 'Modular NestJS architecture with clean controllers, services, guards, and DTO validation.',
  },
  {
    icon: KeyRound,
    title: 'API Business Ready',
    text: 'Multi-user model, key-level auth, and clean endpoint contracts for product use.',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="mb-12 text-center">
        <p className="mb-3 inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          Chess API • NestJS + Postgres + Drizzle
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Production Chess API</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Authenticated chess infrastructure for real products: users, API keys, timed games, PvP/PvE, and modular architecture.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg">Get API Keys</Button>
          <Button size="lg" variant="outline">Read API Docs</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent>
              <div className="mb-3 inline-flex rounded-md border border-border p-2">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
