/**
 * 플랫폼 공통 이용약관·개인정보처리방침 공개 페이지
 * 본문은 SSOT MD (`PLATFORM_LEGAL_COPY_PUBLIC_URL`) 섹션만 사용. 테넌트/MindGarden 문구 발명 금지.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import LegalPublicNav from './LegalPublicNav';
import {
  LEGAL_PUBLIC_LABELS,
  LEGAL_PUBLIC_PATHS,
  PLATFORM_LEGAL_SECTIONS
} from '../../constants/legalPublic';
import {
  extractPlatformLegalSection,
  fetchPlatformLegalCopyMarkdown,
  renderQuietLegalHtmlFromMarkdown
} from '../../utils/platformLegalCopy';
import './PlatformLegalDocumentPage.css';

const SECTION_META = Object.freeze({
  [PLATFORM_LEGAL_SECTIONS.TERMS]: {
    title: LEGAL_PUBLIC_LABELS.TERMS,
    path: LEGAL_PUBLIC_PATHS.TERMS
  },
  [PLATFORM_LEGAL_SECTIONS.PRIVACY]: {
    title: LEGAL_PUBLIC_LABELS.PRIVACY,
    path: LEGAL_PUBLIC_PATHS.PRIVACY
  }
});

/**
 * @param {object} props
 * @param {'terms'|'privacy'} props.section
 */
const PlatformLegalDocumentPage = ({ section }) => {
  const meta = SECTION_META[section] || SECTION_META[PLATFORM_LEGAL_SECTIONS.TERMS];
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFailed(false);
        const markdown = await fetchPlatformLegalCopyMarkdown();
        const body = extractPlatformLegalSection(markdown, section);
        if (!body) {
          if (!cancelled) {
            setHtml('');
            setFailed(true);
          }
          return;
        }
        const rendered = renderQuietLegalHtmlFromMarkdown(body);
        if (!cancelled) {
          setHtml(rendered);
          setFailed(!rendered);
        }
      } catch (err) {
        console.warn('플랫폼 약관 로드 실패:', err);
        if (!cancelled) {
          setHtml('');
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section]);

  return (
    <CommonPageTemplate
      title={meta.title}
      description={`Core Solution ${meta.title}`}
      bodyClass="mg-platform-legal-body"
    >
      <div className="mg-platform-legal" data-testid="platform-legal-document-page">
        <header className="mg-platform-legal__chrome">
          <Link to="/" className="mg-platform-legal__back">
            홈
          </Link>
          <LegalPublicNav active={section} />
        </header>

        <main className="mg-platform-legal__main">
          <h1 className="mg-platform-legal__h1">{meta.title}</h1>
          {loading ? (
            <p className="mg-platform-legal__status">불러오는 중…</p>
          ) : failed ? (
            <p
              className="mg-platform-legal__empty"
              data-testid="platform-legal-empty"
              role="status"
            >
              문서를 확인할 수 없습니다.
            </p>
          ) : (
            <article
              className="mg-platform-legal__article"
              data-testid="platform-legal-article"
              // SSOT MD → 이스케이프된 quiet HTML
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </main>
      </div>
    </CommonPageTemplate>
  );
};

PlatformLegalDocumentPage.propTypes = {
  section: PropTypes.oneOf([
    PLATFORM_LEGAL_SECTIONS.TERMS,
    PLATFORM_LEGAL_SECTIONS.PRIVACY
  ]).isRequired
};

export default PlatformLegalDocumentPage;
