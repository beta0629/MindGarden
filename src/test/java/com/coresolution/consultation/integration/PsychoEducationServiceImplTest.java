package com.coresolution.consultation.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse.Page;
import com.coresolution.consultation.entity.PsychoEducationArticle;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.PsychoEducationArticleRepository;
import com.coresolution.consultation.service.PsychoEducationService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link com.coresolution.consultation.service.impl.PsychoEducationServiceImpl} 통합 테스트.
 *
 * <p>실제 Repository·엔티티·JSON(pages_json) 매핑을 거쳐 Expo 클라이언트
 * ({@code expo-app/src/services/psychoEducationService.ts})가 기대하는 필드가 채워지는지 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@TestPropertySource(
    properties = {
        // clean + H2 + ddl-auto=update 조합에서 엔티티 추가 순서에 따른 컬럼 누락 오류 방지
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.hbm2ddl.auto=create-drop"
    }
)
@Transactional
@DisplayName("PsychoEducationServiceImpl")
class PsychoEducationServiceImplTest {

    private static final String TEST_TENANT_ID = "tenant-test-psycho-001";
    private static final String SEED_SLUG_A = "it-psycho-seed-a";
    private static final String SEED_SLUG_B = "it-psycho-seed-b";

    @Autowired
    private PsychoEducationService psychoEducationService;

    @Autowired
    private PsychoEducationArticleRepository psychoEducationArticleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
        psychoEducationArticleRepository.saveAll(List.of(
            buildPublishedArticle(SEED_SLUG_A, 10, samplePagesThreeCards()),
            buildPublishedArticle(SEED_SLUG_B, 20, samplePagesThreeCards())
        ));
        psychoEducationArticleRepository.flush();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("listArticles는 시드 콘텐츠를 Expo 정합 스키마로 반환한다")
    void listArticles_returnsSeedArticles_withExpoCompatibleSchema() {
        List<PsychoEducationArticleResponse> articles = psychoEducationService.listArticles();

        assertNotNull(articles);
        assertFalse(articles.isEmpty(), "시드 콘텐츠는 비어 있지 않아야 한다");
        for (PsychoEducationArticleResponse article : articles) {
            assertNotNull(article.id(), "id는 필수다");
            assertTrue(article.id() > 0L, "id는 양수여야 한다");
            assertNotNull(article.title(), "title은 필수다");
            assertFalse(article.title().isBlank(), "title은 비어 있지 않아야 한다");
            assertNotNull(article.summary(), "summary는 필수다");
            assertNotNull(article.body(), "body는 필수다 (Expo body/content/text 매핑)");
            assertNotNull(article.category(), "category는 필수다 (Expo mapPsychoCategory 입력)");
            assertNotNull(article.categoryLabel(), "categoryLabel은 필수다");
            assertTrue(article.readMinutes() > 0, "readMinutes는 양수여야 한다");
            assertNotNull(article.pages(), "pages는 필수다");
            assertFalse(article.pages().isEmpty(), "pages는 최소 1건 이상이어야 한다");
            for (Page page : article.pages()) {
                assertNotNull(page.title(), "page.title은 필수다");
                assertNotNull(page.body(), "page.body는 필수다");
                assertFalse(page.body().isBlank(), "page.body는 비어 있지 않아야 한다");
            }
        }
    }

    @Test
    @DisplayName("getArticle은 존재하는 id에 대해 동일 페이로드를 반환한다")
    void getArticle_existingId_returnsSameAsListEntry() {
        PsychoEducationArticleResponse expected = psychoEducationService.listArticles().get(0);
        PsychoEducationArticleResponse actual = psychoEducationService.getArticle(expected.id());

        assertEquals(expected.id(), actual.id());
        assertEquals(expected.title(), actual.title());
        assertEquals(expected.category(), actual.category());
        assertEquals(expected.pages().size(), actual.pages().size());
    }

    @Test
    @DisplayName("getArticle은 존재하지 않는 id면 EntityNotFoundException을 던진다(GlobalExceptionHandler가 404 매핑)")
    void getArticle_unknownId_throwsEntityNotFoundException() {
        assertThrows(EntityNotFoundException.class, () -> psychoEducationService.getArticle(999_999L));
    }

    @Test
    @DisplayName("getArticle은 null 또는 0 이하 id면 EntityNotFoundException을 던진다")
    void getArticle_invalidId_throwsEntityNotFoundException() {
        assertThrows(EntityNotFoundException.class, () -> psychoEducationService.getArticle(null));
        assertThrows(EntityNotFoundException.class, () -> psychoEducationService.getArticle(0L));
        assertThrows(EntityNotFoundException.class, () -> psychoEducationService.getArticle(-1L));
    }

    @Test
    @DisplayName("listArticles는 tenantId 컨텍스트가 없으면 IllegalStateException을 던진다(테넌트 격리)")
    void listArticles_withoutTenantContext_throwsIllegalStateException() {
        TenantContextHolder.clear();
        assertThrows(IllegalStateException.class, () -> psychoEducationService.listArticles());
    }

    private PsychoEducationArticle buildPublishedArticle(String slug, int sortOrder, JsonNode pagesJson) {
        return PsychoEducationArticle.builder()
            .tenantId(TEST_TENANT_ID)
            .slug(slug)
            .title("불안을 다스리는 호흡법")
            .summary("긴장되는 순간, 간단한 호흡법으로 마음을 가라앉힐 수 있습니다.")
            .body("본문 컬럼(레거시/검색용) — 응답 body는 pages_json 첫 카드에서 파생됩니다.")
            .category("STRESS")
            .categoryLabel("스트레스 관리")
            .readMinutes(3)
            .pagesJson(pagesJson)
            .published(true)
            .sortOrder(sortOrder)
            .isDeleted(false)
            .version(0L)
            .build();
    }

    private JsonNode samplePagesThreeCards() {
        ArrayNode arr = objectMapper.createArrayNode();
        arr.add(objectMapper.createObjectNode()
            .put("title", "불안은 자연스러운 감정")
            .put("body", "불안은 누구나 경험하는 자연스러운 감정입니다."));
        arr.add(objectMapper.createObjectNode()
            .put("title", "4-7-8 호흡법")
            .put("body", "코로 4초 들이쉬고, 7초 참고, 8초 내쉽니다."));
        arr.add(objectMapper.createObjectNode()
            .put("title", "복식호흡")
            .put("body", "배에 손을 얹고 배가 부풀어 오르도록 깊이 호흡합니다."));
        return arr;
    }
}
