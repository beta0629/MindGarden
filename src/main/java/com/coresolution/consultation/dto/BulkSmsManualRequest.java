package com.coresolution.consultation.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 수동 다중 SMS 발송 요청 DTO.
 *
 * <p>P1.2 — 어드민 수동 알림 발송 도구. 기획 Q2 = 50명 상한, Q5 = rate-limit 부족 시 전체 차단.
 *
 * <p>2026-05-27 — PHONE 모드 추가:
 * <ul>
 *   <li>{@link #userIds} 또는 {@link #phoneNumbers} 둘 중 하나 이상은 반드시 있어야 한다
 *       (서비스 layer 에서 합산 검증 — 둘 다 비어 있으면 {@code RECIPIENTS_REQUIRED}).</li>
 *   <li>합산 수신자 수는 50명을 초과할 수 없다.</li>
 *   <li>{@link #phoneNumbers} 원소는 {@code LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms}
 *       로 정규화되며 실패 시 해당 원소만 결과 행에 {@code PHONE_NUMBER_INVALID} 로 기록된다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkSmsManualRequest {

    /**
     * 현재 테넌트 사용자 PK 목록(중복 허용 안 함). {@link #phoneNumbers} 와 합산하여 최대 50명.
     * 단독으로 비어 있을 수 있다 — 그 경우 {@link #phoneNumbers} 가 1개 이상이어야 한다.
     */
    @Size(max = 50, message = "한 번에 최대 50명까지 발송할 수 있습니다.")
    private List<Long> userIds;

    /**
     * PHONE 모드 — 등록되지 않은 임의 휴대전화 번호 목록(2026-05-27 추가).
     * 각 원소는 한국 휴대전화 번호 형식이어야 하며, 정규화·검증은 서비스 layer 에서 수행한다.
     */
    @Size(max = 50, message = "전화번호는 최대 50개까지 허용됩니다.")
    private List<@Size(max = 20) String> phoneNumbers;

    @NotBlank(message = "메시지 본문은 필수입니다.")
    @Size(max = 1000, message = "메시지 본문은 1000자 이하여야 합니다.")
    private String content;

    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;
}
