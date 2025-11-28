/**
 * MindGarden - 공통 AJAX 통신 모듈
 * 모든 페이지에서 공통으로 사용되는 AJAX 통신 기능
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

    // ===== AJAX 네임스페이스 =====
    window.MindGarden.Ajax = {
        
        // ===== 기본 설정 =====
        config: {
            baseURL: '',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        },

        // ===== 요청 인터셉터 =====
        requestInterceptors: [],
        
        // ===== 응답 인터셉터 =====
        responseInterceptors: [],

        // ===== 인터셉터 추가 =====
        addRequestInterceptor: function(interceptor) {
            this.requestInterceptors.push(interceptor);
        },

        addResponseInterceptor: function(interceptor) {
            this.responseInterceptors.push(interceptor);
        },

        // ===== 기본 HTTP 메서드 =====
        get: function(url, params = {}, options = {}) {
            return this.request('GET', url, null, params, options);
        },

        post: function(url, data = null, options = {}) {
            return this.request('POST', url, data, null, options);
        },

        put: function(url, data = null, options = {}) {
            return this.request('PUT', url, data, null, options);
        },

        patch: function(url, data = null, options = {}) {
            return this.request('PATCH', url, data, null, options);
        },

        delete: function(url, options = {}) {
            return this.request('DELETE', url, null, null, options);
        },

        // ===== 파일 업로드 =====
        upload: function(url, formData, options = {}) {
            const uploadOptions = {
                ...options,
                headers: {
                    ...this.config.headers,
                    ...options.headers
                }
            };
            
            // Content-Type 제거 (브라우저가 자동 설정)
            delete uploadOptions.headers['Content-Type'];
            
            return this.request('POST', url, formData, null, uploadOptions);
        },

        // ===== 핵심 요청 함수 =====
        request: function(method, url, data = null, params = null, options = {}) {
            return new Promise((resolve, reject) => {
                // 설정 병합
                const config = {
                    ...this.config,
                    ...options
                };

                // URL 구성
                let fullURL = url;
                if (config.baseURL && !url.startsWith('http')) {
                    fullURL = config.baseURL + url;
                }

                // 쿼리 파라미터 추가
                if (params && Object.keys(params).length > 0) {
                    const queryString = new URLSearchParams(params).toString();
                    fullURL += (fullURL.includes('?') ? '&' : '?') + queryString;
                }

                // XMLHttpRequest 생성
                const xhr = new XMLHttpRequest();
                
                // 타임아웃 설정
                xhr.timeout = config.timeout;

                // 응답 타입 설정
                xhr.responseType = options.responseType || 'json';

                // 요청 인터셉터 실행
                let requestData = data;
                let requestHeaders = { ...config.headers };
                
                this.requestInterceptors.forEach(interceptor => {
                    const result = interceptor(method, fullURL, requestData, requestHeaders);
                    if (result && typeof result === 'object') {
                        if (result.data !== undefined) requestData = result.data;
                        if (result.headers !== undefined) requestHeaders = result.headers;
                    }
                });

                // 이벤트 핸들러 설정
                xhr.onload = () => {
                    try {
                        let response = xhr.response;
                        
                        // JSON 파싱 시도
                        if (xhr.responseType === '' || xhr.responseType === 'text') {
                            try {
                                response = JSON.parse(xhr.responseText);
                            } catch (e) {
                                response = xhr.responseText;
                            }
                        }

                        // 응답 인터셉터 실행
                        let finalResponse = response;
                        let finalHeaders = this.parseResponseHeaders(xhr.getAllResponseHeaders());
                        
                        this.responseInterceptors.forEach(interceptor => {
                            const result = interceptor(xhr.status, finalResponse, finalHeaders);
                            if (result !== undefined) {
                                finalResponse = result;
                            }
                        });

                        // 성공 응답
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({
                                data: finalResponse,
                                status: xhr.status,
                                statusText: xhr.statusText,
                                headers: finalHeaders,
                                xhr: xhr
                            });
                        } else {
                            // HTTP 에러
                            reject({
                                data: finalResponse,
                                status: xhr.status,
                                statusText: xhr.statusText,
                                headers: finalHeaders,
                                xhr: xhr,
                                message: `HTTP ${xhr.status}: ${xhr.statusText}`
                            });
                        }
                    } catch (error) {
                        reject({
                            error: error,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            xhr: xhr,
                            message: '응답 파싱 오류'
                        });
                    }
                };

                xhr.onerror = () => {
                    reject({
                        error: new Error('네트워크 오류'),
                        status: xhr.status,
                        statusText: xhr.statusText,
                        xhr: xhr,
                        message: '네트워크 연결 오류'
                    });
                };

                xhr.ontimeout = () => {
                    reject({
                        error: new Error('요청 시간 초과'),
                        status: xhr.status,
                        statusText: xhr.statusText,
                        xhr: xhr,
                        message: '요청 시간이 초과되었습니다'
                    });
                };

                // 요청 열기
                xhr.open(method, fullURL, true);

                // 헤더 설정
                Object.keys(requestHeaders).forEach(key => {
                    xhr.setRequestHeader(key, requestHeaders[key]);
                });

                // 데이터 전송
                if (requestData instanceof FormData) {
                    xhr.send(requestData);
                } else if (requestData && typeof requestData === 'object') {
                    xhr.send(JSON.stringify(requestData));
                } else {
                    xhr.send(requestData);
                }
            });
        },

        // ===== 응답 헤더 파싱 =====
        parseResponseHeaders: function(headerString) {
            const headers = {};
            if (!headerString) return headers;
            
            const headerPairs = headerString.split('\u000d\u000a');
            for (let i = 0; i < headerPairs.length; i++) {
                const headerPair = headerPairs[i];
                const index = headerPair.indexOf('\u003a\u0020');
                if (index > 0) {
                    const key = headerPair.substring(0, index);
                    const value = headerPair.substring(index + 2);
                    headers[key] = value;
                }
            }
            return headers;
        },

        // ===== 에러 처리 =====
        handleError: function(error, options = {}) {
            const defaultOptions = {
                showAlert: true,
                logError: true,
                fallback: null
            };
            
            const config = { ...defaultOptions, ...options };
            
            // 에러 로깅
            if (config.logError) {
                console.error('AJAX 오류:', error);
            }
            
            // 사용자 알림
            if (config.showAlert && window.MindGarden?.Components?.Alert) {
                const message = error.message || '요청 처리 중 오류가 발생했습니다.';
                window.MindGarden.Components.Alert.show('error', message);
            }
            
            // 폴백 처리
            if (config.fallback && typeof config.fallback === 'function') {
                config.fallback(error);
            }
            
            return error;
        },

        // ===== 설정 업데이트 =====
        setConfig: function(newConfig) {
            this.config = { ...this.config, ...newConfig };
        },

        // ===== 기본 인터셉터 설정 =====
        setupDefaultInterceptors: function() {
            // 인증 토큰 자동 추가
            this.addRequestInterceptor((method, url, data, headers) => {
                const token = window.MindGarden?.Utils?.storage?.get('authToken');
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                return { data, headers };
            });

            // 응답 에러 처리
            this.addResponseInterceptor((status, response, headers) => {
                if (status === 401) {
                    // 인증 만료 시 토큰 제거
                    window.MindGarden?.Utils?.storage?.remove('authToken');
                    
                    // 로그인 페이지로 리다이렉트
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return response;
            });
        }
    };

    // ===== 초기화 =====
    function init() {
        // 기본 인터셉터 설정
        window.MindGarden.Ajax.setupDefaultInterceptors();
        
        console.log('✅ MindGarden Ajax 초기화 완료');
    }

    // ===== DOM 로드 완료 후 초기화 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
