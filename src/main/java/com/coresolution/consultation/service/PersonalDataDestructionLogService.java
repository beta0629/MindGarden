package com.coresolution.consultation.service;

import java.util.List;

import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.constant.LegalBasis;
import com.coresolution.consultation.entity.PersonalDataDestructionLog;

/**
 * PIPA §16 개인정보 파기 기록 Service.
 *
 * <p>본 위임 범위는 인터페이스 + 스켈레톤 ServiceImpl. anonymize/tombstone/hard_delete/dormant
 * 4 경로별 비즈니스 로직은 후속 위임 (PersonalDataDestructionService v2) 에서 작성.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public interface PersonalDataDestructionLogService {

    PersonalDataDestructionLog save(PersonalDataDestructionLog logEntry);

    /**
     * 파기 기록 헬퍼.
     */
    PersonalDataDestructionLog record(
            String tenantId,
            Long targetUserId,
            DestructionType destructionType,
            String piiColumnsAffectedJson,
            LegalBasis legalBasis,
            String executionReason,
            Long executedByUserId);

    List<PersonalDataDestructionLog> findByTenantIdAndTargetUserId(String tenantId, Long targetUserId);
}
