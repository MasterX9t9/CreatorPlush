# Database Architecture & Schema Specification: CreatorPulse

## 1. Overview & Principles

CreatorPulse utilizes **PostgreSQL** managed through **Prisma ORM**.
In accordance with Rule 9, 10, and 11 in `AGENTS.md`:
1. **Real Relational Database**: All persistent features store real data. No in-memory mock arrays.
2. **Multi-Tenant Workspace Isolation**: Every workspace-owned entity has a mandatory `workspaceId` foreign key and compound indexes `(workspaceId, ...)` to ensure bulletproof tenant isolation.
3. **Data Provenance & Auditability**: Core metrics, snapshots, and records capture `source`, `type` (`official`, `calculated`, `estimated`, `ai_derived`), `timestamp`, and `confidence`.
4. **Referential Integrity**: Explicit foreign keys, cascade rules, and soft deletion patterns where appropriate.

---

## 2. Entity Relationship Model Overview

```
+---------------+        1:N       +---------------+        1:N       +------------------+
|     User      |----------------->|  TeamMember   |<-----------------|    Workspace     |
+---------------+                  +---------------+                  +--------+---------+
        |                                                                      |
        | 1:N                                                                  | 1:N
        v                                                                      v
+---------------+                                                     +------------------+
| YouTubeAccount|                                                     |  TrackedChannel  |
+-------+-------+                                                     |  SwipeFolder     |
        |                                                             |  SwipeItem       |
        | 1:N                                                         |  Alert / Report  |
        v                                                             |  Automation      |
+---------------+        1:N       +---------------+                  |  ApiKey          |
|    Channel    |----------------->|ChannelSnapshot|                  +------------------+
+-------+-------+                  +---------------+
        |
        | 1:N
        v
+---------------+        1:N       +---------------+
|     Video     |----------------->| VideoSnapshot |
+-------+-------+                  +---------------+
        |
        +-- 1:1 --> ThumbnailAnalysis
        +-- 1:1 --> TitleAnalysis
        +-- 1:1 --> Transcript
        +-- 1:N --> CommentAnalysis
```

---

## 3. Schema Definitions

### 3.1 Authentication & Multi-Tenancy

```prisma
enum Role {
  OWNER
  ADMIN
  EDITOR
  ANALYST
  VIEWER
}

enum PlanTier {
  FREE
  CREATOR
  PRO
  AGENCY
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  passwordHash  String?      // Nullable for OAuth-only users
  avatarUrl     String?
  emailVerified DateTime?
  locale        String       @default("en") // "en" | "km"
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  memberships   TeamMember[]
  accounts      Account[]
  sessions      Session[]
  auditLogs     AuditLog[]
}

model Workspace {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  members     TeamMember[]
  subscription Subscription?
  usageRecords UsageRecord[]
  youtubeAccounts YouTubeAccount[]
  trackedChannels TrackedChannel[]
  trackedKeywords TrackedKeyword[]
  swipeFolders SwipeFolder[]
  swipeItems   SwipeItem[]
  alerts       Alert[]
  reports      Report[]
  automations  Automation[]
  apiKeys      ApiKey[]
  webhooks     Webhook[]
  aiConversations AIConversation[]
  auditLogs    AuditLog[]

  @@index([slug])
}

model TeamMember {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String
  role        Role      @default(EDITOR)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([workspaceId])
}

model Subscription {
  id                   String    @id @default(cuid())
  workspaceId          String    @unique
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  tier                 PlanTier  @default(FREE)
  status               String    @default("active") // "active" | "past_due" | "canceled"
  currentPeriodStart   DateTime  @default(now())
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  workspace            Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model UsageRecord {
  id          String   @id @default(cuid())
  workspaceId String
  metric      String   // e.g. "searches", "ai_requests", "reports"
  count       Int      @default(0)
  periodDate  String   // e.g. "2026-10" (monthly bucket)
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, metric, periodDate])
  @@index([workspaceId, periodDate])
}
```

### 3.2 YouTube & Channel Intelligence

