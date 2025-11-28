/**
 * MindGarden - 테블릿 전용 JavaScript
 * 테블릿 화면에 최적화된 기능 제공
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

    // ===== 테블릿 전용 설정 =====
    const TABLET_CONFIG = {
        touchThreshold: 44,        // 터치 최소 크기 (iOS 권장)
        swipeThreshold: 50,        // 스와이프 감지 임계값
        doubleTapDelay: 300,      // 더블 탭 감지 지연시간
        animationDuration: 300    // 애니메이션 지속시간
    };

    // ===== 테블릿 전용 기능들 =====
    
    /**
     * 터치 이벤트 최적화
     */
    function optimizeTouchEvents() {
        // 터치 친화적 요소 설정
        const touchElements = document.querySelectorAll('[data-touch-feedback]');
        touchElements.forEach(element => {
            element.style.minHeight = `${TABLET_CONFIG.touchThreshold}px`;
            element.style.minWidth = `${TABLET_CONFIG.touchThreshold}px`;
        });
        
        // 터치 피드백 효과
        document.addEventListener('touchstart', function(e) {
            const target = e.target.closest('[data-touch-feedback]');
            if (target) {
                target.classList.add('touch-active');
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            const target = e.target.closest('[data-touch-feedback]');
            if (target) {
                target.classList.remove('touch-active');
            }
        }, { passive: true });
    }
    
    /**
     * 스와이프 제스처 초기화
     */
    function initSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        
        document.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            const duration = endTime - startTime;
            
            // 빠른 스와이프만 감지 (300ms 이내)
            if (duration < 300) {
                // 수평 스와이프
                if (Math.abs(diffX) > TABLET_CONFIG.swipeThreshold && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 0) {
                        // 왼쪽 스와이프
                        document.dispatchEvent(new CustomEvent('tabletSwipeLeft', { detail: { diffX, diffY, duration } }));
                    } else {
                        // 오른쪽 스와이프
                        document.dispatchEvent(new CustomEvent('tabletSwipeRight', { detail: { diffX, diffY, duration } }));
                    }
                }
                
                // 수직 스와이프
                if (Math.abs(diffY) > TABLET_CONFIG.swipeThreshold && Math.abs(diffY) > Math.abs(diffX)) {
                    if (diffY > 0) {
                        // 위쪽 스와이프
                        document.dispatchEvent(new CustomEvent('tabletSwipeUp', { detail: { diffX, diffY, duration } }));
                    } else {
                        // 아래쪽 스와이프
                        document.dispatchEvent(new CustomEvent('tabletSwipeDown', { detail: { diffX, diffY, duration } }));
                    }
                }
            }
        }, { passive: true });
    }
    
    /**
     * 더블 탭 감지
     */
    function initDoubleTap() {
        let lastTap = 0;
        
        document.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < TABLET_CONFIG.doubleTapDelay && tapLength > 0) {
                // 더블 탭 감지
                const target = e.target.closest('[data-double-tap]');
                if (target) {
                    e.preventDefault();
                    document.dispatchEvent(new CustomEvent('tabletDoubleTap', { detail: { target } }));
                }
            }
            lastTap = currentTime;
        });
    }
    
    /**
     * 테블릿 네비게이션 최적화
     */
    function initTabletNavigation() {
        // 사이드 메뉴 토글
        const menuToggle = document.querySelector('[data-tablet-menu-toggle]');
        const sideMenu = document.querySelector('[data-tablet-side-menu]');
        const overlay = document.querySelector('[data-tablet-overlay]');
        
        if (menuToggle && sideMenu) {
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                sideMenu.classList.toggle('show');
                if (overlay) overlay.classList.toggle('show');
                document.body.classList.toggle('menu-open');
            });
            
            // 오버레이 클릭으로 메뉴 닫기
            if (overlay) {
                overlay.addEventListener('click', function() {
                    sideMenu.classList.remove('show');
                    overlay.classList.remove('show');
                    document.body.classList.remove('menu-open');
                });
            }
            
            // ESC 키로 메뉴 닫기
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && sideMenu.classList.contains('show')) {
                    sideMenu.classList.remove('show');
                    if (overlay) overlay.classList.remove('show');
                    document.body.classList.remove('menu-open');
                }
            });
        }
        
        // 스와이프로 메뉴 열기/닫기
        document.addEventListener('tabletSwipeRight', function() {
            if (sideMenu && !sideMenu.classList.contains('show')) {
                sideMenu.classList.add('show');
                if (overlay) overlay.classList.add('show');
                document.body.classList.add('menu-open');
            }
        });
        
        document.addEventListener('tabletSwipeLeft', function() {
            if (sideMenu && sideMenu.classList.contains('show')) {
                sideMenu.classList.remove('show');
                if (overlay) overlay.classList.remove('show');
                document.body.classList.remove('menu-open');
            }
        });
    }
    
    /**
     * 카드 레이아웃 최적화
     */
    function optimizeCardLayout() {
        const cards = document.querySelectorAll('.tablet-card');
        
        cards.forEach(card => {
            // 카드 터치 이벤트
            card.setAttribute('data-touch-feedback', 'true');
            
            // 카드 클릭 이벤트
            card.addEventListener('click', function() {
                if (this.hasAttribute('data-card-action')) {
                    const action = this.getAttribute('data-card-action');
                    const target = this.getAttribute('data-card-target');
                    
                    if (action === 'navigate' && target) {
                        window.location.href = target;
                    } else if (action === 'modal' && target) {
                        // 모달 열기 로직
                        console.log('카드 모달 열기:', target);
                    }
                }
            });
        });
    }
    
    /**
     * 폼 최적화
     */
    function optimizeForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // 폼 입력 필드 터치 최적화
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.style.minHeight = `${TABLET_CONFIG.touchThreshold}px`;
                input.setAttribute('data-touch-feedback', 'true');
            });
            
            // 폼 제출 시 로딩 표시
            form.addEventListener('submit', function(e) {
                if (this.hasAttribute('data-tablet-submit')) {
                    const submitBtn = this.querySelector('[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 처리 중...';
                    }
                }
            });
        });
    }
    
    /**
     * 테이블 최적화
     */
    function optimizeTables() {
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            // 테이블 행 터치 최적화
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                row.style.minHeight = `${TABLET_CONFIG.touchThreshold}px`;
                row.setAttribute('data-touch-feedback', 'true');
                
                // 행 클릭 이벤트
                row.addEventListener('click', function() {
                    if (this.hasAttribute('data-row-action')) {
                        const action = this.getAttribute('data-row-action');
                        const target = this.getAttribute('data-row-target');
                        
                        if (action === 'select') {
                            // 행 선택
                            table.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
                            this.classList.add('selected');
                        } else if (action === 'navigate' && target) {
                            window.location.href = target;
                        }
                    }
                });
            });
        });
    }
    
    /**
     * 모달 최적화
     */
    function optimizeModals() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            // 모달 닫기 버튼 터치 최적화
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.style.minHeight = `${TABLET_CONFIG.touchThreshold}px`;
                closeBtn.style.minWidth = `${TABLET_CONFIG.touchThreshold}px`;
            }
            
            // 모달 외부 클릭으로 닫기
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('show');
                }
            });
        });
    }
    
    /**
     * 알림 최적화
     */
    function optimizeNotifications() {
        const notifications = document.querySelectorAll('.alert, .notification');
        
        notifications.forEach(notification => {
            // 알림 닫기 버튼 터치 최적화
            const closeBtn = notification.querySelector('.alert-close, .notification-close');
            if (closeBtn) {
                closeBtn.style.minHeight = `${TABLET_CONFIG.touchThreshold}px`;
                closeBtn.style.minWidth = `${TABLET_CONFIG.touchThreshold}px`;
            }
            
            // 자동 제거 (5초 후)
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 5000);
        });
    }
    
    /**
     * 성능 최적화
     */
    function optimizePerformance() {
        // 스크롤 성능 최적화
        let ticking = false;
        
        function updateScroll() {
            const scrollTop = window.pageYOffset;
            document.body.style.setProperty('--scroll-top', scrollTop + 'px');
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateScroll);
                ticking = true;
            }
        }, { passive: true });
        
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
    }
    
    /**
     * 방향 전환 감지
     */
    function handleOrientationChange() {
        const orientation = window.orientation;
        document.body.setAttribute('data-orientation', orientation === 0 || orientation === 180 ? 'portrait' : 'landscape');
        
        // 방향별 레이아웃 조정
        if (orientation === 0 || orientation === 180) {
            // 세로 모드
            document.body.classList.add('portrait-mode');
            document.body.classList.remove('landscape-mode');
        } else {
            // 가로 모드
            document.body.classList.add('landscape-mode');
            document.body.classList.remove('portrait-mode');
        }
    }
    
    /**
     * 리사이즈 처리
     */
    function handleResize() {
        // 디바이스 타입 재확인
        if (window.MindGarden?.Utils) {
            window.MindGarden.Utils.applyDeviceClass();
        }
        
        // 테블릿이 아닌 경우 기능 비활성화
        if (!window.MindGarden?.Utils?.deviceType?.isTablet()) {
            return;
        }
        
        // 레이아웃 재조정
        const container = document.querySelector('.tablet-container');
        if (container) {
            const width = window.innerWidth;
            if (width < 900) {
                container.classList.add('compact');
            } else {
                container.classList.remove('compact');
            }
        }
    }
    
    /**
     * 테블릿 전용 이벤트 리스너
     */
    function initTabletEventListeners() {
        // 스와이프 이벤트 처리
        document.addEventListener('tabletSwipeLeft', function(e) {
            console.log('왼쪽 스와이프:', e.detail);
        });
        
        document.addEventListener('tabletSwipeRight', function(e) {
            console.log('오른쪽 스와이프:', e.detail);
        });
        
        document.addEventListener('tabletSwipeUp', function(e) {
            console.log('위쪽 스와이프:', e.detail);
        });
        
        document.addEventListener('tabletSwipeDown', function(e) {
            console.log('아래쪽 스와이프:', e.detail);
        });
        
        // 더블 탭 이벤트 처리
        document.addEventListener('tabletDoubleTap', function(e) {
            console.log('더블 탭:', e.detail);
        });
    }
    
    /**
     * 초기화 함수
     */
    function init() {
        // 테블릿이 아닌 경우 초기화 중단
        if (!window.MindGarden?.Utils?.deviceType?.isTablet()) {
            return;
        }
        
        console.log('🚀 MindGarden 테블릿 모드 활성화');
        
        // 테블릿 전용 기능 초기화
        optimizeTouchEvents();
        initSwipeGestures();
        initDoubleTap();
        initTabletNavigation();
        optimizeCardLayout();
        optimizeForms();
        optimizeTables();
        optimizeModals();
        optimizeNotifications();
        optimizePerformance();
        initTabletEventListeners();
        
        // 방향 전환 및 리사이즈 이벤트
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', window.MindGarden.Utils.event.debounce(handleResize, 250));
        
        // 초기 방향 설정
        handleOrientationChange();
        handleResize();
        
        console.log('✅ MindGarden 테블릿 기능 초기화 완료');
    }
    
    // ===== 초기화 실행 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ===== 전역 MindGarden 객체에 테블릿 기능 노출 =====
    window.MindGarden = window.MindGarden || {};
    window.MindGarden.Tablet = {
        config: TABLET_CONFIG,
        init: init,
        optimizeTouchEvents,
        initSwipeGestures,
        initDoubleTap,
        initTabletNavigation,
        optimizeCardLayout,
        optimizeForms,
        optimizeTables,
        optimizeModals,
        optimizeNotifications,
        optimizePerformance
    };
    
})();
