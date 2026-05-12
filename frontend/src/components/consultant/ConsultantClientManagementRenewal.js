/**
 * ConsultantClientManagementRenewal — 내담자 관리 리뉴얼
 *
 * 카드형 목록, 검색·필터(칩), 프로필 상세 바텀시트(탭: 기본정보/이력/메모).
 * 위험 지표 표시(error 색상).
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Users, ChevronRight, MessageSquare
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ConsultantClientManagementRenewal.css';

const API_ENDPOINTS = {
  CLIENTS: '/api/v1/consultants',
  CLIENT_MAPPINGS: '/api/v1/consultation-client-mappings',
};

const FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'URGENT', label: '긴급' },
];

const STATUS_BADGE_MAP = {
  ACTIVE: { label: '활성', className: 'cr-client-card__badge--active' },
  INACTIVE: { label: '비활성', className: 'cr-client-card__badge--inactive' },
  URGENT: { label: '긴급', className: 'cr-client-card__badge--urgent' },
  SUSPENDED: { label: '일시정지', className: 'cr-client-card__badge--inactive' },
  COMPLETED: { label: '완료', className: '' },
  PENDING: { label: '대기', className: '' },
};

const PROFILE_TABS = [
  { key: 'info', label: '기본 정보' },
  { key: 'history', label: '상담 이력' },
  { key: 'memo', label: '메모·태그' },
];

const getInitials = (name) => name ? name.charAt(0) : '?';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const ClientsSkeleton = () => (
  <div className="cr-clients" aria-busy="true">
    <div className="cr-clients__skeleton-search" />
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="cr-clients__skeleton-card" />
    ))}
  </div>
);

const ClientCard = ({ client, onClick }) => {
  const name = client.clientName || client.name || client.userName || '내담자';
  const status = client.status || 'ACTIVE';
  const isUrgent = client.isUrgent || client.urgent || status === 'URGENT';
  const lastSession = client.lastConsultationDate || client.lastSessionDate;
  const badge = STATUS_BADGE_MAP[status] || { label: status, className: '' };

  return (
    <div
      className="cr-client-card"
      onClick={() => onClick?.(client)}
      role="button"
      tabIndex={0}
      aria-label={`${name} 내담자 프로필`}
    >
      <span className="cr-client-card__avatar" aria-hidden="true">
        {getInitials(name)}
      </span>
      <div className="cr-client-card__info">
        <div className="cr-client-card__name">{name}</div>
        <div className="cr-client-card__last-session">
          최근 상담: {formatDate(lastSession)}
        </div>
      </div>
      <div className="cr-client-card__badges">
        {isUrgent && (
          <span className="cr-client-card__badge cr-client-card__badge--urgent">
            긴급
          </span>
        )}
        <span className={`cr-client-card__badge ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <ChevronRight size={18} className="cr-client-card__action" />
    </div>
  );
};

const ProfileSheet = ({ client, onClose, onMessage }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [memo, setMemo] = useState(client?.memo || '');
  const [tags] = useState(client?.tags || []);

  const name = client?.clientName || client?.name || client?.userName || '내담자';
  const status = client?.status || 'ACTIVE';

  useEffect(() => {
    if (client?.id || client?.clientId) {
      loadHistory();
    }
  }, [client]);

  const loadHistory = async () => {
    try {
      const clientId = client.clientId || client.id;
      const res = await TenantAwareApiClient.get('/api/v1/schedules', {
        clientId,
        size: 10,
        sort: 'startTime,desc',
      });
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      setConsultationHistory(data);
    } catch {
      setConsultationHistory([]);
    }
  };

  return (
    <div className="cr-profile-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="내담자 프로필">
      <div className="cr-profile-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cr-profile-sheet__handle">
          <div className="cr-profile-sheet__handle-bar" />
        </div>

        {/* 프로필 헤더 */}
        <div className="cr-profile-sheet__header">
          <span className="cr-profile-sheet__avatar" aria-hidden="true">
            {getInitials(name)}
          </span>
          <div>
            <div className="cr-profile-sheet__name">{name}</div>
            <div className="cr-profile-sheet__status">{STATUS_BADGE_MAP[status]?.label || status}</div>
          </div>
        </div>

        {/* 탭 */}
        <div className="cr-profile-tabs" role="tablist">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`cr-profile-tab ${activeTab === tab.key ? 'cr-profile-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="cr-profile-tab-content" role="tabpanel">
          {activeTab === 'info' && (
            <>
              <div className="cr-profile-field">
                <span className="cr-profile-field__label">이름</span>
                <span className="cr-profile-field__value">{name}</span>
              </div>
              {client?.email && (
                <div className="cr-profile-field">
                  <span className="cr-profile-field__label">이메일</span>
                  <span className="cr-profile-field__value">{client.email}</span>
                </div>
              )}
              {client?.phone && (
                <div className="cr-profile-field">
                  <span className="cr-profile-field__label">연락처</span>
                  <span className="cr-profile-field__value">{client.phone}</span>
                </div>
              )}
              {client?.birthDate && (
                <div className="cr-profile-field">
                  <span className="cr-profile-field__label">생년월일</span>
                  <span className="cr-profile-field__value">{formatDate(client.birthDate)}</span>
                </div>
              )}
              {client?.sessionCount != null && (
                <div className="cr-profile-field">
                  <span className="cr-profile-field__label">총 상담 회기</span>
                  <span className="cr-profile-field__value">{client.sessionCount}회</span>
                </div>
              )}
              <div className="cr-profile-field">
                <span className="cr-profile-field__label">최근 상담</span>
                <span className="cr-profile-field__value">
                  {formatDate(client?.lastConsultationDate || client?.lastSessionDate)}
                </span>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            consultationHistory.length > 0 ? (
              <div className="cr-history-timeline">
                {consultationHistory.map((session, idx) => (
                  <div key={session.id || idx} className="cr-history-item">
                    <div className="cr-history-item__date">{formatDate(session.startTime || session.scheduleDate)}</div>
                    <div className="cr-history-item__title">
                      {session.sessionType || session.consultationType || '상담'} — {session.status || '완료'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cr-clients__empty">
                <Users size={32} className="cr-clients__empty-icon" />
                <p className="cr-clients__empty-text">상담 이력이 없습니다</p>
              </div>
            )
          )}

          {activeTab === 'memo' && (
            <div className="cr-memo-section">
              {tags.length > 0 && (
                <div className="cr-memo-tags">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="cr-memo-tag">{tag}</span>
                  ))}
                </div>
              )}
              <textarea
                className="cr-memo-textarea"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="내담자에 대한 메모를 작성해주세요..."
                aria-label="메모"
              />
            </div>
          )}
        </div>

        {/* 메시지 보내기 */}
        <button
          className="cr-profile-sheet__message-btn"
          onClick={() => onMessage?.(client)}
          type="button"
        >
          <MessageSquare size={18} />
          메시지 보내기
        </button>
      </div>
    </div>
  );
};

const ConsultantClientManagementRenewal = () => {
  const { user, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClients = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      let data = [];

      try {
        const res = await TenantAwareApiClient.get(`${API_ENDPOINTS.CLIENTS}/${user.id}/clients`);
        data = Array.isArray(res) ? res : res?.data || res?.content || [];
      } catch {
        const mappingRes = await TenantAwareApiClient.get(API_ENDPOINTS.CLIENT_MAPPINGS, {
          consultantId: user.id,
        });
        data = Array.isArray(mappingRes) ? mappingRes : mappingRes?.data || mappingRes?.content || [];
      }

      setClients(data);
    } catch (err) {
      console.error('[내담자] 로드 실패:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!sessionLoading && user?.id) {
      fetchClients();
    } else if (!sessionLoading) {
      setLoading(false);
    }
  }, [sessionLoading, user?.id, fetchClients]);

  const filteredClients = useMemo(() => {
    let result = clients;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) => {
        const name = (c.clientName || c.name || c.userName || '').toLowerCase();
        return name.includes(term);
      });
    }

    if (filterStatus !== 'ALL') {
      result = result.filter((c) => {
        if (filterStatus === 'URGENT') return c.isUrgent || c.urgent;
        return (c.status || 'ACTIVE') === filterStatus;
      });
    }

    return result;
  }, [clients, searchTerm, filterStatus]);

  const handleOpenProfile = (client) => {
    setSelectedClient(client);
  };

  const handleMessage = (client) => {
    const consultationId = client.lastConsultationId || client.consultationId;
    if (consultationId) {
      navigate(`/consultant/send-message/${consultationId}`);
    } else {
      navigate('/consultant/messages');
    }
  };

  if (sessionLoading || loading) {
    return <ClientsSkeleton />;
  }

  return (
    <div className="cr-clients">
      {/* 검색 */}
      <div className="cr-clients__search-bar">
        <Search size={20} className="cr-clients__search-icon" />
        <input
          className="cr-clients__search-input"
          type="text"
          placeholder="내담자 이름 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="내담자 검색"
        />
        {searchTerm && (
          <button
            className="cr-clients__search-clear"
            onClick={() => setSearchTerm('')}
            aria-label="검색어 지우기"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 필터 칩 */}
      <div className="cr-clients__filter-chips" role="radiogroup" aria-label="상태 필터">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`cr-clients__chip ${filterStatus === opt.value ? 'cr-clients__chip--active' : ''}`}
            onClick={() => setFilterStatus(opt.value)}
            role="radio"
            aria-checked={filterStatus === opt.value}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 결과 수 */}
      <span className="cr-clients__count">
        {filteredClients.length}명의 내담자
      </span>

      {/* 목록 */}
      {filteredClients.length === 0 ? (
        <div className="cr-clients__empty">
          <Users size={48} className="cr-clients__empty-icon" />
          <p className="cr-clients__empty-text">
            {searchTerm ? '검색 결과가 없습니다' : '담당 내담자가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="cr-clients__list">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.clientId || client.id || client.userId}
              client={client}
              onClick={handleOpenProfile}
            />
          ))}
        </div>
      )}

      {/* 프로필 바텀시트 */}
      {selectedClient && (
        <ProfileSheet
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onMessage={handleMessage}
        />
      )}
    </div>
  );
};

export default ConsultantClientManagementRenewal;
