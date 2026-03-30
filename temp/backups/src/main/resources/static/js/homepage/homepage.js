/**
 * MindGarden - 홈페이지 전용 JavaScript
 * 홈페이지 화면에 최적화된 기능 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

(function() {
    'use strict';

    // ===== 전역 MindGarden 객체 확인 =====
    if (!window.MindGarden) {
        console.error('MindGarden 객체가 로드되지 않았습니다.');
        return;
    }

    // ===== 홈페이지 전용 설정 =====
    const HOMEPAGE_CONFIG = {
        scrollThreshold: 100,      // 스크롤 감지 임계값
        animationDuration: 600,    // 애니메이션 지속시간
        parallaxSpeed: 0.5,       // 패럴랙스 속도
        lazyLoadOffset: 200       // 지연 로딩 오프셋
    };

    // ===== 홈페이지 전용 기능들 =====
    
    /**
     * 헤더 스크롤 효과
     */
    function initHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', window.MindGarden.Utils.event.throttle(() => {
            const scrollTop = window.pageYOffset;
            
            if (scrollTop > 100) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
            
            // 스크롤 방향에 따른 헤더 숨김/표시
            if (scrollTop > lastScrollTop && scrollTop > 200) {
                header.classList.add('header-hidden');
            } else {
                header.classList.remove('header-hidden');
            }
            
            lastScrollTop = scrollTop;
        }, 16));
    }
    
    /**
     * 히어로 섹션 애니메이션
     */
    function initHeroAnimation() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        // 페이지 로드 시 애니메이션
        setTimeout(() => {
            heroSection.classList.add('hero-animated');
        }, 500);
        
        // 스크롤 기반 애니메이션
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('hero-in-view');
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(heroSection);
    }
    
    /**
     * 스크롤 애니메이션
     */
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-scroll-animation]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const animationType = entry.target.dataset.scrollAnimation;
                    entry.target.classList.add(`animate-${animationType}`);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    /**
     * 패럴랙스 효과
     */
    function initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        window.addEventListener('scroll', window.MindGarden.Utils.event.throttle(() => {
            const scrollTop = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.parallax || HOMEPAGE_CONFIG.parallaxSpeed;
                const yPos = -(scrollTop * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }, 16));
    }
    
    /**
     * 카드 호버 효과
     */
    function initCardHoverEffects() {
        const cards = document.querySelectorAll('.feature-card, .info-card, .service-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('card-hovered');
            });
            
            card.addEventListener('mouseleave', function() {
                this.classList.remove('card-hovered');
            });
        });
    }
    
    /**
     * 지연 로딩
     */
    function initLazyLoading() {
        if (!('IntersectionObserver' in window)) return;
        
        const lazyElements = document.querySelectorAll('[data-src], [data-background]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // 이미지 지연 로딩
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                        element.classList.remove('lazy');
                    }
                    
                    // 배경 이미지 지연 로딩
                    if (element.dataset.background) {
                        element.style.backgroundImage = `url(${element.dataset.background})`;
                        element.classList.remove('lazy-bg');
                    }
                    
                    observer.unobserve(element);
                }
            });
        }, { rootMargin: `0px 0px ${HOMEPAGE_CONFIG.lazyLoadOffset}px 0px` });
        
        lazyElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    /**
     * 부드러운 스크롤
     */
    function initSmoothScroll() {
        const smoothLinks = document.querySelectorAll('a[href^="#"]');
        
        smoothLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    /**
     * 네비게이션 메뉴
     */
    function initNavigationMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        const overlay = document.querySelector('.menu-overlay');
        
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('menu-open');
                if (overlay) overlay.classList.toggle('overlay-show');
                document.body.classList.toggle('menu-open');
            });
            
            // 오버레이 클릭으로 메뉴 닫기
            if (overlay) {
                overlay.addEventListener('click', function() {
                    mobileMenu.classList.remove('menu-open');
                    overlay.classList.remove('overlay-show');
                    document.body.classList.remove('menu-open');
                });
            }
            
            // ESC 키로 메뉴 닫기
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && mobileMenu.classList.contains('menu-open')) {
                    mobileMenu.classList.remove('menu-open');
                    if (overlay) overlay.classList.remove('overlay-show');
                    document.body.classList.remove('menu-open');
                }
            });
        }
    }
    
    /**
     * 폼 처리
     */
    function initFormHandling() {
        const forms = document.querySelectorAll('form[data-homepage-form]');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = window.MindGarden.Components.Form.getData(this);
                const submitBtn = this.querySelector('[type="submit"]');
                const originalText = submitBtn?.textContent;
                
                // 로딩 상태
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 전송 중...';
                }
                
                // AJAX 제출
                window.MindGarden.Ajax.post(this.action, formData)
                    .then(response => {
                        if (response.data.success !== false) {
                            window.MindGarden.Components.Alert.show('success', '메시지가 성공적으로 전송되었습니다.');
                            this.reset();
                        } else {
                            window.MindGarden.Components.Alert.show('error', response.data.message || '전송 중 오류가 발생했습니다.');
                        }
                    })
                    .catch(error => {
                        window.MindGarden.Components.Alert.show('error', '네트워크 오류가 발생했습니다.');
                    })
                    .finally(() => {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                        }
                    });
            });
        });
    }
    
    /**
     * 카운터 애니메이션
     */
    function initCounterAnimation() {
        const counters = document.querySelectorAll('[data-counter]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.dataset.counter);
                    const duration = parseInt(counter.dataset.duration) || 2000;
                    const increment = target / (duration / 16);
                    let current = 0;
                    
                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.textContent = Math.floor(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target;
                        }
                    };
                    
                    updateCounter();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => {
            observer.observe(counter);
        });
    }
    
    /**
     * 후기 슬라이더
     */
    function initTestimonialSlider() {
        const slider = document.querySelector('.testimonial-slider');
        if (!slider) return;
        
        const slides = slider.querySelectorAll('.testimonial-slide');
        const prevBtn = slider.querySelector('.slider-prev');
        const nextBtn = slider.querySelector('.slider-next');
        let currentSlide = 0;
        
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
        
        function prevSlide() {
            currentSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
            showSlide(currentSlide);
        }
        
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        
        // 자동 슬라이드
        setInterval(nextSlide, 5000);
        
        // 초기 슬라이드 표시
        showSlide(0);
    }
    
    /**
     * 뒤로 가기 버튼
     */
    function initBackToTop() {
        const backToTopBtn = document.querySelector('.back-to-top');
        if (!backToTopBtn) return;
        
        // 스크롤 위치에 따른 버튼 표시/숨김
        window.addEventListener('scroll', window.MindGarden.Utils.event.throttle(() => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }, 100));
        
        // 클릭 시 맨 위로 스크롤
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    /**
     * 검색 기능
     */
    function initSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchResults = document.querySelector('.search-results');
        
        if (!searchInput || !searchResults) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                const query = this.value.trim();
                
                if (query.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }
                
                // 검색 결과 표시 (실제로는 API 호출)
                performSearch(query);
            }, 300);
        });
        
        // 검색 결과 외부 클릭 시 숨김
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
    
    /**
     * 검색 실행
     */
    function performSearch(query) {
        // 실제 검색 API 호출 대신 더미 데이터 사용
        const dummyResults = [
            { title: '상담 서비스', url: '/consultation' },
            { title: '고객 관리', url: '/clients' },
            { title: '상담사 소개', url: '/consultants' }
        ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
        
        displaySearchResults(dummyResults);
    }
    
    /**
     * 검색 결과 표시
     */
    function displaySearchResults(results) {
        const searchResults = document.querySelector('.search-results');
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
        } else {
            searchResults.innerHTML = results.map(result => 
                `<a href="${result.url}" class="search-result-item">${result.title}</a>`
            ).join('');
        }
        
        searchResults.style.display = 'block';
    }
    
    /**
     * 초기화 함수
     */
    function init() {
        // 데스크톱/모바일이 아닌 경우 초기화 중단
        if (window.MindGarden?.Utils?.deviceType?.isTablet()) {
            return;
        }
        
        console.log('🏠 MindGarden 홈페이지 모드 활성화');
        
        // 홈페이지 전용 기능 초기화
        initHeaderScroll();
        initHeroAnimation();
        initScrollAnimations();
        initParallax();
        initCardHoverEffects();
        initLazyLoading();
        initSmoothScroll();
        initNavigationMenu();
        initFormHandling();
        initCounterAnimation();
        initTestimonialSlider();
        initBackToTop();
        initSearch();
        
        console.log('✅ MindGarden 홈페이지 기능 초기화 완료');
    }
    
    // ===== 초기화 실행 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ===== 전역 MindGarden 객체에 홈페이지 기능 노출 =====
    window.MindGarden = window.MindGarden || {};
    window.MindGarden.Homepage = {
        config: HOMEPAGE_CONFIG,
        init: init,
        initHeaderScroll,
        initHeroAnimation,
        initScrollAnimations,
        initParallax,
        initCardHoverEffects,
        initLazyLoading,
        initSmoothScroll,
        initNavigationMenu,
        initFormHandling,
        initCounterAnimation,
        initTestimonialSlider,
        initBackToTop,
        initSearch
    };
    
})();
