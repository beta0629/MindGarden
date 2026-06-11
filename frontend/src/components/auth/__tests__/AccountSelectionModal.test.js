/**
 * AccountSelectionModal — RTL 단위 테스트 (P1 silent first 차단).
 *
 * <p>일반 로그인(전화 + 비밀번호) 다중 매치 시 계정 선택 모달의 핵심 동작 검증:</p>
 * <ul>
 *   <li>다중 후보 카드 렌더링 + 카드 클릭 → `selectAccount` 호출</li>
 *   <li>실패 응답(예: 토큰 만료) → 오류 메시지 노출</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-11
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountSelectionModal from '../AccountSelectionModal';

jest.mock('../../../utils/ajax', () => {
  const actual = jest.requireActual('../../../utils/ajax');
  return {
    __esModule: true,
    ...actual,
    authAPI: {
      ...actual.authAPI,
      selectAccount: jest.fn()
    }
  };
});

const apiModule = require('../../../utils/ajax');

const buildCandidates = () => [
  {
    userId: 11,
    role: 'CONSULTANT',
    roleDisplayLabel: '상담사',
    dashboardGuide: '로그인 시 상담사 대시보드로 이동합니다.',
    optionLabel: '상담사 계정 (ID: 11)',
    maskedEmail: 'a***@example.com',
    branchName: '인천 본점'
  },
  {
    userId: 22,
    role: 'ADMIN',
    roleDisplayLabel: '관리자',
    dashboardGuide: '로그인 시 관리자 대시보드로 이동합니다.',
    optionLabel: '관리자 계정 (ID: 22)',
    maskedEmail: 'b***@example.com'
  }
];

const baseProps = () => ({
  isOpen: true,
  onClose: jest.fn(),
  candidates: buildCandidates(),
  selectionToken: 'sel-jwt-token',
  onSelected: jest.fn(),
  onRequiresConfirmation: jest.fn(),
  onError: jest.fn()
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AccountSelectionModal — 다중 매치 카드 선택', () => {
  test('후보 2명 카드 렌더 + 클릭 시 selectAccount 호출 후 onSelected 트리거', async() => {
    const props = baseProps();
    apiModule.authAPI.selectAccount.mockResolvedValue({
      success: true,
      data: { user: { id: 22 }, sessionId: 'sess-x' }
    });

    render(<AccountSelectionModal {...props} />);

    expect(screen.getByText('연결할 계정을 선택해주세요')).toBeInTheDocument();
    expect(screen.getByText('상담사')).toBeInTheDocument();
    expect(screen.getByText('관리자')).toBeInTheDocument();
    expect(screen.getByText('a***@example.com')).toBeInTheDocument();
    expect(screen.getByText('인천 본점')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('account-selection-candidate-22'));

    await waitFor(() => {
      expect(apiModule.authAPI.selectAccount).toHaveBeenCalledWith({
        selectionToken: 'sel-jwt-token',
        selectedUserId: 22
      });
    });
    await waitFor(() => {
      expect(props.onSelected).toHaveBeenCalledTimes(1);
    });
    const arg = props.onSelected.mock.calls[0][0];
    expect(arg.selectedUserId).toBe(22);
    expect(props.onError).not.toHaveBeenCalled();
  });

  test('selectAccount 실패(토큰 만료) → 오류 메시지 노출 + onError 호출', async() => {
    const props = baseProps();
    apiModule.authAPI.selectAccount.mockResolvedValue({
      success: false,
      message: '선택 정보가 만료되었습니다. 다시 로그인해주세요.'
    });

    render(<AccountSelectionModal {...props} />);

    fireEvent.click(screen.getByTestId('account-selection-candidate-11'));

    await waitFor(() => {
      expect(props.onError).toHaveBeenCalledTimes(1);
    });
    expect(props.onSelected).not.toHaveBeenCalled();
    expect(screen.getByTestId('account-selection-error')).toHaveTextContent('만료');
  });
});
