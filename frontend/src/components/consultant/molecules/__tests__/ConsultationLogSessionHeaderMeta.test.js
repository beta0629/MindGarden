/**
 * ConsultationLogSessionHeaderMeta — null→1 폴백 금지
 *
 * @author MindGarden
 * @since 2026-09-14
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationLogSessionHeaderMeta from '../ConsultationLogSessionHeaderMeta';
import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../../../../constants/consultationLogAutosaveStrings';

describe('ConsultationLogSessionHeaderMeta', () => {
  test('유효 회기면 N회기 표시', () => {
    render(
      <ConsultationLogSessionHeaderMeta
        sessionNumber={15}
        sessionDateLabel="2026-09-01"
      />
    );
    expect(screen.getByText('15회기')).toBeInTheDocument();
    expect(screen.getByText('2026-09-01')).toBeInTheDocument();
  });

  test('null이면 1회기로 속이지 않고 미설정 표시', () => {
    render(
      <ConsultationLogSessionHeaderMeta
        sessionNumber={null}
        sessionDateLabel="2026-09-01"
      />
    );
    expect(screen.queryByText('1회기')).not.toBeInTheDocument();
    expect(screen.getByText(CONSULTATION_LOG_SESSION_NUMBER_STRINGS.UNSET_CHIP_LABEL)).toBeInTheDocument();
  });
});
