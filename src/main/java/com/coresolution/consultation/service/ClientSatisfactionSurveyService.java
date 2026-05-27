package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ClientSatisfactionSurvey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 내담자 만족도 Service (planner v1.0 인용).
 *
 * <p>본 위임 범위는 인터페이스 + 스켈레톤 ServiceImpl. 만족도 제출 검증·중복 제출 제어 등의
 * 비즈니스 로직은 후속 위임에서 작성.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public interface ClientSatisfactionSurveyService {

    ClientSatisfactionSurvey save(ClientSatisfactionSurvey survey);

    /**
     * 테넌트 + 컨설턴트별 활성 만족도 페이지 조회.
     */
    Page<ClientSatisfactionSurvey> findActiveByTenantIdAndConsultantId(
            String tenantId, Long consultantId, Pageable pageable);

    /**
     * 테넌트 + 컨설턴트의 평균 전체 평점.
     */
    Double averageOverallRating(String tenantId, Long consultantId);
}
