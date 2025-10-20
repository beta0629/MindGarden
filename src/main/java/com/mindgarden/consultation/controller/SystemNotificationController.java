package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.SystemNotification;
import com.mindgarden.consultation.service.SystemNotificationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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
import lombok.extern.slf4j.Slf4j;

/**
 * 시스템 공지 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/system-notifications")
public class SystemNotificationController {
    
    @Autowired
    private SystemNotificationService systemNotificationService;
    
    /**
     * 권한 체크: 지점 관리자 이상인지 확인
     */
    private boolean hasAdminPermission(HttpSession session) {
        String userRole = (String) session.getAttribute("role");
        
        if (userRole == null) {
            return false;
        }
        
        // BRANCH_ADMIN, MAIN_ADMIN, SUPER_ADMIN만 허용
        return "BRANCH_ADMIN".equals(userRole) || 
               "MAIN_ADMIN".equals(userRole) || 
               "SUPER_ADMIN".equals(userRole) ||
               "ROLE_BRANCH_ADMIN".equals(userRole) || 
               "ROLE_MAIN_ADMIN".equals(userRole) || 
               "ROLE_SUPER_ADMIN".equals(userRole);
    }
    
    /**
     * 사용자별 공지 목록 조회
     */
    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            String userRole = (String) session.getAttribute("role");
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
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
                notificationList.add(data);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", notificationList,
                "totalElements", notifications.getTotalElements(),
                "totalPages", notifications.getTotalPages(),
                "currentPage", notifications.getNumber(),
                "message", "공지 목록을 성공적으로 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 읽지 않은 공지 수 조회
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            String userRole = (String) session.getAttribute("role");
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("📢 읽지 않은 공지 수 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
            
            Long unreadCount = systemNotificationService.getUnreadCount(userId, userRole);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "unreadCount", unreadCount,
                "message", "읽지 않은 공지 수를 성공적으로 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 읽지 않은 공지 수 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "읽지 않은 공지 수 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 공지 상세 조회
     */
    @GetMapping("/{notificationId}")
    public ResponseEntity<?> getNotificationDetail(
            @PathVariable Long notificationId,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("📢 공지 상세 조회 - 공지 ID: {}, 사용자 ID: {}", notificationId, userId);
            
            SystemNotification notification = systemNotificationService.getNotificationDetail(notificationId, userId);
            
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", data,
                "message", "공지를 성공적으로 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 상세 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 공지 읽음 처리
     */
    @PostMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("📢 공지 읽음 처리 - 공지 ID: {}, 사용자 ID: {}", notificationId, userId);
            
            systemNotificationService.markAsRead(notificationId, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공지를 읽음 처리했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 읽음 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 읽음 처리에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 긴급 공지 조회
     */
    @GetMapping("/urgent")
    public ResponseEntity<?> getUrgentNotifications(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            String userRole = (String) session.getAttribute("role");
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", notificationList,
                "message", "긴급 공지를 성공적으로 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 긴급 공지 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "긴급 공지 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    // ==================== 관리자 전용 API (지점 관리자 이상) ====================
    
    /**
     * 관리자용 전체 공지 목록 조회
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllNotificationsForAdmin(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            // 권한 체크
            if (!hasAdminPermission(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "공지 관리 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다."
                ));
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", notificationList,
                "totalElements", notifications.getTotalElements(),
                "totalPages", notifications.getTotalPages(),
                "currentPage", notifications.getNumber(),
                "message", "관리자용 공지 목록을 성공적으로 조회했습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 관리자용 공지 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 공지 생성 (지점 관리자 이상)
     */
    @PostMapping("/admin")
    public ResponseEntity<?> createNotification(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            // 권한 체크
            if (!hasAdminPermission(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "공지 생성 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다."
                ));
            }
            
            Long userId = (Long) session.getAttribute("userId");
            String userName = (String) session.getAttribute("name");
            
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
            if (request.get("expiresAt") != null) {
                notification.setExpiresAt(LocalDateTime.parse((String) request.get("expiresAt")));
            }
            
            SystemNotification created = systemNotificationService.createNotification(notification);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("id", created.getId()),
                "message", "공지가 생성되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 생성에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 공지 수정 (지점 관리자 이상)
     */
    @PutMapping("/admin/{notificationId}")
    public ResponseEntity<?> updateNotification(
            @PathVariable Long notificationId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        try {
            // 권한 체크
            if (!hasAdminPermission(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "공지 수정 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다."
                ));
            }
            
            log.info("📢 공지 수정 - ID: {}", notificationId);
            
            SystemNotification notification = new SystemNotification();
            notification.setTargetType((String) request.get("targetType"));
            notification.setTitle((String) request.get("title"));
            notification.setContent((String) request.get("content"));
            notification.setNotificationType((String) request.getOrDefault("notificationType", "GENERAL"));
            notification.setIsImportant((Boolean) request.getOrDefault("isImportant", false));
            notification.setIsUrgent((Boolean) request.getOrDefault("isUrgent", false));
            
            if (request.get("expiresAt") != null) {
                notification.setExpiresAt(LocalDateTime.parse((String) request.get("expiresAt")));
            }
            
            SystemNotification updated = systemNotificationService.updateNotification(notificationId, notification);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("id", updated.getId()),
                "message", "공지가 수정되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 공지 삭제 (지점 관리자 이상)
     */
    @DeleteMapping("/admin/{notificationId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long notificationId,
            HttpSession session) {
        try {
            // 권한 체크
            if (!hasAdminPermission(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "공지 삭제 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다."
                ));
            }
            
            log.info("📢 공지 삭제 - ID: {}", notificationId);
            
            systemNotificationService.deleteNotification(notificationId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "공지가 삭제되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 삭제 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 공지 게시 (지점 관리자 이상)
     */
    @PostMapping("/admin/{notificationId}/publish")
    public ResponseEntity<?> publishNotification(
            @PathVariable Long notificationId,
            HttpSession session) {
        try {
            // 권한 체크
            if (!hasAdminPermission(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "공지 게시 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다."
                ));
            }
            
            log.info("📢 공지 게시 - ID: {}", notificationId);
            
            SystemNotification published = systemNotificationService.publishNotification(notificationId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("id", published.getId(), "status", published.getStatus()),
                "message", "공지가 게시되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 게시 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 게시에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 공지 보관 (지점 관리자 이상)
     */
    @PostMapping("/admin/{notificationId}/archive")
    public ResponseEntity<?> archiveNotification(
            @PathVariable Long notificationId,
            HttpSession session) {
        try {
            // 권한 체크
            if (!hasAdminPermission(session)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "공지 보관 권한이 없습니다. 지점 관리자 이상만 접근 가능합니다."
                ));
            }
            
            log.info("📢 공지 보관 - ID: {}", notificationId);
            
            SystemNotification archived = systemNotificationService.archiveNotification(notificationId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("id", archived.getId(), "status", archived.getStatus()),
                "message", "공지가 보관되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 공지 보관 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "공지 보관에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}

