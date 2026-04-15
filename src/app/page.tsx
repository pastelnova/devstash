import Link from "next/link";
import {
  Code,
  Sparkles,
  Terminal,
  Search,
  File,
  FolderOpen,
  Check,
  Package,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Navbar } from "@/components/homepage/Navbar";
import { ChaosIcons } from "@/components/homepage/ChaosIcons";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { PricingSection } from "@/components/homepage/PricingSection";
import { FadeIn } from "@/components/homepage/FadeIn";

const FEATURES = [
  {
    icon: Code,
    title: "Code Snippets",
    description: "Save reusable code blocks with syntax highlighting for any language. Copy with one click.",
    color: "#3b82f6",
  },
  {
    icon: Sparkles,
    title: "AI Prompts",
    description: "Store and organize your best AI prompts. Templates for ChatGPT, Claude, and more.",
    color: "#f59e0b",
  },
  {
    icon: Terminal,
    title: "Commands",
    description: "Never forget a CLI command again. Organize terminal commands with descriptions and tags.",
    color: "#06b6d4",
  },
  {
    icon: Search,
    title: "Instant Search",
    description: "Full-text search across all your items. Find anything in milliseconds with Cmd+K.",
    color: "#22c55e",
  },
  {
    icon: File,
    title: "Files & Docs",
    description: "Upload configs, templates, and reference docs. Keep everything with your code knowledge.",
    color: "#64748b",
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description: "Group related items into collections. React Patterns, DevOps Runbooks, AI Workflows, and more.",
    color: "#6366f1",
  },
];

