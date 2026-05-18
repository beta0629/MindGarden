package com.coresolution.consultation.util;

/**
 * 모바일 앱 semver 비교 (메이저·마이너·패치 숫자만, 접미사 무시).
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public final class MobileSemverUtils {

    private MobileSemverUtils() {
    }

    /**
     * @param left  클라이언트 버전
     * @param right 최소 허용 버전
     * @return left &lt; right 이면 음수, 같으면 0, 크면 양수. 파싱 실패 시 left를 더 낮게 간주
     */
    public static int compare(String left, String right) {
        int[] l = parseParts(left);
        int[] r = parseParts(right);
        for (int i = 0; i < 3; i++) {
            if (l[i] != r[i]) {
                return Integer.compare(l[i], r[i]);
            }
        }
        return 0;
    }

    /**
     * @param left  클라이언트 버전
     * @param right 최소 허용 버전
     * @return left가 right보다 낮으면 true
     */
    public static boolean isLessThan(String left, String right) {
        return compare(left, right) < 0;
    }

    private static int[] parseParts(String version) {
        int[] parts = new int[] {0, 0, 0};
        if (version == null || version.isBlank()) {
            return parts;
        }
        String core = version.trim().split("-")[0].split("\\+")[0];
        String[] tokens = core.split("\\.");
        for (int i = 0; i < Math.min(3, tokens.length); i++) {
            parts[i] = parseIntSafe(tokens[i]);
        }
        return parts;
    }

    private static int parseIntSafe(String token) {
        if (token == null || token.isBlank()) {
            return 0;
        }
        String digits = token.replaceAll("[^0-9].*$", "").replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            return 0;
        }
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
