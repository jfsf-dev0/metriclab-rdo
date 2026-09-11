import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { PwaManager } from '@/components/pwa/PwaManager';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rdo.metriclab.com.br'),
  title: 'RDO Digital · MetricLab',
  description: 'Diário de obra preenchido em campo e consolidado automaticamente no painel do supervisor. Acesse pelo celular.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'RDO Digital · MetricLab',
    description: 'Diário de obra preenchido em campo e consolidado automaticamente no painel do supervisor. Acesse pelo celular.',
    url: 'https://rdo.metriclab.com.br',
    siteName: 'MetricLab',
    images: [
      {
        url: 'https://rdo.metriclab.com.br/og-image.jpg',
        secureUrl: 'https://rdo.metriclab.com.br/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RDO Digital · MetricLab',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RDO Digital · MetricLab',
    description: 'Diário de obra preenchido em campo e consolidado automaticamente no painel do supervisor.',
    images: ['https://rdo.metriclab.com.br/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} bg-[#F0F0F0]`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="og:title" content="RDO Digital · MetricLab" />
        <meta property="og:description" content="Diário de obra preenchido em campo e consolidado automaticamente no painel do supervisor. Acesse pelo celular." />
        <meta property="og:image" content="https://rdo.metriclab.com.br/og-image.jpg" />
        <meta property="og:image:secure_url" content="https://rdo.metriclab.com.br/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="RDO Digital · MetricLab" />
        <meta property="og:url" content="https://rdo.metriclab.com.br" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MetricLab" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RDO Digital · MetricLab" />
        <meta name="twitter:description" content="Diário de obra preenchido em campo e consolidado automaticamente no painel do supervisor." />
        <meta name="twitter:image" content="https://rdo.metriclab.com.br/og-image.jpg" />
      </head>
      <body className={`${inter.className} min-h-screen bg-[#F0F0F0] text-[#111111] antialiased flex flex-col w-full selection:bg-neutral-200 selection:text-neutral-900`}>
        <ToastProvider>
          <div className="w-full min-h-screen relative flex flex-col">
            <PwaManager />
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
