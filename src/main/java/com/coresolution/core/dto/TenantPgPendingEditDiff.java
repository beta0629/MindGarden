package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ACTIVE 재승인 스테이징({@code pending_request_json})과 live 값의 마스킹 차이.
 * API 키·시크릿은 변경 여부 boolean 만 노출한다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgPendingEditDiff {

    /**
     * 현재 live 마스킹 스냅샷
     */
    private TenantPgPendingEditValues current;

    /**
     * 대기(pending) 마스킹 스냅샷
     */
    private TenantPgPendingEditValues pending;

    /**
     * API Key 변경 여부 (값 자체는 미노출)
     */
    private Boolean apiKeyChanged;

    /**
     * Secret Key 변경 여부 (값 자체는 미노출)
     */
    private Boolean secretKeyChanged;
}
