import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { showNotification } from '../../utils/notification';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import './PgConfigurationForm.css';

/**
 * PG 설정 입력/수정 폼 컴포넌트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationForm = ({ 
  tenantId, 
  initialData = null, 
  onSave, 
  onCancel,
  mode = 'create' // 'create' or 'edit'
}) => {
  const { user } = useSession();
  
  // 폼 상태
  const [formData, setFormData] = useState({
    pgProvider: '',
    pgName: '',
    apiKey: '',
    secretKey: '',
    merchantId: '',
    storeId: '',
    webhookUrl: '',
    returnUrl: '',
    cancelUrl: '',
    testMode: false,
    settingsJson: '',
    notes: ''
  });
  
  // UI 상태
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // PG 제공자 옵션
  const pgProviders = [
    { value: 'TOSS', label: '토스페이먼츠' },
    { value: 'IAMPORT', label: '아임포트' },
    { value: 'KAKAO', label: '카카오페이' },
    { value: 'NAVER', label: '네이버페이' },
    { value: 'PAYPAL', label: '페이팔' },
    { value: 'STRIPE', label: '스트라이프' }
  ];
  
  // 초기 데이터 로드
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        pgProvider: initialData.pgProvider || '',
        pgName: initialData.pgName || '',
        apiKey: '', // 보안상 빈 값으로 시작
        secretKey: '', // 보안상 빈 값으로 시작
        merchantId: initialData.merchantId || '',
        storeId: initialData.storeId || '',
        webhookUrl: initialData.webhookUrl || '',
        returnUrl: initialData.returnUrl || '',
        cancelUrl: initialData.cancelUrl || '',
        testMode: initialData.testMode || false,
        settingsJson: initialData.settingsJson || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData, mode]);
  
  // 필드 변경 핸들러
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 터치 상태 업데이트
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // 유효성 검사
  const validate = () => {
    const newErrors = {};
    
    if (!formData.pgProvider) {
      newErrors.pgProvider = 'PG사를 선택해주세요.';
    }
    
    if (!formData.apiKey) {
      newErrors.apiKey = 'API Key를 입력해주세요.';
    }
    
    if (!formData.secretKey) {
      newErrors.secretKey = 'Secret Key를 입력해주세요.';
    }
    
    if (formData.pgName && formData.pgName.length > 255) {
      newErrors.pgName = 'PG사 명칭은 255자 이하여야 합니다.';
    }
    
    if (formData.webhookUrl && formData.webhookUrl.length > 500) {
      newErrors.webhookUrl = 'Webhook URL은 500자 이하여야 합니다.';
    }
    
    if (formData.returnUrl && formData.returnUrl.length > 500) {
      newErrors.returnUrl = 'Return URL은 500자 이하여야 합니다.';
    }
    
    if (formData.cancelUrl && formData.cancelUrl.length > 500) {
      newErrors.cancelUrl = 'Cancel URL은 500자 이하여야 합니다.';
    }
    
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = '비고는 1000자 이하여야 합니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showNotification('입력한 정보를 확인해주세요.', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSave(formData);
      if (mode === 'create') {
        showNotification('PG 설정이 등록되었습니다. 운영 포털에서 승인 절차를 진행합니다.', 'success');
      } else {
        showNotification('PG 설정이 수정되었습니다. 다시 승인 절차를 진행합니다.', 'success');
      }
    } catch (error) {
      console.error('PG 설정 저장 실패:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'PG 설정 저장 중 오류가 발생했습니다.';
      showNotification(errorMessage, 'error');
      
      // 필드별 에러 메시지 처리
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.field) {
            fieldErrors[err.field] = err.message;
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...fieldErrors }));
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 필드 에러 표시
  const getFieldError = (field) => {
    if (errors[field] && touched[field]) {
      return errors[field];
    }
    return null;
  };
  
  return (
    <form className="pg-config-form" onSubmit={handleSubmit}>
      <div className="pg-config-form-header">
        <h2>
          <CreditCard size={24} />
          {mode === 'create' ? 'PG 설정 등록' : 'PG 설정 수정'}
        </h2>
        <p className="form-description">
          결제 게이트웨이 설정 정보를 입력해주세요. 입력한 정보는 암호화되어 저장되며, 승인 후 사용 가능합니다.
        </p>
        {mode === 'create' && (
          <div className="form-info-box">
            <Info size={18} />
            <div>
              <strong>안내사항</strong>
              <ul>
                <li>등록한 PG 설정은 운영 포털에서 승인 절차를 거칩니다.</li>
                <li>승인 대기 중에는 수정 및 삭제가 가능합니다.</li>
                <li>승인 완료 후에는 수정이 제한됩니다.</li>
              </ul>
            </div>
          </div>
        )}
        {mode === 'edit' && initialData?.approvalStatus === 'PENDING' && (
          <div className="form-warning-box">
            <AlertCircle size={18} />
            <div>
              <strong>수정 안내</strong>
              <p>승인 대기 중인 설정만 수정할 수 있습니다. 수정 후 다시 승인 절차를 거칩니다.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="pg-config-form-body">
        {/* PG 제공자 선택 */}
        <div className="form-group">
          <label htmlFor="pgProvider" className="required">
            PG사 <span className="required-mark">*</span>
          </label>
          <select
            id="pgProvider"
            value={formData.pgProvider}
            onChange={(e) => handleChange('pgProvider', e.target.value)}
            className={`form-select ${getFieldError('pgProvider') ? 'error' : ''}`}
            disabled={mode === 'edit'}
          >
            <option value="">PG사를 선택하세요</option>
            {pgProviders.map(provider => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
          {getFieldError('pgProvider') && (
            <span id="pgProvider-error" className="error-message" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              {getFieldError('pgProvider')}
            </span>
          )}
        </div>
        
        {/* PG사 명칭 */}
        <div className="form-group">
          <label htmlFor="pgName">PG사 명칭 (선택)</label>
          <input
            id="pgName"
            type="text"
            value={formData.pgName}
            onChange={(e) => handleChange('pgName', e.target.value)}
            placeholder="예: 토스페이먼츠 테스트"
            className={`form-input ${getFieldError('pgName') ? 'error' : ''}`}
            maxLength={255}
          />
          {getFieldError('pgName') && (
            <span className="error-message">
              <AlertCircle size={14} />
              {getFieldError('pgName')}
            </span>
          )}
        </div>
        
        {/* API Key */}
        <div className="form-group">
          <label htmlFor="apiKey" className="required">
            API Key <span className="required-mark">*</span>
          </label>
          <div className="input-with-icon">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="API Key를 입력하세요"
              className={`form-input ${getFieldError('apiKey') ? 'error' : ''}`}
              required
              aria-required="true"
              aria-invalid={getFieldError('apiKey') ? 'true' : 'false'}
              aria-describedby={getFieldError('apiKey') ? 'apiKey-error' : 'apiKey-help'}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="icon-button"
              aria-label={showApiKey ? 'API Key 숨기기' : 'API Key 보기'}
            >
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {getFieldError('apiKey') && (
            <span id="apiKey-error" className="error-message" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              {getFieldError('apiKey')}
            </span>
          )}
          <small id="apiKey-help" className="help-text">
            <Info size={14} aria-hidden="true" />
            API Key는 암호화되어 저장됩니다.
          </small>
        </div>
        
        {/* Secret Key */}
        <div className="form-group">
          <label htmlFor="secretKey" className="required">
            Secret Key <span className="required-mark">*</span>
          </label>
          <div className="input-with-icon">
            <input
              id="secretKey"
              type={showSecretKey ? 'text' : 'password'}
              value={formData.secretKey}
              onChange={(e) => handleChange('secretKey', e.target.value)}
              placeholder="Secret Key를 입력하세요"
              className={`form-input ${getFieldError('secretKey') ? 'error' : ''}`}
              required
              aria-required="true"
              aria-invalid={getFieldError('secretKey') ? 'true' : 'false'}
              aria-describedby={getFieldError('secretKey') ? 'secretKey-error' : 'secretKey-help'}
            />
            <button
              type="button"
              onClick={() => setShowSecretKey(!showSecretKey)}
              className="icon-button"
              aria-label={showSecretKey ? 'Secret Key 숨기기' : 'Secret Key 보기'}
            >
              {showSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {getFieldError('secretKey') && (
            <span id="secretKey-error" className="error-message" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              {getFieldError('secretKey')}
            </span>
          )}
          <small id="secretKey-help" className="help-text">
            <Info size={14} aria-hidden="true" />
            Secret Key는 암호화되어 저장됩니다.
          </small>
        </div>
        
        {/* Merchant ID */}
        <div className="form-group">
          <label htmlFor="merchantId">Merchant ID (선택)</label>
          <input
            id="merchantId"
            type="text"
            value={formData.merchantId}
            onChange={(e) => handleChange('merchantId', e.target.value)}
            placeholder="Merchant ID를 입력하세요"
            className="form-input"
            maxLength={255}
          />
        </div>
        
        {/* Store ID */}
        <div className="form-group">
          <label htmlFor="storeId">Store ID (선택)</label>
          <input
            id="storeId"
            type="text"
            value={formData.storeId}
            onChange={(e) => handleChange('storeId', e.target.value)}
            placeholder="Store ID를 입력하세요"
            className="form-input"
            maxLength={255}
          />
        </div>
        
        {/* Webhook URL */}
        <div className="form-group">
          <label htmlFor="webhookUrl">Webhook URL (선택)</label>
          <input
            id="webhookUrl"
            type="url"
            value={formData.webhookUrl}
            onChange={(e) => handleChange('webhookUrl', e.target.value)}
            placeholder="https://example.com/webhook"
            className={`form-input ${getFieldError('webhookUrl') ? 'error' : ''}`}
            maxLength={500}
          />
          {getFieldError('webhookUrl') && (
            <span className="error-message">
              <AlertCircle size={14} />
              {getFieldError('webhookUrl')}
            </span>
          )}
        </div>
        
        {/* Return URL */}
        <div className="form-group">
          <label htmlFor="returnUrl">Return URL (선택)</label>
          <input
            id="returnUrl"
            type="url"
            value={formData.returnUrl}
            onChange={(e) => handleChange('returnUrl', e.target.value)}
            placeholder="https://example.com/return"
            className={`form-input ${getFieldError('returnUrl') ? 'error' : ''}`}
            maxLength={500}
          />
          {getFieldError('returnUrl') && (
            <span className="error-message">
              <AlertCircle size={14} />
              {getFieldError('returnUrl')}
            </span>
          )}
        </div>
        
        {/* Cancel URL */}
        <div className="form-group">
          <label htmlFor="cancelUrl">Cancel URL (선택)</label>
          <input
            id="cancelUrl"
            type="url"
            value={formData.cancelUrl}
            onChange={(e) => handleChange('cancelUrl', e.target.value)}
            placeholder="https://example.com/cancel"
            className={`form-input ${getFieldError('cancelUrl') ? 'error' : ''}`}
            maxLength={500}
          />
          {getFieldError('cancelUrl') && (
            <span className="error-message">
              <AlertCircle size={14} />
              {getFieldError('cancelUrl')}
            </span>
          )}
        </div>
        
        {/* 테스트 모드 */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.testMode}
              onChange={(e) => handleChange('testMode', e.target.checked)}
              className="form-checkbox"
            />
            <span>테스트 모드</span>
          </label>
          <small className="help-text">
            <Info size={14} />
            테스트 모드에서는 실제 결제가 발생하지 않습니다.
          </small>
        </div>
        
        {/* 비고 */}
        <div className="form-group">
          <label htmlFor="notes">비고 (선택)</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="추가 정보나 메모를 입력하세요"
            className={`form-textarea ${getFieldError('notes') ? 'error' : ''}`}
            rows="4"
            maxLength={1000}
          />
          <small className="char-count">
            {formData.notes.length} / 1000
          </small>
          {getFieldError('notes') && (
            <span className="error-message">
              <AlertCircle size={14} />
              {getFieldError('notes')}
            </span>
          )}
        </div>
      </div>
      
      <div className="pg-config-form-footer">
        <MGButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          <X size={18} />
          취소
        </MGButton>
        <MGButton
          type="submit"
          variant="primary"
          disabled={loading}
          aria-label={mode === 'create' ? 'PG 설정 등록' : 'PG 설정 수정'}
        >
          {loading ? (
            <>
              <UnifiedLoading size="small" />
              <span aria-live="polite" className="sr-only">저장 중...</span>
            </>
          ) : (
            <>
              <Save size={18} aria-hidden="true" />
              {mode === 'create' ? '등록' : '수정'}
            </>
          )}
        </MGButton>
      </div>
    </form>
  );
};

export default PgConfigurationForm;

