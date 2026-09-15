'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading) return <main className="page wrap state-msg">Загрузка…</main>;
  if (!user) return null;

  const initial = user.email[0]?.toUpperCase() ?? '?';

  return (
    <main className="page wrap" style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1>Профиль</h1>
      </div>

      <div className="card profile-card">
        <span className="avatar">{initial}</span>
        <div className="profile-info">
          <span className="profile-label">Email</span>
          <div className="profile-email">{user.email}</div>
        </div>
      </div>

      <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => { logout(); router.push('/'); }}>
        Выйти
      </button>
    </main>
  );
}