```prisma
model YouTubeAccount {
  id            String    @id @default(cuid())
  workspaceId   String
  googleId      String
  email         String
  channelId     String?
  accessToken   String    // AES-256 encrypted
  refreshToken  String    // AES-256 encrypted
  tokenExpiresAt DateTime
  scopes        String[]  // Scopes granted
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  channels      Channel[]

  @@unique([workspaceId, googleId])
  @@index([workspaceId])
}

model Channel {
  id               String    @id // YouTube Channel ID (e.g., "UC...")
  youtubeAccountId String?
  title            String
  customUrl        String?
  description      String?
  publishedAt      DateTime?
  avatarUrl        String?
  bannerUrl        String?
  country          String?
  defaultLanguage  String?
  
  // Real Statistics from YouTube Data API
  subscriberCount  BigInt    @default(0)
  viewCount        BigInt    @default(0)
  videoCount       Int       @default(0)
  
  // Calculated & Derived Intelligence
  avgViewsPerVideo Float?
  medianViews      Float?
  uploadFrequencyWeekly Float?
  estimatedRpmMin  Float?
  estimatedRpmMax  Float?
  facelessLikelihood Float?   // 0.0 to 1.0 (calculated based on description/tags/title signals)
  outlierPercentage Float?   // % of videos with > 2x median views
  
  lastSyncedAt     DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  youtubeAccount   YouTubeAccount? @relation(fields: [youtubeAccountId], references: [id], onDelete: SetNull)
  snapshots        ChannelSnapshot[]
  videos           Video[]
  trackedBy        TrackedChannel[]

  @@index([title])
  @@index([subscriberCount])
  @@index([viewCount])
}

model ChannelSnapshot {
  id              String   @id @default(cuid())
  channelId       String
  subscribers     BigInt
  views           BigInt
  videosCount     Int
  source          String   @default("youtube_data_api") // "youtube_data_api" | "youtube_analytics_api"
  capturedAt      DateTime @default(now())

  channel         Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@index([channelId, capturedAt])
}

model Video {
  id             String    @id // YouTube Video ID (11 chars)
  channelId      String
  title          String
  description    String?
  publishedAt    DateTime
  durationSec    Int       @default(0)
  isShort        Boolean   @default(false)
  thumbnailUrl   String
  tags           String[]
  categoryId     String?
  defaultAudioLang String?

  // Official Public Stats
  viewCount      BigInt    @default(0)
  likeCount      BigInt?
  commentCount   BigInt?

  // Calculated Real Performance Metrics
  viewsPerHour   Float?
  viewsPerDay    Float?
  engagementRate Float?
  expectedViews  Float?    // Channel median for comparable duration & tier
  outlierScore   Float?    // actual views / expected views (e.g. 4.2 = 4.2x outlier)
  outlierTier    String?   // "normal" | "2x" | "5x" | "10x" | "20x_plus"

  lastSyncedAt   DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  channel        Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  snapshots      VideoSnapshot[]
  thumbnailAnalysis ThumbnailAnalysis?
  titleAnalysis     TitleAnalysis?
  transcript        Transcript?
  commentAnalyses   CommentAnalysis[]

  @@index([channelId, publishedAt])
  @@index([isShort])
  @@index([outlierScore])
  @@index([viewCount])
}

model VideoSnapshot {
  id         String   @id @default(cuid())
  videoId    String
  views      BigInt
  likes      BigInt?
  comments   BigInt?
  capturedAt DateTime @default(now())

  video      Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@index([videoId, capturedAt])
}
```

### 3.3 Research, Library (Swipe File) & Tracking

```prisma
model TrackedChannel {
  id          String    @id @default(cuid())
  workspaceId String
  channelId   String
  isCompetitor Boolean  @default(false)
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  channel     Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, channelId])
  @@index([workspaceId])
}

model TrackedKeyword {
  id            String    @id @default(cuid())
  workspaceId   String
  keyword       String
  targetRegion  String    @default("US")
  opportunityScore Float?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, keyword, targetRegion])
  @@index([workspaceId])
}

model SwipeFolder {
  id          String      @id @default(cuid())
  workspaceId String
  name        String
  description String?
  color       String?     @default("#6366f1")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  workspace   Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  items       SwipeItem[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

enum SwipeItemType {
  VIDEO
  CHANNEL
  THUMBNAIL
  TITLE
  HOOK
  TRANSCRIPT
}

model SwipeItem {
  id          String        @id @default(cuid())
  workspaceId String
  folderId    String?
  itemType    SwipeItemType
  externalId  String?       // Video ID or Channel ID if applicable
  title       String
  description String?
  thumbnailUrl String?
  url         String?
  notes       String?
  tags        String[]
  metadata    Json?         // Structured snapshot of stats at time of save
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  folder      SwipeFolder?  @relation(fields: [folderId], references: [id], onDelete: SetNull)

  @@index([workspaceId, itemType])
  @@index([workspaceId, folderId])
}
```

### 3.4 Content Intelligence & AI Analysis

