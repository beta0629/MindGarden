package com.coresolution.consultation.dto;

import lombok.Data;

/**
 * 관리자 계정 상담 겸직(counseling_enabled) 갱신 요청.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
@Data
public class CounselingEnabledUpdateRequest {

    private boolean counselingEnabled;
}
