import { query } from '../../api/_db.js';

export async function handler() {
  try {
    await query("DELETE FROM temporary_registrations WHERE expires_at<=now()");
    await query("DELETE FROM registration_codes WHERE expires_at<=now() AND status IN ('ACTIVE','RESERVED','EXPIRED')");
    await query("DELETE FROM admin_sessions WHERE expires_at<=now()");
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'CLEANUP_FAILED' }) };
  }
}
