# Testing Strategy & Quality Assurance: CreatorPulse

## 1. Testing Philosophy & Standards

In accordance with Rule 50, 51, and 52 in `AGENTS.md`:
- **Real Tests, Real Assertions**: Tests must validate authentic business logic, mathematical formulas, and database interactions.
- **Zero Suppression**: No `@ts-ignore` or loose `any` typing to bypass compiler or test assertions.
- **Continuous Verification**: Every milestone must pass linting, type-checking, unit tests, and build verification.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

## 2. Test Architecture

### 2.1 Unit Tests (`src/__tests__/unit/`)
Framework: **Vitest** (fast, native ESM and TypeScript support).
Target Areas:
1. **Outlier Algorithm (`outliers.test.ts`)**:
   - Verification of expected view medians on normal, skewed, and multimodal distributions.
   - Exact threshold tiering (`2x`, `5x`, `10x`, `20x_plus`).
   - Boundary tests (zero views, single video channel, short vs long-form).
2. **Revenue & RPM Estimator (`revenue.test.ts`)**:
   - Verifies range outputs ($RPM_{low}$ to $RPM_{high}$).
   - Ensures ranges are rounded and never return false-precision decimals.
3. **Workspace Authorization Guards (`permissions.test.ts`)**:
   - Validates that attempts to access cross-workspace records throw immediate authorization errors.
4. **Search Query Filters (`filters.test.ts`)**:
   - Asserts correct SQL/Prisma where-clause assembly for view count, subscriber range, and upload duration filters.

### 2.2 Integration Tests (`src/__tests__/integration/`)
Target Areas:
1. **YouTube Provider (`youtube-provider.test.ts`)**:
   - Mocks raw Google API responses to assert mapping into internal `Channel` and `Video` models.
   - Tests error handling on 403 `quotaExceeded` and 401 `invalidCredentials`.
2. **Swipe File Service (`swipe.service.test.ts`)**:
   - Verifies real database operations via test database: folder creation, item insertion, tag assignment, and workspace isolation verification.
3. **Authentication Flows (`auth.test.ts`)**:
   - Signup with password hashing, login verification, session generation, and rejection of invalid passwords.

### 2.3 End-to-End (E2E) Testing (`src/__tests__/e2e/`)
Framework: **Playwright**.
Critical User Journeys:
1. **Registration & Workspace Onboarding**:
   - Sign up -> Initial workspace creation -> Dashboard shell displays honest empty state.
2. **YouTube Channel Search & Analysis**:
   - Search creator by keyword -> View public analytics -> Check outlier videos -> Save video to swipe file.
3. **Library & Swipe File Persistence**:
   - Save video -> Refresh page -> Verify item persists in Swipe File folder -> Remove item -> Verify item removed.
4. **Extension Communication Flow**:
   - Extension pinging `/api/v1/extension/ping` with API token -> Fetching video outlier data -> Receiving structured response.

---

## 3. Manual Testing Verification Protocol (Rule 51)

Before marking any feature as complete in `TODO.md`:
1. Execute the manual workflow in the browser.
2. Verify visual states: Loading (skeleton), Empty, Success, Error.
3. Confirm data persistence by refreshing the browser and inspecting PostgreSQL records.
