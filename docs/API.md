# API Specification: CreatorPulse REST API

## 1. Overview & Protocol Standards

The CreatorPulse REST API adheres to modern HTTP/RESTful design principles:
- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Authentication**:
  - Web UI: Secure HttpOnly session cookies (NextAuth.js session).
  - External / Chrome Extension: HTTP Bearer header (`Authorization: Bearer <cp_live_...>` or session token).
- **Error Format**: RFC 7807 compatible JSON Problem Details.
- **Data Attribution Envelope**: Responses returning metrics include provenance attributes (`source`, `type`, `timestamp`, `confidence`).

---

## 2. Standard Response & Error Envelope

### 2.1 Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "source": "youtube_data_api",
    "dataType": "official",
    "timestamp": "2026-10-09T11:45:00.000Z",
    "cached": true,
    "confidence": 1.0
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 85,
    "hasMore": true
  }
}
```

### 2.2 Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "YOUTUBE_QUOTA_EXCEEDED",
    "message": "YouTube API quota exceeded. Please try again later or check your API quotas.",
    "status": 429,
    "details": {
      "resetTime": "2026-10-10T07:00:00.000Z"
    }
  }
}
```

---

## 3. Core API Endpoints

### 3.1 Authentication & User Session (`/api/v1/auth`, `/api/v1/workspaces`)
- `POST /api/v1/auth/signup`: Register user with email, password (min 8 chars), and name. Hashes password with bcrypt, initializes isolated workspace, and issues secure HttpOnly `cp_session` cookie.
- `POST /api/v1/auth/login`: Authenticate with email and password. Protected with anti-brute-force rate limiting (10 attempts/min). Issues secure HttpOnly `cp_session` cookie.
- `POST /api/v1/auth/logout`: Clears session cookie and invalidates client session.
- `GET /api/v1/auth/me`: Inspects session from HttpOnly cookie or Bearer token; returns authenticated user profile, active workspace, and plan tier.
- `GET /api/v1/workspaces`: List workspaces for authenticated user.
- `POST /api/v1/workspaces`: Create a new workspace.
- `GET /api/v1/workspaces/current`: Retrieve active workspace details, plan tier, and usage counters.

### 3.2 YouTube Integration & Channels (`/api/v1/youtube`)
- `GET /api/v1/youtube/auth-url`: Generate Google OAuth consent URL with YouTube Data and Analytics scopes.
- `GET /api/v1/youtube/callback`: Process OAuth authorization code, encrypt tokens, sync initial channel profile.
- `GET /api/v1/youtube/connected-channels`: List connected channels for active workspace.
- `POST /api/v1/youtube/connected-channels`: Connect channel by handle, URL, or ID with real-time video sync.
- `POST /api/v1/youtube/connected-channels/sync`: Refresh and sync channel metrics, recent uploads, and median views.
- `DELETE /api/v1/youtube/connected-channels?channelId=:id`: Revoke connection and decouple channel from workspace.

### 3.3 Search & Discovery (`/api/v1/search`)
- `GET /api/v1/search/videos`: Search YouTube videos with advanced filters.
  - Query params: `q`, `channelId`, `minViews`, `maxViews`, `minSubs`, `maxSubs`, `publishedAfter`, `publishedBefore`, `isShort`, `duration`, `sort` (`relevance`, `views`, `outlierScore`, `viewsPerHour`), `page`, `limit`.
- `GET /api/v1/search/channels`: Discover channels matching keywords, category, subscriber range, country, and upload frequency.
- `GET /api/v1/search/similar-channels?channelId=:id`: Retrieve verified similar channels based on content topics, publishing velocity, and audience overlaps.
- `GET /api/v1/search/similar-videos?videoId=:id`: Retrieve similar videos with explicit similarity scoring explanations.

