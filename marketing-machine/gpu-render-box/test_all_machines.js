const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("=================================================");
console.log("🚀 JANUS CONTENT FACTORY — COMPLETE SYSTEM AUDIT");
console.log("=================================================");

const business = "test_audit";

function runTestMachine(jobId, mockScript) {
  console.log(`\n--- [AUDIT] Running Test for Job: ${jobId} ---`);
  const mockR2Dir = path.join(__dirname, "mock_r2", business, jobId);
  fs.mkdirSync(mockR2Dir, { recursive: true });

  fs.writeFileSync(
    path.join(mockR2Dir, "script.json"),
    JSON.stringify(mockScript, null, 2)
  );

  // Generate TTS audio if not a clip job
  if (!mockScript.sourceVideoKey) {
    const localWavPath = path.join(mockR2Dir, "voice.mp3");
    console.log(`[TTS Engine] Synthesizing speech via Chatterbox TTS...`);
    execSync(`python3 tts_chatterbox.py --text "${mockScript.scriptText.replace(/"/g, '\\"')}" --language "hi" --out "${localWavPath}"`, {
      cwd: __dirname,
      stdio: "inherit"
    });
  }

  try {
    console.log(`[Render Engine] Executing render.js for ${business}/${jobId}...`);
    execSync(`node render.js ${business} ${jobId}`, {
      cwd: __dirname,
      stdio: "inherit"
    });

    const finalMp4 = path.join(__dirname, "temp", jobId, "final_reel.mp4");
    if (fs.existsSync(finalMp4)) {
      const stats = fs.statSync(finalMp4);
      console.log(`✅ PASS: ${jobId} rendered successfully! (${(stats.size / 1024 / 1024).toFixed(2)} MB, path: ${finalMp4})`);
      return true;
    } else {
      console.error(`❌ FAIL: Output MP4 missing for ${jobId}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ ERROR rendering ${jobId}:`, err.message);
    return false;
  }
}

// 1. Machine 1: Faceless Explainer
const machine1Script = {
  skillId: "retention-hardcut",
  hook: "Aap expense tracking mein kitna time waste kar rahe ho?",
  body: [
    "Har mahine receipts collect karna aur Excel mein copy karna sabse bada pain point hai.",
    "Hisaab app aapke saare expenses ko auto-categorize karta hai bina kisi hassle ke.",
    "Quarterly tax calculations aur receipt scanning 10 seconds mein complete hoti hai."
  ],
  cta: "Link in bio par click karo aur aaj hi try karo.",
  scriptText: "Aap expense tracking mein kitna time waste kar rahe ho? Har mahine receipts collect karna aur Excel mein copy karna sabse bada pain point hai. Hisaab app aapke saare expenses ko auto-categorize karta hai bina kisi hassle ke. Quarterly tax calculations aur receipt scanning 10 seconds mein complete hoti hai. Link in bio par click karo aur aaj hi try karo.",
  brollPrompts: [
    "Person looking frustrated at computer spreadsheet",
    "Digital receipt scanner app interface animation",
    "Financial growth chart rising arrow green"
  ]
};

const m1Pass = runTestMachine("machine_1_faceless", machine1Script);

console.log("\n=================================================");
console.log(`📊 FINAL AUDIT SUMMARY: Machine 1 Faceless = ${m1Pass ? "PASS ✔️" : "FAIL ❌"}`);
console.log("=================================================");
