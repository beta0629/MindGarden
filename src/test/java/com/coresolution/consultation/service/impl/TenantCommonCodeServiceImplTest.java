package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ExpenseCommonCodeSsotConstants;
import com.coresolution.consultation.constant.TenantCommonCodeAutoValueConstants;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.RecurringExpense;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.RecurringExpenseRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link TenantCommonCodeServiceImpl} — 요청 tenantId 기준 조회·코어 ID 안내·패키지 코드 발급·삭제 정합.
 *
 * @author CoreSolution
 * @since 2026-04-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantCommonCodeService 구현")
class TenantCommonCodeServiceImplTest {

    private static final String TENANT = "tenant-scoped-test";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private CodeGroupMetadataRepository codeGroupMetadataRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private RecurringExpenseRepository recurringExpenseRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TenantCommonCodeServiceImpl tenantCommonCodeService;

    @Test
    @DisplayName("updateTenantCode: 경로의 tenantId로 findByTenantIdAndId 호출")
    void updateTenantCode_usesRequestTenantId() {
        CommonCode row = baseRow(10L, TENANT);
        CommonCodeUpdateRequest request = CommonCodeUpdateRequest.builder().codeLabel("x").build();
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 10L)).thenReturn(Optional.of(row));
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));

        tenantCommonCodeService.updateTenantCode(TENANT, 10L, request);

        verify(commonCodeRepository).findByTenantIdAndId(eq(TENANT), eq(10L));
    }

    @Test
    @DisplayName("updateTenantCode: 코어 PK만 있으면 플랫폼 API 안내 예외")
    void updateTenantCode_coreOnlyId_throwsPlatformMessage() {
        CommonCodeUpdateRequest request = CommonCodeUpdateRequest.builder().codeLabel("x").build();
        CommonCode coreRow = baseRow(99L, null);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 99L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(99L)).thenReturn(Optional.of(coreRow));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.updateTenantCode(TENANT, 99L, request));

        assertTrue(ex.getMessage().contains("시스템 공통코드"));
    }

    @Test
    @DisplayName("validateTenantCodeOwnership: 코어 PK만 있으면 false")
    void validateTenantCodeOwnership_coreOnly_false() {
        CommonCode coreRow = baseRow(88L, null);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 88L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(88L)).thenReturn(Optional.of(coreRow));

        assertFalse(tenantCommonCodeService.validateTenantCodeOwnership(TENANT, 88L));
    }

    @Test
    @DisplayName("validateTenantCodeOwnership: 테넌트 행이면 true")
    void validateTenantCodeOwnership_tenantRow_true() {
        CommonCode row = baseRow(12L, TENANT);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 12L)).thenReturn(Optional.of(row));

        assertTrue(tenantCommonCodeService.validateTenantCodeOwnership(TENANT, 12L));
    }

    @Test
    @DisplayName("validateTenantCodeOwnership: 없는 PK면 예외")
    void validateTenantCodeOwnership_missing_throws() {
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 77L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(77L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.validateTenantCodeOwnership(TENANT, 77L));
        assertEquals("존재하지 않는 코드입니다: 77", ex.getMessage());
    }

    @Test
    @DisplayName("createTenantCode: CONSULTATION_PACKAGE 빈 codeValue → max 시퀀스 다음 값 자동 발급")
    void createTenantCode_packageBlankCode_autoGeneratesFromMaxSequence() {
        stubTenantGroupMetadata(ConsultationPackageCodeConstants.CODE_GROUP);
        when(commonCodeRepository.findTenantCodesByGroup(TENANT, ConsultationPackageCodeConstants.CODE_GROUP))
            .thenReturn(List.of(
                packageRow("PACKAGE_001"),
                packageRow("SINGLE_80000"),
                packageRow("PACKAGE_003")));
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                eq(TENANT), eq(ConsultationPackageCodeConstants.CODE_GROUP), eq("PACKAGE_004")))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> {
            CommonCode saved = inv.getArgument(0);
            saved.setId(100L);
            return saved;
        });

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup(ConsultationPackageCodeConstants.CODE_GROUP)
            .codeValue("  ")
            .codeLabel("신규")
            .koreanName("신규")
            .build();

        var response = tenantCommonCodeService.createTenantCode(TENANT, request);

        assertEquals("PACKAGE_004", response.getCodeValue());
        ArgumentCaptor<CommonCode> captor = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(captor.capture());
        assertEquals("PACKAGE_004", captor.getValue().getCodeValue());
        assertEquals(TENANT, captor.getValue().getTenantId());
    }

    @Test
    @DisplayName("createTenantCode: 수동 codeValue trim 후 중복이면 예외")
    void createTenantCode_manualDuplicate_throws() {
        stubTenantGroupMetadata(ConsultationPackageCodeConstants.CODE_GROUP);
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                TENANT, ConsultationPackageCodeConstants.CODE_GROUP, "BASIC"))
            .thenReturn(Optional.of(packageRow("BASIC")));

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup(ConsultationPackageCodeConstants.CODE_GROUP)
            .codeValue("  BASIC  ")
            .codeLabel("기본")
            .koreanName("기본")
            .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.createTenantCode(TENANT, request));

        assertTrue(ex.getMessage().contains("BASIC"));
        verify(commonCodeRepository, never()).save(any(CommonCode.class));
    }

    @Test
    @DisplayName("createTenantCode: 다른 그룹 빈 codeValue → 필수 예외 (자동발급 부작용 없음)")
    void createTenantCode_otherGroupBlank_requiresCodeValue() {
        stubTenantGroupMetadata("ASSESSMENT_TYPE");

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup("ASSESSMENT_TYPE")
            .codeValue(null)
            .codeLabel("평가")
            .koreanName("평가")
            .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.createTenantCode(TENANT, request));

        assertEquals(TenantCommonCodeAutoValueConstants.CODE_VALUE_REQUIRED_MESSAGE, ex.getMessage());
        verify(commonCodeRepository, never()).findTenantCodesByGroup(any(), any());
    }

    @Test
    @DisplayName("createTenantCode: EXPENSE_CATEGORY 빈 codeValue → EXP_CAT 시퀀스 자동 발급")
    void createTenantCode_expenseCategoryBlank_autoGenerates() {
        stubTenantGroupMetadata(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY))
            .thenReturn(List.of());
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                eq(TENANT), eq(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY), eq("EXP_CAT_001")))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> {
            CommonCode saved = inv.getArgument(0);
            saved.setId(201L);
            return saved;
        });

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY)
            .codeValue(null)
            .codeLabel("신규지출")
            .koreanName("신규지출")
            .build();

        var response = tenantCommonCodeService.createTenantCode(TENANT, request);

        assertEquals("EXP_CAT_001", response.getCodeValue());
    }

    @Test
    @DisplayName("createTenantCode: EXPENSE_SUBCATEGORY 부모 필수 + EXP_SUB 자동 발급")
    void createTenantCode_expenseSubcategory_requiresParentAndAutoCode() {
        stubTenantGroupMetadata(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY);
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY))
            .thenReturn(List.of());
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                eq(TENANT), eq(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY), eq("EXP_SUB_001")))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                eq(TENANT), eq(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY), eq("UTILITY")))
            .thenReturn(Optional.of(CommonCode.builder()
                .codeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY)
                .codeValue("UTILITY")
                .codeLabel("관리비")
                .build()));
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> {
            CommonCode saved = inv.getArgument(0);
            saved.setId(202L);
            return saved;
        });

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY)
            .codeValue("  ")
            .codeLabel("전기")
            .koreanName("전기")
            .parentCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY)
            .parentCodeValue("UTILITY")
            .build();

        var response = tenantCommonCodeService.createTenantCode(TENANT, request);

        assertEquals("EXP_SUB_001", response.getCodeValue());
        ArgumentCaptor<CommonCode> captor = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(captor.capture());
        assertEquals("UTILITY", captor.getValue().getParentCodeValue());
        assertEquals(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY, captor.getValue().getParentCodeGroup());
    }

    @Test
    @DisplayName("createTenantCode: EXPENSE_SUBCATEGORY orphan 부모면 fail-closed")
    void createTenantCode_expenseSubcategory_orphanParent_rejected() {
        stubTenantGroupMetadata(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY);
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY))
            .thenReturn(List.of());
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                eq(TENANT), eq(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY), eq("EXP_SUB_001")))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                eq(TENANT), eq(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY), eq("상담료")))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findCoreCodeByGroupAndValue(
                eq(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY), eq("상담료")))
            .thenReturn(Optional.empty());

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY)
            .codeValue("")
            .codeLabel("환불")
            .koreanName("환불")
            .parentCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY)
            .parentCodeValue("상담료")
            .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.createTenantCode(TENANT, request));

        assertTrue(ex.getMessage().contains("상위 카테고리"));
        verify(commonCodeRepository, never()).save(any(CommonCode.class));
    }

    @Test
    @DisplayName("deleteTenantCode: 장부 사용 중이면 건수 포함 사유 예외, save never")
    void deleteTenantCode_inUseByLedger_throwsReason() {
        CommonCode row = baseRow(55L, TENANT);
        row.setCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        row.setCodeValue("UTILITY");
        when(commonCodeRepository.findByTenantIdAndIdIgnoringDeleted(TENANT, 55L)).thenReturn(Optional.of(row));
        when(commonCodeRepository.countByTenantIdAndCodeGroupAndParentAndIsDeletedFalse(
                TENANT,
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY,
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY,
                "UTILITY"))
            .thenReturn(0L);
        when(financialTransactionRepository.countByTenantIdAndCategoryAndIsDeletedFalse(TENANT, "UTILITY"))
            .thenReturn(3L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.deleteTenantCode(TENANT, 55L));

        assertEquals(String.format(ExpenseCommonCodeSsotConstants.MSG_CODE_IN_USE_BY_LEDGER_FMT, 3L),
            ex.getMessage());
        verify(commonCodeRepository, never()).save(any(CommonCode.class));
        verify(recurringExpenseRepository, never()).save(any(RecurringExpense.class));
        verify(financialTransactionRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("deleteTenantCode: 미사용 EXPENSE 행이면 soft-delete + isActive=false")
    void deleteTenantCode_unusedExpense_succeeds() {
        CommonCode row = baseRow(56L, TENANT);
        row.setCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        row.setCodeValue("CUSTOM_X");
        row.setIsActive(true);
        when(commonCodeRepository.findByTenantIdAndIdIgnoringDeleted(TENANT, 56L)).thenReturn(Optional.of(row));
        when(commonCodeRepository.countByTenantIdAndCodeGroupAndParentAndIsDeletedFalse(
                TENANT,
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY,
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY,
                "CUSTOM_X"))
            .thenReturn(0L);
        when(financialTransactionRepository.countByTenantIdAndCategoryAndIsDeletedFalse(TENANT, "CUSTOM_X"))
            .thenReturn(0L);
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));
        when(recurringExpenseRepository.findByTenantIdAndCategoryOrSubcategoryOrExpenseTypeAndIsDeletedFalse(
                TENANT, "CUSTOM_X"))
            .thenReturn(List.of());

        tenantCommonCodeService.deleteTenantCode(TENANT, 56L);

        ArgumentCaptor<CommonCode> captor = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(captor.capture());
        assertTrue(Boolean.TRUE.equals(captor.getValue().getIsDeleted()));
        assertFalse(Boolean.TRUE.equals(captor.getValue().getIsActive()));
        verify(financialTransactionRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("createTenantCode: 동일 한글명(표시명) 미소거 행이 있으면 거부")
    void createTenantCode_duplicateDisplayName_rejected() {
        stubTenantGroupMetadata(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        when(commonCodeRepository.findTenantCodeByGroupAndValue(
                eq(TENANT), eq(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY), eq("typoA")))
            .thenReturn(Optional.empty());
        CommonCode existing = baseRow(100L, TENANT);
        existing.setCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        existing.setCodeValue("canonA");
        existing.setKoreanName("인터넷");
        when(commonCodeRepository.findUndeletedByTenantGroupAndDisplayName(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY, "인터넷"))
            .thenReturn(List.of(existing));

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY)
            .codeValue("typoA")
            .codeLabel("인터넷")
            .koreanName("인터넷")
            .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> tenantCommonCodeService.createTenantCode(TENANT, request));

        assertEquals(String.format(ExpenseCommonCodeSsotConstants.MSG_DUPLICATE_DISPLAY_NAME_FMT, "인터넷"),
            ex.getMessage());
        verify(commonCodeRepository, never()).save(any(CommonCode.class));
    }

    @Test
    @DisplayName("getTenantCodesByGroup: findTenantCodesByGroup 결과를 그대로 노출(repo isDeleted 계약)")
    void getTenantCodesByGroup_delegatesToRepositoryContract() {
        CommonCode listed = baseRow(634L, TENANT);
        listed.setCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        listed.setCodeValue("typoA");
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY))
            .thenReturn(List.of(listed));

        var responses = tenantCommonCodeService.getTenantCodesByGroup(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);

        assertEquals(1, responses.size());
        assertEquals(634L, responses.get(0).getId());
        assertEquals("typoA", responses.get(0).getCodeValue());
        verify(commonCodeRepository).findTenantCodesByGroup(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
    }

    @Test
    @DisplayName("deleteTenantCode: matching codeValue recurring만 soft-delete, FT never, 다른 코드 미터치")
    void deleteTenantCode_cascadesMatchingRecurringOnly() {
        CommonCode row = baseRow(634L, TENANT);
        row.setCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        row.setCodeValue("typoA");
        row.setIsActive(true);
        when(commonCodeRepository.findByTenantIdAndIdIgnoringDeleted(TENANT, 634L)).thenReturn(Optional.of(row));
        when(commonCodeRepository.countByTenantIdAndCodeGroupAndParentAndIsDeletedFalse(
                TENANT,
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_SUBCATEGORY,
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY,
                "typoA"))
            .thenReturn(0L);
        when(financialTransactionRepository.countByTenantIdAndCategoryAndIsDeletedFalse(TENANT, "typoA"))
            .thenReturn(0L);
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));

        RecurringExpense matching = RecurringExpense.builder()
            .expenseName("오타 카테고리 규칙")
            .expenseType("ETC")
            .category("typoA")
            .amount(BigDecimal.TEN)
            .recurrenceType("MONTHLY")
            .recurrenceDay(1)
            .startDate(java.time.LocalDate.of(2026, 1, 1))
            .build();
        matching.setId(901L);
        matching.setTenantId(TENANT);
        matching.setIsDeleted(false);

        when(recurringExpenseRepository.findByTenantIdAndCategoryOrSubcategoryOrExpenseTypeAndIsDeletedFalse(
                TENANT, "typoA"))
            .thenReturn(List.of(matching));
        when(recurringExpenseRepository.save(any(RecurringExpense.class))).thenAnswer(inv -> inv.getArgument(0));

        tenantCommonCodeService.deleteTenantCode(TENANT, 634L);

        ArgumentCaptor<RecurringExpense> reCaptor = ArgumentCaptor.forClass(RecurringExpense.class);
        verify(recurringExpenseRepository).save(reCaptor.capture());
        assertTrue(Boolean.TRUE.equals(reCaptor.getValue().getIsDeleted()));
        assertEquals("typoA", reCaptor.getValue().getCategory());
        verify(recurringExpenseRepository, times(1)).save(any(RecurringExpense.class));
        verify(financialTransactionRepository, never()).deleteById(any());
        verify(recurringExpenseRepository).findByTenantIdAndCategoryOrSubcategoryOrExpenseTypeAndIsDeletedFalse(
                TENANT, "typoA");
        verify(recurringExpenseRepository, never())
            .findByTenantIdAndCategoryOrSubcategoryOrExpenseTypeAndIsDeletedFalse(eq(TENANT), eq("canonA"));
    }

    @Test
    @DisplayName("deleteTenantCode: 이미 isDeleted=true 이면 멱등 성공 + matching recurring 정리")
    void deleteTenantCode_alreadyDeleted_idempotentSuccess() {
        CommonCode row = baseRow(634L, TENANT);
        row.setCodeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);
        row.setCodeValue("typoA");
        row.setIsDeleted(true);
        row.setIsActive(true);
        when(commonCodeRepository.findByTenantIdAndIdIgnoringDeleted(TENANT, 634L)).thenReturn(Optional.of(row));

        RecurringExpense leftover = RecurringExpense.builder()
            .expenseName("잔존 규칙")
            .expenseType("ETC")
            .category("typoA")
            .amount(BigDecimal.ONE)
            .recurrenceType("MONTHLY")
            .recurrenceDay(1)
            .startDate(java.time.LocalDate.of(2026, 1, 1))
            .build();
        leftover.setId(902L);
        leftover.setTenantId(TENANT);
        leftover.setIsDeleted(false);
        when(recurringExpenseRepository.findByTenantIdAndCategoryOrSubcategoryOrExpenseTypeAndIsDeletedFalse(
                TENANT, "typoA"))
            .thenReturn(List.of(leftover));
        when(recurringExpenseRepository.save(any(RecurringExpense.class))).thenAnswer(inv -> inv.getArgument(0));

        tenantCommonCodeService.deleteTenantCode(TENANT, 634L);

        verify(commonCodeRepository, never()).save(any(CommonCode.class));
        verify(financialTransactionRepository, never()).countByTenantIdAndCategoryAndIsDeletedFalse(any(), any());
        ArgumentCaptor<RecurringExpense> reCaptor = ArgumentCaptor.forClass(RecurringExpense.class);
        verify(recurringExpenseRepository).save(reCaptor.capture());
        assertTrue(Boolean.TRUE.equals(reCaptor.getValue().getIsDeleted()));
    }

    private void stubTenantGroupMetadata(String groupName) {
        CodeGroupMetadata metadata = new CodeGroupMetadata();
        metadata.setGroupName(groupName);
        metadata.setCodeType("TENANT");
        when(codeGroupMetadataRepository.findByGroupName(groupName)).thenReturn(Optional.of(metadata));
    }

    private static CommonCode packageRow(String codeValue) {
        CommonCode c = CommonCode.builder()
            .codeGroup(ConsultationPackageCodeConstants.CODE_GROUP)
            .codeValue(codeValue)
            .codeLabel(codeValue)
            .koreanName(codeValue)
            .build();
        c.setTenantId(TENANT);
        return c;
    }

    private static CommonCode baseRow(Long id, String tenantId) {
        CommonCode c = CommonCode.builder()
            .codeGroup("G")
            .codeValue("V")
            .codeLabel("L")
            .koreanName("K")
            .build();
        c.setId(id);
        c.setTenantId(tenantId);
        return c;
    }
}
