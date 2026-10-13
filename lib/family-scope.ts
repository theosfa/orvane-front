import type { FamilyOverview, Scope } from './api';

// What Finance, Menu and Plans show and whether it may be changed:
// outside a family it's always the user's own data; in a family the chosen side,
// and family data is changed by admins only.
export function deriveScope(overview: FamilyOverview | null, chosen: Scope): { scope: Scope; canEdit: boolean } {
  const family = overview?.family ?? null;
  const scope: Scope = family ? chosen : 'personal';
  return { scope, canEdit: scope === 'personal' || family?.myRole === 'admin' };
}
