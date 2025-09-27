import React, { useState, useEffect, useCallback } from 'react';
import notificationManager from '../../utils/notification';
import './NotificationTest.css';

/**
 * 알림 시스템 테스트 페이지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const NotificationTest = () => {
    const [customMessage, setCustomMessage] = useState('');
    const [customDuration, setCustomDuration] = useState(3000);
    const [selectedType, setSelectedType] = useState('success');
    const [notificationTypeOptions, setNotificationTypeOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);

    // 알림 유형 코드 로드
    const loadNotificationTypeCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await fetch('/api/common-codes/group/NOTIFICATION_TYPE');
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    setNotificationTypeOptions(data.map(code => ({
                        value: code.codeValue,
                        label: code.codeLabel,
                        icon: code.icon,
                        color: code.colorCode,
                        description: code.description
                    })));
                }
            }
        } catch (error) {
            console.error('알림 유형 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setNotificationTypeOptions([
                { value: 'success', label: '성공', icon: '✅', color: '#10b981', description: '성공 알림' },
                { value: 'error', label: '오류', icon: '❌', color: '#ef4444', description: '오류 알림' },
                { value: 'warning', label: '경고', icon: '⚠️', color: '#f59e0b', description: '경고 알림' },
                { value: 'info', label: '정보', icon: 'ℹ️', color: '#3b82f6', description: '정보 알림' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    useEffect(() => {
        loadNotificationTypeCodes();
    }, [loadNotificationTypeCodes]);

    // 기본 알림 테스트
    const testSuccess = () => {
        notificationManager.success('성공 알림입니다! 🎉');
    };

    const testError = () => {
        notificationManager.error('오류 알림입니다! ❌');
    };

    const testWarning = () => {
        notificationManager.warning('경고 알림입니다! ⚠️');
    };

    const testInfo = () => {
        notificationManager.info('정보 알림입니다! ℹ️');
    };

    // 커스텀 알림 테스트
    const testCustom = () => {
        if (!customMessage.trim()) {
            notificationManager.warning('메시지를 입력해주세요.');
            return;
        }

        notificationManager.show(customMessage, selectedType, customDuration);
    };

    // API 오류 시뮬레이션
    const testApiError = () => {
        const mockError = {
            response: {
                data: {
                    message: 'API 오류가 발생했습니다.',
                    error: 'INTERNAL_SERVER_ERROR'
                }
            }
        };
        notificationManager.handleApiError(mockError, '기본 오류 메시지');
    };

    // API 성공 시뮬레이션
    const testApiSuccess = () => {
        const mockResponse = {
            message: 'API 요청이 성공적으로 완료되었습니다.'
        };
        notificationManager.handleApiSuccess(mockResponse, '기본 성공 메시지');
    };

    // 연속 알림 테스트
    const testMultiple = () => {
        notificationManager.success('첫 번째 알림');
        setTimeout(() => notificationManager.info('두 번째 알림'), 500);
        setTimeout(() => notificationManager.warning('세 번째 알림'), 1000);
        setTimeout(() => notificationManager.error('네 번째 알림'), 1500);
    };

    // 긴 메시지 테스트
    const testLongMessage = () => {
        const longMessage = '이것은 매우 긴 알림 메시지입니다. Toast 컴포넌트가 긴 텍스트를 어떻게 처리하는지 확인하기 위한 테스트입니다. 여러 줄로 구성된 메시지도 제대로 표시되는지 확인해보세요.';
        notificationManager.info(longMessage, 5000);
    };

    // 빠른 연속 알림 테스트
    const testRapid = () => {
        for (let i = 1; i <= 5; i++) {
            setTimeout(() => {
                notificationManager.info(`빠른 알림 ${i}`, 2000);
            }, i * 100);
        }
    };

    return (
        <div className="notification-test">
            <div className="notification-test-header">
                <h1>🔔 알림 시스템 테스트</h1>
                <p>공통 알림 시스템의 다양한 기능을 테스트할 수 있습니다.</p>
            </div>

            <div className="notification-test-section">
                <h2>기본 알림 타입</h2>
                <div className="test-buttons">
                    <button 
                        className="test-btn test-btn-success" 
                        onClick={testSuccess}
                    >
                        성공 알림
                    </button>
                    <button 
                        className="test-btn test-btn-error" 
                        onClick={testError}
                    >
                        오류 알림
                    </button>
                    <button 
                        className="test-btn test-btn-warning" 
                        onClick={testWarning}
                    >
                        경고 알림
                    </button>
                    <button 
                        className="test-btn test-btn-info" 
                        onClick={testInfo}
                    >
                        정보 알림
                    </button>
                </div>
            </div>

            <div className="notification-test-section">
                <h2>커스텀 알림</h2>
                <div className="custom-form">
                    <div className="form-group">
                        <label htmlFor="message">메시지:</label>
                        <input
                            id="message"
                            type="text"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="알림 메시지를 입력하세요"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="type">타입:</label>
                        <select
                            id="type"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            {notificationTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="duration">지속시간 (ms):</label>
                        <input
                            id="duration"
                            type="number"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(parseInt(e.target.value) || 3000)}
                            min="1000"
                            max="10000"
                            step="500"
                        />
                    </div>
                    <button 
                        className="test-btn test-btn-primary" 
                        onClick={testCustom}
                    >
                        커스텀 알림 보내기
                    </button>
                </div>
            </div>

            <div className="notification-test-section">
                <h2>API 시뮬레이션</h2>
                <div className="test-buttons">
                    <button 
                        className="test-btn test-btn-secondary" 
                        onClick={testApiSuccess}
                    >
                        API 성공 시뮬레이션
                    </button>
                    <button 
                        className="test-btn test-btn-secondary" 
                        onClick={testApiError}
                    >
                        API 오류 시뮬레이션
                    </button>
                </div>
            </div>

            <div className="notification-test-section">
                <h2>특수 테스트</h2>
                <div className="test-buttons">
                    <button 
                        className="test-btn test-btn-special" 
                        onClick={testMultiple}
                    >
                        연속 알림 (4개)
                    </button>
                    <button 
                        className="test-btn test-btn-special" 
                        onClick={testLongMessage}
                    >
                        긴 메시지 테스트
                    </button>
                    <button 
                        className="test-btn test-btn-special" 
                        onClick={testRapid}
                    >
                        빠른 연속 알림 (5개)
                    </button>
                </div>
            </div>

            <div className="notification-test-info">
                <h3>테스트 가이드</h3>
                <ul>
                    <li>각 버튼을 클릭하여 다양한 알림을 테스트해보세요.</li>
                    <li>알림은 화면 우측 상단에 표시됩니다.</li>
                    <li>알림을 클릭하면 수동으로 닫을 수 있습니다.</li>
                    <li>설정된 시간 후 자동으로 사라집니다.</li>
                    <li>여러 알림이 동시에 표시될 수 있습니다.</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationTest;
