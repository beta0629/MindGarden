/**
 * Psych Assessment Admin Widget - 표준화된 위젯
 *
 * TCI/MMPI 업로드/상태/리포트 생성/통계를 관리자 대시보드에서 확인
 *
 * 표준화 원칙:
 * - BaseWidget + useWidget 사용
 * - 하드코딩된 스타일 값 금지(기존 mg- 클래스/토큰 CSS 사용)
 * - 사용자 노출 문구는 한국어
 */

import React, { useMemo, useState } from 'react';
import { FileText, Upload, RefreshCw, PlayCircle } from 'lucide-react';
import BaseWidget from '../BaseWidget';
import { useWidget } from '../../../../hooks/useWidget';
import { RoleUtils } from '../../../../constants/roles';
import notificationManager from '../../../../utils/notification';
import { apiPost } from '../../../../utils/ajax';

const PsychAssessmentAdminWidget = ({ widget, user }) => {
  const [uploadType, setUploadType] = useState('TCI');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isAdminUser = RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER');

  const widgetWithDataSource = useMemo(() => {
    const dataSource = {
      type: 'multi-api',
      cache: false,
      refreshInterval: 60000,
      endpoints: [
        {
          url: '/api/v1/assessments/psych/stats',
          key: 'stats',
          fallback: {}
        },
        {
          url: '/api/v1/assessments/psych/documents/recent',
          key: 'recent',
          fallback: []
        }
      ],
      transform: (responses) => {
        const [stats, recent] = responses;
        return {
          stats: stats || {},
          recent: Array.isArray(recent) ? recent : []
        };
      }
    };

    return {
      ...widget,
      config: {
        ...widget?.config,
        title: widget?.config?.title || '심리검사 리포트(AI)',
        subtitle: widget?.config?.subtitle || 'TCI/MMPI 업로드 · 처리상태 · 리포트 생성',
        icon: <FileText className="widget-header-icon" />,
        dataSource
      }
    };
  }, [widget]);

  const {
    data,
    loading,
    error,
    refresh
  } = useWidget(widgetWithDataSource.config, user, {
    immediate: true,
    cache: false,
    retryCount: 2
  });

  // 관리자만 표시 (훅 호출 이후에 처리해야 rules-of-hooks 위반이 없음)
  if (!isAdminUser) {
    return null;
  }

  const stats = data?.stats || {};
  const recent = data?.recent || [];

  const handlePickFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      notificationManager.show('PDF 파일만 업로드할 수 있습니다.', 'warning');
      return;
    }
    setUploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handlePickFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      notificationManager.show('업로드할 PDF 파일을 선택해주세요.', 'warning');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('type', uploadType);
      form.append('file', uploadFile);

      const res = await fetch('/api/v1/assessments/psych/documents', {
        method: 'POST',
        body: form,
        credentials: 'include'
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || '업로드에 실패했습니다.');
      }
      notificationManager.show('업로드가 완료되었습니다. 추출 작업이 진행됩니다.', 'success');
      setUploadFile(null);
      refresh();
    } catch (e) {
      notificationManager.show(e?.message || '업로드에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async (documentId) => {
    if (!documentId) return;
    try {
      const res = await apiPost(`/api/v1/assessments/psych/documents/${documentId}/report`, {});
      if (res?.success === false) {
        throw new Error(res?.message || '리포트 생성에 실패했습니다.');
      }
      notificationManager.show('리포트 생성 요청이 완료되었습니다.', 'success');
      refresh();
    } catch (e) {
      notificationManager.show(e?.message || '리포트 생성에 실패했습니다.', 'error');
    }
  };

  const headerActions = (
    <button
      type="button"
      className="mg-button mg-button--sm mg-button--ghost"
      onClick={refresh}
      title="새로고침"
    >
      <RefreshCw size={16} />
    </button>
  );

  return (
    <BaseWidget
      widget={widgetWithDataSource}
      user={user}
      loading={loading}
      error={error}
      onRefresh={refresh}
      headerActions={headerActions}
      className="psych-assessment-admin-widget"
    >
      <div className="mg-widget__body">
        <div className="mg-stats-grid">
          <div className="mg-stats-card">
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{(stats?.documentsTotal ?? 0).toLocaleString()}</div>
              <div className="mg-stats-card__label">업로드</div>
            </div>
          </div>
          <div className="mg-stats-card">
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{(stats?.extractionsTotal ?? 0).toLocaleString()}</div>
              <div className="mg-stats-card__label">추출</div>
            </div>
          </div>
          <div className="mg-stats-card">
            <div className="mg-stats-card__content">
              <div className="mg-stats-card__value">{(stats?.reportsTotal ?? 0).toLocaleString()}</div>
              <div className="mg-stats-card__label">리포트</div>
            </div>
          </div>
        </div>

        <div className="mg-card mg-mt-md">
          <div className="mg-card__header">
            <Upload size={16} />
            <h4 className="mg-h5 mg-mb-0">PDF 업로드</h4>
          </div>
          <div className="mg-card__body">
            <div
              className="mg-card mg-mb-sm"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role="button"
              tabIndex={0}
              onKeyDown={() => {}}
              style={{
                borderStyle: 'dashed',
                borderWidth: '2px',
                borderColor: isDragOver ? 'var(--cs-primary-400)' : 'var(--cs-gray-300)',
                background: isDragOver ? 'var(--cs-primary-50)' : 'var(--cs-slate-50)'
              }}
            >
              <div className="mg-card__body mg-flex mg-flex-col mg-align-center mg-justify-center mg-gap-sm">
                <p className="mg-text-muted mg-mb-0">
                  파일을 여기로 드래그&드롭 하거나 아래에서 선택하세요.
                </p>
                <p className="mg-text-muted mg-mb-0">
                  {uploadFile ? `선택됨: ${uploadFile.name}` : '선택된 파일 없음'}
                </p>
              </div>
            </div>

            <div className="mg-flex mg-gap-sm mg-flex-wrap">
              <select
                className="mg-select"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <option value="TCI">TCI</option>
                <option value="MMPI">MMPI</option>
              </select>
              <input
                className="mg-input"
                type="file"
                accept="application/pdf"
                onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="mg-button mg-button--primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                업로드
              </button>
            </div>
            <p className="mg-text-muted mg-mt-sm">
              스캔 PDF 업로드 후 자동으로 추출 작업이 진행됩니다. (MVP: 템플릿/범용 OCR 확장 예정)
            </p>
          </div>
        </div>

        <div className="mg-card mg-mt-md">
          <div className="mg-card__header">
            <FileText size={16} />
            <h4 className="mg-h5 mg-mb-0">최근 업로드(최대 20개)</h4>
          </div>
          <div className="mg-card__body">
            {recent.length === 0 ? (
              <div className="mg-empty-state">
                <p className="mg-text-muted">최근 업로드된 문서가 없습니다.</p>
              </div>
            ) : (
              <div className="mg-table-wrapper">
                <table className="mg-table">
                  <thead>
                    <tr>
                      <th>검사</th>
                      <th>상태</th>
                      <th>파일</th>
                      <th>생성</th>
                      <th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((d) => (
                      <tr key={d.documentId}>
                        <td data-label="검사">{d.assessmentType}</td>
                        <td data-label="상태">{d.status}</td>
                        <td data-label="파일">{d.originalFilename || '파일명 없음'}</td>
                        <td data-label="생성">{d.createdAt || '-'}</td>
                        <td data-label="액션">
                          <button
                            type="button"
                            className="mg-button mg-button--sm mg-button--outline"
                            onClick={() => handleGenerateReport(d.documentId)}
                            title="리포트 생성"
                          >
                            <PlayCircle size={16} /> 리포트 생성
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

export default PsychAssessmentAdminWidget;


