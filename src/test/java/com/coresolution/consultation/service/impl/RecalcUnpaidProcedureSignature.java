package com.coresolution.consultation.service.impl;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.impl.StandardProcedureSqlSignature.Param;

/**
 * 배포 SQL 파일에서 {@code RecalcUnpaidSalaryCalculation} 파라미터를 읽는다.
 * 테스트가 시그니처를 손으로 다시 적지 않게 한다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
final class RecalcUnpaidProcedureSignature {

    static final String PROCEDURE = "RecalcUnpaidSalaryCalculation";

    static final Path STANDARDIZED = StandardProcedureSqlSignature.standardized(PROCEDURE);

    static final Path DEPLOY = StandardProcedureSqlSignature.deploy(PROCEDURE);

    private RecalcUnpaidProcedureSignature() {
    }

    /**
     * @return 표준 SQL 과 배포 twin 의 파라미터. 둘이 다르면 예외
     */
    static List<Param> readDeployedDefinition() {
        return StandardProcedureSqlSignature.readDeployedDefinition(PROCEDURE);
    }

    /**
     * @return information_schema.PARAMETERS 행 형태. 모드·이름은 SQL 파일 그대로다
     */
    static List<Map<String, Object>> informationSchemaRows() {
        return StandardProcedureSqlSignature.informationSchemaRows(PROCEDURE);
    }
}
