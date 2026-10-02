package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.PublicCounselingTenantGuides;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.CounselorRow;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.ProductRow;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.TypeCard;
import com.coresolution.core.service.PlatformLegalCopyService;
import org.junit.jupiter.api.DisplayName;
import org.springframework.web.util.HtmlUtils;
import org.junit.jupiter.api.Test;

/**
 * /services 첫 HTML.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
@DisplayName("PublicCounselingServiceGuideHtml")
class PublicCounselingServiceGuideHtmlTest {

    @Test
    @DisplayName("여섯 섹션·할부 문장·환불 앵커가 있고 일시불만은 없다")
    void rendersSixSections() {
        PublicCounselingServiceGuideView view = filled();
        String html = PublicCounselingServiceGuideHtml.render(view);

        assertThat(html).contains("<h2>센터 소개</h2>");
        assertThat(html).contains("<h2>상담 종류</h2>");
        assertThat(html).contains("<h2>진행 절차</h2>");
        assertThat(html).contains("<h2>상담사 소개</h2>");
        assertThat(html).contains("김선희");
        assertThat(html).contains("15년 이상 임상 경험을 갖춘 대표원장이 직접 상담합니다.");
        assertThat(html).doesNotContain("센터장이 직접 상담합니다.");
        assertThat(html).contains("한국상담학회 전문상담사");
        assertThat(html).contains("보건복지부 사회복지사");
        assertThat(html).doesNotContain("임상심리사");
        assertThat(html).doesNotContain("TODO");
        assertThat(html).contains("마인드가든 심리상담센터");
        assertThat(html).contains("인천 연수구 해돋이로120번길 23 아크리아2 2층 204호");
        assertThat(html).contains(HtmlUtils.htmlEscape(
                "주중 10:00–20:00, 토요일 10:00–17:00, 일요일 정기휴무"));
        assertThat(html).doesNotContain("화~금 11:00");
        assertThat(html).contains("032-724-8501");
        assertThat(html).doesNotContain("010-7923-8501");
        assertThat(html).contains(HtmlUtils.htmlEscape("아동·청소년·성인 1:1 개인상담"));
        assertThat(html).contains(HtmlUtils.htmlEscape(
                "예약 신청 → 센터 확인 전화로 예약 확정"));
        assertThat(html).contains("결제일부터 3개월");
        assertThat(html).contains("상품명");
        assertThat(html).contains("회기");
        assertThat(html).contains("이용기간");
        assertThat(html).contains("svc-product-card");
        assertThat(html).contains("max-width:24.375rem");
        assertThat(html).doesNotContain("—");
        assertThat(html).contains("<h2>상품·가격</h2>");
        assertThat(html).contains("<h2>환불·개인정보</h2>");
        assertThat(html).contains("href=\"/legal/terms#refund\"");
        assertThat(html).contains("href=\"/legal/privacy\"");
        assertThat(html).contains(HtmlUtils.htmlEscape(
                PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE));
        assertThat(html).doesNotContain("일시불만");
        assertThat(html).contains("10회 패키지");
        assertThat(html).doesNotContain("테스트 상품");
        assertThat(html).contains("<caption class=\"sr-only\">");
        assertThat(html).doesNotContain("#0");
        assertThat(html).doesNotContain("rgb(");
    }

    @Test
    @DisplayName("콘텐츠 키가 없으면 센터 안내를 숨기고 상품 안내는 남긴다")
    void hidesEmptySections() {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setTenantKey("clinic-b");
        view.setCenterName("다른센터");
        view.setOneLiner("폴백");
        view.setPaymentNote(PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불 규정은 센터에 문의해 주세요.");
        view.setPageTitle("상담 서비스 안내");
        view.setPageDescription("설명");

        String html = PublicCounselingServiceGuideHtml.render(view);

        assertThat(html).doesNotContain("id=\"types\"");
        assertThat(html).doesNotContain("id=\"counselors\"");
        assertThat(html).doesNotContain("id=\"center\"");
        assertThat(html).doesNotContain("id=\"process\"");
        assertThat(html).contains("등록된 상담 안내가 없습니다.");
        assertThat(html).contains("id=\"products\"");
        assertThat(html).contains("구매할 수 있는 상품이 없어요");
        assertNoMindgardenFacts(html);
        assertThat(html).doesNotContain("—");
        assertThat(html).doesNotContain("TODO");
    }

    @Test
    @DisplayName("다른 테넌트 HTML 에는 마인드가든 안내가 없다")
    void otherTenantOmitsMindgardenGuide() {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setTenantKey("clinic-b");
        view.setCenterName("다른센터");
        view.setBusinessLandline("02-333-4444");
        view.setOneLiner("다른 센터 한 줄");
        view.setPaymentNote(PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불");
        view.setPageTitle("상담 서비스 안내 · 다른센터");
        view.setPageDescription("설명");
        addProduct(view, "다른상품", 10, 3, 200000L);

        String html = PublicCounselingServiceGuideHtml.render(view);

        assertThat(html).contains("다른상품");
        assertThat(html).contains("02-333-4444");
        assertThat(html).doesNotContain("10회 패키지");
        assertNoMindgardenFacts(html);
    }

    @Test
    @DisplayName("이용기간이 없으면 1·10·20회기만 개월로 폴백하고 행은 남긴다")
    void usagePeriodFallbackKeepsRow() {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setPaymentNote(PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불");
        view.setPageTitle("상담 서비스 안내");
        view.setPageDescription("설명");
        addProduct(view, "단회기", 1, null, 90000L);
        addProduct(view, "열회기", 10, null, 850000L);
        addProduct(view, "스무회기", 20, null, 1600000L);
        addProduct(view, "다섯회기", 5, null, 40000L);
        addProduct(view, "지정개월", 8, 4, 80000L);

        String html = PublicCounselingServiceGuideHtml.render(view);

        assertThat(html).contains("단회기");
        assertThat(html).contains("다섯회기");
        assertThat(html).contains("결제일부터 2개월");
        assertThat(html).contains("결제일부터 3개월");
        assertThat(html).contains("결제일부터 6개월");
        assertThat(html).contains("결제일부터 4개월");
        assertThat(html).contains(">5회기<");
        assertThat(html).doesNotContain("결제일부터 5개월");
        assertThat(html).doesNotContain("—");
        assertThat(html).contains("max-width:24.375rem");
        assertThat(html).contains("상품명");
        assertThat(html).contains("이용기간");
    }

    private static void assertNoMindgardenFacts(String html) {
        assertThat(html).doesNotContain("마인드가든");
        assertThat(html).doesNotContain("김선희");
        assertThat(html).doesNotContain("032-724-8501");
        assertThat(html).doesNotContain("010-7923-8501");
        assertThat(html).doesNotContain("해돋이로");
        assertThat(html).doesNotContain("트리니티 심리상담연구소");
        assertThat(html).doesNotContain("청소년교육 학사");
        assertThat(html).doesNotContain("아동·청소년·성인");
        assertThat(html).doesNotContain("센터장이 직접 상담합니다.");
    }

    private static void addProduct(
            PublicCounselingServiceGuideView view,
            String name,
            int sessions,
            Integer validityMonths,
            long price) {
        ProductRow product = new ProductRow();
        product.setName(name);
        product.setSessions(sessions);
        product.setValidityMonths(validityMonths);
        product.setPrice(price);
        view.getProducts().add(product);
    }

    private static PublicCounselingServiceGuideView filled() {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setTenantKey(PublicCounselingTenantGuides.MINDGARDEN_TENANT_KEY);
        view.setCenterName("마음센터");
        view.setBusinessAddress("서울시");
        view.setBusinessLandline("02-000-0000");
        view.setOneLiner("한 줄");
        view.setPaymentNote(PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불 요약");
        view.setPageTitle("상담 서비스 안내 · 마음센터");
        view.setPageDescription("설명");
        TypeCard type = new TypeCard();
        type.setName("개인상담");
        type.setModality("대면 · 비대면");
        type.setMinutes(50);
        view.getTypes().add(type);
        CounselorRow counselor = new CounselorRow();
        counselor.setName("김상담");
        counselor.getLines().add("임상심리사 · 기관");
        view.getCounselors().add(counselor);
        ProductRow product = new ProductRow();
        product.setName("10회 패키지");
        product.setSessions(10);
        product.setMinutes(50);
        product.setValidityMonths(3);
        product.setPrice(100000L);
        view.getProducts().add(product);
        return view;
    }
}
