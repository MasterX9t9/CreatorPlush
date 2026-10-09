\# AGENTS.md



\# Creator Intelligence Platform



\## REAL BUILD / NO FAKE FUNCTIONALITY RULES



You are the engineering agent responsible for building this application.



This project is a production-grade YouTube creator intelligence platform.



Your highest priority is:



> BUILD REAL FUNCTIONALITY, NOT A DEMO.



The application must actually work end-to-end.



\---



\# 1. ABSOLUTE NO-FAKE RULE



NEVER create fake functionality.



Forbidden:



\* fake analytics

\* fake API responses

\* fake YouTube statistics

\* fake subscriber counts

\* fake revenue

\* fake RPM

\* fake charts

\* fake AI analysis

\* fake search results

\* fake channel data

\* fake video data

\* fake loading that eventually displays invented data

\* fake success messages

\* fake buttons

\* fake filters

\* fake exports

\* fake browser-extension functionality

\* fake authentication

\* fake billing

\* fake notifications

\* fake automation

\* fake database operations



Do not use random numbers to make dashboards look populated.



Do not hardcode YouTube statistics.



Do not generate fake "realistic" data and present it as production data.



\---



\# 2. PLACEHOLDERS



During development, placeholders are allowed ONLY when clearly identified.



Acceptable:



"Feature not implemented yet."



"Requires YouTube Analytics API authorization."



"Transcript unavailable."



"Revenue estimate unavailable."



Unacceptable:



Showing fake numbers such as:



1.2M views

85K subscribers

$4,200 revenue



when those values did not come from a real source.



If demo data is needed for UI development:



\* put it in `/demo`

\* clearly label it DEMO DATA

\* isolate it from production services

\* never mix demo data with real data

\* never enable demo mode accidentally in production



\---



\# 3. SOURCE OF TRUTH



Every piece of data must have a real source.



Possible sources:



\* YouTube Data API

\* YouTube Analytics API

\* OAuth-authorized YouTube account

\* approved external API

\* database calculations

\* user-provided data

\* AI analysis based on retrieved data



Every important metric should conceptually have:



```text

source

value

timestamp

data\_type

confidence

```



Example:



```json

{

&#x20; "metric": "views",

&#x20; "value": 125034,

&#x20; "source": "youtube\_data\_api",

&#x20; "type": "official",

&#x20; "timestamp": "2026-10-08T12:00:00Z"

}

```



\---



\# 4. NEVER INVENT DATA



If data is unavailable:



DO NOT invent it.



Return:



```text

Data unavailable.

```



or:



```text

This metric requires an authorized YouTube Analytics connection.

```



If data is estimated:



```text

Estimated

```



If data is calculated:



```text

Calculated from available data

```



If AI generated:



```text

AI recommendation based on retrieved data

```



Never present AI inference as official YouTube data.



\---



\# 5. API-FIRST DEVELOPMENT



Before implementing a feature that depends on external data:



1\. Identify the correct API.

2\. Read its documentation.

3\. Determine authentication requirements.

4\. Determine quota limits.

5\. Determine response structure.

6\. Implement the provider.

7\. Test the provider.

8\. Connect it to the backend.

9\. Connect backend to frontend.

10\. Add error handling.



Never build the frontend first and pretend the backend will exist later.



\---



\# 6. YOUTUBE API RULE



Use official/authorized YouTube APIs whenever possible.



Preferred:



\* YouTube Data API

\* YouTube Analytics API

\* YouTube OAuth



Do not bypass:



\* authentication

\* quotas

\* access controls

\* private data restrictions

\* YouTube security

\* API restrictions



Do not use unauthorized methods to access private creator analytics.



\---



\# 7. PUBLIC VS PRIVATE DATA



Clearly separate:



\## PUBLIC DATA



Examples:



\* public video views

\* public likes where available

\* public comments

\* public channel information

\* public video metadata



\## AUTHORIZED CREATOR DATA



Examples:



\* revenue

\* RPM

