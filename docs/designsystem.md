# ApexCoach — Design System

> **For Claude:** This is the single source of truth for ApexCoach's visual language. When building new screens, always use the primitives in `components/ui/` — never re-inline styles that duplicate a token. When you add a new primitive, add it here in the same commit. The rules at the top of this doc are how the app stays visually coherent.

**How to update this doc:**
- Add new primitives to §6 with props, variants, and one minimal usage example
- Add new tokens to §3/§4 if you introduce a new color, spacing, or size scale entry
- If a design convention changes (e.g. default card padding), update §5 and explain why in the release note at the bottom
- Touch the "Last updated" field on every edit

**Last updated:** 2026-04-19 (commit `unified-building-phase`)

---

## 1. Design Philosophy

**Dark-first, high-contrast, performance-oriented.** ApexCoach is used mid-workout on a phone, often with sweaty fingers, sometimes in dim gyms. The design prioritises:

1. **Readability first** — high-contrast type, generous touch targets, no clever effects that hurt legibility
2. **One accent color** — lime `#c4ff00` is the action color. It means "do this" or "you did this". Never used decoratively
3. **Dark UI** — matches gym environments, conserves OLED battery, signals focus
4. **Sharp type, soft shapes** — Lexend black/bold for display, generous border radii (12-22px) for warmth
5. **Quiet chrome, loud content** — no gradients, no stock icons, no drop shadows on UI. Drama comes from content (exercise names, big stats), not decoration

If a new screen needs a new color or primitive, that's a signal to think harder about reusing what exists.

---

## 2. Typography

**Family:** Lexend (Google Fonts)  
**Import:** already set up in `pages/_app.js`, applied globally  
**Reference constant:** `F` from `components/ui/tokens.js` → `"'Lexend', sans-serif"`

### Type scale (`FS` from tokens)

| Token       | Value | Typical use                                    |
|-------------|-------|------------------------------------------------|
| `FS.micro`  | 9     | Tab labels, indicator caps                     |
| `FS.tiny`   | 10    | Section labels (uppercase tracked)             |
| `FS.xs`     | 11    | Supporting/meta text, small chip labels        |
| `FS.sm`     | 12    | Tertiary body, button labels sm size           |
| `FS.md`     | 13    | **Default body text**                          |
| `FS.lg`     | 14    | Card titles, button labels md size             |
| `FS.xl`     | 15    | Primary button labels                          |
| `FS.xxl`    | 17    | Sheet titles, card headings                    |
| `FS.huge`   | 22    | StatCell large, section headings               |
| `FS.display`| 28    | Page titles                                    |

### Font weights (`FW` from tokens)

| Token          | Value | Use                                        |
|----------------|-------|--------------------------------------------|
| `FW.normal`    | 500   | Body prose                                 |
| `FW.medium`    | 600   | Supporting text, secondary labels          |
| `FW.semibold`  | 700   | Default for labels, most nav/button text   |
| `FW.bold`      | 800   | Card titles, buttons                       |
| `FW.black`     | 900   | Display headings, stat values, page titles |

### Letter spacing (`LS` from tokens)

| Token      | Value | Use                                               |
|------------|-------|---------------------------------------------------|
| `LS.tight` | -0.5  | Display headings                                  |
| `LS.normal`| 0     | Body                                              |
| `LS.wide`  | 1.5   | Small labels                                      |
| `LS.wider` | 2     | Section labels                                    |
| `LS.widest`| 3     | Top-of-page labels (e.g. "WEEK 1")                |

### Rules of thumb

- Page titles use `FS.display` + `FW.black` + `LS.tight` — and often mix white with lime accent (e.g. `WEEKLY <span>REVIEW</span>`)
- Uppercase section labels always get letter-spacing 2 or higher
- Never use italic in Lexend
- Don't stack more than one bold weight in a single card

---

## 3. Color Tokens

Imported from `components/ui/tokens.js` as `C`. Do not hardcode these values anywhere — always use `C.xxx`.

### Backgrounds

