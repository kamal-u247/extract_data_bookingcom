import './style.css';
import Alpine from 'alpinejs';
import { ExtractedHotelData, PMSRoomTypeRecord } from './utils/bookingExtractor';

interface ExtractorAppStore {
  url: string;
  loading: boolean;
  error: string | null;
  activeTab: 'overview' | 'roomTypes' | 'photos' | 'facilities' | 'json';
  extractedData: ExtractedHotelData | null;
  pmsRoomTypes: PMSRoomTypeRecord[];
  rawJson: string;
  toastMessage: string | null;
  selectedPhotoUrl: string | null;
  
  extractData: () => Promise<void>;
  downloadJson: () => void;
  copyJson: () => void;
  loadPresetUrl: () => void;
  showToast: (msg: string) => void;
  openLightbox: (url: string) => void;
  closeLightbox: () => void;
  getTotalFacilityCount: () => number;
}

// Register Alpine Component
Alpine.data('extractorApp', (): ExtractorAppStore => ({
  url: '',
  loading: false,
  error: null,
  activeTab: 'overview',
  extractedData: null,
  pmsRoomTypes: [],
  rawJson: '',
  toastMessage: null,
  selectedPhotoUrl: null,

  async extractData() {
    if (!this.url.trim()) {
      this.error = 'Please enter a valid Booking.com URL.';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: this.url.trim() }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Extraction failed.');
      }

      const records: PMSRoomTypeRecord[] = Array.isArray(resData) ? resData : [];
      this.pmsRoomTypes = records;
      this.rawJson = JSON.stringify(records, null, 2);

      const first = records[0];
      if (first) {
        this.extractedData = {
          url: this.url,
          hotelName: first.roomtype_hotel_name || (first.roomtype_city ? `Hotel in ${first.roomtype_city}` : 'Booking Hotel'),
          address: {
            streetAddress: first.roomtype_address || '',
            locality: first.roomtype_suburb || '',
            region: first.roomtype_state || '',
            postalCode: first.roomtype_postcode || '',
            country: first.roomtype_country || '',
          },
          description: first.roomtype_description || '',
          rating: {
            score: first.roomtype_rating_score ?? null,
            reviewCount: first.roomtype_review_count ?? null,
          },
          roomTypes: records.map((r) => ({
            name: r.roomtype_name,
            description: r.roomtype_description,
            maxOccupancy: `${r.roomtype_max_sleeps} guests`,
            bedConfiguration: r.roomtype_inclusion,
            price: r.roomtype_rack_rate,
            photos: r.roomtype_photos,
          })),
          photos: (first.roomtype_photos || []).map((url) => ({ url, caption: first.roomtype_name })),
          facilities: first._facilities_categorized || {},
        };
      } else {
        this.extractedData = null;
      }

      this.showToast('Data extracted successfully!');
    } catch (err: any) {
      console.error('Extraction Error:', err);
      this.error = err.message || 'Failed to extract data. Please check the URL and try again.';
    } finally {
      this.loading = false;
    }
  },

  getTotalFacilityCount(): number {
    if (!this.extractedData || !this.extractedData.facilities) return 0;
    let count = 0;
    Object.values(this.extractedData.facilities).forEach((items) => {
      if (Array.isArray(items)) count += items.length;
    });
    return count;
  },

  downloadJson() {
    if (!this.rawJson || !this.extractedData) return;

    const fileName = 'pms_hotel_extracted_data.json';

    const blob = new Blob([this.rawJson], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);

    this.showToast(`Downloaded ${fileName}`);
  },

  copyJson() {
    if (!this.rawJson) return;
    navigator.clipboard.writeText(this.rawJson);
    this.showToast('JSON copied to clipboard!');
  },

  loadPresetUrl() {
    this.url = 'https://www.booking.com/hotel/au/renmark-motor-inn.en-gb.html';
    this.extractData();
  },

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  },

  openLightbox(url: string) {
    this.selectedPhotoUrl = url;
  },

  closeLightbox() {
    this.selectedPhotoUrl = null;
  },
}));

Alpine.start();
