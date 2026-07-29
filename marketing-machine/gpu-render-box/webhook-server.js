#!/usr/bin/env node
// webhook-server.js — Lightweight render-agent webhook server
// Receives render jobs via POST /render, spawns render.js, and publishes to Postiz on completion.

require('dotenv').config();
const express = require('express');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { publishToPostiz } = require('./postiz-publisher');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

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

// ── In-memory job tracker ──────────────────────────────────────────────────────
const jobs = new Map();

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'alive', service: 'render-agent' });
});

// ── Audio Extraction Endpoint for Transcription ────────────────────────────────
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

    // Segment into 15-minute (900s) chunks
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

    // Cleanup temp folder
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

// ── TTS Synthesis Endpoint via Chatterbox ─────────────────────────────────────
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

// ── Trigger a render job ───────────────────────────────────────────────────────
app.post('/render', (req, res) => {
  // Auth check
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

  // Record the job
  jobs.set(jobId, {
    jobId,
    business,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
  });

  // Spawn the render process (fire-and-forget)
  const child = spawn('node', ['render.js', business, jobId], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    console.log(`[render:${jobId}:stdout] ${data.toString().trimEnd()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[render:${jobId}:stderr] ${data.toString().trimEnd()}`);
  });

  child.on('error', (err) => {
    console.error(`[render:${jobId}] Failed to start child process:`, err.message);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'error';
      job.finishedAt = new Date().toISOString();
      job.error = err.message;
    }
  });

  child.on('close', async (code) => {
    const job = jobs.get(jobId);
    if (job) {
      job.exitCode = code;
      job.finishedAt = new Date().toISOString();
      job.status = code === 0 ? 'completed' : 'failed';
    }

    console.log(`[render:${jobId}] Process exited with code ${code}`);

    if (code === 0) {
      try {
        await publishToPostiz(business, jobId);
        console.log(`[render:${jobId}] Postiz publish triggered successfully`);
      } catch (err) {
        console.error(`[render:${jobId}] Postiz publish failed:`, err.message);
      }
    } else {
      console.warn(`[render:${jobId}] Skipping Postiz publish — render exited with code ${code}`);
    }
  });

  // Respond immediately
  res.json({ success: true, message: 'Render job started', jobId });
});

// ── List all jobs ──────────────────────────────────────────────────────────────
app.get('/jobs', (_req, res) => {
  const allJobs = Array.from(jobs.values()).sort(
    (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
  );
  res.json({ jobs: allJobs });
});

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 render-agent webhook server listening on port ${PORT}`);
});
