# Motivate Me — Product Requirements Document

**Version:** 0.2
**Last updated:** 2026-03-22
**Status:** Active

---

## Overview

Motivate Me is a **fully self-serving** gamified habit-tracking PWA. Users earn points by logging habit completions, track streaks and weekly progress, then spend points to redeem personal rewards — physical items (photo-logged) or online purchases (URL-linked). An **optional** peer-monitor layer lets invited users observe progress and approve high-stakes actions or redemptions, but no feature requires a monitor to function. The app ships as a PWA (installable on iOS and Android home screens) and will eventually migrate to a native mobile app.

### Product Functionality Summary (as of v1.3.0)

| Feature | Status | Self-Serving? |
|---|---|---|
| Auth (magic link + password) | Complete | Yes |
| Habit CRUD + archiving | Complete | Yes |
| Inline action logging (dashboard) + full-page log | Complete | Yes |
| Append-only point ledger + balance | Complete | Yes |
| Streak tracking + milestone bonuses (7/30/60/90d) | Complete | Yes |
| Weekly frequency progress bars | Complete | Yes |
| Reward CRUD (offline + online types) | Complete | Yes |
| Wishlist with progress bars + notification | Complete | Yes |
| Reward redemption (self-serve) | Complete | Yes |
| In-app notifications center | Complete | Yes |
| Profile management + avatar (color+initials or photo) | Complete | Yes |
| Account deletion with confirmation | Complete | Yes |
| Monitor invite (link + email) + accept flow | Complete | Optional layer |
| Monitor action log approval/rejection | Complete | Optional layer |
| Reward approval by monitor | Complete | Optional layer |
| Monitor permissions enforcement | Complete | Optional layer |

**Self-serving verdict:** The app is fully functional without monitors. All core loops (create habits → log actions → earn points → redeem rewards) work end-to-end for a solo user.

---

## Goals

1. Help individuals build lasting habits by tying action to tangible, personal rewards.
2. Make self-discipline feel like a game: streaks, bonuses, and a growing reward balance.
3. Enable lightweight social accountability via optional invited monitors — without making it a social network.

---

## Target Users

| Role | Description |
|---|---|
| **Primary User** | An individual who wants to gamify their own self-improvement habits. |
| **Monitor** | An invited peer (friend, partner, parent, colleague) who observes the user's progress and optionally approves redemptions or helps set up the system. |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite (with React Router 7) |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth — magic link + password |
| File storage | Supabase Storage (reward photos, avatars) |
| Deployment | Vercel |
| PWA | Service worker for offline shell caching |
| Styling | Tailwind CSS 4 |
| Testing | Vitest + @testing-library/react |

---

## UX Direction

**Gamified & playful.** Bright colors, satisfying micro-interactions, badge moments, level-up animations. Every point earned and reward unlocked should feel rewarding. Think Duolingo-level delight, not a spreadsheet.

---

## Core Features

### 1. Authentication

- Magic link login via email — no password.
- Session persists across app restarts (PWA-friendly).
- User profile: display name, avatar (optional).

### 2. Habit Management

Users define their own habits from scratch.

**Habit fields:**
- Name (required)
- Description (optional)
- Point value per completion (user-defined integer)
- Requires photo proof on log? (toggle)
- Requires monitor approval on log? (toggle — only available if a monitor is connected)
- Frequency target: none / daily / N times per week
- Active / archived status

**Habit actions:**
- Create, edit, archive habits
- Habit list view (active habits dashboard)

### 3. Action Logging

Users log habit completions. Each log entry records:
- Which habit was completed
- Timestamp
- Optional photo upload (required if habit is set to "requires photo proof")
- Optional note
- Status: `pending_approval` | `approved` | `self_approved`

**Approval flow:**
- If habit requires monitor approval → status starts as `pending_approval`; points held until monitor approves.
- If self-reported → status is `self_approved`; points awarded immediately.

### 4. Point System

- Each approved log entry credits points to the user's balance.
- Point balance is the source of truth for all redemptions.
- Points are never negative.

**Streak mechanics:**
- Per-habit streak: consecutive days the habit was completed.
- Streak milestone bonuses (e.g., 7-day streak = +10 bonus points, 30-day = +50 bonus points). Exact values configurable.
- Breaking a streak resets it to 0.

**Frequency targets:**
- User sets a target (e.g., "3x per week").
- Dashboard shows progress toward weekly target.
- Completing a weekly target awards a bonus point block.

### 5. Rewards

Two reward types:

| Type | Description |
|---|---|
| **Offline reward** | Physical item or experience. Logged with photo + title + description + date + point cost. |
| **Online reward** | URL link to a product or experience. Logged with URL + title + description + point cost. |

**Reward fields (creation):**
- Title (required)
- Type: offline / online
- Point cost (required)
- Photo (offline only, optional at creation — required at redemption)
- URL (online only)
- Description
- Requires monitor approval to redeem? (toggle; configurable per reward; default: off)
- Approval required from: select from connected monitors

**Reward states:** `available` | `in_wishlist` | `redeemed`

**Redemption flow:**
1. User initiates redemption (must have sufficient points).
2. If no approval required → immediate redemption, points deducted, user uploads photo (offline) or confirms URL (online).
3. If approval required → request sent to specified monitor(s); points held (not deducted yet); monitor approves or rejects.
   - Approved → points deducted, reward marked redeemed.
   - Rejected → request cancelled, points released.

### 6. Wishlist

