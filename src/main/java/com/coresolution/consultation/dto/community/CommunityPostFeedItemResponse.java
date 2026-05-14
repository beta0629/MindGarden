package com.coresolution.consultation.dto.community;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * 피드용 게시글 응답 — Expo {@code communityNormalize} 필드명 정합.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommunityPostFeedItemResponse {

    long id;
    String tab;
    String author;
    String specialty;
    String title;
    String body;
    int likes;
    List<CommunityCommentResponse> comments;
    String time;
    boolean isConsultant;
    boolean isAnonymous;
}
