import { NextResponse } from 'next/server';
import { getPool } from '../../../../src/lib/db';

function getCurrentDateInTZ(tz: string) {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  return tzDate.toISOString().split('T')[0];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || getCurrentDateInTZ(process.env.TZ_DEFAULT || 'America/New_York');
  const pool = getPool();
  // Determine store_id from default env var or query
  const storeId = url.searchParams.get('store_id') || process.env.DEFAULT_LOCATION_ID;
  if (!storeId) {
    return new NextResponse('Missing store_id and DEFAULT_LOCATION_ID not set', { status: 400 });
  }
  try {
    const client = await pool.connect();
    try {
      // attempt to fetch existing plans for date
      const { rows: existing } = await client.query(
        `SELECT p.id, p.item_sku, m.name as item_name, p.plan_qty, p.confidence, p.made_qty, p.override_qty
         FROM prep_plans p
         JOIN menu_items m ON p.item_sku = m.sku
         WHERE p.service_date = $1 AND p.store_id = $2`,
        [date, storeId]
      );
      if (existing.length > 0) {
        return NextResponse.json(existing);
      }
      // generate plan if not exists
      // Step1: compute baseline forecast: 6-week moving average by weekday and hour per item
      // We'll approximate by grouping sales_15min by item_sku for the same weekday in last 42 days.
      const { rows: forecastRows } = await client.query(
        `WITH recent_sales AS (
            SELECT item_id as item_sku,
                   SUM(qty_sold) AS total_qty,
                   COUNT(*) AS num_records
            FROM sales_15min
            WHERE ts_local >= (CURRENT_DATE - INTERVAL '42 days')
              AND EXTRACT(DOW FROM ts_local) = EXTRACT(DOW FROM $1::date)
              AND store_id = $2
            GROUP BY item_id
        )
        SELECT item_sku,
               total_qty / NULLIF(num_records,0) * 4 AS baseline_qty, -- convert 15min avg to hourly
               num_records
        FROM recent_sales`,
        [date, storeId]
      );
      // Determine temperature multiplier
      let multiplier = 1.0;
      // simple placeholder: always mild (1.0)
      // Optionally use ENV or logic here.
      // Build plan entries
      const planEntries: { item_sku: string; plan_qty: number; confidence: string }[] = [];
      for (const row of forecastRows) {
        const { item_sku, baseline_qty, num_records } = row;
        const qty = baseline_qty ? Number(baseline_qty) * multiplier : 0;
        let confidence = 'low';
        if (num_records >= 20) confidence = 'high';
        else if (num_records >= 10) confidence = 'med';
        else confidence = 'low';
        planEntries.push({ item_sku, plan_qty: Math.round(qty), confidence });
      }
      // Insert into prep_plans table and fetch names
      const created: any[] = [];
      for (const entry of planEntries) {
        const { item_sku, plan_qty, confidence } = entry;
        const { rows } = await client.query(
          `INSERT INTO prep_plans (service_date, store_id, item_sku, plan_qty, confidence)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, item_sku, plan_qty, confidence, made_qty, override_qty`,
          [date, storeId, item_sku, plan_qty, confidence]
        );
        const row = rows[0];
        created.push(row);
      }
      // join with menu_items for names
      if (created.length > 0) {
        const ids = created.map((c) => c.id);
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const { rows: withNames } = await client.query(
          `SELECT p.id, p.item_sku, m.name AS item_name, p.plan_qty, p.confidence, p.made_qty, p.override_qty
           FROM prep_plans p
           JOIN menu_items m ON p.item_sku = m.sku
           WHERE p.id IN (${placeholders})`,
          ids
        );
        return NextResponse.json(withNames);
      }
      return NextResponse.json([]);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error(err);
    return new NextResponse('Error: ' + err.message, { status: 500 });
  }
}