import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedNotification from '../common/UnifiedNotification';
import {
  getOnboardingRequests,
  getOnboardingRequestDetail,
  formatDate,
  getOnboardingStatusCodes,
  getRiskLevelCodes,
  convertCodesToMap,
  convertCodesToOptions
} from '../../utils/onboardingService';
import {
  DEFAULT_RISK_LEVEL,
  DEFAULT_COLORS,
  DEFAULT_BG_COLORS,
  MESSAGES,
  CODE_GROUPS
} from '../../constants/onboarding';
import './OnboardingStatus.css';

/**
 * 온보딩 상태 조회 페이지
 * 온보딩 요청 상태를 조회하는 컴포넌트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
const OnboardingStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusCodes, setStatusCodes] = useState([]);
  const [statusCodesMap, setStatusCodesMap] = useState({});
  const [riskLevelCodesMap, setRiskLevelCodesMap] = useState({});

  // 상태 옵션 (동적으로 생성)
  const statusOptions = [
    { value: '', label: MESSAGES.ALL },
    ...statusCodes.map(code => ({
      value: code.value,
      label: code.label
    }))
  ];

  // 공통 코드 로드
  useEffect(() => {
    loadCommonCodes();
  }, []);

  // 요청 목록 로드
  useEffect(() => {
    if (!loadingCodes) {
      loadRequests();
    }
  }, [selectedStatus, loadingCodes]);

  const loadCommonCodes = async () => {
    try {
      setLoadingCodes(true);
      
      // 온보딩 상태 코드 로드
      const statusCodesData = await getOnboardingStatusCodes();
      const statusOptions = convertCodesToOptions(statusCodesData);
      setStatusCodes(statusOptions);
      
      const statusMap = convertCodesToMap(statusCodesData);
      setStatusCodesMap(statusMap);
      
      // 위험도 코드 로드
      const riskLevelCodesData = await getRiskLevelCodes();
      const riskLevelMap = convertCodesToMap(riskLevelCodesData);
      setRiskLevelCodesMap(riskLevelMap);
    } catch (err) {
      console.error('공통 코드 로드 실패:', err);
      // 에러는 조용히 처리 (기본값 사용)
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestsData = await getOnboardingRequests(selectedStatus || null);
      setRequests(requestsData);
    } catch (err) {
      console.error('온보딩 요청 목록 조회 실패:', err);
      const errorMessage = err.message || MESSAGES.LOAD_ERROR;
      setError(errorMessage);
      UnifiedNotification.show({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (id) => {
    try {
      const detail = await getOnboardingRequestDetail(id);
      setSelectedRequest(detail);
      setShowDetail(true);
    } catch (err) {
      console.error('온보딩 요청 상세 조회 실패:', err);
      UnifiedNotification.show({
        type: 'error',
        message: MESSAGES.DETAIL_LOAD_ERROR,
        duration: 5000
      });
    }
  };

  const getRiskLevelClass = (riskLevel) => {
    const level = (riskLevel || DEFAULT_RISK_LEVEL).toLowerCase();
    return `onboarding-status__risk-badge onboarding-status__risk-badge--${level}`;
  };

  const getStatusColor = (status) => {
    // 공통 코드에서 색상 정보를 가져오거나 기본 색상 사용
    if (statusCodesMap[status] && statusCodesMap[status].color) {
      return statusCodesMap[status].color;
    }
    // 기본 색상 매핑
    const defaultColorMap = {
      'PENDING': DEFAULT_COLORS.PENDING,
      'IN_REVIEW': DEFAULT_COLORS.IN_REVIEW,
      'APPROVED': DEFAULT_COLORS.APPROVED,
      'REJECTED': DEFAULT_COLORS.REJECTED,
      'ON_HOLD': DEFAULT_COLORS.ON_HOLD
    };
    return defaultColorMap[status] || DEFAULT_COLORS.ON_HOLD;
  };

  const getStatusLabel = (status) => {
    if (statusCodesMap[status]) {
      return statusCodesMap[status].nameKo || statusCodesMap[status].nameEn || status;
    }
    return status;
  };

  const getRiskLevelLabel = (riskLevel) => {
    const level = riskLevel || DEFAULT_RISK_LEVEL;
    if (riskLevelCodesMap[level]) {
      return riskLevelCodesMap[level].nameKo || riskLevelCodesMap[level].nameEn || level;
    }
    return level;
  };

  return (
    <div className="onboarding-status">
      <div className="onboarding-status__container">
        <div className="onboarding-status__header">
          <h1 className="onboarding-status__title">온보딩 요청 현황</h1>
          <button
            onClick={() => navigate('/onboarding/request')}
            className="onboarding-status__button onboarding-status__button--primary"
          >
            {MESSAGES.NEW_REQUEST}
          </button>
        </div>

        <div className="onboarding-status__filters">
          <label htmlFor="statusFilter" className="onboarding-status__filter-label">
            {MESSAGES.STATUS_FILTER}
          </label>
          <select
            id="statusFilter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="onboarding-status__filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="onboarding-status__error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="onboarding-status__loading">
            {MESSAGES.LOADING}
          </div>
        ) : requests.length === 0 ? (
          <div className="onboarding-status__empty">
            {MESSAGES.NO_REQUESTS}
          </div>
        ) : (
          <div className="onboarding-status__table-wrapper">
            <table className="onboarding-status__table">
              <thead>
                <tr>
                  <th>회사명</th>
                  <th>업종</th>
                  <th>요청자</th>
                  <th>위험도</th>
                  <th>상태</th>
                  <th>요청일시</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="onboarding-status__primary-text">
                        {request.tenantName}
                      </div>
                      {request.tenantId && (
                        <div className="onboarding-status__secondary-text">
                          {request.tenantId}
                        </div>
                      )}
                    </td>
                    <td>{request.businessType || '-'}</td>
                    <td>{request.requestedBy || '-'}</td>
                    <td>
                      <span className={getRiskLevelClass(request.riskLevel)}>
                        {getRiskLevelLabel(request.riskLevel)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="onboarding-status__status-badge"
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => loadRequestDetail(request.id)}
                        className="onboarding-status__detail-button"
                      >
                        {MESSAGES.DETAIL}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showDetail && selectedRequest && (
          <div className="onboarding-status__modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="onboarding-status__modal" onClick={(e) => e.stopPropagation()}>
              <div className="onboarding-status__modal-header">
                <h2>온보딩 요청 상세</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="onboarding-status__modal-close"
                >
                  ×
                </button>
              </div>
              <div className="onboarding-status__modal-body">
                <div className="onboarding-status__detail-field">
                  <label>회사명:</label>
                  <div>{selectedRequest.tenantName}</div>
                </div>
                <div className="onboarding-status__detail-field">
                  <label>업종:</label>
                  <div>{selectedRequest.businessType || '-'}</div>
                </div>
                <div className="onboarding-status__detail-field">
                  <label>요청자:</label>
                  <div>{selectedRequest.requestedBy || '-'}</div>
                </div>
                <div className="onboarding-status__detail-field">
                  <label>위험도:</label>
                  <div>
                    <span className={getRiskLevelClass(selectedRequest.riskLevel)}>
                      {getRiskLevelLabel(selectedRequest.riskLevel)}
                    </span>
                  </div>
                </div>
                <div className="onboarding-status__detail-field">
                  <label>상태:</label>
                  <div>
                    <span
                      className="onboarding-status__status-badge"
                      style={{ backgroundColor: getStatusColor(selectedRequest.status) }}
                    >
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                  </div>
                </div>
                <div className="onboarding-status__detail-field">
                  <label>요청일시:</label>
                  <div>{formatDate(selectedRequest.createdAt)}</div>
                </div>
                {selectedRequest.note && (
                  <div className="onboarding-status__detail-field">
                    <label>비고:</label>
                    <div>{selectedRequest.note}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingStatus;
