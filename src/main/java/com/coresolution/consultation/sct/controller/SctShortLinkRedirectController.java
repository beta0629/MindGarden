package com.coresolution.consultation.sct.controller;

import java.net.URI;
import com.coresolution.consultation.sct.service.SctShortLinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * SCT 단축 링크 302 리다이렉트. {@code /s/{shortCode}} — API 접두 없음.
 * Location에 초대 평문 토큰을 넣지 않는다(Redis 교환 코드).
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class SctShortLinkRedirectController {

    private final SctShortLinkService sctShortLinkService;

    /**
     * 단축 코드 → 공개 SPA 경로로 302.
     *
     * @param shortCode 6자 단축 코드
     * @return 302 Location
     */
    @GetMapping("/s/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable("shortCode") String shortCode) {
        String path = sctShortLinkService.resolveRedirectPath(shortCode);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(path));
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, private");
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}
