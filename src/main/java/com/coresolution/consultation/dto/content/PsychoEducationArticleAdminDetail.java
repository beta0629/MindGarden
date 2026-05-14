package com.coresolution.consultation.dto.content;

import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import java.util.List;

/**
 * 심리교육 마스터 어드민 상세(노출·슬러그 포함).
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
        List<PsychoEducationArticleResponse.Page> pages
) {
}
