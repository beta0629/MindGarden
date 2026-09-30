/**
 * MatchingScheduleSidebar — 가예약 헤더 「목록」·「당일 결제」 세로 정렬 잠금
 *
 *  - 카드 행·버튼 묶음: display:flex + align-items:center
 *  - 버튼: 전역 .mg-v2-button-primary margin-top 누수 차단(margin-top:0)
 *  - 두 버튼 동일 사이즈 클래스(mg-button--small · mg-v2-button-sm)
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MatchingScheduleSidebar from '../MatchingScheduleSidebar';

const fs = require('fs');
const path = require('path');

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts && opts.defaultValue != null) {
        if (typeof opts.defaultValue === 'string' && opts.count != null) {
          return opts.defaultValue.replace('{{count}}', String(opts.count));
        }
        return opts.defaultValue;
      }
      return key;
    }
  })
}));

jest.mock('../../../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('../../../../../dashboard-v2/atoms/SearchInput', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../MatchingScheduleList', () => ({
  __esModule: true,
  default: () => <div data-testid="matching-list" />
}));

jest.mock('../../molecules/DensityToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="density-toggle" />
}));

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '..');
const CSS_PATH = 'src/components/admin/mapping-management/IntegratedMatchingSchedule.css';
const css = fs.readFileSync(path.join(FRONTEND_ROOT, CSS_PATH), 'utf8');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ruleBodies = (selector) => {
  const re = new RegExp(`(?:^|\\})\\s*(?:/\\*[\\s\\S]*?\\*/\\s*)?${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, 'g');
  return [...css.matchAll(re)].map((m) => m[1]);
};

const SIDEBAR = '.integrated-schedule__pending-payment-alert--sidebar';
const CARD = '.integrated-schedule__pending-payment-alert';
const ACTIONS = `${SIDEBAR} .integrated-schedule__pending-payment-alert-actions`;
const ACTION_BUTTON = `${ACTIONS} .mg-button`;

describe('가예약 헤더 정렬 CSS', () => {
  test('카드 행은 flex + align-items:center', () => {
    const [base] = ruleBodies(CARD);
    expect(base).toMatch(/display:\s*flex/);
    expect(base).toMatch(/align-items:\s*center/);
  });

  test('사이드바 카드는 한 줄 유지(flex-wrap:nowrap) · 간격은 space-2 토큰', () => {
    const body = ruleBodies(SIDEBAR).join('\n');
    expect(body).toMatch(/flex-wrap:\s*nowrap/);
    expect(body).toMatch(/gap:\s*var\(--mg-v2-space-2\)/);
  });

  test('버튼 묶음은 flex + align-items:center + nowrap', () => {
    const body = ruleBodies(ACTIONS).join('\n');
    expect(body).toMatch(/display:\s*flex/);
    expect(body).toMatch(/align-items:\s*center/);
    expect(body).toMatch(/flex-wrap:\s*nowrap/);
  });

  test('버튼 margin-top:0 으로 전역 margin-top 누수 차단 · raw hex 없음', () => {
    const body = ruleBodies(ACTION_BUTTON).join('\n');
    expect(body).toMatch(/margin-top:\s*0/);
    expect(body).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('가예약 헤더 버튼 사이즈 클래스', () => {
  test('「목록」·「당일 결제」는 같은 flex 묶음 안에서 같은 사이즈 클래스', () => {
    render(
      <MatchingScheduleSidebar
        isCollapsed={false}
        onToggle={jest.fn()}
        filteredMappings={[]}
        loading={false}
        viewFilter="new"
        onViewFilterChange={jest.fn()}
        statusFilter=""
        onStatusFilterChange={jest.fn()}
        getStatusCount={() => 0}
        gareyarkCard={{
          count: 2,
          firstPending: { id: 1 },
          onOpenList: jest.fn(),
          onCheckout: jest.fn()
        }}
      />
    );

    const card = screen.getByTestId('integrated-schedule-pending-payment-alert');
    const actions = card.querySelector('.integrated-schedule__pending-payment-alert-actions');
    const listButton = screen.getByRole('button', { name: '목록' });
    const payButton = screen.getByRole('button', { name: '당일 결제' });

    expect(card).toHaveClass('integrated-schedule__pending-payment-alert--sidebar');
    expect(actions).toContainElement(listButton);
    expect(actions).toContainElement(payButton);
    [listButton, payButton].forEach((button) => {
      expect(button).toHaveClass('mg-button', 'mg-button--small', 'mg-v2-button', 'mg-v2-button-sm');
    });
  });
});
