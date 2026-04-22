package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.ConsultationRecordDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 상담일지 서버 초안 리포지토리.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Repository
public interface ConsultationRecordDraftRepository extends JpaRepository<ConsultationRecordDraft, Long> {

    /**
     * 테넌트·상담(스케줄)·상담사로 비삭제 초안 1건 조회.
     *
     * @param tenantId 테넌트 ID
     * @param consultationId 상담(스케줄) ID
     * @param consultantId 상담사 ID
     * @return 초안
     */
    Optional<ConsultationRecordDraft> findByTenantIdAndConsultationIdAndConsultantIdAndIsDeletedFalse(
            String tenantId,
            Long consultationId,
            Long consultantId);
}
