package com.coresolution.consultation.constant;

/**
 * 포인트 원장 UI 라벨 i18n 키 SSOT.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class PointLedgerEntryLabels {

    private static final String PREFIX = "shop.point.ledger.";

    public static final String EARN = PREFIX + "earn";
    public static final String COMMIT = PREFIX + "commit";
    public static final String HOLD = PREFIX + "hold";
    public static final String RELEASE = PREFIX + "release";
    public static final String COMMIT_REVERSAL = PREFIX + "commit_reversal";
    public static final String CLAWBACK = PREFIX + "clawback";

    /** 원장 목록 기본 조회 건수 */
    public static final int DEFAULT_LIST_LIMIT = 20;

    /** 원장 목록 최대 조회 건수 */
    public static final int MAX_LIST_LIMIT = 100;

    /**
     * 원장 유형에 대응하는 i18n 라벨 키.
     *
     * @param type 원장 유형
     * @return 라벨 키
     */
    public static String labelKeyFor(PointLedgerEntryType type) {
        return switch (type) {
            case EARN -> EARN;
            case COMMIT -> COMMIT;
            case HOLD -> HOLD;
            case RELEASE -> RELEASE;
            case COMMIT_REVERSAL -> COMMIT_REVERSAL;
            case CLAWBACK -> CLAWBACK;
        };
    }

    private PointLedgerEntryLabels() {
        throw new UnsupportedOperationException("utility");
    }
}
