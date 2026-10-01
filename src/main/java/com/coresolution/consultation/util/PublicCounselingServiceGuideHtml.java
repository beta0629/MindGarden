package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.PublicCounselingServiceGuideCopy;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.ProductRow;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.TypeCard;
import com.coresolution.consultation.service.PublicCounselingServiceGuideService;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import org.springframework.web.util.HtmlUtils;

/**
 * 공개 /services 첫 HTML. 색은 시스템 색만 쓰고 hex 를 넣지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
public final class PublicCounselingServiceGuideHtml {

    public static final String PATH = "/services";

    public static final String LOGIN_NEXT = "/login?next=/client/shop";

    public static final String PROCESS_APPLY =
            "전화로 상담을 신청해요. 상담 일정은 센터에서 연락드려요.";

    public static final String PROCESS_INTAKE =
            "첫 만남에서 지금의 어려움과 바라는 점을 듣고 상담 방향을 함께 정해요.";

    public static final String PROCESS_CLOSE =
            "목표를 함께 돌아보고 상담을 마무리해요.";

    public static final String TYPES_LEAD = "센터에서 받을 수 있는 상담이에요.";

    public static final String PRODUCTS_LEAD =
            "온라인으로 구매할 수 있는 상담 회기예요. 결제는 카드 결제만 가능해요.";

    public static final String COUNSELOR_LEAD = "센터 상담사의 자격이에요.";

    public static final String BUY_LINK_LABEL = "로그인하고 회기 구매하기 ›";

    public static final String DETAIL_LINK_LABEL = "상담 서비스 자세히 보기 ›";

    private PublicCounselingServiceGuideHtml() {
    }

    /**
     * 전체 HTML 문서.
     *
     * @param view 공개 모델
     * @return text/html 본문
     */
    public static String render(PublicCounselingServiceGuideView view) {
        Integer minutes = PublicCounselingServiceGuideService.sharedMinutes(view.getTypes());
        String title = escape(view.getPageTitle());
        String description = escape(view.getPageDescription());
        String canonical = escape(view.getCanonicalUrl());

        StringBuilder body = new StringBuilder();
        body.append("<header class=\"svc-header\">");
        body.append("<p class=\"svc-brand\">").append(escape(displayCenter(view))).append("</p>");
        body.append("<a href=\"/login\">로그인</a>");
        body.append("</header>");
        body.append("<main class=\"svc-stage\">");
        body.append("<p class=\"svc-eyebrow\">상담 서비스 안내</p>");
        body.append("<h1>").append(escape(heroTitle(view))).append("</h1>");
        body.append("<p class=\"svc-def\">").append(escape(view.getOneLiner())).append("</p>");
        body.append(chips(view, minutes));
        if (!blank(view.getBusinessLandline())) {
            body.append("<p><a href=\"tel:")
                    .append(escape(telHref(view.getBusinessLandline())))
                    .append("\">전화 문의 ")
                    .append(escape(view.getBusinessLandline()))
                    .append("</a></p>");
        }
        body.append(nav());
        body.append(centerSection(view));
        body.append(typesSection(view.getTypes()));
        body.append(processSection());
        body.append(counselorsSection());
        body.append(productsSection(view));
        body.append(policySection(view));
        body.append("</main>");

        return "<!DOCTYPE html>\n"
                + "<html lang=\"ko\">\n<head>\n"
                + "<meta charset=\"UTF-8\">\n"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
                + "<meta name=\"robots\" content=\"index\">\n"
                + "<title>" + title + "</title>\n"
                + "<meta name=\"description\" content=\"" + description + "\">\n"
                + (canonical.isBlank() ? "" : "<link rel=\"canonical\" href=\"" + canonical + "\">\n")
                + "<meta property=\"og:title\" content=\"" + title + "\">\n"
                + "<meta property=\"og:description\" content=\"" + description + "\">\n"
                + "<style>" + STYLES + "</style>\n"
                + "</head>\n<body>\n"
                + body
                + "\n</body>\n</html>\n";
    }

    private static String centerSection(PublicCounselingServiceGuideView view) {
        StringBuilder sb = new StringBuilder();
        sb.append("<section id=\"center\"><h2>센터 소개</h2>");
        if (!blank(view.getCenterIntro())) {
            sb.append("<p>").append(escape(view.getCenterIntro())).append("</p>");
        }
        sb.append("<dl>");
        row(sb, "센터명", PublicCounselingServiceGuideCopy.CENTER_NAME);
        row(sb, "주소", PublicCounselingServiceGuideCopy.CENTER_ADDRESS);
        sb.append("<dt>전화</dt><dd><a href=\"tel:")
                .append(escape(telHref(PublicCounselingServiceGuideCopy.CENTER_PHONE)))
                .append("\">")
                .append(escape(PublicCounselingServiceGuideCopy.CENTER_PHONE))
                .append("</a></dd>");
        row(sb, "운영시간", PublicCounselingServiceGuideCopy.CENTER_HOURS);
        row(sb, "대표", view.getRepresentativeName());
        row(sb, "사업자등록번호", view.getBusinessRegistrationNumber());
        row(sb, "통신판매신고번호", view.getMailOrderReportNumber());
        sb.append("</dl></section>");
        return sb.toString();
    }

    private static String typesSection(List<TypeCard> extra) {
        StringBuilder sb = new StringBuilder();
        sb.append("<section id=\"types\"><h2>상담 종류</h2><ul>");
        for (String line : PublicCounselingServiceGuideCopy.COUNSELING_TYPES) {
            sb.append("<li>").append(escape(line)).append("</li>");
        }
        sb.append("</ul><p>")
                .append(escape(PublicCounselingServiceGuideCopy.COMMON_NOTICE))
                .append("</p>");
        if (extra != null && !extra.isEmpty()) {
            sb.append("<div class=\"svc-grid\">");
            for (TypeCard type : extra) {
                if (blank(type.getName())) {
                    continue;
                }
                sb.append("<article><h3>").append(escape(type.getName())).append("</h3>");
                if (!blank(type.getDescription())) {
                    sb.append("<p>").append(escape(type.getDescription())).append("</p>");
                }
                sb.append("</article>");
            }
            sb.append("</div>");
        }
        sb.append("</section>");
        return sb.toString();
    }

    private static String processSection() {
        StringBuilder sb = new StringBuilder();
        sb.append("<section id=\"process\"><h2>진행 절차</h2><p>")
                .append(escape(PublicCounselingServiceGuideCopy.PROCESS_LINE))
                .append("</p><ol>");
        int index = 1;
        for (String step : PublicCounselingServiceGuideCopy.PROCESS_STEPS) {
            sb.append(step(index, step, ""));
            index += 1;
        }
        sb.append("</ol></section>");
        return sb.toString();
    }

    private static String counselorsSection() {
        return "<section id=\"counselors\"><h2>상담사 소개</h2><p>"
                + escape(PublicCounselingServiceGuideCopy.COUNSELOR_INTRO)
                + "</p></section>";
    }

    private static String productsSection(PublicCounselingServiceGuideView view) {
        StringBuilder sb = new StringBuilder();
        sb.append("<section id=\"products\"><h2>상품·가격</h2>");
        sb.append("<p>").append(PRODUCTS_LEAD).append("</p>");
        List<ProductRow> products = view.getProducts();
        if (products == null || products.isEmpty()) {
            String phone = view.getBusinessLandline();
            String empty = blank(phone)
                    ? "지금 온라인으로 구매할 수 있는 상품이 없어요. 상담은 센터에 문의해 주세요."
                    : "지금 온라인으로 구매할 수 있는 상품이 없어요. 상담은 " + phone + "로 문의해 주세요.";
            sb.append("<p>").append(escape(empty)).append("</p>");
        } else {
            String caption = escape(displayCenter(view)) + " 상담 상품과 가격";
            sb.append("<table class=\"svc-product-table\"><caption class=\"sr-only\">")
                    .append(caption).append("</caption><thead><tr>");
            sb.append("<th scope=\"col\">상품</th><th scope=\"col\">구성</th>");
            sb.append("<th scope=\"col\">이용기간</th><th scope=\"col\">가격</th>");
            sb.append("</tr></thead><tbody>");
            NumberFormat format = NumberFormat.getInstance(Locale.KOREA);
            StringBuilder cards = new StringBuilder();
            cards.append("<div class=\"svc-product-cards\">");
            for (ProductRow row : products) {
                String period = PublicCounselingUsagePeriod.label(
                        row.getValidityMonths(), row.getSessions());
                String sessions = PublicCounselingUsagePeriod.sessionsLabel(row.getSessions());
                String price = priceLabel(row.getPrice(), format);
                sb.append("<tr><td><strong>").append(escape(row.getName())).append("</strong>");
                if (!blank(row.getDescription())) {
                    sb.append("<br>").append(escape(row.getDescription()));
                }
                sb.append("</td><td>").append(escape(composition(row))).append("</td><td>");
                sb.append(escape(period)).append("</td><td>").append(escape(price));
                sb.append("</td></tr>");
                cards.append("<article class=\"svc-product-card\"><h3>")
                        .append(escape(row.getName())).append("</h3><dl>");
                cards.append(cardRow(PublicCounselingServiceGuideCopy.LABEL_PRODUCT_NAME, row.getName()));
                cards.append(cardRow(PublicCounselingServiceGuideCopy.LABEL_SESSIONS, sessions));
                cards.append(cardRow(PublicCounselingServiceGuideCopy.LABEL_PRICE, price));
                cards.append(cardRow(PublicCounselingServiceGuideCopy.LABEL_PERIOD, period));
                cards.append("</dl></article>");
            }
            sb.append("</tbody></table>");
            cards.append("</div>");
            sb.append(cards);
        }
        sb.append("<p>").append(escape(view.getPaymentNote())).append("</p>");
        sb.append("<p><a href=\"").append(LOGIN_NEXT).append("\">")
                .append(BUY_LINK_LABEL).append("</a></p>");
        sb.append("</section>");
        return sb.toString();
    }

    private static String policySection(PublicCounselingServiceGuideView view) {
        return "<section id=\"policy\"><h2>환불·개인정보</h2>"
                + "<h3>환불 규정 요약</h3>"
                + "<p>" + escape(view.getRefundBody()) + "</p>"
                + "<ul>"
                + linkItem("환불 규정 전문", "/legal/terms#refund")
                + linkItem("이용약관", "/legal/terms")
                + linkItem("개인정보처리방침", "/legal/privacy")
                + linkItem("상품·가격 안내", "/legal/products")
                + "</ul></section>";
    }

    private static String nav() {
        return "<nav aria-label=\"페이지 안 이동\">"
                + anchor("center", "센터 소개")
                + anchor("types", "상담 종류")
                + anchor("process", "진행 절차")
                + anchor("counselors", "상담사")
                + anchor("products", "상품·가격")
                + anchor("policy", "환불·개인정보")
                + "</nav>";
    }

    private static String chips(PublicCounselingServiceGuideView view, Integer minutes) {
        boolean face = false;
        boolean remote = false;
        if (view.getTypes() != null) {
            for (TypeCard type : view.getTypes()) {
                String modality = type.getModality() == null ? "" : type.getModality();
                if (modality.contains("비대면")) {
                    remote = true;
                }
                if (modality.replace("비대면", "").contains("대면")) {
                    face = true;
                }
            }
        }
        StringBuilder sb = new StringBuilder();
        sb.append("<ul class=\"svc-chips\">");
        if (face) {
            sb.append("<li>대면 상담</li>");
        }
        if (remote) {
            sb.append("<li>비대면 상담</li>");
        }
        if (minutes != null) {
            sb.append("<li>1회 ").append(minutes).append("분</li>");
        }
        sb.append("<li>카드 결제</li></ul>");
        return sb.toString();
    }

    private static String composition(ProductRow row) {
        StringBuilder sb = new StringBuilder();
        if (row.getSessions() != null) {
            sb.append(row.getSessions()).append("회기");
        }
        if (row.getMinutes() != null) {
            if (!sb.isEmpty()) {
                sb.append(" · ");
            }
            sb.append("1회 ").append(row.getMinutes()).append("분");
        }
        return sb.toString();
    }

    private static String priceLabel(Long price, NumberFormat format) {
        if (price == null) {
            return "";
        }
        return format.format(price) + "원";
    }

    private static String cardRow(String label, String value) {
        return "<dt>" + escape(label) + "</dt><dd>" + escape(value == null ? "" : value) + "</dd>";
    }

    private static String heroTitle(PublicCounselingServiceGuideView view) {
        if (blank(view.getCenterName())) {
            return "심리상담 서비스 안내";
        }
        return view.getCenterName() + " 심리상담 서비스 안내";
    }

    private static String displayCenter(PublicCounselingServiceGuideView view) {
        return blank(view.getCenterName()) ? "상담 서비스" : view.getCenterName();
    }

    private static void row(StringBuilder sb, String label, String value) {
        if (blank(value)) {
            return;
        }
        sb.append("<dt>").append(escape(label)).append("</dt><dd>")
                .append(escape(value)).append("</dd>");
    }

    private static String step(int index, String title, String body) {
        String text = "<li><h3>" + index + ". " + escape(title) + "</h3>";
        if (blank(body)) {
            return text + "</li>";
        }
        return text + "<p>" + escape(body) + "</p></li>";
    }

    private static String anchor(String id, String label) {
        return "<a href=\"#" + id + "\">" + label + "</a> ";
    }

    private static String linkItem(String label, String href) {
        return "<li><a href=\"" + href + "\">" + label + "</a></li>";
    }

    private static String telHref(String phone) {
        return phone.replace(" ", "");
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private static final String STYLES = ""
            + "body{margin:0;color:CanvasText;background:Canvas;font-family:system-ui,sans-serif;}"
            + ".svc-header{display:flex;justify-content:space-between;align-items:center;"
            + "min-height:4rem;padding:0 1rem;}"
            + ".svc-stage{max-width:57.5rem;margin:0 auto;padding:1.25rem 1rem 2.5rem;}"
            + "h1,h2,h3{font-weight:800;line-height:1.3;}"
            + "a:focus{outline:2px solid CanvasText;outline-offset:2px;}"
            + "table{width:100%;border-collapse:collapse;}"
            + "th,td{text-align:left;padding:0.75rem 0;border-bottom:1px solid GrayText;}"
            + ".sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;"
            + "clip:rect(0,0,0,0);white-space:nowrap;border:0;}"
            + ".svc-chips{display:flex;flex-wrap:wrap;gap:0.5rem;padding:0;list-style:none;}"
            + ".svc-chips li{padding:0.25rem 0.6rem;border-radius:0.5rem;background:Canvas;}"
            + "@media (min-width:48rem){.svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}}"
            + ".svc-product-cards{display:none;}"
            + ".svc-product-card{margin:0 0 1rem;padding:1rem;border:1px solid GrayText;}"
            + "@media (max-width:47.99rem){"
            + ".svc-product-table, .svc-product-table thead, .svc-product-table tbody,"
            + ".svc-product-table tr, .svc-product-table th, .svc-product-table td{display:block;}}"
            + "@media (max-width:24.375rem){"
            + ".svc-product-table{display:none;}"
            + ".svc-product-cards{display:block;}}";
}
