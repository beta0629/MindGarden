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

    Optional<CounselorFeedback> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);
}
