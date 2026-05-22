package com.coresolution.consultation.service;

/**
 * 알림 배치/이벤트 발송 트랙 A·B 디스패치 서비스 인터페이스.
 *
 * <p>5종 템플릿 (RESERVATION_REMINDER_D2 / RESERVATION_IMMEDIATE_SINGLE /
 * RESERVATION_IMMEDIATE_LATE / SESSION_ENDING_SOON / SESSION_RENEW_PROMPT) 의
 * 발송을 일관된 멱등성·SMS 폴백 흐름으로 처리한다.
 *
 * <p>각 메서드의 공통 흐름:
 * <ol>
 *   <li>멱등성 검사 — {@code notification_batch_send_log} UNIQUE 키 사전 조회.
 *       이미 (성공/실패 무관) 로그가 있으면 skip.</li>
 *   <li>대상 엔티티(Schedule/Mapping/User) 로드 + 변수 추출.</li>
 *   <li>{@code AlimtalkTemplateMappingResolver} 로 {@code ALIMTALK_BIZ_TEMPLATE_CODE} 매핑 lookup.
 *       매핑이 있으면 알림톡 발송, 없으면 SMS 폴백으로 진행.</li>
 *   <li>알림톡 실패 시 SMS 폴백 (호출자가 직접 폴백 — KakaoAlimTalkService 자동 폴백 없음).</li>
 *   <li>발송 결과(성공/실패) 모두 로그 INSERT (UNIQUE 키 충돌은 멱등 skip 으로 해석).</li>
 * </ol>
 *
 * <p>본 서비스는 운영 호출부 ({@code NotificationServiceImpl},
 * {@code KakaoAlimTalkServiceImpl}, {@code SmsAuthService}) 의 시그니처를 변경하지 않으며,
 * 기존 {@code NotificationDispatchHelper} 를 재사용한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
public interface BatchNotificationDispatchService {

    /**
     * D-2 09:00 KST 일괄 발송 — 예약 2일 전 안내 (1회기 이상 잔여 client).
     *
     * @param scheduleId 대상 {@code schedules.id}
     * @return 발송 결과 — 멱등 skip 포함
     */
    DispatchOutcome dispatchReservationReminderD2(Long scheduleId);

    /**
     * 단발성 결제(=총 1회기) client 의 예약 즉시 안내.
     *
     * @param scheduleId 대상 {@code schedules.id}
     * @return 발송 결과
     */
    DispatchOutcome dispatchReservationImmediateSingle(Long scheduleId);

    /**
     * D-2 미만 예약 즉시 안내 (1회기 이상 잔여 + 등록 시점 D-2 미만).
     *
     * @param scheduleId 대상 {@code schedules.id}
     * @return 발송 결과
     */
    DispatchOutcome dispatchReservationImmediateLate(Long scheduleId);

    /**
     * 잔여 1회기 진입 안내 — 회기 차감 직후 호출.
     *
     * @param mappingId 대상 {@code consultant_client_mappings.id}
     * @return 발송 결과
     */
    DispatchOutcome dispatchSessionEndingSoon(Long mappingId);

    /**
     * 회기수 유도 — 마지막 회기 종료 직후 호출. 마케팅 동의 + 첫 실행 cutoff 가드.
     *
     * @param mappingId 대상 {@code consultant_client_mappings.id}
     * @return 발송 결과
     */
    DispatchOutcome dispatchSessionRenewPrompt(Long mappingId);

    /**
     * 신규 매칭 환영 안내 — 매칭 생성 직후 호출. user 영구 1회 멱등.
     *
     * <p>설계: NOTIFICATION_BATCH_MESSAGE_DESIGN.md §11. 매칭 update/재활성화 시에는 호출하지 않으며,
     * 동일 user 에 대해 이미 발송된 이력이 있으면 멱등 검사로 skip 된다(template_code=CLIENT_WELCOME_FIRST,
     * target_type=USER, target_id=user_id).
     *
     * @param mappingId 신규 생성된 {@code consultant_client_mappings.id}
     * @return 발송 결과
     */
    DispatchOutcome dispatchClientWelcomeFirst(Long mappingId);

    /**
     * 첫 상담 안내 — 스케줄 등록 직후 호출. user 영구 1회 멱등 + 첫 상담 여부 검증.
     *
     * <p>설계: NOTIFICATION_BATCH_MESSAGE_DESIGN.md §12. 호출자는 첫 상담 여부를 검증하지 않고
     * 본 메서드가 내부에서 client 의 누적 스케줄 카운트(=1)로 판정한다. 두 번째 이상 스케줄에서는
     * {@code SKIPPED_VALIDATION + NOT_FIRST_SCHEDULE} 으로 종료된다.
     *
     * <p>상담 방법({@link com.coresolution.consultation.entity.Schedule#getConsultationMethod()})에 따라
     * {@code INITIAL_GUIDE_ONLINE} ({@code ONLINE}) 또는 {@code INITIAL_GUIDE_OFFLINE} (그 외) 로 분기하며,
     * 멱등 키는 두 코드를 공유한다(어느 한쪽 발송 성공 시 다른 쪽 차단).
     *
     * @param scheduleId 첫 등록된 {@code schedules.id}
     * @return 발송 결과
     */
    DispatchOutcome dispatchInitialGuide(Long scheduleId);

    /**
     * 발송 결과 한 번에 노출 — 멱등 skip / 매핑 누락 폴백 / 알림톡 성공 / SMS 폴백 / 완전 실패.
     *
     * @param status        결과 상태
     * @param channelUsed   최종 발송 채널 ({@code ALIMTALK}/{@code SMS}/{@code null} skip)
     * @param fallbackToSms 알림톡 실패 → SMS 폴백 여부
     * @param errorCode     실패 코드 (성공 시 null)
     * @param errorMessage  실패 메시지 (성공 시 null)
     * @param logId         저장된 멱등 로그 PK (skip 의 경우 직전 로그 PK)
     */
    record DispatchOutcome(Status status, String channelUsed, boolean fallbackToSms,
            String errorCode, String errorMessage, Long logId) {

        /**
         * 발송 결과 분류.
         */
        public enum Status {
            /** 알림톡 발송 성공. */
            ALIMTALK_SENT,
            /** 알림톡 실패 후 SMS 폴백 성공. */
            SMS_FALLBACK_SENT,
            /** 알림톡 매핑이 없어 SMS 폴백만 시도하여 성공. */
            SMS_ONLY_SENT,
            /** 알림톡/SMS 모두 실패. */
            FAILED,
            /** 멱등성 검사로 skip. */
            SKIPPED_DUPLICATE,
            /** 사전 검증 실패 (수신자 폰 없음, 마케팅 미동의, cutoff 이전 등). */
            SKIPPED_VALIDATION,
            /** 드라이런 모드 — 발송하지 않고 카운트만 기록. */
            DRY_RUN
        }
    }
}
