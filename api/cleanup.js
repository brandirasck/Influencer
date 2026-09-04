import {query} from './_db.js';
export default async function handler(req,res){
 const secret=req.headers['x-cron-secret']||req.query?.secret; if(process.env.CRON_SECRET && secret!==process.env.CRON_SECRET)return res.status(401).end();
 await query("DELETE FROM temporary_registrations WHERE expires_at<=now()");
 await query("DELETE FROM registration_codes WHERE expires_at<=now() AND status IN ('ACTIVE','RESERVED','EXPIRED')");
 await query("DELETE FROM admin_sessions WHERE expires_at<=now()");
 res.status(200).json({ok:true});
}
