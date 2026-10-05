package com.coresolution.core.krpublic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사업자 상태·진위 조회 요청. 외부 호출은 서버에서만 한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessLookupRequest {

    private String businessRegistrationNumber;
    private String openingDate;
    private String representativeName;
}