- User can mark any reward as "wishlist" when they don't yet have enough points.
- Wishlist shows: reward name, cost, current balance, points needed.
- Progress bar toward each wishlist reward.
- When balance reaches the cost, user gets a notification/badge prompting them to redeem.

### 7. Monitor / Invite System

- User generates an invite link or sends an email invite to a monitor.
- Monitor signs up / logs in via magic link.
- Connection is per-user: one user can have multiple monitors; a monitor can watch multiple users.

**Monitor permissions:**
- View the user's habit list and action log history.
- View point balance and full redemption history.
- Approve or reject pending reward redemption requests.
- Create and edit habits and rewards on behalf of the user (with user's prior consent, granted at invite time).

**Monitor does NOT have permission to:**
- Log actions on behalf of the user.
- Spend or transfer points.
- Remove the user's account or data.

### 8. Notifications (PWA push / in-app)

- Action log approved or rejected by monitor.
- Redemption request approved or rejected.
- Streak milestone reached.
- Wishlist item now affordable.
- Pending action awaiting monitor approval (monitor-side).
- Pending redemption awaiting monitor approval (monitor-side).

---

## Data Model (High-Level)

```
users
  id, email, display_name, avatar_url, created_at

monitors
  id, user_id, monitor_user_id, permissions (json), accepted_at

habits
  id, user_id, name, description, points_per_completion,
  requires_photo, requires_approval, frequency_target,
  frequency_count, is_active, created_at

action_logs
  id, habit_id, user_id, logged_at, photo_url, note,
  status (pending_approval | approved | self_approved),
  points_awarded, approved_by, approved_at

rewards
  id, user_id, title, type (offline | online), point_cost,
  photo_url, url, description, requires_approval,
  approval_monitor_ids (array), status (available | wishlist | redeemed),
  created_at

redemptions
  id, reward_id, user_id, requested_at, status (pending | approved | rejected),
  approved_by, approved_at, photo_url, note

point_ledger
  id, user_id, delta (positive or negative), reason, reference_id,
  reference_type (action_log | redemption | streak_bonus), created_at
```

---

## Screens / Pages

| Screen | Description |
|---|---|
| `/` | Landing / onboarding for logged-out users |
| `/dashboard` | Today's habits, point balance, streak summary |
| `/habits` | Full habit list; create / edit |
| `/log` | Log an action (select habit, add photo/note, submit) |
| `/rewards` | Reward catalog (available + wishlist) |
| `/rewards/new` | Create a reward |
| `/rewards/[id]` | Reward detail + redeem action |
| `/wishlist` | Wishlist view with progress bars |
| `/history` | Full action log history |
| `/redemptions` | Redemption history |
| `/monitors` | Manage connected monitors; invite |
| `/monitor/[userId]` | Monitor view — see another user's dashboard |
| `/settings` | Profile, notification preferences |

---

## PWA Requirements

- `manifest.json` with app name, icons (192px, 512px), `display: standalone`.
- Service worker for offline caching of shell (no offline data mutation).
- `theme-color` set for iOS/Android status bar tinting.
- Installable on iOS Safari ("Add to Home Screen") and Android Chrome.
- Viewport meta tag optimized for mobile.

---

## Non-Goals (v1)

- Native iOS / Android apps (post-PWA phase).
- Public social feed or leaderboards.
- Automated habit detection (e.g., from health data / step count).
- Payment / real money integration for online rewards.
- Group challenges or team habits.

---

## Build Queue

### Completed

- [x] **Project scaffold** — Vite + React 19 + Tailwind v4 + Vitest + ESLint
- [x] **Auth — magic link login/logout** — Supabase Auth, AuthProvider, AuthGate, Login page
- [x] **Habit CRUD** — Create, edit, archive with validation
- [x] **Action logging + point ledger** — Log actions, append-only ledger, real-time balance
- [x] **Streak tracking + bonuses** — Computed from logs, milestone bonuses at 7/30/60/90 days
- [x] **Reward CRUD + wishlist** — Create rewards, wishlist with progress bars, notification on affordable
- [x] **Reward redemption flow** — Self-redeem with point deduction, insufficient points blocked
- [x] **Notifications (in-app)** — Bell icon, unread count, mark as read, streak/redemption/wishlist triggers
- [x] **Supabase integration** — All data persisted to Postgres, RLS policies, optimistic local updates

### Next Up

- [x] **Monitor invite + connection** — Monitors page, invite link generation, accept flow, revoke, RLS policies
  - **Note:** Run `supabase/migrations/002_monitors.sql` in SQL Editor

- [x] **Monitor approval flows** — Approve/reject pending action logs, points credited on approval, user notified
- [x] **Notifications (in-app)** — Already completed in earlier iteration

- [x] **PWA polish + installability** — manifest.json, app icons, service worker, offline shell caching, apple-touch-icon

- [x] **User profile management** — Profile page with ID, photo, email, gender

- [x] **Monitor invites — email + copy link** — Enhance invite UX
  - **User:** Primary user
  - **Acceptance Criteria:**
    - "Invite a Monitor" generates a link with two share options: copy to clipboard, or send via email
    - Email option: user enters friend's email; Supabase sends invite email with the link
    - After sending, user sees confirmation of invite status (sent / copied)
  - **Tests Required:** Invite section renders copy and email options; email input field present

- [x] **Habit creation — monitor approval UX** — Improve approval toggle clarity
  - **User:** Primary user
  - **Acceptance Criteria:**
    - CreateHabit: "Requires Monitor Approval" toggle is disabled when user has no monitors
    - Disabled state shows tooltip icon explaining "Invite at least one monitor first"
    - Dashboard habit cards: show a lock/approval icon for habits requiring monitor approval
    - HabitList: show approval-required indicator on habit rows
  - **Tests Required:** Toggle disabled when no monitors; indicator visible on habits with requiresApproval

- [x] **Remove local storage fallback** — Database-only data storage
  - **User:** System
  - **Acceptance Criteria:**
    - Remove seed data initialization from store.tsx — all data comes from Supabase
    - Remove `useSupabase` conditional; all writes go to database unconditionally
    - Tests continue using mock context (no change to test behavior)
  - **Tests Required:** All existing tests pass; no localStorage references remain

- [x] **Account deletion with privacy safeguards** — GDPR-style data removal
  - **User:** Primary user
  - **Acceptance Criteria:**
    - "Delete My Account" button on Me page (at very bottom, below sign out)
    - Confirmation flow: user must type their user ID to confirm
    - On confirm: Supabase Edge Function or client-side cascade deletes all data (profiles, habits, action_logs, point_ledger, rewards, notifications, monitors, auth account)
    - Confirmation email sent to user's email after deletion
    - User is signed out and redirected to login
  - **Tests Required:** Delete button renders; confirmation requires exact ID match; cancel aborts

- [x] **Rearrange Me page layout** — Move dangerous actions to bottom
  - **User:** Primary user
  - **Acceptance Criteria:**
    - Page order: Profile card → Stats → Quick Links → Notifications → Sign Out → Account Deletion (very bottom)
    - Remove old "Data Management / Reset All Data" section (replaced by account deletion)
    - Update copy: data is stored in the cloud, not locally
  - **Tests Required:** Delete account button renders at bottom; reset data button removed

### Next Up

- [x] **Weekly frequency progress on dashboard** — Show habit completion progress toward weekly targets
  - **User:** Primary user
  - **Acceptance Criteria:**
    - Dashboard habit cards show weekly progress for habits with `frequencyTarget: 'daily'` or `'custom'`
    - Daily habits: show "X/7 this week" with a mini progress bar
    - Custom habits: show "X/N this week" based on `frequencyCount`
    - Progress bar fills proportionally; turns green when target met
  - **Tests Required:** Weekly progress renders on habit cards; shows correct count

### Next Up

- [x] **Inline habit logging (single-page)** — Consolidate two-page log flow into inline Dashboard interaction
  - **User:** Primary user
  - **Acceptance Criteria:**
    - Tapping an unchecked habit on Dashboard expands an inline logging panel below the habit card
    - Panel shows: optional note textarea, photo upload (if habit requires photo), points preview, and "Log It" button
    - Tapping "Log It" calls `logAction`, shows brief inline success confirmation (+pts badge), then auto-collapses after 1.5s
    - Only one habit panel can be expanded at a time; tapping another habit collapses the current one
    - Already-logged habits show filled checkbox and cannot be expanded
    - The separate `/log` route remains available but is no longer the primary path from the Dashboard
    - Habits requiring photo: "Log It" button disabled until photo is attached
  - **Tests Required:**
    - Tapping unchecked habit expands inline panel
    - Panel shows note field and Log It button
    - Panel shows photo upload when habit requires photo
    - Submitting calls logAction and shows success state
    - Only one panel open at a time
    - Already-logged habits cannot be expanded

### Next Up

- [x] **Editable point stepper** — Replace static point display with inline editable number + -/+ buttons
  - **User:** Primary user
  - **Acceptance Criteria:**
    - CreateHabit, EditHabit: point value is an editable number input with -/+ buttons, step by 1, min 1
    - CreateReward: point cost is an editable number input with -/+ buttons, step by 50, min 1
    - Direct type-in supported for quick big/small number changes
    - Input auto-selects on focus for easy replacement
  - **Tests Required:** Type-in changes value; -/+ buttons work; min 1 enforced

- [x] **Custom avatar (generated, no photo)** — Color + initials avatar system
  - **User:** Primary user
  - **Acceptance Criteria:**
    - EditProfile: new "Avatar Style" section with color picker (8 preset colors) above photo upload
    - Display mode auto-detected: CJK names → first character; "First Last" names → initials (e.g. "JD"); other → first two letters
    - Avatar config stored in user_metadata (avatar_color)
    - Me page profile card shows custom avatar (color + initials) or uploaded photo
    - Dashboard header also shows custom avatar
  - **Tests Required:** Avatar renders with initials; color selection works; CJK detection works

- [x] **Simplified invite signup** — Skip email confirmation for invited monitors
  - **User:** Monitor (invited)
  - **Acceptance Criteria:**
    - AcceptInvite signup: after successful signUp, auto-call signInWithPassword to get immediate session
    - If auto-sign-in succeeds, skip "verify email" screen and proceed directly to accept invite
    - If blocked by email confirmation, redirect confirmation email to invite URL so user returns automatically
    - Remove confirm password field in invite signup for faster onboarding
  - **Tests Required:** Invite signup calls signUp then signInWithPassword; success proceeds to accept

### Next Up

- [x] **Multi-monitor support + monitor details** — Show monitor emails, support multiple monitors per habit
  - **User:** Primary user
  - **Acceptance Criteria:**
    - DB: Add `monitor_email` column to monitors table; update accept RPC to store acceptor's email
    - DB: Add `approver_monitor_ids` column to habits table (text array)
    - Monitors page: show monitor email for accepted monitors (from DB)
    - CreateHabit: when user has >1 monitor, show multi-select list of monitors to assign as approvers
    - CreateHabit: when user has exactly 1 monitor, auto-assign that monitor when approval is toggled on
    - EditHabit: same monitor picker UI
    - Habit type: add `approverMonitorIds?: string[]`
    - DB layer: persist and fetch `approver_monitor_ids`
  - **Tests Required:**
    - Monitors page shows monitor email
    - CreateHabit shows monitor picker when >1 monitor
    - CreateHabit auto-assigns when exactly 1 monitor
    - Selected monitors stored on habit

### Next Up

- [x] **Enhanced Monitors page — invite stats + avatar details** — Richer monitor cards with stats and profile info
  - **User:** Primary user
  - **Acceptance Criteria:**
    - Invite summary banner: shows total invites sent and total accepted, green when ≥1 accepted, amber when 0
    - Pending invite cards: show creation timestamp with relative time (e.g. "3d ago")
    - People Monitoring Me: avatar circles (color + initials or photo) with tap-to-expand details (display name, email, revoke button)
    - I'm Monitoring: avatar circles with tap-to-expand details (display name, email, link to dashboard)
    - Only one card expanded at a time; tapping again collapses
    - Profile data fetched in batch via `fetchProfiles()` for all connected user IDs
  - **Tests Required:**
    - Pending invite cards show timestamp with "ago" text
    - Summary stats show invite count and accepted count
    - Monitor cards expand to show details on tap
    - Monitoring-others cards expand to show "View Dashboard" link
    - Expanded card collapses on second tap

### Backlog

- [x] **Reward monitor approval flow** — Complete the redemption approval UI (request → monitor approve/reject → points deducted or released)
- [x] **Monitor permissions enforcement** — Approver authorization check on action log approve/reject; permissions display + toggle on Monitors page
- [ ] Push notifications (web push API)
- [ ] Redemption history detail view with photo gallery
- [ ] Dark mode
- [ ] Habit templates / starter packs
- [ ] Export data (CSV / JSON)
- [ ] Native app (Capacitor) — post-PWA phase

---

## Google Stitch UI Design Prompt

> Use this prompt verbatim (or lightly adapted) when opening a new Google Stitch session to explore the visual design of Motivate Me. Update this section whenever core UX decisions are confirmed so it stays in sync with the product.

---

```
App name: Motivate Me
Platform: Mobile-first PWA (iOS & Android). Design as a native-feeling mobile app at 390 × 844 px (iPhone 14 viewport). All screens should feel installable — no browser chrome, no scrollable web pages. Think Duolingo meets Habitica: bold, colorful, gamified, with satisfying micro-interactions.

--- BRAND DIRECTION ---

Personality: Playful, encouraging, celebratory. Never punishing. Rewards effort and consistency.
Visual style: Vibrant but not chaotic. One strong primary color with high-contrast accent for CTAs. Rounded corners everywhere (16–24 px radius on cards). Generous whitespace. Friendly, rounded sans-serif typeface (e.g. Nunito, Poppins, or similar).
Color palette direction: Start from a warm violet/indigo primary (#6C47FF or similar) with a bright yellow-orange accent (#FFB800) for points and rewards. White card surfaces on a very light lavender background. Success green for completed actions. Use color intentionally — habit streaks glow, point gains animate in gold.
Iconography: Filled, rounded icons. Custom illustrated badge/trophy assets for milestone moments.
Micro-interactions: Confetti burst on streak milestone. Point counter ticks up like an odometer. Checkmark bounces on habit log. Reward card flips on redemption.

--- NAVIGATION ---

Bottom tab bar (5 tabs, icon + label):
  1. Home (house icon) — Dashboard
  2. Habits (lightning bolt) — Habit list
  3. Log (large center FAB button, "+" icon, elevated, accent color) — Log an action
  4. Rewards (gift box) — Reward catalog + wishlist
  5. Me (person icon) — Profile, monitors, settings

--- SCREENS TO DESIGN ---

SCREEN 1: Dashboard (Home tab)
Purpose: Daily motivational hub. User lands here every time they open the app.
Layout (top to bottom):
  - Top bar: avatar (left), app logo/name center, notification bell (right) with unread badge
  - Hero card (full width, gradient background using primary color): displays total point balance in large bold type with a gold coin icon, subtitle "points available". Below it, a small row showing "X redeemed this month".
  - "Today's Habits" section header with date subtitle
  - Habit cards (vertical list, each card):
      - Habit name (bold), point value badge (e.g. "+10 pts"), frequency tag (e.g. "Daily")
      - Streak flame icon + streak count (e.g. "🔥 5 days")
      - Right side: large circular checkbox — empty (to-do) or filled with checkmark + green (done)
      - If "pending approval": show a clock/hourglass icon instead, muted color
  - If all habits done for today: full-width celebration banner ("All done today! 🎉 +X pts earned") with confetti
  - "Streaks at Risk" section (if any habit not yet logged today and it's past noon): highlight those habits in a warm amber card
  - Bottom shortcut: "View Wishlist" pill button showing closest wishlist item + progress bar

SCREEN 2: Habit List (Habits tab)
Purpose: Manage all habits.
Layout:
  - Header: "My Habits" title, "New Habit" button (top right, accent color)
  - Segmented control: Active | Archived
  - Habit rows (list):
      - Habit name + description preview
      - Point value chip, frequency chip
      - Streak count
      - Approval indicator icon if monitor approval required
      - Tap row → Habit Detail / Edit sheet
  - Empty state (no habits): friendly illustration + "Create your first habit" CTA

SCREEN 3: Create / Edit Habit (Bottom sheet or full screen modal)
Fields:
  - Habit name (text input, large)
  - Description (multiline, optional)
  - Points per completion: number stepper with + / - buttons, prominent display
  - Frequency target: pill selector — None / Daily / Custom (N × per week with inline counter)
  - Requires photo proof: toggle with explanation label
  - Requires monitor approval: toggle (disabled + tooltip if no monitor connected)
  - Save / Cancel buttons at bottom

SCREEN 4: Log an Action (Center FAB → full screen or tall bottom sheet)
Purpose: Quick, satisfying action logging.
Layout:
  - "Log a Habit" title
  - Habit selector: horizontal scroll of habit cards (name + pts), selected one highlighted with primary color ring
  - Photo upload zone: large dashed rounded rectangle — "Add photo" (camera icon). If habit requires photo, show required badge.
  - Note field: optional short text input
  - "Earn X points" preview line in gold, updates as user selects habit
  - Big "Log It" CTA button (full width, accent color)
  - On submit: animated point counter increment, confetti if streak milestone hit

SCREEN 5: Reward Catalog (Rewards tab — default view)
Purpose: Browse and manage rewards.
Layout:
  - Header: "Rewards" title, "Add Reward" button
  - Segmented control: Available | Wishlist | Redeemed
  - Point balance sticky chip at top right ("You have X pts")
  - Reward grid (2-column) or list cards (user toggle preference):
      - Reward card: photo thumbnail (or emoji/icon placeholder), title, cost in points (gold coin icon + number)
      - "Redeem" button if balance sufficient (active, accent)
      - "Wishlist" button if insufficient (muted, outline)
      - Approval required badge (lock icon) if monitor approval needed
  - Wishlist tab: same cards but with progress bar (current pts / cost) and "X pts to go" label
  - Redeemed tab: greyed/sepia card with "Redeemed on [date]" overlay, tap to view photo/details

SCREEN 6: Reward Detail + Redeem
Layout:
  - Full-screen modal or pushed screen
  - Large photo at top (or placeholder gradient with emoji)
  - Title (large, bold), cost badge
  - Description text
  - For online reward: URL link chip (tap to open)
  - Approval status section (if approval required): "Requires approval from [Monitor Name]"
  - Point balance vs cost: progress bar or simple "You have X / Y pts"
  - "Redeem Now" CTA (full width) — disabled + tooltip if insufficient
  - On redeem (self): confetti, confirmation screen "Reward redeemed!" with point deduction shown
  - On redeem (approval): "Request sent to [Monitor]" confirmation with pending state UI

SCREEN 7: Wishlist
Layout:
  - "My Wishlist" header
  - List of wishlist reward cards (full width):
      - Photo + title
      - Goal progress bar: filled portion = current balance / cost. Color: primary color.
      - "[X] pts to go" label
      - "You can redeem this!" banner when balance reached (accent color, pulsing border)
  - Empty state: "Add rewards to your wishlist to track your progress."

SCREEN 8: Notification Center (Bell icon → overlay panel or screen)
Layout:
  - "Notifications" header, "Mark all read" link
  - Grouped list (Today / Earlier):
      - Each row: icon (type-specific color), message text, timestamp, unread dot
      - Types: streak milestone (flame), approval decision (check/x), redemption decision (gift), wishlist ready (star)
  - Tap notification → navigate to relevant screen

SCREEN 9: Monitor Dashboard (when current user is acting as a monitor for someone else)
Layout:
  - Header: "Monitoring [Name]" with their avatar
  - User's point balance + streak summary cards (read-only, same style as Dashboard hero but muted/secondary palette)
  - "Pending Approvals" section (priority, shown at top if non-empty):
      - Redemption requests: reward name, point cost, request date → "Approve" / "Reject" buttons
  - "Recent Activity" feed: habit logs with timestamps, status badges
  - "Their Rewards" and "Their Habits" quick-access links

SCREEN 10: Profile & Settings (Me tab)
Layout:
  - Avatar (editable), display name, email (read-only)
  - "My Monitors" section: list of connected monitors (avatar, name), "Invite a Monitor" button
  - "Monitoring Others" section: list of users I am monitoring
  - Notification preferences toggles
  - "Export my data" link
  - Sign out button (bottom, red text, no background)

--- COMPONENT LIBRARY ---

Design these reusable components explicitly:
  1. Point badge: gold coin icon + number, used inline everywhere
  2. Streak counter: flame icon + number, two sizes (compact for lists, large for dashboard)
  3. Habit card (list variant): described in Screen 1
  4. Reward card (grid variant): described in Screen 5
  5. Progress bar: rounded, primary color fill, shows label inside or below
  6. Status badge: pill shape — Pending (amber), Approved (green), Rejected (red), Self-approved (blue)
  7. Bottom tab bar: as described in Navigation
  8. FAB (center Log button): larger than other tabs, elevated shadow, accent color circle
  9. Celebration overlay: full-screen confetti + large message, auto-dismisses after 2s
  10. Empty state: centered illustration + headline + CTA button

--- INTERACTIONS TO ANNOTATE ---

- Habit checkbox tap: bounce animation → green fill → point counter increments
- Streak milestone: full-screen confetti overlay with "X Day Streak!" message
- Reward card "Redeem" tap: card flips (3D CSS flip) to show confirmation side
- Wishlist progress bar: animates fill when balance increases
- Notification bell: badge pulses when new notification arrives
- Log It button: ripple effect on tap, spinner during submission

--- WHAT NOT TO DESIGN ---

- No desktop/web layouts (mobile only for this session)
- No complex data tables or admin panels
- No dark mode (v1 is light mode only)
- No onboarding tutorial screens (design separately later)
```

---

## Long-Term Roadmap

### Native Mobile App

Migrate from PWA to native mobile using Capacitor (wrapping the existing React app). This unlocks native APIs not available in the browser and enables App Store / Play Store distribution.

| Phase | Milestone | Details |
|---|---|---|
| 1 | Add Capacitor to project | `@capacitor/core`, `@capacitor/cli`, iOS + Android targets |
| 2 | Native camera integration | Replace browser file picker with `@capacitor/camera` for photo proof |
| 3 | Push notifications | `@capacitor/push-notifications` + Supabase Edge Function for delivery |
| 4 | Haptic feedback | `@capacitor/haptics` on point earn, streak milestone, reward redeem |
| 5 | App Store / Play Store submission | Icons, screenshots, privacy policy, store listings |
| 6 | Background sync | Sync action logs queued offline when connectivity resumes |

See `docs/mobile-native-publishing-guide.md` for full publishing and account details.

---

### Health & Fitness Data Integration

Connect to health platforms and wearable devices to automatically verify habit completions and import fitness data as proof. This eliminates manual self-reporting for exercise, nutrition, sleep, and wellness habits.

#### Supported Platforms

| Platform | Data Access Method | Supported OS | Key Data Types | Auth Model |
|---|---|---|---|---|
| **Apple Health (HealthKit)** | Native HealthKit API via Capacitor plugin | iOS only | Steps, workouts, heart rate, sleep, nutrition, body measurements, mindfulness minutes | On-device permission prompt; data never leaves device unless user consents |
| **Google Health Connect** | Health Connect API via Capacitor plugin | Android 14+ (backport to Android 9+) | Steps, workouts, heart rate, sleep, nutrition, body measurements, hydration | Runtime permission per data type |
| **Fitbit** | Fitbit Web API (OAuth 2.0) | iOS, Android, Web | Steps, activity, sleep, heart rate, SpO2, weight, water intake | OAuth 2.0 PKCE; requires Fitbit developer app registration |
| **Garmin** | Garmin Connect API (OAuth 1.0a) | iOS, Android, Web | Activities, steps, sleep, heart rate, body composition, stress | OAuth 1.0a; requires Garmin developer portal access |
| **Whoop** | Whoop API (OAuth 2.0) | iOS, Android, Web | Strain, recovery, sleep performance, heart rate, HRV | OAuth 2.0; requires Whoop developer access |
| **Oura Ring** | Oura Cloud API (OAuth 2.0) | iOS, Android, Web | Sleep score, readiness, activity, heart rate, HRV, body temperature | OAuth 2.0; Personal access token or OAuth app |
| **Samsung Health** | Samsung Health SDK | Android (Samsung devices) | Steps, workouts, heart rate, sleep, blood pressure, SpO2 | Samsung Health app permission; limited to Samsung ecosystem |
| **Strava** | Strava API v3 (OAuth 2.0) | iOS, Android, Web | Activities (run, ride, swim), distance, pace, elevation, heart rate zones | OAuth 2.0; rate-limited (100 req/15 min, 1000 req/day) |
| **Peloton** | Unofficial API (no official public API) | Web (scraping/reverse-engineered) | Workouts, output, cadence, heart rate, class history | Username/password; fragile, may break |
| **Withings** | Withings API (OAuth 2.0) | iOS, Android, Web | Weight, body composition, blood pressure, sleep, activity | OAuth 2.0; requires Withings developer account |
| **MyFitnessPal** | No public API (discontinued 2022) | N/A | N/A — must use photo proof + LLM verification instead | N/A |

#### Integration Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Native App     │     │  Supabase Edge   │     │  Supabase DB    │
│  (Capacitor)    │────▶│  Functions       │────▶│  (PostgreSQL)   │
│                 │     │                  │     │                 │
│ HealthKit /     │     │ OAuth token mgmt │     │ health_data     │
│ Health Connect  │     │ API polling      │     │ action_logs     │
│ (on-device)     │     │ Data normalize   │     │ point_ledger    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        ▼
        │               ┌──────────────────┐
        │               │  Third-party     │
        └──────────────▶│  APIs            │
                        │  (Fitbit, Garmin │
                        │   Strava, etc.)  │
                        └──────────────────┘
```

**On-device sources** (Apple Health, Google Health Connect): Data is read directly on the device using native plugins. No server-side API needed. The app requests permission, reads relevant metrics, and syncs summaries to Supabase.

**Cloud API sources** (Fitbit, Garmin, Strava, etc.): OAuth tokens are stored in Supabase. A scheduled Edge Function polls each API for new data, normalizes it, and writes to the `health_data` table.

#### Implementation Steps Per Platform

| Step | Apple HealthKit | Google Health Connect | Fitbit / Garmin / Strava (Cloud APIs) |
|---|---|---|---|
| **1. Plugin/SDK** | `@nickreynolds/capacitor-healthkit` or `capacitor-health-connect` (iOS portion) | `capacitor-health-connect` | Supabase Edge Function + fetch |
| **2. Permissions** | Add `HealthKit` capability in Xcode; request per-data-type read access | Add Health Connect permissions in `AndroidManifest.xml`; request at runtime | OAuth consent screen; user authorizes data scopes |
| **3. Data read** | Query `HKSampleQuery` for steps, workouts, sleep in date range | Query `readRecords()` for steps, exercise sessions, sleep | `GET /user/-/activities/date/{date}.json` (Fitbit) or equivalent |
| **4. Normalize** | Map HealthKit types → internal schema (activity type, duration, calories, timestamp) | Map Health Connect records → same internal schema | Map API response JSON → same internal schema |
| **5. Sync to DB** | Batch insert into `health_data` table via Supabase client | Same as HealthKit | Edge Function writes to `health_data` table |
| **6. Auto-verify habits** | Match incoming data against habit rules (e.g., "Run 30+ min" → check workouts ≥ 30 min) | Same matching logic | Same matching logic |
| **7. Award points** | If rule matched and not already logged → create `action_log` + credit `point_ledger` | Same | Same |
| **8. Privacy** | Show Apple Health usage description in `Info.plist`; data stays on device until user syncs | Show Health Connect rationale dialog | Privacy policy must disclose API data usage; tokens encrypted at rest |

#### Proposed Data Model Addition

```sql
-- New table for normalized health/fitness data
CREATE TABLE health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  source text NOT NULL,           -- 'apple_health', 'google_health_connect', 'fitbit', 'garmin', 'strava', etc.
  data_type text NOT NULL,        -- 'steps', 'workout', 'sleep', 'heart_rate', 'nutrition', etc.
  value numeric,                  -- primary metric value (steps count, duration in minutes, calories, etc.)
  unit text,                      -- 'steps', 'minutes', 'kcal', 'bpm', etc.
  metadata jsonb DEFAULT '{}',    -- additional fields: workout_type, distance_km, heart_rate_avg, etc.
  recorded_at timestamptz NOT NULL, -- when the activity occurred
  synced_at timestamptz DEFAULT now(), -- when we received the data
  UNIQUE(user_id, source, data_type, recorded_at) -- prevent duplicate imports
);

