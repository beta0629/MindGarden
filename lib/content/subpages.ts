import { homeCopy } from './home';

export const counselingDetails = {
  'children-adolescents': {
    title: '아이·청소년과 보호자',
    body: '학교와 가정에서 주의가 오래 가지 않거나, 행동이 앞지르거나, 또래·가족과의 대화가 자주 어긋날 때, 아이의 발달 단계를 함께 살피며 보호자와 목표를 정리합니다. 이 안내는 교육 목적이며, 개인에 대한 의학적 판단을 의미하지 않습니다.',
    forWhom:
      '수업·숙제·하루 루틴을 이어 가기 어렵거나, 또래 관계나 가족 대화에서 마찰이 잦은 아이·청소년과 보호자.',
    icon: '/icons/area-child.svg',
    image: '/images/counseling-detail-play-c127-4x3.jpg',
  },
  adults: {
    title: '성인 상담',
    body: '일, 가사, 관계에서 일정과 집중, 감정 흐름이 반복해 흔들릴 때, 지금 삶의 맥락에서 어려움을 이해하고 일상에서 쓸 수 있는 방법을 함께 찾아 갑니다. 겉으로 기능이 높아 보이거나 과잉행동이 두드러지지 않을 때도, 먼저 이야기를 듣고 필요한 안내를 합니다.',
    forWhom:
      '업무·가사·관계에서 일정, 집중, 감정 조절이 반복해 어렵고, 그로 인한 스트레스가 쌓인 성인.',
    icon: '/icons/area-adult.svg',
    image: '/images/detail-adults-monstera-c167-4x3.jpg',
  },
  'overlapping-concerns': {
    title: '함께 살펴보는 어려움',
    body: '주의가 흩어지는 일 외에, 우울·불안·수면, 충동이나 관계의 어려움이 겹쳐 보일 수 있습니다. 한 가지 이유만으로 설명하기 어려울 때, 상담에서는 그 맥락을 함께 정리합니다. 약물 처방은 의료진의 영역이며, 상담은 정서·행동·생활 맥락을 중심으로 합니다.',
    forWhom:
      '한 가지 어려움만으로는 설명이 잘 안 되거나, 기분·불안·관계의 문제가 겹쳐 보여 어디서부터 이야기해야 할지 막막한 분.',
    icon: '/icons/area-overlap.svg',
    image: '/images/detail-overlap-plants-c132-4x3.jpg',
  },
  'couples-family': {
    title: '부부·가족 상담',
    body: '반복되는 부부 갈등, 부모와 자녀의 대화, 양육 방식, 재결합 가정의 역할 정리 등 가족 안의 관계를 함께 들여다봅니다. 개별 상담을 기본으로 하며, 가족·부모 면담이 함께 진행될 수도 있습니다.',
    forWhom:
      '부부 사이 대화가 반복해 막히거나, 자녀와의 갈등·훈육이 어렵거나, 가족 역할과 경계를 다시 정리하고 싶은 분.',
    icon: '/icons/area-family.svg',
    image: '/images/detail-family-flowers-c147-4x3.jpg',
  },
} as const;

export type CounselingSlug = keyof typeof counselingDetails;

export const guideCopy = {
  title: '이용 안내',
  lead: '예약부터 첫 면담까지, 지금 확인된 안내입니다.',
  steps: [
    {
      title: '예약하기',
      body: '상담 예약은 네이버 플레이스에서 받습니다. 날짜와 시간을 직접 고르실 수 있습니다. 예약 전에 궁금한 점은 문의 폼이나 대표번호 032-724-8501로 남겨 주세요.',
      icon: '/icons/step-book.svg',
    },
    {
      title: '센터에 오기',
      body: '인천 연수구 해돋이로120번길 23 아크리아2 2층 204호입니다. 해양경찰청 인근입니다. 주중 10:00–20:00, 토요일 10:00–17:00, 일요일은 정기휴무입니다. 지하철·버스·주차 안내는 오시는 길을 봐 주세요.',
      icon: '/icons/step-visit.svg',
    },
    {
      title: '초기 면담',
      body: '첫 상담은 1시간입니다. 지금 힘드신 점과 기대하시는 점을 정리한 뒤, 상담 목표와 간격을 함께 정합니다. 진행 중에 목표를 조정할 수 있습니다.',
      icon: '/icons/step-first.svg',
    },
    {
      title: '다음 일정',
      body: '초기 면담 내용에 따라 다음 회기를 함께 정합니다. 보통 회기는 50분입니다. 필요가 있으면 심리검사·평가 절차를 안내할 수 있으며, 결과와 해석은 전문가와의 상담을 통해 진행합니다.',
      icon: '/icons/step-next.svg',
    },
  ] as const,
  disclaimer:
    '이 안내는 일반적인 절차이며, 개인 상황에 따라 달라질 수 있습니다. 의학적 진단이나 처방을 대신하지 않습니다.',
  pricesLead: '상담 비용은 Clinic-OS에 등록된 안내와 같습니다.',
  offEventLine:
    '예약과 비용 안내는 네이버 플레이스 또는 대표전화로 확인해 주세요.',
};

