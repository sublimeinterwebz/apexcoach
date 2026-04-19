# ApexCoach — Project Context

> **For Claude:** This is the canonical reference for ApexCoach's architecture, stack, data schema, and core flows. Read this first at the start of any session. Update it whenever you change the stack, schema, auth flow, API shape, or add/remove a major component. Keep it current — staleness here costs the next session real time.

**How to update this doc:**
- When you ship a structural change (new Firestore field, new auth path, new API route, new page/component added to `/pages` or `/components/ui`), add it here in the same commit
- Prefer tables for lookup data (fields, routes, components); prose for flows and reasoning
- Never delete history blindly — move obsolete sections to a `## Deprecated` block at the bottom with a dated note
- Touch the "Last updated" line below whenever you edit

**Last updated:** 2026-04-19 (commit `fix-sunday-regen-firestore-source`)

---

## 1. Product Snapshot

AI-powered fitness coach PWA. Users complete onboarding (body, health, lifestyle, goals), Gemini generates a personalised weekly training + nutrition plan, users log workouts through the app, leave feedback at the end of the week, and on Sunday (Egypt week start) generate the next week's plan — with the AI learning from logged performance and any exercise edits the user made.

- **Live URL:** https://apexcoach-rho.vercel.app
- **GitHub:** `sublimeinterwebz/apexcoach`
- **Target users:** Individuals who want a personal trainer without the cost. Locale: Egypt (week starts Sunday).

---

## 2. Stack

| Layer              | Technology                                         |
|--------------------|----------------------------------------------------|
| Framework          | Next.js 14.2.3 (Pages Router)                      |
| Hosting / CI       | Vercel (project `prj_O4K4YdkiBvNnyREb5Fs0Je251HKd`, team `team_NTEW7sbvL7VkqbPiBwAI6L5H`) |
| Auth               | Firebase Auth (Google, email/password, anonymous)  |
| Database           | Firestore (project `apexcoach-be717`)              |
| AI                 | Gemini 2.5 Flash (`GEMINI_API_KEY` env var)        |
| Exercise data      | Kaggle-sourced CSV → `data/exercises.json` (1,324 exercises), GIFs via ExerciseDB RapidAPI (`EXERCISEDB_API_KEY`) |
| PWA                | `next-pwa`                                         |
| Typography         | Lexend (Google Fonts)                              |
| Styling            | Inline CSS-in-JS with shared tokens via `components/ui/tokens.js` |

No TypeScript. No Tailwind. No CSS modules. Plain JS + inline styles by design, to stay fast.

---

## 3. Directory Map

```
pages/
├── _app.js              App wrapper, global styles, AuthProvider
├── index.js             Welcome + 4-step onboarding (Body, Health, Lifestyle, Goals) + PlanReviewScreen
├── dashboard.js         Home — today's session card, Sunday banner, nutrition strip
├── workout.js           Workout browse + active session + finish + feedback
├── coach.js             Weekly review (Overview, Sessions) + next-week generation
├── chat.js              Ask Coach AI chat
├── nutrition.js         Full nutrition plan — macros, day selector, meals
├── review.js            Legacy redirect → /coach
├── profile/
│   ├── index.js         Profile summary (avatar, stats, details, edit link, logout)
│   └── edit.js          Full 4-step profile edit flow (moved from /profile.js)
└── api/
    ├── generate-plan.js   Gemini plan generation, TDEE calc, edits context
    ├── adjust-plan.js     One-shot plan adjustment (used by onboarding review)
    ├── chat.js            Gemini chat for Ask Coach
    └── exercise-gif.js    Local name→ID lookup + RapidAPI GIF fetch proxy

components/
├── shared.js            Legacy shared UI: Screen, Label, RadioCard, C (colors), BottomNav wrapper mapping legacy active keys → new 3-tab
├── ExerciseGif.js       Lazy-loaded exercise demo GIF with expand/collapse
└── ui/                  Primitives library (see designsystem.md for full reference)
    ├── tokens.js        C (colors), F (font), FS, FW, LS, R, S scales
    ├── Icon.js          Central SVG icon library (18 icons)
    ├── Button.js        5 variants × 3 sizes, loading state
    ├── Card.js          4 variants × 4 padding sizes
    ├── Chip.js          3 sizes × 3 colors
    ├── SectionLabel.js  Uppercase tracked label
    ├── StatCell.js      Macro/calorie cells
    ├── DayPill.js       Day selector with indicator dot
    ├── ExerciseRow.js   Editable row + menu + GIF toggle (exports BLOCK_COLORS, BLOCK_LABELS)
    ├── ExercisePicker.js ExerciseDB picker bottom sheet with filters
    ├── ExerciseConfigSheet.js  Sets/reps/rest/notes configurator
    ├── BlockSection.js  Block header + children
    ├── BottomSheet.js   Reusable slide-up overlay
    ├── FAB.js           Floating action button
    ├── BottomNav.js     3-tab floating pill nav
    └── index.js         Barrel export

data/
├── exercises.json       1,324 exercises with {id, name, equipment, bodyPart, target}
└── equipment_map.json   User-facing equipment labels → RapidAPI equipment strings

lib/
├── firebase.js          Firebase init, auth helpers, Firestore CRUD, applyPlanEdit helper
├── useRequireAuth.js    Redirects to / if not authenticated, returns { user, profile, setProfile, loading }
└── AuthContext.js       React context provider (user + profile cache in localStorage)

docs/                    This directory — project bible
├── apexcontext.md       ← you are here
├── roadmap.md
└── designsystem.md
```