| Token       | Value      | Use                                           |
|-------------|------------|-----------------------------------------------|
| `C.bg`      | `#0a0a0a`  | App background (off-black, near-true-black)   |
| `C.bgDeep`  | `#121315`  | Nested surfaces (stat cells inside cards)     |
| `C.bgCard`  | `#1c1d21`  | Cards, buttons, inputs                        |

### Text

| Token       | Value      | Use                                           |
|-------------|------------|-----------------------------------------------|
| `C.white`   | `#ffffff`  | Hero headings, display numbers                |
| `C.text`    | `#e8e8e8`  | Primary body text                             |
| `C.muted`   | `#9a9ca0`  | Secondary text                                |
| `C.dim`     | `#5d5e62`  | Tertiary / placeholder                        |

### Strokes

| Token           | Value          | Use                                           |
|-----------------|----------------|-----------------------------------------------|
| `C.border`      | `#2a2b30`      | Card borders, dividers                        |
| `C.accentBorder`| `rgba(196,255,0,0.28)` | Active/focused borders                |

### Accent

| Token         | Value                       | Use                                      |
|---------------|-----------------------------|------------------------------------------|
| `C.accent`    | `#c4ff00`                   | Lime — primary action color              |
| `C.accentDim` | `rgba(196,255,0,0.12)`      | Lime tint — active state backgrounds     |

### Semantic colors (not in tokens — used inline)

These appear directly in code. Document them here so they stay consistent across screens.

| Purpose        | Color      | Used for                                        |
|----------------|------------|-------------------------------------------------|
| Cyan           | `#00cfff`  | Stats secondary, "easy" feedback, upcoming status |
| Amber          | `#ffaa00`  | Carbs macro, warmup block, "normal" energy      |
| Pink           | `#ff5e8a`  | Fat macro, finisher block, "hard" feedback, missed sessions, danger |
| Purple         | `#aa88ff`  | Core block, snack meals                         |
| Green success  | `#5a8a00` / `#7acc00` | Completed session checkmark state     |

### Rules

- **One accent.** Never use two different "action" colors in the same view. If you need a second emphasis, use white or the semantic color that maps to that context (pink = danger, cyan = info)
- **Lime is sacred.** It is never decorative. If it appears, it means "tap here" or "this happened"
- Semantic colors above are deliberate — don't swap amber and cyan because they look similar, they carry meaning users learn over time

---

## 4. Spacing & Sizing Tokens

### Spacing (`S` from tokens)

Multiples of 4 for predictable vertical rhythm.

| Token    | Value | Use                                       |
|----------|-------|-------------------------------------------|
| `S.xs`   | 4     | Inline gaps, stat cell padding            |
| `S.sm`   | 6     | Row gaps, chip gaps                       |
| `S.md`   | 8     | Default gap                               |
| `S.lg`   | 12    | Card-to-card gap                          |
| `S.xl`   | 16    | Section gap                               |
| `S.xxl`  | 20    | Page horizontal padding                   |
| `S.xxxl` | 24    | Large section gap                         |
| `S.huge` | 32    | Major section breaks                      |

### Border radius (`R` from tokens)

Rounded but not cartoonish. Sheets & major cards get the largest, chips get the pill treatment.

| Token     | Value | Use                                       |
|-----------|-------|-------------------------------------------|
| `R.xs`    | 6     | Small buttons, menu items                 |
| `R.sm`    | 8     | Icon squares, small chips                 |
| `R.md`    | 10    | Stat cells, selectors                     |
| `R.lg`    | 12    | Small/medium buttons, input fields        |
| `R.xl`    | 14    | Medium cards, primary buttons             |
| `R.xxl`   | 16    | Large cards, bottom sheets                |
| `R.pill`  | 20    | Chips, day pills, status tags             |

### Page layout

Every screen follows the same vertical rhythm:

- **Top padding:** `52px` (creates breathing room under the status bar on PWA)
- **Horizontal padding:** `20px` (`S.xxl`)
- **Bottom padding:** `110-140px` (clears the floating nav + FAB — use 110 if no FAB, 140 if FAB present)

---

## 5. Component Patterns

