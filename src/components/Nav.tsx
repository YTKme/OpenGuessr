import { Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/play', label: 'Play', exact: false },
  { to: '/maps', label: 'Maps', exact: false },
  { to: '/upload', label: 'Upload', exact: false },
] as const

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-5 gap-y-2 py-3 sm:py-4">
        <Link
          to="/"
          className="m-0 inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
        >
          <Compass className="h-4 w-4 text-[var(--lagoon-deep)]" aria-hidden />
          OpenGuessr
        </Link>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
              activeOptions={{ exact: link.exact }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
