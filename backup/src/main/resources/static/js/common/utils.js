/**
 * MindGarden - 공통 JavaScript 유틸리티
 * 모든 페이지에서 공통으로 사용되는 유틸리티 함수들
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

(function() {
    'use strict';

    // ===== 전역 MindGarden 객체 생성 =====
    window.MindGarden = window.MindGarden || {};

    // ===== 유틸리티 네임스페이스 =====
    window.MindGarden.Utils = {
        
        // ===== 디바이스 감지 =====
        deviceType: {
            isMobile: function() {
                return window.innerWidth < 768;
            },
            isTablet: function() {
                return window.innerWidth >= 768 && window.innerWidth <= 1024;
            },
            isDesktop: function() {
                return window.innerWidth > 1024;
            },
            isTouch: function() {
                return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            }
        },

        // ===== 로컬 스토리지 =====
        storage: {
            set: function(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('로컬 스토리지 저장 실패:', e);
                    return false;
                }
            },
            get: function(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (e) {
                    console.error('로컬 스토리지 읽기 실패:', e);
                    return defaultValue;
                }
            },
            remove: function(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (e) {
                    console.error('로컬 스토리지 삭제 실패:', e);
                    return false;
                }
            },
            clear: function() {
                try {
                    localStorage.clear();
                    return true;
                } catch (e) {
                    console.error('로컬 스토리지 초기화 실패:', e);
                    return false;
                }
            }
        },

        // ===== 쿠키 관리 =====
        cookie: {
            set: function(name, value, days = 7) {
                const expires = new Date();
                expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
                document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
            },
            get: function(name) {
                const nameEQ = name + "=";
                const ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            },
            remove: function(name) {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            }
        },

        // ===== 날짜/시간 =====
        date: {
            format: function(date, format = 'YYYY-MM-DD') {
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');

                return format
                    .replace('YYYY', year)
                    .replace('MM', month)
                    .replace('DD', day)
                    .replace('HH', hours)
                    .replace('mm', minutes)
                    .replace('ss', seconds);
            },
            fromNow: function(date) {
                const now = new Date();
                const diff = now - new Date(date);
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (days > 0) return `${days}일 전`;
                if (hours > 0) return `${hours}시간 전`;
                if (minutes > 0) return `${minutes}분 전`;
                return '방금 전';
            },
            isValid: function(date) {
                return date instanceof Date && !isNaN(date);
            }
        },

        // ===== 문자열 =====
        string: {
            truncate: function(str, length = 100, suffix = '...') {
                if (str.length <= length) return str;
                return str.substring(0, length) + suffix;
            },
            capitalize: function(str) {
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            },
            slugify: function(str) {
                return str.toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/[\s_-]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            },
            escapeHtml: function(str) {
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            }
        },

        // ===== 숫자 =====
        number: {
            format: function(num, decimals = 0) {
                return Number(num).toLocaleString('ko-KR', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                });
            },
            formatCurrency: function(num, currency = 'KRW') {
                return new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: currency
                }).format(num);
            },
            random: function(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        },

        // ===== 배열 =====
        array: {
            shuffle: function(array) {
                const shuffled = [...array];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled;
            },
            unique: function(array) {
                return [...new Set(array)];
            },
            groupBy: function(array, key) {
                return array.reduce((groups, item) => {
                    const group = item[key];
                    groups[group] = groups[group] || [];
                    groups[group].push(item);
                    return groups;
                }, {});
            }
        },

        // ===== DOM =====
        dom: {
            ready: function(callback) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', callback);
                } else {
                    callback();
                }
            },
            createElement: function(tag, attributes = {}, textContent = '') {
                const element = document.createElement(tag);
                Object.keys(attributes).forEach(key => {
                    element.setAttribute(key, attributes[key]);
                });
                if (textContent) element.textContent = textContent;
                return element;
            },
            addEvent: function(element, event, handler, options = {}) {
                if (typeof element === 'string') {
                    element = document.querySelector(element);
                }
                if (element) {
                    element.addEventListener(event, handler, options);
                }
            },
            removeEvent: function(element, event, handler) {
                if (typeof element === 'string') {
                    element = document.querySelector(element);
                }
                if (element) {
                    element.removeEventListener(event, handler);
                }
            }
        },

        // ===== 이벤트 =====
        event: {
            throttle: function(func, limit) {
                let inThrottle;
                return function() {
                    const args = arguments;
                    const context = this;
                    if (!inThrottle) {
                        func.apply(context, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            },
            debounce: function(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }
        },

        /**
         * 디바이스 클래스를 body에 적용
         */
        applyDeviceClass: function() {
            const body = document.body;
            
            // 기존 디바이스 클래스 제거
            body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
            
            // 현재 디바이스에 맞는 클래스 추가
            if (this.deviceType.isMobile()) {
                body.classList.add('device-mobile');
            } else if (this.deviceType.isTablet()) {
                body.classList.add('device-tablet');
            } else {
                body.classList.add('device-desktop');
            }
            
            // 방향 클래스도 적용
            this.applyOrientationClass();
        },
        
        /**
         * 방향 클래스를 body에 적용
         */
        applyOrientationClass: function() {
            const body = document.body;
            
            // 기존 방향 클래스 제거
            body.classList.remove('portrait-mode', 'landscape-mode');
            
            // 현재 방향에 맞는 클래스 추가
            if (window.orientation !== undefined) {
                if (window.orientation === 0 || window.orientation === 180) {
                    body.classList.add('portrait-mode');
                } else {
                    body.classList.add('landscape-mode');
                }
            }
        }
    };

    // ===== 디바이스 클래스 적용 =====
    function applyDeviceClass() {
        const body = document.body;
        const deviceType = window.MindGarden.Utils.deviceType;
        
        // 기존 클래스 제거
        body.classList.remove('mobile', 'tablet', 'desktop', 'touch', 'no-touch');
        
        // 새 클래스 추가
        if (deviceType.isMobile()) body.classList.add('mobile');
        if (deviceType.isTablet()) body.classList.add('tablet');
        if (deviceType.isDesktop()) body.classList.add('desktop');
        if (deviceType.isTouch()) body.classList.add('touch');
        else body.classList.add('no-touch');
    }

    // ===== 초기화 =====
    function init() {
        // 디바이스 클래스 적용
        applyDeviceClass();
        
        // 리사이즈 이벤트 처리
        window.addEventListener('resize', window.MindGarden.Utils.event.debounce(applyDeviceClass, 250));
        
        console.log('✅ MindGarden Utils 초기화 완료');
    }

    // ===== DOM 로드 완료 후 초기화 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

