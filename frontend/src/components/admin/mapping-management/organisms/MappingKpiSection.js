/**
 * MappingKpiSection - 매칭 KPI 카드 영역
 * ContentKpiRow + lucide-react 아이콘
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React from 'react';
import { Clock, CheckCircle, CreditCard, LayoutGrid, XCircle, RotateCcw } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import './MappingKpiSection.css';
import SafeText from '../../../common/SafeText';

const ICON_SIZE = 24;

const buildKpiItems = (mappings) => {
  const pending = mappings.filter((m) => m.status === 'PENDING_PAYMENT').length;
  const active = mappings.filter((m) => m.status === 'ACTIVE').length;
  const paymentConfirmed = mappings.filter((m) => m.status === 'PAYMENT_CONFIRMED').length;
  const total = mappings.length;
  const terminated = mappings.filter((m) => m.status === 'TERMINATED').length;
  const exhausted = mappings.filter((m) => m.status === 'SESSIONS_EXHAUSTED').length;

  return [
    {
      id: 'PENDING_PAYMENT',
      icon: <Clock size={ICON_SIZE} />,
      label: '결제 대기',
      value: `${pending}건`,
      count: pending,
      iconVariant: 'orange',
      badge: pending > 0 ? '확인 필요' : null,
      badgeVariant: 'orange',
      action: 'payment'
    },
    {
      id: 'ACTIVE',
      icon: <CheckCircle size={ICON_SIZE} />,
      label: '활성 매칭',
      value: `${active}건`,
      count: active,
      iconVariant: 'green',
      action: 'view'
    },
    {
      id: 'PAYMENT_CONFIRMED',
      icon: <CreditCard size={ICON_SIZE} />,
      label: '결제 확인',
      value: `${paymentConfirmed}건`,
      count: paymentConfirmed,
      iconVariant: 'blue',
      action: 'view'
    },
    {
      id: 'TOTAL',
      icon: <LayoutGrid size={ICON_SIZE} />,
      label: '전체',
      value: `${total}건`,
      count: total,
      iconVariant: 'blue',
      action: 'view_all'
    },
    {
      id: 'TERMINATED',
      icon: <XCircle size={ICON_SIZE} />,
      label: '종료됨',
      value: `${terminated}건`,
      count: terminated,
      iconVariant: 'gray',
      action: 'view'
    },
    {
      id: 'SESSIONS_EXHAUSTED',
      icon: <RotateCcw size={ICON_SIZE} />,
      label: '회기 소진',
      value: `${exhausted}건`,
      count: exhausted,
      iconVariant: 'orange',
      action: 'view'
    }
  ];
};

const MappingKpiSection = ({ mappings = [], onStatCardClick }) => {
  const items = buildKpiItems(mappings, onStatCardClick);

  return (
    <ContentSection noCard className="mg-v2-mapping-kpi-section">
      <div className="mg-v2-mapping-kpi-section__grid">
        {items.map((item) => (
          <div key={item.id} className="mg-v2-mapping-kpi-section__card">
            <div className={`mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--${item.iconVariant}`}>
              {item.icon}
            </div>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'mg-v2-mapping-kpi-section__body-btn'
              })}
              onClick={() => onStatCardClick && onStatCardClick(item)}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              <div className="mg-v2-mapping-kpi-section__info">
                <span className="mg-v2-mapping-kpi-section__label"><SafeText>{item.label}</SafeText></span>
                <span className="mg-v2-mapping-kpi-section__value"><SafeText>{item.value}</SafeText></span>
              </div>
            </MGButton>
          </div>
        ))}
      </div>
    </ContentSection>
  );
};

export default MappingKpiSection;
