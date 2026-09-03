# 🗺️ Future Plans & Task Registry

This document is the central source of truth for planned features, upcoming improvements, technical tasks, and bug fixes for the project. It is maintained on the `future-plan` branch together with [FUTURE_TIMELINE.md](./FUTURE_TIMELINE.md).

Dates use the `D MMM YYYY` format (e.g. `03 Sep 2026`).

---

## 🔄 Planning Workflow

When adding a new plan in the future:
1. **Define Plan**: Create a detailed plan entry below with a unique Plan ID (`FP-YYYY-MM-DD-short-title`), Goal, Scope, and Definition of Done.
2. **Register**: Add a row to the **Plan Registry** table.
3. **Log Timeline**: Append a `Plan Added` entry to [FUTURE_TIMELINE.md](./FUTURE_TIMELINE.md).
4. **Implementation**: Code changes are developed on a separate branch off `main` (e.g. `feature/*` or `fix/*`). Never commit application code directly to `future-plan`.

```text
Plan Added → Work Started → Daily Commitment / Progress → Implementation Completed → Plan Completed
```

---

## 📋 Plan Registry

| Plan ID | Title | Priority | Category | Status | Assignee / Developer | Target Finish | Branch / PR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [FP-2026-09-03-price-extraction](#fp-2026-09-03-price-extraction-—-accurate-bookingcom-price-extraction) | Accurate Booking.com price extraction | ⚡ High | Technical Task | 🟢 Completed | Mohammed Kamaluddin | 03 Sep 2026 | `main` (PR #2) |

---

## 🎯 Active & Planned Specifications

### FP-2026-09-03-price-extraction — Accurate Booking.com price extraction

| Field | Details |
| --- | --- |
| **Plan ID** | `FP-2026-09-03-price-extraction` |
| **Category** | Technical Task / Feature |
| **Priority** | ⚡ High |
| **Status** | 🟢 Completed |
| **Added Date** | 03 Sep 2026 |
| **Target Completion** | 03 Sep 2026 |
| **Assignee / Developer** | Mohammed Kamaluddin |
| **Implementation Branch** | `feature/price-extraction` (Merged into `main` via PR #2) |
| **Dependencies / Prerequisites** | Node.js Playwright setup on `main` branch |

#### Goal
Extract real, search-context-specific room prices from Booking.com instead of using a fallback value when a rate is unavailable.

#### Scope
1. Capture price-related DOM and embedded JSON from live Booking.com pages for defined check-in/check-out dates, guest counts, and currency.
2. Identify stable room-to-price associations and add prioritized parsing with source metadata.
3. Require search context in the extraction request and return a missing rate as `null`, never as an invented fallback value.
4. Add saved HTML/JSON fixtures and automated tests for room names, prices, currencies, room mapping, and unavailable-rate cases.
5. Run a live regression test against the Renmark Motor Inn URL and confirm each returned price matches the rendered Booking.com rate for the same search context.
6. Review `.gitignore` before adding fixtures or test artifacts so only reusable, non-sensitive fixtures are tracked; ignore local captures, logs, credentials, and generated browser artifacts.

#### Technical Architecture & Deep Audit Findings

| # | Risk Area | Technical Issue | Implementation Fix |
|---|---|---|---|
| 1 | **URL Parameter Handling** | Appending params to URLs with existing query strings creates invalid URL syntax (`?checkin=...&checkin=...`). | Use `URL` and `URLSearchParams.set()` to cleanly merge or overwrite search context params. |
| 2 | **Multi-Night Normalization** | Booking.com returns total stay price for $N$ nights ($450 for 3 nights), which inflates `roomtype_rack_rate` if assigned directly. | Calculate stay length ($N = \text{checkout} - \text{checkin}$). Compute `nightlyRate = totalStayPrice / N` and record `roomtype_min_stay = N`. |
| 3 | **I18n & Currency Formatting** | Naive regex `\d{2,5}` fails on thousands separators (`AU$ 1,250`), EU decimal commas (`1.250,50 €`), and non-standard currency symbols. | Implement robust DOM element extraction (`[data-testid="price-and-discounted-price"]`, `.bui-price-display__value`) and ISO currency normalizer. |
| 4 | **Table `rowspan` Multi-Rate Rows** | Booking.com `.hprt-table` uses `rowspan` for room names across sub-rows. Naive `tr` loops miss room names on sub-rows. | Implement stateful `rowspan`-aware table parser that tracks active room name and selects lowest base rate as `roomtype_rack_rate`. |
| 5 | **Playwright Page Hydration** | `domcontentloaded` triggers before Client-Side GraphQL/REST price hydration completes, leading to false `null` rates. | Add explicit Playwright wait for price selectors (`page.waitForSelector('[data-testid="price-and-discounted-price"], .hprt-table')`). |
| 6 | **Downstream Type Safety** | Changing `roomtype_rack_rate` to `number \| null` could trigger runtime exceptions (`TypeError: null.toFixed is not a function`). | Audit and safeguard all UI/table formatters in `src/main.ts` and `index.html` with explicit `null` checks and fallback badges. |
| 7 | **Git Branch Strategy** | `future-plan` branch policy forbids application code commits. | Development must strictly occur on `price-extraction` branch off `main`, with doc updates committed to `future-plan`. |

#### Proposed Implementation Details

##### 1. Core Extractor Logic (`src/utils/bookingExtractor.ts`)
- **Interfaces**:
  - Add `SearchContext` (`checkin`, `checkout`, `adults`, `children`, `currency`).
  - Update `RoomTypeData` (`price: number | null`, `totalPrice?: number | null`, `currency: string | null`, `priceSource?: string`).
  - Update `PMSRoomTypeRecord` (`roomtype_rack_rate: number | null`, `roomtype_currency: string | null`).
- **Multi-Source Price Parsing**:
  - Apollo JSON State (`window.__apollo_state__`) block parsing.
  - Stateful `rowspan`-aware DOM table parsing (`.hprt-table`, `[data-component="property/availability-table"]`).
  - Strict `null` handling: eliminate hardcoded 200 default rate in `transformToPMSRoomTypes`.
  - Nightly rate normalization: `nightlyRate = totalStayPrice / numberOfNights`.

##### 2. API Server Middleware (`vite.config.ts`)
- Accept optional `searchContext` in `/api/extract` POST payload.
- Pass `searchContext` to `extractPMSRoomTypesFromUrl`.

##### 3. Frontend & UI (`src/main.ts` & `index.html`)
- Add check-in date, check-out date, guest count, and currency controls in UI.
- Handle `null` rates safely with `"Rate Unavailable"` badge.

##### 4. Automated Test Suite (`tests/`)
- Add Vitest setup in `package.json` (`"test": "vitest run"`).
- Create fixtures: `tests/fixtures/renmark_motor_inn_search.html` and `tests/fixtures/unavailable_rates.html`.
- Add test runner: `tests/priceExtractor.test.ts`.

#### Definition of Done
- Every returned room rate has a recorded extraction source and currency.
- Missing or unavailable rates are explicitly represented as `null`.
- Fixture tests pass and a live verification confirms room-to-price accuracy.
- No credentials, local captures, logs, or generated browser files are tracked.

#### Daily Commitments & Progress Log
- **03 Sep 2026**: Plan created and registered in `FUTURE_PLAN.md` and `FUTURE_TIMELINE.md`.
- **03 Sep 2026**: Assigned to Mohammed Kamaluddin on implementation branch `price-extraction`; work started.
- **03 Sep 2026**: Completed deep technical audit (7 risk areas analyzed) and added detailed component changes and verification plan to `FUTURE_PLAN.md`.

---

## 📁 Task Categories & Backlog Structure

### 1. 🚀 Planned Features
*(Feature requests and new functionality to be designed and implemented)*

### 2. ⚡ Upcoming Improvements
*(Refactoring, performance enhancements, UI/UX polish)*

### 3. 🛠️ Technical Tasks
*(Infrastructure, test coverage, parser stability, environment setup)*

### 4. 🐛 Bugs & Issues to Address Later
*(Known limitations, edge cases, fallback bugs to resolve in future sprints)*
