package com.coresolution.consultation.dto.content;

import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import java.util.List;

/**
 * 심리교육 마스터 어드민 상세(노출·슬러그 포함).
 *
 * <p>Apple 1.4.1 — 출처 4 필드를 어드민 폼에서 편집할 수 있도록 raw 값을 그대로 노출한다.
 * 사용자 화면용 {@code SourceCitation} 가공은 {@link PsychoEducationArticleResponse} 에서 수행한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record PsychoEducationArticleAdminDetail(
        Long id,
        String slug,
        boolean published,
        int sortOrder,
        String title,
        String summary,
        String body,
        String category,
        String categoryLabel,
        int readMinutes,
        List<PsychoEducationArticleResponse.Page> pages,
        String sourceLabel,
        String sourceUrl,
        String sourceAuthor,
        Integer sourcePublishedYear
) {
}
