package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 백필 이벤트 유형별 집계 (dry-run 의 would-insert = inserted).
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientEventBackfillEventTypeStats {

    private long inserted;
    private long skipped;

    /**
     * 다른 집계를 합친다.
     *
     * @param other 합칠 값
     */
    public void add(ClientEventBackfillEventTypeStats other) {
        if (other == null) {
            return;
        }
        this.inserted += other.inserted;
        this.skipped += other.skipped;
    }
}
