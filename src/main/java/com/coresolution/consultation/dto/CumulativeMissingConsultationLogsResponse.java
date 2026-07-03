package com.coresolution.consultation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 대시보드 — 상담사별 «상담일지 누락(누적, 전체 기간)» 응답.
 *
 * <p>어드민 대시보드 {@code section.mg-v2-ad-b0kla__missing-logs-section} SSOT.
 * {@link MonthlyMissingConsultationLogsResponse} 가 특정 월 범위의 누락을 반환하는 것과
 * 달리, 본 응답은 «지난 일정»({@code date < today}) 전체에서 상태가
 * {@code {COMPLETED, CONFIRMED, BOOKED}} 이고
 * {@link com.coresolution.consultation.entity.ConsultationRecord} 가 작성되지 않은
 * 일정을 상담사별로 그룹화한다. 누락 0건 상담사는 응답에서 제외한다.</p>
 *
 * <p>대시보드 «상담일지 누락» 섹션은 특정 달이 아니라 «미작성 상담일지가 남아 있는지»를
 * 상시 경고하는 용도이므로 월 경계에 의존하면 안 된다. (7/3 접속 시 6/30 누락 건이 7월
 * 범위 밖으로 빠져 미집계되던 버그 보정.)</p>
 *
 * <p>inner class {@link MonthlyMissingConsultationLogsResponse.ConsultantMissingLogs}
 * 를 재사용해 월별·누적 두 소스가 동일 타입을 공유한다 (프론트 매핑 단순화 — 두 소스
 * 모두 {@code items[].{consultantId, consultantName, missingDates}} 형태).</p>
 *
 * @author CoreSolution
 * @since 2026-07-03
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CumulativeMissingConsultationLogsResponse {

    /**
     * 상담사별 누락 일자 (누적, 전체 기간).
     * 누락 0건 상담사는 포함하지 않는다.
     */
    private List<MonthlyMissingConsultationLogsResponse.ConsultantMissingLogs> items;
}
