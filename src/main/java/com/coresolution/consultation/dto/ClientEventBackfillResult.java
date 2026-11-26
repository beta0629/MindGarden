package com.coresolution.consultation.dto;

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
    }

    /**
     * 빈 결과(지정 모드).
     *
     * @param mode 실행 모드
     * @param tenantId 테넌트(전체면 null)
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
                .build();
    }
}
