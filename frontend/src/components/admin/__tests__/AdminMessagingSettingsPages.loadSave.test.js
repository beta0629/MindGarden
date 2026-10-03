/**
 * 카카오 알림톡·SMS 설정 페이지 — StandardizedApi 응답 형태별 로드·저장 판정 회귀.
 *
 * ajax 가 `{ success, data }` 를 풀어 DTO 만 반환하므로 200 응답을 실패로 보면 안 된다.
 * 로드 실패 시에는 빈 폼으로 저장값을 덮어쓰지 않도록 저장 버튼·토글을 막는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() }
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

jest.mock('../../dashboard-v2/content', () => ({
  __esModule: true,
  ContentArea: ({ children }) => <div>{children}</div>,
  ContentHeader: ({ title }) => <h1>{title}</h1>,
  ContentSection: ({ children }) => <section>{children}</section>
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', loading }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled || loading}>
      {children}
    </button>
  )
}));

jest.mock('../../common/SafeErrorDisplay', () => ({
  __esModule: true,
  default: ({ error }) => (error ? <div role="alert">{String(error.message || error)}</div> : null)
}));

jest.mock('../../common/molecules/SettingSwitchRow', () => ({
  __esModule: true,
  default: ({ id, checked, disabled, onCheckedChange, ariaLabel }) => (
    <input
      id={id}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  )
}));

jest.mock('../../../hooks', () => ({
  __esModule: true,
  useConfirm: () => [jest.fn(() => Promise.resolve(true)), () => null],
  useSettingToggleSave: ({ value, onValueChange, save }) => ({
    busy: false,
    disabled: false,
    onCheckedChange: async(next) => {
      onValueChange(next);
      try {
        await save(next);
      } catch (e) {
        onValueChange(value);
      }
    }
  })
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn() }
}));

jest.mock('react-router-dom', () => {
  const mockNavigate = jest.fn();
  return { __esModule: true, useNavigate: () => mockNavigate };
});

jest.mock('../../../contexts/SessionContext', () => {
  const mockSession = {
    user: { id: 1, role: 'ADMIN' },
    isLoggedIn: true,
    isLoading: false
  };
  return { __esModule: true, useSession: () => mockSession };
});

jest.mock('../../../constants/roles', () => ({
  __esModule: true,
  RoleUtils: { isAdmin: () => true, isStaff: () => false }
}));

jest.mock('react-i18next', () => {
  const mockT = (key, fallback) => (typeof fallback === 'string' ? fallback : key);
  const mockTranslation = { t: mockT };
  return { __esModule: true, useTranslation: () => mockTranslation };
});

import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import AdminKakaoAlimtalkSettingsPage from '../AdminKakaoAlimtalkSettingsPage';
import AdminTenantSmsSettingsPage from '../AdminTenantSmsSettingsPage';

const KAKAO_DTO = {
  tenantId: 'tenant-a',
  alimtalkEnabled: true,
  templateConsultationConfirmed: 'TPL_CONFIRMED',
  kakaoApiKeyRef: 'ref-api'
};

const SMS_DTO = {
  tenantId: 'tenant-a',
  smsEnabled: true,
  provider: 'provider-x',
  senderNumber: '0000',
  apiKeyRef: 'ref-key',
  apiSecretRef: 'ref-secret'
};

const PAGES = [
  {
    name: 'AdminKakaoAlimtalkSettingsPage',
    Component: AdminKakaoAlimtalkSettingsPage,
    dto: KAKAO_DTO,
    saveLabel: 'settings:kakao.action.saveTemplatesAndRefs',
    loadFailKey: 'settings:kakao.loadFail',
    saveFailKey: 'settings:kakao.saveFail',
    saveSuccessKey: 'settings:kakao.saveSuccess',
    filledInputValue: 'TPL_CONFIRMED',
    toggleLabel: 'settings:kakao.enabledLabel'
  },
  {
    name: 'AdminTenantSmsSettingsPage',
    Component: AdminTenantSmsSettingsPage,
    dto: SMS_DTO,
    saveLabel: 'settings:sms.action.saveRefs',
    loadFailKey: 'settings:sms.loadFail',
    saveFailKey: 'settings:sms.saveFail',
    saveSuccessKey: 'settings:sms.saveSuccess',
    filledInputValue: 'provider-x',
    toggleLabel: 'settings:sms.enabledLabel'
  }
];

describe.each(PAGES)('$name — 응답 형태별 로드·저장', (page) => {
  const { Component, dto } = page;
  const getSaveButton = () => screen.getByRole('button', { name: page.saveLabel });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ajax 가 풀어준 DTO(200) 를 성공으로 보고 폼을 채우며 저장을 허용한다', async() => {
    StandardizedApi.get.mockResolvedValue({ ...dto });
    render(<Component />);

    await waitFor(() => expect(screen.getByDisplayValue(page.filledInputValue)).toBeInTheDocument());
    expect(screen.queryByText(page.loadFailKey)).not.toBeInTheDocument();
    expect(getSaveButton()).not.toBeDisabled();
    expect(screen.getByLabelText(page.toggleLabel)).not.toBeDisabled();
  });

  it('래퍼가 남은 { success: true, data } 응답도 성공으로 처리한다', async() => {
    StandardizedApi.get.mockResolvedValue({ success: true, data: { ...dto } });
    render(<Component />);

    await waitFor(() => expect(screen.getByDisplayValue(page.filledInputValue)).toBeInTheDocument());
    expect(getSaveButton()).not.toBeDisabled();
  });

  it('로드가 예외로 실패하면 저장 버튼과 토글을 막고 PUT 을 보내지 않는다', async() => {
    StandardizedApi.get.mockRejectedValue(new Error('network down'));
    const { container } = render(<Component />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(getSaveButton()).toBeDisabled();
    expect(screen.getByLabelText(page.toggleLabel)).toBeDisabled();

    fireEvent.submit(container.querySelector('form'));
    expect(StandardizedApi.put).not.toHaveBeenCalled();
  });

  it('{ success: false } 응답이면 로드 실패로 보고 저장을 막는다', async() => {
    StandardizedApi.get.mockResolvedValue({ success: false, message: 'denied' });
    render(<Component />);

    await waitFor(() => expect(screen.getByText(page.loadFailKey)).toBeInTheDocument());
    expect(getSaveButton()).toBeDisabled();
  });

  it('null 응답(세션 리다이렉트)이면 로드 실패로 보고 저장을 막는다', async() => {
    StandardizedApi.get.mockResolvedValue(null);
    render(<Component />);

    await waitFor(() => expect(screen.getByText(page.loadFailKey)).toBeInTheDocument());
    expect(getSaveButton()).toBeDisabled();
  });

  it('저장 PUT 이 DTO(200) 를 돌려주면 성공 알림을 띄우고 실패 문구를 보이지 않는다', async() => {
    StandardizedApi.get.mockResolvedValue({ ...dto });
    StandardizedApi.put.mockResolvedValue({ ...dto });
    render(<Component />);

    await waitFor(() => expect(getSaveButton()).not.toBeDisabled());
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(StandardizedApi.put).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(notificationManager.success).toHaveBeenCalledWith(page.saveSuccessKey));
    expect(screen.queryByText(page.saveFailKey)).not.toBeInTheDocument();
  });

  it('저장 PUT 이 { success: false } 면 실패 문구를 보인다', async() => {
    StandardizedApi.get.mockResolvedValue({ ...dto });
    StandardizedApi.put.mockResolvedValue({ success: false, message: 'no' });
    render(<Component />);

    await waitFor(() => expect(getSaveButton()).not.toBeDisabled());
    fireEvent.click(getSaveButton());

    await waitFor(() => expect(screen.getByText(page.saveFailKey)).toBeInTheDocument());
    expect(notificationManager.success).not.toHaveBeenCalled();
  });

  it('토글 PUT 이 DTO(200) 를 돌려주면 실패 알림 없이 성공으로 끝난다', async() => {
    StandardizedApi.get.mockResolvedValue({ ...dto });
    StandardizedApi.put.mockResolvedValue({ ...dto, [Object.keys(dto)[1]]: false });
    render(<Component />);

    const toggle = await screen.findByLabelText(page.toggleLabel);
    await waitFor(() => expect(toggle).not.toBeDisabled());
    fireEvent.click(toggle);

    await waitFor(() => expect(StandardizedApi.put).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(toggle).not.toBeChecked());
  });
});
