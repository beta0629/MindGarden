package com.coresolution.consultation.repository;

import java.time.LocalDate;

/**
 * 상담사 선택 묶음 정렬에 쓰는 열. 임상 본문은 포함하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
public interface ConsultationLogSortKey {

    /**
     * @return 상담일지 id
     */
    Long getId();

    /**
     * @return 내담자 users.id
     */
    Long getClientId();

    /**
     * @return 회기 번호. 없으면 null
     */
    Integer getSessionNumber();

    /**
     * @return 상담일
     */
    LocalDate getSessionDate();
}
