package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.ExpenseCommonCodeSsotConstants;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeDto;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link CommonCodeServiceImpl} 테넌트 PK 격리·코어 폴백 조회 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-03-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodeServiceImpl")
class CommonCodeServiceImplTest {

    private static final String TENANT = "tenant-pk-iso-test";

    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private CodeGroupMetadataRepository codeGroupMetadataRepository;
    @Mock
    private CommonCodePermissionService permissionService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommonCodeServiceImpl commonCodeService;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getCommonCodeById: 테넌트 행이 있으면 findByTenantIdAndId만 사용(코어 폴백 없음)")
    void getCommonCodeById_prefersTenantRow() {
        TenantContextHolder.setTenantId(TENANT);
        CommonCode row = baseCodeBuilder().build();
        row.setId(10L);
        row.setTenantId(TENANT);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 10L)).thenReturn(Optional.of(row));

        assertEquals(row, commonCodeService.getCommonCodeById(10L));

        verify(commonCodeRepository).findByTenantIdAndId(TENANT, 10L);
        verify(commonCodeRepository, never()).findActiveCoreCodeById(anyLong());
    }

    @Test
    @DisplayName("getCommonCodeById: 테넌트 행이 없으면 코어 PK 폴백")
    void getCommonCodeById_fallsBackToCoreWhenTenantMisses() {
        TenantContextHolder.setTenantId(TENANT);
        CommonCode core = baseCodeBuilder().build();
        core.setId(11L);
        core.setTenantId(null);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 11L)).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(11L)).thenReturn(Optional.of(core));

        assertEquals(core, commonCodeService.getCommonCodeById(11L));

        verify(commonCodeRepository).findByTenantIdAndId(TENANT, 11L);
        verify(commonCodeRepository).findActiveCoreCodeById(11L);
    }

    @Test
    @DisplayName("getCommonCodeById: 테넌트 컨텍스트 없으면 코어 단건만 조회")
    void getCommonCodeById_withoutTenantContext_usesCoreOnly() {
        TenantContextHolder.clear();
        CommonCode core = baseCodeBuilder().build();
        core.setId(12L);
        when(commonCodeRepository.findActiveCoreCodeById(12L)).thenReturn(Optional.of(core));

        assertEquals(core, commonCodeService.getCommonCodeById(12L));

        verify(commonCodeRepository, never()).findByTenantIdAndId(anyString(), anyLong());
        verify(commonCodeRepository).findActiveCoreCodeById(12L);
    }

    @Test
    @DisplayName("getCommonCodeById: 조회 실패 시 RuntimeException")
    void getCommonCodeById_notFound_throws() {
        TenantContextHolder.setTenantId(TENANT);
        when(commonCodeRepository.findByTenantIdAndId(eq(TENANT), eq(99L))).thenReturn(Optional.empty());
        when(commonCodeRepository.findActiveCoreCodeById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> commonCodeService.getCommonCodeById(99L));
    }

    @Test
    @DisplayName("getCodesByGroupWithFallback: EXPENSE 테넌트 행 있으면 tenant-only (hybrid 금지)")
    void getCodesByGroupWithFallback_expenseTenantPresent_tenantOnly() {
        CommonCode tenantRow = baseCodeBuilder()
            .codeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY)
            .codeValue("UTILITY")
            .build();
        tenantRow.setTenantId(TENANT);
        when(commonCodeRepository.countByTenantIdAndCodeGroupAndIsDeletedFalse(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY))
            .thenReturn(1L);
        when(commonCodeRepository.findTenantCodesByGroup(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY))
            .thenReturn(List.of(tenantRow));

        List<CommonCode> result = commonCodeService.getCodesByGroupWithFallback(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);

        assertEquals(1, result.size());
        assertEquals("UTILITY", result.get(0).getCodeValue());
        verify(commonCodeRepository, never()).findCodesByGroupWithFallback(anyString(), anyString());
    }

    @Test
    @DisplayName("getCodesByGroupWithFallback: EXPENSE 테넌트 0건이면 core 폴백")
    void getCodesByGroupWithFallback_expenseEmpty_coreFallback() {
        CommonCode coreRow = baseCodeBuilder()
            .codeGroup(ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY)
            .codeValue("RENT")
            .build();
        when(commonCodeRepository.countByTenantIdAndCodeGroupAndIsDeletedFalse(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY))
            .thenReturn(0L);
        when(commonCodeRepository.findCoreCodesByGroup(
                ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY))
            .thenReturn(List.of(coreRow));

        List<CommonCode> result = commonCodeService.getCodesByGroupWithFallback(
                TENANT, ExpenseCommonCodeSsotConstants.GROUP_EXPENSE_CATEGORY);

        assertEquals(1, result.size());
        assertEquals("RENT", result.get(0).getCodeValue());
    }

    @Test
    @DisplayName("deactivateCommonCodes: 지정 테넌트의 같은 코드값만 비활성화하고 전체 조회는 쓰지 않는다")
    void deactivateCommonCodes_onlyGivenTenant() {
        CommonCode row = baseCodeBuilder().isActive(true).build();
        row.setTenantId(TENANT);
        when(commonCodeRepository.findByTenantIdAndCodeValue(TENANT, "V")).thenReturn(List.of(row));

        int count = commonCodeService.deactivateCommonCodes(TENANT, List.of("V"));

        assertEquals(1, count);
        assertEquals(false, row.getIsActive());
        verify(commonCodeRepository).save(row);
        verify(commonCodeRepository, never()).findByCodeValue(anyString());
    }

    @Test
    @DisplayName("deactivateCommonCodes: 테넌트가 없으면 거부한다")
    void deactivateCommonCodes_withoutTenant_throws() {
        assertThrows(IllegalArgumentException.class,
            () -> commonCodeService.deactivateCommonCodes("", List.of("V")));
        verify(commonCodeRepository, never()).findByTenantIdAndCodeValue(anyString(), anyString());
    }

    @Test
    @DisplayName("createCommonCode: codeGroup/value 만 trim, codeLabel 은 원문 보존")
    void createCommonCode_trimsPaddedFields() {
        CommonCodeDto dto = CommonCodeDto.builder()
            .codeGroup("  EXPENSE_CATEGORY  ")
            .codeValue("  RENT  ")
            .codeLabel("  임대료  ")
            .koreanName("임대료")
            .sortOrder(1)
            .isActive(true)
            .build();
        when(commonCodeRepository.findByCodeGroupAndCodeValue("EXPENSE_CATEGORY", "RENT"))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));

        CommonCode saved = commonCodeService.createCommonCode(dto);

        assertEquals("EXPENSE_CATEGORY", saved.getCodeGroup());
        assertEquals("RENT", saved.getCodeValue());
        assertEquals("  임대료  ", saved.getCodeLabel());
        ArgumentCaptor<CommonCode> captor = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(captor.capture());
        assertEquals("RENT", captor.getValue().getCodeValue());
        assertEquals("  임대료  ", captor.getValue().getCodeLabel());
    }

    @Test
    @DisplayName("create(표준): codeGroup/value 만 trim, codeLabel 은 원문 보존")
    void create_standardized_trimsPaddedFields() {
        TenantContextHolder.setTenantId(TENANT);
        when(permissionService.canCreateCode(any(), eq(TENANT))).thenReturn(true);
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT, "EXPENSE_CATEGORY", "MEAL"))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> {
            CommonCode c = inv.getArgument(0);
            c.setId(42L);
            return c;
        });

        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder()
            .codeGroup("  EXPENSE_CATEGORY ")
            .codeValue("  MEAL  ")
            .codeLabel("  식대  ")
            .koreanName("식대")
            .tenantId(TENANT)
            .build();

        CommonCodeResponse response = commonCodeService.create(request, null);

        assertEquals("EXPENSE_CATEGORY", response.getCodeGroup());
        assertEquals("MEAL", response.getCodeValue());
        assertEquals("  식대  ", response.getCodeLabel());
        ArgumentCaptor<CommonCode> captor = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(captor.capture());
        assertEquals("MEAL", captor.getValue().getCodeValue());
        assertEquals("  식대  ", captor.getValue().getCodeLabel());
    }

    @Test
    @DisplayName("fromEntity: codeGroup/value/parent 만 trim, codeLabel 은 원문")
    void fromEntity_trimsOnRead() {
        CommonCode row = baseCodeBuilder()
            .codeGroup("  G  ")
            .codeValue("  V  ")
            .codeLabel("  L  \n\n")
            .parentCodeGroup("  PG  ")
            .parentCodeValue("  PV  ")
            .koreanName("  K  \n")
            .codeDescription("desc\n\n\n")
            .extraData("{\"body\":\"x\\n\\n\\n\"}")
            .build();
        row.setId(1L);

        CommonCodeResponse response = CommonCodeResponse.fromEntity(row);

        assertEquals("G", response.getCodeGroup());
        assertEquals("V", response.getCodeValue());
        assertEquals("  L  \n\n", response.getCodeLabel());
        assertEquals("PG", response.getParentCodeGroup());
        assertEquals("PV", response.getParentCodeValue());
        assertEquals("  K  \n", response.getKoreanName());
        assertEquals("desc\n\n\n", response.getCodeDescription());
        assertEquals("{\"body\":\"x\\n\\n\\n\"}", response.getExtraData());
    }

    @Test
    @DisplayName("getActiveCodesByGroup: value/parent 만 trim, codeLabel 공백·개행 보존")
    void getActiveCodesByGroup_trimsMapFields() {
        TenantContextHolder.clear();
        CommonCode row = baseCodeBuilder()
            .codeGroup("  INCOME_CATEGORY  ")
            .codeValue("  CONSULTATION  ")
            .codeLabel("  상담료  \n\n")
            .parentCodeGroup("  PARENT_G  ")
            .parentCodeValue("  PARENT_V  ")
            .build();
        row.setId(7L);
        when(commonCodeRepository.findCoreCodesByGroup("INCOME_CATEGORY"))
            .thenReturn(List.of(row));

        List<Map<String, Object>> maps = commonCodeService.getActiveCodesByGroup("INCOME_CATEGORY");

        assertEquals(1, maps.size());
        Map<String, Object> codeMap = maps.get(0);
        assertEquals("CONSULTATION", codeMap.get("codeValue"));
        assertEquals("  상담료  \n\n", codeMap.get("codeLabel"));
        assertEquals("PARENT_G", codeMap.get("parentCodeGroup"));
        assertEquals("PARENT_V", codeMap.get("parentCodeValue"));
        assertEquals(7L, codeMap.get("id"));
    }

    @Test
    @DisplayName("SMS_TEMPLATE create/update/read: codeLabel·본문 개행 보존, codeValue ' COFFE' → COFFE")
    void smsTemplate_preservesLabelAndBody_trimsCodeValue() {
        TenantContextHolder.setTenantId(TENANT);
        String labelWithNewlines = "커피 안내\n\n\n";
        String descriptionWithNewlines = "본문 설명\n\n\n";
        String extraWithNewlines = "{\"text\":\"안녕하세요\\n\\n\\n\"}";
        String koreanWithNewlines = "한글명\n\n\n";

        when(permissionService.canCreateCode(any(), eq(TENANT))).thenReturn(true);
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT, "SMS_TEMPLATE", "COFFE"))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> {
            CommonCode c = inv.getArgument(0);
            if (c.getId() == null) {
                c.setId(55L);
            }
            return c;
        });

        CommonCodeCreateRequest createRequest = CommonCodeCreateRequest.builder()
            .codeGroup("  SMS_TEMPLATE  ")
            .codeValue(" COFFE")
            .codeLabel(labelWithNewlines)
            .koreanName(koreanWithNewlines)
            .codeDescription(descriptionWithNewlines)
            .extraData(extraWithNewlines)
            .tenantId(TENANT)
            .build();

        CommonCodeResponse created = commonCodeService.create(createRequest, null);

        assertEquals("SMS_TEMPLATE", created.getCodeGroup());
        assertEquals("COFFE", created.getCodeValue());
        assertEquals(labelWithNewlines, created.getCodeLabel());
        assertEquals(koreanWithNewlines, created.getKoreanName());
        assertEquals(descriptionWithNewlines, created.getCodeDescription());
        assertEquals(extraWithNewlines, created.getExtraData());

        ArgumentCaptor<CommonCode> createCaptor = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(createCaptor.capture());
        CommonCode persisted = createCaptor.getValue();
        assertEquals("COFFE", persisted.getCodeValue());
        assertEquals(labelWithNewlines, persisted.getCodeLabel());
        assertEquals(descriptionWithNewlines, persisted.getCodeDescription());
        assertEquals(extraWithNewlines, persisted.getExtraData());

        CommonCode existing = CommonCode.builder()
            .codeGroup("SMS_TEMPLATE")
            .codeValue("COFFE")
            .codeLabel("old")
            .koreanName("old")
            .codeDescription("old")
            .extraData("{}")
            .build();
        existing.setId(55L);
        existing.setTenantId(TENANT);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, 55L)).thenReturn(Optional.of(existing));
        when(permissionService.canUpdateCode(any(), any(CommonCode.class))).thenReturn(true);

        String updatedLabel = "수정 라벨\n\n\n";
        String updatedDescription = "수정 본문\n\n\n";
        String updatedExtra = "{\"body\":\"SMS 본문\\n\\n\\n\"}";
        CommonCodeUpdateRequest updateRequest = CommonCodeUpdateRequest.builder()
            .codeLabel(updatedLabel)
            .codeDescription(updatedDescription)
            .extraData(updatedExtra)
            .koreanName(koreanWithNewlines)
            .build();

        CommonCodeResponse updated = commonCodeService.update(55L, updateRequest, null);

        assertEquals(updatedLabel, updated.getCodeLabel());
        assertEquals(updatedDescription, updated.getCodeDescription());
        assertEquals(updatedExtra, updated.getExtraData());
        assertEquals(koreanWithNewlines, updated.getKoreanName());
        assertEquals("COFFE", updated.getCodeValue());
        assertEquals("SMS_TEMPLATE", updated.getCodeGroup());
    }

    private static CommonCode.CommonCodeBuilder baseCodeBuilder() {
        return CommonCode.builder()
            .codeGroup("G")
            .codeValue("V")
            .codeLabel("L")
            .koreanName("K");
    }
}
