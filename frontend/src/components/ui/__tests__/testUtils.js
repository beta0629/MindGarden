/**
 * ui 컴포넌트 테스트 공통
 */

import { Fragment } from 'react';

export const TestWrapper = ({ children }) => <Fragment>{children}</Fragment>;

export const TEST_DATA = {
  BUTTON_VARIANTS: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'outline'],
  BUTTON_SIZES: ['small', 'medium', 'large'],
  MODAL_SIZES: ['auto', 'small', 'medium', 'large', 'fullscreen'],
  MODAL_VARIANTS: ['default', 'confirm', 'form', 'detail', 'alert'],
  TABLE_STRIPES: [true, false],
  ROLES: ['CLIENT', 'CONSULTANT', 'ADMIN'],
  USERS: [{ id: 1, name: '홍길동', email: 'hong@example.com' }],
  COLUMNS: [
    { key: 'id', header: 'ID' },
    { key: 'name', header: '이름' },
    { key: 'email', header: '이메일' }
  ]
};

// __tests__ 내 헬퍼 파일이 단독 테스트 스위트로 수집되므로 최소 1개 테스트 유지
describe('testUtils', () => {
  it('exports TestWrapper and TEST_DATA', () => {
    expect(TestWrapper).toBeDefined();
    expect(TEST_DATA.COLUMNS.length).toBeGreaterThan(0);
  });
});
