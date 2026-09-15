package com.coresolution.consultation.service;

/**
 * 스케줄 단위 상담일지 존재 SSOT.
 *
 * <p>회기권 {@code consultation_records} 와 타기관 {@code institution_link_consultation_logs}
 * (및 향후 바우처 일지)를 schedule id 기준으로 OR 판정한다.
 * 대시보드 미작성·자동완료·COMPLETED 가드가 동일 정의를 쓴다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public interface ConsultationLogExistenceSsot {

    /**
     * 스케줄에 활성 상담일지(회기권 또는 타기관)가 있는지.
     *
     * @param tenantId 테넌트 ID
     * @param scheduleId 일정 ID ({@code schedules.id})
     * @return 일지 존재 여부 (인자 null 이면 false)
     */
    boolean existsActiveForSchedule(String tenantId, Long scheduleId);
}
