# Slide: Instagram Automation SaaS — Technical Reference Manual

Welcome to the official technical manual and system documentation for **Slide**, a premium, production-ready Instagram DM and comment automation SaaS platform designed to enable creators, marketers, and businesses to scale their organic engagement, capture leads, and automate conversational sales.

---

## :notebook_with_decorative_cover: Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Data Model & Schema Deep-Dive](#2-data-model--schema-deep-dive)
3. [Folder Structure & Core Modules](#3-folder-structure--core-modules)
4. [Functional Logic & Webhook Flows](#4-functional-logic--webhook-flows)
   - [OAuth 2.0 Integration](#oauth-20-integration)
   - [Inbound Webhook Processing Loop](#inbound-webhook-processing-loop)
   - [AI Content Pipeline (4-Agent System)](#ai-content-pipeline-4-agent-system)
   - [Stripe Checkout & Billing Lifecycle](#stripe-checkout--billing-lifecycle)
5. [Theme Architecture (Neo-Glassmorphic Tech Sanctuary)](#5-theme-architecture-neo-glassmorphic-tech-sanctuary)
6. [Detailed Changelog & Styling Revision History](#6-detailed-changelog--styling-revision-history)
7. [Installation & Local Setup](#7-installation--local-setup)

---

## 1. System Overview & Architecture

Slide bridges user traffic on Instagram with automated backends through secure API integrations. Below is the high-level operational flowchart showing how events are routed through the system:

```mermaid
flowchart TD
    subgraph Instagram Platform
        A[Follower leaves comment or sends DM] -->|Webhook Event| B[Facebook/Instagram Graph API]
    end

    subgraph Slide Backend (Next.js Edge Runtime)
        B -->|POST request| C[app/api/webhook/instagram/route.ts]
        C --> D{Verify Webhook Signature}
        D -->|Valid| E[Extract Message/Comment & Sender ID]
        D -->|Invalid| F[401 Unauthorized]
        
        E --> G{Query Prisma DB: Find Integration & Active Automation}
        G --> H[Automation Found]
        
        H --> I{Determine Listener Type}
        I -->|SMARTAI| J[Query OpenAI GPT-4o-mini API with System Prompt]
        I -->|MESSAGE| K[Select Static Message Text]
        
        J --> L[Format Response Payload]
        K --> L
        
        L --> M[Send POST to Graph Send API]
        M --> N[Increment Automation Metrics in DB]
    end
    
    subgraph Follower Device
        N -->|Direct Message Delivered| O[Follower receives DM response]
    end
```

---

## 2. Data Model & Schema Deep-Dive

Slide utilizes **Prisma** to model relations on a PostgreSQL database hosted via **Neon serverless**. Below is the entity relationship detail:

### Schema Overview

- **User**: Represents the primary platform subscriber, authenticated using **Clerk**.
  - Has a one-to-one relationship with `Subscription`.
  - Has a one-to-many relationship with `Integrations`, `Automation`, and `Contact`.
- **Subscription**: Details the active tier (`FREE` or `PRO`), customer IDs, and sync states linked to **Stripe**.
- **Integrations**: Stores OAuth tokens, scopes, and expiration details for the connected Instagram account.
- **Automation**: The primary container for workflows.
  - Contains one-to-many `Trigger` elements (e.g., matching keywords, comments, or story mentions).
  - Contains one-to-many `Keyword` entries used to match inbound messages.
  - Has a one-to-one relation with `Listener` which dictates whether the automation triggers a static template message or redirects to a `SMARTAI` listener.
- **Dms**: Maintains the communication log for audit trials.
- **Post**: Represents the list of specific user reels or images associated with the automation.
- **Contact**: Stores lead details (Instagram ID, Username) captured automatically when a follower interacts with any active automation.

---

## 3. Folder Structure & Core Modules

The codebase is organized as follows:

```
├── actions/                  # Server Actions for Database Mutations
│   ├── automation/          # Creating, updating, and triggering automations
│   ├── integrations/        # Connecting & removing Instagram OAuth tokens
│   └── user/                # Fetching user profile information & Stripe portal sessions
├── app/                      # Next.js App Router (14.2.7)
│   ├── (auth)/              # Clerk Authentication Layouts
│   ├── (protected)/         # Dashboard routes guarded by middleware auth check
│   │   └── dashboard/
│   │       └── [slug]/
│   │           ├── analytics/       # Performance charts and AI strategic blueprints
│   │           ├── automation/      # Specific step-builder checklists
│   │           ├── contacts/        # Collected leads and CSV export engine
│   │           ├── content-engine/  # 4-Agent content scraper & writer console
│   │           ├── integrations/    # API integrations dashboard
│   │           ├── settings/        # Clerk settings and billing status page
│   │           └── virality/        # Voice analyzer & script score checker
│   ├── api/                 # API Routes (Webhooks, predictions, content pipeline)
│   ├── callback/            # OAuth Callback redirect targets
│   └── layout.tsx           # Main application wrapper with providers
├── components/               # Reusable React components
│   ├── global/              # Navigation, sidebars, alerts, buttons, dialogs
│   └── ui/                  # Raw Shadcn components
├── hooks/                    # Reusable React hooks (automations, navigation)
├── lib/                      # Base configurations (prisma, stripe, AI helper functions)
├── providers/                # Client state, Theme (Next-Themes) & Query Client wrappers
├── prisma/                   # Schema specification & DB Migration files
└── tailwind.config.ts        # Tailwind Design System customization file
```

---

## 4. Functional Logic & Webhook Flows

### OAuth 2.0 Integration

1. The user navigates to `/dashboard/[slug]/integrations` and triggers the Instagram connection.
2. Slide redirects the user to the Instagram Embedded OAuth screen.
3. Upon approval, Instagram redirects to `/callback/instagram` with an access code.
4. The Slide backend exchanges this code for a **Long-Lived Access Token** using `INSTAGRAM_TOKEN_URL`.
5. The token is encrypted and stored in the database's `Integrations` model associated with the user's account.

### Inbound Webhook Processing Loop

When a follower comments on a post or DMs the connected profile:
1. Instagram fires a payload to `/api/webhook/instagram` containing the message text and sender's ID.
2. The endpoint verifies the sender and fetches the associated active `Automation` by comparing the keywords set in the `Keyword` table against the message content.
3. **Keyword Matching Logic**:
   - Evaluates direct string equivalency (case-insensitive).
   - If a match is found, the listener type is parsed:
     - **Static Message (`MESSAGE`)**: Slide fires a payload containing the template reply to the follower via the Instagram Send API.
     - **Smart AI (`SMARTAI`)**: Slide builds a context window utilizing the user's defined system prompts (configured inside the automation details card). Slide calls OpenAI's GPT models to draft a responsive Hindlish/English answer tailored to the question, then dispatches the text response.
4. The system logs the contact details under `Contact` to ensure the lead is saved in the dashboard directory.

### Meta API Limits & Broadcast Compliance (Inviting Followers)

Unlike WhatsApp, Meta's Instagram Platform Policy enforces strict restrictions on message initiation:
- **No Unsolicited DMs**: slide cannot initiate a cold DM to a follower who has not messaged the business profile first.
- **24-Hour Message Window**: Standard API messages can only be sent within 24 hours of the follower's last interaction (DM, story mention, or comment).
- **Organic Keyword Broadcast Pattern**: To broadcast an invitation to all followers (e.g., inviting them to an event), creators should publish a Post/Reel asking followers to comment a specific keyword (e.g., `"INVITE"`). The user's comment triggers the webhook loop, allowing slide to send a compliant automated DM response containing the link.

### AI Content Pipeline (4-Agent System)

Accessible via `/dashboard/[slug]/content-engine`, the engine coordinates four separate LLM sub-routines (agents) processing information sequentially:
1. **Agent 01 (Scraper)**: Extracts trends, hashtags, competitor references, and raw captions.
2. **Agent 02 (Validator)**: Computes a relevance check, filtering out noise and grouping validation indicators into thematic semantic clusters.
3. **Agent 03 (Writer)**: Drafts voice scripts tailored to defined Hindlish ratios, sentence lengths, and energy profiles.
4. **Agent 04 (Hooks)**: Designs 5 retention-optimized hooks, assigning confidence scores based on engagement metrics.

### Stripe Checkout & Billing Lifecycle

- Free-tier users are restricted to standard automations and limited keyword matches.
- Upgrading to `PRO` redirects the user to Stripe Checkout using `actions/user/index.ts`.
- Upon successful payment, Stripe sends a webhook request updating the `Subscription` model plan status to `PRO`.

---

## 5. Theme Architecture (Neo-Glassmorphic Tech Sanctuary)

Slide implements a responsive, highly premium **Neo-Glassmorphic Tech Sanctuary** theme system configured inside `globals.css`:

```css
:root {
  /* Light Theme Tokens */
  --background: 210 20% 98%;            /* Slate-50 background tint */
  --foreground: 224 71.4% 4.1%;         /* Slate-950 main text */
  --primary: 262 80% 50%;               /* Violet-600 main accent (#7c3aed) */
  --radius: 12px;                       /* Curved card borders */
  --card-bg: oklch(100% 0 0);
  --border-color: oklch(92% 0.005 240);  /* Soft slate borders */
  --accent-magenta: oklch(60% 0.22 280); /* Violet theme indicator */
}

.dark {
  /* Dark Theme Tokens */
  --background: 240 10% 3.9%;           /* Zinc-950 dark mode background */
  --foreground: 0 0% 98%;               /* Zinc-50 bright grey copy */
  --primary: 263 70% 50%;               /* Violet-500 accent (#8b5cf6) */
  --card-bg: oklch(14% 0.005 240);
  --border-color: oklch(22% 0.005 240);
}
```

### Font Pairing System
- **Display Headings / Count Metrics**: Space Grotesk (`font-family: var(--font-space-grotesk)`).
- **Body & Copy Elements**: Instrument Sans (`font-family: var(--font-instrument)`).

### Card Styling
Cards use the `.glass-card` selector. They feature flat surfaces, thin borders, and transition smoothly on hover:
- **Hover Micro-Animation**: Translates `translate-y-[-2px]` with a scale factor of `scale-[1.01]`.
- **Glow Effect**: Generates a soft violet outer shadow: `box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.12)`.

---

## 6. Detailed Changelog & Styling Revision History

### [Base State]
The initial setup contained a dark mesh-gradient layout containing high-contrast blur elements, rounded-full panels, and hardcoded dark blue backgrounds.

### [Revision 01] — Warm-Paper Editorial Sanctuary (pbakaus/impeccable)
To align with editorial-style guidelines, the entire interface was reworked:
- Headings were set to italic display serif **Cormorant Garamond**.
- Backgrounds were stripped of all gradients and replaced with a flat warm cream layout (`--warm-ash-cream`).
- All corner borders were set to sharp square boundaries (`rounded-none`).
- Accent colors were changed to **Editorial Magenta** (`#ee1c6c`).
- Borders were styled as distinct grey lines (`--paper-mist`).

### [Revision 02] — Neo-Glassmorphic Tech Sanctuary (Latest Revamp)
To modernize the product and align it with state-of-the-art tech platforms, the UI was refactored:
- **Globals & Font Configuration**:
  - Replaced display serif Cormorant font family declarations with the geometric display sans **Space Grotesk**.
  - All occurrences of `font-light italic` on headers changed to geometric `font-bold` headings.
  - Set default body copy font family to **Instrument Sans**.
- **Card & Border Upgrades**:
  - Replaced all instances of `rounded-none` borders with clean modern scales: cards and panels use `rounded-xl` or `rounded-2xl`, while buttons and input fields use `rounded-lg` or `rounded-md`.
- **Color Variable Migration**:
  - **Accent Colors**: Editorial Magenta (`#ee1c6c`) migrated to oklch Violet/Indigo (`#7c3aed` / `#8b5cf6`).
  - **Dividers**: Mapped `var(--paper-mist)` to adaptive border colors (`var(--border-color)`).
  - **Backgrounds**: Mapped `var(--warm-charcoal)` to adaptive page backgrounds (`var(--page-bg)`).
- **Recharts Integration**:
  - Refactored SVG path properties, area fills, and gradients inside `analytics/page.tsx` to utilize adaptive theme variables instead of hardcoded hex values.
- **Component Polish**:
  - Refactored `DoubleGradientCard`, `MetricsCard`, `Sidebar`, mobile navigation sheets, search bars, settings blocks, and voice script profiles to use rounded edges and theme-aware variables.

### [Revision 03] — Content Factory Integration (Phases 0-4)
To implement a complete, autonomous, multi-business Content Factory:
- **7-Tab Dashboard UI**: Created a highly polished, interactive dashboard page for the Content Engine containing:
  - *Ideas Calendar*: Grid of concepts with staggered fade-in animations, manual idea submission sidebar, and batch generate triggers.
  - *Review Queue*: 9:16 interactive video player mockup, editable captions, script text parser, hook variations, and approval/rejection modals.
  - *Render Pipeline*: Status tracker with expandable accordion logs showing detailed execution outputs.
  - *Trends*: Engagement-scoring competitor analysis and semantic topic clustering views.
  - *Analytics*: Performance tracking cards, winning patterns output, and weekly reports.
  - *Documentary Log*: Automated timeline tracking onboarding, publishes, rejections, and milestone achievements with markdown copy export.
  - *Settings*: Automated brand configuration details, language/voice presets, toggle controls, and asset checklists.
- **Server Actions & Database Controllers**: Built dedicated server actions for scraping integrations (`scraper.ts`), metrics aggregation (`metrics.ts`), timeline export (`documentary.ts`), and pipeline triggers.
- **Vercel Cron & Webhooks**: Configured automated daily creation pipeline cron (`/api/factory/cron`) and weekly feedback analysis cron (`/api/factory/weekly`).

### [Revision 05] — Multi-Tenancy Architecture, Security Hardening & Master Org Suite
- **Multi-Tenancy Query Isolation**:
  - Scoped database queries across `getContacts`, `getAutomation`, and `createAutomation` to enforce strict organization-level data boundaries via `orgId` / `slug`.
- **Master Org & Discord-Style Join Requests**:
  - Implemented public Organization Discovery page (`/dashboard/[slug]/discover`), member status badges (`[ OWNER ]`, `[ MEMBER ]`), and streamlined join request server actions (`requestOrgAccess`).
- **Session Security & HMAC Signing**:
  - Hardened session cookies (`user_session`) with HMAC-SHA256 cryptographic signatures (`lib/auth.ts`) to prevent cookie forgery and session impersonation attacks.
- **Bcrypt Password Security & Transparent Migration**:
  - Replaced legacy SHA-256 hashes with `bcrypt` (12 rounds) on user signup and login (`app/api/auth/*`), featuring transparent automatic password hash upgrades for existing users upon login.
- **API Protection & Error Sanitization**:
  - Guarded AI routes (`/api/predict-virality`, `/api/run-pipeline`, `/api/analytics/*`) with `getSession()` authentication checks, length validation (5,000 char max limit), and expanded middleware matcher protection.
  - Sanitized internal error logging to prevent stack traces, query details, or database metadata leaks to clients.
  - Moved `GEMINI_API_KEY` from URL query strings to secure HTTP headers (`x-goog-api-key`).

---

## 7. Installation & Local Setup

### Installation Steps

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/Aryu55/SAAS-Instagram-DM-Automations.git
   cd SAAS-Instagram-DM-Automations
   ```

2. **Configure Environment Settings**:
   Copy `.env.example` into `.env` and fill out the Clerk, Neon PostgreSQL, OpenAI, and Stripe credentials.

3. **Install Core Dependencies**:
   ```bash
   npm install
   ```

4. **Sync Prisma Database Schemas**:
   ```bash
   npx prisma db push
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

### Verification Checks
Before pushing to production, verify structural type integrity:
```bash
npx tsc --noEmit
npm run build
```
