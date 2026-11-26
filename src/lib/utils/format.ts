const czkFormatter = new Intl.NumberFormat('cs-CZ', {
	style: 'currency',
	currency: 'CZK',
	maximumFractionDigits: 0
});

export function formatCzk(amount: number): string {
	return czkFormatter.format(amount);
}

export function calculateVatSnapshot(
	amountCzk: number,
	isVatPayer: boolean,
	vatRatePercent: number = 21
): { totalCzk: number; netCzk: number; vatCzk: number } {
	if (!isVatPayer) {
		return {
			totalCzk: amountCzk,
			netCzk: amountCzk,
			vatCzk: 0
		};
	}
	const netCzk = Math.round(amountCzk / (1 + vatRatePercent / 100));
	return {
		totalCzk: amountCzk,
		netCzk,
		vatCzk: amountCzk - netCzk
	};
}

export function formatCategoryLabel(category: 'whisky' | 'wine' | 'rum' | 'craft'): string {
	const labels = {
		whisky: 'Single Malt Whisky',
		wine: 'Archivní víno',
		rum: 'Stařený rum',
		craft: 'Gin & Koňak'
	};
	return labels[category];
}
