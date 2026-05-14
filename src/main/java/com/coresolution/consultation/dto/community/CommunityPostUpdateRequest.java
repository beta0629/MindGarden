package com.coresolution.consultation.dto.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 커뮤니티 게시글 수정 요청(검수 대기 건만).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
public class CommunityPostUpdateRequest {

    @NotBlank
    @Size(max = 500)
    private String title;

    @NotBlank
    @Size(max = 20000)
    private String body;

    @Size(max = 200)
    private String specialty;

    private boolean anonymous;
}
