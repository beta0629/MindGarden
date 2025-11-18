import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { getTenantErds } from '../../utils/erdApi';
import './ErdListPage.css';

/**
 * 테넌트 포털 ERD 목록 페이지
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const ErdListPage = () => {
  const { user, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  
  const [erds, setErds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, tenant, public

  useEffect(() => {
    if (!sessionLoading && user) {
      loadErds();
    }
  }, [sessionLoading, user, filter]);

  /**
   * ERD 목록 로드
   */
  const loadErds = async () => {
    try {
      setLoading(true);
      setError(null);

      // 테넌트 ID 가져오기 (세션에서 또는 user 객체에서)
      const tenantId = user?.tenantId || user?.branchCode || 'default';
      
      const erdList = await getTenantErds(tenantId);
      
      // 필터 적용
      let filteredErds = erdList;
      if (filter === 'tenant') {
        filteredErds = erdList.filter(erd => erd.tenantId === tenantId);
      } else if (filter === 'public') {
        filteredErds = erdList.filter(erd => erd.isPublic === true);
      }
      
      setErds(filteredErds);
    } catch (err) {
      console.error('ERD 목록 로드 실패:', err);
      setError('ERD 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ERD 상세 페이지로 이동
   */
  const handleErdClick = (diagramId) => {
    const tenantId = user?.tenantId || user?.branchCode || 'default';
    navigate(`/tenant/erd/${diagramId}`, { 
      state: { tenantId } 
    });
  };

  /**
   * ERD 타입 한글 변환
   */
  const getDiagramTypeLabel = (type) => {
    const typeMap = {
      'FULL': '전체 시스템',
      'MODULE': '모듈별',
      'CUSTOM': '커스텀',
      'TENANT': '테넌트별'
    };
    return typeMap[type] || type;
  };

  /**
   * ERD 상태 뱃지 스타일
   */
  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'erd-status-active' : 'erd-status-inactive';
  };

  if (sessionLoading || loading) {
    return (
      <div className="erd-list-page">
        <div className="erd-loading">
          <div className="loading-spinner"></div>
          <p>ERD 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="erd-list-page">
        <div className="erd-error">
          <p className="error-message">{error}</p>
          <button onClick={loadErds} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="erd-list-page">
      <div className="erd-list-header">
        <h1 className="erd-list-title">ERD 목록</h1>
        <p className="erd-list-description">
          데이터베이스 구조를 시각화한 ERD 다이어그램을 확인할 수 있습니다.
        </p>
      </div>

      <div className="erd-list-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          className={`filter-button ${filter === 'tenant' ? 'active' : ''}`}
          onClick={() => setFilter('tenant')}
        >
          테넌트 ERD
        </button>
        <button
          className={`filter-button ${filter === 'public' ? 'active' : ''}`}
          onClick={() => setFilter('public')}
        >
          공개 ERD
        </button>
      </div>

      {erds.length === 0 ? (
        <div className="erd-empty-state">
          <p className="empty-message">등록된 ERD가 없습니다.</p>
        </div>
      ) : (
        <div className="erd-list-grid">
          {erds.map((erd) => (
            <div
              key={erd.diagramId}
              className="erd-card"
              onClick={() => handleErdClick(erd.diagramId)}
            >
              <div className="erd-card-header">
                <h3 className="erd-card-title">{erd.name}</h3>
                <span className={`erd-status-badge ${getStatusBadgeClass(erd.isActive)}`}>
                  {erd.isActive ? '활성' : '비활성'}
                </span>
              </div>
              
              <div className="erd-card-body">
                {erd.description && (
                  <p className="erd-card-description">{erd.description}</p>
                )}
                
                <div className="erd-card-meta">
                  <div className="erd-meta-item">
                    <span className="meta-label">타입:</span>
                    <span className="meta-value">{getDiagramTypeLabel(erd.diagramType)}</span>
                  </div>
                  
                  {erd.moduleType && (
                    <div className="erd-meta-item">
                      <span className="meta-label">모듈:</span>
                      <span className="meta-value">{erd.moduleType}</span>
                    </div>
                  )}
                  
                  <div className="erd-meta-item">
                    <span className="meta-label">버전:</span>
                    <span className="meta-value">v{erd.version}</span>
                  </div>
                  
                  {erd.createdAt && (
                    <div className="erd-meta-item">
                      <span className="meta-label">생성일:</span>
                      <span className="meta-value">
                        {new Date(erd.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="erd-card-footer">
                <button className="erd-view-button">
                  ERD 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErdListPage;

