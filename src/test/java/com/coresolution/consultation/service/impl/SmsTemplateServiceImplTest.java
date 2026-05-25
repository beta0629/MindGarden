package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.SmsTemplateAdminItem;
import com.coresolution.consultation.dto.SmsTemplatePreviewResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link SmsTemplateServiceImpl} 단위 테스트.
 *
 * <p>검증 시나리오:
 * <ul>
 *   <li>{@code findTemplateContent}: 테넌트 override → 글로벌 fallback 우선순위.</li>
 *   <li>{@code renderForType}: named + positional 변수 치환.</li>
 *   <li>{@code listForAdmin}: 글로벌 + 테넌트 override 병합 행 구성.</li>
 *   <li>{@code upsertTenantOverride}: 신규/기존 row 처리, 글로벌 미존재 시 예외.</li>
 *   <li>{@code deleteTenantOverride}: soft-delete 동작, 글로벌 미존재 시 예외.</li>
 *   <li>{@code preview}: 길이·누락 변수·source 출처.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SmsTemplateServiceImpl 단위 테스트")
class SmsTemplateServiceImplTest {

    private static final String TENANT_ID = "tenant-001";
    private static final String GROUP = "SMS_TEMPLATE";
    private static final String KEY = "PAYMENT_COMPLETED";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    private SmsTemplateServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SmsTemplateServiceImpl(commonCodeRepository, new ObjectMapper());
    }

    @Test
    @DisplayName("findTemplateContent — 테넌트 override 가 우선되고 글로벌은 fallback")
    void findTemplateContent_prefersTenantOverride() {
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, KEY))
            .thenReturn(Optional.of(buildRow(TENANT_ID, "tenant body")));

        Optional<String> result = service.findTemplateContent(KEY, TENANT_ID);

        assertThat(result).contains("tenant body");
    }

    @Test
    @DisplayName("findTemplateContent — 테넌트 override 없으면 글로벌 본문")
    void findTemplateContent_fallbackToGlobal() {
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, KEY))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, KEY))
            .thenReturn(Optional.of(buildRow(null, "global body")));

        Optional<String> result = service.findTemplateContent(KEY, TENANT_ID);

        assertThat(result).contains("global body");
    }

    @Test
    @DisplayName("findTemplateContent — row 없으면 빈 Optional")
    void findTemplateContent_returnsEmptyWhenMissing() {
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, KEY))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, KEY))
            .thenReturn(Optional.empty());

        Optional<String> result = service.findTemplateContent(KEY, TENANT_ID);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("renderForType — named + positional 자리표시자 모두 치환")
    void renderForType_substitutesBothPatterns() {
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, KEY))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, KEY))
            .thenReturn(Optional.of(buildRow(null,
                "결제 완료: {{paymentAmount}}원, {0} 패키지, {{consultantName}}")));

        Optional<String> result = service.renderForType(KEY, TENANT_ID,
            Map.of("paymentAmount", "500,000", "consultantName", "김상담"),
            new String[]{"10회"});

        assertThat(result).contains("결제 완료: 500,000원, 10회 패키지, 김상담");
    }

    @Test
    @DisplayName("listForAdmin — 글로벌 + 테넌트 override 병합 행 구성")
    void listForAdmin_mergesGlobalAndOverride() {
        CommonCode global1 = buildRow(null, "글로벌 본문 1");
        global1.setCodeValue("KEY1");
        global1.setKoreanName("키1");
        global1.setExtraData(
            "{\"category\":\"BOOKING\",\"variables\":[\"clientName\"]}");
        CommonCode global2 = buildRow(null, "글로벌 본문 2");
        global2.setCodeValue("KEY2");
        global2.setKoreanName("키2");

        CommonCode override1 = buildRow(TENANT_ID, "테넌트 override 본문 1");
        override1.setCodeValue("KEY1");
        override1.setIsActive(true);
        override1.setIsDeleted(false);

        when(commonCodeRepository.findCoreCodesByGroup(GROUP))
            .thenReturn(List.of(global1, global2));
        when(commonCodeRepository.findTenantCodesByGroup(TENANT_ID, GROUP))
            .thenReturn(List.of(override1));

        List<SmsTemplateAdminItem> items = service.listForAdmin(TENANT_ID);

        assertThat(items).hasSize(2);
        SmsTemplateAdminItem item1 = items.get(0);
        assertThat(item1.getKey()).isEqualTo("KEY1");
        assertThat(item1.isTenantOverride()).isTrue();
        assertThat(item1.getTenantContent()).isEqualTo("테넌트 override 본문 1");
        assertThat(item1.getCategory()).isEqualTo("BOOKING");
        assertThat(item1.getVariables()).contains("clientName");

        SmsTemplateAdminItem item2 = items.get(1);
        assertThat(item2.getKey()).isEqualTo("KEY2");
        assertThat(item2.isTenantOverride()).isFalse();
        assertThat(item2.getTenantContent()).isNull();
    }

    @Test
    @DisplayName("upsertTenantOverride — 글로벌 row 가 있으면 테넌트 override 저장")
    void upsertTenantOverride_createsNewWhenAbsent() {
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, KEY))
            .thenReturn(Optional.of(buildRow(null, "global body")));
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, KEY))
            .thenReturn(Optional.empty());

        service.upsertTenantOverride(KEY, "신규 본문", TENANT_ID, currentUser());

        ArgumentCaptor<CommonCode> captor = ArgumentCaptor.forClass(CommonCode.class);
        verify(commonCodeRepository).save(captor.capture());
        CommonCode saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getCodeGroup()).isEqualTo(GROUP);
        assertThat(saved.getCodeValue()).isEqualTo(KEY);
        assertThat(saved.getCodeLabel()).isEqualTo("신규 본문");
        assertThat(saved.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("upsertTenantOverride — 글로벌 row 가 없으면 IllegalArgumentException")
    void upsertTenantOverride_throwsWhenGlobalMissing() {
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, KEY))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.upsertTenantOverride(KEY, "본문", TENANT_ID, currentUser()))
            .isInstanceOf(IllegalArgumentException.class);

        verify(commonCodeRepository, never()).save(any());
    }

    @Test
    @DisplayName("deleteTenantOverride — 기존 row soft-delete + 글로벌 본문으로 회귀 표시")
    void deleteTenantOverride_softDeletesExistingRow() {
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, KEY))
            .thenReturn(Optional.of(buildRow(null, "global body")));
        CommonCode existing = buildRow(TENANT_ID, "테넌트 본문");
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, KEY))
            .thenReturn(Optional.of(existing));

        SmsTemplateAdminItem result = service.deleteTenantOverride(KEY, TENANT_ID, currentUser());

        assertThat(existing.getIsDeleted()).isTrue();
        assertThat(existing.getIsActive()).isFalse();
        assertThat(result.isTenantOverride()).isFalse();
        verify(commonCodeRepository).save(existing);
    }

    @Test
    @DisplayName("preview — 누락 변수 리포트 + UTF-8 byte length")
    void preview_reportsMissingVariablesAndByteLength() {
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, KEY))
            .thenReturn(Optional.of(buildRow(null,
                "결제: {{paymentAmount}}원 / {{packageName}} / {{consultantName}}")));
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, KEY))
            .thenReturn(Optional.empty());

        Optional<SmsTemplatePreviewResponse> response = service.preview(KEY, TENANT_ID,
            Map.of("paymentAmount", "500000"), true);

        assertThat(response).isPresent();
        SmsTemplatePreviewResponse data = response.get();
        assertThat(data.getMissingVariables()).contains("packageName", "consultantName");
        assertThat(data.getByteLength()).isGreaterThan(0);
        assertThat(data.isFromTenantOverride()).isFalse();
    }

    private CommonCode buildRow(String tenantId, String content) {
        CommonCode row = new CommonCode();
        row.setTenantId(tenantId);
        row.setCodeGroup(GROUP);
        row.setCodeValue(KEY);
        row.setCodeLabel(content);
        row.setKoreanName("결제 완료");
        row.setIsActive(true);
        row.setIsDeleted(false);
        return row;
    }

    private User currentUser() {
        User user = new User();
        user.setId(1L);
        user.setName("admin");
        return user;
    }
}
