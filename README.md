# Booking.com Hotel Data Extractor & PMS Rate Engine (`price-extraction`)

A TypeScript data extraction engine and browser dashboard that uses Playwright Chromium and Cheerio to extract search-context-specific room prices, room types, photos, and facility details from Booking.com, mapping them into `pms_roomtype`-style records.

---

## ⚡ Features & Price Extraction Capabilities

- **Search Context Support**: Accepts check-in date, check-out date, guest count (adults/children), and currency to extract real, live rates for specific stays.
- **Multi-Night Rate Normalization**: Calculates stay duration $N = \text{checkout} - \text{checkin}$ (in days). Computes `nightlyRate = totalStayPrice / N` and records `roomtype_min_stay = N`.
- **Stateful `rowspan`-Aware DOM Table Extraction**: Tracks room names across multi-row availability tables where Booking.com uses `rowspan` for rate options, selecting the lowest base rate per room.
- **Strict `null` Rate Handling**: Explicitly returns missing or unavailable rates as `null` (never defaults to an invented price like 200).
- **International Currency Parsing**: Supports AUD (`AU$`), USD (`$`), EUR (`€`), GBP (`£`), CAD (`CA$`), NZD (`NZ$`), JPY (`¥`), and ISO currency codes.
- **Automated Test Suite**: Includes Vitest unit and live Playwright Chromium test suites.

---

## 🚀 API Documentation & Request/Response Samples

The Vite development server provides the extraction endpoint:

```text
POST /api/extract
Content-Type: application/json
```

### 1. Request Payload Sample

#### With Search Context (Recommended for Live Price Extraction)

```json
{
  "url": "https://www.booking.com/hotel/au/renmark-motor-inn.en-gb.html",
  "searchContext": {
    "checkin": "2026-10-10",
    "checkout": "2026-10-13",
    "adults": 2,
    "children": 0,
    "currency": "AUD"
  }
}
```

#### Minimal Request (URL Only)

```json
{
  "url": "https://www.booking.com/hotel/au/renmark-motor-inn.en-gb.html"
}
```

---

### 2. Response Payload Sample

Returns a JSON array of `PMSRoomTypeRecord` objects ready for PMS database import.

