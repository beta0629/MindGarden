package com.coresolution.core.controller.ops;

import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.dto.CustomErdGenerationRequest;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.dto.ErdValidationReport;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.ErdHistoryService;
import com.coresolution.core.service.ErdValidationService;
import com.coresolution.core.service.ErdValidationReportService;
import com.coresolution.core.service.SchemaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

/**
 * HQ 운영 포털 ERD 관리 API 컨트롤러
 * <p>
 * HQ 운영 포털에서 ERD를 관리하는 API를 제공합니다.
 * - 모든 ERD 목록 조회 (필터링, 검색)
 * - ERD 수동 생성
 * - ERD 검증
 * - ERD 버전 비교
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/erd")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
@Tag(name = "HQ 운영 포털 ERD 관리", description = "HQ 운영 포털 ERD 관리 API (관리자 전용)")
public class ErdOpsController {

    private final ErdGenerationService erdGenerationService;
    private final ErdHistoryService erdHistoryService;
    private final ErdValidationService erdValidationService;
    private final ErdValidationReportService erdValidationReportService;
    private final SchemaService schemaService;

    /**
     * 모든 ERD 목록 조회 (필터링, 검색 지원)
     */
    @Operation(
            summary = "모든 ERD 목록 조회",
            description = "HQ 운영 포털에서 모든 ERD 목록을 조회합니다. 테넌트 ID, ERD 타입, 활성 상태로 필터링 가능합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ErdDiagramResponse.class))),
            @ApiResponse(responseCode = "403", description = "권한 없음 (ADMIN 또는 OPS 역할 필요)")
    })
    @GetMapping
    public ResponseEntity<List<ErdDiagramResponse>> getAllErds(
            @Parameter(description = "테넌트 ID (필터)") @RequestParam(required = false) String tenantId,
            @Parameter(description = "ERD 타입 (필터)") @RequestParam(required = false) ErdDiagram.DiagramType diagramType,
            @Parameter(description = "활성 상태 (필터)") @RequestParam(required = false) Boolean isActive,
            @Parameter(description = "검색어 (ERD 이름, 설명)") @RequestParam(required = false) String search) {

        log.debug("HQ 운영 포털 ERD 목록 조회 요청: tenantId={}, diagramType={}, isActive={}, search={}",
                tenantId, diagramType, isActive, search);

        // TODO: 필터링 및 검색 로직 구현 (ErdGenerationService에 메서드 추가 필요)
        List<ErdDiagramResponse> erds;

        if (tenantId != null) {
            erds = erdGenerationService.getTenantErds(tenantId);
        } else if (diagramType != null) {
            erds = erdGenerationService.getActiveErds(diagramType);
        } else {
            // 전체 ERD 조회 (현재는 활성 ERD만)
            erds = erdGenerationService.getActiveErds(ErdDiagram.DiagramType.FULL);
            // TODO: 모든 타입의 ERD를 조회하는 메서드 추가 필요
        }

        // 검색어 필터링
        if (search != null && !search.isEmpty()) {
            String lowerSearch = search.toLowerCase();
            erds = erds.stream()
                    .filter(erd -> (erd.getName() != null && erd.getName().toLowerCase().contains(lowerSearch)) ||
                            (erd.getDescription() != null && erd.getDescription().toLowerCase().contains(lowerSearch)))
                    .toList();
        }

        // 활성 상태 필터링
        if (isActive != null) {
            erds = erds.stream()
                    .filter(erd -> erd.getIsActive().equals(isActive))
                    .toList();
        }

        return ResponseEntity.ok(erds);
    }

    /**
     * ERD 상세 조회
     */
    @Operation(
            summary = "ERD 상세 조회",
            description = "특정 ERD의 상세 정보를 조회합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "ERD를 찾을 수 없음")
    })
    @GetMapping("/{diagramId}")
    public ResponseEntity<ErdDiagramResponse> getErdDetail(
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId) {

        log.debug("HQ 운영 포털 ERD 상세 조회 요청: diagramId={}", diagramId);

        ErdDiagramResponse erd = erdGenerationService.getErd(diagramId);
        return ResponseEntity.ok(erd);
    }

    /**
     * 전체 시스템 ERD 수동 생성
     */
    @Operation(
            summary = "전체 시스템 ERD 수동 생성",
            description = "HQ 운영 포털에서 전체 시스템 ERD를 수동으로 생성합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @PostMapping("/generate/full-system")
    public ResponseEntity<ErdDiagramResponse> generateFullSystemErd(
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName,
            Authentication authentication) {

        log.info("HQ 운영 포털 전체 시스템 ERD 수동 생성 요청: schemaName={}, user={}",
                schemaName, authentication != null ? authentication.getName() : "unknown");

        String createdBy = authentication != null ? authentication.getName() : "ops-user";
        ErdDiagramResponse erd = erdGenerationService.generateFullSystemErd(schemaName, createdBy);

        return ResponseEntity.ok(erd);
    }

    /**
     * 테넌트 ERD 수동 생성
     */
    @Operation(
            summary = "테넌트 ERD 수동 생성",
            description = "HQ 운영 포털에서 특정 테넌트의 ERD를 수동으로 생성합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (테넌트 ID 누락 등)")
    })
    @PostMapping("/generate/tenant/{tenantId}")
    public ResponseEntity<ErdDiagramResponse> generateTenantErd(
            @Parameter(description = "테넌트 ID", required = true) @PathVariable String tenantId,
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName,
            Authentication authentication) {

        log.info("HQ 운영 포털 테넌트 ERD 수동 생성 요청: tenantId={}, schemaName={}, user={}",
                tenantId, schemaName, authentication != null ? authentication.getName() : "unknown");

        String createdBy = authentication != null ? authentication.getName() : "ops-user";
        ErdDiagramResponse erd = erdGenerationService.generateTenantErd(tenantId, schemaName, createdBy);

        return ResponseEntity.ok(erd);
    }

    /**
     * 모듈 ERD 수동 생성
     */
    @Operation(
            summary = "모듈 ERD 수동 생성",
            description = "HQ 운영 포털에서 특정 모듈의 ERD를 수동으로 생성합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (모듈 타입 누락 등)")
    })
    @PostMapping("/generate/module/{moduleType}")
    public ResponseEntity<ErdDiagramResponse> generateModuleErd(
            @Parameter(description = "모듈 타입", required = true) @PathVariable String moduleType,
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName,
            Authentication authentication) {

        log.info("HQ 운영 포털 모듈 ERD 수동 생성 요청: moduleType={}, schemaName={}, user={}",
                moduleType, schemaName, authentication != null ? authentication.getName() : "unknown");

        String createdBy = authentication != null ? authentication.getName() : "ops-user";
        ErdDiagramResponse erd = erdGenerationService.generateModuleErd(moduleType, schemaName, createdBy);

        return ResponseEntity.ok(erd);
    }

    /**
     * 커스텀 ERD 수동 생성
     */
    @Operation(
            summary = "커스텀 ERD 수동 생성",
            description = "HQ 운영 포털에서 특정 테이블 목록을 선택하여 커스텀 ERD를 생성합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (테이블 목록 누락 등)")
    })
    @PostMapping("/generate/custom")
    public ResponseEntity<ErdDiagramResponse> generateCustomErd(
            @Valid @RequestBody CustomErdGenerationRequest request,
            Authentication authentication) {

        log.info("HQ 운영 포털 커스텀 ERD 수동 생성 요청: tableNames={}, name={}, user={}",
                request.getTableNames(), request.getName(), authentication != null ? authentication.getName() : "unknown");

        String createdBy = authentication != null ? authentication.getName() : "ops-user";
        ErdDiagramResponse erd = erdGenerationService.generateCustomErd(
                request.getTableNames(),
                request.getName(),
                request.getDescription(),
                request.getSchemaName(),
                createdBy
        );

        return ResponseEntity.ok(erd);
    }

    /**
     * ERD 검증 실행
     */
    @Operation(
            summary = "ERD 검증 실행",
            description = "특정 ERD를 검증하여 스키마와의 일치 여부를 확인합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "검증 완료"),
            @ApiResponse(responseCode = "404", description = "ERD를 찾을 수 없음")
    })
    @PostMapping("/{diagramId}/validate")
    public ResponseEntity<ErdValidationReport> validateErd(
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId,
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName) {

        log.info("HQ 운영 포털 ERD 검증 요청: diagramId={}, schemaName={}", diagramId, schemaName);

        ErdValidationReport report = erdValidationService.validateErd(diagramId, schemaName);
        return ResponseEntity.ok(report);
    }

    /**
     * ERD 검증 리포트 다운로드 (JSON)
     */
    @Operation(
            summary = "ERD 검증 리포트 다운로드 (JSON)",
            description = "ERD 검증 리포트를 JSON 형식으로 다운로드합니다."
    )
    @GetMapping("/{diagramId}/validation-report/json")
    public ResponseEntity<byte[]> downloadValidationReportJson(
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId,
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName) {

        log.info("HQ 운영 포털 ERD 검증 리포트 JSON 다운로드 요청: diagramId={}", diagramId);

        ErdValidationReport report = erdValidationService.validateErd(diagramId, schemaName);
        
        try {
            String fileName = String.format("erd-validation-%s-%s.json", 
                    diagramId, java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            File reportFile = erdValidationReportService.saveReportAsJson(report, 
                    "reports/erd-validation/" + fileName);

            byte[] fileContent = Files.readAllBytes(reportFile.toPath());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", fileName);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (Exception e) {
            log.error("검증 리포트 다운로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ERD 검증 리포트 다운로드 (HTML)
     */
    @Operation(
            summary = "ERD 검증 리포트 다운로드 (HTML)",
            description = "ERD 검증 리포트를 HTML 형식으로 다운로드합니다."
    )
    @GetMapping("/{diagramId}/validation-report/html")
    public ResponseEntity<byte[]> downloadValidationReportHtml(
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId,
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName) {

        log.info("HQ 운영 포털 ERD 검증 리포트 HTML 다운로드 요청: diagramId={}", diagramId);

        ErdValidationReport report = erdValidationService.validateErd(diagramId, schemaName);
        
        try {
            String fileName = String.format("erd-validation-%s-%s.html", 
                    diagramId, java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            File reportFile = erdValidationReportService.saveReportAsHtml(report, 
                    "reports/erd-validation/" + fileName);

            byte[] fileContent = Files.readAllBytes(reportFile.toPath());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_HTML);
            headers.setContentDispositionFormData("attachment", fileName);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (Exception e) {
            log.error("검증 리포트 다운로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ERD 검증 리포트 다운로드 (Markdown)
     */
    @Operation(
            summary = "ERD 검증 리포트 다운로드 (Markdown)",
            description = "ERD 검증 리포트를 Markdown 형식으로 다운로드합니다."
    )
    @GetMapping("/{diagramId}/validation-report/markdown")
    public ResponseEntity<byte[]> downloadValidationReportMarkdown(
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId,
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName) {

        log.info("HQ 운영 포털 ERD 검증 리포트 Markdown 다운로드 요청: diagramId={}", diagramId);

        ErdValidationReport report = erdValidationService.validateErd(diagramId, schemaName);
        
        try {
            String fileName = String.format("erd-validation-%s-%s.md", 
                    diagramId, java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            File reportFile = erdValidationReportService.saveReportAsMarkdown(report, 
                    "reports/erd-validation/" + fileName);

            byte[] fileContent = Files.readAllBytes(reportFile.toPath());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment", fileName);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (Exception e) {
            log.error("검증 리포트 다운로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 테이블 목록 조회 (커스텀 ERD 생성용)
     */
    @Operation(
            summary = "테이블 목록 조회",
            description = "커스텀 ERD 생성 시 선택할 수 있는 테이블 목록을 조회합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    @GetMapping("/tables")
    public ResponseEntity<List<String>> getTableNames(
            @Parameter(description = "스키마 이름") @RequestParam(required = false) String schemaName) {

        log.debug("HQ 운영 포털 테이블 목록 조회 요청: schemaName={}", schemaName);

        List<String> tableNames = schemaService.getTableNames(schemaName);
        return ResponseEntity.ok(tableNames);
    }

    /**
     * ERD 버전 비교
     */
    @Operation(
            summary = "ERD 버전 비교",
            description = "두 ERD 버전을 비교하여 변경사항을 확인합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "비교 완료"),
            @ApiResponse(responseCode = "404", description = "ERD 또는 버전을 찾을 수 없음")
    })
    @GetMapping("/{diagramId}/compare")
    public ResponseEntity<String> compareVersions(
            @Parameter(description = "ERD 다이어그램 ID", required = true) @PathVariable String diagramId,
            @Parameter(description = "시작 버전", required = true) @RequestParam Integer fromVersion,
            @Parameter(description = "종료 버전", required = true) @RequestParam Integer toVersion) {

        log.info("HQ 운영 포털 ERD 버전 비교 요청: diagramId={}, fromVersion={}, toVersion={}",
                diagramId, fromVersion, toVersion);

        String comparison = erdHistoryService.compareVersions(diagramId, fromVersion, toVersion);
        return ResponseEntity.ok(comparison);
    }
}

