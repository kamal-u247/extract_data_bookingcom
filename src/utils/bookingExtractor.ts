import { chromium } from 'playwright-chromium';
import * as cheerio from 'cheerio';

export interface RoomTypeData {
  id?: string;
  name: string;
  description?: string;
  maxOccupancy?: string;
  bedConfiguration?: string;
  price?: number;
  photos?: string[];
}

export interface PhotoData {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface ExtractedHotelData {
  url: string;
  hotelName: string;
  address: {
    streetAddress: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
  };
  description: string;
  rating: {
    score: number | null;
    reviewCount: number | null;
    ratingText?: string;
  };
  roomTypes: RoomTypeData[];
  photos: PhotoData[];
  facilities: Record<string, string[]>;
}

export interface PMSRoomTypeRecord {
  roomtype_hotel_name?: string;
  roomtype_rating_score?: number | null;
  roomtype_review_count?: number | null;
  roomtype_name: string;
  roomtype_code: string;
  roomtype_num_rooms: number;
  roomtype_num_bedrooms: number;
  roomtype_normal_sleeps: number;
  roomtype_max_sleeps: number;
  roomtype_description: string;
  roomtype_rack_rate: number;
  roomtype_min_rate: number;
  roomtype_max_rate: number;
  roomtype_min_stay: number;
  roomtype_extra_adult_cost: number;
  roomtype_extra_child_cost: number;
  roomtype_breakfast: 'y' | 'n';
  roomtype_inclusion: string;
  roomtype_facilities: string;
  roomtype_address: string;
  roomtype_suburb: string;
  roomtype_postcode: string;
  roomtype_city: string;
  roomtype_state: string;
  roomtype_country: string;
  roomtype_max_adult: number;
  roomtype_max_child: number;
  roomtype_category: string;
  roomtype_photos: string[];
  _facilities_categorized?: Record<string, string[]>;
  _field_sources?: {
    dynamic_fields: string[];
    default_fields: string[];
  };
}

/**
 * Transforms ExtractedHotelData into an array of PMSRoomTypeRecord matching pms_roomtype table columns.
 */
export function transformToPMSRoomTypes(hotelData: ExtractedHotelData): PMSRoomTypeRecord[] {
  const rooms = hotelData.roomTypes.length > 0
    ? hotelData.roomTypes
    : [{ name: 'General Property Room' }];

  // Flatten facilities list
  const facilitiesArray: string[] = [];
  Object.values(hotelData.facilities).forEach((items) => {
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (!facilitiesArray.includes(item)) facilitiesArray.push(item);
      });
    }
  });
  const facilitiesStr = facilitiesArray.join(', ');

  const hasBreakfast = facilitiesStr.toLowerCase().includes('breakfast') ? 'y' : 'n';
  const hotelPhotoUrls = hotelData.photos.map((p) => p.url);

  return rooms.map((room) => {
    // Generate 3-letter code from room name
    const words = room.name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    let code = words.map((w) => w[0]).join('').toUpperCase().slice(0, 5);
    if (code.length < 2) {
      code = (room.name.slice(0, 3)).toUpperCase();
    }

    // Parse max occupancy number from string
    let maxSleeps = 2;
    if (room.maxOccupancy) {
      const match = room.maxOccupancy.match(/\d+/);
      if (match) {
        maxSleeps = parseInt(match[0], 10);
      }
    }

    const rackRate = room.price ? room.price : 200;
    const roomPhotos = (room.photos && room.photos.length > 0)
      ? room.photos
      : hotelPhotoUrls;

    const dynamicFields = [
      'roomtype_name',
      'roomtype_description',
      'roomtype_normal_sleeps',
      'roomtype_max_sleeps',
      'roomtype_max_adult',
      'roomtype_breakfast',
      'roomtype_facilities',
      'roomtype_address',
      'roomtype_suburb',
      'roomtype_city',
      'roomtype_state',
      'roomtype_country',
      'roomtype_photos',
      'roomtype_hotel_name',
      'roomtype_rating_score',
      'roomtype_review_count'
    ];
    if (room.price) dynamicFields.push('roomtype_rack_rate');

    const defaultFields = [
      'roomtype_code (auto-generated code)',
      'roomtype_num_rooms (default 1)',
      'roomtype_num_bedrooms (default 1)',
      'roomtype_min_stay (default 1)',
      'roomtype_extra_adult_cost (default 0)',
      'roomtype_extra_child_cost (default 0)',
      'roomtype_category (default Standard)'
    ];
    if (!room.price) defaultFields.push('roomtype_rack_rate (default 200)');

    return {
      roomtype_hotel_name: hotelData.hotelName,
      roomtype_rating_score: hotelData.rating.score,
      roomtype_review_count: hotelData.rating.reviewCount,
      roomtype_name: room.name,
      roomtype_code: code,
      roomtype_num_rooms: 1,
      roomtype_num_bedrooms: 1,
      roomtype_normal_sleeps: maxSleeps,
      roomtype_max_sleeps: maxSleeps,
      roomtype_description: room.description || hotelData.description || '',
      roomtype_rack_rate: rackRate,
      roomtype_min_rate: -1,
      roomtype_max_rate: -1,
      roomtype_min_stay: 1,
      roomtype_extra_adult_cost: 0,
      roomtype_extra_child_cost: 0,
      roomtype_breakfast: hasBreakfast,
      roomtype_inclusion: room.bedConfiguration ? `Bedding: ${room.bedConfiguration}` : '',
      roomtype_facilities: facilitiesStr,
      roomtype_address: hotelData.address.streetAddress || '',
      roomtype_suburb: hotelData.address.locality || '',
      roomtype_postcode: hotelData.address.postalCode || '',
      roomtype_city: hotelData.address.locality || '',
      roomtype_state: hotelData.address.region || '',
      roomtype_country: hotelData.address.country || '',
      roomtype_max_adult: maxSleeps,
      roomtype_max_child: 0,
      roomtype_category: 'Standard',
      roomtype_photos: roomPhotos,
      _facilities_categorized: hotelData.facilities,
      _field_sources: {
        dynamic_fields: dynamicFields,
        default_fields: defaultFields,
      },
    };
  });
}

