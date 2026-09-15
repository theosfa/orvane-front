import { AuthProvider } from '@/lib/auth-context';
import Dock  from '@/components/Dock';
import './globals.css';

export const metadata = {
  title: 'Лад',
  description: 'Стол, Счёт и Путь в одном приложении',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          {children}
          <Dock />
        </AuthProvider>
      </body>
    </html>
  );
}
