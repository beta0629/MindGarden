package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ClientPackagePaymentHistoryResponse;

/**
 * 내담자별 패키지 결제 이력 조회 서비스.
 *
 * @author MindGarden
 * @since 2026-07-28
 */
public interface ClientPackagePaymentHistoryService {

    /**
     * 내담자의 패키지·회기추가 결제 이력을 TERMINATED 포함·최신순으로 조회한다.
     *
     * @param clientId 내담자 ID
     * @param viewerConsultantId 상담사 호출 시 본인 담당만 필터(null이면 전체)
     * @return 합산 요약 + 타임라인
     * @throws IllegalArgumentException clientId null
     * @throws IllegalStateException tenantId 미설정
     */
    ClientPackagePaymentHistoryResponse getPackagePaymentHistory(Long clientId, Long viewerConsultantId);
}
