import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'AI WhatsApp Companion',
  description: 'Ultra human-like AI WhatsApp companion platform — manage, monitor, and configure your AI personas.',
  keywords: ['WhatsApp', 'AI', 'Companion', 'Chatbot', 'Automation'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
