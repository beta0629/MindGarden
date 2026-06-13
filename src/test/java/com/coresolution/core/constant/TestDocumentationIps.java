package com.coresolution.core.constant;

/**
 * RFC 5737 문서용(test-only) IP — 하드코딩 검사 상수화 및 단위 테스트 가독성.
 */
public final class TestDocumentationIps {

    private TestDocumentationIps() {
    }

    /** TEST-NET-2 (예: 198.51.100.0/24) */
    public static final String DOC_NET_2_EXAMPLE = "198.51.100.2";

    /** TEST-NET-3 (예: 203.0.113.0/24) */
    public static final String DOC_NET_3_EXAMPLE = "203.0.113.1";

    /** RFC 5737 documentation block — 모바일 중복 로그인 테스트의 primary 디바이스 IP (PR #293). */
    public static final String DOC_NET_3_DEVICE_PRIMARY = "203.0.113.10";

    /** RFC 5737 documentation block — 모바일 중복 로그인 테스트의 secondary 디바이스 IP (PR #293). */
    public static final String DOC_NET_3_DEVICE_SECONDARY = "203.0.113.42";

    /** RFC 5737 documentation block — X-Real-IP 프록시 홉 시나리오용 (PR #293). */
    public static final String DOC_NET_2_PROXY_HOP = "198.51.100.7";
}
