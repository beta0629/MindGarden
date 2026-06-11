package com.coresolution.consultation.dto;

import lombok.Data;

/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 시 계정 선택 완료 요청.
 *
 * <p>{@code POST /api/v1/auth/select-account} 엔드포인트 본문. 사용자가 카드 클릭으로 선택한
 * {@code selectedUserId} 와, {@code /login} 응답으로 받은 5분 TTL 단기 JWT
 * {@code selectionToken} 를 함께 전송한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Data
public class SelectAccountRequest {

    /**
     * {@link com.coresolution.consultation.service.JwtService#generatePasswordLoginAccountSelectionToken}
     * 에서 발급된 5분 TTL 단기 JWT.
     */
    private String selectionToken;

    /** 사용자가 선택한 계정 PK — 토큰의 {@code allowedUserIds} 에 포함돼야 한다. */
    private Long selectedUserId;
}
