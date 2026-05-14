import type { Metadata } from 'next';
import { Inter, Manrope, Geist } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Benchmark',
  description: 'The new standard for financial trust',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${geist.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
