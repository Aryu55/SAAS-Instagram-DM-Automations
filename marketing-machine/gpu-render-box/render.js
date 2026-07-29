const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config();

// Configure R2 Client (S3 Compatible API)
let s3;
const hasS3Creds = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;

const STRICT = process.env.STRICT !== "0";

if (hasS3Creds) {
  s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
} else {
  if (STRICT && process.env.ALLOW_LOCAL_MOCK !== "1") {
    console.error("ERROR: [STRICT MODE] R2 credentials absent in environment. Aborting render.");
    process.exit(1);
  }
  console.log("FALLBACK_USED: mock_r2_storage — reason: R2 credentials absent in environment");
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "marketing-machine-assets";
const DASHBOARD_CALLBACK_URL = process.env.DASHBOARD_CALLBACK_URL || "http://localhost:3000/api/factory/callback";
const FACTORY_SECRET = process.env.FACTORY_SECRET || "";

// Helper to download R2 object to local file
async function downloadFile(key, localPath) {
  if (!hasS3Creds) {
    const mockR2Path = path.join(__dirname, "mock_r2", key);
    console.log(`[Local Mode] Copying from mock R2: ${mockR2Path} -> ${localPath}`);
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
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Helper to upload local file to R2
async function uploadFile(localPath, key, contentType) {
  if (!hasS3Creds) {
    const mockR2Path = path.join(__dirname, "mock_r2", key);
    console.log(`[Local Mode] Saving to mock R2: ${localPath} -> ${mockR2Path}`);
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
  return s3.send(command);
}

// Fetch stock B-roll from Pexels API
async function fetchPexelsBroll(query, localPath) {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey) {
    throw new Error("PEXELS_API_KEY not set");
  }

  console.log(`[Pexels] Searching for video clip: "${query}"...`);
  const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait&size=medium`, {
    headers: { Authorization: pexelsKey }
  });

  if (!response.ok) {
    throw new Error(`Pexels API error status ${response.status}`);
  }

  const data = await response.json();
  const videoFiles = data.videos?.[0]?.video_files;
  if (!videoFiles || videoFiles.length === 0) {
    throw new Error(`No vertical videos found for query: "${query}"`);
  }

  // Find a portrait oriented medium video file
  const chosenVideo = videoFiles.find(f => f.width < f.height) || videoFiles[0];
  console.log(`[Pexels] Downloading chosen video: ${chosenVideo.link}`);

  const videoRes = await fetch(chosenVideo.link);
  if (!videoRes.ok) {
    throw new Error(`Failed to download video file from Pexels link`);
  }

  const buffer = await videoRes.arrayBuffer();
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, Buffer.from(buffer));
  console.log(`[Pexels] Saved B-roll to ${localPath}`);
}

// Trigger dashboard status callback
async function sendCallback(jobId, payload) {
  if (!FACTORY_SECRET) {
    console.warn("[Callback] FACTORY_SECRET is empty. Skipping dashboard callback.");
    return;
  }

  try {
    const res = await fetch(DASHBOARD_CALLBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FACTORY_SECRET}`
      },
      body: JSON.stringify(payload)
    });
    console.log(`[Callback] Dashboard status callback response status: ${res.status}`);
  } catch (e) {
    console.error(`[Callback] Dashboard callback failed: ${e.message}`);
  }
}

