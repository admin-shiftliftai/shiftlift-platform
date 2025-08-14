import Link from 'next/link';

export const metadata = {
  title: 'ShiftLift Prep',
};

export default function PrepPage() {
  return (
    <div>
      <h1>Prep Module</h1>
      <p>
        Welcome to the Prep module. Use the links below to upload data or view today's plan.
      </p>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        <li>
          <Link href="/prep/upload">Upload Data</Link>
        </li>
        <li>
          <Link href="/prep/today">Today's Prep Plan</Link>
        </li>
      </ul>
    </div>
  );
}