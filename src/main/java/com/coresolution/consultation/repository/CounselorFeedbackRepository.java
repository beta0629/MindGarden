package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.CounselorFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CounselorFeedbackRepository extends JpaRepository<CounselorFeedback, Long> {

    Optional<CounselorFeedback> findByIdAndIsDeletedFalse(Long id);

    List<CounselorFeedback> findByConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(Long consultantId);

    /**
     * 테넌트 격리 조회 — 상담사 피드백 이력은 호출자 기관 것만 돌려준다.
     *
     * @param tenantId     테넌트 ID
     * @param consultantId 상담사 ID
     * @return 피드백 이력 (최신순)
     */
    List<CounselorFeedback> findByTenantIdAndConsultantIdAndIsDeletedFalseOrderByFeedbackDateDesc(
        String tenantId, Long consultantId);

    Optional<CounselorFeedback> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);
}
