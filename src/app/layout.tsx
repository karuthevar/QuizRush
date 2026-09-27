import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'QuizRush | Live Interactive Multiplayer Quizzes',
  description: 'Fast-paced, Kahoot-style multiplayer quiz platform. Host live games, join with 4-char PIN or QR code, compete with single & multi-choice questions!',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-rush-dark text-white flex flex-col antialiased selection:bg-rush-yellow selection:text-rush-dark">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
