# Future Plans & Task Registry

This document is the central source of truth for planned features, upcoming improvements, technical tasks, and bug fixes for the project. It is maintained on the `future-plan` branch together with [FUTURE_TIMELINE.md](./FUTURE_TIMELINE.md).

Dates use the `DD-MM-YYYY` format.

---

## Workflow & Lifecycle

Each plan follows this lifecycle:

```text
Added → Planned → In progress → Implemented → Completed
```

- Implementation work MUST take place in separate code branches created from `main` (e.g. `feature/price-extraction` or `fix/rate-parsing`).
- The `future-plan` branch is reserved strictly for documentation and project tracking.

---

## Plan Registry

| Plan ID | Title | Priority | Category | Status | Assignee / Developer | Target Finish | Implementation Branch / PR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FP-2026-09-03-price-extraction | Accurate Booking.com price extraction | High | Technical Task | Planned | Unassigned | TBD | Not started |

---

## Active & Planned Plans

### FP-2026-09-03-price-extraction — Accurate Booking.com price extraction

| Field | Details |
| --- | --- |
| **Plan ID** | `FP-2026-09-03-price-extraction` |
| **Category** | Technical Task / Feature |
| **Priority** | High |
| **Status** | Planned |
| **Added Date** | 03-09-2026 |
| **Target Completion** | TBD |
| **Assignee / Developer** | Unassigned |
| **Implementation Branch** | Not started |
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
- **03-09-2026**: Plan created and added to registry.

---

## Task Categories & Backlog Structure

### 1. Planned Features
*(Feature requests and new functionality to be designed and implemented)*

### 2. Upcoming Improvements
*(Refactoring, performance enhancements, UI/UX polish)*

### 3. Technical Tasks
*(Infrastructure, test coverage, parser stability, environment setup)*

### 4. Bugs & Issues to Address Later
*(Known limitations, edge cases, fallback bugs to resolve in future sprints)*

---

## Guidelines for Adding a New Plan

1. Create a unique Plan ID using `FP-YYYY-MM-DD-short-title`.
2. Add an entry in the **Plan Registry** table with Priority, Status, Category, and Assignee.
3. Create a detailed section under the appropriate category outlining Goal, Scope, Dependencies, and Definition of Done.
4. Log a `Plan added` entry in [FUTURE_TIMELINE.md](./FUTURE_TIMELINE.md).
5. When a developer starts work, update the Assignee and Status, and log a `Work started` event in `FUTURE_TIMELINE.md`.
6. Log day-to-day developer commitments in `FUTURE_TIMELINE.md` and the plan's Progress Log.
7. Upon PR/merge, update Status to `Completed` and log the completion in `FUTURE_TIMELINE.md`.