\* detailed audience demographics

\* watch time

\* impressions

\* CTR

\* returning viewers



Never display private creator analytics unless the user has properly authorized the connected channel.



\---



\# 8. BACKEND IS THE SOURCE OF TRUTH



Never trust the frontend for:



\* permissions

\* subscription status

\* quotas

\* API access

\* workspace ownership

\* billing

\* roles



All important validation must happen server-side.



Bad:



```text

Frontend says user is Pro → allow API request.

```



Good:



```text

Request

→ authenticated session

→ workspace authorization

→ subscription check

→ usage check

→ permission check

→ API request

```



\---



\# 9. DATABASE RULES



Every persistent feature must use the real database.



Do not use:



```javascript

const fakeData = \[...]

```



as the application's actual data source.



Use:



PostgreSQL

\+

Prisma

\+

proper migrations.



Every schema change must create a migration.



Never manually modify production database structure without migration tracking.



\---



\# 10. DATABASE INTEGRITY



Use:



\* foreign keys

\* indexes

\* unique constraints

\* transactions

\* timestamps

\* soft deletion where appropriate



Prevent:



\* orphaned records

\* duplicate records

\* cross-workspace access

\* accidental data deletion



\---



\# 11. MULTI-TENANT SECURITY



Every workspace-owned database query must verify workspace ownership.



Never do:



```text

findById(videoId)

```



without checking workspace authorization where applicable.



Prefer:



```text

find video

WHERE id = videoId

AND workspaceId = currentWorkspaceId

```



Users must never be able to access another workspace's:



\* channels

\* videos

\* reports

\* API keys

\* swipe files

\* notes

\* analytics

\* billing information



\---



\# 12. AUTHENTICATION



Authentication must be real.



Implement:



\* signup

\* login

\* logout

\* password reset

\* email verification

\* OAuth

\* secure session handling



Never create:



```text

if email === "admin@test.com"

```



as a fake authentication system.



Never store plaintext passwords.



\---



\# 13. OAUTH



OAuth tokens must be protected.



Never:



\* expose tokens to frontend JavaScript

\* commit tokens to Git

\* put secrets into source code

\* log access tokens

\* store secrets in public database fields



Use encrypted secure storage.



\---



\# 14. API KEYS



API keys must:



\* be hashed where appropriate

\* be revocable

\* have permissions/scopes

\* have usage tracking

\* have rate limits



Never display the full API key again after creation.



\---



\# 15. YOUTUBE SEARCH



Search results must come from:



\* YouTube API

\* authorized provider

\* or legitimate stored historical data



Never fabricate search results.



If YouTube API quota is exhausted:



Display:



```text

YouTube API quota exceeded. Try again later.

```



Do not silently return fake results.



\---



\# 16. CHANNEL ANALYTICS



Channel analytics must use real data.



Metrics must identify whether they are:



OFFICIAL

CALCULATED

ESTIMATED

AI-DERIVED



Example:



```text

Subscribers

125,430

Official YouTube data

```



or:



```text

Estimated monthly revenue

$1,200–$2,000

Estimated

```



Never:



```text

Monthly Revenue: $1,673.24

```



unless actual authorized revenue data exists.



\---



\# 17. OUTLIER ALGORITHM



Outlier scores must be calculated.



Do not hardcode:



```text

outlierScore = 92

```



Calculate it using real data.



Example:



```text

videoViews / expectedViews

```



Expected views can use:



\* channel median

\* comparable videos

\* video age

\* format

\* historical performance



Document the formula.



Users should be able to understand what the score means.



\---



\# 18. REVENUE ESTIMATION



Revenue estimation must be transparent.



Use:



```text

estimatedViews

×

estimatedRPM

```



or another documented methodology.



Return a range.



Example:



```text

Estimated revenue:

$800–$1,400

```



Do not pretend the estimate is actual AdSense revenue.



\---



\# 19. AI RULE



AI must never hallucinate factual statistics.



Before AI generates an answer:



