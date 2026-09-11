/**
 * 플랫폼 공통 약관 MD SSOT 파서 (웹 `platformLegalCopy.js` 패리티)
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import {
  PLATFORM_LEGAL_COPY_PUBLIC_URL,
  PLATFORM_LEGAL_SECTIONS,
  type PlatformLegalSectionKey,
} from '@/constants/legalPublic';
import { getWebBaseUrl } from '@/config/webBaseUrl';

/**
 * MD 본문에서 `## terms` / `## privacy` / `## refund` 섹션 본문을 추출한다.
 *
 * @param markdown 전체 MD
 * @param sectionKey terms | privacy | refund
 * @returns 섹션 본문(헤딩 제외). 없으면 빈 문자열
 */
export function extractPlatformLegalSection(
  markdown: string | null | undefined,
  sectionKey: PlatformLegalSectionKey,
): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  const allowed = Object.values(PLATFORM_LEGAL_SECTIONS) as string[];
  if (!allowed.includes(sectionKey)) {
    return '';
  }

  const headingPattern = new RegExp(`^## ${sectionKey}\\b`, 'm');
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch) {
    return '';
  }

  const afterHeading = headingMatch.index + headingMatch[0].length;
  const rest = markdown.slice(afterHeading);
  const nextMatch = rest.match(/\n## (terms|privacy|refund)\b/);
  const body = nextMatch ? rest.slice(0, nextMatch.index) : rest;
  return body.replace(/^\s*\n/, '').trim();
}

/**
 * 웹 공개 경로에서 플랫폼 약관 MD를 로드한다.
 *
 * @returns MD 텍스트
 */
export async function fetchPlatformLegalCopyMarkdown(): Promise<string> {
  const base = getWebBaseUrl().replace(/\/+$/, '');
  const url = `${base}${PLATFORM_LEGAL_COPY_PUBLIC_URL}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'text/markdown, text/plain, */*' },
  });
  if (!response.ok) {
    throw new Error(`플랫폼 약관 문서를 불러오지 못했습니다 (${response.status})`);
  }
  return response.text();
}

/**
 * MD 섹션을 RN Text 용 plain 텍스트로 변환한다 (조용한 표시).
 *
 * @param markdownSection 섹션 본문
 * @returns plain text
 */
export function renderQuietLegalPlainFromMarkdown(
  markdownSection: string | null | undefined,
): string {
  if (!markdownSection || typeof markdownSection !== 'string') {
    return '';
  }

  const lines = markdownSection.split(/\r?\n/);
  const out: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === '---' || trimmed.startsWith('>')) {
      if (out.length > 0 && out[out.length - 1] !== '') {
        out.push('');
      }
      continue;
    }
    if (trimmed.startsWith('### ')) {
      out.push(trimmed.slice(4).trim());
      continue;
    }
    if (trimmed.startsWith('## ')) {
      out.push(trimmed.slice(3).trim());
      continue;
    }
    if (trimmed.startsWith('# ')) {
      out.push(trimmed.slice(2).trim());
      continue;
    }
    if (trimmed.startsWith('- ')) {
      out.push(`• ${trimmed.slice(2).trim()}`);
      continue;
    }
    const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      out.push(`${numbered[1]}. ${numbered[2]}`);
      continue;
    }
    out.push(trimmed);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
