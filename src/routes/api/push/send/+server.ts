import { json } from '@sveltejs/kit';
import { sendWebPushNotification, type WebPushSubscriptionJson } from '#lib/server/web-push.ts';
import type { RequestHandler } from './$types';

interface SendPushRequestBody {
	subscription: WebPushSubscriptionJson;
	delayMs?: number;
	payload: {
		title: string;
		body: string;
		tag?: string;
		url?: string;
		badgeCount?: number;
		requireInteraction?: boolean;
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const data = (await request.json()) as SendPushRequestBody;

	if (
		!data.subscription?.endpoint ||
		!data.subscription?.keys?.p256dh ||
		!data.subscription?.keys?.auth
	) {
		return json(
			{ ok: false, error: 'Chybí platný Web Push subscription objekt.' },
			{ status: 400 }
		);
	}

	const delay = Math.min(15000, Math.max(0, data.delayMs ?? 0));
	if (delay > 0) {
		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	try {
		const result = await sendWebPushNotification(data.subscription, data.payload);
		return json({ ok: result.ok, status: result.status });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Nepodařilo se odeslat Web Push.';
		return json({ ok: false, error: message }, { status: 500 });
	}
};
