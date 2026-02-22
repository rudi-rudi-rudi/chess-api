'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { googleLogin } from '@/lib/api'
import { setToken } from '@/lib/auth-store'

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (!window.google) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential: string }) => {
          try {
            setLoading(true)
            const session = await googleLogin(resp.credential)
            setToken(session.accessToken)
            router.push('/dashboard')
          } catch (e: any) {
            setError(e.message || 'Login failed')
          } finally {
            setLoading(false)
          }
        },
      })

      window.google.accounts.id.renderButton(document.getElementById('google-btn'), {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
      })
    }
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [router])

  return (
    <main>
      <Nav />
      <div className="mx-auto flex max-w-6xl justify-center px-6 py-16">
        <Card className="w-full max-w-lg">
          <CardContent>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">Google auth for dashboard and API key management.</p>

            <div className="mt-6 space-y-3">
              <div id="google-btn" className="min-h-[42px]" />
              <Button className="w-full" variant="outline" onClick={() => router.push('/docs')}>Read API docs first</Button>
              {loading && <p className="text-sm text-muted-foreground">Signing you in...</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
