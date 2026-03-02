package com.coresolution.consultation.assessment.controller;

import com.coresolution.consultation.assessment.dto.PsychAssessmentUploadResponse;
import com.coresolution.consultation.assessment.dto.PsychAssessmentDocumentListItem;
import com.coresolution.consultation.assessment.dto.PsychAssessmentReportViewDto;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import com.coresolution.consultation.assessment.model.PsychAssessmentType;
import com.coresolution.consultation.assessment.service.PsychAssessmentIngestService;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.context.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/assessments/psych")
@RequiredArgsConstructor
@Tag(name = "PsychAssessment", description = "TCI/MMPI 심리검사 리포트 AI 분석")
public class PsychAssessmentController extends BaseApiController {

    private final PsychAssessmentIngestService ingestService;
    private final com.coresolution.consultation.assessment.service.PsychAssessmentReportService reportService;
    private final com.coresolution.consultation.assessment.service.PsychAssessmentStatsService statsService;
    private final PsychAssessmentDocumentRepository documentRepository;
    private final PsychAssessmentReportRepository reportRepository;

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "심리검사 리포트 업로드", description = "TCI/MMPI 스캔 PDF 1개 또는 이미지(JPG, PNG) 여러 장을 업로드하고 OCR/추출 파이프라인을 시작합니다.")
    public ResponseEntity<ApiResponse<PsychAssessmentUploadResponse>> upload(
            @RequestParam("type") @NotNull PsychAssessmentType type,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "clientId", required = false) Long clientId) {

        String tenantId = TenantContextHolder.getRequiredTenantId();
        PsychAssessmentUploadResponse response;

        if (file != null && !file.isEmpty()) {
            // 단일 PDF 업로드
            response = ingestService.uploadScannedPdf(type, file, clientId, null);
        } else if (files != null && files.length > 0) {
            // 다중 이미지 업로드
            List<MultipartFile> fileList = Arrays.stream(files)
                    .filter(f -> f != null && !f.isEmpty())
                    .toList();
            if (fileList.isEmpty()) {
                throw new IllegalArgumentException("업로드할 이미지 파일을 선택해 주세요.");
            }
            response = ingestService.uploadScannedImages(type, fileList, clientId, null);
        } else {
            throw new IllegalArgumentException("업로드할 파일을 선택해 주세요.");
        }

        log.info("Psych assessment uploaded: tenantId={}, type={}, documentId={}", tenantId, type,
                response.getDocumentId());
        return success(response);
    }

    @PostMapping("/documents/{documentId}/report")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "최신 리포트 생성", description = "추출된 지표를 기반으로 최신 리포트를 생성합니다(MVP).")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> generateReport(
            @PathVariable Long documentId) {
        Long reportId = reportService.generateLatestReport(documentId);
        return success(java.util.Map.of("reportId", reportId));
    }

    @GetMapping("/documents/{documentId}/report")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "최신 리포트 조회", description = "문서에 대한 최신 AI 분석 리포트를 조회합니다.")
    public ResponseEntity<?> getLatestReport(
            @PathVariable Long documentId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        var report = reportRepository.findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, documentId)
                .orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        PsychAssessmentReportViewDto dto = PsychAssessmentReportViewDto.builder()
                .reportId(report.getId())
                .documentId(report.getDocumentId())
                .reportMarkdown(report.getReportMarkdown())
                .modelName(report.getModelName())
                .promptVersion(report.getPromptVersion())
                .createdAt(report.getCreatedAt())
                .build();
        return success(dto);
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "심리검사 분석 통계(MVP)", description = "테넌트 단위 업로드/추출/리포트 생성 통계를 제공합니다.")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> stats() {
        return success(statsService.getTenantStats());
    }

    @GetMapping("/documents/recent")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "최근 업로드 문서 목록", description = "관리자 화면용 최근 업로드 문서 목록을 조회합니다(최대 20개).")
    public ResponseEntity<ApiResponse<java.util.List<PsychAssessmentDocumentListItem>>> recentDocuments(
            @RequestParam(value = "status", required = false) PsychAssessmentDocumentStatus status
    ) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        java.util.List<PsychAssessmentDocument> docs = (status == null)
                ? documentRepository.findTop20ByTenantIdOrderByCreatedAtDesc(tenantId)
                : documentRepository.findTop20ByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status);

        java.util.List<PsychAssessmentDocumentListItem> items = docs.stream()
                .map(d -> PsychAssessmentDocumentListItem.builder()
                        .documentId(d.getId())
                        .clientId(d.getClientId())
                        .assessmentType(d.getAssessmentType())
                        .status(d.getStatus())
                        .originalFilename(d.getOriginalFilename())
                        .fileSize(d.getFileSize())
                        .sha256(d.getSha256())
                        .createdAt(d.getCreatedAt())
                        .build())
                .toList();
        return success(items);
    }

    /**
     * 상담일지용: clientId 기준 심리검사 문서·리포트 목록 (링크+요약 1줄)
     */
    @GetMapping("/documents/by-client/{clientId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "내담자별 심리검사 문서 목록", description = "상담일지에서 해당 내담자의 심리검사 문서/리포트 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<java.util.List<PsychAssessmentDocumentListItem>>> documentsByClient(
            @PathVariable Long clientId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        java.util.List<PsychAssessmentDocument> docs =
                documentRepository.findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId, clientId);

        java.util.List<PsychAssessmentDocumentListItem> items = docs.stream()
                .map(d -> {
                    String summary = null;
                    var reportOpt = reportRepository.findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(tenantId, d.getId());
                    if (reportOpt.isPresent() && reportOpt.get().getReportMarkdown() != null) {
                        String md = reportOpt.get().getReportMarkdown();
                        summary = md.length() > 100 ? md.substring(0, 100).trim() + "…" : md.trim();
                    }
                    return PsychAssessmentDocumentListItem.builder()
                            .documentId(d.getId())
                            .clientId(d.getClientId())
                            .assessmentType(d.getAssessmentType())
                            .status(d.getStatus())
                            .originalFilename(d.getOriginalFilename())
                            .fileSize(d.getFileSize())
                            .sha256(d.getSha256())
                            .createdAt(d.getCreatedAt())
                            .reportSummary(summary)
                            .build();
                })
                .toList();
        return success(items);
    }
}


