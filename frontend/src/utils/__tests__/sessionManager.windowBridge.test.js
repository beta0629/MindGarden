/**
 * sessionManager 싱글톤을 window에 노출하는 브리지(apiHeaders 등 동기 소비자) 회귀 방지
 */
import { sessionManager } from '../sessionManager';

describe('sessionManager window bridge', () => {
  it('브라우저 환경에서 window.sessionManager가 export된 싱글톤과 동일', () => {
    expect(window.sessionManager).toBe(sessionManager);
  });

  it('동기 소비자가 기대하는 핵심 메서드 존재', () => {
    expect(typeof sessionManager.getUser).toBe('function');
    expect(typeof sessionManager.checkSession).toBe('function');
  });
});
