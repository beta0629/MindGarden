package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 통합 스케줄 — 월별 상담사별 상담일지 미작성(누락) 일자 응답.
 *
 * <p>{@code /admin/integrated-schedule} 캘린더 상단 범례에서 사용. 같은 테넌트에서
 * 해당 월의 «지난 일정» ({@code date < today}) 중 상태가
 * {@code {COMPLETED, CONFIRMED, BOOKED}} 에 속하고
 * {@link com.coresolution.consultation.entity.ConsultationRecord} 가 작성되지
 * 않은 (LEFT JOIN ... IS NULL) 일정을 상담사별로 그룹화한다. 누락 0건 상담사는
 * 응답에서 제외한다 (UI 노이즈 차단).</p>
 *
 * <p><b>R5 (2026-06-06) — 도메인 SSOT 정정</b>: 본래 «{@code status = COMPLETED} 만»
 * 이었으나, {@link com.coresolution.consultation.service.ScheduleAutoCompleteService}
 * 가 「지난 일정 + 일지 미작성」 케이스의 COMPLETED 자동 승격을 의도적으로 보류하고
 * CONFIRMED/BOOKED 를 유지한다. 따라서 누락 응답은 세 상태 모두를 포함해야 한다.
 * (debugger 분석 ID {@code 265d0db3-c75c-4f01-954d-7ec7720994b0})</p>
 *
 * <p>LEFT JOIN 키 결정: {@code r.consultationId = s.id}. 호출 SSOT 검증:
 * {@code ScheduleServiceImpl#L267, L1324, L2949, L2981, L3008, L3037} + {@code
 * ScheduleAutoCompleteService#L140} 가 동일하게
 * {@code existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, schedule.getId())}
 * 패턴으로 schedule.id 를 consultationId 인자로 전달.</p>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyMissingConsultationLogsResponse {

    /** 조회 연도 (YYYY). */
    private int year;

    /** 조회 월 (1~12). */
    private int month;

    /**
     * 상담사별 누락 일자.
     * 누락 0건 상담사는 포함하지 않는다.
     */
    private List<ConsultantMissingLogs> items;

    /**
     * 단일 상담사 누락 일자 항목.
     *
     * <p>{@code consultantName} 은 {@code ScheduleListUserFieldsResolver}
     * 의 SSOT 복호화 결과를 사용한다. User 미존재/탈퇴 시
     * {@code AdminServiceUserFacingMessages#DISPLAY_NAME_UNKNOWN} 폴백.</p>
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConsultantMissingLogs {

        /** 상담사 사용자 ID ({@code users.id}). */
        private Long consultantId;

        /** 표시명 (개인정보 SSOT 복호화 후). */
        private String consultantName;

        /**
         * 상담일지가 미작성된 일정의 일자 (오름차순).
         * 동일 상담사의 같은 일자에 다건 일정이 모두 누락인 경우 일자는 중복 제거된다.
         */
        private List<LocalDate> missingDates;
    }
}
