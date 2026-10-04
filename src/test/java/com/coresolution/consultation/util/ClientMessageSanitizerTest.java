package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * 응답 문구 정제 — 내부 식별자 제거와 기술 문구 차단.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@DisplayName("ClientMessageSanitizer — 내부 식별자·기술 문구 차단")
class ClientMessageSanitizerTest {

    private static final String FALLBACK = "요청을 처리하지 못했습니다.";

    @ParameterizedTest(name = "[{index}] {0} → {1}")
    @CsvSource(delimiter = '|', value = {
        "세션 정보가 부족합니다. tenantId=abc-123, roleId=null | 세션 정보가 부족합니다.",
        "활성 역할을 찾을 수 없습니다: userId=20, tenantId=t-1 | 활성 역할을 찾을 수 없습니다",
        "테넌트 ERD를 찾을 수 없습니다: tenantId=t-1 | 테넌트 ERD를 찾을 수 없습니다",
        "상담사가 해당 지점에 속하지 않습니다: consultantId=30, branchId=2 | 상담사가 해당 지점에 속하지 않습니다",
        "이미 예약된 시간입니다. | 이미 예약된 시간입니다."
    })
    @DisplayName("내부 식별자는 지우고 한글 안내 문구는 남긴다")
    void stripsInternalIdentifiers(String raw, String expected) {
        assertThat(ClientMessageSanitizer.toClientMessage(raw, FALLBACK)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "[{index}] 기술 문구 → 공통 문구")
    @ValueSource(strings = {
        "For input string: \"abc\"",
        "No enum constant com.coresolution.consultation.constant.UserRole.FOO",
        "could not execute query [Unknown column 'm1_0.deleted_at' in 'field list']",
        "PreparedStatementCallback; bad SQL grammar [SELECT 1]",
        "java.lang.NullPointerException"
    })
    @DisplayName("예외 원문·입력 원문·클래스명·SQL 은 공통 문구로 바꾼다")
    void replacesTechnicalText(String raw) {
        assertThat(ClientMessageSanitizer.toClientMessage(raw, FALLBACK)).isEqualTo(FALLBACK);
    }

    @Test
    @DisplayName("비어 있거나 식별자만 남는 문구는 공통 문구로 바꾼다")
    void blankBecomesFallback() {
        assertThat(ClientMessageSanitizer.toClientMessage(null, FALLBACK)).isEqualTo(FALLBACK);
        assertThat(ClientMessageSanitizer.toClientMessage("   ", FALLBACK)).isEqualTo(FALLBACK);
        assertThat(ClientMessageSanitizer.toClientMessage("tenantId=t-1, roleId=null", FALLBACK))
            .isEqualTo(FALLBACK);
    }
}
