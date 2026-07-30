#!/usr/bin/env node
// webhook-server.js — Production-Hardened Render Agent Webhook Server
// Serial queue (BullMQ + Redis, concurrency=1) for overnight batching without CPU/RAM collapse.
// SSE Real-Time Progress Streaming to mobile UI.

require('dotenv').config();
const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { executeRenderJob } = require('./render');
const { publishToPostiz } = require('./postiz-publisher');

const app = express();
const PORT = process.env.PORT || 4000;
const progressEvents = new EventEmitter();
progressEvents.setMaxListeners(100);

app.use(express.json());

// Enable CORS for SSE and API access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Configure R2 Client (S3 Compatible API)
let s3;
const hasS3Creds = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;
if (hasS3Creds) {
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'marketing-machine-assets';

async function downloadR2File(key, localPath) {
  if (!hasS3Creds) {
    const mockR2Path = path.join(__dirname, 'mock_r2', key);
    if (!fs.existsSync(mockR2Path)) {
      throw new Error(`Mock R2 file not found: ${mockR2Path}`);
    }
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.copyFileSync(mockR2Path, localPath);
    return;
  }
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  const response = await s3.send(command);
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    const writer = fs.createWriteStream(localPath);
    response.Body.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function uploadR2File(localPath, key, contentType = 'audio/wav') {
  if (!hasS3Creds) {
    const mockR2Path = path.join(__dirname, 'mock_r2', key);
    fs.mkdirSync(path.dirname(mockR2Path), { recursive: true });
    fs.copyFileSync(localPath, mockR2Path);
    return;
  }
  const fileStream = fs.createReadStream(localPath);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  });
  await s3.send(command);
}

// ── Redis & BullMQ Queue Setup (Concurrency = 1) ────────────────────────────────
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisConfig = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

const renderQueue = new Queue('render-queue', { connection: redisConfig });
const jobsState = new Map();

const worker = new Worker('render-queue', async (job) => {
  const { business, jobId } = job.data;
  console.log(`[BullMQ Worker] Processing render job: ${jobId} (Business: ${business})`);

  jobsState.set(jobId, {
    jobId,
    business,
    status: 'rendering',
    progress: 5,
    stage: 'INIT',
    message: 'Starting render pipeline execution...',
    startedAt: new Date().toISOString()
  });

  const onProgress = ({ stage, percent, message }) => {
    const currentState = jobsState.get(jobId) || {};
    const updatedState = {
      ...currentState,
      status: percent === 100 ? 'completed' : 'rendering',
      stage,
      progress: percent,
      message,
      updatedAt: new Date().toISOString()
    };
    jobsState.set(jobId, updatedState);
    progressEvents.emit('progress', updatedState);
  };

  try {
    await executeRenderJob(business, jobId, onProgress);

    const finalState = {
      jobId,
      business,
      status: 'completed',
      progress: 100,
      stage: 'DONE',
      message: 'Render successfully completed',
      finishedAt: new Date().toISOString()
    };
    jobsState.set(jobId, finalState);
    progressEvents.emit('progress', finalState);

    try {
      await publishToPostiz(business, jobId);
      console.log(`[render:${jobId}] Postiz publish triggered successfully`);
    } catch (err) {
      console.error(`[render:${jobId}] Postiz publish failed:`, err.message);
    }
  } catch (err) {
    console.error(`[BullMQ Worker] Job ${jobId} failed:`, err.message);
    const failedState = {
      jobId,
      business,
      status: 'failed',
      progress: 0,
      stage: 'FAILED',
      message: err.message,
      finishedAt: new Date().toISOString()
    };
    jobsState.set(jobId, failedState);
    progressEvents.emit('progress', failedState);
    throw err;
  }
}, {
  connection: redisConfig,
  concurrency: 1
});

// ── Health & Startup Preflight Check ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'alive',
    service: 'janus-render-agent',
    redis: 'connected',
    concurrencyLimit: 1
  });
});

