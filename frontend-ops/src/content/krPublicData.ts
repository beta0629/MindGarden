/**
 * 국세청 확인 결과 화면 문구.
 */

export const KR_PUBLIC_DATA_COPY = {
  SECTION: "사업자 확인",
  BIZ_NUMBER: "사업자등록번호",
  REPRESENTATIVE: "대표자명",
  OPENING_DATE: "개업일자",
  MATCH: "진위",
  STATUS: "사업자 상태",
  TAX: "과세유형",
  CHECKED_AT: "확인 시각",
  UNCONFIRMED: "미확인",
  RECHECK: "다시 확인",
  RECHECK_FAILED: "다시 확인하지 못했습니다. 저장된 결과를 유지합니다.",
  PRIVACY_NOTICE:
    "다시 확인은 대표자명을 국세청에 전송합니다. 신청 저장 여부는 바꾸지 않습니다."
} as const;

/** Core API base 뒤에 붙는 공개 조회 경로. */
export const KR_PUBLIC_DATA_PUBLIC_LOOKUP = "/public/kr-public-data/business-registration/lookup";
