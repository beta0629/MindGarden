package com.coresolution.core.service;

import com.coresolution.core.dto.ErdValidationReport;

import java.io.File;
import java.util.List;

/**
 * ERD 검증 리포트 생성 서비스 인터페이스
 * <p>
 * ERD 검증 결과를 리포트 형식으로 생성하고 저장합니다.
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface ErdValidationReportService {

    /**
     * 검증 리포트를 JSON 파일로 저장
     *
     * @param report 검증 리포트
     * @param outputPath 출력 파일 경로
     * @return 저장된 파일
     */
    File saveReportAsJson(ErdValidationReport report, String outputPath);

    /**
     * 검증 리포트를 HTML 파일로 저장
     *
     * @param report 검증 리포트
     * @param outputPath 출력 파일 경로
     * @return 저장된 파일
     */
    File saveReportAsHtml(ErdValidationReport report, String outputPath);

    /**
     * 검증 리포트를 마크다운 파일로 저장
     *
     * @param report 검증 리포트
     * @param outputPath 출력 파일 경로
     * @return 저장된 파일
     */
    File saveReportAsMarkdown(ErdValidationReport report, String outputPath);

    /**
     * 여러 검증 리포트를 통합 리포트로 생성
     *
     * @param reports 검증 리포트 목록
     * @param outputPath 출력 파일 경로
     * @return 저장된 파일
     */
    File generateConsolidatedReport(List<ErdValidationReport> reports, String outputPath);

    /**
     * 검증 리포트를 이메일로 발송
     *
     * @param report 검증 리포트
     * @param recipientEmail 수신자 이메일
     * @return 발송 성공 여부
     */
    boolean sendReportByEmail(ErdValidationReport report, String recipientEmail);
}

