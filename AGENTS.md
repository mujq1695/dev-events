# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Dev Events is a Next.js 16 application that serves as a hub for developer events (hackathons, meetups, conferences). It uses the App Router, TypeScript, Tailwind CSS v4, and PostHog for analytics.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

### Analytics Integration
PostHog analytics is integrated in two parts:
- `instrumentation-client.ts` - Client-side PostHog initialization (runs when `typeof window !== 'undefined'`)
- `app/providers.tsx` - React context provider with custom pageview tracking via `PostHogPageView` component

The `PostHogProvider` wraps the entire app in `layout.tsx`. Pageviews are captured manually (`capture_pageview: false` in config) using pathname/searchParams hooks.

### Styling System
- Tailwind CSS v4 with custom CSS utilities defined in `app/globals.css`
- Custom utilities: `flex-center`, `text-gradient`, `glass`, `card-shadow`
- CSS variables for colors defined in `:root` and exposed via `@theme inline`
- Fonts: Schibsted Grotesk (headings) and Martian Mono (monospace)
- shadcn/ui configured with "new-york" style; add components via `npx shadcn add <component>`

### Key Components
- `LightRays.tsx` - WebGL background effect using OGL library with configurable ray properties
- `EventCard.tsx` - Event display card linking to `/events/[slug]`
- Event data is statically defined in `lib/constants.tsx` (interface: `EventItem`)

### Path Aliases
Use `@/*` for imports from project root (e.g., `@/components/EventCard`, `@/lib/utils`).

## Environment Variables

Required variables (prefix with `NEXT_PUBLIC_` for client exposure):
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL
- `MONGODB_URI` - MongoDB connection string (server-side only)
