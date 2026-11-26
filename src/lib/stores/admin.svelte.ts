import {
	INITIAL_LEDGER,
	INITIAL_ORDERS,
	INITIAL_SETTINGS,
	INITIAL_WAREHOUSE_ITEMS
} from '#lib/data/admin-seed.ts';
import type {
	AdminOrder,
	AdminSectionId,
	CreateProductInput,
	LedgerEntry,
	LedgerMovementType,
	OrderStatus,
	PolarSyncStatus,
	ShopSettings,
	ToastMessage,
	WarehouseItem
} from '#lib/types/admin.ts';

interface PolarApiResponse {
	ok: boolean;
	mode: 'live' | 'mock';
	syncStatus: PolarSyncStatus;
	polarProductId: string;
	message: string;
}

class AdminStore {
	activeSection = $state<AdminSectionId>('overview');
	warehouseItems = $state<WarehouseItem[]>(
		structuredClone(INITIAL_WAREHOUSE_ITEMS).map((item) => ({
			...item,
			polarProductId: `plr_prod_mock_${item.sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
			polarSyncStatus: 'mock'
		}))
	);
	ledger = $state<LedgerEntry[]>(structuredClone(INITIAL_LEDGER));
	orders = $state<AdminOrder[]>(structuredClone(INITIAL_ORDERS));
	settings = $state<ShopSettings>(structuredClone(INITIAL_SETTINGS));

	isCommandPaletteOpen = $state(false);
	isTerminalLocked = $state(false);
	isCreateProductOpen = $state(false);
	editPriceTarget = $state<WarehouseItem | null>(null);
	deleteProductTarget = $state<WarehouseItem | null>(null);
	transferModalTarget = $state<{
		item: WarehouseItem;
		mode: 'TRANSFER_TO_ESHOP' | 'RECEIPT_MAIN' | 'RETURN_TO_MAIN';
	} | null>(null);

	toasts = $state<ToastMessage[]>([]);

	// Derived warehouse KPIs
	totalMainBottles = $derived(
		this.warehouseItems.reduce((sum, item) => sum + item.mainWarehouseStock, 0)
	);

	totalEshopBottles = $derived(this.warehouseItems.reduce((sum, item) => sum + item.eshopStock, 0));

	totalReservedBottles = $derived(
		this.warehouseItems.reduce((sum, item) => sum + item.reservedStock, 0)
	);

	mainWarehouseValueCzk = $derived(
		this.warehouseItems.reduce(
			(sum, item) => sum + item.mainWarehouseStock * item.purchasePriceCzk,
			0
		)
	);

	eshopRetailValueCzk = $derived(
		this.warehouseItems.reduce((sum, item) => sum + item.eshopStock * item.retailPriceCzk, 0)
	);

	lowEshopStockItems = $derived(
		this.warehouseItems.filter((item) => item.eshopStock <= item.minEshopThreshold)
	);

	pendingOrdersCount = $derived(
		this.orders.filter((o) => o.status === 'paid' || o.status === 'packed').length
	);

	totalRevenueCzk = $derived(this.orders.reduce((sum, o) => sum + o.totalCzk, 0));

	pushToast(title: string, detail: string, tone: ToastMessage['tone'] = 'amber') {
		const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		this.toasts.push({ id, title, detail, tone });
		setTimeout(() => {
			this.toasts = this.toasts.filter((t) => t.id !== id);
		}, 4500);
	}

	dismissToast(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	private recordLedger(params: {
		type: LedgerMovementType;
		item: Pick<WarehouseItem, 'id' | 'sku' | 'name'>;
		quantity: number;
		mainBefore: number;
		mainAfter: number;
		eshopBefore: number;
		eshopAfter: number;
		note: string;
	}) {
		const prefixMap: Record<LedgerMovementType, string> = {
			TRANSFER_TO_ESHOP: 'TR',
			RECEIPT_MAIN: 'RC',
			RETURN_TO_MAIN: 'RT',
			ORDER_DISPATCH: 'EX',
			PRODUCT_CREATED: 'NEW',
			PRICE_UPDATED: 'PRC',
			PRODUCT_DELETED: 'DEL'
		};
		const code = `${prefixMap[params.type]}-2026-${String(this.ledger.length + 90).padStart(3, '0')}`;
		const now = new Date();
		const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

		const entry: LedgerEntry = {
			id: `led-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
			referenceCode: code,
			timestamp: `Dnes · ${timeStr}`,
			type: params.type,
			productId: params.item.id,
			sku: params.item.sku,
			productName: params.item.name,
			quantity: params.quantity,
			mainBefore: params.mainBefore,
			mainAfter: params.mainAfter,
			eshopBefore: params.eshopBefore,
			eshopAfter: params.eshopAfter,
			operator: 'P. Cafourek',
			note: params.note
		};

		this.ledger = [entry, ...this.ledger];
		return code;
	}

	/**
	 * Creates a new product in Main Warehouse and syncs it to Polar.sh via `/api/polar/products`.
	 */
	async createProduct(input: CreateProductInput) {
		const id = `prod-${Date.now()}`;
		let polarProductId = `plr_prod_mock_${input.sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
		let polarSyncStatus: PolarSyncStatus;
		let polarMessage = 'Synchronizace s Polar.sh připravena (čeká na POLAR_ACCESS_TOKEN).';

		try {
			const res = await fetch('/api/polar/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sku: input.sku,
					name: input.name,
					subtitle: input.subtitle,
					retailPriceCzk: input.retailPriceCzk,
					category: input.category,
					origin: input.origin
				})
			});
			const data = (await res.json()) as PolarApiResponse;
			if (data.polarProductId) polarProductId = data.polarProductId;
			polarSyncStatus = data.syncStatus;
			polarMessage = data.message;
		} catch {
			polarSyncStatus = 'error';
		}

		const newItem: WarehouseItem = {
			id,
			sku: input.sku.trim().toUpperCase(),
			name: input.name.trim(),
			subtitle: input.subtitle.trim() || 'Výběrová šarže',
			category: input.category,
			origin: input.origin.trim() || 'Neuvedeno',
			volumeMl: input.volumeMl,
			abvPercent: input.abvPercent,
			purchasePriceCzk: input.purchasePriceCzk,
			retailPriceCzk: input.retailPriceCzk,
			vatRatePercent: this.settings.defaultVatRatePercent,
			mainWarehouseStock: Math.max(0, input.initialMainStock),
			eshopStock: 0,
			reservedStock: 0,
			minMainThreshold: 10,
			minEshopThreshold: 4,
			rackLocation: input.rackLocation.trim() || 'A-99 · Příjmová zóna',
			imageUrl: input.imageUrl,
			polarProductId,
			polarSyncStatus
		};

		this.warehouseItems = [newItem, ...this.warehouseItems];

		const ref = this.recordLedger({
			type: 'PRODUCT_CREATED',
			item: newItem,
			quantity: newItem.mainWarehouseStock,
			mainBefore: 0,
			mainAfter: newItem.mainWarehouseStock,
			eshopBefore: 0,
			eshopAfter: 0,
			note: `Založena karta produktu + Polar.sh (${polarProductId}). Počáteční zásoba: ${newItem.mainWarehouseStock} ks.`
		});

		this.pushToast(`Nový produkt založen (${ref})`, polarMessage, 'emerald');
		return newItem;
	}

	/**
	 * Updates product retail/purchase price and syncs the retail price to Polar.sh.
	 */
	async updateProductPrice(
		productId: string,
		newRetailPriceCzk: number,
		newPurchasePriceCzk: number
	) {
		const item = this.warehouseItems.find((i) => i.id === productId);
		if (!item || newRetailPriceCzk <= 0) return false;

		const oldRetail = item.retailPriceCzk;
		item.retailPriceCzk = Math.round(newRetailPriceCzk);
		item.purchasePriceCzk = Math.max(0, Math.round(newPurchasePriceCzk));

		let polarMessage = 'Cena uložena a připravena pro Polar.sh.';

		try {
			const res = await fetch('/api/polar/products', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					polarProductId: item.polarProductId,
					sku: item.sku,
					name: item.name,
					retailPriceCzk: item.retailPriceCzk
				})
			});
			const data = (await res.json()) as PolarApiResponse;
			item.polarSyncStatus = data.syncStatus;
			polarMessage = data.message;
		} catch {
			item.polarSyncStatus = 'error';
		}

		const ref = this.recordLedger({
			type: 'PRICE_UPDATED',
			item,
			quantity: 0,
			mainBefore: item.mainWarehouseStock,
			mainAfter: item.mainWarehouseStock,
			eshopBefore: item.eshopStock,
			eshopAfter: item.eshopStock,
			note: `Změna prodejní ceny: ${oldRetail} Kč → ${item.retailPriceCzk} Kč (Polar.sh: ${item.polarProductId ?? '—'}).`
		});

		this.pushToast(`Cena upravena (${ref})`, polarMessage, 'amber');
		return true;
	}

	/**
	 * Removes product from warehouse/e-shop and archives it on Polar.sh.
	 */
	async deleteProduct(productId: string) {
		const item = this.warehouseItems.find((i) => i.id === productId);
		if (!item) return false;

		let polarMessage = 'Produkt odstraněn ze skladu i z Polar.sh.';

		try {
			const res = await fetch('/api/polar/products', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					polarProductId: item.polarProductId,
					sku: item.sku
				})
			});
			const data = (await res.json()) as PolarApiResponse;
			polarMessage = data.message;
		} catch {
			// Continue local removal even if offline
		}

		const ref = this.recordLedger({
			type: 'PRODUCT_DELETED',
			item,
			quantity: item.mainWarehouseStock + item.eshopStock,
			mainBefore: item.mainWarehouseStock,
			mainAfter: 0,
			eshopBefore: item.eshopStock,
			eshopAfter: 0,
			note: `Produkt vyřazen z Hlavního skladu i E-shopu a archivován na Polar.sh (${item.polarProductId ?? '—'}).`
		});

		this.warehouseItems = this.warehouseItems.filter((i) => i.id !== productId);
		this.pushToast(`Produkt smazán (${ref})`, polarMessage, 'burgundy');
		return true;
	}

	/**
	 * Transfers bottles from Main Warehouse -> E-shop inventory with audit ledger record.
	 */
	transferToEshop(
		productId: string,
		quantity: number,
		note: string = 'Převodka Hlavní sklad → E-shop'
	) {
		const item = this.warehouseItems.find((i) => i.id === productId);
		if (!item || quantity <= 0) return false;
		const actualQty = Math.min(quantity, item.mainWarehouseStock);
		if (actualQty <= 0) {
			this.pushToast(
				'Nedostatek na Hlavním skladu',
				`${item.name} nemá na Hlavním skladu dostatek volných kusů.`,
				'burgundy'
			);
			return false;
		}

		const mainBefore = item.mainWarehouseStock;
		const eshopBefore = item.eshopStock;
		item.mainWarehouseStock -= actualQty;
		item.eshopStock += actualQty;

		const ref = this.recordLedger({
			type: 'TRANSFER_TO_ESHOP',
			item,
			quantity: actualQty,
			mainBefore,
			mainAfter: item.mainWarehouseStock,
			eshopBefore,
			eshopAfter: item.eshopStock,
			note
		});

		this.pushToast(
			`Převodka ${ref} potvrzena`,
			`+${actualQty} ks „${item.name}“ přesunuto z Hlavního skladu na E-shop.`,
			'emerald'
		);
		return true;
	}

	/**
	 * Receives new stock from supplier directly into Main Warehouse.
	 */
	receiveToMainWarehouse(
		productId: string,
		quantity: number,
		note: string = 'Příjem zboží od dodavatele'
	) {
		const item = this.warehouseItems.find((i) => i.id === productId);
		if (!item || quantity <= 0) return false;

		const mainBefore = item.mainWarehouseStock;
		const eshopBefore = item.eshopStock;
		item.mainWarehouseStock += quantity;

		const ref = this.recordLedger({
			type: 'RECEIPT_MAIN',
			item,
			quantity,
			mainBefore,
			mainAfter: item.mainWarehouseStock,
			eshopBefore,
			eshopAfter: eshopBefore,
			note
		});

		this.pushToast(
			`Příjemka ${ref} zaúčtována`,
			`+${quantity} ks „${item.name}“ naskladněno na Hlavní sklad (${item.rackLocation}).`,
			'amber'
		);
		return true;
	}

	/**
	 * Returns bottles from E-shop inventory back to Main Warehouse.
	 */
	returnToMainWarehouse(
		productId: string,
		quantity: number,
		note: string = 'Stažení zásoby z E-shopu na Hlavní sklad'
	) {
		const item = this.warehouseItems.find((i) => i.id === productId);
		if (!item || quantity <= 0) return false;
		const actualQty = Math.min(quantity, item.eshopStock);
		if (actualQty <= 0) return false;

		const mainBefore = item.mainWarehouseStock;
		const eshopBefore = item.eshopStock;
		item.eshopStock -= actualQty;
		item.mainWarehouseStock += actualQty;

		const ref = this.recordLedger({
			type: 'RETURN_TO_MAIN',
			item,
			quantity: actualQty,
			mainBefore,
			mainAfter: item.mainWarehouseStock,
			eshopBefore,
			eshopAfter: item.eshopStock,
			note
		});

		this.pushToast(
			`Vratka ${ref} uložena`,
			`${actualQty} ks „${item.name}“ vráceno ze skladu E-shopu do Hlavního skladu.`,
			'amber'
		);
		return true;
	}

	advanceOrderStatus(orderId: string) {
		const order = this.orders.find((o) => o.id === orderId);
		if (!order) return;

		const flow: Record<OrderStatus, OrderStatus> = {
			paid: 'packed',
			packed: 'shipped',
			shipped: 'delivered',
			delivered: 'delivered'
		};

		const prev = order.status;
		const next = flow[prev];
		if (prev === next) return;

		order.status = next;

		if (prev === 'paid' && next === 'packed') {
			for (const line of order.items) {
				const whItem = this.warehouseItems.find((w) => w.sku === line.sku);
				if (whItem && whItem.eshopStock >= line.quantity) {
					const eshopBefore = whItem.eshopStock;
					whItem.eshopStock -= line.quantity;
					whItem.reservedStock = Math.max(0, whItem.reservedStock - line.quantity);
					this.recordLedger({
						type: 'ORDER_DISPATCH',
						item: whItem,
						quantity: line.quantity,
						mainBefore: whItem.mainWarehouseStock,
						mainAfter: whItem.mainWarehouseStock,
						eshopBefore,
						eshopAfter: whItem.eshopStock,
						note: `Vyskladnění pro objednávku #${order.orderNumber}`
					});
				}
			}
			this.pushToast(
				`Objednávka #${order.orderNumber} vyskladněna`,
				'Zásoby byly odečteny ze skladu e-shopu a zapsány do auditního deníku.',
				'emerald'
			);
		} else if (next === 'shipped') {
			this.pushToast(
				`Objednávka #${order.orderNumber} předána dopravci`,
				`Zásilka míří do: ${order.deliveryCity}.`,
				'amber'
			);
		} else if (next === 'delivered') {
			this.pushToast(
				`Objednávka #${order.orderNumber} doručena`,
				'Potvrzeno převzetí zákazníkem s ověřením věku 18+.',
				'emerald'
			);
		}
	}

	toggleVatPayer() {
		this.settings.isVatPayer = !this.settings.isVatPayer;
		this.settings.companyDic = this.settings.isVatPayer
			? 'CZ19842510 (aktivní plátce DPH)'
			: 'CZ19842510 (neaktivní — neplátce)';

		this.pushToast(
			this.settings.isVatPayer
				? 'Aktivován režim Plátce DPH (21 %)'
				: 'Aktivován režim Neplátce DPH',
			'Nové objednávky použijí tento režim. Historické objednávky mají zamčený snapshot.',
			this.settings.isVatPayer ? 'amber' : 'emerald'
		);
	}

	openTransferModal(
		item: WarehouseItem,
		mode: 'TRANSFER_TO_ESHOP' | 'RECEIPT_MAIN' | 'RETURN_TO_MAIN' = 'TRANSFER_TO_ESHOP'
	) {
		this.transferModalTarget = { item, mode };
	}

	closeTransferModal() {
		this.transferModalTarget = null;
	}
}

export const adminStore = new AdminStore();
