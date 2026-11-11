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
import com.coresolution.consultation.config.HomepageInquiryProperties;
import com.coresolution.consultation.constant.HomepageInquiryConstants;
import com.coresolution.consultation.dto.request.PublicHomepageInquiryCreateRequest;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryDetailResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.HomepageInquiry;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ServiceUnavailableException;
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
    @Mock private CaptchaVerifier homepageInquiryCaptchaVerifier;
    @Mock private HomepageInquiryNotificationChannel notificationChannel;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;

    private HomepageInquiryProperties properties;
    private HomepageInquiryServiceImpl service;

    private Tenant activeTenant;
    private CommonCode personalType;
    private CommonCode familyType;

    @BeforeEach
    void setUp() {
        properties = new HomepageInquiryProperties();
        properties.getCaptcha().setEnabled(false);
        properties.getCaptcha().setSecretKey("");

        service = new HomepageInquiryServiceImpl(
                homepageInquiryRepository,
                tenantRepository,
                commonCodeRepository,
                personalDataAccessLogRepository,
                auditLogService,
                homepageInquiryCaptchaVerifier,
                properties,
                notificationChannel,
                encryptionUtil);

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

        familyType = CommonCode.builder()
                .codeGroup(HomepageInquiryConstants.CODE_GROUP_INQUIRY_TYPE)
                .codeValue("FAMILY")
                .codeLabel("가족")
                .koreanName("가족")
                .isActive(true)
                .build();
        familyType.setTenantId(TENANT_ID);
    }

    @Test
    void submitPublicInquiry_happyPath_setsWebFormSourceAndNullLegacy() {
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                TENANT_ID, HomepageInquiryConstants.CODE_GROUP_INQUIRY_TYPE))
                .thenReturn(List.of(personalType, familyType));
        when(homepageInquiryRepository.save(any(HomepageInquiry.class))).thenAnswer(inv -> {
            HomepageInquiry saved = inv.getArgument(0);
            saved.setId(42L);
            return saved;
        });

        service.submitPublicInquiry(SLUG, baseRequest("PERSONAL"), new MockHttpServletRequest());

        ArgumentCaptor<HomepageInquiry> captor = ArgumentCaptor.forClass(HomepageInquiry.class);
        verify(homepageInquiryRepository).save(captor.capture());
        HomepageInquiry saved = captor.getValue();
        assertThat(saved.getSource()).isEqualTo(HomepageInquiryConstants.SOURCE_WEB_FORM);
        assertThat(saved.getSourceRef()).isNull();
        assertThat(saved.getLegacyInquiryType()).isNull();
        assertThat(saved.getInquiryType()).isEqualTo("PERSONAL");
        verify(notificationChannel).notifyNewInquiry(eq(TENANT_ID), eq(42L), eq("개인상담"));
    }

    @Test
    void submitPublicInquiry_familyType_accepted() {
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                TENANT_ID, HomepageInquiryConstants.CODE_GROUP_INQUIRY_TYPE))
                .thenReturn(List.of(personalType, familyType));
        when(homepageInquiryRepository.save(any(HomepageInquiry.class))).thenAnswer(inv -> {
            HomepageInquiry saved = inv.getArgument(0);
            saved.setId(9L);
            return saved;
        });

        service.submitPublicInquiry(SLUG, baseRequest("FAMILY"), new MockHttpServletRequest());

        ArgumentCaptor<HomepageInquiry> captor = ArgumentCaptor.forClass(HomepageInquiry.class);
        verify(homepageInquiryRepository).save(captor.capture());
        assertThat(captor.getValue().getInquiryType()).isEqualTo("FAMILY");
        verify(notificationChannel).notifyNewInquiry(eq(TENANT_ID), eq(9L), eq("가족"));
    }

    @Test
    void submitPublicInquiry_captchaEnabledEmptySecret_failClosed503() {
        properties.getCaptcha().setEnabled(true);
        properties.getCaptcha().setSecretKey("");
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));

        assertThatThrownBy(() ->
                service.submitPublicInquiry(SLUG, baseRequest("PERSONAL"), new MockHttpServletRequest()))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessage(HomepageInquiryConstants.CAPTCHA_UNAVAILABLE_MESSAGE);
        verify(homepageInquiryRepository, never()).save(any());
        verify(homepageInquiryCaptchaVerifier, never()).verify(anyString(), any());
    }

    @Test
    void submitPublicInquiry_captchaBadToken_rejected() {
        properties.getCaptcha().setEnabled(true);
        properties.getCaptcha().setSecretKey("1x0000000000000000000000000000000AA");
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));
        when(homepageInquiryCaptchaVerifier.verify(eq("bad-token"), any())).thenReturn(false);

        PublicHomepageInquiryCreateRequest request = baseRequest("PERSONAL");
        request.setCaptchaToken("bad-token");

        assertThatThrownBy(() ->
                service.submitPublicInquiry(SLUG, request, new MockHttpServletRequest()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("캡차");
        verify(homepageInquiryRepository, never()).save(any());
    }

    @Test
    void submitPublicInquiry_honeypot_skipsPersist() {
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(activeTenant));

        PublicHomepageInquiryCreateRequest request = baseRequest("PERSONAL");
        request.setWebsite("http://spam.example");
        service.submitPublicInquiry(SLUG, request, new MockHttpServletRequest());

        verify(homepageInquiryRepository, never()).save(any());
        verify(notificationChannel, never()).notifyNewInquiry(anyString(), any(), anyString());
    }

    @Test
    void submitPublicInquiry_unknownTenant_genericNotFound() {
        when(tenantRepository.findBySubdomainIgnoreCase("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.submitPublicInquiry("unknown", baseRequest("PERSONAL"), new MockHttpServletRequest()))
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
                .source(HomepageInquiryConstants.SOURCE_WEB_FORM)
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
    void getDetailForAdmin_whenNew_setsInProgressAndWritesAccessLog() {
        HomepageInquiry inquiry = detailInquiry(HomepageInquiryConstants.STATUS_NEW, 7L);
        when(homepageInquiryRepository.findByTenantIdAndIdAndNotDeleted(TENANT_ID, 7L))
                .thenReturn(Optional.of(inquiry));
        when(homepageInquiryRepository.save(any(HomepageInquiry.class))).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.maskName(anyString())).thenReturn("홍*동");

        User viewer = adminViewer();
        AdminHomepageInquiryDetailResponse detail =
                service.getDetailForAdmin(TENANT_ID, 7L, viewer, new MockHttpServletRequest());

        assertThat(detail.getStatus()).isEqualTo(HomepageInquiryConstants.STATUS_IN_PROGRESS);
        assertThat(inquiry.getStatus()).isEqualTo(HomepageInquiryConstants.STATUS_IN_PROGRESS);
        verify(homepageInquiryRepository).save(inquiry);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getBeforeJson()).contains(HomepageInquiryConstants.STATUS_NEW);
        assertThat(auditCaptor.getValue().getAfterJson())
                .contains(HomepageInquiryConstants.STATUS_IN_PROGRESS);
        assertThat(auditCaptor.getValue().getMetadataJson())
                .isEqualTo(HomepageInquiryConstants.AUDIT_METADATA_AUTO_FROM_DETAIL_VIEW);

        ArgumentCaptor<PersonalDataAccessLog> logCaptor = ArgumentCaptor.forClass(PersonalDataAccessLog.class);
        verify(personalDataAccessLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getDataType())
                .isEqualTo(HomepageInquiryConstants.ACCESS_LOG_DATA_TYPE);
        assertThat(logCaptor.getValue().getTenantId()).isEqualTo(TENANT_ID);
    }

    @Test
    void getDetailForAdmin_whenInProgress_leavesStatus() {
        HomepageInquiry inquiry = detailInquiry(HomepageInquiryConstants.STATUS_IN_PROGRESS, 8L);
        when(homepageInquiryRepository.findByTenantIdAndIdAndNotDeleted(TENANT_ID, 8L))
                .thenReturn(Optional.of(inquiry));
        when(encryptionUtil.maskName(anyString())).thenReturn("홍*동");

        AdminHomepageInquiryDetailResponse detail =
                service.getDetailForAdmin(TENANT_ID, 8L, adminViewer(), new MockHttpServletRequest());

        assertThat(detail.getStatus()).isEqualTo(HomepageInquiryConstants.STATUS_IN_PROGRESS);
        verify(homepageInquiryRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
        verify(personalDataAccessLogRepository).save(any(PersonalDataAccessLog.class));
    }

    @Test
    void getDetailForAdmin_whenContacted_leavesStatus() {
        HomepageInquiry inquiry = detailInquiry(HomepageInquiryConstants.STATUS_CONTACTED, 9L);
        when(homepageInquiryRepository.findByTenantIdAndIdAndNotDeleted(TENANT_ID, 9L))
                .thenReturn(Optional.of(inquiry));
        when(encryptionUtil.maskName(anyString())).thenReturn("홍*동");

        AdminHomepageInquiryDetailResponse detail =
                service.getDetailForAdmin(TENANT_ID, 9L, adminViewer(), new MockHttpServletRequest());

        assertThat(detail.getStatus()).isEqualTo(HomepageInquiryConstants.STATUS_CONTACTED);
        verify(homepageInquiryRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
        verify(personalDataAccessLogRepository).save(any(PersonalDataAccessLog.class));
    }

    private static HomepageInquiry detailInquiry(String status, long id) {
        HomepageInquiry inquiry = HomepageInquiry.builder()
                .tenantId(TENANT_ID)
                .name("홍길동")
                .phone("01012345678")
                .inquiryType("PERSONAL")
                .content("문의")
                .status(status)
                .consentVersion("v1")
                .privacyConsentAt(java.time.LocalDateTime.now())
                .build();
        inquiry.setId(id);
        return inquiry;
    }

    private static User adminViewer() {
        User viewer = new User();
        viewer.setId(99L);
        viewer.setName("관리자");
        viewer.setTenantId(TENANT_ID);
        return viewer;
    }

    private static PublicHomepageInquiryCreateRequest baseRequest(String inquiryType) {
        return PublicHomepageInquiryCreateRequest.builder()
                .name("홍길동")
                .phone("01012345678")
                .inquiryType(inquiryType)
                .content("상담 문의합니다")
                .privacyConsent(true)
                .consentVersion("privacy-2026-11")
                .build();
    }
}
