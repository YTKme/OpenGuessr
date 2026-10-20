import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'

/** Browser-side Better Auth client (same-origin by default). */
export const authClient = createAuthClient({
  plugins: [adminClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
