package com.coresolution.consultation.service.impl;

import java.util.Optional;
import com.coresolution.consultation.dto.ConsultationRecordDraftResponse;
import com.coresolution.consultation.entity.ConsultationRecordDraft;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ConsultationRecordDraftRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상담일지 서버 초안 서비스 구현.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsultationRecordDraftServiceImpl implements ConsultationRecordDraftService {

    private final ConsultationRecordDraftRepository consultationRecordDraftRepository;

    private final ScheduleRepository scheduleRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<ConsultationRecordDraftResponse> getDraft(String tenantId, Long consultationId, Long consultantId) {
        validateTenant(tenantId);
        requireAssignableSchedule(tenantId, consultationId, consultantId);
        return consultationRecordDraftRepository
                .findByTenantIdAndConsultationIdAndConsultantIdAndIsDeletedFalse(tenantId, consultationId, consultantId)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public ConsultationRecordDraftResponse upsertDraft(
            String tenantId,
            Long consultationId,
            Long consultantId,
            String payloadJson,
            Long expectedVersion) {
        validateTenant(tenantId);
        requireAssignableSchedule(tenantId, consultationId, consultantId);
        if (payloadJson == null) {
            throw new ValidationException("payloadJson", null, "payloadJson은 필수입니다.");
        }
        Optional<ConsultationRecordDraft> existing = consultationRecordDraftRepository
                .findByTenantIdAndConsultationIdAndConsultantIdAndIsDeletedFalse(tenantId, consultationId, consultantId);
        if (existing.isPresent() && expectedVersion != null && !expectedVersion.equals(existing.get().getVersion())) {
            throw new ValidationException("expectedVersion", expectedVersion, "초안 버전이 일치하지 않습니다. 새로고침 후 다시 시도해 주세요.");
        }
        ConsultationRecordDraft entity = existing.orElseGet(() -> newDraft(tenantId, consultationId, consultantId));
        entity.setPayloadJson(payloadJson);
        ConsultationRecordDraft saved = consultationRecordDraftRepository.save(entity);
        log.info("상담일지 서버 초안 저장: tenantId={}, consultationId={}, consultantId={}, id={}",
                tenantId, consultationId, consultantId, saved.getId());
        return toResponse(saved);
    }

    private void validateTenant(String tenantId) {
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
    }

    private void requireAssignableSchedule(String tenantId, Long consultationId, Long consultantId) {
        Schedule schedule = scheduleRepository.findByTenantIdAndId(tenantId, consultationId)
                .orElseThrow(() -> new EntityNotFoundException("Schedule", consultationId));
        if (Boolean.TRUE.equals(schedule.getIsDeleted())) {
            throw new EntityNotFoundException("Schedule", consultationId, "삭제된 일정입니다.");
        }
        if (schedule.getConsultantId() == null || !schedule.getConsultantId().equals(consultantId)) {
            throw new ForbiddenException("해당 일정에 대한 상담일지 초안을 작성할 권한이 없습니다.");
        }
    }

    private ConsultationRecordDraft newDraft(String tenantId, Long consultationId, Long consultantId) {
        ConsultationRecordDraft draft = new ConsultationRecordDraft();
        draft.setTenantId(tenantId);
        draft.setConsultationId(consultationId);
        draft.setConsultantId(consultantId);
        draft.setPayloadJson("{}");
        draft.setIsDeleted(false);
        return draft;
    }

    private ConsultationRecordDraftResponse toResponse(ConsultationRecordDraft entity) {
        return ConsultationRecordDraftResponse.builder()
                .hasDraft(true)
                .id(entity.getId())
                .consultationId(entity.getConsultationId())
                .consultantId(entity.getConsultantId())
                .payloadJson(entity.getPayloadJson())
                .version(entity.getVersion())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
