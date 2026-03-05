# Motivate Me

A habit-tracking PWA that gamifies self-improvement through a point-and-reward system. Earn points by completing habits, then spend them on real-world rewards you define yourself.

**Live app:** [motivateme-cyan.vercel.app](https://motivateme-cyan.vercel.app)

## What It Does

- **Define your own habits** — set point values, frequency targets, and optionally require photo proof
- **Log completions** — earn points for every habit you complete, with streak bonuses for consistency
- **Set up rewards** — create offline (physical items) or online (URL-linked) rewards with custom point costs
- **Wishlist tracking** — save rewards you're working toward with a progress bar showing how close you are
- **Monitor system** — invite a friend, partner, or parent to observe your progress and approve high-stakes redemptions
- **Profile management** — customize your display name, avatar, and gender

## Screenshots

The UI is designed to be gamified and playful — bright colors, satisfying interactions, and visible progress on every screen. Mobile-first, installable as a PWA.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Magic link (email only, no passwords) |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone the repo
git clone https://github.com/beingzy/motivate-me.git
cd motivate-me

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your Supabase project URL and anon key
```

Create a `.env` file with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the SQL migrations in your Supabase SQL Editor in order:

1. `supabase/migrations/001_initial_schema.sql` — core tables (habits, action_logs, point_ledger, rewards, notifications)
2. `supabase/migrations/002_monitors.sql` — monitor/accountability system
3. `supabase/migrations/003_profiles.sql` — user profiles and avatar storage

### Development

```bash
npm run dev        # Start dev server
npm test           # Run tests (93 tests across 16 files)
npm run build      # Production build
npm run lint       # ESLint
```

## Project Structure

```
src/
├── components/
│   ├── AuthGate.tsx          # Auth-gated route wrapper
│   └── ui/                   # Shared UI components (AppShell, BottomNav)
├── lib/
│   ├── auth.tsx              # Auth provider + magic link sign-in
│   ├── db.ts                 # Supabase CRUD operations
│   ├── store.tsx             # App state with optimistic updates
│   ├── profile.ts            # Profile & avatar management
│   ├── monitors.ts           # Monitor invite & connection logic
│   └── approvals.ts          # Action log approval/rejection
├── pages/                    # All route pages with co-located tests
├── types/                    # TypeScript interfaces
└── test/                     # Test setup and helpers
```

## How Points Work

- Each habit has a user-defined point value
- Completing a habit awards points immediately (or after monitor approval)
- Streak bonuses reward consistency (7-day, 30-day milestones)
- Points are spent to redeem rewards — balance never goes negative
- The point ledger is append-only for full auditability

## License

MIT
