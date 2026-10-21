package com.coresolution.consultation.constant;

import java.util.List;

/**
 * 공지·웰니스 본문 HTML 허용 목록.
 * 태그·속성·프로토콜은 이 상수만 쓰고, sanitizer 구현에 문자열로 박지 않는다.
 * 화면({@code frontend/src/constants/safeHtmlPolicy.js})과 같은 목록이다.
 *
 * @author MindGarden
 * @since 2026-10-21
 */
public final class RichNoticeHtmlPolicy {

    /** 제목, 문단, 목록, 링크, 강조, 줄바꿈. */
    public static final List<String> ALLOWED_TAGS = List.of(
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "ul", "ol", "li", "a", "strong", "b", "em", "br");

    /** 링크에 남기는 속성. */
    public static final List<String> ALLOWED_ATTRIBUTES = List.of("href", "rel");

    /** 앵커 태그 이름. */
    public static final String ANCHOR_TAG = "a";

    /** href 속성 이름. */
    public static final String HREF_ATTRIBUTE = "href";

    /** rel 속성 이름. */
    public static final String REL_ATTRIBUTE = "rel";

    /**
     * jsoup {@code addProtocols} 에 넘기는 스킴. 콜론 없음.
     * http(s) 와 mailto 만 허용한다.
     */
    public static final List<String> ALLOWED_URI_PROTOCOLS = List.of("http", "https", "mailto");

    /**
     * 정화 후 href 가 시작해야 하는 접두사.
     * 상대 경로와 프로토콜 상대({@code //})는 포함하지 않는다.
     */
    public static final List<String> ALLOWED_HREF_PREFIXES = List.of(
            "https://", "http://", "mailto:");

    /** rel 을 붙이는 http(s) 절대 URL 접두사. */
    public static final List<String> HTTP_HREF_PREFIXES = List.of("https://", "http://");

    /** 태그와 그 안의 텍스트를 함께 버리는 태그. */
    public static final List<String> DROP_CONTENT_TAGS = List.of("script", "style", "iframe");

    /** 외부 http(s) 링크에 붙이는 rel. */
    public static final String EXTERNAL_LINK_REL = "noopener noreferrer";

    /** 프로토콜 난독화를 푸는 최대 횟수. */
    public static final int PROTOCOL_DECODE_PASSES = 5;

    private RichNoticeHtmlPolicy() {
        throw new UnsupportedOperationException("utility");
    }
}
