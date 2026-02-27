import React, { useState, useEffect } from 'react';
import { 
    Key, 
    Save, 
    Eye, 
    EyeOff, 
    Shield, 
    Database,
    Settings,
    CheckCircle,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { apiGet, apiPost } from '../../utils/ajax';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import Button from '../ui/Button';
import '../../styles/unified-design-tokens.css';
import './SystemConfigManagement.css';

/**
 * 시스템 설정 관리 페이지
/**
 * 관리자 전용 (BRANCH_ADMIN 이상)
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-21
 */
const SystemConfigManagement = () => {
    const { user, isLoggedIn } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    
    // 설정 데이터
    const [configs, setConfigs] = useState({
        openaiApiKey: '',
        openaiApiUrl: 'https://api.openai.com/v1/chat/completions',
        openaiModel: 'gpt-3.5-turbo',
        wellnessAutoSendEnabled: true,
        wellnessSendTime: '09:00',
        wellnessTargetRoles: 'CLIENT,ROLE_CLIENT'
    });
    
    // UI 상태
    const [showApiKey, setShowApiKey] = useState(false);
    const [testResult, setTestResult] = useState(null);
    
    // 권한 체크
    useEffect(() => {
        if (!isLoggedIn || !user) {
            notificationManager.show('로그인이 필요합니다.', 'error');
            return;
        }
        
        const allowedRoles = ['ADMIN', 'STAFF'];
        if (!allowedRoles.includes(user.role)) {
            notificationManager.show('접근 권한이 없습니다.', 'error');
            return;
        }
        
        loadConfigs();
    }, [isLoggedIn, user]);
    
    // 설정 로드
    const loadConfigs = async () => {
        try {
            setLoading(true);
            
            // OpenAI 설정 조회
            const openaiResponse = await apiGet('/api/v1/admin/system-config/openai');
            if (openaiResponse.success) {
                setConfigs(prev => ({
                    ...prev,
                    openaiApiKey: openaiResponse.apiKey || '',
                    openaiApiUrl: openaiResponse.apiUrl || 'https://api.openai.com/v1/chat/completions',
                    openaiModel: openaiResponse.model || 'gpt-3.5-turbo'
                }));
            }
            
            // 웰니스 설정 조회
            const wellnessConfigs = await Promise.all([
                apiGet('/api/v1/admin/system-config/WELLNESS_AUTO_SEND_ENABLED'),
                apiGet('/api/v1/admin/system-config/WELLNESS_SEND_TIME'),
                apiGet('/api/v1/admin/system-config/WELLNESS_TARGET_ROLES')
            ]);
            
            setConfigs(prev => ({
                ...prev,
                wellnessAutoSendEnabled: wellnessConfigs[0].success ? wellnessConfigs[0].configValue === 'true' : true,
                wellnessSendTime: wellnessConfigs[1].success ? wellnessConfigs[1].configValue : '09:00',
                wellnessTargetRoles: wellnessConfigs[2].success ? wellnessConfigs[2].configValue : 'CLIENT,ROLE_CLIENT'
            }));
            
        } catch (error) {
            console.error('설정 로드 실패:', error);
            notificationManager.show('설정을 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // 설정 저장
    const handleSave = async () => {
        try {
            setSaving(true);
            
            // OpenAI 설정 저장
            await Promise.all([
                apiPost('/api/v1/admin/system-config/OPENAI_API_KEY', {
                    configValue: configs.openaiApiKey,
                    description: 'OpenAI API 키',
                    category: 'AI'
                }),
                apiPost('/api/v1/admin/system-config/OPENAI_API_URL', {
                    configValue: configs.openaiApiUrl,
                    description: 'OpenAI API URL',
                    category: 'AI'
                }),
                apiPost('/api/v1/admin/system-config/OPENAI_MODEL', {
                    configValue: configs.openaiModel,
                    description: 'OpenAI 모델명',
                    category: 'AI'
                })
            ]);
            
            // 웰니스 설정 저장
            await Promise.all([
                apiPost('/api/v1/admin/system-config/WELLNESS_AUTO_SEND_ENABLED', {
                    configValue: configs.wellnessAutoSendEnabled.toString(),
                    description: '웰니스 자동 발송 활성화',
                    category: 'WELLNESS'
                }),
                apiPost('/api/v1/admin/system-config/WELLNESS_SEND_TIME', {
                    configValue: configs.wellnessSendTime,
                    description: '웰니스 발송 시간',
                    category: 'WELLNESS'
                }),
                apiPost('/api/v1/admin/system-config/WELLNESS_TARGET_ROLES', {
                    configValue: configs.wellnessTargetRoles,
                    description: '웰니스 발송 대상 역할',
                    category: 'WELLNESS'
                })
            ]);
            
            notificationManager.show('설정이 저장되었습니다.', 'success');
            
        } catch (error) {
            console.error('설정 저장 실패:', error);
            notificationManager.show('설정 저장에 실패했습니다.', 'error');
        } finally {
            setSaving(false);
        }
    };
    
    // API 테스트
    const handleTest = async () => {
        try {
            setTesting(true);
            setTestResult(null);
            
            const response = await apiPost('/api/v1/admin/wellness/test', {
                dayOfWeek: 1,
                season: 'SPRING',
                category: 'MENTAL'
            });
            
            if (response.success) {
                setTestResult({
                    success: true,
                    message: 'API 테스트 성공!',
                    content: response.data
                });
            } else {
                setTestResult({
                    success: false,
                    message: response.message || 'API 테스트 실패'
                });
            }
            
        } catch (error) {
            console.error('API 테스트 실패:', error);
            setTestResult({
                success: false,
                message: 'API 테스트 중 오류가 발생했습니다.'
            });
        } finally {
            setTesting(false);
        }
    };
    
    if (loading) {
        return (
            <AdminCommonLayout title="시스템 설정 관리">
                <div className="mg-loading">로딩중...</div>
            </AdminCommonLayout>
        );
    }
    
    return (
        <AdminCommonLayout title="시스템 설정 관리">
            <div className="system-config-management">
                
                {/* 헤더 */}
                <div className="mg-v2-card system-config-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <Settings size={32} />
                        </div>
                        <div className="header-text">
                            <h1>시스템 설정 관리</h1>
                            <p>AI API 키(심리검사 리포트 등)·모델·웰니스 시스템 설정을 관리합니다.</p>
                        </div>
                    </div>
                </div>
                
                {/* AI API 설정 (OpenAI 호환: 심리검사 리포트, 웰니스 등) */}
                <div className="mg-v2-card config-section">
                    <div className="section-header">
                        <Key size={24} />
                        <h2>AI API 설정</h2>
                    </div>
                    <p className="config-section-desc">
                        심리검사 AI 리포트·웰니스 등에 사용됩니다. OpenAI 외에 <strong>재미나이·클로드·Replicate</strong> 등
                        OpenAI Chat Completions 호환 URL을 쓰면 해당 모델을 사용할 수 있습니다.
                    </p>
                    <div className="config-grid">
                        <div className="config-item">
                            <label htmlFor="apiKey">API 키</label>
                            <div className="input-group">
                                <input
                                    id="apiKey"
                                    type={showApiKey ? 'text' : 'password'}
                                    value={configs.openaiApiKey}
                                    onChange={(e) => setConfigs(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                                    placeholder="sk-... (OpenAI) 또는 해당 서비스 API 키"
                                    className="mg-v2-input"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="medium"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    preventDoubleClick={false}
                                >
                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                            </div>
                            <small className="help-text">
                                <Shield size={14} />
                                API 키는 암호화되어 저장됩니다. 미등록 시 심리검사 리포트는 규칙 기반만 적용됩니다.
                            </small>
                        </div>
                        
                        <div className="config-item">
                            <label htmlFor="apiUrl">API URL</label>
                            <input
                                id="apiUrl"
                                type="text"
                                value={configs.openaiApiUrl}
                                onChange={(e) => setConfigs(prev => ({ ...prev, openaiApiUrl: e.target.value }))}
                                placeholder="https://api.openai.com/v1/chat/completions"
                                className="mg-v2-input"
                            />
                            <small className="help-text">
                                OpenAI 기본값 또는 재미나이·Replicate 등 호환 엔드포인트 URL을 입력하세요.
                            </small>
                        </div>
                        
                        <div className="config-item">
                            <label htmlFor="model">모델</label>
                            <input
                                id="model"
                                type="text"
                                value={configs.openaiModel}
                                onChange={(e) => setConfigs(prev => ({ ...prev, openaiModel: e.target.value }))}
                                placeholder="gpt-3.5-turbo"
                                className="mg-v2-input"
                                list="model-presets"
                            />
                            <datalist id="model-presets">
                                <option value="gpt-3.5-turbo" />
                                <option value="gpt-4" />
                                <option value="gpt-4-turbo" />
                                <option value="gpt-4o" />
                                <option value="claude-3-5-sonnet-20241022" />
                                <option value="claude-3-opus-20240229" />
                            </datalist>
                            <small className="help-text">
                                사용할 모델 ID (예: gpt-4, claude-3-5-sonnet, 재미나이·Replicate 모델명 등).
                            </small>
                        </div>
                    </div>
                    
                    <div className="section-actions">
                        <Button
                            variant="secondary"
                            size="medium"
                            onClick={handleTest}
                            disabled={testing || !configs.openaiApiKey}
                            loading={testing}
                            loadingText="테스트 중..."
                            preventDoubleClick={false}
                        >
                            {testing ? <RefreshCw size={16} className="spinning" /> : <CheckCircle size={16} />}
                            API 테스트
                        </Button>
                    </div>
                    
                    {testResult && (
                        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                            <div className="result-icon">
                                {testResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            </div>
                            <div className="result-content">
                                <strong>{testResult.message}</strong>
                                {testResult.content && (
                                    <div className="result-preview">
                                        <strong>생성된 컨텐츠:</strong>
                                        <div dangerouslySetInnerHTML={{ __html: testResult.content.content }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* 웰니스 설정 */}
                <div className="mg-v2-card config-section">
                    <div className="section-header">
                        <Database size={24} />
                        <h2>웰니스 시스템 설정</h2>
                    </div>
                    
                    <div className="config-grid">
                        <div className="config-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={configs.wellnessAutoSendEnabled}
                                    onChange={(e) => setConfigs(prev => ({ ...prev, wellnessAutoSendEnabled: e.target.checked }))}
                                />
                                자동 발송 활성화
                            </label>
                            <small className="help-text">
                                매일 지정된 시간에 웰니스 팁을 자동으로 발송합니다.
                            </small>
                        </div>
                        
                        <div className="config-item">
                            <label htmlFor="sendTime">발송 시간</label>
                            <input
                                id="sendTime"
                                type="time"
                                value={configs.wellnessSendTime}
                                onChange={(e) => setConfigs(prev => ({ ...prev, wellnessSendTime: e.target.value }))}
                                className="mg-v2-input"
                            />
                        </div>
                        
                        <div className="config-item">
                            <label htmlFor="targetRoles">대상 역할</label>
                            <input
                                id="targetRoles"
                                type="text"
                                value={configs.wellnessTargetRoles}
                                onChange={(e) => setConfigs(prev => ({ ...prev, wellnessTargetRoles: e.target.value }))}
                                placeholder="CLIENT,ROLE_CLIENT"
                                className="mg-v2-input"
                            />
                            <small className="help-text">
                                콤마로 구분하여 입력하세요.
                            </small>
                        </div>
                    </div>
                </div>
                
                {/* 저장 버튼 */}
                <div className="mg-v2-card save-section">
                    <Button
                        variant="primary"
                        size="medium"
                        onClick={handleSave}
                        disabled={saving}
                        loading={saving}
                        loadingText="저장 중..."
                        preventDoubleClick={false}
                    >
                        {saving ? <RefreshCw size={20} className="spinning" /> : <Save size={20} />}
                        {saving ? '저장 중...' : '설정 저장'}
                    </Button>
                </div>
                
            </div>
        </AdminCommonLayout>
    );
};

export default SystemConfigManagement;
