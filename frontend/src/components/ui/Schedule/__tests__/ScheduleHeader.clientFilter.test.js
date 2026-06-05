/**
 * ScheduleHeader — 통합 스케줄 상단 컴팩트 내담자 다중 필터 노출/동작 회귀 테스트.
 *
 * 검증 매트릭스:
 *  - F1: showClientFilter 미전달(false) → 칩-버튼 미노출 (다른 캘린더 라우트 회귀 0)
 *  - F2: showClientFilter true + 선택 0 → "내담자 필터" placeholder 라벨 단일 라인
 *  - F3: showClientFilter true + 선택 N → "내담자 N명" 압축 라벨 + × 버튼 (다중 칩 wrap 금지)
 *  - F4: 트리거 클릭 시 팝오버 열림(`role="dialog"`) + 검색·체크박스·완료/초기화 노출
 *  - F5: 옵션 체크 시 onClientFilterChange 호출 (선택 추가)
 *  - F6: × 버튼 클릭 시 onClientFilterChange([]) 호출 (전체 초기화)
 *
 * @author MindGarden core-coder
 * @since 2026-06-09
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, options) => {
      if (options && typeof options === 'object' && options.defaultValue) {
        if (typeof options.count === 'number') {
          return String(options.defaultValue).replace('{{count}}', String(options.count));
        }
        return options.defaultValue;
      }
      return key;
    }
  })
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: ({ className } = {}) => className || '',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../../common/MGButton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, onClick, ...rest }) => (
      React.createElement('button', { type: 'button', onClick, ...rest }, children)
    )
  };
});

import ScheduleHeader from '../ScheduleHeader';

const adminRole = 'ADMIN';

const baseProps = (overrides = {}) => ({
  userRole: adminRole,
  consultants: [],
  selectedConsultantId: '',
  loadingConsultants: false,
  onConsultantChange: jest.fn(),
  onRefresh: jest.fn(),
  hideTitle: true,
  ...overrides
});

const sampleClients = [
  { id: 11, name: '김철수', phone: '010-1111-2222', email: 'kim@example.com' },
  { id: 22, name: '박영희', phone: '010-3333-4444', email: 'park@example.com' },
  { id: 33, name: '이민수', phone: '010-5555-6666', email: 'lee@example.com' }
];

describe('ScheduleHeader — 내담자 다중 필터 (calendarSkin=integrated 한정)', () => {
  // ─── F1 ────────────────────────────────────────────────────────────
  test('F1: showClientFilter 미전달 → 칩-버튼 미노출 (다른 캘린더 라우트 회귀 0)', () => {
    render(<ScheduleHeader {...baseProps()} />);
    expect(screen.queryByRole('combobox', { name: /내담자 필터/ })).toBeNull();
  });

  // ─── F2 ────────────────────────────────────────────────────────────
  test('F2: showClientFilter true + 선택 0 → "내담자 필터" 단일 라인 placeholder', () => {
    const { container } = render(
      <ScheduleHeader
        {...baseProps({
          showClientFilter: true,
          clients: sampleClients,
          selectedClientIds: [],
          onClientFilterChange: jest.fn()
        })}
      />
    );
    const trigger = container.querySelector('.mg-client-filter--trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('내담자 필터');
    expect(trigger.classList.contains('mg-client-filter--empty')).toBe(true);
    expect(trigger.classList.contains('mg-client-filter--has-selection')).toBe(false);
  });

  // ─── F3 ────────────────────────────────────────────────────────────
  test('F3: showClientFilter true + 선택 N → "내담자 N명" 압축 라벨 + × 버튼 (단일 라인)', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ScheduleHeader
        {...baseProps({
          showClientFilter: true,
          clients: sampleClients,
          selectedClientIds: [11, 22, 33],
          onClientFilterChange: onChange
        })}
      />
    );
    const trigger = container.querySelector('.mg-client-filter--trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.classList.contains('mg-client-filter--has-selection')).toBe(true);
    expect(trigger.textContent).toContain('내담자 3명');
    // × 버튼 노출
    expect(trigger.querySelector('.mg-client-filter__clear')).toBeTruthy();
    // 체크된 옵션을 다중 칩으로 wrap 금지: trigger 내부에 chip 컬렉션이 없어야 한다.
    expect(trigger.querySelectorAll('.mg-chip-multi-select__chip').length).toBe(0);
  });

  // ─── F4 ────────────────────────────────────────────────────────────
  test('F4: 트리거 클릭 시 팝오버 열림 + 검색/리스트/액션 노출', () => {
    const onChange = jest.fn();
    render(
      <ScheduleHeader
        {...baseProps({
          showClientFilter: true,
          clients: sampleClients,
          selectedClientIds: [],
          onClientFilterChange: onChange
        })}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    // 검색 입력
    const search = within(dialog).getByRole('searchbox');
    expect(search).toBeTruthy();
    // listbox + multi select
    const listbox = within(dialog).getByRole('listbox');
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    // 옵션 3개 노출
    const options = within(listbox).getAllByRole('option');
    expect(options.length).toBe(3);
    // 액션 버튼
    expect(within(dialog).getByText('초기화')).toBeTruthy();
    expect(within(dialog).getByText('완료')).toBeTruthy();
  });

  // ─── F5 ────────────────────────────────────────────────────────────
  test('F5: 옵션 체크 시 onClientFilterChange 호출 (선택 추가)', () => {
    const onChange = jest.fn();
    render(
      <ScheduleHeader
        {...baseProps({
          showClientFilter: true,
          clients: sampleClients,
          selectedClientIds: [],
          onClientFilterChange: onChange
        })}
      />
    );
    fireEvent.click(screen.getByRole('combobox'));
    const dialog = screen.getByRole('dialog');
    const firstOption = within(dialog).getAllByRole('option')[0];
    fireEvent.click(firstOption);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([11]);
  });

  // ─── F6 ────────────────────────────────────────────────────────────
  test('F6: × 버튼 클릭 시 onClientFilterChange([]) 호출 (전체 초기화)', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ScheduleHeader
        {...baseProps({
          showClientFilter: true,
          clients: sampleClients,
          selectedClientIds: [11, 22],
          onClientFilterChange: onChange
        })}
      />
    );
    const clearBtn = container.querySelector('.mg-client-filter__clear');
    expect(clearBtn).toBeTruthy();
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
