package com.coresolution.core.krpublic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 국세청 사업자 조회 결과. 제출·저장을 막지 않으며 실패 시 overallStatus 는 미확인이다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessVerificationResult {

    /** 진위확인 일치 여부. 확인하지 못하면 null. */
    private Boolean authenticityMatch;

    /** 계속, 휴업, 폐업, 미등록. 확인하지 못하면 null. */
    private String businessStatus;

    /** 과세유형. 없으면 null. */
    private String taxType;

    /** 조회 시각 ISO-8601. */
    private String checkedAt;

    /** 일치, 불일치, 미등록, 미확인. */
    private String overallStatus;
}
