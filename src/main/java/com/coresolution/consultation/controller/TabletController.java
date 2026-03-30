package com.coresolution.consultation.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 테블릿 전용 컨트롤러
 * 테블릿 화면에 최적화된 기능 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Controller
@RequestMapping("/tablet")
public class TabletController {
    
    /**
     * 테블릿 홈페이지
     */
    @GetMapping("/")
    public String tabletHome(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("bodyClass", "tablet-body");
        return "tablet/home";
    }
    
    /**
     * 테블릿 상담 관리
     */
    @GetMapping("/consultation")
    public String tabletConsultation(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("bodyClass", "tablet-body");
        model.addAttribute("pageTitle", "상담 관리");
        return "tablet/consultation";
    }
    
    /**
     * 테블릿 내담자 관리
     */
    @GetMapping("/clients")
    public String tabletClients(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("bodyClass", "tablet-body");
        model.addAttribute("pageTitle", "내담자 관리");
        return "tablet/clients";
    }
    
    /**
     * 테블릿 상담사 관리
     */
    @GetMapping("/consultants")
    public String tabletConsultants(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("bodyClass", "tablet-body");
        model.addAttribute("pageTitle", "상담사 관리");
        return "tablet/consultants";
    }
    
    /**
     * 테블릿 리포트
     */
    @GetMapping("/reports")
    public String tabletReports(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("bodyClass", "tablet-body");
        model.addAttribute("pageTitle", "리포트");
        return "tablet/reports";
    }
    
    /**
     * 테블릿 설정
     */
    @GetMapping("/settings")
    public String tabletSettings(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("bodyClass", "tablet-body");
        model.addAttribute("pageTitle", "설정");
        return "tablet/settings";
    }
    
    /**
     * 태블릿 로그인 페이지
     */
    @GetMapping("/login")
    public String tabletLogin(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("title", "MindGarden - 로그인");
        return "tablet/login";
    }
    
    /**
     * 태블릿 회원가입 페이지
     */
    @GetMapping("/register")
    public String tabletRegister(Model model) {
        model.addAttribute("isTablet", true);
        model.addAttribute("title", "MindGarden - 회원가입");
        return "tablet/register";
    }
}
