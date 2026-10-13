import { useSyncExternalStore } from 'react';
import { vi } from 'vitest';
import type { FamilyOverview, Scope } from '@/lib/api';
import { deriveScope } from '@/lib/family-scope';

// Stand-in for lib/family-context in page tests: set the family and the chosen side with
// familyMock.set(); the hook behaves like the real one (same scope rules).
type State = { overview: FamilyOverview | null; chosen: Scope };
const initial = (): State => ({ overview: { family: null, invitations: [] }, chosen: 'personal' });
let state = initial();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const familyMock = {
  set(partial: Partial<State>) {
    // like React's setState: no change, no re-render
    if (Object.entries(partial).every(([k, v]) => state[k as keyof State] === v)) return;
    state = { ...state, ...partial };
    emit();
  },
  reset() {
    state = initial();
    emit();
  },
  refresh: vi.fn(async () => {}),
};

// stable across renders, like the real provider's callbacks
const setScope = (chosen: Scope) => familyMock.set({ chosen });
const apply = (overview: FamilyOverview) => familyMock.set({ overview });

export function useFamilyMock() {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
  return {
    overview: s.overview,
    ...deriveScope(s.overview, s.chosen),
    setScope,
    apply,
    refresh: familyMock.refresh,
  };
}

// a family with the current user in it
export function familyOf(myRole: 'admin' | 'member', extra: Partial<NonNullable<FamilyOverview['family']>> = {}): FamilyOverview {
  return {
    family: {
      id: 1,
      name: 'Smiths',
      myRole,
      maxMembers: 5,
      members: [
        { userId: 1, email: 'me@test.dev', role: myRole, isMe: true },
        { userId: 2, email: 'anna@test.dev', role: myRole === 'admin' ? 'member' : 'admin', isMe: false },
      ],
      invites: [],
      ...extra,
    },
    invitations: [],
  };
}
