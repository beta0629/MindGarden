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

    /**
     * 상한·연령 소진 — 일반 간격 재시도 중단·관리자 알림.
     * 자동 취소 없음. expire 는 설정 가능한 장주기 간격으로만 PortOne 을 폴링한다.
     */
    EXHAUSTED
}
