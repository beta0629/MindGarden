/**
 * Home copy aligned to v3.7-garden stills (home-1440/390-fix10c).
 * Confirmed SITE facts only — no invented credentials, reviews, or stats.
 */
export const homeCopy = {
  hero: {
    title: '마음이 쉬어 가는 정원 같은 상담센터',
    subtitle: '지친 현대의 마음, 도심 속 정원에서 함께 걸어가요.',
    primaryCta: '네이버 플레이스로 예약',
    secondaryCta: '상담 문의하기',
    secondaryHref: '/contact',
  },
  areas: {
    eyebrow: '상담 분야',
    title: '어떤 마음으로 오셨나요',
    lead: '불안, 우울, 관계, 자아 성찰 등 언제든지 문을 두드려 주세요.',
    moreLabel: '상담 분야 보기',
    moreHref: '/counseling',
    /** Counseling index + about — keep slug shape for detail pages. */
    items: [
      {
        slug: 'adults',
        title: '개인 상담',
        line: '일과 관계에서 집중·감정이 흔들릴 때 함께 정리합니다.',
        icon: '/icons/area-adult.svg',
      },
      {
        slug: 'couples-family',
        title: '부부·가족 상담',
        line: '부부와 가족 안의 관계를 함께 들여다봅니다.',
        icon: '/icons/area-family.svg',
      },
      {
        slug: 'children-adolescents',
        title: '아동·청소년',
        line: '주의와 관계가 어긋날 때, 아이와 보호자를 함께 살핍니다.',
        icon: '/icons/area-child.svg',
      },
      {
        slug: 'overlapping-concerns',
        title: '함께 살펴보는 어려움',
        line: '여러 어려움이 겹칠 때, 맥락을 함께 정리합니다.',
        icon: '/icons/area-overlap.svg',
      },
    ] as const,
    /** Homepage still grid (5 topic cards + first-visit CTA card). */
    homeCards: [
      {
        title: '개인 상담',
        line: '일과 관계에서 흔들리는 마음을 함께 살핍니다.',
        href: '/counseling/adults',
        icon: '/icons/area-adult.svg',
      },
      {
        title: '부부 상담',
        line: '반복되는 대화와 갈등의 패턴을 함께 들여다봅니다.',
        href: '/counseling/couples-family',
        icon: '/icons/area-family.svg',
      },
      {
        title: '가족 상담',
        line: '부모·자녀와 가족 역할의 경계를 함께 정리합니다.',
        href: '/counseling/couples-family',
        icon: '/icons/area-family.svg',
      },
      {
        title: '아동·청소년',
        line: '아이와 보호자의 이야기를 함께 듣습니다.',
        href: '/counseling/children-adolescents',
        icon: '/icons/area-child.svg',
      },
      {
        title: '심리 검사',
        line: '검사와 해석 안내가 필요할 때 절차를 안내합니다.',
        href: '/screening',
        icon: '/icons/area-overlap.svg',
      },
    ] as const,
    firstVisit: {
      title: '처음이세요?',
      body: '예약부터 첫 면담까지, 이용 흐름을 짧게 안내합니다.',
      cta: '상담 가이드 보기',
      href: '/guide',
    },
  },
  spaces: {
    eyebrow: '공간',
    title: '조용히 머무는 방',
    lead: '햇살이 머무는 방에서 잠시 숨을 고를 수 있습니다.',
    moreLabel: '공간 더보기',
    moreHref: '/gallery',
    thumbs: [
      {
        caption: '모래놀이',
        src: '/images/gallery-sandplay-c133-3x4.jpg',
      },
      {
        caption: '미술·표현',
        src: '/images/gallery-play-c174-3x4.jpg',
      },
      {
        caption: '놀이실',
        src: '/images/gallery-play-c122-3x4.jpg',
      },
      {
        caption: '상담실',
        src: '/images/gallery-room-c163-3x4.jpg',
      },
    ] as const,
  },
  experts: {
    eyebrow: '전문가',
    title: '곁에서 듣는 사람들',
    lead: '따뜻한 경청과 확인된 안내로 함께합니다.',
    primary: {
      name: '김선희',
      role: '대표원장',
      photo: '/assets/images/counselors/kim-sunhee-director.png',
    },
  },
  stats: {
    /** Hidden until real numbers are confirmed — set true and fill `value` per item. */
    enabled: false,
    items: [
      { label: '실제 상담 횟수', value: '' },
      { label: '누적 상담 예약자', value: '' },
      { label: '함께하는 선생님', value: '' },
    ] as const,
  },
  reviews: {
    eyebrow: '후기',
    title: '쉬어 간 분들의 이야기',
    moreLabel: '후기 더보기',
    moreHref: '/reviews',
    /** Public home uses Clinic-OS `homepage.reviews` only — never ship examples. */
  },
  pricing: {
    eyebrow: '비용',
    title: '처음 오시는 분께 드리는 안내',
    moreLabel: '가격 상세정보 보기',
    moreHref: '/guide#pricing',
    /**
     * Approved display values only — never raw Clinic-OS product names.
     * `skuCodes`: optional live-price mapping by skuCode only (none known yet → static cards).
     */
    cards: [
      {
        key: 'initial',
        title: '초기상담',
        amount: 100_000,
        note: '첫 상담 1시간',
        skuCodes: [] as readonly string[],
      },
      {
        key: 'session',
        title: '단회기',
        amount: 90_000,
        note: '회기당 50분',
        skuCodes: [] as readonly string[],
      },
      {
        key: 'pack10',
        title: '10회기',
        amount: 850_000,
        note: '10회기 패키지',
        skuCodes: [] as readonly string[],
      },
      {
        key: 'event',
        title: '이벤트',
        amount: 60_000,
        note: '2026.11.01 – 12.31',
        skuCodes: [] as readonly string[],
        dateStart: '2026-11-01',
        dateEnd: '2026-12-31',
      },
    ],
  },
  readings: {
    eyebrow: '읽을거리',
    title: '마음을 돌보는 읽을거리',
    moreLabel: '더 많은 이야기 보기',
    videosMoreLabel: '채널에서 더 보기',
    blogMoreLabel: '블로그 전체 보기',
  },
  booking: {
    eyebrow: '예약',
    title: '오늘은 여기서 잠시 쉬어 가세요',
    body: '상담에 집중할 수 있도록 예약을 받아 드립니다.',
    primaryCta: '네이버 플레이스로 예약',
    phoneLabel: '전화 상담',
    visitTitle: '방문 안내',
    offEventLine:
      '예약과 비용 안내는 네이버 플레이스 또는 대표전화로 확인해 주세요.',
    contactLinkLabel: '상담 문의하기',
    contactHref: '/contact',
  },
  faqHome: [
    {
      q: '예약은 어떻게 하나요?',
      a: '네이버 플레이스로 예약을 누르시면 네이버 플레이스 예약 화면으로 이동합니다.',
    },
    {
      q: '상담은 어떻게 진행되나요?',
      a: '첫 상담은 1시간, 보통 회기는 50분입니다. 초기 면담에서 목표와 간격을 함께 정합니다.',
    },
    {
      q: '상담 비용은 얼마인가요?',
      a: '상담 비용은 네이버 플레이스와 이용 안내에서 확인해 주세요. 이벤트 가격은 안내된 기간에만 적용됩니다.',
    },
  ] as const,
  fallbackVideos: [
    {
      id: 'WXUl5mcoxOo',
      title: '마음 한 페이지 42화',
      thumb: '/images/yt-WXUl5mcoxOo-16x9.jpg',
    },
    {
      id: 'ivD7YVMyigU',
      title: '마인드가든 EP.45',
      thumb: '/images/yt-ivD7YVMyigU-16x9.jpg',
    },
    {
      id: '2bIDGLQ_E5s',
      title: '마인드가든 41화',
      thumb: '/images/yt-2bIDGLQ_E5s-16x9.jpg',
    },
    {
      id: 'Ymun09Sg6M8',
      title: '마인드가든 영상',
      thumb: '/images/card-yt-Ymun09Sg6M8-9x16.jpg',
    },
  ] as const,
  fallbackBlog: [
    {
      title: '마인드가든 칼럼',
      date: '2026-11-01',
      url: 'https://blog.naver.com/trinity_2012',
      thumb: '/images/blog-1-4x3.jpg',
    },
    {
      title: '마인드가든 칼럼',
      date: '2026-10-20',
      url: 'https://blog.naver.com/trinity_2012',
      thumb: '/images/blog-2-4x3.jpg',
    },
    {
      title: '마인드가든 칼럼',
      date: '2026-10-10',
      url: 'https://blog.naver.com/trinity_2012',
      thumb: '/images/blog-3-4x3.jpg',
    },
  ] as const,
} as const;
