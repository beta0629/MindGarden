package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계·이관 이력 1건 (표시 전용).
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionTransferHistoryItemResponse {

    /** 원본 레코드 ID(감사 로그 또는 매핑 이력). notes 파생이면 null */
    private Long id;

    /** 발생 시각 */
    private LocalDateTime occurredAt;

    /** 이동 회기 수 */
    private Integer sessionCount;

    /** 소스 내담자 ID */
    private Long fromClientId;

    /** 소스 내담자 표시명 */
    private String fromClientName;

    /** 타깃 내담자 ID */
    private Long toClientId;

    /** 타깃 내담자 표시명 */
    private String toClientName;

    /** 소스 매핑 ID */
    private Long fromMappingId;

    /** 타깃 매핑 ID */
    private Long toMappingId;

    /** 소스 상담사 ID */
    private Long fromConsultantId;

    /** 소스 상담사 표시명 */
    private String fromConsultantName;

    /** 타깃 상담사 ID */
    private Long toConsultantId;

    /** 타깃 상담사 표시명 */
    private String toConsultantName;

    /** 사유(있으면) */
    private String reason;

    /** OUTGOING(승계) / INCOMING(이관) — 조회 기준 내담자·매핑 상대 */
    private String direction;

    /** 승계 또는 이관 */
    private String verb;

    /** {@code 임선희 → 김예린: 6회 승계} 형식 */
    private String headline;

    /** AUDIT_LOG / MAPPING_HISTORY / MAPPING_NOTE */
    private String recordSource;
}
