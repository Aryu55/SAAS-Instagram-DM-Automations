const fs = require('fs');
const path = require('path');

const storyboardPath = path.join(__dirname, 'storyboard.json');
const publicCardsDir = path.join(__dirname, 'public', 'cards');

if (!fs.existsSync(publicCardsDir)) {
  fs.mkdirSync(publicCardsDir, { recursive: true });
}

const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));

const colors = [
  '#38bdf8', // light blue
  '#fb7185', // rose/pink
  '#4ade80', // light green
  '#fb923c', // orange
  '#a78bfa'  // purple/violet
];

// Labeled list of keywords to highlight in the title
const highlightKeywords = [
  "WATCHED", "LAST NIGHT", "LAST TIME", "WILLPOWER", "YOUTUBERS",
  "100 CRORE", "9 YEARS", "NEUROSCIENCE", "INNER VOID", "GADDHA",
  "5 TYPES", "DRIFTER", "ACHIEVER", "RECOVERY BLUEPRINT",
  "3-DAY URGE", "₹197", "800+ PEOPLE", "TODAY"
];

function highlightTitle(title) {
  let output = title;
  highlightKeywords.forEach(kw => {
    // Escape keywords for regex safety
    const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedKw})\\b`, 'gi');
    output = output.replace(regex, '<span class="hl">$1</span>');
  });
  return output;
}

storyboard.cards.forEach((card) => {
  const accentColor = colors[card.accentIndex % colors.length];
  const cardId = card.id;
  const kicker = card.contentHints.kicker;
  const rawTitle = card.contentHints.title;
  const detail = card.contentHints.detail;
  
  const highlightedTitle = highlightTitle(rawTitle);

  const html = `<div class="card" data-card-id="${cardId}">
  <style>
    .card[data-card-id="${cardId}"] .root {
      --accent: ${accentColor};
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      color: #ffffff;
      font-family: 'Inter', system-ui, sans-serif;
      
      /* Glassmorphism background */
      background: rgba(45, 45, 55, 0.65);
      border: 2px solid rgba(255, 255, 255, 0.12);
      border-radius: 28px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      
      padding: 50px 60px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      text-align: left;
      gap: 20px;
    }
    
    .card[data-card-id="${cardId}"] .meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .card[data-card-id="${cardId}"] .kicker-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 16px var(--accent), 0 0 4px var(--accent);
    }
    
    .card[data-card-id="${cardId}"] .kicker {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: var(--accent);
      text-transform: uppercase;
    }
    
    .card[data-card-id="${cardId}"] .title {
      margin: 0;
      font-size: 48px;
      font-weight: 700;
      line-height: 1.2;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: -0.01em;
    }
    
    /* Telusko yellow highlight style */
    .card[data-card-id="${cardId}"] .title span.hl {
      color: #facc15;
      text-shadow: 0 0 24px rgba(250, 204, 21, 0.45);
    }
    
    .card[data-card-id="${cardId}"] .detail {
      margin: 0;
      font-size: 26px;
      font-weight: 400;
      line-height: 1.5;
      color: #d1d5db;
      max-width: 95%;
    }
  </style>
  <div class="root">
    <div class="meta">
      <span class="kicker-dot" data-anim="scale-pop" data-anim-at="0.05" data-anim-duration="0.4"></span>
      <span class="kicker" data-anim="fade-in" data-anim-at="0.1" data-anim-duration="0.4">${kicker}</span>
    </div>
    <h2 class="title" data-anim="blur-in" data-anim-at="0.3" data-anim-duration="0.7">${highlightedTitle}</h2>
    <p class="detail" data-anim="fade-in" data-anim-at="0.8" data-anim-duration="0.5">${detail}</p>
  </div>
</div>
`;

  fs.writeFileSync(path.join(publicCardsDir, `${cardId}.html`), html);
  console.log(`Generated ${cardId}.html`);
});
