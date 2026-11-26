import crypto from 'node:crypto';
import type { AdminUserSession } from '#lib/types/admin.ts';

export const SESSION_COOKIE_NAME = 'tymax_admin_session';

interface StoredAdminAccount {
	id: string;
	username: string;
	displayName: string;
	role: string;
	/**
	 * Only the cryptographic scrypt hash is stored (never plaintext password).
	 * Format: scrypt$<salt_hex>$<derived_key_hex_64B>
	 * Matches the schema that will be stored in Supabase `admin_users.password_hash`.
	 */
	passwordHash: string;
}

/**
 * Demo admin account:
 * Username: admin
 * Password (plaintext, not stored): Tymax2026!
 */
const DEMO_ADMIN_ACCOUNTS: ReadonlyArray<StoredAdminAccount> = [
	{
		id: 'adm-01',
		username: 'admin',
		displayName: 'Petr Cafourek',
		role: 'Hlavní administrátor',
		passwordHash:
			'scrypt$7f9c2a1e4b8d3f6091a5e2c4d7b8f012$b6fead208f29fc8cbddf2a0d91a6e871e60be6f9663be520c7dea2356fe7ea7da8912047be6207c369ed03d6677c3d601e706a4954ca6a70334a5359c1079141'
	}
];

function getSessionSecret(): string {
	return (
		process.env.ADMIN_SESSION_SECRET ||
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		'tymax-spirits-admin-hmac-secret-key-2026'
	);
}

/**
 * Hashes a plaintext password using Node's native scrypt KDF + random 16-byte salt.
 * Ready to store directly in Supabase `admin_users.password_hash`.
 */
export function hashPassword(plainPassword: string): string {
	const salt = crypto.randomBytes(16).toString('hex');
	const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
	return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored `scrypt$<salt>$<hash>` string
 * using constant-time comparison (`crypto.timingSafeEqual`).
 */
export function verifyPasswordHash(plainPassword: string, storedHash: string): boolean {
	const parts = storedHash.split('$');
	if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

	const [, salt, expectedHex] = parts;
	const expectedBuf = Buffer.from(expectedHex, 'hex');
	const actualBuf = crypto.scryptSync(plainPassword, salt, expectedBuf.length);

	if (actualBuf.length !== expectedBuf.length) return false;
	return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Validates username + password against stored password hashes.
 */
export function verifyAdminCredentials(
	username: string,
	plainPassword: string
): AdminUserSession | null {
	const normalized = username.trim().toLowerCase();
	const account = DEMO_ADMIN_ACCOUNTS.find((a) => a.username.toLowerCase() === normalized);
	if (!account) return null;

	const isValid = verifyPasswordHash(plainPassword, account.passwordHash);
	if (!isValid) return null;

	return {
		id: account.id,
		username: account.username,
		displayName: account.displayName,
		role: account.role
	};
}

/**
 * Creates an HMAC-SHA256 signed session token for the HttpOnly cookie.
 */
export function createSessionToken(user: AdminUserSession): string {
	const payloadObj = {
		...user,
		exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
	};
	const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
	const sig = crypto
		.createHmac('sha256', getSessionSecret())
		.update(payloadB64)
		.digest('base64url');
	return `${payloadB64}.${sig}`;
}

/**
 * Verifies the HMAC-SHA256 signed session cookie token.
 */
export function verifySessionToken(token: string | undefined): AdminUserSession | null {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const [payloadB64, signature] = parts;
	const expectedSig = crypto
		.createHmac('sha256', getSessionSecret())
		.update(payloadB64)
		.digest('base64url');

	const sigBuf = Buffer.from(signature);
	const expectedBuf = Buffer.from(expectedSig);
	if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
		return null;
	}

	try {
		const parsed = JSON.parse(
			Buffer.from(payloadB64, 'base64url').toString('utf8')
		) as AdminUserSession & {
			exp: number;
		};
		if (parsed.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}
		return {
			id: parsed.id,
			username: parsed.username,
			displayName: parsed.displayName,
			role: parsed.role
		};
	} catch {
		return null;
	}
}