Conventions that recur across screens. Follow these unless there's a specific reason not to.

### Page header

```jsx
<div style={{marginBottom:20}}>
  <div style={{fontSize:11,color:C.muted,letterSpacing:3,fontWeight:600,marginBottom:6}}>WEEK 3</div>
  <div style={{fontSize:28,fontWeight:900,color:C.white,letterSpacing:-0.5}}>
    WEEKLY <span style={{color:C.accent}}>REVIEW</span>
  </div>
</div>
```

Every main screen has this pattern: small uppercase context label + display title with optional lime accent word.

### Card with section label

```jsx
<Card padding="md">
  <SectionLabel style={{marginBottom:10}}>COACH NOTE</SectionLabel>
  <p style={{fontSize:13,color:C.muted,lineHeight:1.7,margin:0}}>...</p>
</Card>
```

Cards are the default container. Always lead with a SectionLabel unless the card is a single interactive row.

### Stats row

Three to four StatCell primitives in a flex row with `gap: 8` or `gap: 10`. Use `size="lg"` for hero stats, `size="md"` for secondary groups.

### Status chip positioning

When a row has a status label (DONE / MISSED / UPCOMING), put it as a pill on the right with `flex-shrink: 0`. Left content is the name, middle is meta, right is the status.

### Empty state

Dashed-border card, centered text, muted heading + dim body + optional lime CTA button.

```jsx
<Card padding="md" variant="bordered" style={{borderStyle:"dashed", textAlign:"center"}}>
  <div style={{fontSize:14,fontWeight:700,color:C.muted,marginBottom:8}}>No Data Yet</div>
  <div style={{fontSize:12,color:C.dim,lineHeight:1.65,marginBottom:14}}>Explanation of why…</div>
  <Button variant="accentDim" size="sm">ACTION →</Button>
</Card>
```

### Bottom sheet

Never a full modal — always slide-up from bottom with `BottomSheet` primitive. Drag handle at top, title row with close X, scrolling body, padding consistent with `20px` sides.

### Destructive actions

Always require confirmation. Use a secondary BottomSheet pattern (not a full-screen modal):

```jsx
<Button variant="danger">Yes, Delete</Button>
<Button variant="outline">Cancel</Button>
```

Stacked buttons, danger on top (primary position).

---

## 6. Primitives Reference

All primitives live in `components/ui/` and are exported via `index.js` barrel:

```jsx
import { Button, Card, Chip, StatCell, ... } from "../components/ui";
```

The source files are the spec — this section documents the prop API + one minimal usage per primitive. For deeper examples, read the source.

### Button

```jsx
<Button variant="primary" size="md" onClick={handle}>Save</Button>
```

| Prop        | Type / values                                                      | Default    |
|-------------|--------------------------------------------------------------------|------------|
| `variant`   | `primary` / `outline` / `ghost` / `danger` / `accentDim`           | `primary`  |
| `size`      | `sm` / `md` / `lg`                                                 | `md`       |
| `icon`      | ReactNode (leading)                                                | —          |
| `trailing`  | ReactNode                                                          | —          |
| `loading`   | boolean (shows spinner)                                            | `false`    |
| `disabled`  | boolean                                                            | `false`    |
| `fullWidth` | boolean                                                            | `true`     |

**Rules:** `primary` is lime. `danger` is red. `outline` for secondary actions. `ghost` for tertiary / less prominent (logout). `accentDim` for subtle-but-still-accented CTAs in cards.

### Card

```jsx
<Card padding="md" variant="default">…</Card>
```

| Prop       | Type / values                            | Default    |
|------------|------------------------------------------|------------|
| `variant`  | `default` / `deep` / `bordered` / `accent` | `default`|
| `padding`  | `none` / `sm` / `md` / `lg`              | `md`       |
| `onClick`  | function — makes card clickable          | —          |

Padding: `sm = 10×12`, `md = 14×16`, `lg = 18×20`. Use `bordered` with `borderStyle:"dashed"` for empty states.

### Chip

```jsx
<Chip label="Overview" active={page===0} onClick={()=>setPage(0)} />
```

