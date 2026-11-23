/**
 * 관리자 질문지 패널 — feature OFF 시 숨김
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SctClientQuestionnairePanel from '../SctClientQuestionnairePanel';
import { SCT_TEST_ID } from '../../../../constants/sctOnline';

jest.mock('../../../../hooks/useSctFeatureEnabled', () => ({
  __esModule: true,
  default: () => ({ enabled: false, loading: false, refresh: jest.fn() })
}));

jest.mock('../../../../utils/sctApi', () => ({
  fetchSctClientInvitations: jest.fn(),
  fetchSctInvitation: jest.fn(),
  cancelSctInvitation: jest.fn()
}));

describe('SctClientQuestionnairePanel flag OFF', () => {
  it('renders nothing when SCT feature is disabled', () => {
    const { container } = render(
      <SctClientQuestionnairePanel client={{ id: 9, name: '테스트' }} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId(SCT_TEST_ID.ADMIN_TAB)).not.toBeInTheDocument();
  });
});
