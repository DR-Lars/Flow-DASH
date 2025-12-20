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

const BATCH_SIZE = 500; // 500 reports per database insert

export const POST: RequestHandler = async ({ request }) => {
    console.log('Batch report POST endpoint called.');
    try {
        const raw = await request.json();
        console.log('Raw JSON payload received');
        
        const meter_id = raw.meter_id;
        const ship_name = raw.ship_name;
        const snapshots = raw.snapshots;
        
        console.log(`Received batch for ship: ${ship_name}, meter: ${meter_id}, snapshots: ${snapshots.length}`);
        
        if (!Array.isArray(snapshots)) {
            return jsonResponse({ success: false, error: 'Snapshots must be an array' }, 400);
        }

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

        let totalInserted = 0;
        const allIds: number[] = [];

        // Process in chunks
        for (let i = 0; i < reports.length; i += BATCH_SIZE) {
            const chunk = reports.slice(i, i + BATCH_SIZE);
            const chunkNum = Math.floor(i / BATCH_SIZE) + 1;
            
            try {
                const result = await pool.query(
                    `INSERT INTO report (meter, ship, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
                     VALUES ${chunk.map((_, idx) => `($${idx * 10 + 1}, $${idx * 10 + 2}, $${idx * 10 + 3}, $${idx * 10 + 4}, $${idx * 10 + 5}, $${idx * 10 + 6}, $${idx * 10 + 7}, $${idx * 10 + 8}, $${idx * 10 + 9}, $${idx * 10 + 10})`).join(', ')}
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