package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 공지·웰니스 본문 HTML 정화.
 * 저장 전 jsoup Safelist 가 script·위험 URL 을 거르는지 확인한다.
 *
 * @author MindGarden
 * @since 2026-10-21
 */
@DisplayName("RichNoticeHtmlSanitizer — 공지 본문 XSS")
class RichNoticeHtmlSanitizerTest {

    @Test
    @DisplayName("null 과 빈 문자열은 그대로 돌려준다")
    void nullAndEmptyStay() {
        assertThat(RichNoticeHtmlSanitizer.sanitize(null)).isNull();
        assertThat(RichNoticeHtmlSanitizer.sanitize("")).isEmpty();
    }

    @Test
    @DisplayName("평문과 허용 태그는 남긴다")
    void allowedTagsStay() {
        assertThat(RichNoticeHtmlSanitizer.sanitize("안녕")).isEqualTo("안녕");
        String input = "<h1>일</h1><h2>이</h2><h3>삼</h3><h4>사</h4><h5>오</h5><h6>육</h6>"
                + "<p>문단 <strong>굵게</strong> <b>b</b> <em>기울임</em></p>"
                + "<ul><li>하나</li></ul><ol><li>둘</li></ol><br>";
        String out = RichNoticeHtmlSanitizer.sanitize(input);
        assertThat(out).contains("<h1>", "<h2>", "<h3>", "<h4>", "<h5>", "<h6>");
        assertThat(out).contains("<p>", "<strong>", "<b>", "<em>", "<ul>", "<ol>", "<li>", "<br");
        assertThat(out).contains("문단", "하나", "둘");
    }

    @Test
    @DisplayName("img onerror 를 제거한다")
    void stripsImgOnError() {
        String out = RichNoticeHtmlSanitizer.sanitize("<p>안녕</p><img src=x onerror=alert(1)>");
        assertThat(out).contains("안녕");
        assertNoActivePayload(out);
        assertThat(out).doesNotContain("alert(1)");
    }

    @Test
    @DisplayName("script 태그와 내용을 제거한다")
    void stripsScriptAndContent() {
        String out = RichNoticeHtmlSanitizer.sanitize("<p>본문</p><script>alert(1)</script>");
        assertThat(out).contains("본문");
        assertNoActivePayload(out);
        assertThat(out).doesNotContain("alert(1)");
    }

    @Test
    @DisplayName("중첩 script 가 태그로 다시 만들어지지 않는다")
    void nestedScriptDoesNotReconstruct() {
        String out = RichNoticeHtmlSanitizer.sanitize(
                "<scr<script>ipt>alert(1)</scr</script>ipt><p>본문</p>");
        assertThat(out).contains("본문");
        assertNoActivePayload(out);
    }

    @Test
    @DisplayName("style 과 iframe 은 내용까지 제거한다")
    void stripsStyleAndIframeWithContent() {
        String out = RichNoticeHtmlSanitizer.sanitize(
                "<style>body{background:url(\"javascript:alert(1)\")}</style>"
                        + "<iframe src=\"https://evil.example\">숨김</iframe><p>본문</p>");
        assertThat(out).contains("본문");
        assertThat(out).doesNotContain("숨김");
        assertNoActivePayload(out);
    }

    @Test
    @DisplayName("svg onload 를 제거하고 텍스트는 남긴다")
    void unwrapsSvgAndDropsOnload() {
        String out = RichNoticeHtmlSanitizer.sanitize(
                "<svg onload=\"alert(1)\"><text>캡션</text></svg><p>본문</p>");
        assertThat(out).contains("캡션", "본문");
        assertNoActivePayload(out);
        assertThat(out).doesNotContain("alert(1)");
    }

    @Test
    @DisplayName("비허용 태그는 태그만 벗기고 텍스트는 남긴다")
    void unwrapsDisallowedTags() {
        String out = RichNoticeHtmlSanitizer.sanitize(
                "<span>남김</span><div onclick=\"alert(1)\">상자</div>");
        assertThat(out).contains("남김", "상자");
        assertThat(out.toLowerCase()).doesNotContain("<span", "<div");
        assertNoActivePayload(out);
    }

