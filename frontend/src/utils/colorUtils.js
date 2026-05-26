import i18n from '../i18n';
/**
 * 색상 유틸리티 함수
/**
 * Phase 2: 공통 색상 유틸리티 함수 생성
/**
 * 
/**
 * CSS 변수를 JavaScript에서 사용하기 위한 헬퍼 함수들
 */

/**
 * 상담 상태에 따른 CSS 변수 반환
/**
 * @param {string} status - 상담 상태
/**
 * @returns {string} CSS 변수명
 */
export const getStatusColor = (status) => {
  const statusMap = {
    'REQUESTED': 'var(--status-requested)',
    'ASSIGNED': 'var(--status-assigned)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CONFIRMED': 'var(--status-confirmed)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'IN_PROGRESS': 'var(--status-in-progress)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': 'var(--status-completed)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CANCELLED': 'var(--status-cancelled)',
    'NO_SHOW': 'var(--status-no-show)'
  };
  
  return statusMap[status] || 'var(--user-inactive)';
};

/**
 * 상담 상태에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} status - 상담 상태
/**
 * @returns {string} CSS 변수명
 */
export const getStatusBgColor = (status) => {
  const statusMap = {
    'REQUESTED': 'var(--status-requested-bg)',
    'ASSIGNED': 'var(--status-assigned-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CONFIRMED': 'var(--status-confirmed-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'IN_PROGRESS': 'var(--status-in-progress-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': 'var(--status-completed-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CANCELLED': 'var(--status-cancelled-bg)'
  };
  
  return statusMap[status] || 'var(--cs-glass-gray-light)';
};

/**
 * 결제 상태에 따른 CSS 변수 반환
/**
 * @param {string} status - 결제 상태
/**
 * @returns {string} CSS 변수명
 */
export const getPaymentColor = (status) => {
  const paymentMap = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'PENDING': 'var(--payment-pending)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': 'var(--payment-completed)',
    'FAILED': 'var(--payment-failed)',
    'REFUNDED': 'var(--payment-refunded)'
  };
  
  return paymentMap[status] || 'var(--user-inactive)';
};

/**
 * 사용자 상태에 따른 CSS 변수 반환
/**
 * @param {string} status - 사용자 상태
/**
 * @returns {string} CSS 변수명
 */
export const getUserStatusColor = (status) => {
  const userMap = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'ACTIVE': 'var(--user-active)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'INACTIVE': 'var(--user-inactive)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'SUSPENDED': 'var(--user-suspended)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'PENDING': 'var(--user-pending)'
  };
  
  return userMap[status] || 'var(--user-inactive)';
};

/**
 * 상담사 등급에 따른 CSS 변수 반환
/**
 * @param {string} grade - 상담사 등급
/**
 * @returns {string} CSS 변수명
 */
export const getGradeColor = (grade) => {
  const gradeMap = {
    'JUNIOR': 'var(--grade-junior)',
    'SENIOR': 'var(--grade-senior)',
    'EXPERT': 'var(--grade-expert)',
    'MASTER': 'var(--grade-master)'
  };
  
  return gradeMap[grade] || 'var(--user-inactive)';
};

/**
 * 상담사 등급에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} grade - 상담사 등급
/**
 * @returns {string} CSS 변수명
 */
export const getGradeBgColor = (grade) => {
  const gradeMap = {
    'JUNIOR': 'var(--grade-junior-bg)',
    'SENIOR': 'var(--grade-senior-bg)',
    'EXPERT': 'var(--grade-expert-bg)',
    'MASTER': 'var(--grade-master-bg)'
  };
  
  return gradeMap[grade] || 'var(--cs-glass-gray-light)';
};

/**
 * 역할에 따른 CSS 변수 반환
/**
 * @param {string} role - 사용자 역할
/**
 * @returns {string} CSS 변수명
 */
export const getRoleColor = (role) => {
  const roleMap = {
    'CLIENT': 'var(--role-client)',
    'CONSULTANT': 'var(--role-consultant)',
    'ADMIN': 'var(--role-admin)',
    'STAFF': 'var(--role-admin)'
  };
  
  return roleMap[role] || 'var(--user-inactive)';
};

