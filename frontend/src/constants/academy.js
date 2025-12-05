 * 학원 시스템 상수
 * 하드코딩 금지, 모든 값은 상수로 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */


export const ACADEMY_API = {
  COURSE_LIST: '/api/v1/academy/courses',
  COURSE_DETAIL: (courseId) => `/api/v1/academy/courses/${courseId}`,
  COURSE_CREATE: '/api/v1/academy/courses',
  COURSE_UPDATE: (courseId) => `/api/v1/academy/courses/${courseId}`,
  COURSE_DELETE: (courseId) => `/api/v1/academy/courses/${courseId}`,
  COURSE_TOGGLE_STATUS: (courseId) => `/api/v1/academy/courses/${courseId}/toggle-status`,
  
  CLASS_LIST: '/api/v1/academy/classes',
  CLASS_DETAIL: (classId) => `/api/v1/academy/classes/${classId}`,
  CLASS_CREATE: '/api/v1/academy/classes',
  CLASS_UPDATE: (classId) => `/api/v1/academy/classes/${classId}`,
  CLASS_DELETE: (classId) => `/api/v1/academy/classes/${classId}`,
  CLASS_UPDATE_STATUS: (classId) => `/api/v1/academy/classes/${classId}/status`,
  CLASS_RECRUITING: '/api/v1/academy/classes/recruiting',
  CLASS_CHECK_ENROLLABLE: (classId) => `/api/v1/academy/classes/${classId}/check-enrollable`,
  
  ENROLLMENT_LIST: '/api/v1/academy/enrollments',
  ENROLLMENT_DETAIL: (enrollmentId) => `/api/v1/academy/enrollments/${enrollmentId}`,
  ENROLLMENT_CREATE: '/api/v1/academy/enrollments',
  ENROLLMENT_CANCEL: (enrollmentId) => `/api/v1/academy/enrollments/${enrollmentId}/cancel`,
  ENROLLMENT_UPDATE: (enrollmentId) => `/api/v1/academy/enrollments/${enrollmentId}`,
  
  ATTENDANCE_LIST: '/api/v1/academy/attendances',
  ATTENDANCE_CHECK: '/api/v1/academy/attendances/check',
  ATTENDANCE_UPDATE: (attendanceId) => `/api/v1/academy/attendances/${attendanceId}`,
  ATTENDANCE_STATISTICS: '/api/v1/academy/attendances/statistics',
  
  BRANCH_LIST: '/api/v1/academy/branches',
  BRANCH_DETAIL: (branchId) => `/api/v1/academy/branches/${branchId}`,
  BRANCH_CREATE: '/api/v1/academy/branches',
  BRANCH_UPDATE: (branchId) => `/api/v1/academy/branches/${branchId}`,
  BRANCH_DELETE: (branchId) => `/api/v1/academy/branches/${branchId}`,
};


export const ACADEMY_PERMISSIONS = {
  COURSE_VIEW_LIST: 'ACADEMY_COURSE_VIEW_LIST',
  COURSE_VIEW_DETAIL: 'ACADEMY_COURSE_VIEW_DETAIL',
  COURSE_CREATE: 'ACADEMY_COURSE_CREATE',
  COURSE_UPDATE: 'ACADEMY_COURSE_UPDATE',
  COURSE_DELETE: 'ACADEMY_COURSE_DELETE',
  COURSE_TOGGLE_STATUS: 'ACADEMY_COURSE_TOGGLE_STATUS',
  
  CLASS_VIEW_LIST: 'ACADEMY_CLASS_VIEW_LIST',
  CLASS_VIEW_DETAIL: 'ACADEMY_CLASS_VIEW_DETAIL',
  CLASS_CREATE: 'ACADEMY_CLASS_CREATE',
  CLASS_UPDATE: 'ACADEMY_CLASS_UPDATE',
  CLASS_DELETE: 'ACADEMY_CLASS_DELETE',
  CLASS_UPDATE_STATUS: 'ACADEMY_CLASS_UPDATE_STATUS',
  CLASS_VIEW_RECRUITING: 'ACADEMY_CLASS_VIEW_RECRUITING',
  
  ENROLLMENT_VIEW_LIST: 'ACADEMY_ENROLLMENT_VIEW_LIST',
  ENROLLMENT_VIEW_DETAIL: 'ACADEMY_ENROLLMENT_VIEW_DETAIL',
  ENROLLMENT_CREATE: 'ACADEMY_ENROLLMENT_CREATE',
  ENROLLMENT_CANCEL: 'ACADEMY_ENROLLMENT_CANCEL',
  ENROLLMENT_UPDATE: 'ACADEMY_ENROLLMENT_UPDATE',
  
  ATTENDANCE_VIEW_LIST: 'ACADEMY_ATTENDANCE_VIEW_LIST',
  ATTENDANCE_CHECK: 'ACADEMY_ATTENDANCE_CHECK',
  ATTENDANCE_UPDATE: 'ACADEMY_ATTENDANCE_UPDATE',
  ATTENDANCE_VIEW_STATISTICS: 'ACADEMY_ATTENDANCE_VIEW_STATISTICS',
  
  BRANCH_VIEW_LIST: 'ACADEMY_BRANCH_VIEW_LIST',
  BRANCH_VIEW_DETAIL: 'ACADEMY_BRANCH_VIEW_DETAIL',
  BRANCH_CREATE: 'ACADEMY_BRANCH_CREATE',
  BRANCH_UPDATE: 'ACADEMY_BRANCH_UPDATE',
  BRANCH_DELETE: 'ACADEMY_BRANCH_DELETE',
  
  STATISTICS_VIEW: 'ACADEMY_STATISTICS_VIEW',
  REPORT_GENERATE: 'ACADEMY_REPORT_GENERATE',
};


