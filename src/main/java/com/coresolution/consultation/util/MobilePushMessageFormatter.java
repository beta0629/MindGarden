package com.coresolution.consultation.util;

import com.coresolution.consultation.entity.Schedule;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * 모바일 푸시 알림 본문 포맷(문구·일시·금액). 모든 푸시 카피는 이 클래스에 모은다.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class MobilePushMessageFormatter {

    private static final String[] KOREAN_WEEKDAY_SHORT = {"일", "월", "화", "수", "목", "금", "토"};
    private static final DateTimeFormatter TIME_HH_MM = DateTimeFormatter.ofPattern("HH:mm");
    private static final NumberFormat KOREAN_NUMBER = NumberFormat.getNumberInstance(Locale.KOREA);

    public static final String FALLBACK_CONSULTANT_NAME = "상담사";
    public static final String FALLBACK_CLIENT_NAME = "내담자";
    public static final String FALLBACK_PACKAGE_LABEL = "상담 패키지";

    private static final String BOOKING_CONFIRMED_BODY_FMT =
            "예약이 확정되었습니다.\n일시: %s\n상담사: %s";
    private static final String BOOKING_CANCELLED_CLIENT_BODY_FMT =
            "예약이 취소되었습니다.\n일시: %s\n상담사: %s";
    private static final String BOOKING_CANCELLED_CONSULTANT_BODY_FMT =
            "예약이 취소되었습니다.\n일시: %s\n내담자: %s";
    private static final String BOOKING_RESCHEDULED_CLIENT_BODY_FMT =
            "예약 일정이 변경되었습니다.\n상담사: %s\n이전: %s\n변경: %s";
    private static final String BOOKING_RESCHEDULED_CONSULTANT_BODY_FMT =
            "예약 일정이 변경되었습니다.\n내담자: %s\n이전: %s\n변경: %s";
    private static final String PAYMENT_COMPLETED_BODY_FMT = "%s %s원 결제가 완료되었습니다.";
    private static final String PAYMENT_COMPLETED_BODY_NO_AMOUNT_FMT = "%s 결제가 완료되었습니다.";
    private static final String PAYMENT_FAILED_BODY_FMT = "%s %s원 결제에 실패했습니다.";
    private static final String PAYMENT_FAILED_BODY_NO_AMOUNT_FMT = "%s 결제에 실패했습니다.";
    private static final String MAPPING_PAYMENT_PUSH_BODY_FMT = "패키지: %s\n금액: %s원\n결제가 확인되었습니다.";
    private static final String MAPPING_DEPOSIT_PUSH_BODY_FMT = "패키지: %s\n금액: %s원\n입금이 확인되었습니다.";
    private static final String SHOP_ORDER_PAID_BODY_FMT = "주문번호 %s\n%s원 결제가 완료되었습니다.";
    private static final String SHOP_PAYMENT_FAILED_BODY_FMT = "주문번호 %s\n결제에 실패했습니다. 다시 시도해 주세요.";
    private static final String POINT_EARNED_BODY_FMT = "주문번호 %s\n%sP가 적립되었습니다.";
    private static final String SHOP_HOLD_EXPIRED_BODY_FMT = "주문번호 %s\n결제 대기 시간이 지나 주문이 만료되었습니다.";
    private static final String SHOP_REFUNDED_BODY_FMT = "주문번호 %s\n%s원 환불이 완료되었습니다.";
    private static final String SHOP_FULFILLMENT_CLIENT_BODY_FMT = "주문번호 %s\n상담 패키지 주문 처리가 완료되었습니다.";
    private static final String SHOP_FULFILLMENT_CONSULTANT_BODY_FMT = "주문번호 %s\n내담자 상담 패키지 주문이 처리되었습니다.";
    private static final String BOOKING_REMINDER_SLOT_PREFIX = "\n\n일시: ";

    private MobilePushMessageFormatter() {
    }

    /**
     * 예약 일시 한 줄 표기. 예: {@code 2026-05-20 (월) 14:00–15:00}
     *
     * @param date 일자
     * @param start 시작 시각
     * @param end 종료 시각
     * @return 포맷 문자열
     */
    public static String formatScheduleSlot(LocalDate date, LocalTime start, LocalTime end) {
        if (date == null) {
            return "";
        }
        String datePart = date + " (" + koreanWeekdayShort(date.getDayOfWeek()) + ")";
        if (start == null) {
            return datePart;
        }
        if (end == null) {
            return datePart + " " + formatTime(start);
        }
        return datePart + " " + formatTime(start) + "–" + formatTime(end);
    }

    /**
     * 예약 확정 푸시 본문.
     */
    public static String buildBookingConfirmedBody(Schedule schedule, String consultantName) {
        String slot = formatScheduleSlot(schedule.getDate(), schedule.getStartTime(), schedule.getEndTime());
        return String.format(
                BOOKING_CONFIRMED_BODY_FMT,
                slot,
                nonBlankOr(consultantName, FALLBACK_CONSULTANT_NAME));
    }

    /**
     * 예약 취소 푸시 본문(내담자·상담사).
     */
    public static String buildBookingCancelledBody(
            Schedule schedule, String consultantName, String clientName, boolean forConsultant) {
        String slot = formatScheduleSlot(schedule.getDate(), schedule.getStartTime(), schedule.getEndTime());
        if (forConsultant) {
            return String.format(
                    BOOKING_CANCELLED_CONSULTANT_BODY_FMT,
                    slot,
                    nonBlankOr(clientName, FALLBACK_CLIENT_NAME));
        }
        return String.format(
                BOOKING_CANCELLED_CLIENT_BODY_FMT,
                slot,
                nonBlankOr(consultantName, FALLBACK_CONSULTANT_NAME));
    }

    /**
     * 예약 일정 변경 푸시 본문.
     */
    public static String buildBookingRescheduledBody(
            String oldSlot,
            String newSlot,
            String consultantName,
            String clientName,
            boolean forConsultant) {
        if (forConsultant) {
            return String.format(
                    BOOKING_RESCHEDULED_CONSULTANT_BODY_FMT,
                    nonBlankOr(clientName, FALLBACK_CLIENT_NAME),
                    nonBlankOr(oldSlot, "-"),
                    nonBlankOr(newSlot, "-"));
        }
        return String.format(
                BOOKING_RESCHEDULED_CLIENT_BODY_FMT,
                nonBlankOr(consultantName, FALLBACK_CONSULTANT_NAME),
                nonBlankOr(oldSlot, "-"),
                nonBlankOr(newSlot, "-"));
    }

    /**
     * PG 결제 완료 푸시 본문.
     */
    public static String buildPaymentCompletedBody(BigDecimal amount, String packageOrDesc) {
        String label = nonBlankOr(packageOrDesc, FALLBACK_PACKAGE_LABEL);
        String amountLabel = formatAmount(amount);
        if (amountLabel.isEmpty()) {
            return String.format(PAYMENT_COMPLETED_BODY_NO_AMOUNT_FMT, label);
        }
        return String.format(PAYMENT_COMPLETED_BODY_FMT, label, amountLabel);
    }

    /**
     * PG 결제 실패 푸시 본문.
     */
    public static String buildPaymentFailedBody(BigDecimal amount, String packageOrDesc, String failureReason) {
        if (failureReason != null && !failureReason.isBlank()) {
            return failureReason.trim();
        }
        String label = nonBlankOr(packageOrDesc, FALLBACK_PACKAGE_LABEL);
        String amountLabel = formatAmount(amount);
        if (amountLabel.isEmpty()) {
            return String.format(PAYMENT_FAILED_BODY_NO_AMOUNT_FMT, label);
        }
        return String.format(PAYMENT_FAILED_BODY_FMT, label, amountLabel);
    }

    /**
     * 어드민 매칭 결제 확인 푸시 본문.
     */
    public static String buildMappingPaymentConfirmedPushBody(String packageName, String amountLabel) {
        return String.format(
                MAPPING_PAYMENT_PUSH_BODY_FMT,
                nonBlankOr(packageName, FALLBACK_PACKAGE_LABEL),
                formatAmountLabel(amountLabel));
    }

    /**
     * 어드민 매칭 입금 확인 푸시 본문.
     */
    public static String buildMappingDepositConfirmedPushBody(String packageName, String amountLabel) {
        return String.format(
                MAPPING_DEPOSIT_PUSH_BODY_FMT,
                nonBlankOr(packageName, FALLBACK_PACKAGE_LABEL),
                formatAmountLabel(amountLabel));
    }

    public static String buildShopOrderPaidBody(String orderPublicId, long totalPaidMinor) {
        return String.format(
                SHOP_ORDER_PAID_BODY_FMT,
                nonBlankOr(orderPublicId, FALLBACK_PACKAGE_LABEL),
                KOREAN_NUMBER.format(totalPaidMinor));
    }

    public static String buildShopPaymentFailedBody(String orderPublicId) {
        return String.format(SHOP_PAYMENT_FAILED_BODY_FMT, nonBlankOr(orderPublicId, FALLBACK_PACKAGE_LABEL));
    }

    public static String buildPointEarnedBody(String orderPublicId, long earnAmountMinor) {
        return String.format(
                POINT_EARNED_BODY_FMT,
                nonBlankOr(orderPublicId, FALLBACK_PACKAGE_LABEL),
                KOREAN_NUMBER.format(earnAmountMinor));
    }

    public static String buildShopOrderHoldExpiredBody(String orderPublicId) {
        return String.format(SHOP_HOLD_EXPIRED_BODY_FMT, nonBlankOr(orderPublicId, FALLBACK_PACKAGE_LABEL));
    }

    public static String buildShopOrderRefundedBody(String orderPublicId, long refundAmountMinor) {
        return String.format(
                SHOP_REFUNDED_BODY_FMT,
                nonBlankOr(orderPublicId, FALLBACK_PACKAGE_LABEL),
                KOREAN_NUMBER.format(refundAmountMinor));
    }

    public static String buildShopFulfillmentCompletedBody(String orderPublicId, boolean forConsultant) {
        if (forConsultant) {
            return String.format(
                    SHOP_FULFILLMENT_CONSULTANT_BODY_FMT, nonBlankOr(orderPublicId, FALLBACK_PACKAGE_LABEL));
        }
        return String.format(SHOP_FULFILLMENT_CLIENT_BODY_FMT, nonBlankOr(orderPublicId, FALLBACK_PACKAGE_LABEL));
    }

    /**
     * 예약 리마인더 선행 문구 + 일시(워크플로우 자동화·푸시 공통).
     */
    public static String buildBookingReminderLead(String leadMessage, Schedule schedule) {
        String lead = leadMessage != null ? leadMessage.trim() : "";
        if (schedule == null) {
            return lead;
        }
        String slot = formatScheduleSlot(schedule.getDate(), schedule.getStartTime(), schedule.getEndTime());
        if (slot.isEmpty()) {
            return lead;
        }
        return lead + BOOKING_REMINDER_SLOT_PREFIX + slot;
    }

    public static String formatTime(LocalTime time) {
        if (time == null) {
            return "";
        }
        return time.format(TIME_HH_MM);
    }

    public static String formatAmount(BigDecimal amount) {
        if (amount == null) {
            return "";
        }
        return KOREAN_NUMBER.format(amount);
    }

    private static String formatAmountLabel(String amountLabel) {
        if (amountLabel == null || amountLabel.isBlank()) {
            return "0";
        }
        String trimmed = amountLabel.trim();
        if ("미정".equals(trimmed)) {
            return trimmed;
        }
        try {
            long value = Long.parseLong(trimmed.replace(",", ""));
            return KOREAN_NUMBER.format(value);
        } catch (NumberFormatException ex) {
            return trimmed;
        }
    }

    private static String koreanWeekdayShort(DayOfWeek dayOfWeek) {
        int index = dayOfWeek.getValue() % 7;
        return KOREAN_WEEKDAY_SHORT[index];
    }

    private static String nonBlankOr(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
