import { NextResponse } from 'next/server';

function localNow(tz: string) {
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
}

export async function GET() {
  const tz = process.env.TZ_DEFAULT || 'America/New_York';
  const now = localNow(tz);
  const hour = now.getHours();

  // Only run at local 02:00
  if (hour !== 2) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Generate next-day plans by hitting internal plan generator
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  const storeId = process.env.DEFAULT_LOCATION_ID || '';
  // Determine base URL using Vercel provided env var for production or local dev
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  const url = `${base}/api/prep/plan?date=${dateStr}&store_id=${encodeURIComponent(storeId)}`;

  try {
    await fetch(url);
    return NextResponse.json({ ok: true, ran: true, date: dateStr });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'cron failed' }, { status: 500 });
  }
}