export const CLASS_STATUS = {
  DRAFT: 'DRAFT',
  RECRUITING: 'RECRUITING',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  ACTIVE: 'ACTIVE',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  COMPLETED: 'COMPLETED',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CANCELLED: 'CANCELLED',
};

export const CLASS_STATUS_LABELS = {
  [CLASS_STATUS.DRAFT]: '초안',
  [CLASS_STATUS.RECRUITING]: '모집중',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [CLASS_STATUS.ACTIVE]: '진행중',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [CLASS_STATUS.COMPLETED]: '완료',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [CLASS_STATUS.CANCELLED]: '취소',
};

export const PRICING_POLICY = {
  FIXED: 'FIXED',
  PER_SESSION: 'PER_SESSION',
  PACKAGE: 'PACKAGE',
};

export const PRICING_POLICY_LABELS = {
  [PRICING_POLICY.FIXED]: '고정 가격',
  [PRICING_POLICY.PER_SESSION]: '회차별 가격',
  [PRICING_POLICY.PACKAGE]: '패키지 가격',
};


export const ACADEMY_MESSAGES = {
  COURSE_CREATE_SUCCESS: '강좌가 성공적으로 생성되었습니다.',
  COURSE_UPDATE_SUCCESS: '강좌 정보가 수정되었습니다.',
  COURSE_DELETE_SUCCESS: '강좌가 삭제되었습니다.',
  CLASS_CREATE_SUCCESS: '반이 성공적으로 생성되었습니다.',
  CLASS_UPDATE_SUCCESS: '반 정보가 수정되었습니다.',
  CLASS_DELETE_SUCCESS: '반이 삭제되었습니다.',
  ENROLLMENT_SUCCESS: '수강 등록이 완료되었습니다.',
  ENROLLMENT_CANCEL_SUCCESS: '수강이 취소되었습니다.',
  ATTENDANCE_CHECK_SUCCESS: '출석이 체크되었습니다.',
  
  COURSE_NOT_FOUND: '강좌를 찾을 수 없습니다.',
  CLASS_NOT_FOUND: '반을 찾을 수 없습니다.',
  ENROLLMENT_NOT_FOUND: '수강 등록 정보를 찾을 수 없습니다.',
  CLASS_FULL: '정원이 가득 찼습니다.',
  CLASS_NOT_RECRUITING: '현재 모집 중인 반이 아닙니다.',
  PERMISSION_DENIED: '권한이 없습니다.',
  BRANCH_REQUIRED: '지점을 선택해주세요.',
  
  NAME_REQUIRED: '이름은 필수입니다.',
  CAPACITY_INVALID: '정원은 1명 이상이어야 합니다.',
  DATE_INVALID: '시작일은 종료일보다 이전이어야 합니다.',
  PRICE_INVALID: '가격은 0원 이상이어야 합니다.',
  ENROLLMENT_SAVE_FAILED: '수강 등록 저장에 실패했습니다.',
};


export const ACADEMY_DEFAULTS = {
  CLASS_CAPACITY: 10,
  CLASS_STATUS: CLASS_STATUS.DRAFT,
  
  PRICING_POLICY: PRICING_POLICY.FIXED,
  CURRENCY: 'KRW',
  DISPLAY_ORDER: 0,
  
  PAGE_SIZE: 20,
  PAGE_NUMBER: 0,
};


export const ACADEMY_FILTERS = {
  CATEGORIES: [
    { value: 'MATH', label: '수학' },
    { value: 'ENGLISH', label: '영어' },
    { value: 'KOREAN', label: '국어' },
    { value: 'SCIENCE', label: '과학' },
    { value: 'SOCIAL', label: '사회' },
    { value: 'ART', label: '예체능' },
    { value: 'ETC', label: '기타' },
  ],
  
  LEVELS: [
    { value: 'BEGINNER', label: '초급' },
    { value: 'INTERMEDIATE', label: '중급' },
    { value: 'ADVANCED', label: '고급' },
  ],
  
  SUBJECTS: [
    { value: 'MATH', label: '수학' },
    { value: 'ENGLISH', label: '영어' },
    { value: 'KOREAN', label: '국어' },
    { value: 'SCIENCE', label: '과학' },
    { value: 'SOCIAL', label: '사회' },
    { value: 'ART', label: '예체능' },
  ],
};

