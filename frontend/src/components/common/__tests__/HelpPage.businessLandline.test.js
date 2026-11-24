/**
 * HelpPage — businessLandline 표시·tel 버튼 조건부 렌더
 *
 * @author CoreSolution
 * @since 2026-03-24
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HelpPage from '../HelpPage';

jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  fetchTenantPublicHomeMeta: jest.fn()
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children }) => <div data-testid="content-area">{children}</div>,
  ContentHeader: ({ title, subtitle }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}));

jest.mock('../MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, type = 'button', className, disabled }) => (
    <button type={type} onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  )
}));

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  buildErpMgButtonClassName: ({ className } = {}) => className || '',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading'
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => {
      const labels = {
        'common:common.HelpPage.t_775f0d23': '전화 문의',
        'common:common.HelpPage.t_b823d496': '이메일 문의',
        'common:common.HelpPage.t_e2654ac5': '도움말',
        'common:common.HelpPage.t_f5ad9f21': '• 상담 예약 및 긴급 문의 시 이용',
        'common:common.HelpPage.t_75e743e1': '고객 지원',
        'common:common.HelpPage.t_fcb0a804': '추가 도움이 필요하신가요?',
        'common:common.HelpPage.t_30847953': '언제든지 문의해 주세요.'
      };
      return labels[key] || key;
    },
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  })
}));

const { fetchTenantPublicHomeMeta } = require('../../../utils/tenantPublicHomeMeta');

const ARTIFACTS_DIR = '/opt/cursor/artifacts';

const goToContactSection = () => {
  fireEvent.click(screen.getByRole('button', { name: /문의하기/ }));
};

const writeArtifact = (filename, container) => {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), container.innerHTML, 'utf8');
};

describe('HelpPage businessLandline', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    fetchTenantPublicHomeMeta.mockReset();
    window.open = jest.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  test('landline 있으면 번호·tel 버튼 표시, 1588/운영시간 없음', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({
      found: true,
      tenant: {
        merchantLegal: {
          businessLandline: '02-111-2222'
        }
      }
    });

    const { container } = render(<HelpPage />);
    goToContactSection();

    expect(await screen.findByText(/02-111-2222/)).toBeInTheDocument();
    expect(container.textContent).not.toContain('1588-0000');
    expect(container.textContent).not.toContain('09:00');
    expect(container.textContent).not.toContain('운영시간: 평일');

    const telButton = screen.getByRole('button', { name: /전화 문의/ });
    expect(telButton).toBeInTheDocument();
    fireEvent.click(telButton);
    expect(window.open).toHaveBeenCalledWith('tel:02-111-2222');

    writeArtifact('help-landline-present.html', container);
  });

  test('landline 없으면 번호·1588·tel 버튼 없음', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({
      found: false,
      tenant: null
    });

    const { container } = render(<HelpPage />);
    goToContactSection();

    await waitFor(() => {
      expect(fetchTenantPublicHomeMeta).toHaveBeenCalled();
    });

    expect(container.textContent).not.toContain('1588-0000');
    expect(container.textContent).not.toContain('02-111-2222');
    expect(screen.queryByRole('button', { name: /전화 문의/ })).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('09:00');
    expect(container.textContent).not.toContain('운영시간: 평일');

    writeArtifact('help-landline-absent.html', container);
  });

  test('businessLandline 빈 문자열이면 tel 버튼·번호 없음', async () => {
    fetchTenantPublicHomeMeta.mockResolvedValue({
      found: true,
      tenant: {
        merchantLegal: {
          businessLandline: ''
        }
      }
    });

    const { container } = render(<HelpPage />);
    goToContactSection();

    await waitFor(() => {
      expect(fetchTenantPublicHomeMeta).toHaveBeenCalled();
    });

    expect(container.textContent).not.toContain('1588-0000');
    expect(screen.queryByRole('button', { name: /전화 문의/ })).not.toBeInTheDocument();
  });
});
