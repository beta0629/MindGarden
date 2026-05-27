package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.ClientSatisfactionSurvey;
import com.coresolution.consultation.repository.ClientSatisfactionSurveyRepository;
import com.coresolution.consultation.service.ClientSatisfactionSurveyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ClientSatisfactionSurveyService} 스켈레톤 구현체.
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientSatisfactionSurveyServiceImpl implements ClientSatisfactionSurveyService {

    private final ClientSatisfactionSurveyRepository clientSatisfactionSurveyRepository;

    @Override
    @Transactional
    public ClientSatisfactionSurvey save(ClientSatisfactionSurvey survey) {
        // TODO: 후속 위임에서 비즈니스 로직 작성 — 중복 제출 검증·rating 1-5 범위 등
        return clientSatisfactionSurveyRepository.save(survey);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClientSatisfactionSurvey> findActiveByTenantIdAndConsultantId(
            String tenantId, Long consultantId, Pageable pageable) {
        return clientSatisfactionSurveyRepository
                .findActiveByTenantIdAndConsultantId(tenantId, consultantId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Double averageOverallRating(String tenantId, Long consultantId) {
        return clientSatisfactionSurveyRepository.averageOverallRating(tenantId, consultantId);
    }
}
