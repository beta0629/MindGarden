package com.coresolution.consultation.dto;

import com.coresolution.consultation.entity.ConsultationRecord;

import org.springframework.data.domain.Page;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 묶음 정렬이 적용된 상담일지 페이지와 기간 집계.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@Getter
@RequiredArgsConstructor
public class ConsultationLogGroupedPage {

    private final Page<ConsultationRecord> page;
    private final ConsultationLogGroupSummaryResponse summary;
    private final ConsultationLogTimelineBoundaryResponse boundary;
}
