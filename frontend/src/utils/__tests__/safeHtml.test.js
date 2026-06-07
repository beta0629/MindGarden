import { sanitizeHealingHtml } from '../safeHtml';

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
});
