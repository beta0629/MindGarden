/**
 * 국세청·도로명주소 화면 문구. 컴포넌트에 문장을 직접 두지 않는다.
 */

export const KR_PUBLIC_DATA_COPY = {
  PRIVACY_NOTICE:
    '대표자명과 개업일자는 사업자등록 진위확인을 위해 국세청에 제공됩니다. 진위 불일치·폐업·미등록이면 신청이 제한됩니다. 확인이 안 되면 미확인으로 진행할 수 있습니다.',
  LABEL_OPENING_DATE: '개업일자',
  PLACEHOLDER_OPENING_DATE: 'YYYY-MM-DD',
  ERROR_OPENING_REQUIRED: '개업일자를 입력해 주세요.',
  ERROR_OPENING_INVALID: '개업일자는 YYYY-MM-DD 형식의 유효한 날짜여야 하며 오늘 이후일 수 없습니다.',
  ERROR_REPRESENTATIVE_INVALID: '대표자명은 1자 이상 100자 이하의 문자여야 합니다.',
  ADDRESS_SEARCH: '주소 검색',
  ADDRESS_SEARCHING: '검색 중',
  ADDRESS_EMPTY: '검색 결과가 없습니다. 주소를 직접 입력해 주세요.',
  ADDRESS_FAILED: '주소 검색을 사용하지 못했습니다. 주소를 직접 입력해 주세요.',
  LABEL_VERIFICATION: '국세청 확인',
  LABEL_MATCH: '진위',
  LABEL_STATUS: '사업자 상태',
  LABEL_CHECKED_AT: '확인 시각',
  OVERALL_UNCONFIRMED: '미확인',
  VERIFY: '사업자 확인',
  VERIFYING: '확인 중',
  VERIFY_FAILED: '사업자 확인을 완료하지 못했습니다. 신청 시 서버에서 다시 확인합니다.',
  WARNING_SUSPENDED:
    '휴업 상태의 사업자입니다. 신청은 가능하나 관리자 확인이 필요할 수 있습니다.',
  BUSINESS_CONTINUE: '계속',
  BUSINESS_SUSPENDED: '휴업',
  BUSINESS_CLOSED: '폐업',
  BUSINESS_UNREGISTERED: '미등록',
  OVERALL_MATCH: '일치',
  OVERALL_MISMATCH: '불일치',
  OVERALL_UNREGISTERED: '미등록'
} as const;

export const KR_PUBLIC_DATA_PATHS = {
  CAPABILITIES: '/api/v1/public/kr-public-data/capabilities',
  ADDRESSES: '/api/v1/public/kr-public-data/addresses',
  LOOKUP: '/api/v1/public/kr-public-data/business-registration/lookup'
} as const;
