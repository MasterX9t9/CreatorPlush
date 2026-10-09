# Architecture Specification: CreatorPulse (YouTube Creator Intelligence Platform)

## 1. System Overview

CreatorPulse is an enterprise-grade YouTube Creator Intelligence, Research, and Automation SaaS platform built from scratch. It provides an original, legally compliant suite of tools for YouTube creators, agencies, and strategists.

In strict adherence to the **Absolute No-Fake Rule** (defined in `AGENTS.md`), CreatorPulse contains zero fabricated metrics, fake graphs, simulated delays, or non-functional buttons. Every metric, calculation, and AI response is tied directly to real sources of truth (official YouTube Data API v3, YouTube Analytics API with OAuth consent, PostgreSQL relational records, or transparent statistical algorithms).

---

## 2. Technology Stack

### 2.1 Frontend
- **Framework**: Next.js 14+ / 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom design system tokens (clean dark/light creator theme)
- **Component Primitives**: Radix UI / shadcn/ui patterns
- **State Management**: TanStack Query (React Query) for server state caching/deduplication; Zustand for workspace and UI preferences
- **Visualizations**: Recharts for transparent, real-data time series and distribution charts
- **Icons**: Lucide React
- **Internationalization (i18n)**: Locale-based routing / translation dictionary structure supporting English (`en`) and Khmer (`km`), with localized currencies (`USD`, `KHR`) and dates.

### 2.2 Backend & Data Layer
- **Runtime**: Node.js (v20+ / v24)
- **API Architecture**: Next.js App Router API Route Handlers (`/api/v1/...`) with standard REST conventions, typed schema validation (Zod), and secure session verification
- **Database**: PostgreSQL 15+
- **ORM**: Prisma ORM with strict migrations, relational integrity, and automated schema synchronization
- **Cache & Rate Limiting**: Redis (Upstash or Redis local) with structured key TTLs, quota accounting, and sliding-window rate limiters
- **Background Worker Architecture**: Async Job Queue (PgBoss / Redis BullMQ pattern) for periodic channel sync, snapshot storage, outlier computation, and webhook/alert dispatching

### 2.3 Authentication & Authorization
- **Session Auth**: NextAuth.js / Auth.js (v5) with credentials (bcrypt hashed) and Google OAuth provider
- **Channel Access Auth**: Google OAuth 2.0 with incremental authorization for YouTube Data & Analytics scopes (`https://www.googleapis.com/auth/youtube.readonly`, `https://www.googleapis.com/auth/yt-analytics.readonly`)
- **Encryption**: AES-256-GCM encryption for stored OAuth refresh tokens and API secrets
- **Multi-Tenancy**: Workspace-level tenant isolation enforced at the Prisma query level (`workspaceId` scoped on all queries)

### 2.4 Browser Extension
- **Platform**: Chromium Manifest V3 (Chrome, Edge, Brave)
- **Tech**: TypeScript, Vite bundler, Content Scripts, Background Service Worker, Chrome Side Panel API
- **Communication**: Secure JSON message passing to CreatorPulse backend via Bearer Token/API Key with CORS protection

---

## 3. High-Level Component Topology

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT SURFACES                                   |
|                                                                                   |
|  +-------------------------------------+   +------------------------------------+ |
|  |     CreatorPulse Web SaaS App       |   |   Chrome Extension (Manifest V3)   | |
|  | (Next.js Dashboard, Analytics, AI)  |   | (Content Script, Side Panel)       | |
|  +------------------+------------------+   +-----------------+------------------+ |
+---------------------|----------------------------------------|--------------------+
                      |                                        |
                      | HTTPS (REST / Session / Bearer Auth)   |
                      v                                        v
+-----------------------------------------------------------------------------------+
|                             BACKEND API LAYER (Next.js)                           |
|                                                                                   |
|  +--------------------+ +--------------------+ +--------------------+ +---------+ |
|  | Auth & Workspaces  | | YouTube Engine     | | Research & Outliers| | AI Strat| |
|  | Middleware / RBAC  | | Analytics Pipeline | | Niche / Keywords   | | Engine  | |
|  +---------+----------+ +---------+----------+ +---------+----------+ +----+----+ |
|            |                      |                      |                 |      |
+------------|----------------------|----------------------|-----------------|------+
             |                      |                      |                 |
             v                      v                      v                 v
