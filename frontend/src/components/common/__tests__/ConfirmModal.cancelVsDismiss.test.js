import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal';

/**
 * ConfirmModal — 취소 버튼(onCancel)과 닫기(×·ESC·배경 = onClose) 구분 (PR R · B3).
 */

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('../../../contexts/SessionContext', () => {
  const ReactActual = jest.requireActual('react');
  return {
    SessionContext: ReactActual.createContext(null),
    useSession: () => ({ setModalOpen: jest.fn() })
  };
});

const renderModal = (props) => render(
  <ConfirmModal isOpen title="복구" message="불러올까요?" confirmText="불러오기" cancelText="버리기" {...props} />
);

describe('ConfirmModal — 취소 버튼과 닫기 구분', () => {
  it('onCancel 이 있으면 취소 버튼은 onCancel 만, ×·ESC·배경은 onClose 만 부른다', () => {
    const onCancel = jest.fn();
    const onClose = jest.fn();
    renderModal({ onCancel, onClose });

    fireEvent.click(screen.getByRole('button', { name: '버리기' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'action.close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('onCancel 이 없으면 취소 버튼도 onClose (기존 동작)', () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: '버리기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
