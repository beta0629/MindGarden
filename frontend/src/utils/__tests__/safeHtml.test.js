import fs from 'fs';
import path from 'path';
import { sanitizeHealingHtml, sanitizeRichNoticeHtml, stripAllHtmlTags, toPlainNoticePreview } from '../safeHtml';

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

  it('기존 허용 태그(span/div/blockquote/i/u/h1)는 유지하고 속성은 제거한다', () => {
    const input = '<h1 class="x">제목</h1><blockquote>인용</blockquote><span style="color:red">스팬</span>'
      + '<div onclick="alert(1)">박스</div><i>이탤릭</i><u>밑줄</u>';
    const out = sanitizeHealingHtml(input);
    expect(out).toContain('<h1>');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<span>');
    expect(out).toContain('<div>');
    expect(out).toContain('<i>');
    expect(out).toContain('<u>');
    expect(out).toContain('인용');
    expect(out).not.toMatch(/style=/i);
    expect(out).not.toMatch(/onclick/i);
    expect(out).not.toMatch(/class=/i);
  });

  it('script·style·iframe 은 태그와 내용을 함께 제거한다', () => {
    const input = '<p>본문</p><script>alert(1)</script><style>p{color:red}</style><iframe>숨김</iframe>';
    const out = sanitizeHealingHtml(input);
    expect(out).toContain('<p>본문</p>');
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<style/i);
    expect(out).not.toMatch(/<iframe/i);
    expect(out).not.toContain('alert(1)');
    expect(out).not.toContain('color:red');
    expect(out).not.toContain('숨김');
  });
});

const assertNoActivePayload = (out) => {
  expect(out).not.toMatch(/<script/i);
  expect(out).not.toMatch(/<\/script/i);
  expect(out).not.toMatch(/<style/i);
  expect(out).not.toMatch(/<iframe/i);
  expect(out).not.toMatch(/<img/i);
  expect(out).not.toMatch(/<svg/i);
  expect(out).not.toMatch(/javascript:/i);
  expect(out).not.toMatch(/vbscript:/i);
  expect(out).not.toMatch(/data:/i);
  expect(out).not.toMatch(/onerror/i);
  expect(out).not.toMatch(/onload/i);
  expect(out).not.toMatch(/onclick/i);
};

