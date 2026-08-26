import { sanitizeHealingHtml, stripAllHtmlTags } from '../safeHtml';

describe('stripAllHtmlTags — incomplete multi-character sanitization', () => {
  it('빈/비문자 입력은 빈 문자열을 반환한다', () => {
    expect(stripAllHtmlTags('')).toBe('');
    expect(stripAllHtmlTags(null)).toBe('');
    expect(stripAllHtmlTags(undefined)).toBe('');
    expect(stripAllHtmlTags(123)).toBe('');
  });

  it('중첩·깨진 태그를 반복 제거해 script 재구성을 막는다', () => {
    const nested = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    const out = stripAllHtmlTags(nested);
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<\/script/i);
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).toContain('alert(1)');
  });

  it('단일 패스로 남는 깨진 꺾쇠도 제거한다', () => {
    const out = stripAllHtmlTags('<div>ok<script>x</script');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).toContain('ok');
    expect(out).toContain('x');
  });
});

describe('sanitizeHealingHtml — Apple T3 XSS 가드', () => {
  it('빈/비문자 입력은 빈 문자열을 반환한다', () => {
    expect(sanitizeHealingHtml('')).toBe('');
    expect(sanitizeHealingHtml(null)).toBe('');
    expect(sanitizeHealingHtml(undefined)).toBe('');
    expect(sanitizeHealingHtml(123)).toBe('');
  });

  it('<script>·on* 핸들러를 모두 제거한다', () => {
    const input = '<p>안녕</p><script>alert(1)</script><img src=x onerror=alert(2) />';
    const out = sanitizeHealingHtml(input);
    expect(out).toContain('<p>안녕</p>');
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<img/i);
    expect(out).not.toMatch(/onerror/i);
  });

  it('허용 태그(p/strong/em/br/li/ul) 는 보존하되 속성은 모두 제거한다', () => {
    const input = '<p style="color:red" onclick="alert(1)">힐링 <strong class="x">메시지</strong></p>';
    const out = sanitizeHealingHtml(input);
    expect(out).toContain('<p>');
    expect(out).toContain('<strong>');
    expect(out).not.toMatch(/style=/i);
    expect(out).not.toMatch(/onclick/i);
    expect(out).not.toMatch(/class=/i);
  });

  it('<a href> 같은 비허용 태그는 자식 텍스트만 남기고 제거한다', () => {
    const input = '<p>방문 <a href="javascript:alert(1)">여기</a></p>';
    const out = sanitizeHealingHtml(input);
    expect(out).toContain('여기');
    expect(out).not.toMatch(/<a/i);
    expect(out).not.toMatch(/javascript/i);
  });

  it('주석 노드는 제거된다', () => {
    const input = '<p>본문</p><!-- 악의적 주석 -->';
    const out = sanitizeHealingHtml(input);
    expect(out).toContain('본문');
    expect(out).not.toContain('<!--');
  });

  it('표시용 이모지 문자는 제거한다 (메트릭 불변, display-only)', () => {
    const input = '<p>마음의 평화 💚 되시길</p>';
    const out = sanitizeHealingHtml(input);
    expect(out).toContain('마음의 평화');
    expect(out).toContain('되시길');
    expect(out).not.toContain('💚');
  });

  it('no-DOM fallback 에서도 중첩 태그가 script 로 재구성되지 않는다', () => {
    const originalDocument = window.document;
    try {
      // jsdom 환경에서도 no-DOM 분기를 강제해 fallback 경로를 검증한다.
      Object.defineProperty(window, 'document', {
        configurable: true,
        get() {
          return undefined;
        }
      });
      const nested = '<scr<script>ipt>alert(1)</scr</script>ipt>';
      const out = sanitizeHealingHtml(nested);
      expect(out).not.toMatch(/<script/i);
      expect(out).not.toContain('<');
      expect(out).not.toContain('>');
      expect(out).toContain('alert(1)');
    } finally {
      Object.defineProperty(window, 'document', {
        configurable: true,
        writable: true,
        value: originalDocument
      });
    }
  });
});
