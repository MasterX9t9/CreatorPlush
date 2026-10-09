# API Specification: CreatorPulse

*Refer to the full REST API specification in [docs/API.md](file:///d:/1.%20Ai%20Dev/2.%20YouuTube%20UP/docs/API.md).*

## Summary of Core API Principles:
1. **RESTful Architecture**: Structured endpoints (`/api/v1/...`) with typed Zod validation.
2. **Provenance Metadata**: Every response returning metrics includes `metadata` with `source`, `dataType`, `timestamp`, and `confidence`.
3. **No Mock Fallbacks in Production**: If an external API fails or quota runs out, return genuine HTTP error codes (e.g. 429 `QUOTA_EXCEEDED`) instead of fabricating data.
4. **Tenant-Safe**: Bearer tokens or Session cookies mapped to `workspaceId`.
