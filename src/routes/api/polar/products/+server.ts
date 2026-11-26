import { json } from '@sveltejs/kit';
import {
	archivePolarProduct,
	createPolarProduct,
	updatePolarProductPrice
} from '#lib/server/polar-products.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		sku: string;
		name: string;
		subtitle: string;
		retailPriceCzk: number;
		category: string;
		origin: string;
	};

	if (!body.name || !body.sku || !body.retailPriceCzk) {
		return json({ ok: false, message: 'Chybí povinné údaje produktu.' }, { status: 400 });
	}

	const result = await createPolarProduct(body);
	return json(result, { status: result.ok ? 200 : 502 });
};

export const PATCH: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		polarProductId?: string;
		sku: string;
		name: string;
		retailPriceCzk: number;
	};

	if (!body.sku || !body.retailPriceCzk) {
		return json({ ok: false, message: 'Chybí SKU nebo nová cena.' }, { status: 400 });
	}

	const result = await updatePolarProductPrice(body);
	return json(result, { status: result.ok ? 200 : 502 });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		polarProductId?: string;
		sku: string;
	};

	if (!body.sku) {
		return json({ ok: false, message: 'Chybí SKU produktu pro smazání.' }, { status: 400 });
	}

	const result = await archivePolarProduct(body);
	return json(result, { status: result.ok ? 200 : 502 });
};
