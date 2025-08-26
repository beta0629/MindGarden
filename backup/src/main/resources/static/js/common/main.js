/**
 * MindGarden - 공통 JavaScript 메인 모듈
 * 모든 공통 모듈들을 통합하고 초기화하는 메인 파일
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

    // ===== 모듈 로딩 상태 확인 =====
    const requiredModules = ['Utils', 'Ajax', 'Components', 'Router'];
    const missingModules = requiredModules.filter(module => !window.MindGarden[module]);

    if (missingModules.length > 0) {
        console.error(`필수 모듈이 로드되지 않았습니다: ${missingModules.join(', ')}`);
        return;
    }

    // ===== 전역 이벤트 리스너 설정 =====
    function setupGlobalEventListeners() {
        // 폼 제출 이벤트 처리
        document.addEventListener('submit', function(e) {
            const form = e.target;
            
            // AJAX 폼 처리
            if (form.hasAttribute('data-ajax')) {
                e.preventDefault();
                handleAjaxForm(form);
            }
            
            // 폼 검증
            if (form.hasAttribute('data-validate')) {
                const validation = window.MindGarden.Components.Form.validate(form);
                if (!validation.isValid) {
                    e.preventDefault();
                    showValidationErrors(validation.errors);
                }
            }
        });

        // AJAX 링크 처리
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[data-ajax]');
            if (link) {
                e.preventDefault();
                handleAjaxLink(link);
            }
        });

        // 키보드 단축키
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Enter: 폼 제출
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeForm = document.querySelector('form:focus-within');
                if (activeForm) {
                    activeForm.dispatchEvent(new Event('submit'));
                }
            }
            
            // ESC: 모달 닫기
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.modal-active');
                if (openModal) {
                    window.MindGarden.Components.Modal.close(openModal);
                }
            }
        });

        // 전역 로딩 상태 처리
        document.addEventListener('click', function(e) {
            const loadingElement = e.target.closest('[data-loading]');
            if (loadingElement) {
                window.MindGarden.Components.Loading.show('처리 중...');
            }
        });

        // 라우트 변경 이벤트 처리
        window.MindGarden.Router.onRouteChange(function(e) {
            console.log('🔄 라우트 변경 감지:', e.detail || 'popstate');
            handleRouteChange();
        });
    }

    // ===== 라우트 변경 처리 =====
    function handleRouteChange() {
        const currentDevice = window.MindGarden.Router.currentDevice;
        const currentRoute = window.MindGarden.Router.getCurrentRoute();
        
        console.log(`📍 현재 라우트: ${currentRoute} (${currentDevice})`);
        
        // 디바이스별 전용 기능 초기화
        if (currentDevice === 'tablet') {
            initTabletFeatures();
        } else {
            initHomepageFeatures();
        }
        
        // 라우트별 특별 처리
        switch (currentRoute) {
            case 'consultation':
                initConsultationPage();
                break;
            case 'clients':
                initClientsPage();
                break;
            case 'consultants':
                initConsultantsPage();
                break;
            case 'reports':
                initReportsPage();
                break;
            case 'settings':
                initSettingsPage();
                break;
            default:
                // 홈 페이지 처리
                break;
        }
    }

    // ===== 테블릿 전용 기능 초기화 =====
    function initTabletFeatures() {
        console.log('📱 테블릿 전용 기능 초기화');
        
        // 테블릿 전용 JavaScript 로드 확인
        if (window.MindGarden.Tablet && typeof window.MindGarden.Tablet.init === 'function') {
            window.MindGarden.Tablet.init();
        }
        
        // 테블릿 전용 이벤트 리스너
        document.addEventListener('tabletSwipeLeft', handleTabletSwipe);
        document.addEventListener('tabletSwipeRight', handleTabletSwipe);
        document.addEventListener('tabletDoubleTap', handleTabletDoubleTap);
    }

    // ===== 홈페이지 전용 기능 초기화 =====
    function initHomepageFeatures() {
        console.log('🏠 홈페이지 전용 기능 초기화');
        
        // 홈페이지 전용 JavaScript 로드 확인
        if (window.MindGarden.Homepage && typeof window.MindGarden.Homepage.init === 'function') {
            window.MindGarden.Homepage.init();
        }
        
        // 홈페이지 전용 이벤트 리스너
        initHomepageEventListeners();
    }

    // ===== 테블릿 제스처 처리 =====
    function handleTabletSwipe(e) {
        const direction = e.type === 'tabletSwipeLeft' ? 'left' : 'right';
        console.log(`📱 테블릿 스와이프: ${direction}`);
        
        // 스와이프 방향에 따른 네비게이션
        if (direction === 'left') {
            // 다음 페이지로 이동
            navigateToNextPage();
        } else {
            // 이전 페이지로 이동
            navigateToPreviousPage();
        }
    }

    // ===== 테블릿 더블 탭 처리 =====
    function handleTabletDoubleTap(e) {
        console.log('📱 테블릿 더블 탭');
        
        // 더블 탭된 요소에 따른 액션
        const target = e.detail.target;
        if (target.hasAttribute('data-double-tap-action')) {
            const action = target.getAttribute('data-double-tap-action');
            executeTabletAction(action, target);
        }
    }

    // ===== 테블릿 액션 실행 =====
    function executeTabletAction(action, target) {
        switch (action) {
            case 'zoom':
                target.classList.toggle('zoomed');
                break;
            case 'fullscreen':
                if (target.requestFullscreen) {
                    target.requestFullscreen();
                }
                break;
            case 'menu':
                toggleTabletMenu();
                break;
            default:
                console.log('알 수 없는 테블릿 액션:', action);
        }
    }

    // ===== 테블릿 메뉴 토글 =====
    function toggleTabletMenu() {
        const menu = document.querySelector('[data-tablet-side-menu]');
        const overlay = document.querySelector('[data-tablet-overlay]');
        
        if (menu && overlay) {
            menu.classList.toggle('show');
            overlay.classList.toggle('show');
            document.body.classList.toggle('menu-open');
        }
    }

    // ===== 페이지 네비게이션 =====
    function navigateToNextPage() {
        const currentRoute = window.MindGarden.Router.getCurrentRoute();
        const routes = ['home', 'consultation', 'clients', 'consultants', 'reports', 'settings'];
        const currentIndex = routes.indexOf(currentRoute);
        const nextIndex = (currentIndex + 1) % routes.length;
        
        window.MindGarden.Router.navigate(routes[nextIndex]);
    }

    function navigateToPreviousPage() {
        const currentRoute = window.MindGarden.Router.getCurrentRoute();
        const routes = ['home', 'consultation', 'clients', 'consultants', 'reports', 'settings'];
        const currentIndex = routes.indexOf(currentRoute);
        const prevIndex = currentIndex === 0 ? routes.length - 1 : currentIndex - 1;
        
        window.MindGarden.Router.navigate(routes[prevIndex]);
    }

    // ===== 홈페이지 이벤트 리스너 =====
    function initHomepageEventListeners() {
        // 스크롤 애니메이션
        window.addEventListener('scroll', window.MindGarden.Utils.event.throttle(() => {
            updateScrollAnimations();
        }, 16));
        
        // 카드 호버 효과
        document.querySelectorAll('.feature-card, .info-card').forEach(card => {
            card.addEventListener('mouseenter', handleCardHover);
            card.addEventListener('mouseleave', handleCardLeave);
        });
    }

    // ===== 스크롤 애니메이션 업데이트 =====
    function updateScrollAnimations() {
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        // 스크롤 기반 요소들 애니메이션
        document.querySelectorAll('[data-scroll-animation]').forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + scrollTop;
            const elementHeight = rect.height;
            
            if (scrollTop + windowHeight > elementTop && scrollTop < elementTop + elementHeight) {
                element.classList.add('animate-in');
            }
        });
    }

    // ===== 카드 호버 효과 =====
    function handleCardHover(e) {
        const card = e.currentTarget;
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    }

    function handleCardLeave(e) {
        const card = e.currentTarget;
        card.style.transform = '';
        card.style.boxShadow = '';
    }

    // ===== 페이지별 초기화 함수들 =====
    function initConsultationPage() {
        console.log('📋 상담 페이지 초기화');
        // 상담 페이지 전용 기능
    }

    function initClientsPage() {
        console.log('👥 고객 페이지 초기화');
        // 고객 페이지 전용 기능
    }

    function initConsultantsPage() {
        console.log('👨‍💼 상담사 페이지 초기화');
        // 상담사 페이지 전용 기능
    }

    function initReportsPage() {
        console.log('📊 리포트 페이지 초기화');
        // 리포트 페이지 전용 기능
    }

    function initSettingsPage() {
        console.log('⚙️ 설정 페이지 초기화');
        // 설정 페이지 전용 기능
    }

    // ===== AJAX 폼 처리 =====
    function handleAjaxForm(form) {
        const formData = window.MindGarden.Components.Form.getData(form);
        const url = form.action || form.getAttribute('data-action');
        const method = form.method.toUpperCase() || 'POST';
        
        if (!url) {
            console.error('폼에 action 또는 data-action이 설정되지 않았습니다.');
            return;
        }

        // 로딩 표시
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 처리 중...';
        }

        // AJAX 요청
        window.MindGarden.Ajax[method.toLowerCase()](url, formData)
            .then(response => {
                // 성공 처리
                if (response.data.success !== false) {
                    showSuccessMessage('처리가 완료되었습니다.');
                    
                    // 리다이렉트 처리
                    if (response.data.redirect) {
                        window.location.href = response.data.redirect;
                    } else if (form.hasAttribute('data-reset')) {
                        window.MindGarden.Components.Form.reset(form);
                    }
                } else {
                    showErrorMessage(response.data.message || '처리 중 오류가 발생했습니다.');
                }
            })
            .catch(error => {
                // 에러 처리
                showErrorMessage(error.message || '네트워크 오류가 발생했습니다.');
            })
            .finally(() => {
                // 버튼 상태 복원
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
    }

    // ===== AJAX 링크 처리 =====
    function handleAjaxLink(link) {
        const url = link.href || link.getAttribute('data-href');
        const method = link.getAttribute('data-method') || 'GET';
        const target = link.getAttribute('data-target');
        
        if (!url) {
            console.error('링크에 href 또는 data-href가 설정되지 않았습니다.');
            return;
        }

        // 로딩 표시
        if (target) {
            const targetElement = document.querySelector(target);
            if (targetElement) {
                targetElement.innerHTML = '<div class="loading">로딩 중...</div>';
            }
        }

        // AJAX 요청
        window.MindGarden.Ajax[method.toLowerCase()](url)
            .then(response => {
                // 성공 처리
                if (target) {
                    const targetElement = document.querySelector(target);
                    if (targetElement) {
                        targetElement.innerHTML = response.data;
                    }
                } else {
                    // 새 페이지로 이동
                    window.location.href = url;
                }
            })
            .catch(error => {
                // 에러 처리
                showErrorMessage(error.message || '요청 처리 중 오류가 발생했습니다.');
            });
    }

    // ===== 검증 오류 표시 =====
    function showValidationErrors(errors) {
        errors.forEach(error => {
            window.MindGarden.Components.Alert.show('error', error.message);
        });
    }

    // ===== 성공 메시지 표시 =====
    function showSuccessMessage(message) {
        window.MindGarden.Components.Alert.show('success', message);
    }

    // ===== 에러 메시지 표시 =====
    function showErrorMessage(message) {
        window.MindGarden.Components.Alert.show('error', message);
    }

    // ===== 전역 설정 =====
    function setupGlobalConfig() {
        // AJAX 기본 설정
        if (window.MindGarden.Ajax) {
            window.MindGarden.Ajax.setConfig({
                baseURL: '/api',
                timeout: 30000
            });
        }

        // 디바이스별 기능 초기화
        if (window.MindGarden.Utils?.deviceType?.isTablet()) {
            // 테블릿 전용 설정
            document.body.classList.add('tablet-mode');
        } else if (window.MindGarden.Utils?.deviceType?.isMobile()) {
            // 모바일 전용 설정
            document.body.classList.add('mobile-mode');
        } else {
            // 데스크톱 전용 설정
            document.body.classList.add('desktop-mode');
        }
    }

    // ===== 성능 최적화 =====
    function setupPerformanceOptimizations() {
        // 이미지 지연 로딩
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }

        // 스크롤 성능 최적화
        let ticking = false;
        function updateScroll() {
            // 스크롤 기반 애니메이션 업데이트
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateScroll);
                ticking = true;
            }
        }, { passive: true });
    }

    // ===== 접근성 개선 =====
    function setupAccessibility() {
        // 포커스 표시 개선
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', function() {
            document.body.classList.remove('keyboard-navigation');
        });

        // 스킵 링크
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView();
                }
            });
        });
    }

    // ===== 초기화 =====
    function init() {
        try {
            // 전역 설정
            setupGlobalConfig();
            
            // 전역 이벤트 리스너
            setupGlobalEventListeners();
            
            // 성능 최적화
            setupPerformanceOptimizations();
            
            // 접근성 개선
            setupAccessibility();
            
            // 라우터 준비 완료 후 초기화
            if (window.MindGarden.Router) {
                // 라우터 초기화 완료 이벤트 대기
                document.addEventListener('mindgarden:router:ready', () => {
                    // 현재 라우트에 따른 초기화
                    handleRouteChange();
                    
                    // 초기화 완료 이벤트 발생
                    document.dispatchEvent(new CustomEvent('mindgarden:ready'));
                });
            } else {
                // 라우터가 없는 경우 즉시 초기화 완료
                document.dispatchEvent(new CustomEvent('mindgarden:ready'));
            }
            
            console.log('✅ MindGarden 메인 모듈 초기화 완료');
            
        } catch (error) {
            console.error('MindGarden 초기화 중 오류 발생:', error);
        }
    }

    // ===== DOM 로드 완료 후 초기화 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM이 이미 로드된 경우 즉시 초기화
        setTimeout(init, 0);
    }

    // ===== 전역 MindGarden 객체에 메인 모듈 노출 =====
    window.MindGarden.Main = {
        init: init,
        setupGlobalConfig: setupGlobalConfig,
        setupPerformanceOptimizations: setupPerformanceOptimizations,
        setupAccessibility: setupAccessibility,
        handleRouteChange: handleRouteChange,
        initTabletFeatures: initTabletFeatures,
        initHomepageFeatures: initHomepageFeatures
    };

})();
