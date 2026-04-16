// Central icon library — pure SVG, consistent stroke/size

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 2, style = {} }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={path.filled ? color : "none"}
      stroke={path.filled ? "none" : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {path.children}
    </svg>
  );
}

const PATHS = {
  home: {
    children: <path d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z"/>,
  },
  dumbbell: {
    children: (<>
      <path d="M6.5 6.5H5C4.17 6.5 3.5 7.17 3.5 8V10C3.5 10.83 4.17 11.5 5 11.5H6.5"/>
      <path d="M6.5 17.5H5C4.17 17.5 3.5 16.83 3.5 16V14C3.5 13.17 4.17 12.5 5 12.5H6.5"/>
      <path d="M17.5 6.5H19C19.83 6.5 20.5 7.17 20.5 8V10C20.5 10.83 19.83 11.5 19 11.5H17.5"/>
      <path d="M17.5 17.5H19C19.83 17.5 20.5 16.83 20.5 16V14C20.5 13.17 19.83 12.5 19 12.5H17.5"/>
      <line x1="6.5" y1="6.5" x2="6.5" y2="17.5"/>
      <line x1="17.5" y1="6.5" x2="17.5" y2="17.5"/>
      <line x1="6.5" y1="12" x2="17.5" y2="12"/>
    </>),
  },
  nutrition: {
    children: (<>
      <path d="M3 2V8C3 10.21 4.79 12 7 12V22"/>
      <path d="M7 2V12"/>
      <path d="M11 2V8C11 10.21 12.79 12 15 12V22"/>
      <path d="M19 2C19 2 21 4 21 8C21 10.21 19.21 12 17 12"/>
      <path d="M17 12V22"/>
    </>),
  },
  chart: {
    children: (<>
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M8 17V13"/>
      <path d="M12 17V7"/>
      <path d="M16 17V11"/>
    </>),
  },
  coach: {
    children: (<>
      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z"/>
      <path d="M9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21Z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </>),
  },
  user: {
    children: (<>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </>),
  },
  chat: {
    children: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  },
  plus: {
    children: (<>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </>),
  },
  search: {
    children: (<>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </>),
  },
  chevronRight: {
    children: <polyline points="9 18 15 12 9 6"/>,
  },
  chevronDown: {
    children: <polyline points="6 9 12 15 18 9"/>,
  },
  logout: {
    children: (<>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </>),
  },
  edit: {
    children: (<>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </>),
  },
  creditCard: {
    children: (<>
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </>),
  },
  check: {
    children: <polyline points="20 6 9 17 4 12"/>,
  },
  x: {
    children: (<>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </>),
  },
  flag: {
    children: (<>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </>),
  },
  target: {
    children: (<>
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </>),
  },
  calendar: {
    children: (<>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </>),
  },
  shield: {
    children: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  },
};
