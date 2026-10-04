package com.coresolution.consultation.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 평가 공개 응답. 로그인 사용자 누구나 조회할 수 있는 경로에서 쓰므로 내담자 식별 정보
 * (id·이메일·전화·실명)를 담지 않는다. 내담자 표시는 익명 라벨 또는 마스킹 이름만.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantRatingPublicResponse {

    /** 익명 평가의 내담자 표시 라벨 (기존 상담사 평가 통계 응답과 동일). */
    public static final String ANONYMOUS_CLIENT_LABEL = "익명";

    /** 평가 ID */
    private Long id;

    /** 하트 점수 (1-5) */
    private Integer heartScore;

    /** 평가 코멘트 */
    private String comment;

    /** 평가 태그 */
    private List<String> tags;

    /** 익명 여부 */
    private Boolean isAnonymous;

    /** 내담자 표시명: 익명이면 {@link #ANONYMOUS_CLIENT_LABEL}, 아니면 마스킹 이름 */
    private String clientName;

    /** 평가 일시 */
    private LocalDateTime ratedAt;
}
