import type { RequestHandler } from './$types.ts';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const REQUIRED_FIELDS = [
    'timestamp',
    'temperature',
    'pressure',
    'mass_flow',
    'air_index',
    'total_quantity',
    'standard_density',
    'raw_density'
] as const;

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        console.log('Report POST body:', body);
        
        const { meter_id, ship_name, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density } = body;

        // Insert into database
        const result = await pool.query(
            `INSERT INTO report (meter, ship, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [meter_id, ship_name, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density]
        );

        console.log('Report inserted with id:', result.rows[0].id);
        return jsonResponse({ success: true, id: result.rows[0].id }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error inserting report:', message);
        return jsonResponse({ success: false, error: message }, 400);
    }
};

export const GET: RequestHandler = async () => {
    if (!process.env.DATABASE_URL) {
        return jsonResponse({ success: false, error: 'DATABASE_URL not set (database not configured)' }, 500);
    }
    try {
        const result = await pool.query('SELECT * FROM public.report ORDER BY timestamp DESC LIMIT 100');
        return jsonResponse({ success: true, data: result.rows });
    } catch (error) {
        const errInfo = error instanceof Error ? { message: error.message || 'Empty error message', stack: error.stack } : { message: String(error) };
        return jsonResponse({ success: false, error: errInfo.message, details: errInfo.stack ?? null }, 500);
    }
};