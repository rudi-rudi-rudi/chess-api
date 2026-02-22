import { Nav } from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'

const endpoints = [
  'POST /auth/google',
  'GET /me',
  'GET /me/api-keys',
  'POST /me/api-keys',
  'DELETE /me/api-keys/:id',
  'POST /games',
  'GET /games/:id',
  'DELETE /games/:id',
  'GET /games/:id/moves',
  'POST /games/:id/moves',
  'POST /games/:id/ai-move',
  'POST /games/:id/resign',
]

export default function DocsPage() {
  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="mt-2 text-muted-foreground">NestJS modular API with Google auth, API keys, and timed chess games.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="mb-2 text-lg font-semibold">Quick Start</h2>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{`1) POST /auth/google with idToken\n2) Use Bearer token to create API key\n3) Call chess routes with x-api-key`}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="mb-2 text-lg font-semibold">Create game body</h2>
              <pre className="text-sm text-muted-foreground">{`{\n  "mode": "pve",\n  "aiColor": "b",\n  "timeControl": {"initialSeconds":300,"incrementSeconds":2}\n}`}</pre>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardContent>
            <h2 className="mb-3 text-lg font-semibold">Endpoints</h2>
            <ul className="space-y-2 text-sm">
              {endpoints.map((e) => (
                <li key={e} className="rounded-md border border-border px-3 py-2">{e}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
