export type AdminSectionId = 'overview' | 'warehouse' | 'orders' | 'settings';

export type ProductCategory = 'whisky' | 'wine' | 'rum' | 'craft';

export interface WarehouseItem {
	id: string;
	sku: string;
	name: string;
	subtitle: string;
	category: ProductCategory;
	origin: string;
	volumeMl: number;
	abvPercent: number;
	purchasePriceCzk: number;
	retailPriceCzk: number;
	vatRatePercent: number;
	/** Primary warehouse stock managed only in admin */
	mainWarehouseStock: number;
	/** Public e-shop stock replenished via transfers from mainWarehouseStock */
	eshopStock: number;
	/** Stock currently reserved by unpaid/processing orders */
	reservedStock: number;
	minMainThreshold: number;
	minEshopThreshold: number;
	rackLocation: string;
}

export type LedgerMovementType =
	'TRANSFER_TO_ESHOP' | 'RECEIPT_MAIN' | 'RETURN_TO_MAIN' | 'ORDER_DISPATCH';

export interface LedgerEntry {
	id: string;
	referenceCode: string;
	timestamp: string;
	type: LedgerMovementType;
	productId: string;
	sku: string;
	productName: string;
	quantity: number;
	mainBefore: number;
	mainAfter: number;
	eshopBefore: number;
	eshopAfter: number;
	operator: string;
	note: string;
}

export type OrderStatus = 'paid' | 'packed' | 'shipped' | 'delivered';

export interface AdminOrderItem {
	sku: string;
	name: string;
	quantity: number;
	unitPriceCzk: number;
}

export interface AdminOrder {
	id: string;
	orderNumber: string;
	createdAt: string;
	customerName: string;
	customerEmail: string;
	deliveryCity: string;
	ageVerifiedAt: string;
	status: OrderStatus;
	polarPaymentId: string;
	/** Snapshot of shop_settings.is_vat_payer at the moment the order was placed */
	isVatPayerSnapshot: boolean;
	vatRateSnapshot: number;
	totalCzk: number;
	items: AdminOrderItem[];
}

export interface ShopSettings {
	shopName: string;
	companyName: string;
	companyIco: string;
	companyDic: string;
	isVatPayer: boolean;
	defaultVatRatePercent: number;
	reducedVatRatePercent: number;
	freeShippingThresholdCzk: number;
	mainWarehouseTempC: number;
	mainWarehouseHumidityPercent: number;
	requireAgeVerification18: boolean;
	supabaseRlsActive: boolean;
	polarWebhooksVerified: boolean;
	terminalPin: string;
}

export interface ToastMessage {
	id: string;
	title: string;
	detail: string;
	tone: 'amber' | 'emerald' | 'burgundy';
}
