/**
 * ClientModal 삭제 모달 P1 hotfix 회귀 검증
 *
 * - type === 'delete' 진입 시 '누적 지표' (ContentSection) 가 렌더되지 않아야 한다.
 *   (회귀: renderSummaryStrip 이 'delete' 가드 누락으로 빈 ContentSection 노출)
 * - 경고 텍스트는 i18n 시드(admin:clientModal.delete.warning) 에서 ⚠️ 를 포함하고,
 *   JSX prefix 의 중복 이모지는 없어야 한다.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ClientModal from '../ClientModal';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false }))
  }
}));

// react-i18next 의 useTranslation 을 i18n 시드 키를 그대로 반환하는 형태로 모킹.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

const defaultDeleteProps = {
  type: 'delete',
  client: {
    id: 9001,
    name: '내담자 삭제 모달 검증',
    email: 'delete-target@example.com',
    phone: '010-1234-5678'
  },
  formData: {
    name: '내담자 삭제 모달 검증',
    email: 'delete-target@example.com',
    phone: '010-1234-5678',
    status: 'ACTIVE',
    grade: 'BRONZE'
  },
  setFormData: jest.fn(),
  onClose: jest.fn(),
  onSave: jest.fn(),
  userStatusOptions: []
};

describe('ClientModal 삭제 모달 P1 핫픽스', () => {
  it("type === 'delete' 일 때 '누적 지표' ContentSection 이 렌더되지 않는다", () => {
    render(<ClientModal {...defaultDeleteProps} />);
    expect(screen.queryByText('admin:clientModal.summary.title')).not.toBeInTheDocument();
  });

  it("type === 'delete' 일 때 경고 텍스트가 한 번만 노출되고 ⚠️ 가 중복되지 않는다", () => {
    render(<ClientModal {...defaultDeleteProps} />);
    const warning = screen.getByText('admin:clientModal.delete.warning');
    expect(warning).toBeInTheDocument();
    // JSX prefix 의 ⚠️ 가 제거되었으므로 노드 텍스트에 별도 prefix 가 없어야 한다.
    expect(warning.textContent).toBe('admin:clientModal.delete.warning');
  });

  it("type === 'delete' 일 때 SSOT 위반 wrapper 가 더 이상 렌더되지 않는다", () => {
    // UnifiedModal 본체가 카드/헤더 역할을 하므로 내부 중첩 wrapper
    // (mg-v2-modal-content, mg-v2-delete-confirmation) 와 중복 제목 <h3> 은
    // 제거되어야 한다. (이중 박스 회귀 방지)
    // UnifiedModal 은 ReactDOM.createPortal 로 document.body 에 렌더되므로
    // container 가 아닌 document.body 를 기준으로 조회한다.
    render(<ClientModal {...defaultDeleteProps} />);
    expect(document.body.querySelector('.mg-v2-modal-content')).toBeNull();
    expect(document.body.querySelector('.mg-v2-delete-confirmation')).toBeNull();
    expect(document.body.querySelector('.mg-v2-client-delete-modal h3')).toBeNull();
    expect(document.body.querySelector('.mg-v2-client-delete-modal')).not.toBeNull();
    expect(document.body.querySelector('.mg-v2-client-delete-modal__info')).not.toBeNull();
    expect(document.body.querySelector('.mg-v2-client-delete-modal__warning')).not.toBeNull();
  });

  it("type === 'delete' 일 때 정보 라인이 시맨틱 <dl>/<dt>/<dd> 구조로 렌더된다", () => {
    render(<ClientModal {...defaultDeleteProps} />);
    const dl = document.body.querySelector('dl.mg-v2-client-delete-modal__info');
    expect(dl).not.toBeNull();
    expect(dl.querySelectorAll('dt')).toHaveLength(3);
    expect(dl.querySelectorAll('dd')).toHaveLength(3);
  });
});
