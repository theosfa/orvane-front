'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { MAX_SERVINGS, clampServings } from '@/lib/servings';

// − N + control for the number of people
export default function ServingsStepper({ value, onChange, max = MAX_SERVINGS }: { value: number; onChange: (n: number) => void; max?: number }) {
  const { t } = useT();
  // what's typed; may be empty while the user retypes the number
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const button = {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: '1px solid var(--stroke-2)',
    background: 'var(--glass-2)',
    color: 'var(--ink)',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer',
  } as const;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button type="button" aria-label={t('food.fewerServings')} disabled={value <= 1} onClick={() => onChange(clampServings(value - 1))} style={button}>
        −
      </button>
      <input
        aria-label={t('food.servingsLabel')}
        type="number"
        min={1}
        max={max}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== '' && Number.isFinite(n)) onChange(Math.min(max, clampServings(n)));
        }}
        onBlur={() => setDraft(String(value))}
        style={{ width: 56, textAlign: 'center', fontFamily: 'inherit', fontSize: 16, fontWeight: 800, padding: '7px 4px', borderRadius: 12, background: 'var(--glass-3)', color: 'var(--ink)', border: '1px solid var(--stroke-2)' }}
      />
      <button type="button" aria-label={t('food.moreServings')} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} style={button}>
        +
      </button>
    </div>
  );
}
