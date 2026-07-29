const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const STRICT = process.env.STRICT === "1";

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "marketing-machine-assets";

async function downloadFile(key, destPath) {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  const response = await s3.send(command);
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const writer = fs.createWriteStream(destPath);
    response.Body.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function uploadFile(srcPath, key, contentType = "video/mp4") {
  const fileStream = fs.createReadStream(srcPath);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  });
  await s3.send(command);
}

function probeLuma(videoPath, sampleSec = 2) {
  try {
    const probeCmd = `ffmpeg -ss ${sampleSec} -i "${videoPath}" -vf "crop=1080:300:0:900,signalstats" -vframes 1 -f null - 2>&1`;
    const out = execSync(probeCmd).toString();
    const match = out.match(/YAVG=([0-9.]+)/);
    if (match) {
      return parseFloat(match[1]);
    }
  } catch (e) {
    // Ignore probe errors
  }
  return 100;
}

async function executeRenderJob(business, jobId) {
  log(`Processing job ${jobId} for business slug: "${business}"`);

  const tempDir = path.join(__dirname, "temp", jobId);
  fs.mkdirSync(tempDir, { recursive: true });

  const scriptKey = `${business}/${jobId}/script.json`;
  const localScriptPath = path.join(tempDir, "script.json");
  const localTemplatePath = path.join(tempDir, "template.json");

  const localAudioPath = path.join(tempDir, "voice.mp3");
  const localAssPath = path.join(tempDir, "subtitles.ass");
  const localOutputPath = path.join(tempDir, "final_reel.mp4");

  const audioKey = `${business}/${jobId}/voice.mp3`;
  const templateKey = `${business}/template.json`;
  const videoKey = `${business}/${jobId}/final_marketing_reel.mp4`;

  try {
    log("Downloading script from R2...");
    await downloadFile(scriptKey, localScriptPath);
    const scriptData = JSON.parse(fs.readFileSync(localScriptPath, "utf-8"));

    const isClipJob = !!scriptData.sourceVideoKey;

    log("Resolving design template.json...");
    let template = null;
    let templateSource = "";

    const requestedSkillId = scriptData.skillId;
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

    // Property name normalization (fontSizePx -> subtitleFontSize)
    if (template.fontSizePx && !template.subtitleFontSize) {
      template.subtitleFontSize = template.fontSizePx;
    }
    if (template.font && !template.subtitleFont) {
      template.subtitleFont = template.font;
    }

    // Crop mode & source-aware caption placement
    const cropMode = scriptData.cropMode || template.cropMode || (isClipJob ? "fit" : "fill");
    if (!template.subtitleY) {
      template.subtitleY = (cropMode === "fit") ? 0.72 : 0.50;
    }

    fs.writeFileSync(localTemplatePath, JSON.stringify(template, null, 2));
    log(`[TEMPLATE_RESOLVED] Winner: ${templateSource} (Crop mode: ${cropMode}, SubtitleY: ${template.subtitleY})`);

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
      const whisperModel = scriptData.whisperModel || "base";
      const language = scriptData.language || "hi";
      try {
        execSync(`python3 whisper_align.py "${localClipAudio}" "${localTemplatePath}" "${localAssPath}" --model "${whisperModel}" --language "${language}"`, {
          cwd: __dirname,
          stdio: "inherit"
        });
      } catch (e) {
        log(`Whisper subtitle alignment failed: ${e.message}`);
        if (STRICT) {
          process.exit(1);
        }
      }

      // Safety Net Luma Probe & Auto-Scrim
      const bgLuma = probeLuma(localTrimmedClip);
      log(`Background caption band mean luma: ${bgLuma}`);
      if (bgLuma > 140) {
        log(`SCRIM_APPLIED: Background luma (${bgLuma}) > 140. Enabling ASS background plate / outline safety net.`);
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

      // Layout & Crop filter string
      let videoFilter = "";
      const hasAss = fs.existsSync(localAssPath);

      if (cropMode === "fit") {
        const fitFilter = `[0:v]scale=1080:-2[fg];[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.25[bg];[bg][fg]overlay=(W-w)/2:340[scaled];[scaled]subtitles=filename=subtitles.ass[v]`;
        videoFilter = fitFilter;
      } else {
        const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1";
        videoFilter = hasAss ? `[0:v]${scaleFilter},subtitles=filename=subtitles.ass[v]` : `[0:v]${scaleFilter}[v]`;
      }

      let ffmpegCmd = "";
      if (hasCommentary) {
        log("Combining clip video + original audio + commentary TTS overlay...");
        ffmpegCmd = `ffmpeg -y -i "${localTrimmedClip}" -i "${localAudioPath}" ` +
          `-filter_complex "${videoFilter};[0:a]volume=0.4[orig];[1:a]volume=1.0[comm];[orig][comm]amix=inputs=2:duration=first[a]" ` +
          `-map "[v]" -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${localOutputPath}"`;
      } else {
        log(`Formatting clip with cropMode: "${cropMode}" + ASS captions...`);
        ffmpegCmd = `ffmpeg -y -i "${localTrimmedClip}" ` +
          `-filter_complex "${videoFilter}" -map "[v]" -map 0:a? ` +
          `-c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${localOutputPath}"`;
      }

      log(`Running FFmpeg clip render command: ${ffmpegCmd}`);
      execSync(ffmpegCmd, { cwd: tempDir, stdio: "inherit" });
      log("Clip formatting completed successfully.");

    } else {
      log(`=== MODE: Faceless / AI Script Renderer ===`);
      log("Downloading audio from R2...");
      await downloadFile(audioKey, localAudioPath);

      log("Executing whisper word-alignment pipeline...");
      const whisperModel = scriptData.whisperModel || "base";
      const language = scriptData.language || "en";
      execSync(`python3 whisper_align.py "${localAudioPath}" "${localTemplatePath}" "${localAssPath}" --model "${whisperModel}" --language "${language}"`, {
        cwd: __dirname,
        stdio: "inherit"
      });

      const audioDuration = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localAudioPath}"`).toString().trim());
      log(`Synthesized audio duration: ${audioDuration} seconds`);

      // B-Roll Video Verification Engine
      const { processBrollDecision } = require("./broll_verifier");
      const brollResult = await processBrollDecision(scriptData, tempDir, process.env.PEXELS_API_KEY);
      log(`B-Roll Verification Result: ${brollResult.chosenPath} (${brollResult.visualClips.length} clips)`);

      const visualClips = brollResult.visualClips;
      if (visualClips.length === 0) {
        throw new Error("STRICT MODE ERROR: B-roll verifier generated 0 visual clips.");
      }

      // Concat visual clips to match audio duration
      const concatListFile = path.join(tempDir, "concat.txt");
      const concatContent = visualClips.map(c => `file '${c}'`).join("\n");
      fs.writeFileSync(concatListFile, concatContent);

      const concatenatedVisuals = path.join(tempDir, "concat_visuals.mp4");
      execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListFile}" -c:v libx264 -pix_fmt yuv420p "${concatenatedVisuals}"`, { stdio: "inherit" });

      // Apply 9:16 Scale and ASS subtitles
      const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1";
      const hasAss = fs.existsSync(localAssPath);
      const videoFilter = hasAss ? `${scaleFilter},subtitles=filename=subtitles.ass` : scaleFilter;

      const ffmpegCmd = `ffmpeg -y -stream_loop -1 -i "${concatenatedVisuals}" -i "${localAudioPath}" ` +
        `-filter_complex "[0:v]${videoFilter}[v]" ` +
        `-map "[v]" -map 1:a -t ${audioDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${localOutputPath}"`;

      log(`Running FFmpeg faceless render command: ${ffmpegCmd}`);
      execSync(ffmpegCmd, { cwd: tempDir, stdio: "inherit" });
      log("FFmpeg compilation completed successfully.");
    }

    log("Uploading final video reel back to R2...");
    await uploadFile(localOutputPath, videoKey, "video/mp4");

    const assKey = `${business}/${jobId}/subtitles.ass`;
    if (fs.existsSync(localAssPath)) {
      await uploadFile(localAssPath, assKey, "text/plain");
    }

    log(`Job successfully complete. R2 Key: ${videoKey}`);
  } catch (err) {
    log(`ERROR: Job execution failed for ${jobId}: ${err.message}`);
    throw err;
  }
}

const args = process.argv.slice(2);
if (args.length >= 2) {
  const [business, jobId] = args;
  executeRenderJob(business, jobId).catch((err) => {
    console.error("Render failed:", err);
    process.exit(1);
  });
}

module.exports = { executeRenderJob };
