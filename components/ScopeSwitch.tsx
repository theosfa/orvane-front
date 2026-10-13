'use client';

import { useT } from '@/lib/i18n/context';
import { useFamily } from '@/lib/family-context';
import { Chip, Pill } from './ui';

// "Mine / Family" switch above Finance, Menu and Plans; hidden for people without a family
export default function ScopeSwitch() {
  const { t } = useT();
  const { overview, scope, setScope, canEdit } = useFamily();
  const family = overview?.family;
  if (!family) return null;

  return (
    <div data-testid="scope-switch" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }} role="radiogroup" aria-label={t('family.scopeLabel')}>
      <Chip role="radio" aria-checked={scope === 'personal'} active={scope === 'personal'} onClick={() => setScope('personal')}>
        {t('family.scopeMine')}
      </Chip>
      <Chip role="radio" aria-checked={scope === 'family'} active={scope === 'family'} onClick={() => setScope('family')}>
        {t('family.scopeFamily', { name: family.name })}
      </Chip>
      {!canEdit && <Pill>{t('family.viewOnly')}</Pill>}
    </div>
  );
}
