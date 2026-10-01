package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

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
        assertThat(html).contains("<h2>상담사 자격</h2>");
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
    @DisplayName("종류·자격이 없으면 그 섹션을 빼도 진행 절차는 남긴다")
    void hidesEmptySections() {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        view.setOneLiner("폴백");
        view.setPaymentNote(PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
        view.setRefundBody("환불 규정은 센터에 문의해 주세요.");
        view.setPageTitle("상담 서비스 안내");
        view.setPageDescription("설명");

        String html = PublicCounselingServiceGuideHtml.render(view);

        assertThat(html).doesNotContain("id=\"types\"");
        assertThat(html).doesNotContain("id=\"counselors\"");
        assertThat(html).doesNotContain("id=\"center\"");
        assertThat(html).contains("id=\"process\"");
        assertThat(html).contains("정해진 시간 동안");
        assertThat(html).contains("구매할 수 있는 상품이 없어요");
    }

    private static PublicCounselingServiceGuideView filled() {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
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
