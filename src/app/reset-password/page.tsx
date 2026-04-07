import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ButtonLink } from "@/components/auth/ButtonLink"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invalid Link</CardTitle>
            <CardDescription>No reset token provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLink href="/forgot-password" className="w-full">
              Request a new link
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ResetPasswordForm token={token} />
    </div>
  )
}
