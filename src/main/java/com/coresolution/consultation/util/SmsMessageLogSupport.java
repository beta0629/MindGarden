package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SMS 테스트 모드 로그 보강용 유틸 (본문 URL 추출 등).
 *
 * <p>DB 스키마 변경 없이 앱 로그로 링크를 확인할 때 사용한다.
 * 도메인 하드코딩 없이 {@code http(s)://} 패턴만 추출한다.
 *
 * @author MindGarden
 * @since 2026-11-24
 */
public final class SmsMessageLogSupport {

    /**
     * 본문에서 http/https URL 을 추출하는 정규식 (공백·따옴표·꺾쇠 전까지).
     */
    private static final Pattern HTTP_URL_PATTERN =
            Pattern.compile("https?://[^\\s<>\"']+", Pattern.CASE_INSENSITIVE);

    private SmsMessageLogSupport() {
    }

    /**
     * SMS 본문에서 http(s) URL 목록을 추출한다.
     *
     * @param message SMS 본문 (null/빈 문자열 허용)
     * @return 추출된 URL 목록 (불변). 없으면 빈 목록
     */
    public static List<String> extractUrls(String message) {
        if (message == null || message.isEmpty()) {
            return List.of();
        }
        Matcher matcher = HTTP_URL_PATTERN.matcher(message);
        List<String> urls = new ArrayList<>();
        while (matcher.find()) {
            urls.add(matcher.group());
        }
        if (urls.isEmpty()) {
            return List.of();
        }
        return Collections.unmodifiableList(urls);
    }
}