async function processJob(business, jobId) {
  const tempDir = path.join(__dirname, "temp", jobId);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const renderLog = [];
  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    renderLog.push(line);
  };

  log(`Processing job ${jobId} for business slug: "${business}"`);

  // Target paths on R2
  const scriptKey = `${business}/${jobId}/script.json`;
  const audioKey = `${business}/${jobId}/voice.mp3`;
  const templateKey = `${business}/template.json`;
  const outputKey = `${business}/${jobId}/final_marketing_reel.mp4`;

  // Local temp files
  const localScriptPath = path.join(tempDir, "script.json");
  const localAudioPath = path.join(tempDir, "voice.mp3");
  const localTemplatePath = path.join(tempDir, "template.json");
  const localAssPath = path.join(tempDir, "subtitles.ass");
  const localOutputPath = path.join(tempDir, "final_reel.mp4");

  try {
    // 1. Download script from R2
    log("Downloading script from R2...");
    await downloadFile(scriptKey, localScriptPath);
    const scriptData = JSON.parse(fs.readFileSync(localScriptPath, "utf-8"));

    // Check if this is a Clip Extraction Job (Podcast Clipper or Raw Footage Edit)
    const isClipJob = !!(scriptData.sourceVideoKey || scriptData.clipStartTime !== undefined);

    // 2. Resolve design template.json
    log("Resolving design template.json...");
    let template = null;
    let templateSource = "";
    const requestedSkillId = scriptData.skillId || scriptData.editingStyle;

    if (requestedSkillId) {
      const janusSkillsDir = path.resolve(__dirname, "../../phase ai/SAAS-Instagram-DM-Automations/skills");
      const localSkillsDir = path.resolve(__dirname, "skills");
      const skillConfigPath1 = path.join(janusSkillsDir, requestedSkillId, "config.json");
      const skillConfigPath2 = path.join(localSkillsDir, requestedSkillId, "config.json");

      if (fs.existsSync(skillConfigPath1)) {
        template = JSON.parse(fs.readFileSync(skillConfigPath1, "utf-8"));
        templateSource = `skills/${requestedSkillId}/config.json (Janus SaaS path)`;
      } else if (fs.existsSync(skillConfigPath2)) {
        template = JSON.parse(fs.readFileSync(skillConfigPath2, "utf-8"));
        templateSource = `skills/${requestedSkillId}/config.json (Local path)`;
      } else {
        const errorMsg = `ERROR: Requested skillId '${requestedSkillId}' set, but config.json was NOT found at ${skillConfigPath1} or ${skillConfigPath2}`;
        log(errorMsg);
        if (STRICT) {
          console.error(errorMsg);
          process.exit(1);
        }
      }
    }

    if (!template) {
      try {
        await downloadFile(templateKey, localTemplatePath);
        template = JSON.parse(fs.readFileSync(localTemplatePath, "utf-8"));
        templateSource = `${business}/template.json (Cloudflare R2)`;
      } catch (e) {
        log("WARNING: Template not found in R2. Falling back to built-in default config.");
        template = {
          resolution: "1080x1920", fps: 30,
          font: "Montserrat-ExtraBold", subtitleStyle: "karaoke-word",
          subtitlePrimaryColor: "#FFFFFF", subtitleHighlightColor: "#FFD400",
          subtitleY: 0.62, maxWordsPerLine: 4,
          background: { type: "broll-or-color", color: "#101014" },
          logo: { path: "logo.png", position: "top-right", opacity: 0.85 },
          music: { path: "background_music.mp3", volume: 0.12 }
        };
        templateSource = "Built-in default config (WARNING: fallback used)";
      }
    }

    fs.writeFileSync(localTemplatePath, JSON.stringify(template, null, 2));
    log(`[TEMPLATE_RESOLVED] Winner: ${templateSource}`);

    if (isClipJob) {
      log(`=== MODE: Clip Extraction & Formatting ===`);
      const sourceVideoKey = scriptData.sourceVideoKey;
      const startTime = Number(scriptData.clipStartTime) || 0;
      const endTime = Number(scriptData.clipEndTime) || (startTime + 45);
      const duration = Math.max(5, endTime - startTime);

      const localSourceVideo = path.join(tempDir, "source_video.mp4");
      const localTrimmedClip = path.join(tempDir, "trimmed_clip.mp4");
      const localClipAudio = path.join(tempDir, "clip_audio.wav");

      log(`Downloading source video (${sourceVideoKey})...`);
      await downloadFile(sourceVideoKey, localSourceVideo);

      log(`Trimming segment: ${startTime}s to ${endTime}s (duration: ${duration}s)...`);
      execSync(`ffmpeg -y -ss ${startTime} -i "${localSourceVideo}" -t ${duration} -c:v libx264 -c:a aac "${localTrimmedClip}"`, { stdio: "inherit" });

      log(`Extracting audio from trimmed clip for Whisper alignment...`);
      execSync(`ffmpeg -y -i "${localTrimmedClip}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${localClipAudio}"`, { stdio: "inherit" });

      log(`Generating ASS karaoke subtitles from clip audio...`);
      const whisperModel = scriptData.whisperModel || "large-v3";
      const language = scriptData.language || "hi";
      try {
        execSync(`python3 whisper_align.py "${localClipAudio}" "${localTemplatePath}" "${localAssPath}" --model "${whisperModel}" --language "${language}"`, {
          cwd: __dirname,
          stdio: "inherit"
        });
      } catch (e) {
        log(`Whisper subtitle alignment failed, continuing without subtitles: ${e.message}`);
        if (STRICT) {
          process.exit(1);
        }
      }

      // Check for explicit TTS commentary request
      let hasCommentary = false;
      const enableCommentary = scriptData.enableCommentary === true;
      if (enableCommentary) {
        log("enableCommentary is true. Downloading commentary audio from R2...");
        try {
          await downloadFile(audioKey, localAudioPath);
          hasCommentary = fs.existsSync(localAudioPath);
        } catch {
          hasCommentary = false;
        }
      } else {
        log("enableCommentary is false (default). Skipping commentary audio overlay.");
      }

      // 9:16 Scale and Crop filter + ASS Subtitles
      const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1";
      const hasAss = fs.existsSync(localAssPath);
      const videoFilter = hasAss ? `${scaleFilter},subtitles=filename=subtitles.ass` : scaleFilter;

      let ffmpegCmd = "";
      if (hasCommentary) {
        log("Combining clip video + original audio + commentary TTS overlay...");
        ffmpegCmd = `ffmpeg -y -i "${localTrimmedClip}" -i "${localAudioPath}" ` +
          `-filter_complex "[0:v]${videoFilter}[v];[0:a]volume=0.4[orig];[1:a]volume=1.0[comm];[orig][comm]amix=inputs=2:duration=first[a]" ` +
          `-map "[v]" -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${localOutputPath}"`;
      } else {
        log("Formatting clip with 9:16 vertical crop + ASS captions...");
        ffmpegCmd = `ffmpeg -y -i "${localTrimmedClip}" ` +
          `-vf "${videoFilter}" ` +
          `-c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${localOutputPath}"`;
      }

      log(`Running FFmpeg clip render command: ${ffmpegCmd}`);
      try {
        execSync(ffmpegCmd, { cwd: tempDir, stdio: "inherit" });
      } catch (e) {
        if (STRICT) {
          log(`ERROR: [STRICT MODE] Primary FFmpeg clip render failed: ${e.message}`);
          throw e;
        }
        log(`FALLBACK_USED: no_subtitle_clip_render — reason: Primary clip FFmpeg render failed (${e.message})`);
        const fallbackCmd = ffmpegCmd.replace(/,subtitles=filename=subtitles\.ass/g, "");
        log(`Running fallback clip command: ${fallbackCmd}`);
        execSync(fallbackCmd, { cwd: tempDir, stdio: "inherit" });
      }
      log("Clip formatting completed successfully.");

    } else {
      log(`=== MODE: Faceless / AI Script Renderer ===`);
      // 1. Download voice audio from R2
      log("Downloading audio from R2...");
      await downloadFile(audioKey, localAudioPath);

      // 2. Spawns Python Whisper aligner to generate ASS subtitles
      log("Executing whisper word-alignment pipeline...");
      const whisperModel = scriptData.whisperModel || "large-v3";
      const language = scriptData.language || "en";
      execSync(`python3 whisper_align.py "${localAudioPath}" "${localTemplatePath}" "${localAssPath}" --model "${whisperModel}" --language "${language}"`, {
        cwd: __dirname,
        stdio: "inherit"
      });
      log("ASS Subtitle generated successfully.");

      // Get exact audio duration
      const audioDuration = parseFloat(
        execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localAudioPath}"`)
          .toString()
          .trim()
      );
      log(`Audio duration: ${audioDuration} seconds`);

      // 3. Resolve Background video clips
      const localBrollDir = path.join(__dirname, "assets", business, "broll");
      let brollFiles = [];
      if (fs.existsSync(localBrollDir)) {
        brollFiles = fs.readdirSync(localBrollDir)
          .filter(f => f.endsWith(".mp4") || f.endsWith(".mov"))
          .map(f => path.join(localBrollDir, f));
      }

      const visualClips = [];

      if (brollFiles.length > 0) {
        log(`Found ${brollFiles.length} local b-roll files. Selecting files...`);
        let accumulatedDuration = 0;
        let idx = 0;
        while (accumulatedDuration < audioDuration) {
          const file = brollFiles[idx % brollFiles.length];
          visualClips.push(file);
          const duration = parseFloat(
            execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`)
              .toString()
              .trim()
          );
          accumulatedDuration += duration;
          idx++;
        }
      } else if (process.env.PEXELS_API_KEY && scriptData.brollPrompts && scriptData.brollPrompts.length > 0) {
        log("No local B-roll found. Fetching B-roll from Pexels API...");
        for (let i = 0; i < scriptData.brollPrompts.length; i++) {
          const query = scriptData.brollPrompts[i];
          const clipPath = path.join(tempDir, `pexels_${i}.mp4`);
          try {
            await fetchPexelsBroll(query, clipPath);
            visualClips.push(clipPath);
          } catch (e) {
            log(`Failed to download B-roll for "${query}": ${e.message}`);
          }
        }
      }

      // 4. Build final FFmpeg assembly command
      log("Assembling video streams with FFmpeg...");
      const musicPath = path.join(__dirname, "assets", business, template.music?.path || "background_music.mp3");
      const hasMusic = fs.existsSync(musicPath) && fs.statSync(musicPath).size > 1000;
      const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1";

      let ffmpegCmd = "";

      if (visualClips.length > 0) {
        log(`Concatenating ${visualClips.length} video segments...`);
        const inputFiles = visualClips.map(clip => `-i "${clip}"`).join(" ");
        const filterComplex = visualClips.map((_, idx) => `[${idx}:v]${scaleFilter}[v${idx}];`).join("") + 
          visualClips.map((_, idx) => `[v${idx}]`).join("") + `concat=n=${visualClips.length}:v=1:a=0[vbg];`;
        
        const audioIdx = visualClips.length;
        const musicIdx = audioIdx + 1;

        let audioFilter = `[${audioIdx}:a]volume=1.0[voice];`;
        let finalAudioMix = "[voice]amix=inputs=1:duration=first[a]";

        if (hasMusic) {
          audioFilter += `[${musicIdx}:a]volume=${template.music.volume || 0.15}[bgm];`;
          finalAudioMix = `[voice][bgm]amix=inputs=2:duration=first[a]`;
        }

        const logoPath = path.join(__dirname, "assets", business, template.logo?.path || "logo.png");
        const hasLogo = fs.existsSync(logoPath);
        
        let overlayFilter = "[vbg]";
        let logoInput = "";
        if (hasLogo) {
          logoInput = `-i "${logoPath}"`;
          const logoIdx = hasMusic ? musicIdx + 1 : audioIdx + 1;
          overlayFilter = `[vbg][${logoIdx}:v]overlay=W-w-50:50[vlogo];[vlogo]`;
        }

        const finalVideoFilter = `${overlayFilter}subtitles=filename=subtitles.ass[v]`;

        ffmpegCmd = `ffmpeg -y ${inputFiles} -i "${localAudioPath}" ${hasMusic ? `-stream_loop -1 -i "${musicPath}"` : ""} ${hasLogo ? logoInput : ""} ` +
          `-filter_complex "${filterComplex}${audioFilter}${finalAudioMix};${finalVideoFilter}" ` +
          `-map "[v]" -map "[a]" -t ${audioDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${localOutputPath}"`;

      } else {
        log("No video clips available. Falling back to solid color background.");
        const bgColor = template.background?.color || "#101014";

        let finalAudioMix = `[1:a]volume=1.0[voice];[voice]amix=inputs=1:duration=first[a]`;
        if (hasMusic) {
          finalAudioMix = `[1:a]volume=1.0[voice];[2:a]volume=${template.music.volume || 0.15}[bgm];[voice][bgm]amix=inputs=2:duration=first[a]`;
        }

        ffmpegCmd = `ffmpeg -y -f lavfi -i color=c=${bgColor}:s=1080x1920:d=${audioDuration}:r=30 -i "${localAudioPath}" ${hasMusic ? `-stream_loop -1 -i "${musicPath}"` : ""} ` +
          `-filter_complex "${finalAudioMix};[0:v]subtitles=filename=subtitles.ass[v]" ` +
          `-map "[v]" -map "[a]" -t ${audioDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${localOutputPath}"`;
      }

      log(`Running command: ${ffmpegCmd}`);
      try {
        execSync(ffmpegCmd, { cwd: tempDir, stdio: "inherit" });
      } catch (e) {
        if (STRICT) {
          log(`ERROR: [STRICT MODE] Primary FFmpeg render failed: ${e.message}`);
          throw e;
        }
        log(`FALLBACK_USED: no_subtitle_faceless_render — reason: Primary FFmpeg render failed (${e.message})`);
        const fallbackCmd = ffmpegCmd
          .replace(/;\[0:v\]subtitles=filename=subtitles\.ass\[v\]/g, "")
          .replace(/,subtitles=filename=subtitles\.ass/g, "")
          .replace(/-map "\[v\]"/g, '-map 0:v');
        log(`Running fallback command: ${fallbackCmd}`);
        execSync(fallbackCmd, { cwd: tempDir, stdio: "inherit" });
      }
      log("FFmpeg compilation completed successfully.");
    }

    // 5. Upload final mp4 and subtitles.ass to R2
    if (fs.existsSync(localAssPath)) {
      const assKey = `${business}/${jobId}/subtitles.ass`;
      await uploadFile(localAssPath, assKey, "text/plain");
    }
    log("Uploading final video reel back to R2...");
    await uploadFile(localOutputPath, outputKey, "video/mp4");
    log(`Job successfully complete. R2 Key: ${outputKey}`);

    // 6. Success callback to dashboard
    await sendCallback(jobId, {
      jobId,
      status: "REVIEW",
      videoKey: outputKey,
      renderLog: renderLog.join("\n")
    });

  } catch (error) {
    log(`Error executing render job: ${error.message}`);
    await sendCallback(jobId, {
      jobId,
      status: "FAILED",
      renderLog: renderLog.join("\n")
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Parse args
const [,, business, jobId] = process.argv;
if (business && jobId) {
  processJob(business, jobId);
} else {
  console.log("Usage: node render.js <business_slug> <job_id>");
}
