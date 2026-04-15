"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrolled || mobileOpen
          ? "bg-[#0a0a0f]/95 border-b border-white/10"
          : "bg-[#0a0a0f]/60 border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-foreground">
          <Package className="h-7 w-7" />
          DevStash
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className={`${buttonVariants({ variant: "ghost" })} hidden sm:inline-flex`}>
            Sign In
          </Link>
          <Link
            href="/register"
            className={`${buttonVariants({ className: "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 text-white hover:opacity-90" })} hidden sm:inline-flex`}
          >
            Get Started
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0a0a0f]/95 px-6 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </a>
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <Link
                href="/sign-in"
                className={buttonVariants({ variant: "ghost", className: "justify-center" })}
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ className: "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 text-white hover:opacity-90 justify-center" })}
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
