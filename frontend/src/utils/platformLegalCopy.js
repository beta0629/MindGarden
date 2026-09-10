/**
 * 플랫폼 공통 약관·개인정보처리방침 MD SSOT 파서
 * docs/design-system/clinic-os-platform-legal-copy.md 과 동일 구조
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

import {
  PLATFORM_LEGAL_COPY_PUBLIC_URL,
  PLATFORM_LEGAL_SECTIONS
} from '../constants/legalPublic';

/**
 * MD 본문에서 `## terms` / `## privacy` 섹션 본문을 추출한다.
 *
 * @param {string} markdown 전체 MD
 * @param {'terms'|'privacy'} sectionKey
 * @returns {string} 섹션 본문(헤딩 제외). 없으면 빈 문자열
 */
export function extractPlatformLegalSection(markdown, sectionKey) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  if (
    sectionKey !== PLATFORM_LEGAL_SECTIONS.TERMS &&
    sectionKey !== PLATFORM_LEGAL_SECTIONS.PRIVACY
  ) {
    return '';
  }

  const heading = `## ${sectionKey}`;
  const start = markdown.indexOf(heading);
  if (start < 0) {
    return '';
  }

  const afterHeading = start + heading.length;
  const rest = markdown.slice(afterHeading);
  const nextMatch = rest.match(/\n## (terms|privacy)\b/);
  const body = nextMatch ? rest.slice(0, nextMatch.index) : rest;
  return body.replace(/^\s*\n/, '').trim();
}

/**
 * 공개 경로에서 플랫폼 약관 MD를 로드한다.
 *
 * @returns {Promise<string>}
 */
export async function fetchPlatformLegalCopyMarkdown() {
  const base =
    typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL
      ? String(process.env.PUBLIC_URL).replace(/\/$/, '')
      : '';
  const url = `${base}${PLATFORM_LEGAL_COPY_PUBLIC_URL}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'text/markdown, text/plain, */*' }
  });
  if (!response.ok) {
    throw new Error(`플랫폼 약관 문서를 불러오지 못했습니다 (${response.status})`);
  }
  return response.text();
}

/**
 * MD 인라인/블록을 조용한 HTML 조각으로 변환한다 (제한적, 이스케이프 우선).
 *
 * @param {string} markdownSection
 * @returns {string} HTML
 */
export function renderQuietLegalHtmlFromMarkdown(markdownSection) {
  if (!markdownSection || typeof markdownSection !== 'string') {
    return '';
  }

  const escapeHtml = (text) =>
    String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const lines = markdownSection.split(/\r?\n/);
  const parts = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(' ').trim();
    paragraph = [];
    if (!text) return;
    parts.push(`<p>${escapeHtml(text)}</p>`);
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed || trimmed === '---' || trimmed.startsWith('>')) {
      flushParagraph();
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph();
      parts.push(`<h3>${escapeHtml(trimmed.slice(4).trim())}</h3>`);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      parts.push(`<h2>${escapeHtml(trimmed.slice(3).trim())}</h2>`);
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      parts.push(`<h1>${escapeHtml(trimmed.slice(2).trim())}</h1>`);
      return;
    }
    if (trimmed.startsWith('- ')) {
      flushParagraph();
      parts.push(`<li>${escapeHtml(trimmed.slice(2).trim())}</li>`);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();

  // 연속 li 를 ul 로 감싼다
  const joined = [];
  let listBuffer = [];
  const flushList = () => {
    if (listBuffer.length === 0) return;
    joined.push(`<ul>${listBuffer.join('')}</ul>`);
    listBuffer = [];
  };
  parts.forEach((part) => {
    if (part.startsWith('<li>')) {
      listBuffer.push(part);
    } else {
      flushList();
      joined.push(part);
    }
  });
  flushList();

  return joined.join('\n');
}
