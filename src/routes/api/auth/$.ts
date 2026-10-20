import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { ensureAdmin } from '#/server/ensure-admin'

/** Mounts the Better Auth request handler at /api/auth/*. */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await ensureAdmin()
        return auth.handler(request)
      },
      POST: async ({ request }) => {
        await ensureAdmin()
        return auth.handler(request)
      },
    },
  },
})
