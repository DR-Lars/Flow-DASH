import type { RequestHandler } from './$types.ts';
import type { IBatchReport } from '$lib/interfaces';
import 'dotenv/config';

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

export const POST: RequestHandler = async ({ request, fetch }) => {
    console.log('Batch report POST endpoint called.');
    try {
        const raw = await request.json();
        console.log('Raw JSON payload:', raw); // Log the raw payload for inspection
        if (!Array.isArray(raw)) {
            console.log('Payload is not an array.');
            return jsonResponse({ success: false, error: 'Payload must be an array of IBatchReport' }, 400);
        }
        console.log('Payload received:', raw);
        const payload = raw as IBatchReport[];
        console.log(`Received ${payload.length} batch reports for processing.`);

        const results = await Promise.all(
            payload.map(async (report) => {
                console.log(`Posting report with timestamp ${report.snapshot.ts}`);

                const body = {
                    timestamp: String(report.snapshot.ts ?? ''),
                    temperature: toNumber(report.snapshot.tags?.['LM_Run1!RUN1_TT_CUR']),
                    pressure: toNumber(report.snapshot.tags?.['LM_Run1!RUN1_PT_CUR_GAUGE']),
                    mass_flow: toNumber(report.snapshot.tags?.['LM_Run1!RUN1_MASSR_CUR']),
                    air_index: toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_AERATION_CUR']),
                    total_quantity: toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_MASS_TOTAL']),
                    standard_density: toNumber(report.snapshot.tags?.['LM_Run1!RUN1_SD_CUR']),
                    raw_density: toNumber(report.snapshot.tags?.['LM_Run1!RUN1_DT_CUR'])
                };
                console.log('Constructed body for POST:', body);
                const res = await fetch('/api/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                console.log(`Received response with status ${res.status} for report timestamp ${report.snapshot.ts}`);
                return { ts: report.snapshot.ts, status: res.status, data: await res.json() };
            })
        );
        console.log('All reports processed.');
        return jsonResponse({ success: true, results }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse({ success: false, error: 'Invalid JSON payload', details: message }, 400);
    }
};