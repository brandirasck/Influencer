import crypto from 'crypto';
import {query} from './_db.js';
import {hash,randomCode,randomToken,adminFrom,send} from './_auth.js';

const tiers=[
 {max:100000,stories:400,reel:600,collab:1500},
 {max:300000,stories:500,reel:800,collab:1900},
 {max:500000,stories:600,reel:1000,collab:2300},
 {max:700000,stories:700,reel:1100,collab:3000},
 {max:Infinity,stories:800,reel:1200,collab:3400}
];
function prices(n){const t=tiers.find(x=>n<=x.max)||tiers.at(-1);return {stories:t.stories,reel:t.reel,collab:t.collab}}
function parseFollowers(v){const n=Number(String(v).replace(/,/g,'')); return Number.isFinite(n)&&n>=0?Math.floor(n):0}
function json(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{resolve(JSON.parse(b||'{}'))}catch(e){reject(e)}})})}

export default async function handler(req,res){
 try{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS') return res.status(204).end();
  const action=(req.query?.action)||'';
  if(req.method==='GET' && action==='health'){
   return send(res,200,{ok:true,service:'brandirasck-influencers-api',time:new Date().toISOString()});
  }
  if(req.method==='GET' && action==='catalog'){
   const rows=await query("SELECT id,profile,created_at,updated_at FROM catalog_influencers WHERE status='ACTIVE' ORDER BY created_at DESC"); return send(res,200,{items:rows});
  }
  if(req.method==='POST' && action==='validate-code'){
   const b=await json(req); const code=String(b.code||'').trim().toUpperCase();
   const rows=await query("UPDATE registration_codes SET status='RESERVED',reserved_until=LEAST(now()+interval '30 minutes', expires_at) WHERE code_hash=$1 AND status='ACTIVE' AND expires_at>now() RETURNING id,expires_at",[hash(code)]);
   if(!rows.length)return send(res,400,{ok:false,error:'INVALID_OR_EXPIRED_CODE'});
   return send(res,200,{ok:true,codeId:rows[0].id,expiresAt:rows[0].expires_at});
  }
  if(req.method==='POST' && action==='submit'){
   const b=await json(req); if(!b.codeId||!b.payload)return send(res,400,{error:'BAD_REQUEST'});
   if(typeof b.payload!=='object' || Array.isArray(b.payload))return send(res,400,{error:'BAD_PAYLOAD'});
   const downloadToken=randomToken();
   const r=await query("WITH claimed AS (UPDATE registration_codes SET status='USED',used_at=now() WHERE id=$1 AND status='RESERVED' AND reserved_until>now() AND expires_at>now() RETURNING id) INSERT INTO temporary_registrations(code_id,payload,download_token_hash,agreement_version,accepted_at,status,expires_at) SELECT id,$2,$3,$4,now(),'PENDING_REVIEW',now()+interval '30 minutes' FROM claimed RETURNING id,expires_at",[b.codeId,b.payload,hash(downloadToken),'BRANDIRASCK-INFLUENCER-AGREEMENT-V1']);
   if(!r.length)return send(res,400,{error:'CODE_NOT_AVAILABLE'});
   return send(res,200,{ok:true,registrationId:r[0].id,downloadToken,expiresAt:r[0].expires_at});
  }
  if(req.method==='POST' && action==='pdf'){
   const b=await json(req); if(!b.registrationId||!b.pdfBase64||!b.downloadToken)return send(res,400,{error:'BAD_REQUEST'});
   const rows=await query("SELECT id FROM temporary_registrations WHERE id=$1 AND download_token_hash=$2 AND expires_at>now()",[b.registrationId,hash(b.downloadToken)]); if(!rows.length)return send(res,404,{error:'REGISTRATION_EXPIRED'});
   const buf=Buffer.from(b.pdfBase64,'base64'); if(buf.length>12*1024*1024)return send(res,413,{error:'PDF_TOO_LARGE'});
   await query("UPDATE temporary_registrations SET pdf=$2,pdf_downloaded_at=now() WHERE id=$1",[b.registrationId,buf]);
   return send(res,200,{ok:true,retentionMinutes:30});
  }
  if(req.method==='GET' && action==='download-pdf'){
   const id=String(req.query?.registrationId||''), token=String(req.query?.token||'');
   const rows=await query("SELECT pdf FROM temporary_registrations WHERE id=$1 AND download_token_hash=$2 AND expires_at>now() AND pdf IS NOT NULL",[id,hash(token)]);
   if(!rows.length)return res.status(404).end();
   res.setHeader('Content-Type','application/pdf'); res.setHeader('Content-Disposition','attachment; filename="BRANDIRASCK-Influencer-Agreement.pdf"'); res.setHeader('Cache-Control','no-store'); return res.end(rows[0].pdf);
  }
  if(req.method==='POST' && action==='admin-login'){
   const b=await json(req); if(String(b.username||'')!==String(process.env.ADMIN_USERNAME||''))return send(res,401,{error:'INVALID_LOGIN'});
   const expected=process.env.ADMIN_PASSWORD_HASH||''; const supplied=hash(b.password||''); if(expected && !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return send(res,401,{error:'INVALID_LOGIN'});
   if(!expected && String(b.password||'')!==String(process.env.ADMIN_PASSWORD||''))return send(res,401,{error:'INVALID_LOGIN'});
   const token=randomToken(); await query("INSERT INTO admin_sessions(token_hash,expires_at) VALUES($1,now()+interval '12 hours')",[hash(token)]); return send(res,200,{token});
  }
  if(req.method==='POST' && action==='admin-logout'){
   const h=req.headers.authorization||''; const adminToken=h.startsWith('Bearer ')?h.slice(7):'';
   if(adminToken) await query('DELETE FROM admin_sessions WHERE token_hash=$1',[hash(adminToken)]);
   return send(res,200,{ok:true});
  }
  if(req.method==='POST' && action==='admin-generate-code'){
   if(!(await adminFrom(req)))return send(res,401,{error:'UNAUTHORIZED'}); const code=randomCode(); await query("INSERT INTO registration_codes(code_hash,status,expires_at) VALUES($1,'ACTIVE',now()+interval '30 minutes')",[hash(code)]); return send(res,200,{code,expiresMinutes:30});
  }
  if(req.method==='GET' && action==='admin-codes'){
   if(!(await adminFrom(req)))return send(res,401,{error:'UNAUTHORIZED'}); const rows=await query("SELECT id,CASE WHEN status IN ('ACTIVE','RESERVED') AND expires_at<=now() THEN 'EXPIRED' ELSE status END AS status,created_at,expires_at,used_at FROM registration_codes ORDER BY created_at DESC LIMIT 100"); return send(res,200,{items:rows});
  }
  if(req.method==='GET' && action==='admin-temp'){
   if(!(await adminFrom(req)))return send(res,401,{error:'UNAUTHORIZED'}); const rows=await query("SELECT id,payload,expires_at,pdf IS NOT NULL AS has_pdf,status,agreement_version,accepted_at,created_at FROM temporary_registrations WHERE expires_at>now() ORDER BY created_at DESC"); return send(res,200,{items:rows});
  }
  if(req.method==='GET' && action==='admin-pdf'){
   if(!(await adminFrom(req)))return send(res,401,{error:'UNAUTHORIZED'}); const rows=await query("SELECT pdf FROM temporary_registrations WHERE id=$1 AND expires_at>now()",[req.query.id]); if(!rows.length||!rows[0].pdf)return res.status(404).end(); res.setHeader('Content-Type','application/pdf');res.setHeader('Cache-Control','no-store');return res.end(rows[0].pdf);
  }
  if(req.method==='POST' && action==='admin-approve'){
   if(!(await adminFrom(req)))return send(res,401,{error:'UNAUTHORIZED'}); const b=await json(req); const rows=await query("SELECT id,code_id,payload,status,pdf IS NOT NULL AS has_pdf FROM temporary_registrations WHERE id=$1 AND expires_at>now()",[b.id]); if(!rows.length)return send(res,404,{error:'EXPIRED'}); if(rows[0].status==='APPROVED')return send(res,200,{ok:true,alreadyApproved:true}); if(!rows[0].has_pdf)return send(res,400,{error:'PDF_NOT_READY'});
   const p=rows[0].payload; const publicProfile={name:p.name,nickname:p.nickname,city:p.city,type:p.type,categories:p.categories,platforms:p.platforms,services:p.services,featuredPhotos:p.featuredPhotos,profilePhoto:p.profilePhoto};
   const r=await query("INSERT INTO catalog_influencers(source_registration,profile,status) VALUES($1,$2,'ACTIVE') ON CONFLICT (source_registration) WHERE source_registration IS NOT NULL DO NOTHING RETURNING id",[rows[0].id,publicProfile]);
   await query("UPDATE temporary_registrations SET status='APPROVED' WHERE id=$1",[rows[0].id]);
   return send(res,200,{ok:true,catalogId:r[0]?.id||null,alreadyApproved:!r.length});
  }
  return send(res,404,{error:'NOT_FOUND'});
 }catch(e){console.error(e);return send(res,500,{error:'SERVER_ERROR',message:process.env.NODE_ENV==='development'?e.message:'Unexpected error'})}
}
