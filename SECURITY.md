# Security Specification: CreatorPulse

*Refer to the full security document in [docs/SECURITY.md](file:///d:/1.%20Ai%20Dev/2.%20YouuTube%20UP/docs/SECURITY.md).*

## Summary of Core Security Rules:
1. **Multi-Tenancy**: Mandatory `workspaceId` server-side authorization check on every query.
2. **AES-256-GCM Encryption**: Encrypted storage of OAuth tokens and secrets at rest.
3. **API Key Hashing**: Only SHA-256 hashes stored in the database.
4. **Rate Limiting**: Redis-backed sliding-window rate limiters across auth, search, and AI routes.
5. **Audit Trails**: Security actions logged in PostgreSQL `AuditLog`.
