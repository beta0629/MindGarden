package com.coresolution.consultation.dto.community;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * 피드용 댓글 응답 — Expo {@code communityNormalize} 필드명 정합.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommunityCommentResponse {

    long id;
    String author;
    String body;
    String time;
    int likes;
}
