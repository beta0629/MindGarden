package com.mindgarden.consultation.controller;

import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * 간단한 테스트용 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/test-simple")
public class SimpleTestController {

    @GetMapping("/hello")
    public String hello() {
        log.info("✅ Hello API 호출됨");
        return "Hello, MindGarden!";
    }

    @GetMapping("/health")
    public String health() {
        log.info("✅ Health Check API 호출됨");
        return "OK";
    }

    @PostMapping("/echo")
    public String echo(@RequestBody String message) {
        log.info("✅ Echo API 호출됨: {}", message);
        return "Echo: " + message;
    }
}
