import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import apiHandler from '../../api/index.js';

function makeReq(event) {
  const req = new EventEmitter();
  req.method = event.httpMethod || 'GET';
  req.query = event.queryStringParameters || {};
  req.headers = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
  process.nextTick(() => {
    if (event.body) {
      const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body);
      req.emit('data', raw);
    }
    req.emit('end');
  });
  return req;
}

function makeRes() {
  const state = { statusCode: 200, headers: {}, body: null };
  return {
    state,
    status(code) { state.statusCode = code; return this; },
    setHeader(name, value) { state.headers[name] = String(value); return this; },
    json(data) {
      state.headers['Content-Type'] = 'application/json';
      state.body = Buffer.from(JSON.stringify(data));
      return this;
    },
    end(body) {
      if (body === undefined) body = '';
      state.body = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
      return this;
    }
  };
}

export async function handler(event) {
  const req = makeReq(event);
  const res = makeRes();
  await apiHandler(req, res);
  const contentType = Object.entries(res.state.headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1] || '';
  const binary = Buffer.isBuffer(res.state.body) && !contentType.includes('application/json') && !contentType.startsWith('text/');
  return {
    statusCode: res.state.statusCode,
    headers: res.state.headers,
    body: (res.state.body || Buffer.alloc(0)).toString(binary ? 'base64' : 'utf8'),
    isBase64Encoded: binary
  };
}
