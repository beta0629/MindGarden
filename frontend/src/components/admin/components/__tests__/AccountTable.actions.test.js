/**
 * AccountTable — EntityRowActions 액션 구성 스모크 (G2-07)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { buildAccountRowActions } from '../AccountTable';
import { EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../../common';

const handlers = {
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onToggleStatus: jest.fn(),
  onSetPrimary: jest.fn()
};

const baseAccount = {
  id: 42,
  bankName: '신한은행',
  accountNumber: '110-123-456789',
  isPrimary: false,
  isActive: true
};

describe('buildAccountRowActions (G2-07 Phase 1-C)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('primary 수정 + overflow 기본설정·상태변경·삭제', () => {
    const config = buildAccountRowActions(baseAccount, handlers);

    render(
      <EntityRowActions
        layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
        ariaLabel="계좌 작업"
        {...config}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(handlers.onEdit).toHaveBeenCalledWith(baseAccount);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '기본 계좌로 설정' }));
    expect(handlers.onSetPrimary).toHaveBeenCalledWith(42);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '활성 상태 변경' }));
    expect(handlers.onToggleStatus).toHaveBeenCalledWith(42);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '삭제' }));
    expect(handlers.onDelete).toHaveBeenCalledWith(42);
  });

  test('기본 계좌면 overflow에서 기본 설정 항목을 숨긴다', () => {
    const config = buildAccountRowActions(
      { ...baseAccount, isPrimary: true },
      handlers
    );

    render(
      <EntityRowActions
        layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
        ariaLabel="계좌 작업"
        {...config}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.queryByRole('menuitem', { name: '기본 계좌로 설정' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '활성 상태 변경' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
  });
});
