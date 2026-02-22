'use client'

import { Nav } from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { API_BASE } from '@/lib/api'

const endpoints = [
  { method: 'POST', path: '/games', desc: 'Create a game (pvp/pve, optional clock).' },
  { method: 'GET', path: '/games/:id', desc: 'Fetch current game state.' },
  { method: 'DELETE', path: '/games/:id', desc: 'Delete a game.' },
  { method: 'GET', path: '/games/:id/moves?from=e2', desc: 'List legal moves.' },
  { method: 'POST', path: '/games/:id/moves', desc: 'Submit move as SAN or from/to.' },
  { method: 'POST', path: '/games/:id/ai-move', desc: 'Engine move for pve games.' },
  { method: 'POST', path: '/games/:id/resign', desc: 'Resign as white/black.' },
]

function CopyButton({ value }: { value: string }) {
  return (
    <Button variant="outline" onClick={() => navigator.clipboard.writeText(value)}>
      Copy
    </Button>
  )
}

export default function DocsPage() {
  const create = `curl -X POST "${API_BASE}/games" \\
  -H "x-api-key: $API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"mode":"pve","aiColor":"b","timeControl":{"initialSeconds":300,"incrementSeconds":2}}'`

  const move = `curl -X POST "${API_BASE}/games/<gameId>/moves" \\
  -H "x-api-key: $API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"from":"e2","to":"e4"}'`

  const ai = `curl -X POST "${API_BASE}/games/<gameId>/ai-move" \\
  -H "x-api-key: $API_KEY"`

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">API Key Routes</h1>
            <p className="mt-2 text-muted-foreground">All routes below require <code className="rounded bg-muted px-1 py-0.5">x-api-key</code>.</p>
          </div>
          <CopyButton value={API_BASE} />
        </div>

        <Card>
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
              <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Create Game</h3><CopyButton value={create} /></div>
              <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{create}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Play Move</h3><CopyButton value={move} /></div>
              <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{move}</pre>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardContent>
            <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Engine Move</h3><CopyButton value={ai} /></div>
            <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{ai}</pre>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <h3 className="mb-2 font-semibold">JavaScript SDK-style snippet</h3>
            <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{`const API_BASE = '${API_BASE}'\n\nasync function chess(path, options = {}) {\n  const res = await fetch(API_BASE + path, {\n    ...options,\n    headers: {\n      'x-api-key': process.env.CHESS_API_KEY,\n      'content-type': 'application/json',\n      ...(options.headers || {}),\n    },\n  })\n  if (!res.ok) throw new Error(await res.text())\n  return res.json()\n}\n\nconst game = await chess('/games', {\n  method: 'POST',\n  body: JSON.stringify({ mode: 'pve', aiColor: 'b' }),\n})\nawait chess('/games/' + game.id + '/moves', {\n  method: 'POST',\n  body: JSON.stringify({ from: 'e2', to: 'e4' }),\n})`}</pre>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <h3 className="mb-2 font-semibold">TypeScript SDK-style snippet</h3>
            <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">{`type CreateGameInput = {\n  mode?: 'pvp' | 'pve'\n  aiColor?: 'w' | 'b'\n  timeControl?: { initialSeconds: number; incrementSeconds?: number }\n}\n\nclass ChessApiClient {\n  constructor(private base: string, private apiKey: string) {}\n\n  private async request<T>(path: string, init?: RequestInit): Promise<T> {\n    const res = await fetch(this.base + path, {\n      ...init,\n      headers: {\n        'x-api-key': this.apiKey,\n        'content-type': 'application/json',\n        ...(init?.headers || {}),\n      },\n    })\n    if (!res.ok) throw new Error(await res.text())\n    return res.json() as Promise<T>\n  }\n\n  createGame(input: CreateGameInput) {\n    return this.request<{ id: string }>('/games', {\n      method: 'POST',\n      body: JSON.stringify(input),\n    })\n  }\n\n  move(gameId: string, from: string, to: string) {\n    return this.request('/games/' + gameId + '/moves', {\n      method: 'POST',\n      body: JSON.stringify({ from, to }),\n    })\n  }\n}`}</pre>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
