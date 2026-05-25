package com.coresolution.consultation.service.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.SmsTemplateAdminItem;
import com.coresolution.consultation.dto.SmsTemplatePreviewResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.util.SmsTemplateRenderer;
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

    private final CommonCodeRepository commonCodeRepository;
    private final ObjectMapper objectMapper;

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

    private SmsTemplateAdminItem toAdminItem(CommonCode core, CommonCode tenantOverride) {
        Map<String, Object> extras = parseExtraData(core.getExtraData());
        String category = stringValue(extras.get(EXTRA_KEY_CATEGORY));
        List<String> variables = listValue(extras.get(EXTRA_KEY_VARIABLES));

        boolean hasOverride = tenantOverride != null
                && Boolean.TRUE.equals(tenantOverride.getIsActive())
                && !Boolean.TRUE.equals(tenantOverride.getIsDeleted())
                && trimToNull(tenantOverride.getCodeLabel()) != null;

        String tenantContent = hasOverride ? tenantOverride.getCodeLabel() : null;

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
                .build();
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