```text

Retrieve real data

→ validate data

→ provide data to AI

→ generate analysis

→ return sources/data references

```



Bad:



```text

AI: This channel has 2.4M subscribers.

```



when the data was never retrieved.



Good:



```text

According to the retrieved YouTube data,

the channel currently has 2.38M subscribers.

```



\---



\# 20. AI FAILURE HANDLING



If AI provider fails:



DO NOT generate a fake response.



Show:



```text

AI analysis unavailable. The AI provider did not respond.

```



Retry where appropriate.



Log the error.



\---



\# 21. AI PROVIDER ARCHITECTURE



Create an abstraction:



```text

AIProvider

```



Possible implementations:



```text

OpenAIProvider

AnthropicProvider

GeminiProvider

LocalAIProvider

```



The application should not be tightly coupled to one model.



\---



\# 22. SEARCH PROVIDER ARCHITECTURE



Create:



```text

YouTubeProvider

SearchProvider

TranscriptProvider

AnalyticsProvider

```



Each provider must have:



\* interface

\* implementation

\* error handling

\* tests



\---



\# 23. CACHE RULES



Cache expensive API requests.



Use Redis where appropriate.



Cache must never become the source of fake data.



Every cached object needs:



```text

createdAt

expiresAt

source

```



When stale:



\* refresh

\* or clearly display stale data



Never pretend stale data is live.



\---



\# 24. RATE LIMITING



Implement rate limits for:



\* login

\* API

\* YouTube requests

\* AI requests

\* search

\* reports

\* extension requests



When rate limited:



Return an actual rate-limit error.



Do not silently bypass the limit.



\---



\# 25. BACKGROUND JOBS



Heavy operations must use workers.



Examples:



\* channel synchronization

\* historical snapshots

\* large searches

\* AI analysis

\* report generation

\* scheduled alerts

\* transcript processing



Architecture:



```text

Request

→ Queue

→ Worker

→ Provider

→ Database

→ Result

```



The UI should display actual job state.



\---



\# 26. JOB STATES



Use real states:



```text

queued

processing

completed

failed

cancelled

```



Never show:



```text

Completed

```



before the worker actually finishes.



\---



\# 27. ERROR HANDLING



Never hide errors.



Every important error must be:



\* logged

\* categorized

\* visible to the user when appropriate

\* recoverable where possible



Example:



```text

YouTube API authorization expired.

Reconnect your YouTube account.

```



instead of:



```text

Something went wrong.

```



\---



\# 28. FRONTEND RULE



Frontend components must represent real backend states.



Required states:



\* loading

\* empty

\* success

\* error

\* unauthorized

\* rate limited

\* unavailable



Do not create static dashboard cards pretending to be live.



\---



\# 29. BUTTON RULE



Every button must do something.



Before adding a button ask:



1\. What action does it perform?

2\. What API does it call?

3\. What database change happens?

4\. What happens on success?

5\. What happens on failure?



If there is no answer:



DO NOT create the button.



\---



\# 30. FILTER RULE



Every filter must actually filter data.



Do not create decorative filter dropdowns.



Example:



If user selects:



```text

Minimum views: 100,000

```



the backend query or actual dataset must enforce:



```text

views >= 100000

```



\---



\# 31. SORT RULE



Sorting must use real data.



Never visually reorder static cards.



\---



\# 32. PAGINATION



Large datasets must use real pagination.



Do not load thousands of records into the browser unnecessarily.



Support:



\* page

\* cursor

\* limit

\* sorting

\* filtering



\---



\# 33. EXPORT RULE



CSV/PDF/JSON exports must contain actual current data.



Never export placeholder values.



Export metadata:



```text

Generated at

Data source

Date range

Workspace

Filters

```



\---



\# 34. REPORT RULE



Reports must be generated from stored/retrieved data.



If report generation fails:



```text

Report generation failed.

```



Do not generate an empty PDF and call it successful.



\---



\# 35. BROWSER EXTENSION RULE



