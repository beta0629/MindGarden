package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.SelfAssessmentTemplate;
import org.springframework.stereotype.Repository;

/**
 * 자가검사 템플릿 저장소 (관리자 CRUD 연동 예정).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface SelfAssessmentTemplateRepository extends BaseRepository<SelfAssessmentTemplate, Long> {
}
