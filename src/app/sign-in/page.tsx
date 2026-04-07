import { SignInForm } from '@/components/auth/SignInForm'

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl = '/dashboard', registered } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <SignInForm callbackUrl={callbackUrl} registered={registered === 'true'} />
    </div>
  )
}