---

## 4. Authentication Flow

Firebase Auth handles identity. Profile data lives in Firestore `users/{uid}` and mirrors to localStorage as `apex_profile_${uid}` for fast reloads.

**Sign-up paths (welcome screen at `/`):**
1. **Continue with Google** — primary CTA, handles both new and returning users
2. **Sign In with Email** — returning users (password)
3. **Create Account with Email** — new users (password)
4. **Continue as Guest** — anonymous auth (data stored but no recovery if cookies cleared)

**Routing logic in `pages/index.js`:**
- `user && profile?.onboardingComplete` → `/dashboard`
- `user && !profile?.onboardingComplete` → `"intro"` screen → `"onboarding"` screens
- No user → welcome screen

**Onboarding saves:** at the end of the final step, `saveUserProfile()` writes `{ ...form, onboardingComplete: true, currentWeek: 1 }` and kicks off `/api/generate-plan`.

**Cross-device sync:** works automatically — any device that signs in with the same Google/email account reads the profile from Firestore. No manual sync needed.

**Sign-out:** clears Firebase Auth + wipes `localStorage` keys starting with `apex_`. Confirmation sheet on profile page before signing out.

---

## 5. Firestore Schema

All user data is namespaced under `users/{uid}`. Examples show real shapes the app relies on — if any field is renamed, update this doc in the same commit.

### 5.1 `users/{uid}` — top-level profile doc

Produced by onboarding and editable via `/profile/edit`. Gemini reads this at plan-gen time.

```js
{
  // Identity
  name: "Hussain",
  email: "hussain@example.com",
  createdAt: serverTimestamp,
  onboardingComplete: true,
  currentWeek: 3,                       // incremented when Generate Week N+1 runs

  // Body
  age: 32,
  gender: "male",                       // "male" | "female" | "other"
  weight: 78,
  weightUnit: "kg",                     // "kg" | "lb"
  height: 178,
  heightUnit: "cm",                     // "cm" | "ft"

  // Fitness
  fitnessLevel: "intermediate",         // "beginner" | "intermediate" | "advanced"
  primaryGoal: "muscle_gain",           // "fat_loss" | "muscle_gain" | "maintain"
  targetWeight: 82,                     // optional
  trainingDays: "5",                    // stringified int 1-7
  trainingDaysOfWeek: ["Mon","Tue","Thu","Fri","Sat"],  // specific weekdays
  workoutLocation: ["Gym"],             // ["Gym"] | ["Home"] | ["Gym","Home"]

  // Equipment (derived from location)
  gymEquipment: ["Barbells & Dumbbells", "Cable & Pulley Machines", ...],
  homeEquipment: [],
  equipmentOther: "",

  // Health
  injuries: ["None"] | ["Lower Back", "Knee"],
  medicalConditions: "",
  dietaryPrefs: ["No Restrictions"] | ["Vegetarian", "Halal"],

  // Lifestyle
  jobType: "sedentary",                 // "sedentary" | "light" | "active" | "very active"
  sleepHours: "7",
  stressLevel: "medium",                // "low" | "medium" | "high"

  // Push notifications — per-device token array
  fcmTokens: ["token_device_1", "token_device_2"],
  // Populated by useFCM hook via arrayUnion (no overwrites, no duplicates)
  // Stale tokens are auto-removed by sendPushNotification() when FCM returns NotRegistered
  // Legacy single-token field (fcmToken) also supported as fallback in send functions

  // Cached copy of most recent plan (for fast dashboard reads)
  plan: { /* same shape as plans/week_N below */ },
}
```

