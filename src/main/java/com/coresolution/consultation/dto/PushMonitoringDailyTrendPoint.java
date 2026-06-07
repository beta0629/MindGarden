package com.coresolution.consultation.dto;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 일별 발송 추이 포인트.
 *
 * <p>디자이너 핸드오프 §4.6 (PushMonitoringTrendChart) 1:1 매핑. CSS-driven stacked bar
 * 가 사용하는 일자별 채널·결과 분해 데이터.
 *
 * <p>UI 는 {@code dateIso} 를 X 축 라벨 'MM-DD' 로 표시하고, 채널별 stacked 막대 높이를
 * {@code alimtalkCount}/{@code smsCount}/{@code pushCount} 비율로 계산한다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PushMonitoringDailyTrendPoint {

    /** 'YYYY-MM-DD' 직렬화 (Asia/Seoul). */
    private LocalDate dateIso;

    private long alimtalkCount;
    private long smsCount;
    private long pushCount;

    private long successCount;
    private long failureCount;
    private long skipCount;
    private long pendingCount;
}
