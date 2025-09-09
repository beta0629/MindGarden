package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.ConsultationMessage;
import com.mindgarden.consultation.repository.ConsultationMessageRepository;
import com.mindgarden.consultation.service.ConsultationMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사-내담자 메시지 서비스 구현체
 */
@Slf4j
@Service
@Transactional
public class ConsultationMessageServiceImpl extends BaseServiceImpl<ConsultationMessage, Long> implements ConsultationMessageService {

    @Autowired
    private ConsultationMessageRepository consultationMessageRepository;

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
        
        return consultationMessageRepository.save(message);
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
        
        ConsultationMessage savedReply = consultationMessageRepository.save(reply);
        
        // 원본 메시지 답장 처리
        originalMessage.markAsReplied();
        consultationMessageRepository.save(originalMessage);
        
        return savedReply;
    }

    @Override
    public ConsultationMessage markAsRead(Long messageId) {
        log.info("📨 메시지 읽음 처리 - 메시지 ID: {}", messageId);
        
        Optional<ConsultationMessage> messageOpt = consultationMessageRepository.findById(messageId);
        if (messageOpt.isEmpty()) {
            throw new RuntimeException("메시지를 찾을 수 없습니다: " + messageId);
        }
        
        ConsultationMessage message = messageOpt.get();
        message.markAsRead();
        return consultationMessageRepository.save(message);
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
        
        return consultationMessageRepository.save(message);
    }

    @Override
    public Long getUnreadCount(Long userId, String userType) {
        log.info("📨 읽지 않은 메시지 수 조회 - 사용자 ID: {}, 유형: {}", userId, userType);
        
        if ("CONSULTANT".equals(userType)) {
            return consultationMessageRepository.countByConsultantIdAndIsReadFalse(userId);
        } else {
            return consultationMessageRepository.countByClientIdAndIsReadFalse(userId);
        }
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

    // BaseService 구현 메서드
    @Override
    public com.mindgarden.consultation.repository.BaseRepository<ConsultationMessage, Long> getRepository() {
        return consultationMessageRepository;
    }

    // ConsultationMessageService 전용 메서드
    public ConsultationMessage getById(Long id) {
        return consultationMessageRepository.findById(id).orElse(null);
    }
}
