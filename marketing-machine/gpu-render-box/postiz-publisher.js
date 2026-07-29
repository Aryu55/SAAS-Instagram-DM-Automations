// postiz-publisher.js — Publishes rendered videos to Postiz for social scheduling
// Reads script.json (local temp → R2 fallback), constructs a caption, and POSTs to Postiz API.

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const POSTIZ_API_URL = process.env.POSTIZ_API_URL || 'http://localhost:3000/api/posts';
const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY || '';
const WORKER_BASE_URL =
  process.env.WORKER_BASE_URL ||
  'https://marketing-machine-orchestrator.mindmaxing.workers.dev';

/**
 * Attempt to read script.json from the local temp directory.
 * Falls back to fetching from R2 via the Worker URL.
 */
async function loadScript(business, jobId) {
  // 1. Try local temp directory
  const localPath = path.join(__dirname, 'temp', jobId, 'script.json');
  if (fs.existsSync(localPath)) {
    console.log(`[postiz] Loading script.json from local path: ${localPath}`);
    const raw = fs.readFileSync(localPath, 'utf-8');
    return JSON.parse(raw);
  }

  // 2. Fall back to R2 via Worker
  const r2Url = `${WORKER_BASE_URL}/assets/${business}/${jobId}/script.json`;
  console.log(`[postiz] Local script.json not found, fetching from R2: ${r2Url}`);
  const res = await fetch(r2Url);
  if (!res.ok) {
    throw new Error(`Failed to fetch script.json from R2: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Build the social-media caption from the script object.
 */
function buildCaption(script) {
  const hook = script.hook || '';
  const body = Array.isArray(script.body) ? script.body.join('\n') : (script.body || '');
  const cta = script.cta || '';
  const hashtags = '#hisaab #freelancer #taxwriteoffs #accounting';

  return `${hook}\n\n${body}\n\n${cta}\n\n${hashtags}`;
}

/**
 * Publish a completed render to Postiz for social scheduling.
 *
 * @param {string} business — business slug (e.g. "hisaab")
 * @param {string} jobId   — unique render job ID
 */
async function publishToPostiz(business, jobId) {
  if (!POSTIZ_API_KEY) {
    console.warn('[postiz] ⚠️  POSTIZ_API_KEY is not set — skipping publish.');
    return;
  }

  console.log(`[postiz] Publishing job ${jobId} for business "${business}"…`);

  // Load and parse the script
  const script = await loadScript(business, jobId);
  const caption = buildCaption(script);

  // Construct the public video URL
  const videoUrl = `${WORKER_BASE_URL}/assets/${business}/${jobId}/final_marketing_reel.mp4`;

  // POST to Postiz
  const response = await fetch(POSTIZ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POSTIZ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: caption,
      media: [{ url: videoUrl, type: 'video' }],
      type: 'social',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(no body)');
    throw new Error(`Postiz API error ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  console.log(`[postiz] ✅ Post created successfully:`, result.id || result);
}

module.exports = { publishToPostiz };