| Prop    | Type / values                             | Default  |
|---------|-------------------------------------------|----------|
| `size`  | `sm` / `md` / `lg`                        | `md`     |
| `color` | `accent` / `danger` / `neutral`           | `accent` |
| `active`| boolean                                   | `false`  |
| `icon`  | ReactNode                                 | —        |

Tab chips, filter chips, rest-time quick-picks all use this.

### SectionLabel

```jsx
<SectionLabel>COACH NOTE</SectionLabel>
```

| Prop    | Type / values                             | Default  |
|---------|-------------------------------------------|----------|
| `color` | hex / token                               | `C.muted`|
| `size`  | `sm` / `md`                               | `md`     |

Uppercase, tracked. The `C.muted` gray is standard; use `C.accent` only when the label relates to an active/called-out card (like "YOUR FEEDBACK" in a lime-bordered card).

### StatCell

```jsx
<StatCell label="Sessions" value="2/3" color={C.accent} size="lg" />
```

| Prop    | Type / values                             | Default  |
|---------|-------------------------------------------|----------|
| `size`  | `sm` / `md` / `lg`                        | `md`     |
| `color` | hex / token (value color)                 | `C.accent`|

Three sizes map to different contexts: `sm` for dense 4-up macro rows, `md` for 3-up dashboard strips, `lg` for hero stats on Coach overview.

### DayPill

```jsx
<DayPill label="MON" active={selected===0} onClick={...} indicator={isTrainingDay} />
```

Day selector with optional indicator dot for training days. Used in nutrition day selector, could be reused for any "pick one of N" where items are days/dates.

### ExerciseRow

```jsx
<ExerciseRow exercise={ex} index={0} blockColor={BLOCK_COLORS.main} editable reorderable onEdit={...} />
```

The heaviest primitive. Renders:
- Index bubble (colored by block)
- Exercise name + sets/reps/rest line + notes line
- Optional dropdown menu with Move up/down, Edit details, Replace, Remove
- Embedded `ExerciseGif` that users can expand to see a demo

**Exports `BLOCK_COLORS` and `BLOCK_LABELS`** which are the canonical block color/name mappings — always import from this file if you need them elsewhere:

```js
const BLOCK_COLORS = {
  warmup:    "#ffaa00",  // amber
  main:      C.accent,   // lime
  accessory: "#00cfff",  // cyan
  finisher:  "#ff5e8a",  // pink
  core:      "#aa88ff",  // purple
  cooldown:  C.muted,    // gray
};
```

### ExercisePicker

Full-screen bottom sheet with search + muscle group + equipment filter chips. Paginated list over 1,324 exercises. Calls `onPick(exercise)` when user taps a result.

### ExerciseConfigSheet

Bottom sheet for setting sets/reps/rest/notes after an exercise is picked. Sets uses a stepper (± buttons), rest uses a quick-pick chip row. For warmup/cooldown, swaps numeric fields for a duration text input.

### BlockSection

Colored section header + children container. Used to group exercises by block (Warm-Up, Main, Accessory, etc.).

### BottomSheet

Slide-up overlay with backdrop + drag handle. All sheets in the app (picker, config, logout confirm) use this.

| Prop        | Type                  | Default   |
|-------------|-----------------------|-----------|
| `isOpen`    | boolean               | required  |
| `onClose`   | function              | required  |
| `title`     | string                | —         |
| `maxHeight` | CSS value             | `85vh`    |

### FAB

Floating action button. Rounded pill, lime bg, icon or icon+label.

| Prop           | Default    |
|----------------|------------|
| `offsetBottom` | `96`       |
| `position`     | `bottom-right` |

### BottomNav

3-tab floating pill. Maps active keys to tabs automatically via `components/shared.js` wrapper so legacy pages (e.g. `active="workout"`) still highlight the right tab.

### BuildingPhase

Full-screen "AI is working on your plan" view — progress ring with live %, title, subtitle, thin progress bar, and a 5-step checklist that ticks off as progress crosses thresholds `[20, 42, 63, 82, 100]`. Used wherever plan generation runs: onboarding first-plan, Coach Sunday regen, profile Save-and-Rebuild.

