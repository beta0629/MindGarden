import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { getErdDetail, getErdHistory } from '../../utils/erdApi';
import { exportSvgToPng, exportSvgToSvg, exportMermaidToPng, exportMermaidToSvg } from '../../utils/erdExport';
import mermaid from 'mermaid';
import { Download } from 'lucide-react';
import './ErdDetailPage.css';

/**
 * 테넌트 포털 ERD 상세 페이지
 * Mermaid.js를 사용하여 ERD 다이어그램을 시각화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const ErdDetailPage = () => {
  const { diagramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: sessionLoading } = useSession();
  
  const [erd, setErd] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('diagram'); // diagram, history, text
  const [mermaidError, setMermaidError] = useState(null);
  const mermaidRef = React.useRef(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [filterVisible, setFilterVisible] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user && diagramId) {
      loadErdDetail();
    }
  }, [sessionLoading, user, diagramId]);

  useEffect(() => {
    if (erd && erd.mermaidCode && activeTab === 'diagram') {
      renderMermaid();
    }
  }, [erd, activeTab]);

  /**
   * ERD 상세 정보 로드
   */
  const loadErdDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const tenantId = location.state?.tenantId || user?.tenantId || user?.branchCode || 'default';
      
      const erdDetail = await getErdDetail(tenantId, diagramId);
      setErd(erdDetail);

      // 변경 이력도 함께 로드
      try {
        const historyList = await getErdHistory(tenantId, diagramId);
        setHistory(historyList);
      } catch (err) {
        console.warn('ERD 변경 이력 로드 실패:', err);
        setHistory([]);
      }
    } catch (err) {
      console.error('ERD 상세 정보 로드 실패:', err);
      setError('ERD 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mermaid 다이어그램 렌더링
   */
  const renderMermaid = async () => {
    if (!mermaidRef.current || !erd?.mermaidCode) {
      return;
    }

    try {
      setMermaidError(null);

      // Mermaid 초기화
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: '#007bff',
          primaryTextColor: '#333',
          primaryBorderColor: '#007bff',
          lineColor: '#666',
          secondaryColor: '#f0f0f0',
          tertiaryColor: '#fff',
          background: '#fff',
          mainBkg: '#fff',
          secondBkg: '#f5f5f5',
          textColor: '#333',
          edgeLabelBackground: '#fff',
          clusterBkg: '#f5f5f5',
          clusterBorder: '#ccc',
          defaultLinkColor: '#666',
          titleColor: '#333',
          actorBorder: '#007bff',
          actorBkg: '#e3f2fd',
          actorTextColor: '#333',
          actorLineColor: '#007bff',
          signalColor: '#333',
          signalTextColor: '#333',
          labelBoxBkgColor: '#fff',
          labelBoxBorderColor: '#007bff',
          labelTextColor: '#333',
          loopTextColor: '#333',
          noteBorderColor: '#007bff',
          noteBkgColor: '#fff3cd',
          noteTextColor: '#333',
          activationBorderColor: '#007bff',
          activationBkgColor: '#e3f2fd',
          sequenceNumberColor: '#fff',
        },
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
        },
        er: {
          layoutDirection: 'TB',
          minEntityWidth: 100,
          minEntityHeight: 75,
          entityPadding: 15,
          stroke: '#007bff',
          fill: '#fff',
          fontSize: 14,
        },
        securityLevel: 'loose',
      });

      // 기존 내용 제거
      mermaidRef.current.innerHTML = '';

      // 고유 ID 생성
      const id = `mermaid-${diagramId}-${Date.now()}`;

      // Mermaid 렌더링
      const { svg } = await mermaid.render(id, erd.mermaidCode);
      mermaidRef.current.innerHTML = svg;

      // SVG 스타일 조정
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        
        // 인터랙티브 기능 추가
        setupInteractiveFeatures(svgElement);
        
        // 확대/축소 및 팬 기능 추가 (약간의 지연 후 실행)
        setTimeout(() => {
          setupZoomAndPan(svgElement);
        }, 100);
      }
    } catch (err) {
      console.error('Mermaid 렌더링 실패:', err);
      setMermaidError('ERD 다이어그램을 렌더링하는 중 오류가 발생했습니다.');
    }
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
   * 변경 타입 한글 변환
   */
  const getChangeTypeLabel = (type) => {
    const typeMap = {
      'CREATED': '생성',
      'UPDATED': '수정',
      'DELETED': '삭제'
    };
    return typeMap[type] || type;
  };

  /**
   * 인터랙티브 기능 설정 (테이블 클릭, 관계선 하이라이트)
   */
  const setupInteractiveFeatures = (svgElement) => {
    if (!svgElement) return;

    // 모든 테이블 노드 찾기 (Mermaid ERD의 테이블은 <g> 요소로 렌더링됨)
    const tables = svgElement.querySelectorAll('g.node, g[class*="node"]');
    const paths = svgElement.querySelectorAll('path, line, polyline'); // 관계선

    // 테이블 클릭 이벤트
    tables.forEach((table, index) => {
      // 테이블 이름 추출 (텍스트 요소에서)
      const textElement = table.querySelector('text');
      const tableName = textElement ? textElement.textContent.trim() : `Table ${index + 1}`;
      
      // 클릭 가능하도록 스타일 추가
      table.style.cursor = 'pointer';
      table.style.transition = 'all 0.2s';

      // 클릭 이벤트
      table.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 이전 선택 제거
        tables.forEach(t => {
          t.style.opacity = '1';
          t.style.transform = 'scale(1)';
          t.style.filter = 'none';
        });
        paths.forEach(p => {
          p.style.opacity = '0.3';
          p.style.strokeWidth = '1';
          p.style.stroke = '';
        });

        // 현재 테이블 하이라이트
        table.style.opacity = '1';
        table.style.transform = 'scale(1.05)';
        table.style.filter = 'drop-shadow(0 4px 8px rgba(0, 123, 255, 0.3))';
        
        setSelectedTable(tableName);
        setSelectedRelation(null);
        setHoveredElement(null);

        // 관련 관계선 하이라이트
        highlightRelatedRelations(svgElement, table, paths);
      });

      // 호버 이벤트
      table.addEventListener('mouseenter', (e) => {
        if (selectedTable === null) {
          table.style.opacity = '0.9';
          table.style.transform = 'scale(1.02)';
          setHoveredElement(tableName);
        }
      });

      table.addEventListener('mouseleave', (e) => {
        if (selectedTable === null) {
          table.style.opacity = '1';
          table.style.transform = 'scale(1)';
          setHoveredElement(null);
        }
      });
    });

    // 관계선 클릭 이벤트
    paths.forEach((path, index) => {
      path.style.cursor = 'pointer';
      path.style.transition = 'all 0.2s';

      path.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 모든 관계선 초기화
        paths.forEach(p => {
          p.style.opacity = '0.3';
          p.style.strokeWidth = '1';
        });

        // 현재 관계선 하이라이트
        path.style.opacity = '1';
        path.style.strokeWidth = '3';
        path.style.stroke = '#007bff';

        setSelectedRelation(`Relation ${index + 1}`);
        setSelectedTable(null);

        // 관련 테이블 하이라이트
        highlightRelatedTables(svgElement, path, tables);
      });

      path.addEventListener('mouseenter', (e) => {
        if (selectedRelation === null) {
          path.style.opacity = '0.8';
          path.style.strokeWidth = '2';
        }
      });

      path.addEventListener('mouseleave', (e) => {
        if (selectedRelation === null) {
          path.style.opacity = '0.3';
          path.style.strokeWidth = '1';
        }
      });
    });

    // SVG 외부 클릭 시 선택 해제
    svgElement.addEventListener('click', (e) => {
      if (e.target === svgElement || e.target.tagName === 'svg') {
        resetSelection(tables, paths);
      }
    });
  };

  /**
   * 관련 관계선 하이라이트
   */
  const highlightRelatedRelations = (svgElement, selectedTable, paths) => {
    // 선택된 테이블과 연결된 관계선 찾기
    const tableBounds = selectedTable.getBBox();
    
    paths.forEach(path => {
      const pathBounds = path.getBBox();
      
      // 간단한 교차 검사 (실제로는 더 정교한 알고리즘 필요)
      const isRelated = checkPathTableConnection(path, selectedTable);
      
      if (isRelated) {
        path.style.opacity = '1';
        path.style.strokeWidth = '2.5';
        path.style.stroke = '#007bff';
      } else {
        path.style.opacity = '0.2';
      }
    });
  };

  /**
   * 관련 테이블 하이라이트
   */
  const highlightRelatedTables = (svgElement, selectedPath, tables) => {
    // 선택된 관계선과 연결된 테이블 찾기
    tables.forEach(table => {
      const isRelated = checkPathTableConnection(selectedPath, table);
      
      if (isRelated) {
        table.style.opacity = '0.9';
        table.style.transform = 'scale(1.03)';
      } else {
        table.style.opacity = '0.4';
      }
    });
  };

  /**
   * 관계선과 테이블의 연결 여부 확인
   */
  const checkPathTableConnection = (path, table) => {
    try {
      const pathBounds = path.getBBox();
      const tableBounds = table.getBBox();
      
      // 간단한 경계 박스 교차 검사
      return !(
        pathBounds.x + pathBounds.width < tableBounds.x ||
        pathBounds.x > tableBounds.x + tableBounds.width ||
        pathBounds.y + pathBounds.height < tableBounds.y ||
        pathBounds.y > tableBounds.y + tableBounds.height
      );
    } catch (e) {
      // getBBox() 실패 시 기본값
      return false;
    }
  };

  /**
   * 선택 초기화
   */
  const resetSelection = (tables, paths) => {
    tables.forEach(table => {
      table.style.opacity = '1';
      table.style.transform = 'scale(1)';
      table.style.filter = 'none';
    });
    
    paths.forEach(path => {
      path.style.opacity = '0.3';
      path.style.strokeWidth = '1';
      path.style.stroke = '';
    });
    
    setSelectedTable(null);
    setSelectedRelation(null);
    setHoveredElement(null);
  };

  /**
   * 확대/축소 및 팬 기능 설정
   */
  const setupZoomAndPan = (svgElement) => {
    if (!svgElement) return;

    const wrapper = mermaidRef.current?.querySelector('.mermaid-wrapper') || mermaidRef.current;
    if (!wrapper) return;

    // SVG를 감싸는 컨테이너 생성
    let container = wrapper.querySelector('.mermaid-svg-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'mermaid-svg-container';
      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      
      // SVG를 컨테이너로 이동
      const parent = svgElement.parentNode;
      container.appendChild(svgElement);
      wrapper.appendChild(container);
    }

    // 마우스 휠로 확대/축소
    const handleWheel = (e) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta));
      setZoomLevel(newZoom);
    };

    wrapper.addEventListener('wheel', handleWheel, { passive: false });

    // 마우스 드래그로 팬
    const handleMouseDown = (e) => {
      if (e.button === 0 && !e.target.closest('.zoom-button, .filter-toggle-button, .filter-panel')) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
      }
    };

    const handleMouseMove = (e) => {
      if (isPanning) {
        setPanPosition({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    wrapper.addEventListener('mousedown', handleMouseDown);
    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseup', handleMouseUp);
    wrapper.addEventListener('mouseleave', handleMouseUp);
  };

  /**
   * 확대
   */
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(3, prev + 0.1));
  };

  /**
   * 축소
   */
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, prev - 0.1));
  };

  /**
   * 확대/축소 리셋
   */
  const handleZoomReset = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  /**
   * 필터링 적용
   */
  const applyFilters = () => {
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (!svgElement) return;

    const tables = svgElement.querySelectorAll('g.node, g[class*="node"]');
    const paths = svgElement.querySelectorAll('path, line, polyline');

    tables.forEach((table, index) => {
      const textElement = table.querySelector('text');
      const tableName = textElement ? textElement.textContent.trim() : `Table ${index + 1}`;
      
      let shouldShow = true;

      // 테이블 이름 필터
      if (tableFilter && !tableName.toLowerCase().includes(tableFilter.toLowerCase())) {
        shouldShow = false;
      }

      // 선택된 항목만 표시
      if (showOnlySelected && selectedTable !== tableName && selectedRelation === null) {
        shouldShow = false;
      }

      if (shouldShow) {
        table.style.display = '';
        table.style.opacity = '1';
      } else {
        table.style.display = 'none';
      }
    });

    // 관계선 필터링 (관련 테이블이 보이지 않으면 관계선도 숨김)
    paths.forEach((path) => {
      const isRelatedToVisibleTable = Array.from(tables).some(table => {
        if (table.style.display === 'none') return false;
        return checkPathTableConnection(path, table);
      });

      if (isRelatedToVisibleTable || !showOnlySelected) {
        path.style.display = '';
      } else {
        path.style.display = 'none';
      }
    });
  };

  // 확대/축소 및 팬 위치 변경 시 적용
  useEffect(() => {
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (svgElement) {
      const wrapper = mermaidRef.current;
      const container = wrapper?.querySelector('.mermaid-svg-container');
      if (container) {
        container.style.transform = `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`;
        container.style.transformOrigin = 'center center';
      }
    }
  }, [zoomLevel, panPosition]);

  // 필터 변경 시 적용
  useEffect(() => {
    if (erd && erd.mermaidCode && activeTab === 'diagram') {
      applyFilters();
    }
  }, [tableFilter, showOnlySelected, selectedTable, selectedRelation, erd, activeTab]);

  if (sessionLoading || loading) {
    return (
      <div className="erd-detail-page">
        <div className="erd-loading">
          <div className="loading-spinner"></div>
          <p>ERD 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !erd) {
    return (
      <div className="erd-detail-page">
        <div className="erd-error">
          <p className="error-message">{error || 'ERD를 찾을 수 없습니다.'}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/tenant/erd')} className="back-button">
              목록으로 돌아가기
            </button>
            <button onClick={loadErdDetail} className="retry-button">
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="erd-detail-page">
      {/* 헤더 */}
      <div className="erd-detail-header">
        <div className="erd-detail-header-content">
          <button 
            onClick={() => navigate('/tenant/erd')} 
            className="back-button"
          >
            ← 목록으로
          </button>
          <div className="erd-detail-title-section">
            <h1 className="erd-detail-title">{erd.name}</h1>
            <div className="erd-detail-meta">
              <span className="erd-meta-badge">{getDiagramTypeLabel(erd.diagramType)}</span>
              {erd.moduleType && (
                <span className="erd-meta-badge">{erd.moduleType}</span>
              )}
              <span className="erd-meta-badge">v{erd.version}</span>
              {erd.isActive ? (
                <span className="erd-status-badge active">활성</span>
              ) : (
                <span className="erd-status-badge inactive">비활성</span>
              )}
            </div>
          </div>
        </div>
        {erd.description && (
          <p className="erd-detail-description">{erd.description}</p>
        )}
        {/* 내보내기 버튼 */}
        <div className="erd-export-buttons">
          <div className="export-dropdown">
            <button className="export-button" title="ERD 내보내기">
              <Download size={18} />
              내보내기
            </button>
            <div className="export-menu">
              <button 
                onClick={async () => {
                  try {
                    const svgElement = mermaidRef.current?.querySelector('svg');
                    if (svgElement) {
                      await exportSvgToPng(svgElement, `${erd.name}-v${erd.version}`, { scale: 2 });
                    } else if (erd.mermaidCode) {
                      await exportMermaidToPng(erd.mermaidCode, `${erd.name}-v${erd.version}`, { scale: 2 });
                    }
                  } catch (error) {
                    console.error('PNG 내보내기 실패:', error);
                    alert('PNG 내보내기 중 오류가 발생했습니다.');
                  }
                }}
              >
                PNG로 내보내기
              </button>
              <button 
                onClick={() => {
                  try {
                    const svgElement = mermaidRef.current?.querySelector('svg');
                    if (svgElement) {
                      exportSvgToSvg(svgElement, `${erd.name}-v${erd.version}`);
                    } else if (erd.mermaidCode) {
                      exportMermaidToSvg(erd.mermaidCode, `${erd.name}-v${erd.version}`);
                    }
                  } catch (error) {
                    console.error('SVG 내보내기 실패:', error);
                    alert('SVG 내보내기 중 오류가 발생했습니다.');
                  }
                }}
              >
                SVG로 내보내기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="erd-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'diagram' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagram')}
        >
          다이어그램
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          변경 이력 ({history.length})
        </button>
        {erd.textErd && (
          <button
            className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            텍스트 ERD
          </button>
        )}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="erd-detail-content">
        {activeTab === 'diagram' && (
          <div className="erd-diagram-container">
            {/* 확대/축소 컨트롤 */}
            <div className="erd-zoom-controls">
              <button onClick={handleZoomIn} className="zoom-button" title="확대">
                <span>+</span>
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomOut} className="zoom-button" title="축소">
                <span>−</span>
              </button>
              <button onClick={handleZoomReset} className="zoom-reset-button" title="리셋">
                <span>⌂</span>
              </button>
            </div>

            {/* 필터 컨트롤 */}
            <div className="erd-filter-controls">
              <button 
                onClick={() => setFilterVisible(!filterVisible)}
                className="filter-toggle-button"
                title="필터 토글"
              >
                <span>🔍</span>
              </button>
              {filterVisible && (
                <div className="filter-panel">
                  <input
                    type="text"
                    placeholder="테이블 이름 검색..."
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    className="filter-input"
                  />
                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={showOnlySelected}
                      onChange={(e) => setShowOnlySelected(e.target.checked)}
                    />
                    <span>선택된 항목만 표시</span>
                  </label>
                </div>
              )}
            </div>

            {/* 선택 정보 패널 */}
            {(selectedTable || selectedRelation || hoveredElement) && (
              <div className="erd-selection-panel">
                {selectedTable && (
                  <div className="selection-info">
                    <span className="selection-label">선택된 테이블:</span>
                    <span className="selection-value">{selectedTable}</span>
                    <button 
                      onClick={() => resetSelection(
                        mermaidRef.current?.querySelectorAll('g.node, g[class*="node"]') || [],
                        mermaidRef.current?.querySelectorAll('path, line, polyline') || []
                      )}
                      className="clear-selection-button"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {selectedRelation && (
                  <div className="selection-info">
                    <span className="selection-label">선택된 관계:</span>
                    <span className="selection-value">{selectedRelation}</span>
                    <button 
                      onClick={() => resetSelection(
                        mermaidRef.current?.querySelectorAll('g.node, g[class*="node"]') || [],
                        mermaidRef.current?.querySelectorAll('path, line, polyline') || []
                      )}
                      className="clear-selection-button"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {hoveredElement && !selectedTable && !selectedRelation && (
                  <div className="selection-info hover">
                    <span className="selection-label">호버:</span>
                    <span className="selection-value">{hoveredElement}</span>
                  </div>
                )}
              </div>
            )}
            
            {mermaidError ? (
              <div className="mermaid-error">
                <p className="error-message">{mermaidError}</p>
                <button onClick={renderMermaid} className="retry-button">
                  다시 시도
                </button>
              </div>
            ) : (
              <div className="mermaid-wrapper">
                <div ref={mermaidRef} className="mermaid-diagram"></div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="erd-history-container">
            {history.length === 0 ? (
              <div className="empty-state">
                <p>변경 이력이 없습니다.</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <span className="history-version">버전 {item.version}</span>
                      <span className={`history-change-type ${item.changeType.toLowerCase()}`}>
                        {getChangeTypeLabel(item.changeType)}
                      </span>
                    </div>
                    {item.changeDescription && (
                      <p className="history-description">{item.changeDescription}</p>
                    )}
                    {item.diffSummary && (
                      <p className="history-diff">{item.diffSummary}</p>
                    )}
                    <div className="history-meta">
                      <span className="history-author">{item.changedBy}</span>
                      <span className="history-date">
                        {new Date(item.changedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && erd.textErd && (
          <div className="erd-text-container">
            <pre className="erd-text-content">{erd.textErd}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErdDetailPage;

