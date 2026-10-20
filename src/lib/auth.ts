import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
// Relative import (not the `#/` alias) so the Better Auth CLI can load this file.
import { db } from '../server/db'

/**
 * Server-side Better Auth instance. Uses the shared Drizzle/SQLite database, the
 * Admin plugin (admin/user roles), and the TanStack Start cookie handler.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  plugins: [admin(), tanstackStartCookies()],
})
