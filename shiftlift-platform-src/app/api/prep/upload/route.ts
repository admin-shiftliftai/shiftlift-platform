import { NextResponse } from 'next/server';
import { parse } from 'papaparse';
import { getPool } from '../../../../src/lib/db';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  if (!type) {
    return new NextResponse('Missing dataset type', { status: 400 });
  }
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return new NextResponse('File not provided', { status: 400 });
  }
  const text = await file.text();
  // parse CSV
  const parsed = parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return new NextResponse('CSV parsing error: ' + parsed.errors[0].message, { status: 400 });
  }
  const rows = parsed.data as Record<string, string>[];
  if (!Array.isArray(rows) || rows.length === 0) {
    return new NextResponse('No rows found', { status: 400 });
  }
  const pool = getPool();
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      switch (type) {
        case 'sales_15min': {
          for (const row of rows) {
            // sanitize and map fields
            const { store_id, ts_local, item_id, qty_sold } = row;
            await client.query(
              'INSERT INTO sales_15min (store_id, ts_local, item_id, qty_sold) VALUES ($1, $2, $3, $4)',
              [store_id, ts_local, item_id, Number(qty_sold)]
            );
          }
          break;
        }
        case 'menu_items': {
          for (const row of rows) {
            const { org_id, sku, name, station } = row;
            await client.query(
              'INSERT INTO menu_items (org_id, sku, name, station) VALUES ($1, $2, $3, $4) ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, station = EXCLUDED.station',
              [org_id, sku, name, station]
            );
          }
          break;
        }
        case 'recipes': {
          for (const row of rows) {
            const { org_id, sku, component, qty, uom, shelf_life_hours } = row;
            await client.query(
              'INSERT INTO recipes (org_id, sku, component, qty, uom, shelf_life_hours) VALUES ($1, $2, $3, $4, $5, $6)',
              [org_id, sku, component, Number(qty), uom, Number(shelf_life_hours)]
            );
          }
          break;
        }
        case 'waste_logs': {
          for (const row of rows) {
            const { org_id, store_id, ts_utc, item_sku, qty, reason_code } = row;
            await client.query(
              'INSERT INTO waste_logs (org_id, store_id, ts_utc, item_sku, qty, reason_code) VALUES ($1, $2, $3, $4, $5, $6)',
              [org_id, store_id, ts_utc, item_sku, Number(qty), reason_code]
            );
          }
          break;
        }
        default:
          return new NextResponse('Unknown dataset type', { status: 400 });
      }
      await client.query('COMMIT');
      return new NextResponse('Success', { status: 200 });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error(err);
      return new NextResponse('Database error: ' + err.message, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error(err);
    return new NextResponse('Connection error: ' + err.message, { status: 500 });
  }
}