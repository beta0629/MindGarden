package com.coresolution.consultation.constant;

import java.util.List;
import java.util.Set;

/**
 * 관리자 메시지 인박스 운영 알림 필터 상수.
 * SSOT: docs/project-management/ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md §3
 *
 * @author CoreSolution
 * @since 2026-05-18
 */
public final class AdminMessageInboxFilterConstants {

    public static final String VIEW_ADMIN_OPS = "admin_ops";
    public static final String VIEW_FULL = "full";

    /** 무조건 노출 (SYSTEM + 해당 타입) */
    public static final Set<String> MESSAGE_TYPE_ALLOW_UNCONDITIONAL = Set.of(
            "PAYMENT_COMPLETION",
            "APPOINTMENT_CONFIRMATION",
            "NEW_APPOINTMENT",
            "APPOINTMENT");

    public static final String MESSAGE_TYPE_COMPLETION = "COMPLETION";
    public static final String MESSAGE_TYPE_URGENT = "URGENT";

    /** 기본 숨김 messageType */
    public static final Set<String> MESSAGE_TYPE_DENY = Set.of(
            "REMINDER",
            "INCOMPLETE_CONSULTATION",
            "DAILY_SUMMARY",
            "MONTHLY_REPORT",
            "RATING_REQUEST",
            "GENERAL",
            "FOLLOW_UP",
            "HOMEWORK",
            "IMPORTANT");

    public static final String SENDER_TYPE_SYSTEM = "SYSTEM";

    public static final List<String> KEYWORD_ALLOW_PAYMENT = List.of(
            "결제",
            "입금",
            "매칭",
            "PENDING_PAYMENT",
            "DEPOSIT",
            "환불",
            "결제 완료",
            "결제 확인");

    public static final List<String> KEYWORD_ALLOW_SCHEDULE = List.of(
            "예약",
            "일정",
            "스케줄",
            "취소",
            "변경",
            "가예약",
            "예약 확인",
            "새 예약");

    public static final List<String> KEYWORD_DENY_ALWAYS = List.of(
            "리마인더",
            "미완료 상담",
            "일일",
            "성과 요약",
            "월간",
            "상담일지",
            "일지 누락",
            "30분",
            "분 전");

    private AdminMessageInboxFilterConstants() {
    }
}
