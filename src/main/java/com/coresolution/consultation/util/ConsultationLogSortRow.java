package com.coresolution.consultation.util;

import java.time.LocalDate;

/**
 * 상담일지 묶음·타임라인 정렬에 쓰는 최소 행.
 *
 * @param id 상담일지 id
 * @param clientId 내담자 id. 없으면 null
 * @param consultantId 상담사 id. 없으면 null
 * @param sessionNumber 회기. 없거나 0 이하면 번호 비교에서 뒤로 간다
 * @param sessionDate 상담일
 * @author CoreSolution
 * @since 2026-10-11
 */
public record ConsultationLogSortRow(Long id, Long clientId, Long consultantId, Integer sessionNumber,
        LocalDate sessionDate) {
}
