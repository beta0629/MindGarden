export const homeCopy = {
  hero: {
    title: '나를 소중히 돌보고 가꾸는 시간, 당신의 마음이 정원이 되는 곳',
    subtitle:
      '아이부터 어른까지, 마음과 관계를 함께 살펴보는 심리상담센터',
    subtitleConfirmNeeded: true,
  },
  areas: {
    title: '상담 분야',
    lead: '아이부터 어른까지, 마음과 관계를 함께 살펴봅니다.',
    items: [
      {
        slug: 'children-adolescents',
        title: '아이·청소년과 보호자',
        line: '주의와 관계가 어긋날 때, 아이와 보호자를 함께 살핍니다.',
        icon: '/icons/area-child.svg',
      },
      {
        slug: 'adults',
        title: '성인 상담',
        line: '일과 관계에서 집중·감정이 흔들릴 때 함께 정리합니다.',
        icon: '/icons/area-adult.svg',
      },
      {
        slug: 'overlapping-concerns',
        title: '함께 살펴보는 어려움',
        line: '여러 어려움이 겹칠 때, 맥락을 함께 정리합니다.',
        icon: '/icons/area-overlap.svg',
      },
      {
        slug: 'couples-family',
        title: '부부·가족 상담',
        line: '부부와 가족 안의 관계를 함께 들여다봅니다.',
        icon: '/icons/area-family.svg',
      },
    ] as const,
    titleConfirmNeeded: true,
  },
  process: {
    title: '상담 절차',
    steps: [
      {
        title: '예약하기',
        line: '네이버 플레이스에서',
        icon: '/icons/step-book.svg',
      },
      {
        title: '방문하기',
        line: '해양경찰청 인근',
        icon: '/icons/step-visit.svg',
      },
      {
        title: '초기 면담',
        line: '첫 상담 1시간',
        icon: '/icons/step-first.svg',
      },
      {
        title: '다음 일정',
        line: '보통 회기 50분',
        icon: '/icons/step-next.svg',
      },
    ] as const,
    guideLinkLabel: '이용 안내',
    confirmNeeded: true,
  },
  counselor: {
    title: '상담사 소개',
    name: '김선희',
    role: '마인드가든심리상담센터 대표원장',
    lines: [
      '주의·정서·관계, 아동·청소년과 부부·가족 상담을 안내합니다.',
      '상담학(석사) / 가족상담(박사일부수료)',
    ],
    confirmNeeded: true,
  },
  spaces: {
    title: '센터 공간',
    lead: '마인드가든의 공간을 소개합니다.',
    items: [
      {
        caption: '모래놀이실',
        src: '/images/space-1-sandplay-c73-16x9.jpg',
        wide: true,
        confirmNeeded: false,
      },
      {
        caption: '미술 공간',
        src: '/images/space-2-art-c109-4x3.jpg',
        wide: false,
        confirmNeeded: true,
      },
      {
        caption: '놀이 공간',
        src: '/images/space-3-play-c122-4x3.jpg',
        wide: false,
        confirmNeeded: false,
      },
      {
        caption: '언어 상담 공간',
        src: '/images/space-4-language-c112-4x3.jpg',
        wide: false,
        confirmNeeded: true,
      },
      {
        caption: '가족상담실',
        src: '/images/space-5-family-c163-4x3.jpg',
        wide: false,
        confirmNeeded: true,
      },
    ] as const,
  },
  news: {
    title: '소식·콘텐츠',
    lead: '최근 영상과 블로그 글을 모았습니다.',
  },
  booking: {
    title: '상담 예약·문의',
    body: '예약은 네이버 플레이스에서 받아 드립니다.',
    support: '문의는 아래 폼이나 032-724-8501로 남겨 주세요.',
    offEventLine:
      '첫 상담은 1시간입니다. 예약과 비용 안내는 네이버 플레이스를 확인해 주세요.',
    healthNotice:
      '문의 내용에 진단명, 복용 약물, 병력 등 건강 정보는 적지 말아 주세요.',
  },
  faqHome: [
    {
      q: '예약은 어떻게 하나요?',
      a: '상담 예약하기를 누르시면 네이버 플레이스 예약 화면으로 이동합니다.',
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
