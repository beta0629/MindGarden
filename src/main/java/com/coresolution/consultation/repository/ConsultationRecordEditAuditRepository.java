package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.ConsultationRecordEditAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 상담일지 작성·수정 감사 리포지토리. 조회는 항상 테넌트 범위로만 수행한다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Repository
public interface ConsultationRecordEditAuditRepository extends JpaRepository<ConsultationRecordEditAudit, Long> {

    /**
     * 테넌트 범위 일지별 감사 이력 (최신순).
     *
     * @param tenantId 테넌트 ID
     * @param recordId 상담일지 ID
     * @return 감사 이력
     */
    List<ConsultationRecordEditAudit> findByTenantIdAndRecordIdOrderByEditedAtDescIdDesc(String tenantId,
            Long recordId);
}
