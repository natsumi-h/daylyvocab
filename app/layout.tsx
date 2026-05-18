import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Vocabulary',
  description: 'Notionデータベースから毎日10語を学ぶ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
