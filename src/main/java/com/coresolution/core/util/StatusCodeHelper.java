package com.coresolution.core.util;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.CommonCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 상태값 공통코드 조회 헬퍼 유틸리티
 * 
 * 모든 상태값은 공통코드에서 동적으로 조회합니다.
 * 하드코딩된 상수 클래스 사용을 대체합니다.
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatusCodeHelper {
    
    private final CommonCodeService commonCodeService;
    
    /**
     * 상태값 캐시 (codeGroup -> List<CommonCode>)
     * 성능 최적화를 위한 캐싱
     */
    private final Map<String, List<CommonCode>> statusCache = new ConcurrentHashMap<>();
    
    /**
     * 상태값이 특정 값과 일치하는지 확인
     * 
     * @param codeGroup 공통코드 그룹 (예: "MAPPING_STATUS", "CONSULTATION_STATUS")
     * @param codeValue 비교할 코드값 (예: "ACTIVE", "COMPLETED")
     * @param status 확인할 상태값
     * @return 일치 여부
     */
    public boolean isStatus(String codeGroup, String codeValue, String status) {
        if (codeValue == null || status == null) {
            return false;
        }
        return codeValue.equals(status);
    }
    
    /**
     * 공통코드 그룹의 모든 활성 상태값 조회 (캐싱 적용)
     * 
     * @param codeGroup 공통코드 그룹
     * @return 활성 상태값 목록
     */
    public List<CommonCode> getStatusCodes(String codeGroup) {
        return statusCache.computeIfAbsent(codeGroup, group -> {
            try {
                List<CommonCode> codes = commonCodeService.getActiveCommonCodesByGroup(group);
                log.debug("상태값 조회 완료: codeGroup={}, count={}", group, codes.size());
                return codes;
            } catch (Exception e) {
                log.error("상태값 조회 실패: codeGroup={}", group, e);
                return List.of();
            }
        });
    }
    
    /**
     * 공통코드 그룹에서 특정 코드값 조회
     * 
     * @param codeGroup 공통코드 그룹
     * @param codeValue 코드값
     * @return CommonCode (없으면 null)
     */
    public CommonCode getStatusCode(String codeGroup, String codeValue) {
        if (codeValue == null) {
            return null;
        }
        
        List<CommonCode> codes = getStatusCodes(codeGroup);
        return codes.stream()
            .filter(code -> codeValue.equals(code.getCodeValue()))
            .findFirst()
            .orElse(null);
    }
    
    /**
     * 공통코드 그룹에서 특정 코드값의 한글명 조회
     * 
     * @param codeGroup 공통코드 그룹
     * @param codeValue 코드값
     * @return 한글명 (없으면 null)
     */
    public String getStatusKoreanName(String codeGroup, String codeValue) {
        CommonCode code = getStatusCode(codeGroup, codeValue);
        if (code != null) {
            return code.getKoreanName() != null ? code.getKoreanName() : code.getCodeLabel();
        }
        return null;
    }
    
    /**
     * 공통코드 그룹에서 특정 코드값의 영문 라벨 조회
     * 
     * @param codeGroup 공통코드 그룹
     * @param codeValue 코드값
     * @return 코드 라벨 (없으면 null)
     */
    public String getStatusCodeLabel(String codeGroup, String codeValue) {
        CommonCode code = getStatusCode(codeGroup, codeValue);
        return code != null ? code.getCodeLabel() : null;
    }
    
    /**
     * 공통코드 그룹에서 코드값으로 코드값 조회 (라벨/한글명으로도 검색 가능)
     * 
     * @param codeGroup 공통코드 그룹
     * @param searchValue 검색할 값 (코드값, 라벨, 한글명)
     * @return 코드값 (없으면 null)
     */
    public String getStatusCodeValue(String codeGroup, String searchValue) {
        if (searchValue == null) {
            return null;
        }
        
        List<CommonCode> codes = getStatusCodes(codeGroup);
        for (CommonCode code : codes) {
            if (searchValue.equals(code.getCodeValue()) || 
                searchValue.equals(code.getCodeLabel()) ||
                (code.getKoreanName() != null && searchValue.equals(code.getKoreanName()))) {
                return code.getCodeValue();
            }
        }
        return null;
    }
    
    /**
     * 상태값이 유효한지 확인 (공통코드에 존재하는지)
     * 
     * @param codeGroup 공통코드 그룹
     * @param codeValue 확인할 코드값
     * @return 유효 여부
     */
    public boolean isValidStatus(String codeGroup, String codeValue) {
        if (codeValue == null) {
            return false;
        }
        return getStatusCode(codeGroup, codeValue) != null;
    }
    
    /**
     * 상태값 목록을 코드값 배열로 반환
     * 
     * @param codeGroup 공통코드 그룹
     * @return 코드값 배열
     */
    public List<String> getStatusCodeValues(String codeGroup) {
        return getStatusCodes(codeGroup).stream()
            .map(CommonCode::getCodeValue)
            .collect(Collectors.toList());
    }
    
    /**
     * 캐시 무효화 (공통코드가 변경된 경우 호출)
     * 
     * @param codeGroup 공통코드 그룹 (null이면 전체 캐시 무효화)
     */
    public void clearCache(String codeGroup) {
        if (codeGroup != null) {
            statusCache.remove(codeGroup);
            log.debug("상태값 캐시 무효화: codeGroup={}", codeGroup);
        } else {
            statusCache.clear();
            log.debug("상태값 캐시 전체 무효화");
        }
    }
    
    /**
     * 캐시 상태 확인 (디버깅용)
     * 
     * @return 캐시된 그룹 목록
     */
    public List<String> getCachedGroups() {
        return List.copyOf(statusCache.keySet());
    }
}

