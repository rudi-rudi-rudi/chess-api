import { Nav } from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">API Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Manage API keys, usage settings, rate limits, and game defaults.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">API Keys</h2>
              <p className="mt-1 text-sm text-muted-foreground">Create, rotate, and revoke keys.</p>
              <div className="mt-4 flex gap-2">
                <Button>Create key</Button>
                <Button variant="outline">Revoke selected</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">Security Settings</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Key expiration policy</li>
                <li>• IP allowlist</li>
                <li>• Webhook signing secret</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">Usage & Limits</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Request volume</li>
                <li>• Error rate</li>
                <li>• Per-key throttling</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">Chess Defaults</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Default mode (pvp/pve)</li>
                <li>• Default time control</li>
                <li>• AI difficulty profile</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