-- Habit auto-verification rules
CREATE TABLE habit_health_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL,           -- which platform to check
  data_type text NOT NULL,        -- which metric
  operator text NOT NULL,         -- 'gte', 'lte', 'eq', 'between'
  threshold numeric NOT NULL,     -- minimum value to trigger (e.g., 30 for "30+ min workout")
  threshold_upper numeric,        -- upper bound for 'between' operator
  unit text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### Privacy & Compliance Considerations

| Concern | Approach |
|---|---|
| **Apple HealthKit guidelines** | Must provide clear usage description; cannot store raw HealthKit data on external servers without consent; cannot use health data for advertising |
| **Google Health Connect policy** | Must declare Health Connect permissions in Play Store listing; limited use policy applies |
| **HIPAA** | Not applicable unless app makes medical claims — Motivate Me is wellness/fitness only |
| **GDPR** | Health data is "special category" under GDPR — requires explicit consent, purpose limitation, right to deletion |
| **Data minimization** | Only sync data types relevant to user's configured habits; never bulk-export all health data |
| **Token security** | Store OAuth refresh tokens encrypted in Supabase; never expose in client-side code |

---

### AI-Powered Photo Proof Verification

Use LLM vision models to automatically analyze photo proof submitted with habit logs. This replaces or supplements manual monitor review for verifying actions like eating healthy meals, completing workouts, cleaning, studying, etc.

