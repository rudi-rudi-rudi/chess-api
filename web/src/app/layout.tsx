import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Chess API',
  description: 'Production-ready chess API with auth, API keys, and timed games',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
