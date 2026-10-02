package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PublicCounselingServiceGuideCopy;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView;
import com.coresolution.consultation.service.PublicConsultationPackageService;
import com.coresolution.consultation.service.PublicCounselingServiceGuideService;
import com.coresolution.consultation.util.PublicCounselingServiceGuideHtml;
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
import org.springframework.web.util.HtmlUtils;

/**
 * 공개 법적 HTML 컨트롤러 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PublicLegalHtmlController")
class PublicLegalHtmlControllerTest {

    private static final String KNOWN_TERMS_PHRASE = "상담센터 SaaS";
    private static final String PAYMENT_TYPE_NOTE =
            "카드 결제이며, 5만 원 이상은 할부가 가능합니다. 정기결제·구독은 없습니다.";
    /** 운영 vhost regex server_name. 요청 호스트가 아니다. */
    private static final String NGINX_REGEX_SERVER_NAME =
            "~^" + "[^.]" + "+\\.core-solution\\.co\\.kr$";
    /** 테스트 스위트에 이미 있는 운영 호스트 형태. */
    private static final String MINDGARDEN_HOST = "mindgarden.core-solution.co.kr";
    private static final String OTHER_HOST = "clinic-a.dev.core-solution.co.kr";

    @Mock
    private PublicConsultationPackageService publicConsultationPackageService;

    @Mock
    private PublicCounselingServiceGuideService publicCounselingServiceGuideService;

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
                publicCounselingServiceGuideService,
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
        assertThat(response.getBody()).contains("단회기: 결제일부터 2개월 내 소진");
        assertThat(response.getBody()).contains("10회기: 결제일부터 3개월 내 소진");
        assertThat(response.getBody()).contains("20회기: 결제일부터 6개월 내 소진");
        assertThat(response.getBody()).contains(HtmlUtils.htmlEscape(PAYMENT_TYPE_NOTE));
        assertThat(response.getBody()).doesNotContain("일시불만");
        assertThat(response.getBody()).contains(HtmlUtils.htmlEscape("정기결제·구독은 없습니다"));
        assertThat(response.getBody()).doesNotContain("1년 내 소진");
        assertThat(response.getBody()).contains("<article>");
        assertThat(response.getBody()).doesNotContain("MindGarden 이용약관");
        assertThat(response.getBody()).contains("id=\"refund\"");
    }

    @Test
    @DisplayName("MD SSOT 엔드포인트가 알려진 문구를 반환한다")
    void markdownEndpoint_containsKnownPhrase() {
        ResponseEntity<String> response = controller.platformLegalCopyMarkdown();
        assertThat(response.getBody()).contains(KNOWN_TERMS_PHRASE);
        assertThat(response.getBody()).contains("## terms");
        assertThat(response.getBody()).contains("## privacy");
        assertThat(response.getBody()).contains("## refund");
    }

    @Test
    @DisplayName("refund: 테넌트 문구 없으면 플랫폼 SSOT 폴백")
    void refund_fallsBackToPlatformSsotWhenTenantEmpty() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "app.core-solution.co.kr");

        ResponseEntity<String> response = controller.refund(request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).contains("청약철회 기간");
        assertThat(response.getBody()).contains("단회기는 결제일부터 2개월 내");
        assertThat(response.getBody()).contains("10회기는 결제일부터 3개월 내");
        assertThat(response.getBody()).contains("20회기는 결제일부터 6개월 내");
        assertThat(response.getBody()).contains(HtmlUtils.htmlEscape(PAYMENT_TYPE_NOTE));
        assertThat(response.getBody()).doesNotContain("일시불만");
        assertThat(response.getBody()).contains(HtmlUtils.htmlEscape("정기결제·구독은 없습니다"));
        assertThat(response.getBody()).doesNotContain("1년 내에 소진");
        assertThat(response.getBody()).contains("청약철회가 제한되는 경우");
        assertThat(response.getBody()).contains("환불");
        assertThat(response.getBody()).contains("절차");
        assertThat(response.getBody()).contains("문의");
    }

    @Test
    @DisplayName("refund: 테넌트 refundPolicyText가 있으면 우선 노출")
    void refund_prefersTenantRefundPolicyText() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "clinic-a.dev.core-solution.co.kr");
        request.addHeader("X-Forwarded-Host", "clinic-a.dev.core-solution.co.kr");

        Tenant tenant = Tenant.builder()
                .tenantId("tenant-clinic-a")
                .name("클리닉A")
                .subdomain("clinic-a")
                .refundPolicyText("센터 전용 환불: 14일 이내만 가능")
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(eq("clinic-a")))
                .thenReturn(Optional.of(tenant));

        ResponseEntity<String> response = controller.refund(request);

        assertThat(response.getBody()).contains("센터 전용 환불: 14일 이내만 가능");
        assertThat(response.getBody()).doesNotContain("청약철회 기간");
    }

    @Test
    @DisplayName("products: 테넌트 없으면 빈 상태 문구")
    void products_emptyWhenTenantMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "app.core-solution.co.kr");

        ResponseEntity<String> response = controller.products(request);

        assertThat(response.getBody()).contains(PlatformLegalCopyService.EMPTY_STATE_KO);
        assertThat(response.getBody()).doesNotContain("<h2>");
        assertProductsDisclosureNotes(response.getBody());
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
        String body = response.getBody();

        assertThat(body).contains("10회 패키지");
        assertThat(body).contains("기본 상담 10회");
        assertThat(body).contains("300,000원");
        assertThat(body).doesNotContain(PlatformLegalCopyService.EMPTY_STATE_KO);
        assertProductsDisclosureNotes(body);
        assertThat(body.indexOf(HtmlUtils.htmlEscape(
                PlatformLegalCopyService.CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE)))
                .isLessThan(body.indexOf("<ul>"));
        assertThat(body).contains("href=\"" + PublicCounselingServiceGuideHtml.PATH + "\"");
        assertThat(body).contains(PublicCounselingServiceGuideHtml.DETAIL_LINK_LABEL);
    }

    @Test
    @DisplayName("services: 로그인 없이 여섯 섹션 HTML")
    void services_rendersGuideHtmlWithoutLogin() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "clinic-a.dev.core-solution.co.kr");
        request.addHeader("X-Forwarded-Host", "clinic-a.dev.core-solution.co.kr");
        request.addHeader("X-Forwarded-Proto", "https");

        Tenant tenant = Tenant.builder()
                .tenantId("tenant-clinic-a")
                .name("클리닉A")
                .subdomain("clinic-a")
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(eq("clinic-a")))
                .thenReturn(Optional.of(tenant));

        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setTenantKey("clinic-a");
        view.setCenterName("클리닉A");
        view.setOneLiner("한 줄 정의");
        view.setPaymentNote(PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불 요약입니다.");
        view.setPageTitle("상담 서비스 안내 · 클리닉A");
        view.setPageDescription("설명");
        view.setCanonicalUrl("https://clinic-a.dev.core-solution.co.kr/services");
        when(publicCounselingServiceGuideService.load(
                eq(tenant), eq("https://clinic-a.dev.core-solution.co.kr/services")))
                .thenReturn(view);

        ResponseEntity<String> response = controller.services(request);
        String body = response.getBody();

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(body).doesNotContain("<h2>센터 소개</h2>");
        assertThat(body).doesNotContain("<h2>진행 절차</h2>");
        assertThat(body).doesNotContain("마인드가든");
        assertThat(body).doesNotContain("김선희");
        assertThat(body).doesNotContain("032-724-8501");
        assertThat(body).doesNotContain("010-7923-8501");
        assertThat(body).doesNotContain("해돋이로");
        assertThat(body).doesNotContain("트리니티 심리상담연구소");
        assertThat(body).doesNotContain("청소년교육 학사");
        assertThat(body).contains("<h2>상품·가격</h2>");
        assertThat(body).contains("<h2>환불·개인정보</h2>");
        assertThat(body).contains("href=\"/legal/terms#refund\"");
        assertThat(body).contains("href=\"/legal/privacy\"");
        assertThat(body).contains(HtmlUtils.htmlEscape(PAYMENT_TYPE_NOTE));
        assertThat(body).doesNotContain("일시불만");
        assertThat(body).doesNotContain("location.href");
    }

    @Test
    @DisplayName("services: mindgarden 키는 센터 안내를 싣는다")
    void services_rendersMindgardenGuideForMindgardenKey() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", "mindgarden.dev.core-solution.co.kr");
        request.addHeader("X-Forwarded-Host", "mindgarden.dev.core-solution.co.kr");
        request.addHeader("X-Forwarded-Proto", "https");

        Tenant tenant = Tenant.builder()
                .tenantId("tenant-mg")
                .name("마음센터")
                .subdomain("mindgarden")
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(eq("mindgarden")))
                .thenReturn(Optional.of(tenant));

        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setTenantKey("mindgarden");
        view.setCenterName("마음센터");
        view.setOneLiner("한 줄 정의");
        view.setPaymentNote(PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불 요약입니다.");
        view.setPageTitle("상담 서비스 안내 · 마음센터");
        view.setPageDescription("설명");
        when(publicCounselingServiceGuideService.load(
                eq(tenant), eq("https://mindgarden.dev.core-solution.co.kr/services")))
                .thenReturn(view);

        String body = controller.services(request).getBody();

        assertThat(body).contains("<h2>센터 소개</h2>");
        assertThat(body).contains("<h2>상담사 소개</h2>");
        assertThat(body).contains("마인드가든 심리상담센터");
        assertThat(body).contains("김선희");
        assertThat(body).contains("032-724-8501");
        assertThat(body).contains("15년 이상 임상 경험을 갖춘 대표원장이 직접 상담합니다.");
        assertThat(body).contains(HtmlUtils.htmlEscape(
                "주중 10:00–20:00, 토요일 10:00–17:00, 일요일 정기휴무"));
        assertThat(body).doesNotContain("010-7923-8501");
        assertThat(body).doesNotContain("센터장이 직접 상담합니다.");
    }

    @Test
    @DisplayName("services: regex 전달 호스트는 테넌트가 아니고 요청 Host 안내와 canonical 을 쓴다")
    void services_regexForwardedHostUsesRequestHostForMindgardenGuide() {
        MockHttpServletRequest request = regexForwardedRequest(MINDGARDEN_HOST);
        Tenant tenant = Tenant.builder()
                .tenantId("tenant-mg")
                .name("마음센터")
                .subdomain("mindgarden")
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(eq("mindgarden")))
                .thenReturn(Optional.of(tenant));
        String canonical = "https://" + MINDGARDEN_HOST + PublicCounselingServiceGuideHtml.PATH;
        when(publicCounselingServiceGuideService.load(eq(tenant), eq(canonical)))
                .thenReturn(guideView("mindgarden", "마음센터", canonical));

        String body = controller.services(request).getBody();

        assertThat(body).contains("<h2>센터 소개</h2>");
        assertThat(body).contains("마인드가든 심리상담센터");
        assertThat(body).contains("김선희");
        assertThat(body).contains("032-724-8501");
        assertThat(body).doesNotContain("010-7923-8501");
        assertThat(body).contains("rel=\"canonical\" href=\"" + canonical + "\"");
        assertThat(body).doesNotContain("~^");
        verify(tenantRepository).findBySubdomainIgnoreCase(eq("mindgarden"));
    }

    @Test
    @DisplayName("services: 서버 이름과 전달 호스트가 regex 이면 테넌트로 보지 않는다")
    void services_regexServerNameAndForwardedHostAreNotATenant() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName(NGINX_REGEX_SERVER_NAME);
        request.addHeader("Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Proto", "https");
        when(publicCounselingServiceGuideService.load(isNull(), eq("")))
                .thenReturn(guideView("", "", ""));

        String body = controller.services(request).getBody();

        assertThat(body).contains(PublicCounselingServiceGuideCopy.EMPTY_GUIDE_LINE);
        assertThat(body).doesNotContain("마인드가든 심리상담센터");
        assertThat(body).doesNotContain("김선희");
        assertThat(body).doesNotContain("032-724-8501");
        assertThat(body).doesNotContain("~^");
        assertThat(body).doesNotContain("rel=\"canonical\"");
        verify(tenantRepository, never()).findBySubdomainIgnoreCase(anyString());
    }

    @Test
    @DisplayName("services: 다른 호스트는 마인드가든 센터명·상담사·전화를 그리지 않는다")
    void services_otherHostDoesNotRenderMindgardenIdentity() {
        MockHttpServletRequest request = regexForwardedRequest(OTHER_HOST);
        Tenant tenant = Tenant.builder()
                .tenantId("tenant-clinic-a")
                .name("클리닉A")
                .subdomain("clinic-a")
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(eq("clinic-a")))
                .thenReturn(Optional.of(tenant));
        String canonical = "https://" + OTHER_HOST + PublicCounselingServiceGuideHtml.PATH;
        when(publicCounselingServiceGuideService.load(eq(tenant), eq(canonical)))
                .thenReturn(guideView("clinic-a", "클리닉A", canonical));

        String body = controller.services(request).getBody();

        assertThat(body).contains("클리닉A");
        assertThat(body).contains("rel=\"canonical\" href=\"" + canonical + "\"");
        assertThat(body).doesNotContain("마인드가든 심리상담센터");
        assertThat(body).doesNotContain("김선희");
        assertThat(body).doesNotContain("032-724-8501");
        assertThat(body).doesNotContain("010-7923-8501");
        assertThat(body).doesNotContain("~^");
        verify(tenantRepository, never()).findBySubdomainIgnoreCase(eq("mindgarden"));
    }

    @Test
    @DisplayName("products: regex 전달 호스트는 테넌트가 아니고 요청 Host 상품을 싣는다")
    void products_regexForwardedHostUsesRequestHost() {
        MockHttpServletRequest request = regexForwardedRequest(OTHER_HOST);
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

        String body = controller.products(request).getBody();

        assertThat(body).contains("10회 패키지");
        assertThat(body).doesNotContain("~^");
        verify(tenantRepository, never()).findBySubdomainIgnoreCase(eq("mindgarden"));
    }

    @Test
    @DisplayName("products: 서버 이름과 전달 호스트가 regex 이면 빈 상태")
    void products_regexServerNameIsEmpty() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName(NGINX_REGEX_SERVER_NAME);
        request.addHeader("Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);

        String body = controller.products(request).getBody();

        assertThat(body).contains(PlatformLegalCopyService.EMPTY_STATE_KO);
        assertThat(body).doesNotContain("~^");
        verify(tenantRepository, never()).findBySubdomainIgnoreCase(anyString());
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
        assertProductsDisclosureNotes(response.getBody());
    }

    private static MockHttpServletRequest regexForwardedRequest(String requestHost) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName(NGINX_REGEX_SERVER_NAME);
        request.addHeader("Host", requestHost);
        request.addHeader("X-Forwarded-Host", NGINX_REGEX_SERVER_NAME);
        request.addHeader("X-Forwarded-Proto", "https");
        return request;
    }

    private static PublicCounselingServiceGuideView guideView(
            String tenantKey, String centerName, String canonicalUrl) {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setTenantKey(tenantKey);
        view.setCenterName(centerName);
        view.setOneLiner("한 줄 정의");
        view.setPaymentNote(PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불 요약입니다.");
        view.setPageTitle("상담 서비스 안내");
        view.setPageDescription("설명");
        view.setCanonicalUrl(canonicalUrl);
        return view;
    }

    private static void assertProductsDisclosureNotes(String html) {
        assertThat(html).contains(HtmlUtils.htmlEscape(
                PlatformLegalCopyService.CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE));
        assertThat(html).contains(HtmlUtils.htmlEscape(
                PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE));
        assertThat(html).contains("2개월");
        assertThat(html).contains("3개월");
        assertThat(html).contains("6개월");
        assertThat(html).doesNotContain("1년");
        assertThat(html).contains(HtmlUtils.htmlEscape(PAYMENT_TYPE_NOTE));
        assertThat(html).doesNotContain("일시불만");
        assertThat(html).contains(HtmlUtils.htmlEscape("정기결제·구독은 없습니다"));
        assertThat(html).contains("무제한");
    }
}
