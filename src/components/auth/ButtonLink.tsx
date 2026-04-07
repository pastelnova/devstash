"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

interface ButtonLinkProps extends VariantProps<typeof buttonVariants> {
  href: string
  className?: string
  children: React.ReactNode
}

export function ButtonLink({ href, variant, size, className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonVariants({ variant, size, className })}>
      {children}
    </Link>
  )
}
