package com.coresolution.consultation.service.portone;

/**
 * PortOne 검증 UNKNOWN 재시도 추적 결과.
 *
 * @author MindGarden
 * @since 2026-10-16
 */
public enum PortOneVerifyUnknownRetryOutcome {

    /** 상한 미만 — 기존처럼 재시도(expire 보류 / 웹훅 5xx / verify false) */
    RETRYABLE,

    /** 상한·연령 소진 — 추가 PortOne 해머링 중단, 자동 취소 없음 */
    EXHAUSTED
}
