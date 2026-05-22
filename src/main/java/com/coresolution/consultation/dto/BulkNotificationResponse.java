package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 수동 다중 발송 배치 응답 DTO.
 *
 * <p>{@link #batchId} 는 동일 배치의 모든 감사로그 행에 부여된 UUID 이며, 어드민 이력 화면에서 그룹 헤더로
 * 사용된다. {@link #results} 는 요청 {@code userIds} 순서를 보존하며, rate-limit 전체 차단·템플릿 매핑 누락 등
 * 배치 단위 사전 실패 시에도 같은 UUID 와 함께 0건/실패 행을 포함할 수 있다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkNotificationResponse {

    /** 배치 ID(UUID). 사전 차단(0건 발송) 시에도 동일 UUID 발급. */
    private String batchId;

    /** 배치 채널(SMS|ALIMTALK). */
    private TestNotificationChannel channel;

    /** 배치 시작 시각(서버 시간). */
    private LocalDateTime startedAt;

    /** 요청 수신자 수(요청 파싱 직후 dedupe 전 원본). */
    private int totalCount;

    /** 발송 성공 수신자 수. */
    private int successCount;

    /** 발송 실패 또는 미해결 수신자 수({@code totalCount - successCount}). */
    private int failureCount;

    /** 배치 전체 차단 시 노출되는 errorCode(개별 발송이 실행됐다면 {@code null}). */
    private String batchErrorCode;

    /** 배치 전체 차단 메시지. */
    private String batchErrorMessage;

    /**
     * 수신자별 결과. 요청 {@code userIds} 순서를 보존한다. 사전 차단 시
     * 0건 발송으로 빈 리스트가 될 수 있다.
     */
    private List<BulkRecipientResult> results;
}
