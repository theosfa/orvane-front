'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';
import { MAX_MENU_SERVINGS, MenuDay, RecipeListItem } from '@/lib/api';
import { DraftMeal, MEAL_TYPES, MealForm } from '@/lib/menu';
import { parseISODate } from '@/lib/dates';
import { Btn, Card, GlassSelect } from '@/components/ui';

type EditProps = {
  draft: DraftMeal[];
  form: MealForm;
  liked: RecipeListItem[];
  saving: boolean;
  error: string | null;
  onFormChange: (form: MealForm) => void;
  onAddToDraft: () => void;
  onRemoveFromDraft: (key: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

type Props = {
  day: MenuDay;
  isToday: boolean;
  // set while this day is the one being edited
  edit: EditProps | null;
  // another day is being edited: this one stays as it is (no hover, no click)
  locked: boolean;
  onStartEdit: () => void;
};

const selectStyle = { width: '100%', padding: '10px 12px', fontSize: 13 };

function EditForm({ edit }: { edit: EditProps }) {
  const { t } = useT();
  const { draft, form, liked } = edit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {draft.map((m) => (
        <div key={m.key} data-testid="draft-meal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderRadius: 12, background: 'var(--glass-2)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>
              {t(`meals.${m.mealType}`)} · {t('food.forPeople', { count: m.servings })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.recipeName}</div>
          </div>
          <button
            type="button"
            aria-label={`${t('common.remove')} ${m.recipeName}`}
            onClick={() => edit.onRemoveFromDraft(m.key)}
            style={{ flex: 'none', width: 28, height: 28, borderRadius: 9, border: '1px solid var(--stroke-2)', background: 'var(--glass-3)', color: 'var(--ink-2)', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      ))}

      {liked.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
          {t('food.likeFirst')}{' '}
          <Link href="/recipes/feed" style={{ fontWeight: 700, color: 'var(--accent-deep)' }}>
            {t('nav.food.feed')} →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <GlassSelect aria-label={t('food.mealType')} value={form.mealType} onChange={(e) => edit.onFormChange({ ...form, mealType: e.target.value as MealForm['mealType'] })} style={selectStyle}>
            {MEAL_TYPES.map((mt) => (
              <option key={mt} value={mt}>
                {t(`meals.${mt}`)}
              </option>
            ))}
          </GlassSelect>
          <GlassSelect
            aria-label={t('food.chooseRecipe')}
            value={form.recipeId}
            onChange={(e) => edit.onFormChange({ ...form, recipeId: e.target.value ? Number(e.target.value) : '' })}
            style={selectStyle}
          >
            <option value="">{t('food.chooseLikedRecipe')}</option>
            {liked.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </GlassSelect>
          <GlassSelect aria-label={t('food.people')} value={form.servings} onChange={(e) => edit.onFormChange({ ...form, servings: Number(e.target.value) })} style={selectStyle}>
            {Array.from({ length: MAX_MENU_SERVINGS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {t('food.forPeople', { count: n })}
              </option>
            ))}
          </GlassSelect>
          <Btn onClick={edit.onAddToDraft} disabled={form.recipeId === ''} style={{ padding: '9px 14px' }}>
            {t('food.addAnother')}
          </Btn>
        </div>
      )}

      {edit.error && <div style={{ fontSize: 12, color: '#c0432a' }}>{edit.error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn variant="primary" onClick={edit.onSave} disabled={edit.saving} style={{ flex: 1, padding: '10px 12px' }}>
          {edit.saving ? t('food.saving') : t('food.submitDay')}
        </Btn>
        <Btn onClick={edit.onCancel} style={{ flex: 1, padding: '10px 12px' }}>
          {t('common.cancel')}
        </Btn>
      </div>
    </div>
  );
}

const DayColumn = forwardRef<HTMLDivElement, Props>(function DayColumn({ day, isToday, edit, locked, onStartEdit }, ref) {
  const { t, format } = useT();
  const date = parseISODate(day.date);
  const weekday = format.dateTime(date, { weekday: 'short' });
  const dayMonth = format.dateTime(date, { day: 'numeric', month: 'short' });
  const longLabel = format.dateTime(date, { weekday: 'long', day: 'numeric', month: 'long' });
  const editing = !!edit;

  return (
    <div
      ref={ref}
      className="week-column"
      data-testid={`day-${day.date}`}
      data-expanded={editing ? '1' : '0'}
      data-locked={locked ? '1' : '0'}
      style={{ position: 'relative', zIndex: editing ? 31 : undefined }}
    >
      <Card
        role={editing ? 'group' : 'button'}
        tabIndex={editing ? undefined : 0}
        aria-label={editing ? longLabel : t('food.editDay', { day: longLabel })}
        onClick={editing || locked ? undefined : onStartEdit}
        onKeyDown={(e) => {
          if (!editing && !locked && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onStartEdit();
          }
        }}
        style={{
          height: '100%',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          cursor: editing ? 'default' : 'pointer',
          border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--stroke)',
          boxShadow: editing ? 'var(--shadow-lg)' : 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isToday ? 'var(--accent-deep)' : 'var(--ink-2)' }}>{weekday}</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{dayMonth}</div>
          </div>
          {day.meals.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{t('units.kcal', { value: Math.round(day.total.calories) })}</div>}
        </div>

        {editing ? (
          <EditForm edit={edit} />
        ) : day.meals.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('food.noMealsShort')}</div>
        ) : (
          day.meals.map((m) => (
            <div key={m.entryId} data-testid="meal" style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 8, borderTop: '1px dashed var(--stroke-2)', minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t(`meals.${m.mealType}`)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.recipeName}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                {t('food.forPeople', { count: m.servings })} · {t('food.perPerson', { value: Math.round(m.calories) })}
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
});

export default DayColumn;
