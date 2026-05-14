package com.coresolution.consultation.dto.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 댓글 작성 요청.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
public class CommunityCommentCreateRequest {

    @NotBlank
    @Size(max = 5000)
    private String body;
}
