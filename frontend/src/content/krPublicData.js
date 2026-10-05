/**
 * 국세청·도로명주소 화면 문구.
 */

export const KR_PUBLIC_DATA_COPY = {
  PRIVACY_NOTICE:
    '대표자명과 개업일자는 사업자등록 진위확인을 위해 국세청에 제공됩니다. 확인 결과와 관계없이 저장할 수 있습니다.',
  LABEL_OPENING_DATE: '개업일자',
  LABEL_VERIFICATION: '국세청 확인',
  LABEL_MATCH: '진위',
  LABEL_STATUS: '사업자 상태',
  LABEL_TAX: '과세유형',
  LABEL_CHECKED_AT: '확인 시각',
  OVERALL_UNCONFIRMED: '미확인',
  REFRESH: '다시 확인',
  ADDRESS_SEARCH: '주소 검색',
  ADDRESS_SEARCHING: '검색 중',
  ADDRESS_EMPTY: '검색 결과가 없습니다. 주소를 직접 입력해 주세요.',
  ADDRESS_FAILED: '주소 검색을 사용하지 못했습니다. 주소를 직접 입력해 주세요.',
  ERROR_OPENING_INVALID: '개업일자는 YYYY-MM-DD 형식의 유효한 날짜여야 하며 오늘 이후일 수 없습니다.',
  ERROR_REPRESENTATIVE_INVALID: '대표자명은 1자 이상 100자 이하의 문자여야 합니다.'
};

export const KR_PUBLIC_DATA_PATHS = {
  CAPABILITIES: '/api/v1/kr-public-data/capabilities',
  ADDRESSES: '/api/v1/kr-public-data/addresses',
  LOOKUP: '/api/v1/kr-public-data/business-registration/lookup'
};
