package com.coresolution.consultation.controller;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeListResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공통코드 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/common-codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "공통코드 관리", description = "공통코드 CRUD API - 표준화된 RESTful API")
public class CommonCodeController extends BaseApiController {

    private final CommonCodeService commonCodeService;
    private final CommonCodePermissionService permissionService;
    
    // ==================== 표준화된 CRUD API ====================
    
    /**
     * 공통코드 생성 (표준화)
     * 
     * @param request 생성 요청 DTO
     * @param session HTTP 세션
     * @return 생성된 공통코드 응답
     */
    @Operation(
        summary = "공통코드 생성",
        description = "새로운 공통코드를 생성합니다. 코어 코드는 HQ 관리자만, 테넌트 코드는 해당 테넌트 관리자만 생성 가능합니다."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "생성 성공", 
            content = @Content(schema = @Schema(implementation = CommonCodeResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<CommonCodeResponse>> create(
            @Valid @RequestBody CommonCodeCreateRequest request,
            HttpSession session) {
        log.info("공통코드 생성 요청: {} - {}", request.getCodeGroup(), request.getCodeValue());
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        // 권한 검증
        String tenantId = request.getTenantId();
        if (!permissionService.canCreateCode(currentUser, tenantId)) {
            String codeType = tenantId == null || tenantId.isEmpty() ? "코어" : "테넌트";
            throw new org.springframework.security.access.AccessDeniedException(codeType + " 코드 생성 권한이 없습니다.");
        }
            
        String createdBy = currentUser.getId().toString();
        CommonCodeResponse response = commonCodeService.create(request, createdBy);
        
        log.info("공통코드 생성 완료: id={}", response.getId());
        return created("공통코드가 생성되었습니다.", response);
    }
    
    /**
     * 공통코드 수정 (표준화)
     * 
     * @param id 공통코드 ID
     * @param request 수정 요청 DTO
     * @param session HTTP 세션
     * @return 수정된 공통코드 응답
     */
    @Operation(
        summary = "공통코드 수정",
        description = "기존 공통코드를 수정합니다. 코어 코드는 HQ 관리자만, 테넌트 코드는 해당 테넌트 관리자만 수정 가능합니다."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공",
            content = @Content(schema = @Schema(implementation = CommonCodeResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "코드를 찾을 수 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CommonCodeUpdateRequest request,
            HttpSession session) {
        log.info("공통코드 수정 요청: id={}", id);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        // 공통코드 조회 및 권한 검증
        CommonCode code = commonCodeService.getCommonCodeById(id);
        if (code == null) {
            throw new RuntimeException("코드를 찾을 수 없습니다.");
        }
        
        if (!permissionService.canUpdateCode(currentUser, code)) {
            String codeType = code.isCoreCode() ? "코어" : "테넌트";
            throw new org.springframework.security.access.AccessDeniedException(codeType + " 코드 수정 권한이 없습니다.");
        }
        
        String updatedBy = currentUser.getId().toString();
        CommonCodeResponse response = commonCodeService.update(id, request, updatedBy);
        
        log.info("공통코드 수정 완료: id={}", id);
        return updated("공통코드가 수정되었습니다.", response);
    }
    
    /**
     * 공통코드 부분 수정 (표준화)
     * 
     * @param id 공통코드 ID
     * @param request 수정 요청 DTO
     * @param session HTTP 세션
     * @return 수정된 공통코드 응답
     */
    @Operation(
        summary = "공통코드 부분 수정",
        description = "기존 공통코드의 일부 필드만 수정합니다. PUT과 동일하게 처리됩니다."
    )
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> partialUpdate(
            @PathVariable Long id,
            @RequestBody CommonCodeUpdateRequest request,
            HttpSession session) {
        // PATCH는 PUT과 동일하게 처리 (부분 수정 지원)
        return update(id, request, session);
    }
    
    /**
     * 공통코드 삭제 (표준화, 소프트 삭제)
     * 
     * @param id 공통코드 ID
     * @param session HTTP 세션
     * @return 삭제 결과
     */
    @Operation(
        summary = "공통코드 삭제",
        description = "공통코드를 소프트 삭제합니다. 활성 코드는 먼저 비활성화 후 삭제됩니다. 코어 코드는 HQ 관리자만, 테넌트 코드는 해당 테넌트 관리자만 삭제 가능합니다."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "삭제 성공"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "코드를 찾을 수 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            HttpSession session) {
        log.info("공통코드 삭제 요청: id={}", id);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        // 공통코드 조회 및 권한 검증
        CommonCode code = commonCodeService.getCommonCodeById(id);
        if (code == null) {
            throw new RuntimeException("코드를 찾을 수 없습니다.");
        }
        
        if (!permissionService.canDeleteCode(currentUser, code)) {
            String codeType = code.isCoreCode() ? "코어" : "테넌트";
            throw new org.springframework.security.access.AccessDeniedException(codeType + " 코드 삭제 권한이 없습니다.");
        }
        
        String deletedBy = currentUser.getId().toString();
        commonCodeService.delete(id, deletedBy);
        
        log.info("공통코드 삭제 완료: id={}", id);
        return deleted("공통코드가 삭제되었습니다.");
    }
    
    /**
     * 공통코드 상세 조회 (표준화)
     * 
     * @param id 공통코드 ID
     * @return 공통코드 응답
     */
    @Operation(
        summary = "공통코드 상세 조회",
        description = "ID로 공통코드 상세 정보를 조회합니다."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
            content = @Content(schema = @Schema(implementation = CommonCodeResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "코드를 찾을 수 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> findById(@PathVariable Long id) {
        log.info("공통코드 상세 조회 요청: id={}", id);
        
        CommonCodeResponse response = commonCodeService.findById(id);
        
        log.info("공통코드 상세 조회 완료: id={}", id);
        return success(response);
    }
    
    /**
     * 공통코드 목록 조회 (표준화)
     * 
     * @param codeGroup 코드 그룹 (선택)
     * @return 공통코드 목록 응답
     */
    @Operation(
        summary = "공통코드 목록 조회",
        description = "공통코드 목록을 조회합니다. codeGroup 파라미터로 특정 그룹의 코드만 조회할 수 있습니다."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공",
            content = @Content(schema = @Schema(implementation = CommonCodeListResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<CommonCodeListResponse>> findAll(
            @RequestParam(required = false) String codeGroup) {
        log.info("공통코드 목록 조회 요청: codeGroup={}", codeGroup);
        
        CommonCodeListResponse response = commonCodeService.findAll(codeGroup);
        
        log.info("공통코드 목록 조회 완료: totalCount={}", response.getTotalCount());
        return success(response);
    }
    
    /**
     * 공통코드 상태 토글 (표준화)
     * 
     * @param id 공통코드 ID
     * @param session HTTP 세션
     * @return 수정된 공통코드 응답
     */
    @Operation(
        summary = "공통코드 상태 토글",
        description = "공통코드의 활성/비활성 상태를 토글합니다."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "상태 변경 성공",
            content = @Content(schema = @Schema(implementation = CommonCodeResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "코드를 찾을 수 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> toggleStatus(
            @PathVariable Long id,
            HttpSession session) {
        log.info("공통코드 상태 토글 요청: id={}", id);
        
        CommonCode code = commonCodeService.toggleCommonCodeStatus(id);
        CommonCodeResponse response = CommonCodeResponse.fromEntity(code);
        
        log.info("공통코드 상태 토글 완료: id={}, isActive={}", id, code.getIsActive());
        return updated("공통코드 상태가 변경되었습니다.", response);
    }
    
    /**
     * 공통코드 일괄 생성 (표준화)
     * 
     * @param requests 생성 요청 DTO 목록
     * @param session HTTP 세션
     * @return 생성된 공통코드 목록 응답
     */
    @Operation(
        summary = "공통코드 일괄 생성",
        description = "여러 공통코드를 한 번에 생성합니다."
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "일괄 생성 성공",
            content = @Content(schema = @Schema(implementation = CommonCodeResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "권한 없음"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createBatch(
            @Valid @RequestBody List<CommonCodeCreateRequest> requests,
            HttpSession session) {
        log.info("공통코드 일괄 생성 요청: {} 개", requests.size());
        
        String createdBy = SessionUtils.getCurrentUser(session) != null 
            ? SessionUtils.getCurrentUser(session).getId().toString() 
            : "system";
        
        List<CommonCodeResponse> responses = requests.stream()
                .map(request -> commonCodeService.create(request, createdBy))
                .collect(java.util.stream.Collectors.toList());
        
        log.info("공통코드 일괄 생성 완료: {} 개", responses.size());
        
        Map<String, Object> data = Map.of(
            "codes", responses,
            "count", responses.size()
        );
        
        return created("공통코드가 일괄 생성되었습니다.", data);
    }

    /**
     * 공통코드 그룹별 조회
     * 
     * @param groups 쉼표로 구분된 그룹 목록 (예: "USER_ROLE,BRANCH_STATUS")
     * @return 그룹별 공통코드 맵
     */
    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<Map<String, List<CommonCode>>>> getCommonCodesByGroups(
            @RequestParam String groups) {
        log.info("공통코드 그룹별 조회 요청: {}", groups);
        
        String[] groupArray = groups.split(",");
        Map<String, List<CommonCode>> result = commonCodeService.getCommonCodesByGroups(groupArray);
        
        log.info("공통코드 조회 완료: {} 그룹", result.size());
        return success(result);
    }

    /**
     * 특정 그룹의 공통코드 조회 (하위 호환성)
     * 현재 테넌트 컨텍스트 기반으로 조회 (테넌트 코드 우선, 없으면 코어 코드)
     * 
     * @deprecated 새로운 API 사용 권장: GET /api/v1/common-codes?codeGroup={groupCode}
     * @param groupCode 그룹 코드
     * @return 공통코드 목록
     */
    @GetMapping("/by-group/{groupCode}")
    @Deprecated
    public ResponseEntity<ApiResponse<List<CommonCode>>> getCommonCodesByGroup(
            @PathVariable String groupCode) {
        // groupCode 유효성 검사
        if (groupCode == null || groupCode.trim().isEmpty() || "undefined".equals(groupCode)) {
            log.warn("잘못된 그룹 코드: {}", groupCode);
            return success(List.of());
        }
        
        log.info("공통코드 그룹 조회 요청: {}", groupCode);
        
        // 현재 테넌트 컨텍스트 기반으로 조회 (하위 호환성)
        List<CommonCode> codes = commonCodeService.getCodesByGroupWithCurrentTenant(groupCode);
        
        // 코드가 없으면 빈 배열 반환 (500 오류 방지)
        if (codes == null || codes.isEmpty()) {
            log.warn("공통코드 그룹이 존재하지 않음: {}", groupCode);
            return success(List.of());
        }
        
        log.info("공통코드 그룹 조회 완료: {} 개", codes.size());
        return success(codes);
    }
    
    // ==================== 코어솔루션 코드 조회 ====================
    
    /**
     * 코어솔루션 코드 그룹별 조회
     * HQ 관리자 권한 확인 필요
     * 
     * @param codeGroup 코드 그룹
     * @return 코어솔루션 코드 목록
     */
    @GetMapping("/core/groups/{codeGroup}")
    public ResponseEntity<ApiResponse<List<CommonCode>>> getCoreCodesByGroup(@PathVariable String codeGroup) {
        log.info("코어솔루션 코드 그룹 조회 요청: {}", codeGroup);
        List<CommonCode> codes = commonCodeService.getCoreCodesByGroup(codeGroup);
        log.info("코어솔루션 코드 그룹 조회 완료: {} 개", codes.size());
        return success(codes);
    }
    
    // ==================== 테넌트별 코드 조회 ====================
    
    /**
     * 테넌트별 코드 그룹별 조회
     * 현재 테넌트 컨텍스트 기반
     * 
     * @param codeGroup 코드 그룹
     * @return 테넌트별 코드 목록
     */
    @GetMapping("/tenant/groups/{codeGroup}")
    public ResponseEntity<ApiResponse<List<CommonCode>>> getTenantCodesByGroup(@PathVariable String codeGroup) {
        log.info("테넌트별 코드 그룹 조회 요청: {}", codeGroup);
        List<CommonCode> codes = commonCodeService.getCurrentTenantCodesByGroup(codeGroup);
        log.info("테넌트별 코드 그룹 조회 완료: {} 개", codes.size());
        return success(codes);
    }
    
    // ==================== 통합 조회 (하위 호환성) ====================
    
    /**
     * 코드 그룹별 조회 (테넌트 코드 우선, 없으면 코어 코드)
     * 현재 테넌트 컨텍스트 기반
     * 
     * @param codeGroup 코드 그룹
     * @return 공통코드 목록
     */
    @GetMapping("/groups/{codeGroup}")
    public ResponseEntity<ApiResponse<List<CommonCode>>> getCodesByGroup(@PathVariable String codeGroup) {
        log.info("코드 그룹 조회 요청 (통합): {}", codeGroup);
        List<CommonCode> codes = commonCodeService.getCodesByGroupWithCurrentTenant(codeGroup);
        log.info("코드 그룹 조회 완료: {} 개", codes.size());
        return success(codes);
    }

    /**
     * 특정 그룹의 활성 공통코드만 조회 (메뉴용)
     * 
     * @param groupCode 그룹 코드
     * @return 활성 공통코드 목록
     */
    @GetMapping("/group/{groupCode}/active")
    public ResponseEntity<ApiResponse<List<CommonCode>>> getActiveCommonCodesByGroup(
            @PathVariable String groupCode) {
        log.info("활성 공통코드 그룹 조회 요청: {}", groupCode);
        
        List<CommonCode> codes = commonCodeService.getActiveCommonCodesByGroup(groupCode);
        
        log.info("활성 공통코드 그룹 조회 완료: {} 개", codes.size());
        return success(codes);
    }

    /**
     * 공통코드 상세 조회 (그룹과 값으로)
     * 
     * @deprecated 새로운 API 사용 권장: GET /api/v1/common-codes/{id}
     * @param groupCode 그룹 코드
     * @param codeValue 코드 값
     * @return 공통코드 상세 정보
     */
    @GetMapping("/by-group-value/{groupCode}/{codeValue}")
    @Deprecated
    public ResponseEntity<ApiResponse<CommonCode>> getCommonCode(
            @PathVariable String groupCode,
            @PathVariable String codeValue) {
        log.info("공통코드 상세 조회 요청: {}/{}", groupCode, codeValue);
        
        CommonCode code = commonCodeService.getCommonCode(groupCode, codeValue);
        
        if (code == null) {
            log.warn("공통코드를 찾을 수 없음: {}/{}", groupCode, codeValue);
            throw new RuntimeException("공통코드를 찾을 수 없습니다.");
        }
        
        log.info("공통코드 상세 조회 완료: {}", code.getCodeLabel());
        return success(code);
    }

    /**
     * 활성 공통코드만 조회
     * 
     * @param groups 쉼표로 구분된 그룹 목록
     * @return 활성 공통코드 맵
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<Map<String, List<CommonCode>>>> getActiveCommonCodes(
            @RequestParam String groups) {
        log.info("활성 공통코드 조회 요청: {}", groups);
        
        String[] groupArray = groups.split(",");
        Map<String, List<CommonCode>> result = commonCodeService.getActiveCommonCodesByGroups(groupArray);
        
        log.info("활성 공통코드 조회 완료: {} 그룹", result.size());
        return success(result);
    }

    /**
     * 공통코드 그룹 목록 조회
     * 
     * @return 그룹 목록
     */
    @GetMapping("/groups/list")
    public ResponseEntity<ApiResponse<List<String>>> getCommonCodeGroups() {
        log.info("공통코드 그룹 목록 조회 요청");
        
        List<String> groups = commonCodeService.getCommonCodeGroups();
        
        log.info("공통코드 그룹 목록 조회 완료: {} 개", groups.size());
        return success(groups);
    }

    /**
     * 공통코드 비활성화
     * 
     * @param request 비활성화할 코드값 목록
     * @return 처리 결과
     */
    @PutMapping("/deactivate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deactivateCommonCodes(
            @RequestBody Map<String, Object> request) {
        log.info("공통코드 비활성화 요청: {}", request);
        
        @SuppressWarnings("unchecked")
        List<String> codeValues = (List<String>) request.get("codeValues");
        
        if (codeValues == null || codeValues.isEmpty()) {
            throw new IllegalArgumentException("비활성화할 코드값이 없습니다.");
        }
        
        int deactivatedCount = commonCodeService.deactivateCommonCodes(codeValues);
        
        log.info("공통코드 비활성화 완료: {} 개", deactivatedCount);
        
        Map<String, Object> data = Map.of("deactivatedCount", deactivatedCount);
        return success("공통코드 비활성화가 완료되었습니다.", data);
    }

}