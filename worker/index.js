const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...JSON_HEADERS,
    ...CORS_HEADERS
  }
});

const parseJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const toBase64Url = (input) => input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const fromBase64Url = (input) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return normalized + padding;
};

const encodeJsonSegment = (value) => toBase64Url(btoa(JSON.stringify(value)));
const decodeJsonSegment = (value) => JSON.parse(atob(fromBase64Url(value)));

const stringToBase64 = (value) => {
  let binary = '';
  const bytes = textEncoder.encode(value);
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const bytesToBase64 = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const base64ToUtf8 = (value) => {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return textDecoder.decode(bytes);
};

const importHmacKey = async (secret) => crypto.subtle.importKey(
  'raw',
  textEncoder.encode(secret),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

const signToken = async (payload, secret) => {
  const key = await importHmacKey(secret);
  const headerSegment = encodeJsonSegment({ alg: 'HS256', typ: 'JWT' });
  const payloadSegment = encodeJsonSegment(payload);
  const data = `${headerSegment}.${payloadSegment}`;
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data));
  const signatureSegment = toBase64Url(bytesToBase64(new Uint8Array(signature)));
  return `${data}.${signatureSegment}`;
};

const verifyToken = async (token, secret) => {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [headerSegment, payloadSegment, signatureSegment] = parts;
  const header = decodeJsonSegment(headerSegment);
  if (header.alg !== 'HS256') throw new Error('Unsupported algorithm');

  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    Uint8Array.from(atob(fromBase64Url(signatureSegment)), (char) => char.charCodeAt(0)),
    textEncoder.encode(`${headerSegment}.${payloadSegment}`)
  );

  if (!valid) throw new Error('Invalid signature');

  const payload = decodeJsonSegment(payloadSegment);
  if (payload.exp && Date.now() >= payload.exp * 1000) throw new Error('Token expired');
  return payload;
};

const parseDurationMs = (value) => {
  if (!value) return 24 * 60 * 60 * 1000;
  if (/^\d+$/.test(value)) return Number(value) * 1000;

  const match = String(value).trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) return 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return amount * multipliers[unit];
};

const getConfig = (env) => ({
  adminUser: env.ADMIN_USER || null,
  adminPass: env.ADMIN_PASS || null,
  jwtSecret: env.JWT_SECRET || null,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '24h',
  githubToken: env.GITHUB_TOKEN || null,
  githubOwner: env.OWNER || env.GITHUB_OWNER || 'ntpcwatersafety',
  githubRepo: env.REPO || env.GITHUB_REPO || 'WebSite',
  githubBranch: env.BRANCH || env.GITHUB_BRANCH || 'main',
  githubDataPath: env.DATA_PATH || env.GITHUB_DATA_PATH || 'public/cms-data.json'
});

const hasAdminAuthConfig = (config) => !!(config.adminUser && config.adminPass && config.jwtSecret);

const getMissingAdminAuthEnvVars = (config) => {
  const missing = [];
  if (!config.adminUser) missing.push('ADMIN_USER');
  if (!config.adminPass) missing.push('ADMIN_PASS');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  return missing;
};

const githubHeaders = (config) => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ntpcwsa-cms-worker'
  };
  if (config.githubToken) headers.Authorization = `Bearer ${config.githubToken}`;
  return headers;
};

const handleLogin = async (request, config) => {
  if (!hasAdminAuthConfig(config)) {
    return jsonResponse({ message: 'Admin auth is not configured on worker' }, 503);
  }

  const body = await parseJson(request);
  const username = body?.username;
  const password = body?.password;
  if (!username || !password) {
    return jsonResponse({ message: 'Missing username or password' }, 400);
  }

  if (username !== config.adminUser || password !== config.adminPass) {
    return jsonResponse({ message: 'Invalid credentials' }, 401);
  }

  const durationMs = parseDurationMs(config.jwtExpiresIn);
  const expiryMs = Date.now() + durationMs;
  const token = await signToken({
    sub: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiryMs / 1000)
  }, config.jwtSecret);

  return jsonResponse({ token, expiry: expiryMs });
};

