export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

export type Session = {
  accessToken: string
  expiresAt: string
  user: { id: string; email: string; name: string; picture?: string | null }
}

export async function googleLogin(idToken: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error(`Login failed (${res.status})`)
  return res.json()
}

export async function me(accessToken: string) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`)
  return res.json()
}

export async function listApiKeys(accessToken: string) {
  const res = await fetch(`${API_BASE}/me/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Failed to load API keys (${res.status})`)
  return res.json() as Promise<{ items: Array<{ id: string; name: string; keyPrefix: string; active: boolean; lastUsedAt?: string | null }> }>
}

export async function createApiKey(accessToken: string, name: string) {
  const res = await fetch(`${API_BASE}/me/api-keys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Failed to create API key (${res.status})`)
  return res.json() as Promise<{ apiKey: string }>
}

export async function revokeApiKey(accessToken: string, id: string) {
  const res = await fetch(`${API_BASE}/me/api-keys/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Failed to revoke API key (${res.status})`)
}
