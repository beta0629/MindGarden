package com.coresolution.consultation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 통합 스케줄 — 상담사별 «누적» COMPLETED 카운트 응답 (전체 기간).
 *
 * <p><b>R6 (2026-06-06)</b> — 어드민 대시보드 「상담사 별 통합데이터」 카드의
 * «누적 상담 건수» 섹션 SSOT. 기존 {@code consultation-completion} API 의
 * {@code totalCount}(status 무관) 와 의미가 달라 별도 응답 스키마로 분리한다.</p>
 *
 * <p><b>도메인 정합</b>:
 * <ul>
 *   <li>대상 상태: {@link com.coresolution.consultation.constant.ScheduleStatus#COMPLETED} 만.</li>
 *   <li>활성 상담사 모두 포함 — 카운트 0 톤다운 시각화를 프론트가 지원하기 위해
 *       0건 상담사도 응답에 포함한다.</li>
 *   <li>정렬: count DESC, consultantName ASC (대시보드 ranking 정합).</li>
 *   <li>상한 표기(99+ 등)는 프론트 책임 — 백엔드는 절대값만 반환한다.</li>
 * </ul>
 * </p>
 *
 * <p>inner record {@link MonthlyConsultantCountsResponse.ConsultantCount} 를 재사용해
 * 같은 카드 안의 월별·누적 두 섹션이 동일 타입을 공유한다 (프론트 매핑 단순화).</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CumulativeConsultantCountsResponse {

    /**
     * 활성 상담사별 누적 COMPLETED 카운트. 0건 상담사도 포함.
     * 정렬: {@code count DESC}, 동률 시 {@code consultantName ASC}.
     */
    private List<MonthlyConsultantCountsResponse.ConsultantCount> counts;
}
