import { json, redirect, type RequestEvent } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, verifySessionToken } from '#lib/server/auth.ts';

const PUBLIC_PATHS = new Set([
	'/prihlaseni',
	'/manifest.webmanifest',
	'/sw.js',
	'/favicon-32.png',
	'/robots.txt'
]);

export async function handle({
	event,
	resolve
}: {
	event: RequestEvent;
	resolve: (event: RequestEvent) => Promise<Response> | Response;
}): Promise<Response> {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	event.locals.adminUser = verifySessionToken(token);

	const { pathname } = event.url;
	const isPublicAsset = PUBLIC_PATHS.has(pathname) || pathname.startsWith('/icons/');

	if (!event.locals.adminUser && !isPublicAsset) {
		if (pathname.startsWith('/api/')) {
			return json({ ok: false, error: 'Nepřihlášený přístup (401).' }, { status: 401 });
		}
		redirect(303, '/prihlaseni');
	}

	if (event.locals.adminUser && pathname === '/prihlaseni') {
		redirect(303, '/');
	}

	return resolve(event);
}