### 3.4 Channel Analytics (`/api/v1/channels`)
- `GET /api/v1/channels/:id`: Get channel overview (subscribers, views, upload count, banner, avatar). Accepts handles (`@handle`), channel URLs, video URLs (`watch?v=...`), and channel IDs.
- `GET /api/v1/channels/:id/analytics`: Comprehensive analytics with official vs calculated breakdown:
  - Universal URL & handle resolution
  - YouTube Partner Program (YPP) Monetization Evaluation (`isMonetized`, `status`, criteria breakdown: 1K subscribers, 4K public watch hours, 3 uploads, and active revenue streams)
  - Median & average views
  - Shorts vs Long-form performance comparison & dominance ratio
  - Publishing consistency & upload cadence (weekly velocity)
  - Subscriber reach ratio & viral algorithmic discovery
  - Top recurring focus keywords & dominant category
  - Estimated RPM and monthly/annual revenue ranges
- `GET /api/v1/channels/:id/videos`: Paginated list of videos for the channel with outlier metrics.

### 3.5 Video Analytics (`/api/v1/videos`)
- `GET /api/v1/videos/:id`: Video intelligence summary (views, likes, comments, duration, hidden video tags, SEO keywords, publish timing window analysis, technical DNA, velocity, and engagement rates).
- `GET /api/v1/videos/:id/outlier`: Outlier calculation explanation showing expected views vs actual multiplier.
- `GET /api/v1/videos/:id/transcript`: Video transcript segments with search and timestamps (returns 404 if unavailable).
- `GET /api/v1/videos/:id/comments/sentiment`: Sentiment breakdown and theme extraction for top comments.

### 3.6 Outlier Detection Engine (`/api/v1/outliers`)
- `GET /api/v1/outliers`: Browse detected outlier videos across tracked channels or niches.
  - Query params: `threshold` (`2x`, `5x`, `10x`, `20x_plus`), `isShort`, `niche`, `timeframe` (`7d`, `30d`, `90d`).

### 3.7 Niche Intelligence (`/api/v1/niches`)
- `GET /api/v1/niches/analyze?niche=:name`: Statistical evaluation of niche size, competition, average views, top creators, upload volume, and calculated Niche Opportunity Score.

### 3.8 Keyword Research (`/api/v1/keywords`)
- `GET /api/v1/keywords/research?q=:query`: Retrieve YouTube search results metrics, competition score, top videos, related terms, and opportunity score.

### 3.9 Swipe File Library (`/api/v1/swipefile`)
- `GET /api/v1/swipefile/folders`: List workspace folders.
- `POST /api/v1/swipefile/folders`: Create folder.
- `GET /api/v1/swipefile/items`: List saved items with tag and folder filters.
- `POST /api/v1/swipefile/items`: Save video, channel, thumbnail, title, hook, or transcript to workspace library.
- `DELETE /api/v1/swipefile/items/:id`: Remove saved item.

### 3.10 Tracking & Alerts (`/api/v1/tracking`, `/api/v1/alerts`)
- `GET /api/v1/tracking/channels`: List tracked channels and competitors.
- `POST /api/v1/tracking/channels`: Add channel to tracking.
- `DELETE /api/v1/tracking/channels/:id`: Untrack channel.
- `GET /api/v1/alerts`: List alerts.
- `POST /api/v1/alerts`: Create alert condition (`OUTLIER_VIDEO`, `SUB_MILESTONE`, `COMPETITOR_UPLOAD`).

### 3.11 AI Creator Assistant (`/api/v1/ai`)
- `POST /api/v1/ai/chat`: Grounded chat assistant. Validates provided entity IDs (`channelId`, `videoId`), queries source data, appends data citations, and generates recommendations.
- `POST /api/v1/ai/title-analysis`: Pure lexical and statistical analysis of title with suggestions.
- `POST /api/v1/ai/thumbnail-analysis`: Evaluation of thumbnail image composition, contrast, and clarity.
- `POST /api/v1/ai/strategy`: Content pillar and opportunity strategy based on verified channel metrics.

### 3.12 Reports & Exports (`/api/v1/reports`, `/api/v1/exports`)
- `POST /api/v1/reports/generate`: Compile structured PDF/JSON performance report.
- `GET /api/v1/exports/csv`: Stream CSV export with strict metadata header (generated date, workspace, filters, source).
