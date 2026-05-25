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
}
