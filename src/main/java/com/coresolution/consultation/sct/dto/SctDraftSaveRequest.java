package com.coresolution.consultation.sct.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 임시저장 요청.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctDraftSaveRequest {
    @NotBlank
    private String verifySessionId;
    private List<SctDraftAnswerItem> answers;
}