export const faqItems = [
  {
    q: '예약은 어떻게 하나요?',
    a: '상담 예약은 네이버 플레이스에서 받습니다. 「상담 예약하기」를 누르시면 플레이스 예약 화면으로 이동합니다.',
  },
  {
    q: '운영 시간은 어떻게 되나요?',
    a: '주중 10:00–20:00, 토요일 10:00–17:00, 일요일은 정기휴무입니다.',
  },
  {
    q: '센터는 어디에 있나요? 주차는 가능한가요?',
    a: '인천 연수구 해돋이로120번길 23 아크리아2 2층 204호, 해양경찰청 인근입니다. 주차는 아크리아 2 지하 1–2층을 이용하시고, 만차이면 지하로 연결된 아크리아 1 주차장을 이용할 수 있습니다. 버스 330번 해양경찰청 하차 후 도보 약 176m(약 2분)입니다. 지하철·다른 버스 안내는 「오시는 길」을 참고해 주세요.',
  },
  {
    q: '전화로 문의할 수 있나요?',
    a: '대표번호 032-724-8501로 문의하실 수 있습니다. 홈페이지 상담 문의 폼으로 남겨 주시면, 운영 시간 안에 연락드립니다. 예약은 네이버 플레이스에서 해 주세요.',
    confirmNeeded: true,
  },
  {
    q: '처음 가면 어떻게 진행되나요? 시간은 얼마나 걸리나요?',
    a: '초기 면담에서 지금 힘드신 점과 기대하시는 점을 정리한 뒤, 상담 목표와 간격을 함께 정합니다. 첫 상담은 1시간, 보통 회기는 50분입니다. 방문 전에 준비할 것과 함께 오시는 분은 예약할 때 안내해 드립니다.',
    confirmNeeded: true,
  },
  {
    q: '상담 비용은 얼마인가요?',
    a: '상담 비용은 네이버 플레이스 가격 안내와 이용 안내를 확인해 주세요. 첫 상담은 1시간, 보통 회기는 50분입니다. 이벤트 가격은 안내된 기간에만 적용됩니다.',
  },
  {
    q: '병원인가요? 약을 처방하나요?',
    a: '센터는 의료기관이 아니며, 홈페이지의 안내는 의학적 진단이나 처방을 대신하지 않습니다. 약물 처방은 의료진의 영역입니다.',
  },
  {
    q: '아이와 함께 갈 수 있나요?',
    a: '아동·청소년 상담에서는 보호자와 함께 목표를 정리하며, 보호자 면담이 과정에 포함될 수 있습니다. 가족·부모 면담이 병행될 수도 있습니다. 첫 방문 때 누가 함께하는지는 예약 과정에서 안내받으시면 됩니다.',
    confirmNeeded: true,
  },
] as const;

export const locationCopy = {
  title: '오시는 길',
  transit: [
    {
      label: '지하철',
      body: '인천 1호선 캠퍼스타운역 하차 → 4번 출구 방향으로 나와 도보 약 1.5km(약 24분)',
      icon: '/icons/loc-subway.svg',
    },
    {
      label: '버스',
      body: '330번 해양경찰청 하차 → 도보 약 176m(약 2분)',
      icon: '/icons/loc-bus.svg',
    },
    {
      label: '버스',
      body: '16번 송도힐스테이트 5단지 하차 → 도보 약 231m(약 4분)',
      icon: '/icons/loc-bus.svg',
    },
    {
      label: '버스',
      body: '8번 송도풍림아이원 2단지 하차 → 아크리아 2 상가 바로 앞',
      icon: '/icons/loc-bus.svg',
    },
  ] as const,
  parking:
    '아크리아 2 지하 1–2층 (만차 시 지하로 연결된 아크리아 1 주차장 이용 가능)',
};

