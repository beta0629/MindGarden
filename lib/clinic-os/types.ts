export type ConsultationProduct = {
  skuCode: string;
  name: string;
  price: number;
  eventPrice: number | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  sessionCount: number;
  sessionMinutes: number | null;
  displayOrder: number;
  updatedAt: string;
};

export type HomepageBanner = {
  title: string;
  imageDesktopUrl: string | null;
  imageMobileUrl: string | null;
  linkUrl: string | null;
  altText: string;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
};

export type HomepageReview = {
  body: string;
  publishedAt: string;
  displayName: string | null;
};

export type HomepageContent = {
  banners: HomepageBanner[];
  reviews: HomepageReview[];
};

export type InquiryType =
  | '개인상담'
  | '부부'
  | '가족'
  | '아동'
  | '검사'
  | '기타';

export const INQUIRY_TYPES: readonly InquiryType[] = [
  '개인상담',
  '부부',
  '가족',
  '아동',
  '검사',
  '기타',
] as const;

export type InquiryPayload = {
  name: string;
  phone: string;
  inquiryType: InquiryType;
  content: string;
  privacyConsent: boolean;
  turnstileToken: string;
  /** Honeypot — must stay empty */
  website?: string;
};
