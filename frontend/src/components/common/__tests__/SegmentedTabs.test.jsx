/**
 * SegmentedTabs SSOT 단위 테스트
 *
 * MGBUTTON_SSOT_DESIGN_HANDOFF.md v1.1 (2026-06-05) 기반
 * 검증 대상:
 *  - 렌더링 (items, active state, badge)
 *  - 클릭 / onChange
 *  - a11y (role=tablist, role=tab, aria-selected)
 *  - 키보드 nav (ArrowLeft, ArrowRight, Home, End)
 *  - size variant (sm / md)
 *  - disabled item
 *
 * @author MindGarden
 * @since 2026-06-05
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import SegmentedTabs from '../SegmentedTabs';

const ITEMS = [
  { value: 'detail', label: '상세' },
  { value: 'notes', label: '특이사항', badge: 3 },
  { value: 'history', label: '히스토리' },
];

describe('SegmentedTabs SSOT 컴포넌트', () => {
  describe('렌더링', () => {
    test('items 만큼 탭이 그려진다', () => {
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={() => {}}
          ariaLabel="테스트 탭"
        />
      );
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    test('활성 탭에 mg-segmented-tabs__tab--active 클래스가 부여된다', () => {
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="notes"
          onChange={() => {}}
          ariaLabel="테스트 탭"
        />
      );
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveClass('mg-segmented-tabs__tab--active');
      expect(activeTab).toHaveTextContent('특이사항');
    });

    test('badge 가 있는 탭에 badge 노드가 표시된다', () => {
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={() => {}}
          ariaLabel="테스트 탭"
        />
      );
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('badge 가 undefined 인 탭에는 badge 노드가 없다', () => {
      render(
        <SegmentedTabs
          items={[{ value: 'a', label: 'A' }]}
          activeValue="a"
          onChange={() => {}}
          ariaLabel="테스트 탭"
        />
      );
      expect(screen.queryByText(/[0-9]+/)).not.toBeInTheDocument();
    });
  });

  describe('a11y', () => {
    test('role="tablist" + aria-label 이 설정된다', () => {
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={() => {}}
          ariaLabel="일정 상세 보기"
        />
      );
      const list = screen.getByRole('tablist');
      expect(list).toHaveAttribute('aria-label', '일정 상세 보기');
    });

    test('활성 탭만 aria-selected="true" + tabIndex=0', () => {
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="notes"
          onChange={() => {}}
          ariaLabel="테스트 탭"
        />
      );
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[0]).toHaveAttribute('tabIndex', '-1');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('상호작용', () => {
    test('탭 클릭 시 onChange 가 호출된다', () => {
      const onChange = jest.fn();
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={onChange}
          ariaLabel="테스트 탭"
        />
      );
      fireEvent.click(screen.getByText('특이사항'));
      expect(onChange).toHaveBeenCalledWith('notes');
    });

    test('disabled 탭 클릭 시 onChange 가 호출되지 않는다', () => {
      const onChange = jest.fn();
      const items = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ];
      render(
        <SegmentedTabs
          items={items}
          activeValue="a"
          onChange={onChange}
          ariaLabel="테스트 탭"
        />
      );
      fireEvent.click(screen.getByText('B'));
      expect(onChange).not.toHaveBeenCalled();
    });

    test('ArrowRight 키로 다음 탭 활성화', () => {
      const onChange = jest.fn();
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={onChange}
          ariaLabel="테스트 탭"
        />
      );
      const tabs = screen.getAllByRole('tab');
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith('notes');
    });

    test('ArrowLeft 키로 이전 탭 활성화 (wrap-around)', () => {
      const onChange = jest.fn();
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={onChange}
          ariaLabel="테스트 탭"
        />
      );
      const tabs = screen.getAllByRole('tab');
      fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenCalledWith('history');
    });

    test('Home 키로 첫 탭 활성화', () => {
      const onChange = jest.fn();
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="history"
          onChange={onChange}
          ariaLabel="테스트 탭"
        />
      );
      const tabs = screen.getAllByRole('tab');
      fireEvent.keyDown(tabs[2], { key: 'Home' });
      expect(onChange).toHaveBeenCalledWith('detail');
    });

    test('End 키로 마지막 탭 활성화', () => {
      const onChange = jest.fn();
      render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={onChange}
          ariaLabel="테스트 탭"
        />
      );
      const tabs = screen.getAllByRole('tab');
      fireEvent.keyDown(tabs[0], { key: 'End' });
      expect(onChange).toHaveBeenCalledWith('history');
    });
  });

  describe('size variant', () => {
    test('size="sm" 시 mg-segmented-tabs--sm 클래스가 부여된다', () => {
      const { container } = render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={() => {}}
          ariaLabel="테스트 탭"
          size="sm"
        />
      );
      expect(container.querySelector('.mg-segmented-tabs--sm')).toBeInTheDocument();
    });

    test('size 미지정 시 md 가 기본', () => {
      const { container } = render(
        <SegmentedTabs
          items={ITEMS}
          activeValue="detail"
          onChange={() => {}}
          ariaLabel="테스트 탭"
        />
      );
      expect(container.querySelector('.mg-segmented-tabs--md')).toBeInTheDocument();
    });
  });
});
