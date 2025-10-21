package com.mindgarden.consultation.service;

import java.util.List;
import com.mindgarden.consultation.entity.ConsultationMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 상담사-내담자 메시지 서비스 인터페이스
 */
public interface ConsultationMessageService extends BaseService<ConsultationMessage, Long> {
    
    /**
     * 상담사 메시지 목록 조회
     */
    Page<ConsultationMessage> getConsultantMessages(
        Long consultantId, Long clientId, String status, Boolean isRead, 
        Boolean isImportant, Boolean isUrgent, Pageable pageable);
    
    /**
     * 내담자 메시지 목록 조회
     */
    Page<ConsultationMessage> getClientMessages(
        Long clientId, Long consultantId, String status, Boolean isRead, 
        Boolean isImportant, Boolean isUrgent, Pageable pageable);
    
    /**
     * 메시지 전송
     */
    ConsultationMessage sendMessage(
        Long consultantId, Long clientId, Long consultationId, String senderType,
        String title, String content, String messageType, Boolean isImportant, Boolean isUrgent);
    
    /**
     * 메시지 읽음 처리
     */
    ConsultationMessage markAsRead(Long messageId);
    
    /**
     * 메시지 답장
     */
    ConsultationMessage replyToMessage(
        Long originalMessageId, String title, String content, 
        String messageType, Boolean isImportant, Boolean isUrgent);
    
    /**
     * 메시지 삭제
     */
    void deleteMessage(Long messageId);
    
    /**
     * 메시지 아카이브
     */
    ConsultationMessage archiveMessage(Long messageId);
    
    /**
     * 읽지 않은 메시지 수 조회
     */
    Long getUnreadCount(Long userId, String userType);
    
    /**
     * 상담사-내담자 간 대화 목록 조회
     */
    List<ConsultationMessage> getConversation(Long consultantId, Long clientId);
    
    /**
     * 메시지 검색
     */
    Page<ConsultationMessage> searchMessages(
        Long userId, String userType, String keyword, String messageType, 
        Boolean isImportant, Boolean isUrgent, Pageable pageable);
    
    /**
     * 메시지 ID로 조회
     */
    ConsultationMessage getById(Long id);
    
    /**
     * 모든 메시지 조회 (관리자 전용)
     */
    List<ConsultationMessage> getAllMessages();
}
