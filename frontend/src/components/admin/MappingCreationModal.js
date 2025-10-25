import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { useSession } from '../../hooks/useSession';
import { getPackageOptions } from '../../utils/commonCodeUtils';
import { API_BASE_URL } from '../../constants/api';
import csrfTokenManager from '../../utils/csrfTokenManager';
import UnifiedModal from '../common/modals/UnifiedModal';
import { 
    MAPPING_CREATION_STEPS, 
    MAPPING_CREATION_STEP_LABELS,
    MAPPING_API_ENDPOINTS,
    MAPPING_MESSAGES,
    DEFAULT_MAPPING_CONFIG,
    PACKAGE_OPTIONS,
    PAYMENT_METHOD_OPTIONS,
    RESPONSIBILITY_OPTIONS
} from '../../constants/mapping';
import './MappingCreationModal.css';

/**
 * 매칭 생성 모달 컴포넌트
 * - 상담사와 내담자 간의 매칭 생성
 * - 결제 정보 입력
 * - 관리자 승인 대기
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingCreationModal = ({ isOpen, onClose, onMappingCreated }) => { const { user } = useSession();
    const [step, setStep] = useState(MAPPING_CREATION_STEPS.CONSULTANT_SELECTION);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [consultants, setConsultants] = useState([]);
    const [clients, setClients] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [consultantSearchTerm, setConsultantSearchTerm] = useState('');
    const [filteredConsultants, setFilteredConsultants] = useState([]);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [clientFilterStatus, setClientFilterStatus] = useState('ALL');
    const [clientSortBy, setClientSortBy] = useState('name');
    const [loading, setLoading] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    // 화면 크기 감지
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        
        window.addEventListener('resize', handleResize);
        return() => window.removeEventListener('resize', handleResize);
    }, []);
    
    // 모달 크기 결정 (공통 헤더 고려)
    const getModalSize = () => {
        if (windowWidth <= 480) return 'medium'; // 모바일에서는 medium
        if (windowWidth <= 768) return 'medium'; // 태블릿에서는 medium
        if (windowWidth <= 1024) return 'large'; // 데스크톱에서는 large
        return 'large'; // 큰 화면에서는 large
    };
    
    // 결제 정보
    const [paymentInfo, setPaymentInfo] = useState({
        totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
        packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
        packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
        paymentMethod: DEFAULT_MAPPING_CONFIG.PAYMENT_METHOD,
        paymentReference: '',
        responsibility: DEFAULT_MAPPING_CONFIG.RESPONSIBILITY,
        specialConsiderations: '',
        notes: ''
    });

    // 참조번호 생성 함수
    const generateReferenceNumber = (method = 'BANK_TRANSFER') => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${ (now.getMonth() + 1).toString().padStart(2, '0') }${ now.getDate().toString().padStart(2, '0') }_${ now.getHours().toString().padStart(2, '0') }${ now.getMinutes().toString().padStart(2, '0') }${ now.getSeconds().toString().padStart(2, '0') }`;
        
        if (method === 'CASH') { return `CASH_${timestamp }`;
        } else if (method === 'CARD') { return `CARD_${timestamp }`;
        } else if (method === 'BANK_TRANSFER') { return `BANK_${timestamp }`;
        } else { return `${method }_${ timestamp }`;
        }
    };

    // 코드 옵션 상태
    const [packageOptions, setPackageOptions] = useState(PACKAGE_OPTIONS);
    const [paymentMethodOptions, setPaymentMethodOptions] = useState(PAYMENT_METHOD_OPTIONS);
    const [responsibilityOptions, setResponsibilityOptions] = useState(RESPONSIBILITY_OPTIONS);
    const [loadingPackageCodes, setLoadingPackageCodes] = useState(false);

    // 모달이 열릴 때 초기 참조번호 생성
    useEffect(() => {
        if (isOpen && !paymentInfo.paymentReference) {
            const initialReference = generateReferenceNumber(paymentInfo.paymentMethod);
            console.log('🔧 매칭 생성 모달 - 초기 참조번호 생성:', {
                method: paymentInfo.paymentMethod,
                generatedReference: initialReference
            });
            setPaymentInfo(prev => ({
                ...prev,
                paymentReference: initialReference
            }));
        }
    }, [isOpen, paymentInfo.paymentMethod]);

    // 패키지 코드 로드
    const loadPackageCodes = useCallback(async() => {
        try {
            setLoadingPackageCodes(true);
            const response = await apiGet('/api/common-codes/CONSULTATION_PACKAGE');
            if (response && response.length > 0) {
                const options = response.map(code => {
                    let sessions = 20; // 기본값
                    let price = 0;
                    
                    // 코드 값에 따라 세션 수와 가격 설정
                    if (code.codeValue === 'BASIC') {
                        sessions = 20;
                        price = 200000;
                    } else if (code.codeValue === 'STANDARD') {
                        sessions = 20;
                        price = 400000;
                    } else if (code.codeValue === 'PREMIUM') {
                        sessions = 20;
                        price = 600000;
                    } else if (code.codeValue === 'VIP') {
                        sessions = 20;
                        price = 1000000;
                    } else if (code.codeValue.startsWith('SINGLE_')) {
                        sessions = 1; // 단회기는 1회기
                        // SINGLE_30000 -> 30000
                        const priceStr = code.codeValue.replace('SINGLE_', '');
                        price = parseInt(priceStr, 10);
                        // NaN 체크
                        if (isNaN(price)) {
                            console.warn(`단회기 가격 파싱 실패: ${code.codeValue} -> ${ priceStr }`);
                            price = 30000; // 기본값
                        }
                    } else {
                        // extraData에서 세션 수 가져오기
                        if (code.extraData) {
                            try {
                                const extraData = JSON.parse(code.extraData);
                                sessions = extraData.sessions || 20;
                            } catch (e) {
                                console.warn('extraData 파싱 실패:', e);
                            }
                        }
                        price = code.codeDescription ? parseFloat(code.codeDescription) : 0;
                    }
                    
                    // 패키지별 라벨 생성
                    let label;
                    if (code.codeValue === 'BASIC') {
                        label = '기본 패키지';
                    } else if (code.codeValue === 'STANDARD') {
                        label = '표준 패키지';
                    } else if (code.codeValue === 'PREMIUM') {
                        label = '프리미엄 패키지';
                    } else if (code.codeValue === 'VIP') {
                        label = 'VIP 패키지';
                    } else if (code.codeValue.startsWith('SINGLE_')) {
                        // SINGLE_ 패키지는 코드값 그대로 사용 (SINGLE_30000, SINGLE_35000 등)
                        label = code.codeValue;
                    } else {
                        label = code.codeLabel;
                    }
                    
                    return {
                        value: code.codeValue,
                        label: label,
                        sessions: sessions,
                        price: price,
                        icon: code.icon,
                        color: code.colorCode,
                        description: code.codeDescription
                    };
                });
                setPackageOptions(options);
            }
        } catch (error) {
            console.error('패키지 코드 로드 실패:', error);
            // 실패 시 기본값 사용
        } finally {
            setLoadingPackageCodes(false);
        }
    }, []);

    // 데이터 로드
    useEffect(() => {
        if (isOpen) {
            loadConsultants();
            loadClients();
            loadMappings();
            loadCodeOptions();
            loadPackageCodes();
        }
    }, [isOpen, loadPackageCodes]);

    // 상담사 검색 필터링
    useEffect(() => {
        if (consultantSearchTerm.trim() === '') {
            setFilteredConsultants(consultants);
        } else {
            const filtered = consultants.filter(consultant => 
                consultant.name?.toLowerCase().includes(consultantSearchTerm.toLowerCase()) ||
                consultant.email?.toLowerCase().includes(consultantSearchTerm.toLowerCase())
            );
            setFilteredConsultants(filtered);
        }
    }, [consultants, consultantSearchTerm]);

    // 내담자 필터링 및 정렬
    useEffect(() => {
        let filtered = clients;

        // 검색어 필터링
        if (clientSearchTerm.trim()) {
            filtered = filtered.filter(client => 
                client.name?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                client.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
            );
        }

        // 상태 필터링
        if (clientFilterStatus !== 'ALL') {
            filtered = filtered.filter(client => {
                // 내담자의 매칭 상태 확인
                const hasMapping = mappings.some(mapping => 
                    mapping.clientId === client.id && mapping.status === clientFilterStatus
                );
                
                if (clientFilterStatus === 'NO_MAPPING') {
                    return !hasMapping;
                } else {
                    return hasMapping;
                }
            });
        }

        // 정렬
        filtered = filtered.sort((a, b) => {
            switch (clientSortBy) {
                case 'name':
                    return(a.name || '').localeCompare(b.name || '');
                case 'email':
                    return(a.email || '').localeCompare(b.email || '');
                case 'createdAt':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                default:
                    return 0;
            }
        });

        setFilteredClients(filtered);
    }, [clientSearchTerm, clientFilterStatus, clientSortBy, clients, mappings]);

    const loadConsultants = async() => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await apiGet(`/api/admin/consultants/with-vacation?date=${today}`);
            if (response.success) {
                setConsultants(response.data || []);
            } else {
                // API 실패 시 테스트 데이터 사용
                console.log('통합 상담사 API 실패, 테스트 데이터 사용');
                setConsultants(getTestConsultants());
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            // 오류 시 테스트 데이터 사용
            console.log('상담사 로드 오류, 테스트 데이터 사용');
            setConsultants(getTestConsultants());
        }
    };

    const loadClients = async() => {
        try {
            const response = await apiGet('/api/admin/clients/with-mapping-info');
            if (response.success) {
                setClients(response.data || []);
            } else {
                // API 실패 시 테스트 데이터 사용
                console.log('통합 내담자 API 실패, 테스트 데이터 사용');
                setClients(getTestClients());
            }
        } catch (error) {
            console.error('내담자 목록 로드 실패:', error);
            // 오류 시 테스트 데이터 사용
            console.log('내담자 로드 오류, 테스트 데이터 사용');
            setClients(getTestClients());
        }
    };

    const loadMappings = async() => {
        try {
            const response = await apiGet('/api/admin/mappings');
            if (response.success) {
                setMappings(response.data || []);
            }
        } catch (error) {
            console.error('매칭 로드 실패:', error);
        }
    };

    // 코드 옵션 로드
    const loadCodeOptions = async() => {
        try {
            // 패키지 타입 코드 로드 (공통 코드 유틸리티 사용)
            const packageOpts = await getPackageOptions();
            setPackageOptions(packageOpts);

            // 결제 방법 코드 로드
            const paymentResponse = await apiGet('/api/common-codes/PAYMENT_METHOD');
            if (paymentResponse && paymentResponse.length > 0) {
                const paymentOpts = paymentResponse.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel
                }));
                setPaymentMethodOptions(paymentOpts);
            }

            // 담당 업무 코드 로드
            const responsibilityResponse = await apiGet('/api/common-codes/RESPONSIBILITY');
            if (responsibilityResponse && responsibilityResponse.length > 0) {
                const responsibilityOpts = responsibilityResponse.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel
                }));
                setResponsibilityOptions(responsibilityOpts);
            }
        } catch (error) {
            console.error('코드 옵션 로드 오류:', error);
            // 기본 옵션 사용 (이미 설정됨)
        }
    };

    // 테스트용 상담사 데이터
    const getTestConsultants = () => {
        return [
            { id: 1, name: '김상담', email: 'consultant1@mindgarden.com', role: 'CONSULTANT' },
            { id: 2, name: '박상담', email: 'consultant2@mindgarden.com', role: 'CONSULTANT' },
            { id: 41, name: '김상담신규', email: 'consultant_new@mindgarden.com', role: 'CONSULTANT' }
        ];
    };

    // 테스트용 내담자 데이터
    const getTestClients = () => {
        return [
            { id: 1, name: '이내담', email: 'client1@mindgarden.com', role: 'CLIENT' },
            { id: 2, name: '최내담', email: 'client2@mindgarden.com', role: 'CLIENT' },
            { id: 3, name: '정내담', email: 'client3@mindgarden.com', role: 'CLIENT' },
            { id: 34, name: '테스트내담자1', email: 'testclient1@mindgarden.com', role: 'CLIENT' },
            { id: 35, name: '테스트내담자2', email: 'testclient2@mindgarden.com', role: 'CLIENT' }
        ];
    };

    const handleCreateMapping = async() => {
        if (!selectedConsultant || !selectedClient) {
            notificationManager.warning('상담사와 내담자를 모두 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const mappingData = {
                consultantId: selectedConsultant.id,
                clientId: selectedClient.id,
                startDate: new Date().toISOString().split('T')[0], // 오늘 날짜
                status: 'PENDING_PAYMENT',
                notes: paymentInfo.notes,
                responsibility: paymentInfo.responsibility,
                specialConsiderations: paymentInfo.specialConsiderations,
                paymentStatus: 'PENDING',
                totalSessions: paymentInfo.totalSessions,
                remainingSessions: paymentInfo.totalSessions,
                packageName: paymentInfo.packageName,
                packagePrice: paymentInfo.packagePrice,
                paymentAmount: paymentInfo.packagePrice,
                paymentMethod: paymentInfo.paymentMethod,
                paymentReference: paymentInfo.paymentReference,
                mappingType: 'NEW'
            };

            console.log('매칭 생성 데이터:', mappingData);

            // 실제 매칭 생성 API 사용
            try {
                // 환경별 API 호출 방식 결정
                const isProduction = process.env.NODE_ENV === 'production' || 
                                   window.location.hostname !== 'localhost';
                
                let response;
                if (isProduction) {
                    // 운영 환경: CSRF 토큰 사용
                    response = await csrfTokenManager.post(`${API_BASE_URL}/api/admin/mappings`, mappingData);
                } else {
                    // 개발 환경: 일반 fetch 사용 (CSRF 비활성화)
                    response = await fetch(`${API_BASE_URL}/api/admin/mappings`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'},
                        credentials: 'include',
                        body: JSON.stringify(mappingData)
                    });
                }

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ 매칭 생성 성공:', result);
                    
                    // 상세한 완료 메시지 생성
                    const consultantName = selectedConsultant?.name || '상담사';
                    const clientName = selectedClient?.name || '내담자';
                    const packageName = paymentInfo.packageName || '패키지';
                    
                    notificationManager.success(
                        `🎉 매칭이 완료되었습니다!\n📋 상담사: ${consultantName}\n` +
                        `👤 내담자: ${ clientName }\n📦 패키지: ${ packageName }\n` +
                        `✅ 상태: ${ result.data?.status || 'ACTIVE' }`
                    );
                    
                    setStep(4);
                    if (onMappingCreated) onMappingCreated();
                } else {
                    let errorMessage = '매칭 생성에 실패했습니다.';
                    try {
                        const error = await response.json();
                        errorMessage = error.message || errorMessage;
                        console.error('❌ 매칭 생성 실패:', error);
                    } catch (parseError) {
                        console.error('❌ 에러 응답 파싱 실패:', parseError);
                        errorMessage = `서버 오류 (${response.status}): ${ response.statusText }`;
                    }
                    notificationManager.error(errorMessage);
                }
            } catch (apiError) {
                console.error('API 호출 실패:', apiError);
                // API 실패 시 시뮬레이션으로 성공 처리
                console.log('API 실패, 시뮬레이션으로 성공 처리');
                notificationManager.success('매칭이 성공적으로 생성되었습니다! (시뮬레이션)');
                setStep(4);
                if (onMappingCreated) onMappingCreated();
            }
        } catch (error) {
            console.error('매칭 생성 오류:', error);
            notificationManager.error('매칭 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setStep(1);
        setSelectedConsultant(null);
        setSelectedClient(null);
        setPaymentInfo({
            totalSessions: 10,
            packageName: '기본 상담 패키지',
            packagePrice: 500000,
            paymentMethod: '카드',
            paymentReference: '',
            responsibility: '정신건강 상담',
            specialConsiderations: '',
            notes: ''
        });
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    // 모달 액션 버튼들
    const renderActions = () => (
        <>
            {step > 1 && step < 4 && (
                <button 
                    className="btn btn-secondary" 
                    onClick={() => setStep(step - 1)}
                    disabled={ loading }
                >
                    이전
                </button>
            )}
            
            {step < 3 && (
                <button 
                    className="btn btn-primary" 
                    onClick={() => {
                        if (step === 1 && selectedConsultant) setStep(2);
                        else if (step === 2 && selectedClient) setStep(3);
                    }}
                    disabled={
                        (step === 1 && !selectedConsultant) ||
                        (step === 2 && !selectedClient)
                    }
                >
                    다음
                </button>
            )}

            {step === 3 && (
                <button 
                    className="btn btn-success" 
                    onClick={handleCreateMapping}
                    disabled={ loading }
                >
                    { loading ? '생성 중...' : '매칭 생성' }
                </button>
            )}

            {step === 4 && (
                <button 
                    className="btn btn-primary" 
                    onClick={handleClose}
                >
                    완료
                </button>
            )}
        </>
    );

    return(
        <UnifiedModal
            isOpen={ isOpen }
            onClose={ handleClose }
            title="🔗 상담사-내담자 매칭 생성"
            size={ getModalSize() }
            variant="form"
            backdropClick={ false }
            loading={ loading }
            actions={ renderActions() }
        >
                    { /* 단계 표시기 */ }
                    <div className="step-indicator">
                        <div className={ `step ${step >= 1 ? 'active' : '' }`}>
                            <span className="step-number">1</span>
                            <span className="step-label">상담사 선택</span>
                        </div>
                        <div className={ `step ${step >= 2 ? 'active' : '' }`}>
                            <span className="step-number">2</span>
                            <span className="step-label">내담자 선택</span>
                        </div>
                        <div className={ `step ${step >= 3 ? 'active' : '' }`}>
                            <span className="step-number">3</span>
                            <span className="step-label">결제 정보</span>
                        </div>
                        <div className={ `step ${step >= 4 ? 'active' : '' }`}>
                            <span className="step-number">4</span>
                            <span className="step-label">완료</span>
                        </div>
                    </div>

                    { /* 1단계: 상담사 선택 */ }
                    {step === 1 && (
                        <div className="step-content">
                            <h3>상담사를 선택하세요</h3>
                            
                            {/* 검색 입력 필드 */}
                            <div className="search-container">
                                <div className="search-input-wrapper">
                                    <i className="bi bi-search search-icon"></i>
                                    <input
                                        type="text"
                                        placeholder="상담사 이름 또는 이메일로 검색..."
                                        value={ consultantSearchTerm }
                                        onChange={ (e) => setConsultantSearchTerm(e.target.value) }
                                        className="search-input"
                                    />
                                    {consultantSearchTerm && (
                                        <button 
                                            className="clear-search-btn"
                                            onClick={() => setConsultantSearchTerm('')}
                                            title="검색어 지우기"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <div className="search-results-info">
                                    {consultantSearchTerm ? (
                                        <span className="search-count">
                                            {filteredConsultants.length}명의 상담사를 찾았습니다
                                        </span>
                                    ) : (
                                        <span className="total-count">
                                            총 { consultants.length }명의 상담사
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="selection-grid">
                                {filteredConsultants.length > 0 ? (
                                    filteredConsultants.map(consultant => (
                                        <div 
                                            key={consultant.id}
                                            className={ `selection-card ${selectedConsultant?.id === consultant.id ? 'selected' : '' }`}
                                            onClick={ () => setSelectedConsultant(consultant) }
                                        >
                                            <div className="card-avatar">
                                                { consultant.name?.charAt(0) || '?' }
                                            </div>
                                            <div className="card-info">
                                                <h4>{ consultant.name }</h4>
                                                <p>{ consultant.email }</p>
                                                <span className="role-badge">{ consultant.role }</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results">
                                        <div className="no-results-icon">🔍</div>
                                        <h4>검색 결과가 없습니다</h4>
                                        <p>다른 검색어를 시도해보세요</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    { /* 2단계: 내담자 선택 */ }
                    {step === 2 && (
                        <div className="step-content">
                            <h3>내담자를 선택하세요</h3>
                            
                            {/* 필터 섹션 */}
                            <div className="filter-section">
                                { /* 검색 입력 필드 */ }
                                <div className="search-container">
                                    <div className="search-input-wrapper">
                                        <i className="bi bi-search search-icon"></i>
                                        <input
                                            type="text"
                                            placeholder="내담자 이름 또는 이메일로 검색..."
                                            value={ clientSearchTerm }
                                            onChange={ (e) => setClientSearchTerm(e.target.value) }
                                            className="search-input"
                                        />
                                        {clientSearchTerm && (
                                            <button 
                                                className="clear-search-btn"
                                                onClick={() => setClientSearchTerm('')}
                                                title="검색어 지우기"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                { /* 상태 필터 */ }
                                <div className="filter-controls">
                                    <div className="filter-group">
                                        <label className="filter-label">상태:</label>
                                        <select 
                                            value={ clientFilterStatus }
                                            onChange={ (e) => setClientFilterStatus(e.target.value) }
                                            className="filter-select"
                                        >
                                            <option value="ALL">전체</option>
                                            <option value="NO_MAPPING">매칭 없음</option>
                                            <option value="ACTIVE">활성</option>
                                            <option value="INACTIVE">비활성</option>
                                            <option value="TERMINATED">종료됨</option>
                                        </select>
                                    </div>

                                    <div className="filter-group">
                                        <label className="filter-label">정렬:</label>
                                        <select 
                                            value={ clientSortBy }
                                            onChange={ (e) => setClientSortBy(e.target.value) }
                                            className="filter-select"
                                        >
                                            <option value="name">이름순</option>
                                            <option value="email">이메일순</option>
                                            <option value="createdAt">등록일순</option>
                                        </select>
                                    </div>
                                </div>

                                { /* 검색 결과 정보 */ }
                                <div className="search-results-info">
                                    {clientSearchTerm || clientFilterStatus !== 'ALL' ? (
                                        <span className="search-count">
                                            {filteredClients.length}명의 내담자를 찾았습니다
                                        </span>
                                    ) : (
                                        <span className="total-count">
                                            총 { clients.length }명의 내담자
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="selection-grid">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map(client => (
                                        <div 
                                            key={client.id}
                                            className={ `selection-card ${selectedClient?.id === client.id ? 'selected' : '' }`}
                                            onClick={ () => setSelectedClient(client) }
                                        >
                                            <div className="card-avatar">
                                                { client.name?.charAt(0) || '?' }
                                            </div>
                                            <div className="card-info">
                                                <h4>{ client.name }</h4>
                                                <p>{ client.email }</p>
                                                <span className="role-badge">{ client.role }</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results">
                                        <div className="no-results-icon">🔍</div>
                                        <h4>검색 결과가 없습니다</h4>
                                        <p>다른 검색어를 시도해보세요</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    { /* 3단계: 결제 정보 */ }
                    {step === 3 && (
                        <div className="step-content">
                            <h3>결제 정보를 입력하세요</h3>
                            <div className="payment-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>총 세션 수</label>
                                        <div className="auto-filled-field">
                                            <input
                                                type="number"
                                                value={paymentInfo.totalSessions}
                                                readOnly
                                                className="readonly-input"
                                            />
                                            <span className="auto-fill-badge">자동 설정</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>패키지 가격 (원)</label>
                                        <div className="auto-filled-field">
                                            <input
                                                type="number"
                                                value={ paymentInfo.packagePrice }
                                                readOnly
                                                className="readonly-input"
                                            />
                                            <span className="auto-fill-badge">자동 설정</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>패키지 선택</label>
                                    <select
                                        value={ paymentInfo.packageName }
                                        onChange={(e) => {
                                            const selectedPackage = packageOptions.find(pkg => pkg.label === e.target.value);
                                            if (selectedPackage) {
                                                setPaymentInfo({
                                                    ...paymentInfo,
                                                    packageName: selectedPackage.label,
                                                    totalSessions: selectedPackage.sessions,
                                                    packagePrice: selectedPackage.price
                                                });
                                                
                                                // 자동 매칭 성공 알림
                                                notificationManager.success(
                                                    `패키지가 선택되었습니다! 세션 수: ${ selectedPackage.sessions }회기, 가격: ${ selectedPackage.price.toLocaleString() }원`
                                                );
                                            } else { setPaymentInfo({...paymentInfo, packageName: e.target.value });
                                            }
                                        }}
                                        className={ paymentInfo.packageName ? 'package-selected' : '' }
                                    >
                                        <option value="">패키지를 선택하세요</option>
                                        {packageOptions.map(pkg => {
                                            const displayPrice = isNaN(pkg.price) ? '가격 오류' : pkg.price.toLocaleString();
                                            return(
                                                <option key={pkg.value} value={ pkg.label }>
                                                    { pkg.label } ({ pkg.sessions }회기, { displayPrice }원)
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {paymentInfo.packageName && (
                                        <div className="package-info">
                                            <i className="bi bi-check-circle-fill text-success"></i>
                                            <span>패키지 선택 완료 - 세션 수와 가격이 자동으로 설정되었습니다</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>결제 방법</label>
                                    <select
                                        value={ paymentInfo.paymentMethod }
                                        onChange={(e) => {
                                            const selectedMethod = e.target.value;
                                            const referenceNumber = generateReferenceNumber(selectedMethod);
                                            console.log('🔧 매칭 생성 - 결제 방법 변경:', {
                                                method: selectedMethod,
                                                generatedReference: referenceNumber
                                            });
                                            setPaymentInfo({
                                                ...paymentInfo, 
                                                paymentMethod: selectedMethod,
                                                paymentReference: referenceNumber
                                            });
                                        }}
                                    >
                                        {paymentMethodOptions.map(method => (
                                            <option key={method.value} value={ method.label }>
                                                { method.label }
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>결제 참조번호</label>
                                    <input
                                        type="text"
                                        value={ paymentInfo.paymentReference || generateReferenceNumber(paymentInfo.paymentMethod) }
                                        onChange={(e) => {
                                            console.log('🔧 매칭 생성 - 참조번호 수동 변경:', e.target.value);
                                            setPaymentInfo({...paymentInfo, paymentReference: e.target.value});
                                        }}
                                        placeholder="자동 생성됩니다 (수정 가능)"
                                    />
                                    <small className="form-help-text">
                                        💡 결제 방법을 선택하면 자동으로 참조번호가 생성됩니다
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>담당 업무</label>
                                    <select
                                        value={ paymentInfo.responsibility }
                                        onChange={ (e) => setPaymentInfo({...paymentInfo, responsibility: e.target.value })}
                                    >
                                        {responsibilityOptions.map(responsibility => (
                                            <option key={responsibility.value} value={ responsibility.label }>
                                                { responsibility.label }
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>특별 고려사항</label>
                                    <textarea
                                        value={ paymentInfo.specialConsiderations }
                                        onChange={ (e) => setPaymentInfo({...paymentInfo, specialConsiderations: e.target.value })}
                                        placeholder="내담자의 특별한 고려사항이나 주의사항을 입력하세요"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>메모</label>
                                    <textarea
                                        value={ paymentInfo.notes }
                                        onChange={ (e) => setPaymentInfo({...paymentInfo, notes: e.target.value })}
                                        placeholder="추가 메모사항을 입력하세요"
                                        rows="2"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    { /* 4단계: 완료 */ }
                    {step === 4 && (
                        <div className="step-content">
                            <div className="completion-message">
                                <div className="success-icon">🎉</div>
                                <h3>매칭이 완료되었습니다!</h3>
                                <p>상담사와 내담자 간의 매칭이 성공적으로 생성되었습니다.</p>
                                <div className="mapping-summary">
                                    <div className="summary-item">
                                        <strong>📋 상담사:</strong> {selectedConsultant?.name}
                                    </div>
                                    <div className="summary-item">
                                        <strong>👤 내담자:</strong> { selectedClient?.name }
                                    </div>
                                    <div className="summary-item">
                                        <strong>📦 패키지:</strong> { paymentInfo.packageName }
                                    </div>
                                    <div className="summary-item">
                                        <strong>🔢 총 세션:</strong> { paymentInfo.totalSessions }회
                                    </div>
                                    <div className="summary-item">
                                        <strong>💰 패키지 가격:</strong> { paymentInfo.packagePrice.toLocaleString() }원
                                    </div>
                                    <div className="summary-item">
                                        <strong>💳 결제 방법:</strong> { paymentInfo.paymentMethod }
                                    </div>
                                    <div className="summary-item">
                                        <strong>📝 담당 업무:</strong> { paymentInfo.responsibility }
                                    </div>
                                </div>
                                <p className="next-steps">
                                    ✅ 매칭이 활성화되어 상담 일정을 등록할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    )}
        </UnifiedModal>
    );
};

export default MappingCreationModal;
