# Future Plans

This document is the source of truth for work that is planned but not yet implemented. It is maintained on the `future_plan` branch together with [FUTURE_TIMELINE.md](./FUTURE_TIMELINE.md).

Dates use the `D MMM YYYY` format, for example `3 Sep 2026`.

## Workflow

Each plan follows this lifecycle:

```text
Added → Planned → Ready → In progress → Implemented → Completed
```

Create a dated entry in `FUTURE_TIMELINE.md` whenever a plan is added or changes status. Do not edit historical timeline rows; append a new row instead.

Implementation work belongs in a separate code branch created from `main`, such as `feature/price-extraction`. Once the implementation is verified and merged, update the plan status and append the implementation and completion events to the timeline.

## Plan registry

| Plan ID | Title | Added | Status | Implementation branch |
| --- | --- | --- | --- | --- |
| FP-2026-09-03-price-extraction | Accurate Booking.com price extraction | 3 Sep 2026 | Planned | Not started |

## FP-2026-09-03-price-extraction — Accurate Booking.com price extraction

| Field | Value |
| --- | --- |
| Added | 3 Sep 2026 |
| Status | Planned |
| Implementation started | Not started |
| Implemented | Not implemented |
| Completed | Not completed |
| Implementation branch | Not started |

### Goal

Extract real, search-context-specific room prices from Booking.com instead of using a fallback value when a rate is unavailable.

### Scope

1. Capture price-related DOM and embedded JSON from live Booking.com pages for defined check-in/check-out dates, guest counts, and currency.
2. Identify stable room-to-price associations and add prioritized parsing with source metadata.
3. Require search context in the extraction request and return a missing rate as `null`, never as an invented fallback value.
4. Add saved HTML/JSON fixtures and automated tests for room names, prices, currencies, room mapping, and unavailable-rate cases.
5. Run a live regression test against the Renmark Motor Inn URL and confirm each returned price matches the rendered Booking.com rate for the same search context.
6. Review `.gitignore` before adding fixtures or test artifacts so only reusable, non-sensitive fixtures are tracked; ignore local captures, logs, credentials, and generated browser artifacts.

### Definition of done

- Every returned room rate has a recorded extraction source and currency.
- Missing or unavailable rates are explicitly represented as `null`.
- Fixture tests pass and a live verification confirms room-to-price accuracy.
- No credentials, local captures, logs, or generated browser files are tracked.

## Adding a plan

1. Create an ID using `FP-YYYY-MM-DD-short-title`.
2. Add a row to the plan registry and a detailed plan section with status `Planned`.
3. Append a `Plan added` row to `FUTURE_TIMELINE.md` using the same date and plan ID.
4. When work begins, record the implementation branch in both documents and append a `Work started` timeline row.
5. After verification and merge, append `Implemented` and `Completed` timeline rows and update the plan status and dates.
