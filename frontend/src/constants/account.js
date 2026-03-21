/**
 * 계좌 관리 관련 상수 정의
 */

import { createApiUrl } from './environment';

export const ACCOUNT_API_ENDPOINTS = {
  BASE: createApiUrl('/api/v1/accounts'),
  ACTIVE: createApiUrl('/api/v1/accounts/active'),
  BANKS: createApiUrl('/api/v1/accounts/banks'),
  STATISTICS: createApiUrl('/api/v1/accounts/statistics'),
  VALIDATE: createApiUrl('/api/v1/accounts/validate'),
  PRIMARY: createApiUrl('/api/v1/accounts/primary')
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  APPLICATION_JSON: 'application/json'
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

export const ACCOUNT_STATUS_LABELS = {
  ACTIVE: '활성',
  INACTIVE: '비활성'
};

export const ACCOUNT_PRIMARY = {
  TRUE: true,
  FALSE: false
};

export const ACCOUNT_PRIMARY_LABELS = {
  TRUE: '기본',
  FALSE: ''
};

export const ACCOUNT_FORM_FIELDS = {
  BANK_CODE: 'bankCode',
  BANK_NAME: 'bankName',
  ACCOUNT_NUMBER: 'accountNumber',
  ACCOUNT_HOLDER: 'accountHolder',
  BRANCH_ID: 'branchId',
  IS_PRIMARY: 'isPrimary',
  IS_ACTIVE: 'isActive',
  DESCRIPTION: 'description'
};

export const ACCOUNT_FORM_LABELS = {
  BANK: '은행',
  ACCOUNT_NUMBER: '계좌번호',
  ACCOUNT_HOLDER: '예금주명',
  BRANCH_ID: '지점 ID',
  DESCRIPTION: '설명',
  IS_PRIMARY: '기본 계좌로 설정',
  IS_ACTIVE: '활성 상태'
};

export const ACCOUNT_FORM_PLACEHOLDERS = {
  BANK_SELECT: '은행을 선택하세요',
  ACCOUNT_NUMBER: '계좌번호를 입력하세요',
  ACCOUNT_HOLDER: '예금주명을 입력하세요',
  BRANCH_ID: '지점 ID (선택사항)',
  DESCRIPTION: '계좌 설명 (선택사항)'
};

export const ACCOUNT_BUTTON_TEXT = {
  REGISTER: '계좌 등록',
  EDIT: '수정',
  DELETE: '삭제',
  CANCEL: '취소',
  SAVE: '저장',
  SUBMIT: '등록',
  PROCESSING: '처리 중...',
  ACTIVATE: '활성화',
  DEACTIVATE: '비활성화',
  SET_PRIMARY: '기본설정'
};

export const ACCOUNT_MESSAGES = {
  SUCCESS: {
    CREATED: '계좌가 등록되었습니다.',
    UPDATED: '계좌가 수정되었습니다.',
    DELETED: '계좌가 삭제되었습니다.',
    STATUS_CHANGED: '계좌 상태가 변경되었습니다.',
    PRIMARY_SET: '기본 계좌로 설정되었습니다.'
  },
  ERROR: {
    LOAD_FAILED: '계좌 목록 로드에 실패했습니다.',
    CREATE_FAILED: '계좌 등록에 실패했습니다.',
    UPDATE_FAILED: '계좌 수정에 실패했습니다.',
    DELETE_FAILED: '계좌 삭제에 실패했습니다.',
    STATUS_CHANGE_FAILED: '계좌 상태 변경에 실패했습니다.',
    PRIMARY_SET_FAILED: '기본 계좌 설정에 실패했습니다.',
    BANK_LOAD_FAILED: '은행 목록 로드에 실패했습니다.'
  },
  CONFIRM: {
    DELETE: '정말로 이 계좌를 삭제하시겠습니까?'
  }
};

export const ACCOUNT_VALIDATION = {
  ACCOUNT_NUMBER_PATTERN: /^[0-9-]+$/,
  MIN_ACCOUNT_NUMBER_LENGTH: 10,
  MAX_ACCOUNT_NUMBER_LENGTH: 50,
  MAX_ACCOUNT_HOLDER_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500
};

export const ACCOUNT_TABLE_COLUMNS = {
  BANK: '은행',
  ACCOUNT_NUMBER: '계좌번호',
  ACCOUNT_HOLDER: '예금주명',
  BRANCH_ID: '지점 ID',
  STATUS: '상태',
  PRIMARY: '기본계좌',
  CREATED_AT: '등록일',
  ACTIONS: '작업'
};

export const ACCOUNT_PAGE_TITLES = {
  MAIN: '계좌 관리',
  CREATE: '계좌 등록',
  EDIT: '계좌 수정'
};

/** 목록 영역(B0KlA 섹션) 제목 */
export const ACCOUNT_SECTION_TITLES = {
  REGISTERED_LIST: '등록된 계좌'
};

/** 계좌 목록이 비었을 때 안내 */
export const ACCOUNT_EMPTY_STATE = {
  TITLE: '등록된 계좌가 없습니다',
  DESCRIPTION: '상단의 계좌 등록 버튼으로 정산·입금 안내에 사용할 계좌를 추가해 주세요.'
};
