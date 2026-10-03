/**
 * 개인정보처리방침 — 특정 테넌트(센터) 연락처가 번들에 고정되지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

/* eslint-disable import/first -- jest.mock 이후 import */
import { PrivacyPolicyContent } from '../PrivacyPolicy';
import { PRIVACY_CONTACT_FALLBACK_TEXT } from '../../../constants/platformPrivacyContact';
/* eslint-enable import/first */

describe('PrivacyPolicyContent — 플랫폼 문의처', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('환경변수가 없으면 안내 문구만 보이고 테넌트 연락처가 없다', () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.REACT_APP_PRIVACY_CONTACT_EMAIL;
    delete process.env.REACT_APP_PRIVACY_CONTACT_PHONE;

    const { container } = render(<MemoryRouter><PrivacyPolicyContent omitHeading /></MemoryRouter>);
    expect(screen.getAllByText(PRIVACY_CONTACT_FALLBACK_TEXT).length).toBe(2);
    expect(container.textContent).not.toMatch(/mindgarden\.co\.kr|032-724-8501/i);
  });

  it('환경변수가 있으면 그 값을 보인다', () => {
    process.env = {
      ...ORIGINAL_ENV,
      REACT_APP_PRIVACY_CONTACT_EMAIL: 'privacy@example.test',
      REACT_APP_PRIVACY_CONTACT_PHONE: '000-0000-0000'
    };

    render(<MemoryRouter><PrivacyPolicyContent omitHeading /></MemoryRouter>);
    expect(screen.getByText('privacy@example.test')).toBeInTheDocument();
    expect(screen.getByText('000-0000-0000')).toBeInTheDocument();
  });
});
