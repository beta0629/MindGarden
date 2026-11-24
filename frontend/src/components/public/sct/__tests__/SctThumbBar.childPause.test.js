/**
 * 아동 「쉬었다 할래요」는 하단 엄지 바에 둔다 (r1 Ship)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SctThumbBar from '../molecules/SctThumbBar';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, preventDoubleClick, loading, ...rest }) => (
    <button type="button" onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  )
}));

describe('SctThumbBar child pause', () => {
  it('places pause control inside thumb bar', () => {
    const onPause = jest.fn();
    render(
      <SctThumbBar
        primaryLabel={SCT_UI.NEXT}
        onPrimary={jest.fn()}
        showPause
        onPause={onPause}
      />
    );
    const bar = screen.getByTestId(SCT_TEST_ID.THUMB_BAR);
    const pause = screen.getByTestId(SCT_TEST_ID.PAUSE_CHILD);
    expect(bar).toContainElement(pause);
    expect(pause).toHaveTextContent(SCT_UI.PAUSE_CHILD);
    fireEvent.click(pause);
    expect(onPause).toHaveBeenCalled();
  });
});
