import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const geist = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'WorldCupIQ — Test Your World Cup Knowledge',
  description:
    'The ultimate World Cup 2026 trivia app. Daily challenges, AI coaching, leaderboards, and more.',
  openGraph: {
    title: 'WorldCupIQ',
    description: 'Ultimate World Cup 2026 trivia. How well do you know the beautiful game?',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
