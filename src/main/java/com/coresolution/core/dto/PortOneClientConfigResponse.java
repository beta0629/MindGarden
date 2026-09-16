package com.coresolution.core.dto;

import com.coresolution.core.domain.enums.PgProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포트원 V2 브라우저 SDK 용 공개 클라이언트 설정(시크릿 미포함).
 *
 * @author CoreSolution
 * @since 2026-09-16
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortOneClientConfigResponse {

    /** 포트원 스토어 ID */
    private String storeId;

    /** testMode 에 따라 해석된 채널 키 */
    private String channelKey;

    /** 테스트 모드 여부 */
    private Boolean testMode;

    /** PG 설정 ID */
    private String pgConfigurationId;

    /** PG 제공자 (항상 IAMPORT) */
    private PgProvider pgProvider;
}
