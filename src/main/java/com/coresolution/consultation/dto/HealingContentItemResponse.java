package com.coresolution.consultation.dto;

import com.coresolution.consultation.constant.HealingContentMediaType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 힐링 콘텐츠 목록 항목 응답 (Expo {@code HealingContent} 타입과 필드 정합).
 * DB 일별 힐링 행은 엔티티 PK를 {@code id}로 쓰고, 시드 항목은 {@code 9_000_001} 이상 대역을 쓴다.
 *
 * <p>Apple 1.4.1 (Medical Citations) — {@code source} 가 비면 직렬화에서 제외(NON_NULL)된다.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HealingContentItemResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private HealingContentMediaType type;
    private String thumbnailUrl;
    private String contentUrl;
    private Integer durationMinutes;
    private SourceCitation source;
}
