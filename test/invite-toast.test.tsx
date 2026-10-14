import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithIntl } from './render';
import { familyMock } from './family-mock';
import InviteToast from '@/components/InviteToast';
import type { FamilyOverview } from '@/lib/api';

const invited = (...ids: number[]): FamilyOverview => ({
  family: null,
  invitations: ids.map((id) => ({ id, familyName: `Family ${id}`, invitedBy: 'anna@test.dev' })),
});

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

const toast = () => screen.queryByTestId('invite-toast');
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('invitation notice', () => {
  it('slides in when an invitation arrives, links to the profile and goes after 10 s', () => {
    renderWithIntl(<InviteToast />);
    expect(toast()).toBeNull();

    act(() => familyMock.set({ overview: invited(5) }));
    expect(toast()).toHaveTextContent('You’re invited to a family');
    expect(toast()).toHaveTextContent('“Family 5” — invited by anna@test.dev');
    expect(screen.getByRole('link', { name: 'Open invitation' })).toHaveAttribute('href', '/profile#family');

    wait(9_900);
    expect(toast()).toHaveAttribute('data-leaving', '0');
    wait(100);
    expect(toast()).toHaveAttribute('data-leaving', '1'); // sliding up
    wait(300);
    expect(toast()).toBeNull();
  });

  it('shows each invitation once, one after another, also after a reload', () => {
    familyMock.set({ overview: invited(1, 2) });
    const { unmount } = renderWithIntl(<InviteToast />);
    expect(toast()).toHaveTextContent('Family 1');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    wait(300);
    expect(toast()).toHaveTextContent('Family 2');
    wait(10_000);
    wait(300);
    expect(toast()).toBeNull();

    unmount();
    renderWithIntl(<InviteToast />);
    expect(toast()).toBeNull();
  });

  it('stays while hovered', () => {
    renderWithIntl(<InviteToast />);
    act(() => familyMock.set({ overview: invited(3) }));
    fireEvent.mouseEnter(toast()!);
    wait(30_000);
    expect(toast()).toHaveAttribute('data-leaving', '0');
    fireEvent.mouseLeave(toast()!);
    wait(3_000);
    wait(300);
    expect(toast()).toBeNull();
  });

  it('goes away when the invitation is withdrawn, and is not shown on the profile', () => {
    renderWithIntl(<InviteToast />);
    act(() => familyMock.set({ overview: invited(4) }));
    expect(toast()).not.toBeNull();
    act(() => familyMock.set({ overview: invited() }));
    wait(300);
    expect(toast()).toBeNull();

    window.history.replaceState(null, '', '/profile');
    act(() => familyMock.set({ overview: invited(6) }));
    expect(toast()).toBeNull();
  });
});
