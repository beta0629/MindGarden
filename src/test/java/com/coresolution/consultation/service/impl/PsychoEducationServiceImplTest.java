package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse.Page;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link PsychoEducationServiceImpl} 시드·스키마 검증 테스트.
 *
 * <p>Expo 클라이언트({@code expo-app/src/services/psychoEducationService.ts})의
 * {@code normalizeArticleList} / {@code normalizeArticle} 가 기대하는 필드(id·title·summary·body·
 * category·readMinutes·pages.title·pages.body)가 모두 채워지는지 확인한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@DisplayName("PsychoEducationServiceImpl")
class PsychoEducationServiceImplTest {

    private static final String TEST_TENANT_ID = "tenant-test-psycho-001";

    private PsychoEducationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PsychoEducationServiceImpl();
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("listArticles는 시드 콘텐츠를 Expo 정합 스키마로 반환한다")
    void listArticles_returnsSeedArticles_withExpoCompatibleSchema() {
        List<PsychoEducationArticleResponse> articles = service.listArticles();

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
        PsychoEducationArticleResponse expected = service.listArticles().get(0);
        PsychoEducationArticleResponse actual = service.getArticle(expected.id());

        assertEquals(expected.id(), actual.id());
        assertEquals(expected.title(), actual.title());
        assertEquals(expected.category(), actual.category());
        assertEquals(expected.pages().size(), actual.pages().size());
    }

    @Test
    @DisplayName("getArticle은 존재하지 않는 id면 EntityNotFoundException을 던진다(GlobalExceptionHandler가 404 매핑)")
    void getArticle_unknownId_throwsEntityNotFoundException() {
        assertThrows(EntityNotFoundException.class, () -> service.getArticle(999_999L));
    }

    @Test
    @DisplayName("getArticle은 null 또는 0 이하 id면 EntityNotFoundException을 던진다")
    void getArticle_invalidId_throwsEntityNotFoundException() {
        assertThrows(EntityNotFoundException.class, () -> service.getArticle(null));
        assertThrows(EntityNotFoundException.class, () -> service.getArticle(0L));
        assertThrows(EntityNotFoundException.class, () -> service.getArticle(-1L));
    }

    @Test
    @DisplayName("listArticles는 tenantId 컨텍스트가 없으면 IllegalStateException을 던진다(테넌트 격리)")
    void listArticles_withoutTenantContext_throwsIllegalStateException() {
        TenantContextHolder.clear();
        assertThrows(IllegalStateException.class, () -> service.listArticles());
    }
}
