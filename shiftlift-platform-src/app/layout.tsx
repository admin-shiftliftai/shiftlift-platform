import type { ReactNode } from 'react';
import '../app/globals.css';
import NavBar from '../src/components/NavBar';

export const metadata = {
  title: 'ShiftLift Platform',
  description: 'Prep, HR and Airports modules for ShiftLift AI',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  );
}