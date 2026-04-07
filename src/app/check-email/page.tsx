"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary text-lg">
            &#9993;
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to your email address. Click it to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            The link expires in 24 hours. If you don&apos;t see the email, check your spam folder.
          </p>
          <Link href="/sign-in" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