### 5.2 `users/{uid}/plans/week_{N}` — weekly plan doc

Written by `/api/generate-plan`. Mutated in-place by user edits via `applyPlanEdit()`.

```js
{
  generatedAt: serverTimestamp,
  lastEditedAt: serverTimestamp,          // only if user has made edits

  weekPlan: [                             // 7 entries (Mon..Sun), or 7 starting Sun
    {
      dayName: "Monday",                  // "Monday" ... "Sunday"
      type: "strength",                   // "strength" | "hypertrophy" | "conditioning" | "rest" | "recovery"
      focus: "Upper Body Push",           // short descriptive title
      sessionLabel: "Chest & Shoulders",  // optional, same space as focus
      muscleGroups: "chest, shoulders, triceps",
      estimatedDuration: "60 min",
      blocks: {
        warmup:    [{ name: "arm circles", details: "30 seconds" }, ...],
        main:      [{ name: "barbell bench press", sets: 4, reps: "6-8",  restSeconds: 120, notes: "" }, ...],
        accessory: [{ name: "incline dumbbell press", sets: 3, reps: "10-12", restSeconds: 75,  notes: "" }, ...],
        finisher:  [{ name: "cable fly drop set", sets: 1, reps: "AMRAP", restSeconds: 0, notes: "" }],
        core:      [{ name: "cable crunch", sets: 3, reps: "12-15", restSeconds: 60, notes: "" }],
        cooldown:  [{ name: "chest stretch", details: "30 seconds each side" }],
      },
    },
    // Rest day example:
    { dayName: "Sunday", type: "rest", focus: "Rest Day" },
  ],

  nutrition: {
    dailyCalories: 2800,                  // may also appear as `calories` in legacy docs
    macros: { protein: 180, carbs: 320, fat: 80 },  // may appear as `fats` in legacy docs
    tips: ["Hit protein first, every meal", "Pre-workout carbs: 40g..."],
    nutritionNotes: "...",                // legacy, used if tips empty

    mealPlans: [                          // 7 entries, daily variation
      {
        dayName: "Monday",
        type: "training",                 // "training" | "rest"
        totalCalories: 2800,              // optional — dashboard falls back to this
        meals: [
          { meal: "Breakfast", name: "Oats & Berries Bowl", example: "80g oats, 200ml milk, 30g blueberries, 2 eggs", calories: 620, protein: 35 },
          { meal: "Lunch", ... },
          { meal: "Dinner", ... },
          { meal: "Snack", ... },
        ],
      },
    ],

    // Legacy formats — dashboard/nutrition page still handle these as fallbacks:
    mealExamples: [ /* flat array of meal objects */ ],     // pre-daily-plan schema
    meals: {                                                 // oldest schema
      breakfast: { name, ingredients: [], instructions, calories, protein },
      lunch:     { ... },
      dinner:    { ... },
      snacks:    [ { ... }, ... ],
    },
  },

  coachNote: "This week progresses volume by ~5%...",
  progression: {
    nextWeekFocus: "We'll add a top-set on bench and cycle RDL in...",
  },

  // User edits tracked for Gemini next-week context (see §7)
  edits: [
    { type: "swap",    day: "Monday",  block: "main",      from: "back squat", to: "front squat", at: "2026-04-15T10:24:00Z" },
    { type: "add",     day: "Wednesday", block: "accessory", to: "cable face pull", at: "..." },
    { type: "remove",  day: "Friday",  block: "finisher",  from: "bike sprints",   at: "..." },
    { type: "edit",    day: "Monday",  block: "main",      from: "bench press",    note: "Updated sets/reps", at: "..." },
    { type: "reorder", day: "Monday",  block: "main",      note: "Moved bench up", at: "..." },
  ],
}
```

### 5.3 `users/{uid}/logs/week_{N}_day_{D}` — completed workout log

