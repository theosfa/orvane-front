'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';
import { menuApi, tasksApi, ShoppingListItem, WeekMenu, Scope } from '@/lib/api';
import { addDays, parseISODate, today } from '@/lib/dates';
import { printShoppingList, shoppingLines, shoppingText } from '@/lib/shopping';
import { Btn, Card, GlassInput, ErrorMsg, StateMsg } from '@/components/ui';
import { useSlideDirection } from '@/lib/use-slide-direction';

type Status = { kind: 'ok' | 'error'; text: string; planLink?: boolean } | null;

// 1) pick the days (any week), 2) get the list for them, 3) copy / print as PDF / send to Plans
// scope: the personal or the family menu — the list goes to the matching Plans.
// canAddToPlan: family members who only view can't add tasks to the family's Plans
export default function ShoppingListDialog({
  initialWeek,
  scope = 'personal',
  canAddToPlan = true,
  onClose,
}: {
  initialWeek: string;
  scope?: Scope;
  canAddToPlan?: boolean;
  onClose: () => void;
}) {
  const { t, lang, format } = useT();
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [week, setWeek] = useState<WeekMenu | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ShoppingListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planDate, setPlanDate] = useState(today());
  const [status, setStatus] = useState<Status>(null);

  // the shown week stays until the next one has loaded, then slides in
  useEffect(() => {
    let current = true;
    menuApi
      .getWeek(weekStart, scope)
      .then((w) => {
        if (current) setWeek(w);
      })
      .catch(() => setError(t('food.menuError')));
    return () => {
      current = false;
    };
  }, [weekStart, scope, t]);
  const slide = useSlideDirection(week?.weekStart);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dates = useMemo(() => Array.from(selected).sort(), [selected]);
  const short = (iso: string) => format.dateTime(parseISODate(iso), { weekday: 'short', day: 'numeric', month: 'short' });

  const title = useMemo(() => {
    if (!dates.length) return t('food.shoppingTitle');
    const range = dates.length === 1 ? short(dates[0]) : `${short(dates[0])} – ${short(dates[dates.length - 1])}`;
    return t('food.shoppingListFor', { range });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, t, format]);

  const lines = useMemo(() => (items ? shoppingLines(items, (value) => t('units.grams', { value })) : []), [items, t]);

  const toggle = (date: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const generate = async () => {
    setError(null);
    setLoading(true);
    try {
      setItems(await menuApi.shoppingList(dates, scope));
      setStatus(null);
    } catch {
      setError(t('food.shopError'));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shoppingText(title, lines));
      setStatus({ kind: 'ok', text: t('food.copied') });
    } catch {
      setStatus({ kind: 'error', text: t('food.copyFailed') });
    }
  };

  const exportPdf = () => {
    if (!printShoppingList(title, lines, lang)) setStatus({ kind: 'error', text: t('food.popupBlocked') });
  };

  const addToPlan = async () => {
    try {
      await tasksApi.create({ title, notes: lines.join('\n'), date: planDate, source: 'food' }, scope);
      setStatus({ kind: 'ok', text: t('food.addedToPlan', { day: short(planDate) }), planLink: true });
    } catch {
      setStatus({ kind: 'error', text: t('food.addToPlanFailed') });
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.35)' }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-label={t('food.shoppingTitle')}
        style={{ width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--glass-3)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <strong style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{items ? title : t('food.pickDays')}</strong>
          <button type="button" aria-label={t('common.close')} onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--ink-2)', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {!items ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Btn onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label={t('food.prevWeek')} style={{ padding: '8px 12px' }}>
                ←
              </Btn>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {short(weekStart)} – {short(addDays(weekStart, 6))}
              </span>
              <Btn onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label={t('food.nextWeek')} style={{ padding: '8px 12px' }}>
                →
              </Btn>
            </div>
            {!week && <StateMsg>{t('common.loading')}</StateMsg>}
            {week && (
              <div className="week-slide-frame">
              <div key={week.weekStart} className="week-slide" data-dir={slide} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {week.days.map((d) => (
                  <label
                    key={d.date}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, background: selected.has(d.date) ? 'var(--accent-tint)' : 'var(--glass-2)', cursor: 'pointer', fontSize: 14 }}
                  >
                    <input type="checkbox" checked={selected.has(d.date)} onChange={() => toggle(d.date)} aria-label={short(d.date)} />
                    <span style={{ flex: 1, fontWeight: 700 }}>{short(d.date)}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{d.meals.length ? t('food.mealsCount', { count: d.meals.length }) : t('food.noMealsShort')}</span>
                  </label>
                ))}
              </div>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('food.daysSelected', { count: selected.size })}</div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <Btn variant="primary" onClick={generate} disabled={!selected.size || loading}>
              {loading ? t('food.gathering') : t('food.gather')}
            </Btn>
          </>
        ) : (
          <>
            {items.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{t('food.shopEmptyBody')}</div>
            ) : (
              <ul data-testid="shopping-items" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {items.map((item, i) => (
                  <li key={item.ingredientId} style={{ padding: '9px 0', borderBottom: '1px dashed var(--stroke-2)', fontSize: 14 }}>
                    {lines[i]}
                  </li>
                ))}
              </ul>
            )}

            {items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Btn onClick={copy}>{t('food.copyList')}</Btn>
                  <Btn onClick={exportPdf}>{t('food.exportPdf')}</Btn>
                </div>
                {canAddToPlan && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <GlassInput type="date" aria-label={t('food.buyOn')} value={planDate} onChange={(e) => setPlanDate(e.target.value)} required style={{ width: 170 }} />
                  <Btn variant="primary" onClick={addToPlan} disabled={!planDate}>
                    {t('food.addToPlan')}
                  </Btn>
                </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{t('food.pdfHint')}</div>
              </div>
            )}

            {status && (
              <div role="status" style={{ fontSize: 13, fontWeight: 700, color: status.kind === 'ok' ? 'var(--accent-deep)' : '#c0432a' }}>
                {status.text}{' '}
                {status.planLink && (
                  <Link href="/future/plan" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    {t('food.openPlans')}
                  </Link>
                )}
              </div>
            )}

            <Btn
              onClick={() => {
                setItems(null);
                setStatus(null);
              }}
            >
              {t('food.changeDays')}
            </Btn>
          </>
        )}
      </Card>
    </div>
  );
}
