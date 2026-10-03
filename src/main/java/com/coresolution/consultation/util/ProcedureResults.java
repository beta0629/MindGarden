package com.coresolution.consultation.util;

import java.util.Map;
import java.util.function.Supplier;
import com.coresolution.consultation.exception.ProcedureExecutionException;

/**
 * 저장 프로시저 결과를 API 응답으로 넘기기 전에 성공 여부를 확인하는 공통 진입점.
 *
 * <p>프로시저 서비스는 실패를 예외 대신 {@code success:false} 맵이나 {@code "ERROR: ..."} 문자열로 돌려준다.
 * 컨트롤러가 그 값을 바깥 {@code success:true} 로 감싸면 화면에는 성공처럼 보이고 오류가 숨는다.
 * 컨트롤러는 결과를 응답에 넣기 전에 이 클래스를 거친다. 실패면 {@link ProcedureExecutionException} 을 던지고,
 * 전역 예외 처리기가 바깥 {@code success:false} + 한글 문구로 응답한다. 프로시저·SQL 원문은 응답에 넣지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
public final class ProcedureResults {

    /** 결과 맵의 성공 키. */
    public static final String SUCCESS_KEY = "success";

    /** 결과 맵의 메시지 키. */
    public static final String MESSAGE_KEY = "message";

    /** 문자열 결과의 실패 접두사({@code PlSqlStatisticsService}). */
    public static final String TEXT_ERROR_PREFIX = "ERROR";

    private ProcedureResults() {
    }

    /**
     * 결과 맵이 {@code success == true} 일 때만 그대로 돌려준다.
     *
     * @param procedureName 프로시저 이름(로그용)
     * @param result        프로시저 서비스 결과
     * @param userMessage   실패 시 사용자 문구(한글)
     * @return 성공한 결과 맵
     * @throws ProcedureExecutionException 결과가 없거나 {@code success} 가 {@code true} 가 아닐 때
     */
    public static Map<String, Object> requireSuccess(
            String procedureName, Map<String, Object> result, String userMessage) {
        if (result != null && Boolean.TRUE.equals(result.get(SUCCESS_KEY))) {
            return result;
        }
        Object detail = result == null ? "결과 없음" : result.get(MESSAGE_KEY);
        throw new ProcedureExecutionException(procedureName, userMessage, String.valueOf(detail), null);
    }

    /**
     * {@code "ERROR: ..."} 문자열 결과면 실패로 끝낸다. 그 밖의 값(SUCCESS/WARNING)은 그대로 돌려준다.
     *
     * @param procedureName 프로시저 이름(로그용)
     * @param result        프로시저 서비스 결과 문자열
     * @param userMessage   실패 시 사용자 문구(한글)
     * @return 실패가 아닌 결과 문자열
     * @throws ProcedureExecutionException 결과가 없거나 {@code ERROR} 로 시작할 때
     */
    public static String requireSuccessText(String procedureName, String result, String userMessage) {
        if (result != null && !result.startsWith(TEXT_ERROR_PREFIX)) {
            return result;
        }
        throw new ProcedureExecutionException(procedureName, userMessage,
                result == null ? "결과 없음" : result, null);
    }

    /**
     * 프로시저 서비스를 호출하고, 예외든 {@code success:false} 든 실패면 {@link ProcedureExecutionException} 으로 끝낸다.
     *
     * @param procedureName 프로시저 이름(로그용)
     * @param userMessage   실패 시 사용자 문구(한글)
     * @param call          프로시저 서비스 호출
     * @return 성공한 결과 맵
     * @throws ProcedureExecutionException 호출 예외 또는 {@code success} 가 {@code true} 가 아닐 때
     */
    public static Map<String, Object> callRequiringSuccess(
            String procedureName, String userMessage, Supplier<Map<String, Object>> call) {
        Map<String, Object> result;
        try {
            result = call.get();
        } catch (RuntimeException e) {
            throw failure(procedureName, userMessage, e);
        }
        return requireSuccess(procedureName, result, userMessage);
    }

    /**
     * 호출 중 예외를 프로시저 실패로 바꾼다. 이미 {@link ProcedureExecutionException} 이면 그대로 돌려준다.
     *
     * @param procedureName 프로시저 이름(로그용)
     * @param userMessage   사용자 문구(한글)
     * @param cause         원인 예외
     * @return 던질 예외
     */
    public static ProcedureExecutionException failure(String procedureName, String userMessage, Throwable cause) {
        if (cause instanceof ProcedureExecutionException procedureFailure) {
            return procedureFailure;
        }
        String detail = cause == null ? null : cause.getClass().getSimpleName() + ": " + cause.getMessage();
        return new ProcedureExecutionException(procedureName, userMessage, detail, cause);
    }
}
