import { eq } from 'drizzle-orm'
import { auth } from '#/lib/auth'
import { db } from '#/server/db'
import { user } from '#/server/db/auth-schema'

let started: Promise<void> | null = null

/**
 * Idempotently ensure an admin account exists, from ADMIN_EMAIL/ADMIN_PASSWORD.
 * Runs at most once per server process; a no-op if an admin already exists or
 * the env vars are unset.
 */
export function ensureAdmin(): Promise<void> {
  started ??= seedAdmin()
  return started
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return

  const admins = db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, 'admin'))
    .limit(1)
    .all()
  if (admins.length > 0) return

  const existing = db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)
    .all()
  if (existing.length === 0) {
    await auth.api.signUpEmail({
      body: { email, password, name: 'Administrator' },
    })
  }
  db.update(user).set({ role: 'admin' }).where(eq(user.email, email)).run()
}