#### How It Works

```
User submits photo proof
        │
        ▼
┌──────────────────────┐
│  Supabase Edge       │
│  Function            │
│                      │
│  1. Receive image    │
│  2. Call LLM Vision  │
│  3. Parse response   │
│  4. Score confidence │
│  5. Auto-approve or  │
│     flag for review  │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Result:             │
│  • auto_approved     │
│  • flagged_for_review│
│  • rejected          │
└──────────────────────┘
```

#### Supported Verification Scenarios

| Habit Category | What the LLM Detects | Example Prompt to Model |
|---|---|---|
| **Nutrition / Meals** | Food type, portion size, protein presence, vegetables, meal balance | "Does this photo show a meal with a visible protein source (meat, fish, eggs, tofu, beans)? Estimate the portion." |
| **Workout / Exercise** | Gym setting, exercise equipment, active pose, outdoor run, yoga mat | "Does this photo show a person actively exercising or in a gym/workout environment?" |
| **Cleaning / Tidying** | Clean room, organized space, before/after comparison | "Does this photo show a clean, organized living space?" |
| **Reading / Studying** | Open book, notebook, study materials, desk setup | "Does this photo show active reading or studying with visible books or study materials?" |
| **Hydration** | Water bottle, glass of water, water tracker | "Does this photo show a water bottle or glass of water being consumed?" |
| **Meditation / Mindfulness** | Meditation pose, calm setting, meditation app on screen | "Does this photo show a meditation or mindfulness practice setting?" |
| **Outdoor / Nature** | Outdoor scenery, park, trail, natural sunlight | "Does this photo show an outdoor nature setting suggesting a walk or hike?" |
| **Medication / Supplements** | Pills, vitamin bottles, supplement containers | "Does this photo show medication or supplements being taken?" |

