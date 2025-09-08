import React, { useState } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
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
    method: 'CARD',
    provider: 'TOSS',
    amount: 100000,
    payerId: 1
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
    const response = await fetch('/api/test/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testData)
    });
    return await response.json();
  };

  const testPaymentScenarios = async () => {
    const response = await fetch('/api/test/payment/scenarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testPaymentStatus = async () => {
    const paymentId = prompt('결제 ID를 입력하세요:');
    if (!paymentId) return;
    
    const status = prompt('상태를 입력하세요 (APPROVED, CANCELLED, REFUNDED):', 'APPROVED');
    if (!status) return;

    const response = await fetch(`/api/test/payment/status-test?paymentId=${paymentId}&status=${status}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testWebhook = async () => {
    const paymentId = prompt('결제 ID를 입력하세요:');
    if (!paymentId) return;
    
    const status = prompt('상태를 입력하세요 (APPROVED, FAILED, CANCELLED):', 'APPROVED');
    if (!status) return;

    const response = await fetch(`/api/test/payment/webhook-test?paymentId=${paymentId}&status=${status}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testStatistics = async () => {
    const response = await fetch('/api/test/payment/statistics-test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testDepositConfirmation = async () => {
    const paymentId = prompt('결제 ID를 입력하세요:');
    if (!paymentId) return;
    
    const amount = prompt('입금 금액을 입력하세요:', '100000');
    if (!amount) return;
    
    const depositorName = prompt('입금자명을 입력하세요:', '테스트입금자');
    if (!depositorName) return;

    const response = await fetch(`/api/test/payment/deposit-test?paymentId=${paymentId}&amount=${amount}&depositorName=${depositorName}`, {
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

    const response = await fetch(`/api/test/payment/cancel-refund-test?${params}`, {
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

    const response = await fetch(`/api/test/payment/bulk-create?count=${count}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    return await response.json();
  };

  const testSystemHealth = async () => {
    const response = await fetch('/api/test/payment/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
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
      <div className="payment-test">
        <div className="test-header">
          <h1>결제 시스템 테스트</h1>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={clearResults}
            >
              결과 초기화
            </button>
          </div>
        </div>

        {/* 테스트 설정 */}
        <div className="test-config">
          <h3>테스트 설정</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>결제 방법</label>
              <select 
                value={testData.method}
                onChange={(e) => setTestData(prev => ({ ...prev, method: e.target.value }))}
              >
                <option value="CARD">카드</option>
                <option value="BANK_TRANSFER">계좌이체</option>
                <option value="VIRTUAL_ACCOUNT">가상계좌</option>
                <option value="MOBILE">모바일결제</option>
                <option value="CASH">현금</option>
              </select>
            </div>
            <div className="config-item">
              <label>결제 대행사</label>
              <select 
                value={testData.provider}
                onChange={(e) => setTestData(prev => ({ ...prev, provider: e.target.value }))}
              >
                <option value="TOSS">토스페이먼츠</option>
                <option value="IAMPORT">아임포트</option>
                <option value="KAKAO">카카오페이</option>
                <option value="NAVER">네이버페이</option>
                <option value="PAYPAL">페이팔</option>
              </select>
            </div>
            <div className="config-item">
              <label>결제 금액</label>
              <input
                type="number"
                value={testData.amount}
                onChange={(e) => setTestData(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
                min="1000"
                max="10000000"
              />
            </div>
            <div className="config-item">
              <label>결제자 ID</label>
              <input
                type="number"
                value={testData.payerId}
                onChange={(e) => setTestData(prev => ({ ...prev, payerId: parseInt(e.target.value) }))}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div className="test-buttons">
          <h3>테스트 실행</h3>
          <div className="button-grid">
            <button 
              className="btn btn-primary"
              onClick={() => executeTest(testCreatePayment, '결제 생성 테스트')}
              disabled={loading}
            >
              결제 생성
            </button>
            <button 
              className="btn btn-info"
              onClick={() => executeTest(testPaymentScenarios, '결제 시나리오 테스트')}
              disabled={loading}
            >
              시나리오 테스트
            </button>
            <button 
              className="btn btn-warning"
              onClick={() => executeTest(testPaymentStatus, '결제 상태 변경 테스트')}
              disabled={loading}
            >
              상태 변경
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => executeTest(testWebhook, 'Webhook 테스트')}
              disabled={loading}
            >
              Webhook 테스트
            </button>
            <button 
              className="btn btn-success"
              onClick={() => executeTest(testStatistics, '통계 테스트')}
              disabled={loading}
            >
              통계 조회
            </button>
            <button 
              className="btn btn-info"
              onClick={() => executeTest(testDepositConfirmation, '입금 확인 테스트')}
              disabled={loading}
            >
              입금 확인
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => executeTest(testCancelRefund, '취소/환불 테스트')}
              disabled={loading}
            >
              취소/환불
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => executeTest(testBulkCreate, '대량 데이터 생성')}
              disabled={loading}
            >
              대량 생성
            </button>
            <button 
              className="btn btn-success"
              onClick={() => executeTest(testSystemHealth, '시스템 상태 확인')}
              disabled={loading}
            >
              시스템 상태
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
