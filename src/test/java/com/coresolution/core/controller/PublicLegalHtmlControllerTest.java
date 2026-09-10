package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.PublicConsultationPackageService;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.PlatformLegalCopyService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * 공개 법적 HTML 컨트롤러 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PublicLegalHtmlController")
class PublicLegalHtmlControllerTest {

    private static final String KNOWN_TERMS_PHRASE = "온라인 상담 서비스";

    @Mock
    private PublicConsultationPackageService publicConsultationPackageService;

    @Mock
    private TenantRepository tenantRepository;

    private PlatformLegalCopyService platformLegalCopyService;
    private PublicLegalHtmlController controller;

    @BeforeEach
    void setUp() {
        platformLegalCopyService = new PlatformLegalCopyService();
        controller = new PublicLegalHtmlController(
                platformLegalCopyService,
                publicConsultationPackageService,
                tenantRepository);
    }

    @Test
    @DisplayName("terms HTML 에 SSOT 알려진 문구가 포함된다")
    void terms_containsKnownPhraseFromSsot() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "app.core-solution.co.kr");

        ResponseEntity<String> response = controller.terms(request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getHeaders().getContentType())
                .isEqualTo(new MediaType("text", "html", java.nio.charset.StandardCharsets.UTF_8));
        assertThat(response.getBody()).contains(KNOWN_TERMS_PHRASE);
        assertThat(response.getBody()).contains("<article>");
        assertThat(response.getBody()).doesNotContain("MindGarden 이용약관");
    }

    @Test
    @DisplayName("MD SSOT 엔드포인트가 알려진 문구를 반환한다")
    void markdownEndpoint_containsKnownPhrase() {
        ResponseEntity<String> response = controller.platformLegalCopyMarkdown();
        assertThat(response.getBody()).contains(KNOWN_TERMS_PHRASE);
        assertThat(response.getBody()).contains("## terms");
        assertThat(response.getBody()).contains("## privacy");
    }

    @Test
    @DisplayName("products: 테넌트 없으면 빈 상태 문구")
    void products_emptyWhenTenantMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "app.core-solution.co.kr");

        ResponseEntity<String> response = controller.products(request);

        assertThat(response.getBody()).contains(PlatformLegalCopyService.EMPTY_STATE_KO);
        assertThat(response.getBody()).doesNotContain("<h2>");
    }

    @Test
    @DisplayName("products: 모킹된 패키지가 HTML에 나타난다")
    void products_rendersMockedPackages() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "clinic-a.dev.core-solution.co.kr");
        request.addHeader("X-Forwarded-Host", "clinic-a.dev.core-solution.co.kr");

        Tenant tenant = Tenant.builder()
                .tenantId("tenant-clinic-a")
                .name("클리닉A")
                .subdomain("clinic-a")
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(eq("clinic-a")))
                .thenReturn(Optional.of(tenant));
        when(publicConsultationPackageService.buildPublicConsultationPackages(eq("tenant-clinic-a")))
                .thenReturn(List.of(Map.of(
                        "name", "10회 패키지",
                        "description", "기본 상담 10회",
                        "price", 300000)));

        ResponseEntity<String> response = controller.products(request);

        assertThat(response.getBody()).contains("10회 패키지");
        assertThat(response.getBody()).contains("기본 상담 10회");
        assertThat(response.getBody()).contains("300,000원");
        assertThat(response.getBody()).doesNotContain(PlatformLegalCopyService.EMPTY_STATE_KO);
    }

    @Test
    @DisplayName("products: 서브도메인 테넌트 미존재 시 빈 상태")
    void products_emptyWhenSubdomainTenantNotFound() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "unknown.dev.core-solution.co.kr");
        when(tenantRepository.findBySubdomainIgnoreCase(eq("unknown")))
                .thenReturn(Optional.empty());

        ResponseEntity<String> response = controller.products(request);

        assertThat(response.getBody()).contains(PlatformLegalCopyService.EMPTY_STATE_KO);
    }
}
