"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn } from "./FadeIn";

const FREE_FEATURES = [
  "Up to 50 items",
  "3 collections",
  "Full-text search",
  "Image uploads",
  "Dark mode",
  "GitHub OAuth",
];

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "File uploads",
  "Custom item types",
  "AI auto-tagging",
  "AI summaries & explanations",
  "Export (JSON / ZIP)",
  "Priority support",
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <h2 className="mb-4 text-center text-4xl font-extrabold tracking-tight">
            Simple, Developer-Friendly{" "}
            <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-slate-300 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
        </FadeIn>
        <FadeIn>
          <p className="mx-auto mb-14 max-w-xl text-center text-lg text-muted-foreground">
            Start free. Upgrade when you need AI superpowers.
          </p>
        </FadeIn>

        {/* Toggle */}
        <FadeIn>
          <div className="mb-12 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative h-[26px] w-12 rounded-full transition-colors ${
                yearly ? "bg-blue-500" : "bg-white/10"
              }`}
              aria-label="Toggle billing period"
            >
              <span
                className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white transition-transform ${
                  yearly ? "translate-x-[22px]" : ""
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly{" "}
              <span className="ml-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-500">
                Save 25%
              </span>
            </span>
          </div>
        </FadeIn>

        {/* Cards */}
        <div className="mx-auto grid max-w-[800px] gap-6 md:grid-cols-2">
          <FadeIn>
            <div className="rounded-xl border border-white/10 bg-[#16161f] p-8 md:p-10">
              <h3 className="mb-4 text-xl font-bold">Free</h3>
              <div className="mb-8">
                <span className="text-5xl font-extrabold tracking-tight">$0</span>
                <span className="ml-1 text-muted-foreground">forever</span>
              </div>
              <ul className="mb-8 flex flex-col gap-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="relative pl-6 text-sm text-muted-foreground">
                    <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-white/20" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Get Started
              </Link>
            </div>
          </FadeIn>

          <FadeIn>
            <div className="relative rounded-xl border border-blue-500 bg-gradient-to-b from-blue-500/5 to-[#16161f] p-8 md:p-10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-500 px-4 py-1 text-xs font-bold text-white">
                Most Popular
              </span>
              <h3 className="mb-4 text-xl font-bold">Pro</h3>
              <div className="mb-8">
                <span className="text-5xl font-extrabold tracking-tight">
                  {yearly ? "$6" : "$8"}
                </span>
                <span className="ml-1 text-muted-foreground">
                  {yearly ? "/mo (billed $72/yr)" : "/month"}
                </span>
              </div>
              <ul className="mb-8 flex flex-col gap-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="relative pl-6 text-sm text-muted-foreground">
                    <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={buttonVariants({ className: "w-full bg-gradient-to-r from-blue-600 via-blue-400 to-slate-300 text-white hover:opacity-90" })}
              >
                Upgrade to Pro
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
