package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.ConsultationMessage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사-내담자 메시지 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/consultation-messages", "/api/consultation-messages"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConsultationMessageController extends BaseApiController {

    private final ConsultationMessageService consultationMessageService;
    private final com.coresolution.consultation.service.UserService userService;
    private final com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;

    /**
     * 권한 체크: 관리자 권한 확인
     */
    private boolean isAdmin(User user) {
        if (user == null) {
            log.warn("⚠️ isAdmin: user is null");
            return false;
        }
        // 동적 권한 체크로 변경
        boolean hasAdmin = dynamicPermissionService.hasPermission(user, "MESSAGE_MANAGE");
        log.info("🔍 isAdmin 체크: role={}, hasAdmin={}", user.getRole().name(), hasAdmin);
        return hasAdmin;
    }

    /**
     * 사용자 이름 조회 헬퍼 메서드
     */
    private String getUserName(Long userId, String userType) {
        try {
            if (userId == null) return "알 수 없음";
            User user = userService.findById(userId).orElse(null);
            if (user == null) return "알 수 없음";
            
            // 이름이 있으면 이름 반환, 없으면 닉네임 반환
            String name = user.getName();
            if (name == null || name.trim().isEmpty()) {
                name = user.getNickname();
            }
            return name != null ? name : "알 수 없음";
        } catch (Exception e) {
            log.warn("사용자 이름 조회 실패: userId={}, error={}", userId, e.getMessage());
            return "알 수 없음";
        }
    }

    /**
     * 모든 메시지 조회 (관리자 전용)
     * GET /api/consultation-messages/all
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllMessages(HttpSession session) {
        log.info("📨 전체 메시지 목록 조회 (관리자)");
        
        // 세션에서 사용자 정보 가져오기
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("⚠️ 인증되지 않은 사용자");
            throw new RuntimeException("로그인이 필요합니다.");
        }
        
        // 동적 권한 체크 (하드코딩된 역할 체크 제거)
        boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, "MESSAGE_MANAGE");
        if (!hasPermission) {
            log.warn("⚠️ 권한 없음 - 사용자 ID: {}, 역할: {}, 권한: MESSAGE_MANAGE", 
                currentUser.getId(), currentUser.getRole());
            throw new RuntimeException("메시지 관리 권한이 필요합니다.");
        }
        
        // 모든 메시지 조회
        List<ConsultationMessage> messages = consultationMessageService.getAllMessages();
        
        // 데이터 변환 (senderName, receiverName 추가)
        List<Map<String, Object>> messageData = messages.stream()
            .map(message -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", message.getId());
                data.put("title", message.getTitle());
                data.put("content", message.getContent());
                data.put("senderType", message.getSenderType());
                data.put("senderId", message.getSenderId());
                data.put("senderName", getUserName(message.getSenderId(), message.getSenderType()));
                data.put("receiverId", message.getReceiverId());
                // 반대 역할 결정 - enum 활용
                String receiverType = com.coresolution.consultation.constant.UserRole.CONSULTANT.name().equals(message.getSenderType()) 
                                    ? com.coresolution.consultation.constant.UserRole.CLIENT.name()
                                    : com.coresolution.consultation.constant.UserRole.CONSULTANT.name();
                data.put("receiverName", getUserName(message.getReceiverId(), receiverType));
                data.put("messageType", message.getMessageType());
                data.put("status", message.getStatus());
                data.put("isImportant", message.getIsImportant());
                data.put("isUrgent", message.getIsUrgent());
                data.put("isRead", message.getIsRead());
                data.put("readAt", message.getReadAt());
                data.put("repliedAt", message.getRepliedAt());
                data.put("sentAt", message.getSentAt());
                data.put("createdAt", message.getCreatedAt());
                data.put("consultantId", message.getConsultantId());
                data.put("clientId", message.getClientId());
                return data;
            })
            .collect(Collectors.toList());
        
        log.info("✅ 전체 메시지 조회 성공 - 총 {}개", messageData.size());
        
        return success("메시지 목록을 성공적으로 조회했습니다.", messageData);
    }

    /**
     * 메시지 목록 조회 (상담사용)
     * GET /api/consultation-messages/consultant/{consultantId}
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantMessages(
            @PathVariable Long consultantId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) Boolean isImportant,
            @RequestParam(required = false) Boolean isUrgent,
            Pageable pageable) {
        log.info("📨 상담사 메시지 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);
        
        Page<ConsultationMessage> messages = consultationMessageService.getConsultantMessages(
            consultantId, clientId, status, isRead, isImportant, isUrgent, pageable);
        
        // 안전한 데이터 추출
        List<Map<String, Object>> messageData = messages.getContent().stream()
            .map(message -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", message.getId());
                data.put("title", message.getTitle());
                data.put("content", message.getContent());
                data.put("senderType", message.getSenderType());
                data.put("senderId", message.getSenderId());
                data.put("receiverId", message.getReceiverId());
                data.put("messageType", message.getMessageType());
                data.put("status", message.getStatus());
                data.put("isImportant", message.getIsImportant());
                data.put("isUrgent", message.getIsUrgent());
                data.put("isRead", message.getIsRead());
                data.put("readAt", message.getReadAt());
                data.put("repliedAt", message.getRepliedAt());
                data.put("sentAt", message.getSentAt());
                data.put("createdAt", message.getCreatedAt());
                return data;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("messages", messageData);
        data.put("totalElements", messages.getTotalElements());
        data.put("totalPages", messages.getTotalPages());
        data.put("currentPage", messages.getNumber());
        data.put("size", messages.getSize());
        
        return success(data);
    }

    /**
     * 메시지 목록 조회 (내담자용)
     * GET /api/consultation-messages/client/{clientId}
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClientMessages(
            @PathVariable Long clientId,
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) Boolean isImportant,
            @RequestParam(required = false) Boolean isUrgent,
            Pageable pageable,
            HttpSession session) {
        log.info("📨 내담자 메시지 목록 조회 - 내담자 ID: {}, 상담사 ID: {}", clientId, consultantId);
        
        // 권한 체크 (간단한 인증 체크만)
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("⚠️ 인증되지 않은 사용자");
            throw new RuntimeException("로그인이 필요합니다.");
        }
        
        Page<ConsultationMessage> messages = consultationMessageService.getClientMessages(
            clientId, consultantId, status, isRead, isImportant, isUrgent, pageable);
        
        // 안전한 데이터 추출
        List<Map<String, Object>> messageData = messages.getContent().stream()
            .map(message -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", message.getId());
                data.put("title", message.getTitle());
                data.put("content", message.getContent());
                data.put("senderType", message.getSenderType());
                data.put("senderId", message.getSenderId());
                data.put("receiverId", message.getReceiverId());
                data.put("messageType", message.getMessageType());
                data.put("status", message.getStatus());
                data.put("isImportant", message.getIsImportant());
                data.put("isUrgent", message.getIsUrgent());
                data.put("isRead", message.getIsRead());
                data.put("readAt", message.getReadAt());
                data.put("repliedAt", message.getRepliedAt());
                data.put("sentAt", message.getSentAt());
                data.put("createdAt", message.getCreatedAt());
                return data;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("messages", messageData);
        data.put("totalElements", messages.getTotalElements());
        data.put("totalPages", messages.getTotalPages());
        data.put("currentPage", messages.getNumber());
        data.put("size", messages.getSize());
        
        return success(data);
    }

    /**
     * 메시지 상세 조회
     * GET /api/consultation-messages/{messageId}
     */
    @GetMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMessage(@PathVariable Long messageId) {
        log.info("📨 메시지 상세 조회 시작 - 메시지 ID: {}", messageId);
        
        ConsultationMessage message = consultationMessageService.getById(messageId);
        if (message == null) {
            log.error("❌ 메시지를 찾을 수 없음 - 메시지 ID: {}", messageId);
            throw new RuntimeException("메시지를 찾을 수 없습니다.");
        }
        
        log.info("📨 메시지 조회 성공 - ID: {}, 읽음 상태: {}", messageId, message.getIsRead());
        
        // 자동 읽음 처리 (읽지 않은 메시지만)
        if (!message.getIsRead()) {
            try {
                log.info("🔄 읽음 처리 시작 - 메시지 ID: {}", messageId);
                consultationMessageService.markAsRead(messageId);
                log.info("✅ 메시지 자동 읽음 처리 완료 - 메시지 ID: {}", messageId);
                // 최신 메시지 정보 다시 조회
                message = consultationMessageService.getById(messageId);
                log.info("✅ 최신 메시지 정보 조회 완료 - 읽음 상태: {}", message.getIsRead());
            } catch (Exception e) {
                log.error("⚠️ 메시지 자동 읽음 처리 실패:", e);
            }
        } else {
            log.info("ℹ️ 이미 읽은 메시지 - 메시지 ID: {}", messageId);
        }
        
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("id", message.getId());
        messageData.put("consultantId", message.getConsultantId());
        messageData.put("clientId", message.getClientId());
        messageData.put("consultationId", message.getConsultationId());
        messageData.put("senderType", message.getSenderType());
        messageData.put("senderId", message.getSenderId());
        messageData.put("receiverId", message.getReceiverId());
        messageData.put("title", message.getTitle());
        messageData.put("content", message.getContent());
        messageData.put("messageType", message.getMessageType());
        messageData.put("status", message.getStatus());
        messageData.put("isImportant", message.getIsImportant());
        messageData.put("isUrgent", message.getIsUrgent());
        messageData.put("isRead", message.getIsRead());
        messageData.put("readAt", message.getReadAt());
        messageData.put("repliedAt", message.getRepliedAt());
        messageData.put("replyToMessageId", message.getReplyToMessageId());
        messageData.put("attachments", message.getAttachments());
        messageData.put("metadata", message.getMetadata());
        messageData.put("scheduledSendAt", message.getScheduledSendAt());
        messageData.put("sentAt", message.getSentAt());
        messageData.put("deliveryChannel", message.getDeliveryChannel());
        messageData.put("isDelivered", message.getIsDelivered());
        messageData.put("deliveredAt", message.getDeliveredAt());
        messageData.put("createdAt", message.getCreatedAt());
        messageData.put("updatedAt", message.getUpdatedAt());
        
        return success(messageData);
    }

    /**
     * 메시지 읽음 처리
     * GET /api/consultation-messages/{messageId}/read
     */
    @GetMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAsRead(@PathVariable Long messageId) {
        log.info("📨 메시지 읽음 처리 - 메시지 ID: {}", messageId);
        
        ConsultationMessage message = consultationMessageService.markAsRead(messageId);
        
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("id", message.getId());
        messageData.put("isRead", message.getIsRead());
        messageData.put("readAt", message.getReadAt());
        
        return success("메시지가 읽음 처리되었습니다.", messageData);
    }

    /**
     * 메시지 전송
     * POST /api/consultation-messages
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(@RequestBody Map<String, Object> request) {
        log.info("📨 메시지 전송 요청: {}", request);
        
        Long consultantId = Long.valueOf(request.get("consultantId").toString());
        Long clientId = Long.valueOf(request.get("clientId").toString());
        Long consultationId = request.get("consultationId") != null ? 
            Long.valueOf(request.get("consultationId").toString()) : null;
        String senderType = (String) request.get("senderType");
        String title = (String) request.get("title");
        String content = (String) request.get("content");
        String messageType = (String) request.getOrDefault("messageType", "GENERAL");
        Boolean isImportant = (Boolean) request.getOrDefault("isImportant", false);
        Boolean isUrgent = (Boolean) request.getOrDefault("isUrgent", false);
        
        ConsultationMessage message = consultationMessageService.sendMessage(
            consultantId, clientId, consultationId, senderType, 
            title, content, messageType, isImportant, isUrgent);
        
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("id", message.getId());
        messageData.put("title", message.getTitle());
        messageData.put("content", message.getContent());
        messageData.put("senderType", message.getSenderType());
        messageData.put("messageType", message.getMessageType());
        messageData.put("status", message.getStatus());
        messageData.put("isImportant", message.getIsImportant());
        messageData.put("isUrgent", message.getIsUrgent());
        messageData.put("sentAt", message.getSentAt());
        messageData.put("createdAt", message.getCreatedAt());
        
        return created("메시지가 전송되었습니다.", messageData);
    }

    /**
     * 메시지 답장
     * POST /api/consultation-messages/{messageId}/reply
     */
    @PostMapping("/{messageId}/reply")
    public ResponseEntity<ApiResponse<Map<String, Object>>> replyToMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, Object> request) {
        log.info("📨 메시지 답장 - 원본 메시지 ID: {}", messageId);
        
        String title = (String) request.get("title");
        String content = (String) request.get("content");
        String messageType = (String) request.getOrDefault("messageType", "GENERAL");
        Boolean isImportant = (Boolean) request.getOrDefault("isImportant", false);
        Boolean isUrgent = (Boolean) request.getOrDefault("isUrgent", false);
        
        ConsultationMessage reply = consultationMessageService.replyToMessage(
            messageId, title, content, messageType, isImportant, isUrgent);
        
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("id", reply.getId());
        messageData.put("title", reply.getTitle());
        messageData.put("content", reply.getContent());
        messageData.put("senderType", reply.getSenderType());
        messageData.put("messageType", reply.getMessageType());
        messageData.put("status", reply.getStatus());
        messageData.put("isImportant", reply.getIsImportant());
        messageData.put("isUrgent", reply.getIsUrgent());
        messageData.put("replyToMessageId", reply.getReplyToMessageId());
        messageData.put("sentAt", reply.getSentAt());
        messageData.put("createdAt", reply.getCreatedAt());
        
        return created("답장이 전송되었습니다.", messageData);
    }

    /**
     * 메시지 삭제
     * DELETE /api/consultation-messages/{messageId}
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long messageId) {
        log.info("📨 메시지 삭제 - 메시지 ID: {}", messageId);
        
        consultationMessageService.deleteMessage(messageId);
        
        return deleted("메시지가 삭제되었습니다.");
    }

    /**
     * 메시지 아카이브
     * PUT /api/consultation-messages/{messageId}/archive
     */
    @PutMapping("/{messageId}/archive")
    public ResponseEntity<ApiResponse<Map<String, Object>>> archiveMessage(@PathVariable Long messageId) {
        log.info("📨 메시지 아카이브 - 메시지 ID: {}", messageId);
        
        ConsultationMessage message = consultationMessageService.archiveMessage(messageId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", message.getId());
        data.put("isArchived", message.getIsArchived());
        data.put("archivedAt", message.getArchivedAt());
        
        return updated("메시지가 아카이브되었습니다.", data);
    }

    /**
     * 읽지 않은 메시지 수 조회
     * GET /api/consultation-messages/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @RequestParam Long userId,
            @RequestParam String userType) {
        log.info("📨 읽지 않은 메시지 수 조회 - 사용자 ID: {}, 유형: {}", userId, userType);
        
        Long unreadCount = consultationMessageService.getUnreadCount(userId, userType);
        
        Map<String, Object> data = new HashMap<>();
        data.put("unreadCount", unreadCount);
        
        return success(data);
    }
}
