// Stroke icons shared by the sidebar (desktop) and the dock (phones).
// They take the text colour, so active/inactive states only change `color`.

export type IconName =
  | 'home' | 'feed' | 'recipes' | 'menu' | 'ingredients' | 'liked'
  | 'plan' | 'goals' | 'spending' | 'wallets' | 'categories'
  | 'profile' | 'login' | 'register' | 'apps' | 'sun' | 'moon' | 'plus' | 'arrow';

const PATHS: Record<IconName, string[]> = {
  home: ['M3 11l9-7 9 7', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  feed: ['M4 4h16v16H4z', 'M10 9l5 3-5 3z'],
  recipes: ['M6 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 8h7', 'M8 12h7'],
  menu: ['M4 5h16v15H4z', 'M4 10h16', 'M9 3v4', 'M15 3v4'],
  ingredients: ['M12 21c-4 0-7-3-7-7 0-5 7-11 7-11s7 6 7 11c0 4-3 7-7 7z'],
  liked: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  plan: ['M4 12l5 5L20 6'],
  goals: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  spending: ['M4 19V9', 'M10 19V5', 'M16 19v-7', 'M22 19H2'],
  wallets: ['M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3 7l12-4v4', 'M16 13h2'],
  categories: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  profile: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  login: ['M10 17l5-5-5-5', 'M15 12H3', 'M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5'],
  register: ['M12 5v14', 'M5 12h14'],
  apps: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  sun: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z'],
  plus: ['M12 5v14', 'M5 12h14'],
  arrow: ['M7 17L17 7', 'M9 7h8v8'],
};

export function Icon({ name, size = 20, strokeWidth = 2 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto' }}>
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
