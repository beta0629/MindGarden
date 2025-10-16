import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, X, Calendar } from 'lucide-react';
import notificationManager from '../../../utils/notification';
import csrfTokenManager from '../../../utils/csrfTokenManager';
import PackageSelector from '../../common/PackageSelector';

/**
 * 회기 추가 요청 모달 컴포넌트
 * - 기존 매칭의 패키지 정보를 그대로 사용
 * - 회기 수 조정 및 사유 입력
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const SessionExtensionModal = ({ 
    isOpen, 
    onClose, 
    mapping, 
    onSessionExtensionRequested 
}) => {
    const [additionalSessions, setAdditionalSessions] = useState(1);
    const [packagePrice, setPackagePrice] = useState(0);
    const [selectedPackage, setSelectedPackage] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('신용카드');
    const [paymentReference, setPaymentReference] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 패키지 선택 핸들러
    const handlePackageChange = (packageInfo) => {
        if (packageInfo) {
            setSelectedPackage(packageInfo.value);
            setAdditionalSessions(packageInfo.sessions);
            setPackagePrice(packageInfo.price);
            
            // 결제 참조번호 자동 생성
            generatePaymentReference();
        }
    };

    // 결제 참조번호 자동 생성
    const generatePaymentReference = () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        
        const methodMap = {
            '신용카드': '신용카드',
            '계좌이체': '계좌이체',
            '현금': '현금'
        };
        
        const method = methodMap[paymentMethod] || '신용카드';
        const reference = `${method} ${dateStr} ${timeStr}`;
        setPaymentReference(reference);
    };

    // 결제 방법 변경 시 참조번호 재생성
    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        generatePaymentReference();
    };

    // 모달이 열릴 때 기존 매칭 정보로 초기화
    useEffect(() => {
        if (isOpen && mapping) {
            // 기존 매칭의 패키지 정보를 기본값으로 설정
            const defaultSessions = mapping.package?.sessions || mapping.totalSessions || 5;
            const defaultPrice = mapping.packagePrice || mapping.package?.price || 0;
            
            setAdditionalSessions(defaultSessions);
            setPackagePrice(defaultPrice);
            setSelectedPackage(mapping.packageName || '');
            setReason('');
            
            // 결제 참조번호 자동 생성
            generatePaymentReference();
            
            console.log('🔍 SessionExtensionModal 매칭 데이터:', {
                mapping,
                consultantName: mapping.consultantName,
                clientName: mapping.clientName,
                packageName: mapping.packageName,
                packagePrice: mapping.packagePrice,
                defaultSessions,
                defaultPrice
            });
        }
    }, [isOpen, mapping]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (additionalSessions < 1) {
            notificationManager.error('추가할 회기 수는 1회 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);
        
        try {
            const requestData = {
                mappingId: mapping.id,
                requesterId: 1, // TODO: 실제 사용자 ID
                additionalSessions: additionalSessions,
                packageName: selectedPackage || mapping.packageName || mapping.package?.name || '기본 패키지',
                packagePrice: packagePrice || mapping.packagePrice || mapping.package?.price || 0,
                paymentMethod: paymentMethod,
                paymentReference: paymentReference,
                reason: reason || '회기 추가 요청'
            };

            console.log('🚀 회기 추가 요청:', requestData);

            const response = await csrfTokenManager.post('/api/admin/session-extensions/requests', requestData);
            const result = await response.json();

            if (result.success !== false) {
                notificationManager.success(`${additionalSessions}회기가 추가 요청되었습니다.`);
                onSessionExtensionRequested?.(mapping.id);
                handleClose();
            } else {
                notificationManager.error(result.message || '회기 추가 요청에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 회기 추가 실패:', error);
            notificationManager.error(`회기 추가에 실패했습니다: ${error.message || error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAdditionalSessions(1);
        setPackagePrice(0);
        setSelectedPackage('');
        setPaymentMethod('신용카드');
        setPaymentReference('');
        setReason('');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen || !mapping) return null;

    // document.body가 준비되지 않았을 때를 대비한 안전한 처리
    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={handleClose}>
            <div className="mg-modal mg-modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="mg-modal-header">
                    <h3 className="mg-modal-title">
                        <Plus size={24} />
                        회기 추가 요청
                    </h3>
                    <button 
                        type="button"
                        className="mg-modal-close"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="mg-modal-content">
                    {/* 매칭 정보 표시 */}
                    <div className="mg-modal-mapping-info">
                        <div className="mg-modal-mapping-client">
                            {mapping.client?.name || mapping.clientName || '알 수 없음'}
                        </div>
                        <div className="mg-modal-mapping-consultant">
                            {mapping.consultant?.name || mapping.consultantName || '알 수 없음'}
                        </div>
                        <div className="mg-modal-mapping-sessions">
                            현재: {mapping.usedSessions || 0}/{mapping.totalSessions || mapping.package?.sessions || 0}회기
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        {/* 패키지 선택 */}
                        <PackageSelector
                            value={selectedPackage}
                            onChange={handlePackageChange}
                            disabled={isLoading}
                        />
                        
                        {/* 총 세션 수 (자동 설정) */}
                        <div className="mg-form-group">
                            <label className="mg-label">총 세션 수</label>
                            <input
                                type="number"
                                className="mg-input"
                                value={additionalSessions}
                                readOnly
                            />
                            <div className="mg-text-secondary">자동 설정</div>
                        </div>
                        
                        {/* 패키지 가격 (자동 설정) */}
                        <div className="mg-form-group">
                            <label className="mg-label">패키지 가격(원)</label>
                            <input
                                type="text"
                                className="mg-input"
                                value={packagePrice > 0 ? packagePrice.toLocaleString() : ''}
                                readOnly
                            />
                            <div className="mg-text-secondary">자동 설정</div>
                        </div>
                        
                        {/* 결제 방법 선택 */}
                        <div className="mg-form-group">
                            <label className="mg-label">결제 방법</label>
                            <select
                                className="mg-input"
                                value={paymentMethod}
                                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                                disabled={isLoading}
                                style={{
                                    appearance: 'none',
                                    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                                    backgroundPosition: 'right 8px center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '16px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="신용카드">신용카드</option>
                                <option value="계좌이체">계좌이체</option>
                                <option value="현금">현금</option>
                            </select>
                        </div>
                        
                        {/* 결제 참조번호 */}
                        <div className="mg-form-group">
                            <label className="mg-label">결제 참조번호</label>
                            <input
                                type="text"
                                className="mg-input"
                                value={paymentReference}
                                onChange={(e) => setPaymentReference(e.target.value)}
                                disabled={isLoading}
                                placeholder="결제 참조번호를 입력하세요"
                            />
                        </div>
                        
                        {/* 추가 사유 입력 */}
                        <div className="mg-form-group">
                            <label className="mg-label">추가 사유 (선택사항)</label>
                            <textarea
                                className="mg-input"
                                rows="3"
                                placeholder="회기 추가 사유를 입력하세요..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        
                        {/* 모달 액션 버튼 */}
                        <div className="mg-modal-footer">
                            <button 
                                type="button"
                                className="mg-button mg-button-secondary"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button 
                                type="submit"
                                className="mg-button mg-button-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? '요청 중...' : `${additionalSessions}회기 추가 요청`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default SessionExtensionModal;
