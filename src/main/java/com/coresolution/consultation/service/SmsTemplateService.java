package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.SmsTemplateAdminItem;
import com.coresolution.consultation.dto.SmsTemplatePreviewResponse;
import com.coresolution.consultation.entity.User;

/**
 * 트랜잭션 SMS 템플릿 서비스.
 *
 * <p>{@code common_codes} 의 {@code SMS_TEMPLATE} 그룹을 SSOT 로 사용하며,
 * 글로벌(코어) 행 + 테넌트 override 행으로 본문을 운영한다. 어드민 UI 는
 * 테넌트 override 만 편집 가능하며, 글로벌 행은 Flyway 시드로만 변경한다
 * (V20260529_004 참조).
 *
 * <p>호출자:
 * <ul>
 *   <li>{@code NotificationServiceImpl.buildSmsMessage} —
 *       {@link #renderForType(String, String, java.util.Map, String[])} 사용.</li>
 *   <li>{@code BatchNotificationDispatchServiceImpl.buildSmsBody*} —
 *       {@link #renderForType(String, String, java.util.Map, String[])} 사용.</li>
 *   <li>{@code AdminSmsTemplateController} — 목록/저장/삭제/미리보기.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-29
 */
public interface SmsTemplateService {

    /**
     * 단일 템플릿 본문을 우선순위(테넌트 override → 글로벌)로 조회한다.
     *
     * @param templateKey {@code common_codes.code_value}
     * @param tenantId    현재 테넌트 ID (null 이면 글로벌만)
     * @return 조회된 본문 또는 미존재 시 빈 Optional
     */
    Optional<String> findTemplateContent(String templateKey, String tenantId);

    /**
     * 본문 + 변수 치환 결과를 한 번에 반환한다.
     * named 변수와 positional 자리표시자를 모두 적용한다.
     *
     * @param templateKey {@code common_codes.code_value}
     * @param tenantId    현재 테넌트 ID
     * @param variables   named 변수 매핑 (null 안전)
     * @param params      positional 인자 배열 (null 안전, 레거시 호환)
     * @return 치환된 본문 또는 row 미존재 시 빈 Optional
     */
    Optional<String> renderForType(String templateKey, String tenantId,
            Map<String, String> variables, String[] params);

    /**
     * 어드민 UI 목록 — 모든 SMS_TEMPLATE 키별 글로벌 + 테넌트 override 본문 정보.
     *
     * @param tenantId 현재 테넌트 ID
     * @return 키별 행 (글로벌 row 가 없으면 제외)
     */
    List<SmsTemplateAdminItem> listForAdmin(String tenantId);

    /**
     * 테넌트 override 본문 upsert.
     *
     * @param templateKey 키
     * @param content     새 본문 (변수 자리표시자 포함)
     * @param tenantId    현재 테넌트 ID (필수)
     * @param updatedBy   수행자 (audit, null 안전)
     * @return 저장 후 어드민 행
     */
    SmsTemplateAdminItem upsertTenantOverride(String templateKey, String content,
            String tenantId, User updatedBy);

    /**
     * 테넌트 override 본문 soft-delete (글로벌 본문으로 회귀).
     *
     * @param templateKey 키
     * @param tenantId    현재 테넌트 ID
     * @param updatedBy   수행자 (audit, null 안전)
     * @return 삭제 후 어드민 행 (테넌트 override 가 비활성으로 표시됨)
     */
    SmsTemplateAdminItem deleteTenantOverride(String templateKey, String tenantId, User updatedBy);

    /**
     * 어드민 미리보기 — 변수 입력값으로 자리표시자를 치환하고 길이/누락 변수 리포트.
     *
     * @param templateKey            키
     * @param tenantId               현재 테넌트 ID
     * @param variables              변수 입력값 (null 안전)
     * @param preferTenantOverride   true 이면 테넌트 override 우선, false 이면 글로벌 강제
     * @return 미리보기 응답 (row 미존재 시 빈 Optional)
     */
    Optional<SmsTemplatePreviewResponse> preview(String templateKey, String tenantId,
            Map<String, String> variables, boolean preferTenantOverride);

    /**
     * 자동 SMS 발송 2단계 게이트(글로벌 + 종목별) — 양쪽 모두 ON 일 때만 {@code true}.
     *
     * <p>판정 순서:
     * <ol>
     *   <li>글로벌 게이트 — {@code SystemConfigService.getGlobalBoolean(
     *       SmsDispatchFlagKeys.SMS_AUTO_DISPATCH_ENABLED,
     *       SmsDispatchFlagKeys.DEFAULT_ENABLED)}. {@code false} 면 즉시 {@code false}.</li>
     *   <li>종목별 게이트 — 테넌트 override row 의 {@code extra_data.dispatch_enabled}
     *       (있으면 우선) → 없으면 글로벌 row 의 동일 키. 둘 다 없으면
     *       {@link com.coresolution.consultation.constant.SmsDispatchFlagKeys#DEFAULT_ENABLED}.</li>
     * </ol>
     *
     * <p>호출자는 본 메서드가 {@code false} 를 반환하면 SMS 발송을 skip 해야 한다
     * ({@code NotificationServiceImpl.buildSmsMessage},
     * {@code BatchNotificationDispatchServiceImpl.renderSmsBody}).
     *
     * <p>우회 경로(어드민 수동 발송, 인증 OTP) 는 본 메서드를 호출하지 않는다.
     *
     * @param templateKey {@code common_codes.code_value} (예: PAYMENT_COMPLETED)
     * @param tenantId    현재 테넌트 ID — null 이면 글로벌 row 만 참조
     * @return 글로벌·종목별 모두 ON 이면 {@code true}, 아니면 {@code false}
     */
    boolean isAutoDispatchEnabledFor(String templateKey, String tenantId);

    /**
     * 글로벌 자동 SMS 발송 게이트 — 어드민 UI 토글 상태 표시용.
     *
     * @return system_config 의 현재 글로벌 토글 (행 누락 시
     *     {@link com.coresolution.consultation.constant.SmsDispatchFlagKeys#DEFAULT_ENABLED})
     */
    boolean isGlobalAutoDispatchEnabled();

    /**
     * 글로벌 자동 SMS 발송 게이트 토글 — 어드민 PATCH 엔드포인트 용.
     *
     * @param enabled   {@code true}=ON, {@code false}=OFF
     * @param updatedBy 수행자 (감사 로그용 — null/blank 면 "ADMIN" 으로 대체)
     */
    void setGlobalAutoDispatchEnabled(boolean enabled, User updatedBy);

    /**
     * 종목별 자동 SMS 발송 토글 — 어드민 PATCH 엔드포인트 용.
     *
     * <p>테넌트 override row 의 {@code extra_data.dispatch_enabled} 를 {@code enabled} 로
     * 설정한다. 테넌트 override 가 없으면 글로벌 row 의 본문을 복사하여 신설한다 — 이후
     * 어드민이 본문 편집 시 동일 row 가 재사용된다.
     *
     * @param templateKey {@code common_codes.code_value}
     * @param enabled     {@code true}=ON, {@code false}=OFF
     * @param tenantId    현재 테넌트 ID (필수)
     * @param updatedBy   수행자 (감사 로그용)
     * @return 갱신된 어드민 행 (UI 즉시 갱신용)
     */
    SmsTemplateAdminItem updateAutoDispatchFlag(String templateKey, boolean enabled,
            String tenantId, User updatedBy);
}
