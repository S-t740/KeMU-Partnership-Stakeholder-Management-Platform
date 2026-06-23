import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'KeMU Partnerships Hub | Partnership & Stakeholder Management Platform',
  description: 'Centralized stakeholder intelligence and relationship management platform for KeMU. Track partnerships, manage contacts, and mobilize resources.',
  keywords: 'stakeholder management, partnership development, donor relations, CRM, KeMU, Kenya Methodist University',
  authors: [{ name: 'KeMU' }],
  openGraph: {
    title: 'KeMU Partnerships Hub',
    description: 'Centralized stakeholder intelligence and relationship management',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
