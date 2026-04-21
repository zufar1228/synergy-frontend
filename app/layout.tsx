/**
 * @file layout.tsx
 * @purpose Root layout — global metadata, viewport, fonts, theme, and app-wide UI providers
 * @usedBy Next.js app router (root)
 * @deps next/font/google, ThemeProvider, Toaster, ServiceWorkerRegister
 * @exports metadata, viewport, RootLayout (default)
 * @sideEffects Registers service worker on client
 */

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'IoT Warehouse Monitoring System',
  description:
    'Real-time IoT monitoring system that surfaces incidents, analytics, and device status for warehouse operations.',
  applicationName: 'IoT Warehouse Monitoring System',
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-secondary`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
