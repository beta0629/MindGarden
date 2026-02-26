import React from 'react';
import MatchQueueRow from '../molecules/MatchQueueRow';
import './ManualMatchingQueue.css';

/**
 * 미배정 내담자 매칭 대기열 (Atomic: organism)
 *
 * @param {Object} props
 * @param {Array<{id:string,clientName:string,clientMeta?:string,consultantOptions:Array}>} props.items - 대기열 항목
 * @param {Function} props.onConfirmMatch - 매칭 확인 핸들러 (clientId, consultantId) => void
 * @param {boolean} [props.loading] - 로딩 상태
 * @author Core Solution
 * @since 2025-02-21
 */
const ManualMatchingQueue = ({ items = [], onConfirmMatch, loading = false }) => {
  const [selectedConsultants, setSelectedConsultants] = React.useState({});

  const handleSelectConsultant = (clientId, consultantId) => {
    setSelectedConsultants((prev) => ({ ...prev, [clientId]: consultantId }));
  };

  const handleConfirm = (item) => {
    const consultantId = selectedConsultants[item.id];
    if (consultantId && onConfirmMatch) {
      onConfirmMatch(item.id, consultantId);
      setSelectedConsultants((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  return (
    <section className="manual-matching-queue">
      <header className="manual-matching-queue__header">
        <h2 className="manual-matching-queue__title">미배정 내담자 매칭 대기열</h2>
        <p className="manual-matching-queue__subtitle">관리자 수동 배정</p>
      </header>
      <div className="manual-matching-queue__list">
        {items.length === 0 ? (
          <div className="manual-matching-queue__empty">대기 중인 내담자가 없습니다</div>
        ) : (
          items.map((item) => (
            <MatchQueueRow
              key={item.id}
              clientName={item.clientName}
              clientMeta={item.clientMeta}
              consultantOptions={item.consultantOptions || []}
              selectedConsultant={selectedConsultants[item.id] || ''}
              onSelectConsultant={(consultantId) => handleSelectConsultant(item.id, consultantId)}
              onConfirm={() => handleConfirm(item)}
              loading={loading}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default ManualMatchingQueue;
