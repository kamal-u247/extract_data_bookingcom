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
| [FP-2026-09-03-price-extraction](#fp-2026-09-03-price-extraction-—-accurate-bookingcom-price-extraction) | Accurate Booking.com price extraction | ⚡ High | Technical Task | 🔵 In Progress | Mohammed Kamaluddin | TBD | `price-extraction` |

---

## 🎯 Active & Planned Specifications

### FP-2026-09-03-price-extraction — Accurate Booking.com price extraction

| Field | Details |
| --- | --- |
| **Plan ID** | `FP-2026-09-03-price-extraction` |
| **Category** | Technical Task / Feature |
| **Priority** | ⚡ High |
| **Status** | 🔵 In Progress |
| **Added Date** | 03 Sep 2026 |
| **Target Completion** | TBD |
| **Assignee / Developer** | Mohammed Kamaluddin |
| **Implementation Branch** | `price-extraction` |
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

#### Definition of Done
- Every returned room rate has a recorded extraction source and currency.
- Missing or unavailable rates are explicitly represented as `null`.
- Fixture tests pass and a live verification confirms room-to-price accuracy.
- No credentials, local captures, logs, or generated browser files are tracked.

#### Daily Commitments & Progress Log
- **03 Sep 2026**: Plan created and registered in `FUTURE_PLAN.md` and `FUTURE_TIMELINE.md`.
- **03 Sep 2026**: Assigned to Mohammed Kamaluddin on implementation branch `price-extraction`; work started.

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
