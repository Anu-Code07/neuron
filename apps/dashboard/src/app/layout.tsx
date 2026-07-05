import type { Metadata } from 'next';
import { Instrument_Serif, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const font = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
});

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Neuron — Context Engine for AI',
  description: 'The Context Operating System for AI. Persistent memory for Cursor, Claude, and MCP.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${font.variable} ${display.variable} antialiased overflow-x-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
