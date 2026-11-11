package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.HomepageInquiryConstants;
import com.coresolution.consultation.dto.request.PublicHomepageInquiryCreateRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.HomepageInquiry;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.HomepageInquiryRepository;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.HomepageInquiryNotificationChannel;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.security.CaptchaVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * {@link HomepageInquiryServiceImpl} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
class HomepageInquiryServiceImplTest {

    private static final String TENANT_ID = "tenant-test-001";
    private static final String SLUG = "mindgarden";

    @Mock private HomepageInquiryRepository homepageInquiryRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private PersonalDataAccessLogRepository personalDataAccessLogRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private CaptchaVerifier captchaVerifier;
    @Mock private HomepageInquiryNotificationChannel notificationChannel;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private HomepageInquiryServiceImpl service;

    private Tenant activeTenant;
    private CommonCode personalType;

    @BeforeEach
    void setUp() {
        activeTenant = new Tenant();
        activeTenant.setTenantId(TENANT_ID);
        activeTenant.setSubdomain(SLUG);
        activeTenant.setStatus(Tenant.TenantStatus.ACTIVE);

        personalType = CommonCode.builder()
                .codeGroup(HomepageInquiryConstants.CODE_GROUP_INQUIRY_TYPE)
                .codeValue("PERSONAL")
                .codeLabel("개인상담")
                .koreanName("개인상담")
                .isActive(true)
                .build();
        personalType.setTenantId(TENANT_ID);
    }

    @Test
    void submitPublicInquiry_happyPath_persistsAndNotifies() {
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(false);
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                TENANT_ID, HomepageInquiryConstants.CODE_GROUP_INQUIRY_TYPE))
                .thenReturn(List.of(personalType));
        when(homepageInquiryRepository.save(any(HomepageInquiry.class))).thenAnswer(inv -> {
            HomepageInquiry saved = inv.getArgument(0);
            saved.setId(42L);
            return saved;
        });

        PublicHomepageInquiryCreateRequest request = baseRequest();
        service.submitPublicInquiry(SLUG, request, new MockHttpServletRequest());

        ArgumentCaptor<HomepageInquiry> captor = ArgumentCaptor.forClass(HomepageInquiry.class);
        verify(homepageInquiryRepository).save(captor.capture());
        HomepageInquiry saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getName()).isEqualTo("홍길동");
        assertThat(saved.getPhone()).isEqualTo("01012345678");
        assertThat(saved.getInquiryType()).isEqualTo("PERSONAL");
        assertThat(saved.getStatus()).isEqualTo(HomepageInquiryConstants.STATUS_NEW);
        assertThat(saved.getClientIpHash()).isNotBlank();
        verify(notificationChannel).notifyNewInquiry(TENANT_ID, 42L);
    }

    @Test
    void submitPublicInquiry_honeypot_skipsPersist() {
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));

        PublicHomepageInquiryCreateRequest request = baseRequest();
        request.setWebsite("http://spam.example");
        service.submitPublicInquiry(SLUG, request, new MockHttpServletRequest());

        verify(homepageInquiryRepository, never()).save(any());
        verify(notificationChannel, never()).notifyNewInquiry(anyString(), any());
    }

    @Test
    void submitPublicInquiry_consentFalse_rejectedByValidationAnnotationContract() {
        // Bean Validation @AssertTrue 는 컨트롤러에서 처리. 서비스는 privacyConsent=true 전제.
        // 캡차 강제 + 잘못된 토큰 경로를 검증한다.
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(true);
        when(captchaVerifier.verify(eq("bad"), any())).thenReturn(false);

        PublicHomepageInquiryCreateRequest request = baseRequest();
        request.setCaptchaToken("bad");

        assertThatThrownBy(() -> service.submitPublicInquiry(SLUG, request, new MockHttpServletRequest()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("캡차");
        verify(homepageInquiryRepository, never()).save(any());
    }

    @Test
    void submitPublicInquiry_unknownTenant_genericNotFound() {
        when(tenantRepository.findBySubdomainIgnoreCase("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.submitPublicInquiry("unknown", baseRequest(), new MockHttpServletRequest()))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage(HomepageInquiryConstants.GENERIC_NOT_FOUND_MESSAGE);
        verify(homepageInquiryRepository, never()).save(any());
    }

    @Test
    void listForAdmin_masksNameAndPhone() {
        HomepageInquiry inquiry = HomepageInquiry.builder()
                .tenantId(TENANT_ID)
                .name("홍길동")
                .phone("01012345678")
                .inquiryType("PERSONAL")
                .content("문의")
                .status(HomepageInquiryConstants.STATUS_NEW)
                .consentVersion("v1")
                .privacyConsentAt(java.time.LocalDateTime.now())
                .build();
        inquiry.setId(3L);
        when(homepageInquiryRepository.findByTenantIdAndOptionalStatus(
                eq(TENANT_ID), eq(null), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(inquiry)));
        when(encryptionUtil.maskName("홍길동")).thenReturn("홍*동");

        var page = service.listForAdmin(TENANT_ID, null, 0, 20);
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getNameMasked()).isEqualTo("홍*동");
        assertThat(page.getContent().get(0).getPhoneMasked()).isEqualTo("010****5678");
        assertThat(page.getContent().get(0).getNameMasked()).doesNotContain("길");
    }

    @Test
    void getDetailForAdmin_otherTenant_notFound() {
        when(homepageInquiryRepository.findByTenantIdAndIdAndNotDeleted("other-tenant", 7L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.getDetailForAdmin("other-tenant", 7L, new User(), new MockHttpServletRequest()))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage(HomepageInquiryConstants.GENERIC_NOT_FOUND_MESSAGE);
        verify(personalDataAccessLogRepository, never()).save(any());
    }

    @Test
    void getDetailForAdmin_writesAccessLog() {
        HomepageInquiry inquiry = HomepageInquiry.builder()
                .tenantId(TENANT_ID)
                .name("홍길동")
                .phone("01012345678")
                .inquiryType("PERSONAL")
                .content("문의")
                .status(HomepageInquiryConstants.STATUS_NEW)
                .consentVersion("v1")
                .privacyConsentAt(java.time.LocalDateTime.now())
                .build();
        inquiry.setId(7L);

        when(homepageInquiryRepository.findByTenantIdAndIdAndNotDeleted(TENANT_ID, 7L))
                .thenReturn(Optional.of(inquiry));
        when(encryptionUtil.maskName(anyString())).thenReturn("홍*동");

        User viewer = new User();
        viewer.setId(99L);
        viewer.setName("관리자");
        viewer.setTenantId(TENANT_ID);

        service.getDetailForAdmin(TENANT_ID, 7L, viewer, new MockHttpServletRequest());

        ArgumentCaptor<PersonalDataAccessLog> logCaptor = ArgumentCaptor.forClass(PersonalDataAccessLog.class);
        verify(personalDataAccessLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getDataType())
                .isEqualTo(HomepageInquiryConstants.ACCESS_LOG_DATA_TYPE);
        assertThat(logCaptor.getValue().getAccessType()).isEqualTo("READ");
        assertThat(logCaptor.getValue().getTenantId()).isEqualTo(TENANT_ID);
    }

    private static PublicHomepageInquiryCreateRequest baseRequest() {
        return PublicHomepageInquiryCreateRequest.builder()
                .name("홍길동")
                .phone("01012345678")
                .inquiryType("개인상담")
                .content("상담 문의합니다")
                .privacyConsent(true)
                .consentVersion("privacy-2026-11")
                .build();
    }
}
