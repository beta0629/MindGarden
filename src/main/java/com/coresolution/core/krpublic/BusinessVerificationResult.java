package com.coresolution.core.krpublic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 국세청 사업자 조회 결과.
 * 키 미설정·API 장애 시 overallStatus 는 미확인이며 온보딩을 막지 않는다.
 * 진위 불일치·폐업·미등록은 온보딩 게이트에서 차단한다.
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

    /**
     * 영속화용 종합 상태 코드.
     * MATCH / MISMATCH / UNCONFIRMED / UNREGISTERED / CLOSED / SUSPENDED.
     */
    private String verificationStatus;

    /**
     * 국세청 원시 결과 코드. 예: b_stt_cd=01;valid=01.
     * 확인하지 못하면 null.
     */
    private String resultCode;

    /** 휴업 등으로 등록은 허용하되 관리자 주의가 필요할 때 true. */
    private Boolean suspendedWarning;
}