export const counselorsCopy = {
  title: '상담사 소개',
  name: '김선희',
  role: '마인드가든심리상담센터 대표원장',
  intro:
    '마인드가든심리상담센터 대표원장 김선희입니다. 아동·청소년과 성인, 부부·가족 상담을 안내하며, 자세한 분야·학력·자격은 아래 확인된 목록과 같습니다.',
  highlight: '주의·정서·관계, 아동·청소년과 부부·가족 상담을 안내합니다.',
  educationLine: '상담학(석사) / 가족상담(박사일부수료)',
  education: '청소년 교육(학사), 상담학(석사), 가족상담(박사일부수료).',
  credentials: [
    '한국상담학회 전문상담사, 부부가족분과, 재난상담 분과 소속',
    '보건복지부 사회복지사',
    '여성가족부 청소년지도사',
    '놀이치료사, 미술치료사, 교류분석사',
  ] as const,
  career: [
    '전) 인천지역 건강·다문화가족지원센터, 부부가족상담',
    '전) 인천지역 소방공무원·PTSD·트라우마 상담 및 검사',
    '전) 한국이민재단·부부 상호 이해 과목 강사(결혼이민자조기적응P)',
    '전) 인천지역 초등학교 외부 전문상담사',
    '전) 아동보호전문기관(법원수탁프로그램)·부모교육·개인·가족상담',
    '전) 유명 프랜차이즈 심리상담센터 (아동, 청소년, 성인, 부부 가족, 수석상담사 역임)',
    '전) 트리니티 심리상담연구소 소장(아동, 청소년, 부부, 가족)',
    '전) 한부모가정지지·사회복지 사례담당자 힐링 프로그램',
    '전) 정서조절P·감정코칭·자기이해·자녀양육·청소년 진로탐색P',
  ] as const,
  training:
    '경험적 가족치료, 인간중심, 미술치료, 모래놀이, 놀이치료, 교류분석, 종합심리검사 및 각종 검사 자격이수.',
  areas:
    'ADHD, ADD(조용한 ADHD) / 틱, 투렛 / 아스퍼거 / HSP(초민감성) / PTSD(외상후 스트레스장애), 트라우마 / 불안, 강박, 공황장애 / 우울, 양극성(조울) / 경계선 성격, 애착문제 / 자해, 자살, 위기개입 / 아동·청소년(등교거부, 적응, 학폭, 따돌림, 게임중독, 사회성증진) / 부부, 커플, 가족상담 / 양육코칭, 부모교육 / 부부갈등, 이혼 재결합.',
};

export const aboutCopy = {
  title: '센터 소개',
  lead: '나를 소중히 돌보고 가꾸는 시간, 당신의 마음이 정원이 되는 곳',
  support:
    '아이부터 어른까지, 마음과 관계를 함께 살펴보는 심리상담센터',
  valuesLead:
    '마음이 건강하고 안정되게 자라나도록 돌보고 가꿉니다. 사람마다 꽃을 피우는 시기가 다르기에, 그 시간을 귀히 여기며 함께하겠습니다.',
  values: [
    {
      title: '전문성',
      body: '이야기에 귀 기울이고, 확인된 자격과 훈련을 바탕으로 실제적인 안내를 하겠습니다. 상담사는 윤리를 지키며 전문성을 이어 갑니다.',
    },
    {
      title: '인류애',
      body: '문을 두드린 분이 잠시 쉴 수 있도록, 존중과 배려를 잃지 않겠습니다.',
    },
    {
      title: '회복과 성장',
      body: '각자의 고유한 모습을 살펴 보고, 스스로 자신을 이해해 갈 수 있도록 돕겠습니다.',
    },
  ] as const,
  areas: homeCopy.areas.items,
};

export const reviewsCopy = {
  title: '이용 후기',
  lead: '예약·안내·공간처럼, 센터를 이용하며 느끼신 점을 남길 수 있습니다.',
  empty:
    '아직 등록된 이용 후기가 없습니다. 센터를 이용하신 분은 이용 경험을 남겨 주실 수 있습니다.',
  policy:
    '후기는 익명으로, 관리자 확인 뒤에 게시됩니다. 예약·응대·시설·이용 편의에 관한 경험을 적어 주세요. 상담의 효과나 결과, 진단명·약물 등 건강 정보, 알아볼 수 있는 정보는 게시하지 않습니다. 별점은 운영하지 않으며, 센터는 후기 내용을 임의로 고치지 않습니다.',
};

