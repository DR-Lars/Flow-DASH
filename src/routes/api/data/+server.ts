import type { RequestHandler } from './$types.js';
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
    if (!process.env.DATABASE_URL) {
        return jsonResponse({ success: false, error: 'DATABASE_URL not set (database not configured)' }, 500);
    }
    let payload: any;
    try {
        payload = await request.json();
    } catch (err) {
        return jsonResponse({ success: false, error: 'Invalid JSON payload' }, 400);
    }

    const missing = REQUIRED_FIELDS.filter((f) => !(f in payload));
    if (missing.length) {
        return jsonResponse({ success: false, error: `Missing fields: ${missing.join(', ')}` }, 400);
    }

    // Map values in the correct order. Convert numeric-like strings to numbers where possible.
    const values = REQUIRED_FIELDS.map((f) => {
        const v = payload[f];
        if (f === 'timestamp') return v;
        if (v === null || v === undefined) return null;
        const num = Number(v);
        return Number.isNaN(num) ? v : num;
    });

    try {
        const result = await pool.query(
            `INSERT INTO public.report
            (timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *`,
            values
        );

        return jsonResponse({ success: true, data: result.rows[0] }, 201);
    } catch (error) {
        const errInfo = error instanceof Error ? { message: error.message || 'Empty error message', stack: error.stack } : { message: String(error) };
        return jsonResponse({ success: false, error: errInfo.message, details: errInfo.stack ?? null }, 500);
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