import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { familyApi } from '@/lib/api';
import { familyOf } from './family-mock';

type FamilyModule = typeof import('@/lib/family-context');
// the real provider (setup.ts mocks it for page tests)
let FamilyProvider: FamilyModule['FamilyProvider'];
let useFamily: FamilyModule['useFamily'];
beforeAll(async () => {
  ({ FamilyProvider, useFamily } = await vi.importActual<FamilyModule>('@/lib/family-context'));
});

let user: { id: number } | null = { id: 1 };
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, familyApi: { overview: vi.fn() }, subscribeFamilyEvents: vi.fn() };
});
const overview = vi.mocked(familyApi.overview);

let ctx: ReturnType<FamilyModule['useFamily']>;
function Probe() {
  ctx = useFamily();
  return <span data-testid="state">{`${ctx.scope}:${ctx.canEdit}`}</span>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  user = { id: 1 };
});

describe('FamilyProvider', () => {
  it('loads the family and remembers the chosen side', async () => {
    overview.mockResolvedValue(familyOf('member'));
    render(<FamilyProvider><Probe /></FamilyProvider>);
    await waitFor(() => expect(ctx.overview?.family?.name).toBe('Smiths'));
    expect(screen.getByTestId('state')).toHaveTextContent('personal:true');

    act(() => ctx.setScope('family'));
    expect(screen.getByTestId('state')).toHaveTextContent('family:false');
    expect(localStorage.getItem('nn_scope')).toBe('family');
  });

  it('restores the family side on the next visit, but only while in a family', async () => {
    localStorage.setItem('nn_scope', 'family');
    overview.mockResolvedValue(familyOf('admin'));
    const { unmount } = render(<FamilyProvider><Probe /></FamilyProvider>);
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('family:true'));
    unmount();

    overview.mockResolvedValue({ family: null, invitations: [] });
    render(<FamilyProvider><Probe /></FamilyProvider>);
    await waitFor(() => expect(overview).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('state')).toHaveTextContent('personal:true');
  });

  it('applies the state returned by family actions', async () => {
    overview.mockResolvedValue({ family: null, invitations: [] });
    render(<FamilyProvider><Probe /></FamilyProvider>);
    await waitFor(() => expect(ctx.overview).not.toBeNull());
    act(() => ctx.apply(familyOf('admin')));
    expect(ctx.overview?.family?.myRole).toBe('admin');
  });

  it('does not ask the API when logged out', () => {
    user = null;
    render(<FamilyProvider><Probe /></FamilyProvider>);
    expect(overview).not.toHaveBeenCalled();
  });
});
