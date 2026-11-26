import crypto from 'node:crypto';

/**
 * Default VAPID P-256 keypair so Web Push works out-of-the-box on localhost and Vercel,
 * while remaining overridable via VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env variables.
 */
export const DEFAULT_VAPID_PUBLIC_KEY =
	'BDvK7-0gMf1nPm8QTlwAgWUqxtPTAgzaja4SUtlOrbrLPDyZkktKUdisijNElwvprU_N3cHWX1t22-pYqhUi59I';
const DEFAULT_VAPID_PRIVATE_KEY = '80oiQbXZl2PbK6IwPRlYjwh9VPTrwLnirXr8ObFN9aU';

export function getVapidKeys() {
	return {
		publicKey: process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY,
		privateKey: process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY,
		subject: process.env.VAPID_SUBJECT || 'mailto:admin@tymaxspirits.cz'
	};
}

export interface WebPushSubscriptionJson {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}

function base64UrlEncode(buf: Buffer): string {
	return buf.toString('base64url');
}

function createVapidJwt(
	audienceOrigin: string,
	subject: string,
	publicKeyB64: string,
	privateKeyB64: string
): string {
	const header = base64UrlEncode(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
	const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
	const payload = base64UrlEncode(
		Buffer.from(JSON.stringify({ aud: audienceOrigin, exp, sub: subject }))
	);
	const unsignedToken = `${header}.${payload}`;

	const pubBytes = Buffer.from(publicKeyB64, 'base64url');
	const x = base64UrlEncode(pubBytes.subarray(1, 33));
	const y = base64UrlEncode(pubBytes.subarray(33, 65));

	const jwkKey = crypto.createPrivateKey({
		key: {
			kty: 'EC',
			crv: 'P-256',
			x,
			y,
			d: privateKeyB64
		},
		format: 'jwk'
	});

	const signature = crypto.sign('sha256', Buffer.from(unsignedToken), {
		key: jwkKey,
		dsaEncoding: 'ieee-p1363'
	});

	return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

/**
 * Encrypts a UTF-8 JSON payload according to RFC 8291 (aes128gcm) for Web Push.
 */
function encryptRFC8291(
	payloadText: string,
	clientPublicKeyB64: string,
	clientAuthB64: string
): Buffer {
	const clientPub = Buffer.from(clientPublicKeyB64, 'base64url');
	const authSecret = Buffer.from(clientAuthB64, 'base64url');

	const serverECDH = crypto.createECDH('prime256v1');
	const serverPub = serverECDH.generateKeys();
	const sharedSecret = serverECDH.computeSecret(clientPub);

	const salt = crypto.randomBytes(16);

	// RFC 8291 key derivation: IKM = HKDF(salt=authSecret, ikm=sharedSecret, info="WebPush: info\0" || ua_public || as_public, L=32)
	const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0', 'ascii'), clientPub, serverPub]);
	const ikm = Buffer.from(crypto.hkdfSync('sha256', sharedSecret, authSecret, keyInfo, 32));

	const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'ascii');
	const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'ascii');

	const contentEncryptionKey = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, cekInfo, 16));
	const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, nonceInfo, 12));

	// Plaintext with 0x02 final record delimiter
	const plaintext = Buffer.concat([Buffer.from(payloadText, 'utf8'), Buffer.from([2])]);

	const cipher = crypto.createCipheriv('aes-128-gcm', contentEncryptionKey, nonce);
	const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

	// aes128gcm header: salt (16B) || rs (4B uint32BE = 4096) || idlen (1B = 65) || keyid (65B serverPub)
	const rsBuf = Buffer.alloc(4);
	rsBuf.writeUInt32BE(4096, 0);
	const idLenBuf = Buffer.from([serverPub.length]);

	return Buffer.concat([salt, rsBuf, idLenBuf, serverPub, encrypted]);
}

/**
 * Dispatches an encrypted Web Push message to a push service endpoint (Apple, Google FCM, Mozilla).
 */
export async function sendWebPushNotification(
	subscription: WebPushSubscriptionJson,
	payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number }> {
	const { publicKey, privateKey, subject } = getVapidKeys();
	const endpointUrl = new URL(subscription.endpoint);
	const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

	const jwt = createVapidJwt(audience, subject, publicKey, privateKey);
	const bodyBuffer = encryptRFC8291(
		JSON.stringify(payload),
		subscription.keys.p256dh,
		subscription.keys.auth
	);

	const response = await fetch(subscription.endpoint, {
		method: 'POST',
		headers: {
			Authorization: `vapid t=${jwt}, k=${publicKey}`,
			'Content-Encoding': 'aes128gcm',
			'Content-Type': 'application/octet-stream',
			TTL: '86400',
			Urgency: 'high'
		},
		body: new Uint8Array(bodyBuffer)
	});

	return {
		ok: response.ok,
		status: response.status
	};
}
