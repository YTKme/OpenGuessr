import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { ensureAdmin } from '#/server/ensure-admin'

/** Read the current session (user + session) or null. Safe to call anywhere. */
export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    await ensureAdmin()
    return auth.api.getSession({ headers: getRequestHeaders() })
  },
)

/** Route `beforeLoad` guard: require a signed-in user, else redirect to /login. */
export async function requireUser() {
  const session = await getSession()
  if (!session) throw redirect({ to: '/login' })
  return session
}

/** Route `beforeLoad` guard: require an admin, else redirect home. */
export async function requireAdmin() {
  const session = await requireUser()
  if (session.user.role !== 'admin') throw redirect({ to: '/' })
  return session
}

/** Server-function middleware: require any signed-in user. */
export const userMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error('You must be signed in.')
    return next({ context: { user: session.user } })
  },
)

/** Server-function middleware: require an admin. */
export const adminMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error('You must be signed in.')
    if (session.user.role !== 'admin') throw new Error('Admins only.')
    return next({ context: { user: session.user } })
  },
)
