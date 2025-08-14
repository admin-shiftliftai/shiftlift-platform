import Link from 'next/link';

export default function NavBar() {
  return (
    <nav
      style={{
        backgroundColor: '#fdf8e3',
        borderBottom: '1px solid #e8e4d9',
        padding: '0.5rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        gap: '1rem',
      }}
    >
      <Link href="/">Home</Link>
      <Link href="/prep">Prep</Link>
      <Link href="/hr">HR</Link>
      <Link href="/airports">Airports</Link>
    </nav>
  );
}