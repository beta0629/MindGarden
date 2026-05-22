package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.integration.solapi.SolapiSendIds;

/**
 * 카카오 알림톡 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
public interface KakaoAlimTalkService {
    
    /**
     * 알림톡 발송
     * 
     * @param phoneNumber 수신자 전화번호
     * @param templateCode 카카오 API용 템플릿 코드(비즈코드가 내부 키와 다를 수 있음)
     * @param templateParams 템플릿 파라미터
     * @return 발송 성공 여부
     */
    boolean sendAlimTalk(String phoneNumber, String templateCode, Map<String, String> templateParams);
    
    /**
     * 알림톡 발송 — API 템플릿 코드와 공통코드(ALIMTALK_TEMPLATE) 조회용 논리 키를 분리할 때 사용.
     *
     * @param phoneNumber 수신자 전화번호
     * @param apiTemplateCode 카카오 비즈 API 요청 templateCode
     * @param contentTemplateKey {@code ALIMTALK_TEMPLATE.codeValue} 조회 키(보통 NotificationType 이름). null/공백이면 apiTemplateCode 사용
     * @param templateParams 템플릿 파라미터
     * @return 발송 성공 여부
     */
    boolean sendAlimTalk(String phoneNumber, String apiTemplateCode, String contentTemplateKey,
            Map<String, String> templateParams);
    
    /**
     * 상담 예약 확정 알림
     * 
     * @param phoneNumber 수신자 전화번호
     * @param consultantName 상담사명
     * @param consultationDate 상담 날짜
     * @param consultationTime 상담 시간
     * @return 발송 성공 여부
     */
    boolean sendConsultationConfirmed(String phoneNumber, String consultantName, String consultationDate, String consultationTime);
    
    /**
     * 상담 1시간 전 리마인더
     * 
     * @param phoneNumber 수신자 전화번호
     * @param consultantName 상담사명
     * @param consultationTime 상담 시간
     * @return 발송 성공 여부
     */
    boolean sendConsultationReminder(String phoneNumber, String consultantName, String consultationTime);
    
    /**
     * 환불 완료 알림
     * 
     * @param phoneNumber 수신자 전화번호
     * @param refundSessions 환불 회기
     * @param refundAmount 환불 금액
     * @return 발송 성공 여부
     */
    boolean sendRefundCompleted(String phoneNumber, int refundSessions, long refundAmount);
    
    /**
     * 상담 일정 변경 알림
     * 
     * @param phoneNumber 수신자 전화번호
     * @param consultantName 상담사명
     * @param oldDateTime 기존 일정
     * @param newDateTime 변경된 일정
     * @return 발송 성공 여부
     */
    boolean sendScheduleChanged(String phoneNumber, String consultantName, String oldDateTime, String newDateTime);
    
    /**
     * 알림톡 서비스 상태 확인
     * 
     * @return 서비스 사용 가능 여부
     */
    boolean isServiceAvailable();

    /**
     * 직전 {@link #sendAlimTalk(String, String, java.util.Map)} 호출에서 발생한 오류 상세를 한 번만 조회.
     *
     * <p>구현체는 호출 스레드 단위(예: {@link ThreadLocal})로 상태를 유지하고,
     * 본 메서드 호출 시 반환과 동시에 내부 상태를 clear 한다. 정보 없음·미구현이면 {@code null}.
     *
     * @return 직전 실패 상세(상태코드·errorCode·errorMessage 등) 또는 {@code null}
     */
    default String consumeLastErrorDetail() {
        return null;
    }

    /**
     * 직전 {@link #sendAlimTalk(String, String, java.util.Map)} 호출에서 솔라피가 반환한 식별자 묶음을
     * 한 번만 조회한다.
     *
     * <p>구현체는 호출 스레드 단위({@link ThreadLocal}) 로 groupId/messageId 를 보존하고, 본 메서드
     * 호출 시 반환과 동시에 내부 상태를 clear 한다. 성공·실패와 무관하게 솔라피가 식별자를 돌려준
     * 경우 모두 보존되어, 어드민 감사로그·솔라피 콘솔 사후 추적·운영 사고 분석에 활용한다.
     *
     * <p>식별자가 없거나 미구현이면 {@code null}.
     *
     * @return 직전 발송의 식별자 묶음 또는 {@code null}
     */
    default SolapiSendIds consumeLastSolapiIds() {
        return null;
    }
}
