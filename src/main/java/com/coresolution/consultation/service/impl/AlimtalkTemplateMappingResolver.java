package com.coresolution.consultation.service.impl;

import java.util.Optional;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공통코드(ALIMTALK_BIZ_TEMPLATE_CODE) → 실 Solapi {@code templateId} 매핑 lookup 컴포넌트.
 *
 * <p>운영 호출부 {@code NotificationServiceImpl#resolveAlimTalkBizTemplateCode} 와 동일한
 * 우선순위 — 테넌트 row 우선, 없으면 코어({@code tenant_id IS NULL}) row 폴백. 매칭 row 가
 * 없거나 {@code codeLabel} 이 비어 있으면 {@code null}.
 *
 * <p>본 컴포넌트는 어드민 발송 도구 두 곳({@code AdminTestNotificationServiceImpl} 단일,
 * {@code AdminManualNotificationServiceImpl} 다중) 에서 공통으로 호출하며, 운영 호출부에는
 * 영향이 없다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlimtalkTemplateMappingResolver {

    /** 매핑이 저장되는 공통코드 그룹. {@code codeValue} → {@code codeLabel} (실 templateId). */
    public static final String COMMON_CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE = "ALIMTALK_BIZ_TEMPLATE_CODE";

    private final CommonCodeRepository commonCodeRepository;

    /**
     * 공통코드 매핑에서 실 Solapi {@code templateId} 를 반환한다.
     *
     * @param tenantId  테넌트 ID(null/blank 허용 — 코어 폴백만 시도)
     * @param codeValue 공통코드 codeValue (예: {@code PAYMENT_COMPLETED})
     * @return 실 Solapi {@code templateId} 또는 매핑 없음 시 {@code null}
     */
    public String resolveSolapiTemplateId(String tenantId, String codeValue) {
        if (codeValue == null || codeValue.isBlank()) {
            return null;
        }
        try {
            if (tenantId != null && !tenantId.isBlank()) {
                Optional<CommonCode> tenantRow = commonCodeRepository.findTenantCodeByGroupAndValue(
                    tenantId, COMMON_CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE, codeValue);
                if (tenantRow.isPresent() && tenantRow.get().getCodeLabel() != null
                        && !tenantRow.get().getCodeLabel().isBlank()) {
                    return tenantRow.get().getCodeLabel().trim();
                }
            }
            Optional<CommonCode> coreRow = commonCodeRepository.findCoreCodeByGroupAndValue(
                COMMON_CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE, codeValue);
            if (coreRow.isPresent() && coreRow.get().getCodeLabel() != null
                    && !coreRow.get().getCodeLabel().isBlank()) {
                return coreRow.get().getCodeLabel().trim();
            }
        } catch (Exception e) {
            log.debug("ALIMTALK_BIZ_TEMPLATE_CODE 매핑 조회 실패 (codeValue={}): {}",
                codeValue, e.getMessage());
        }
        return null;
    }
}
