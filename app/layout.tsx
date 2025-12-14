import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'easel - 演劇・公演チケット販売',
  description: 'easel のチケット販売サイト',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
