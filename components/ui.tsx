'use client';

import { CSSProperties, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Shared visual primitives for the "glass" design system (bloom background,
// frosted panels, pill controls) — ported from the FFF design mockup's
// inline-style tokens (var(--glass), var(--r-lg), etc. in globals.css).

export function Bloom() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: -180, left: -120, width: 620, height: 620, borderRadius: '50%', background: 'var(--bloom-a)', filter: 'blur(130px)' }} />
      <div style={{ position: 'absolute', top: 220, right: -200, width: 680, height: 680, borderRadius: '50%', background: 'var(--bloom-c)', filter: 'blur(150px)' }} />
      <div style={{ position: 'absolute', bottom: -260, left: '38%', width: 700, height: 700, borderRadius: '50%', background: 'var(--bloom-b)', filter: 'blur(150px)' }} />
    </div>
  );
}

export function Card({ children, style, as: As = 'div', ...rest }: { children: ReactNode; style?: CSSProperties; as?: 'div' | 'section' | 'article' | 'aside' } & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      data-card
      style={{
        padding: 22,
        borderRadius: 'var(--r-lg)',
        background: 'var(--glass)',
        WebkitBackdropFilter: 'blur(26px) saturate(180%)',
        backdropFilter: 'blur(26px) saturate(180%)',
        border: '1px solid var(--stroke)',
        boxShadow: 'var(--shadow)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
}

type BtnVariant = 'primary' | 'ghost';

export function Btn({
  variant = 'ghost',
  style,
  children,
  ...rest
}: { variant?: BtnVariant; style?: CSSProperties; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base: CSSProperties =
    variant === 'primary'
      ? { background: 'var(--accent)', color: 'var(--accent-ink)', border: 0 }
      : { background: 'var(--glass-2)', color: 'var(--ink)', border: '1px solid var(--stroke-2)' };
  return (
    <button
      data-btn={variant}
      type="button"
      style={{
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: '12px 20px',
        borderRadius: 16,
        cursor: 'pointer',
        ...base,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chip({ active, children, style, ...rest }: { active?: boolean; children: ReactNode; style?: CSSProperties } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      data-chip
      data-active={active ? '1' : '0'}
      type="button"
      style={{
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.03em',
        padding: '9px 16px',
        borderRadius: 999,
        background: active ? 'var(--ink)' : 'var(--glass-2)',
        color: active ? 'var(--bg)' : 'var(--ink)',
        border: '1px solid var(--stroke-2)',
        cursor: 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Row({ children, style, ...rest }: { children: ReactNode; style?: CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-row style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 10px', ...style }} {...rest}>
      {children}
    </div>
  );
}

export function GlassInput({ style, ...rest }: { style?: CSSProperties } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        fontFamily: 'inherit',
        fontSize: 14,
        padding: '13px 16px',
        borderRadius: 16,
        background: 'var(--glass-3)',
        color: 'var(--ink)',
        border: '1px solid var(--stroke-2)',
        outline: 'none',
        width: '100%',
        ...style,
      }}
      {...rest}
    />
  );
}

export function GlassTextarea({ style, ...rest }: { style?: CSSProperties } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      style={{
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.6,
        padding: '14px 16px',
        borderRadius: 16,
        background: 'var(--glass-3)',
        color: 'var(--ink)',
        border: '1px solid var(--stroke-2)',
        outline: 'none',
        resize: 'vertical',
        width: '100%',
        ...style,
      }}
      {...rest}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{label}</span>
      {children}
    </label>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{children}</div>;
}

export function Pill({ children, style, accent }: { children: ReactNode; style?: CSSProperties; accent?: boolean }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '5px 11px',
        borderRadius: 999,
        background: accent ? 'var(--accent)' : 'var(--glass-2)',
        color: accent ? 'var(--accent-ink)' : 'var(--ink)',
        border: accent ? 'none' : '1px solid var(--stroke-2)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Grid({ min = 240, children, style }: { min?: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 18, ...style }}>
      {children}
    </div>
  );
}

export function ErrorMsg({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: '#c0432a', background: 'rgba(192,67,42,0.1)', border: '1px solid rgba(192,67,42,0.25)', borderRadius: 14, padding: '11px 15px' }}>
      {children}
    </p>
  );
}

export function StateMsg({ children }: { children: ReactNode }) {
  return <p style={{ color: 'var(--ink-2)', fontSize: 14, padding: '48px 0', textAlign: 'center' }}>{children}</p>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card style={{ textAlign: 'center', padding: '56px 24px', border: '1px dashed var(--stroke-2)' }}>
      <strong style={{ display: 'block', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{title}</strong>
      <span style={{ color: 'var(--ink-2)', fontSize: 13 }}>{children}</span>
    </Card>
  );
}
