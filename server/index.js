import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';

// Use global fetch when running on Node 18+; do not require node-fetch by default.
const fetch = globalThis.fetch;

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Config - 登入相關敏感資訊必須由環境變數提供
const ADMIN_USER = process.env.ADMIN_USER || null;
const ADMIN_PASS = process.env.ADMIN_PASS || null;
const JWT_SECRET = process.env.JWT_SECRET || null;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 支援 GitHub Variables (OWNER/REPO/BRANCH/DATA_PATH) 或舊的 GITHUB_ 前綴
const GITHUB_OWNER = process.env.OWNER || process.env.GITHUB_OWNER || 'ntpcwatersafety';
const GITHUB_REPO = process.env.REPO || process.env.GITHUB_REPO || 'WebSite';
const GITHUB_BRANCH = process.env.BRANCH || process.env.GITHUB_BRANCH || 'main';
const GITHUB_DATA_PATH = process.env.DATA_PATH || process.env.GITHUB_DATA_PATH || 'public/cms-data.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

const hasAdminAuthConfig = () => !!(ADMIN_USER && ADMIN_PASS && JWT_SECRET);
const getMissingAdminAuthEnvVars = () => {
  const missing = [];
  if (!ADMIN_USER) missing.push('ADMIN_USER');
  if (!ADMIN_PASS) missing.push('ADMIN_PASS');
  if (!JWT_SECRET) missing.push('JWT_SECRET');
  return missing;
};

// POST /api/login
app.post('/api/login', (req, res) => {
  if (!hasAdminAuthConfig()) {
    return res.status(503).json({ message: 'Admin auth is not configured on server' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const decoded = jwt.decode(token);
    const expiry = decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    return res.json({ token, expiry });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// GET /api/verify-token - 驗證前端傳來的 JWT 是否有效
app.get('/api/verify-token', (req, res) => {
  if (!hasAdminAuthConfig()) return res.status(503).json({ valid: false, message: 'Admin auth is not configured on server' });

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ valid: false });
  const token = auth.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true });
  } catch (e) {
    return res.status(401).json({ valid: false });
  }
});

// GET /api/github/status
app.get('/api/github/status', (req, res) => {
  res.json({
    hasToken: !!GITHUB_TOKEN,
    authConfigured: hasAdminAuthConfig(),
    missingAuthEnvVars: getMissingAdminAuthEnvVars()
  });
});

// Helper to call GitHub API
const githubHeaders = () => {
  if (!GITHUB_TOKEN) return { Accept: 'application/vnd.github.v3+json' };
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  };
};

// GET /api/cms - 取得 cms-data.json 從 GitHub
app.get('/api/cms', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(503).json({ message: 'GitHub token not configured on server' });
    }

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_DATA_PATH}?ref=${GITHUB_BRANCH}`;
    const response = await fetch(url, { headers: githubHeaders() });
    if (response.status === 404) {
      return res.status(404).json({ message: 'CMS file not found on GitHub' });
    }
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ message: errText });
    }

    const data = await response.json();
    const base64Content = (data.content || '').replace(/\n/g, '');
    const decoded = Buffer.from(base64Content, 'base64').toString('utf8');
    const content = JSON.parse(decoded);
    return res.json({ content, sha: data.sha });
  } catch (error) {
    console.error('GET /api/cms error', error);
    return res.status(500).json({ message: 'Failed to fetch cms from GitHub' });
  }
});

// PUT /api/cms - 更新 cms-data.json（需管理員 JWT）
app.put('/api/cms', async (req, res) => {
  try {
    if (!hasAdminAuthConfig()) {
      return res.status(503).json({ message: 'Admin auth is not configured on server' });
    }

    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing auth token' });
    const token = auth.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid auth token' });
    }

    if (!GITHUB_TOKEN) {
      return res.status(503).json({ message: 'GitHub token not configured on server' });
    }

    const { newData, commitMessage, sha } = req.body || {};
    if (!newData) return res.status(400).json({ message: 'Missing newData' });

    // 更新 lastUpdated
    newData.lastUpdated = new Date().toISOString();

    const contentBase64 = Buffer.from(JSON.stringify(newData, null, 2), 'utf8').toString('base64');

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_DATA_PATH}`;
    const body = {
      message: commitMessage || '📝 Update cms-data.json',
      content: contentBase64,
      sha: sha || undefined,
      branch: GITHUB_BRANCH
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: githubHeaders(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMessage = err.message || 'GitHub API error';
      const isVersionConflict = response.status === 409 || /sha|does not match|outdated/i.test(errMessage);
      if (isVersionConflict) {
        return res.status(409).json({ message: 'CMS data has changed on GitHub. Please reload and try again.', detail: err });
      }
      return res.status(response.status).json({ message: errMessage, detail: err });
    }

    const resp = await response.json();
    return res.json({ ok: true, resp });
  } catch (error) {
    console.error('PUT /api/cms error', error);
    return res.status(500).json({ message: 'Failed to update cms on GitHub' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  if (!hasAdminAuthConfig()) {
    console.warn(`Admin auth env vars are missing: ${getMissingAdminAuthEnvVars().join(', ')}`);
    console.warn('Set ADMIN_USER, ADMIN_PASS and JWT_SECRET before using /api/login or /api/cms.');
  }
  console.log(`Auth/CMS proxy server running on port ${PORT}`);
});