import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ButtonLink } from "@/components/auth/ButtonLink"
import { verifyToken } from "@/lib/auth/verification"

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invalid Link</CardTitle>
            <CardDescription>No verification token provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLink href="/register" className="w-full">
              Register again
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = await verifyToken(token)

  if (result.error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-xl">Verification Failed</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLink href="/register" className="w-full">
              Register again
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500 text-lg">
            &#10003;
          </div>
          <CardTitle className="text-xl">Email Verified!</CardTitle>
          <CardDescription>Your account is now active. You can sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <ButtonLink href="/sign-in" className="w-full">
            Sign in
          </ButtonLink>
        </CardContent>
      </Card>
    </div>
  )
}