The Chrome extension must perform actual operations.



No fake overlay.



No static mock analytics.



The extension must communicate with the backend securely.



Architecture:



```text

YouTube Page

↓

Content Script

↓

Extension Service Worker

↓

Authenticated API

↓

Backend

↓

Database / YouTube Provider

```



\---



\# 36. EXTENSION AUTHENTICATION



Never put backend secrets inside the extension.



Use secure authentication.



Handle:



\* login

\* token expiration

\* logout

\* unauthorized requests



\---



\# 37. YOUTUBE DOM CHANGES



YouTube changes its UI frequently.



Never rely on one fragile selector if avoidable.



Use:



\* resilient selectors

\* feature detection

\* fallback selectors

\* graceful degradation



If YouTube changes something:



The extension must fail safely.



It must not corrupt the YouTube page.



\---



\# 38. EXTENSION FILTERS



When implementing filters:



1\. detect actual video cards

2\. read actual metadata

3\. parse data

4\. apply filter

5\. update visible results



Do not simply display:



"Filter applied."



without changing anything.



\---



\# 39. SCREENSHOT FUNCTION



Screenshot functionality must actually capture the selected content.



Do not create a fake download button.



If browser security prevents an operation:



Explain the limitation.



\---



\# 40. SWIPE FILE



Saving an item must actually create a database record.



Flow:



```text

Save

→ API request

→ authorization

→ database insert

→ success response

→ UI update

```



Refresh the page.



The saved item must still exist.



\---



\# 41. TRACKING



Tracking must actually persist.



Example:



User tracks channel.



System:



```text

trackedChannel created

↓

scheduled worker

↓

fetch current data

↓

create snapshot

↓

calculate changes

↓

trigger alert

```



Do not fake growth charts.



\---



\# 42. ALERTS



Alerts must have real conditions.



Example:



```text

IF currentViews > averageViews × 5

THEN create alert

```



Do not create fake notifications for visual effect.



\---



\# 43. AUTOMATION



Scheduled automation must actually execute.



Store:



\* schedule

\* timezone

\* task

\* owner

\* status

\* lastRun

\* nextRun

\* errors



A scheduled task must have execution history.



\---



\# 44. BILLING



Billing must use the payment provider's webhook as the source of truth.



Never trust:



```text

localStorage.plan = "pro"

```



for subscription access.



Subscription flow:



```text

Stripe

→ webhook

→ backend verification

→ database

→ permissions

```



\---



\# 45. USAGE LIMITS



Usage limits must be enforced server-side.



Examples:



\* searches/month

\* AI requests

\* tracked channels

\* reports

\* API calls



Do not merely hide features on the frontend.



\---



\# 46. SECURITY TESTING



Test:



\* unauthorized API calls

\* IDOR

\* workspace isolation

\* expired sessions

\* invalid API keys

\* rate limits

\* malicious inputs

\* SQL injection

\* XSS

\* CSRF

\* file upload attacks



\---



\# 47. FILE UPLOADS



For thumbnails/images/files:



Validate:



\* MIME type

\* extension

\* size

\* dimensions



Never trust the filename.



Never execute uploaded files.



\---



\# 48. LOGGING



Use structured logging.



Log:



\* request ID

\* user/workspace ID where appropriate

\* endpoint

\* duration

\* error

\* provider

\* job ID



NEVER log:



\* passwords

\* OAuth tokens

\* API secrets

\* private credentials



\---



\# 49. OBSERVABILITY



Implement:



\* error monitoring

\* API latency

\* worker failures

\* queue depth

\* YouTube API quota usage

\* AI usage

\* database performance



\---



\# 50. TESTING RULE



Every important feature needs tests.



At minimum:



\## Unit



Algorithms

Calculations

Validation

Permissions



\## Integration



Database

API

YouTube provider

AI provider

Authentication



\## E2E



Signup

Login

Connect channel

Search

Analyze

Save

Track

Report

Alert



\---



\# 51. MANUAL TESTING



Before marking a feature complete:



