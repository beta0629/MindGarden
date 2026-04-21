/**
 * StaffManagement — 사용자 노출 한글 문자열
 *
 * @author Core Solution
 * @since 2026-04-21
 */

/** 역할 표시명 (백엔드 UserRole displayName과 동일) */
export const STAFF_MGMT_ROLE_LABELS = {
  ADMIN: '관리자',
  STAFF: '사무원',
  CONSULTANT: '상담사',
  CLIENT: '내담자'
};

/** 마스킹·폴백 라벨 */
export const STAFF_MGMT_MASK = {
  NAME: '이름',
  EMAIL: '이메일',
  PHONE_NONE: '전화번호 없음'
};

export const STAFF_MGMT_PLACEHOLDER = {
  SEARCH_NAME_EMAIL_PHONE: '이름, 이메일, 전화번호로 검색...',
  CREATE_NAME: '이름을 입력하세요',
  CREATE_PHONE: '010-1234-5678',
  CREATE_ADDRESS: '주소 검색 버튼을 눌러 주소를 입력하세요.',
  CREATE_ADDRESS_DETAIL: '동, 호수, 상세 주소를 입력하세요.',
  CREATE_POSTAL: '00000',
  CREATE_EMAIL: 'example@email.com',
  CREATE_PASSWORD: '비밀번호를 입력하지 않으면 자동 생성됩니다',
  RRN_FIRST6: '900101',
  RRN_LAST1: '1',
  EDIT_PHONE_CLEAR: '비우면 전화번호 없음으로 저장'
};

export const STAFF_MGMT_MSG = {
  ASSIGN_LIST_EMPTY: '스태프로 지정할 수 있는 사용자가 없습니다.',
  SEARCH_EMPTY: '검색 결과가 없습니다.',
  ERR_LOAD_USER_LIST: '사용자 목록을 불러오는데 실패했습니다.',
  TOAST_STAFF_REGISTERED: '스태프가 성공적으로 등록되었습니다.',
  ERR_REGISTER_FAILED: '등록에 실패했습니다.',
  ERR_STAFF_REGISTER_PROCESS: '스태프 등록 중 오류가 발생했습니다.',
  TOAST_ASSIGNED_DEFAULT: '스태프로 지정되었습니다.',
  ERR_ASSIGN_FAILED: '스태프 지정에 실패했습니다.',
  ERR_ASSIGN_PROCESS: '스태프 지정 중 오류가 발생했습니다.',
  TOAST_ROLE_CHANGED: '역할이 변경되었습니다.',
  ERR_ROLE_FAILED: '역할 변경에 실패했습니다.',
  ERR_ROLE_PROCESS: '역할 변경 중 오류가 발생했습니다.',
  VAL_NAME_REQUIRED: '이름을 입력해 주세요.',
  VAL_EMAIL_REQUIRED: '이메일을 입력해 주세요.',
  TOAST_PROFILE_UPDATED: '사용자 정보가 수정되었습니다.',
  ERR_UPDATE_FAILED: '수정에 실패했습니다.',
  ERR_UPDATE_PROCESS: '정보 수정 중 오류가 발생했습니다.',
  ERR_ADDRESS_API: '주소 검색 서비스를 불러올 수 없습니다.'
};

export const STAFF_MGMT_PAGE = {
  TITLE: '스태프 관리',
  SUBTITLE: '스태프(사무원) 목록 조회, 상세·기본 정보 수정 및 역할 변경',
  ARIA_MAIN: '스태프 관리 본문',
  LOADING: '데이터를 불러오는 중...',
  KPI_TOTAL: '총 스태프',
  KPI_UNIT: '명',
  LIST_HEADING: '스태프 목록',
  EMPTY_NO_STAFF_TITLE: '등록된 스태프가 없습니다',
  EMPTY_NO_SEARCH_TITLE: '검색 결과가 없습니다',
  EMPTY_NO_STAFF_DESC: '기존 사용자를 스태프(사무원)로 역할 변경할 수 있습니다.',
  EMPTY_NO_SEARCH_DESC: '다른 검색어로 시도해 보세요.'
};

export const STAFF_MGMT_BUTTON = {
  ASSIGN_STAFF: '스태프로 지정',
  NEW_STAFF: '새 스태프 등록',
  REFRESH: '새로고침',
  DETAIL: '상세',
  EDIT: '수정',
  ROLE_CHANGE: '역할 변경',
  CLOSE: '닫기',
  CANCEL: '취소',
  SAVE: '저장',
  CONFIRM: '확인',
  REGISTER: '등록',
  ADDRESS_SEARCH: '주소 검색'
};

export const STAFF_MGMT_ARIA = {
  STAFF_ACTIONS: '스태프 작업',
  VIEW_MODE_TOGGLE: '목록 보기 전환'
};

export const STAFF_MGMT_STATUS = {
  ACTIVE: '활성',
  INACTIVE: '비활성'
};

export const STAFF_MGMT_TABLE = {
  COL_NAME: '이름',
  COL_EMAIL: '이메일',
  COL_ROLE: '역할',
  COL_STATUS: '상태',
  COL_ACTIONS: '작업'
};

export const STAFF_MGMT_MODAL = {
  DETAIL_TITLE: '스태프 상세',
  EDIT_TITLE: '스태프 정보 수정',
  EDIT_SUBTITLE: '이름·이메일·전화번호만 변경할 수 있습니다. 역할은 역할 변경에서 수정하세요.',
  ROLE_TITLE: '역할 변경',
  ASSIGN_TITLE: '스태프로 지정',
  ASSIGN_SUBTITLE: '사용자를 스태프(사무원)로 지정합니다. 목록에서 선택 후 버튼을 누르세요.',
  CREATE_TITLE: '새 스태프 등록',
  CREATE_SUBTITLE: '내담자·상담사와 동일한 양식으로 사무원(스태프) 계정을 생성합니다.',
  LOADING_USERS: '사용자 목록 불러오는 중...',
  LABEL_NEW_ROLE: '새 역할',
  ROLE_SELECT_PLACEHOLDER: '역할 선택'
};

export const STAFF_MGMT_FORM_LABEL = {
  NAME_REQUIRED: '이름 *',
  EMAIL_REQUIRED: '이메일 *',
  PHONE: '전화번호',
  ROLE: '역할',
  STATUS: '상태',
  CREATED_AT: '등록일',
  ADDRESS: '주소',
  RRN_FIRST_OPTIONAL: '주민번호 앞 6자리 (선택)',
  RRN_LAST_OPTIONAL: '주민번호 뒤 1자리 (선택)',
  ADDRESS_SEARCH: '주소 검색',
  ADDRESS_DETAIL: '상세 주소',
  POSTAL: '우편번호',
  PASSWORD: '비밀번호'
};

export const STAFF_MGMT_HELP = {
  PASSWORD_AUTO_INFO: '비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.',
  PROFILE_IMAGE: '이미지 파일만 가능, 최대 2MB (리사이즈·크롭 적용)',
  PASSWORD_HINT: '비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.'
};
