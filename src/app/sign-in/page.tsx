import { SignInForm } from '@/components/auth/SignInForm'
import { Navbar } from '@/components/homepage/Navbar'

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl = '/dashboard', registered } = await searchParams

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <SignInForm callbackUrl={callbackUrl} registered={registered === 'true'} />
      </div>
    </>
  )
}
