package com.coresolution.consultation.repository;

import java.time.LocalDate;

/**
 * 상담일지 조회 조건에 걸린 내담자별 기간 집계.
 * 현재 페이지 행 수가 아니다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
public interface ConsultationLogClientAggregate {

    /**
     * @return 내담자 users.id
     */
    Long getClientId();

    /**
     * @return 필터에 걸린 상담일지 수
     */
    Long getSessionCount();

    /**
     * @return 그 집합의 가장 이른 상담일
     */
    LocalDate getFirstSessionDate();

    /**
     * @return 그 집합의 가장 늦은 상담일
     */
    LocalDate getLastSessionDate();
}
