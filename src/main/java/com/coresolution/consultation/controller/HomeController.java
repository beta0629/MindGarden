package com.coresolution.consultation.controller;

import com.coresolution.consultation.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 홈페이지 Controller
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Controller
public class HomeController {
    
    @Autowired
    private UserService userService;
    
    /**
     * 홈페이지 메인
     */
    @GetMapping({"/", "/home", "/index"})
    public String home(Model model) {
        // 페이지 메타데이터 설정
        model.addAttribute("title", "MindGarden - 통합 상담관리 시스템");
        model.addAttribute("description", "전문적인 상담 관리와 내담자 관리를 위한 통합 시스템");
        model.addAttribute("keywords", "상담관리, 내담자관리, 상담사, 심리상담, 통합시스템");
        model.addAttribute("bodyClass", "homepage");
        model.addAttribute("currentUrl", "http://m-garden.co.kr");
        model.addAttribute("isTablet", false); // 기본값은 데스크톱
        
        // 브레드크럼 설정
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", true}
        });
        
        // 통계 데이터 설정 (실제 데이터가 없으면 기본값 사용)
        try {
            long totalUsers = userService.countActive();
            model.addAttribute("totalUsers", totalUsers);
        } catch (Exception e) {
            model.addAttribute("totalUsers", 0);
        }
        
        try {
            // 상담 관련 통계는 추후 ConsultationService 구현 시 추가
            model.addAttribute("totalConsultations", 0);
            model.addAttribute("activeConsultants", 0);
            model.addAttribute("satisfactionRate", 0);
        } catch (Exception e) {
            model.addAttribute("totalConsultations", 0);
            model.addAttribute("activeConsultants", 0);
            model.addAttribute("satisfactionRate", 0);
        }
        
        return "homepage/main";
    }
    
    /**
     * 새로운 파스텔톤 홈페이지
     */
    @GetMapping("/homepage/main")
    public String homepageMain(Model model) {
        // 페이지 메타데이터 설정
        model.addAttribute("title", "MindGarden - 통합 상담관리 시스템");
        model.addAttribute("description", "전문적인 상담 관리와 내담자 관리를 위한 통합 시스템");
        model.addAttribute("keywords", "상담관리, 내담자관리, 상담사, 심리상담, 통합시스템");
        model.addAttribute("bodyClass", "homepage");
        model.addAttribute("currentUrl", "http://m-garden.co.kr");
        model.addAttribute("isTablet", false);
        
        // 통계 데이터 설정
        try {
            long totalUsers = userService.countActive();
            model.addAttribute("totalUsers", totalUsers);
        } catch (Exception e) {
            model.addAttribute("totalUsers", 0);
        }
        
        return "homepage/main";
    }
    
    /**
     * 로그인 페이지
     */
    @GetMapping("/login")
    public String login(Model model) {
        model.addAttribute("title", "로그인 - MindGarden");
        model.addAttribute("bodyClass", "login-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"로그인", "/login", true}
        });
        
        return "auth/login";
    }
    
    /**
     * 회원가입 페이지
     */
    @GetMapping("/register")
    public String register(Model model) {
        model.addAttribute("title", "회원가입 - MindGarden");
        model.addAttribute("bodyClass", "register-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"회원가입", "/register", true}
        });
        
        return "auth/register";
    }
    
    /**
     * 비밀번호 찾기 페이지
     */
    @GetMapping("/forgot-password")
    public String forgotPassword(Model model) {
        model.addAttribute("title", "비밀번호 찾기 - MindGarden");
        model.addAttribute("bodyClass", "forgot-password-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"비밀번호 찾기", "/forgot-password", true}
        });
        
        return "auth/forgot-password";
    }
    
    /**
     * 접근 거부 페이지
     */
    @GetMapping("/access-denied")
    public String accessDenied(Model model) {
        model.addAttribute("title", "접근 거부 - MindGarden");
        model.addAttribute("bodyClass", "access-denied-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"접근 거부", "/access-denied", true}
        });
        
        return "error/access-denied";
    }
    
    /**
     * 데모 페이지
     */
    @GetMapping("/demo")
    public String demo(Model model) {
        model.addAttribute("title", "데모 - MindGarden");
        model.addAttribute("bodyClass", "demo-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"데모", "/demo", true}
        });
        
        return "demo";
    }
    
    /**
     * 문의하기 페이지
     */
    @GetMapping("/contact")
    public String contact(Model model) {
        model.addAttribute("title", "문의하기 - MindGarden");
        model.addAttribute("bodyClass", "contact-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"문의하기", "/contact", true}
        });
        
        return "contact";
    }
    
    /**
     * 시스템 소개 페이지
     */
    @GetMapping("/about")
    public String about(Model model) {
        model.addAttribute("title", "시스템 소개 - MindGarden");
        model.addAttribute("bodyClass", "about-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"시스템 소개", "/about", true}
        });
        
        return "about";
    }
    
    /**
     * 주요 기능 페이지
     */
    @GetMapping("/features")
    public String features(Model model) {
        model.addAttribute("title", "주요 기능 - MindGarden");
        model.addAttribute("bodyClass", "features-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"주요 기능", "/features", true}
        });
        
        return "features";
    }
    
    /**
     * 요금제 페이지
     */
    @GetMapping("/pricing")
    public String pricing(Model model) {
        model.addAttribute("title", "요금제 - MindGarden");
        model.addAttribute("bodyClass", "pricing-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"요금제", "/pricing", true}
        });
        
        return "pricing";
    }
    
    /**
     * 로드맵 페이지
     */
    @GetMapping("/roadmap")
    public String roadmap(Model model) {
        model.addAttribute("title", "로드맵 - MindGarden");
        model.addAttribute("bodyClass", "roadmap-page");
        
        model.addAttribute("breadcrumbs", new Object[][]{
            {"홈", "/", false},
            {"로드맵", "/roadmap", true}
        });
        
        return "roadmap";
    }
}
