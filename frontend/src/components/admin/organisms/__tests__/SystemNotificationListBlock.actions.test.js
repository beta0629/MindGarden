/**
 * SystemNotificationListBlock — EntityRowActions 액션 구성 스모크
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { buildNotificationRowActions } from '../SystemNotificationListBlock';
import { EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../../common';

const handlers = {
  onPublish: jest.fn(),
  onArchive: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn()
};

const baseNotification = { id: 99, title: '테스트', status: 'DRAFT' };

describe('buildNotificationRowActions (G1-03 P2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('DRAFT: primary 게시 + overflow 수정·삭제', () => {
    const config = buildNotificationRowActions(
      { ...baseNotification, status: 'DRAFT' },
      handlers,
      '수정',
      '삭제'
    );

    render(
      <EntityRowActions
        layout={ENTITY_ROW_ACTIONS_LAYOUT.CARD}
        ariaLabel="공지 작업"
        {...config}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '게시' }));
    expect(handlers.onPublish).toHaveBeenCalledWith(99);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '수정' }));
    expect(handlers.onEdit).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '삭제' }));
    expect(handlers.onDelete).toHaveBeenCalledWith(99);
  });

  test('PUBLISHED: primary 보관 + overflow 수정·삭제', () => {
    const config = buildNotificationRowActions(
      { ...baseNotification, status: 'PUBLISHED' },
      handlers,
      '수정',
      '삭제'
    );

    render(
      <EntityRowActions
        layout={ENTITY_ROW_ACTIONS_LAYOUT.CARD}
        ariaLabel="공지 작업"
        {...config}
      />
    );

    expect(screen.getByRole('button', { name: '보관' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.getByRole('menuitem', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
  });

  test('ARCHIVED: primary 수정 + overflow 삭제만', () => {
    const config = buildNotificationRowActions(
      { ...baseNotification, status: 'ARCHIVED' },
      handlers,
      '수정',
      '삭제'
    );

    render(
      <EntityRowActions
        layout={ENTITY_ROW_ACTIONS_LAYOUT.CARD}
        ariaLabel="공지 작업"
        {...config}
      />
    );

    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.queryByRole('menuitem', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
  });
});
