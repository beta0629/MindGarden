/**
 * CitationBlock — 의료/건강 콘텐츠 하단 출처 섹션(웹 공용 SSOT).
 *
 * <p>Apple App Store Guideline 1.4.1 (Medical Citations) 대응.
 * 핸드오프 §3 단일 출처 표시 형태(라벨·저자·연도·외부 링크)를 그대로 구현하며,
 * source 객체가 비어 있으면 아무것도 렌더하지 않는다.</p>
 *
 * 디자인 토큰: `frontend/src/styles/unified-design-tokens.css` (`--mg-*`).
 * 사용자 입력 텍스트는 모두 React JSX 자식으로 렌더 → XSS 안전.
 * 외부 링크는 화이트리스트(http(s):// 또는 doi.org) 만 통과.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import SafeText from './SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import './CitationBlock.css';

const SAFE_URL_PATTERN = /^(https?:\/\/[^\s]+|doi\.org\/[^\s]+)$/i;

function pickSafeUrl(rawUrl) {
  if (typeof rawUrl !== 'string') {
    return null;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }
  if (SAFE_URL_PATTERN.test(trimmed)) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  return null;
}

function hasAnyField(source) {
  if (!source || typeof source !== 'object') {
    return false;
  }
  return Boolean(
    (source.label && String(source.label).trim()) ||
    (source.url && String(source.url).trim()) ||
    (source.author && String(source.author).trim()) ||
    (source.publishedYear != null && String(source.publishedYear).trim())
  );
}

const CitationBlock = ({
  source,
  title,
  testId,
  className
}) => {
  if (!hasAnyField(source)) {
    return null;
  }

  const labelText = toDisplayString(source.label, '');
  const authorText = toDisplayString(source.author, '');
  const yearText = source.publishedYear != null ? String(source.publishedYear) : '';
  const safeUrl = pickSafeUrl(source.url);

  const sectionClass = className
    ? `mg-citation ${className}`
    : 'mg-citation';

  return (
    <section
      className={sectionClass}
      data-testid={testId || 'citation-block'}
      aria-label={title || '출처'}
    >
      <SafeText tag="h4" className="mg-citation__heading">
        {title || '출처'}
      </SafeText>
      {labelText ? (
        <SafeText tag="p" className="mg-citation__label">
          {labelText}
        </SafeText>
      ) : null}
      {(authorText || yearText) ? (
        <SafeText tag="p" className="mg-citation__meta">
          {[authorText, yearText].filter((part) => part).join(' · ')}
        </SafeText>
      ) : null}
      {safeUrl ? (
        <a
          className="mg-citation__link"
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <SafeText tag="span" className="mg-citation__link-text">
            {safeUrl}
          </SafeText>
          <ExternalLink size={14} aria-hidden="true" className="mg-citation__link-icon" />
        </a>
      ) : null}
    </section>
  );
};

export default CitationBlock;
