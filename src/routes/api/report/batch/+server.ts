import type { RequestHandler } from './$types.ts';
import type { IBatchReport } from '$lib/interfaces';
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

export const POST: RequestHandler = async ({ request }) => {
    console.log('Batch report POST endpoint called.');
    try {
        const raw = await request.json();
        console.log('Raw JSON payload:', raw);
        
        const meter_id = raw.meter_id;
        const ship_name = raw.ship_name;
        const snapshots = raw.snapshots;
        
        console.log(`Received batch for ship: ${ship_name}, meter: ${meter_id}`);
        
        if (!Array.isArray(snapshots)) {
            console.log('Snapshots is not an array.');
            return jsonResponse({ success: false, error: 'Snapshots must be an array of IBatchReport' }, 400);
        }
        console.log(`Received ${snapshots.length} batch reports for processing.`);

        // Transform all reports
        const reports = snapshots.map((report) => [
            meter_id,
            ship_name,
            String(report.snapshot.ts ?? ''),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_TT_CUR']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_PT_CUR_GAUGE']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_MASSR_CUR']),
            toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_AERATION_CUR']),
            toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_MASS_TOTAL']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_SD_CUR']),
            toNumber(report.snapshot.tags?.['LM_Run1!RUN1_DT_CUR'])
        ]);

        // Insert all reports in a single batch query
        const result = await pool.query(
            `INSERT INTO report (meter, ship, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
             VALUES ${reports.map((_, i) => `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`).join(', ')}
             RETURNING id`,
            reports.flat()
        );

        console.log(`Inserted ${result.rows.length} reports.`);
        return jsonResponse({ success: true, inserted: result.rows.length, ids: result.rows.map(r => r.id) }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error inserting batch reports:', message);
        return jsonResponse({ success: false, error: 'Batch insert failed', details: message }, 400);
    }
};