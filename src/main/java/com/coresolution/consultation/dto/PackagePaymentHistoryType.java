package com.coresolution.consultation.dto;

/**
 * 내담자 패키지 결제 이력 유형.
 *
 * @author MindGarden
 * @since 2026-07-28
 */
public enum PackagePaymentHistoryType {
    /** 최초 매칭(추가 패키지 마커 없는 매핑 행) */
    INITIAL_MAPPING,
    /** 추가 패키지(TERMINATED 병합 행 포함) */
    ADDITIONAL_PACKAGE,
    /** 회기 추가 요청 */
    SESSION_EXTENSION
}
