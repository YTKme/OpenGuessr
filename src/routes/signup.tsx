import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { signUp } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/signup')({ component: SignupRoute })

function SignupRoute() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signUp.email({
      name: name.trim() || email.split('@')[0],
      email,
      password,
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error.message ?? 'Could not create your account.')
      return
    }
    await router.invalidate()
    await router.navigate({ to: '/play' })
  }

  return (
    <main className="page-wrap px-4 py-16">
      <div className="island-shell mx-auto max-w-md rounded-3xl p-8">
        <p className="island-kicker mb-2">Join in</p>
        <h1 className="display-title mb-6 text-3xl font-bold text-[var(--sea-ink)]">
          Create an account
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional"
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating…' : 'Sign up'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--sea-ink-soft)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
