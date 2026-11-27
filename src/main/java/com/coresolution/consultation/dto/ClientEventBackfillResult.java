package com.coresolution.consultation.dto;

import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.ClientEventBackfillMode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * {@code client_event} 백필 집계 결과.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientEventBackfillResult {

    private ClientEventBackfillMode mode;
    private String tenantId;
    private long scanned;
    private long inserted;
    private long skipped;
    private long errors;
    /** 대상 내담자(distinct clientId) 수. */
    private long clientCount;
    /** 유형별 inserted(또는 dry-run would-insert)·skipped. */
    @Builder.Default
    private Map<String, ClientEventBackfillEventTypeStats> byEventType = new LinkedHashMap<>();

    /**
     * 다른 테넌트 집계를 합친다.
     *
     * @param other 합칠 결과
     */
    public void add(ClientEventBackfillResult other) {
        if (other == null) {
            return;
        }
        this.scanned += other.scanned;
        this.inserted += other.inserted;
        this.skipped += other.skipped;
        this.errors += other.errors;
        this.clientCount += other.clientCount;
        if (other.byEventType != null) {
            if (this.byEventType == null) {
                this.byEventType = new LinkedHashMap<>();
            }
            for (Map.Entry<String, ClientEventBackfillEventTypeStats> entry
                    : other.byEventType.entrySet()) {
                this.byEventType
                        .computeIfAbsent(entry.getKey(), k -> new ClientEventBackfillEventTypeStats())
                        .add(entry.getValue());
            }
        }
    }

    /**
     * 유형별 inserted 증가.
     *
     * @param eventTypeCode 이벤트 타입 코드
     */
    public void incrementInserted(String eventTypeCode) {
        this.inserted++;
        ClientEventBackfillEventTypeStats stats = statsFor(eventTypeCode);
        stats.setInserted(stats.getInserted() + 1);
    }

    /**
     * 유형별 skipped 증가.
     *
     * @param eventTypeCode 이벤트 타입 코드
     */
    public void incrementSkipped(String eventTypeCode) {
        this.skipped++;
        ClientEventBackfillEventTypeStats stats = statsFor(eventTypeCode);
        stats.setSkipped(stats.getSkipped() + 1);
    }

    private ClientEventBackfillEventTypeStats statsFor(String eventTypeCode) {
        if (this.byEventType == null) {
            this.byEventType = new LinkedHashMap<>();
        }
        String key = eventTypeCode != null ? eventTypeCode : "UNKNOWN";
        return this.byEventType.computeIfAbsent(key, k -> new ClientEventBackfillEventTypeStats());
    }

    /**
     * 빈 결과(지정 모드).
     *
     * @param mode 실행 모드
     * @param tenantId 테넌트
     * @return 빈 집계
     */
    public static ClientEventBackfillResult empty(ClientEventBackfillMode mode, String tenantId) {
        return ClientEventBackfillResult.builder()
                .mode(mode)
                .tenantId(tenantId)
                .scanned(0L)
                .inserted(0L)
                .skipped(0L)
                .errors(0L)
                .clientCount(0L)
                .byEventType(new LinkedHashMap<>())
                .build();
    }
}
