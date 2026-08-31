package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ExpenseCommonCodeSsotConstants;
import com.coresolution.consultation.constant.TenantCommonCodeAutoValueConstants;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.RecurringExpense;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.RecurringExpenseRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.TenantCommonCodeService;
import com.coresolution.consultation.util.CommonCodeSubcategoryParents;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 테넌트 공통코드 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantCommonCodeServiceImpl implements TenantCommonCodeService {

    /**
     * 테넌트 공통코드 API로 시스템(코어) 코드를 수정하려 할 때 안내 메시지
     */
    private static final String MSG_SYSTEM_CODE_USE_PLATFORM_API =
        "시스템 공통코드는 운영(플랫폼) 공통코드 API에서만 수정할 수 있습니다.";

    private final CommonCodeRepository commonCodeRepository;
    private final CodeGroupMetadataRepository codeGroupMetadataRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ObjectMapper objectMapper;

    @Override
    public List<CodeGroupMetadata> getTenantCodeGroups(String tenantId) {
        log.debug("테넌트 공통코드 그룹 조회: tenantId={}", tenantId);
        return codeGroupMetadataRepository.findTenantCodeGroups();
    }

    @Override
    @Transactional
    public List<CommonCodeResponse> getTenantCodesByGroup(String tenantId, String codeGroup) {
        log.debug("테넌트 공통코드 조회: tenantId={}, codeGroup={}", tenantId, codeGroup);
        requireNonBlankTenantId(tenantId);

        // 이미 soft-deleted 된 코드에 묶인 recurring leftover 정리 (쓰기 SSOT; 목록은 미소거만)
        reconcileRecurringForDeletedCodes(tenantId, codeGroup);

        List<CommonCode> codes = commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);

        return codes.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommonCodeResponse createTenantCode(String tenantId, CommonCodeCreateRequest request) {
        log.info("테넌트 공통코드 생성: tenantId={}, codeGroup={}, codeValue={}",
            tenantId, request.getCodeGroup(), request.getCodeValue());

        requireNonBlankTenantId(tenantId);

        validateTenantCodeGroup(request.getCodeGroup());

        String codeValue = resolveCodeValueForCreate(tenantId, request.getCodeGroup(), request.getCodeValue());

        assertCodeValueUnique(tenantId, request.getCodeGroup(), codeValue);

        String resolvedKoreanName = request.getKoreanName() != null
                ? request.getKoreanName()
                : request.getCodeLabel();
        assertDisplayNameUnique(
                tenantId,
                request.getCodeGroup(),
                resolvedKoreanName,
                request.getCodeLabel(),
                null);

        String parentGroup = request.getParentCodeGroup();
        String parentValue = request.getParentCodeValue();
        if (CommonCodeSubcategoryParents.isSubcategoryGroup(request.getCodeGroup())) {
            parentGroup = CommonCodeSubcategoryParents.expectedParentGroup(request.getCodeGroup());
            CommonCodeSubcategoryParents.requireValidParent(
                request.getCodeGroup(),
                parentGroup,
                parentValue,
                (pg, pv) -> parentCategoryExists(tenantId, pg, pv));
        }

        CommonCode code = CommonCode.builder()
            .codeGroup(request.getCodeGroup())
            .codeValue(codeValue)
            .codeLabel(request.getCodeLabel())
            .koreanName(resolvedKoreanName)
            .codeDescription(request.getCodeDescription())
            .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
            .parentCodeGroup(parentGroup)
            .parentCodeValue(parentValue)
            .extraData(request.getExtraData())
            .icon(request.getIcon())
            .colorCode(request.getColorCode())
            .build();

        code.setTenantId(tenantId);

        try {
            CommonCode savedCode = commonCodeRepository.save(code);
            log.info("테넌트 공통코드 생성 완료: id={}, codeValue={}", savedCode.getId(), savedCode.getCodeValue());
            return toResponse(savedCode);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                String.format(
                    TenantCommonCodeAutoValueConstants.DUPLICATE_CODE_MESSAGE_FMT,
                    request.getCodeGroup(),
                    codeValue),
                ex);
        }
    }

    @Override
    @Transactional
    public CommonCodeResponse updateTenantCode(String tenantId, Long codeId, CommonCodeUpdateRequest request) {
        log.info("테넌트 공통코드 수정: tenantId={}, codeId={}", tenantId, codeId);
        
        CommonCode code = requireTenantCodeRowForMutation(tenantId, codeId);

        String nextLabel = request.getCodeLabel() != null ? request.getCodeLabel() : code.getCodeLabel();
        String nextKorean = request.getKoreanName() != null ? request.getKoreanName() : code.getKoreanName();
        if (request.getCodeLabel() != null || request.getKoreanName() != null) {
            assertDisplayNameUnique(tenantId, code.getCodeGroup(), nextKorean, nextLabel, code.getId());
        }

        // 수정
        if (request.getCodeLabel() != null) {
            code.setCodeLabel(request.getCodeLabel());
        }
        if (request.getKoreanName() != null) {
            code.setKoreanName(request.getKoreanName());
        }
        if (request.getCodeDescription() != null) {
            code.setCodeDescription(request.getCodeDescription());
        }
        if (request.getSortOrder() != null) {
            code.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            code.setIsActive(request.getIsActive());
        }
        if (request.getExtraData() != null) {
            code.setExtraData(request.getExtraData());
        }
        if (request.getIcon() != null) {
            code.setIcon(request.getIcon());
        }
        if (request.getColorCode() != null) {
            code.setColorCode(request.getColorCode());
        }
        if (request.getParentCodeGroup() != null) {
            code.setParentCodeGroup(trimToNull(request.getParentCodeGroup()));
        }
        if (request.getParentCodeValue() != null) {
            code.setParentCodeValue(trimToNull(request.getParentCodeValue()));
        }
        if (CommonCodeSubcategoryParents.isSubcategoryGroup(code.getCodeGroup())) {
            code.setParentCodeGroup(CommonCodeSubcategoryParents.expectedParentGroup(code.getCodeGroup()));
            CommonCodeSubcategoryParents.requireValidParent(
                code.getCodeGroup(),
                code.getParentCodeGroup(),
                code.getParentCodeValue(),
                (pg, pv) -> parentCategoryExists(tenantId, pg, pv));
        }

        CommonCode updatedCode = commonCodeRepository.save(code);
        log.info("테넌트 공통코드 수정 완료: id={}", updatedCode.getId());
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public void deleteTenantCode(String tenantId, Long codeId) {
        log.info("테넌트 공통코드 삭제: tenantId={}, codeId={}", tenantId, codeId);
        requireNonBlankTenantId(tenantId);

        CommonCode code = commonCodeRepository.findByTenantIdAndIdIgnoringDeleted(tenantId, codeId)
            .orElseThrow(() -> resolveMissingTenantScopedCode(codeId));

        if (Boolean.TRUE.equals(code.getIsDeleted())) {
            softDeleteMatchingRecurringExpenses(tenantId, code.getCodeValue());
            log.info("테넌트 공통코드 삭제 멱등 완료(이미 삭제됨): id={}", codeId);
            return;
        }

        assertExpenseIncomeCodeDeletable(tenantId, code);

        code.delete();
        code.setIsActive(false);
        commonCodeRepository.save(code);

        softDeleteMatchingRecurringExpenses(tenantId, code.getCodeValue());

        log.info("테넌트 공통코드 삭제 완료: id={}", codeId);
    }

    @Override
    @Transactional
    public CommonCodeResponse toggleTenantCodeActive(String tenantId, Long codeId, boolean isActive) {
        log.info("테넌트 공통코드 활성화 토글: tenantId={}, codeId={}, isActive={}", tenantId, codeId, isActive);
        
        CommonCode code = requireTenantCodeRowForMutation(tenantId, codeId);
        
        code.setIsActive(isActive);
        CommonCode updatedCode = commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 활성화 토글 완료: id={}, isActive={}", codeId, isActive);
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public CommonCodeResponse updateTenantCodeOrder(String tenantId, Long codeId, int newOrder) {
        log.info("테넌트 공통코드 정렬 순서 변경: tenantId={}, codeId={}, newOrder={}", tenantId, codeId, newOrder);
        
        CommonCode code = requireTenantCodeRowForMutation(tenantId, codeId);
        
        code.setSortOrder(newOrder);
        CommonCode updatedCode = commonCodeRepository.save(code);
        
        log.info("테넌트 공통코드 정렬 순서 변경 완료: id={}, newOrder={}", codeId, newOrder);
        
        return toResponse(updatedCode);
    }

    @Override
    @Transactional
    public CommonCodeResponse createConsultationPackage(
        String tenantId,
        String packageName,
        Integer price,
        Integer duration,
        Integer sessions,
        String description
    ) {
        log.info("상담 패키지 생성: tenantId={}, packageName={}, price={}", tenantId, packageName, price);
        
        // extra_data JSON 생성
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("price", price);
        extraData.put("duration", duration);
        extraData.put("sessions", sessions);
        
        String extraDataJson;
        try {
            extraDataJson = objectMapper.writeValueAsString(extraData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 실패", e);
        }
        
        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup(ConsultationPackageCodeConstants.CODE_GROUP)
            .codeValue(null)
            .codeLabel(packageName)
            .koreanName(packageName)
            .codeDescription(description)
            .extraData(extraDataJson)
            .isActive(true)
            .build();
        
        return createTenantCode(tenantId, request);
    }

    @Override
    @Transactional
    public CommonCodeResponse createAssessmentType(
        String tenantId,
        String assessmentName,
        Integer price,
        Integer duration,
        String description
    ) {
        log.info("평가 유형 생성: tenantId={}, assessmentName={}, price={}", tenantId, assessmentName, price);
        
        // extra_data JSON 생성
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("price", price);
        extraData.put("duration", duration);
        
        String extraDataJson;
        try {
            extraDataJson = objectMapper.writeValueAsString(extraData);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 변환 실패", e);
        }
        
        // 코드 값 생성 (예: ASSESS_001)
        String codeValue = generateCodeValue(tenantId, "ASSESSMENT_TYPE", "ASSESS");
        
        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup("ASSESSMENT_TYPE")
            .codeValue(codeValue)
            .codeLabel(assessmentName)
            .koreanName(assessmentName)
            .codeDescription(description)
            .extraData(extraDataJson)
            .isActive(true)
            .build();
        
        return createTenantCode(tenantId, request);
    }

    @Override
    public boolean validateTenantCodeOwnership(String tenantId, Long codeId) {
        requireNonBlankTenantId(tenantId);
        return commonCodeRepository.findByTenantIdAndId(tenantId, codeId)
            .map(code -> {
                if (code.isCoreCode()) {
                    log.warn("시스템 공통코드 소유 검증 실패(코어 행): codeId={}", codeId);
                    return false;
                }
                if (!tenantId.equals(code.getTenantId())) {
                    log.warn("다른 테넌트의 코드 소유 검증 실패: codeId={}, requestTenantId={}, ownerTenantId={}",
                        codeId, tenantId, code.getTenantId());
                    return false;
                }
                return true;
            })
            .orElseGet(() -> {
                if (commonCodeRepository.findActiveCoreCodeById(codeId).isPresent()) {
                    log.warn("테넌트 API로 시스템 공통코드 소유 검증 시도: codeId={}, tenantId={}", codeId, tenantId);
                    return false;
                }
                throw new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId);
            });
    }

    // ==================== Private Methods ====================

    private void requireNonBlankTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("테넌트 ID가 필요합니다.");
        }
    }

    /**
     * 요청 tenantId와 일치하는 테넌트 공통코드 행만 조회한다. 코어 PK만 존재하면 플랫폼 API 안내 예외.
     */
    private CommonCode requireTenantCodeRowForMutation(String tenantId, Long codeId) {
        requireNonBlankTenantId(tenantId);
        return commonCodeRepository.findByTenantIdAndId(tenantId, codeId)
            .orElseThrow(() -> resolveMissingTenantScopedCode(codeId));
    }

    private IllegalArgumentException resolveMissingTenantScopedCode(Long codeId) {
        if (commonCodeRepository.findActiveCoreCodeById(codeId).isPresent()) {
            return new IllegalArgumentException(MSG_SYSTEM_CODE_USE_PLATFORM_API);
        }
        return new IllegalArgumentException("존재하지 않는 코드입니다: " + codeId);
    }

    /**
     * 코드 그룹이 테넌트 타입인지 검증
     */
    private void validateTenantCodeGroup(String codeGroup) {
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드 그룹입니다: " + codeGroup));
        
        if (!"TENANT".equals(metadata.getCodeType())) {
            throw new IllegalArgumentException("테넌트 전용 코드 그룹이 아닙니다: " + codeGroup);
        }
    }

    /**
     * 코드 값 자동 생성
     */
    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * 상위 카테고리 코드가 tenant(또는 core 폴백)에 활성으로 존재하는지 확인.
     *
     * @param tenantId    테넌트 ID
     * @param parentGroup 상위 코드 그룹
     * @param parentValue 상위 코드값
     * @return 존재하면 true
     */
    private boolean parentCategoryExists(String tenantId, String parentGroup, String parentValue) {
        if (parentGroup == null || parentGroup.isBlank() || parentValue == null || parentValue.isBlank()) {
            return false;
        }
        if (tenantId != null && !tenantId.isBlank()
                && commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, parentGroup, parentValue).isPresent()) {
            return true;
        }
        return commonCodeRepository.findCoreCodeByGroupAndValue(parentGroup, parentValue).isPresent();
    }

    /**
     * 생성 요청의 codeValue를 결정한다.
     * <p>자동 발급 지원 그룹({@link TenantCommonCodeAutoValueConstants})이고 값이 비어 있으면
     * max 시퀀스 기반 자동 발급. 그 외 그룹은 값이 필수이다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param codeGroup 코드 그룹
     * @param requestedCodeValue 요청 코드 값(수동 또는 null/blank)
     * @return trim 된 수동 값 또는 자동 발급 값
     */
    private String resolveCodeValueForCreate(String tenantId, String codeGroup, String requestedCodeValue) {
        if (StringUtils.hasText(requestedCodeValue)) {
            return requestedCodeValue.trim();
        }
        String prefix = TenantCommonCodeAutoValueConstants.prefixForGroup(codeGroup);
        if (prefix != null) {
            return generateCodeValue(tenantId, codeGroup, prefix);
        }
        throw new IllegalArgumentException(TenantCommonCodeAutoValueConstants.CODE_VALUE_REQUIRED_MESSAGE);
    }

    private void assertCodeValueUnique(String tenantId, String codeGroup, String codeValue) {
        commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, codeGroup, codeValue)
            .ifPresent(code -> {
                throw new IllegalArgumentException(
                    String.format(
                        TenantCommonCodeAutoValueConstants.DUPLICATE_CODE_MESSAGE_FMT,
                        codeGroup,
                        codeValue));
            });
    }

    /**
     * 운영 SSOT 그룹에서 동일 표시명(trim koreanName, 비면 codeLabel) 미소거 행이 있으면 거부.
     * codeValue 중복 가드와 별도 — display-only alias 금지, 저장 코드 단일화.
     *
     * @param tenantId 테넌트 ID
     * @param codeGroup 코드 그룹
     * @param koreanName 한글명
     * @param codeLabel 라벨
     * @param excludeId 수정 시 자기 자신 제외 (생성 시 null)
     */
    private void assertDisplayNameUnique(
            String tenantId,
            String codeGroup,
            String koreanName,
            String codeLabel,
            Long excludeId) {
        if (!ExpenseCommonCodeSsotConstants.isTenantOperationalSsotGroup(codeGroup)) {
            return;
        }
        String displayName = ExpenseCommonCodeSsotConstants.resolveDisplayName(koreanName, codeLabel);
        if (!StringUtils.hasText(displayName)) {
            return;
        }
        List<CommonCode> existing = commonCodeRepository.findUndeletedByTenantGroupAndDisplayName(
                tenantId, codeGroup, displayName);
        boolean conflict = existing.stream()
                .anyMatch(row -> excludeId == null || !excludeId.equals(row.getId()));
        if (conflict) {
            throw new IllegalArgumentException(String.format(
                    ExpenseCommonCodeSsotConstants.MSG_DUPLICATE_DISPLAY_NAME_FMT, displayName));
        }
    }

    /**
     * EXPENSE_/INCOME_ 삭제 전: 하위 참조·장부 사용 여부를 검사한다.
     * 미사용이면 통과. 사용 중이면 실제 사유 메시지.
     *
     * @param tenantId 테넌트 ID
     * @param code 삭제 대상 행
     */
    private void assertExpenseIncomeCodeDeletable(String tenantId, CommonCode code) {
        String group = code.getCodeGroup();
        if (!ExpenseCommonCodeSsotConstants.isTenantOperationalSsotGroup(group)) {
            return;
        }
        String codeValue = code.getCodeValue();
        if (ExpenseCommonCodeSsotConstants.LEDGER_CATEGORY_GROUPS.contains(group)) {
            String childGroup = ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY.equals(group)
                    ? ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY
                    : ExpenseCommonCodeSsotConstants.GROUP_INCOME_SUBCATEGORY;
            long childCount = commonCodeRepository.countByTenantIdAndCodeGroupAndParentAndIsDeletedFalse(
                    tenantId, childGroup, group, codeValue);
            if (childCount > 0) {
                throw new IllegalArgumentException(ExpenseCommonCodeSsotConstants.MSG_CODE_HAS_CHILD_SUBCATEGORIES);
            }
            long ledgerCount = financialTransactionRepository
                    .countByTenantIdAndCategoryAndIsDeletedFalse(tenantId, codeValue);
            if (ledgerCount > 0) {
                throw new IllegalArgumentException(String.format(
                        ExpenseCommonCodeSsotConstants.MSG_CODE_IN_USE_BY_LEDGER_FMT, ledgerCount));
            }
            return;
        }
        if (ExpenseCommonCodeSsotConstants.LEDGER_SUBCATEGORY_GROUPS.contains(group)) {
            long ledgerCount = financialTransactionRepository
                    .countByTenantIdAndSubcategoryAndIsDeletedFalse(tenantId, codeValue);
            if (ledgerCount > 0) {
                throw new IllegalArgumentException(String.format(
                        ExpenseCommonCodeSsotConstants.MSG_CODE_IN_USE_BY_LEDGER_FMT, ledgerCount));
            }
        }
    }

    /**
     * 삭제된 공통 codeValue 를 category/subcategory/expenseType 으로 쓰는 테넌트 반복지출만 soft-delete.
     * financial_transactions 는 절대 변경하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param codeValue 공통코드 값
     */
    private void softDeleteMatchingRecurringExpenses(String tenantId, String codeValue) {
        if (!StringUtils.hasText(codeValue)) {
            return;
        }
        List<RecurringExpense> matching = recurringExpenseRepository
                .findByTenantIdAndCategoryOrSubcategoryOrExpenseTypeAndIsDeletedFalse(tenantId, codeValue);
        if (matching.isEmpty()) {
            return;
        }
        for (RecurringExpense expense : matching) {
            expense.delete();
            recurringExpenseRepository.save(expense);
        }
        log.info("공통코드 삭제 cascade: tenantId={}, codeValue={}, recurringSoftDeleted={}",
                tenantId, codeValue, matching.size());
    }

    /**
     * 그룹 내 soft-deleted 테넌트 코드에 묶인 recurring leftover 를 정리한다.
     * 목록 응답에는 영향 없음(미소거 코드만 반환).
     *
     * @param tenantId 테넌트 ID
     * @param codeGroup 코드 그룹
     */
    private void reconcileRecurringForDeletedCodes(String tenantId, String codeGroup) {
        if (!StringUtils.hasText(codeGroup)) {
            return;
        }
        List<CommonCode> deletedCodes = commonCodeRepository.findDeletedTenantCodesByGroup(tenantId, codeGroup);
        for (CommonCode deleted : deletedCodes) {
            softDeleteMatchingRecurringExpenses(tenantId, deleted.getCodeValue());
        }
    }

    /**
     * 테넌트·그룹 스코프에서 prefix_NNN 형식의 max 시퀀스 + 1을 발급한다.
     * 선체크 충돌 시 시퀀스를 올려 재시도한다.
     *
     * @param tenantId 테넌트 ID
     * @param codeGroup 코드 그룹
     * @param prefix 코드 접두사 (예: PACKAGE)
     * @return 신규 codeValue
     */
    private String generateCodeValue(String tenantId, String codeGroup, String prefix) {
        List<CommonCode> existingCodes = commonCodeRepository.findTenantCodesByGroup(tenantId, codeGroup);
        String sequencePrefix = prefix + "_";
        int maxSeq = 0;
        for (CommonCode existing : existingCodes) {
            int seq = parseSequenceSuffix(existing.getCodeValue(), sequencePrefix);
            if (seq > maxSeq) {
                maxSeq = seq;
            }
        }

        for (int attempt = 0; attempt < TenantCommonCodeAutoValueConstants.GENERATION_MAX_ATTEMPTS; attempt++) {
            int nextSeq = maxSeq + 1 + attempt;
            String candidate = String.format(
                "%s_%0" + TenantCommonCodeAutoValueConstants.CODE_SEQ_WIDTH + "d",
                prefix,
                nextSeq);
            if (commonCodeRepository.findTenantCodeByGroupAndValue(tenantId, codeGroup, candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new IllegalStateException(TenantCommonCodeAutoValueConstants.AUTO_GENERATION_FAILED_MESSAGE);
    }

    private static int parseSequenceSuffix(String codeValue, String sequencePrefix) {
        if (!StringUtils.hasText(codeValue) || !codeValue.startsWith(sequencePrefix)) {
            return 0;
        }
        String suffix = codeValue.substring(sequencePrefix.length());
        if (!suffix.matches("\\d+")) {
            return 0;
        }
        try {
            return Integer.parseInt(suffix);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    /**
     * Entity -> Response DTO 변환
     */
    private CommonCodeResponse toResponse(CommonCode code) {
        return CommonCodeResponse.builder()
            .id(code.getId())
            .tenantId(code.getTenantId())
            .codeGroup(code.getCodeGroup())
            .codeValue(code.getCodeValue())
            .codeLabel(code.getCodeLabel())
            .koreanName(code.getKoreanName())
            .codeDescription(code.getCodeDescription())
            .sortOrder(code.getSortOrder())
            .isActive(code.getIsActive())
            .parentCodeGroup(code.getParentCodeGroup())
            .parentCodeValue(code.getParentCodeValue())
            .extraData(code.getExtraData())
            .icon(code.getIcon())
            .colorCode(code.getColorCode())
            .createdAt(code.getCreatedAt())
            .updatedAt(code.getUpdatedAt())
            .build();
    }
}

