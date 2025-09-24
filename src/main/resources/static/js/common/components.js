/**
 * MindGarden - 공통 UI 컴포넌트 관리 모듈
 * 모든 페이지에서 공통으로 사용되는 UI 컴포넌트들
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

    // ===== 컴포넌트 네임스페이스 =====
    window.MindGarden.Components = {
        
        // ===== 컴포넌트 레지스트리 =====
        registry: new Map(),

        // ===== 컴포넌트 등록 =====
        register: function(name, component) {
            this.registry.set(name, component);
            console.log(`✅ 컴포넌트 등록: ${name}`);
        },

        // ===== 컴포넌트 실행 =====
        execute: function(name, ...args) {
            const component = this.registry.get(name);
            if (component && typeof component === 'function') {
                return component(...args);
            } else {
                console.warn(`⚠️ 컴포넌트를 찾을 수 없습니다: ${name}`);
                return null;
            }
        },

        // ===== Alert 컴포넌트 =====
        Alert: {
            show: function(type, message, options = {}) {
                const defaultOptions = {
                    duration: 5000,
                    closable: true,
                    position: 'top-right'
                };
                
                const config = { ...defaultOptions, ...options };
                
                // 기존 알림 제거
                this.removeAll();
                
                // 알림 요소 생성
                const alertElement = document.createElement('div');
                alertElement.className = `alert alert-${type} alert-${config.position}`;
                alertElement.innerHTML = `
                    <div class="alert-content">
                        <span class="alert-message">${message}</span>
                        ${config.closable ? '<button class="alert-close" aria-label="닫기">&times;</button>' : ''}
                    </div>
                `;
                
                // 스타일 적용
                Object.assign(alertElement.style, {
                    position: 'fixed',
                    zIndex: '9999',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    maxWidth: '400px',
                    wordWrap: 'break-word',
                    animation: 'slideIn 0.3s ease-out'
                });
                
                // 위치 설정
                this.setPosition(alertElement, config.position);
                
                // 닫기 버튼 이벤트
                if (config.closable) {
                    const closeBtn = alertElement.querySelector('.alert-close');
                    closeBtn.addEventListener('click', () => this.remove(alertElement));
                }
                
                // 문서에 추가
                document.body.appendChild(alertElement);
                
                // 자동 제거
                if (config.duration > 0) {
                    setTimeout(() => this.remove(alertElement), config.duration);
                }
                
                return alertElement;
            },
            
            remove: function(alertElement) {
                if (alertElement && alertElement.parentNode) {
                    alertElement.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => {
                        if (alertElement.parentNode) {
                            alertElement.parentNode.removeChild(alertElement);
                        }
                    }, 300);
                }
            },
            
            removeAll: function() {
                const alerts = document.querySelectorAll('.alert');
                alerts.forEach(alert => this.remove(alert));
            },
            
            setPosition: function(element, position) {
                const margin = 20;
                
                switch (position) {
                    case 'top-left':
                        element.style.top = margin + 'px';
                        element.style.left = margin + 'px';
                        break;
                    case 'top-right':
                        element.style.top = margin + 'px';
                        element.style.right = margin + 'px';
                        break;
                    case 'bottom-left':
                        element.style.bottom = margin + 'px';
                        element.style.left = margin + 'px';
                        break;
                    case 'bottom-right':
                        element.style.bottom = margin + 'px';
                        element.style.right = margin + 'px';
                        break;
                    case 'top-center':
                        element.style.top = margin + 'px';
                        element.style.left = '50%';
                        element.style.transform = 'translateX(-50%)';
                        break;
                    case 'bottom-center':
                        element.style.bottom = margin + 'px';
                        element.style.left = '50%';
                        element.style.transform = 'translateX(-50%)';
                        break;
                    default:
                        element.style.top = margin + 'px';
                        element.style.right = margin + 'px';
                }
            }
        },

        // ===== Modal 컴포넌트 =====
        Modal: {
            show: function(content, options = {}) {
                const defaultOptions = {
                    title: '',
                    closable: true,
                    size: 'medium', // small, medium, large
                    onClose: null
                };
                
                const config = { ...defaultOptions, ...options };
                
                // 기존 모달 제거
                this.removeAll();
                
                // 모달 요소 생성
                const modalElement = document.createElement('div');
                modalElement.className = 'modal modal-show';
                modalElement.innerHTML = `
                    <div class="modal-backdrop"></div>
                    <div class="modal-dialog modal-${config.size}">
                        <div class="modal-content">
                            ${config.title ? `<div class="modal-header">
                                <h5 class="modal-title">${config.title}</h5>
                                ${config.closable ? '<button class="modal-close" aria-label="닫기">&times;</button>' : ''}
                            </div>` : ''}
                            <div class="modal-body">
                                ${typeof content === 'string' ? content : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                // HTML 요소인 경우 body에 추가
                if (content instanceof HTMLElement) {
                    const modalBody = modalElement.querySelector('.modal-body');
                    modalBody.innerHTML = '';
                    modalBody.appendChild(content);
                }
                
                // 스타일 적용
                Object.assign(modalElement.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    zIndex: '10000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                });
                
                // 배경 클릭으로 닫기
                if (config.closable) {
                    const backdrop = modalElement.querySelector('.modal-backdrop');
                    backdrop.addEventListener('click', () => this.close(modalElement, config.onClose));
                    
                    const closeBtn = modalElement.querySelector('.modal-close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => this.close(modalElement, config.onClose));
                    }
                }
                
                // ESC 키로 닫기
                if (config.closable) {
                    const escHandler = (e) => {
                        if (e.key === 'Escape') {
                            this.close(modalElement, config.onClose);
                            document.removeEventListener('keydown', escHandler);
                        }
                    };
                    document.addEventListener('keydown', escHandler);
                }
                
                // 문서에 추가
                document.body.appendChild(modalElement);
                
                // 애니메이션 적용
                requestAnimationFrame(() => {
                    modalElement.classList.add('modal-active');
                });
                
                return modalElement;
            },
            
            close: function(modalElement, onClose) {
                if (modalElement && modalElement.parentNode) {
                    modalElement.classList.remove('modal-active');
                    modalElement.classList.add('modal-hiding');
                    
                    setTimeout(() => {
                        if (modalElement.parentNode) {
                            modalElement.parentNode.removeChild(modalElement);
                        }
                        
                        if (typeof onClose === 'function') {
                            onClose();
                        }
                    }, 300);
                }
            },
            
            removeAll: function() {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => this.close(modal));
            }
        },

        // ===== Loading 컴포넌트 =====
        // 중복된 로딩 시스템 제거됨 - React LoadingSpinner 컴포넌트 사용

        // ===== Form 컴포넌트 =====
        Form: {
            validate: function(formElement) {
                const inputs = formElement.querySelectorAll('input, textarea, select');
                const errors = [];
                
                inputs.forEach(input => {
                    // 필수 입력 검증
                    if (input.hasAttribute('required') && !input.value.trim()) {
                        errors.push({
                            field: input.name || input.id,
                            message: '필수 입력 항목입니다.'
                        });
                        input.classList.add('is-invalid');
                    } else {
                        input.classList.remove('is-invalid');
                    }
                    
                    // 이메일 형식 검증
                    if (input.type === 'email' && input.value) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(input.value)) {
                            errors.push({
                                field: input.name || input.id,
                                message: '올바른 이메일 형식이 아닙니다.'
                            });
                            input.classList.add('is-invalid');
                        }
                    }
                });
                
                return {
                    isValid: errors.length === 0,
                    errors: errors
                };
            },
            
            getData: function(formElement) {
                const formData = new FormData(formElement);
                const data = {};
                
                for (let [key, value] of formData.entries()) {
                    if (data[key]) {
                        if (Array.isArray(data[key])) {
                            data[key].push(value);
                        } else {
                            data[key] = [data[key], value];
                        }
                    } else {
                        data[key] = value;
                    }
                }
                
                return data;
            },
            
            setData: function(formElement, data) {
                Object.keys(data).forEach(key => {
                    const input = formElement.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = Boolean(data[key]);
                        } else if (input.type === 'radio') {
                            const radio = formElement.querySelector(`[name="${key}"][value="${data[key]}"]`);
                            if (radio) radio.checked = true;
                        } else {
                            input.value = data[key];
                        }
                    }
                });
            },
            
            reset: function(formElement) {
                formElement.reset();
                const inputs = formElement.querySelectorAll('.is-invalid');
                inputs.forEach(input => input.classList.remove('is-invalid'));
            }
        },

        // ===== Table 컴포넌트 =====
        Table: {
            create: function(data, columns, options = {}) {
                const defaultOptions = {
                    sortable: true,
                    searchable: true,
                    pagination: true,
                    pageSize: 10
                };
                
                const config = { ...defaultOptions, ...options };
                
                // 테이블 요소 생성
                const tableElement = document.createElement('div');
                tableElement.className = 'table-container';
                
                // 검색 기능
                if (config.searchable) {
                    const searchInput = document.createElement('input');
                    searchInput.type = 'text';
                    searchInput.className = 'table-search';
                    searchInput.placeholder = '검색...';
                    tableElement.appendChild(searchInput);
                }
                
                // 테이블 생성
                const table = document.createElement('table');
                table.className = 'table';
                
                // 헤더 생성
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                
                columns.forEach(column => {
                    const th = document.createElement('th');
                    th.textContent = column.title;
                    if (config.sortable && column.sortable !== false) {
                        th.style.cursor = 'pointer';
                        th.addEventListener('click', () => this.sortTable(table, column.key));
                    }
                    headerRow.appendChild(th);
                });
                
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // 바디 생성
                const tbody = document.createElement('tbody');
                this.renderTableBody(tbody, data, columns);
                table.appendChild(tbody);
                
                tableElement.appendChild(table);
                
                // 페이지네이션
                if (config.pagination) {
                    const pagination = this.createPagination(data.length, config.pageSize);
                    tableElement.appendChild(pagination);
                }
                
                return tableElement;
            },
            
            renderTableBody: function(tbody, data, columns) {
                tbody.innerHTML = '';
                
                data.forEach(row => {
                    const tr = document.createElement('tr');
                    
                    columns.forEach(column => {
                        const td = document.createElement('td');
                        const value = row[column.key];
                        
                        if (column.render && typeof column.render === 'function') {
                            td.innerHTML = column.render(value, row);
                        } else {
                            td.textContent = value || '';
                        }
                        
                        tr.appendChild(td);
                    });
                    
                    tbody.appendChild(tr);
                });
            },
            
            sortTable: function(table, key) {
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                rows.sort((a, b) => {
                    const aValue = a.querySelector(`td[data-key="${key}"]`)?.textContent || '';
                    const bValue = b.querySelector(`td[data-key="${key}"]`)?.textContent || '';
                    
                    if (aValue < bValue) return -1;
                    if (aValue > bValue) return 1;
                    return 0;
                });
                
                rows.forEach(row => tbody.appendChild(row));
            },
            
            createPagination: function(totalItems, pageSize) {
                const totalPages = Math.ceil(totalItems / pageSize);
                const pagination = document.createElement('div');
                pagination.className = 'pagination';
                
                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.textContent = i;
                    pageBtn.className = 'page-btn';
                    if (i === 1) pageBtn.classList.add('active');
                    
                    pageBtn.addEventListener('click', () => {
                        pagination.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
                        pageBtn.classList.add('active');
                        // 페이지 변경 이벤트 발생
                    });
                    
                    pagination.appendChild(pageBtn);
                }
                
                return pagination;
            }
        }
    };

    // ===== 컴포넌트 등록 =====
    window.MindGarden.Components.register('Alert', window.MindGarden.Components.Alert);
    window.MindGarden.Components.register('Modal', window.MindGarden.Components.Modal);
    window.MindGarden.Components.register('Loading', window.MindGarden.Components.Loading);
    window.MindGarden.Components.register('Form', window.MindGarden.Components.Form);
    window.MindGarden.Components.register('Table', window.MindGarden.Components.Table);

    // ===== CSS 애니메이션 추가 =====
    function addAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== 초기화 =====
    function init() {
        // CSS 애니메이션 추가
        addAnimations();
        
        console.log('✅ MindGarden Components 초기화 완료');
    }

    // ===== DOM 로드 완료 후 초기화 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
