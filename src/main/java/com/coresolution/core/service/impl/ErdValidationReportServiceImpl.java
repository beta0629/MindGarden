package com.coresolution.core.service.impl;

import com.coresolution.core.dto.ErdValidationReport;
import com.coresolution.core.service.ErdValidationReportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * ERD 검증 리포트 생성 서비스 구현체
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ErdValidationReportServiceImpl implements ErdValidationReportService {

    private final ObjectMapper objectMapper;

    @Value("${erd.validation.report.output-dir:reports/erd-validation}")
    private String reportOutputDir;

    public ErdValidationReportServiceImpl() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Override
    public File saveReportAsJson(ErdValidationReport report, String outputPath) {
        log.info("검증 리포트 JSON 저장: outputPath={}", outputPath);

        try {
            Path path = Paths.get(outputPath);
            Files.createDirectories(path.getParent());

            objectMapper.writeValue(path.toFile(), report);

            log.info("✅ 검증 리포트 JSON 저장 완료: {}", outputPath);
            return path.toFile();

        } catch (IOException e) {
            log.error("❌ 검증 리포트 JSON 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("검증 리포트 저장 실패", e);
        }
    }

    @Override
    public File saveReportAsHtml(ErdValidationReport report, String outputPath) {
        log.info("검증 리포트 HTML 저장: outputPath={}", outputPath);

        try {
            Path path = Paths.get(outputPath);
            Files.createDirectories(path.getParent());

            String html = generateHtmlReport(report);

            try (FileWriter writer = new FileWriter(path.toFile())) {
                writer.write(html);
            }

            log.info("✅ 검증 리포트 HTML 저장 완료: {}", outputPath);
            return path.toFile();

        } catch (IOException e) {
            log.error("❌ 검증 리포트 HTML 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("검증 리포트 저장 실패", e);
        }
    }

    @Override
    public File saveReportAsMarkdown(ErdValidationReport report, String outputPath) {
        log.info("검증 리포트 Markdown 저장: outputPath={}", outputPath);

        try {
            Path path = Paths.get(outputPath);
            Files.createDirectories(path.getParent());

            String markdown = generateMarkdownReport(report);

            try (FileWriter writer = new FileWriter(path.toFile())) {
                writer.write(markdown);
            }

            log.info("✅ 검증 리포트 Markdown 저장 완료: {}", outputPath);
            return path.toFile();

        } catch (IOException e) {
            log.error("❌ 검증 리포트 Markdown 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("검증 리포트 저장 실패", e);
        }
    }

    @Override
    public File generateConsolidatedReport(List<ErdValidationReport> reports, String outputPath) {
        log.info("통합 검증 리포트 생성: reportCount={}, outputPath={}", reports.size(), outputPath);

        try {
            Path path = Paths.get(outputPath);
            Files.createDirectories(path.getParent());

            String markdown = generateConsolidatedMarkdownReport(reports);

            try (FileWriter writer = new FileWriter(path.toFile())) {
                writer.write(markdown);
            }

            log.info("✅ 통합 검증 리포트 생성 완료: {}", outputPath);
            return path.toFile();

        } catch (IOException e) {
            log.error("❌ 통합 검증 리포트 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("통합 검증 리포트 생성 실패", e);
        }
    }

    @Override
    public boolean sendReportByEmail(ErdValidationReport report, String recipientEmail) {
        log.info("검증 리포트 이메일 발송: recipientEmail={}", recipientEmail);

        // TODO: 이메일 발송 구현 (EmailService 사용)
        log.warn("검증 리포트 이메일 발송 기능은 아직 구현되지 않았습니다.");
        return false;
    }

    /**
     * HTML 리포트 생성
     */
    private String generateHtmlReport(ErdValidationReport report) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>\n");
        html.append("<html>\n");
        html.append("<head>\n");
        html.append("    <meta charset=\"UTF-8\">\n");
        html.append("    <title>ERD 검증 리포트</title>\n");
        html.append("    <style>\n");
        html.append("        body { font-family: Arial, sans-serif; margin: 20px; }\n");
        html.append("        .header { background-color: #2c3e50; color: white; padding: 20px; }\n");
        html.append("        .status-valid { color: green; }\n");
        html.append("        .status-invalid { color: red; }\n");
        html.append("        .status-warning { color: orange; }\n");
        html.append("        table { border-collapse: collapse; width: 100%; margin: 20px 0; }\n");
        html.append("        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n");
        html.append("        th { background-color: #f2f2f2; }\n");
        html.append("    </style>\n");
        html.append("</head>\n");
        html.append("<body>\n");
        html.append("    <div class=\"header\">\n");
        html.append("        <h1>ERD 검증 리포트</h1>\n");
        html.append("    </div>\n");
        html.append("    <div>\n");
        html.append("        <h2>기본 정보</h2>\n");
        html.append("        <p><strong>ERD ID:</strong> ").append(report.getDiagramId()).append("</p>\n");
        html.append("        <p><strong>ERD 이름:</strong> ").append(report.getErdName()).append("</p>\n");
        html.append("        <p><strong>검증 상태:</strong> <span class=\"status-").append(report.getStatus().name().toLowerCase()).append("\">").append(report.getStatus().getDescription()).append("</span></p>\n");
        html.append("        <p><strong>검증 시각:</strong> ").append(report.getValidatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("</p>\n");
        html.append("    </div>\n");
        html.append("    <div>\n");
        html.append("        <h2>검증 통계</h2>\n");
        html.append("        <table>\n");
        html.append("            <tr><th>항목</th><th>값</th></tr>\n");
        html.append("            <tr><td>ERD 테이블 수</td><td>").append(report.getStatistics().getErdTableCount()).append("</td></tr>\n");
        html.append("            <tr><td>스키마 테이블 수</td><td>").append(report.getStatistics().getSchemaTableCount()).append("</td></tr>\n");
        html.append("            <tr><td>일치하는 테이블 수</td><td>").append(report.getStatistics().getMatchedTableCount()).append("</td></tr>\n");
        html.append("            <tr><td>누락된 테이블 수</td><td>").append(report.getStatistics().getMissingTableCount()).append("</td></tr>\n");
        html.append("            <tr><td>추가된 테이블 수</td><td>").append(report.getStatistics().getExtraTableCount()).append("</td></tr>\n");
        html.append("            <tr><td>총 이슈 수</td><td>").append(report.getStatistics().getTotalIssueCount()).append("</td></tr>\n");
        html.append("            <tr><td>오류 수</td><td>").append(report.getStatistics().getErrorCount()).append("</td></tr>\n");
        html.append("            <tr><td>경고 수</td><td>").append(report.getStatistics().getWarningCount()).append("</td></tr>\n");
        html.append("        </table>\n");
        html.append("    </div>\n");
        html.append("    <div>\n");
        html.append("        <h2>검증 이슈</h2>\n");
        if (report.getIssues() != null && !report.getIssues().isEmpty()) {
            html.append("        <table>\n");
            html.append("            <tr><th>타입</th><th>심각도</th><th>설명</th><th>테이블</th></tr>\n");
            for (ErdValidationReport.ValidationIssue issue : report.getIssues()) {
                html.append("            <tr>\n");
                html.append("                <td>").append(issue.getIssueType().getDescription()).append("</td>\n");
                html.append("                <td>").append(issue.getSeverity().getDescription()).append("</td>\n");
                html.append("                <td>").append(issue.getDescription()).append("</td>\n");
                html.append("                <td>").append(issue.getTableName() != null ? issue.getTableName() : "-").append("</td>\n");
                html.append("            </tr>\n");
            }
            html.append("        </table>\n");
        } else {
            html.append("        <p>이슈가 없습니다.</p>\n");
        }
        html.append("    </div>\n");
        html.append("</body>\n");
        html.append("</html>\n");
        return html.toString();
    }

    /**
     * Markdown 리포트 생성
     */
    private String generateMarkdownReport(ErdValidationReport report) {
        StringBuilder md = new StringBuilder();
        md.append("# ERD 검증 리포트\n\n");
        md.append("**생성 시각:** ").append(report.getValidatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");
        md.append("## 기본 정보\n\n");
        md.append("- **ERD ID:** ").append(report.getDiagramId()).append("\n");
        md.append("- **ERD 이름:** ").append(report.getErdName()).append("\n");
        md.append("- **검증 상태:** ").append(report.getStatus().getDescription()).append("\n\n");
        md.append("## 검증 통계\n\n");
        md.append("| 항목 | 값 |\n");
        md.append("|------|-----|\n");
        md.append("| ERD 테이블 수 | ").append(report.getStatistics().getErdTableCount()).append(" |\n");
        md.append("| 스키마 테이블 수 | ").append(report.getStatistics().getSchemaTableCount()).append(" |\n");
        md.append("| 일치하는 테이블 수 | ").append(report.getStatistics().getMatchedTableCount()).append(" |\n");
        md.append("| 누락된 테이블 수 | ").append(report.getStatistics().getMissingTableCount()).append(" |\n");
        md.append("| 추가된 테이블 수 | ").append(report.getStatistics().getExtraTableCount()).append(" |\n");
        md.append("| 총 이슈 수 | ").append(report.getStatistics().getTotalIssueCount()).append(" |\n");
        md.append("| 오류 수 | ").append(report.getStatistics().getErrorCount()).append(" |\n");
        md.append("| 경고 수 | ").append(report.getStatistics().getWarningCount()).append(" |\n\n");
        md.append("## 검증 이슈\n\n");
        if (report.getIssues() != null && !report.getIssues().isEmpty()) {
            md.append("| 타입 | 심각도 | 설명 | 테이블 |\n");
            md.append("|------|--------|------|--------|\n");
            for (ErdValidationReport.ValidationIssue issue : report.getIssues()) {
                md.append("| ").append(issue.getIssueType().getDescription())
                  .append(" | ").append(issue.getSeverity().getDescription())
                  .append(" | ").append(issue.getDescription())
                  .append(" | ").append(issue.getTableName() != null ? issue.getTableName() : "-")
                  .append(" |\n");
            }
        } else {
            md.append("이슈가 없습니다.\n");
        }
        return md.toString();
    }

    /**
     * 통합 Markdown 리포트 생성
     */
    private String generateConsolidatedMarkdownReport(List<ErdValidationReport> reports) {
        StringBuilder md = new StringBuilder();
        md.append("# ERD 검증 통합 리포트\n\n");
        md.append("**생성 시각:** ").append(java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
        md.append("**검증된 ERD 수:** ").append(reports.size()).append("\n\n");

        int validCount = 0;
        int invalidCount = 0;
        int warningCount = 0;

        for (ErdValidationReport report : reports) {
            switch (report.getStatus()) {
                case VALID:
                    validCount++;
                    break;
                case INVALID:
                    invalidCount++;
                    break;
                case WARNING:
                    warningCount++;
                    break;
            }
        }

        md.append("## 전체 요약\n\n");
        md.append("| 상태 | 개수 |\n");
        md.append("|------|-----|\n");
        md.append("| 유효함 | ").append(validCount).append(" |\n");
        md.append("| 경고 | ").append(warningCount).append(" |\n");
        md.append("| 유효하지 않음 | ").append(invalidCount).append(" |\n\n");

        md.append("## 상세 리포트\n\n");
        for (ErdValidationReport report : reports) {
            md.append("### ").append(report.getErdName()).append("\n\n");
            md.append("- **ERD ID:** ").append(report.getDiagramId()).append("\n");
            md.append("- **상태:** ").append(report.getStatus().getDescription()).append("\n");
            md.append("- **이슈 수:** ").append(report.getStatistics().getTotalIssueCount()).append("\n\n");
        }

        return md.toString();
    }
}

