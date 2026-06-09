package com.coresolution.consultation.util;

/**
 * 로그 출력용 이메일 마스킹 유틸.
 *
 * <p>운영 BE 로그에서 식별된 이메일 평문 노출(예: BadCredentials 흐름)을 PII 마스킹 정책에 맞춰 일괄 처리하기 위한 표준 유틸이다.
 * {@link PhoneLogMasking}와 동일 계열로, 단순 문자열 변환만 수행하며 외부 의존성·설정 기반 규칙은 갖지 않는다.</p>
 *
 * <p>마스킹 규칙:</p>
 * <ul>
 *     <li>{@code null}, 빈 문자열, {@code @} 가 없거나 1개가 아니면 원본 그대로 반환</li>
 *     <li>local part: 첫 1글자 + {@code ***} (1글자 이하면 전체를 {@code ***})</li>
 *     <li>domain part: 마지막 {@code .} 기준 분할 — host 첫 1글자 + {@code ***}, TLD 는 첫 {@code .} 이후 보존</li>
 *     <li>{@code .} 없는 도메인은 host 전체에 동일 규칙 적용</li>
 * </ul>
 *
 * <p>예시: {@code jctdoys@gmail.com → j***@g***.com}, {@code a@b.co.kr → a***@b***.co.kr},
 * {@code test@local → t***@l***}.</p>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
public final class EmailLogMasking {

    private static final String MASK = "***";

    private EmailLogMasking() {
    }

    /**
     * 로그용 이메일 마스킹.
     *
     * @param email 원본 이메일(평문)
     * @return 마스킹된 이메일 또는 파싱 불가 시 원본 그대로
     */
    public static String maskForLog(String email) {
        if (email == null || email.isEmpty()) {
            return email;
        }

        int firstAt = email.indexOf('@');
        int lastAt = email.lastIndexOf('@');
        if (firstAt < 0 || firstAt != lastAt) {
            return email;
        }

        String local = email.substring(0, firstAt);
        String domain = email.substring(firstAt + 1);
        if (local.isEmpty() || domain.isEmpty()) {
            return email;
        }

        return maskLocal(local) + "@" + maskDomain(domain);
    }

    private static String maskLocal(String local) {
        if (local.length() <= 1) {
            return MASK;
        }
        return local.charAt(0) + MASK;
    }

    private static String maskDomain(String domain) {
        int dotIndex = domain.indexOf('.');
        if (dotIndex < 0) {
            return maskHost(domain);
        }
        String host = domain.substring(0, dotIndex);
        String tld = domain.substring(dotIndex);
        return maskHost(host) + tld;
    }

    private static String maskHost(String host) {
        if (host.isEmpty()) {
            return MASK;
        }
        if (host.length() <= 1) {
            return MASK;
        }
        return host.charAt(0) + MASK;
    }
}
