package com.coresolution.consultation.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 시 계정 선택용 단기 JWT 에서 복원한 클레임.
 *
 * <p>OAuth 의 {@code OAuthPhoneAccountSelectionClaims} 패턴을 미러링한 비-OAuth 변형.
 * SNS 액세스 토큰·이메일·이름 등 OAuth 전용 필드는 보유하지 않는다(보안 — 노출 최소화).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Value
@Builder
public class PasswordLoginAccountSelectionClaims {

    /** 테넌트 ID — 선택 완료 시 동일 테넌트 컨텍스트만 허용. */
    String tenantId;

    /**
     * 선택 가능한 사용자 PK 목록.
     *
     * <p>로그인 단계에서 phone + password 가 모두 일치한 사용자만 포함된다(timing attack 방어).
     * 선택 완료 시 요청 {@code userId} 가 본 목록에 없으면 403 으로 차단한다.</p>
     */
    List<Long> allowedUserIds;
}