Written when user finishes a workout in `/workout` active mode.

```js
{
  savedAt: serverTimestamp,
  completedAt: "2026-04-15T11:10:00Z",
  durationSecs: 3480,
  totalSets: 18,
  totalVolume: 4250,                       // kg
  sets: [                                  // parallel to loggable exercises
    [ { weight: 60, reps: 8, done: true }, ... ],  // one array per exercise
  ],
  exercises: [                             // names for the log (don't change if plan mutates later)
    { name: "barbell bench press", blockKey: "main" },
    ...
  ],
}
```

### 5.4 `users/{uid}/feedback/week_{N}` — end-of-week feedback

Collected on the finish screen after the last session of the week.

```js
{
  difficulty: "good",     // "easy" | "good" | "hard"
  energy:     "high",     // "low" | "normal" | "high"
  notes:      "",         // free-form
  savedAt:    serverTimestamp,
}
```

---

## 6. Firebase Helpers (`lib/firebase.js`)

| Function                                     | Purpose                                                      |
|----------------------------------------------|--------------------------------------------------------------|
| `signInWithGoogle()`                         | OAuth popup                                                  |
| `signUpWithEmail(email, password)`           | Create user                                                  |
| `signInWithEmail(email, password)`           | Existing user login                                          |
| `signInAnonymously()`                        | Guest mode                                                   |
| `signOut()`                                  | Sign out + cleanup (called from profile confirm sheet)       |
| `saveUserProfile(uid, profile)`              | `setDoc` on `users/{uid}`                                    |
| `getUserProfile(uid)`                        | Read `users/{uid}`                                           |
| `saveWeekPlan(uid, week, plan)`              | Fresh write to `plans/week_N`                                |
| `getWeekPlan(uid, week)`                     | Read `plans/week_N`                                          |
| `applyPlanEdit(uid, week, updatedPlan, editRecord)` | **Merges edit into `plan.edits[]` + writes back** — the single path for user mutations post-generation |
| `saveWorkoutLog(uid, week, day, log)`        | Write `logs/week_N_day_D`                                    |
| `getWorkoutLog(uid, week, day)`              | Read single log                                              |
| `getWeekLogs(uid, week)`                     | Returns array of 7, `null` for unlogged days                 |
| `saveWeekFeedback(uid, week, feedback)`      | Write `feedback/week_N`                                      |
| `getWeekFeedback(uid, week)`                 | Read feedback                                                |

---

## 7. AI / Gemini Architecture

### 7.1 Plan generation (`/api/generate-plan.js`)

**Model:** Gemini 2.5 Flash · `temperature: 0.6` · `maxOutputTokens: 12000` · JSON response mode.

**Prompt structure (in order):**
1. **System role** — "You are an elite fitness coach designing a personalized weekly training and nutrition plan."
2. **User Profile** — all profile fields + computed **TDEE** (Mifflin-St Jeor × activity multiplier from jobType × training days) + **target calories** (goal-adjusted: fat_loss −400, muscle_gain +300, maintain 0)
3. **Previous Week Summary** — plan summary + feedback (difficulty, energy, completion rate)
4. **User's Previous-Week Edits** — human-readable bullet list of every entry in `plans/week_N.edits[]` + instruction: *"Honor these preferences in the new plan. If the user swapped X for Y, prefer Y in the same block/day..."*
5. **Coaching Instructions** — weekly structure (rest placement, recovery windows), blocks (warmup/main/accessory/finisher/core/cooldown), **~300 filtered exercise names** from `data/exercises.json` constrained by user's equipment + muscle groups
6. **Nutrition Instructions** — TDEE-locked daily calories, 7-day varied meal plans, ~8-word meal descriptions (to stay inside token budget)
7. **Coaching Philosophy** — 4 principles: progressive overload, individuality, recovery, compound first
8. **OUTPUT FORMAT** — strict JSON spec (matches §5.2 schema)

The Gemini prompt is the heaviest single file in the app and the primary surface for changing coaching quality. Adjust temperature, token budget, or coaching philosophy here.

### 7.2 Plan adjustment (`/api/adjust-plan.js`)

Used by onboarding PlanReviewScreen "Apply Change" chips. Takes current plan + user's free-form adjustment request, returns modified plan. Lighter prompt than full generation.

