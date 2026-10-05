package com.coresolution.core.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.krpublic.AddressSearchResult;
import com.coresolution.core.krpublic.BusinessLookupRequest;
import com.coresolution.core.krpublic.BusinessVerificationResult;
import com.coresolution.core.krpublic.KrPublicDataCapabilities;
import com.coresolution.core.krpublic.KrPublicDataService;

import lombok.RequiredArgsConstructor;

/**
 * 로그인 없이 쓰는 공공데이터 프록시. 키는 서버에만 있고 IP 레이트리밋을 적용한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@RestController
@RequestMapping("/api/v1/public/kr-public-data")
@RequiredArgsConstructor
public class PublicKrPublicDataController extends BaseApiController {

    private final KrPublicDataService krPublicDataService;

    /**
     * @return 주소 검색·사업자 조회 사용 가능 여부
     */
    @GetMapping("/capabilities")
    public ResponseEntity<ApiResponse<KrPublicDataCapabilities>> capabilities() {
        return success(krPublicDataService.capabilities());
    }

    /**
     * @param keyword 도로명 검색어
     * @return 잘린 검색 결과
     */
    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressSearchResult>> addresses(
            @RequestParam(name = "keyword", required = false) String keyword) {
        return success(krPublicDataService.searchAddress(keyword));
    }

    /**
     * @param request 사업자번호·개업일자·대표자명
     * @return 조회 결과. 외부 실패는 미확인
     */
    @PostMapping("/business-registration/lookup")
    public ResponseEntity<ApiResponse<BusinessVerificationResult>> lookup(
            @RequestBody BusinessLookupRequest request) {
        return success(krPublicDataService.lookup(request));
    }
}
