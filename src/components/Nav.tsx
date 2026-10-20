import { Link, useRouter } from '@tanstack/react-router'
import { Compass, LogOut } from 'lucide-react'
import { authClient, signOut } from '#/lib/auth-client'
import ThemeToggle from './ThemeToggle'
import { Button } from './ui/button'

export default function Nav() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user
  const isAdmin = user?.role === 'admin'

  const links = [
    { to: '/', label: 'Home', exact: true, show: true },
    { to: '/play', label: 'Play', exact: false, show: true },
    { to: '/maps', label: 'Maps', exact: false, show: true },
    { to: '/upload', label: 'Upload', exact: false, show: isAdmin },
  ] as const

  async function handleLogout() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/' })
  }

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
          {links
            .filter((link) => link.show)
            .map((link) => (
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
          {user ? (
            <>
              <span className="hidden text-sm text-[var(--sea-ink-soft)] sm:inline">
                {user.email}
                {isAdmin && (
                  <span className="ml-1 rounded-full bg-[rgba(79,184,178,0.16)] px-2 py-0.5 text-xs font-semibold text-[var(--lagoon-deep)]">
                    admin
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.16)] px-3 py-1.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline"
              >
                Sign up
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