### 7.3 Chat (`/api/chat.js`)

Ask Coach endpoint. Receives user message + profile + current plan summary as context. System prompt positions Gemini as a personal trainer answering form/nutrition/recovery questions in 1-3 short paragraphs.

### 7.4 Edit-tracking loop

User edits on workout browse → `applyPlanEdit()` writes `edits[]` entry → next Sunday's Generate Week call in `/coach` reads `plan.edits` → passes as `lastWeekEdits` to `/api/generate-plan` → prompt bullet list → Gemini honors preferences.

This is the mechanism by which the app "learns" user preferences over time. Don't break this loop without a replacement.

---

## 8. Navigation & Routes

### 8.1 Bottom nav (3 tabs)

Floating pill at `bottom: 12px`, 360px max width, collapsible labels.

| Tab     | Route       | Active keys (legacy → new) mapped in `shared.js`      |
|---------|-------------|-------------------------------------------------------|
| HOME    | `/dashboard`| `dashboard` / `workout` / `nutrition` / `home`        |
| COACH   | `/coach`    | `review` / `chat` / `coach`                           |
| PROFILE | `/profile`  | `profile`                                             |

### 8.2 Full route table

| Route              | Purpose                                                      |
|--------------------|--------------------------------------------------------------|
| `/`                | Welcome + onboarding (authed new users) → `/dashboard`       |
| `/dashboard`       | Today's session + Sunday banner + nutrition strip            |
| `/workout`         | Browse days → start active session → log sets → feedback     |
| `/workout?day=N`   | Deep-linked from dashboard                                   |
| `/nutrition`       | Macros + 7-day meal browser                                  |
| `/coach`           | Weekly review (Overview, Sessions) + Sunday-gated Generate   |
| `/chat`            | Full-screen AI chat, back button → /coach                    |
| `/profile`         | Summary with avatar, stats, details, logout                  |
| `/profile/edit`    | Full 4-step profile edit flow                                |
| `/review`          | Legacy redirect → `/coach`                                   |

---

## 9. Environment Variables

Set in Vercel project settings (all environments unless noted).

| Variable              | Purpose                                          |
|-----------------------|--------------------------------------------------|
| `GEMINI_API_KEY`      | Gemini 2.5 Flash API auth                        |
| `EXERCISEDB_API_KEY`  | RapidAPI ExerciseDB for GIF fetches              |

Firebase config is hardcoded in `lib/firebase.js` (public by design — security is via Firestore rules, not key obscurity). Project ID: `apexcoach-be717`.

---

## 10. Build & Deploy

