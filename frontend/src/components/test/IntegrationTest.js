import React, { useState } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import { PAYMENT_TEST_CSS } from '../../constants/css';
import { API_BASE_URL } from '../../constants/api';
import { 
  INTEGRATION_TEST_API,
  HTTP_METHODS,
  HTTP_HEADERS,
  BUTTON_TEXT,
  PAGE_TITLES,
  MESSAGES,
  TEST_TYPES
} from '../../constants/integrationTest';
import './IntegrationTest.css';

/**
 * 통합 테스트 컴포넌트
 * 전체 시스템의 통합 동작을 검증하는 테스트 도구
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
const IntegrationTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [performanceResults, setPerformanceResults] = useState(null);
  const [securityResults, setSecurityResults] = useState(null);

  const runFullIntegrationTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${INTEGRATION_TEST_API.RUN_FULL_TEST}`, {
        method: HTTP_METHODS.POST,
        headers: {
          [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      console.error('통합 테스트 실행 오류:', error);
      setTestResults({
        success: false,
        errorMessage: error.message,
        testResults: []
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${INTEGRATION_TEST_API.HEALTH_CHECK}`, {
        method: HTTP_METHODS.GET,
        headers: {
          [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setHealthStatus(result);
    } catch (error) {
      console.error('헬스 체크 오류:', error);
      setHealthStatus({
        overallStatus: 'UNHEALTHY',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const runPerformanceTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${INTEGRATION_TEST_API.PERFORMANCE_TEST}`, {
        method: HTTP_METHODS.POST,
        headers: {
          [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setPerformanceResults(result);
    } catch (error) {
      console.error('성능 테스트 오류:', error);
      setPerformanceResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const runSecurityTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${INTEGRATION_TEST_API.SECURITY_TEST}`, {
        method: HTTP_METHODS.POST,
        headers: {
          [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setSecurityResults(result);
    } catch (error) {
      console.error('보안 테스트 오류:', error);
      setSecurityResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setHealthStatus(null);
    setPerformanceResults(null);
    setSecurityResults(null);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleString('ko-KR');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OK':
      case 'HEALTHY':
        return 'badge-success';
      case 'WARNING':
        return 'badge-warning';
      case 'ERROR':
      case 'UNHEALTHY':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
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

        {/* 테스트 버튼들 */}
        <div className={PAYMENT_TEST_CSS.BUTTON_GROUP}>
          <h3>테스트 실행</h3>
          <div className={PAYMENT_TEST_CSS.BUTTON_GROUP}>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_PRIMARY}`}
              onClick={runFullIntegrationTest}
              disabled={loading}
            >
              {BUTTON_TEXT.RUN_FULL_TEST}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SUCCESS}`}
              onClick={checkSystemHealth}
              disabled={loading}
            >
              {BUTTON_TEXT.HEALTH_CHECK}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_SECONDARY}`}
              onClick={runPerformanceTest}
              disabled={loading}
            >
              {BUTTON_TEXT.PERFORMANCE_TEST}
            </button>
            <button 
              className={`${PAYMENT_TEST_CSS.BUTTON} ${PAYMENT_TEST_CSS.BUTTON_DANGER}`}
              onClick={runSecurityTest}
              disabled={loading}
            >
              {BUTTON_TEXT.SECURITY_TEST}
            </button>
          </div>
        </div>

        {/* 로딩 표시 */}
        {loading && (
          <div className={PAYMENT_TEST_CSS.LOADING}>
            <div className="spinner"></div>
            <p>{MESSAGES.LOADING.RUNNING_TEST}</p>
          </div>
        )}

        {/* 통합 테스트 결과 */}
        {testResults && (
          <div className="test-results">
            <h3>통합 테스트 결과</h3>
            <div className={`result-card ${testResults.success ? 'success' : 'error'}`}>
              <div className="result-header">
                <h4>{testResults.testName}</h4>
                <span className={`badge ${testResults.success ? 'badge-success' : 'badge-danger'}`}>
                  {testResults.success ? '성공' : '실패'}
                </span>
              </div>
              <div className="result-details">
                <p><strong>시작 시간:</strong> {formatDateTime(testResults.startTime)}</p>
                <p><strong>종료 시간:</strong> {formatDateTime(testResults.endTime)}</p>
                <p><strong>실행 시간:</strong> {testResults.executionTimeMs}ms</p>
                <p><strong>메시지:</strong> {testResults.message || testResults.errorMessage}</p>
              </div>
              
              {testResults.testResults && testResults.testResults.length > 0 && (
                <div className="test-details">
                  <h5>개별 테스트 결과:</h5>
                  <div className="test-list">
                    {testResults.testResults.map((result, index) => (
                      <div key={index} className={`test-item ${result.success ? 'success' : 'error'}`}>
                        <div className="test-item-header">
                          <span className="test-name">{result.testName}</span>
                          <span className={`badge ${result.success ? 'badge-success' : 'badge-danger'}`}>
                            {result.success ? '성공' : '실패'}
                          </span>
                        </div>
                        <div className="test-details-text">
                          <p>{result.details}</p>
                          <small>{formatDateTime(result.timestamp)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 시스템 헬스 상태 */}
        {healthStatus && (
          <div className="test-results">
            <h3>시스템 헬스 상태</h3>
            <div className={`result-card ${healthStatus.overallStatus === 'HEALTHY' ? 'success' : 'error'}`}>
              <div className="result-header">
                <h4>시스템 상태</h4>
                <span className={`badge ${getStatusBadgeClass(healthStatus.overallStatus)}`}>
                  {healthStatus.overallStatus}
                </span>
              </div>
              <div className="result-details">
                <p><strong>확인 시간:</strong> {formatDateTime(healthStatus.timestamp)}</p>
                <p><strong>사용자 수:</strong> {healthStatus.userCount}</p>
                <p><strong>메시지:</strong> {healthStatus.message}</p>
              </div>
              
              <div className="service-status">
                <h5>서비스 상태:</h5>
                <div className="status-grid">
                  <div className="status-item">
                    <span>데이터베이스:</span>
                    <span className={`badge ${getStatusBadgeClass(healthStatus.databaseStatus)}`}>
                      {healthStatus.databaseStatus}
                    </span>
                  </div>
                  <div className="status-item">
                    <span>사용자 서비스:</span>
                    <span className={`badge ${getStatusBadgeClass(healthStatus.userServiceStatus)}`}>
                      {healthStatus.userServiceStatus}
                    </span>
                  </div>
                  <div className="status-item">
                    <span>상담사 서비스:</span>
                    <span className={`badge ${getStatusBadgeClass(healthStatus.consultantServiceStatus)}`}>
                      {healthStatus.consultantServiceStatus}
                    </span>
                  </div>
                  <div className="status-item">
                    <span>내담자 서비스:</span>
                    <span className={`badge ${getStatusBadgeClass(healthStatus.clientServiceStatus)}`}>
                      {healthStatus.clientServiceStatus}
                    </span>
                  </div>
                  <div className="status-item">
                    <span>스케줄 서비스:</span>
                    <span className={`badge ${getStatusBadgeClass(healthStatus.scheduleServiceStatus)}`}>
                      {healthStatus.scheduleServiceStatus}
                    </span>
                  </div>
                  <div className="status-item">
                    <span>결제 서비스:</span>
                    <span className={`badge ${getStatusBadgeClass(healthStatus.paymentServiceStatus)}`}>
                      {healthStatus.paymentServiceStatus}
                    </span>
                  </div>
                  <div className="status-item">
                    <span>암호화 서비스:</span>
                    <span className={`badge ${getStatusBadgeClass(healthStatus.encryptionServiceStatus)}`}>
                      {healthStatus.encryptionServiceStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 성능 테스트 결과 */}
        {performanceResults && (
          <div className="test-results">
            <h3>성능 테스트 결과</h3>
            <div className={`result-card ${performanceResults.success ? 'success' : 'error'}`}>
              <div className="result-header">
                <h4>성능 측정 결과</h4>
                <span className={`badge ${performanceResults.success ? 'badge-success' : 'badge-danger'}`}>
                  {performanceResults.success ? '완료' : '실패'}
                </span>
              </div>
              {performanceResults.success ? (
                <div className="result-details">
                  <p><strong>평균 응답 시간:</strong> {performanceResults.averageResponseTime?.toFixed(2)}ms</p>
                  <p><strong>최대 응답 시간:</strong> {performanceResults.maxResponseTime}ms</p>
                  <p><strong>최소 응답 시간:</strong> {performanceResults.minResponseTime}ms</p>
                  <div className="response-times">
                    <h5>개별 응답 시간:</h5>
                    <ul>
                      {performanceResults.responseTimes?.map((time, index) => (
                        <li key={index}>테스트 {index + 1}: {time}ms</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="result-details">
                  <p><strong>오류:</strong> {performanceResults.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 보안 테스트 결과 */}
        {securityResults && (
          <div className="test-results">
            <h3>보안 테스트 결과</h3>
            <div className={`result-card ${securityResults.success ? 'success' : 'error'}`}>
              <div className="result-header">
                <h4>보안 검증 결과</h4>
                <span className={`badge ${securityResults.success ? 'badge-success' : 'badge-danger'}`}>
                  {securityResults.success ? '완료' : '실패'}
                </span>
              </div>
              {securityResults.success ? (
                <div className="result-details">
                  <p><strong>암호화 작동:</strong> 
                    <span className={`badge ${securityResults.encryptionWorking ? 'badge-success' : 'badge-danger'}`}>
                      {securityResults.encryptionWorking ? '정상' : '오류'}
                    </span>
                  </p>
                  <p><strong>역할 검증:</strong> 
                    <span className={`badge ${securityResults.roleValidationWorking ? 'badge-success' : 'badge-danger'}`}>
                      {securityResults.roleValidationWorking ? '정상' : '오류'}
                    </span>
                  </p>
                  <p><strong>보안 점수:</strong> {securityResults.securityScore}/100</p>
                </div>
              ) : (
                <div className="result-details">
                  <p><strong>오류:</strong> {securityResults.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default IntegrationTest;
