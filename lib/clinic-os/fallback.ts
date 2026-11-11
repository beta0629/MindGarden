import type { HomepageContent } from './types';

/**
 * Products are never hardcoded. When Clinic-OS is unset/fails/empty,
 * UI shows the empty state + phone / Naver Place booking.
 */
export const FALLBACK_CONSULTATION_PRODUCTS: never[] = [];

export const FALLBACK_HOMEPAGE_CONTENT: HomepageContent = {
  banners: [
    {
      title: '공지 자리',
      imageDesktopUrl: '/images/banner-flowers-c64-3x2.jpg',
      imageMobileUrl: '/images/banner-flowers-c64-3x2.jpg',
      linkUrl: 'https://pcmap.place.naver.com/place/2007327238/home',
      altText: '센터 로비 꽃 디테일',
      startsAt: null,
      endsAt: null,
      sortOrder: 1,
    },
  ],
  reviews: [],
};

export const CONFIRM_NEEDED_PRICE_NOTE = '[확인 필요]';
