package com.coresolution.consultation.util;

import java.util.Map;
import com.coresolution.consultation.constant.MappingStatusConstants;

/**
 * 내담자 결제 내역 money-path SSOT — 페이로드 Map 기준 환불·취소 판별·금액 해석.
 *
 * <p>프론트 {@code clientPaymentHistoryDisplay} 와 동일 우선순위:
 * pgAmount → paymentAmount → lineTotalMinor → cashDueMinor → packagePrice.</p>
 *
 * @author CoreSolution
 * @since 2026-09-18
 */
public final class ClientPaymentHistorySsotUtils {

    private ClientPaymentHistorySsotUtils() {
    }

    /**
     * 환불·취소 행인지 (effectivePaymentStatus / paymentStatus / orderStatus / pgPaymentStatus).
     *
     * @param payload 매핑 페이로드 (nullable)
     * @return 환불 또는 취소이면 true
     */
    public static boolean isRefundedOrCancelled(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return false;
        }
        String effective = firstNonBlank(
                payload.get("effectivePaymentStatus"),
                payload.get("paymentStatus"));
        if (MappingStatusConstants.REFUNDED.equals(effective)
                || MappingStatusConstants.CANCELLED.equals(effective)) {
            return true;
        }
        String orderStatus = normalizeUpper(payload.get("orderStatus"));
        if (MappingStatusConstants.REFUNDED.equals(orderStatus)
                || MappingStatusConstants.CANCELLED.equals(orderStatus)) {
            return true;
        }
        String pgPaymentStatus = normalizeUpper(payload.get("pgPaymentStatus"));
        return MappingStatusConstants.REFUNDED.equals(pgPaymentStatus)
                || MappingStatusConstants.CANCELLED.equals(pgPaymentStatus);
    }

    /**
     * SSOT 금액 (없으면 0). packagePrice는 최후순위.
     *
     * @param payload 매핑 페이로드 (nullable)
     * @return 금액(원 단위 long)
     */
    public static long resolveAmount(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return 0L;
        }
        Long pgAmount = toLongOrNull(payload.get("pgAmount"));
        if (pgAmount != null) {
            return pgAmount;
        }
        Long paymentAmount = toLongOrNull(payload.get("paymentAmount"));
        if (paymentAmount != null) {
            return paymentAmount;
        }
        Long lineTotalMinor = toLongOrNull(payload.get("lineTotalMinor"));
        if (lineTotalMinor != null) {
            return lineTotalMinor;
        }
        Long cashDueMinor = toLongOrNull(payload.get("cashDueMinor"));
        if (cashDueMinor != null) {
            return cashDueMinor;
        }
        Long packagePrice = toLongOrNull(payload.get("packagePrice"));
        return packagePrice != null ? packagePrice : 0L;
    }

    private static String firstNonBlank(Object primary, Object secondary) {
        String first = normalizeUpper(primary);
        if (first != null) {
            return first;
        }
        return normalizeUpper(secondary);
    }

    private static String normalizeUpper(Object value) {
        if (value == null) {
            return null;
        }
        String trimmed = String.valueOf(value).trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.toUpperCase();
    }

    private static Long toLongOrNull(Object value) {
        if (value == null || "".equals(value)) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
