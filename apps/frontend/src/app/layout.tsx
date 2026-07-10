import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider, themeNoFlashScript } from '../components/theme-provider';
import { AuthProvider } from '../lib/auth-context';

// Fonte moderna e amigável para SaaS (headings + corpo). Ver design system 3.3.
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans-var',
});

export const metadata: Metadata = {
  title: 'Agendamento — Barbearias, Salões e Estúdios',
  description:
    'Plataforma de agendamento e gestão para barbearias, salões e estúdios de tatuagem.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={sans.variable}>
      <head>
        {/* Evita flash de tema errado antes da hidratação. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