/**
 * Pure TypeScript function that fetches Booking.com URL and extracts array of PMS roomtype records.
 */
export async function extractPMSRoomTypesFromUrl(targetUrl: string): Promise<PMSRoomTypeRecord[]> {
  const hotelData = await extractBookingDataFromUrl(targetUrl);
  return transformToPMSRoomTypes(hotelData);
}

/**
 * Pure TypeScript function that fetches a Booking.com page and extracts structured JSON data.
 * @param targetUrl Full Booking.com hotel URL
 */
export async function extractBookingDataFromUrl(targetUrl: string): Promise<ExtractedHotelData> {
  // Validate URL format
  let validUrl: URL;
  try {
    validUrl = new URL(targetUrl.trim());
  } catch (err) {
    throw new Error('Invalid URL provided. Please provide a valid HTTP/HTTPS URL.');
  }

  if (!validUrl.hostname.includes('booking.com')) {
    throw new Error('URL must be a valid Booking.com domain.');
  }

  // Launch headless browser to bypass AWS WAF challenges and execute client JavaScript
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    await page.goto(validUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 35000 });
    // Brief pause to allow hydration
    await page.waitForTimeout(2000);

    const html = await page.content();
    await browser.close();

    return extractBookingDataFromHtml(html, validUrl.toString());
  } catch (error: any) {
    await browser.close();
    throw new Error(`Failed to load page content: ${error?.message || error}`);
  }
}

/**
 * Pure TypeScript function that parses raw HTML content and returns structured JSON hotel data.
 * @param html Raw HTML content of Booking.com hotel page
 * @param sourceUrl Optional source URL for reference
 */