const AI_CHECKLIST = [
  "Auto-tag items based on content",
  "One-liner AI summaries",
  "Plain-English code explanations",
  "Prompt optimization & refinement",
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="mb-16 text-center">
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tighter sm:text-5xl lg:text-6xl">
            Stop Losing Your{" "}
            <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mb-9 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Your snippets, prompts, commands, and notes are scattered across dozens of apps.
            DevStash brings them into one searchable, AI-enhanced hub.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className={buttonVariants({ size: "lg", className: "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 text-white hover:opacity-90" })}
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              See Features
            </a>
          </div>
        </div>

        {/* Hero visual — hidden on mobile, full layout on md+ */}
        <div className="hidden w-full max-w-[960px] flex-col items-center gap-6 md:flex md:flex-row md:gap-8">
          {/* Chaos side */}
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-center text-xs font-medium tracking-wide text-white/40">
              Your knowledge today...
            </p>
            <ChaosIcons />
          </div>

          {/* Arrow */}
          <div className="flex shrink-0 items-center justify-center text-white/40 md:w-16">
            <ArrowRight className="h-12 w-12 animate-pulse" />
          </div>

          {/* Dashboard side */}
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-center text-xs font-medium tracking-wide text-white/40">
              ...with DevStash
            </p>
            <DashboardPreview />
          </div>
        </div>

        {/* Mobile hero — just the dashboard preview */}
        <div className="w-full max-w-sm md:hidden">
          <DashboardPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <FadeIn>
            <h2 className="mb-4 text-center text-4xl font-extrabold tracking-tight">
              Everything You Need,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 bg-clip-text text-transparent">
                One Place
              </span>
            </h2>
          </FadeIn>
          <FadeIn>
            <p className="mx-auto mb-14 max-w-xl text-center text-lg text-muted-foreground">
              Stop context-switching between apps. DevStash handles all your developer knowledge.
            </p>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FadeIn key={feature.title}>
                <div
                  className="group rounded-xl border border-white/10 bg-[#16161f] p-8 transition-all duration-300 hover:-translate-y-1"
                  style={{ "--accent": feature.color } as React.CSSProperties}
                >
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${feature.color} 15%, transparent)`,
                      color: feature.color,
                    }}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="bg-[#12121a] py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <FadeIn>
              <div>
                <span className="mb-5 inline-block rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">
                  Pro Feature
                </span>
                <h2 className="mb-4 text-4xl font-extrabold tracking-tight md:text-left">
                  AI-Powered{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 bg-clip-text text-transparent">
                    Superpowers
                  </span>
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  Let AI handle the boring stuff so you can focus on building.
                </p>
                <ul className="flex flex-col gap-4">
                  {AI_CHECKLIST.map((item) => (
                    <li key={item} className="flex items-center gap-3 font-medium">
                      <Check className="h-5 w-5 text-green-500" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#16161f]">
                {/* Editor header */}
                <div className="flex items-center gap-3 border-b border-white/10 bg-[#12121a] px-3.5 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">useDebounce.ts</span>
                </div>

                {/* Code body */}
                <div className="overflow-x-auto p-5 font-mono text-xs leading-7 sm:text-sm">
                  <pre>
                    <code>
                      <span className="text-purple-400">export function</span>{" "}
                      <span className="text-blue-400">useDebounce</span>
                      {"<"}
                      <span className="text-yellow-400">T</span>
                      {">("}
                      {"\n  "}
                      <span className="text-red-400">value</span>
                      {": "}
                      <span className="text-yellow-400">T</span>
                      {","}
                      {"\n  "}
                      <span className="text-red-400">delay</span>
                      {": "}
                      <span className="text-yellow-400">number</span>
                      {"\n): "}
                      <span className="text-yellow-400">T</span>
                      {" {"}
                      {"\n  "}
                      <span className="text-purple-400">const</span>
                      {" [debounced, setDebounced] ="}
                      {"\n    "}
                      <span className="text-blue-400">useState</span>
                      {"(value);"}
                      {"\n\n  "}
                      <span className="text-blue-400">useEffect</span>
                      {"(() => {"}
                      {"\n    "}
                      <span className="text-purple-400">const</span>
                      {" timer = "}
                      <span className="text-blue-400">setTimeout</span>
                      {"("}
                      {"\n      () => "}
                      <span className="text-blue-400">setDebounced</span>
                      {"(value),"}
                      {"\n      delay"}
                      {"\n    );"}
                      {"\n    "}
                      <span className="text-purple-400">return</span>
                      {" () => "}
                      <span className="text-blue-400">clearTimeout</span>
                      {"(timer);"}
                      {"\n  }, [value, delay]);"}
                      {"\n\n  "}
                      <span className="text-purple-400">return</span>
                      {" debounced;"}
                      {"\n}"}
                    </code>
                  </pre>
                </div>

                {/* AI tags */}
                <div className="border-t border-white/10 px-5 py-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-amber-500">
                    <Sparkles className="h-4 w-4" />
                    AI Generated Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "react", color: "#3b82f6" },
                      { name: "hooks", color: "#06b6d4" },
                      { name: "typescript", color: "#f59e0b" },
                      { name: "debounce", color: "#22c55e" },
                      { name: "performance", color: "#6366f1" },
                    ].map((tag) => (
                      <span
                        key={tag.name}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${tag.color} 15%, transparent)`,
                          color: tag.color,
                          border: `1px solid color-mix(in srgb, ${tag.color} 25%, transparent)`,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="bg-[#12121a] py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <FadeIn>
            <div className="mx-auto max-w-xl text-center">
              <h2 className="mb-4 text-4xl font-extrabold tracking-tight">
                Ready to Organize Your{" "}
                <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 bg-clip-text text-transparent">
                  Knowledge
                </span>
                ?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join developers who stopped losing their code snippets, prompts, and commands.
              </p>
              <Link
                href="/register"
                className={buttonVariants({ size: "lg", className: "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 text-white hover:opacity-90" })}
              >
                Get Started Free
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-20 pb-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="mb-3 flex items-center gap-2.5 text-xl font-bold">
                <Package className="h-6 w-6" />
                DevStash
              </Link>
              <p className="text-sm text-muted-foreground">Store Smarter. Build Faster.</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">
                Product
              </h4>
              <div className="flex flex-col gap-2">
                <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
                <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Changelog</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Roadmap</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">
                Resources
              </h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Documentation</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">API Reference</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Blog</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Community</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">
                Company
              </h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">About</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Privacy</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Terms</a>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Contact</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} DevStash. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
