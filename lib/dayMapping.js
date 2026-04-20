// Centralised day-name → Sun-first slot resolution.
// All pages should use these helpers instead of array indices, so they
// agree regardless of whether the stored plan is Sun-first, Mon-first,
// or has short-form dayName values.

export const DAY_SHORT  = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
export const DAY_NAMES  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const TODAY_SLOT = () => new Date().getDay(); // 0=Sun … 6=Sat

const SLOT_BY_NAME = {
  sun:0, sunday:0,
  mon:1, monday:1,
  tue:2, tues:2, tuesday:2,
  wed:3, weds:3, wednesday:3,
  thu:4, thur:4, thurs:4, thursday:4,
  fri:5, friday:5,
  sat:6, saturday:6,
};

// Resolve any plan entry to its canonical Sun→Sat slot (0..6).
// Falls back: dayName lookup → entry.dayIndex → array position.
export function slotForEntry(d, fallbackIdx) {
  const n = (d?.dayName || "").toString().trim().toLowerCase();
  if (n && SLOT_BY_NAME[n] !== undefined) return SLOT_BY_NAME[n];
  if (typeof d?.dayIndex === "number") return d.dayIndex;
  return fallbackIdx;
}

// Returns a 7-slot array indexed Sun..Sat, with each entry being the
// matching weekPlan entry (or null if no entry maps to that slot).
export function buildDaySlots(weekPlan) {
  const slots = [null, null, null, null, null, null, null];
  (weekPlan || []).forEach((d, i) => {
    const s = slotForEntry(d, i);
    if (s >= 0 && s <= 6) slots[s] = d;
  });
  return slots;
}

// Resolve a Sun→Sat slot back to the actual array position in weekPlan,
// for code paths that need to mutate the array in place.
export function resolveArrayIdx(weekPlan, slotIdx) {
  const idx = (weekPlan || []).findIndex((d, i) => slotForEntry(d, i) === slotIdx);
  return idx >= 0 ? idx : slotIdx;
}

// Sun-first array of dates (numbers) for the current week.
export function getWeekDates() {
  const today = new Date();
  const sun   = new Date(today);
  sun.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return d.getDate();
  });
}
