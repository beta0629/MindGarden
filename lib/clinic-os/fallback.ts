import type { HomepageContent } from './types';

/**
 * Products are never hardcoded. When Clinic-OS is unset/fails/empty,
 * UI shows the empty state + phone / Naver Place booking.
 */
export const FALLBACK_CONSULTATION_PRODUCTS: never[] = [];

export const FALLBACK_HOMEPAGE_CONTENT: HomepageContent = {
  // No placeholder notice — hide the bar when Clinic-OS has no real banner.
  banners: [],
  reviews: [],
};

export const CONFIRM_NEEDED_PRICE_NOTE = '[확인 필요]';
