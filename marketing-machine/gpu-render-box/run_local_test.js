const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const business = "hisaab";
const jobId = "job_test_123";

const mockR2Dir = path.join(__dirname, "mock_r2", business, jobId);
if (!fs.existsSync(mockR2Dir)) {
  fs.mkdirSync(mockR2Dir, { recursive: true });
}

// 1. Create mock script.json
const mockScript = {
  hook: "Managing spreadsheets for your freelance expenses is literally burning your time.",
  body: [
    "You spend hours copying bank statements manually into Excel.",
    "Half of your tax write-offs get lost in your emails and notes.",
    "Hisaab auto-imports everything, calculates your write-offs, and handles quarterly taxes."
  ],
  cta: "Try Hisaab today. Stop wasting time on accounting. Link in bio.",
  scriptText: "Managing spreadsheets for your freelance expenses is literally burning your time. You spend hours copying bank statements manually into Excel. Half of your tax write-offs get lost in your emails and notes. Hisaab auto-imports everything, calculates your write-offs, and handles quarterly taxes. Try Hisaab today. Stop wasting time on accounting. Link in bio.",
  brollPrompts: [
    "Sad freelancer staring at Excel spreadsheets",
    "Typing receipt numbers onto a calculator",
    "Invoice emails accumulating in inbox",
    "Clean Hisaab dashboard loading on a phone screen"
  ]
};

fs.writeFileSync(
  path.join(mockR2Dir, "script.json"),
  JSON.stringify(mockScript, null, 2)
);
console.log("Mock script.json created at:", path.join(mockR2Dir, "script.json"));

// 2. Generate a mock voice.mp3 (3 seconds of silence or simple tone) using ffmpeg
const mockAudioPath = path.join(mockR2Dir, "voice.mp3");
console.log("Generating dummy mock voice.mp3 using ffmpeg...");
try {
  execSync(`ffmpeg -y -f lavfi -i "sine=frequency=1000:duration=5" -acodec libmp3lame "${mockAudioPath}"`);
  console.log("Mock voice.mp3 generated successfully.");
} catch (err) {
  console.error("Failed to generate mock voice.mp3 using ffmpeg. Creating empty file instead.", err.message);
  fs.writeFileSync(mockAudioPath, "");
}

// 3. Ensure placeholder_avatar.png exists
const placeholderAvatar = path.join(__dirname, "placeholder_avatar.png");
if (!fs.existsSync(placeholderAvatar)) {
  // Write a simple raw black pixel PNG or empty placeholder
  fs.writeFileSync(placeholderAvatar, "");
}

// 4. Trigger the local render process
console.log("\n--- Triggering render.js in LOCAL_ONLY mode ---");
try {
  execSync(`node render.js ${business} ${jobId}`, { stdio: "inherit" });
  console.log("\nLocal render test run completed!");
  console.log(`Verify output at: ${path.join(__dirname, "mock_r2", business, jobId, "final_marketing_reel.mp4")}`);
} catch (err) {
  console.error("Error executing render.js:", err.message);
}
