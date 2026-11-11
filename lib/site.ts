export const SITE = {
  name: '마인드가든심리상담센터',
  shortName: '마인드가든',
  phoneDisplay: '032-724-8501',
  phoneTel: '0327248501',
  address: '인천 연수구 해돋이로120번길 23 아크리아2 2층 204호',
  addressLandmark: '해양경찰청 인근',
  hours: '주중 10:00–20:00 · 토요일 10:00–17:00 · 일요일 정기휴무',
  representative: '김선희',
  businessNumber: '855-49-01086',
  mailOrderNumber: '제 2026-3520233-30-2-02729 호',
  bookingUrl: 'https://pcmap.place.naver.com/place/2007327238/home',
  youtubeUrl: 'https://www.youtube.com/@mindgarden_counseling',
  youtubeChannelId: 'UC_d4N-B4eKoCwfryeUB2IfQ',
  blogUrl: 'https://blog.naver.com/trinity_2012',
  blogRssUrl: 'https://rss.blog.naver.com/trinity_2012.xml',
  naverPlaceId: '2007327238',
} as const;

export const BOOKING_CTA_LABEL = '상담 예약하기';
export const BOOKING_CTA_HINT = '네이버 플레이스 예약 화면으로 이동합니다.';

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://m-garden.co.kr'
  );
}

export function isSiteIndexable(): boolean {
  return process.env.NEXT_PUBLIC_SITE_INDEXABLE === 'true';
}
