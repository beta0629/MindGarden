/**
 * 공개 /services 안내. 센터 문장은 서브도메인 키에만 둔다.
 * 키는 호스트 리졸버가 돌려주는 라벨과 같다. 없는 키는 null.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */

/** 도메인 리졸버의 마인드가든 서브도메인 라벨. */
export const MINDGARDEN_TENANT_KEY = 'mindgarden';

/** 콘텐츠가 없는 테넌트. 특정 센터 사실을 넣지 않는다. */
export const PUBLIC_GUIDE_EMPTY = '등록된 상담 안내가 없습니다.';

export const PUBLIC_GUIDE_LABELS = Object.freeze({
  SECTION_COUNSELOR: '상담사 소개',
  LABEL_PRODUCT_NAME: '상품명',
  LABEL_SESSIONS: '회기',
  LABEL_PRICE: '가격',
  LABEL_PERIOD: '이용기간'
});

const MINDGARDEN_GUIDE = Object.freeze({
  centerName: '마인드가든 심리상담센터',
  address: '인천 연수구 해돋이로120번길 23 아크리아2 2층 204호',
  phone: '032-724-8501',
  hours: '주중 10:00–20:00, 토요일 10:00–17:00, 일요일 정기휴무',
  counselorNameLine: '김선희 대표원장',
  majorLine: '전공: 청소년교육 학사, 상담학 석사, 가족상담 박사과정 일부 수료',
  credentialLabel: '전문자격:',
  credentials: Object.freeze([
    '한국상담학회 전문상담사 (부부가족분과, 재난상담분과)',
    '보건복지부 사회복지사',
    '여성가족부 청소년지도사',
    '놀이치료사, 미술치료사, 교류분석사'
  ]),
  careerLabel: '주요 경력:',
  careers: Object.freeze([
    '인천 건강가정·다문화가족지원센터 부부가족상담',
    '인천 소방공무원 PTSD·트라우마 상담',
    '초등학교 외부 전문상담사',
    '아동보호전문기관 부모교육·가족상담',
    '트리니티 심리상담연구소 소장'
  ]),
  intro: '15년 이상 임상 경험을 갖춘 대표원장이 직접 상담합니다.',
  commonNotice: '100% 사전 예약제, 철저한 비밀 보장, 의료적 진단이나 처방을 대신하지 않습니다',
  processLine: '예약 신청 → 센터 확인 전화로 예약 확정 → 초기 면담(필요하면 검사) → 회기 진행 → 종결',
  types: Object.freeze([
    '아동·청소년·성인 1:1 개인상담 (50분, 센터 방문): 불안, 우울, 공황, 강박, 번아웃, 대인관계 갈등',
    'ADHD 상담 (성인·여성·아동청소년): 검사와 맞춤상담',
    '부부·커플 / 부모-자녀 상담 (60분): 애착과 상호이해 중심',
    '아동발달 솔루션 (50분 = 솔루션 40분 + 부모 피드백 10분): 놀이치료, 모래놀이치료, 언어치료, ABA(응용행동분석)',
    '사회성 솔루션 (50분): 아스퍼거, ASD, 사회적 의사소통',
    '심리검사: CAT, TCI, MMPI-2, SCT, 종합심리검사, 부모양육태도검사, 그림검사(HTP·KFD). 센터 방문 검사, 결과 해석상담 포함'
  ]),
  processSteps: Object.freeze([
    '예약 신청',
    '센터 확인 전화로 예약 확정',
    '초기 면담(필요하면 검사)',
    '회기 진행',
    '종결'
  ])
});

const GUIDES_BY_TENANT_KEY = Object.freeze({
  [MINDGARDEN_TENANT_KEY]: MINDGARDEN_GUIDE
});

/**
 * @param {string|null|undefined} tenantKey
 * @returns {typeof MINDGARDEN_GUIDE|null}
 */
export function findTenantGuide(tenantKey) {
  const key = String(tenantKey || '').trim().toLowerCase();
  if (!key) {
    return null;
  }
  return GUIDES_BY_TENANT_KEY[key] || null;
}

/**
 * @param {string|null|undefined} tenantKey
 * @returns {boolean}
 */
export function hasTenantServiceGuide(tenantKey) {
  return findTenantGuide(tenantKey) !== null;
}

/** 공개 페이지에서 빼는 테스트 SKU. */
export const BLOCKED_PUBLIC_SKU = 'SHOP-20260929-001';

/** 이용기간 폴백. 이 회기 수 외에는 개월을 만들지 않는다. */
export const USAGE_MONTHS_BY_SESSIONS = Object.freeze({
  1: 2,
  10: 3,
  20: 6
});
