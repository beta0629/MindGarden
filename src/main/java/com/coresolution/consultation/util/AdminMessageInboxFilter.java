package com.coresolution.consultation.util;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.AdminMessageInboxFilterConstants;
import com.coresolution.consultation.entity.ConsultationMessage;

/**
 * 관리자 메시지 인박스 운영 알림(결제·스케줄) 필터.
 * SSOT: docs/project-management/ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md §3
 *
 * @author CoreSolution
 * @since 2026-05-18
 */
public final class AdminMessageInboxFilter {

    private AdminMessageInboxFilter() {
    }

    /**
     * @param view {@link AdminMessageInboxFilterConstants#VIEW_FULL} 이면 필터 미적용
     */
    public static boolean shouldApplyAdminOpsFilter(String view) {
        if (view == null || view.isBlank()) {
            return true;
        }
        return !AdminMessageInboxFilterConstants.VIEW_FULL.equalsIgnoreCase(view.trim());
    }

    public static List<ConsultationMessage> filterForAdminOps(List<ConsultationMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return List.of();
        }
        return messages.stream()
                .filter(AdminMessageInboxFilter::isVisibleInAdminOps)
                .collect(Collectors.toList());
    }

    public static boolean isVisibleInAdminOps(ConsultationMessage message) {
        if (message == null) {
            return false;
        }
        return isVisibleInAdminOps(
                message.getMessageType(),
                message.getSenderType(),
                message.getTitle(),
                message.getContent());
    }

    /**
     * @param messageType 메시지 유형 코드
     * @param senderType  발신자 유형
     * @param title       제목
     * @param content     본문
     * @return 운영 알림 인박스 노출 여부
     */
    public static boolean isVisibleInAdminOps(
            String messageType,
            String senderType,
            String title,
            String content) {
        String text = combineText(title, content);
        if (containsAnyKeyword(text, AdminMessageInboxFilterConstants.KEYWORD_DENY_ALWAYS)) {
            return false;
        }
        if (containsOpsAllowKeyword(text)) {
            return true;
        }
        String normalizedType = normalizeCode(messageType);
        String normalizedSender = normalizeCode(senderType);
        if (!AdminMessageInboxFilterConstants.SENDER_TYPE_SYSTEM.equals(normalizedSender)) {
            return false;
        }
        if (AdminMessageInboxFilterConstants.MESSAGE_TYPE_ALLOW_UNCONDITIONAL.contains(normalizedType)) {
            return true;
        }
        if (AdminMessageInboxFilterConstants.MESSAGE_TYPE_COMPLETION.equals(normalizedType)) {
            return containsAnyKeyword(text, AdminMessageInboxFilterConstants.KEYWORD_ALLOW_SCHEDULE);
        }
        if (AdminMessageInboxFilterConstants.MESSAGE_TYPE_URGENT.equals(normalizedType)) {
            return containsOpsAllowKeyword(text);
        }
        if (isDeniedMessageType(normalizedType)) {
            return false;
        }
        return false;
    }

    private static boolean isDeniedMessageType(String normalizedType) {
        if (normalizedType.isEmpty()) {
            return true;
        }
        if (AdminMessageInboxFilterConstants.MESSAGE_TYPE_DENY.contains(normalizedType)) {
            return true;
        }
        return normalizedType.startsWith("INCOMPLETE_");
    }

    private static boolean containsOpsAllowKeyword(String text) {
        return containsAnyKeyword(text, AdminMessageInboxFilterConstants.KEYWORD_ALLOW_PAYMENT)
                || containsAnyKeyword(text, AdminMessageInboxFilterConstants.KEYWORD_ALLOW_SCHEDULE);
    }

    private static boolean containsAnyKeyword(String text, List<String> keywords) {
        if (text == null || text.isEmpty() || keywords == null) {
            return false;
        }
        for (String keyword : keywords) {
            if (keyword != null && !keyword.isEmpty() && text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private static String combineText(String title, String content) {
        return Objects.toString(title, "") + Objects.toString(content, "");
    }

    private static String normalizeCode(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase();
    }
}
