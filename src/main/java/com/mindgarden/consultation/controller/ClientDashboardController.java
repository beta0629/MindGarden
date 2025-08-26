package com.mindgarden.consultation.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 대시보드 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Controller
@RequestMapping("/tablet/client")
public class ClientDashboardController {

    /**
     * 내담자 대시보드 메인 페이지
     * 
     * @param model 모델
     * @param login 로그인 상태
     * @param message 로그인 메시지
     * @return 내담자 대시보드 뷰
     */
    @GetMapping("/dashboard")
    public String clientDashboard(
            Model model,
            @RequestParam(required = false) String login,
            @RequestParam(required = false) String message) {
        
        log.info("내담자 대시보드 접근: login={}, message={}", login, message);
        
        // 로그인 성공 상태 전달
        if ("success".equals(login)) {
            model.addAttribute("loginSuccess", true);
            model.addAttribute("loginMessage", message);
        }
        
        // 내담자 대시보드 뷰 반환
        return "client/dashboard";
    }
}
