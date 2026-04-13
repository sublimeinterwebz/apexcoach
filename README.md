# ApexCoach

AI-powered personal trainer and nutritionist PWA. Generates weekly workout and nutrition plans tailored to each user, tracks performance, and updates the plan every week based on results.

## Stack

- **Framework:** Next.js 14 (Pages Router)
- **PWA:** next-pwa
- **AI:** Gemini 2.0 Flash
- **Auth + DB:** Firebase (to be wired up)
- **Styling:** Inline styles, DM Sans + Bebas Neue fonts

## Screens

| Screen | Route | Description |
|---|---|---|
| Welcome / Onboarding | `/` | Sign in + 4-step profile collection |
| Dashboard | `/dashboard` | Week strip, today's workout, macros |
| Workout Logger | `/workout` | Set-by-set logging with rest timer |
| Weekly Review | `/review` | Stats, AI feedback, plan regeneration |
| AI Trainer Chat | `/chat` | Live chat with AI coach |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your Gemini API key

Create a `.env.local` file in the root:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Get a key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
npm start
```

## Firebase Setup (Auth + Firestore)

Wire up Firebase in `/pages/index.js` for Google Sign-In and email/password auth. Store user profiles and weekly plans in Firestore.

## PWA Icons

Add `icon-192.png` and `icon-512.png` to `/public/icons/` for the PWA install prompt.
