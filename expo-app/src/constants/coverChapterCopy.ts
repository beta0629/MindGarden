/**
 * 커버+챕터 v4 공용 문구 (내담자·상담사 공통 organism)
 *
 * @author MindGarden
 * @since 2026-11-06
 */
export const COVER_CHAPTER_COPY = {
  BRAND_NAME: '마인드가든',
  BRAND_BADGE: 'CORE',
  NEXT_SESSION_LABEL: '다음 상담',
  TODAY: '오늘',
  TOMORROW: '내일',
  YESTERDAY: '어제',
  heroEyebrow: (dayLabel: string) => `다음 상담 · ${dayLabel}`,
  sessionNumber: (n: number) => `${n}회차`,
  BANNER_CHIP_NEWS: '소식',
  BANNER_CHIP_CAMPAIGN: '캠페인',
  BANNER_A11Y: (title: string) => `소식 ${title} 알림 센터에서 보기`,
  NOTIF_TITLE: '알림',
  notifCount: (count: number) => `${count}건`,
  NOTIF_VIEW_ALL: '전체 보기',
  NOTIF_EMPTY: '새 알림이 없어요',
  NOTIF_UNREAD_A11Y: '읽지 않음',
  INSTITUTION_LINK_BADGE: '기관연계',
  COMPLETED: '완료',
  minutes: (n: number) => `${n}분`,
  listCount: (count: number) => `${count}건`,
} as const;
