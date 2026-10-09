# Database Specification: CreatorPulse

*Refer to the full database schema document in [docs/DATABASE.md](file:///d:/1.%20Ai%20Dev/2.%20YouuTube%20UP/docs/DATABASE.md).*

## Summary of Core Database Rules:
1. **PostgreSQL + Prisma**: Real relational database with explicit relations, indexes, and migration tracking.
2. **Tenant Isolation**: Mandatory `workspaceId` scoping on all queries and compound indexes `@@index([workspaceId, ...])`.
3. **Data Provenance**: Every metric stores its source (`official`, `calculated`, `estimated`, `ai_derived`) and timestamp.
4. **No Fake Tables or In-Memory Hacks**: Real persistence end-to-end.