#### LLM Provider Options

| Provider | Model | Vision Support | Cost (per 1K images) | Latency | Best For |
|---|---|---|---|---|---|
| **Anthropic** | Claude Sonnet 4.6 | Yes — native multimodal | ~$3–5 (depending on image size) | 1–3s | High accuracy, nuanced understanding, safety-conscious |
| **OpenAI** | GPT-4o / GPT-4o-mini | Yes — native multimodal | ~$2–5 (4o), ~$0.50 (4o-mini) | 1–2s | Fast, cost-effective with 4o-mini for simple checks |
| **Google** | Gemini 2.5 Flash | Yes — native multimodal | ~$0.10–0.40 | <1s | Cheapest option, good for high volume |
| **Self-hosted** | LLaVA / Llama 3.2 Vision | Yes (open-source) | Infra cost only | Varies | Full data control, no API dependency |

**Recommendation:** Start with **Claude Sonnet 4.6** for accuracy and safety, with **Gemini 2.5 Flash** as a fallback for cost-sensitive high-volume checks. Use a tiered approach: Flash for simple yes/no checks, Sonnet for ambiguous cases requiring nuance.

#### Implementation Details

**Edge Function pseudocode:**

```typescript
// supabase/functions/verify-photo/index.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function verifyPhoto(
  imageUrl: string,
  habitName: string,
  habitDescription: string,
  verificationPrompt: string
): Promise<{ approved: boolean; confidence: number; reason: string }> {

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: `You are verifying photo proof for a habit tracking app.

