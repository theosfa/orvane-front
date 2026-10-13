'use client';

import { useState, FormEvent } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useT } from '@/lib/i18n/context';
import { useFutureMock } from '@/lib/mock/future-context';
import { Card, Btn, GlassInput, Row } from '@/components/ui';

function TaskRow({ task, onToggle }: { task: { id: string; text: string; link: string; done: boolean }; onToggle: () => void }) {
  return (
    <Row onClick={onToggle} style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
      <div
        style={{
          flex: '0 0 auto', marginTop: 1, width: 20, height: 20, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800,
          background: task.done ? 'var(--accent)' : 'transparent',
          color: task.done ? 'var(--accent-ink)' : 'transparent',
          border: `1.5px solid ${task.done ? 'var(--accent)' : 'var(--ink-2)'}`,
        }}
      >
        ✓
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: task.done ? 'var(--ink-2)' : 'inherit', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</div>
        {task.link && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{task.link}</div>}
      </div>
    </Row>
  );
}

function PlanPageContent() {
  const { t } = useT();
  const { tasks, toggleTask, addTask } = useFutureMock();
  const [newTask, setNewTask] = useState('');

  const today = tasks.filter((t) => t.when === 'today');
  const week = tasks.filter((t) => t.when === 'week');
  const later = tasks.filter((t) => t.when === 'later');
  const openCount = tasks.filter((t) => !t.done).length;

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    addTask(newTask);
    setNewTask('');
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      <Card style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }} as="section">
        <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{t('future.planKicker')}</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{openCount}</div>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, flex: '1 1 320px' }}>
          <GlassInput value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder={t('future.addPlaceholder')} />
          <Btn variant="primary" type="submit">{t('future.add')}</Btn>
        </form>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, alignItems: 'start' }}>
        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>{t('future.today')}</h2>
          {today.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
          ))}
        </Card>

        <Card as="section" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>{t('future.thisWeek')}</h2>
          {week.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
          ))}

          {later.length > 0 && (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', margin: '18px 0 10px' }}>{t('future.later')}</h2>
              {later.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
              ))}
            </>
          )}
        </Card>
      </div>
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