export function extractBookingDataFromHtml(html: string, sourceUrl: string = ''): ExtractedHotelData {
  const $ = cheerio.load(html);

  // Initial Data Schema
  const result: ExtractedHotelData = {
    url: sourceUrl,
    hotelName: '',
    address: {
      streetAddress: '',
      locality: '',
      region: '',
      postalCode: '',
      country: '',
    },
    description: '',
    rating: {
      score: null,
      reviewCount: null,
      ratingText: '',
    },
    roomTypes: [],
    photos: [],
    facilities: {},
  };

  // -------------------------------------------------------------
  // 1. EXTRACT METADATA via JSON-LD (<script type="application/ld+json">)
  // -------------------------------------------------------------
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (!content) return;
      const json = JSON.parse(content);
      const isHotel =
        json['@type'] === 'Hotel' ||
        json['@type'] === 'LodgingBusiness' ||
        json['@type'] === 'Resort' ||
        json['@type'] === 'Motel' ||
        json['@type'] === 'Hostel';

      if (isHotel || json.name) {
        result.hotelName = json.name || result.hotelName;
        result.description = json.description || result.description;

        if (json.address) {
          result.address = {
            streetAddress: json.address.streetAddress || json.address.addressLocality || '',
            locality: json.address.addressLocality || '',
            region: json.address.addressRegion || '',
            postalCode: json.address.postalCode || '',
            country: json.address.addressCountry || '',
          };
        }

        if (json.aggregateRating) {
          result.rating.score = parseFloat(json.aggregateRating.ratingValue) || null;
          result.rating.reviewCount = parseInt(json.aggregateRating.reviewCount, 10) || null;
        }

        if (json.image && typeof json.image === 'string') {
          result.photos.push({
            url: json.image,
            caption: json.name || 'Main Property Photo',
          });
        }
      }
    } catch (e) {
      // Ignore JSON parse errors for non-matching scripts
    }
  });

  // Fallback for Hotel Name if JSON-LD missing
  if (!result.hotelName) {
    const titleText = $('#hp_hotel_name').text() || $('h2.hp__hotel-name').text() || $('title').text();
    result.hotelName = titleText.replace(/[\n\r]/g, '').trim();
  }

  // Fallback for Description
  if (!result.description) {
    const descText = $('#property_description_content').text() || $('.hp_desc_important_facilities').text() || $('meta[name="description"]').attr('content');
    if (descText) {
      result.description = descText.replace(/\s+/g, ' ').trim();
    }
  }

  // Fallback for Rating
  if (result.rating.score === null) {
    const scoreElem = $('.bui-review-score__badge').first().text() || $('div[data-testid="review-score-component"] div').first().text();
    if (scoreElem) {
      const match = scoreElem.match(/(\d+[\.\,]\d+|\d+)/);
      if (match) {
        result.rating.score = parseFloat(match[1].replace(',', '.'));
      }
    }
  }

  // -------------------------------------------------------------
  // 2. EXTRACT PHOTOS (Embedded JS Objects + DOM Fallbacks)
  // -------------------------------------------------------------
  const photoSet = new Set<string>();

  $('script').each((_, el) => {
    const scriptText = $(el).html() || '';
    if (scriptText.includes('hotelPhotos') || scriptText.includes('large_url') || scriptText.includes('highres_url')) {
      const photoMatchRegex = /\{\s*id:\s*'([^']+)'[\s\S]*?large_url:\s*'([^']+)'[\s\S]*?(?:alt:\s*"(.*?)"|highres_url:\s*'([^']+)')?/g;
      let match: RegExpExecArray | null;
      while ((match = photoMatchRegex.exec(scriptText)) !== null) {
        const id = match[1];
        const largeUrl = match[2];
        const alt = match[3] || 'Hotel Photo';
        const highresUrl = match[4] || largeUrl;

        const finalUrl = highresUrl || largeUrl;
        if (finalUrl && !photoSet.has(finalUrl)) {
          photoSet.add(finalUrl);
          result.photos.push({
            id,
            url: finalUrl,
            caption: alt,
          });
        }
      }

      // Secondary match for URL regex pattern in JS objects
      const genericUrlRegex = /(https:\/\/[a-z0-9\.\-]*bstatic\.com\/xdata\/images\/hotel\/(?:max1024x768|max1280x900)\/[a-zA-Z0-9_\-]*\.(?:jpg|webp|png)\?[^'"]*)/g;
      let urlMatch: RegExpExecArray | null;
      while ((urlMatch = genericUrlRegex.exec(scriptText)) !== null) {
        const imgUrl = urlMatch[1];
        if (imgUrl && !photoSet.has(imgUrl)) {
          photoSet.add(imgUrl);
          result.photos.push({
            url: imgUrl,
            caption: result.hotelName || 'Property Photo',
          });
        }
      }
    }
  });

  // DOM Fallback for Photos
  if (result.photos.length === 0) {
    $('.hp-gallery-slides div a, .gallery-side-reviews-wrapper img, img.hp_gallery_main_img, a.bh-photo-grid-item, img[src*="bstatic.com"]').each((_, el) => {
      const src = $(el).attr('href') || $(el).attr('src') || $(el).attr('data-highres');
      const alt = $(el).find('img').attr('alt') || $(el).attr('alt') || 'Hotel Photo';
      if (src && src.includes('bstatic.com') && !photoSet.has(src)) {
        photoSet.add(src);
        result.photos.push({
          url: src,
          caption: alt.trim(),
        });
      }
    });
  }

  // -------------------------------------------------------------
  // 3. EXTRACT ROOM TYPES & ROOM-LEVEL PHOTOS
  // -------------------------------------------------------------
  const roomPhotosMap: Record<string, string[]> = {};

  // Extract room-specific photos from Apollo state JSON
  $('script').each((_, el) => {
    const rawText = $(el).html() || '';
    const text = rawText.trim();
    if (text.includes('RoomDetails') && text.includes('RDSRoomPhoto')) {
      try {
        let json: any = null;
        if (text.startsWith('{')) {
          json = JSON.parse(text);
        } else {
          const match = text.match(/(\{[\s\S]*\})/);
          if (match) json = JSON.parse(match[1]);
        }

        if (json && typeof json === 'object') {
          for (const [key, item] of Object.entries(json)) {
            const rItem = item as any;
            if (rItem && rItem.__typename === 'RoomDetails' && rItem.translations?.name) {
              const roomName = rItem.translations.name.trim();
              const photos: string[] = [];

              if (Array.isArray(rItem.roomPhotos)) {
                rItem.roomPhotos.forEach((pRef: any) => {
                  if (pRef && pRef.__ref && json[pRef.__ref]) {
                    const pObj = json[pRef.__ref];
                    if (pObj && pObj.photoUri) {
                      let fullUrl = pObj.photoUri;
                      if (fullUrl.startsWith('/')) {
                        fullUrl = 'https://cf.bstatic.com' + fullUrl;
                      }
                      photos.push(fullUrl);
                    }
                  }
                });
              }

              if (photos.length > 0) {
                roomPhotosMap[roomName] = photos;
              }
            }
          }
        }
      } catch (e) {}
    }
  });

  const roomSet = new Set<string>();

  $('table tbody tr, table tr').each((_, tr) => {
    const tds = $(tr).find('td, th');
    if (tds.length >= 1) {
      const firstCellText = $(tds[0]).text().replace(/\s+/g, ' ').trim();
      const lower = firstCellText.toLowerCase();
      const isCalendarDay = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(lower);

      if (firstCellText && !lower.includes('room type') && !lower.includes('select rooms') && !isCalendarDay) {
        const bedMatch = firstCellText.match(/(.*?)(1\s+double\s+bed|1\s+single\s+bed|2\s+single\s+beds|1\s+queen\s+bed|1\s+king\s+bed|2\s+double\s+beds.*)/i);

        let roomName = firstCellText;
        let bedConfig = '';

        if (bedMatch) {
          roomName = bedMatch[1].trim();
          bedConfig = bedMatch[2].trim();
        }

        const occupancyText = tds.length > 1 ? $(tds[1]).text().replace(/\s+/g, ' ').trim() : '';

        let parsedPrice: number | undefined = undefined;
        const rowText = $(tr).text();
        const priceMatch = rowText.match(/(?:AUD|AU\$|\$|€|£|US\$)\s*(\d{2,5}(?:\.\d{2})?)/i);
        if (priceMatch) {
          const num = parseFloat(priceMatch[1]);
          if (num > 10 && num < 10000) {
            parsedPrice = num;
          }
        }

        if (roomName && !roomSet.has(roomName)) {
          roomSet.add(roomName);
          const roomPhotos = roomPhotosMap[roomName] || [];
          result.roomTypes.push({
            name: roomName,
            bedConfiguration: bedConfig || undefined,
            maxOccupancy: occupancyText || undefined,
            price: parsedPrice,
            photos: roomPhotos.length > 0 ? roomPhotos : undefined,
          });
        }
      }
    }
  });

  // -------------------------------------------------------------
  // 4. EXTRACT COMPREHENSIVE FACILITIES & AMENITIES
  // -------------------------------------------------------------
  const groupNames: Record<number, string> = {
    1: 'General',
    2: 'Services',
    3: 'Accessibility',
    4: 'Business Facilities',
    5: 'Bathroom',
    6: 'Media & Technology',
    7: 'Food & Drink',
    8: 'Cleaning Services',
    9: 'Safety & Security',
    11: 'Internet',
    12: 'Kitchen',
    13: 'Outdoors',
    14: 'Activities',
    15: 'Room Amenities',
    16: 'Parking',
    17: 'Bedroom',
    18: 'Living Area',
    21: 'Pool and Wellness',
    22: 'Languages Spoken',
  };

  const addFacility = (category: string, item: string) => {
    let cleanCat = category.trim();
    let cleanItem = item.trim();
    if (!cleanCat || !cleanItem) return;
    if (cleanItem.length < 2 || cleanItem.length > 90) return;
    if (['see availability', 'missing some information', 'yes/no'].includes(cleanItem.toLowerCase())) return;

    cleanCat = cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1);
    if (cleanCat.toLowerCase() === 'kitchen facilities') cleanCat = 'Kitchen';
    if (cleanCat.toLowerCase() === 'most popular facilities') cleanCat = 'Most Popular Facilities';

    if (!result.facilities[cleanCat]) result.facilities[cleanCat] = [];
    if (!result.facilities[cleanCat].includes(cleanItem)) {
      result.facilities[cleanCat].push(cleanItem);
    }
  };

  // A. Parse Script JSON (Apollo State, Next Data, JSON-LD, etc.)
  $('script').each((_, el) => {
    const text = $(el).html() || '';

    // A1. JSON-LD Schema
    if ($(el).attr('type') === 'application/ld+json') {
      try {
        const json = JSON.parse(text);
        if (json.amenityFeature && Array.isArray(json.amenityFeature)) {
          json.amenityFeature.forEach((af: any) => {
            const name = typeof af === 'string' ? af : af.name || af.value;
            if (name) addFacility('General Facilities', name);
          });
        }
      } catch (e) {}
    }

    // A2. Apollo / Embedded JSON State
    if (text.includes('BaseFacility') || text.includes('Instance:') || text.includes('HighlightCategory') || text.includes('facilities')) {
      try {
        let json: any = null;
        if (text.startsWith('{')) {
          json = JSON.parse(text);
        } else if (text.includes('window.__apollo_state__')) {
          const m = text.match(/window\.__apollo_state__\s*=\s*(\{[\s\S]*?\});/);
          if (m) json = JSON.parse(m[1]);
        }

        if (json && typeof json === 'object') {
          for (const [key, val] of Object.entries(json)) {
            if (!val || typeof val !== 'object') continue;
            const item = val as any;

            // HighlightCategory
            if (item.__typename === 'HighlightCategory' && item.name) {
              addFacility('Most Popular Facilities', item.name);

              if (Array.isArray(item.facilities2)) {
                item.facilities2.forEach((fRef: any) => {
                  if (fRef && fRef.__ref && json[fRef.__ref]) {
                    const fObj = json[fRef.__ref];
                    if (fObj && fObj.name) {
                      addFacility(item.name, fObj.name);
                    }
                  }
                });
              }
            }

            // Instance
            if (item.__typename === 'Instance' && item.title) {
              const title = item.title;
              let category = 'General';
              for (const [bKey, bVal] of Object.entries(json)) {
                const bItem = bVal as any;
                if (bItem && bItem.__typename === 'BaseFacility' && Array.isArray(bItem.instances)) {
                  if (bItem.instances.some((inst: any) => inst && inst.__ref === key)) {
                    category = groupNames[bItem.groupId] || 'General';
                    break;
                  }
                }
              }
              addFacility(category, title);
            }

            // Facility2
            if (item.__typename === 'Facility2' && item.name) {
              addFacility('Kitchen', item.name);
            }

            // Generic facility object structures
            if ((item.title || item.name) && (Array.isArray(item.facilities) || Array.isArray(item.items))) {
              const catTitle = item.title || item.name;
              const itemList = item.facilities || item.items;
              itemList.forEach((subItem: any) => {
                const subName = typeof subItem === 'string' ? subItem : subItem.name || subItem.title;
                if (subName) addFacility(catTitle, subName);
              });
            }
          }
        }
      } catch (e) {}
    }
  });

  // B. Parse DOM elements (#hp_facilities_box, .facilitiesChecklist, etc.)
  $('#hp_facilities_box, [data-testid="property-section-facilities"], .facilitiesChecklist').each((_, box) => {
    let currentCategory = 'Most Popular Facilities';

    $(box).find('h3, h4, h5, [data-testid*="title"], li, span.f6b6d2a959').each((_, el) => {
      const isHeader = ['H3', 'H4', 'H5'].includes(el.tagName.toUpperCase());
      const text = $(el).text().replace(/\s+/g, ' ').trim();

      if (isHeader && text && text.length < 60) {
        currentCategory = text;
      } else if ((el.tagName.toUpperCase() === 'LI' || el.tagName.toUpperCase() === 'SPAN') && text) {
        addFacility(currentCategory, text);
      }
    });
  });

  // Fallback for Important Facilities DOM
  $('.important_facilities li, .hp_desc_important_facilities div, [data-testid="facility-icon"]').each((_, el) => {
    const text = $(el).parent().text().replace(/\s+/g, ' ').trim() || $(el).text().replace(/\s+/g, ' ').trim();
    if (text) addFacility('Most Popular Facilities', text);
  });

  return result;
}

