# ApexCoach — Roadmap

> **For Claude:** This is the live feature tracker. Every user-facing change should touch this file. Move items between sections as status changes. Add new ideas to the backlog immediately when discussed — don't rely on chat history to remember them.

**How to update this doc:**
- When you ship something, move it from "In Progress" or "Backlog" to "Shipped" with the commit SHA
- When you start something, move it from "Backlog" to "In Progress" with a short scope note
- Add new ideas as they come up in conversation — better to have too much than lose an idea
- Mark **speculative** items with 🤔 so they're visually distinct from committed work
- Touch the "Last updated" field on every edit

**Last updated:** 2026-04-18 (commit `plan-review-edit-details`)

---

## Legend

| Symbol | Meaning                                   |
|--------|-------------------------------------------|
| ✅     | Shipped & live in production              |
| 🚧     | In progress / partially shipped           |
| 📋     | Committed backlog — priority decided      |
| 🤔     | Speculative — raised but not committed    |
| ⚠️     | Blocker or known issue                    |

---

## ✅ Shipped

Grouped by milestone. Most recent commits at the top within each section.

### Q2 2026 — UI Refactor & Coach Intelligence

| Item                                                        | Commit     |
|-------------------------------------------------------------|------------|
| Add to Homescreen prompt — iOS Safari banner (step-by-step Share → Add to Home Screen) + Android `beforeinstallprompt` native install button. Auto-shows 2.5s after load, skips if already installed or dismissed (localStorage). Lives in `components/ui/InstallPrompt.js`, mounted globally in `_app.js` | `install-prompt` |
| Firestore security rules — `users/{uid}/**` scoped to `request.auth.uid`. Rules file was already in repo; added `.firebaserc`, GitHub Action (`.github/workflows/deploy-firestore-rules.yml`) to auto-deploy on push. **Needs `FIREBASE_TOKEN` GitHub secret to activate** — see setup note below | `firestore-rules` |
| Push notifications (FCM) — Phase 1 event-driven. Client: permission request + token capture (`lib/useFCM.js`), token stored in `users/{uid}.fcmToken`. Server: `lib/firebaseAdmin.js` + notification send after plan generation. Background handler in `public/firebase-messaging-sw.js`. **Needs 2 env vars in Vercel** — `NEXT_PUBLIC_FIREBASE_VAPID_KEY` + `FIREBASE_SERVICE_ACCOUNT` | `fcm-push-phase1` |
| Edit Details on plan review screens — pencil button on every exercise row in `PlanReviewScreen` (onboarding) and `ProfilePlanReview` (`/profile/edit`). Opens `ExerciseConfigSheet` with current values pre-filled. On save, deep-clones and patches the plan in-place | `plan-review-edit-details` |

| Item                                                        | Commit     |
|-------------------------------------------------------------|------------|
| Coach tab cleanup: fix sessions count (non-rest types), UPCOMING/MISSED/TODAY status logic, remove Exercises tab, Sunday-gated Generate button, dashboard Sunday banner, logout confirmation sheet | `4bdf73c` + `ee78234` fix |
| Phase 4+5: apply primitives across Coach / Nutrition / Dashboard — StatCell, Card, DayPill, Chip, SectionLabel | `6f8c4e4`  |
| Exercise config sheet — sets stepper, reps field, rest quick-chips, notes. Wired into Add / Replace / Edit Details flow | `33de7fc`  |
| Phase 3: exercise editing on workout browse — dropdown menu (replace/remove/reorder/edit), + ADD per block, ExercisePicker with muscle group + equipment filters over 1,324 exercises, `applyPlanEdit()` Firestore helper, `edits[]` array tracking | `e1a9b24`  |
| Phase 1+2: UI primitives library (`components/ui/`) with 13 primitives (Button, Card, Chip, StatCell, DayPill, ExerciseRow, BottomSheet, FAB, BottomNav, Icon, etc.) | `7f46443`  |
| 3-tab bottom nav: Home / Coach / Profile (collapsed from 5 tabs). Legacy page active keys mapped by wrapper | `7f46443`  |
| Review page merged into Coach tab + Ask Coach FAB | `7f46443`  |
| New Profile summary page at `/profile`, existing edit flow moved to `/profile/edit` | `7f46443`  |
| Floating pill nav polish — slimmer, non-intrusive, active-tab label | `cdb073b`  |
| Welcome screen UX: Continue with Google primary, Sign In prominent for returning users, Create Account secondary | `d7f8534`  |
| Gemini: lastWeekEdits context injected into prompt — AI honors user preferences | `e1a9b24`  |

