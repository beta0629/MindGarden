import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Search, Filter, Download, RefreshCw, 
  CheckCircle, XCircle, AlertCircle, FileText,
  Plus, Eye, History, Compare
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { 
  getAllErdsForOps, 
  generateFullSystemErdForOps, 
  generateTenantErdForOps,
  generateModuleErdForOps,
  generateCustomErdForOps,
  getTableNamesForOps,
  validateErdForOps,
  compareErdVersionsForOps,
  getErdDetailForOps
} from '../../utils/erdApi';
import { exportMermaidToPng, exportMermaidToSvg } from '../../utils/erdExport';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import '../../styles/main.css';
import '../../styles/mindgarden-design-system.css';
import './ErdManagement.css';

/**
 * HQ 운영 포털 ERD 관리 페이지
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const ErdManagement = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();

  // 상태 관리
  const [erds, setErds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터 및 검색
  const [filters, setFilters] = useState({
    tenantId: '',
    diagramType: '',
    isActive: null,
    search: ''
  });

  // 모달 상태
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedErd, setSelectedErd] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [compareResult, setCompareResult] = useState(null);

  // 생성 모달 상태
  const [generateType, setGenerateType] = useState('full-system'); // full-system, tenant, module, custom
  const [generateTenantId, setGenerateTenantId] = useState('');
  const [generateModuleType, setGenerateModuleType] = useState('');
  const [generateSchemaName, setGenerateSchemaName] = useState('');
  const [customErdName, setCustomErdName] = useState('');
  const [customErdDescription, setCustomErdDescription] = useState('');
  const [selectedTables, setSelectedTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // 버전 비교 상태
  const [fromVersion, setFromVersion] = useState(1);
  const [toVersion, setToVersion] = useState(2);

  // 테넌트 목록 (테넌트 ERD 생성용)
  const [tenants, setTenants] = useState([]);

  // ERD 목록 로드
  const loadErds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const erdList = await getAllErdsForOps(filters);
      setErds(erdList);
    } catch (err) {
      console.error('ERD 목록 로드 실패:', err);
      setError('ERD 목록을 불러오는 중 오류가 발생했습니다.');
      showNotification('ERD 목록 로드 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 테넌트 목록 로드
  const loadTenants = useCallback(async () => {
    try {
      // TODO: 테넌트 목록 API 호출
      // const response = await apiGet('/api/v1/ops/tenants');
      // setTenants(response || []);
    } catch (err) {
      console.error('테넌트 목록 로드 실패:', err);
    }
  }, []);

  // 테이블 목록 로드 (커스텀 ERD 생성용)
  const loadTableNames = useCallback(async () => {
    try {
      setLoadingTables(true);
      const tables = await getTableNamesForOps(generateSchemaName || null);
      setAvailableTables(tables);
    } catch (err) {
      console.error('테이블 목록 로드 실패:', err);
      showNotification('테이블 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoadingTables(false);
    }
  }, [generateSchemaName]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user) {
      loadErds();
      loadTenants();
    }
  }, [sessionLoading, isLoggedIn, user, loadErds, loadTenants]);

  // ERD 생성
  const handleGenerateErd = async () => {
    try {
      setLoading(true);
      let result;

      switch (generateType) {
        case 'full-system':
          result = await generateFullSystemErdForOps(generateSchemaName || null);
          break;
        case 'tenant':
          if (!generateTenantId) {
            showNotification('테넌트 ID를 입력해주세요.', 'error');
            return;
          }
          result = await generateTenantErdForOps(generateTenantId, generateSchemaName || null);
          break;
        case 'module':
          if (!generateModuleType) {
            showNotification('모듈 타입을 입력해주세요.', 'error');
            return;
          }
          result = await generateModuleErdForOps(generateModuleType, generateSchemaName || null);
          break;
        case 'custom':
          if (!customErdName) {
            showNotification('ERD 이름을 입력해주세요.', 'error');
            return;
          }
          if (selectedTables.length === 0) {
            showNotification('최소 하나 이상의 테이블을 선택해주세요.', 'error');
            return;
          }
          result = await generateCustomErdForOps({
            tableNames: selectedTables,
            name: customErdName,
            description: customErdDescription,
            schemaName: generateSchemaName || null
          });
          break;
        default:
          return;
      }

      showNotification('ERD 생성이 완료되었습니다.', 'success');
      setShowGenerateModal(false);
      // 상태 초기화
      setCustomErdName('');
      setCustomErdDescription('');
      setSelectedTables([]);
      loadErds();
    } catch (err) {
      console.error('ERD 생성 실패:', err);
      showNotification('ERD 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 커스텀 ERD 타입 선택 시 테이블 목록 로드
  useEffect(() => {
    if (generateType === 'custom' && showGenerateModal) {
      loadTableNames();
    }
  }, [generateType, showGenerateModal, loadTableNames]);

  // ERD 검증
  const handleValidateErd = async (diagramId) => {
    try {
      setLoading(true);
      const report = await validateErdForOps(diagramId);
      setValidationReport(report);
      setSelectedErd(erds.find(erd => erd.diagramId === diagramId));
      setShowValidationModal(true);
    } catch (err) {
      console.error('ERD 검증 실패:', err);
      showNotification('ERD 검증 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ERD 버전 비교
  const handleCompareVersions = async (diagramId) => {
    try {
      setLoading(true);
      const result = await compareErdVersionsForOps(diagramId, fromVersion, toVersion);
      setCompareResult(result);
      setSelectedErd(erds.find(erd => erd.diagramId === diagramId));
      setShowCompareModal(true);
    } catch (err) {
      console.error('ERD 버전 비교 실패:', err);
      showNotification('ERD 버전 비교 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 검증 리포트 다운로드
  const handleDownloadReport = async (diagramId, format) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
      const url = `${baseUrl}/api/v1/ops/erd/${diagramId}/validation-report/${format}`;
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('다운로드 실패');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `erd-validation-${diagramId}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showNotification('검증 리포트 다운로드가 완료되었습니다.', 'success');
    } catch (err) {
      console.error('검증 리포트 다운로드 실패:', err);
      showNotification('검증 리포트 다운로드 중 오류가 발생했습니다.', 'error');
    }
  };

  // ERD 상세 페이지로 이동
  const handleViewErd = (diagramId) => {
    navigate(`/hq/erd/${diagramId}`);
  };

  // ERD 내보내기 (PNG)
  const handleExportPng = async (erd) => {
    try {
      const erdDetail = await getErdDetailForOps(erd.diagramId);
      if (erdDetail.mermaidCode) {
        await exportMermaidToPng(erdDetail.mermaidCode, `${erd.name}-v${erd.version}`, { scale: 2 });
        showNotification('PNG 내보내기가 완료되었습니다.', 'success');
      } else {
        showNotification('ERD 데이터를 찾을 수 없습니다.', 'error');
      }
    } catch (error) {
      console.error('PNG 내보내기 실패:', error);
      showNotification('PNG 내보내기 중 오류가 발생했습니다.', 'error');
    }
  };

  // ERD 내보내기 (SVG)
  const handleExportSvg = async (erd) => {
    try {
      const erdDetail = await getErdDetailForOps(erd.diagramId);
      if (erdDetail.mermaidCode) {
        await exportMermaidToSvg(erdDetail.mermaidCode, `${erd.name}-v${erd.version}`);
        showNotification('SVG 내보내기가 완료되었습니다.', 'success');
      } else {
        showNotification('ERD 데이터를 찾을 수 없습니다.', 'error');
      }
    } catch (error) {
      console.error('SVG 내보내기 실패:', error);
      showNotification('SVG 내보내기 중 오류가 발생했습니다.', 'error');
    }
  };

  // ERD 타입 한글 변환
  const getDiagramTypeLabel = (type) => {
    const typeMap = {
      'FULL': '전체 시스템',
      'MODULE': '모듈별',
      'CUSTOM': '커스텀',
      'TENANT': '테넌트별'
    };
    return typeMap[type] || type;
  };

  // 검증 상태 아이콘
  const getValidationStatusIcon = (status) => {
    switch (status) {
      case 'VALID':
        return <CheckCircle className="status-icon valid" />;
      case 'INVALID':
        return <XCircle className="status-icon invalid" />;
      case 'WARNING':
        return <AlertCircle className="status-icon warning" />;
      default:
        return null;
    }
  };

  if (sessionLoading) {
    return (
      <SimpleLayout>
        <UnifiedLoading />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="erd-management-page">
        {/* 헤더 */}
        <div className="erd-management-header">
          <div className="header-title">
            <Database className="title-icon" />
            <h1>ERD 관리</h1>
          </div>
          <MGButton
            onClick={() => setShowGenerateModal(true)}
            variant="primary"
          >
            <Plus size={18} style={{ marginRight: '8px' }} />
            ERD 생성
          </MGButton>
        </div>

        {/* 필터 및 검색 */}
        <div className="erd-management-filters">
          <div className="filter-group">
            <Search className="filter-icon" />
            <input
              type="text"
              placeholder="ERD 이름 또는 설명으로 검색..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={filters.diagramType}
              onChange={(e) => setFilters({ ...filters, diagramType: e.target.value })}
              className="filter-select"
            >
              <option value="">모든 타입</option>
              <option value="FULL">전체 시스템</option>
              <option value="TENANT">테넌트별</option>
              <option value="MODULE">모듈별</option>
              <option value="CUSTOM">커스텀</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filters.isActive === null ? '' : filters.isActive.toString()}
              onChange={(e) => setFilters({ 
                ...filters, 
                isActive: e.target.value === '' ? null : e.target.value === 'true' 
              })}
              className="filter-select"
            >
              <option value="">모든 상태</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>
          <MGButton
            onClick={loadErds}
            variant="secondary"
          >
            <RefreshCw size={18} style={{ marginRight: '8px' }} />
            새로고침
          </MGButton>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            <AlertCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* ERD 목록 */}
        {loading ? (
          <UnifiedLoading />
        ) : (
          <div className="erd-list">
            {erds.length === 0 ? (
              <div className="empty-state">
                <Database className="empty-icon" />
                <p>ERD가 없습니다.</p>
                <MGButton
                  onClick={() => setShowGenerateModal(true)}
                  variant="primary"
                >
                  ERD 생성하기
                </MGButton>
              </div>
            ) : (
              <div className="erd-grid">
                {erds.map((erd) => (
                  <div key={erd.diagramId} className="erd-card">
                    <div className="erd-card-header">
                      <div className="erd-title">
                        <h3>{erd.name}</h3>
                        <span className={`erd-type-badge ${erd.diagramType?.toLowerCase()}`}>
                          {getDiagramTypeLabel(erd.diagramType)}
                        </span>
                      </div>
                      <div className="erd-status">
                        {erd.isActive ? (
                          <span className="status-badge active">활성</span>
                        ) : (
                          <span className="status-badge inactive">비활성</span>
                        )}
                      </div>
                    </div>
                    <div className="erd-card-body">
                      <p className="erd-description">{erd.description || '설명 없음'}</p>
                      <div className="erd-meta">
                        <span>버전: {erd.version}</span>
                        {erd.tenantId && <span>테넌트: {erd.tenantId.substring(0, 8)}...</span>}
                        <span>생성일: {new Date(erd.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="erd-card-actions">
                      <MGButton
                        onClick={() => handleViewErd(erd.diagramId)}
                        variant="secondary"
                        size="small"
                      >
                        <Eye size={16} style={{ marginRight: '4px' }} />
                        보기
                      </MGButton>
                      <MGButton
                        onClick={() => handleValidateErd(erd.diagramId)}
                        variant="secondary"
                        size="small"
                      >
                        <CheckCircle size={16} style={{ marginRight: '4px' }} />
                        검증
                      </MGButton>
                      <MGButton
                        onClick={() => {
                          setSelectedErd(erd);
                          setShowCompareModal(true);
                        }}
                        variant="secondary"
                        size="small"
                      >
                        <Compare size={16} style={{ marginRight: '4px' }} />
                        비교
                      </MGButton>
                      <div className="download-dropdown">
                        <MGButton
                          variant="secondary"
                          size="small"
                        >
                          <Download size={16} style={{ marginRight: '4px' }} />
                          리포트
                        </MGButton>
                        <div className="download-menu">
                          <button onClick={() => handleDownloadReport(erd.diagramId, 'json')}>
                            JSON
                          </button>
                          <button onClick={() => handleDownloadReport(erd.diagramId, 'html')}>
                            HTML
                          </button>
                          <button onClick={() => handleDownloadReport(erd.diagramId, 'markdown')}>
                            Markdown
                          </button>
                        </div>
                      </div>
                      <div className="export-dropdown">
                        <MGButton
                          variant="secondary"
                          size="small"
                        >
                          <Download size={16} style={{ marginRight: '4px' }} />
                          내보내기
                        </MGButton>
                        <div className="export-menu">
                          <button onClick={() => handleExportPng(erd)}>
                            PNG
                          </button>
                          <button onClick={() => handleExportSvg(erd)}>
                            SVG
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ERD 생성 모달 */}
        {showGenerateModal && (
          <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>ERD 생성</h2>
                <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>생성 타입</label>
                  <select
                    value={generateType}
                    onChange={(e) => setGenerateType(e.target.value)}
                    className="form-select"
                  >
                    <option value="full-system">전체 시스템 ERD</option>
                    <option value="tenant">테넌트 ERD</option>
                    <option value="module">모듈 ERD</option>
                    <option value="custom">커스텀 ERD</option>
                  </select>
                </div>
                {generateType === 'tenant' && (
                  <div className="form-group">
                    <label>테넌트 ID</label>
                    <input
                      type="text"
                      value={generateTenantId}
                      onChange={(e) => setGenerateTenantId(e.target.value)}
                      placeholder="테넌트 ID를 입력하세요"
                      className="form-input"
                    />
                  </div>
                )}
                {generateType === 'module' && (
                  <div className="form-group">
                    <label>모듈 타입</label>
                    <input
                      type="text"
                      value={generateModuleType}
                      onChange={(e) => setGenerateModuleType(e.target.value)}
                      placeholder="예: CONSULTATION, ACADEMY, FOOD_SERVICE"
                      className="form-input"
                    />
                  </div>
                )}
                {generateType === 'custom' && (
                  <>
                    <div className="form-group">
                      <label>ERD 이름 *</label>
                      <input
                        type="text"
                        value={customErdName}
                        onChange={(e) => setCustomErdName(e.target.value)}
                        placeholder="예: 주문 관리 ERD"
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>ERD 설명</label>
                      <textarea
                        value={customErdDescription}
                        onChange={(e) => setCustomErdDescription(e.target.value)}
                        placeholder="ERD에 대한 설명을 입력하세요"
                        className="form-input"
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>테이블 선택 *</label>
                      {loadingTables ? (
                        <div className="loading-tables">테이블 목록을 불러오는 중...</div>
                      ) : (
                        <div className="table-selection">
                          <div className="table-selection-header">
                            <button
                              type="button"
                              onClick={() => setSelectedTables([...availableTables])}
                              className="select-all-button"
                            >
                              전체 선택
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedTables([])}
                              className="deselect-all-button"
                            >
                              전체 해제
                            </button>
                            <span className="selected-count">
                              선택됨: {selectedTables.length} / {availableTables.length}
                            </span>
                          </div>
                          <div className="table-list">
                            {availableTables.map((tableName) => (
                              <label key={tableName} className="table-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={selectedTables.includes(tableName)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTables([...selectedTables, tableName]);
                                    } else {
                                      setSelectedTables(selectedTables.filter(t => t !== tableName));
                                    }
                                  }}
                                />
                                <span>{tableName}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label>스키마 이름 (선택)</label>
                  <input
                    type="text"
                    value={generateSchemaName}
                    onChange={(e) => setGenerateSchemaName(e.target.value)}
                    placeholder="기본값: core_solution"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <MGButton
                  onClick={() => setShowGenerateModal(false)}
                  variant="secondary"
                >
                  취소
                </MGButton>
                <MGButton
                  onClick={handleGenerateErd}
                  variant="primary"
                  disabled={loading}
                >
                  생성
                </MGButton>
              </div>
            </div>
          </div>
        )}

        {/* 검증 결과 모달 */}
        {showValidationModal && validationReport && (
          <div className="modal-overlay" onClick={() => setShowValidationModal(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>ERD 검증 결과</h2>
                <button className="modal-close" onClick={() => setShowValidationModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="validation-summary">
                  <div className="validation-status">
                    {getValidationStatusIcon(validationReport.status)}
                    <span className="status-label">{validationReport.status}</span>
                  </div>
                  <p className="validation-summary-text">{validationReport.summary}</p>
                </div>
                {validationReport.statistics && (
                  <div className="validation-statistics">
                    <h3>검증 통계</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">ERD 테이블 수</span>
                        <span className="stat-value">{validationReport.statistics.erdTableCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">스키마 테이블 수</span>
                        <span className="stat-value">{validationReport.statistics.schemaTableCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">일치하는 테이블</span>
                        <span className="stat-value">{validationReport.statistics.matchedTableCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">누락된 테이블</span>
                        <span className="stat-value error">{validationReport.statistics.missingTableCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">추가된 테이블</span>
                        <span className="stat-value warning">{validationReport.statistics.extraTableCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">총 이슈 수</span>
                        <span className="stat-value">{validationReport.statistics.totalIssueCount}</span>
                      </div>
                    </div>
                  </div>
                )}
                {validationReport.issues && validationReport.issues.length > 0 && (
                  <div className="validation-issues">
                    <h3>검증 이슈</h3>
                    <div className="issues-list">
                      {validationReport.issues.map((issue, index) => (
                        <div key={index} className={`issue-item ${issue.severity?.toLowerCase()}`}>
                          <div className="issue-header">
                            <span className="issue-type">{issue.issueType}</span>
                            <span className={`issue-severity ${issue.severity?.toLowerCase()}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="issue-description">{issue.description}</p>
                          {issue.tableName && (
                            <span className="issue-table">테이블: {issue.tableName}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <MGButton
                  onClick={() => handleDownloadReport(selectedErd?.diagramId, 'json')}
                  variant="secondary"
                >
                  <Download size={16} style={{ marginRight: '8px' }} />
                  JSON 다운로드
                </MGButton>
                <MGButton
                  onClick={() => handleDownloadReport(selectedErd?.diagramId, 'html')}
                  variant="secondary"
                >
                  <Download size={16} style={{ marginRight: '8px' }} />
                  HTML 다운로드
                </MGButton>
                <MGButton
                  onClick={() => setShowValidationModal(false)}
                  variant="primary"
                >
                  닫기
                </MGButton>
              </div>
            </div>
          </div>
        )}

        {/* 버전 비교 모달 */}
        {showCompareModal && selectedErd && (
          <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>ERD 버전 비교</h2>
                <button className="modal-close" onClick={() => setShowCompareModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>시작 버전</label>
                  <input
                    type="number"
                    value={fromVersion}
                    onChange={(e) => setFromVersion(parseInt(e.target.value))}
                    min="1"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>종료 버전</label>
                  <input
                    type="number"
                    value={toVersion}
                    onChange={(e) => setToVersion(parseInt(e.target.value))}
                    min="1"
                    className="form-input"
                  />
                </div>
                {compareResult && (
                  <div className="compare-result">
                    <h3>비교 결과</h3>
                    <pre className="compare-content">{compareResult}</pre>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <MGButton
                  onClick={() => setShowCompareModal(false)}
                  variant="secondary"
                >
                  취소
                </MGButton>
                <MGButton
                  onClick={() => handleCompareVersions(selectedErd.diagramId)}
                  variant="primary"
                  disabled={loading}
                >
                  비교 실행
                </MGButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default ErdManagement;

