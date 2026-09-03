import { describe, it, expect } from 'vitest';
import {
  buildSearchUrl,
  calculateNumberOfNights,
  parsePriceAndCurrency,
  extractBookingDataFromHtml,
  transformToPMSRoomTypes,
  SearchContext,
} from '../src/utils/bookingExtractor';

describe('Price Extractor - URL & Context Building', () => {
  it('should cleanly build search URL with parameters without duplicating', () => {
    const baseUrl = 'https://www.booking.com/hotel/au/renmark-motor-inn.html?checkin=2026-08-01';
    const context: SearchContext = {
      checkin: '2026-10-01',
      checkout: '2026-10-04',
      adults: 2,
      children: 1,
      currency: 'AUD',
    };

    const finalUrl = buildSearchUrl(baseUrl, context);
    expect(finalUrl).toContain('checkin=2026-10-01');
    expect(finalUrl).toContain('checkout=2026-10-04');
    expect(finalUrl).toContain('group_adults=2');
    expect(finalUrl).toContain('group_children=1');
    expect(finalUrl).toContain('selected_currency=AUD');
    const occurrences = (finalUrl.match(/checkin=/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should calculate stay length correctly in days', () => {
    const context: SearchContext = {
      checkin: '2026-10-01',
      checkout: '2026-10-04',
    };
    expect(calculateNumberOfNights(context)).toBe(3);
  });

  it('should default to 1 night when dates are missing or invalid', () => {
    expect(calculateNumberOfNights()).toBe(1);
    expect(calculateNumberOfNights({ checkin: 'invalid', checkout: 'invalid' })).toBe(1);
  });
});

describe('Price Extractor - Currency & Price Parsing', () => {
  it('should parse Australian Dollar formats', () => {
    expect(parsePriceAndCurrency('AU$ 450')).toEqual({ amount: 450, currency: 'AUD' });
    expect(parsePriceAndCurrency('AU$ 1,250.50')).toEqual({ amount: 1250.5, currency: 'AUD' });
  });

  it('should parse US Dollar formats', () => {
    expect(parsePriceAndCurrency('$ 300')).toEqual({ amount: 300, currency: 'USD' });
    expect(parsePriceAndCurrency('US$ 1,500.00')).toEqual({ amount: 1500, currency: 'USD' });
  });

  it('should parse Euro formats', () => {
    expect(parsePriceAndCurrency('150 €')).toEqual({ amount: 150, currency: 'EUR' });
    expect(parsePriceAndCurrency('1.250,50 €')).toEqual({ amount: 1250.5, currency: 'EUR' });
  });

  it('should parse British Pound formats', () => {
    expect(parsePriceAndCurrency('£120')).toEqual({ amount: 120, currency: 'GBP' });
  });

  it('should return null amount for non-numeric price text', () => {
    expect(parsePriceAndCurrency('Rates unavailable')).toEqual({ amount: null, currency: null });
    expect(parsePriceAndCurrency('Sold Out')).toEqual({ amount: null, currency: null });
  });
});

describe('Price Extractor - HTML Parsing & Rowspan Support', () => {
  it('should parse multi-night stay rates and select lowest base rate across rowspan sub-rows', () => {
    const html = `
      <h2 class="hp__hotel-name">Renmark Motor Inn</h2>
      <table class="hprt-table">
        <tbody>
          <tr>
            <td rowspan="2" class="hprt-table-cell-roomtype">
              <a class="hprt-roomtype-link" href="#">Deluxe Double Room</a>
            </td>
            <td class="hprt-table-cell-price">
              <span class="bui-price-display__value">AU$ 450</span>
            </td>
          </tr>
          <tr>
            <td class="hprt-table-cell-price">
              <span class="bui-price-display__value">AU$ 490</span>
            </td>
          </tr>
          <tr>
            <td class="hprt-table-cell-roomtype">
              <a class="hprt-roomtype-link" href="#">Family Suite</a>
            </td>
            <td class="hprt-table-cell-price">
              <span class="bui-price-display__value">AU$ 750</span>
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const searchContext: SearchContext = {
      checkin: '2026-10-01',
      checkout: '2026-10-04', // 3 nights stay
      currency: 'AUD',
    };

    const hotelData = extractBookingDataFromHtml(html, 'https://www.booking.com/hotel/au/renmark-motor-inn.html', searchContext);

    expect(hotelData.hotelName).toBe('Renmark Motor Inn');
    expect(hotelData.roomTypes).toHaveLength(2);

    const deluxe = hotelData.roomTypes.find((r) => r.name === 'Deluxe Double Room');
    expect(deluxe?.totalPrice).toBe(450);
    expect(deluxe?.price).toBe(150); // 450 / 3 nights
    expect(deluxe?.currency).toBe('AUD');

    const pmsRecords = transformToPMSRoomTypes(hotelData, searchContext);
    const pmsDeluxe = pmsRecords.find((r) => r.roomtype_name === 'Deluxe Double Room');
    expect(pmsDeluxe?.roomtype_rack_rate).toBe(150);
    expect(pmsDeluxe?.roomtype_min_stay).toBe(3);
    expect(pmsDeluxe?.roomtype_currency).toBe('AUD');
  });

  it('should explicitly return null for room rates when rates are unavailable', () => {
    const html = `
      <h2 class="hp__hotel-name">Out of Stock Lodge</h2>
      <table class="hprt-table">
        <tbody>
          <tr>
            <td class="hprt-table-cell-roomtype"><a class="hprt-roomtype-link" href="#">Standard Queen Room</a></td>
            <td class="hprt-table-cell-price"><span>Sold Out</span></td>
          </tr>
        </tbody>
      </table>
    `;

    const hotelData = extractBookingDataFromHtml(html, 'https://www.booking.com/hotel/au/unavailable.html');

    expect(hotelData.roomTypes).toHaveLength(1);
    expect(hotelData.roomTypes[0].price).toBeNull();

    const pmsRecords = transformToPMSRoomTypes(hotelData);
    expect(pmsRecords[0].roomtype_rack_rate).toBeNull();
    expect(pmsRecords[0]._field_sources?.default_fields).toContain('roomtype_rack_rate (rate unavailable / null)');
  });
});
