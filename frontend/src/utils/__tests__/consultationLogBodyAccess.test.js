import {
  canAccessConsultationLogBody,
  isConsultationLogBodyManager
} from '../consultationLogBodyAccess';

describe('consultationLogBodyAccess — 서버 가드와 같은 역할 규칙', () => {
  test.each([
    [{ id: 1, role: 'ADMIN' }, true, true],
    [{ id: 41, role: 'CONSULTANT' }, true, false],
    [{ id: 2, role: 'STAFF' }, false, false],
    [{ id: 2, role: 'STAFF', hasCounselorRole: true }, false, false],
    [{ id: 20, role: 'CLIENT' }, false, false],
    [null, false, false],
    [undefined, false, false],
    [{}, false, false]
  ])('%p → 본문 진입 %p, 관리자 %p', (user, canAccess, manager) => {
    expect(canAccessConsultationLogBody(user)).toBe(canAccess);
    expect(isConsultationLogBodyManager(user)).toBe(manager);
  });
});
