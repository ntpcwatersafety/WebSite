const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
};

const CMS_SECTION_FILE_NAMES = {
  home: 'home.json',
  media: 'media.json',
  results: 'results.json',
  gallery: 'gallery.json',
  thankyou: 'thankyou.json'
};

const DEFAULT_CMS_DATA_ROOT = 'public/cms';
const DEFAULT_EDITOR_IMAGE_ROOT = 'public/images/editor';
const ALLOWED_EDITOR_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

const inferCmsDataRoot = (candidate) => {
  if (!candidate) return DEFAULT_CMS_DATA_ROOT;

  const normalized = String(candidate).replace(/\\/g, '/').replace(/\/$/, '');
  if (!normalized.endsWith('.json')) return normalized;

  const lastSlash = normalized.lastIndexOf('/');
  const parent = lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
  return `${parent ? `${parent}/` : ''}cms`;
};

const getConfig = (env) => {
  const legacyDataPath = env.DATA_PATH || env.GITHUB_DATA_PATH || 'public/cms-data.json';

  return {
    adminUser: env.ADMIN_USER || null,
    adminPass: env.ADMIN_PASS || null,
    jwtSecret: env.JWT_SECRET || null,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '24h',
    githubToken: env.GITHUB_TOKEN || null,
    githubOwner: env.OWNER || env.GITHUB_OWNER || 'ntpcwatersafety',
    githubRepo: env.REPO || env.GITHUB_REPO || 'WebSite',
    githubBranch: env.BRANCH || env.GITHUB_BRANCH || 'main',
    githubDataRoot: inferCmsDataRoot(env.DATA_ROOT || env.GITHUB_DATA_ROOT || legacyDataPath),
    githubImageRoot: (env.IMAGE_UPLOAD_ROOT || DEFAULT_EDITOR_IMAGE_ROOT).replace(/\\/g, '/').replace(/\/$/, '')
  };
};

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

const createEmptyCmsData = () => ({
  lastUpdated: '',
  homeNews: [],
  mediaReports: [],
  awards: [],
  testimonials: [],
  trainingRecords: [],
  galleryItems: [],
  introContent: '',
  thankYouItems: []
});

const createEmptyCmsSplitData = () => ({
  home: { lastUpdated: '', introContent: '', homeNews: [] },
  media: { lastUpdated: '', mediaReports: [], awards: [] },
  results: { lastUpdated: '', testimonials: [], trainingRecords: [] },
  gallery: { lastUpdated: '', galleryItems: [] },
  thankyou: { lastUpdated: '', thankYouItems: [] }
});

const normalizeCmsData = (raw) => {
  const empty = createEmptyCmsData();

  return {
    lastUpdated: typeof raw?.lastUpdated === 'string' ? raw.lastUpdated : empty.lastUpdated,
    homeNews: Array.isArray(raw?.homeNews) ? raw.homeNews : empty.homeNews,
    mediaReports: Array.isArray(raw?.mediaReports) ? raw.mediaReports : empty.mediaReports,
    awards: Array.isArray(raw?.awards) ? raw.awards : empty.awards,
    testimonials: Array.isArray(raw?.testimonials) ? raw.testimonials : empty.testimonials,
    trainingRecords: Array.isArray(raw?.trainingRecords) ? raw.trainingRecords : empty.trainingRecords,
    galleryItems: Array.isArray(raw?.galleryItems) ? raw.galleryItems : empty.galleryItems,
    introContent: typeof raw?.introContent === 'string' ? raw.introContent : empty.introContent,
    thankYouItems: Array.isArray(raw?.thankYouItems) ? raw.thankYouItems : empty.thankYouItems
  };
};

const normalizeCmsSplitData = (raw) => {
  const empty = createEmptyCmsSplitData();

  return {
    home: {
      lastUpdated: typeof raw?.home?.lastUpdated === 'string' ? raw.home.lastUpdated : empty.home.lastUpdated,
      introContent: typeof raw?.home?.introContent === 'string' ? raw.home.introContent : empty.home.introContent,
      homeNews: Array.isArray(raw?.home?.homeNews) ? raw.home.homeNews : empty.home.homeNews
    },
    media: {
      lastUpdated: typeof raw?.media?.lastUpdated === 'string' ? raw.media.lastUpdated : empty.media.lastUpdated,
      mediaReports: Array.isArray(raw?.media?.mediaReports) ? raw.media.mediaReports : empty.media.mediaReports,
      awards: Array.isArray(raw?.media?.awards) ? raw.media.awards : empty.media.awards
    },
    results: {
      lastUpdated: typeof raw?.results?.lastUpdated === 'string' ? raw.results.lastUpdated : empty.results.lastUpdated,
      testimonials: Array.isArray(raw?.results?.testimonials) ? raw.results.testimonials : empty.results.testimonials,
      trainingRecords: Array.isArray(raw?.results?.trainingRecords) ? raw.results.trainingRecords : empty.results.trainingRecords
    },
    gallery: {
      lastUpdated: typeof raw?.gallery?.lastUpdated === 'string' ? raw.gallery.lastUpdated : empty.gallery.lastUpdated,
      galleryItems: Array.isArray(raw?.gallery?.galleryItems) ? raw.gallery.galleryItems : empty.gallery.galleryItems
    },
    thankyou: {
      lastUpdated: typeof raw?.thankyou?.lastUpdated === 'string' ? raw.thankyou.lastUpdated : empty.thankyou.lastUpdated,
      thankYouItems: Array.isArray(raw?.thankyou?.thankYouItems) ? raw.thankyou.thankYouItems : empty.thankyou.thankYouItems
    }
  };
};

