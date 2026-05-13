package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import com.coresolution.consultation.service.PsychoEducationService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 심리 교육(웰니스) 콘텐츠 컨트롤러.
 *
 * <p>Expo 클라이언트(`PSYCHO_EDUCATION_API.LIST` / {@code detail(id)})의 정합 엔드포인트.
 * 응답은 {@link com.coresolution.core.dto.ApiResponse} 래퍼로 감싸져 내려가며,
 * 클라이언트의 {@code unwrapApiResponse}가 {@code data} 필드에서 본문을 추출한다.</p>
 *
 * <p>인증·테넌트 격리:</p>
 * <ul>
 *   <li>Spring Security: {@code /api/v1/psycho-education/**} 경로는 인증 사용자(내담자/상담사 공용)만 접근 가능.
 *       {@link com.coresolution.consultation.config.SecurityConfig} 설정 참조.</li>
 *   <li>{@link com.coresolution.core.filter.TenantContextFilter}가
 *       {@code X-Tenant-Id} 또는 세션·JWT 컨텍스트에서 테넌트를 추출해 강제한다.
 *       누락 시 400을 반환하므로 본 컨트롤러까지 도달하지 못한다.</li>
 * </ul>
 *
 * <p>본 단계의 콘텐츠는 시드(상수)다. 운영 도입 시 DB 기반 Repository로 교체한다
 * (`docs/project-management/EXPO_NATIVE_APP_PLAN.md` §13).</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/psycho-education")
@RequiredArgsConstructor
public class PsychoEducationController extends BaseApiController {

    private final PsychoEducationService psychoEducationService;

    /**
     * 심리 교육 콘텐츠 목록 조회.
     *
     * @return {@code { success, data: PsychoEducationArticleResponse[] }} 형태의 ApiResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PsychoEducationArticleResponse>>> getArticles() {
        List<PsychoEducationArticleResponse> articles = psychoEducationService.listArticles();
        return success("심리 교육 콘텐츠를 조회했습니다.", articles);
    }

    /**
     * 심리 교육 콘텐츠 상세 조회.
     *
     * @param id 콘텐츠 식별자 (양수)
     * @return {@code { success, data: PsychoEducationArticleResponse }} 형태의 ApiResponse
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 콘텐츠가 없을 때 (HTTP 404)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PsychoEducationArticleResponse>> getArticle(@PathVariable Long id) {
        PsychoEducationArticleResponse article = psychoEducationService.getArticle(id);
        return success("심리 교육 콘텐츠를 조회했습니다.", article);
    }
}
