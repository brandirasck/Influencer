import pg from 'pg';
const {Pool}=pg;
let pool;
export function db(){
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:3});
  return pool;
}
export async function query(text,params=[]){return (await db().query(text,params)).rows;}
