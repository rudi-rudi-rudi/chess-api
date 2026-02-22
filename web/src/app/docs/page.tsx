import { Nav } from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const endpoints = [
  { method: 'POST', path: '/games', desc: 'Create a game (pvp/pve, optional clock).' },
  { method: 'GET', path: '/games/:id', desc: 'Fetch current game state.' },
  { method: 'DELETE', path: '/games/:id', desc: 'Delete a game.' },
  { method: 'GET', path: '/games/:id/moves?from=e2', desc: 'List legal moves (optionally for one square).' },
  { method: 'POST', path: '/games/:id/moves', desc: 'Submit a SAN move or from/to move.' },
  { method: 'POST', path: '/games/:id/ai-move', desc: 'Ask engine to make the next move (pve).' },
  { method: 'POST', path: '/games/:id/resign', desc: 'Resign as white or black.' },
]

const examples = {
  create: `curl -X POST "$API_URL/games" \
  -H "x-api-key: $API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "mode": "pve",
    "aiColor": "b",
    "timeControl": {"initialSeconds": 300, "incrementSeconds": 2}
  }'`,
  move: `curl -X POST "$API_URL/games/<gameId>/moves" \
  -H "x-api-key: $API_KEY" \
  -H "content-type: application/json" \
  -d '{"from":"e2","to":"e4"}'`,
  ai: `curl -X POST "$API_URL/games/<gameId>/ai-move" \
  -H "x-api-key: $API_KEY"`,
}

export default function DocsPage() {
  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">API Key Routes</h1>
            <p className="mt-2 text-muted-foreground">Only routes that require <code className="rounded bg-muted px-1 py-0.5">x-api-key</code>.</p>
          </div>
          <Button>Copy Base URL</Button>
        </div>

        <Card>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold">Authentication</h2>
            <p className="text-sm text-muted-foreground">All endpoints below require header:</p>
            <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-sm">x-api-key: your_api_key_here</pre>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <h2 className="mb-3 text-lg font-semibold">Endpoints</h2>
            <div className="space-y-2">
              {endpoints.map((e) => (
                <div key={e.method + e.path} className="rounded-md border border-border px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 font-medium text-blue-300">{e.method}</span>
                    <code>{e.path}</code>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <h3 className="mb-2 font-semibold">Create Game</h3>
              <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{examples.create}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="mb-2 font-semibold">Play Move</h3>
              <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{examples.move}</pre>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardContent>
            <h3 className="mb-2 font-semibold">Engine Move</h3>
            <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{examples.ai}</pre>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
