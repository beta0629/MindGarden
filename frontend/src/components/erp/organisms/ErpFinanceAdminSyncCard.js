/**
 * ERP 대시보드 — 회계 초기화·백필 동기화 카드
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { Settings2, RefreshCw, HelpCircle } from 'lucide-react';
import Button from '../../ui/Button/Button';

/**
 * @param {object} props
 * @param {boolean} props.initLoading
 * @param {{ ok: boolean, message: string }|null} props.initResult
 * @param {boolean} props.backfillLoading
 * @param {{ ok: boolean, message: string }|null} props.backfillResult
 * @param {() => Promise<void>} props.onInitTenantErp
 * @param {() => Promise<void>} props.onBackfillJournalEntries
 */
const ErpFinanceAdminSyncCard = ({
  initLoading,
  initResult,
  backfillLoading,
  backfillResult,
  onInitTenantErp,
  onBackfillJournalEntries
}) => (
  <div className="mg-v2-ad-b0kla__card erp-finance-sync">
    <h2 className="mg-v2-ad-b0kla__section-title">
      <Settings2 size={20} aria-hidden className="erp-finance-sync__title-icon" />
      데이터 동기화
    </h2>
    <div className="erp-finance-sync__usage">
      <p>
        <strong>사용 방법</strong>
      </p>
      <ol>
        <li>
          <strong>init-tenant-erp</strong>: 신규 테넌트 또는 재무 데이터가 보이지 않을 때 먼저 실행. 계정
          매핑(REVENUE/EXPENSE/CASH)을 생성합니다.
        </li>
        <li>
          <strong>backfill-journal-entries</strong>: 미반영 수입 거래를 자동으로 반영합니다. init 이후
          실행 권장.
        </li>
      </ol>
      <p className="erp-finance-sync__auto">
        <RefreshCw size={16} aria-hidden className="erp-finance-sync__inline-icon" />
        <strong>자동 동기화</strong>: 매일 00:08에 init·백필이 자동 실행됩니다.
        (scheduler.erp-automation.enabled=true)
      </p>
    </div>
    <div className="erp-finance-sync__urls">
      <div className="erp-finance-sync__url-item">
        <code>POST /api/v1/erp/accounting/init-tenant-erp</code>
        <Button
          variant="primary"
          size="small"
          onClick={onInitTenantErp}
          disabled={initLoading}
          preventDoubleClick={true}
        >
          {initLoading ? '실행 중...' : '실행'}
        </Button>
      </div>
      <div className="erp-finance-sync__url-item">
        <code>POST /api/v1/erp/accounting/backfill-journal-entries</code>
        <Button
          variant="primary"
          size="small"
          onClick={onBackfillJournalEntries}
          disabled={backfillLoading}
          preventDoubleClick={true}
        >
          {backfillLoading ? '실행 중...' : '실행'}
        </Button>
      </div>
    </div>
    {(initResult || backfillResult) && (
      <div className="erp-finance-sync__results">
        {initResult && (
          <div
            className={`erp-finance-sync__result ${initResult.ok ? 'erp-finance-sync__result--success' : 'erp-finance-sync__result--error'}`}
          >
            init: {initResult.message}
          </div>
        )}
        {backfillResult && (
          <div
            className={`erp-finance-sync__result ${backfillResult.ok ? 'erp-finance-sync__result--success' : 'erp-finance-sync__result--error'}`}
          >
            backfill: {backfillResult.message}
          </div>
        )}
      </div>
    )}
    <p className="erp-finance-sync__help">
      <HelpCircle size={14} aria-hidden className="erp-finance-sync__help-icon" />
      curl/Postman: 관리자 로그인 후 세션 쿠키와 함께 POST 호출. X-Tenant-Id는 현재 테넌트에 맞게 설정.
    </p>
  </div>
);

export default ErpFinanceAdminSyncCard;