- **Commit to `main`** on `sublimeinterwebz/apexcoach` → Vercel auto-builds and deploys to production
- Build runs `next build`. Static page generation errors will fail the deploy (e.g. `useState is not defined` from a missing import)
- **Validation before commit:** always run the babel parser syntax check on touched files:

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('pages/FILE.js','utf-8'), { sourceType:'module', plugins:['jsx'] })"
```

---

## 11. Known Schema Variations & Gotchas

Documenting these saves future sessions debugging time.

- **`macros.fat` vs `macros.fats`** — both appear in older plans. Dashboard + nutrition page read `macros.fat ?? macros.fats`
- **Session types** — Gemini returns `strength`, `hypertrophy`, `conditioning`, `rest`, `recovery`. Never assume `type === "workout"`. Count workouts as any non-rest type
- **Nutrition schema** — three formats in the wild (see §5.2). Always fall back: `mealPlans` → `mealExamples` → `meals` → empty-state card
- **`dailyCalories` vs `calories`** — older plans use `calories`. Read with fallback chain
- **Day ordering** — plans may start Monday or Sunday depending on when they were generated. Always use `dayName` strings, never rely on array index for calendar mapping
- **`trainingDaysOfWeek`** uses short 3-letter strings (`"Mon"`, `"Tue"`...). `plan.weekPlan[].dayName` uses full names (`"Monday"`)
- **Exercise names** are stored lowercase from the Kaggle CSV. Always display with `textTransform: "capitalize"` — don't mutate the stored value

---

## 12. Deprecated

(Empty for now — move obsolete sections here with a dated note when schema/code moves on.)

---

## 13. Push Notifications (FCM)

### 13.1 Architecture overview

| Layer | File | Purpose |
|---|---|---|
| Client hook | `lib/useFCM.js` | Permission request (gesture-gated), token capture, token saved to `users/{uid}.fcmTokens` |
| Background SW | `public/firebase-messaging-sw.js` | Receives push when app is closed/backgrounded, calls `showNotification()` |
| Server helper | `lib/firebaseAdmin.js` | `sendPushNotification()` — sends to all tokens for a user, auto-removes stale ones |
| Test endpoint | `pages/api/test-notification.js` | `GET /api/test-notification?uid=<uid>` — smoke test for any user |
| Plan trigger | `pages/api/generate-plan.js` | Fires "New plan ready" notification after Gemini returns a plan |

### 13.2 Critical design decisions (hard-won)

**Data-only payload — do not change this.**
Messages are sent with a `data` field only (`{ data: { title, body, link } }`), never with a `notification` field. If you add a `notification` field, Firebase's SDK default handler AND our `onBackgroundMessage` handler both fire → 2 notifications per send. Data-only means only our handler runs.

**Per-device token array.**
`fcmTokens` is an array, not a single string. `arrayUnion` prevents duplicates. Stale tokens (phone wiped, PWA reinstalled, etc.) are detected on the next send via `NotRegistered` error code and removed automatically from Firestore.

**Gesture-gated permission.**
`Notification.requestPermission()` must be called from a user tap, not on page load — browsers reject auto-prompts. `useFCM` returns `{ permissionState, requestPermission }`. The enable banner in `_app.js` calls `requestPermission` from a button click.

**No foreground toast.**
We removed the in-app foreground toast. All notifications — foreground and background — go through the service worker. Simpler, more consistent, no duplicates.

### 13.3 Env vars required

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Vercel → env | Public VAPID key — Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → key pair value (the long ~88-char string in the table, not the private key) |
| `FIREBASE_SERVICE_ACCOUNT` | Vercel → env | Full service account JSON as a single string — Firebase Console → Project Settings → Service accounts → Generate new private key → paste entire JSON |

**Common gotchas:**
- VAPID key = the key pair value shown in the table, NOT the private key from Actions menu
- Service account JSON: paste the entire file contents. Vercel sometimes double-escapes `\n` in `private_key` — `firebaseAdmin.js` handles this automatically
- After adding/changing env vars, a redeploy is required for them to take effect
- After reinstalling the PWA, users must open the app once to register a fresh token

### 13.4 Sending notifications

**To a single user:**
```js
import { sendPushNotification } from "../../lib/firebaseAdmin";
import admin from "firebase-admin";

const snap = await admin.firestore().doc(`users/${uid}`).get();
const tokens = snap.data()?.fcmTokens || [];

await sendPushNotification({
  uid,            // required for stale token cleanup
  tokens,
  title: "Your message title",
  body:  "Your message body",
  link:  "/dashboard",  // where tapping the notification opens
});
```

**To all users (broadcast):**
```js
const usersSnap = await admin.firestore().collection("users").get();
for (const doc of usersSnap.docs) {
  const tokens = doc.data()?.fcmTokens || [];
  if (!tokens.length) continue;
  await sendPushNotification({
    uid:    doc.id,
    tokens,
    title:  "Broadcast title",
    body:   "Broadcast body",
    link:   "/dashboard",
  });
}
```

**To a filtered segment (e.g. users who haven't logged a workout this week):**
```js
// Query users where currentWeek matches and no log exists
const snap = await admin.firestore()
  .collection("users")
  .where("onboardingComplete", "==", true)
  .get();

for (const doc of snap.docs) {
  const tokens = doc.data()?.fcmTokens || [];
  if (!tokens.length) continue;
  // add your filter logic here
  await sendPushNotification({ uid: doc.id, tokens, title: "...", body: "..." });
}
```

### 13.5 Adding new notification triggers

Every notification trigger is an API route or a server-side function that imports `sendPushNotification`. The pattern is always:

1. Read `users/{uid}` from Firestore to get `fcmTokens`
2. Call `sendPushNotification({ uid, tokens, title, body, link })`
3. Stale tokens are cleaned up automatically — no extra work needed

Current triggers:
- Plan generation (`/api/generate-plan.js`) — fires after Gemini returns a plan

Planned triggers (Phase 2):
- Sunday reminder to generate next week's plan
- Daily workout nudge if session not logged by evening