Habit: "${habitName}"
Description: "${habitDescription}"
Verification question: "${verificationPrompt}"

Analyze this photo and respond with JSON:
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

Be strict but fair. If the photo is ambiguous, set confidence below 0.7.` }
      ]
    }]
  })

  return JSON.parse(response.content[0].text)
}
```

**Approval logic:**

| Confidence Score | Action |
|---|---|
| ≥ 0.85 | Auto-approve — points awarded immediately |
| 0.50 – 0.84 | Flag for monitor review — show AI assessment alongside photo |
| < 0.50 | Auto-reject — notify user with reason, allow resubmission |

**Anti-fraud measures:**

| Measure | Implementation |
|---|---|
| **EXIF metadata check** | Verify photo timestamp is within 1 hour of submission time |
| **Reverse image search** | Hash the image and check against previously submitted photos by the same user |
| **Location plausibility** | Optional — check EXIF GPS against expected location (e.g., gym address) |
| **Duplicate detection** | Perceptual hash (pHash) to detect reuse of same/similar photos |
| **Rate limiting** | Max 1 photo verification per habit per hour to prevent gaming |

#### Proposed Data Model Addition

```sql
-- Photo verification results
CREATE TABLE photo_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id uuid REFERENCES action_logs(id) ON DELETE CASCADE NOT NULL,
  llm_provider text NOT NULL,        -- 'anthropic', 'openai', 'google'
  llm_model text NOT NULL,           -- 'claude-sonnet-4-6', 'gpt-4o-mini', etc.
  approved boolean NOT NULL,
  confidence numeric NOT NULL,       -- 0.0 to 1.0
  reason text,                       -- LLM explanation
  prompt_used text,                  -- the verification prompt sent
  response_raw jsonb,                -- full LLM response for audit
  cost_cents integer,                -- API cost in cents for tracking spend
  latency_ms integer,                -- response time
  created_at timestamptz DEFAULT now()
);

-- Per-habit verification configuration
ALTER TABLE habits ADD COLUMN ai_verification_enabled boolean DEFAULT false;
ALTER TABLE habits ADD COLUMN ai_verification_prompt text;
ALTER TABLE habits ADD COLUMN ai_confidence_threshold numeric DEFAULT 0.85;
```

