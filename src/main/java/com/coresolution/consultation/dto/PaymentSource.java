package com.coresolution.consultation.dto;

/**
 * 결제 채널(소스) — 수단(method)과 분리.
 *
 * <p>SSOT: {@code docs/project-management/PAYMENT_SOURCE_ONLINE_MANUAL_MAPPING_RULES_20260318.md}</p>
 *
 * @author MindGarden
 * @since 2026-03-18
 */
public enum PaymentSource {
    /** PortOne/PG 경유 */
    ONLINE,
    /** 어드민 confirm-payment 등 센터 등록 */
    MANUAL,
    /** 판별 불가 — 온라인으로 오인 금지 */
    UNKNOWN
}
