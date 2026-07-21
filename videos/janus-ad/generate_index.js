const fs = require('fs');
const path = require('path');

const storyboardPath = path.join(__dirname, 'storyboard.json');
const publicDir = path.join(__dirname, 'public');
const cardsDir = path.join(publicDir, 'cards');
const indexPath = path.join(publicDir, 'index.html');

// Copy audio.mp3 into public folder
fs.copyFileSync(path.join(__dirname, 'audio.mp3'), path.join(publicDir, 'audio.mp3'));

const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));

let cardHostsHtml = '';
let gsapScript = '';

storyboard.cards.forEach((card, idx) => {
  const cardId = card.id;
  const startSec = card.startSec;
  const endSec = card.endSec;
  const duration = endSec - startSec;
  
  // Read card HTML file
  const cardHtmlPath = path.join(cardsDir, `${cardId}.html`);
  let cardInnerHtml = fs.readFileSync(cardHtmlPath, 'utf8');
  
  // Symmetrical layout for Telusko style (1000px width, 688px height floating in 1080x768 top zone)
  const hostStyle = `left:40px;top:40px;width:1000px;height:688px;visibility:hidden;opacity:0;`;
  
  cardHostsHtml += `      <!-- Card Host for ${cardId} -->
      <div
        class="card-host clip"
        data-card-id="${cardId}"
        data-start="${startSec.toFixed(4)}"
        data-duration="${duration.toFixed(4)}"
        data-track-index="2"
        style="${hostStyle}"
      >
        ${cardInnerHtml}
      </div>\n\n`;

  // Compile GSAP timeline steps for this card
  const enterTime = startSec;
  const exitTime = Math.max(startSec, endSec - 0.35);
  
  // Card fade-in
  gsapScript += `          // ── ${cardId} Lifecycle ──
          tl.set('.card-host[data-card-id="${cardId}"]', { visibility: "visible" }, ${enterTime.toFixed(4)});
          tl.fromTo(
            '.card-host[data-card-id="${cardId}"]',
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: "power2.out" },
            ${enterTime.toFixed(4)}
          );\n`;

  // Compile zoom punches on the speaker video (#bg-video)
  // Alternate zoom scale on card transitions: odd indexes zoom in (1.35x), even indexes zoom out (1.0x)
  const targetScale = (idx % 2 === 1) ? 1.35 : 1.00;
  gsapScript += `          tl.to(
            '#bg-video',
            { scale: ${targetScale.toFixed(2)}, transformOrigin: "center 40%", duration: 0.3, ease: "power2.inOut" },
            ${enterTime.toFixed(4)}
          );\n`;

  // Compile internal card animations
  gsapScript += `          tl.fromTo(
            '.card[data-card-id="${cardId}"] .kicker-dot',
            { opacity: 0, scale: 0.6 },
            { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" },
            ${(startSec + 0.05).toFixed(4)}
          );\n`;
  gsapScript += `          tl.fromTo(
            '.card[data-card-id="${cardId}"] .kicker',
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: "power2.out" },
            ${(startSec + 0.1).toFixed(4)}
          );\n`;
  gsapScript += `          tl.fromTo(
            '.card[data-card-id="${cardId}"] .title',
            { opacity: 0, filter: "blur(12px)" },
            { opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out" },
            ${(startSec + 0.3).toFixed(4)}
          );\n`;
  gsapScript += `          tl.fromTo(
            '.card[data-card-id="${cardId}"] .detail',
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: "power2.out" },
            ${(startSec + 0.8).toFixed(4)}
          );\n`;

  // Card fade-out
  gsapScript += `          tl.to(
            '.card-host[data-card-id="${cardId}"]',
            { opacity: 0, duration: 0.35, ease: "power2.in" },
            ${exitTime.toFixed(4)}
          );
          tl.set('.card-host[data-card-id="${cardId}"]', { visibility: "hidden" }, ${endSec.toFixed(4)});
          \n`;
});

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Janus Video Overlays - Telusko Style</title>
    <style>
      @font-face {
        font-family: "Inter";
        src: url("fonts/Inter-400-latin.woff2") format("woff2");
        font-weight: 400;
        font-display: block;
      }
      @font-face {
        font-family: "Inter";
        src: url("fonts/Inter-700-latin.woff2") format("woff2");
        font-weight: 700;
        font-display: block;
      }

      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #060412;
        font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
      }
      #stage {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #050508;
      }

      /* Top Zone: 40% height cosmic nebula space for floating cards */
      .top-zone {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 768px;
        overflow: hidden;
        background: #0a0a0c;
        background-image:
          radial-gradient(ellipse at 30% 40%, rgba(120, 40, 180, 0.12) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 30%, rgba(80, 30, 160, 0.08) 0%, transparent 55%);
      }

      /* Bottom Zone: 60% height container for cropped talking-head video */
      .video-wrapper {
        position: absolute;
        left: 0;
        top: 768px;
        width: 1080px;
        height: 1152px;
        overflow: hidden;
        border-top: 2px solid rgba(255, 255, 255, 0.08);
      }
      .video-wrapper video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }

      .card-host {
        position: absolute;
        pointer-events: none;
        overflow: hidden;
      }
      .card-host .card {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div
      id="stage"
      data-composition-id="graphic-overlays"
      data-start="0"
      data-duration="182.02"
      data-fps="30"
      data-width="1080"
      data-height="1920"
    >
      <!-- Layer 0: Cosmic background space for cards -->
      <div class="top-zone"></div>

      <!-- Layer 1: source video centered and cropped to portrait -->
      <div class="video-wrapper" id="video-wrap">
        <video
          id="bg-video"
          src="input-video.mp4"
          muted
          playsinline
          data-start="0"
          data-duration="182.02"
          data-track-index="1"
        ></video>
      </div>

      <!-- Audio track to merge in render -->
      <audio
        id="bg-audio"
        src="audio.mp3"
        data-start="0"
        data-duration="182.02"
        data-track-index="3"
      ></audio>

      <!-- Layer 2: card hosts -->
${cardHostsHtml}

      <script src="vendor/gsap.min.js"></script>
      <script>
        (function () {
          window.__fmt = function (v, fmt) {
            if (typeof fmt === "string" && /^\\.[0-9]+f$/.test(fmt)) {
              return Number(v).toFixed(Number(fmt.slice(1, -1)));
            }
            if (fmt === ",d") return Math.round(v).toLocaleString();
            return String(Math.round(v));
          };

          const tl = window.gsap.timeline({ paused: true });

${gsapScript}

          window.__timelines = window.__timelines || {};
          window.__timelines["graphic-overlays"] = tl;
        })();
      </script>
    </div>
  </body>
</html>
`;

fs.writeFileSync(indexPath, indexHtml);
console.log('Successfully generated public/index.html (Telusko Style)');
