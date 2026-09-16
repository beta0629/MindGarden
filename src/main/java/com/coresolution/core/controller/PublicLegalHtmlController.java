package com.coresolution.core.controller;

import com.coresolution.consultation.service.PublicConsultationPackageService;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.PlatformLegalCopyService;
import com.coresolution.core.util.TenantHostSubdomainUtil;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 크롤러용 공개 법적 HTML (text/html).
 * {@code /legal/terms|privacy|products|refund} — nginx {@code ^~ /legal/} 로 BE 프록시.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class PublicLegalHtmlController {

    private static final String TITLE_TERMS = "이용약관";
    private static final String TITLE_PRIVACY = "개인정보처리방침";
    private static final String TITLE_PRODUCTS = "상품·가격";
    private static final String TITLE_REFUND = "환불·취소·청약철회";
    private static final MediaType TEXT_HTML_UTF8 =
            new MediaType("text", "html", StandardCharsets.UTF_8);

    private final PlatformLegalCopyService platformLegalCopyService;
    private final PublicConsultationPackageService publicConsultationPackageService;
    private final TenantRepository tenantRepository;

    /**
     * 플랫폼 약관 MD SSOT (SPA·크롤러 공통). nginx {@code ^~ /legal/} 프록시 하에서도 동일 경로 유지.
     *
     * @return text/markdown
     */
    @GetMapping(value = "/legal/clinic-os-platform-legal-copy.md",
            produces = "text/markdown;charset=UTF-8")
    public ResponseEntity<String> platformLegalCopyMarkdown() {
        String markdown = platformLegalCopyService.loadMarkdown();
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "markdown", StandardCharsets.UTF_8))
                .body(markdown == null ? "" : markdown);
    }

    /**
     * 플랫폼 이용약관 HTML.
     *
     * @param request Host / X-Forwarded-Host (약관은 테넌트 무관, 플랫폼 SSOT)
     * @return text/html
     */
    @GetMapping(value = "/legal/terms", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> terms(HttpServletRequest request) {
        return legalSectionHtml(PlatformLegalCopyService.SECTION_TERMS, TITLE_TERMS);
    }

    /**
     * 플랫폼 개인정보처리방침 HTML.
     *
     * @param request Host / X-Forwarded-Host
     * @return text/html
     */
    @GetMapping(value = "/legal/privacy", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> privacy(HttpServletRequest request) {
        return legalSectionHtml(PlatformLegalCopyService.SECTION_PRIVACY, TITLE_PRIVACY);
    }

    /**
     * 테넌트 CONSULTATION_PACKAGE 공개 목록 HTML.
     * apex·테넌트 미해석·패키지 없음 → 「미등록 / 확인 필요」(fail-closed).
     *
     * @param request Host / X-Forwarded-Host
     * @return text/html
     */
    @GetMapping(value = "/legal/products", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> products(HttpServletRequest request) {
        String subdomain = TenantHostSubdomainUtil.extractTenantSubdomain(request);
        List<Map<String, Object>> packages = List.of();
        if (subdomain != null && !subdomain.isBlank()) {
            Optional<Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase(subdomain);
            if (tenantOpt.isPresent()) {
                packages = publicConsultationPackageService
                        .buildPublicConsultationPackages(tenantOpt.get().getTenantId());
            } else {
                log.warn("legal/products: 서브도메인 테넌트 없음 subdomain={}", subdomain);
            }
        } else {
            log.debug("legal/products: apex/비테넌트 Host — 빈 상태");
        }
        String body = renderProductsBody(packages);
        String html = platformLegalCopyService.wrapDocument(TITLE_PRODUCTS, body);
        return ResponseEntity.ok().contentType(TEXT_HTML_UTF8).body(html);
    }

    /**
     * 청약철회·환불 공개 안내 HTML.
     * 테넌트 {@code refundPolicyText} 우선, 없으면 플랫폼 {@code ## refund} SSOT.
     *
     * @param request Host / X-Forwarded-Host
     * @return text/html
     */
    @GetMapping(value = "/legal/refund", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> refund(HttpServletRequest request) {
        String subdomain = TenantHostSubdomainUtil.extractTenantSubdomain(request);
        String tenantRefund = null;
        if (subdomain != null && !subdomain.isBlank()) {
            Optional<Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase(subdomain);
            if (tenantOpt.isPresent()) {
                String raw = tenantOpt.get().getRefundPolicyText();
                if (raw != null && !raw.isBlank()) {
                    tenantRefund = raw.trim();
                }
            } else {
                log.warn("legal/refund: 서브도메인 테넌트 없음 subdomain={}", subdomain);
            }
        } else {
            log.debug("legal/refund: apex/비테넌트 Host — 플랫폼 SSOT 폴백");
        }

        String bodyHtml;
        if (tenantRefund != null) {
            bodyHtml = "<p>" + HtmlUtils.htmlEscape(tenantRefund).replace("\n", "<br/>") + "</p>";
        } else {
            String markdown = platformLegalCopyService.loadMarkdown();
            String section = platformLegalCopyService.extractSection(
                    markdown, PlatformLegalCopyService.SECTION_REFUND);
            bodyHtml = platformLegalCopyService.renderQuietHtml(section);
        }
        String html = platformLegalCopyService.wrapDocument(TITLE_REFUND, bodyHtml);
        return ResponseEntity.ok().contentType(TEXT_HTML_UTF8).body(html);
    }

    private ResponseEntity<String> legalSectionHtml(String sectionKey, String title) {
        String markdown = platformLegalCopyService.loadMarkdown();
        String section = platformLegalCopyService.extractSection(markdown, sectionKey);
        String bodyHtml = platformLegalCopyService.renderQuietHtml(section);
        String html = platformLegalCopyService.wrapDocument(title, bodyHtml);
        return ResponseEntity.ok().contentType(TEXT_HTML_UTF8).body(html);
    }

    private String renderProductsBody(List<Map<String, Object>> packages) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p>")
                .append(HtmlUtils.htmlEscape(
                        PlatformLegalCopyService.CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE))
                .append("</p>\n");
        sb.append("<p>")
                .append(HtmlUtils.htmlEscape(
                        PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE))
                .append("</p>\n");
        if (packages == null || packages.isEmpty()) {
            sb.append("<p>")
                    .append(HtmlUtils.htmlEscape(PlatformLegalCopyService.EMPTY_STATE_KO))
                    .append("</p>");
            return sb.toString();
        }
        sb.append("<ul>\n");
        NumberFormat priceFormat = NumberFormat.getInstance(Locale.KOREA);
        for (Map<String, Object> pkg : packages) {
            String name = pkg.get("name") != null ? String.valueOf(pkg.get("name")) : "";
            String description = pkg.get("description") != null
                    ? String.valueOf(pkg.get("description")) : "";
            String priceText = formatPrice(pkg.get("price"), priceFormat);
            sb.append("<li>\n");
            sb.append("<section>\n");
            sb.append("<h2>").append(HtmlUtils.htmlEscape(name)).append("</h2>\n");
            if (!description.isBlank()) {
                sb.append("<p>").append(HtmlUtils.htmlEscape(description)).append("</p>\n");
            }
            if (!priceText.isEmpty()) {
                sb.append("<p>").append(HtmlUtils.htmlEscape(priceText)).append("</p>\n");
            }
            sb.append("</section>\n");
            sb.append("</li>\n");
        }
        sb.append("</ul>");
        return sb.toString();
    }

    private static String formatPrice(Object priceObj, NumberFormat priceFormat) {
        if (!(priceObj instanceof Number number)) {
            return "";
        }
        return priceFormat.format(number.longValue()) + "원";
    }
}
