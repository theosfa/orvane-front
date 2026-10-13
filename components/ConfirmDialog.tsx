'use client';

import { ReactNode, useEffect } from 'react';
import { Card, Btn } from './ui';

// Modal yes/no question. Escape and a click on the backdrop count as "no".
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      data-dialog-backdrop
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.35)' }}
    >
      <Card role="alertdialog" aria-modal="true" aria-label={title} style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--glass-3)' }}>
        <strong style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</strong>
        {children && <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{children}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <Btn onClick={onCancel}>{cancelLabel}</Btn>
          <Btn variant="primary" onClick={onConfirm} autoFocus style={danger ? { background: '#c0432a', color: '#fff' } : undefined}>
            {confirmLabel}
          </Btn>
        </div>
      </Card>
    </div>
  );
}
