import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uzury | Partnership & Stakeholder Management Platform',
  description: 'Centralized stakeholder intelligence and relationship management platform for Uzury. Track partnerships, manage contacts, and mobilize resources.',
  keywords: 'stakeholder management, partnership development, donor relations, CRM, Uzury',
  authors: [{ name: 'Uzury' }],
  openGraph: {
    title: 'Uzury Partnership Platform',
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
        {children}
      </body>
    </html>
  );
}
