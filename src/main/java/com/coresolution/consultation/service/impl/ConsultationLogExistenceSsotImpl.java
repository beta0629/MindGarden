package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.service.ConsultationLogExistenceSsot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ConsultationLogExistenceSsot} — 회기권·타기관 일지 OR.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsultationLogExistenceSsotImpl implements ConsultationLogExistenceSsot {

    private final ConsultationRecordRepository consultationRecordRepository;
    private final InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;

    @Override
    public boolean existsActiveForSchedule(String tenantId, Long scheduleId) {
        if (tenantId == null || tenantId.isEmpty() || scheduleId == null) {
            return false;
        }
        if (consultationRecordRepository.existsActiveForScheduleSsot(tenantId, scheduleId)) {
            return true;
        }
        return institutionLinkConsultationLogRepository.existsActiveForScheduleSsot(tenantId, scheduleId);
    }
}
