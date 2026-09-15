'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type DockItem = {
  href: string;
  label: string;
  icon: string; // emoji keeps this dependency-free; swap for SVGs later if you want
};

const BASE_ITEMS: DockItem[] = [
  { href: '/', label: 'Главная', icon: '🏠' },
  { href: '/recipes', label: 'Рецепты', icon: '🍲' },
  { href: '/ingredients', label: 'Продукты', icon: '🥕' },
];

const MAX_SCALE = 1.6;
const SPREAD = 90; // px, how far the magnify effect reaches from the cursor

export default function Dock() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const items: DockItem[] = user
    ? [
        { href: '/dashboard', label: 'Сегодня', icon: '🏡' },
        ...BASE_ITEMS,
        { href: '/profile', label: 'Профиль', icon: '👤' },
      ]
    : [...BASE_ITEMS, { href: '/login', label: 'Войти', icon: '🔑' }];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dockRef.current) return;
    setMouseX(e.clientX - dockRef.current.getBoundingClientRect().left);
  };

  const scaleFor = (index: number, itemWidth: number) => {
    if (mouseX === null) return 1;
    const itemCenter = index * itemWidth + itemWidth / 2;
    const distance = Math.abs(mouseX - itemCenter);
    if (distance > SPREAD) return 1;
    const t = 1 - distance / SPREAD;
    return 1 + t * (MAX_SCALE - 1);
  };

  const ITEM_WIDTH = 64;

  return (
    <nav className="dock-wrap" aria-label="Основная навигация">
      <div
        ref={dockRef}
        className="dock"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouseX(null)}
      >
        {items.map((item, i) => {
          const active = pathname === item.href;
          const scale = scaleFor(i, ITEM_WIDTH);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dock-item ${active ? 'active' : ''}`}
              style={{
                transform: `scale(${scale}) translateY(${(scale - 1) * -14}px)`,
                zIndex: Math.round(scale * 10),
              }}
              title={item.label}
            >
              <span className="dock-icon">{item.icon}</span>
              <span className="dock-label">{item.label}</span>
              {active && <span className="dock-dot" />}
            </Link>
          );
        })}
        {user && (
          <button
            className="dock-item dock-logout"
            onClick={logout}
            title="Выйти"
            style={{ transform: `scale(${scaleFor(items.length, ITEM_WIDTH)})` }}
          >
            <span className="dock-icon">🚪</span>
            <span className="dock-label">Выйти</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .dock-wrap {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 100;
          pointer-events: none;
        }
        .dock {
          pointer-events: auto;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        .dock-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transform-origin: bottom center;
          transition: transform 0.12s ease-out, background 0.15s ease;
          cursor: pointer;
          border: none;
          font-family: inherit;
        }
        .dock-item:hover {
          background: rgba(255, 255, 255, 0.95);
        }
        .dock-item.active {
          background: rgba(255, 255, 255, 1);
        }
        .dock-icon {
          font-size: 22px;
          line-height: 1;
        }
        .dock-label {
          position: absolute;
          bottom: 58px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          white-space: nowrap;
          background: rgba(20, 20, 20, 0.85);
          color: #fff;
          padding: 3px 8px;
          border-radius: 6px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.12s ease;
        }
        .dock-item:hover .dock-label {
          opacity: 1;
        }
        .dock-dot {
          position: absolute;
          bottom: -6px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--food, #d97757);
        }
        .dock-logout {
          margin-left: 4px;
        }
      `}</style>
    </nav>
  );
}
