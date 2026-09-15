/**
 * MappingScheduleSidePeekContent — 기관연동 EngagementTypeBadge 단일 렌더
 *
 * status-row 안·밖 이중 호출 회귀 방지 (최가을 Side Peek).
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import {
  ENGAGEMENT_TYPE_BADGE_TEST_ID,
  MAPPING_ENGAGEMENT_TYPE
} from '../../../../constants/mappingEngagementType';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v, fallback = '') => (v == null || v === '' ? fallback : String(v))
}));

jest.mock('../../../../utils/packagePricing', () => ({
  __esModule: true,
  parseCombinedPackageName: () => []
}));

jest.mock('../../../common/ActionButton', () => ({
  __esModule: true,
  default: ({ children, onClick, ...rest }) => (
    <button type="button" onClick={onClick} {...rest}>{children}</button>
  )
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../common/StatusBadge', () => ({
  __esModule: true,
  default: ({ status, children }) => (
    <span data-testid="status-badge" data-status={status}>{children ?? status}</span>
  )
}));

jest.mock('../../../../utils/codeHelper', () => ({
  __esModule: true,
  getMappingStatusKoreanNameSync: (status) => status || '—'
}));

jest.mock('../integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../session-transfer-history/SessionTransferHistorySection', () => ({
  __esModule: true,
  default: () => null
}));

describe('MappingScheduleSidePeekContent engagement badge', () => {
  const institutionMapping = {
    id: 1,
    clientId: 10,
    clientName: '최가을',
    consultantId: 20,
    consultantName: '김상담',
    status: 'ACTIVE',
    remainingSessions: 0,
    paymentTiming: MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK,
    packageName: null
  };

  it('기관연동 배지를 status-row 안에 한 번만 그린다', () => {
    render(<MappingScheduleSidePeekContent mapping={institutionMapping} />);
    const badges = screen.getAllByTestId(ENGAGEMENT_TYPE_BADGE_TEST_ID);
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('기관연동');
    expect(badges[0].closest('.integrated-schedule-side-peek-stub__status-row')).not.toBeNull();
  });
});
