/**
 * 선택·이관·현황·KPI 등 UI용 — 활성 상담사만 남긴다.
 * with-vacation API는 색 순번 SSOT를 위해 비활성을 포함하므로,
 * 선택 목록·상담사 수에서는 이 모듈로 필터한다.
 * 통합스케줄 필터/색 계산 배열에는 적용하지 않는다.
 *
 * @param {Array<{ isActive?: boolean }|null|undefined>|null|undefined} list
 * @returns {Array}
 */
export const selectActiveConsultants = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((item) => item != null && item.isActive !== false);
};

export default selectActiveConsultants;
