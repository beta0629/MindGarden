import React, { useState } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import { PAYMENT_TEST_CSS } from '../../constants/css';
import { API_BASE_URL } from '../../constants/api';
import { 
  PAYMENT_TEST_API,
  HTTP_METHODS,
  HTTP_HEADERS,
  DEFAULT_TEST_DATA,
  PAYMENT_METHODS,
  PAYMENT_PROVIDERS,
  TEST_SCENARIOS,
  PAYMENT_STATUSES,
  BUTTON_TEXT,
  FORM_LABELS,
  PLACEHOLDERS,
  MESSAGES,
  PAGE_TITLES,
  RESULT_TYPES,
  TEST_TYPES
} from '../../constants/paymentTest';
import './PaymentTest.css';

/**
 * 결제 테스트 컴포넌트
 * - 다양한 결제 시나리오 테스트
 * - 결제 상태 관리 테스트
 * - 통계 및 분석 테스트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
const PaymentTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [testData, setTestData] = useState({
    method: DEFAULT_TEST_DATA.METHOD,
    provider: DEFAULT_TEST_DATA.PROVIDER,
    amount: DEFAULT_TEST_DATA.AMOUNT,
    payerId: DEFAULT_TEST_DATA.PAYER_ID
  });

  const addResult = (title, success, data, error = null) => {
    const result = {
      id: Date.now(),
      title,
      success,
      data,
      error,
      timestamp: new Date().toLocaleString('ko-KR')
    };
    setResults(prev => [result, ...prev]);
  };

  const executeTest = async (testFunction, title) => {
    setLoading(true);
    try {
      const result = await testFunction();
      addResult(title, true, result);
    } catch (error) {
      addResult(title, false, null, error.message);
    } finally {
      setLoading(false);
    }
  };

  // 테스트 함수들
  const testCreatePayment = async () => {
    const paymentRequest = {
      orderId: `TEST_ORDER_${Date.now()}`,
      amount: testData.amount,
      method: testData.method,
      provider: testData.provider,
      payerId: testData.payerId,
      recipientId: DEFAULT_TEST_DATA.RECIPIENT_ID,
      branchId: DEFAULT_TEST_DATA.BRANCH_ID,
      description: `테스트 결제 - ${testData.method} ${testData.provider}`,
      timeoutMinutes: DEFAULT_TEST_DATA.TIMEOUT_MINUTES,
      successUrl: 'http://localhost:3000/payment/success',
      failUrl: 'http://localhost:3000/payment/fail',
      cancelUrl: 'http://localhost:3000/payment/cancel'
    };

    const response = await fetch(`${API_BASE_URL}${PAYMENT_TEST_API.CREATE_PAYMENT}`, {
      method: HTTP_METHODS.POST,
      headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
      },
      credentials: 'include',
      body: JSON.stringify(paymentRequest)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const testPaymentScenarios = async () => {
    const response = await fetch(`${API_BASE_URL}${PAYMENT_TEST_API.PAYMENT_SCENARIOS}`, {
      method: HTTP_METHODS.POST,
      headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const testPaymentStatus = async () => {
    const paymentId = prompt('결제 ID를 입력하세요:');
    if (!paymentId) return;
    
    const status = prompt('상태를 입력하세요 (APPROVED, CANCELLED, REFUNDED):', PAYMENT_STATUSES[0].value);
    if (!status) return;

    const response = await fetch(`${API_BASE_URL}${PAYMENT_TEST_API.PAYMENT_STATUS}/${paymentId}/status`, {
      method: HTTP_METHODS.PUT,
      headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
      },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const testWebhook = async () => {
    const paymentId = prompt('결제 ID를 입력하세요:');
    if (!paymentId) return;
    
    const status = prompt('상태를 입력하세요 (APPROVED, FAILED, CANCELLED):', PAYMENT_STATUSES[0].value);
    if (!status) return;

    const webhookData = {
      paymentId: paymentId,
      status: status,
      amount: testData.amount,
      method: testData.method,
      provider: testData.provider,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`${API_BASE_URL}${PAYMENT_TEST_API.WEBHOOK}`, {
      method: HTTP_METHODS.POST,
      headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
      },
      credentials: 'include',
      body: JSON.stringify(webhookData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const testStatistics = async () => {
    const response = await fetch(`${API_BASE_URL}${PAYMENT_TEST_API.STATISTICS}`, {
      method: HTTP_METHODS.GET,
      headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const testDepositConfirmation = async () => {
    const paymentId = prompt('결제 ID를 입력하세요:');
    if (!paymentId) return;
    
    const amount = prompt('입금 금액을 입력하세요:', '100000');
    if (!amount) return;
    
    const depositorName = prompt('입금자명을 입력하세요:', '테스트입금자');
    if (!depositorName) return;

    const response = await fetch(`${API_BASE_URL}/api/test/payment/deposit-test?paymentId=${paymentId}&amount=${amount}&depositorName=${depositorName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testCancelRefund = async () => {
    const paymentId = prompt('결제 ID를 입력하세요:');
    if (!paymentId) return;
    
    const action = prompt('액션을 선택하세요 (cancel/refund):', 'cancel');
    if (!action) return;
    
    let amount = null;
    if (action === 'refund') {
      amount = prompt('환불 금액을 입력하세요 (전체 환불은 빈칸):');
    }

    const params = new URLSearchParams({
      paymentId,
      action,
      ...(amount && { amount })
    });

    const response = await fetch(`${API_BASE_URL}/api/test/payment/cancel-refund-test?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testBulkCreate = async () => {
    const count = prompt('생성할 결제 수를 입력하세요:', '10');
    if (!count) return;

    const response = await fetch(`${API_BASE_URL}/api/test/payment/bulk-create?count=${count}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testSystemHealth = async () => {
    const response = await fetch(`${API_BASE_URL}/api/test/payment/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const clearResults = () => {
    setResults([]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  return (
    <SimpleLayout>
      <div className={PAYMENT_TEST_CSS.CONTAINER}>
        <div className={PAYMENT_TEST_CSS.HEADER}>
          <h1 className={PAYMENT_TEST_CSS.TITLE}>{PAGE_TITLES.MAIN}</h1>
          <div className={PAYMENT_TEST_CSS.BUTTON_GROUP}>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SECONDARY}`}
              onClick={clearResults}
            >
              {BUTTON_TEXT.CLEAR_RESULTS}
            </button>
          </div>
        </div>

        {/* 테스트 설정 */}
        <div className={PAYMENT_TEST_CSS.CONFIG}>
          <h3>테스트 설정</h3>
          <div className={PAYMENT_TEST_CSS.FORM}>
            <div className={PAYMENT_TEST_CSS.FORM_GROUP}>
              <label className={PAYMENT_TEST_CSS.LABEL}>{FORM_LABELS.PAYMENT_METHOD}</label>
              <select 
                className={PAYMENT_TEST_CSS.SELECT}
                value={testData.method}
                onChange={(e) => setTestData(prev => ({ ...prev, method: e.target.value }))}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={PAYMENT_TEST_CSS.FORM_GROUP}>
              <label className={PAYMENT_TEST_CSS.LABEL}>{FORM_LABELS.PAYMENT_PROVIDER}</label>
              <select 
                className={PAYMENT_TEST_CSS.SELECT}
                value={testData.provider}
                onChange={(e) => setTestData(prev => ({ ...prev, provider: e.target.value }))}
              >
                {PAYMENT_PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={PAYMENT_TEST_CSS.FORM_GROUP}>
              <label className={PAYMENT_TEST_CSS.LABEL}>{FORM_LABELS.AMOUNT}</label>
              <input
                className={PAYMENT_TEST_CSS.INPUT}
                type="number"
                value={testData.amount}
                onChange={(e) => setTestData(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
                min="1000"
                max="10000000"
                placeholder={PLACEHOLDERS.AMOUNT}
              />
            </div>
            <div className={PAYMENT_TEST_CSS.FORM_GROUP}>
              <label className={PAYMENT_TEST_CSS.LABEL}>{FORM_LABELS.PAYER_ID}</label>
              <input
                className={PAYMENT_TEST_CSS.INPUT}
                type="number"
                value={testData.payerId}
                onChange={(e) => setTestData(prev => ({ ...prev, payerId: parseInt(e.target.value) }))}
                min="1"
                placeholder={PLACEHOLDERS.PAYER_ID}
              />
            </div>
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div className={PAYMENT_TEST_CSS.BUTTON_GROUP}>
          <h3>테스트 실행</h3>
          <div className={PAYMENT_TEST_CSS.BUTTON_GROUP}>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_PRIMARY}`}
              onClick={() => executeTest(testCreatePayment, PAGE_TITLES.CREATE_PAYMENT)}
              disabled={loading}
            >
              {BUTTON_TEXT.CREATE_PAYMENT}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SECONDARY}`}
              onClick={() => executeTest(testPaymentScenarios, PAGE_TITLES.SCENARIOS)}
              disabled={loading}
            >
              {BUTTON_TEXT.SCENARIOS}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SECONDARY}`}
              onClick={() => executeTest(testPaymentStatus, PAGE_TITLES.STATUS_UPDATE)}
              disabled={loading}
            >
              {BUTTON_TEXT.STATUS_UPDATE}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SECONDARY}`}
              onClick={() => executeTest(testWebhook, PAGE_TITLES.WEBHOOK)}
              disabled={loading}
            >
              {BUTTON_TEXT.WEBHOOK_TEST}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SUCCESS}`}
              onClick={() => executeTest(testStatistics, PAGE_TITLES.STATISTICS)}
              disabled={loading}
            >
              {BUTTON_TEXT.STATISTICS}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SECONDARY}`}
              onClick={() => executeTest(testDepositConfirmation, '입금 확인 테스트')}
              disabled={loading}
            >
              {BUTTON_TEXT.DEPOSIT_CONFIRM}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_DANGER}`}
              onClick={() => executeTest(testCancelRefund, '취소/환불 테스트')}
              disabled={loading}
            >
              취소/환불
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SECONDARY}`}
              onClick={() => executeTest(testBulkCreate, '대량 데이터 생성')}
              disabled={loading}
            >
              {BUTTON_TEXT.BULK_CREATE}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SUCCESS}`}
              onClick={() => executeTest(testSystemHealth, PAGE_TITLES.HEALTH)}
              disabled={loading}
            >
              {BUTTON_TEXT.HEALTH_CHECK}
            </button>
          </div>
        </div>

        {/* 로딩 표시 */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <span>테스트 실행 중...</span>
          </div>
        )}

        {/* 테스트 결과 */}
        <div className="test-results">
          <h3>테스트 결과</h3>
          {results.length === 0 ? (
            <div className="no-results">아직 실행된 테스트가 없습니다.</div>
          ) : (
            <div className="results-list">
              {results.map((result) => (
                <div key={result.id} className={`result-item ${result.success ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <span className="result-title">{result.title}</span>
                    <span className="result-status">
                      {result.success ? '✅ 성공' : '❌ 실패'}
                    </span>
                    <span className="result-time">{result.timestamp}</span>
                  </div>
                  {result.data && (
                    <div className="result-data">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                  {result.error && (
                    <div className="result-error">
                      <strong>오류:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SimpleLayout>
  );
};

export default PaymentTest;
