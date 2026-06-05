package com.coresolution.consultation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 통합 스케줄 — 월별 상담사별 완료(COMPLETED) 카운트 응답.
 *
 * <p>{@code /admin/integrated-schedule} 페이지의 월 카드에서 사용. 상한 표기(99+ 등)는
 * 프론트 책임이며 백엔드는 절대값만 반환한다. {@code counts} 는 같은 테넌트의 활성
 * 상담사를 모두 포함하며 COMPLETED 일정이 없는 상담사도 {@code count: 0} 으로 채워진다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyConsultantCountsResponse {

    /** 조회 연도 (YYYY). */
    private int year;

    /** 조회 월 (1~12). */
    private int month;

    /** 활성 상담사별 완료 카운트. 0건 상담사도 포함. */
    private List<ConsultantCount> counts;

    /**
     * 단일 상담사 카운트 항목.
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
    public static class ConsultantCount {

        /** 상담사 사용자 ID ({@code users.id}). */
        private Long consultantId;

        /** 표시명 (개인정보 SSOT 복호화 후). */
        private String consultantName;

        /** 해당 월 COMPLETED 일정 건수 (활성 0건이면 0). */
        private long count;
    }
}
