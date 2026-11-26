import {
	INITIAL_LEDGER,
	INITIAL_ORDERS,
	INITIAL_SETTINGS,
	INITIAL_WAREHOUSE_ITEMS
} from '#lib/data/admin-seed.ts';
import type {
	AdminOrder,
	AdminSectionId,
	LedgerEntry,
	LedgerMovementType,
	OrderStatus,
	ShopSettings,
	ToastMessage,
	WarehouseItem
} from '#lib/types/admin.ts';

class AdminStore {
	activeSection = $state<AdminSectionId>('overview');
	warehouseItems = $state<WarehouseItem[]>(structuredClone(INITIAL_WAREHOUSE_ITEMS));
	ledger = $state<LedgerEntry[]>(structuredClone(INITIAL_LEDGER));
	orders = $state<AdminOrder[]>(structuredClone(INITIAL_ORDERS));
	settings = $state<ShopSettings>(structuredClone(INITIAL_SETTINGS));

	isCommandPaletteOpen = $state(false);
	isTerminalLocked = $state(false);
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
		}, 4200);
	}

	dismissToast(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	private recordLedger(params: {
		type: LedgerMovementType;
		item: WarehouseItem;
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
			ORDER_DISPATCH: 'EX'
		};
		const code = `${prefixMap[params.type]}-2026-${String(this.ledger.length + 90).padStart(3, '0')}`;
		const now = new Date();
		const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

		const entry: LedgerEntry = {
			id: `led-${Date.now()}`,
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
			// Deduct from e-shop stock & log in ledger
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
