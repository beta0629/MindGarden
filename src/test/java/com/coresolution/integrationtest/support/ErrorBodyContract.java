package com.coresolution.integrationtest.support;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.coresolution.consultation.constant.ServerErrorMessages;
import org.springframework.test.web.servlet.ResultActions;

/**
 * 오류 응답 공통 계약 검증 헬퍼.
 *
 * <p>5xx 는 어느 경로에서 나오든 같은 모양이어야 한다 — 공통 한글 문구 + {@code errorCode}
 * + {@code traceId}, 그리고 SQL·클래스명·스택 문구 미노출. 4xx 는 사용자용 문구를 유지하되
 * {@code traceId} 를 싣지 않는다.</p>
 *
 * <p>새 엔드포인트를 추가할 때 이 헬퍼로 같은 계약을 재사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-04
 */
public final class ErrorBodyContract {

    /**
     * 응답 본문 값에 절대 나오면 안 되는 기술 문구 조각.
     *
     * <p>{@code stackTrace}·{@code details} 는 키 자체는 {@code null} 로 직렬화되므로
     * 여기 넣지 않고 jsonPath 로 값이 비었는지만 확인한다.</p>
     */
    private static final List<String> FORBIDDEN_FRAGMENTS = List.of(
            "SQL", "sql", "select ", "SELECT ", "insert into",
            "Exception", "java.", "org.springframework", "com.coresolution",
            "at com.", "Caused by",
            "Hibernate", "JDBC", "jdbc", "Access denied", "bad SQL grammar");

    private ErrorBodyContract() {
    }

    /**
     * 5xx 공통 계약을 검증한다.
     *
     * @param actions MockMvc 수행 결과
     * @throws Exception 검증 실패 시
     */
    public static void assertSanitizedServerError(ResultActions actions) throws Exception {
        actions.andExpect(status().is5xxServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ServerErrorMessages.INTERNAL_SERVER_ERROR))
                .andExpect(jsonPath("$.errorCode").isNotEmpty())
                .andExpect(jsonPath("$.traceId").isNotEmpty())
                .andExpect(jsonPath("$.details").doesNotExist())
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
        assertNoTechnicalLeak(actions);
    }

    /**
     * 400 공통 계약을 검증한다 — 사용자용 한글 문구, 지정한 오류 코드, traceId 없음.
     *
     * @param actions   MockMvc 수행 결과
     * @param message   기대 사용자 문구
     * @param errorCode 기대 오류 코드
     * @throws Exception 검증 실패 시
     */
    public static void assertBadRequest(ResultActions actions, String message, String errorCode) throws Exception {
        actions.andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(message))
                .andExpect(jsonPath("$.errorCode").value(errorCode))
                .andExpect(jsonPath("$.traceId").doesNotExist());
        assertNoTechnicalLeak(actions);
    }

    /**
     * 응답 본문에 기술 문구(SQL·클래스명·스택)가 없는지 검증한다.
     *
     * @param actions MockMvc 수행 결과
     * @throws Exception 검증 실패 시
     */
    public static void assertNoTechnicalLeak(ResultActions actions) throws Exception {
        for (String fragment : FORBIDDEN_FRAGMENTS) {
            actions.andExpect(content().string(not(containsString(fragment))));
        }
    }
}
