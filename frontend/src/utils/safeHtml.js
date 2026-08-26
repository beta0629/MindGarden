/**
 * SafeHtml — 신뢰되지 않은 HTML(예: GPT 생성 본문) 렌더링용 sanitizer.
 *
 * <p>외부 라이브러리(DOMPurify/sanitize-html) 도입 없이도 XSS 가드를
 * 통과시키기 위해 화이트리스트 태그만 통과시키고 모든 속성·on* 핸들러를
 * 제거한다. 출처(citation) 영역은 sanitize 가 필요 없는 React JSX 로
 * 별도 표기하되, GPT 생성 본문에 대한 dangerouslySetInnerHTML 호출 시
 * {@link sanitizeHealingHtml} 결과를 사용한다.</p>
 *
 * Apple 1.4.1 — `HealingCard` `dangerouslySetInnerHTML` 영역 XSS 가드.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'SPAN', 'DIV', 'STRONG', 'EM', 'B', 'I', 'U',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'LI', 'BLOCKQUOTE'
]);

/**
 * 표시용 이모지·심볼 장식 문자 제거 (메트릭/데이터 불변, display-only).
 * BMP 심볼 + 이모지 보충 평면 + ZWJ/VS16 포함.
 */
const EMOJI_DISPLAY_PATTERN = /(?:\uFE0F|\u200D|\u20E3)|[\u2600-\u27BF]|[\u{1F300}-\u{1FAFF}]/gu;

/**
 * HTML/텍스트에서 장식 이모지를 제거한다.
 *
 * @param {string} text 원본 문자열
 * @returns {string} 이모지가 제거된 문자열
 */
export function stripDisplayEmoji(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }
  return text.replace(EMOJI_DISPLAY_PATTERN, '');
}

/**
 * 모든 HTML 태그를 제거한다 (DOM 미사용 fallback).
 * 단일 패스 `/&lt;[^&gt;]*&gt;/g` 는 중첩·깨진 태그(예: scr+script 재구성)를
 * 남길 수 있으므로, 결과가 안정될 때까지 반복 제거한다.
 * 남은 `&lt;`/`&gt;` 는 추가 제거해 재구성 XSS 를 막는다.
 *
 * @param {string} text 원본 문자열
 * @returns {string} 태그가 제거된 평문
 */
export function stripAllHtmlTags(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }
  let previous;
  let current = text;
  do {
    previous = current;
    current = current.replace(/<[^>]*>/g, '');
  } while (current !== previous);
  // 깨진 태그 잔여물로 재구성되지 않도록 남은 꺾쇠도 제거
  return current.replace(/[<>]/g, '');
}

function sanitizeElement(element) {
  if (!element) {
    return;
  }
  const children = Array.from(element.childNodes || []);
  children.forEach((child) => {
    if (child.nodeType === 1) {
      const tag = String(child.tagName || '').toUpperCase();
      if (!ALLOWED_TAGS.has(tag)) {
        sanitizeElement(child);
        const ownerDoc = element.ownerDocument || child.ownerDocument;
        const fragment = ownerDoc ? ownerDoc.createDocumentFragment() : null;
        if (fragment) {
          Array.from(child.childNodes || []).forEach((grand) => fragment.appendChild(grand));
          element.replaceChild(fragment, child);
        } else {
          element.removeChild(child);
        }
        return;
      }
      if (child.attributes && child.attributes.length > 0) {
        Array.from(child.attributes).forEach((attr) => {
          try {
            child.removeAttribute(attr.name);
          } catch (_) {
            // 일부 속성은 removeAttribute가 실패할 수 있다 (e.g. namespaced); 무시
          }
        });
      }
      sanitizeElement(child);
    } else if (child.nodeType === 8) {
      element.removeChild(child);
    } else if (child.nodeType === 3 && typeof child.textContent === 'string') {
      child.textContent = stripDisplayEmoji(child.textContent);
    }
  });
}

/**
 * 신뢰되지 않은 HTML(예: AI 생성 본문)을 sanitize 한다.
 * 브라우저 환경(window.document)이 없으면 모든 태그를 제거한다.
 * 표시용 이모지도 함께 제거한다 (대시보드 장식 스프라이트 방지).
 *
 * @param {string} html  원본 HTML
 * @returns {string} sanitize 된 HTML (또는 빈 문자열)
 */
export function sanitizeHealingHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    return '';
  }
  if (typeof window === 'undefined' || typeof window.document === 'undefined') {
    return stripDisplayEmoji(stripAllHtmlTags(html));
  }
  try {
    const wrapper = window.document.createElement('div');
    wrapper.innerHTML = html;
    sanitizeElement(wrapper);
    return stripDisplayEmoji(wrapper.innerHTML);
  } catch (_) {
    return stripDisplayEmoji(stripAllHtmlTags(html));
  }
}
