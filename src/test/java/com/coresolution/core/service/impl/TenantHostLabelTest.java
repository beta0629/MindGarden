package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.core.constant.OnboardingConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 온보딩 승인 호스트 레이블. 한글 센터명이 서브도메인으로 남지 않는지 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
class TenantHostLabelTest {

    private static final String KOREAN_CENTER = "검증-재검-202610032055";

    private static final String TENANT_ID = "ABCDEF12-3456-7890-abcd-ef1234567890";

    @Test
    @DisplayName("서브도메인 없는 한글 센터명은 한글 서브도메인으로 남지 않는다")
    void koreanCenterNameWithoutSubdomainIsNotStoredAsHangul() {
        String label = TenantHostLabel.fromCenterName(KOREAN_CENTER, TENANT_ID);

        assertThat(label).isEqualTo("202610032055");
        assertThat(label).doesNotContain("검증");
        assertThat(label).doesNotContain("재검");
        assertThat(TenantHostLabel.isDnsLabel(label)).isTrue();
        assertThat(label).hasSizeLessThanOrEqualTo(TenantHostLabel.MAX_LENGTH);
    }

    @Test
    @DisplayName("한글만 있는 센터명은 tenant- 와 테넌트 ID 로 레이블을 만든다")
    void hangulOnlyCenterNameUsesTenantIdLabel() {
        String label = TenantHostLabel.fromCenterName("안녕", TENANT_ID);

        assertThat(label).isEqualTo("tenant-abcdef12");
        assertThat(label).doesNotContain("안녕");
        assertThat(TenantHostLabel.isDnsLabel(label)).isTrue();
    }

    @Test
    @DisplayName("유효한 영문 서브도메인은 소문자로 그대로 둔다")
    void validEnglishSubdomainIsKeptLowercase() {
        assertThat(TenantHostLabel.explicitDnsLabelOrNull("MindGarden")).isEqualTo("mindgarden");
        assertThat(TenantHostLabel.explicitDnsLabelOrNull(" clinic-a ")).isEqualTo("clinic-a");
        assertThat(TenantHostLabel.explicitDnsLabelOrNull(null)).isNull();
        assertThat(TenantHostLabel.explicitDnsLabelOrNull("  ")).isNull();
    }

    @Test
    @DisplayName("이미 있는 정상 서브도메인 mindgarden 은 비어 있는 신청에서 바꾸지 않는다")
    void existingMindgardenIsLeftUntouchedWhenRequestHasNoSubdomain() {
        assertThat(TenantHostLabel.labelForExistingRow(null, "mindgarden", KOREAN_CENTER, TENANT_ID))
                .isNull();
    }

    @Test
    @DisplayName("기존 행의 한글 서브도메인은 레이블로 다시 만든다")
    void existingHangulSubdomainIsReplacedWithDnsLabel() {
        String label = TenantHostLabel.labelForExistingRow(null, KOREAN_CENTER, KOREAN_CENTER,
                TENANT_ID);

        assertThat(label).isEqualTo("202610032055");
        assertThat(label).doesNotContain("검증");
        assertThat(TenantHostLabel.isDnsLabel(label)).isTrue();
    }

    @Test
    @DisplayName("한글 신청 서브도메인은 저장하지 않고 사유를 던진다")
    void explicitHangulSubdomainIsRejectedWithReason() {
        assertThatThrownBy(() -> TenantHostLabel.explicitDnsLabelOrNull(KOREAN_CENTER))
                .isInstanceOf(OnboardingApprovalBlockedException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_NOT_DNS_LABEL);
    }
}
