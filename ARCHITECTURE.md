# Architecture Specification: CreatorPulse (YouTube Creator Intelligence Platform)

*Refer to the full architecture document in [docs/ARCHITECTURE.md](file:///d:/1.%20Ai%20Dev/2.%20YouuTube%20UP/docs/ARCHITECTURE.md).*

## Summary of Core Architectural Principles:
1. **Real Functionality First**: No fake metrics, no mock API responses in production, no hardcoded dashboard numbers.
2. **Modular Architecture**: Next.js (App Router), TypeScript, Prisma ORM, PostgreSQL, Redis, and Chrome Manifest V3 extension.
3. **Provider Abstraction**: Decoupled `YouTubeProvider`, `AnalyticsProvider`, `SearchProvider`, and `AIProvider`.
4. **Data Attribution**: Every metric carries a source (`official`, `calculated`, `estimated`, `ai_derived`), timestamp, and confidence score.
5. **Multi-Tenant Security**: Strict workspace-level isolation on every database query.
