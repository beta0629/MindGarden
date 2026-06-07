package com.coresolution.consultation.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple Sign In 응답에 첨부되는 사용자 요약.
 *
 * <p>웹/Expo 양쪽에서 사용자 표시·라우팅 결정에 사용한다. 민감 PII 는 포함하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppleUserSummary {

    private Long id;

    private String email;

    private String name;

    private String nickname;

    private String role;

    private String tenantId;

    private String profileImageUrl;
}
