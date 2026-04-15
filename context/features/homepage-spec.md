# Homepage

## Overview

Convert the standalone HTML mockup (`prototypes/homepage/`) into a real Next.js page at `/` (root route). Replicate the same sections, layout, and animations using Tailwind CSS, shadcn/ui, and lucide-react icons. Server components by default; client components only where interactivity is required.

## Reference

- Prototype: `prototypes/homepage/index.html`, `styles.css`, `script.js`
- Mockup spec: `context/features/homepage-mockup-spec.md`

## Route

`src/app/page.tsx` — public, no auth required.

## Sections & Components

### 1. Navbar — `src/components/homepage/Navbar.tsx` (client)

- Fixed top, blurred backdrop, border appears on scroll (`scrolled` state via `useEffect`)
- Logo (Package icon from lucide-react + "DevStash") links to `/`
- Nav links: "Features" (`#features`), "Pricing" (`#pricing`) — smooth scroll
- Actions: "Sign In" ghost button links to `/sign-in`, "Get Started" primary button links to `/register`
- Mobile: hide nav links, keep logo + actions

### 2. Hero — `src/app/page.tsx` (server) + client sub-components

- **Hero text** (server): headline with gradient text, subheadline, CTA buttons
  - "Get Started Free" links to `/register`
  - "See Features" links to `#features`
- **Hero visual** (three-part layout):
  - **ChaosIcons** — `src/components/homepage/ChaosIcons.tsx` (client): 8 floating icons animated with `requestAnimationFrame`, mouse repulsion, wall bounce. Use the same icon set from the prototype (Notion, GitHub, Slack, VS Code, Browser, Terminal, Text File, Bookmark as inline SVGs)
  - **Transform arrow**: pulsing CSS animation, rotates 90° on mobile
  - **DashboardPreview** — `src/components/homepage/DashboardPreview.tsx` (server): static mockup window with dots, topbar, sidebar nav items, 2-column grid of colored placeholder cards

### 3. Features — server

- 6-card grid (3 cols desktop, 1 col mobile)
- Cards: Code Snippets (blue), AI Prompts (amber), Commands (cyan), Instant Search (green), Files & Docs (slate), Collections (indigo)
- Each card: colored icon container, heading, description
- Use lucide-react icons: `Code`, `Sparkles`, `Terminal`, `Search`, `File`, `FolderOpen`
- Fade-in on scroll via `FadeIn` client wrapper

### 4. AI Section — server + `FadeIn`

- Two-column layout (stack on mobile)
- Left: "Pro Feature" badge, heading with gradient text, description, checklist with green check icons
- Right: code editor mockup with window dots, filename tab, syntax-highlighted code block (static HTML), "AI Generated Tags" row with colored tag pills

### 5. Pricing — `src/components/homepage/PricingSection.tsx` (client)

- Monthly/yearly toggle (client state)
- Two-card grid (1 col mobile): Free and Pro
- Free: $0 forever, 6 feature bullets, "Get Started" outline button links to `/register`
- Pro: $8/mo or $6/mo billed yearly, 8 feature bullets, "Most Popular" badge, "Upgrade to Pro" primary button links to `/register`
- Use shadcn Button for CTAs

### 6. CTA — server + `FadeIn`

- Centered heading with gradient text, subheadline, "Get Started Free" button links to `/register`

### 7. Footer — server

- 4-column grid (2 cols tablet, 1 col mobile): Brand, Product, Resources, Company
- Brand: logo + tagline
- Product links: Features (`#features`), Pricing (`#pricing`), Changelog (`#`), Roadmap (`#`)
- Resources/Company links: placeholder `#` hrefs
- Copyright with dynamic year

### 8. FadeIn wrapper — `src/components/homepage/FadeIn.tsx` (client)

- Reusable client component using `IntersectionObserver`
- Wraps children, applies opacity/translateY transition when visible
- `threshold: 0.1`, unobserves after first trigger

## Styling

- All Tailwind — no custom CSS file (move needed custom values into `globals.css` `@theme` if not already there)
- Gradient text: `bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 bg-clip-text text-transparent`
- Item type accent colors already defined in `globals.css` `@theme` — reuse them
- Responsive: use Tailwind breakpoints (`md:`, `lg:`) matching prototype media queries
- `scroll-behavior: smooth` on `<html>`

## Links

| Button / Link | Destination |
|---|---|
| Logo | `/` |
| Sign In | `/sign-in` |
| Get Started / Get Started Free | `/register` |
| Upgrade to Pro | `/register` |
| Features nav link | `#features` |
| Pricing nav link | `#pricing` |
| Footer section links | `#features`, `#pricing`, or `#` placeholders |

## Notes

- No data fetching needed — all content is static/hardcoded
- No unit tests needed (UI-only, no server actions or lib code)
- Keep component files small — extract repeated patterns (gradient text, section container) into simple utility components or Tailwind classes
