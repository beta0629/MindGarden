package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultationMessage;
import com.coresolution.consultation.repository.ConsultationMessageRepository;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사-내담자 메시지 서비스 구현체
 * BaseTenantEntityServiceImpl을 상속하여 테넌트 필터링 및 접근 제어 지원
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@Transactional
public class ConsultationMessageServiceImpl extends BaseTenantEntityServiceImpl<ConsultationMessage, Long> 
        implements ConsultationMessageService {

    private final ConsultationMessageRepository consultationMessageRepository;
    
    public ConsultationMessageServiceImpl(
            ConsultationMessageRepository consultationMessageRepository,
            TenantAccessControlService accessControlService) {
        super(consultationMessageRepository, accessControlService);
        this.consultationMessageRepository = consultationMessageRepository;
    }
    
    // ==================== BaseTenantEntityServiceImpl 추상 메서드 구현 ====================
    
    @Override
    protected Optional<ConsultationMessage> findEntityById(Long id) {
        return consultationMessageRepository.findById(id);
    }
    
    @Override
    protected List<ConsultationMessage> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return consultationMessageRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return consultationMessageRepository.findAllByTenantId(tenantId);
        }
    }
    
    // ==================== BaseService 구현 메서드 ====================
    
    @Override
    public com.coresolution.consultation.repository.BaseRepository<ConsultationMessage, Long> getRepository() {
        return consultationMessageRepository;
    }
    
    @Override
    public Page<ConsultationMessage> getConsultantMessages(
            Long consultantId, Long clientId, String status, Boolean isRead, 
            Boolean isImportant, Boolean isUrgent, Pageable pageable) {
        
        log.info("📨 상담사 메시지 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);
        
        return consultationMessageRepository.findByConsultantIdAndClientIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
            consultantId, clientId, status, isRead, isImportant, isUrgent, pageable);
    }

    @Override
    public Page<ConsultationMessage> getClientMessages(
            Long clientId, Long consultantId, String status, Boolean isRead, 
            Boolean isImportant, Boolean isUrgent, Pageable pageable) {
        
        log.info("📨 내담자 메시지 목록 조회 - 내담자 ID: {}, 상담사 ID: {}", clientId, consultantId);
        
        return consultationMessageRepository.findByClientIdAndConsultantIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
            clientId, consultantId, status, isRead, isImportant, isUrgent, pageable);
    }

    @Override
    public ConsultationMessage sendMessage(
            Long consultantId, Long clientId, Long consultationId, String senderType,
            String title, String content, String messageType, Boolean isImportant, Boolean isUrgent) {
        
        log.info("📨 메시지 전송 - 상담사 ID: {}, 내담자 ID: {}, 발신자: {}", consultantId, clientId, senderType);
        
        ConsultationMessage message = new ConsultationMessage();
        message.setConsultantId(consultantId);
        message.setClientId(clientId);
        message.setConsultationId(consultationId);
        message.setSenderType(senderType);
        message.setTitle(title);
        message.setContent(content);
        message.setMessageType(messageType);
        message.setIsImportant(isImportant != null ? isImportant : false);
        message.setIsUrgent(isUrgent != null ? isUrgent : false);
        message.setStatus("SENT");
        message.setSentAt(LocalDateTime.now());
        
        // 발신자/수신자 ID 설정
        if ("CONSULTANT".equals(senderType)) {
            message.setSenderId(consultantId);
            message.setReceiverId(clientId);
        } else {
            message.setSenderId(clientId);
            message.setReceiverId(consultantId);
        }
        
        // BaseTenantEntityService의 create 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return create(tenantId, message);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            return consultationMessageRepository.save(message);
        }
    }

    @Override
    public ConsultationMessage replyToMessage(
            Long originalMessageId, String title, String content, 
            String messageType, Boolean isImportant, Boolean isUrgent) {
        
        log.info("📨 메시지 답장 - 원본 메시지 ID: {}", originalMessageId);
        
        Optional<ConsultationMessage> originalMessageOpt = consultationMessageRepository.findById(originalMessageId);
        if (originalMessageOpt.isEmpty()) {
            throw new RuntimeException("원본 메시지를 찾을 수 없습니다: " + originalMessageId);
        }
        
        ConsultationMessage originalMessage = originalMessageOpt.get();
        
        // 답장 메시지 생성
        ConsultationMessage reply = new ConsultationMessage();
        reply.setConsultantId(originalMessage.getConsultantId());
        reply.setClientId(originalMessage.getClientId());
        reply.setConsultationId(originalMessage.getConsultationId());
        reply.setTitle(title);
        reply.setContent(content);
        reply.setMessageType(messageType);
        reply.setIsImportant(isImportant != null ? isImportant : false);
        reply.setIsUrgent(isUrgent != null ? isUrgent : false);
        reply.setStatus("SENT");
        reply.setSentAt(LocalDateTime.now());
        reply.setReplyToMessageId(originalMessageId);
        
        // 발신자/수신자 ID 설정 (원본과 반대)
        if ("CONSULTANT".equals(originalMessage.getSenderType())) {
            reply.setSenderType("CLIENT");
            reply.setSenderId(originalMessage.getClientId());
            reply.setReceiverId(originalMessage.getConsultantId());
        } else {
            reply.setSenderType("CONSULTANT");
            reply.setSenderId(originalMessage.getConsultantId());
            reply.setReceiverId(originalMessage.getClientId());
        }
        
        // BaseTenantEntityService의 create 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        ConsultationMessage savedReply;
        if (tenantId != null) {
            savedReply = create(tenantId, reply);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            savedReply = consultationMessageRepository.save(reply);
        }
        
        // 원본 메시지 답장 처리
        originalMessage.markAsReplied();
        if (tenantId != null && originalMessage.getTenantId() != null) {
            update(tenantId, originalMessage);
        } else {
            consultationMessageRepository.save(originalMessage);
        }
        
        return savedReply;
    }

    @Override
    @Transactional
    public ConsultationMessage markAsRead(Long messageId) {
        log.info("📨 메시지 읽음 처리 - 메시지 ID: {}", messageId);
        
        Optional<ConsultationMessage> messageOpt = consultationMessageRepository.findById(messageId);
        if (messageOpt.isEmpty()) {
            throw new RuntimeException("메시지를 찾을 수 없습니다: " + messageId);
        }
        
        ConsultationMessage message = messageOpt.get();
        message.markAsRead();
        
        // BaseTenantEntityService의 update 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        ConsultationMessage savedMessage;
        if (tenantId != null && message.getTenantId() != null) {
            savedMessage = update(tenantId, message);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            savedMessage = consultationMessageRepository.save(message);
        }
        
        log.info("✅ 메시지 읽음 처리 완료 - 메시지 ID: {}, isRead: {}", messageId, savedMessage.getIsRead());
        
        return savedMessage;
    }

    @Override
    public void deleteMessage(Long messageId) {
        log.info("📨 메시지 삭제 - 메시지 ID: {}", messageId);
        
        Optional<ConsultationMessage> messageOpt = consultationMessageRepository.findById(messageId);
        if (messageOpt.isEmpty()) {
            throw new RuntimeException("메시지를 찾을 수 없습니다: " + messageId);
        }
        
        consultationMessageRepository.deleteById(messageId);
    }

    @Override
    public ConsultationMessage archiveMessage(Long messageId) {
        log.info("📨 메시지 아카이브 - 메시지 ID: {}", messageId);
        
        Optional<ConsultationMessage> messageOpt = consultationMessageRepository.findById(messageId);
        if (messageOpt.isEmpty()) {
            throw new RuntimeException("메시지를 찾을 수 없습니다: " + messageId);
        }
        
        ConsultationMessage message = messageOpt.get();
        message.archive();
        
        // BaseTenantEntityService의 update 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && message.getTenantId() != null) {
            return update(tenantId, message);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            return consultationMessageRepository.save(message);
        }
    }

    @Override
    public Long getUnreadCount(Long userId, String userType) {
        log.info("📨 읽지 않은 메시지 수 조회 - 사용자 ID: {}, 유형: {}", userId, userType);
        
        // receiverId로 조회 (실제 수신자 기준)
        Long count = consultationMessageRepository.countByReceiverIdAndIsReadFalse(userId);
        
        log.info("📊 읽지 않은 메시지 수: {} (수신자 ID: {})", count, userId);
        
        return count;
    }

    @Override
    public List<ConsultationMessage> getConversation(Long consultantId, Long clientId) {
        log.info("📨 대화 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);
        
        return consultationMessageRepository.findByConsultantIdAndClientIdOrderByCreatedAtAsc(consultantId, clientId);
    }

    @Override
    public Page<ConsultationMessage> searchMessages(
            Long userId, String userType, String keyword, String messageType, 
            Boolean isImportant, Boolean isUrgent, Pageable pageable) {
        
        log.info("📨 메시지 검색 - 사용자 ID: {}, 유형: {}, 키워드: {}", userId, userType, keyword);
        
        if ("CONSULTANT".equals(userType)) {
            return consultationMessageRepository.findByConsultantIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
                userId, keyword, keyword, isImportant, isUrgent, pageable);
        } else {
            return consultationMessageRepository.findByClientIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
                userId, keyword, keyword, isImportant, isUrgent, pageable);
        }
    }

    // ==================== BaseService 구현 메서드 (BaseTenantEntityService 위임) ====================
    
    @Override
    public ConsultationMessage save(ConsultationMessage message) {
        String tenantId = TenantContextHolder.getTenantId();
        if (message.getId() == null) {
            if (tenantId != null) {
                return create(tenantId, message);
            }
        } else {
            if (tenantId != null && message.getTenantId() != null) {
                return update(tenantId, message);
            }
        }
        return consultationMessageRepository.save(message);
    }
    
    @Override
    public List<ConsultationMessage> saveAll(List<ConsultationMessage> messages) {
        return messages.stream().map(this::save).collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public ConsultationMessage update(ConsultationMessage message) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && message.getTenantId() != null) {
            return update(tenantId, message);
        }
        return consultationMessageRepository.save(message);
    }
    
    @Override
    public ConsultationMessage partialUpdate(Long id, ConsultationMessage updateData) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return partialUpdate(tenantId, id, updateData);
        }
        ConsultationMessage existing = consultationMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("메시지를 찾을 수 없습니다: " + id));
        // 부분 업데이트 로직
        return consultationMessageRepository.save(existing);
    }
    
    @Override
    public void softDeleteById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            delete(tenantId, id);
        } else {
            ConsultationMessage message = consultationMessageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("메시지를 찾을 수 없습니다: " + id));
            message.setIsDeleted(true);
            consultationMessageRepository.save(message);
        }
    }
    
    @Override
    public void hardDeleteById(Long id) {
        consultationMessageRepository.deleteById(id);
    }
    
    @Override
    public void restoreById(Long id) {
        ConsultationMessage message = consultationMessageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("메시지를 찾을 수 없습니다: " + id));
        message.setIsDeleted(false);
        message.setDeletedAt(null);
        consultationMessageRepository.save(message);
    }
    
    @Override
    public List<ConsultationMessage> findAllActive() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findAllByTenant(tenantId, null);
        }
        return consultationMessageRepository.findAllActiveByCurrentTenant();
    }
    
    @Override
    public Page<ConsultationMessage> findAllActive(Pageable pageable) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return consultationMessageRepository.findAllByTenantId(tenantId, pageable);
        }
        return consultationMessageRepository.findAllActive(pageable);
    }
    
    @Override
    public Optional<ConsultationMessage> findActiveById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findByIdAndTenant(tenantId, id).filter(m -> !m.getIsDeleted());
        }
        return consultationMessageRepository.findActiveById(id);
    }
    
    @Override
    public ConsultationMessage findActiveByIdOrThrow(Long id) {
        return findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 메시지를 찾을 수 없습니다: " + id));
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        return consultationMessageRepository.existsActiveById(id);
    }
    
    @Override
    public long countActive() {
        return consultationMessageRepository.countActive();
    }
    
    @Override
    public List<ConsultationMessage> findAllDeleted() {
        return consultationMessageRepository.findAllDeleted();
    }
    
    @Override
    public long countDeleted() {
        return consultationMessageRepository.countDeleted();
    }
    
    @Override
    public List<ConsultationMessage> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return consultationMessageRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<ConsultationMessage> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return consultationMessageRepository.findByUpdatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<ConsultationMessage> findRecentActive(int limit) {
        return consultationMessageRepository.findRecentActive(limit);
    }
    
    @Override
    public List<ConsultationMessage> findRecentlyUpdatedActive(int limit) {
        return consultationMessageRepository.findRecentlyUpdatedActive(limit);
    }
    
    @Override
    public Object[] getEntityStatistics() {
        return consultationMessageRepository.getEntityStatistics();
    }
    
    @Override
    public void cleanupOldDeleted(LocalDateTime cutoffDate) {
        consultationMessageRepository.cleanupOldDeleted(cutoffDate);
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return consultationMessageRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    @Override
    public Optional<ConsultationMessage> findByIdAndVersion(Long id, Long version) {
        return consultationMessageRepository.findByIdAndVersion(id, version);
    }
    
    // ConsultationMessageService 전용 메서드
    public ConsultationMessage getById(Long id) {
        return consultationMessageRepository.findById(id).orElse(null);
    }
    
    @Override
    public List<ConsultationMessage> getAllMessages() {
        // 테넌트 컨텍스트에서 tenantId 가져오기
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findAllByTenant(tenantId, null);
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        return consultationMessageRepository.findAll();
    }
}
