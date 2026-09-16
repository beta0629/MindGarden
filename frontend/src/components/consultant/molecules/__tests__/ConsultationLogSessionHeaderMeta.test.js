/**
 * ConsultationLogSessionHeaderMeta — null→1 폴백 금지 · 기관연계 라벨
 *
 * @author MindGarden
 * @since 2026-09-14
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationLogSessionHeaderMeta from '../ConsultationLogSessionHeaderMeta';
import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../../../../constants/consultationLogAutosaveStrings';

describe('ConsultationLogSessionHeaderMeta', () => {
  test('sessionNumber null 이면 1회기로 위조하지 않는다', () => {
    render(
      <ConsultationLogSessionHeaderMeta
        sessionNumber={null}
        sessionDateLabel="2026-09-14"
      />
    );
    expect(screen.queryByText(/1회기/)).not.toBeInTheDocument();
    expect(screen.getByText(CONSULTATION_LOG_SESSION_NUMBER_STRINGS.UNSET_CHIP_LABEL)).toBeInTheDocument();
    expect(screen.getByText('2026-09-14')).toBeInTheDocument();
  });

  test('기관연계 모드는 회기 칩 대신 기관 라벨', () => {
    render(
      <ConsultationLogSessionHeaderMeta
        sessionNumber={null}
        sessionDateLabel="2026-09-14"
        institutionLink
      />
    );
    expect(screen.getByText('기관연계')).toBeInTheDocument();
    expect(screen.queryByText(/1회기/)).not.toBeInTheDocument();
  });

  test('유효 sessionNumber 는 N회기', () => {
    render(
      <ConsultationLogSessionHeaderMeta
        sessionNumber={3}
        sessionDateLabel="2026-09-14"
      />
    );
    expect(screen.getByText('3회기')).toBeInTheDocument();
  });
});