describe('sanitizeRichNoticeHtml — 공지·웰니스 본문', () => {
  it('빈/비문자 입력은 빈 문자열을 반환한다', () => {
    expect(sanitizeRichNoticeHtml('')).toBe('');
    expect(sanitizeRichNoticeHtml(null)).toBe('');
    expect(sanitizeRichNoticeHtml(undefined)).toBe('');
    expect(sanitizeRichNoticeHtml(123)).toBe('');
  });

  it('허용 태그(제목/p/목록/strong/b/em/br)는 남긴다', () => {
    const input = '<h1>일</h1><h2>이</h2><h3>삼</h3><h4>사</h4><h5>오</h5><h6>육</h6>'
      + '<p>문단 <strong>굵게</strong> <b>b</b> <em>기울임</em></p>'
      + '<ul><li>하나</li></ul><ol><li>둘</li></ol><br>';
    const out = sanitizeRichNoticeHtml(input);
    ['<h1>', '<h2>', '<h3>', '<h4>', '<h5>', '<h6>', '<p>', '<strong>', '<b>', '<em>',
      '<ul>', '<ol>', '<li>', '<br'].forEach((tag) => {
      expect(out).toContain(tag);
    });
    expect(out).toContain('문단');
    expect(out).toContain('하나');
    expect(out).toContain('둘');
  });

  it('img onerror 를 제거한다', () => {
    const out = sanitizeRichNoticeHtml('<p>안녕</p><img src=x onerror=alert(1)>');
    expect(out).toContain('안녕');
    assertNoActivePayload(out);
    expect(out).not.toContain('alert(1)');
  });

  it('script 태그와 내용을 제거한다', () => {
    const out = sanitizeRichNoticeHtml('<p>본문</p><script>alert(1)</script>');
    expect(out).toContain('본문');
    assertNoActivePayload(out);
    expect(out).not.toContain('alert(1)');
  });

  it('중첩 script 가 태그로 다시 만들어지지 않는다', () => {
    const out = sanitizeRichNoticeHtml('<scr<script>ipt>alert(1)</scr</script>ipt><p>본문</p>');
    expect(out).toContain('본문');
    assertNoActivePayload(out);
  });

  it('style 과 iframe 은 내용까지 제거한다', () => {
    const out = sanitizeRichNoticeHtml(
      '<style>body{background:url("javascript:alert(1)")}</style><iframe src="https://evil.example">숨김</iframe><p>본문</p>'
    );
    expect(out).toContain('본문');
    expect(out).not.toContain('숨김');
    assertNoActivePayload(out);
  });

  it('svg onload 를 제거하고 텍스트는 남긴다', () => {
    const out = sanitizeRichNoticeHtml('<svg onload="alert(1)"><text>캡션</text></svg><p>본문</p>');
    expect(out).toContain('캡션');
    expect(out).toContain('본문');
    assertNoActivePayload(out);
    expect(out).not.toContain('alert(1)');
  });

  it('비허용 태그는 태그만 벗기고 텍스트는 남긴다', () => {
    const out = sanitizeRichNoticeHtml('<span>남김</span><div onclick="alert(1)">상자</div>');
    expect(out).toContain('남김');
    expect(out).toContain('상자');
    expect(out).not.toMatch(/<span/i);
    expect(out).not.toMatch(/<div/i);
    assertNoActivePayload(out);
  });

  it('javascript: 링크는 태그를 벗긴다', () => {
    const out = sanitizeRichNoticeHtml('<a href="javascript:alert(1)">여기</a>');
    expect(out).toContain('여기');
    expect(out).not.toMatch(/<a/i);
    assertNoActivePayload(out);
  });

  it('data: 와 vbscript: 링크는 태그를 벗긴다', () => {
    const dataOut = sanitizeRichNoticeHtml('<a href="data:text/html,<script>alert(1)</script>">자료</a>');
    const vbsOut = sanitizeRichNoticeHtml('<a href="vbscript:msgbox(1)">브이</a>');
    expect(dataOut).toContain('자료');
    expect(vbsOut).toContain('브이');
    expect(dataOut).not.toMatch(/<a/i);
    expect(vbsOut).not.toMatch(/<a/i);
    assertNoActivePayload(dataOut);
    assertNoActivePayload(vbsOut);
  });

  it('엔티티·퍼센트로 감춘 javascript: 를 통과시키지 않는다', () => {
    const entityOut = sanitizeRichNoticeHtml('<a href="&#106;avascript:alert(1)">엔티티</a>');
    const percentOut = sanitizeRichNoticeHtml('<a href="%6Aavascript:alert(1)">퍼센트</a>');
    const doubleOut = sanitizeRichNoticeHtml('<a href="%256Aavascript:alert(1)">이중</a>');
    [entityOut, percentOut, doubleOut].forEach((out) => {
      expect(out).not.toMatch(/<a/i);
      assertNoActivePayload(out);
    });
    expect(entityOut).toContain('엔티티');
    expect(percentOut).toContain('퍼센트');
    expect(doubleOut).toContain('이중');
  });

  it('외부 http(s) 링크는 남기고 rel 을 붙인다', () => {
    const out = sanitizeRichNoticeHtml('<a href="https://example.com/path">외부</a>');
    expect(out).toContain('외부');
    expect(out).toContain('https://example.com/path');
    expect(out).toContain('rel="noopener noreferrer"');
    assertNoActivePayload(out);
  });

  it('mailto 는 남기고 rel 은 붙이지 않는다', () => {
    const out = sanitizeRichNoticeHtml('<a href="mailto:help@example.com">메일</a>');
    expect(out).toContain('mailto:help@example.com');
    expect(out).toContain('메일');
    expect(out).not.toContain('rel=');
    assertNoActivePayload(out);
  });

  it('같은 호스트 http 링크에는 rel 을 붙이지 않는다', () => {
    const href = `${window.location.origin}/notices`;
    const out = sanitizeRichNoticeHtml(`<a href="${href}">내부</a>`);
    expect(out).toContain(href);
    expect(out).toContain('내부');
    expect(out).not.toContain('rel=');
  });

  it('상대 경로와 프로토콜 상대 URL 은 링크로 남기지 않는다', () => {
    const relative = sanitizeRichNoticeHtml('<a href="/admin">상대</a>');
    const protocolRelative = sanitizeRichNoticeHtml('<a href="//evil.example">프로토콜</a>');
    expect(relative).toContain('상대');
    expect(protocolRelative).toContain('프로토콜');
    expect(relative).not.toMatch(/<a/i);
    expect(protocolRelative).not.toMatch(/<a/i);
  });
});

describe('toPlainNoticePreview — 목록 미리보기', () => {
  it('태그를 벗긴 평문만 돌려주고 꺾쇠를 남기지 않는다', () => {
    const out = toPlainNoticePreview('<p>안녕 <strong>세상</strong></p><script>alert(1)</script>');
    expect(out).toContain('안녕');
    expect(out).toContain('세상');
    expect(out).not.toContain('alert(1)');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
  });

  it('엔티티로 숨긴 img 가 태그로 되살아나지 않는다', () => {
    const out = toPlainNoticePreview('&lt;img src=x onerror=alert(1)&gt;');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toMatch(/onerror/i);
  });
});

describe('공지 HTML 렌더 배선', () => {
  const read = (rel) => fs.readFileSync(path.join(__dirname, '../..', rel), 'utf8');

  it('시스템 공지·메시지 본문은 sanitizeRichNoticeHtml 을 거친다', () => {
    const src = read('components/notifications/UnifiedNotifications.js');
    // 표시용 요약(UUID 축약·패키지→상담 회차) 후 정제. 원문 content 직접 __html 금지.
    expect(src).toMatch(
      /sanitizeRichNoticeHtml\(\s*(?:formatNotificationSummaryText\()?\s*selectedItem\.data\.content\s*\|\|\s*''/
    );
    expect(src).not.toMatch(/__html:\s*selectedItem\.data\.content\s*\|\|\s*''/);
  });

  it('웰니스 상세는 sanitizeRichNoticeHtml 을 거친다', () => {
    const src = read('components/wellness/WellnessNotificationDetail.js');
    expect(src).toContain('const html = sanitizeRichNoticeHtml(raw)');
    expect(src).not.toContain('__html: raw');
    expect(src).not.toContain('__html: content');
  });

  it('웰니스 목록 미리보기는 innerHTML 을 쓰지 않는다', () => {
    const src = read('components/wellness/WellnessNotificationList.js');
    expect(src).toContain('toPlainNoticePreview(');
    expect(src).not.toContain('dangerouslySetInnerHTML');
  });
});
