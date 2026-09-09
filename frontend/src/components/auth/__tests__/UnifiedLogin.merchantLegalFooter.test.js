/**
 * UnifiedLogin — 테넌트 호스트 사업자·약관 푸터 (MerchantLegalFooterPreview)
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key)
  })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    checkSession: jest.fn(),
    setDuplicateLoginModal: jest.fn(),
    user: null
  })
}));

jest.mock('../../../utils/ajax', () => ({
  authAPI: { getOAuth2Config: jest.fn().mockResolvedValue({}) }
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    logout: jest.fn(),
    setUser: jest.fn(),
    getCurrentTenantRole: jest.fn()
  }
}));

jest.mock('../../../utils/socialLogin', () => ({
  appleLogin: jest.fn(),
  googleLogin: jest.fn(),
  kakaoLogin: jest.fn(),
  naverLogin: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../../utils/dashboardUtils', () => ({
  redirectToDynamicDashboard: jest.fn()
}));

jest.mock('../../../services/oauth2/googleWebOAuth2Service', () => ({
  requestGoogleSocialLogin: jest.fn()
}));

jest.mock('../../common/CommonPageTemplate', () => ({ children }) => (
  <div data-testid="page-template">{children}</div>
));

jest.mock('../GoogleLoginButton', () => () => <div data-testid="google-login-btn" />);
jest.mock('../GoogleBrandLogo', () => () => null);
jest.mock('../OAuthPhoneVerificationModal', () => () => null);
jest.mock('../AccountSelectionModal', () => () => null);
jest.mock('../SocialSignupModal', () => () => null);
jest.mock('../TenantSelection', () => () => null);
jest.mock('../../mypage/components/PasswordChangeModal', () => () => null);
jest.mock('../LoginHeroLineOverlay', () => ({
  LOGIN_HERO_BRAND_TITLE: 'Core Solution',
  LoginHeroBrandLockup: () => <div data-testid="login-hero-lockup" />
}));

jest.mock('../../common/modals/UnifiedModal', () => {
  return function MockUnifiedModal({ isOpen, title, children, onClose }) {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={title}>
        <div>{children}</div>
        <button type="button" onClick={onClose}>
          close
        </button>
      </div>
    );
  };
});

const mockGetTenantSubdomainFromHost = jest.fn();
const mockShouldRedirectWrongPath = jest.fn(() => false);

jest.mock('../../../utils/subdomainUtils', () => ({
  getTenantSubdomainFromHost: (...args) => mockGetTenantSubdomainFromHost(...args),
  shouldRedirectWrongPath: (...args) => mockShouldRedirectWrongPath(...args),
  WRONG_PATH_MESSAGE: 'wrong-path',
  WRONG_PATH_REDIRECT_DELAY_MS: 1800
}));

const mockFetchTenantPublicHomeMeta = jest.fn();
jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  fetchTenantPublicHomeMeta: (...args) => mockFetchTenantPublicHomeMeta(...args)
}));

import UnifiedLogin from '../UnifiedLogin';

describe('UnifiedLogin merchant legal footer', () => {
  beforeEach(() => {
    mockGetTenantSubdomainFromHost.mockReset();
    mockShouldRedirectWrongPath.mockReturnValue(false);
    mockFetchTenantPublicHomeMeta.mockReset();
    sessionStorage.clear();
  });

  it('테넌트 호스트: 메타 사업자·통신판매 푸터 표시 (빈 약관은 안내 컨트롤 숨김)', async () => {
    mockGetTenantSubdomainFromHost.mockReturnValue('mindgarden');
    mockFetchTenantPublicHomeMeta.mockResolvedValue({
      found: true,
      host: 'mindgarden.dev.core-solution.co.kr',
      subdomain: 'mindgarden',
      tenant: {
        tenantId: 'tenant-test-001',
        name: '테스트상담센터',
        merchantLegal: {
          businessRegistrationNumber: '120-81-47521',
          representativeName: '김대표',
          businessLandline: '02-111-2222',
          businessAddress: '서울시 테스트구',
          mailOrderReportNumber: '제2024-서울-0001호',
          refundPolicyText: '',
          productPriceGuideText: ''
        }
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <UnifiedLogin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-merchant-legal-footer')).toBeInTheDocument();
    });

    const footer = screen.getByTestId('login-merchant-legal-footer');
    expect(footer).toHaveTextContent('테스트상담센터');
    expect(footer).toHaveTextContent('120-81-47521');
    expect(footer).toHaveTextContent('제2024-서울-0001호');
    expect(footer.querySelector('[data-testid="counseling-guide-refund"]')).toBeNull();
    expect(footer.querySelector('[data-testid="counseling-guide-pricing"]')).toBeNull();
    expect(footer.querySelector('a[href="/terms#refund"]')).toBeNull();
    expect(footer.querySelector('a[href="/terms#pricing"]')).toBeNull();
    expect(footer.querySelector('a[href="/login"]')).toBeNull();
  });

  it('테넌트 호스트: 등록 약관 문구가 있으면 안내 컨트롤이 노출된다', async () => {
    mockGetTenantSubdomainFromHost.mockReturnValue('mindgarden');
    mockFetchTenantPublicHomeMeta.mockResolvedValue({
      found: true,
      host: 'mindgarden.dev.core-solution.co.kr',
      subdomain: 'mindgarden',
      tenant: {
        tenantId: 'tenant-test-001',
        name: '테스트상담센터',
        merchantLegal: {
          businessRegistrationNumber: '120-81-47521',
          representativeName: '김대표',
          businessLandline: '02-111-2222',
          businessAddress: '서울시 테스트구',
          mailOrderReportNumber: '제2024-서울-0001호',
          refundPolicyText: '환불은 7일 이내 가능합니다.',
          productPriceGuideText: '기본 상담 5만원'
        }
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <UnifiedLogin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-merchant-legal-footer')).toBeInTheDocument();
    });

    const footer = screen.getByTestId('login-merchant-legal-footer');
    expect(footer.textContent.replace(/\u2060/g, '')).toContain('환불·취소·청약철회');
    expect(footer).toHaveTextContent('상품·가격 안내');
    expect(footer.querySelector('a[href="/terms#refund"]')).toBeNull();
    expect(footer.querySelector('a[href="/terms#pricing"]')).toBeNull();
  });

  it('테넌트 호스트·메타 실패: 플레이스홀더 푸터 유지 (플랫폼 폴백 없음)', async () => {
    mockGetTenantSubdomainFromHost.mockReturnValue('mindgarden');
    mockFetchTenantPublicHomeMeta.mockRejectedValue(new Error('network'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <UnifiedLogin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-merchant-legal-footer')).toBeInTheDocument();
    });

    const footer = screen.getByTestId('login-merchant-legal-footer');
    expect(footer).toHaveTextContent('{센터명}');
    expect(footer).toHaveTextContent('사업자등록번호');
    expect(footer).toHaveTextContent('통신판매업 신고번호');
    expect(footer).not.toHaveTextContent('MindGarden');
  });

  it('플랫폼 apex: 테넌트 사업자 푸터 testid 없음', async () => {
    mockGetTenantSubdomainFromHost.mockReturnValue('');
    mockFetchTenantPublicHomeMeta.mockResolvedValue({
      found: false,
      tenant: null,
      host: 'dev.core-solution.co.kr',
      subdomain: ''
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <UnifiedLogin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-template')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('login-merchant-legal-footer')).not.toBeInTheDocument();
    expect(mockFetchTenantPublicHomeMeta).not.toHaveBeenCalled();
  });
});
