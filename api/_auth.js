import crypto from 'node:crypto';
import { query } from './_db.js';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 32 * 1024 * 1024;

const AES_ALGO = 'aes-256-gcm';

function secretKey() {
  return crypto.createHash('sha256').update(String(process.env.SESSION_SECRET || '')).digest();
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(AES_ALGO, secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSecret(value) {
  try {
    const [ivRaw, tagRaw, encryptedRaw] = String(value || '').split('.');

    if (!ivRaw || !tagRaw || !encryptedRaw) return null;

    const decipher = crypto.createDecipheriv(
      AES_ALGO,
      secretKey(),
      Buffer.from(ivRaw, 'base64url')
    );

    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64url')),
      decipher.final()
    ]).toString('utf8');
  } catch (_) {
    return null;
  }
}

export function hash(v) {
  return crypto.createHash('sha256').update(String(v)).digest('hex');
}

export function secretHash(v) {
  const secret = process.env.SESSION_SECRET || '';
  return crypto.createHmac('sha256', secret).update(String(v)).digest('hex');
}

/**
 * Generates a registration code in the exact format:
 * XXXX-XXXX-XXXX
 *
 * Only A-Z and 0-9 are allowed inside the code.
 * This prevents '-' or '_' from being generated accidentally.
 */
export function randomCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(12);
  let raw = '';

  for (let i = 0; i < 12; i++) {
    raw += alphabet[bytes[i] % alphabet.length];
  }

  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);

  const derived = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(password, stored) {
  const value = String(stored || '');
  const parts = value.split('$');

  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;

  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  if (
    N < 16384 ||
    N > 262144 ||
    r < 1 ||
    r > 32 ||
    p < 1 ||
    p > 4
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltRaw, 'base64url');
    const expected = Buffer.from(hashRaw, 'base64url');

    if (!salt.length || expected.length !== SCRYPT_KEYLEN) {
      return false;
    }

    const supplied = crypto.scryptSync(
      String(password),
      salt,
      expected.length,
      {
        N,
        r,
        p,
        maxmem: Math.max(SCRYPT_MAXMEM, 128 * N * r + 1024)
      }
    );

    return crypto.timingSafeEqual(supplied, expected);
  } catch (_) {
    return false;
  }
}

export async function adminFrom(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';

  if (!token || token.length < 20) return false;

  const tokenHash = secretHash(token);

  const rows = await query(
    'SELECT id FROM admin_sessions WHERE token_hash=$1 AND expires_at>now()',
    [tokenHash]
  );

  return rows.length > 0;
}

export function send(res, status, data) {
  res
    .status(status)
    .setHeader('Content-Type', 'application/json; charset=utf-8');

  res.end(JSON.stringify(data));
}
