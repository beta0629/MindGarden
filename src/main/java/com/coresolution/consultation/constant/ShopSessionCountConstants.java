package com.coresolution.consultation.constant;

/**
 * 샵 카탈로그 회기수·단회기/패키지 구분 상수.
 *
 * <p>매직 넘버 분산 금지 — 회기수 임계·패키지 유형은 이 클래스만 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-17
 */
public final class ShopSessionCountConstants {

    /** 회기수 최소값(양의 정수). */
    public static final int MIN_SESSION_COUNT = 1;

    /**
     * 단회기 판정 임계값.
     * <p>{@code sessionCount == SINGLE_SESSION_COUNT} → 단회기, {@code >} → 패키지.</p>
     */
    public static final int SINGLE_SESSION_COUNT = 1;

    /** 패키지 유형 코드 — 단회기. */
    public static final String PACKAGE_TYPE_SINGLE = "SINGLE";

    /** 패키지 유형 코드 — 다회기 패키지. */
    public static final String PACKAGE_TYPE_PACKAGE = "PACKAGE";

    public static final String MSG_SESSION_COUNT_REQUIRED = "회기수는 1 이상의 양의 정수여야 합니다.";

    private ShopSessionCountConstants() {
    }

    /**
     * 회기수로 단회기/패키지 유형을 판정한다.
     *
     * @param sessionCount 회기수
     * @return {@link #PACKAGE_TYPE_SINGLE} 또는 {@link #PACKAGE_TYPE_PACKAGE}
     */
    public static String resolvePackageType(int sessionCount) {
        if (sessionCount <= SINGLE_SESSION_COUNT) {
            return PACKAGE_TYPE_SINGLE;
        }
        return PACKAGE_TYPE_PACKAGE;
    }

    /**
     * 단회기 여부.
     *
     * @param sessionCount 회기수
     * @return 단회기이면 true
     */
    public static boolean isSingleSession(int sessionCount) {
        return sessionCount == SINGLE_SESSION_COUNT;
    }

    /**
     * 라인 수량까지 반영한 매핑 가산 회기수를 계산한다.
     *
     * @param sessionCountPerUnit SKU 회기수(양의 정수)
     * @param quantity 주문 수량(양의 정수)
     * @return 가산할 총 회기수
     * @throws IllegalArgumentException 인자가 유효하지 않거나 곱셈 오버플로
     */
    public static int resolveSessionsToGrant(int sessionCountPerUnit, int quantity) {
        if (sessionCountPerUnit < MIN_SESSION_COUNT) {
            throw new IllegalArgumentException(MSG_SESSION_COUNT_REQUIRED);
        }
        if (quantity < MIN_SESSION_COUNT) {
            throw new IllegalArgumentException("수량은 1 이상이어야 합니다.");
        }
        try {
            return Math.multiplyExact(sessionCountPerUnit, quantity);
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException("회기수 합산 결과가 허용 범위를 초과합니다.", ex);
        }
    }
}