const mergeCmsSplitData = (raw) => {
  const normalized = normalizeCmsSplitData(raw);
  const timestamps = [
    normalized.home.lastUpdated,
    normalized.media.lastUpdated,
    normalized.results.lastUpdated,
    normalized.gallery.lastUpdated,
    normalized.thankyou.lastUpdated
  ].filter(Boolean);

  return normalizeCmsData({
    lastUpdated: timestamps.sort().at(-1) || '',
    introContent: normalized.home.introContent,
    homeNews: normalized.home.homeNews,
    mediaReports: normalized.media.mediaReports,
    awards: normalized.media.awards,
    testimonials: normalized.results.testimonials,
    trainingRecords: normalized.results.trainingRecords,
    galleryItems: normalized.gallery.galleryItems,
    thankYouItems: normalized.thankyou.thankYouItems
  });
};

const splitCmsData = (raw) => {
  const normalized = normalizeCmsData(raw);
  const timestamp = normalized.lastUpdated || new Date().toISOString();

  return normalizeCmsSplitData({
    home: {
      lastUpdated: timestamp,
      introContent: normalized.introContent || '',
      homeNews: normalized.homeNews
    },
    media: {
      lastUpdated: timestamp,
      mediaReports: normalized.mediaReports,
      awards: normalized.awards
    },
    results: {
      lastUpdated: timestamp,
      testimonials: normalized.testimonials,
      trainingRecords: normalized.trainingRecords
    },
    gallery: {
      lastUpdated: timestamp,
      galleryItems: normalized.galleryItems
    },
    thankyou: {
      lastUpdated: timestamp,
      thankYouItems: normalized.thankYouItems || []
    }
  });
};

const getRepoCmsPath = (config, fileKey) => `${config.githubDataRoot}/${CMS_SECTION_FILE_NAMES[fileKey]}`;

const githubRequest = async (config, path, options = {}) => fetch(`https://api.github.com${path}`, {
  ...options,
  headers: {
    ...githubHeaders(config),
    ...(options.headers || {})
  }
});

