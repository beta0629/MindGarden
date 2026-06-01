package com.coresolution.consultation.service.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.SmsDispatchFlagKeys;
import com.coresolution.consultation.dto.SmsTemplateAdminItem;
import com.coresolution.consultation.dto.SmsTemplatePreviewResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.util.SmsTemplateRenderer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * {@link SmsTemplateService} 구현 — {@code common_codes.code_group = 'SMS_TEMPLATE'} 기반.
 *
 * <p>조회 우선순위: 테넌트 override 활성 row → 글로벌 활성 row.
 * 본문 fallback 정책: row 미존재 시 빈 Optional 반환 (호출자가 SMS skip 처리).
 *
 * @author MindGarden
 * @since 2026-05-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsTemplateServiceImpl implements SmsTemplateService {

    /** SMS_TEMPLATE 그룹명. */
    public static final String CODE_GROUP_SMS_TEMPLATE = "SMS_TEMPLATE";

    /** {@code extra_data.category} 키. */
    static final String EXTRA_KEY_CATEGORY = "category";

    /** {@code extra_data.variables} 키 (List). */
    static final String EXTRA_KEY_VARIABLES = "variables";

    /**
     * {@code extra_data.audience} 키 — 수신 대상 분류 (V20260607_004 시드).
     * 값: {@code CLIENT}/{@code CONSULTANT}/{@code BOTH}/{@code ADMIN}/{@code SYSTEM}.
     * 어드민 UI Pill 배지 색상 분기 + 향후 발송 정책 필터링용.
     * V20260607_005 재시드 — BOTH 4종 + ADMIN 1종 분리.
     */
    static final String EXTRA_KEY_AUDIENCE = "audience";

    /** {@link #EXTRA_KEY_AUDIENCE} 미시드 시 어드민 UI 폴백 값. */
    static final String AUDIENCE_DEFAULT = "CLIENT";

    /**
     * {@code extra_data.trigger} 키 — 발송 조건 자연어 (V20260607_005 시드).
     * 어드민 UI '발송 조건: ...' 강조 노출. 본문만 보고 트리거 헷갈리는 문제 해소.
     */
    static final String EXTRA_KEY_TRIGGER = "trigger";

    /** updatedBy 가 비었을 때 사용할 fallback (감사 로그). */
    private static final String DEFAULT_UPDATED_BY = "ADMIN";

    private final CommonCodeRepository commonCodeRepository;
    private final ObjectMapper objectMapper;
    private final SystemConfigService systemConfigService;

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findTemplateContent(String templateKey, String tenantId) {
        if (templateKey == null || templateKey.isBlank()) {
            return Optional.empty();
        }

        Optional<CommonCode> tenantRow = (tenantId != null && !tenantId.isBlank())
                ? commonCodeRepository.findTenantCodeByGroupAndValue(
                        tenantId, CODE_GROUP_SMS_TEMPLATE, templateKey)
                : Optional.empty();

        if (tenantRow.isPresent()) {
            String label = trimToNull(tenantRow.get().getCodeLabel());
            if (label != null) {
                return Optional.of(label);
            }
        }

        Optional<CommonCode> coreRow = commonCodeRepository.findCoreCodeByGroupAndValue(
                CODE_GROUP_SMS_TEMPLATE, templateKey);
        return coreRow.map(c -> trimToNull(c.getCodeLabel())).filter(s -> s != null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> renderForType(String templateKey, String tenantId,
            Map<String, String> variables, String[] params) {
        return findTemplateContent(templateKey, tenantId)
                .map(content -> SmsTemplateRenderer.render(content, variables, params));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SmsTemplateAdminItem> listForAdmin(String tenantId) {
        List<CommonCode> coreRows = commonCodeRepository.findCoreCodesByGroup(CODE_GROUP_SMS_TEMPLATE);
        if (coreRows == null || coreRows.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, CommonCode> tenantRowsByKey = new LinkedHashMap<>();
        if (tenantId != null && !tenantId.isBlank()) {
            List<CommonCode> tenantRows = commonCodeRepository
                    .findTenantCodesByGroup(tenantId, CODE_GROUP_SMS_TEMPLATE);
            if (tenantRows != null) {
                for (CommonCode row : tenantRows) {
                    tenantRowsByKey.put(row.getCodeValue(), row);
                }
            }
        }

        List<SmsTemplateAdminItem> items = new ArrayList<>(coreRows.size());
        for (CommonCode core : coreRows) {
            CommonCode tenantOverride = tenantRowsByKey.get(core.getCodeValue());
            items.add(toAdminItem(core, tenantOverride));
        }
        return items;
    }

    @Override
    @Transactional
    public SmsTemplateAdminItem upsertTenantOverride(String templateKey, String content,
            String tenantId, User updatedBy) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId 가 필요합니다.");
        }
        if (templateKey == null || templateKey.isBlank()) {
            throw new IllegalArgumentException("templateKey 가 필요합니다.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("본문은 빈 값이 될 수 없습니다.");
        }

        CommonCode core = commonCodeRepository
                .findCoreCodeByGroupAndValue(CODE_GROUP_SMS_TEMPLATE, templateKey)
                .orElseThrow(() -> new IllegalArgumentException(
                        "글로벌 SMS 템플릿이 존재하지 않습니다: " + templateKey));

        Optional<CommonCode> existing = commonCodeRepository.findTenantCodeByGroupAndValue(
                tenantId, CODE_GROUP_SMS_TEMPLATE, templateKey);

        CommonCode row;
        if (existing.isPresent()) {
            row = existing.get();
            row.setCodeLabel(content);
            if (Boolean.FALSE.equals(row.getIsActive())) {
                row.setIsActive(true);
            }
            if (Boolean.TRUE.equals(row.getIsDeleted())) {
                row.setIsDeleted(false);
                row.setDeletedAt(null);
            }
        } else {
            row = CommonCode.builder()
                    .codeGroup(CODE_GROUP_SMS_TEMPLATE)
                    .codeValue(templateKey)
                    .codeLabel(content)
                    .koreanName(core.getKoreanName())
                    .codeDescription(core.getCodeDescription())
                    .sortOrder(core.getSortOrder() != null ? core.getSortOrder() : 0)
                    .extraData(core.getExtraData())
                    .isActive(true)
                    .build();
            row.setTenantId(tenantId);
        }

        commonCodeRepository.save(row);
        log.info("SMS 템플릿 테넌트 override 저장: tenantId={}, key={}, by={}",
                tenantId, templateKey, updatedBy != null ? updatedBy.getId() : null);
        return toAdminItem(core, row);
    }

    @Override
    @Transactional
    public SmsTemplateAdminItem deleteTenantOverride(String templateKey, String tenantId, User updatedBy) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId 가 필요합니다.");
        }
        if (templateKey == null || templateKey.isBlank()) {
            throw new IllegalArgumentException("templateKey 가 필요합니다.");
        }

        CommonCode core = commonCodeRepository
                .findCoreCodeByGroupAndValue(CODE_GROUP_SMS_TEMPLATE, templateKey)
                .orElseThrow(() -> new IllegalArgumentException(
                        "글로벌 SMS 템플릿이 존재하지 않습니다: " + templateKey));

        Optional<CommonCode> existing = commonCodeRepository.findTenantCodeByGroupAndValue(
                tenantId, CODE_GROUP_SMS_TEMPLATE, templateKey);
        if (existing.isPresent()) {
            CommonCode row = existing.get();
            row.delete();
            row.setIsActive(false);
            commonCodeRepository.save(row);
            log.info("SMS 템플릿 테넌트 override 삭제(soft): tenantId={}, key={}, by={}",
                    tenantId, templateKey, updatedBy != null ? updatedBy.getId() : null);
        }
        return toAdminItem(core, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SmsTemplatePreviewResponse> preview(String templateKey, String tenantId,
            Map<String, String> variables, boolean preferTenantOverride) {
        if (templateKey == null || templateKey.isBlank()) {
            return Optional.empty();
        }

        CommonCode core = commonCodeRepository
                .findCoreCodeByGroupAndValue(CODE_GROUP_SMS_TEMPLATE, templateKey)
                .orElse(null);
        if (core == null) {
            return Optional.empty();
        }

        Optional<CommonCode> tenantRow = (preferTenantOverride && tenantId != null && !tenantId.isBlank())
                ? commonCodeRepository.findTenantCodeByGroupAndValue(
                        tenantId, CODE_GROUP_SMS_TEMPLATE, templateKey)
                : Optional.empty();

        boolean usingTenant = tenantRow.isPresent()
                && trimToNull(tenantRow.get().getCodeLabel()) != null;
        String source = usingTenant
                ? trimToNull(tenantRow.get().getCodeLabel())
                : trimToNull(core.getCodeLabel());
        if (source == null) {
            return Optional.empty();
        }

        Map<String, String> safeVars = variables != null ? variables : Collections.emptyMap();
        String rendered = SmsTemplateRenderer.renderNamed(source, safeVars);
        return Optional.of(SmsTemplatePreviewResponse.builder()
                .key(templateKey)
                .sourceContent(source)
                .previewContent(rendered)
                .byteLength(SmsTemplateRenderer.byteLengthUtf8(rendered))
                .charLength(rendered.length())
                .missingVariables(SmsTemplateRenderer.findMissingVariables(source, safeVars))
                .fromTenantOverride(usingTenant)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isAutoDispatchEnabledFor(String templateKey, String tenantId) {
        if (templateKey == null || templateKey.isBlank()) {
            return false;
        }

        boolean globalEnabled = isGlobalAutoDispatchEnabled();
        if (!globalEnabled) {
            return false;
        }

        Boolean tenantValue = (tenantId != null && !tenantId.isBlank())
                ? commonCodeRepository
                    .findTenantCodeByGroupAndValue(tenantId, CODE_GROUP_SMS_TEMPLATE, templateKey)
                    .map(CommonCode::getExtraData)
                    .map(this::readDispatchEnabledFromExtra)
                    .orElse(null)
                : null;
        if (tenantValue != null) {
            return tenantValue;
        }

        Boolean globalValue = commonCodeRepository
                .findCoreCodeByGroupAndValue(CODE_GROUP_SMS_TEMPLATE, templateKey)
                .map(CommonCode::getExtraData)
                .map(this::readDispatchEnabledFromExtra)
                .orElse(null);
        if (globalValue != null) {
            return globalValue;
        }
        return SmsDispatchFlagKeys.DEFAULT_ENABLED;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isGlobalAutoDispatchEnabled() {
        return systemConfigService.getGlobalBoolean(
                SmsDispatchFlagKeys.SMS_AUTO_DISPATCH_ENABLED,
                SmsDispatchFlagKeys.DEFAULT_ENABLED);
    }

    @Override
    @Transactional
    public void setGlobalAutoDispatchEnabled(boolean enabled, User updatedBy) {
        String actor = resolveActor(updatedBy);
        systemConfigService.setGlobalBoolean(
                SmsDispatchFlagKeys.SMS_AUTO_DISPATCH_ENABLED, enabled, actor);
        log.info("[SMS_GATE_TOGGLE] global={} by={}", enabled, actor);
    }

    @Override
    @Transactional
    public SmsTemplateAdminItem updateAutoDispatchFlag(String templateKey, boolean enabled,
            String tenantId, User updatedBy) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId 가 필요합니다.");
        }
        if (templateKey == null || templateKey.isBlank()) {
            throw new IllegalArgumentException("templateKey 가 필요합니다.");
        }

        CommonCode core = commonCodeRepository
                .findCoreCodeByGroupAndValue(CODE_GROUP_SMS_TEMPLATE, templateKey)
                .orElseThrow(() -> new IllegalArgumentException(
                        "글로벌 SMS 템플릿이 존재하지 않습니다: " + templateKey));

        Optional<CommonCode> existing = commonCodeRepository.findTenantCodeByGroupAndValue(
                tenantId, CODE_GROUP_SMS_TEMPLATE, templateKey);

        CommonCode row;
        if (existing.isPresent()) {
            row = existing.get();
            if (Boolean.FALSE.equals(row.getIsActive())) {
                row.setIsActive(true);
            }
            if (Boolean.TRUE.equals(row.getIsDeleted())) {
                row.setIsDeleted(false);
                row.setDeletedAt(null);
            }
        } else {
            row = CommonCode.builder()
                    .codeGroup(CODE_GROUP_SMS_TEMPLATE)
                    .codeValue(templateKey)
                    .codeLabel(core.getCodeLabel())
                    .koreanName(core.getKoreanName())
                    .codeDescription(core.getCodeDescription())
                    .sortOrder(core.getSortOrder() != null ? core.getSortOrder() : 0)
                    .extraData(core.getExtraData())
                    .isActive(true)
                    .build();
            row.setTenantId(tenantId);
        }

        row.setExtraData(writeDispatchEnabledIntoExtra(row.getExtraData(), enabled));
        commonCodeRepository.save(row);
        String actor = resolveActor(updatedBy);
        log.info("[SMS_GATE_TOGGLE] template={} tenant={} enabled={} by={}",
                templateKey, tenantId, enabled, actor);

        return toAdminItem(core, row);
    }

    /**
     * {@code extra_data} JSON 에 {@code dispatch_enabled} 키를 머지한다.
     *
     * <p>기존 키(category/variables/trigger/priority 등)는 보존하고 dispatch_enabled 만 갱신한다.
     * 직렬화 실패 시 안전한 단일 키 JSON 으로 fallback 하여 row 갱신을 막지 않는다.
     *
     * @param currentJson 기존 extra_data (null/blank 허용)
     * @param enabled     새 dispatch_enabled 값
     * @return 머지된 JSON 문자열
     */
    private String writeDispatchEnabledIntoExtra(String currentJson, boolean enabled) {
        Map<String, Object> base = new LinkedHashMap<>(parseExtraData(currentJson));
        base.put(SmsDispatchFlagKeys.EXTRA_KEY_DISPATCH_ENABLED, enabled);
        try {
            return objectMapper.writeValueAsString(base);
        } catch (JsonProcessingException e) {
            log.warn("extra_data 직렬화 실패 — 단일 키 JSON fallback: err={}", e.getMessage());
            return enabled
                    ? "{\"" + SmsDispatchFlagKeys.EXTRA_KEY_DISPATCH_ENABLED + "\":true}"
                    : "{\"" + SmsDispatchFlagKeys.EXTRA_KEY_DISPATCH_ENABLED + "\":false}";
        }
    }

    /**
     * 감사 로그용 actor 문자열 — User.id/userId 우선, 없으면 fallback.
     *
     * @param user 로그인 사용자 (null 안전)
     * @return 비어있지 않은 actor 식별자
     */
    private String resolveActor(User user) {
        if (user == null) {
            return DEFAULT_UPDATED_BY;
        }
        if (user.getUserId() != null && !user.getUserId().isBlank()) {
            return user.getUserId();
        }
        if (user.getId() != null) {
            return String.valueOf(user.getId());
        }
        return DEFAULT_UPDATED_BY;
    }

    private SmsTemplateAdminItem toAdminItem(CommonCode core, CommonCode tenantOverride) {
        Map<String, Object> extras = parseExtraData(core.getExtraData());
        String category = stringValue(extras.get(EXTRA_KEY_CATEGORY));
        List<String> variables = listValue(extras.get(EXTRA_KEY_VARIABLES));
        String audience = stringValue(extras.get(EXTRA_KEY_AUDIENCE));
        if (audience == null || audience.isBlank()) {
            audience = AUDIENCE_DEFAULT;
        }
        String trigger = stringValue(extras.get(EXTRA_KEY_TRIGGER));

        boolean hasOverride = tenantOverride != null
                && Boolean.TRUE.equals(tenantOverride.getIsActive())
                && !Boolean.TRUE.equals(tenantOverride.getIsDeleted())
                && trimToNull(tenantOverride.getCodeLabel()) != null;

        String tenantContent = hasOverride ? tenantOverride.getCodeLabel() : null;

        boolean globalDispatch = isGlobalAutoDispatchEnabled();
        Boolean tenantDispatchOverride = hasOverride
                ? readDispatchEnabledFromExtra(tenantOverride.getExtraData())
                : null;
        boolean tenantDispatch = tenantDispatchOverride != null
                ? tenantDispatchOverride
                : Boolean.TRUE.equals(extras.get(SmsDispatchFlagKeys.EXTRA_KEY_DISPATCH_ENABLED));

        return SmsTemplateAdminItem.builder()
                .key(core.getCodeValue())
                .label(core.getKoreanName())
                .description(core.getCodeDescription())
                .category(category)
                .variables(variables.isEmpty()
                        ? SmsTemplateRenderer.extractNamedVariables(core.getCodeLabel())
                        : variables)
                .globalContent(core.getCodeLabel())
                .tenantContent(tenantContent)
                .updatedAt(hasOverride ? tenantOverride.getUpdatedAt() : core.getUpdatedAt())
                .updatedByLabel(hasOverride ? "TENANT" : "GLOBAL")
                .tenantOverride(hasOverride)
                .globalDispatchEnabled(globalDispatch)
                .tenantDispatchEnabled(tenantDispatch)
                .effectiveDispatchEnabled(globalDispatch && tenantDispatch)
                .audience(audience)
                .trigger(trigger)
                .build();
    }

    /**
     * {@code extra_data} JSON 에서 {@code dispatch_enabled} 키를 안전하게 읽어온다.
     *
     * @param json {@code common_codes.extra_data} 원본 (null/blank 허용)
     * @return 명시적 true/false, 키가 없거나 파싱 실패면 {@code null}
     */
    private Boolean readDispatchEnabledFromExtra(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        Map<String, Object> extras = parseExtraData(json);
        Object value = extras.get(SmsDispatchFlagKeys.EXTRA_KEY_DISPATCH_ENABLED);
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof String str) {
            String normalized = str.trim().toLowerCase();
            if ("true".equals(normalized)) {
                return Boolean.TRUE;
            }
            if ("false".equals(normalized)) {
                return Boolean.FALSE;
            }
        }
        return null;
    }

    private Map<String, Object> parseExtraData(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        } catch (IOException e) {
            log.debug("SMS_TEMPLATE extra_data 파싱 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String stringValue(Object obj) {
        return obj == null ? null : obj.toString();
    }

    @SuppressWarnings("unchecked")
    private List<String> listValue(Object obj) {
        if (obj instanceof List<?> list) {
            List<String> out = new ArrayList<>(list.size());
            for (Object o : list) {
                if (o != null) {
                    out.add(o.toString());
                }
            }
            return out;
        }
        return Collections.emptyList();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
