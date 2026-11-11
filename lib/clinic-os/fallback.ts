import type { ConsultationProduct, HomepageContent } from './types';

/** Fixed in-repo fallback when Clinic-OS API is unset or fails. */
export const FALLBACK_CONSULTATION_PRODUCTS: ConsultationProduct[] = [
  {
    skuCode: 'first-mind-walk',
    name: '첫 마음산책 (검사 1종 + 상담 30분)',
    price: 60000,
    eventPrice: 60000,
    eventStartDate: '2026-11-01',
    eventEndDate: '2026-12-31',
    sessionCount: 1,
    sessionMinutes: 30,
    displayOrder: 1,
    updatedAt: '2026-11-11T00:00:00+09:00',
  },
  {
    skuCode: 'first-session-60',
    name: '첫 상담',
    price: 0,
    eventPrice: null,
    eventStartDate: null,
    eventEndDate: null,
    sessionCount: 1,
    sessionMinutes: 60,
    displayOrder: 2,
    updatedAt: '2026-11-11T00:00:00+09:00',
  },
  {
    skuCode: 'regular-session-50',
    name: '보통 회기',
    price: 0,
    eventPrice: null,
    eventStartDate: null,
    eventEndDate: null,
    sessionCount: 1,
    sessionMinutes: 50,
    displayOrder: 3,
    updatedAt: '2026-11-11T00:00:00+09:00',
  },
];

export const FALLBACK_HOMEPAGE_CONTENT: HomepageContent = {
  banners: [
    {
      title: '첫 마음산책 (검사 1종 + 상담 30분) 60,000원',
      imageDesktopUrl: '/images/banner-flowers-c64-3x2.jpg',
      imageMobileUrl: '/images/banner-flowers-c64-3x2.jpg',
      linkUrl: 'https://pcmap.place.naver.com/place/2007327238/home',
      altText: '센터 로비 꽃 디테일',
      startsAt: '2026-11-01T00:00:00+09:00',
      endsAt: '2026-12-31T23:59:59+09:00',
      sortOrder: 1,
    },
  ],
  reviews: [],
};

export const CONFIRM_NEEDED_PRICE_NOTE = '[확인 필요]';
