import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsultationRecordScreen from '../ConsultationRecordScreen';
import { CONSULTATION_RECORD_SCREEN_STRINGS } from '../../../constants/consultationRecordScreenStrings';
import { CONSULTANT_DASHBOARD_ROUTES } from '../../../constants/consultantDashboardRoutes';

/**
 * 상담일지 전체화면 — 일정 로드·상태 화면·모달 연결.
 *
 * <p>이전 화면은 {@code /api/v1/schedules?userId=0&userRole=ADMIN} 응답을 {@code response.success} 로 검사했는데
 * apiGet 이 envelope 를 벗겨 항상 실패했고(「상담 정보를 불러올 수 없습니다」), 저장은 미저장 스텁 API 였다.
 * 이제 경로 일정 id 로 본인 권한 일정 단건을 불러와 대시보드와 같은 상담일지 모달을 띄운다.</p>
 */

const mockStandardizedGet = jest.fn();
const mockNavigate = jest.fn();
const mockModalProps = [];
let mockLocation = { key: 'abc123' };
let mockParams = { consultationId: '900' };

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('react-router-dom', () => ({
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));
jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 7, role: 'CONSULTANT', tenantId: 'tenant-a' } })
}));
jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: (...args) => mockStandardizedGet(...args) }
}));
jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>
}));
jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children }) => <main>{children}</main>,
  ContentHeader: ({ title, subtitle, actions }) => (
    <header>
      <h1>{title}</h1>
      <p data-testid="subtitle">{subtitle}</p>
      {actions}
    </header>
  )
}));
jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => <button type="button" onClick={onClick}>{children}</button>
}));
jest.mock('../ConsultationLogModal', () => ({
  __esModule: true,
  default: (props) => {
    mockModalProps.push(props);
    return props.isOpen ? <div data-testid="log-modal">{`schedule=${props.scheduleData?.id}`}</div> : null;
  }
}));

const SCHEDULE = {
  id: 900,
  clientId: 20,
  consultantId: 7,
  date: '2026-10-04',
  sessionSequence: 3
};

const lastModalProps = () => mockModalProps[mockModalProps.length - 1];

describe('ConsultationRecordScreen — 일정 로드와 상담일지 모달', () => {
  beforeEach(() => {
    mockStandardizedGet.mockReset();
    mockNavigate.mockReset();
    mockModalProps.length = 0;
    mockLocation = { key: 'abc123' };
    mockParams = { consultationId: '900' };
  });

  it('경로 일정 id 로 본인 권한 일정 단건을 불러와 상담일지 폼(모달)을 연다', async() => {
    mockStandardizedGet.mockResolvedValue(SCHEDULE);

    render(<ConsultationRecordScreen />);

    await waitFor(() => expect(screen.getByTestId('log-modal')).toHaveTextContent('schedule=900'));
    expect(mockStandardizedGet).toHaveBeenCalledWith(
      '/api/v1/schedules/900',
      { userId: '7', userRole: 'CONSULTANT' }
    );
    const props = lastModalProps();
    expect(props.scheduleData).toMatchObject({ id: 900, clientId: 20, sessionNumber: 3 });
    expect(props.isAdmin).toBe(false);
    expect(props.routeLeaveGuard).toBe(true);
    expect(screen.getByTestId('subtitle')).toHaveTextContent(CONSULTATION_RECORD_SCREEN_STRINGS.SUBTITLE_READY);
  });

  it('응답이 { data: 일정 } envelope 이어도 같은 일정으로 연다', async() => {
    mockStandardizedGet.mockResolvedValue({ success: true, data: SCHEDULE });

    render(<ConsultationRecordScreen />);

    await waitFor(() => expect(screen.getByTestId('log-modal')).toHaveTextContent('schedule=900'));
  });

  it('조회 실패(500)면 모달 없이 실패 안내와 다시 시도를 보여 주고, 다시 시도하면 재조회한다', async() => {
    mockStandardizedGet.mockRejectedValueOnce(Object.assign(new Error('fail'), { status: 500 }));

    render(<ConsultationRecordScreen />);

    await waitFor(() => expect(screen.getByTestId('subtitle'))
      .toHaveTextContent(CONSULTATION_RECORD_SCREEN_STRINGS.LOAD_FAILED));
    expect(screen.queryByTestId('log-modal')).not.toBeInTheDocument();

    mockStandardizedGet.mockResolvedValueOnce(SCHEDULE);
    await act(async() => {
      fireEvent.click(screen.getByText(CONSULTATION_RECORD_SCREEN_STRINGS.RETRY));
    });
    await waitFor(() => expect(screen.getByTestId('log-modal')).toBeInTheDocument());
    expect(mockStandardizedGet).toHaveBeenCalledTimes(2);
  });

  it('권한 없음(403)이면 권한 안내만 보이고 폼은 열지 않는다', async() => {
    mockStandardizedGet.mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }));

    render(<ConsultationRecordScreen />);

    await waitFor(() => expect(screen.getByTestId('subtitle'))
      .toHaveTextContent(CONSULTATION_RECORD_SCREEN_STRINGS.FORBIDDEN));
    expect(screen.queryByTestId('log-modal')).not.toBeInTheDocument();
    expect(screen.queryByText(CONSULTATION_RECORD_SCREEN_STRINGS.RETRY)).not.toBeInTheDocument();
  });

  it('숫자가 아닌 일정 id 는 조회하지 않고 찾을 수 없음 안내를 보여 준다', async() => {
    mockParams = { consultationId: 'abc' };

    render(<ConsultationRecordScreen />);

    await waitFor(() => expect(screen.getByTestId('subtitle'))
      .toHaveTextContent(CONSULTATION_RECORD_SCREEN_STRINGS.NOT_FOUND));
    expect(mockStandardizedGet).not.toHaveBeenCalled();
  });

  it('모달을 닫으면 이전 화면으로, 직접 URL 진입이면 상담사 대시보드로 간다', async() => {
    mockStandardizedGet.mockResolvedValue(SCHEDULE);
    const { unmount } = render(<ConsultationRecordScreen />);
    await waitFor(() => expect(screen.getByTestId('log-modal')).toBeInTheDocument());
    act(() => lastModalProps().onClose());
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    unmount();

    mockNavigate.mockReset();
    mockLocation = { key: 'default' };
    render(<ConsultationRecordScreen />);
    await waitFor(() => expect(screen.getByTestId('log-modal')).toBeInTheDocument());
    act(() => lastModalProps().onClose());
    expect(mockNavigate).toHaveBeenCalledWith(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD, { replace: true });
  });
});
