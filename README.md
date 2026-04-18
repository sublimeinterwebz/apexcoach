# ApexCoach

AI-powered fitness coach PWA. Generates personalised weekly training and nutrition plans, learns from logged workouts and user edits, adapts each week.

🔗 **Live:** https://apexcoach-rho.vercel.app

---

## 📚 For Claude / Future Sessions — Read First

All project knowledge lives in `/docs/`. Start here at the beginning of every session:

| Doc | What it covers |
|-----|----------------|
| [`docs/apexcontext.md`](./docs/apexcontext.md) | Stack, directory map, Firestore schema, auth flow, API routes, Gemini prompt architecture, environment variables, known gotchas |
| [`docs/roadmap.md`](./docs/roadmap.md) | Shipped features, in-progress work, committed backlog, speculative ideas, known issues, release notes |
| [`docs/designsystem.md`](./docs/designsystem.md) | Typography scale, color tokens, spacing, component primitives API, patterns, writing conventions |

**Update these docs in the same commit as the code change.** Each doc has a "How to Update" section at the top with specific rules for that doc.

---

## Tech Summary

- **Framework:** Next.js 14 (Pages Router) · PWA via next-pwa
- **AI:** Gemini 2.5 Flash
- **Auth + DB:** Firebase Auth + Firestore
- **Typography:** Lexend
- **Styling:** Inline CSS-in-JS with shared tokens in `components/ui/tokens.js`
- **Host:** Vercel (auto-deploy on push to `main`)

---

## Quick Start

```bash
npm install
npm run dev             # http://localhost:3000
npm run build && npm start   # production build
```

Required env vars in `.env.local`:

```
GEMINI_API_KEY=...
EXERCISEDB_API_KEY=...
```

Firebase config is hardcoded in `lib/firebase.js` (public by design — security is via Firestore rules).

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Welcome + onboarding |
| `/dashboard` | Today's session, Sunday banner, nutrition strip |
| `/workout` | Browse + active logging + finish + feedback |
| `/coach` | Weekly review + next-week generation |
| `/chat` | AI chat with coach |
| `/nutrition` | Macros + 7-day meal plan |
| `/profile` | Summary |
| `/profile/edit` | Full 4-step profile edit |

See `docs/apexcontext.md` §8 for the complete route table.
