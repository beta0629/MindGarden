package com.coresolution.consultation.dto;

import com.coresolution.consultation.util.ConsultationLogTimelineSort;

import lombok.Builder;
import lombok.Getter;

/**
 * 타임라인 쪽의 정렬과, 쪽 바로 앞 행의 상담사·내담자.
 * 구간 라벨을 다시 그릴지는 화면이 이 값과 쪽의 첫 행을 비교해 정한다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@Getter
@Builder
public class ConsultationLogTimelineBoundaryResponse {

    private final String sort;
    private final Long precedingConsultantId;
    private final String precedingConsultantName;
    private final Long precedingClientId;

    /**
     * @param sort 이 쪽에 적용한 정렬
     * @param precedingConsultantId 직전 행 상담사. 첫 쪽이면 null
     * @param precedingConsultantName 복호화된 표시명. 없으면 null
     * @param precedingClientId 직전 행 내담자. 첫 쪽이면 null
     * @return 경계
     */
    public static ConsultationLogTimelineBoundaryResponse of(ConsultationLogTimelineSort sort,
            Long precedingConsultantId, String precedingConsultantName, Long precedingClientId) {
        ConsultationLogTimelineSort safeSort = sort == null ? ConsultationLogTimelineSort.RECENT : sort;
        return ConsultationLogTimelineBoundaryResponse.builder()
                .sort(safeSort.name())
                .precedingConsultantId(precedingConsultantId)
                .precedingConsultantName(precedingConsultantName)
                .precedingClientId(precedingClientId)
                .build();
    }
}
