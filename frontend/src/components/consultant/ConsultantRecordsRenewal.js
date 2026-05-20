/**
 * ConsultantRecordsRenewal — 상담일지 리뉴얼
 *
 * 작성 대기 목록(미작성 건, 긴급도순), 일지 작성 폼(바텀시트),
 * 완료 목록(날짜 필터), 일지 상세 보기.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Clock, X, Calendar, Eye
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useToast } from '../../contexts/ToastContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ConsultantRecordsRenewal.css';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_CONSULTANTS = '/api/v1/consultants';
const API_SCHEDULES = '/api/v1/schedules';


const API_ENDPOINTS = {
  RECORDS: API_CONSULTANTS,
  SCHEDULES: API_SCHEDULES,
};

const TABS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
};

const AVAILABLE_TAGS = [
  '우울', '불안', '가족문제', '대인관계', '자존감',
  '스트레스', '진로', '트라우마', '분노', '수면',
];

const getInitials = (name) => name ? name.charAt(0) : '?';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

const getElapsedText = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}시간 경과`;
  const days = Math.floor(hours / 24);
  return `${days}일 경과`;
};

const RecordsSkeleton = () => (
  <div className="cr-records" aria-busy="true">
    <div className="cr-records__skeleton-tabs">
      <div className="cr-records__skeleton-tab" />
      <div className="cr-records__skeleton-tab" />
    </div>
    {Array.from({ length: 3 }, (_, i) => (
      <div key={i} className="cr-records__skeleton-card" />
    ))}
  </div>
);

const RecordFormSheet = ({ schedule, onClose, onSave }) => {
  const [summary, setSummary] = useState('');
  const [privateMemo, setPrivateMemo] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const clientName = schedule?.clientName || schedule?.userName || '내담자';
  const dateTime = `${formatDate(schedule?.startTime)} ${schedule?.startTime ? new Date(schedule.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''} - ${schedule?.endTime ? new Date(schedule.endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}`;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!summary.trim()) newErrors.summary = '상담 요약을 입력해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave?.({
        scheduleId: schedule.id || schedule.scheduleId,
        consultationId: schedule.consultationId || schedule.id,
        summary,
        privateMemo,
        tags: selectedTags,
      });
      onClose();
    } catch (err) {
      console.error('[일지] 저장 실패:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cr-form-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="일지 작성">
      <div className="cr-form-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cr-form-sheet__handle">
          <div className="cr-form-sheet__handle-bar" />
        </div>
        <div className="cr-form-sheet__header">
          <h2 className="cr-form-sheet__title">일지 작성</h2>
          <button className="cr-form-sheet__close" onClick={onClose} aria-label="닫기" type="button">
            <X size={24} />
          </button>
        </div>
        <div className="cr-form-sheet__content">
          <div className="cr-form-sheet__meta">
            {clientName} · {dateTime}
          </div>

          {/* 상담 요약 */}
          <div className="cr-form-field">
            <label className="cr-form-label cr-form-label--required" htmlFor="cr-summary">
              상담 요약
            </label>
            <textarea
              id="cr-summary"
              className={`cr-form-textarea ${errors.summary ? 'cr-form-textarea--error' : ''}`}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="내담자에게 공유되는 한 줄 요약입니다."
              style={{ minHeight: '80px' }}
            />
            {errors.summary && <span className="cr-form-error">{errors.summary}</span>}
          </div>

          {/* 전문가 메모 */}
          <div className="cr-form-field">
            <label className="cr-form-label" htmlFor="cr-memo">
              전문가 메모 (비공개)
            </label>
            <textarea
              id="cr-memo"
              className="cr-form-textarea"
              value={privateMemo}
              onChange={(e) => setPrivateMemo(e.target.value)}
              placeholder="상담사만 볼 수 있는 상세 메모입니다."
            />
          </div>

          {/* 태그 */}
          <div className="cr-form-field">
            <label className="cr-form-label">주요 주제 태그</label>
            <div className="cr-form-tags">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`cr-form-tag ${selectedTags.includes(tag) ? 'cr-form-tag--selected' : 'cr-form-tag--available'}`}
                  onClick={() => toggleTag(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button
            className="cr-form-submit"
            onClick={handleSave}
            disabled={saving}
            type="button"
          >
            {saving ? '저장 중...' : '일지 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RecordDetailSheet = ({ record, onClose }) => {
  const clientName = record?.clientName || record?.userName || '내담자';

  return (
    <div className="cr-form-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="일지 상세">
      <div className="cr-form-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cr-form-sheet__handle">
          <div className="cr-form-sheet__handle-bar" />
        </div>
        <div className="cr-form-sheet__header">
          <h2 className="cr-form-sheet__title">일지 상세</h2>
          <button className="cr-form-sheet__close" onClick={onClose} aria-label="닫기" type="button">
            <X size={24} />
          </button>
        </div>
        <div className="cr-form-sheet__content">
          <div className="cr-form-sheet__meta">
            {clientName} · {formatDateTime(record?.consultationDate || record?.createdAt)}
          </div>

          {record?.summary && (
            <div className="cr-form-field">
              <span className="cr-form-label">상담 요약</span>
              <p style={{ fontSize: 'var(--mg-font-size-base)', color: 'var(--mg-color-text-main)' }}>
                {record.summary}
              </p>
            </div>
          )}

          {record?.privateMemo && (
            <div className="cr-form-field">
              <span className="cr-form-label">전문가 메모</span>
              <p style={{ fontSize: 'var(--mg-font-size-base)', color: 'var(--mg-color-text-main)' }}>
                {record.privateMemo}
              </p>
            </div>
          )}

          {(record?.clientCondition || record?.mainIssues) && (
            <div className="cr-form-field">
              <span className="cr-form-label">내담자 상태</span>
              <p style={{ fontSize: 'var(--mg-font-size-base)', color: 'var(--mg-color-text-main)' }}>
                {record.clientCondition || record.mainIssues}
              </p>
            </div>
          )}

          {record?.tags?.length > 0 && (
            <div className="cr-form-field">
              <span className="cr-form-label">태그</span>
              <div className="cr-form-tags">
                {record.tags.map((tag, idx) => (
                  <span key={idx} className="cr-form-tag cr-form-tag--selected">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConsultantRecordsRenewal = () => {
  const { user, isLoading: sessionLoading } = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS.PENDING);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [completedRecords, setCompletedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [formTarget, setFormTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  const fetchRecords = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      const [pendingRes, completedRes] = await Promise.allSettled([
        TenantAwareApiClient.get(`${API_ENDPOINTS.RECORDS}/${user.id}/consultation-records`, {
          status: 'PENDING',
        }),
        TenantAwareApiClient.get(`${API_ENDPOINTS.RECORDS}/${user.id}/consultation-records`, {
          status: 'COMPLETED',
          ...(dateFilter ? { date: dateFilter } : {}),
        }),
      ]);

      if (pendingRes.status === 'fulfilled') {
        const data = Array.isArray(pendingRes.value)
          ? pendingRes.value
          : pendingRes.value?.data || pendingRes.value?.content || [];
        const sorted = data.sort((a, b) => {
          const dateA = new Date(a.consultationDate || a.startTime || 0);
          const dateB = new Date(b.consultationDate || b.startTime || 0);
          return dateA - dateB;
        });
        setPendingRecords(sorted);
      }

      if (completedRes.status === 'fulfilled') {
        const data = Array.isArray(completedRes.value)
          ? completedRes.value
          : completedRes.value?.data || completedRes.value?.content || [];
        setCompletedRecords(data);
      }
    } catch (err) {
      console.error('[일지] 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, dateFilter]);

  useEffect(() => {
    if (!sessionLoading && user?.id) {
      fetchRecords();
    } else if (!sessionLoading) {
      setLoading(false);
    }
  }, [sessionLoading, user?.id, fetchRecords]);

  const handleSaveRecord = async (formData) => {
    try {
      await TenantAwareApiClient.post(
        `${API_ENDPOINTS.RECORDS}/${user.id}/consultation-records`,
        formData
      );
      showToast({ message: '일지가 저장되었습니다.', type: 'success' });
      fetchRecords();
    } catch (err) {
      console.error('[일지] 저장 실패:', err);
      showToast({ message: '일지 저장에 실패했습니다.', type: 'error' });
      throw err;
    }
  };

  const handleWriteLog = (record) => {
    if (record.consultationId || record.id) {
      navigate(`/consultant/consultation-record/${record.consultationId || record.id}`);
    } else {
      setFormTarget(record);
    }
  };

  const handleViewDetail = (record) => {
    if (record.recordId || record.id) {
      navigate(`/consultant/consultation-record-view/${record.recordId || record.id}`);
    } else {
      setDetailTarget(record);
    }
  };

  const currentRecords = activeTab === TABS.PENDING ? pendingRecords : completedRecords;

  if (sessionLoading || loading) {
    return <RecordsSkeleton />;
  }

  return (
    <div className="cr-records">
      {/* 탭 */}
      <div className="cr-records__tabs" role="tablist">
        <button
          className={`cr-records__tab ${activeTab === TABS.PENDING ? 'cr-records__tab--active' : ''}`}
          onClick={() => setActiveTab(TABS.PENDING)}
          role="tab"
          aria-selected={activeTab === TABS.PENDING}
          type="button"
        >
          작성 대기
          {pendingRecords.length > 0 && (
            <span className="cr-records__tab-badge">{pendingRecords.length}</span>
          )}
        </button>
        <button
          className={`cr-records__tab ${activeTab === TABS.COMPLETED ? 'cr-records__tab--active' : ''}`}
          onClick={() => setActiveTab(TABS.COMPLETED)}
          role="tab"
          aria-selected={activeTab === TABS.COMPLETED}
          type="button"
        >
          작성 완료
        </button>
      </div>

      {/* 날짜 필터 — 완료 탭에서만 */}
      {activeTab === TABS.COMPLETED && (
        <div className="cr-records__date-filter">
          <Calendar size={18} color="var(--mg-color-text-secondary)" />
          <input
            className="cr-records__date-input"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="날짜 필터"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              aria-label="필터 초기화"
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={18} color="var(--mg-color-text-secondary)" />
            </button>
          )}
        </div>
      )}

      {/* 목록 */}
      {currentRecords.length === 0 ? (
        <div className="cr-records__empty">
          <FileText size={48} className="cr-records__empty-icon" />
          <p className="cr-records__empty-text">
            {activeTab === TABS.PENDING
              ? '미작성 일지가 없습니다'
              : '작성된 일지가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="cr-records__list">
          {currentRecords.map((record) => {
            const clientName = record.clientName || record.userName || '내담자';
            const isPending = activeTab === TABS.PENDING;
            const dateStr = record.consultationDate || record.startTime || record.createdAt;

            return (
              <article
                key={record.id || record.recordId || record.scheduleId}
                className={`cr-record-card ${isPending ? 'cr-record-card--pending' : 'cr-record-card--completed'}`}
              >
                <div className="cr-record-card__header">
                  <div className="cr-record-card__client-row">
                    <span className="cr-record-card__avatar" aria-hidden="true">
                      {getInitials(clientName)}
                    </span>
                    <span className="cr-record-card__client-name">{clientName}</span>
                  </div>
                  {isPending && (
                    <span className="cr-record-card__elapsed">
                      <Clock size={14} /> {getElapsedText(dateStr)}
                    </span>
                  )}
                </div>
                <span className="cr-record-card__date">{formatDateTime(dateStr)}</span>
                <div className="cr-record-card__actions">
                  {isPending ? (
                    <button
                      className="cr-record-card__action-btn cr-record-card__action-btn--primary"
                      onClick={() => handleWriteLog(record)}
                      type="button"
                    >
                      <FileText size={14} /> 일지 작성
                    </button>
                  ) : (
                    <>
                      <button
                        className="cr-record-card__action-btn cr-record-card__action-btn--secondary"
                        onClick={() => handleViewDetail(record)}
                        type="button"
                      >
                        <Eye size={14} /> 상세 보기
                      </button>
                      <button
                        className="cr-record-card__action-btn cr-record-card__action-btn--secondary"
                        onClick={() => handleWriteLog(record)}
                        type="button"
                      >
                        수정
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 일지 작성 바텀시트 */}
      {formTarget && (
        <RecordFormSheet
          schedule={formTarget}
          onClose={() => setFormTarget(null)}
          onSave={handleSaveRecord}
        />
      )}

      {/* 일지 상세 바텀시트 */}
      {detailTarget && (
        <RecordDetailSheet
          record={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
};

export default ConsultantRecordsRenewal;
