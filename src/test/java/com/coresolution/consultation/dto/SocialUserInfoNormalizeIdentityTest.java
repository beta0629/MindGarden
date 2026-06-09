package com.coresolution.consultation.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * P1 회귀 — 카카오/네이버 OAuth 응답에서 nickname·name 이 빈 값이거나 "null"·"undefined" 리터럴로
 * 직렬화되어 들어왔을 때 {@link SocialUserInfo#normalizeData()} 가 안전하게 비워주는지 검증한다.
 *
 * <p>증상: 카카오 간편가입 화면 "이름(표시명)" 입력 필드에 "null" 문자열 그대로 표시.
 * 본 테스트는 BE 표준화 단계에서 같은 문자열이 응답으로 흘러나가지 않도록 가드한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@DisplayName("SocialUserInfo.normalizeData — nickname/name null 리터럴 정리")
class SocialUserInfoNormalizeIdentityTest {

    @Test
    @DisplayName("nickname/name 이 둘 다 \"null\" 문자열이면 정리 후 null 로 비운다")
    void normalizeRemovesLiteralNullStrings() {
        SocialUserInfo info = SocialUserInfo.builder()
                .nickname("null")
                .name("null")
                .build();

        info.normalizeData();

        assertThat(info.getNickname()).isNull();
        assertThat(info.getName()).isNull();
    }

    @Test
    @DisplayName("nickname \"undefined\", name \" Null \" 같은 다양한 리터럴도 비운다")
    void normalizeRemovesUndefinedAndCaseInsensitiveNullStrings() {
        SocialUserInfo info = SocialUserInfo.builder()
                .nickname("undefined")
                .name("  Null  ")
                .build();

        info.normalizeData();

        assertThat(info.getNickname()).isNull();
        assertThat(info.getName()).isNull();
    }

    @Test
    @DisplayName("정상 닉네임은 그대로 유지되고, name 미제공 시 nickname 으로 채운다")
    void normalizeKeepsValidNicknameAndFillsName() {
        SocialUserInfo info = SocialUserInfo.builder()
                .nickname("홍길동")
                .build();

        info.normalizeData();

        assertThat(info.getNickname()).isEqualTo("홍길동");
        assertThat(info.getName()).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("nickname 이 빈 문자열·공백이면 name 으로 대체된다")
    void normalizeFillsNicknameFromName() {
        SocialUserInfo info = SocialUserInfo.builder()
                .nickname("   ")
                .name("길동")
                .build();

        info.normalizeData();

        assertThat(info.getName()).isEqualTo("길동");
        assertThat(info.getNickname()).isEqualTo("길동");
    }
}
