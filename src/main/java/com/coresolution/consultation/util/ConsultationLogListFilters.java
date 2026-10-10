package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.List;

/**
 * 상담일지 목록의 요약 미리보기·검색 파라미터.
 *
 * <p>이름은 DB에서 암호화되어 있어 SQL LIKE 로 찾지 않는다. 화면이 복호화된 명단에서
 * 고른 id 를 {@code matchedClientIds} 로 넘기고, 요약은 {@code mainIssues} 첫 줄만 비교한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-10
 */
public final class ConsultationLogListFilters {

    /** 목록에 실을 요약 첫 줄 최대 길이. 본문 전문은 단건 조회에만 둔다. */
    public static final int SUMMARY_PREVIEW_MAX_LENGTH = 80;

    /** 이름 검색에 맞는 내담자가 없을 때 IN 절을 비우지 않기 위한 자리 값. */
    public static final long UNMATCHED_CLIENT_ID = -1L;

    private static final String LIKE_ESCAPE = "\\";

    private ConsultationLogListFilters() {
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }

    /**
     * 상담 내용 첫 줄을 목록 요약으로 자른다. 비어 있으면 null.
     *
     * @param source 주요 이슈 등 서술 원문
     * @return 한 줄 요약 또는 null
     */
    public static String preview(String source) {
        if (source == null) {
            return null;
        }
        String trimmed = source.strip();
        if (trimmed.isEmpty()) {
            return null;
        }
        int lineBreak = indexOfLineBreak(trimmed);
        String line = lineBreak < 0 ? trimmed : trimmed.substring(0, lineBreak).strip();
        if (line.isEmpty()) {
            return null;
        }
        if (line.length() <= SUMMARY_PREVIEW_MAX_LENGTH) {
            return line;
        }
        return line.substring(0, SUMMARY_PREVIEW_MAX_LENGTH);
    }

    /**
     * @param value 요청 문자열
     * @return 공백이 아닌 문자가 있으면 true
     */
    public static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    /**
     * 쉼표로 구분된 내담자 id. 0 이하·정수가 아닌 토큰은 버린다.
     *
     * @param raw 쿼리 값
     * @return id 목록. 비어 있을 수 있다
     */
    public static List<Long> parseMatchedClientIds(String raw) {
        List<Long> ids = new ArrayList<>();
        if (!hasText(raw)) {
            return ids;
        }
        String[] tokens = raw.split(",");
        for (String token : tokens) {
            if (token == null) {
                continue;
            }
            String trimmed = token.strip();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                long id = Long.parseLong(trimmed);
                if (id > 0) {
                    ids.add(id);
                }
            } catch (NumberFormatException ignored) {
                // 잘못된 토큰은 검색 조건에서 제외한다.
            }
        }
        return ids;
    }

    /**
     * LIKE 패턴. {@code %} {@code _} {@code \} 는 이스케이프한다.
     *
     * @param keyword 사용자 검색어
     * @return 소문자 부분 일치 패턴
     */
    public static String likePattern(String keyword) {
        String cleaned = keyword.strip()
                .replace(LIKE_ESCAPE, LIKE_ESCAPE + LIKE_ESCAPE)
                .replace("%", LIKE_ESCAPE + "%")
                .replace("_", LIKE_ESCAPE + "_");
        return "%" + cleaned.toLowerCase() + "%";
    }

    private static int indexOfLineBreak(String value) {
        int newline = value.indexOf('\n');
        int carriage = value.indexOf('\r');
        if (newline < 0) {
            return carriage;
        }
        if (carriage < 0) {
            return newline;
        }
        return Math.min(newline, carriage);
    }
}
