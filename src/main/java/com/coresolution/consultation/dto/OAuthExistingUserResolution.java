package com.coresolution.consultation.dto;

import java.util.Collections;
import java.util.List;
import lombok.Builder;
import lombok.Value;

/**
 * 소셜 로그인/연동 전 기존 사용자 매칭 결과.
 * 동일 테넌트·동일 정규화 전화에 관리자·상담사·스태프·내담자 중 서로 다른 역할이 2종 이상이면
 * {@link #requiresPhoneAccountSelection} 이 true이다.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Value
@Builder
public class OAuthExistingUserResolution {

    /**
     * 확정된 기존 사용자 PK. {@link #requiresPhoneAccountSelection} 이 true이면 null.
     */
    Long existingUserId;

    /**
     * 전화 매칭만 애매한 경우 true. 이 경우 이메일 폴백을 하지 않는다.
     */
    boolean requiresPhoneAccountSelection;

    /**
     * 선택 UI에 표시할 후보 PK 목록({@link #requiresPhoneAccountSelection} 일 때만 비어 있지 않음).
     */
    @Builder.Default
    List<Long> phoneMatchCandidateUserIds = Collections.emptyList();

    /**
     * providerUserId 매칭이 아니라 전화/이메일 프로필로 매칭된 경우 소셜 행 생성이 필요하다.
     */
    boolean needSocialRowFromProfileMatch;

    /**
     * 매칭 실패(간편가입 등).
     */
    public static OAuthExistingUserResolution noMatch() {
        return OAuthExistingUserResolution.builder()
            .existingUserId(null)
            .requiresPhoneAccountSelection(false)
            .phoneMatchCandidateUserIds(Collections.emptyList())
            .needSocialRowFromProfileMatch(false)
            .build();
    }

    /**
     * 단일 사용자로 확정.
     *
     * @param userId 사용자 PK
     * @param needSocialRowFromProfileMatch 프로필(전화/이메일) 매칭 여부
     */
    public static OAuthExistingUserResolution unique(long userId, boolean needSocialRowFromProfileMatch) {
        return OAuthExistingUserResolution.builder()
            .existingUserId(userId)
            .requiresPhoneAccountSelection(false)
            .phoneMatchCandidateUserIds(Collections.emptyList())
            .needSocialRowFromProfileMatch(needSocialRowFromProfileMatch)
            .build();
    }

    /**
     * 전화 후보 중 역할이 2종 이상 섞여 사용자 선택이 필요하다.
     *
     * @param candidateUserIds 후보 사용자 PK(테넌트·전화 일치 전체)
     */
    public static OAuthExistingUserResolution phoneAmbiguous(List<Long> candidateUserIds) {
        return OAuthExistingUserResolution.builder()
            .existingUserId(null)
            .requiresPhoneAccountSelection(true)
            .phoneMatchCandidateUserIds(
                candidateUserIds == null ? Collections.emptyList() : List.copyOf(candidateUserIds))
            .needSocialRowFromProfileMatch(false)
            .build();
    }
}