Actually use it.



Example:



For Save to Swipe File:



```text

Open video

→ Save

→ Refresh

→ Open library

→ Confirm video exists

→ Remove

→ Refresh

→ Confirm removed

```



Do not rely only on compilation.



\---



\# 52. BUILD VERIFICATION



After every meaningful change:



Run:



```bash

npm run lint

npm run typecheck

npm test

npm run build

```



Use the project's actual commands if different.



Fix errors before continuing.



\---



\# 53. NO ERROR SUPPRESSION



Do not use:



```typescript

// @ts-ignore

```



to hide problems.



Do not use:



```typescript

any

```



as a shortcut for broken typing.



Do not disable lint rules globally to make the build pass.



If suppression is genuinely necessary:



\* explain why

\* keep scope minimal

\* add a TODO

\* create an issue/task



\---



\# 54. NO GIANT FILES



Avoid enormous files.



Split:



\* UI components

\* services

\* repositories

\* API routes

\* providers

\* algorithms



Use clear architecture.



\---



\# 55. NO DUPLICATE LOGIC



Do not implement the same calculation in multiple places.



Example:



Outlier calculation should exist in one service.



Use:



```text

OutlierService

```



instead of duplicating the formula across:



\* dashboard

\* extension

\* reports

\* API



\---



\# 56. DOCUMENTATION



Update documentation when architecture changes.



Required documents:



```text

AGENTS.md

TODO.md

ARCHITECTURE.md

DATABASE.md

API.md

SECURITY.md

DATA-SOURCES.md

TESTING.md

```



Documentation must describe what actually exists.



Do not document imaginary functionality.



\---



\# 57. TODO.md RULE



TODO.md must reflect reality.



Use:



```text

\[ ] Not started

\[-] In progress

\[x] Complete

\[!] Blocked

```



Never mark a feature complete just because its UI exists.



\---



\# 58. FEATURE COMPLETION CHECKLIST



Before marking `\[x]`:



```text

\[ ] UI implemented

\[ ] Backend implemented

\[ ] Database implemented if required

\[ ] Real provider/API connected

\[ ] Authentication verified

\[ ] Authorization verified

\[ ] Loading state

\[ ] Empty state

\[ ] Error state

\[ ] Success state

\[ ] Tests

\[ ] Manual test

\[ ] Documentation updated

```



All applicable items must be complete.



\---



\# 59. WHEN A FEATURE IS IMPOSSIBLE



Do not fake it.



Use:



```text

BLOCKED

```



Then document:



```text

Reason:

Required API:

Required permission:

Possible alternative:

```



Example:



```text

BLOCKED



Feature:

Private creator revenue analysis



Reason:

YouTube only provides this data to an authorized channel owner.



Required:

YouTube OAuth + YouTube Analytics API.



Alternative:

Public revenue estimation.

```



\---



\# 60. WHEN THE USER ASKS FOR "100%"



"100% working" means:



Every implemented feature works for its supported scenario.



It does NOT mean:



\* bypassing YouTube restrictions

\* accessing private data without permission

\* guaranteeing third-party APIs never fail

\* pretending unsupported APIs exist



Be honest about external limitations.



\---



\# 61. DO NOT COPY PROPRIETARY IMPLEMENTATION



The application may reproduce legitimate user-facing capabilities, but must NOT copy:



\* proprietary source code

\* private APIs

\* authentication bypasses

\* proprietary algorithms obtained improperly

\* private databases

\* copyrighted UI assets

\* logos

\* branding

\* private customer information



Implement equivalent functionality independently.



\---



\# 62. UI QUALITY



The application must not look like an unfinished admin template.



Use:



\* consistent spacing

\* typography hierarchy

\* reusable components

\* meaningful icons

\* responsive layouts

\* accessible controls

\* clear charts

\* useful empty states



But remember:



UI quality never substitutes for functionality.



A beautiful fake feature is still a failed feature.



\---



\# 63. PERFORMANCE RULE



