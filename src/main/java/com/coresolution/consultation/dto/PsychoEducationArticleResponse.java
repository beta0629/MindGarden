package com.coresolution.consultation.dto;

import java.util.List;

/**
 * 심리 교육 콘텐츠 응답 DTO.
 *
 * <p>Expo 클라이언트(`expo-app/src/services/psychoEducationService.ts`)의
 * {@code normalizeArticleList} / {@code normalizeArticle} 규약과 정합한다.</p>
 *
 * <p>래퍼는 {@link com.coresolution.core.dto.ApiResponse}로 감싸져
 * {@code { success, data: [...] }} 형태로 내려가며, 클라이언트의
 * {@code unwrapApiResponse}가 {@code data} 필드를 펼친다.</p>
 *
 * <p>필드 매핑(클라이언트 폴백 키 포함):</p>
 * <ul>
 *   <li>{@code id} ↔ {@code id} / {@code articleId}</li>
 *   <li>{@code title} ↔ {@code title} / {@code name}</li>
 *   <li>{@code summary} ↔ {@code summary} / {@code description} / {@code subtitle}</li>
 *   <li>{@code body} ↔ {@code body} / {@code content} / {@code text}</li>
 *   <li>{@code category} ↔ {@code category} / {@code topic} (예: STRESS, EMOTION, RELATIONSHIP, SELFCARE)</li>
 *   <li>{@code categoryLabel} 표시용 한글 라벨</li>
 *   <li>{@code readMinutes} ↔ {@code readMinutes} / {@code estimatedMinutes}</li>
 *   <li>{@code pages} ↔ {@code pages} / {@code cards} / {@code slides}</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public record PsychoEducationArticleResponse(
        Long id,
        String title,
        String summary,
        String body,
        String category,
        String categoryLabel,
        int readMinutes,
        List<Page> pages
) {

    /**
     * 카드뉴스 한 페이지(슬라이드).
     */
    public record Page(String title, String body) {
    }
}
