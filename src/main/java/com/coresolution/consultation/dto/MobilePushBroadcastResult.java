package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * {@link com.coresolution.consultation.service.MobilePushDispatchService#dispatchAdminAnnouncement
 * dispatchAdminAnnouncement} 한 행(수신자 1명) 결과.
 *
 * <p>어드민 수동 다중 푸시 broadcast 의 행 단위 결과를 호출자({@code AdminManualNotificationService})
 * 가 행 단위 audit · UI 표시에 그대로 매핑할 수 있도록, 발송 실패뿐 아니라
 * <strong>SKIPPED(토큰 없음 / 사용자 옵트아웃 / 멱등 중복)</strong> 사유도 errorCode 로 노출한다.
 *
 * <p>solapi 식별자(group/message ID)는 푸시 채널에서 발급되지 않으므로
 * {@code expoReceiptId} 를 별도 보존한다(Expo Push API ticket id, 단건 발송 한정).
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MobilePushBroadcastResult {

    /**
     * 푸시 broadcast 행 상태.
     */
    public enum Status {
        /** Expo Push API ticket status = ok. */
        SENT,
        /** 토큰 없음 / 카테고리(SYSTEM) off / 멱등 중복 — 실패 아님. */
        SKIPPED,
        /** Expo HTTP·티켓 오류 또는 예외. */
        FAILED
    }

    /** 푸시 토큰이 없는 사용자(스킵 사유). */
    public static final String ERROR_CODE_NO_TOKEN = "PUSH_NO_TOKEN";

    /** 사용자가 알림 OFF — 시스템 카테고리(SYSTEM) 비활성(스킵 사유). */
    public static final String ERROR_CODE_OPTED_OUT = "PUSH_OPTED_OUT";

    /** 멱등 청구 충돌(24h 내 동일 batch+userId 중복). */
    public static final String ERROR_CODE_DUPLICATE = "PUSH_DUPLICATE";

    /** Expo Push API HTTP 실패 / 티켓 error. */
    public static final String ERROR_CODE_EXPO_FAILED = "PUSH_EXPO_FAILED";

    /** 수신자 사용자 PK. 입력 순서를 보존. */
    private Long userId;

    /** 행 상태. */
    private Status status;

    /**
     * SKIPPED·FAILED 사유 errorCode.
     * <ul>
     *   <li>{@link #ERROR_CODE_NO_TOKEN}: 활성 토큰 없음</li>
     *   <li>{@link #ERROR_CODE_OPTED_OUT}: 사용자 SYSTEM 카테고리 OFF</li>
     *   <li>{@link #ERROR_CODE_DUPLICATE}: 멱등 청구 실패(이미 발송됨)</li>
     *   <li>{@link #ERROR_CODE_EXPO_FAILED}: Expo HTTP·티켓 오류</li>
     * </ul>
     */
    private String errorCode;

    /** 사용자 표시용 사유 메시지(절단 가능). */
    private String errorMessage;

    /** Expo Push API 응답 ticket id(성공/오류 모두 보존 가능). */
    private String expoReceiptId;
}
