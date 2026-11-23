package com.coresolution.consultation.sct.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내담자 배정(연결) 요청.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctLinkRequest {
    @NotNull
    private Long clientId;
    private Long mappingId;
}