/**
 * 역할에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} role - 사용자 역할
/**
 * @returns {string} CSS 변수명
 */
export const getRoleBgColor = (role) => {
  const roleMap = {
    'CLIENT': 'var(--role-client-bg)',
    'CONSULTANT': 'var(--role-consultant-bg)',
    'ADMIN': 'var(--role-admin-bg)'
  };
  
  return roleMap[role] || 'var(--cs-glass-gray-light)';
};

/**
 * 휴가 유형에 따른 CSS 변수 반환
/**
 * @param {string} type - 휴가 유형
/**
 * @returns {string} CSS 변수명
 */
export const getVacationColor = (type) => {
  const vacationMap = {
    'ANNUAL': 'var(--vacation-annual)',
    'SICK': 'var(--vacation-sick)',
    'PERSONAL': 'var(--vacation-personal)',
    'MATERNITY': 'var(--vacation-maternity)',
    'PATERNITY': 'var(--vacation-paternity)',
    'OTHER': 'var(--vacation-other)'
  };
  
  return vacationMap[type] || 'var(--user-inactive)';
};

/**
 * 휴가 유형에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} type - 휴가 유형
/**
 * @returns {string} CSS 변수명
 */
export const getVacationBgColor = (type) => {
  const vacationMap = {
    'ANNUAL': 'var(--vacation-annual-bg)',
    'SICK': 'var(--vacation-sick-bg)',
    'PERSONAL': 'var(--vacation-personal-bg)'
  };
  
  return vacationMap[type] || 'var(--cs-glass-gray-light)';
};

/**
 * 상태에 따른 한글 라벨 반환
/**
 * @param {string} status - 상태 코드
/**
 * @returns {string} 한글 라벨
 */
export const getStatusLabel = (status) => {
  const labelMap = {
    'REQUESTED': i18n.t('common:utils.colorUtils.t_ffcc5746'),
    'ASSIGNED': i18n.t('common:utils.colorUtils.t_2222c553'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CONFIRMED': i18n.t('common:utils.colorUtils.t_55536106'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'BOOKED': i18n.t('common:utils.colorUtils.t_17f4b478'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'IN_PROGRESS': i18n.t('common:utils.colorUtils.t_0dae9079'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': i18n.t('common:utils.colorUtils.t_8d868037'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CANCELLED': i18n.t('common:utils.colorUtils.t_3aa9e7ee'),
    'NO_SHOW': i18n.t('common:utils.colorUtils.t_70e1136a'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'PENDING': i18n.t('common:utils.colorUtils.t_9b3a3ba2'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'ACTIVE': i18n.t('common:utils.colorUtils.t_6a2123a3'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'INACTIVE': i18n.t('common:utils.colorUtils.t_fae2014b'),
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'SUSPENDED': i18n.t('common:utils.colorUtils.t_1d441e78')
  };
  
  return labelMap[status] || status;
};

/**
 * 등급에 따른 한글 라벨 반환
/**
 * @param {string} grade - 등급 코드
/**
 * @returns {string} 한글 라벨
 */
export const getGradeLabel = (grade) => {
  const labelMap = {
    'JUNIOR': i18n.t('common:utils.colorUtils.t_d6ebcb35'),
    'SENIOR': i18n.t('common:utils.colorUtils.t_68a6a8b6'),
    'EXPERT': i18n.t('common:utils.colorUtils.t_44bd2ea1'),
    'MASTER': i18n.t('common:utils.colorUtils.t_5f6cf8e4')
  };
  
  return labelMap[grade] || grade;
};

/**
 * 역할에 따른 한글 라벨 반환
/**
 * @param {string} role - 역할 코드
/**
 * @returns {string} 한글 라벨
 */
export const getRoleLabel = (role) => {
  const labelMap = {
    'CLIENT': i18n.t('common:utils.colorUtils.t_82bba86b'),
    'CONSULTANT': i18n.t('common:utils.colorUtils.t_293bb79c'),
    'ADMIN': i18n.t('common:utils.colorUtils.t_ec873cb1'),
    'STAFF': i18n.t('common:utils.colorUtils.t_dd38bda1')
  };
  
  return labelMap[role] || role;
};

