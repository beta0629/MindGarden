package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.dto.SalaryExportRequest;

/**
 * 급여 계산 건별 PDF/Excel/CSV 생성 및 data URL 응답용 payload.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
public interface SalaryExportService {

    /**
     * PDF보내기. {@code downloadUrl}(data URI), {@code filename} 키를 가진 맵.
     *
     * @param request 계산 ID·옵션
     * @return downloadUrl, filename
     */
    Map<String, Object> exportPdf(SalaryExportRequest request);

    /**
     * Excel(.xlsx)보내기.
     *
     * @param request 계산 ID·옵션
     * @return downloadUrl, filename
     */
    Map<String, String> exportExcel(SalaryExportRequest request);

    /**
     * CSV(UTF-8 BOM)보내기.
     *
     * @param request 계산 ID·옵션
     * @return downloadUrl, filename
     */
    Map<String, String> exportCsv(SalaryExportRequest request);
}
