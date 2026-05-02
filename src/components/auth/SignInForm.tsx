'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import { signInWithGitHub } from '@/actions/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { GitHubIcon } from '@/components/auth/GitHubIcon'

interface SignInFormProps {
  callbackUrl: string
  registered?: boolean
}

export function SignInForm({ callbackUrl, registered }: SignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toastShown = useRef(false)
  useEffect(() => {
    if (registered && !toastShown.current) {
      toastShown.current = true
      toast.success('Account created! You can now sign in.')
    }
  }, [registered])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      if (result.code === 'RATE_LIMITED') {
        setError('Too many sign-in attempts. Please try again later.')
      } else if (result.code === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before signing in. Check your inbox.')
      } else {
        setError('Invalid email or password')
      }
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <AuthCard title="Sign in to DevStash" description="Enter your credentials to continue">
        <form action={signInWithGitHub}>
          <Button
            variant="outline"
            className="w-full gap-2"
            type="submit"
          >
            <GitHubIcon className="h-4 w-4" />
            Sign in with GitHub
          </Button>
        </form>

        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-foreground underline underline-offset-4 hover:text-primary">
            Register
          </Link>
        </p>
    </AuthCard>
  )
}
