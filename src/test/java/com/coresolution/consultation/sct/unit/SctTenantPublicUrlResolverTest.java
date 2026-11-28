package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.sct.service.SctTenantPublicUrlResolver;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * SCT 테넌트 공개 절대 URL 리졸버 — fail-closed·마스킹.
 *
 * @author MindGarden
 * @since 2026-03-25
 */
@ExtendWith(MockitoExtension.class)
class SctTenantPublicUrlResolverTest {

    private static final String TENANT_ID = "tenant-demo-001";
    private static final String RAW_TOKEN = "abcdefTokenBodyXYZ1234567890";

    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private OAuth2DomainUtil oauth2DomainUtil;
    @Mock
    private Environment environment;

    @InjectMocks
    private SctTenantPublicUrlResolver resolver;

    @Test
    @DisplayName("테넌트 subdomain + 환경 suffix로 절대 URL 조립")
    void resolveAbsolutePublicUrl_assemblesHttpsTenantHost() {
        Tenant tenant = Tenant.builder()
                .tenantId(TENANT_ID)
                .subdomain("AcmeClinic")
                .name("Acme")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(tenant));
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        when(oauth2DomainUtil.resolveEnvironmentTenantDomainSuffix(any(String[].class)))
                .thenReturn(".dev.example-parent.test");

        String url = resolver.resolveAbsolutePublicUrl(TENANT_ID, RAW_TOKEN);

        assertEquals(
                "https://acmeclinic.dev.example-parent.test/public/sct/" + RAW_TOKEN,
                url);

        String shortUrl = resolver.resolveAbsoluteShortUrl(TENANT_ID, "k9P2mX");
        assertEquals("https://acmeclinic.dev.example-parent.test/s/k9P2mX", shortUrl);
    }

    @Test
    @DisplayName("테넌트 없음 — fail-closed")
    void resolveAbsolutePublicUrl_missingTenant_throws() {
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> resolver.resolveAbsolutePublicUrl(TENANT_ID, RAW_TOKEN));
        assertEquals("SCT 공개 링크용 테넌트 도메인을 확인할 수 없습니다.", ex.getMessage());
    }

    @Test
    @DisplayName("subdomain 공백 — fail-closed")
    void resolveAbsolutePublicUrl_blankSubdomain_throws() {
        Tenant tenant = Tenant.builder()
                .tenantId(TENANT_ID)
                .subdomain("   ")
                .name("Acme")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(tenant));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> resolver.resolveAbsolutePublicUrl(TENANT_ID, RAW_TOKEN));
        assertEquals("SCT 공개 링크용 테넌트 도메인을 확인할 수 없습니다.", ex.getMessage());
    }

    @Test
    @DisplayName("도메인 접미사 결정 실패 — fail-closed")
    void resolveAbsolutePublicUrl_suffixUnavailable_throws() {
        Tenant tenant = Tenant.builder()
                .tenantId(TENANT_ID)
                .subdomain("acme")
                .name("Acme")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(tenant));
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        when(oauth2DomainUtil.resolveEnvironmentTenantDomainSuffix(any(String[].class)))
                .thenThrow(new IllegalStateException("apex missing"));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> resolver.resolveAbsolutePublicUrl(TENANT_ID, RAW_TOKEN));
        assertEquals("SCT 공개 링크용 테넌트 도메인을 확인할 수 없습니다.", ex.getMessage());
    }

    @Test
    @DisplayName("토큰·URL·SMS 본문 마스킹 — 앞 6자만 노출")
    void maskingHelpers_keepTokenPrefixOnly() {
        String maskedToken = SctTenantPublicUrlResolver.maskTokenForLog(RAW_TOKEN);
        assertTrue(maskedToken.startsWith("abcdef"));
        assertEquals(RAW_TOKEN.length(), maskedToken.length());
        assertTrue(maskedToken.substring(6).chars().allMatch(c -> c == '*'));

        String absolute = "https://acme.dev.example.test/public/sct/" + RAW_TOKEN;
        String maskedUrl = SctTenantPublicUrlResolver.maskAbsoluteUrlForLog(absolute);
        assertEquals(
                "https://acme.dev.example.test/public/sct/" + maskedToken,
                maskedUrl);

        String message = "[마인드가든] 성인용 작성 요청입니다. 링크: " + absolute;
        String maskedMessage = SctTenantPublicUrlResolver.maskSmsMessageForLog(message, RAW_TOKEN);
        assertTrue(maskedMessage.contains(maskedToken));
        assertTrue(!maskedMessage.contains(RAW_TOKEN));

        assertEquals("010****5678", PhoneLogMasking.maskForLog("01012345678"));
    }
}