```json
[
  {
    "roomtype_hotel_name": "Renmark Motor Inn",
    "roomtype_rating_score": 8.4,
    "roomtype_review_count": 320,
    "roomtype_name": "Budget Double Room",
    "roomtype_code": "BDR",
    "roomtype_num_rooms": 1,
    "roomtype_num_bedrooms": 1,
    "roomtype_normal_sleeps": 2,
    "roomtype_max_sleeps": 2,
    "roomtype_description": "Offering comfortable accommodation in the heart of Renmark.",
    "roomtype_rack_rate": 138,
    "roomtype_min_rate": -1,
    "roomtype_max_rate": -1,
    "roomtype_min_stay": 3,
    "roomtype_extra_adult_cost": 0,
    "roomtype_extra_child_cost": 0,
    "roomtype_breakfast": "n",
    "roomtype_inclusion": "Bedding: 1 double bed",
    "roomtype_facilities": "Free WiFi, Free Parking, Air conditioning, Swimming pool",
    "roomtype_address": "127 Ral Ral Avenue",
    "roomtype_suburb": "Renmark",
    "roomtype_postcode": "5341",
    "roomtype_city": "Renmark",
    "roomtype_state": "South Australia",
    "roomtype_country": "Australia",
    "roomtype_max_adult": 2,
    "roomtype_max_child": 0,
    "roomtype_category": "Standard",
    "roomtype_photos": [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/123456.jpg"
    ],
    "roomtype_currency": "AUD",
    "_facilities_categorized": {
      "Most Popular Facilities": [
        "Free WiFi",
        "Free Parking",
        "Air conditioning"
      ]
    },
    "_field_sources": {
      "dynamic_fields": [
        "roomtype_name",
        "roomtype_description",
        "roomtype_normal_sleeps",
        "roomtype_max_sleeps",
        "roomtype_max_adult",
        "roomtype_breakfast",
        "roomtype_facilities",
        "roomtype_address",
        "roomtype_suburb",
        "roomtype_city",
        "roomtype_state",
        "roomtype_country",
        "roomtype_photos",
        "roomtype_hotel_name",
        "roomtype_rating_score",
        "roomtype_review_count",
        "roomtype_rack_rate",
        "roomtype_currency"
      ],
      "default_fields": [
        "roomtype_code (auto-generated code)",
        "roomtype_num_rooms (default 1)",
        "roomtype_num_bedrooms (default 1)",
        "roomtype_min_stay (calculated: 3)",
        "roomtype_extra_adult_cost (default 0)",
        "roomtype_extra_child_cost (default 0)",
        "roomtype_category (default Standard)"
      ]
    }
  },
  {
    "roomtype_hotel_name": "Renmark Motor Inn",
    "roomtype_rating_score": 8.4,
    "roomtype_review_count": 320,
    "roomtype_name": "Sold Out Villa",
    "roomtype_code": "SOV",
    "roomtype_num_rooms": 1,
    "roomtype_num_bedrooms": 1,
    "roomtype_normal_sleeps": 4,
    "roomtype_max_sleeps": 4,
    "roomtype_description": "Offering comfortable accommodation in the heart of Renmark.",
    "roomtype_rack_rate": null,
    "roomtype_min_rate": -1,
    "roomtype_max_rate": -1,
    "roomtype_min_stay": 3,
    "roomtype_extra_adult_cost": 0,
    "roomtype_extra_child_cost": 0,
    "roomtype_breakfast": "n",
    "roomtype_inclusion": "Bedding: 2 double beds",
    "roomtype_facilities": "Free WiFi, Free Parking, Air conditioning",
    "roomtype_address": "127 Ral Ral Avenue",
    "roomtype_suburb": "Renmark",
    "roomtype_postcode": "5341",
    "roomtype_city": "Renmark",
    "roomtype_state": "South Australia",
    "roomtype_country": "Australia",
    "roomtype_max_adult": 4,
    "roomtype_max_child": 0,
    "roomtype_category": "Standard",
    "roomtype_photos": [],
    "roomtype_currency": "AUD",
    "_field_sources": {
      "dynamic_fields": [
        "roomtype_name",
        "roomtype_description",
        "roomtype_normal_sleeps",
        "roomtype_max_sleeps",
        "roomtype_max_adult",
        "roomtype_breakfast",
        "roomtype_facilities",
        "roomtype_address",
        "roomtype_suburb",
        "roomtype_city",
        "roomtype_state",
        "roomtype_country",
        "roomtype_photos",
        "roomtype_hotel_name",
        "roomtype_rating_score",
        "roomtype_review_count"
      ],
      "default_fields": [
        "roomtype_code (auto-generated code)",
        "roomtype_num_rooms (default 1)",
        "roomtype_num_bedrooms (default 1)",
        "roomtype_min_stay (calculated: 3)",
        "roomtype_extra_adult_cost (default 0)",
        "roomtype_extra_child_cost (default 0)",
        "roomtype_category (default Standard)",
        "roomtype_rack_rate (rate unavailable / null)"
      ]
    }
  }
]
```

---

## 🛠️ Technology Stack

| Area | Technology |
| --- | --- |
| Frontend Dashboard | Alpine.js, Tailwind CSS |
| Dev Server & Middleware | Vite |
| Page Automation | Playwright Chromium |
| DOM Parsing | Cheerio |
| Testing | Vitest |
| Language | TypeScript |

---

## 📦 Installation & Setup

1. **Clone repository and enter directory**:
   ```bash
   git clone <repository-url>
   cd extract_data_bookingcom
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install Playwright Chromium**:
   ```bash
   npx playwright install chromium
   ```

---

## 💻 Running the Dashboard Locally

Start the Vite development server:

```bash
npm run dev
```

Open your browser at `http://localhost:3001/exract_data_bookingcom/`.

---

## 🧪 Testing & Verification

Run unit tests and live Playwright Chromium test suite:

```bash
npm test
```

Run TypeScript type verification:

```bash
npx tsc --noEmit
```

Build production static assets:

```bash
npm run build
```
