package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationMessage;
import com.coresolution.consultation.exception.EntityNotFoundException;
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
        // 표준화 2025-12-06: deprecated 메서드 대체 - branchId는 더 이상 사용하지 않음
        return consultationMessageRepository.findAllByTenantId(tenantId);
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
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
            tenantId, consultantId, clientId, status, isRead, isImportant, isUrgent, pageable);
    }

    @Override
    public Page<ConsultationMessage> getClientMessages(
            Long clientId, Long consultantId, String status, Boolean isRead, 
            Boolean isImportant, Boolean isUrgent, Pageable pageable) {
        
        log.info("📨 내담자 메시지 목록 조회 - 내담자 ID: {}, 상담사 ID: {}", clientId, consultantId);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findByTenantIdAndClientIdAndConsultantIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
            tenantId, clientId, consultantId, status, isRead, isImportant, isUrgent, pageable);
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
        
        // 발신자/수신자 ID 설정 (표준화 2025-12-05: enum 활용)
        if (UserRole.CONSULTANT.name().equals(senderType)) {
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
        
        // 발신자/수신자 ID 설정 (원본과 반대) (표준화 2025-12-05: enum 활용)
        if (UserRole.CONSULTANT.name().equals(originalMessage.getSenderType())) {
            reply.setSenderType(UserRole.CLIENT.name());
            reply.setSenderId(originalMessage.getClientId());
            reply.setReceiverId(originalMessage.getConsultantId());
        } else {
            reply.setSenderType(UserRole.CONSULTANT.name());
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

        ConsultationMessage message = findActiveById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("메시지를 찾을 수 없습니다."));
        message.markAsRead();

        String tenantId = TenantContextHolder.getRequiredTenantId();
        ConsultationMessage savedMessage = update(tenantId, message);

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
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        // receiverId로 조회 (실제 수신자 기준)
        Long count = consultationMessageRepository.countByTenantIdAndReceiverIdAndIsReadFalse(tenantId, userId);
        
        log.info("📊 읽지 않은 메시지 수: {} (수신자 ID: {})", count, userId);
        
        return count;
    }

    @Override
    public List<ConsultationMessage> getConversation(Long consultantId, Long clientId) {
        log.info("📨 대화 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtAsc(tenantId, consultantId, clientId);
    }

    @Override
    public Page<ConsultationMessage> searchMessages(
            Long userId, String userType, String keyword, String messageType, 
            Boolean isImportant, Boolean isUrgent, Pageable pageable) {
        
        log.info("📨 메시지 검색 - 사용자 ID: {}, 유형: {}, 키워드: {}", userId, userType, keyword);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        // 표준화 2025-12-05: enum 활용
        if (UserRole.CONSULTANT.name().equals(userType)) {
            return consultationMessageRepository.findByTenantIdAndConsultantIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
                tenantId, userId, keyword, messageType, isImportant, isUrgent, pageable);
        } else {
            return consultationMessageRepository.findByTenantIdAndClientIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
                tenantId, userId, keyword, messageType, isImportant, isUrgent, pageable);
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return findAllByTenant(tenantId, null);
    }

    @Override
    public Page<ConsultationMessage> findAllActive(Pageable pageable) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findAllByTenantId(tenantId, pageable);
    }

    @Override
    public Optional<ConsultationMessage> findActiveById(Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return findByIdAndTenant(tenantId, id).filter(m -> !m.getIsDeleted());
    }
    
    @Override
    public ConsultationMessage findActiveByIdOrThrow(Long id) {
        return findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 메시지를 찾을 수 없습니다: " + id));
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return findByIdAndTenant(tenantId, id).filter(m -> !m.getIsDeleted()).isPresent();
    }

    @Override
    public long countActive() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.countByTenantId(tenantId);
    }
    
    @Override
    public List<ConsultationMessage> findAllDeleted() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return Collections.emptyList();
        }
        return consultationMessageRepository.findAllDeletedByTenantId(tenantId);
    }
    
    @Override
    public long countDeleted() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return 0L;
        }
        return consultationMessageRepository.countDeletedByTenantId(tenantId);
    }
    
    @Override
    public List<ConsultationMessage> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findByTenantIdAndCreatedAtBetween(tenantId, startDate, endDate);
    }

    @Override
    public List<ConsultationMessage> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findByTenantIdAndUpdatedAtBetween(tenantId, startDate, endDate);
    }

    @Override
    public List<ConsultationMessage> findRecentActive(int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findRecentActiveByTenantId(tenantId, org.springframework.data.domain.Pageable.ofSize(limit));
    }

    @Override
    public List<ConsultationMessage> findRecentlyUpdatedActive(int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationMessageRepository.findRecentlyUpdatedActiveByTenantId(tenantId, org.springframework.data.domain.Pageable.ofSize(limit));
    }
    
    @Override
    public Object[] getEntityStatistics() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return new Object[]{0L, 0L, 0L};
        }
        long total = consultationMessageRepository.countByTenantId(tenantId);
        List<ConsultationMessage> list = consultationMessageRepository.findAllByTenantId(tenantId);
        long deleted = list.stream().filter(ConsultationMessage::getIsDeleted).count();
        long active = total - deleted;
        return new Object[]{total, deleted, active};
    }
    
    @Override
    public void cleanupOldDeleted(LocalDateTime cutoffDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        consultationMessageRepository.cleanupOldDeletedByTenantId(tenantId, cutoffDate);
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
    
    /** tenant_id 필수: 본 API는 tenantId 기준으로만 목록을 조회함. */
    @Override
    public List<ConsultationMessage> getAllMessages() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return findAllByTenant(tenantId, null);
    }
}
