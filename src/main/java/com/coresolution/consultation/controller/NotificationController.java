package com.coresolution.consultation.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.entity.Notification;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.NotificationLifecycleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.util.PaginationUtils;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사용자별 in-app 알림 API — {@code notifications} 테이블(recipient_user_id) 기반.
 *
 * <p>broadcast {@code system_notifications} 와 분리. 개인 푸시·알림 인박스 전용.
 * admin 공지는 {@link SystemNotificationController} 를 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-07-09
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController extends BaseApiController {

    private final NotificationLifecycleService notificationLifecycleService;

    private void setTenantContextFromUser(User currentUser) {
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("알림 API: 테넌트 없음 - userId={}", currentUser.getId());
            throw new org.springframework.security.access.AccessDeniedException("테넌트 정보가 없습니다.");
        }
        TenantContextHolder.setTenantId(tenantId.trim());
    }

    /**
     * 세션 사용자의 개인 알림 목록 조회 (tenantId + recipientUserId).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        Long userId = currentUser.getId();
        String tenantId = currentUser.getTenantId();
        log.info("개인 알림 목록 조회 - userId={}, tenantId={}", userId, tenantId);

        try {
            setTenantContextFromUser(currentUser);
            Pageable pageable = PaginationUtils.createPageable(page, size);
            Page<Notification> notifications = notificationLifecycleService.findActiveByTenantIdAndRecipient(
                    tenantId, userId, pageable);

            List<Map<String, Object>> notificationList = new ArrayList<>();
            for (Notification notification : notifications.getContent()) {
                notificationList.add(toResponseMap(notification));
            }

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("notifications", notificationList);
            responseData.put("totalElements", notifications.getTotalElements());
            responseData.put("totalPages", notifications.getTotalPages());
            responseData.put("currentPage", notifications.getNumber());

            return success("알림 목록을 성공적으로 조회했습니다.", responseData);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 세션 사용자의 읽지 않은 개인 알림 수.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        Long userId = currentUser.getId();
        String tenantId = currentUser.getTenantId();
        log.info("개인 알림 미읽음 수 조회 - userId={}, tenantId={}", userId, tenantId);

        try {
            setTenantContextFromUser(currentUser);
            long unreadCount = notificationLifecycleService.countUnread(tenantId, userId);

            Map<String, Object> data = new HashMap<>();
            data.put("unreadCount", unreadCount);
            return success("읽지 않은 알림 수를 성공적으로 조회했습니다.", data);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 개인 알림 상세 조회 (수신자 본인만).
     */
    @GetMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotificationDetail(
            @PathVariable Long notificationId,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        Long userId = currentUser.getId();
        String tenantId = currentUser.getTenantId();
        log.info("개인 알림 상세 조회 - notificationId={}, userId={}", notificationId, userId);

        try {
            setTenantContextFromUser(currentUser);
            Notification read = notificationLifecycleService.markReadForRecipient(
                    tenantId, userId, notificationId);
            return success("알림을 성공적으로 조회했습니다.", toResponseMap(read));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 개인 알림 읽음 처리.
     */
    @PostMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long notificationId,
            HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        Long userId = currentUser.getId();
        String tenantId = currentUser.getTenantId();
        log.info("개인 알림 읽음 처리 - notificationId={}, userId={}", notificationId, userId);

        try {
            setTenantContextFromUser(currentUser);
            notificationLifecycleService.markReadForRecipient(tenantId, userId, notificationId);
            return success("알림을 읽음 처리했습니다.");
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 세션 사용자의 미읽음 개인 알림 일괄 읽음 처리.
     */
    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        Long userId = currentUser.getId();
        String tenantId = currentUser.getTenantId();
        log.info("개인 알림 일괄 읽음 처리 - userId={}, tenantId={}", userId, tenantId);

        try {
            setTenantContextFromUser(currentUser);
            notificationLifecycleService.markAllReadForRecipient(tenantId, userId);
            return success("모든 알림을 읽음 처리했습니다.");
        } finally {
            TenantContextHolder.clear();
        }
    }

    private Map<String, Object> toResponseMap(Notification notification) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", notification.getId());
        data.put("title", notification.getTitle());
        data.put("content", notification.getBody());
        data.put("notificationType",
                notification.getNotificationType() != null
                        ? notification.getNotificationType().getCode()
                        : null);
        data.put("status", notification.getStatus());
        data.put("isRead", Notification.STATUS_READ.equals(notification.getStatus()));
        data.put("createdAt", notification.getCreatedAt());
        data.put("publishedAt", notification.getCreatedAt());
        data.put("metadata", notification.getMetadataJson());
        return data;
    }
}
