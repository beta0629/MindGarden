package com.coresolution.consultation.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 수동 다중 푸시 broadcast 요청 DTO.
 *
 * <p>{@code AdminManualNotificationService.sendBulkPush(...)} 가 사용하며, SMS·알림톡 채널과
 * 동일하게 50명 상한 + 발송 사유 필수 정책을 적용한다. 푸시는 본문 1000자 / 제목 50자까지 허용
 * (Expo Push API 메시지 페이로드 한도 내).
 *
 * <p>2026-05-27 — PHONE 모드 가드: 푸시 채널은 FCM/Expo 토큰이 사용자 매핑에 강하게 결합되어
 * 등록되지 않은 임의 휴대전화로의 발송이 원리적으로 불가능하다. {@link #phoneNumbers} 가
 * 비어 있지 않으면 서비스 layer 에서 {@code PHONE_NOT_SUPPORTED_FOR_PUSH} 로 전체 차단한다.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkPushManualRequest {

    /** 현재 테넌트 사용자 PK 목록 (중복 허용 안 함, 1~50명). */
    @NotEmpty(message = "수신자 목록은 1명 이상이어야 합니다.")
    @Size(max = 50, message = "한 번에 최대 50명까지 발송할 수 있습니다.")
    private List<Long> userIds;

    /**
     * 푸시 채널 가드 — 임의 휴대전화 발송은 미지원(2026-05-27). 클라이언트가 실수로 채워 보낸 경우
     * 서비스 layer 가 {@code PHONE_NOT_SUPPORTED_FOR_PUSH} 배치 에러 코드로 전체 차단한다.
     */
    @Size(max = 50, message = "전화번호는 최대 50개까지 허용됩니다.")
    private List<@Size(max = 20) String> phoneNumbers;

    /** 푸시 제목 — Expo title. */
    @NotBlank(message = "푸시 제목은 필수입니다.")
    @Size(max = 50, message = "푸시 제목은 50자 이하여야 합니다.")
    private String title;

    /** 푸시 본문 — Expo body. */
    @NotBlank(message = "푸시 본문은 필수입니다.")
    @Size(max = 1000, message = "푸시 본문은 1000자 이하여야 합니다.")
    private String body;

    /** 발송 사유(감사로그 영구 보존). */
    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;
}
