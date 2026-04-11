import React, { useState } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import MGButton from '../common/MGButton';
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
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import './IntegrationTest.css';

/**
 * 통합 테스트 컴포넌트
/**
 * 전체 시스템의 통합 동작을 검증하는 테스트 도구
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
      
      if (result.success) {
        notificationManager.show(MESSAGES.SUCCESS.FULL_TEST_COMPLETED, 'success');
      } else {
        notificationManager.show(MESSAGES.ERROR.FULL_TEST_FAILED, 'error');
      }
    } catch (error) {
      console.error('통합 테스트 실행 오류:', error);
      setTestResults({
        success: false,
        errorMessage: error.message,
        testResults: []
      });
      notificationManager.show(MESSAGES.ERROR.FULL_TEST_FAILED, 'error');
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
      
      if (result.overallStatus === 'HEALTHY') {
        notificationManager.show(MESSAGES.SUCCESS.HEALTH_CHECK_PASSED, 'success');
      } else {
        notificationManager.show(MESSAGES.ERROR.HEALTH_CHECK_FAILED, 'error');
      }
    } catch (error) {
      console.error('헬스 체크 오류:', error);
      setHealthStatus({
        overallStatus: 'UNHEALTHY',
        message: error.message
      });
      notificationManager.show(MESSAGES.ERROR.HEALTH_CHECK_FAILED, 'error');
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
      
      if (result.success) {
        notificationManager.show(MESSAGES.SUCCESS.PERFORMANCE_TEST_COMPLETED, 'success');
      } else {
        notificationManager.show(MESSAGES.ERROR.PERFORMANCE_TEST_FAILED, 'error');
      }
    } catch (error) {
      console.error('성능 테스트 오류:', error);
      setPerformanceResults({
        success: false,
        error: error.message
      });
      notificationManager.show(MESSAGES.ERROR.PERFORMANCE_TEST_FAILED, 'error');
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
      
      if (result.success) {
        notificationManager.show(MESSAGES.SUCCESS.SECURITY_TEST_COMPLETED, 'success');
      } else {
        notificationManager.show(MESSAGES.ERROR.SECURITY_TEST_FAILED, 'error');
      }
    } catch (error) {
      console.error('보안 테스트 오류:', error);
      setSecurityResults({
        success: false,
        error: error.message
      });
      notificationManager.show(MESSAGES.ERROR.SECURITY_TEST_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setHealthStatus(null);
    setPerformanceResults(null);
    setSecurityResults(null);
    notificationManager.show('결과가 초기화되었습니다.', 'info');
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
      <div className="integration-test-container">
        <div className="integration-test-header">
          <h1 style={{
            margin: 0,
            fontSize: 'var(--font-size-xxl)',
            fontWeight: '700',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: 'var(--font-size-xxxl)',
              color: 'var(--mg-primary-500)'
            }}>🔧</span>
            {PAGE_TITLES.MAIN}
          </h1>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <MGButton variant="secondary" size="medium" onClick={clearResults}>
              <span>🗑️</span>
              {BUTTON_TEXT.CLEAR_RESULTS}
            </MGButton>
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px var(--mg-shadow-light)',
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: 'var(--font-size-xxl)' }}>⚡</span>
            테스트 실행
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <MGButton
              variant="primary"
              size="medium"
              loading={loading}
              loadingText={MESSAGES.LOADING.RUNNING_TEST}
              onClick={runFullIntegrationTest}
            >
              <span>🚀</span>
              {BUTTON_TEXT.RUN_FULL_TEST}
            </MGButton>
            <MGButton
              variant="success"
              size="medium"
              loading={loading}
              loadingText={MESSAGES.LOADING.RUNNING_TEST}
              onClick={checkSystemHealth}
            >
              <span>💚</span>
              {BUTTON_TEXT.HEALTH_CHECK}
            </MGButton>
            <MGButton
              variant="secondary"
              size="medium"
              loading={loading}
              loadingText={MESSAGES.LOADING.RUNNING_TEST}
              onClick={runPerformanceTest}
            >
              <span>⚡</span>
              {BUTTON_TEXT.PERFORMANCE_TEST}
            </MGButton>
            <MGButton
              variant="danger"
              size="medium"
              loading={loading}
              loadingText={MESSAGES.LOADING.RUNNING_TEST}
              onClick={runSecurityTest}
            >
              <span>🔒</span>
              {BUTTON_TEXT.SECURITY_TEST}
            </MGButton>
          </div>
        </div>

        {/* 로딩 표시 */}
        {loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--mg-shadow-light)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            border: '1px solid #e5e7eb',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
              border: '4px solid #e5e7eb',
              borderTop: '4px solid var(--mg-primary-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <p style={{
              margin: 0,
              fontSize: 'var(--font-size-base)',
              fontWeight: '500',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
              color: '#6b7280'
            }}>{MESSAGES.LOADING.RUNNING_TEST}</p>
          </div>
        )}

        {/* 통합 테스트 결과 */}
        {testResults && (
          <div style={{
            marginBottom: '32px',
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--mg-shadow-light)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: 'var(--font-size-xxl)' }}>📊</span>
              통합 테스트 결과
            </h3>
            <div style={{
              padding: '20px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
              backgroundColor: testResults.success ? '#f0f9ff' : '#fef2f2',
              border: `2px solid ${testResults.success ? 'var(--mg-primary-500)' : 'var(--mg-error-500)'}`,
              borderRadius: '8px',
              borderLeft: `6px solid ${testResults.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)'}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                  color: '#1f2937'
                }}>{testResults.testName}</h4>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: testResults.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '600'
                }}>
                  {testResults.success ? '성공' : '실패'}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                  <strong style={{ color: '#374151' }}>시작 시간:</strong> {formatDateTime(testResults.startTime)}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                  <strong style={{ color: '#374151' }}>종료 시간:</strong> {formatDateTime(testResults.endTime)}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                  <strong style={{ color: '#374151' }}>실행 시간:</strong> {testResults.executionTimeMs}ms
                </p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280', gridColumn: '1 / -1' }}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                  <strong style={{ color: '#374151' }}>메시지:</strong> {testResults.message || testResults.errorMessage}
                </p>
              </div>
              
              {testResults.testResults && testResults.testResults.length > 0 && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                  border: '1px solid #e5e7eb'
                }}>
                  <h5 style={{
                    margin: '0 0 16px 0',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                    color: '#1f2937'
                  }}>개별 테스트 결과:</h5>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {testResults.testResults.map((result, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
                        backgroundColor: result.success ? '#f0f9ff' : '#fef2f2',
                        border: `1px solid ${result.success ? 'var(--mg-primary-500)' : 'var(--mg-error-500)'}`,
                        borderRadius: '6px',
                        borderLeft: `4px solid ${result.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)'}`
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '600',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                            color: '#1f2937'
                          }}>{result.testName}</span>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: result.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600'
                          }}>
                            {result.success ? '성공' : '실패'}
                          </span>
                        </div>
                        <div>
                          <p style={{
                            margin: '0 0 4px 0',
                            fontSize: 'var(--font-size-sm)',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
                            color: '#6b7280'
                          }}>{result.details}</p>
                          <small style={{
                            fontSize: 'var(--font-size-xs)',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9ca3af -> var(--mg-custom-9ca3af)
                            color: '#9ca3af'
                          }}>{formatDateTime(result.timestamp)}</small>
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
          <div style={{
            marginBottom: '32px',
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--mg-shadow-light)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: 'var(--font-size-xxl)' }}>💚</span>
              시스템 헬스 상태
            </h3>
            <div style={{
              padding: '20px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
              backgroundColor: healthStatus.overallStatus === 'HEALTHY' ? '#f0f9ff' : '#fef2f2',
              border: `2px solid ${healthStatus.overallStatus === 'HEALTHY' ? 'var(--mg-primary-500)' : 'var(--mg-error-500)'}`,
              borderRadius: '8px',
              borderLeft: `6px solid ${healthStatus.overallStatus === 'HEALTHY' ? 'var(--mg-success-500)' : 'var(--mg-error-500)'}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                  color: '#1f2937'
                }}>시스템 상태</h4>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: healthStatus.overallStatus === 'HEALTHY' ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '600'
                }}>
                  {healthStatus.overallStatus}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                  <strong style={{ color: '#374151' }}>확인 시간:</strong> {formatDateTime(healthStatus.timestamp)}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                  <strong style={{ color: '#374151' }}>사용자 수:</strong> {healthStatus.userCount}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280', gridColumn: '1 / -1' }}>
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                  <strong style={{ color: '#374151' }}>메시지:</strong>{' '}
                  {toDisplayString(healthStatus.message)}
                </p>
              </div>
              
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                border: '1px solid #e5e7eb'
              }}>
                <h5 style={{
                  margin: '0 0 16px 0',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '600',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                  color: '#1f2937'
                }}>서비스 상태:</h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {[
                    { name: '데이터베이스', status: healthStatus.databaseStatus },
                    { name: '사용자 서비스', status: healthStatus.userServiceStatus },
                    { name: '상담사 서비스', status: healthStatus.consultantServiceStatus },
                    { name: '내담자 서비스', status: healthStatus.clientServiceStatus },
                    { name: '스케줄 서비스', status: healthStatus.scheduleServiceStatus },
                    { name: '결제 서비스', status: healthStatus.paymentServiceStatus },
                    { name: '암호화 서비스', status: healthStatus.encryptionServiceStatus }
                  ].map((service, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'var(--mg-gray-100)',
                      borderRadius: '6px',
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                      border: '1px solid #e5e7eb'
                    }}>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                        color: '#374151'
                      }}>{toDisplayString(service.name)}:</span>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: service.status === 'HEALTHY' ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600'
                      }}>
                        {service.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 성능 테스트 결과 */}
        {performanceResults && (
          <div style={{
            marginBottom: '32px',
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--mg-shadow-light)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: 'var(--font-size-xxl)' }}>⚡</span>
              성능 테스트 결과
            </h3>
            <div style={{
              padding: '20px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
              backgroundColor: performanceResults.success ? '#f0f9ff' : '#fef2f2',
              border: `2px solid ${performanceResults.success ? 'var(--mg-primary-500)' : 'var(--mg-error-500)'}`,
              borderRadius: '8px',
              borderLeft: `6px solid ${performanceResults.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)'}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                  color: '#1f2937'
                }}>성능 측정 결과</h4>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: performanceResults.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '600'
                }}>
                  {performanceResults.success ? '완료' : '실패'}
                </span>
              </div>
              {performanceResults.success ? (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                      <strong style={{ color: '#374151' }}>평균 응답 시간:</strong> {performanceResults.averageResponseTime?.toFixed(2)}ms
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                      <strong style={{ color: '#374151' }}>최대 응답 시간:</strong> {performanceResults.maxResponseTime}ms
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                      <strong style={{ color: '#374151' }}>최소 응답 시간:</strong> {performanceResults.minResponseTime}ms
                    </p>
                  </div>
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{
                      margin: '0 0 12px 0',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                      color: '#1f2937'
                    }}>개별 응답 시간:</h5>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '8px'
                    }}>
                      {performanceResults.responseTimes?.map((time, index) => (
                        <div key={index} style={{
                          padding: '8px 12px',
                          backgroundColor: 'var(--mg-gray-100)',
                          borderRadius: '6px',
                          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                          border: '1px solid #e5e7eb',
                          fontSize: 'var(--font-size-sm)',
                          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                          color: '#374151',
                          textAlign: 'center'
                        }}>
                          테스트 {index + 1}: {time}ms
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                    <strong style={{ color: '#374151' }}>오류:</strong> {performanceResults.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 보안 테스트 결과 */}
        {securityResults && (
          <div style={{
            marginBottom: '32px',
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px var(--mg-shadow-light)',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: 'var(--font-size-xxl)' }}>🔒</span>
              보안 테스트 결과
            </h3>
            <div style={{
              padding: '20px',
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
              backgroundColor: securityResults.success ? '#f0f9ff' : '#fef2f2',
              border: `2px solid ${securityResults.success ? 'var(--mg-primary-500)' : 'var(--mg-error-500)'}`,
              borderRadius: '8px',
              borderLeft: `6px solid ${securityResults.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)'}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
                  color: '#1f2937'
                }}>보안 검증 결과</h4>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: securityResults.success ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '600'
                }}>
                  {securityResults.success ? '완료' : '실패'}
                </span>
              </div>
              {securityResults.success ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
                      <strong>암호화 작동:</strong>
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: securityResults.encryptionWorking ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600'
                    }}>
                      {securityResults.encryptionWorking ? '정상' : '오류'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
                      <strong>역할 검증:</strong>
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: securityResults.roleValidationWorking ? 'var(--mg-success-500)' : 'var(--mg-error-500)',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600'
                    }}>
                      {securityResults.roleValidationWorking ? '정상' : '오류'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
                    border: '1px solid #e5e7eb',
                    gridColumn: '1 / -1'
                  }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
                      <strong>보안 점수:</strong>
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: securityResults.securityScore >= 80 ? 'var(--mg-success-500)' : securityResults.securityScore >= 60 ? 'var(--mg-warning-500)' : 'var(--mg-error-500)',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600'
                    }}>
                      {securityResults.securityScore}/100
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
                    <strong style={{ color: '#374151' }}>오류:</strong> {securityResults.error}
                  </p>
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
