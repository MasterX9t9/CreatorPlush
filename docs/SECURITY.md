# Security & Compliance Specification: CreatorPulse

## 1. Multi-Tenant Isolation (Rule 11)

Every workspace in CreatorPulse operates as an isolated tenant.
- **Enforcement Principle**: Workspace authorization must be verified on the server side for every database read, write, update, and delete.
- **Pattern**:
  ```typescript
  // Secure: Mandatory workspace scoping
  const record = await prisma.trackedChannel.findFirst({
    where: {
      id: channelId,
      workspaceId: authenticatedSession.workspaceId
    }
  });
  if (!record) {
    throw new NotFoundOrForbiddenError();
  }
  ```
- **Prohibition**: Never expose bare identifiers (e.g. `findById(id)`) without workspace validation unless the resource is an intrinsically public record (such as a shared YouTube video catalog cache).

---

## 2. Authentication & Credential Storage

### 2.1 Password Security
- User passwords are required to be at least 8 characters.
- Hashing is performed using **bcrypt** with a minimum cost factor of 12.
- Passwords are never logged or stored in plaintext.

### 2.2 OAuth 2.0 Token Protection (Rule 13)
- Google OAuth refresh tokens and access tokens are encrypted before being written to PostgreSQL.
- **Encryption Algorithm**: AES-256-GCM with unique initialization vectors (IV) per record.
- Secret encryption keys are supplied via environment variables (`ENCRYPTION_KEY_32_BYTES`) and never committed to source control.
- Tokens are never returned in client JSON payloads.

### 2.3 API Keys Management (Rule 14)
- User-generated API keys are formatted with a distinguishable prefix (e.g., `cp_live_...`).
- Only the **SHA-256 hash** of the API key is stored in the database.
- The raw key is presented to the user exactly once upon generation.
- Keys are revocable at any time and scoped to workspace permissions.

---

## 3. Rate Limiting & Abuse Prevention

Rate limiting is enforced at the edge/middleware using Redis sliding windows:

| Endpoint Group | Threshold | Action on Breach |
| :--- | :--- | :--- |
| `POST /api/v1/auth/login` | 5 attempts / min / IP | 429 Too Many Requests (Exponential lockout) |
| Public Search Endpoints | 20 requests / min / workspace | 429 with Retry-After header |
| AI Generation Endpoints | 10 requests / min / workspace | 429 with quota warning |
| Extension API Requests | 60 requests / min / token | 429 status code |

---

## 4. Input Sanitization & Attack Prevention

1. **SQL Injection**: Prevented universally by using Prisma ORM parameterized queries. Raw SQL queries are avoided or strictly sanitized with tagged templates.
2. **Cross-Site Scripting (XSS)**: React and Next.js handle JSX character escaping by default. Any HTML rendering (e.g. video descriptions) is sanitized using DOMPurify.
3. **Cross-Site Request Forgery (CSRF)**: NextAuth.js utilizes CSRF tokens and SameSite=Lax/Strict session cookies for state-changing operations.
4. **Content Security Policy (CSP)**: Strict headers are configured in Next.js middleware, preventing unauthorized script execution and frame hijacking.

---

## 5. Audit Logging

Security-critical events are recorded in the `AuditLog` table:
- Account creation & authentication events
- Password changes & reset requests
- OAuth connections & disconnections
- API key creation & revocation
- Workspace member invitation, role changes, and removals
- Billing plan alterations
