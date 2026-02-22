import { Nav } from '@/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  return (
    <main>
      <Nav />
      <div className="mx-auto flex max-w-6xl justify-center px-6 py-16">
        <Card className="w-full max-w-lg">
          <CardContent>
            <h1 className="text-2xl font-bold">Login</h1>
            <p className="mt-2 text-sm text-muted-foreground">Google-only auth. This is UI scaffold for your OAuth flow.</p>

            <div className="mt-6 space-y-3">
              <Button className="w-full">Continue with Google</Button>
              <p className="text-xs text-muted-foreground">On production, button should open Google Sign-In and POST idToken to /auth/google.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
