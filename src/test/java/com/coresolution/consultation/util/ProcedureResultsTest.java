package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.exception.ProcedureExecutionException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ProcedureResults} — 프로시저 내부 실패가 바깥 성공으로 숨지 않는지, 원문이 사용자 문구에 섞이지 않는지.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("ProcedureResults 공통 실패 처리")
class ProcedureResultsTest {

    private static final String PROC = "GetIntegratedSalaryStatistics";
    private static final String USER_MESSAGE = "급여 통계를 불러오지 못했습니다.";
    private static final String RAW_SQL_ERROR = "Parameter number 4 is not an OUT parameter";

    @Test
    @DisplayName("success=true 맵은 그대로 돌려준다")
    void requireSuccess_passesSuccessfulMap() {
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("totalCalculations", 3);

        assertThat(ProcedureResults.requireSuccess(PROC, ok, USER_MESSAGE)).isSameAs(ok);
    }

    @Test
    @DisplayName("내부 success=false → 한글 사용자 문구로 실패, 원문은 detail 에만")
    void requireSuccess_innerFalse_throwsKoreanMessageWithoutRawText() {
        Map<String, Object> failed = new HashMap<>();
        failed.put("success", false);
        failed.put("message", "급여 통계 조회 중 오류가 발생했습니다: " + RAW_SQL_ERROR);

        assertThatThrownBy(() -> ProcedureResults.requireSuccess(PROC, failed, USER_MESSAGE))
                .isInstanceOf(ProcedureExecutionException.class)
                .hasMessage(USER_MESSAGE)
                .satisfies(e -> {
                    ProcedureExecutionException pe = (ProcedureExecutionException) e;
                    assertThat(pe.getMessage()).doesNotContain(RAW_SQL_ERROR);
                    assertThat(pe.getDetail()).contains(RAW_SQL_ERROR);
                    assertThat(pe.getProcedureName()).isEqualTo(PROC);
                });
    }

    @Test
    @DisplayName("success 가 null·문자열 \"true\"·결과 null 이면 실패")
    void requireSuccess_nonBooleanTrue_isFailure() {
        Map<String, Object> missing = new HashMap<>();
        Map<String, Object> textTrue = new HashMap<>();
        textTrue.put("success", "true");

        assertThatThrownBy(() -> ProcedureResults.requireSuccess(PROC, missing, USER_MESSAGE))
                .isInstanceOf(ProcedureExecutionException.class);
        assertThatThrownBy(() -> ProcedureResults.requireSuccess(PROC, textTrue, USER_MESSAGE))
                .isInstanceOf(ProcedureExecutionException.class);
        assertThatThrownBy(() -> ProcedureResults.requireSuccess(PROC, null, USER_MESSAGE))
                .isInstanceOf(ProcedureExecutionException.class)
                .hasMessage(USER_MESSAGE);
    }

    @Test
    @DisplayName("호출이 SQLException 을 감싼 예외를 던지면 한글 문구로 실패")
    void callRequiringSuccess_sqlException_isFailure() {
        RuntimeException thrown = new RuntimeException(new SQLException(RAW_SQL_ERROR));

        assertThatThrownBy(() -> ProcedureResults.callRequiringSuccess(PROC, USER_MESSAGE, () -> {
            throw thrown;
        }))
                .isInstanceOf(ProcedureExecutionException.class)
                .hasMessage(USER_MESSAGE)
                .hasCause(thrown);
    }

    @Test
    @DisplayName("이미 ProcedureExecutionException 이면 감싸지 않는다")
    void failure_keepsExistingProcedureFailure() {
        ProcedureExecutionException original = new ProcedureExecutionException(PROC, USER_MESSAGE, "d", null);

        assertThat(ProcedureResults.failure("Other", "다른 문구", original)).isSameAs(original);
    }

    @Test
    @DisplayName("문자열 결과: ERROR 는 실패, SUCCESS·WARNING 은 통과")
    void requireSuccessText_errorPrefixFails() {
        assertThat(ProcedureResults.requireSuccessText(PROC, "SUCCESS: 완료", USER_MESSAGE)).isEqualTo("SUCCESS: 완료");
        assertThat(ProcedureResults.requireSuccessText(PROC, "WARNING: fallback", USER_MESSAGE))
                .isEqualTo("WARNING: fallback");
        assertThatThrownBy(() -> ProcedureResults.requireSuccessText(PROC, "ERROR: " + RAW_SQL_ERROR, USER_MESSAGE))
                .isInstanceOf(ProcedureExecutionException.class)
                .hasMessage(USER_MESSAGE);
        assertThatThrownBy(() -> ProcedureResults.requireSuccessText(PROC, null, USER_MESSAGE))
                .isInstanceOf(ProcedureExecutionException.class);
    }
}
