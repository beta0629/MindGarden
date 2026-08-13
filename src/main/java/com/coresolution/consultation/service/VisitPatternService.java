package com.coresolution.consultation.service;

import java.util.Optional;
import com.coresolution.consultation.dto.prediction.VisitPatternResult;

/**
 * 내담자 방문 패턴 분석 서비스 인터페이스
 *
 * <p>COMPLETED 일정 간격을 기반으로 방문 주기·선호 요일·신뢰도를 실시간 계산한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
public interface VisitPatternService {

    /**
     * 내담자별 방문 패턴 계산
     *
     * <p>COMPLETED 회기가 최소 3회 이상인 경우에만 패턴을 계산한다.
     * 미달 시 {@link Optional#empty()}를 반환한다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param consultantId 상담사 ID
     * @param clientId 내담자 ID
     * @return 방문 패턴 결과 (게이트 미통과 시 empty)
     */
    Optional<VisitPatternResult> calculatePattern(String tenantId, Long consultantId, Long clientId);
}
