import type { RequestHandler } from './$types.ts';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Safely convert historian tag values to numbers
function toNumber(val: unknown): number | null {
    if (val == null) return null;
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string') {
        const n = Number(val);
        return Number.isFinite(n) ? n : null;
    }
    if (typeof val === 'object') {
        const candidate = (val as any).value ?? (val as any).v ?? (val as any).cur ?? (val as any).current ?? (val as any).raw;
        return toNumber(candidate);
    }
    return null;
}

const BATCH_SIZE = 500; // 500 reports per database insert

export const POST: RequestHandler = async ({ request }) => {
    console.log('Batch report POST endpoint called.');
    try {
        const raw = await request.json();
        console.log('Raw JSON payload received');
        
        const meter_id = raw.meter_id;
        const ship_name = raw.ship_name;
        const batch_number = raw.batch_number;
        const snapshots = raw.snapshots;
        
        console.log(`Received batch for ship: ${ship_name}, meter: ${meter_id}, batch: ${batch_number}, snapshots: ${snapshots.length}`);
        
        if (!Array.isArray(snapshots)) {
            return jsonResponse({ success: false, error: 'Snapshots must be an array' }, 400);
        }

        // Transform all reports
        const reports = snapshots.map((report) => [
            meter_id,
            ship_name,
            batch_number,
            String(report.snapshot.ts ?? ''),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_TT_CUR']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_PT_CUR_GAUGE']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_MASSR_CUR']),
            toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_AERATION_CUR']),
            toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_MASS_TOTAL']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_SD_CUR']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_DT_CUR'])
        ]);

        let totalInserted = 0;
        const allIds: number[] = [];

        // Process in chunks
        for (let i = 0; i < reports.length; i += BATCH_SIZE) {
            const chunk = reports.slice(i, i + BATCH_SIZE);
            const chunkNum = Math.floor(i / BATCH_SIZE) + 1;
            
            try {
                const result = await pool.query(
                    `INSERT INTO report (meter, ship, batch_number, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
                     VALUES ${chunk.map((_, idx) => `($${idx * 11 + 1}, $${idx * 11 + 2}, $${idx * 11 + 3}, $${idx * 11 + 4}, $${idx * 11 + 5}, $${idx * 11 + 6}, $${idx * 11 + 7}, $${idx * 11 + 8}, $${idx * 11 + 9}, $${idx * 11 + 10}, $${idx * 11 + 11})`).join(', ')}
                     RETURNING id`,
                    chunk.flat()
                );

                totalInserted += result.rows.length;
                allIds.push(...result.rows.map(r => r.id));
                console.log(`Chunk ${chunkNum}: Inserted ${result.rows.length} reports`);
            } catch (chunkErr) {
                const msg = chunkErr instanceof Error ? chunkErr.message : String(chunkErr);
                console.error(`Chunk ${chunkNum} failed:`, msg);
                throw new Error(`Chunk ${chunkNum} failed: ${msg}`);
            }
        }

        console.log(`Total inserted: ${totalInserted} reports`);
        return jsonResponse({ success: true, inserted: totalInserted }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error inserting batch reports:', message);
        return jsonResponse({ success: false, error: message }, 400);
    }
};

export const GET: RequestHandler = async ({ url }) => {
    if (!process.env.DATABASE_URL) {
        return jsonResponse({ success: false, error: 'DATABASE_URL not set (database not configured)' }, 500);
    }

    try {
        const meter_id = url.searchParams.get('meter_id');
        const ship_name = url.searchParams.get('ship_name');
        const batch_number = url.searchParams.get('batch_number');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        const conditions: string[] = [];
        const values: Array<string | number> = [];

        if (meter_id) {
            values.push(meter_id);
            conditions.push(`meter = $${values.length}`);
        }
        if (ship_name) {
            values.push(ship_name);
            conditions.push(`ship = $${values.length}`);
        }
        if (batch_number) {
            values.push(batch_number);
            conditions.push(`batch_number = $${values.length}`);
        }
        if (from) {
            values.push(from);
            conditions.push(`timestamp >= $${values.length}`);
        }
        if (to) {
            values.push(to);
            conditions.push(`timestamp <= $${values.length}`);
        }

        let sql = 'SELECT * FROM public.report';
        if (conditions.length) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY timestamp DESC';

        const result = await pool.query(sql, values);
        return jsonResponse({ success: true, data: result.rows });
    } catch (error) {
        const errInfo = error instanceof Error ? { message: error.message || 'Empty error message', stack: error.stack } : { message: String(error) };
        return jsonResponse({ success: false, error: errInfo.message, details: errInfo.stack ?? null }, 500);
    }
};