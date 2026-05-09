package com.coresolution.consultation.assessment.dto;

import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 내담자 맥락용 TCI/MMPI 심리 데이터 요약 (상담일지·내담자 상세).
 *
 * @author CoreSolution
 * @since 2026-05-09
 */
@Data
@Builder
public class PsychAssessmentClientSummaryDto {

    /** 노출 조건을 만족하는 문서가 1건 이상일 때 true */
    private boolean hasPsychData;

    /** 노출 문서에 등장한 검사 유형(TCI/MMPI), 문서 최신순 기준 중복 제거 */
    private List<PsychAssessmentType> typesPresent;

    /** 노출용 요약이 있는 문서만 (client 연결·GENERATED 리포트·비어 있지 않은 요약) */
    private List<PsychAssessmentDocumentListItem> documents;
}
