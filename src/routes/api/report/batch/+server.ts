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
		const candidate =
			(val as any).value ??
			(val as any).v ??
			(val as any).cur ??
			(val as any).current ??
			(val as any).raw;
		return toNumber(candidate);
	}
	return null;
}

const BATCH_SIZE = 500; // 500 reports per database insert

export const POST: RequestHandler = async ({ request }) => {
	const bearerToken = request.headers.get('Authorization');
	if (!bearerToken) return jsonResponse({ success: false, error: 'No Bearer Token Provided' }, 401);
	const key = bearerToken.split(' ')[1]; // Removes the 'Bearer' Prefix
	if (key != 'TEMP123!') return jsonResponse({ success: false, error: 'Not a valid key' }, 401);
    
	console.log('Batch report POST endpoint called.');
	try {
		const raw = await request.json();
		console.log('Raw JSON payload received');

		const meter_id = raw.meter_id;
		const ship_name = raw.ship_name;
		const batch_number = raw.batch_number;
		const snapshots = raw.snapshots;

		console.log(
			`Received batch for ship: ${ship_name}, meter: ${meter_id}, batch: ${batch_number}, snapshots: ${snapshots.length}`
		);

		if (!Array.isArray(snapshots)) {
			return jsonResponse({ success: false, error: 'Snapshots must be an array' }, 400);
		}

		// Transform all reports, normalize timestamp and ship name
		const rawReports = snapshots.map((report) => {
			const tsRaw = (report as any).snapshot?.ts;
			let ts: Date | null = null;
			if (tsRaw != null) {
				if (tsRaw instanceof Date) ts = tsRaw;
				else if (typeof tsRaw === 'number') ts = new Date(tsRaw);
				else if (typeof tsRaw === 'string') ts = new Date(tsRaw);
			}

			// Debugging air_index
			if (
				report.snapshot.tags?.['BB_MiMO!RUN1_AERATION_CUR'] === undefined ||
				report.snapshot.tags?.['BB_MiMO!RUN1_AERATION_CUR'] === null
			) {
				console.log('BB_MiMO!RUN1_AERATION_CUR is null or undefined for a snapshot.');
			}
			if (report.snapshot.tags) {
				console.log('All tags for a snapshot:', report.snapshot.tags);
			}

			return [
				meter_id,
				typeof ship_name === 'string' ? ship_name.trim() : ship_name,
				batch_number,
				ts,
				toNumber(report.snapshot.tags?.['LM_Run1!RUN1_TT_CUR']),
				toNumber(report.snapshot.tags?.['LM_Run1!RUN1_PT_CUR_GAUGE']),
				toNumber(report.snapshot.tags?.['LM_Run1!RUN1_MASSR_CUR']),
				toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_AERATION_CUR']),
				toNumber(report.snapshot.tags?.['BB_MiMO!RUN1_MASS_TOTAL']),
				toNumber(report.snapshot.tags?.['LM_Run1!RUN1_SD_CUR']),
				toNumber(report.snapshot.tags?.['LM_Run1!RUN1_DT_CUR'])
			];
		});

		// Deduplicate within the payload by unique index key (meter, ship, batch_number, timestamp)
		const seen = new Set<string>();
		const reports = [] as Array<
			[
				typeof meter_id,
				typeof ship_name,
				typeof batch_number,
				Date | null,
				number | null,
				number | null,
				number | null,
				number | null,
				number | null,
				number | null,
				number | null
			]
		>;
		let invalidTs = 0;
		for (const r of rawReports) {
			const m = r[0];
			const s = r[1] as string;
			const b = r[2];
			const ts = r[3] as Date | null;
			const tsKey = ts instanceof Date ? ts.getTime() : NaN;
			if (!Number.isFinite(tsKey)) {
				invalidTs++;
				continue; // skip invalid timestamps
			}
			const key = `${m}|${s}|${b}|${tsKey}`;
			if (seen.has(key)) continue;
			seen.add(key);
			// push with normalized Date
			reports.push([
				m,
				s,
				b,
				new Date(tsKey),
				r[4] as number | null,
				r[5] as number | null,
				r[6] as number | null,
				r[7] as number | null,
				r[8] as number | null,
				r[9] as number | null,
				r[10] as number | null
			]);
		}
		console.log(
			`Payload prepared: total=${snapshots.length}, unique=${reports.length}, invalidTs=${invalidTs}`
		);

		// Check and create unique constraint
		let indexExists = false;
		try {
			const checkIndex = await pool.query(`
                SELECT indexname FROM pg_indexes 
                WHERE tablename = 'report' AND indexname = 'report_unique_key'
            `);
			indexExists = checkIndex.rows.length > 0;
			console.log(`Unique index exists: ${indexExists}`);

			if (!indexExists) {
				console.log('Creating unique index...');
				await pool.query(`
                    CREATE UNIQUE INDEX report_unique_key 
                    ON report (meter, ship, batch_number, timestamp)
                `);
				console.log('Unique index created successfully');
				indexExists = true;
			}
		} catch (indexErr) {
			const msg = indexErr instanceof Error ? indexErr.message : String(indexErr);
			console.error('Index creation failed:', msg);
			if (msg.includes('could not create unique index') || msg.includes('duplicate')) {
				console.log(
					'Cannot create index due to existing duplicates. Will check manually for each insert.'
				);
			}
		}

		let totalInserted = 0;
		let totalSkipped = 0;
		const allIds: number[] = [];

		// Log first timestamp for debugging
		if (reports.length > 0) {
			const t = reports[0][3] as Date | null;
			console.log('Sample timestamp value:', t ? t.toISOString() : null);
		}

		// Process in chunks
		for (let i = 0; i < reports.length; i += BATCH_SIZE) {
			const chunk = reports.slice(i, i + BATCH_SIZE);
			const chunkNum = Math.floor(i / BATCH_SIZE) + 1;

			try {
				let result;
				if (indexExists) {
					// Use ON CONFLICT if index exists
					result = await pool.query(
						`INSERT INTO report (meter, ship, batch_number, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
                         VALUES ${chunk.map((_, idx) => `($${idx * 11 + 1}, $${idx * 11 + 2}, $${idx * 11 + 3}, $${idx * 11 + 4}, $${idx * 11 + 5}, $${idx * 11 + 6}, $${idx * 11 + 7}, $${idx * 11 + 8}, $${idx * 11 + 9}, $${idx * 11 + 10}, $${idx * 11 + 11})`).join(', ')}
                         ON CONFLICT (meter, ship, batch_number, timestamp) DO NOTHING
                         RETURNING id`,
						chunk.flat()
					);
				} else {
					// Manually check for duplicates if no index
					const timestamps = chunk.map((r) => r[3]);
					const existingCheck = await pool.query(
						`SELECT timestamp FROM report 
                         WHERE meter = $1 AND ship = $2 AND batch_number = $3 AND timestamp = ANY($4)`,
						[meter_id, ship_name, batch_number, timestamps]
					);
					const existingSet = new Set(existingCheck.rows.map((r) => r.timestamp));
					const newChunk = chunk.filter((r) => !existingSet.has(r[3]));

					if (newChunk.length > 0) {
						result = await pool.query(
							`INSERT INTO report (meter, ship, batch_number, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
                             VALUES ${newChunk.map((_, idx) => `($${idx * 11 + 1}, $${idx * 11 + 2}, $${idx * 11 + 3}, $${idx * 11 + 4}, $${idx * 11 + 5}, $${idx * 11 + 6}, $${idx * 11 + 7}, $${idx * 11 + 8}, $${idx * 11 + 9}, $${idx * 11 + 10}, $${idx * 11 + 11})`).join(', ')}
                             RETURNING id`,
							newChunk.flat()
						);
					} else {
						result = { rows: [] };
					}
				}

				const inserted = result.rows.length;
				const skipped = chunk.length - inserted;
				totalInserted += inserted;
				totalSkipped += skipped;
				allIds.push(...result.rows.map((r) => r.id));
				console.log(
					`Chunk ${chunkNum}: Inserted ${inserted} reports, skipped ${skipped} duplicates`
				);
			} catch (chunkErr) {
				const msg = chunkErr instanceof Error ? chunkErr.message : String(chunkErr);
				console.error(`Chunk ${chunkNum} failed:`, msg);
				throw new Error(`Chunk ${chunkNum} failed: ${msg}`);
			}
		}

		console.log(`Total inserted: ${totalInserted} reports, skipped: ${totalSkipped} duplicates`);
		return jsonResponse({ success: true, inserted: totalInserted, skipped: totalSkipped }, 201);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('Error inserting batch reports:', message);
		return jsonResponse({ success: false, error: message }, 400);
	}
};

export const GET: RequestHandler = async ({ request, url }) => {
	const bearerToken = request.headers.get('Authorization');
	if (!bearerToken) return jsonResponse({ success: false, error: 'No Bearer Token Provided' }, 401);
	const key = bearerToken.split(' ')[1]; // Removes the 'Bearer' Prefix
	if (key != 'TEMP123!') return jsonResponse({ success: false, error: 'Not a valid key' }, 401);

	if (!process.env.DATABASE_URL) {
		return jsonResponse(
			{ success: false, error: 'DATABASE_URL not set (database not configured)' },
			500
		);
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
		const errInfo =
			error instanceof Error
				? { message: error.message || 'Empty error message', stack: error.stack }
				: { message: String(error) };
		return jsonResponse(
			{ success: false, error: errInfo.message, details: errInfo.stack ?? null },
			500
		);
	}
};
