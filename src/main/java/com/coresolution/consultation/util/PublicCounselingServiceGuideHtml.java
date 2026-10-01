package com.coresolution.consultation.util;

import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.CounselorRow;
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
        boolean showCenter = PublicCounselingServiceGuideService.showCenter(view);
        boolean showTypes = view.getTypes() != null && !view.getTypes().isEmpty();
        boolean showCounselors = view.getCounselors() != null && !view.getCounselors().isEmpty();
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
        body.append(nav(showCenter, showTypes, showCounselors));
        if (showCenter) {
            body.append(centerSection(view));
        }
        if (showTypes) {
            body.append(typesSection(view.getTypes()));
        }
        body.append(processSection(minutes));
        if (showCounselors) {
            body.append(counselorsSection(view.getCounselors()));
        }
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
        row(sb, "상호", view.getCenterName());
        row(sb, "대표", view.getRepresentativeName());
        row(sb, "사업자등록번호", view.getBusinessRegistrationNumber());
        row(sb, "통신판매신고번호", view.getMailOrderReportNumber());
        row(sb, "주소", view.getBusinessAddress());
        if (!blank(view.getBusinessLandline())) {
            sb.append("<dt>연락처</dt><dd><a href=\"tel:")
                    .append(escape(telHref(view.getBusinessLandline())))
                    .append("\">")
                    .append(escape(view.getBusinessLandline()))
                    .append("</a></dd>");
        }
        sb.append("</dl></section>");
        return sb.toString();
    }

    private static String typesSection(List<TypeCard> types) {
        StringBuilder sb = new StringBuilder();
        sb.append("<section id=\"types\"><h2>상담 종류</h2>");
        sb.append("<p>").append(TYPES_LEAD).append("</p><div class=\"svc-grid\">");
        for (TypeCard type : types) {
            sb.append("<article><h3>").append(escape(type.getName())).append("</h3>");
            if (!blank(type.getDescription())) {
                sb.append("<p>").append(escape(type.getDescription())).append("</p>");
            }
            sb.append("<dl>");
            row(sb, "대상", type.getAudience());
            row(sb, "방식", type.getModality());
            if (type.getMinutes() != null) {
                row(sb, "1회 시간", type.getMinutes() + "분");
            }
            sb.append("</dl></article>");
        }
        sb.append("</div></section>");
        return sb.toString();
    }

    private static String processSection(Integer minutes) {
        String session = minutes == null
                ? "정한 일정에 맞춰 상담사와 정해진 시간 동안 만나요. 회기는 상품의 이용기간 안에 사용해요."
                : "정한 일정에 맞춰 상담사와 1회 " + minutes + "분씩 만나요. 회기는 상품의 이용기간 안에 사용해요.";
        return "<section id=\"process\"><h2>진행 절차</h2><ol>"
                + step(1, "상담 신청", PROCESS_APPLY)
                + step(2, "초기 면담", PROCESS_INTAKE)
                + step(3, "상담 회기", session)
                + step(4, "종결", PROCESS_CLOSE)
                + "</ol></section>";
    }

    private static String counselorsSection(List<CounselorRow> counselors) {
        StringBuilder sb = new StringBuilder();
        sb.append("<section id=\"counselors\"><h2>상담사 자격</h2>");
        sb.append("<p>").append(COUNSELOR_LEAD).append("</p><article>");
        for (CounselorRow row : counselors) {
            sb.append("<p><strong>").append(escape(row.getName())).append("</strong></p>");
            for (String line : row.getLines()) {
                sb.append("<p>").append(escape(line)).append("</p>");
            }
        }
        sb.append("</article></section>");
        return sb.toString();
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
            sb.append("<table><caption class=\"sr-only\">").append(caption).append("</caption><thead><tr>");
            sb.append("<th scope=\"col\">상품</th><th scope=\"col\">구성</th>");
            sb.append("<th scope=\"col\">이용기간</th><th scope=\"col\">가격</th>");
            sb.append("</tr></thead><tbody>");
            NumberFormat format = NumberFormat.getInstance(Locale.KOREA);
            for (ProductRow row : products) {
                sb.append("<tr><td><strong>").append(escape(row.getName())).append("</strong>");
                if (!blank(row.getDescription())) {
                    sb.append("<br>").append(escape(row.getDescription()));
                }
                sb.append("</td><td>").append(escape(composition(row))).append("</td><td>");
                sb.append(escape(validity(row))).append("</td><td>");
                if (row.getPrice() == null) {
                    sb.append("—");
                } else {
                    sb.append(escape(format.format(row.getPrice()))).append("원");
                }
                sb.append("</td></tr>");
            }
            sb.append("</tbody></table>");
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

    private static String nav(boolean center, boolean types, boolean counselors) {
        StringBuilder sb = new StringBuilder();
        sb.append("<nav aria-label=\"페이지 안 이동\">");
        if (center) {
            sb.append(anchor("center", "센터 소개"));
        }
        if (types) {
            sb.append(anchor("types", "상담 종류"));
        }
        sb.append(anchor("process", "진행 절차"));
        if (counselors) {
            sb.append(anchor("counselors", "상담사"));
        }
        sb.append(anchor("products", "상품·가격"));
        sb.append(anchor("policy", "환불·개인정보"));
        sb.append("</nav>");
        return sb.toString();
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

    private static String validity(ProductRow row) {
        if (row.getValidityMonths() == null) {
            return "—";
        }
        return "결제일부터 " + row.getValidityMonths() + "개월";
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
        return "<li><h3>" + index + ". " + title + "</h3><p>" + escape(body) + "</p></li>";
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
            + "@media (max-width:47.99rem){table,thead,tbody,tr,th,td{display:block;}}";
}
