'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { menuApi, recipesApi, WeekMenu, RecipeListItem, ApiError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import ConfirmDialog from '@/components/ConfirmDialog';
import DayColumn from '@/components/menu/DayColumn';
import ShoppingListDialog from '@/components/menu/ShoppingListDialog';
import { useT } from '@/lib/i18n/context';
import { addDays, parseISODate, startOfWeek, today } from '@/lib/dates';
import { DraftMeal, MealForm, dayToSave, emptyForm, isDayDirty, toDraft } from '@/lib/menu';
import { Card, Btn, ErrorMsg, StateMsg, Pill } from '@/components/ui';
import { useSlideDirection } from '@/lib/use-slide-direction';

type Editing = { date: string; draft: DraftMeal[]; form: MealForm };

function MenuPageContent() {
  const { t, lang, format } = useT();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  const [week, setWeek] = useState<WeekMenu | null>(null);
  const [liked, setLiked] = useState<RecipeListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);

  // quick clicks through weeks: only the latest request may update the page
  const requestId = useRef(0);
  const loadWeek = useCallback(() => {
    const id = ++requestId.current;
    return menuApi
      .getWeek(weekStart)
      .then((w) => {
        if (id === requestId.current) setWeek(w);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('food.menuError')));
  }, [weekStart, t]);

  // recipe names come back in the current language, so reload when it changes
  useEffect(() => {
    loadWeek();
  }, [loadWeek, lang]);

  // only liked recipes can be planned
  useEffect(() => {
    recipesApi
      .liked()
      .then(setLiked)
      .catch(() => setLiked([]));
  }, [lang]);

  // the old week stays on screen until the new one arrives, then slides in
  const slide = useSlideDirection(week?.weekStart);

  const editedDay = editing && week?.days.find((d) => d.date === editing.date);
  const dirty = !!(editing && editedDay && isDayDirty(editedDay.meals, editing.draft, editing.form));

  const startEdit = (date: string) => {
    const day = week?.days.find((d) => d.date === date);
    if (!day) return;
    setSaveError(null);
    setEditing({ date, draft: toDraft(day.meals), form: emptyForm() });
  };

  const stopEdit = () => {
    setEditing(null);
    setConfirmLeave(false);
    setSaveError(null);
  };

  // a click anywhere outside the day being edited
  const requestLeave = () => {
    if (dirty) setConfirmLeave(true);
    else stopEdit();
  };

  const addToDraft = () => {
    if (!editing || editing.form.recipeId === '') return;
    const recipe = liked.find((r) => r.id === editing.form.recipeId);
    const { mealType, recipeId, servings } = editing.form;
    setEditing({
      ...editing,
      draft: [...editing.draft, { key: `n${Date.now()}`, mealType, recipeId, servings, recipeName: recipe?.name ?? '' }],
      form: { ...editing.form, recipeId: '' },
    });
  };

  const saveDay = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      await menuApi.setDay(editing.date, dayToSave(editing.draft, editing.form));
      await loadWeek();
      stopEdit();
    } catch {
      setSaveError(t('food.addMealError'));
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorMsg>{error}</ErrorMsg>;
  if (!week) return <StateMsg>{t('common.loading')}</StateMsg>;

  const todayIso = today();
  const rangeLabel = `${format.dateTime(parseISODate(week.days[0].date), { day: 'numeric', month: 'short' })} – ${format.dateTime(parseISODate(week.days[6].date), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
  const isCurrentWeek = weekStart === startOfWeek(todayIso);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Card style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label={t('food.prevWeek')} style={{ padding: '9px 14px' }}>
            ←
          </Btn>
          <strong data-testid="week-range" style={{ fontSize: 15, minWidth: 150, textAlign: 'center' }}>
            {rangeLabel}
          </strong>
          <Btn onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label={t('food.nextWeek')} style={{ padding: '9px 14px' }}>
            →
          </Btn>
          {!isCurrentWeek && (
            <Btn onClick={() => setWeekStart(startOfWeek(todayIso))} style={{ padding: '9px 14px' }}>
              {t('food.thisWeek')}
            </Btn>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Pill accent>
            {t('food.weekTotal')}: {t('units.kcal', { value: Math.round(week.weekTotal.calories) })}
          </Pill>
          <Btn variant="primary" onClick={() => setShoppingOpen(true)}>
            {t('food.shoppingTitle')}
          </Btn>
        </div>
      </Card>

      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('food.menuHint')}</div>

      {/* while a day is edited this layer catches clicks and hovers everywhere else */}
      {editing && <div data-testid="edit-backdrop" className="menu-backdrop" onClick={requestLeave} />}

      <div className="week-slide-frame">
      <div key={week.weekStart} className="menu-week week-slide" data-testid="week-slide" data-dir={slide} data-editing={editing ? '1' : '0'}>
        {week.days.map((day) => {
          const isEdited = editing?.date === day.date;
          return (
            <DayColumn
              key={day.date}
              day={day}
              isToday={day.date === todayIso}
              locked={!!editing && !isEdited}
              onStartEdit={() => startEdit(day.date)}
              edit={
                isEdited && editing
                  ? {
                      draft: editing.draft,
                      form: editing.form,
                      liked,
                      saving,
                      error: saveError,
                      onFormChange: (form) => setEditing({ ...editing, form }),
                      onAddToDraft: addToDraft,
                      onRemoveFromDraft: (key) => setEditing({ ...editing, draft: editing.draft.filter((m) => m.key !== key) }),
                      onSave: saveDay,
                      onCancel: stopEdit,
                    }
                  : null
              }
            />
          );
        })}
      </div>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title={t('food.leaveTitle')}
        confirmLabel={t('food.leaveConfirm')}
        cancelLabel={t('food.leaveStay')}
        danger
        onConfirm={stopEdit}
        onCancel={() => setConfirmLeave(false)}
      >
        {t('food.leaveBody')}
      </ConfirmDialog>

      {shoppingOpen && <ShoppingListDialog initialWeek={weekStart} onClose={() => setShoppingOpen(false)} />}
    </main>
  );
}

export default function MenuPage() {
  return (
    <RequireAuth>
      <MenuPageContent />
    </RequireAuth>
  );
}
