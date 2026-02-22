'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { clearToken, getToken } from '@/lib/auth-store'
import { createApiKey, getPlan, listApiKeys, me, revokeApiKey } from '@/lib/api'

type ApiKey = { id: string; name: string; keyPrefix: string; active: boolean; lastUsedAt?: string | null }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [plan, setPlan] = useState<{ tier: string; status: string } | null>(null)
  const [name, setName] = useState('default')
  const [loading, setLoading] = useState(true)
  const token = useMemo(() => getToken(), [])

  async function refresh() {
    if (!token) return
    const [u, k, p] = await Promise.all([me(token), listApiKeys(token), getPlan(token)])
    setUser(u.user)
    setKeys(k.items)
    setPlan(p.plan)
  }

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    refresh()
      .catch(() => {
        clearToken()
        router.push('/login')
      })
      .finally(() => setLoading(false))
  }, [router, token])

  if (loading) {
    return (
      <main>
        <Nav />
        <div className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading dashboard...</div>
      </main>
    )
  }

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">API Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Signed in as <span className="text-foreground">{user?.email}</span>
          {plan && (
            <span className="ml-3 rounded border border-border px-2 py-0.5 text-xs uppercase tracking-wide">
              {plan.tier} · {plan.status}
            </span>
          )}
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">API Keys</h2>
                <Button variant="outline" onClick={() => { clearToken(); router.push('/login') }}>Sign out</Button>
              </div>

              <div className="mb-4 flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Key name"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
                />
                <Button
                  onClick={async () => {
                    if (!token) return
                    const out = await createApiKey(token, name)
                    setNewKey(out.apiKey)
                    await refresh()
                  }}
                >
                  Create key
                </Button>
              </div>

              {newKey && (
                <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
                  <p className="font-medium">New key (shown once):</p>
                  <code className="break-all">{newKey}</code>
                </div>
              )}

              <div className="space-y-2">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{k.name}</p>
                      <p className="text-xs text-muted-foreground">{k.keyPrefix}•••••••</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!token) return
                        await revokeApiKey(token, k.id)
                        await refresh()
                      }}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
                {!keys.length && <p className="text-sm text-muted-foreground">No API keys yet.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Create key and call <code>/games</code></li>
                <li>• Set default pve mode in your client</li>
                <li>• Track key usage and rotate monthly</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
