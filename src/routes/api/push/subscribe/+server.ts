import { json } from '@sveltejs/kit';
import { getVapidKeys } from '#lib/server/web-push.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const { publicKey } = getVapidKeys();
	return json({ publicKey });
};