#### Cost Estimation

| Usage Level | Photos/Month | Claude Sonnet 4.6 | Gemini 2.5 Flash | Hybrid (Flash + Sonnet fallback) |
|---|---|---|---|---|
| Light (1 user, 2 habits) | ~60 | ~$0.30 | ~$0.02 | ~$0.05 |
| Moderate (10 users, 3 habits) | ~900 | ~$4.50 | ~$0.30 | ~$0.75 |
| Heavy (100 users, 5 habits) | ~15,000 | ~$75 | ~$5 | ~$12 |
| Scale (1,000 users) | ~150,000 | ~$750 | ~$50 | ~$120 |

---

### Implementation Priority & Dependencies

| Priority | Feature | Depends On | Effort |
|---|---|---|---|
| 1 | Native mobile app (Capacitor) | None — can start immediately | 1–2 weeks |
| 2 | Apple HealthKit integration | Native app (Capacitor + iOS) | 1 week |
| 3 | Google Health Connect integration | Native app (Capacitor + Android) | 1 week |
| 4 | AI photo proof verification | Supabase Edge Functions, LLM API key | 1 week |
| 5 | Cloud API integrations (Fitbit, Garmin) | OAuth infrastructure in Supabase | 2–3 weeks |
| 6 | Strava / Whoop / Oura integrations | Same OAuth infrastructure (incremental) | 1 week each |
| 7 | Auto-verification rules engine | Health data + AI verification in place | 1 week |

---

## Open Questions

- Should bonus point values for streak milestones be system-defined or user-configurable per habit?
- Should monitors receive email notifications for pending approvals, or only in-app?
- Is there a maximum number of monitors per user?
- For AI photo verification, should users be able to customize the verification prompt per habit, or should the system infer it from the habit name/description?
- For health data integration, should auto-verified habit completions bypass monitor approval, or should monitors still be able to override?
- What is the acceptable false-positive rate for AI photo verification before it undermines trust in the point system?
