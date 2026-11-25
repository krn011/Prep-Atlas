import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://prep-atlas-theta.vercel.app'),
  icons: { icon: '/brand/favicon.png' },
  openGraph: { images: [{ url: '/brand/share.png', width: 1200, height: 630, alt: 'Prep Atlas — Visual interview prep' }] },
  twitter: { card: 'summary_large_image', images: ['/brand/share.png'] },
  title: 'Prep Atlas — Interview study workspace',
  description: 'A visual study workspace for JavaScript, full-stack engineering, and coding interviews.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Editor locator tools can add attributes to <html> before React hydrates.
  return (
    <html lang="en" suppressHydrationWarning={process.env.NODE_ENV === 'development'}>
      <body>{children}</body>
    </html>
  );
}
