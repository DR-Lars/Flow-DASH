import type { RequestHandler } from './$types.ts';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

const pool = new Pool({ connectionString: env.DATABASE_URL });

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
	const bearerToken = request.headers.get('Authorization');
	if (!bearerToken) return jsonResponse({ success: false, error: 'No Bearer Token Provided' }, 401);
	const key = bearerToken.split(' ')[1]; // Removes the 'Bearer' Prefix
	if (key != 'TEMP123!') return jsonResponse({ success: false, error: 'Not a valid key' }, 401);

	try {
		const body = await request.json();
		console.log('Report POST body:', body);

		const {
			batch_number,
			meter_id,
			ship_name,
			timestamp,
			temperature,
			pressure,
			mass_flow,
			air_index,
			total_quantity,
			standard_density,
			raw_density
		} = body;

		// Insert into database
		const result = await pool.query(
			`INSERT INTO report (batch_number, meter, ship, timestamp, temperature, pressure, mass_flow, air_index, total_quantity, standard_density, raw_density)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id`,
			[
				batch_number,
				meter_id,
				ship_name,
				timestamp,
				temperature,
				pressure,
				mass_flow,
				air_index,
				total_quantity,
				standard_density,
				raw_density
			]
		);

		console.log('Report inserted with id:', result.rows[0].id);
		return jsonResponse({ success: true, id: result.rows[0].id }, 201);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('Error inserting report:', message);
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

		let sql = 'SELECT * FROM public.report';
		if (conditions.length) {
			sql += ' WHERE ' + conditions.join(' AND ');
		}
		sql += ' ORDER BY timestamp ASC';

		console.log('Executing SQL:', sql, 'with values:', values);
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
