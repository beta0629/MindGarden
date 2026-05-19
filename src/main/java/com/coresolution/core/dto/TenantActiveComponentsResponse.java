package com.coresolution.core.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 활성 컴포넌트 코드 목록 API 응답.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantActiveComponentsResponse {

    private List<String> activeComponentCodes;
}