Do not sacrifice correctness for speed.



Use:



\* caching

\* batching

\* pagination

\* background jobs

\* database indexes



But never return fake cached data simply to make the application appear fast.



\---



\# 64. OFFLINE / FAILURE BEHAVIOR



External APIs can fail.



The application should gracefully handle:



\* timeout

\* quota exceeded

\* provider unavailable

\* OAuth expired

\* deleted channel

\* deleted video

\* private video



Where possible, show the last verified data with:



```text

Last updated:

2026-10-08 14:32

```



Do not present stale data as live.



\---



\# 65. DATA FRESHNESS



Every dashboard should know when its data was updated.



Example:



```text

Updated 4 minutes ago

```



or:



```text

Last synchronized:

Oct 8, 2026 14:32

```



Do not claim "Live" unless the data is actually live.



\---



\# 66. AI CONTENT IDEAS



AI-generated content ideas are allowed.



However:



AI suggestions must be clearly separated from factual analytics.



Example:



```text

DATA FINDING



Videos about Topic X performed 4.2x above the channel median.



AI RECOMMENDATION



Create a video exploring...

```



Never mix the two.



\---



\# 67. DATA CITATIONS INSIDE AI



Where practical, AI analysis should reference the underlying records.



Example:



```text

Based on 27 analyzed videos...

```



The UI should allow the user to inspect those videos.



\---



\# 68. NO MAGIC NUMBERS



Do not write unexplained constants such as:



```typescript

const viralScore = 87;

```



Every scoring system must have:



\* formula

\* inputs

\* weights

\* documentation



\---



\# 69. CONFIGURATION



Use environment variables for:



\* database

\* Redis

\* YouTube API

\* OAuth

\* AI providers

\* Stripe

\* email

\* storage

\* monitoring



Create:



```text

.env.example

```



Never commit:



```text

.env

```



\---



\# 70. GIT RULES



Make small meaningful commits.



Examples:



```text

feat: add YouTube OAuth

feat: add channel search

feat: add video analytics

fix: handle YouTube quota errors

test: add outlier calculation tests

```



Do not make one enormous meaningless commit after hundreds of changes.



\---



\# 71. DO NOT DESTROY EXISTING WORK



Before changing major architecture:



Inspect existing implementation.



Do not:



\* delete working systems

\* rewrite everything

\* replace dependencies unnecessarily

\* remove tests

\* remove features



unless there is a documented reason.



\---



\# 72. DEBUGGING RULE



When something fails:



1\. Reproduce.

2\. Inspect logs.

3\. Identify root cause.

4\. Fix root cause.

5\. Add regression test.

6\. Verify.

7\. Continue.



Do not hide the error.



\---



\# 73. FINAL VERIFICATION



Before declaring the application finished:



Test the complete workflow:



```text

Create account

↓

Login

↓

Create workspace

↓

Connect YouTube

↓

Search videos

↓

Search channels

↓

Analyze channel

↓

Analyze video

↓

Find outliers

↓

Analyze niche

↓

Analyze competitors

↓

Save video

↓

Create collection

↓

Track competitor

↓

Create alert

↓

Run alert

↓

Generate report

↓

Export report

↓

Open Chrome extension

↓

Authenticate extension

↓

Analyze YouTube page

↓

Save item

↓

Return to web app

↓

Confirm saved item

```



Every step must actually work.



\---



\# 74. FINAL AGENT PRINCIPLE



Remember this at all times:



> NEVER MAKE THE APPLICATION LOOK MORE COMPLETE THAN IT ACTUALLY IS.



If something works, implement it fully.



If something does not work, expose the limitation.



If something cannot be implemented, mark it blocked.



If an API does not provide the required data, do not invent it.



If a button has no real action, do not create it.



If an AI model does not return an answer, do not fake one.



If a chart has no real data, show an honest empty state.



The goal is not to produce the most impressive-looking demo.



The goal is to produce a real, maintainable, production-ready product.



\# END OF AGENTS.md



