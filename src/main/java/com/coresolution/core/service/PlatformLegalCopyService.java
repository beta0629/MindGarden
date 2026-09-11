package com.coresolution.core.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.util.HtmlUtils;

/**
 * 플랫폼 약관·개인정보처리방침 MD SSOT 로드·섹션 추출·조용한 HTML 렌더.
 * classpath {@code legal/clinic-os-platform-legal-copy.md} (docs/public 과 동일 본문).
 *
 * @author CoreSolution
 * @since 2026-09-10
 
 * <p>이용기간 고지 문구도 동일 classpath MD SSOT에 포함한다.*/
@Slf4j
@Service
public class PlatformLegalCopyService {

    public static final String CLASS_PATH_LEGAL_COPY = "legal/clinic-os-platform-legal-copy.md";
    public static final String SECTION_TERMS = "terms";
    public static final String SECTION_PRIVACY = "privacy";
    public static final String SECTION_REFUND = "refund";
    public static final String EMPTY_STATE_KO = "미등록 / 확인 필요";

    private static final Pattern NEXT_SECTION = Pattern.compile("\\n## (terms|privacy|refund)\\b");

    private volatile String cachedMarkdown;

    /**
     * MD 전체 본문을 반환한다 (캐시).
     *
     * @return markdown 전체, 로드 실패 시 빈 문자열
     */
    public String loadMarkdown() {
        String cached = cachedMarkdown;
        if (cached != null) {
            return cached;
        }
        synchronized (this) {
            if (cachedMarkdown != null) {
                return cachedMarkdown;
            }
            try {
                ClassPathResource resource = new ClassPathResource(CLASS_PATH_LEGAL_COPY);
                try (InputStream in = resource.getInputStream()) {
                    cachedMarkdown = StreamUtils.copyToString(in, StandardCharsets.UTF_8);
                }
            } catch (IOException e) {
                log.error("플랫폼 약관 MD 로드 실패: path={}, error={}", CLASS_PATH_LEGAL_COPY, e.getMessage(), e);
                cachedMarkdown = "";
            }
            return cachedMarkdown;
        }
    }

    /**
     * {@code ## terms} / {@code ## privacy} / {@code ## refund} 섹션 본문을 추출한다.
     *
     * @param markdown 전체 MD
     * @param sectionKey terms, privacy 또는 refund
     * @return 섹션 본문(헤딩 제외). 없으면 빈 문자열
     */
    public String extractSection(String markdown, String sectionKey) {
        if (markdown == null || markdown.isBlank()) {
            return "";
        }
        if (!SECTION_TERMS.equals(sectionKey)
                && !SECTION_PRIVACY.equals(sectionKey)
                && !SECTION_REFUND.equals(sectionKey)) {
            return "";
        }
        Pattern headingPattern = Pattern.compile(
                "(?m)^## " + Pattern.quote(sectionKey) + "\\b");
        Matcher headingMatcher = headingPattern.matcher(markdown);
        if (!headingMatcher.find()) {
            return "";
        }
        String rest = markdown.substring(headingMatcher.end());
        Matcher next = NEXT_SECTION.matcher(rest);
        String body = next.find() ? rest.substring(0, next.start()) : rest;
        return body.replaceFirst("^\\s*\\n", "").trim();
    }

    /**
     * 섹션 마크다운을 이스케이프된 조용한 HTML 조각으로 변환한다.
     *
     * @param markdownSection 섹션 본문
     * @return HTML 조각 (빈 입력이면 빈 문자열)
     */
    public String renderQuietHtml(String markdownSection) {
        if (markdownSection == null || markdownSection.isBlank()) {
            return "";
        }

        List<String> parts = new ArrayList<>();
        List<String> paragraph = new ArrayList<>();

        for (String rawLine : markdownSection.split("\\r?\\n", -1)) {
            String trimmed = rawLine.trim();

            if (trimmed.isEmpty() || "---".equals(trimmed) || trimmed.startsWith(">")) {
                flushParagraph(parts, paragraph);
                continue;
            }
            if (trimmed.startsWith("### ")) {
                flushParagraph(parts, paragraph);
                parts.add("<h3>" + HtmlUtils.htmlEscape(trimmed.substring(4).trim()) + "</h3>");
                continue;
            }
            if (trimmed.startsWith("## ")) {
                flushParagraph(parts, paragraph);
                parts.add("<h2>" + HtmlUtils.htmlEscape(trimmed.substring(3).trim()) + "</h2>");
                continue;
            }
            if (trimmed.startsWith("# ")) {
                flushParagraph(parts, paragraph);
                parts.add("<h1>" + HtmlUtils.htmlEscape(trimmed.substring(2).trim()) + "</h1>");
                continue;
            }
            if (trimmed.startsWith("- ")) {
                flushParagraph(parts, paragraph);
                parts.add("<li>" + HtmlUtils.htmlEscape(trimmed.substring(2).trim()) + "</li>");
                continue;
            }
            paragraph.add(trimmed);
        }
        flushParagraph(parts, paragraph);

        List<String> joined = new ArrayList<>();
        List<String> listBuffer = new ArrayList<>();
        for (String part : parts) {
            if (part.startsWith("<li>")) {
                listBuffer.add(part);
            } else {
                flushList(joined, listBuffer);
                joined.add(part);
            }
        }
        flushList(joined, listBuffer);
        return String.join("\n", joined);
    }

    /**
     * 문서 페이지 HTML을 조립한다. 본문 비면 빈 상태 문구.
     *
     * @param title 페이지 제목
     * @param bodyHtml 본문 HTML 조각
     * @return 전체 HTML 문서
     */
    public String wrapDocument(String title, String bodyHtml) {
        String safeTitle = HtmlUtils.htmlEscape(title == null ? "" : title);
        String content;
        if (bodyHtml == null || bodyHtml.isBlank()) {
            content = "<p>" + HtmlUtils.htmlEscape(EMPTY_STATE_KO) + "</p>";
        } else {
            content = bodyHtml;
        }
        return "<!DOCTYPE html>\n"
                + "<html lang=\"ko\">\n"
                + "<head>\n"
                + "<meta charset=\"UTF-8\">\n"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
                + "<title>" + safeTitle + "</title>\n"
                + "<style>"
                + "body{font-family:system-ui,sans-serif;line-height:1.6;max-width:48rem;"
                + "margin:0 auto;padding:1.5rem;}"
                + "article{white-space:pre-wrap;}"
                + "article p,article li,article h1,article h2,article h3{white-space:normal;}"
                + "ul{padding-left:1.25rem;}"
                + "</style>\n"
                + "</head>\n"
                + "<body>\n"
                + "<main>\n"
                + "<article>\n"
                + content + "\n"
                + "</article>\n"
                + "</main>\n"
                + "</body>\n"
                + "</html>\n";
    }

    private static void flushParagraph(List<String> parts, List<String> paragraph) {
        if (paragraph.isEmpty()) {
            return;
        }
        String text = String.join(" ", paragraph).trim();
        paragraph.clear();
        if (text.isEmpty()) {
            return;
        }
        parts.add("<p>" + HtmlUtils.htmlEscape(text) + "</p>");
    }

    private static void flushList(List<String> joined, List<String> listBuffer) {
        if (listBuffer.isEmpty()) {
            return;
        }
        joined.add("<ul>" + String.join("", listBuffer) + "</ul>");
        listBuffer.clear();
    }
}
