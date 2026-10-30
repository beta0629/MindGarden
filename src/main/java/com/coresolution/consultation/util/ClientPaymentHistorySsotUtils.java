package com.coresolution.consultation.util;

import java.util.Map;
import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;

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
        if (isRefundedOrCancelledPaymentStatus(effective)) {
            return true;
        }
        String orderStatus = normalizeUpper(payload.get("orderStatus"));
        if (isRefundedOrCancelledPaymentStatus(orderStatus)) {
            return true;
        }
        String pgPaymentStatus = normalizeUpper(payload.get("pgPaymentStatus"));
        return isRefundedOrCancelledPaymentStatus(pgPaymentStatus);
    }

    /**
     * paymentStatus 문자열만으로 환불·취소 여부 판별 (엔티티·DTO 필터용 얇은 오버로드).
     *
     * <p>{@link #isRefundedOrCancelled(Map)} 와 동일 상수 계열. CANCELLED 는 PaymentStatus enum 에
     * 없으나 문자열·Map 경로 호환을 위해 함께 판별한다.</p>
     *
     * @param paymentStatus 결제 상태 문자열 (nullable)
     * @return REFUNDED 또는 CANCELLED 이면 true
     */
    public static boolean isRefundedOrCancelledPaymentStatus(String paymentStatus) {
        String normalized = normalizeUpper(paymentStatus);
        if (normalized == null) {
            return false;
        }
        return MappingStatusConstants.REFUNDED.equals(normalized)
                || MappingStatusConstants.CANCELLED.equals(normalized);
    }

    /**
     * 엔티티 {@link PaymentStatus} 기준 환불 여부 (REFUNDED 중심).
     *
     * @param paymentStatus 결제 상태 enum (nullable)
     * @return REFUNDED 이면 true
     */
    public static boolean isRefundedOrCancelledPaymentStatus(PaymentStatus paymentStatus) {
        if (paymentStatus == null) {
            return false;
        }
        return isRefundedOrCancelledPaymentStatus(paymentStatus.name());
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
