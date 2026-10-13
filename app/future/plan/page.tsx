'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import type { DateTimeFormatOptions } from 'next-intl';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { tasksApi, Task } from '@/lib/api';
import { addDays, parseISODate, startOfWeek, today, weekDates } from '@/lib/dates';
import { Card, Btn, GlassInput, Pill, ErrorMsg, StateMsg } from '@/components/ui';

function TaskRow({ task, onToggle, onRemove }: { task: Task; onToggle: () => void; onRemove: () => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const notes = task.notes.split('\n').filter(Boolean);

  return (
    <div data-testid="task" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '9px 0', borderTop: '1px dashed var(--stroke-2)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <button
          type="button"
          role="checkbox"
          aria-checked={task.done}
          aria-label={task.title}
          onClick={onToggle}
          style={{
            flex: 'none',
            marginTop: 1,
            width: 20,
            height: 20,
            borderRadius: 7,
            padding: 0,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 800,
            background: task.done ? 'var(--accent)' : 'transparent',
            color: task.done ? 'var(--accent-ink)' : 'transparent',
            border: `1.5px solid ${task.done ? 'var(--accent)' : 'var(--ink-2)'}`,
          }}
        >
          ✓
        </button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere', color: task.done ? 'var(--ink-2)' : 'inherit', textDecoration: task.done ? 'line-through' : 'none' }}>
            {task.title}
          </span>
          {(task.source !== 'manual' || notes.length > 0) && (
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              {task.source !== 'manual' && <Pill style={{ fontSize: 10, padding: '3px 8px' }}>{t(`future.source.${task.source}`)}</Pill>}
              {notes.length > 0 && (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: 'var(--accent-deep)' }}
                >
                  {open ? t('future.hideDetails') : t('future.showDetails', { count: notes.length })}
                </button>
              )}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label={`${t('common.remove')} ${task.title}`}
          onClick={onRemove}
          style={{ flex: 'none', width: 26, height: 26, borderRadius: 8, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--ink-2)', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      {open && (
        <ul style={{ margin: '0 0 0 30px', padding: 0, listStyle: 'disc', fontSize: 12, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {notes.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddTask({ date, label, onAdd }: { date: string; label: string; onAdd: (date: string, title: string) => Promise<void> }) {
  const { t } = useT();
  const [title, setTitle] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd(date, title.trim());
    setTitle('');
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
      <GlassInput aria-label={t('future.addFor', { day: label })} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('future.addPlaceholder')} maxLength={200} style={{ padding: '9px 12px', fontSize: 13 }} />
      <Btn variant="primary" type="submit" disabled={!title.trim()} aria-label={t('future.add')} style={{ padding: '9px 13px' }}>
        +
      </Btn>
    </form>
  );
}

function PlanPageContent() {
  const { t, format } = useT();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      tasksApi
        .list(weekStart, addDays(weekStart, 6))
        .then(setTasks)
        .catch(() => setError(t('future.loadError'))),
    [weekStart, t],
  );

  useEffect(() => {
    setTasks(null);
    load();
  }, [load]);

  const add = async (date: string, title: string) => {
    try {
      const task = await tasksApi.create({ title, date });
      setTasks((prev) => (prev ? [...prev, task] : prev));
    } catch {
      setError(t('future.saveError'));
    }
  };

  // optimistic: flip at once, undo if the API refuses
  const toggle = async (task: Task) => {
    setTasks((prev) => prev?.map((x) => (x.id === task.id ? { ...x, done: !task.done } : x)) ?? prev);
    try {
      await tasksApi.update(task.id, { done: !task.done });
    } catch {
      setTasks((prev) => prev?.map((x) => (x.id === task.id ? { ...x, done: task.done } : x)) ?? prev);
    }
  };

  const remove = async (task: Task) => {
    setTasks((prev) => prev?.filter((x) => x.id !== task.id) ?? prev);
    try {
      await tasksApi.remove(task.id);
    } catch {
      load();
    }
  };

  if (error) return <ErrorMsg>{error}</ErrorMsg>;

  const todayIso = today();
  const days = weekDates(weekStart);
  const short = (iso: string, opts: DateTimeFormatOptions) => format.dateTime(parseISODate(iso), opts);
  const openCount = tasks?.filter((x) => !x.done).length ?? 0;
  const isCurrentWeek = weekStart === startOfWeek(todayIso);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
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

      {!tasks ? (
        <StateMsg>{t('common.loading')}</StateMsg>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12, alignItems: 'stretch' }}>
          {days.map((date) => {
            const dayTasks = tasks.filter((x) => x.date === date);
            const isToday = date === todayIso;
            const longLabel = short(date, { weekday: 'long', day: 'numeric', month: 'long' });
            return (
              <Card
                key={date}
                as="section"
                data-testid={`plan-day-${date}`}
                aria-label={longLabel}
                style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4, border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--stroke)' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isToday ? 'var(--accent-deep)' : 'var(--ink-2)' }}>
                      {isToday ? t('future.today') : short(date, { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>{short(date, { day: 'numeric', month: 'short' })}</div>
                  </div>
                  {dayTasks.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>
                      {dayTasks.filter((x) => x.done).length}/{dayTasks.length}
                    </span>
                  )}
                </div>
                {dayTasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('future.nothingPlanned')}</div>}
                {dayTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={() => toggle(task)} onRemove={() => remove(task)} />
                ))}
                <AddTask date={date} label={longLabel} onAdd={add} />
              </Card>
            );
          })}
        </div>
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
