import { describe, it, expect } from 'vitest';
import { extractPMSRoomTypesFromUrl, extractBookingDataFromUrl, SearchContext } from '../src/utils/bookingExtractor';

describe('Live Playwright Chromium Price Extraction Test', () => {
  it('should fetch live Booking.com page with Playwright Chromium and extract room rates', async () => {
    const targetUrl = 'https://www.booking.com/hotel/au/renmark-motor-inn.en-gb.html';
    const searchContext: SearchContext = {
      checkin: '2026-10-10',
      checkout: '2026-10-13',
      adults: 2,
      currency: 'AUD',
    };

    console.log(`[Chromium Test] Fetching live Booking.com page for Renmark Motor Inn...`);
    const records = await extractPMSRoomTypesFromUrl(targetUrl, searchContext);

    console.log(`[Chromium Test] Extracted ${records.length} room type records:`);
    records.forEach((r, idx) => {
      console.log(`  [${idx + 1}] Room: "${r.roomtype_name}"`);
      console.log(`      Rack Rate: ${r.roomtype_rack_rate !== null ? `${r.roomtype_currency || 'AUD'} $${r.roomtype_rack_rate}` : 'Rate Unavailable (null)'}`);
      console.log(`      Min Stay: ${r.roomtype_min_stay} night(s)`);
      console.log(`      Address: ${r.roomtype_address}, ${r.roomtype_city}, ${r.roomtype_country}`);
    });

    expect(records.length).toBeGreaterThan(0);
    const first = records[0];
    expect(first.roomtype_hotel_name).toBeTruthy();
    expect(first.roomtype_min_stay).toBe(3);

    // Verify that every returned record has either a numeric price or explicit null (no undefined, NaN, or string prices)
    records.forEach((r) => {
      if (r.roomtype_rack_rate !== null) {
        expect(typeof r.roomtype_rack_rate).toBe('number');
        expect(Number.isNaN(r.roomtype_rack_rate)).toBe(false);
        expect(r.roomtype_rack_rate).toBeGreaterThan(0);
      } else {
        expect(r.roomtype_rack_rate).toBeNull();
      }
    });
  }, 45000); // 45s timeout for live Playwright navigation
});

