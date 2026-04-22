/** OAuth 전화 계정 선택 UI 문구 (백엔드 OAuthAccountSelectionUserFacingStrings 와 동일 의미) */
export const OAUTH_ACCOUNT_SELECTION_STRINGS = {
  MODAL_TITLE: '연결할 계정을 선택해주세요',
  MODAL_SUBTITLE:
    '동일한 휴대폰 번호로 등록된 서로 다른 역할의 계정이 여러 개 있습니다.',
  CONFIRM: '선택한 계정으로 계속',
  LOAD_PREVIEW_FAILED: '계정 목록을 불러오지 못했습니다.',
  COMPLETE_FAILED: '로그인을 완료하지 못했습니다.'
};

/** 미리보기 후보의 역할 라벨(백엔드 roleDisplayLabel 우선). */
export const buildOAuthAccountSelectionCandidatePrimaryLine = (candidate) => {
  const fromApi = candidate?.roleDisplayLabel != null ? String(candidate.roleDisplayLabel).trim() : '';
  if (fromApi) {
    return fromApi;
  }
  return candidate?.optionLabel != null ? String(candidate.optionLabel) : '';
};

/** 미리보기 후보의 대시보드 안내(백엔드 dashboardGuide). */
export const buildOAuthAccountSelectionCandidateSecondaryLine = (candidate) => {
  const g = candidate?.dashboardGuide != null ? String(candidate.dashboardGuide).trim() : '';
  return g;
};
