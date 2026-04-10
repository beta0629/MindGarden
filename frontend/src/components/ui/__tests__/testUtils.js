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
