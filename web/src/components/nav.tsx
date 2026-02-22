import Link from 'next/link'

const links = [
  { href: '/', label: 'Home' },
  { href: '/docs', label: 'Docs' },
  { href: '/login', label: 'Login' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function Nav() {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">Chess API</Link>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
