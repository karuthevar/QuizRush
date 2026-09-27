import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gatekeeper Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
  },
};

export default function GatekeeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
