# CreatorPlush (CreatorPulse)

> **Production-Grade YouTube Creator Intelligence & Monetization Platform**  
> Built with Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, and official YouTube Data API v3 integration.

---

## 🌟 Key Features

- **YouTube Partner Program (YPP) Monetization Intelligence**:
  - Automatically assesses any channel into `MONETIZED`, `NOT_MONETIZED`, or `ELIGIBLE_PENDING`.
  - Transparent progress tracking against official 1K subscriber, 4K public watch hours, and 3 minimum uploads thresholds.
  - Active revenue stream detection (In-Stream ads, Shorts ad pool, Channel memberships, Super Thanks).
  - Realistic, non-fabricated AdSense earning brackets ($2.0–$5.5 RPM).
- **Universal Channel & Video Analytics**:
  - Supports any YouTube URL format: `@handle`, `youtube.com/@...`, `youtube.com/channel/UC...`, and video URLs.
  - Statistical Outlier Engine detecting breakout videos ($2\times$, $5\times$, $10\times$, $20\times+$ multipliers vs historical median baseline).
  - Upload cadence & consistency scoring (weekly upload velocity).
  - Shorts vs Long-form performance comparison & dominance ratio.
- **Deep Video Intelligence & Secret SEO Data**:
  - Uncovers hidden video tags (`snippet.tags`), SEO tag character count, and keyword match density.
  - Best upload timing window analysis (day of week, peak hours, format duration advice).
  - Technical DNA (HD/4K, captions, language, category).
- **Creator Workflow Tools**:
  - Swipe File Library with persistent PostgreSQL storage.
  - Competitor Radar & Outlier Tracking.
  - Grounded AI Creator Assistant.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### 2. Installation
```bash
git clone https://github.com/MasterX9t9/CreatorPlush.git
cd CreatorPlush
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your YouTube Data API v3 key from Google Cloud Console:
```env
YOUTUBE_API_KEY="your-google-api-key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Assurance

```bash
# Run Vitest test suite (13 test suites, 45 tests)
npm test

# Run TypeScript type check
npm run typecheck

# Production build verification
npm run build
```

---

## ☁️ Free Forever Deployment

CreatorPlush is optimized for 100% free forever hosting on:
- **Vercel** (Next.js Web App & Serverless APIs)
- **Neon** (Serverless PostgreSQL Database)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full step-by-step instructions.

---

## 📜 License
MIT
