package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse;

/**
 * 심리 교육 콘텐츠 조회 서비스.
 *
 * <p>MVP 단계에서는 DB 마이그레이션 없이 시드(상수) 데이터를 그대로 노출한다.
 * 추후 콘텐츠 운영을 도입할 때 본 인터페이스 구현을 DB 기반으로 교체한다
 * (Flyway 마이그레이션 + Repository).</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public interface PsychoEducationService {

    /**
     * 현재 테넌트가 열람 가능한 심리 교육 콘텐츠 목록.
     *
     * @return 게시 순서대로 정렬된 콘텐츠 목록 (비어있을 수 있음)
     */
    List<PsychoEducationArticleResponse> listArticles();

    /**
     * 단일 콘텐츠 상세.
     *
     * @param articleId 콘텐츠 식별자 (양수)
     * @return 콘텐츠 상세
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 존재하지 않는 경우
     */
    PsychoEducationArticleResponse getArticle(Long articleId);
}
