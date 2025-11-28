/**
 * MindGarden - 공통 라우터 모듈
 * 디바이스 감지 기반으로 홈페이지/테블릿 경로를 자동 설정
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

(function() {
    'use strict';

    // ===== 전역 MindGarden 객체 확인 =====
    if (!window.MindGarden) {
        console.error('MindGarden.Utils가 로드되지 않았습니다.');
        return;
    }

    // ===== 라우터 네임스페이스 =====
    window.MindGarden.Router = {
        
        // ===== 라우팅 설정 =====
        config: {
            routes: {
                mobile: {
                    home: '/',
                    consultation: '/consultation',
                    clients: '/clients',
                    consultants: '/consultants',
                    reports: '/reports',
                    settings: '/settings'
                },
                tablet: {
                    home: '/tablet/',
                    consultation: '/tablet/consultation',
                    clients: '/tablet/clients',
                    consultants: '/tablet/consultants',
                    reports: '/tablet/reports',
                    settings: '/tablet/settings'
                },
                desktop: {
                    home: '/',
                    consultation: '/consultation',
                    clients: '/clients',
                    consultants: '/consultants',
                    reports: '/reports',
                    settings: '/settings'
                }
            },
            defaultRoute: 'home',
            redirectDelay: 100
        },

        // ===== 현재 디바이스 타입 =====
        currentDevice: null,

        // ===== 디바이스별 경로 매핑 =====
        getDeviceRoutes: function() {
            const deviceType = window.MindGarden.Utils.deviceType;
            
            if (deviceType.isTablet()) {
                return this.config.routes.tablet;
            } else if (deviceType.isMobile()) {
                return this.config.routes.mobile;
            } else {
                return this.config.routes.desktop;
            }
        },

        // ===== 경로 가져오기 =====
        getPath: function(routeName) {
            const routes = this.getDeviceRoutes();
            return routes[routeName] || routes[this.config.defaultRoute];
        },

        // ===== 현재 경로가 올바른 디바이스용인지 확인 =====
        isCorrectDevicePath: function() {
            const currentPath = window.location.pathname;
            const deviceType = window.MindGarden.Utils.deviceType;
            const routes = this.getDeviceRoutes();
            
            // 테블릿인 경우 /tablet/ 경로인지 확인
            if (deviceType.isTablet()) {
                return currentPath.startsWith('/tablet/') || currentPath === '/tablet';
            }
            
            // 모바일/데스크톱인 경우 /tablet/ 경로가 아닌지 확인
            return !currentPath.startsWith('/tablet/');
        },

        // ===== 디바이스에 맞는 경로로 리다이렉트 =====
        redirectToDevicePath: function(routeName = null) {
            const targetRoute = routeName || this.getCurrentRoute();
            const targetPath = this.getPath(targetRoute);
            
            if (targetPath !== window.location.pathname) {
                console.log(`🔄 디바이스에 맞는 경로로 리다이렉트: ${targetPath}`);
                
                // 지연 후 리다이렉트 (사용자 경험 개선)
                setTimeout(() => {
                    window.location.href = targetPath;
                }, this.config.redirectDelay);
                
                return true;
            }
            
            return false;
        },

        // ===== 현재 경로에서 라우트 이름 추출 =====
        getCurrentRoute: function() {
            const currentPath = window.location.pathname;
            
            // 테블릿 경로인 경우
            if (currentPath.startsWith('/tablet/')) {
                const route = currentPath.replace('/tablet/', '');
                return route || 'home';
            }
            
            // 일반 경로인 경우
            const route = currentPath.substring(1);
            return route || 'home';
        },

        // ===== 디바이스 변경 감지 및 자동 리다이렉트 =====
        handleDeviceChange: function() {
            const previousDevice = this.currentDevice;
            const currentDevice = this.getCurrentDeviceType();
            
            if (previousDevice && previousDevice !== currentDevice) {
                console.log(`📱 디바이스 변경 감지: ${previousDevice} → ${currentDevice}`);
                
                // 디바이스 변경 시 홈 경로로 리다이렉트
                this.redirectToDevicePath('home');
            }
            
            this.currentDevice = currentDevice;
        },

        // ===== 현재 디바이스 타입 문자열 반환 =====
        getCurrentDeviceType: function() {
            const deviceType = window.MindGarden.Utils.deviceType;
            
            if (deviceType.isTablet()) return 'tablet';
            if (deviceType.isMobile()) return 'mobile';
            return 'desktop';
        },

        // ===== 초기 라우팅 설정 =====
        initRouting: function() {
            // 현재 디바이스 설정
            this.currentDevice = this.getCurrentDeviceType();
            
            // 올바른 디바이스 경로인지 확인
            if (!this.isCorrectDevicePath()) {
                console.log('⚠️ 현재 경로가 디바이스에 맞지 않습니다. 리다이렉트를 시작합니다.');
                this.redirectToDevicePath();
                return;
            }
            
            // 디바이스별 클래스 및 설정 적용
            this.applyDeviceSettings();
            
            console.log(`✅ 라우팅 초기화 완료 (${this.currentDevice})`);
        },

        // ===== 디바이스별 설정 적용 =====
        applyDeviceSettings: function() {
            const deviceType = this.currentDevice;
            const body = document.body;
            
            // 기존 디바이스 클래스 제거
            body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
            
            // 새 디바이스 클래스 추가
            body.classList.add(`device-${deviceType}`);
            
            // 디바이스별 메타 태그 설정
            this.setDeviceMetaTags(deviceType);
            
            // 디바이스별 이벤트 리스너 설정
            this.setupDeviceEventListeners(deviceType);
        },

        // ===== 디바이스별 메타 태그 설정 =====
        setDeviceMetaTags: function(deviceType) {
            let viewport = document.querySelector('meta[name="viewport"]');
            
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
            }
            
            switch (deviceType) {
                case 'tablet':
                    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                    break;
                case 'mobile':
                    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
                    break;
                default:
                    viewport.content = 'width=device-width, initial-scale=1.0';
            }
        },

        // ===== 디바이스별 이벤트 리스너 설정 =====
        setupDeviceEventListeners: function(deviceType) {
            // 리사이즈 이벤트 처리
            const resizeHandler = window.MindGarden.Utils.event.debounce(() => {
                this.handleDeviceChange();
            }, 250);
            
            window.addEventListener('resize', resizeHandler);
            
            // 방향 변경 이벤트 처리 (모바일/테블릿)
            if (deviceType === 'mobile' || deviceType === 'tablet') {
                window.addEventListener('orientationchange', () => {
                    setTimeout(() => {
                        this.handleDeviceChange();
                    }, 100);
                });
            }
        },

        // ===== 프로그래매틱 네비게이션 =====
        navigate: function(routeName, options = {}) {
            const defaultOptions = {
                replace: false,
                force: false
            };
            
            const config = { ...defaultOptions, ...options };
            const targetPath = this.getPath(routeName);
            
            if (!targetPath) {
                console.error(`알 수 없는 라우트: ${routeName}`);
                return false;
            }
            
            // 강제 이동이 아닌 경우 디바이스 경로 확인
            if (!config.force && !this.isCorrectDevicePath()) {
                this.redirectToDevicePath(routeName);
                return true;
            }
            
            // 네비게이션 실행
            if (config.replace) {
                window.history.replaceState(null, '', targetPath);
            } else {
                window.history.pushState(null, '', targetPath);
            }
            
            // 페이지 변경 이벤트 발생
            window.dispatchEvent(new PopStateEvent('popstate'));
            
            return true;
        },

        // ===== 브라우저 뒤로가기/앞으로가기 처리 =====
        handlePopState: function() {
            const currentPath = window.location.pathname;
            
            // 현재 경로가 디바이스에 맞는지 확인
            if (!this.isCorrectDevicePath()) {
                // 디바이스에 맞는 경로로 리다이렉트
                this.redirectToDevicePath();
            }
        },

        // ===== 라우트 변경 이벤트 리스너 =====
        onRouteChange: function(callback) {
            window.addEventListener('popstate', callback);
            window.addEventListener('mindgarden:routechange', callback);
        },

        // ===== 라우트 변경 이벤트 발생 =====
        emitRouteChange: function(routeName) {
            const event = new CustomEvent('mindgarden:routechange', {
                detail: {
                    route: routeName,
                    path: this.getPath(routeName),
                    device: this.currentDevice
                }
            });
            window.dispatchEvent(event);
        }
    };

    // ===== 초기화 =====
    function init() {
        // 라우터 초기화
        window.MindGarden.Router.initRouting();
        
        // 브라우저 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', () => {
            window.MindGarden.Router.handlePopState();
        });
        
        // 라우터 준비 완료 이벤트 발생
        document.dispatchEvent(new CustomEvent('mindgarden:router:ready'));
        
        console.log('✅ MindGarden Router 초기화 완료');
    }

    // ===== DOM 로드 완료 후 초기화 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
