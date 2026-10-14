'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { GlassInput } from '@/components/ui';

type Option = { id: number; name: string };

// Dropdown with a checkbox per ingredient; the list can be narrowed with a search box.
export default function IngredientFilter({
  options,
  selected,
  onChange,
}: {
  options: Option[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const term = query.trim().toLowerCase();
  const visible = term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.03em',
          padding: '9px 16px',
          borderRadius: 4,
          background: selected.length ? 'var(--ink)' : 'var(--glass-2)',
          color: selected.length ? 'var(--bg)' : 'var(--ink)',
          border: '1px solid var(--stroke-2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {t('food.ingredientsFilter')}
        {selected.length > 0 && ` · ${selected.length}`}
        <span aria-hidden style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 20,
            width: 'min(300px, calc(100vw - 32px))',
            padding: 10,
            borderRadius: 8,
            background: 'var(--bg)',
            border: '1px solid var(--stroke-2)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <GlassInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('food.ingredientsFilterSearch')} autoFocus style={{ padding: '10px 14px', fontSize: 13 }} />

          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {visible.length === 0 && <div style={{ padding: '10px 8px', fontSize: 13, color: 'var(--ink-2)' }}>{t('food.ingredientNoMatch')}</div>}
            {visible.map((o) => (
              <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} style={{ width: 16, height: 16, accentColor: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</span>
              </label>
            ))}
          </div>

          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} style={{ alignSelf: 'flex-start', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', padding: '4px 8px' }}>
              {t('food.clearSelection')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
