'use client';

import { useEffect, useRef, useState } from 'react';
import { ingredientsApi, Ingredient } from '@/lib/api';
import { useT } from '@/lib/i18n/context';
import { GlassInput } from '@/components/ui';

// Search-as-you-type ingredient selector: typing "po" lists every ingredient
// whose name contains "po"; picking one hands its id + name back to the form.
export default function IngredientPicker({
  name,
  onSelect,
  placeholder,
  invalid,
}: {
  name: string;
  invalid?: boolean;
  onSelect: (ingredient: { id: number; name: string } | null) => void;
  placeholder?: string;
}) {
  const { t, lang } = useT(); // lang: re-run the search when the language changes
  const [query, setQuery] = useState(name);
  const [results, setResults] = useState<Ingredient[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // keep the input in sync when the parent sets a name (e.g. AI-generated recipe);
  // a cleared selection keeps whatever the user is typing
  useEffect(() => {
    if (name) setQuery(name);
  }, [name]);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      ingredientsApi
        .search(term)
        .then((data) => {
          if (!cancelled) {
            setResults(data);
            setHighlight(0);
          }
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, lang, open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(name); // drop unconfirmed text, show the selected ingredient again
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [name]);

  const choose = (ing: Ingredient) => {
    onSelect({ id: ing.id, name: ing.name });
    setQuery(ing.name);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <GlassInput
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (name) onSelect(null); // text edited — previous selection no longer valid
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        style={invalid ? { borderColor: 'rgba(192,67,42,0.6)' } : undefined}
        role="combobox"
        aria-expanded={showDropdown}
      />
      {showDropdown && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 20,
            maxHeight: 260,
            overflowY: 'auto',
            margin: 0,
            padding: 6,
            listStyle: 'none',
            borderRadius: 8,
            background: 'var(--bg)',
            border: '1px solid var(--stroke-2)',
            boxShadow: 'var(--shadow)',
          }}
        >
          {loading && !results.length && <li style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-2)' }}>{t('food.ingredientSearching')}</li>}
          {!loading && !results.length && <li style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-2)' }}>{t('food.ingredientNoMatch')}</li>}
          {results.map((ing, i) => (
            <li
              key={ing.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(ing);
              }}
              onMouseEnter={() => setHighlight(i)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
                background: i === highlight ? 'var(--glass-2)' : 'transparent',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ing.name}</span>
              <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--ink-2)' }}>{t('units.kcal', { value: Math.round(Number(ing.caloriesPer100g)) })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
