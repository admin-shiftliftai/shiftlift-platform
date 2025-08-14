import { NextResponse } from 'next/server';
import { getPool } from '../../../../src/lib/db';

export async function POST(request: Request) {
  const pool = getPool();
  let items: any[];
  try {
    items = await request.json();
    if (!Array.isArray(items)) {
      throw new Error('Invalid payload');
    }
  } catch (err: any) {
    return new NextResponse('Invalid JSON: ' + err.message, { status: 400 });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        const { id, made_qty, override_qty } = item;
        await client.query(
          'UPDATE prep_plans SET made_qty = $2, override_qty = $3 WHERE id = $1',
          [id, made_qty ?? null, override_qty ?? null]
        );
      }
      await client.query('COMMIT');
      return new NextResponse('Saved', { status: 200 });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error(err);
      return new NextResponse('Database error: ' + err.message, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error(err);
    return new NextResponse('Error: ' + err.message, { status: 500 });
  }
}