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
    }
  });
}

/**
 * 신뢰되지 않은 HTML(예: AI 생성 본문)을 sanitize 한다.
 * 브라우저 환경(window.document)이 없으면 모든 태그를 제거한다.
 *
 * @param {string} html  원본 HTML
 * @returns {string} sanitize 된 HTML (또는 빈 문자열)
 */
export function sanitizeHealingHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    return '';
  }
  if (typeof window === 'undefined' || typeof window.document === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }
  try {
    const wrapper = window.document.createElement('div');
    wrapper.innerHTML = html;
    sanitizeElement(wrapper);
    return wrapper.innerHTML;
  } catch (_) {
    return html.replace(/<[^>]*>/g, '');
  }
}
