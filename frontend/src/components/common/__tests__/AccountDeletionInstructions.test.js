/**
 * AccountDeletionInstructions 회귀 테스트.
 *
 * Google Play 「데이터 보안 → 사용자 데이터 삭제 정책」 준수 공개 페이지의 핵심 요구사항 검증.
 *  - 페이지 제목/앱·운영사 정보가 렌더된다
 *  - 인앱(절차 A)·이메일(절차 B) 두 가지 삭제 절차가 모두 노출된다
 *  - 운영팀 이메일(beta74@live.co.kr)이 mailto 링크로 렌더된다
 *  - 삭제·보존되는 데이터 섹션이 노출되고 법정 보존 기간 행이 모두 그려진다
 *  - 개인정보처리방침·이용약관·자기 자신 상호 링크가 존재한다
 *
 * @author CoreSolution
 * @since 2026-06-02
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import accountDeletionLocale from '../../../locales/ko/accountDeletion.json';

// axios·메뉴 API·레이아웃 등 무거운 의존성은 본 페이지 테스트와 무관하므로 mock 처리한다.
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }
}));

const { AccountDeletionInstructionsContent } = require('../AccountDeletionInstructions');

const resolveKey = (obj, path) => {
  if (!path) return undefined;
  const segments = path.split('.');
  let cursor = obj;
  for (const segment of segments) {
    if (cursor == null) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
};

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => {
      // 실제 ko/accountDeletion.json 값을 그대로 반환하여 컴포넌트가
      // 운영 환경과 동일한 텍스트로 렌더되도록 한다.
      const value = require('../../../locales/ko/accountDeletion.json');
      const resolved = key.split('.').reduce(
        (cursor, segment) => (cursor == null ? undefined : cursor[segment]),
        value
      );
      if (opts && typeof opts === 'object' && opts.returnObjects === true) {
        return resolved;
      }
      return resolved !== undefined && resolved !== null ? resolved : key;
    },
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

const renderContent = () =>
  render(
    <MemoryRouter>
      <AccountDeletionInstructionsContent />
    </MemoryRouter>
  );

describe('AccountDeletionInstructions (Content)', () => {
  it('페이지 제목 및 앱·운영사 정보를 렌더한다', () => {
    renderContent();
    expect(
      screen.getByRole('heading', { level: 1, name: accountDeletionLocale.pageTitle })
    ).toBeInTheDocument();
    expect(screen.getByText(accountDeletionLocale.intro.appName)).toBeInTheDocument();
    // developerName 은 intro·contact 섹션에서 동시에 노출될 수 있어 다중 매칭을 허용한다.
    expect(screen.getAllByText(accountDeletionLocale.intro.developerName).length).toBeGreaterThan(0);
  });

  it('절차 A(인앱 회원탈퇴) 단계가 모두 노출된다', () => {
    renderContent();
    expect(
      screen.getByRole('heading', { level: 3, name: accountDeletionLocale.procedure.methodA.title })
    ).toBeInTheDocument();
    accountDeletionLocale.procedure.methodA.steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('절차 B(이메일) 안내가 운영팀 이메일을 mailto 링크로 노출한다', () => {
    renderContent();
    const expectedEmail = accountDeletionLocale.procedure.methodB.emailAddress;
    const expectedSubject = accountDeletionLocale.procedure.methodB.subjectText;
    const mailtoLinks = screen.getAllByRole('link', { name: expectedEmail });
    const procedureMailto = mailtoLinks.find((el) => {
      const href = el.getAttribute('href') || '';
      return (
        href.startsWith(`mailto:${expectedEmail}`) &&
        href.includes(encodeURIComponent(expectedSubject))
      );
    });
    expect(procedureMailto).toBeDefined();
  });

  it('삭제·보존 데이터 섹션과 보존 기간 행이 모두 렌더된다', () => {
    renderContent();
    expect(
      screen.getByRole('heading', { level: 2, name: accountDeletionLocale.deletedData.title })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: accountDeletionLocale.retainedData.title })
    ).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    const bodyRows = within(table).getAllByRole('row').slice(1); // 헤더 제외
    expect(bodyRows).toHaveLength(accountDeletionLocale.retainedData.rows.length);
    accountDeletionLocale.retainedData.rows.forEach((row, index) => {
      const cells = within(bodyRows[index]).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent(row.type);
      expect(cells[1]).toHaveTextContent(row.period);
      expect(cells[2]).toHaveTextContent(row.basis);
    });
  });

  it('개인정보처리방침·이용약관 상호 링크가 존재한다', () => {
    renderContent();
    const privacyLink = screen.getByRole('link', {
      name: accountDeletionLocale.related.privacyLinkLabel
    });
    expect(privacyLink).toHaveAttribute('href', '/privacy');

    const termsLink = screen.getByRole('link', {
      name: accountDeletionLocale.related.termsLinkLabel
    });
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('locale JSON 정합성: 필수 키가 모두 정의되어 있다 (회귀 가드)', () => {
    const requiredKeys = [
      'pageTitle',
      'meta.description',
      'intro.appName',
      'intro.developerName',
      'procedure.methodA.steps',
      'procedure.methodB.emailAddress',
      'procedure.methodB.subjectText',
      'deletedData.items',
      'retainedData.rows',
      'retainedData.note',
      'publicAccess.body',
      'contact.emailValue',
      'related.privacyLinkLabel',
      'related.termsLinkLabel',
      'links.viewAccountDeletion'
    ];
    requiredKeys.forEach((path) => {
      const value = resolveKey(accountDeletionLocale, path);
      expect(value).toBeDefined();
    });
  });
});
