package com.coresolution.consultation.dto.community;

import com.coresolution.consultation.constant.CommunityPostKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 커뮤니티 게시글 작성 요청.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
public class CommunityPostCreateRequest {

    @NotNull
    private CommunityPostKind postKind;

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