### Q1 2026 — Core Coach & Nutrition

| Item                                                        | Commit     |
|-------------------------------------------------------------|------------|
| TDEE-based calorie targets (Mifflin-St Jeor + activity multiplier) | `b54ec37`  |
| 7-day varied meal plans (mealPlans schema) | `b54ec37`  |
| Coaching philosophy in Gemini prompt (4 principles) | `b54ec37`  |
| `maxOutputTokens` raised to 12000, compact meal schema — fixes truncation | `4943bc0`  |
| Exercise database from Kaggle CSV (1,324 exercises) + GIF lookup + Gemini prompt name injection | `4f28278`  |
| Unified brand name to "APEXCOACH" across all screens | `5aee374`  |
| Nutrition page resilience: legacy `meals` schema fallback, `mealExamples` fallback, `mealPlans` primary, empty-state card | `3d3c25a`  |
| Dashboard nutrition strip schema resilience: `macros.fat` / `macros.fats`, calories from multiple sources | `2abd923`  |
| Default nutrition page to today's weekday (was always Monday) | `cdb073b`  |
| Exercise GIF fix: local name→ID lookup + live RapidAPI image fetch | `6163eee`  |

### Foundation (earlier)

| Item                                                        |
|-------------------------------------------------------------|
| Firebase Auth (Google, email, anonymous guest) + Firestore |
| Onboarding flow: 4 steps (Body, Health, Lifestyle, Goals)  |
| Gemini 2.5 Flash plan generation                            |
| Dashboard with today's session + start workout              |
| Active workout screen: set-by-set logging, rest timer, complete|
| End-of-week feedback capture                                |
| Ask Coach AI chat                                           |
| PWA manifest + service worker (next-pwa)                    |
| Lexend typography + lime `#c4ff00` accent visual system     |

---

## 🚧 In Progress

*Nothing actively in progress. Waiting for next prompt.*

---

## 📋 Backlog — Committed

Priority order within each tier.

### Tier 1 — Next Up

- **Push notifications — Phase 2 scheduled** — cron-job.org or Firebase Cloud Functions to send Sunday generate-plan reminder, daily workout nudge

### Tier 2 — After Tier 1

- **Push notifications — Phase 2 scheduled** — cron-job.org or Firebase Cloud Functions to send Sunday generate-plan reminder, daily workout nudge
- **Stripe paywall / billing page** — placeholder exists on profile. Need Stripe Checkout integration, free tier limits (e.g. 2 weeks), Pro tier unlock, billing portal

### Tier 3 — Polish

- **Progress charts** — volume over weeks, body-part distribution, consistency streak
- **Personal records surfacing** — "You hit a new PR on bench press!" after logging a set that exceeds previous best for that exercise
- **Deload week automation** — Gemini detects consistent high-difficulty feedback + drops volume 20% for a deload week automatically
- **Workout calendar view** — monthly grid showing completed/missed/upcoming sessions
- **Onboarding: photo upload** — optional progress photo, stored in Firebase Storage
- **Exercise substitution memory across weeks** — currently `edits[]` resets per week. Persist core substitutions (e.g. "always prefer Romanian deadlift over conventional")

---

## 🤔 Speculative

Ideas raised in conversation but not committed. Keep these visible so they don't get forgotten — but no one should start building without prompting first.

