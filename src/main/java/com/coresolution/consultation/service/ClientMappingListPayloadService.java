package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * 내담자 매핑 목록({@code GET /api/v1/admin/mappings/client}) 응답 페이로드 조립.
 *
 * <p>money-path SSOT: paymentAmount · paymentStatus · productTitle · lineTotalMinor ·
 * paymentProvider · pgAmount · cashDueMinor · orderStatus · pgPaymentStatus ·
 * effectivePaymentStatus 를 매핑·주문·주문라인·Payment 에서 보강한다.
 * 주문/Payment가 있으면 paymentStatus=effective · paymentAmount=pgAmount 로 1차 필드도 덮어쓴다.
 * 값은 존재할 때만 채우고 없으면 null(발명 금지).</p>
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
public interface ClientMappingListPayloadService {

    /**
     * 매핑 엔티티 목록을 API 페이로드 Map 목록으로 변환한다.
     *
     * @param mappings 내담자 매핑 (테넌트 스코프 조회 결과)
     * @return 보강된 매핑 페이로드 목록
     */
    List<Map<String, Object>> buildPayloads(List<ConsultantClientMapping> mappings);
}