    @Test
    @DisplayName("javascript: data: vbscript: 링크는 태그를 벗긴다")
    void stripsDangerousProtocols() {
        String javascript = RichNoticeHtmlSanitizer.sanitize("<a href=\"javascript:alert(1)\">여기</a>");
        String data = RichNoticeHtmlSanitizer.sanitize(
                "<a href=\"data:text/html,x\">자료</a>");
        String vbscript = RichNoticeHtmlSanitizer.sanitize("<a href=\"vbscript:msgbox(1)\">브이</a>");
        assertThat(javascript).contains("여기").doesNotContain("<a");
        assertThat(data).contains("자료").doesNotContain("<a");
        assertThat(vbscript).contains("브이").doesNotContain("<a");
        assertNoActivePayload(javascript);
        assertNoActivePayload(data);
        assertNoActivePayload(vbscript);
    }

    @Test
    @DisplayName("엔티티·퍼센트로 감춘 javascript: 를 통과시키지 않는다")
    void stripsEncodedJavascript() {
        String entity = RichNoticeHtmlSanitizer.sanitize(
                "<a href=\"&#106;avascript:alert(1)\">엔티티</a>");
        String percent = RichNoticeHtmlSanitizer.sanitize(
                "<a href=\"%6Aavascript:alert(1)\">퍼센트</a>");
        String doubled = RichNoticeHtmlSanitizer.sanitize(
                "<a href=\"%256Aavascript:alert(1)\">이중</a>");
        assertThat(entity).contains("엔티티").doesNotContain("<a");
        assertThat(percent).contains("퍼센트").doesNotContain("<a");
        assertThat(doubled).contains("이중").doesNotContain("<a");
        assertNoActivePayload(entity);
        assertNoActivePayload(percent);
        assertNoActivePayload(doubled);
    }

    @Test
    @DisplayName("http(s) 링크는 남기고 rel 을 붙인다. mailto 에는 rel 을 붙이지 않는다")
    void keepsSafeLinks() {
        String external = RichNoticeHtmlSanitizer.sanitize(
                "<a href=\"https://example.com/path\">외부</a>");
        String mailto = RichNoticeHtmlSanitizer.sanitize(
                "<a href=\"mailto:help@example.com\">메일</a>");
        assertThat(external).contains("https://example.com/path", "외부");
        assertThat(external).contains("rel=\"noopener noreferrer\"");
        assertThat(mailto).contains("mailto:help@example.com", "메일");
        assertThat(mailto).doesNotContain("rel=");
        assertNoActivePayload(external);
        assertNoActivePayload(mailto);
    }

    @Test
    @DisplayName("상대 경로와 프로토콜 상대 URL 은 링크로 남기지 않는다")
    void stripsRelativeLinks() {
        String relative = RichNoticeHtmlSanitizer.sanitize("<a href=\"/admin\">상대</a>");
        String protocolRelative = RichNoticeHtmlSanitizer.sanitize(
                "<a href=\"//evil.example\">프로토콜</a>");
        assertThat(relative).contains("상대").doesNotContain("<a");
        assertThat(protocolRelative).contains("프로토콜").doesNotContain("<a");
    }

    @Test
    @DisplayName("같은 본문을 두 번 정화해도 위험 태그가 되살아나지 않는다")
    void secondPassStaysClean() {
        String once = RichNoticeHtmlSanitizer.sanitize(
                "<p>본문</p><script>alert(1)</script><a href=\"https://example.com\">링크</a>");
        String twice = RichNoticeHtmlSanitizer.sanitize(once);
        assertNoActivePayload(twice);
        assertThat(twice).contains("본문", "링크", "https://example.com");
        assertThat(twice).contains("rel=\"noopener noreferrer\"");
    }

    private static void assertNoActivePayload(String out) {
        String lower = out.toLowerCase();
        assertThat(lower).doesNotContain("<script");
        assertThat(lower).doesNotContain("</script");
        assertThat(lower).doesNotContain("<style");
        assertThat(lower).doesNotContain("<iframe");
        assertThat(lower).doesNotContain("<img");
        assertThat(lower).doesNotContain("<svg");
        assertThat(lower).doesNotContain("javascript:");
        assertThat(lower).doesNotContain("vbscript:");
        assertThat(lower).doesNotContain("data:");
        assertThat(lower).doesNotContain("onerror");
        assertThat(lower).doesNotContain("onload");
        assertThat(lower).doesNotContain("onclick");
    }
}
