'use client';

import { useCallback, useEffect, useState, MouseEvent } from 'react';
import type { DateTimeFormatOptions } from 'next-intl';
import RequireAuth from '@/components/RequireAuth';
import TaskRow from '@/components/plans/TaskRow';
import AddTask from '@/components/plans/AddTask';
import DayFocus from '@/components/plans/DayFocus';
import { useT } from '@/lib/i18n/context';
import { tasksApi, Task } from '@/lib/api';
import { addDays, parseISODate, startOfWeek, today, weekDates } from '@/lib/dates';
import { Card, Btn, ErrorMsg, StateMsg } from '@/components/ui';
import { useSlideDirection } from '@/lib/use-slide-direction';
import { useFamily } from '@/lib/family-context';
import { useFamilyLive } from '@/lib/family-live';
import ScopeSwitch from '@/components/ScopeSwitch';

// clicks on the task controls inside a day shouldn't open the day
const isControl = (e: MouseEvent) => !!(e.target as HTMLElement).closest('button, a, input, form, label');

function PlanPageContent() {
  const { t, format } = useT();
  // personal or family plans; family members who aren't admins only look
  const { scope, canEdit } = useFamily();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  const [tasks, setTasks] = useState<Task[] | null>(null);
  // the week whose tasks are on screen; it changes only once the next week has loaded
  const [shownWeek, setShownWeek] = useState<string | null>(null);
  const slide = useSlideDirection(shownWeek ?? undefined);
  const [error, setError] = useState<string | null>(null);
  // the day opened over the whole screen
  const [focusDate, setFocusDate] = useState<string | null>(null);

  const load = useCallback(() => {
    let current = true;
    tasksApi
      .list(weekStart, addDays(weekStart, 6), scope)
      .then((list) => {
        if (!current) return;
        setTasks(list);
        setShownWeek(weekStart);
      })
      .catch(() => setError(t('future.loadError')));
    return () => {
      current = false;
    };
  }, [weekStart, scope, t]);

  useEffect(load, [load]);
  // another family member changed the shared plans
  useFamilyLive('tasks', () => scope === 'family' && load());

  const add = async (date: string, title: string) => {
    try {
      const task = await tasksApi.create({ title, date }, scope);
      setTasks((prev) => (prev ? [...prev, task] : prev));
    } catch {
      setError(t('future.saveError'));
    }
  };

  // optimistic: flip at once, undo if the API refuses
  const toggle = async (task: Task) => {
    setTasks((prev) => prev?.map((x) => (x.id === task.id ? { ...x, done: !task.done } : x)) ?? prev);
    try {
      await tasksApi.update(task.id, { done: !task.done }, scope);
    } catch {
      setTasks((prev) => prev?.map((x) => (x.id === task.id ? { ...x, done: task.done } : x)) ?? prev);
    }
  };

  const remove = async (task: Task) => {
    setTasks((prev) => prev?.filter((x) => x.id !== task.id) ?? prev);
    try {
      await tasksApi.remove(task.id, scope);
    } catch {
      load();
    }
  };

  // stepping past Sunday/Monday in the opened day loads the neighbouring week behind it
  const moveFocus = useCallback(
    (days: number) => {
      if (!focusDate) return;
      const next = addDays(focusDate, days);
      setFocusDate(next);
      setWeekStart(startOfWeek(next));
    },
    [focusDate],
  );
  const closeFocus = useCallback(() => setFocusDate(null), []);
  const prevDay = useCallback(() => moveFocus(-1), [moveFocus]);
  const nextDay = useCallback(() => moveFocus(1), [moveFocus]);

  if (error) return <ErrorMsg>{error}</ErrorMsg>;

  const todayIso = today();
  const days = weekDates(shownWeek ?? weekStart);
  const short = (iso: string, opts: DateTimeFormatOptions) => format.dateTime(parseISODate(iso), opts);
  const openCount = tasks?.filter((x) => !x.done).length ?? 0;
  const isCurrentWeek = weekStart === startOfWeek(todayIso);
  const focusTasks = focusDate && tasks && shownWeek === startOfWeek(focusDate) ? tasks.filter((x) => x.date === focusDate) : null;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <ScopeSwitch />
      <Card style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label={t('future.prevWeek')} style={{ padding: '9px 14px' }}>
            ←
          </Btn>
          <strong data-testid="week-range" style={{ fontSize: 15, minWidth: 150, textAlign: 'center' }}>
            {short(days[0], { day: 'numeric', month: 'short' })} – {short(days[6], { day: 'numeric', month: 'short', year: 'numeric' })}
          </strong>
          <Btn onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label={t('future.nextWeek')} style={{ padding: '9px 14px' }}>
            →
          </Btn>
          {!isCurrentWeek && (
            <Btn onClick={() => setWeekStart(startOfWeek(todayIso))} style={{ padding: '9px 14px' }}>
              {t('future.thisWeek')}
            </Btn>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t('future.openCount', { count: openCount })}</div>
      </Card>

      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{canEdit ? t('future.planHint') : t('family.plansViewOnly')}</div>

      {!tasks ? (
        <StateMsg>{t('common.loading')}</StateMsg>
      ) : (
        <div className="week-slide-frame">
          <div key={shownWeek} className="week-columns week-slide" data-testid="week-slide" data-dir={slide}>
            {days.map((date) => {
              const dayTasks = tasks.filter((x) => x.date === date);
              const isToday = date === todayIso;
              const longLabel = short(date, { weekday: 'long', day: 'numeric', month: 'long' });
              return (
                <div key={date} className="week-column">
                  <Card
                    as="section"
                    data-testid={`plan-day-${date}`}
                    aria-label={longLabel}
                    onClick={(e: MouseEvent) => {
                      if (!isControl(e)) setFocusDate(date);
                    }}
                    style={{
                      height: '100%',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      cursor: 'zoom-in',
                      border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--stroke)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isToday ? 'var(--accent-deep)' : 'var(--ink-2)' }}>
                          {isToday ? t('future.today') : short(date, { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{short(date, { day: 'numeric', month: 'short' })}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {dayTasks.length > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>
                            {dayTasks.filter((x) => x.done).length}/{dayTasks.length}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={t('future.openDay', { day: longLabel })}
                          title={t('future.openDay', { day: longLabel })}
                          onClick={() => setFocusDate(date)}
                          style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--ink-2)', cursor: 'pointer', fontSize: 13 }}
                        >
                          ⤢
                        </button>
                      </div>
                    </div>
                    {dayTasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('future.nothingPlanned')}</div>}
                    {dayTasks.map((task) => (
                      <TaskRow key={task.id} task={task} scope={scope} readOnly={!canEdit} onToggle={() => toggle(task)} onRemove={() => remove(task)} />
                    ))}
                    {canEdit && <AddTask date={date} label={longLabel} onAdd={add} />}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {focusDate && (
        <DayFocus
          date={focusDate}
          scope={scope}
          readOnly={!canEdit}
          tasks={focusTasks}
          onClose={closeFocus}
          onPrev={prevDay}
          onNext={nextDay}
          onAdd={add}
          onToggle={toggle}
          onRemove={remove}
        />
      )}
    </main>
  );
}

export default function FuturePlanPage() {
  return (
    <RequireAuth>
      <PlanPageContent />
    </RequireAuth>
  );
}
