package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 문항 응답 뷰.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctAnswerView {
    private Long formItemId;
    private Integer itemNo;
    private String promptText;
    private String domainCode;
    private String domainLabel;
    private String answerText;
    private Boolean notApplicable;
    private Boolean isBlank;
    private Boolean allowsNotApplicable;
}
