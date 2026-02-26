package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationMessage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/v1/consultation-messages") // 표준화 2025-12-05: 레거시 경로 제거
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
     * GET /api/v1/consultation-messages/all
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllMessages(HttpSession session) {
        log.info("📨 전체 메시지 목록 조회 (관리자)");
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("⚠️ 인증되지 않은 사용자");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("로그인이 필요합니다."));
        }
        
        boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, "MESSAGE_MANAGE");
        if (!hasPermission) {
            log.warn("⚠️ 권한 없음 - 사용자 ID: {}, 역할: {}, 권한: MESSAGE_MANAGE",
                currentUser.getId(), currentUser.getRole());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("메시지 관리 권한이 필요합니다."));
        }
        // tenant_id 필수: 조회 쿼리는 tenantId 기준으로만 수행됨. 없으면 403 반환.
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("⚠️ 테넌트 정보 없음 - 사용자 ID: {}", currentUser.getId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        tenantId = tenantId.trim();
        try {
            TenantContextHolder.setTenantId(tenantId);
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
        } catch (Exception e) {
            log.error("전체 메시지 조회 실패 - 사용자 ID: {}, error: {}", currentUser.getId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("메시지 목록을 조회할 수 없습니다. " + (e.getMessage() != null ? e.getMessage() : "")));
        } finally {
            TenantContextHolder.clear();
        }
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
            Pageable pageable,
            HttpSession session) {
        log.info("📨 상담사 메시지 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("로그인이 필요합니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        try {
            TenantContextHolder.setTenantId(tenantId);
            Page<ConsultationMessage> messages = consultationMessageService.getConsultantMessages(
                consultantId, clientId, status, isRead, isImportant, isUrgent, pageable);
        
        // 안전한 데이터 추출 (상담사 화면에서 내담자명 표시용 clientId, clientName 포함)
        List<Map<String, Object>> messageData = messages.getContent().stream()
            .map(message -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", message.getId());
                data.put("title", message.getTitle());
                data.put("content", message.getContent());
                data.put("senderType", message.getSenderType());
                data.put("senderId", message.getSenderId());
                data.put("receiverId", message.getReceiverId());
                data.put("clientId", message.getClientId());
                data.put("clientName", getUserName(message.getClientId(), "CLIENT"));
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
        } finally {
            TenantContextHolder.clear();
        }
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
        
        // 인증 체크
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("⚠️ 인증되지 않은 사용자");
            throw new RuntimeException("로그인이 필요합니다.");
        }
        
        log.info("🔍 현재 사용자 정보 - ID: {}, 역할: {}, 요청한 내담자 ID: {}", 
            currentUser.getId(), currentUser.getRole(), clientId);
        
        // 동적 권한 체크
        // 1. 내담자가 자신의 메시지를 조회하는 경우 허용
        boolean isOwnMessage = currentUser.getRole() == UserRole.CLIENT && 
                               currentUser.getId().equals(clientId);
        
        log.info("🔍 자신의 메시지 체크 - 사용자 ID: {}, 요청한 내담자 ID: {}, 일치 여부: {}, 역할: {}", 
            currentUser.getId(), clientId, currentUser.getId().equals(clientId), currentUser.getRole());
        
        // 2. 관리자 역할 체크 (관리자는 모든 메시지 조회 가능)
        boolean isAdmin = currentUser.getRole() != null && currentUser.getRole().isAdmin();
        
        // 3. API 접근 권한이 있는 경우 허용 (상담사 등)
        String apiPath = "/api/consultation-messages/client/" + clientId;
        boolean hasApiAccess = dynamicPermissionService.hasApiAccess(currentUser, apiPath);
        
        log.info("🔍 권한 체크 - 자신의 메시지: {}, 관리자: {}, API 권한: {}", isOwnMessage, isAdmin, hasApiAccess);
        
        if (!isOwnMessage && !isAdmin && !hasApiAccess) {
            log.warn("⚠️ 권한 없음 - 사용자 ID: {}, 역할: {}, 요청한 내담자 ID: {}, 자신의 메시지: {}, 관리자: {}, API 권한: {}", 
                currentUser.getId(), currentUser.getRole(), clientId, isOwnMessage, isAdmin, hasApiAccess);
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        
        log.info("✅ 권한 확인 완료 - 사용자 ID: {}, 역할: {}, 요청한 내담자 ID: {}, 자신의 메시지: {}, 관리자: {}, API 권한: {}", 
            currentUser.getId(), currentUser.getRole(), clientId, isOwnMessage, isAdmin, hasApiAccess);
        
        try {
            TenantContextHolder.setTenantId(tenantId);
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
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 메시지 상세 조회 (tenant_id 기준 조회, 세션·권한·tenantId 검사)
     * GET /api/v1/consultation-messages/{messageId}
     */
    @GetMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMessage(
            @PathVariable Long messageId,
            HttpSession session) {
        log.info("📨 메시지 상세 조회 시작 - 메시지 ID: {}", messageId);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("⚠️ 인증되지 않은 사용자");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("로그인이 필요합니다."));
        }
        boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, "MESSAGE_MANAGE");
        if (!hasPermission) {
            log.warn("⚠️ 권한 없음 - 사용자 ID: {}, 권한: MESSAGE_MANAGE", currentUser.getId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("메시지 관리 권한이 필요합니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("⚠️ 테넌트 정보 없음 - 사용자 ID: {}", currentUser.getId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        tenantId = tenantId.trim();

        try {
            TenantContextHolder.setTenantId(tenantId);
            ConsultationMessage message = consultationMessageService.findActiveById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("메시지를 찾을 수 없습니다."));

            log.info("📨 메시지 조회 성공 - ID: {}, 읽음 상태: {}", messageId, message.getIsRead());

            if (!message.getIsRead()) {
                try {
                    log.info("🔄 읽음 처리 시작 - 메시지 ID: {}", messageId);
                    consultationMessageService.markAsRead(messageId);
                    log.info("✅ 메시지 자동 읽음 처리 완료 - 메시지 ID: {}", messageId);
                    message = consultationMessageService.findActiveById(messageId)
                        .orElseThrow(() -> new EntityNotFoundException("메시지를 찾을 수 없습니다."));
                } catch (EntityNotFoundException e) {
                    throw e;
                } catch (Exception e) {
                    log.error("⚠️ 메시지 자동 읽음 처리 실패:", e);
                }
            }

            String receiverType = UserRole.CONSULTANT.name().equals(message.getSenderType())
                ? UserRole.CLIENT.name() : UserRole.CONSULTANT.name();
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", message.getId());
            messageData.put("consultantId", message.getConsultantId());
            messageData.put("clientId", message.getClientId());
            messageData.put("consultationId", message.getConsultationId());
            messageData.put("senderType", message.getSenderType());
            messageData.put("senderId", message.getSenderId());
            messageData.put("senderName", getUserName(message.getSenderId(), message.getSenderType()));
            messageData.put("receiverId", message.getReceiverId());
            messageData.put("receiverName", getUserName(message.getReceiverId(), receiverType));
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
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 메시지 읽음 처리 (세션·권한·tenantId 검사 후 tenant 컨텍스트 설정)
     * GET /api/v1/consultation-messages/{messageId}/read
     */
    @GetMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAsRead(
            @PathVariable Long messageId,
            HttpSession session) {
        log.info("📨 메시지 읽음 처리 - 메시지 ID: {}", messageId);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("로그인이 필요합니다."));
        }
        boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, "MESSAGE_MANAGE");
        if (!hasPermission) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("메시지 관리 권한이 필요합니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        tenantId = tenantId.trim();

        try {
            TenantContextHolder.setTenantId(tenantId);
            ConsultationMessage message = consultationMessageService.markAsRead(messageId);
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", message.getId());
            messageData.put("isRead", message.getIsRead());
            messageData.put("readAt", message.getReadAt());
            return success("메시지가 읽음 처리되었습니다.", messageData);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
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
            @RequestParam String userType,
            HttpSession session) {
        log.info("📨 읽지 않은 메시지 수 조회 - 사용자 ID: {}, 유형: {}", userId, userType);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("로그인이 필요합니다."));
        }
        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        try {
            TenantContextHolder.setTenantId(tenantId);
            Long unreadCount = consultationMessageService.getUnreadCount(userId, userType);
            Map<String, Object> data = new HashMap<>();
            data.put("unreadCount", unreadCount);
            return success(data);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