Props: `title`, `subtitle`, `steps` (array of 5), `progress` (0–100). Pure display — drive `progress` from the caller. Step labels adjust per context so the user sees language relevant to what's happening.

Ships with `useBuildingProgress()` hook that handles the animation loop:

```js
const { progress, start, finish } = useBuildingProgress();

// inside your async handler:
start();                    // kicks off the ring
const plan = await fetch("/api/generate-plan", ...).then(r => r.json());
finish();                   // snaps to 100
setTimeout(() => goToNextPhase(), 600);
```

Progress animation (`+1.4` every 50ms) runs independently of the real API call. If Gemini returns before the bar reaches 100, `finish()` snaps it; if later, the bar holds at 100 until `finish()` fires the transition. Typical full animation is ~3.5s from 0 to 100.

### Icon

Central icon library. 18 icons as of last update:

```
home, dumbbell, nutrition, chart, coach, user, chat, plus, search,
chevronRight, chevronDown, logout, edit, creditCard, check, x, flag,
target, calendar, shield
```

Usage: `<Icon name="edit" size={16} color={C.muted} />`

Add new icons to `components/ui/Icon.js` rather than embedding SVGs inline. Keep strokeWidth at `2` for consistency unless the shape needs more weight.

---

## 7. Motion & Interaction

- **Transitions:** `all 0.18s` is the standard for hover/active. Use `0.25s ease-out` for sheet slide-ups. Avoid longer durations — app feels sluggish
- **Backdrop blur:** `backdropFilter: "blur(16px)"` on nav, `blur(4px)` on sheet backdrops
- **Shadows:** minimal. Nav has `0 8px 32px rgba(0,0,0,0.5)`. Cards have none. Only floating elements get shadows
- **Hover states:** on desktop. `border-color` shift to `C.accentBorder` on interactive cards
- **Active states:** scale down `0.96` on FAB press. Chip/button active is a color change, not a scale
- **Focus:** inputs get an outline transition to lime — don't suppress focus outlines on keyboard nav

---

## 8. Writing & Copy

- **Sentence case for everything** except section labels (which are UPPERCASE TRACKED)
- **Direct, not chatty.** "Set your parameters" not "Let's set up your exercise!". We're a coach, not a cheerleader
- **Numbers are lime, status is in its semantic color.** Resist the urge to color prose
- **Never apologize in UI copy.** "No feedback yet this week" beats "Sorry, no feedback recorded yet"
- **Abbreviations:** kcal (not cal), min (not mins), s (not sec) — units short-form in stats
- **Placeholders:** always em-dash `—` for missing numeric values, never `N/A` or `0`

---

## 9. Adding New Primitives — Checklist

When you add a new primitive to `components/ui/`:

1. Export from `components/ui/index.js`
2. Use tokens from `tokens.js`, never hardcoded values
3. Mirror the prop conventions: `size` / `variant` / `color` pattern
4. Default `fullWidth: true` for form-like primitives, default `fullWidth: false` for compact ones
5. Don't emit its own page margin — consumer controls outer spacing with `style={{marginBottom:...}}`
6. Add to this doc (§6) with prop table + one-line example
7. Grep existing pages for inline patterns this primitive replaces — refactor them in the same PR

---

## 10. Release Notes

Changes to the system itself (not just uses of it). Add newest on top.

### 2026-04-18

- Formalised semantic color chart (§3) — cyan/amber/pink/purple usage patterns now documented
- Added §5 "Component Patterns" codifying repeated inline patterns (page header, empty state, destructive confirm)

### 2026-04-17

- `ExerciseConfigSheet` primitive added — sets stepper + rest quick-pick chips + notes
- Confirmed convention: Warmup/cooldown exercises use `details` field, not sets/reps

### 2026-04-15

- Primitives library shipped — 13 primitives replacing ~40 inline styled divs across the app
- Floating pill nav (360px max width) replaces full-width bottom bar
- Page bottom padding standardised to `110-140px` to clear the floating nav