```prisma
model ThumbnailAnalysis {
  id             String   @id @default(cuid())
  videoId        String?  @unique
  imageUrl       String
  clarityScore   Float    // 0 - 100
  contrastScore  Float    // 0 - 100
  faceCount      Int      @default(0)
  hasText        Boolean  @default(false)
  textDensity    Float?   // estimated % coverage
  strengths      String[]
  weaknesses     String[]
  recommendations String[]
  analyzedAt     DateTime @default(now())

  video          Video?   @relation(fields: [videoId], references: [id], onDelete: Cascade)
}

model TitleAnalysis {
  id             String   @id @default(cuid())
  videoId        String?  @unique
  title          String
  overallScore   Float    // 0 - 100
  charCount      Int
  wordCount      Int
  hasPowerWords  Boolean
  emotionalTone  String?  // "curiosity", "urgency", "informative", "neutral"
  strengths      String[]
  weaknesses     String[]
  suggestedTitles String[]
  analyzedAt     DateTime @default(now())

  video          Video?   @relation(fields: [videoId], references: [id], onDelete: Cascade)
}

model Transcript {
  id             String   @id @default(cuid())
  videoId        String   @unique
  language       String   @default("en")
  isAutoGenerated Boolean @default(true)
  fullText       String   @db.Text
  segments       Json     // Array of { start: number, duration: number, text: string }
  fetchedAt      DateTime @default(now())

  video          Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
}

model CommentAnalysis {
  id             String   @id @default(cuid())
  videoId        String
  sampleCount    Int      @default(0)
  positivePct    Float    // 0.0 - 1.0
  neutralPct     Float    // 0.0 - 1.0
  negativePct    Float    // 0.0 - 1.0
  topThemes      String[]
  viewerRequests String[]
  commonQuestions String[]
  analyzedAt     DateTime @default(now())

  video          Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@index([videoId])
}

model AIConversation {
  id          String      @id @default(cuid())
  workspaceId String
  title       String
  contextType String?     // "CHANNEL", "VIDEO", "NICHE", "STRATEGY"
  contextId   String?     // Target entity ID
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  workspace   Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  messages    AIMessage[]

  @@index([workspaceId])
}

model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  sender         String         // "user" | "assistant" | "system"
  content        String         @db.Text
  citations      Json?          // Array of { type: "video" | "channel", id: string, metric: string, value: any }
  createdAt      DateTime       @default(now())

  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
}
```

### 3.5 Automation, Alerts & Admin Audit

```prisma
model Alert {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  triggerType String   // "OUTLIER_VIDEO", "SUB_MILESTONE", "COMPETITOR_UPLOAD"
  targetId    String   // Channel ID or Keyword
  condition   Json     // e.g. { "multiplier": 5.0, "minViews": 10000 }
  channelNotify Boolean @default(true)
  emailNotify Boolean  @default(false)
  webhookUrl  String?
  lastTriggeredAt DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, isActive])
}

model Report {
  id          String   @id @default(cuid())
  workspaceId String
  title       String
  reportType  String   // "CHANNEL_AUDIT", "COMPETITOR_BENCHMARK", "NICHE_OVERVIEW"
  dateRange   String   // "28d", "90d", "custom"
  pdfUrl      String?
  jsonData    Json     // Frozen real metrics
  createdAt   DateTime @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
}

model ApiKey {
  id          String    @id @default(cuid())
  workspaceId String
  name        String
  keyHash     String    @unique // SHA-256 hash of API key
  prefix      String    // First 8 chars e.g. "cp_live_..."
  scopes      String[]
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
}

model Webhook {
  id          String    @id @default(cuid())
  workspaceId String
  url         String
  secretKey   String    // Encrypted signing secret
  events      String[]  // "channel.updated", "outlier.detected"
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
}

model AuditLog {
  id          String    @id @default(cuid())
  workspaceId String?
  userId      String?
  action      String    // "AUTH_LOGIN", "YOUTUBE_CONNECT", "APIKEY_CREATE"
  ipAddress   String?
  userAgent   String?
  metadata    Json?
  createdAt   DateTime  @default(now())

  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User?      @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([workspaceId, createdAt])
  @@index([userId, createdAt])
}
```

---

## 4. Indexing & Migration Strategy

1. **Compound Indexes**: Filter queries consistently use `(workspaceId, ...)` to ensure tenant isolation queries run in single-digit milliseconds.
2. **Migration Discipline**: Prisma migrations (`npx prisma migrate dev --name <migration_name>`) are generated for all schema changes. Never run raw unchecked schema updates in production.
3. **Soft-Deletion Pattern**: Where required for recovery (e.g. Workspace deletion, Saved Items), an optional `deletedAt` timestamp is employed with index filter support.
