import { fail, redirect } from '@sveltejs/kit';
import {
	createSessionToken,
	SESSION_COOKIE_NAME,
	verifyAdminCredentials
} from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const rawUsername = formData.get('username');
		const rawPassword = formData.get('password');
		const rawQuickPin = formData.get('quickPin');

		const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
		const password = typeof rawPassword === 'string' ? rawPassword : '';
		const quickPin = typeof rawQuickPin === 'string' ? rawQuickPin.trim() : '';

		if (!username || !password) {
			return fail(400, {
				username,
				error: 'Zadejte prosím uživatelské jméno i heslo.'
			});
		}

		const user = verifyAdminCredentials(username, password);
		if (!user) {
			return fail(401, {
				username,
				error: 'Neplatné uživatelské jméno nebo heslo.'
			});
		}

		const token = createSessionToken(user);
		cookies.set(SESSION_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 7
		});

		const targetUrl =
			quickPin && /^\d{4,6}$/.test(quickPin) ? `/?setPin=${encodeURIComponent(quickPin)}` : '/';

		redirect(303, targetUrl);
	}
};
