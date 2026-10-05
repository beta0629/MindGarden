package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.constant.ManualNotificationJobStatus;
import com.coresolution.consultation.constant.ManualNotificationProviderMode;
import com.coresolution.consultation.constant.ManualNotificationRecipientMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 수동 발송 작업 진행·요약 응답.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualNotificationJobResponse {

    private String jobId;
    /** 같은 멱등 키 재요청으로 기존 작업을 돌려줬으면 true. */
    private boolean duplicateRequest;
    private TestNotificationChannel channel;
    private ManualNotificationRecipientMode recipientMode;
    private ManualNotificationJobStatus status;
    private ManualNotificationProviderMode providerMode;
    private boolean marketing;
    private int totalCount;
    private int sentCount;
    private int failedCount;
    private int skippedCount;
    private int remainingCount;
    private int excludedCount;
    private int ineligibleCount;
    private String errorCode;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Summary summary;
    /** includeRecords=true 일 때만 채운다. */
    private List<RecipientRecord> records;

    /**
     * 청크·중복 요약.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private int total;
        private int chunkSize;
        private int chunkCount;
        /** 확정 수신자 기준 청크별 인원(마지막만 나머지). */
        private List<Integer> chunkSizes;
        private int dispatchRecordCount;
        /** 프로바이더 호출 직전 기록 기준 청크별 인원. */
        private List<Integer> dispatchChunkSizes;
        /** 같은 수신자 발송 기록 중복 수(항상 0 이어야 함). */
        private int duplicateCount;
    }

    /**
     * 수신자별 결과·발송 기록.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecipientRecord {
        private int seq;
        private Long userId;
        private String nameMasked;
        private String phoneMasked;
        private ManualNotificationDeliveryStatus status;
        private Integer chunkIndex;
        private String dispatchKey;
        private Integer attemptNo;
        private ManualNotificationDeliveryStatus dispatchStatus;
        private String providerResultCode;
        private String errorCode;
        private String errorMessage;
        private LocalDateTime dispatchedAt;
        private LocalDateTime completedAt;
    }
}
