import React from 'react';
import MGButton from '../../../common/MGButton';
import './SchedulePendingList.css';

/**
 * 스케줄 등록 대기 목록 (Atomic: organism)
 *
 * @param {Object} props
 * @param {Array<{id:string,clientName?:string,consultantName?:string,mappingId?:string}>} props.items - 대기 항목
 * @param {Function} props.onScheduleRegister - 스케줄 등록 핸들러 (itemId) => void
 * @author Core Solution
 * @since 2025-02-21
 */
const SchedulePendingList = ({ items = [], onScheduleRegister }) => {
  if (items.length === 0) return null;

  return (
    <section className="schedule-pending-list">
      <header className="schedule-pending-list__header">
        <h3 className="schedule-pending-list__title">스케줄 등록 대기</h3>
      </header>
      <ul className="schedule-pending-list__items">
        {items.map((item) => (
          <li key={item.id} className="schedule-pending-list__item">
            <div className="schedule-pending-list__info">
              <span className="schedule-pending-list__name">{item.clientName || '-'}</span>
              {item.consultantName && (
                <span className="schedule-pending-list__consultant">
                  · {item.consultantName}
                </span>
              )}
            </div>
            <MGButton
              variant="primary"
              size="small"
              onClick={() => onScheduleRegister && onScheduleRegister(item)}
            >
              등록
            </MGButton>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SchedulePendingList;
