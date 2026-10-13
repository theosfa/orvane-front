'use client';

import { useState, FormEvent } from 'react';
import { useT } from '@/lib/i18n/context';
import { Btn, GlassInput } from '@/components/ui';

export default function AddTask({ date, label, big, onAdd }: { date: string; label: string; big?: boolean; onAdd: (date: string, title: string) => Promise<void> }) {
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
      <GlassInput
        aria-label={t('future.addFor', { day: label })}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('future.addPlaceholder')}
        maxLength={200}
        style={big ? undefined : { padding: '9px 12px', fontSize: 13 }}
      />
      <Btn variant="primary" type="submit" disabled={!title.trim()} aria-label={t('future.add')} style={{ padding: big ? '12px 18px' : '9px 13px' }}>
        +
      </Btn>
    </form>
  );
}
