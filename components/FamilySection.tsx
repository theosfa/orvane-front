'use client';

import { useState, FormEvent } from 'react';
import { useT } from '@/lib/i18n/context';
import { useFamily } from '@/lib/family-context';
import { familyApi, ApiError, FamilyOverview, FamilyRole } from '@/lib/api';
import ConfirmDialog from './ConfirmDialog';
import { Btn, Card, ErrorMsg, GlassInput, GlassSelect, Kicker, Pill, StateMsg } from './ui';

// Profile: the family — create one, invite people by email (they accept themselves),
// roles (admins change the shared budget, plans and menu; members only view), leave.
export default function FamilySection() {
  const { t } = useT();
  const { overview, apply } = useFamily();
  const [name, setName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => Promise<FamilyOverview> } | null>(null);

  // every family call answers with the new state
  const run = async (call: () => Promise<FamilyOverview>, onOk?: () => void) => {
    setError(null);
    try {
      apply(await call());
      onOk?.();
    } catch (err) {
      setError(err instanceof ApiError && err.status !== 500 ? errorText(err) : t('family.error'));
    }
  };

  const errorText = (err: ApiError) => {
    const msg = String(err.message);
    if (/at most|full/i.test(msg)) return t('family.errFull');
    if (/Already invited/i.test(msg)) return t('family.errInvited');
    if (/Already in this family/i.test(msg)) return t('family.errMember');
    if (/at least one admin/i.test(msg)) return t('family.errLastAdmin');
    if (/Leave your current family/i.test(msg)) return t('family.errInFamily');
    return t('family.error');
  };

  if (!overview) return <StateMsg>{t('common.loading')}</StateMsg>;
  const { family, invitations } = overview;

  const invitationList = invitations.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Kicker>{t('family.invitationsTitle')}</Kicker>
      {invitations.map((inv) => (
        <div key={inv.id} data-testid="invitation" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'var(--accent-tint)' }}>
          <span style={{ flex: '1 1 200px', fontSize: 14 }}>{t('family.invitationText', { family: inv.familyName, by: inv.invitedBy })}</span>
          <Btn variant="primary" disabled={!!family} onClick={() => run(() => familyApi.accept(inv.id))} style={{ padding: '8px 14px' }}>
            {t('family.accept')}
          </Btn>
          <Btn onClick={() => run(() => familyApi.decline(inv.id))} style={{ padding: '8px 14px' }}>
            {t('family.decline')}
          </Btn>
        </div>
      ))}
      {family && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('family.errInFamily')}</div>}
    </div>
  );

  const confirmDialog = (
    <ConfirmDialog
      open={!!confirm}
      title={confirm?.title ?? ''}
      confirmLabel={t('family.confirmYes')}
      cancelLabel={t('common.cancel')}
      danger
      onConfirm={() => {
        const c = confirm;
        setConfirm(null);
        if (c) run(c.run);
      }}
      onCancel={() => setConfirm(null)}
    >
      {confirm?.body}
    </ConfirmDialog>
  );

  if (!family) {
    const create = (e: FormEvent) => {
      e.preventDefault();
      if (name.trim()) run(() => familyApi.create(name.trim()), () => setName(''));
    };
    return (
      <Card as="section" id="family" data-testid="family-section" style={{ display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: 100 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>{t('family.title')}</h2>
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('family.intro')}</div>
        {invitationList}
        <form onSubmit={create} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <GlassInput aria-label={t('family.nameLabel')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('family.namePh')} maxLength={60} style={{ flex: '1 1 220px' }} />
          <Btn variant="primary" type="submit" disabled={!name.trim()}>
            {t('family.create')}
          </Btn>
        </form>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {confirmDialog}
      </Card>
    );
  }

  const isAdmin = family.myRole === 'admin';
  const seatsLeft = family.maxMembers - family.members.length - family.invites.length;

  const invite = (e: FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) run(() => familyApi.invite(inviteEmail.trim()), () => setInviteEmail(''));
  };

  return (
    <Card as="section" id="family" data-testid="family-section" style={{ display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: 100 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <Kicker>{t('family.title')}</Kicker>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{family.name}</h2>
        </div>
        <Pill accent={isAdmin}>{t(`family.role.${family.myRole}`)}</Pill>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('family.rolesHint')}</div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {family.members.map((m) => (
          <div key={m.userId} data-testid="family-member" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px dashed var(--stroke-2)' }}>
            <span style={{ flex: '1 1 180px', minWidth: 0, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>
              {m.email}
              {m.isMe && <span style={{ fontWeight: 400, color: 'var(--ink-2)' }}> · {t('family.you')}</span>}
            </span>
            {isAdmin ? (
              <GlassSelect
                aria-label={t('family.roleOf', { email: m.email })}
                value={m.role}
                onChange={(e) => run(() => familyApi.setRole(m.userId, e.target.value as FamilyRole))}
                style={{ padding: '8px 10px', fontSize: 13 }}
              >
                <option value="admin">{t('family.role.admin')}</option>
                <option value="member">{t('family.role.member')}</option>
              </GlassSelect>
            ) : (
              <Pill>{t(`family.role.${m.role}`)}</Pill>
            )}
            {isAdmin && !m.isMe && (
              <Btn
                aria-label={t('family.removeMember', { email: m.email })}
                onClick={() =>
                  setConfirm({ title: t('family.removeMember', { email: m.email }), body: t('family.removeBody'), run: () => familyApi.remove(m.userId) })
                }
                style={{ padding: '8px 12px' }}
              >
                ×
              </Btn>
            )}
          </div>
        ))}
        {family.invites.map((inv) => (
          <div key={inv.id} data-testid="family-invite" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px dashed var(--stroke-2)' }}>
            <span style={{ flex: '1 1 180px', minWidth: 0, fontSize: 14, color: 'var(--ink-2)', overflowWrap: 'anywhere' }}>{inv.email}</span>
            <Pill>{t('family.pending')}</Pill>
            {isAdmin && (
              <Btn aria-label={t('family.cancelInvite', { email: inv.email })} onClick={() => run(() => familyApi.cancelInvite(inv.id))} style={{ padding: '8px 12px' }}>
                ×
              </Btn>
            )}
          </div>
        ))}
      </div>

      {isAdmin &&
        (seatsLeft > 0 ? (
          <form onSubmit={invite} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <GlassInput
              type="email"
              aria-label={t('family.inviteLabel')}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t('family.invitePh')}
              style={{ flex: '1 1 220px' }}
            />
            <Btn variant="primary" type="submit" disabled={!inviteEmail.trim()}>
              {t('family.invite')}
            </Btn>
            <div style={{ flexBasis: '100%', fontSize: 12, color: 'var(--ink-2)' }}>{t('family.seatsLeft', { count: seatsLeft })}</div>
          </form>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('family.errFull')}</div>
        ))}

      {invitationList}
      {error && <ErrorMsg>{error}</ErrorMsg>}

      <Btn
        onClick={() =>
          setConfirm({
            title: t('family.leaveTitle', { name: family.name }),
            body: family.members.length === 1 ? t('family.leaveLastBody') : t('family.leaveBody'),
            run: () => familyApi.leave(),
          })
        }
        style={{ alignSelf: 'flex-start' }}
      >
        {t('family.leave')}
      </Btn>
      {confirmDialog}
    </Card>
  );
}