+-----------------------------------------------------------------------------------+
|                             DATA & PROVIDER SERVICES                              |
|                                                                                   |
|  +------------------+  +-------------------+  +-----------------+  +------------+ |
|  | YouTube Provider |  | Analytics Provider|  | Search Provider |  | AI Provider| |
|  | (Data API v3)    |  | (YT Analytics API)|  | (YT / Cache DB) |  | (Gemini/OAI| |
|  +--------+---------+  +---------+---------+  +--------+--------+  +-----+------+ |
+-----------|----------------------|---------------------|-----------------|--------+
            |                      |                     |                 |
            v                      v                     v                 v
+-----------------------------------------------------------------------------------+
|                             PERSISTENCE & JOBS                                    |
|                                                                                   |
|  +---------------------------+  +-------------------------+  +------------------+ |
|  | PostgreSQL (Prisma ORM)   |  | Redis Cache & Limits    |  | Job Worker Queue | |
|  | Multi-tenant Workspaces   |  | Quota counters, TTLs    |  | Channel Sync,    | |
|  | Videos, Snapshots, Swipes |  | Deduplication           |  | Alert Processor  | |
|  +---------------------------+  +-------------------------+  +------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 4. Key Architectural Modules

### 4.1 YouTube Provider Abstraction (`src/lib/providers/youtube/`)
- Encapsulates all calls to Google APIs (`google-api-nodejs-client`).
- Strict handling for YouTube Data API quota units (e.g., search costs 100 units; video details cost 1 unit).
- Transparent error mapping: returns specific status objects (`QUOTA_EXCEEDED`, `CHANNEL_NOT_FOUND`, `AUTH_EXPIRED`, `UNAUTHORIZED_PRIVATE_METRIC`).
- Enforces caching in Redis for expensive responses with explicit metadata (`source`, `timestamp`, `expiresAt`).

### 4.2 Statistical Outlier Calculation Engine (`src/lib/algorithms/outliers.ts`)
- Pure, documented mathematical formulas:
  - Expected Views $E(v) = \text{Median}(\text{Historical channel videos of matching format and age tier})$
  - Outlier Multiplier $M = \frac{V_{\text{actual}}}{E(v)}$
  - Normalized Outlier Score (0-100 scale derived from log-normal distribution of creator catalog).
- Zero magic constants. Every score links to the dataset used for calculation.

### 4.3 AI Creator Intelligence Layer (`src/lib/providers/ai/`)
- Unified `AIProvider` interface with adapters (`GeminiProvider`, `OpenAIProvider`, `AnthropicProvider`).
- Grounded Retrieval-Augmented Generation (RAG):
  1. Retrieve validated records from Database or YouTube Provider.
  2. Assemble structured JSON prompt containing exact metrics and citations.
  3. Strict system prompt forcing attribution: AI answers must cite record IDs and cannot extrapolate unprovided numbers.
  4. Response schema validated via Zod.

### 4.4 Swipe File & Research Library (`src/lib/services/swipe.service.ts`)
- Complete CRUD with workspace isolation.
- Supports saving channels, videos, thumbnails, titles, keyword sets, and transcripts with user notes, tags, and collections.
- Persistent database storage with transactional tag indexing.

### 4.5 Multi-Tenant Authorization Enforcement
- Backend middleware and service methods always extract `workspaceId` from the authenticated session.
- Database access pattern:
  ```typescript
  const video = await prisma.savedItem.findFirst({
    where: {
      id: itemId,
      workspaceId: session.workspaceId, // Mandatory workspace guard
    }
  });
  ```

---

## 5. Security & Data Protection
1. **Credentials**: Secrets never stored in client code; OAuth tokens encrypted at rest via AES-256-GCM.
2. **Rate Limiting**: IP-based and user-based sliding-window rate limiters on all public and authenticated endpoints.
3. **Audit Trails**: Security actions (logins, API key creation, YouTube connections, workspace member changes) written to `AuditLog`.
4. **Resilient Extension**: Content script interacts through sandboxed messaging, handles dynamic YouTube DOM element changes with mutation observers and fallback selectors.
