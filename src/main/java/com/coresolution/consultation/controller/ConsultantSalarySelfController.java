package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.util.SalaryCalculationResponseMapper;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 상담사 본인 급여 정산(관리자 모듈 저장분) 읽기 전용 API.
 * JWT·세션 모두 {@link SessionUtils#getCurrentUser(HttpSession)}으로 통합합니다.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/consultants/me")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()") // B8 (2026-06-14): 무가드 회귀 방지 fallback. 본인(self) 접근만 가능하도록 메서드 본문에서 인증 사용자 검증.
public class ConsultantSalarySelfController extends BaseApiController {

    private final SalaryManagementService salaryManagementService;

    /**
     * 본인 확정·지급 완료 급여 계산 목록. 응답 스키마는
     * {@code GET /api/v1/admin/salary/calculations/{consultantId}}와 동일하며,
     * 상태 필터는 {@link SalaryManagementService#getSalaryCalculationsVisibleToConsultant(Long)}에 위임합니다.
     *
     * @param session HTTP 세션
     * @return 관리자 급여 화면과 동일 필드 구조의 목록
     */
    @GetMapping("/salary-calculations")
    public ResponseEntity<?> getMySalaryCalculations(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다. 세션을 확인해 주세요.");
        }
        if (currentUser.getTenantId() != null) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isProfessionalProvider()) {
            throw new ForbiddenException("상담사(전문가)만 급여 정산 내역을 조회할 수 있습니다.");
        }
        if (currentUser.getId() == null) {
            throw new ForbiddenException("사용자 식별 정보가 없어 급여 정산 내역을 조회할 수 없습니다.");
        }
        log.info("상담사 본인 급여 정산 목록 조회: userId={}, tenantId={}", currentUser.getId(), currentUser.getTenantId());
        List<SalaryCalculation> calculations =
                salaryManagementService.getSalaryCalculationsVisibleToConsultant(currentUser.getId());
        List<Map<String, Object>> calculationDtos = calculations.stream()
                .map(SalaryCalculationResponseMapper::toCalculationDto)
                .collect(Collectors.toList());
        return success("급여 정산 내역을 조회했습니다.", calculationDtos);
    }
}
