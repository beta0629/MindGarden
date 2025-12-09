package com.mindgarden.ops.service.onboarding;

import com.mindgarden.ops.constants.OpsConstants;
import com.mindgarden.ops.controller.dto.OnboardingCreateRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import com.mindgarden.ops.repository.onboarding.OnboardingRequestRepository;
import com.mindgarden.ops.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final OnboardingRequestRepository repository;
    private final AuditService auditService;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<OnboardingRequest> findPending() {
        return repository.findByStatusOrderByCreatedAtDesc(OnboardingStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<OnboardingRequest> findByStatus(OnboardingStatus status) {
        return repository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional(readOnly = true)
    public List<OnboardingRequest> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public OnboardingRequest getById(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new com.mindgarden.ops.exception.EntityNotFoundException("온보딩 요청", id));
    }

    @Transactional
    public OnboardingRequest create(OnboardingCreateRequest request) {
        OnboardingRequest entity = new OnboardingRequest();
        
        log.info("[OnboardingService] 온보딩 요청 생성 시작 - tenantName={}, requestedBy={}, hasChecklistJson={}", 
            request.tenantName(), request.requestedBy(), 
            request.checklistJson() != null && !request.checklistJson().isEmpty());
        
        // checklistJson에서 regionCode와 brandName 추출하여 필드에 저장
        String region = request.region();
        String brandName = null;
        log.info("[OnboardingService] 초기 region 값: {}", region);
        
        // checklistJson 파싱하여 regionCode와 brandName 추출
        if (request.checklistJson() != null && !request.checklistJson().isEmpty()) {
            log.info("[OnboardingService] checklistJson에서 regionCode와 brandName 추출 시도 - checklistJson 길이: {}", request.checklistJson().length());
            try {
                JsonNode jsonNode = objectMapper.readTree(request.checklistJson());
                log.info("[OnboardingService] JSON 파싱 성공 - hasRegionCode: {}, hasBrandName: {}", 
                    jsonNode.has("regionCode"), jsonNode.has("brandName"));
                
                // regionCode 추출
                if ((region == null || region.isBlank()) && jsonNode.has("regionCode")) {
                    JsonNode regionCodeNode = jsonNode.get("regionCode");
                    log.info("[OnboardingService] regionCode 노드 타입: {}, isTextual: {}", regionCodeNode.getNodeType(), regionCodeNode.isTextual());
                    
                    if (regionCodeNode.isTextual()) {
                        region = regionCodeNode.asText();
                        log.info("[OnboardingService] ✅ checklistJson에서 regionCode 추출 성공: {}", region);
                    } else {
                        log.warn("[OnboardingService] regionCode가 텍스트 타입이 아님: {}", regionCodeNode.getNodeType());
                    }
                } else if (region != null && !region.isBlank()) {
                    log.info("[OnboardingService] request.region()에서 region 사용: {}", region);
                } else {
                    log.warn("[OnboardingService] checklistJson에 regionCode 필드가 없음");
                }
                
                // brandName 추출
                if (jsonNode.has("brandName") && jsonNode.get("brandName").isTextual()) {
                    brandName = jsonNode.get("brandName").asText();
                    log.info("[OnboardingService] ✅ checklistJson에서 brandName 추출 성공: {}", brandName);
                } else {
                    log.warn("[OnboardingService] checklistJson에 brandName 필드가 없음");
                }
            } catch (Exception e) {
                log.error("[OnboardingService] ❌ checklistJson에서 regionCode/brandName 추출 실패: {}", e.getMessage(), e);
            }
        } else {
            if (region != null && !region.isBlank()) {
                log.info("[OnboardingService] request.region()에서 region 사용: {}", region);
            } else {
                log.warn("[OnboardingService] region이 없고 checklistJson도 없거나 비어있음");
            }
        }
        
        // brandName이 없으면 tenantName 사용
        if (brandName == null || brandName.isBlank()) {
            brandName = request.tenantName();
            log.info("[OnboardingService] brandName이 없어 tenantName 사용: {}", brandName);
        }
        
        log.info("[OnboardingService] 최종 region 값: {}, brandName 값: {}", region, brandName);
        
        // 테넌트 ID 생성 (없으면 자동 생성)
        String tenantId = request.tenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = generateTenantId(region, request.businessType());
            log.info("[OnboardingService] 온보딩 요청 생성 시 테넌트 ID 자동 생성: tenantName={}, region={}, businessType={}, generatedTenantId={}", 
                request.tenantName(), region, request.businessType(), tenantId);
        }
        
        entity.setTenantId(tenantId);
        entity.setTenantName(request.tenantName());
        entity.setBrandName(brandName); // 브랜드명 저장 (checklistJson에서 추출한 값 또는 tenantName)
        entity.setRegion(region); // 지역 정보 저장 (checklistJson에서 추출한 값 또는 요청값)
        entity.setRequestedBy(request.requestedBy());
        entity.setRiskLevel(request.riskLevel());
        entity.setChecklistJson(request.checklistJson());
        entity.setStatus(OnboardingStatus.PENDING);
        OnboardingRequest saved = repository.save(entity);

        auditService.record(
            "ONBOARDING_CREATED",
            "ONBOARDING_REQUEST",
            saved.getId().toString(),
            request.requestedBy(),
            "REQUESTER",
            "온보딩 요청 생성",
            Map.of("tenantId", tenantId, "riskLevel", request.riskLevel().name())
        );

        return saved;
    }

    /**
     * 테넌트 ID 생성 (표준 형식: tenant-{지역코드}-{업종코드}-{순번})
     * @param region 지역명 (선택적)
     * @param businessType 업종 타입 (선택적)
     * @return 생성된 테넌트 ID
     */
    private String generateTenantId(String region, String businessType) {
        // 지역 코드 정규화
        String regionCode = normalizeRegionCode(region);
        
        // 업종 코드 정규화 (없으면 기본값 사용)
        String businessTypeCode;
        if (businessType != null && !businessType.trim().isEmpty()) {
            businessTypeCode = businessType.toLowerCase().replace("_", "-");
        } else {
            businessTypeCode = OpsConstants.DEFAULT_BUSINESS_TYPE.toLowerCase().replace("_", "-");
        }
        
        // 같은 지역+업종의 기존 테넌트 수 조회하여 순번 결정
        String countQuery = "SELECT COUNT(*) FROM tenants WHERE tenant_id LIKE ? AND (is_deleted IS NULL OR is_deleted = FALSE)";
        String pattern = "tenant-" + regionCode + "-" + businessTypeCode + "-%";
        Long existingCount = jdbcTemplate.queryForObject(countQuery, Long.class, pattern);
        int sequenceNumber = (existingCount != null ? existingCount.intValue() : 0) + 1;
        
        // 순번을 3자리 숫자로 포맷팅 (001, 002, ...)
        String formattedSequence = String.format("%03d", sequenceNumber);
        
        // 최종 테넌트 ID 생성
        String tenantId = String.format("tenant-%s-%s-%s", regionCode, businessTypeCode, formattedSequence);
        
        // 중복 체크 (같은 ID가 이미 존재하는 경우 순번 증가)
        String existsQuery = "SELECT COUNT(*) > 0 FROM tenants WHERE tenant_id = ?";
        while (Boolean.TRUE.equals(jdbcTemplate.queryForObject(existsQuery, Boolean.class, tenantId))) {
            sequenceNumber++;
            formattedSequence = String.format("%03d", sequenceNumber);
            tenantId = String.format("tenant-%s-%s-%s", regionCode, businessTypeCode, formattedSequence);
            log.warn("[OnboardingService] 테넌트 ID 중복 감지, 순번 증가: tenantId={}", tenantId);
        }
        
        return tenantId;
    }

    /**
     * 지역 코드 정규화
     * @param region 지역명 (예: "서울특별시", "경기도", "서울", "INCHEON", "incheon")
     * @return 정규화된 지역 코드 (예: "seoul", "gyeonggi", "incheon", "unknown")
     */
    private String normalizeRegionCode(String region) {
        if (region == null || region.isBlank()) {
            return null; // null 반환 (호출자가 "unknown" 처리)
        }
        
        String normalized = region.trim().toLowerCase();
        
        // 이미 영문 코드인 경우 (예: "INCHEON", "incheon", "SEOUL")
        // 주요 도시 코드 매핑
        if (normalized.equals("incheon") || normalized.equals("인천")) {
            return "incheon";
        } else if (normalized.equals("seoul") || normalized.equals("서울")) {
            return "seoul";
        } else if (normalized.equals("busan") || normalized.equals("부산")) {
            return "busan";
        } else if (normalized.equals("daegu") || normalized.equals("대구")) {
            return "daegu";
        } else if (normalized.equals("daejeon") || normalized.equals("대전")) {
            return "daejeon";
        } else if (normalized.equals("gwangju") || normalized.equals("광주")) {
            return "gwangju";
        } else if (normalized.equals("ulsan") || normalized.equals("울산")) {
            return "ulsan";
        } else if (normalized.equals("sejong") || normalized.equals("세종")) {
            return "sejong";
        } else if (normalized.equals("gyeonggi") || normalized.equals("경기")) {
            return "gyeonggi";
        } else if (normalized.equals("gangwon") || normalized.equals("강원")) {
            return "gangwon";
        } else if (normalized.equals("chungbuk") || normalized.equals("충북") || normalized.equals("충청북도")) {
            return "chungbuk";
        } else if (normalized.equals("chungnam") || normalized.equals("충남") || normalized.equals("충청남도")) {
            return "chungnam";
        } else if (normalized.equals("jeonbuk") || normalized.equals("전북") || normalized.equals("전라북도")) {
            return "jeonbuk";
        } else if (normalized.equals("jeonnam") || normalized.equals("전남") || normalized.equals("전라남도")) {
            return "jeonnam";
        } else if (normalized.equals("gyeongbuk") || normalized.equals("경북") || normalized.equals("경상북도")) {
            return "gyeongbuk";
        } else if (normalized.equals("gyeongnam") || normalized.equals("경남") || normalized.equals("경상남도")) {
            return "gyeongnam";
        } else if (normalized.equals("jeju") || normalized.equals("제주")) {
            return "jeju";
        }
        
        // 기존 한글 지역명 매핑 로직
        
        // 한글 지역명을 영문 코드로 변환
        if (normalized.contains("서울")) {
            return "seoul";
        } else if (normalized.contains("부산")) {
            return "busan";
        } else if (normalized.contains("인천")) {
            return "incheon";
        } else if (normalized.contains("대구")) {
            return "daegu";
        } else if (normalized.contains("대전")) {
            return "daejeon";
        } else if (normalized.contains("광주")) {
            return "gwangju";
        } else if (normalized.contains("울산")) {
            return "ulsan";
        } else if (normalized.contains("세종")) {
            return "sejong";
        } else if (normalized.contains("경기")) {
            return "gyeonggi";
        } else if (normalized.contains("강원")) {
            return "gangwon";
        } else if (normalized.contains("충북") || normalized.contains("충청북도")) {
            return "chungbuk";
        } else if (normalized.contains("충남") || normalized.contains("충청남도")) {
            return "chungnam";
        } else if (normalized.contains("전북") || normalized.contains("전라북도")) {
            return "jeonbuk";
        } else if (normalized.contains("전남") || normalized.contains("전라남도")) {
            return "jeonnam";
        } else if (normalized.contains("경북") || normalized.contains("경상북도")) {
            return "gyeongbuk";
        } else if (normalized.contains("경남") || normalized.contains("경상남도")) {
            return "gyeongnam";
        } else if (normalized.contains("제주")) {
            return "jeju";
        }
        
        // 이미 영문 코드인 경우 (소문자, 하이픈 포함)
        if (normalized.matches("^[a-z-]+$")) {
            return normalized;
        }
        
        return "unknown";
    }

    @Transactional
    public OnboardingRequest decide(UUID requestId, OnboardingStatus status, String actorId, String note) {
        log.info("[OnboardingService] decide 메서드 시작 - requestId={}, status={}, actorId={}", requestId, status, actorId);
        
        OnboardingRequest request = repository.findById(requestId)
            .orElseThrow(() -> new com.mindgarden.ops.exception.EntityNotFoundException("온보딩 요청", requestId));
        
        log.info("[OnboardingService] 온보딩 요청 조회 완료 - requestId={}, 현재 상태={}, tenantId={}", 
            requestId, request.getStatus(), request.getTenantId());

        // 승인인 경우 프로시저 직접 호출하여 테넌트 생성 및 관리자 계정 생성
        if (status == OnboardingStatus.APPROVED) {
            try {
                // tenantId가 null이면 자동 생성
                String tenantIdValue = request.getTenantId();
                log.info("[OnboardingService] tenantId 체크 - 기존 tenantId={}, null 여부={}, empty 여부={}", 
                    tenantIdValue, tenantIdValue == null, tenantIdValue != null && tenantIdValue.trim().isEmpty());
                
                if (tenantIdValue == null || tenantIdValue.trim().isEmpty()) {
                    // 표준 형식: tenant-{지역코드}-{업종코드}-{순번}
                    // 지역 정보는 checklistJson에서 추출하거나 request에서 가져오거나 "unknown" 사용
                    String regionCode = null;
                    
                    // 1. 먼저 checklistJson에서 regionCode 추출 시도
                    if (request.getChecklistJson() != null && !request.getChecklistJson().isEmpty()) {
                        regionCode = extractRegionCodeFromChecklist(request.getChecklistJson());
                        log.info("[OnboardingService] checklistJson에서 regionCode 추출: {}", regionCode);
                    }
                    
                    // 2. 없으면 request.getRegion() 사용
                    if (regionCode == null || regionCode.isBlank()) {
                        regionCode = normalizeRegionCode(request.getRegion());
                        log.info("[OnboardingService] request.getRegion()에서 regionCode 정규화: {}", regionCode);
                    }
                    
                    // 3. 그래도 없으면 "unknown"
                    if (regionCode == null || regionCode.isBlank()) {
                        regionCode = "unknown";
                        log.warn("[OnboardingService] regionCode를 찾을 수 없어 'unknown' 사용");
                    }
                    
                    // 업종 코드 정규화 (대문자 -> 소문자, 언더스코어 -> 하이픈)
                    String businessTypeCode = OpsConstants.DEFAULT_BUSINESS_TYPE.toLowerCase().replace("_", "-");
                    
                    // 같은 지역+업종의 기존 테넌트 수 조회하여 순번 결정
                    String countQuery = "SELECT COUNT(*) FROM tenants WHERE tenant_id LIKE ? AND (is_deleted IS NULL OR is_deleted = FALSE)";
                    String pattern = "tenant-" + regionCode + "-" + businessTypeCode + "-%";
                    Long existingCount = jdbcTemplate.queryForObject(countQuery, Long.class, pattern);
                    int sequenceNumber = (existingCount != null ? existingCount.intValue() : 0) + 1;
                    
                    // 순번을 3자리 숫자로 포맷팅 (001, 002, ...)
                    String formattedSequence = String.format("%03d", sequenceNumber);
                    
                    // 최종 테넌트 ID 생성
                    tenantIdValue = String.format("tenant-%s-%s-%s", regionCode, businessTypeCode, formattedSequence);
                    
                    // 중복 체크 (같은 ID가 이미 존재하는 경우 순번 증가)
                    String existsQuery = "SELECT COUNT(*) > 0 FROM tenants WHERE tenant_id = ?";
                    while (Boolean.TRUE.equals(jdbcTemplate.queryForObject(existsQuery, Boolean.class, tenantIdValue))) {
                        sequenceNumber++;
                        formattedSequence = String.format("%03d", sequenceNumber);
                        tenantIdValue = String.format("tenant-%s-%s-%s", regionCode, businessTypeCode, formattedSequence);
                        log.warn("[OnboardingService] 테넌트 ID 중복 감지, 순번 증가: tenantId={}", tenantIdValue);
                    }
                    
                    log.info("[OnboardingService] ✅ 테넌트 ID 자동 생성 (표준 형식): tenantName={}, businessType={}, region={}, sequence={}, generatedTenantId={}", 
                        request.getTenantName(), OpsConstants.DEFAULT_BUSINESS_TYPE, regionCode, sequenceNumber, tenantIdValue);
                    
                    // 온보딩 요청에 생성된 tenantId 저장
                    request.setTenantId(tenantIdValue);
                }
                
                log.info("[OnboardingService] 테넌트 생성 프로시저 실행 - tenantId={}, tenantName={}", 
                    tenantIdValue, request.getTenantName());
                
                // 관리자 비밀번호 추출 및 해시 생성
                String adminEmail = request.getRequestedBy();
                String adminPasswordHash = null;
                
                if (adminEmail != null && !adminEmail.isBlank()) {
                    String rawPassword = extractAdminPasswordFromChecklist(request.getChecklistJson());
                    adminPasswordHash = passwordEncoder.encode(rawPassword);
                    log.info("관리자 계정 정보 준비 완료 - email={}", adminEmail);
                }
                
                // CreateOrActivateTenant 프로시저 호출 (관리자 계정 생성 포함)
                Connection connection = jdbcTemplate.getDataSource().getConnection();
                try {
                    log.info("[OnboardingService] 프로시저 호출 준비 - tenantId={}, tenantName={}, businessType={}, actorId={}, adminEmail={}, hasPasswordHash={}", 
                        tenantIdValue, request.getTenantName(), OpsConstants.DEFAULT_BUSINESS_TYPE, actorId, adminEmail, adminPasswordHash != null);
                    
                    CallableStatement cs = connection.prepareCall(
                        "{CALL CreateOrActivateTenant(?, ?, ?, ?, ?, ?, ?, ?)}"
                    );
                    
                    // IN 파라미터
                    cs.setString(1, tenantIdValue);
                    cs.setString(2, request.getTenantName());
                    cs.setString(3, OpsConstants.DEFAULT_BUSINESS_TYPE); // 기본 업종 (상수 사용)
                    cs.setString(4, actorId);
                    cs.setString(5, adminEmail); // 관리자 이메일 (옵셔널)
                    cs.setString(6, adminPasswordHash); // 관리자 비밀번호 해시 (옵셔널)
                    
                    // OUT 파라미터
                    cs.registerOutParameter(7, Types.BOOLEAN); // p_success
                    cs.registerOutParameter(8, Types.VARCHAR); // p_message
                    
                    log.info("[OnboardingService] 프로시저 실행 시작");
                    cs.execute();
                    log.info("[OnboardingService] 프로시저 실행 완료");
                    
                    boolean success = cs.getBoolean(7);
                    String message = cs.getString(8);
                    
                    log.info("[OnboardingService] 프로시저 결과 - success={}, message={}", success, message);
                    
                    cs.close();
                    
                    if (success) {
                        log.info("✅ 테넌트 및 관리자 계정 생성 완료: {}", message);
                        note = (note != null ? note + "\n\n" : "") + message;
                        
                        // 브랜딩 정보 설정 (checklistJson에서 brandName 추출)
                        try {
                            setTenantBranding(tenantIdValue, request);
                        } catch (Exception e) {
                            log.warn("⚠️ 브랜딩 정보 설정 실패 (온보딩 프로세스는 계속 진행): tenantId={}, error={}", 
                                tenantIdValue, e.getMessage());
                        }
                    } else {
                        log.error("❌ 테넌트 생성 실패: success={}, message={}", success, message);
                        status = OnboardingStatus.ON_HOLD;
                        note = (note != null ? note + "\n\n" : "") + "[오류] " + (message != null ? message : "프로시저 실행 실패 (메시지 없음)");
                    }
                } catch (SQLException e) {
                    log.error("❌ 프로시저 SQL 오류: errorCode={}, sqlState={}, message={}", 
                        e.getErrorCode(), e.getSQLState(), e.getMessage(), e);
                    throw e;
                } finally {
                    connection.close();
                }
                
            } catch (Exception e) {
                log.error("❌ 프로시저 실행 실패: {}", e.getMessage(), e);
                status = OnboardingStatus.ON_HOLD;
                note = (note != null ? note + "\n\n" : "") + "[오류] 테넌트 생성 실패: " + e.getMessage();
            }
        }

        request.setStatus(status);
        request.setDecidedBy(actorId);
        request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        request.setDecisionNote(note);
        
        log.info("[OnboardingService] 결정 정보 저장 중 - requestId={}, 최종 상태={}, actorId={}", 
            requestId, status, actorId);
        
        OnboardingRequest saved = repository.save(request);
        
        log.info("[OnboardingService] 결정 저장 완료 - requestId={}, 최종 상태={}, saved.id={}", 
            requestId, saved.getStatus(), saved.getId());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tenantId", request.getTenantId());
        metadata.put("status", status.name());
        if (note != null && !note.isBlank()) {
            metadata.put("note", note);
        }

        auditService.record(
            "ONBOARDING_DECISION",
            "ONBOARDING_REQUEST",
            saved.getId().toString(),
            actorId,
            "APPROVER",
            "온보딩 결정",
            metadata
        );

        return saved;
    }

    /**
     * 테넌트 브랜딩 정보 설정 (브랜드명 저장)
     * checklistJson에서 brandName을 추출하여 tenants.branding_json에 저장
     * 헤더, 햄버거 메뉴, 메인 페이지에 표시됨
     * 
     * @param tenantId 테넌트 ID
     * @param request 온보딩 요청
     */
    private void setTenantBranding(String tenantId, OnboardingRequest request) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("[OnboardingService] ⚠️ 테넌트 ID가 없어 브랜딩 정보 설정을 건너뜁니다.");
            return;
        }
        
        try {
            // brandName 필드에서 가져오기 (이미 저장되어 있음)
            String brandName = request.getBrandName();
            if (brandName == null || brandName.trim().isEmpty()) {
                brandName = request.getTenantName();
                log.info("[OnboardingService] brandName 필드가 없어 tenantName 사용: {}", brandName);
            } else {
                log.info("[OnboardingService] brandName 필드에서 가져옴: {}", brandName);
            }
            
            // tenants 테이블의 branding_json 업데이트
            // JSON 구조: {"companyName": "브랜드명", "companyNameEn": "브랜드명"}
            String brandingJson = String.format(
                "{\"companyName\":\"%s\",\"companyNameEn\":\"%s\"}",
                brandName.replace("\"", "\\\""),
                brandName.replace("\"", "\\\"")
            );
            
            String updateQuery = """
                UPDATE tenants 
                SET branding_json = ?,
                    updated_at = NOW(),
                    updated_by = ?
                WHERE tenant_id = ?
                AND (is_deleted IS NULL OR is_deleted = FALSE)
                """;
            
            int updated = jdbcTemplate.update(updateQuery, brandingJson, "ops_system", tenantId);
            
            if (updated > 0) {
                log.info("[OnboardingService] ✅ 테넌트 브랜딩 정보 설정 완료: tenantId={}, brandName={}", tenantId, brandName);
            } else {
                log.warn("[OnboardingService] ⚠️ 테넌트를 찾을 수 없어 브랜딩 정보 설정 실패: tenantId={}", tenantId);
            }
        } catch (Exception e) {
            log.error("[OnboardingService] ❌ 브랜딩 정보 설정 중 오류: tenantId={}, error={}", tenantId, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 체크리스트 JSON에서 관리자 비밀번호 추출
     * @param checklistJson 체크리스트 JSON 문자열
     * @return 관리자 비밀번호 (없으면 기본 비밀번호)
     */
    /**
     * checklistJson에서 regionCode 추출 (JSON 파싱 사용)
     * @param checklistJson 체크리스트 JSON 문자열
     * @return 추출된 regionCode (없으면 null)
     */
    private String extractRegionCodeFromChecklist(String checklistJson) {
        if (checklistJson == null || checklistJson.isEmpty()) {
            return null;
        }
        try {
            JsonNode jsonNode = objectMapper.readTree(checklistJson);
            if (jsonNode.has("regionCode") && jsonNode.get("regionCode").isTextual()) {
                String regionCode = jsonNode.get("regionCode").asText();
                // 이미 영문 코드인 경우 정규화 (예: "INCHEON" -> "incheon")
                return normalizeRegionCode(regionCode);
            }
        } catch (Exception e) {
            log.warn("체크리스트 JSON에서 regionCode 추출 실패: {}", e.getMessage());
        }
        return null;
    }
    
    private String extractAdminPasswordFromChecklist(String checklistJson) {
        if (checklistJson == null || checklistJson.isEmpty()) {
            return "TempPassword123!"; // 기본 비밀번호
        }
        try {
            // "adminPassword": "password_value" 형태를 가정
            int startIndex = checklistJson.indexOf("\"adminPassword\": \"");
            if (startIndex != -1) {
                startIndex += "\"adminPassword\": \"".length();
                int endIndex = checklistJson.indexOf("\"", startIndex);
                if (endIndex != -1) {
                    return checklistJson.substring(startIndex, endIndex);
                }
            }
        } catch (Exception e) {
            log.warn("체크리스트 JSON에서 adminPassword 추출 실패, 기본 비밀번호 사용: {}", e.getMessage());
        }
        return "TempPassword123!"; // 추출 실패 시 기본 비밀번호
    }
}
