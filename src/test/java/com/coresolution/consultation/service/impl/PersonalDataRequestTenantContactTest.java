package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.compliance.ComplianceServiceErrorMessages;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 내담자 노출 개인정보 처리현황의 연락처 테넌트 격리 검증.
 *
 * <p>P1 보안(2026-10-03): {@code /api/v1/personal-data/processing-status} 응답에
 * 마인드가든 고정 연락처가 박혀 있어 타 테넌트 내담자에게도 그대로 노출됐다.
 * 현재 테넌트 센터 프로필만 사용하고, 비어 있으면 공백 + 안내 문구를 쓴다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("개인정보 처리현황 — 테넌트 연락처 격리")
class PersonalDataRequestTenantContactTest {

    private static final String TENANT_B = "tenant-b";
    private static final Long USER_ID = 77L;

    /** 코드에서 제거한 마인드가든 고정 연락처 — 어떤 테넌트 응답에도 나타나선 안 된다. */
    private static final List<String> REMOVED_MINDGARDEN_CONTACTS = List.of(
            "032-724-8501",
            "privacy@mindgarden.com",
            "privacy@mindgarden.co.kr",
            "인천광역시 연수구 해돋이로120번길 23 2층 204호");

    @Mock
    private UserRepository userRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private PersonalDataAccessLogRepository personalDataAccessLogRepository;
    @Mock
    private PasswordService passwordService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private PersonalDataRequestServiceImpl personalDataRequestService;

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    private void givenUser() {
        User user = User.builder().email("client@tenant-b.example.com").build();
        user.setId(USER_ID);
        user.setTenantId(TENANT_B);
        user.setUpdatedAt(LocalDateTime.now());
        when(userRepository.findByTenantIdAndId(TENANT_B, USER_ID)).thenReturn(Optional.of(user));
    }

    private Tenant tenantB() {
        Tenant tenant = new Tenant();
        tenant.setTenantId(TENANT_B);
        tenant.setName("테넌트B센터");
        tenant.setContactEmail("privacy@tenant-b.example.com");
        tenant.setContactPhone("02-1111-2222");
        return tenant;
    }

    @Test
    @DisplayName("자기 테넌트 센터 연락처만 노출하고 마인드가든 문자열은 0건")
    void processingStatus_usesTenantContactOnly() {
        TenantContextHolder.setTenantId(TENANT_B);
        givenUser();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_B)).thenReturn(Optional.of(tenantB()));

        Map<String, Object> status = personalDataRequestService.getPersonalDataProcessingStatus(USER_ID);

        assertThat(status.toString()).contains("privacy@tenant-b.example.com", "02-1111-2222");
        for (String removed : REMOVED_MINDGARDEN_CONTACTS) {
            assertThat(status.toString()).as("마인드가든 연락처 미노출: %s", removed).doesNotContain(removed);
        }
    }

    @Test
    @DisplayName("센터 프로필이 비어 있으면 공백 + 안내 문구, 마인드가든 폴백 없음")
    void processingStatus_emptyProfile_showsNotice() {
        TenantContextHolder.setTenantId(TENANT_B);
        givenUser();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_B)).thenReturn(Optional.empty());

        String rendered = personalDataRequestService.getPersonalDataProcessingStatus(USER_ID).toString();

        assertThat(rendered).contains(ComplianceServiceErrorMessages.MSG_CENTER_PROFILE_REQUIRED);
        for (String removed : REMOVED_MINDGARDEN_CONTACTS) {
            assertThat(rendered).as("마인드가든 연락처 미노출: %s", removed).doesNotContain(removed);
        }
    }
}
