package com.coresolution.consultation.dto;

import java.util.List;
import java.util.Map;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 수동 다중 알림톡 발송 요청 DTO.
 *
 * <p>P1.2 — 어드민 수동 알림 발송 도구. {@link #templateSource} 가 {@code COMMON_CODE} 이면
 * 공통코드 그룹 {@code ALIMTALK_BIZ_TEMPLATE_CODE} 매핑이 필수이며, 매핑 없음 시
 * {@code TEMPLATE_NOT_MAPPED} 로 전체 차단한다(0건 발송, 배치 전체 실패).
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAlimtalkManualRequest {

    @NotEmpty(message = "수신자 목록은 1명 이상이어야 합니다.")
    @Size(max = 50, message = "한 번에 최대 50명까지 발송할 수 있습니다.")
    private List<Long> userIds;

    @NotBlank(message = "템플릿 코드는 필수입니다.")
    @Size(max = 100, message = "템플릿 코드는 100자 이하여야 합니다.")
    private String templateCode;

    @NotNull(message = "templateSource 는 필수입니다 (COMMON_CODE / SOLAPI).")
    private TestNotificationAlimtalkTemplateSource templateSource;

    /**
     * 알림톡 변수(key=#{변수명}). null 허용. 값은 500자 이하.
     */
    private Map<String, String> templateParams;

    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;
}
