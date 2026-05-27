package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.constant.LegalBasis;
import com.coresolution.consultation.entity.PersonalDataDestructionLog;
import com.coresolution.consultation.repository.PersonalDataDestructionLogRepository;
import com.coresolution.consultation.service.PersonalDataDestructionLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link PersonalDataDestructionLogService} 스켈레톤 구현체.
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PersonalDataDestructionLogServiceImpl implements PersonalDataDestructionLogService {

    private final PersonalDataDestructionLogRepository personalDataDestructionLogRepository;

    @Override
    @Transactional
    public PersonalDataDestructionLog save(PersonalDataDestructionLog logEntry) {
        return personalDataDestructionLogRepository.save(logEntry);
    }

    @Override
    @Transactional
    public PersonalDataDestructionLog record(
            String tenantId,
            Long targetUserId,
            DestructionType destructionType,
            String piiColumnsAffectedJson,
            LegalBasis legalBasis,
            String executionReason,
            Long executedByUserId) {
        // TODO: 후속 위임에서 비즈니스 로직 작성 — SHA256 해시 헬퍼·복구 윈도우 계산·rate-limit 등
        PersonalDataDestructionLog entry = PersonalDataDestructionLog.builder()
                .tenantId(tenantId)
                .targetUserId(targetUserId)
                .destructionType(destructionType)
                .piiColumnsAffected(piiColumnsAffectedJson)
                .legalBasis(legalBasis)
                .executionReason(executionReason)
                .executedByUserId(executedByUserId)
                .executedAt(LocalDateTime.now())
                .build();
        return personalDataDestructionLogRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PersonalDataDestructionLog> findByTenantIdAndTargetUserId(String tenantId, Long targetUserId) {
        return personalDataDestructionLogRepository
                .findByTenantIdAndTargetUserIdOrderByExecutedAtDesc(tenantId, targetUserId);
    }
}