const getGithubContentFile = async (config, fileKey) => {
  const response = await githubRequest(
    config,
    `/repos/${config.githubOwner}/${config.githubRepo}/contents/${getRepoCmsPath(config, fileKey)}?ref=${config.githubBranch}`
  );

  if (response.status === 404) {
    return { key: fileKey, content: null, sha: null };
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return {
    key: fileKey,
    content: JSON.parse(base64ToUtf8(String(data.content || '').replace(/\n/g, ''))),
    sha: data.sha || null
  };
};

const getBranchRef = async (config) => {
  const response = await githubRequest(config, `/repos/${config.githubOwner}/${config.githubRepo}/git/ref/heads/${config.githubBranch}`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

const getCommit = async (config, commitSha) => {
  const response = await githubRequest(config, `/repos/${config.githubOwner}/${config.githubRepo}/git/commits/${commitSha}`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

const createBlob = async (config, content, encoding = 'utf-8') => {
  const response = await githubRequest(config, `/repos/${config.githubOwner}/${config.githubRepo}/git/blobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, encoding })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

const createTree = async (config, baseTreeSha, tree) => {
  const response = await githubRequest(config, `/repos/${config.githubOwner}/${config.githubRepo}/git/trees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: baseTreeSha, tree })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

const createCommit = async (config, message, treeSha, parentSha) => {
  const response = await githubRequest(config, `/repos/${config.githubOwner}/${config.githubRepo}/git/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

const updateBranchRef = async (config, commitSha) => {
  const response = await githubRequest(config, `/repos/${config.githubOwner}/${config.githubRepo}/git/refs/heads/${config.githubBranch}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commitSha, force: false })
  });
  if (!response.ok) {
    const error = new Error(await response.text());
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const verifyBearerAuth = async (request, config) => {
  if (!hasAdminAuthConfig(config)) {
    return { ok: false, response: jsonResponse({ message: 'Admin auth is not configured on worker' }, 503) };
  }

  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return { ok: false, response: jsonResponse({ message: 'Missing auth token' }, 401) };
  }

  try {
    await verifyToken(auth.slice('Bearer '.length), config.jwtSecret);
    return { ok: true };
  } catch {
    return { ok: false, response: jsonResponse({ message: 'Invalid auth token' }, 401) };
  }
};

const commitTreeEntries = async (config, treeEntries, message) => {
  const branchRef = await getBranchRef(config);
  const parentCommitSha = branchRef.object.sha;
  const parentCommit = await getCommit(config, parentCommitSha);
  const nextTree = await createTree(config, parentCommit.tree.sha, treeEntries);
  const nextCommit = await createCommit(config, message, nextTree.sha, parentCommitSha);
  await updateBranchRef(config, nextCommit.sha);
  return nextCommit;
};

const slugifyFileStem = (value) => {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized || 'image';
};

const inferExtension = (file) => {
  const name = typeof file?.name === 'string' ? file.name : '';
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  if (extMatch) return extMatch[1].toLowerCase();

  const mime = typeof file?.type === 'string' ? file.type.toLowerCase() : '';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/svg+xml') return 'svg';
  return 'png';
};

const buildEditorImageRepoPath = (config, file) => {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const extension = inferExtension(file);
  const stem = slugifyFileStem(file?.name || 'image');
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${config.githubImageRoot}/${year}/${month}/${stem}-${uniqueSuffix}.${extension}`;
};

const toPublicAssetUrl = (repoPath) => `/${String(repoPath).replace(/^public\//, '')}`;

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

  const fileKeys = Object.keys(CMS_SECTION_FILE_NAMES);
  const files = await Promise.all(fileKeys.map((fileKey) => getGithubContentFile(config, fileKey)));

  const splitData = {};
  const shas = {};
  for (const file of files) {
    splitData[file.key] = file.content || undefined;
    if (file.sha) shas[file.key] = file.sha;
  }

  return jsonResponse({
    content: mergeCmsSplitData(splitData),
    shas
  });
};

const handlePutCms = async (request, config) => {
  const authResult = await verifyBearerAuth(request, config);
  if (!authResult.ok) {
    return authResult.response;
  }

  if (!config.githubToken) {
    return jsonResponse({ message: 'GitHub token not configured on worker' }, 503);
  }

  const body = await parseJson(request);
  if (!body?.newData) return jsonResponse({ message: 'Missing newData' }, 400);

  const nextData = normalizeCmsData({
    ...body.newData,
    lastUpdated: new Date().toISOString()
  });
  const splitData = splitCmsData(nextData);
  const expectedShas = body.shas || {};
  const fileKeys = Object.keys(CMS_SECTION_FILE_NAMES);

  const currentFiles = await Promise.all(fileKeys.map((fileKey) => getGithubContentFile(config, fileKey)));
  for (const file of currentFiles) {
    const expectedSha = expectedShas[file.key] || null;
    const currentSha = file.sha || null;
    if (expectedSha !== currentSha) {
      return jsonResponse({ message: 'CMS data has changed on GitHub. Please reload and try again.' }, 409);
    }
  }

  try {
    const tree = [];
    for (const fileKey of fileKeys) {
      const blob = await createBlob(config, JSON.stringify(splitData[fileKey], null, 2));
      tree.push({
        path: getRepoCmsPath(config, fileKey),
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }

    const nextCommit = await commitTreeEntries(config, tree, body.commitMessage || 'Update CMS content');

    return jsonResponse({ ok: true, commitSha: nextCommit.sha });
  } catch (error) {
    if (error?.status === 409 || error?.status === 422) {
      return jsonResponse({ message: 'CMS data has changed on GitHub. Please reload and try again.' }, 409);
    }
    return jsonResponse({ message: error instanceof Error ? error.message : 'Failed to update CMS on GitHub' }, 500);
  }
};

const handleUploadImage = async (request, config) => {
  const authResult = await verifyBearerAuth(request, config);
  if (!authResult.ok) {
    return authResult.response;
  }

  if (!config.githubToken) {
    return jsonResponse({ message: 'GitHub token not configured on worker' }, 503);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return jsonResponse({ message: 'Missing image file' }, 400);
  }

  if (!ALLOWED_EDITOR_IMAGE_TYPES.has(String(file.type || '').toLowerCase())) {
    return jsonResponse({ message: 'Only JPG, PNG, WEBP, and GIF uploads are allowed' }, 400);
  }

  if (file.size > 8 * 1024 * 1024) {
    return jsonResponse({ message: 'Image is too large. Please keep it under 8 MB.' }, 400);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const repoPath = buildEditorImageRepoPath(config, file);
    const blob = await createBlob(config, bytesToBase64(new Uint8Array(arrayBuffer)), 'base64');
    const nextCommit = await commitTreeEntries(config, [{
      path: repoPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    }], `Upload editor image: ${file.name || 'image'}`);

    return jsonResponse({
      ok: true,
      url: toPublicAssetUrl(repoPath),
      path: repoPath,
      commitSha: nextCommit.sha
    });
  } catch (error) {
    if (error?.status === 409 || error?.status === 422) {
      return jsonResponse({ message: 'Repository changed while uploading image. Please try again.' }, 409);
    }
    return jsonResponse({ message: error instanceof Error ? error.message : 'Failed to upload image' }, 500);
  }
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

  if (url.pathname === '/api/upload-image' && request.method === 'POST') {
    return handleUploadImage(request, config);
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
