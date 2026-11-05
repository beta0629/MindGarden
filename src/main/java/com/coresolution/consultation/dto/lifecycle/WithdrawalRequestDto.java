package com.coresolution.consultation.dto.lifecycle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 자발 탈퇴 신청 요청 DTO — POST /api/v1/mypage/withdrawal/request.
 *
 * <p>본인 확인은 비밀번호 재확인 또는(소셜 전용) 확인 문구({@code confirmPhrase})로 한다.
 * SIWA/소셜 사용자는 임시 비밀번호를 모를 수 있으므로 {@code password} 는 선택이며,
 * 컨트롤러에서 경로별 필수 검증을 수행한다.</p>
 *
 * <p>옵션 필드:</p>
 * <ul>
 *   <li>{@code deleteCommunityBody} — USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b 결정.
 *       기본은 author 익명화 + community 본문 KEEP. 본 필드가 {@code true} 일 때 본인이 작성한
 *       커뮤니티 게시글·댓글 본문도 함께 익명화/삭제한다. 옵션 값은 30일 유예 시점에
 *       {@code users.withdrawal_options_json} 에 보관되었다가
 *       {@code WithdrawalGracePeriodScheduler} 가 ANONYMIZED 전이 시점에 사용한다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequestDto {

    /**
     * 비밀번호 재확인 (자격증명 사용자 필수. 소셜+confirmPhrase 경로에서는 생략 가능).
     */
    private String password;

    /** 사유 (선택). 길이 제한은 audit_logs.metadata 적재 시점에 결정. */
    private String reason;

    /**
     * Q12-b 옵션 — 본인이 작성한 커뮤니티 게시글/댓글 본문도 함께 삭제할지 여부.
     *
     * <p>Jackson 역직렬화 시 누락된 페이로드는 {@code null} 로 도착할 수 있으며,
     * 본 필드를 읽는 측에서는 {@link #isDeleteCommunityBodyOrFalse()} 를 사용해
     * null-safe 기본값({@code false} — 본문 KEEP) 으로 해석한다.</p>
     */
    private Boolean deleteCommunityBody;

    /**
     * 소셜(Apple/Kakao 등) 전용 본인 확인 문구.
     * 서버 상수({@code DELETE})와 대소문자 구분 일치해야 한다.
     */
    private String confirmPhrase;

    /**
     * null-safe Q12-b 옵션 해석. {@code null} 은 기본값 {@code false}.
     *
     * @return {@code true} 면 본문도 함께 삭제, 기본 {@code false}
     */
    public boolean isDeleteCommunityBodyOrFalse() {
        return Boolean.TRUE.equals(deleteCommunityBody);
    }
}
