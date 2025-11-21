package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.SystemNotificationService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

/**
 * 시스템 공지 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/system-notifications", "/api/system-notifications"}) // v1 경로 추가, 레거시 경로 유지
public class SystemNotificationController extends BaseApiController {
    
    @Autowired
    private SystemNotificationService systemNotificationService;
    
    @Autowired
    private DynamicPermissionService dynamicPermissionService;
    
    /**
     * 권한 체크: SYSTEM_NOTIFICATION_MANAGE 권한 확인
     */
    private boolean hasAdminPermission(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        
        if (currentUser == null) {
            return false;
        }
        
        // DynamicPermissionService를 사용하여 권한 체크
        return dynamicPermissionService.hasPermission(currentUser, "SYSTEM_NOTIFICATION_MANAGE");
    }
    
    /**
     * 사용자별 공지 목록 조회
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
        String userRole = currentUser.getRole().name();
        
        log.info("📢 사용자 공지 목록 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<SystemNotification> notifications = systemNotificationService.getNotificationsForUser(userId, userRole, pageable);
        
        // 응답 데이터 변환
        List<Map<String, Object>> notificationList = new ArrayList<>();
        for (SystemNotification notification : notifications.getContent()) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", notification.getId());
            data.put("targetType", notification.getTargetType());
            data.put("title", notification.getTitle());
            data.put("content", notification.getContent());
            data.put("notificationType", notification.getNotificationType());
            data.put("isImportant", notification.getIsImportant());
            data.put("isUrgent", notification.getIsUrgent());
            data.put("status", notification.getStatus());
            data.put("authorName", notification.getAuthorName());
            data.put("publishedAt", notification.getPublishedAt());
            data.put("expiresAt", notification.getExpiresAt());
            data.put("viewCount", notification.getViewCount());
            data.put("createdAt", notification.getCreatedAt());
            
            // 읽음 여부 확인
            boolean isRead = systemNotificationService.isNotificationRead(notification.getId(), userId);
            data.put("isRead", isRead);
            
            notificationList.add(data);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("notifications", notificationList);
        responseData.put("totalElements", notifications.getTotalElements());
        responseData.put("totalPages", notifications.getTotalPages());
        responseData.put("currentPage", notifications.getNumber());
        
        return success("공지 목록을 성공적으로 조회했습니다.", responseData);
    }
    
    /**
     * 활성 공지 목록 조회 (게시 중인 공지만)
     * - 로그인 필요
     * - 사용자 역할에 맞는 공지만 반환
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveNotifications(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Long userId = currentUser.getId();
        String userRole = currentUser.getRole().name();
        
        log.info("📢 활성 공지 목록 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        // 게시 중인 공지만 조회 (페이징 없이 전체)
        Pageable pageable = PageRequest.of(0, 100); // 최대 100개
        Page<SystemNotification> notifications = systemNotificationService.getNotificationsForUser(userId, userRole, pageable);
        
        // 응답 데이터 변환
        List<Map<String, Object>> notificationList = new ArrayList<>();
        for (SystemNotification notification : notifications.getContent()) {
            // PUBLISHED 상태이고 만료되지 않은 공지만 포함
            if ("PUBLISHED".equals(notification.getStatus())) {
                LocalDateTime now = LocalDateTime.now();
                if (notification.getExpiresAt() == null || notification.getExpiresAt().isAfter(now)) {
                    Map<String, Object> data = new HashMap<>();
                    data.put("id", notification.getId());
                    data.put("targetType", notification.getTargetType());
                    
                    // targetType을 기반으로 targetRoles 생성
                    List<String> targetRoles = new ArrayList<>();
                    if ("ALL".equals(notification.getTargetType())) {
                        targetRoles.add("ALL");
                    } else if ("CONSULTANT".equals(notification.getTargetType())) {
                        targetRoles.add("CONSULTANT");
                    } else if ("CLIENT".equals(notification.getTargetType())) {
                        targetRoles.add("CLIENT");
                    }
                    data.put("targetRoles", targetRoles);
                    
                    data.put("title", notification.getTitle());
                    data.put("content", notification.getContent());
                    data.put("notificationType", notification.getNotificationType());
                    data.put("isImportant", notification.getIsImportant());
                    data.put("isUrgent", notification.getIsUrgent());
                    data.put("status", notification.getStatus());
                    data.put("authorName", notification.getAuthorName());
                    data.put("publishedAt", notification.getPublishedAt());
                    data.put("expiresAt", notification.getExpiresAt());
                    data.put("createdAt", notification.getCreatedAt());
                    
                    // 읽음 여부 확인
                    boolean isRead = systemNotificationService.isNotificationRead(notification.getId(), userId);
                    data.put("isRead", isRead);
                    
                    notificationList.add(data);
                }
            }
        }
        
        return success("활성 공지 목록을 성공적으로 조회했습니다.", notificationList);
    }
    
    /**
     * 읽지 않은 공지 수 조회
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(HttpSession session) {
        log.info("📢 읽지 않은 공지 수 조회 요청 - 세션 ID: {}", session != null ? session.getId() : "null");
        
        User currentUser = SessionUtils.getCurrentUser(session);
        
        if (currentUser == null) {
            log.warn("⚠️ 읽지 않은 공지 수 조회 실패 - 세션에 사용자 정보 없음");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Long userId = currentUser.getId();
        String userRole = currentUser.getRole().name();
        
        log.info("📢 읽지 않은 공지 수 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        Long unreadCount = systemNotificationService.getUnreadCount(userId, userRole);
        
        Map<String, Object> data = new HashMap<>();
        data.put("unreadCount", unreadCount);
        
        return success("읽지 않은 공지 수를 성공적으로 조회했습니다.", data);
    }
    
    /**
     * 공지 상세 조회
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
        
        log.info("📢 공지 상세 조회 - 공지 ID: {}, 사용자 ID: {}", notificationId, userId);
        
        SystemNotification notification = systemNotificationService.getNotificationDetail(notificationId, userId);
        
        // 자동 읽음 처리
        try {
            systemNotificationService.markAsRead(notificationId, userId);
            log.info("✅ 공지 자동 읽음 처리 완료 - 공지 ID: {}, 사용자 ID: {}", notificationId, userId);
        } catch (Exception e) {
            log.warn("⚠️ 공지 자동 읽음 처리 실패 (무시): {}", e.getMessage());
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", notification.getId());
        data.put("targetType", notification.getTargetType());
        data.put("title", notification.getTitle());
        data.put("content", notification.getContent());
        data.put("notificationType", notification.getNotificationType());
        data.put("isImportant", notification.getIsImportant());
        data.put("isUrgent", notification.getIsUrgent());
        data.put("status", notification.getStatus());
        data.put("authorName", notification.getAuthorName());
        data.put("publishedAt", notification.getPublishedAt());
        data.put("expiresAt", notification.getExpiresAt());
        data.put("viewCount", notification.getViewCount());
        data.put("createdAt", notification.getCreatedAt());
        
        return success("공지를 성공적으로 조회했습니다.", data);
    }
    
    /**
     * 공지 읽음 처리
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
        
        log.info("📢 공지 읽음 처리 - 공지 ID: {}, 사용자 ID: {}", notificationId, userId);
        
        systemNotificationService.markAsRead(notificationId, userId);
        
        return success("공지를 읽음 처리했습니다.");
    }
    
    /**
     * 긴급 공지 조회
     */
    @GetMapping("/urgent")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUrgentNotifications(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Long userId = currentUser.getId();
        String userRole = currentUser.getRole().name();
        
        log.info("📢 긴급 공지 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        List<SystemNotification> notifications = systemNotificationService.getUrgentNotifications(userId, userRole);
        
        List<Map<String, Object>> notificationList = new ArrayList<>();
        for (SystemNotification notification : notifications) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", notification.getId());
            data.put("title", notification.getTitle());
            data.put("content", notification.getContent());
            data.put("publishedAt", notification.getPublishedAt());
            notificationList.add(data);
        }
        
        return success("긴급 공지를 성공적으로 조회했습니다.", notificationList);
    }
    
    // ==================== 관리자 전용 API (지점 관리자 이상) ====================
    
    /**
     * 관리자용 전체 공지 목록 조회
     */
    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllNotificationsForAdmin(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        // 권한 체크
        if (!hasAdminPermission(session)) {
            throw new org.springframework.security.access.AccessDeniedException("공지 관리 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다.");
        }
        
        log.info("📢 관리자용 전체 공지 조회 - 대상: {}, 상태: {}", targetType, status);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<SystemNotification> notifications = systemNotificationService.getAllNotificationsForAdmin(targetType, status, pageable);
        
        List<Map<String, Object>> notificationList = new ArrayList<>();
        for (SystemNotification notification : notifications.getContent()) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", notification.getId());
            data.put("targetType", notification.getTargetType());
            data.put("title", notification.getTitle());
            data.put("content", notification.getContent());
            data.put("notificationType", notification.getNotificationType());
            data.put("isImportant", notification.getIsImportant());
            data.put("isUrgent", notification.getIsUrgent());
            data.put("status", notification.getStatus());
            data.put("authorName", notification.getAuthorName());
            data.put("publishedAt", notification.getPublishedAt());
            data.put("expiresAt", notification.getExpiresAt());
            data.put("viewCount", notification.getViewCount());
            data.put("createdAt", notification.getCreatedAt());
            notificationList.add(data);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("notifications", notificationList);
        responseData.put("totalElements", notifications.getTotalElements());
        responseData.put("totalPages", notifications.getTotalPages());
        responseData.put("currentPage", notifications.getNumber());
        
        return success("관리자용 공지 목록을 성공적으로 조회했습니다.", responseData);
    }
    
    /**
     * 공지 생성 (지점 관리자 이상)
     */
    @PostMapping("/admin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createNotification(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        // 권한 체크
        if (!hasAdminPermission(session)) {
            throw new org.springframework.security.access.AccessDeniedException("공지 생성 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다.");
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        Long userId = currentUser.getId();
        String userName = currentUser.getName();
        
        log.info("📢 공지 생성 - 작성자 ID: {}, 이름: {}", userId, userName);
        
        SystemNotification notification = new SystemNotification();
        notification.setTargetType((String) request.get("targetType"));
        notification.setTitle((String) request.get("title"));
        notification.setContent((String) request.get("content"));
        notification.setNotificationType((String) request.getOrDefault("notificationType", "GENERAL"));
        notification.setIsImportant((Boolean) request.getOrDefault("isImportant", false));
        notification.setIsUrgent((Boolean) request.getOrDefault("isUrgent", false));
        notification.setAuthorId(userId);
        notification.setAuthorName(userName);
        
        // 게시 종료 일시 설정
        if (request.get("expiresAt") != null && !((String) request.get("expiresAt")).trim().isEmpty()) {
            try {
                notification.setExpiresAt(LocalDateTime.parse((String) request.get("expiresAt")));
            } catch (Exception e) {
                log.warn("⚠️ 게시 종료일 파싱 실패, null로 설정: {}", e.getMessage());
            }
        }
        
        SystemNotification created = systemNotificationService.createNotification(notification);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", created.getId());
        
        return created("공지가 생성되었습니다.", data);
    }
    
    /**
     * 공지 수정 (지점 관리자 이상)
     */
    @PutMapping("/admin/{notificationId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateNotification(
            @PathVariable Long notificationId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        // 권한 체크
        if (!hasAdminPermission(session)) {
            throw new org.springframework.security.access.AccessDeniedException("공지 수정 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다.");
        }
        
        log.info("📢 공지 수정 - ID: {}", notificationId);
        
        SystemNotification notification = new SystemNotification();
        notification.setTargetType((String) request.get("targetType"));
        notification.setTitle((String) request.get("title"));
        notification.setContent((String) request.get("content"));
        notification.setNotificationType((String) request.getOrDefault("notificationType", "GENERAL"));
        notification.setIsImportant((Boolean) request.getOrDefault("isImportant", false));
        notification.setIsUrgent((Boolean) request.getOrDefault("isUrgent", false));
        
        if (request.get("expiresAt") != null && !((String) request.get("expiresAt")).trim().isEmpty()) {
            try {
                notification.setExpiresAt(LocalDateTime.parse((String) request.get("expiresAt")));
            } catch (Exception e) {
                log.warn("⚠️ 게시 종료일 파싱 실패, null로 설정: {}", e.getMessage());
            }
        }
        
        SystemNotification updated = systemNotificationService.updateNotification(notificationId, notification);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", updated.getId());
        
        return updated("공지가 수정되었습니다.", data);
    }
    
    /**
     * 공지 삭제 (지점 관리자 이상)
     */
    @DeleteMapping("/admin/{notificationId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long notificationId,
            HttpSession session) {
        // 권한 체크
        if (!hasAdminPermission(session)) {
            throw new org.springframework.security.access.AccessDeniedException("공지 삭제 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다.");
        }
        
        log.info("📢 공지 삭제 - ID: {}", notificationId);
        
        systemNotificationService.deleteNotification(notificationId);
        
        return deleted("공지가 삭제되었습니다.");
    }
    
    /**
     * 공지 게시 (지점 관리자 이상)
     */
    @PostMapping("/admin/{notificationId}/publish")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publishNotification(
            @PathVariable Long notificationId,
            HttpSession session) {
        // 권한 체크
        if (!hasAdminPermission(session)) {
            throw new org.springframework.security.access.AccessDeniedException("공지 게시 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다.");
        }
        
        log.info("📢 공지 게시 - ID: {}", notificationId);
        
        SystemNotification published = systemNotificationService.publishNotification(notificationId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", published.getId());
        data.put("status", published.getStatus());
        
        return success("공지가 게시되었습니다.", data);
    }
    
    /**
     * 공지 보관 (지점 관리자 이상)
     */
    @PostMapping("/admin/{notificationId}/archive")
    public ResponseEntity<ApiResponse<Map<String, Object>>> archiveNotification(
            @PathVariable Long notificationId,
            HttpSession session) {
        // 권한 체크
        if (!hasAdminPermission(session)) {
            throw new org.springframework.security.access.AccessDeniedException("공지 보관 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다.");
        }
        
        log.info("📢 공지 보관 - ID: {}", notificationId);
        
        SystemNotification archived = systemNotificationService.archiveNotification(notificationId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", archived.getId());
        data.put("status", archived.getStatus());
        
        return success("공지가 보관되었습니다.", data);
    }
}

