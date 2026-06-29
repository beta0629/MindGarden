/**
 * EntityRowActions — overflow menu 단위 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EntityRowActions, { ENTITY_ROW_ACTIONS_LAYOUT } from '../EntityRowActions';

describe('EntityRowActions', () => {
  const baseItems = [
    { id: 'edit', label: '수정', onClick: jest.fn() },
    { id: 'delete', label: '삭제', onClick: jest.fn(), variant: 'destructive' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders overflow trigger and opens menu on click', () => {
    render(
      <EntityRowActions
        items={baseItems}
        layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
        ariaLabel="테스트 작업"
      />
    );

    const trigger = screen.getByRole('button', { name: '더보기' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('mg-button--ghost');
    expect(trigger).toHaveClass('mg-v2-entity-row-actions__trigger');
    expect(screen.queryByRole('menuitem', { name: '수정' })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
  });

  it('renders menu as vertical list structure', () => {
    render(<EntityRowActions items={baseItems} ariaLabel="테스트 작업" />);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));

    const menu = screen.getByRole('menu');
    const items = screen.getAllByRole('menuitem');

    expect(menu).toHaveClass('mg-v2-entity-row-actions__menu');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('수정');
    expect(items[1]).toHaveTextContent('삭제');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('invokes item onClick and closes menu', () => {
    render(<EntityRowActions items={baseItems} ariaLabel="테스트 작업" />);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '수정' }));

    expect(baseItems[0].onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem', { name: '수정' })).not.toBeInTheDocument();
  });

  it('renders destructive item after divider', () => {
    render(<EntityRowActions items={baseItems} ariaLabel="테스트 작업" />);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('renders optional primary action', () => {
    const onPrimary = jest.fn();
    render(
      <EntityRowActions
        items={baseItems}
        primaryAction={{ label: '상세보기', onClick: onPrimary }}
        ariaLabel="테스트 작업"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '상세보기' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('skips hidden items', () => {
    const items = [
      { id: 'edit', label: '수정', onClick: jest.fn(), hidden: true },
      { id: 'delete', label: '삭제', onClick: jest.fn(), variant: 'destructive' }
    ];
    render(<EntityRowActions items={items} ariaLabel="테스트 작업" />);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.queryByRole('menuitem', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
  });

  it('renders menu in document body via portal when open', () => {
    render(<EntityRowActions items={baseItems} ariaLabel="테스트 작업" />);

    fireEvent.click(screen.getByRole('button', { name: '더보기' }));

    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('mg-v2-entity-row-actions__menu--portal');
    expect(document.body.contains(menu)).toBe(true);
  });

  it('returns null when no visible items and no primary', () => {
    const { container } = render(
      <EntityRowActions items={[{ id: 'x', label: 'X', hidden: true }]} ariaLabel="빈" />
    );
    expect(container.firstChild).toBeNull();
  });
});
