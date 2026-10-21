package com.coresolution.consultation.util;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import com.coresolution.consultation.constant.RichNoticeHtmlPolicy;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Entities;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;

/**
 * 공지·웰니스({@code SystemNotification} content) 저장용 HTML 정화.
 *
 * <p>jsoup {@link Safelist} 한 곳에서 허용 목록을 적용한다.
 * script·style·iframe 은 내용까지 버리고, 그 외 비허용 태그는 태그만 벗긴다.
 * 링크는 http(s)·mailto 만 남긴다. 요청 호스트를 이 계층에서 알 수 없으므로
 * http(s) 절대 URL 은 외부 링크로 보고 {@code rel="noopener noreferrer"} 를 붙인다.
 * 화면은 같은 허용 목록으로 다시 거른다. 이미 저장된 행은 여기서 고치지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-10-21
 */
public final class RichNoticeHtmlSanitizer {

    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\u0000-\\u001F\\u007F]");

    private static final Pattern INSPECTION_GAP = Pattern.compile("[\\u0000-\\u001F\\u007F\\s]+");

    private RichNoticeHtmlSanitizer() {
        throw new UnsupportedOperationException("utility");
    }

    /**
     * 저장 직전 본문을 정화한다.
     *
     * @param html 원본 HTML. null 이면 null
     * @return 정화된 HTML. 빈 문자열은 빈 문자열
     */
    public static String sanitize(String html) {
        if (html == null || html.isEmpty()) {
            return html;
        }
        Document dirty = Jsoup.parseBodyFragment(html);
        dirty.outputSettings(outputSettings());
        dirty.select(String.join(",", RichNoticeHtmlPolicy.DROP_CONTENT_TAGS)).remove();
        String cleaned = Jsoup.clean(
                dirty.body().html(),
                "",
                noticeSafelist(),
                outputSettings());
        Document safe = Jsoup.parseBodyFragment(cleaned);
        safe.outputSettings(outputSettings());
        applyLinkPolicy(safe.body());
        return safe.body().html();
    }

    /**
     * @return pretty-print 없이 UTF-8 로 직렬화하는 설정
     */
    private static Document.OutputSettings outputSettings() {
        return new Document.OutputSettings()
                .prettyPrint(false)
                .charset(StandardCharsets.UTF_8)
                .escapeMode(Entities.EscapeMode.base);
    }

    /**
     * @return 허용 태그·속성·프로토콜만 연 새 Safelist
     */
    private static Safelist noticeSafelist() {
        Safelist safelist = Safelist.none();
        safelist.addTags(RichNoticeHtmlPolicy.ALLOWED_TAGS.toArray(String[]::new));
        safelist.addAttributes(
                RichNoticeHtmlPolicy.ANCHOR_TAG,
                RichNoticeHtmlPolicy.ALLOWED_ATTRIBUTES.toArray(String[]::new));
        safelist.addProtocols(
                RichNoticeHtmlPolicy.ANCHOR_TAG,
                RichNoticeHtmlPolicy.HREF_ATTRIBUTE,
                RichNoticeHtmlPolicy.ALLOWED_URI_PROTOCOLS.toArray(String[]::new));
        return safelist;
    }

    /**
     * @param body 정화된 body
     */
    private static void applyLinkPolicy(Element body) {
        if (body == null) {
            return;
        }
        List<Element> anchors = new ArrayList<>(body.select(RichNoticeHtmlPolicy.ANCHOR_TAG));
        for (Element anchor : anchors) {
            String rawHref = anchor.attr(RichNoticeHtmlPolicy.HREF_ATTRIBUTE);
            String stored = CONTROL_CHARS.matcher(rawHref).replaceAll("").trim();
            if (!isAllowedHref(stored)) {
                anchor.unwrap();
                continue;
            }
            anchor.attr(RichNoticeHtmlPolicy.HREF_ATTRIBUTE, stored);
            if (isAbsoluteHttp(stored)) {
                anchor.attr(RichNoticeHtmlPolicy.REL_ATTRIBUTE, RichNoticeHtmlPolicy.EXTERNAL_LINK_REL);
            } else {
                anchor.removeAttr(RichNoticeHtmlPolicy.REL_ATTRIBUTE);
            }
            List<String> attributeNames = new ArrayList<>();
            anchor.attributes().forEach(attribute -> attributeNames.add(attribute.getKey()));
            for (String name : attributeNames) {
                if (!RichNoticeHtmlPolicy.HREF_ATTRIBUTE.equals(name)
                        && !RichNoticeHtmlPolicy.REL_ATTRIBUTE.equals(name)) {
                    anchor.removeAttr(name);
                }
            }
        }
    }

    /**
     * @param href 제어문자를 뺀 href
     * @return 원문과 디코드 결과가 모두 허용 접두사로 시작하면 true
     */
    private static boolean isAllowedHref(String href) {
        if (href == null || href.isBlank()) {
            return false;
        }
        String stored = CONTROL_CHARS.matcher(href).replaceAll("").trim();
        if (!startsWithPrefix(stored, RichNoticeHtmlPolicy.ALLOWED_HREF_PREFIXES)) {
            return false;
        }
        return startsWithPrefix(decodeForProtocol(stored), RichNoticeHtmlPolicy.ALLOWED_HREF_PREFIXES);
    }

    /**
     * 서버는 공개 호스트를 소스에 박지 않는다.
     * http(s) 절대 URL 은 모두 외부 링크로 본다.
     *
     * @param href 제어문자를 뺀 href
     * @return http(s) 절대 URL 이면 true
     */
    private static boolean isAbsoluteHttp(String href) {
        String inspected = decodeForProtocol(CONTROL_CHARS.matcher(href).replaceAll("").trim());
        return startsWithPrefix(inspected, RichNoticeHtmlPolicy.HTTP_HREF_PREFIXES);
    }

    /**
     * @param value 검사할 문자열
     * @param prefixes 허용 접두사
     * @return 대소문자 무시하고 접두사 중 하나로 시작하면 true
     */
    private static boolean startsWithPrefix(String value, List<String> prefixes) {
        String lower = value == null ? "" : value.toLowerCase(Locale.ROOT);
        for (String prefix : prefixes) {
            if (lower.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 엔티티·퍼센트 인코딩과 공백을 반복해서 풀어 프로토콜을 판정한다.
     *
     * @param raw href
     * @return 판정용 문자열
     */
    private static String decodeForProtocol(String raw) {
        String current = raw == null ? "" : raw;
        for (int pass = 0; pass < RichNoticeHtmlPolicy.PROTOCOL_DECODE_PASSES; pass++) {
            String stripped = INSPECTION_GAP.matcher(current).replaceAll("");
            String entityDecoded = Parser.unescapeEntities(stripped, true);
            String percentDecoded = percentDecode(entityDecoded);
            percentDecoded = INSPECTION_GAP.matcher(percentDecoded).replaceAll("");
            if (percentDecoded.equals(current)) {
                return percentDecoded;
            }
            current = percentDecoded;
        }
        return INSPECTION_GAP.matcher(current).replaceAll("");
    }

    /**
     * {@code +} 를 공백으로 바꾸지 않고 퍼센트 디코드한다.
     *
     * @param value 인코딩된 문자열
     * @return 디코드 결과. 깨진 시퀀스면 원문
     */
    private static String percentDecode(String value) {
        try {
            return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return value;
        }
    }
}
