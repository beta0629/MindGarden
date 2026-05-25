package com.coresolution.consultation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 SMS 템플릿 미리보기 응답.
 *
 * @param key                  SMS_TEMPLATE 키
 * @param sourceContent        치환 전 본문 (사용된 출처 — 테넌트 override 또는 전역)
 * @param previewContent       치환 결과
 * @param byteLength           UTF-8 바이트 길이 (SMS 90바이트 제한 검증용)
 * @param charLength           문자 길이
 * @param missingVariables     본문에는 있지만 입력값이 없는 변수
 * @param fromTenantOverride   테넌트 override 본문이 사용되었는지 여부
 *
 * @author MindGarden
 * @since 2026-05-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsTemplatePreviewResponse {
    private String key;
    private String sourceContent;
    private String previewContent;
    private int byteLength;
    private int charLength;
    private List<String> missingVariables;
    private boolean fromTenantOverride;
}
