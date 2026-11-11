package com.coresolution.consultation.service;

/**
 * 신규 홈페이지 문의 알림 채널.
 *
 * <p>개인정보(이름·전화·본문)를 절대 포함하지 않는다. 기본 구현은 사이드바 뱃지(카운트)다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
public interface HomepageInquiryNotificationChannel {

    /**
     * 신규 문의가 저장된 뒤 호출된다.
     *
     * @param tenantId   테넌트 ID
     * @param inquiryId  문의 PK(개인정보 아님)
     */
    void notifyNewInquiry(String tenantId, Long inquiryId);
}
