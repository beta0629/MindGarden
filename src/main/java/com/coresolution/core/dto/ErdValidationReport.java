package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ERD 검증 리포트 DTO
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdValidationReport {

    /**
     * ERD 다이어그램 ID
     */
    private String diagramId;

    /**
     * 테넌트 ID (테넌트 ERD인 경우)
     */
    private String tenantId;

    /**
     * ERD 이름
     */
    private String erdName;

    /**
     * 검증 결과 (VALID, INVALID, WARNING)
     */
    private ValidationStatus status;

    /**
     * 검증 시각
     */
    private LocalDateTime validatedAt;

    /**
     * 검증자
     */
    private String validatedBy;

    /**
     * 검증 결과 요약
     */
    private String summary;

    /**
     * 검증 상세 결과
     */
    private List<ValidationIssue> issues;

    /**
     * 검증 통계
     */
    private ValidationStatistics statistics;

    /**
     * 검증 상태 열거형
     */
    public enum ValidationStatus {
        VALID("유효함"),
        INVALID("유효하지 않음"),
        WARNING("경고");

        private final String description;

        ValidationStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 검증 이슈
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationIssue {
        /**
         * 이슈 타입 (MISSING_TABLE, MISSING_COLUMN, MISSING_RELATION, EXTRA_TABLE, EXTRA_COLUMN 등)
         */
        private IssueType issueType;

        /**
         * 이슈 심각도 (ERROR, WARNING, INFO)
         */
        private Severity severity;

        /**
         * 이슈 설명
         */
        private String description;

        /**
         * 관련 테이블 이름
         */
        private String tableName;

        /**
         * 관련 컬럼 이름
         */
        private String columnName;

        /**
         * 관련 관계 정보
         */
        private String relationInfo;

        /**
         * 이슈 타입 열거형
         */
        public enum IssueType {
            MISSING_TABLE("누락된 테이블"),
            MISSING_COLUMN("누락된 컬럼"),
            MISSING_RELATION("누락된 관계"),
            EXTRA_TABLE("추가된 테이블"),
            EXTRA_COLUMN("추가된 컬럼"),
            EXTRA_RELATION("추가된 관계"),
            COLUMN_TYPE_MISMATCH("컬럼 타입 불일치"),
            COLUMN_NULLABLE_MISMATCH("컬럼 NULL 허용 여부 불일치"),
            RELATION_MISMATCH("관계 불일치");

            private final String description;

            IssueType(String description) {
                this.description = description;
            }

            public String getDescription() {
                return description;
            }
        }

        /**
         * 심각도 열거형
         */
        public enum Severity {
            ERROR("오류"),
            WARNING("경고"),
            INFO("정보");

            private final String description;

            Severity(String description) {
                this.description = description;
            }

            public String getDescription() {
                return description;
            }
        }
    }

    /**
     * 검증 통계
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationStatistics {
        /**
         * ERD에 있는 테이블 수
         */
        private int erdTableCount;

        /**
         * 실제 스키마의 테이블 수
         */
        private int schemaTableCount;

        /**
         * 일치하는 테이블 수
         */
        private int matchedTableCount;

        /**
         * 누락된 테이블 수
         */
        private int missingTableCount;

        /**
         * 추가된 테이블 수
         */
        private int extraTableCount;

        /**
         * 총 이슈 수
         */
        private int totalIssueCount;

        /**
         * 오류 수
         */
        private int errorCount;

        /**
         * 경고 수
         */
        private int warningCount;

        /**
         * 정보 수
         */
        private int infoCount;
    }
}