- **Apple Health / Google Fit integration** — pull heart rate, weight trend, steps. Data enrichment for Gemini prompt
- **Video form check** — upload a set, Gemini Vision review. Would need Gemini 2.x Vision API
- **Social / accountability partner** — share weekly recap with a friend, lightweight social layer
- **Meal prep mode** — batch-cook view, shopping list generation from 7-day meal plan
- **Habit / streak gamification** — consistency badges, streak counter on profile
- **AI form cues during active workout** — contextual coaching tips injected between sets based on user struggle
- **Template library** — pre-built programs (PPL, Upper/Lower, 5/3/1) users can import instead of AI-generating
- **Sleep / recovery integration** — Oura / Whoop API, adjust daily load based on recovery score
- **Injury-specific rehab flows** — guided protocols for common injuries (knee, lower back, shoulder)
- **Measurements tracking** — waist, arms, legs, body fat%. Photo + measurement timeline
- **Multi-language support** — Arabic as primary expansion language given Egypt locale
- **Separate cardio plan** — currently conditioning is bundled. Some users want an independent cardio/zone 2 plan
- **Supplement recommendations** — once or twice per week tip in the coach note
- **Export plan as PDF** — share with coach, doctor, or print

---

## ⚠️ Known Issues / Tech Debt

- **ExercisePicker filter chips** — equipment list is hardcoded. Should derive dynamically from exercises.json to stay in sync
- **No TypeScript** — intentional tradeoff. If app grows past ~30 pages, reconsider

---

## Release Notes

Lightweight changelog. Add new entries to the top.

### 2026-04-18 — Edit Details on plan review screens

- `PlanReviewScreen` (onboarding, `pages/index.js`) — pencil button on every exercise row. Opens `ExerciseConfigSheet` pre-filled with current sets/reps/rest/notes. On confirm, deep-clones the plan and patches the exercise in-place, then calls `onPlanUpdate`
- `ProfilePlanReview` (`pages/profile/edit.js`) — same pattern, patches `currentPlan` via `setCurrentPlan`
- Both screens: `ExerciseConfigSheet` handles warmup/cooldown (details/duration field) vs strength (sets/reps/rest/notes) automatically via `blockKey`

### 2026-04-18 — FCM Push Notifications Phase 1

