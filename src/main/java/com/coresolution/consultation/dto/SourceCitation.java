package com.coresolution.consultation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * 의료/건강 콘텐츠 출처 인용(공용 DTO).
 *
 * <p>Apple App Store Guideline 1.4.1 (Medical Citations) 대응 — T3.
 * 4 필드 모두 nullable 이며 빈 출처는 사용자 화면에 노출되지 않는다.</p>
 *
 * <ul>
 *   <li>{@code label} — 표시용 출처명/논문/가이드라인 (예: "PHQ-9 (Kroenke et al., 2001)")</li>
 *   <li>{@code url} — 외부 링크 (https://... 또는 doi.org 권장)</li>
 *   <li>{@code author} — 저자/기관 (예: "World Health Organization")</li>
 *   <li>{@code publishedYear} — 발행 연도 (1900 ~ 2100)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public record SourceCitation(
        @Size(max = 200) String label,
        @Size(max = 500) String url,
        @Size(max = 200) String author,
        @Min(1900) @Max(2100) Integer publishedYear
) {

    /**
     * 모든 필드가 비어 있으면 표시할 출처가 없는 것으로 간주한다.
     */
    public boolean isEmpty() {
        return isBlank(label) && isBlank(url) && isBlank(author) && publishedYear == null;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
