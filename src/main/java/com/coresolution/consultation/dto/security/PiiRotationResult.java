package com.coresolution.consultation.dto.security;

import lombok.Builder;
import lombok.Data;

/**
 * PII 회전 1회 실행의 집계 결과.
 *
 * <p>{@link com.coresolution.consultation.service.PersonalDataKeyRotationService} 의 chunk 회전
 * 메서드들이 반환하는 표준 응답이다. 평문/암호문 PII 는 절대 포함하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@Data
@Builder
public class PiiRotationResult {

    /** 회전 대상 테이블명 (예: {@code users}, {@code clients}). */
    private final String tableName;

    /** 본 실행에서 처리한 chunk 개수 (성공 + 실패 + 스킵 합). */
    private final int chunksProcessed;

    /** DONE 상태로 완료된 chunk 개수. */
    private final int chunksDone;

    /** FAILED 상태로 종료된 chunk 개수. */
    private final int chunksFailed;

    /** 본 실행에서 검사한 row 총합 (chunk 단위 fetch 결과 합). */
    private final int rowsScanned;

    /** 실제 재암호화 (UPDATE) 가 수행된 row 합. */
    private final int rowsRotated;

    /** 회전 시점의 활성 키 ID. */
    private final String activeKeyId;

    /** 회전 목표 키 ID (Phase 1 에서는 active_key_id 와 동일). */
    private final String targetKeyId;
}
