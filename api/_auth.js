import crypto from 'crypto';
import {query} from './_db.js';
export function hash(v){return crypto.createHash('sha256').update(String(v)).digest('hex')}
export function randomCode(){return crypto.randomBytes(9).toString('base64url').toUpperCase().slice(0,12)}
export function randomToken(){return crypto.randomBytes(32).toString('base64url')}
export async function adminFrom(req){
  const h=req.headers.authorization||''; const token=h.startsWith('Bearer ')?h.slice(7):''; if(!token)return false;
  const rows=await query('SELECT id FROM admin_sessions WHERE token_hash=$1 AND expires_at>now()',[hash(token)]); return rows.length>0;
}
export function send(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
