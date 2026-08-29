package com.coresolution.consultation.service;

import java.time.LocalDate;
import com.coresolution.consultation.entity.Schedule;

/**
 * 스케줄이 COMPLETED 로 전이된 직후, 확정된 PRIMARY 급여가 있으면
 * 미지급은 제자리 재계산·지급완료는 추가정산을 자동 호출한다 (fail-soft).
 *
 * <p>일지/스케줄 저장을 깨뜨리지 않도록 예외는 삼키고 로그만 남긴다.
 * SP 멱등(delta&lt;=0 refuse)으로 중복 COMPLETED write 에도 double-adjust 하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
public interface SalaryLateSessionAutoSyncService {

    /**
     * 스케줄 COMPLETED 전이 직후 급여 자동 동기화.
     *
     * @param schedule 완료된 스케줄 (tenantId·consultantId·date 필요)
     */
    void syncAfterScheduleCompleted(Schedule schedule);

    /**
     * 스케줄 COMPLETED 전이 직후 급여 자동 동기화 (엔티티 없이 호출).
     *
     * @param tenantId     테넌트 ID
     * @param consultantId 상담사 ID
     * @param scheduleDate 스케줄 일자 (YYYY-MM period 산정 SSOT)
     */
    void syncAfterScheduleCompleted(String tenantId, Long consultantId, LocalDate scheduleDate);
}
