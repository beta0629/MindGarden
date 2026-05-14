package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.entity.ConsultationMessage;
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
     * 시스템 발신 메시지를 (상담사, 내담자) 스레드에 저장합니다.
     * {@code consultantId}/{@code clientId}는 대화 스레드 식별용으로 고정하고,
     * 실제 수신자는 {@code receiverUserId}로만 지정합니다.
     *
     * @param consultantId 스레드 상담사 사용자 ID
     * @param clientId 스레드 내담자(클라이언트 엔티티 연계) ID
     * @param receiverUserId 실제 수신자 사용자 ID (내담자 또는 상담사)
     * @param consultationId 상담 ID (없으면 null)
     * @param title 제목
     * @param content 본문
     * @param messageType 메시지 유형 코드
     * @param isImportant 중요 여부
     * @param isUrgent 긴급 여부
     * @return 저장된 메시지 엔티티
     * @author CoreSolution
     * @since 2026-05-14
     */
    ConsultationMessage sendSystemThreadMessage(
        Long consultantId,
        Long clientId,
        Long receiverUserId,
        Long consultationId,
        String title,
        String content,
        String messageType,
        Boolean isImportant,
        Boolean isUrgent);
    
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
