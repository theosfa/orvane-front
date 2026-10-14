'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';
import type { Scope, Task } from '@/lib/api';
import { settleHref } from '@/lib/settle';
import { Pill } from '@/components/ui';

// One to-do. Compact in the week columns; `full` in the opened day (bigger, details shown).
// readOnly: a family member who isn't an admin — sees the task, can't change it
export default function TaskRow({
  task,
  full,
  scope = 'personal',
  readOnly,
  onToggle,
  onRemove,
}: {
  task: Task;
  full?: boolean;
  scope?: Scope;
  readOnly?: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(!!full);
  const notes = task.notes.split('\n').filter(Boolean);
  const box = full ? 24 : 20;

  return (
    <div data-testid="task" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: full ? '14px 0' : '9px 0', borderTop: '1px dashed var(--stroke-2)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: full ? 14 : 10 }}>
        <button
          type="button"
          role="checkbox"
          aria-checked={task.done}
          aria-label={task.title}
          aria-readonly={readOnly || undefined}
          disabled={readOnly}
          onClick={onToggle}
          style={{
            flex: 'none',
            marginTop: 1,
            width: box,
            height: box,
            borderRadius: 3,
            padding: 0,
            cursor: readOnly ? 'default' : 'pointer',
            fontSize: full ? 14 : 12,
            fontWeight: 800,
            background: task.done ? 'var(--accent)' : 'transparent',
            color: task.done ? 'var(--accent-ink)' : 'transparent',
            border: `1.5px solid ${task.done ? 'var(--accent)' : 'var(--ink-2)'}`,
          }}
        >
          ✓
        </button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontSize: full ? 17 : 13,
              fontWeight: full ? 700 : 600,
              overflowWrap: 'anywhere',
              color: task.done ? 'var(--ink-2)' : 'inherit',
              textDecoration: task.done ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </span>
          {(task.source !== 'manual' || notes.length > 0 || (full && !task.done && !readOnly)) && (
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {task.source !== 'manual' && <Pill style={{ fontSize: 10, padding: '3px 8px' }}>{t(`future.source.${task.source}`)}</Pill>}
              {notes.length > 0 && (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: full ? 12 : 11, fontWeight: 700, color: 'var(--accent-deep)' }}
                >
                  {open ? t('future.hideDetails') : t('future.showDetails', { count: notes.length })}
                </button>
              )}
              {full && !task.done && !readOnly && (
                <Link
                  href={settleHref(task, scope)}
                  style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 6, background: 'var(--accent)', color: 'var(--accent-ink)' }}
                >
                  {t('future.settle')}
                </Link>
              )}
            </span>
          )}
        </div>
        {!full && !task.done && !readOnly && (
          <Link
            href={settleHref(task, scope)}
            aria-label={`${t('future.settle')}: ${task.title}`}
            title={t('future.settle')}
            style={{ flex: 'none', width: 26, height: 26, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--accent-deep)' }}
          >
            €
          </Link>
        )}
        {!readOnly && (
          <button
            type="button"
            aria-label={`${t('common.remove')} ${task.title}`}
            onClick={onRemove}
            style={{ flex: 'none', width: full ? 32 : 26, height: full ? 32 : 26, borderRadius: 4, border: '1px solid var(--stroke-2)', background: 'var(--glass-2)', color: 'var(--ink-2)', cursor: 'pointer' }}
          >
            ×
          </button>
        )}
      </div>
      {open && notes.length > 0 && (
        <ul
          style={{
            margin: `0 0 0 ${full ? 38 : 30}px`,
            padding: 0,
            listStyle: 'disc',
            fontSize: full ? 14 : 12,
            color: 'var(--ink-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: full ? 6 : 3,
          }}
        >
          {notes.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
