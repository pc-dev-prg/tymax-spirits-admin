import type { PolarSyncStatus } from '#lib/types/admin.ts';

export interface PolarProductSyncResult {
	ok: boolean;
	mode: 'live' | 'mock';
	syncStatus: PolarSyncStatus;
	polarProductId: string;
	message: string;
}

function getPolarConfig() {
	const token = process.env.POLAR_ACCESS_TOKEN?.trim() || '';
	const env = process.env.POLAR_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
	const baseUrl =
		env === 'production' ? 'https://api.polar.sh/v1' : 'https://sandbox-api.polar.sh/v1';

	return { token, env, baseUrl, isConfigured: token.length > 0 };
}

/**
 * Creates a product on Polar.sh (or returns a mock sync response until POLAR_ACCESS_TOKEN is configured).
 */
export async function createPolarProduct(params: {
	sku: string;
	name: string;
	subtitle: string;
	retailPriceCzk: number;
	category: string;
	origin: string;
}): Promise<PolarProductSyncResult> {
	const cfg = getPolarConfig();

	if (!cfg.isConfigured) {
		const mockId = `plr_prod_mock_${params.sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
		return {
			ok: true,
			mode: 'mock',
			syncStatus: 'mock',
			polarProductId: mockId,
			message:
				'Produkt vytvořen lokálně (Polar.sh čeká na POLAR_ACCESS_TOKEN — připraveno k automatickému propojení).'
		};
	}

	try {
		const response = await fetch(`${cfg.baseUrl}/products/`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cfg.token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: params.name,
				description: `${params.subtitle} (${params.origin})`,
				prices: [
					{
						amount_type: 'fixed',
						price_amount: Math.round(params.retailPriceCzk * 100),
						price_currency: 'czk'
					}
				],
				metadata: {
					sku: params.sku,
					category: params.category,
					origin: params.origin
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			return {
				ok: false,
				mode: 'live',
				syncStatus: 'error',
				polarProductId: '',
				message: `Polar.sh API chyba (${response.status}): ${errorText.slice(0, 160)}`
			};
		}

		const created = (await response.json()) as { id: string };
		return {
			ok: true,
			mode: 'live',
			syncStatus: 'synced',
			polarProductId: created.id,
			message: `Produkt synchronizován na Polar.sh (${created.id}).`
		};
	} catch (err) {
		return {
			ok: false,
			mode: 'live',
			syncStatus: 'error',
			polarProductId: '',
			message: err instanceof Error ? err.message : 'Chyba spojení s Polar.sh.'
		};
	}
}

/**
 * Updates product retail price on Polar.sh (PATCH /v1/products/{id}).
 */
export async function updatePolarProductPrice(params: {
	polarProductId?: string;
	sku: string;
	name: string;
	retailPriceCzk: number;
}): Promise<PolarProductSyncResult> {
	const cfg = getPolarConfig();
	const targetId =
		params.polarProductId || `plr_prod_mock_${params.sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

	if (!cfg.isConfigured || targetId.startsWith('plr_prod_mock_')) {
		return {
			ok: true,
			mode: 'mock',
			syncStatus: 'mock',
			polarProductId: targetId,
			message: 'Cena aktualizována lokálně (Polar.sh synchronizace připravena po doplnění tokenu).'
		};
	}

	try {
		const response = await fetch(`${cfg.baseUrl}/products/${encodeURIComponent(targetId)}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${cfg.token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: params.name,
				prices: [
					{
						amount_type: 'fixed',
						price_amount: Math.round(params.retailPriceCzk * 100),
						price_currency: 'czk'
					}
				]
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			return {
				ok: false,
				mode: 'live',
				syncStatus: 'error',
				polarProductId: targetId,
				message: `Polar.sh aktualizace ceny selhala (${response.status}): ${errorText.slice(0, 140)}`
			};
		}

		return {
			ok: true,
			mode: 'live',
			syncStatus: 'synced',
			polarProductId: targetId,
			message: `Cena na Polar.sh (${targetId}) byla aktualizována.`
		};
	} catch (err) {
		return {
			ok: false,
			mode: 'live',
			syncStatus: 'error',
			polarProductId: targetId,
			message: err instanceof Error ? err.message : 'Chyba spojení s Polar.sh.'
		};
	}
}

/**
 * Archives/removes a product on Polar.sh when deleted from the warehouse.
 */
export async function archivePolarProduct(params: {
	polarProductId?: string;
	sku: string;
}): Promise<PolarProductSyncResult> {
	const cfg = getPolarConfig();
	const targetId =
		params.polarProductId || `plr_prod_mock_${params.sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

	if (!cfg.isConfigured || targetId.startsWith('plr_prod_mock_')) {
		return {
			ok: true,
			mode: 'mock',
			syncStatus: 'mock',
			polarProductId: targetId,
			message: 'Produkt odebrán (archivace na Polar.sh proběhne automaticky po napojení účtu).'
		};
	}

	try {
		const response = await fetch(`${cfg.baseUrl}/products/${encodeURIComponent(targetId)}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${cfg.token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ is_archived: true })
		});

		if (!response.ok) {
			const errorText = await response.text();
			return {
				ok: false,
				mode: 'live',
				syncStatus: 'error',
				polarProductId: targetId,
				message: `Polar.sh archivace selhala (${response.status}): ${errorText.slice(0, 140)}`
			};
		}

		return {
			ok: true,
			mode: 'live',
			syncStatus: 'synced',
			polarProductId: targetId,
			message: `Produkt byl archivován na Polar.sh (${targetId}).`
		};
	} catch (err) {
		return {
			ok: false,
			mode: 'live',
			syncStatus: 'error',
			polarProductId: targetId,
			message: err instanceof Error ? err.message : 'Chyba spojení s Polar.sh.'
		};
	}
}
