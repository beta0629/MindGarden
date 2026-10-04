/**
 * 상담일지 본문(읽기·작성·수정) 접근 — 화면 공통 판정 SSOT.
 *
 * <p>서버 ConsultationRecordAccessGuard 와 같은 역할 규칙이다. 본문은 작성 상담사(작성자 여부는 서버가
 * 판정)와 같은 테넌트 관리자(ADMIN)만 다룬다. 사무원(STAFF)·내담자는 본문 진입 버튼·모달을 노출하지
 * 않는다. 화면마다 역할을 직접 비교하지 말고 이 모듈만 쓴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import { RoleUtils } from '../constants/roles';

export const CONSULTATION_LOG_BODY_ACCESS_STRINGS = {
  RESTRICTED: '상담일지 내용은 작성 상담사와 관리자만 열람·작성할 수 있습니다.'
};

/**
 * 작성자가 아니어도 본문을 다룰 수 있는 관리자인지 (ADMIN 만).
 *
 * @param {object|null|undefined} user 세션 사용자
 * @returns {boolean}
 */
export const isConsultationLogBodyManager = (user) => RoleUtils.isAdmin(user);

/**
 * 상담일지 본문 진입(작성·보기·수정 버튼, 일지 모달)을 노출해도 되는 사용자인지.
 *
 * @param {object|null|undefined} user 세션 사용자
 * @returns {boolean} ADMIN 또는 상담사면 true, STAFF·CLIENT·미로그인은 false
 */
export const canAccessConsultationLogBody = (user) => {
  if (isConsultationLogBodyManager(user)) {
    return true;
  }
  if (RoleUtils.isStaff(user) || RoleUtils.isClient(user)) {
    return false;
  }
  return RoleUtils.isConsultant(user);
};
