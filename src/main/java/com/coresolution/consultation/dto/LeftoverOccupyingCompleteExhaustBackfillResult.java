package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * leftover occupying 완료 rem 백필 집계.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeftoverOccupyingCompleteExhaustBackfillResult {

    private long scanned;
    private long applied;
    private long skippedOccupyingInProgress;
    private long skippedCancelled;
    private long skippedTrueRemaining;
    private long skippedOther;

    /**
     * 다른 테넌트 집계를 합친다.
     *
     * @param other 합칠 결과
     */
    public void add(LeftoverOccupyingCompleteExhaustBackfillResult other) {
        if (other == null) {
            return;
        }
        this.scanned += other.scanned;
        this.applied += other.applied;
        this.skippedOccupyingInProgress += other.skippedOccupyingInProgress;
        this.skippedCancelled += other.skippedCancelled;
        this.skippedTrueRemaining += other.skippedTrueRemaining;
        this.skippedOther += other.skippedOther;
    }

    /**
     * 판정 카운트를 1 올린다.
     *
     * @param appliedDecision 적용 여부
     * @param occupyingInProgress 진행 중 occupying 스킵
     * @param cancelled CANCELLED leftover 스킵
     * @param trueRemaining 진짜 잔여 스킵
     */
    public void incrementSkipOrApply(
            boolean appliedDecision,
            boolean occupyingInProgress,
            boolean cancelled,
            boolean trueRemaining) {
        if (appliedDecision) {
            this.applied++;
            return;
        }
        if (occupyingInProgress) {
            this.skippedOccupyingInProgress++;
            return;
        }
        if (cancelled) {
            this.skippedCancelled++;
            return;
        }
        if (trueRemaining) {
            this.skippedTrueRemaining++;
            return;
        }
        this.skippedOther++;
    }
}