app.get('/queue/status', async (_req, res) => {
  try {
    const waitingCount = await renderQueue.getWaitingCount();
    const activeCount = await renderQueue.getActiveCount();
    const completedCount = await renderQueue.getCompletedCount();
    const failedCount = await renderQueue.getFailedCount();

    res.json({
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      activeJobs: Array.from(jobsState.values()).filter(j => j.status === 'rendering')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SSE Real-Time Progress Endpoint ──────────────────────────────────────────────
app.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const current = jobsState.get(jobId);
  if (current) {
    res.write(`data: ${JSON.stringify(current)}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ jobId, status: 'queued', progress: 0, message: 'Waiting in queue...' })}\n\n`);
  }

  const listener = (data) => {
    if (data.jobId === jobId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (data.status === 'completed' || data.status === 'failed') {
        progressEvents.off('progress', listener);
        res.end();
      }
    }
  };

  progressEvents.on('progress', listener);

  req.on('close', () => {
    progressEvents.off('progress', listener);
  });
});

// ── Audio Extraction Endpoint ──────────────────────────────────────────────────
app.post('/extract-audio', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.FACTORY_SECRET}`;
  if (!process.env.FACTORY_SECRET || authHeader !== expectedToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { sourceVideoKey } = req.body || {};
  if (!sourceVideoKey) {
    return res.status(400).json({ success: false, error: 'Missing sourceVideoKey' });
  }

  const tempDir = path.join(__dirname, 'temp', `extract_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const localVideoPath = path.join(tempDir, 'source_video.mp4');
  const fullAudioPath = path.join(tempDir, 'full_audio.wav');

  try {
    console.log(`[ExtractAudio] Downloading R2 video key: ${sourceVideoKey}`);
    await downloadR2File(sourceVideoKey, localVideoPath);

    console.log(`[ExtractAudio] Extracting 16kHz mono WAV audio...`);
    execSync(`ffmpeg -y -i "${localVideoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${fullAudioPath}"`, { stdio: 'ignore' });

    const chunkPattern = path.join(tempDir, 'chunk_%03d.wav');
    console.log(`[ExtractAudio] Segmenting audio into 15-min chunks...`);
    execSync(`ffmpeg -y -i "${fullAudioPath}" -f segment -segment_time 900 -c copy "${chunkPattern}"`, { stdio: 'ignore' });

    const files = fs.readdirSync(tempDir).filter(f => f.startsWith('chunk_') && f.endsWith('.wav')).sort();
    const chunkKeys = [];

    const baseKeyFolder = sourceVideoKey.substring(0, sourceVideoKey.lastIndexOf('/') + 1) || 'temp_audio/';
    for (let i = 0; i < files.length; i++) {
      const chunkFile = files[i];
      const localChunkPath = path.join(tempDir, chunkFile);
      const r2ChunkKey = `${baseKeyFolder}transcribe_chunks/${path.basename(sourceVideoKey, path.extname(sourceVideoKey))}_${chunkFile}`;
      console.log(`[ExtractAudio] Uploading audio chunk ${i + 1}/${files.length} -> R2 key: ${r2ChunkKey}`);
      await uploadR2File(localChunkPath, r2ChunkKey, 'audio/wav');
      chunkKeys.push(r2ChunkKey);
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
    return res.json({ success: true, chunkKeys, totalChunks: chunkKeys.length });
  } catch (err) {
    console.error(`[ExtractAudio] Failed:`, err.message);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── TTS Synthesis Endpoint ────────────────────────────────────────────────────
app.post('/tts', async (req, res) => {
  const { text, language = 'en', voice = 'default', exaggeration = 0.5, cfgWeight = 0.5, business = 'default', jobId } = req.body || {};

  if (!text) {
    return res.status(400).json({ success: false, error: 'Missing text parameter' });
  }

  const jobFolder = jobId ? `${business}/${jobId}` : `tts_${Date.now()}`;
  const tempDir = path.join(__dirname, 'temp', `tts_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const localWavPath = path.join(tempDir, 'voice.wav');

  try {
    console.log(`[TTS] Synthesizing audio for text: "${text.substring(0, 40)}..." (lang=${language})`);
    const cmd = `python3 tts_chatterbox.py --text "${text.replace(/"/g, '\\"')}" --language "${language}" --voice "${voice}" --exaggeration ${exaggeration} --cfg_weight ${cfgWeight} --out "${localWavPath}"`;
    execSync(cmd, { cwd: __dirname, stdio: 'inherit' });

    if (!fs.existsSync(localWavPath) || fs.statSync(localWavPath).size < 1000) {
      throw new Error("Chatterbox synthesis failed to produce audio");
    }

    const audioKey = `${jobFolder}/voice.wav`;
    console.log(`[TTS] Uploading synthesized audio to R2 -> ${audioKey}`);
    await uploadR2File(localWavPath, audioKey, 'audio/wav');

    fs.rmSync(tempDir, { recursive: true, force: true });
    return res.json({ success: true, audioKey });
  } catch (err) {
    console.error(`[TTS] Error:`, err.message);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Queue a Render Job (POST /render) ──────────────────────────────────────────
app.post('/render', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.FACTORY_SECRET}`;
  if (!process.env.FACTORY_SECRET || authHeader !== expectedToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { business, jobId } = req.body || {};

  if (!business || !jobId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: business, jobId',
    });
  }

  try {
    const queueJob = await renderQueue.add('render', { business, jobId });
    const queuePosition = await renderQueue.getWaitingCount();

    const initialState = {
      jobId,
      business,
      status: 'queued',
      progress: 0,
      stage: 'QUEUED',
      message: `Job queued for render (Position #${queuePosition})`,
      queuedAt: new Date().toISOString()
    };
    jobsState.set(jobId, initialState);
    progressEvents.emit('progress', initialState);

    console.log(`[Queue] Job ${jobId} added to render queue. Position: #${queuePosition}`);
    res.json({
      success: true,
      queued: true,
      message: `Render job queued successfully (Position #${queuePosition})`,
      jobId,
      queuePosition
    });
  } catch (err) {
    console.error(`[Queue Error] Failed to add job ${jobId}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── List all jobs ──────────────────────────────────────────────────────────────
app.get('/jobs', (_req, res) => {
  const allJobs = Array.from(jobsState.values()).sort(
    (a, b) => new Date(b.queuedAt || b.startedAt) - new Date(a.queuedAt || a.startedAt)
  );
  res.json({ jobs: allJobs });
});

// ── Startup Preflight Check & Listener ─────────────────────────────────────────
function performStartupPreflight() {
  console.log("🔍 Running Startup Preflight Checks...");
  try {
    const ffmpegVer = execSync("ffmpeg -version").toString().split("\n")[0];
    console.log(`   - FFmpeg: ${ffmpegVer}`);
  } catch (e) {
    console.warn(`   - FFmpeg check warning: ${e.message}`);
  }

  try {
    const fontCheck = execSync("fc-match 'Montserrat-ExtraBold'").toString();
    console.log(`   - Font Montserrat-ExtraBold: ${fontCheck.trim()}`);
  } catch (e) {
    console.warn(`   - Font check warning: ${e.message}`);
  }
}

app.listen(PORT, () => {
  performStartupPreflight();
  console.log(`🚀 Janus Render Agent listening on port ${PORT} (BullMQ Concurrency = 1, SSE Enabled)`);
});
