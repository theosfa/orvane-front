'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/lib/i18n/context';
import type { Scope, Task } from '@/lib/api';
import { parseISODate, today } from '@/lib/dates';
import { useSlideDirection } from '@/lib/use-slide-direction';
import TaskRow from './TaskRow';
import AddTask from './AddTask';
import { StateMsg } from '@/components/ui';

type Props = {
  date: string;
  scope: Scope;
  readOnly: boolean;
  tasks: Task[] | null; // null while that day's week is loading
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAdd: (date: string, title: string) => Promise<void>;
  onToggle: (task: Task) => void;
  onRemove: (task: Task) => void;
};

// One day opened in a pop-up over the dimmed Plans page: every task readable at full size,
// details shown. ←/→ move to the neighbouring day; Escape, × or a click on the dark area closes.
export default function DayFocus({ date, scope, readOnly, tasks, onClose, onPrev, onNext, onAdd, onToggle, onRemove }: Props) {
  const { t, format } = useT();
  const slide = useSlideDirection(date);
  const longLabel = format.dateTime(parseISODate(date), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isToday = date === today();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // arrows only when not typing a new task
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === 'Escape') onClose();
      else if (!typing && e.key === 'ArrowLeft') onPrev();
      else if (!typing && e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  // the page underneath shouldn't scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const navBtn = {
    width: 42,
    height: 42,
    borderRadius: 6,
    border: '1px solid var(--stroke-2)',
    background: 'var(--glass-2)',
    color: 'var(--ink)',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer',
    flex: 'none',
  } as const;

  return createPortal(
    <div
      data-testid="day-focus-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 4vw, 48px)',
        background: 'rgba(10, 12, 16, 0.55)',
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={longLabel}
        data-testid="day-focus"
        className="day-focus"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--r-lg)',
          background: 'var(--bg)',
          color: 'var(--ink)',
          border: '1px solid var(--stroke)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px clamp(14px, 3vw, 28px)', borderBottom: '1px solid var(--stroke-2)' }}>
          <button type="button" aria-label={t('future.prevDay')} onClick={onPrev} style={navBtn}>
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            {isToday && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-deep)' }}>{t('future.today')}</div>}
            <h2 style={{ margin: 0, fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, letterSpacing: '-0.03em' }}>{longLabel}</h2>
          </div>
          <button type="button" aria-label={t('future.nextDay')} onClick={onNext} style={navBtn}>
            →
          </button>
          <button type="button" aria-label={t('common.close')} onClick={onClose} style={{ ...navBtn, marginLeft: 6 }}>
            ×
          </button>
        </header>

        <div className="week-slide-frame" style={{ flex: 1, overflowY: 'auto' }}>
          <div key={date} className="week-slide" data-dir={slide} style={{ width: '100%', padding: '16px clamp(14px, 3vw, 28px) 28px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tasks === null ? (
              <StateMsg>{t('common.loading')}</StateMsg>
            ) : (
              <>
                {tasks.length === 0 && <div style={{ fontSize: 15, color: 'var(--ink-2)', padding: '12px 0' }}>{t('future.nothingPlanned')}</div>}
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} full scope={scope} readOnly={readOnly} onToggle={() => onToggle(task)} onRemove={() => onRemove(task)} />
                ))}
                {!readOnly && <AddTask date={date} label={longLabel} big onAdd={onAdd} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
