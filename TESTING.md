# Testing Specification: CreatorPulse

*Refer to the full testing strategy document in [docs/TESTING.md](file:///d:/1.%20Ai%20Dev/2.%20YouuTube%20UP/docs/TESTING.md).*

## Summary of Core Testing Rules:
1. **Vitest for Unit & Integration Tests**: Testing outlier algorithms, revenue range calculations, permissions, and database operations.
2. **Playwright for E2E Tests**: Testing user journeys from signup to YouTube analysis and swipe saving.
3. **No Error Suppression**: No `@ts-ignore` or `any` workarounds to make tests pass.
4. **Mandatory Build Verification**:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