export const contactCopy = {
  title: '상담 문의',
  body: '남겨 주시면 운영 시간 안에 연락드립니다. 예약은 네이버 플레이스에서 해 주세요.',
  healthNotice:
    '문의 내용에 진단명, 복용 약물, 병력 등 건강 정보는 적지 말아 주세요.',
};

export const eventCopy = {
  title: '첫 마음산책',
  line: '검사 1종 + 상담 30분',
  offTitle: '이벤트 안내',
  offBody:
    '첫 상담은 1시간입니다. 예약과 비용 안내는 네이버 플레이스를 확인해 주세요.',
};

export const galleryCopy = {
  title: '센터 공간',
  lead: '마인드가든의 공간을 소개합니다.',
  items: [
    {
      caption: '모래놀이실',
      src: '/images/gallery-hero-sandplay-c73-4x3.jpg',
      confirmNeeded: false,
    },
    {
      caption: '모래놀이실',
      src: '/images/gallery-sandplay-c133-3x4.jpg',
      confirmNeeded: false,
    },
    {
      caption: '모래놀이실',
      src: '/images/gallery-sandplay-c142-3x4.jpg',
      confirmNeeded: false,
    },
    {
      caption: '놀이 공간',
      src: '/images/gallery-play-c122-3x4.jpg',
      confirmNeeded: false,
    },
    {
      caption: '놀이 공간',
      src: '/images/gallery-play-c174-3x4.jpg',
      confirmNeeded: false,
    },
    {
      caption: '로비',
      src: '/images/gallery-lobby-c148-3x4.jpg',
      confirmNeeded: true,
    },
    {
      caption: '대기 공간',
      src: '/images/gallery-waiting-c152-3x4.jpg',
      confirmNeeded: true,
    },
    {
      caption: '대기 공간',
      src: '/images/gallery-waiting-c151-3x4.jpg',
      confirmNeeded: true,
    },
    {
      caption: '상담실',
      src: '/images/gallery-room-c163-3x4.jpg',
      confirmNeeded: true,
    },
    {
      caption: '상담실',
      src: '/images/gallery-room-c168-3x4.jpg',
      confirmNeeded: true,
    },
  ] as const,
};

export const screeningCopy = {
  title: '주제별 간이 점검',
  lead: '일상에서 겪을 수 있는 패턴을 스스로 살펴볼 수 있습니다.',
  disclaimer:
    '이 점검은 의학적 평가를 대신하지 않습니다. 개인의 특성과 성향을 이해하는 데 참고만 해 주세요.',
  topics: [
    { slug: 'adhd', title: 'ADHD', desc: '주의·집중 패턴을 살펴봅니다.' },
    { slug: 'depression', title: '우울', desc: '기분과 에너지 패턴을 살펴봅니다.' },
    {
      slug: 'panic-anxiety',
      title: '공황·불안 발작',
      desc: '불안이 커질 때의 패턴을 살펴봅니다.',
    },
    {
      slug: 'asd',
      title: '아스퍼거 및 ASD',
      desc: '사회적 의사소통 패턴을 살펴봅니다.',
    },
    { slug: 'ptsd', title: 'PTSD', desc: '외상 관련 반응 패턴을 살펴봅니다.' },
    {
      slug: 'borderline',
      title: '경계선 성격 패턴',
      desc: '관계·감정 조절 패턴을 살펴봅니다.',
    },
    {
      slug: 'school',
      title: '학교생활 부적응',
      desc: '학교 장면에서의 어려움을 살펴봅니다.',
    },
    {
      slug: 'work',
      title: '직장생활 부적응',
      desc: '직장 장면에서의 어려움을 살펴봅니다.',
    },
    {
      slug: 'addiction',
      title: '중독·과몰입 행동',
      desc: '과몰입 행동 패턴을 살펴봅니다.',
    },
  ] as const,
  topicTitleConfirmNeeded: true,
};

export const legalPlaceholder =
  '법률 원고 자리입니다. 세무·법률 담당 확정본이 반영되면 이 본문을 교체합니다.';

export const knownSourceTypos = [
  '「아크리아2」와 「아크리아 2」 혼용(주소는 아크리아2, 주차 안내는 아크리아 2·1)',
  '「박사일부수료」',
  '「제 … 호」 띄어쓰기',
  '「행동이 앞지르거나」',
  '「찾아 갑니다」',
] as const;