const handleVerifyToken = async (request, config) => {
  if (!hasAdminAuthConfig(config)) {
    return jsonResponse({ valid: false, message: 'Admin auth is not configured on worker' }, 503);
  }

  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return jsonResponse({ valid: false }, 401);

  try {
    await verifyToken(auth.slice('Bearer '.length), config.jwtSecret);
    return jsonResponse({ valid: true });
  } catch {
    return jsonResponse({ valid: false }, 401);
  }
};

const handleGithubStatus = async (config) => jsonResponse({
  hasToken: !!config.githubToken,
  authConfigured: hasAdminAuthConfig(config),
  missingAuthEnvVars: getMissingAdminAuthEnvVars(config),
  backend: 'cloudflare-worker'
});

const handleGetCms = async (config) => {
  if (!config.githubToken) {
    return jsonResponse({ message: 'GitHub token not configured on worker' }, 503);
  }

  const url = `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/contents/${config.githubDataPath}?ref=${config.githubBranch}`;
  const response = await fetch(url, { headers: githubHeaders(config) });

  if (response.status === 404) {
    return jsonResponse({ message: 'CMS file not found on GitHub' }, 404);
  }

  if (!response.ok) {
    return jsonResponse({ message: await response.text() }, response.status);
  }

  const data = await response.json();
  const content = JSON.parse(base64ToUtf8(String(data.content || '').replace(/\n/g, '')));
  return jsonResponse({ content, sha: data.sha });
};

const handlePutCms = async (request, config) => {
  if (!hasAdminAuthConfig(config)) {
    return jsonResponse({ message: 'Admin auth is not configured on worker' }, 503);
  }

  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return jsonResponse({ message: 'Missing auth token' }, 401);

  try {
    await verifyToken(auth.slice('Bearer '.length), config.jwtSecret);
  } catch {
    return jsonResponse({ message: 'Invalid auth token' }, 401);
  }

  if (!config.githubToken) {
    return jsonResponse({ message: 'GitHub token not configured on worker' }, 503);
  }

  const body = await parseJson(request);
  if (!body?.newData) return jsonResponse({ message: 'Missing newData' }, 400);

  const newData = {
    ...body.newData,
    lastUpdated: new Date().toISOString()
  };

  const payload = {
    message: body.commitMessage || 'Update cms-data.json',
    content: stringToBase64(JSON.stringify(newData, null, 2)),
    sha: body.sha || undefined,
    branch: config.githubBranch
  };

  const url = `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/contents/${config.githubDataPath}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...githubHeaders(config),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errMessage = err.message || 'GitHub API error';
    const isVersionConflict = response.status === 409 || /sha|does not match|outdated/i.test(errMessage);
    if (isVersionConflict) {
      return jsonResponse({ message: 'CMS data has changed on GitHub. Please reload and try again.', detail: err }, 409);
    }
    return jsonResponse({ message: errMessage, detail: err }, response.status);
  }

  return jsonResponse({ ok: true, resp: await response.json() });
};

const handleRequest = async (request, env) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const config = getConfig(env);

  if (url.pathname === '/api/login' && request.method === 'POST') {
    return handleLogin(request, config);
  }

  if (url.pathname === '/api/verify-token' && request.method === 'GET') {
    return handleVerifyToken(request, config);
  }

  if (url.pathname === '/api/github/status' && request.method === 'GET') {
    return handleGithubStatus(config);
  }

  if (url.pathname === '/api/cms' && request.method === 'GET') {
    return handleGetCms(config);
  }

  if (url.pathname === '/api/cms' && request.method === 'PUT') {
    return handlePutCms(request, config);
  }

  return jsonResponse({ message: 'Not found' }, 404);
};

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return jsonResponse({ message: error instanceof Error ? error.message : 'Internal error' }, 500);
    }
  }
};