package com.coresolution.consultation.constant;

/**
 * 자동 SMS 발송 2단계 게이트 (글로벌 + 종목별) 플래그 키 SSOT.
 *
 * <p>운영 결정권자 컨펌 (2026-05-27) — 사용자 결정 원문:
 * <pre>
 *   "TRUE 로 해주고 발송플래그값으로 발송 되고 안되고 하게 해줘"
 *   + 옵션 C (글로벌 + 종목별 2단계 게이트) 확정.
 * </pre>
 *
 * <p>게이트 매트릭스:
 * <table>
 *   <caption>2단계 게이트 진리표</caption>
 *   <tr><th>글로벌</th><th>종목별</th><th>결과</th></tr>
 *   <tr><td>OFF</td><td>OFF</td><td>차단</td></tr>
 *   <tr><td>OFF</td><td>ON</td><td>차단 (글로벌 우선)</td></tr>
 *   <tr><td>ON</td><td>OFF</td><td>차단</td></tr>
 *   <tr><td>ON</td><td>ON</td><td>발송</td></tr>
 * </table>
 *
 * <p>적용 경로:
 * <ul>
 *   <li>{@code NotificationServiceImpl.buildSmsMessage} — 자동 트랜잭션 SMS 7종.</li>
 *   <li>{@code BatchNotificationDispatchServiceImpl.renderSmsBody} — 자동 배치 SMS 8종.</li>
 * </ul>
 *
 * <p>우회(게이트 비적용) 경로:
 * <ul>
 *   <li>어드민 수동 발송 — {@code AdminManualNotificationServiceImpl} /
 *       {@code AdminTestNotificationServiceImpl}. 본문 직접 입력 → 어드민의 발송 결정이 의도.</li>
 *   <li>인증 OTP — {@code SmsAuthService.sendVerificationCode}. SMS_TEMPLATE 미사용.</li>
 * </ul>
 *
 * <p>seed 위치:
 * <ul>
 *   <li>{@code src/main/resources/db/migration/V20260603_002__seed_sms_dispatch_flags.sql}
 *       — 글로벌 system_config row + 종목별 extra_data.dispatch_enabled 추가.</li>
 *   <li>본문 활성화 복원: V20260603_001 (V20260602_001 의 역작용).</li>
 * </ul>
 *
 * <p><b>운영 안전 정책 (2026-05-27)</b>: {@link #DEFAULT_ENABLED} = {@code false}.
 * 시드 row 가 누락된 상태에서도 자동 발송이 트리거되지 않도록 보수적인 폴백을 운영한다.
 * 명시적 ON 은 어드민 또는 SQL UPDATE 로 {@code config_value='true'} 를 기록하거나,
 * 종목별 row 의 {@code extra_data.dispatch_enabled} 를 {@code true} 로 갱신해야만 발화한다.
 *
 * @author MindGarden
 * @since 2026-05-27
 */
public final class SmsDispatchFlagKeys {

    /**
     * 글로벌 게이트 — system_config 전역 행 키.
     *
     * <p>{@code SystemConfigService.getGlobalBoolean(SMS_AUTO_DISPATCH_ENABLED, DEFAULT_ENABLED)}
     * 으로 조회한다. {@code false} 면 종목별 게이트 무관 즉시 차단.
     */
    public static final String SMS_AUTO_DISPATCH_ENABLED =
            "notification.sms.auto-dispatch.enabled";

    /**
     * 카테고리 ({@code system_config.category}) — 어드민 UI 그룹핑·시드 카테고리.
     * {@link NotificationSchedulerFlagKeys#CATEGORY} 와 동일 카테고리에 배치한다.
     */
    public static final String CATEGORY = NotificationSchedulerFlagKeys.CATEGORY;

    /**
     * 시드 행 누락 시 폴백 기본값 (운영 안전 정책 — 명시적 ON row 가 없으면 차단).
     *
     * <p>{@code SystemConfigService.getGlobalBoolean} 두 번째 인자로 사용된다.
     * DB 시드는 {@code 'false'} 로 강제 (V20260603_002) — 동일 SSOT.
     */
    public static final boolean DEFAULT_ENABLED = false;

    /**
     * 종목별 게이트 — {@code common_codes.extra_data} JSON 키.
     *
     * <p>{@code SmsTemplateService.isAutoDispatchEnabledFor} 가 테넌트 override row 의
     * {@code extra_data.dispatch_enabled} 를 우선 조회하고, 없으면 글로벌 row 의 동일 키를
     * 사용한다. 둘 다 없으면 {@link #DEFAULT_ENABLED}.
     */
    public static final String EXTRA_KEY_DISPATCH_ENABLED = "dispatch_enabled";

    private SmsDispatchFlagKeys() {
    }
}
