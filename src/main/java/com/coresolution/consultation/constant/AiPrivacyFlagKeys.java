package com.coresolution.consultation.constant;

/**
 * AI 외부 전송 개인정보 보호 플래그 키 SSOT ({@code system_config} 테넌트 스코프).
 *
 * <p>테넌트 ADMIN 이 {@code /api/v1/admin/system-config/{configKey}} 로 자기 테넌트만 토글한다
 * ({@link SystemConfigAccessPolicy#WRITABLE_KEYS}). 행이 없거나 조회에 실패하면
 * {@link #DEFAULT_PII_MASKING_ENABLED}(마스킹 ON)로 동작한다.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
public final class AiPrivacyFlagKeys {

    /**
     * AI 프롬프트 개인식별정보 마스킹 여부.
     *
     * <p>{@code true}(기본) → 이름·전화번호·이메일·주민등록번호·카드번호를 토큰으로 치환 후 전송.
     * {@code false} → 원문 전송.
     */
    public static final String PII_MASKING_ENABLED = "AI_PII_MASKING_ENABLED";

    /** 행이 없을 때 기본값 — 마스킹 ON. */
    public static final boolean DEFAULT_PII_MASKING_ENABLED = true;

    private AiPrivacyFlagKeys() {
    }
}
