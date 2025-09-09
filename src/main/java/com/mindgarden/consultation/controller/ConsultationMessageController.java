package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.entity.ConsultationMessage;
import com.mindgarden.consultation.service.ConsultationMessageService;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사-내담자 메시지 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/consultation-messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConsultationMessageController {

    private final ConsultationMessageService consultationMessageService;

    /**
     * 메시지 목록 조회 (상담사용)
     * GET /api/consultation-messages/consultant/{consultantId}
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<?> getConsultantMessages(
            @PathVariable Long consultantId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) Boolean isImportant,
            @RequestParam(required = false) Boolean isUrgent,
            Pageable pageable) {
        try {
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", messageData,
                "totalElements", messages.getTotalElements(),
                "totalPages", messages.getTotalPages(),
                "currentPage", messages.getNumber(),
                "size", messages.getSize()
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 메시지 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 메시지 목록 조회 (내담자용)
     * GET /api/consultation-messages/client/{clientId}
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getClientMessages(
            @PathVariable Long clientId,
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) Boolean isImportant,
            @RequestParam(required = false) Boolean isUrgent,
            Pageable pageable) {
        try {
            log.info("📨 내담자 메시지 목록 조회 - 내담자 ID: {}, 상담사 ID: {}", clientId, consultantId);
            
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", messageData,
                "totalElements", messages.getTotalElements(),
                "totalPages", messages.getTotalPages(),
                "currentPage", messages.getNumber(),
                "size", messages.getSize()
            ));
        } catch (Exception e) {
            log.error("❌ 내담자 메시지 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 메시지 상세 조회
     * GET /api/consultation-messages/{messageId}
     */
    @GetMapping("/{messageId}")
    public ResponseEntity<?> getMessage(@PathVariable Long messageId) {
        try {
            log.info("📨 메시지 상세 조회 - 메시지 ID: {}", messageId);
            
            ConsultationMessage message = consultationMessageService.getById(messageId);
            if (message == null) {
                return ResponseEntity.notFound().build();
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", messageData
            ));
        } catch (Exception e) {
            log.error("❌ 메시지 상세 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 메시지 읽음 처리
     * GET /api/consultation-messages/{messageId}/read
     */
    @GetMapping("/{messageId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long messageId) {
        try {
            log.info("📨 메시지 읽음 처리 - 메시지 ID: {}", messageId);
            
            ConsultationMessage message = consultationMessageService.markAsRead(messageId);
            
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", message.getId());
            messageData.put("isRead", message.getIsRead());
            messageData.put("readAt", message.getReadAt());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "메시지가 읽음 처리되었습니다.",
                "data", messageData
            ));
        } catch (Exception e) {
            log.error("❌ 메시지 읽음 처리 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 읽음 처리에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 메시지 전송
     * POST /api/consultation-messages
     */
    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> request) {
        try {
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "메시지가 전송되었습니다.",
                "data", messageData
            ));
        } catch (Exception e) {
            log.error("❌ 메시지 전송 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 전송에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 메시지 답장
     * POST /api/consultation-messages/{messageId}/reply
     */
    @PostMapping("/{messageId}/reply")
    public ResponseEntity<?> replyToMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, Object> request) {
        try {
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "답장이 전송되었습니다.",
                "data", messageData
            ));
        } catch (Exception e) {
            log.error("❌ 메시지 답장 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 답장에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 메시지 삭제
     * DELETE /api/consultation-messages/{messageId}
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long messageId) {
        try {
            log.info("📨 메시지 삭제 - 메시지 ID: {}", messageId);
            
            consultationMessageService.deleteMessage(messageId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "메시지가 삭제되었습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 메시지 삭제 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 메시지 아카이브
     * PUT /api/consultation-messages/{messageId}/archive
     */
    @PutMapping("/{messageId}/archive")
    public ResponseEntity<?> archiveMessage(@PathVariable Long messageId) {
        try {
            log.info("📨 메시지 아카이브 - 메시지 ID: {}", messageId);
            
            ConsultationMessage message = consultationMessageService.archiveMessage(messageId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "메시지가 아카이브되었습니다.",
                "data", Map.of(
                    "id", message.getId(),
                    "isArchived", message.getIsArchived(),
                    "archivedAt", message.getArchivedAt()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 메시지 아카이브 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "메시지 아카이브에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 읽지 않은 메시지 수 조회
     * GET /api/consultation-messages/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @RequestParam Long userId,
            @RequestParam String userType) {
        try {
            log.info("📨 읽지 않은 메시지 수 조회 - 사용자 ID: {}, 유형: {}", userId, userType);
            
            Long unreadCount = consultationMessageService.getUnreadCount(userId, userType);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "unreadCount", unreadCount
            ));
        } catch (Exception e) {
            log.error("❌ 읽지 않은 메시지 수 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "읽지 않은 메시지 수 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