- `public/firebase-messaging-sw.js` — FCM background service worker (handles push when app not in foreground, notification click opens `/dashboard`)
- `lib/useFCM.js` — client hook: requests permission once per session, captures FCM token via VAPID, stores in `users/{uid}.fcmToken`
- `lib/firebaseAdmin.js` — server-side `sendPushNotification()` using Firebase Admin SDK
- `pages/_app.js` — mounts `FCMProvider` inside `AuthProvider` so hook runs after auth resolves
- `pages/api/generate-plan.js` — fires "New plan ready 💪" push after Gemini returns a plan (fire-and-forget, never blocks the response)
- **Env vars required in Vercel before notifications send:** `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (Firebase Console → Project Settings → Cloud Messaging → Web Push certificates) + `FIREBASE_SERVICE_ACCOUNT` (Firebase Console → Project Settings → Service accounts → Generate new private key → paste JSON string)
- Gracefully no-ops if env vars missing — app never crashes without them

### 2026-04-18 — Stale cache fix, dashboard skeleton, dead code removal

- **Profile cache (#1):** `AuthContext` now opens a Firestore `onSnapshot` real-time listener on `users/{uid}` instead of a one-time `getDoc`. Any profile change from another tab or device propagates instantly to all open sessions. localStorage cache still used for zero-flicker initial load; listener confirms/overwrites on first fire
- **Dashboard skeleton (#2):** Replaced the spinner `LoadingCard` with a shimmer skeleton that mirrors the actual card layout (badge row, two heading lines, meta row, CTA button). Nutrition strip also shows a 4-cell shimmer skeleton while the plan is loading
- **Dead code (#3):** Deleted `pages/review.js` redirect stub. Added a permanent 308 server-side redirect (`/review` → `/coach`) in `next.config.js` — no JS required, faster and cleaner
- **Dead code (#4):** `pages/profile.js` was already absent from the repo — confirmed clean

### 2026-04-18 — Firestore security rules

- Rules file (`firestore.rules`) already existed with correct `users/{uid}/**` → `request.auth.uid` scoping
- Added `.firebaserc` pointing to `apexcoach-be717`
- Added `.github/workflows/deploy-firestore-rules.yml` — auto-deploys rules to Firebase whenever `firestore.rules` changes on `main`
- **One-time setup required:** Add `FIREBASE_TOKEN` secret to GitHub repo. Generate it by running `firebase login:ci` locally, then paste the token at `github.com/sublimeinterwebz/apexcoach/settings/secrets/actions`

### 2026-04-18 — Add to Homescreen prompt

- `InstallPrompt` component in `components/ui/` mounted globally in `_app.js`
- iOS: detects Safari UA, shows step-by-step guide (Share → Add to Home Screen → Add)
- Android: captures `beforeinstallprompt`, shows native install button
- Skips if already in standalone mode (already installed)
- One-time dismiss stored in `apex_install_dismissed` localStorage key
- Slides up from bottom with backdrop after 2.5s page settle delay

### 2026-04-18 — Fix: nutrition page training day indicator

- **Bug:** DayPill indicator dots and TRAINING DAY/REST DAY badge on `/nutrition` were driven by `mealPlans[].type` (AI-generated independently from the training schedule). Gemini sometimes returns `type: "rest"` for the last training day (e.g. Saturday) in `mealPlans` even when `weekPlan` correctly marks it as a training session
- **Fix:** Nutrition page now loads `weekPlan` alongside `nutrition`, builds a canonical `Set` of training day names (any day where `type !== "rest"` and `type !== "recovery"`), and uses that set for both the pill indicator and the day badge — exactly the same source of truth as the workout page. Falls back to `mealPlans[].type` when `weekPlan` is unavailable (e.g. legacy plans)

### 2026-04-18 — Onboarding intro screen

- Added `IntroScreen` component that sits between sign-in and the 4-step onboarding flow
- New users see a personalised welcome ("Welcome, [FirstName]."), a 3-step "How It Works" breakdown, and a "Build My Plan →" CTA before entering onboarding questions
- First name resolved from `user.displayName` → `user.email` prefix → fallback "There"
- Routing updated: `screen === "welcome"` now transitions to `"intro"` instead of directly to `"onboarding"`; "Build My Plan" button transitions to `"onboarding"`

### 2026-04-18 — Coach accuracy + Sunday gating

- Fixed sessions count bug where only `type: "workout"` was counted (missed strength/hypertrophy/conditioning)
- Future sessions now correctly show UPCOMING instead of MISSED
- Generate Week button only active on Sunday (Egypt locale)
- Dashboard shows a Sunday banner prompting next-week generation
- Logout now requires confirmation before signing out
- Removed the empty Exercises tab from Coach

### 2026-04-17 — Exercise config sheet

- After picking an exercise, users now configure sets/reps/rest/notes before it lands in the plan
- Edit Details menu item now opens the same sheet with existing values pre-filled
- Warmup/cooldown get a duration/details field instead of numeric sets

### 2026-04-16 — Exercise editing v1

- Every exercise on workout browse has a dropdown menu (Move up/down, Replace, Remove, Edit Details)
- + ADD button per block appends an exercise with a full-DB picker
- All edits written to `plan.edits[]` and fed back into Gemini on next week's generation
- Completed workouts become read-only automatically

### 2026-04-15 — Nav + primitives refactor

- 5-tab bottom nav collapsed to 3 tabs (Home, Coach, Profile)
- Floating pill design, label only on active tab
- UI primitives library shipped in `components/ui/`
- Coach tab created — Review content + Ask Coach FAB overlay
- Profile summary page separated from full edit flow
