/**
 * SCT 인쇄 미리보기 라우트 — 용지·방향·배율 · window.print · 인쇄 감사
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import notificationManager from '../../../utils/notification';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import {
  fetchSctInvitation,
  recordSctPrintAudit
} from '../../../utils/sctApi';
import useSctFeatureEnabled from '../../../hooks/useSctFeatureEnabled';
import {
  SCT_CSS,
  SCT_PRINT_ORIENTATION,
  SCT_PRINT_PAPER,
  SCT_PRINT_SCALE,
  SCT_PRINT_SCALE_FACTOR,
  SCT_STATUS,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import SctPrintDocument from './SctPrintDocument';
import './sctPrint.css';
import '../../admin/sct/sctAdmin.css';

const PAGE_SIZE_CSS = Object.freeze({
  [`${SCT_PRINT_PAPER.A4}|${SCT_PRINT_ORIENTATION.PORTRAIT}`]: 'A4 portrait',
  [`${SCT_PRINT_PAPER.A4}|${SCT_PRINT_ORIENTATION.LANDSCAPE}`]: 'A4 landscape',
  [`${SCT_PRINT_PAPER.B5}|${SCT_PRINT_ORIENTATION.PORTRAIT}`]: 'B5 portrait',
  [`${SCT_PRINT_PAPER.B5}|${SCT_PRINT_ORIENTATION.LANDSCAPE}`]: 'B5 landscape',
  [`${SCT_PRINT_PAPER.LETTER}|${SCT_PRINT_ORIENTATION.PORTRAIT}`]: 'letter portrait',
  [`${SCT_PRINT_PAPER.LETTER}|${SCT_PRINT_ORIENTATION.LANDSCAPE}`]: 'letter landscape'
});

/**
 * @returns {JSX.Element}
 */
const SctPrintPreviewPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invitationId = params.get('invitationId');
  const clientName = params.get('clientName') || '';
  const { enabled, loading: flagLoading } = useSctFeatureEnabled();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paper, setPaper] = useState(SCT_PRINT_PAPER.A4);
  const [orientation, setOrientation] = useState(SCT_PRINT_ORIENTATION.PORTRAIT);
  const [scaleKey, setScaleKey] = useState(SCT_PRINT_SCALE.S100);
  const [fitScale, setFitScale] = useState(1);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!enabled || invitationId == null) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async() => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchSctInvitation(invitationId);
        if (!cancelled) {
          setData(res);
        }
      } catch (e) {
        if (!cancelled) {
          setError(resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, invitationId]);

  const pageSize = PAGE_SIZE_CSS[`${paper}|${orientation}`] || 'A4 portrait';

  const effectiveScale = useMemo(() => {
    if (scaleKey === SCT_PRINT_SCALE.FIT) {
      return fitScale;
    }
    return SCT_PRINT_SCALE_FACTOR[scaleKey] || 1;
  }, [fitScale, scaleKey]);

  useEffect(() => {
    if (scaleKey !== SCT_PRINT_SCALE.FIT || !sheetRef.current) return undefined;
    const el = sheetRef.current;
    const measure = () => {
      const parent = el.parentElement;
      if (!parent) return;
      const avail = parent.clientWidth - 32;
      const natural = el.scrollWidth || el.offsetWidth || 1;
      const next = Math.min(1, Math.max(0.7, avail / natural));
      setFitScale(Number(next.toFixed(3)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [scaleKey, data, paper, orientation]);

  const handlePrint = useCallback(async() => {
    if (invitationId == null) return;
    try {
      await recordSctPrintAudit(invitationId);
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.PRINT_AUDIT_FAIL),
        'error'
      );
      return;
    }
    window.print();
  }, [invitationId]);

  if (flagLoading || loading) {
    return <UnifiedLoading type="page" text={SCT_UI.LOADING} />;
  }
  if (!enabled) {
    return (
      <main className={SCT_CSS.PRINT}>
        <p role="alert">{SCT_UI.FEATURE_OFF_HIDDEN}</p>
      </main>
    );
  }
  if (!invitationId) {
    return (
      <main className={SCT_CSS.PRINT}>
        <p role="alert">invitationId 가 필요합니다.</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className={SCT_CSS.PRINT}>
        <p role="alert"><SafeText>{error}</SafeText></p>
      </main>
    );
  }
  if (!data || data.status !== SCT_STATUS.SUBMITTED) {
    return (
      <main className={SCT_CSS.PRINT}>
        <p role="alert">{SCT_UI.PENDING_TITLE}</p>
      </main>
    );
  }

  return (
    <main
      className={SCT_CSS.PRINT}
      data-paper={paper}
      data-orient={orientation}
      data-scale={scaleKey}
      style={{ '--sct-print-scale': String(effectiveScale) }}
    >
      <style>{`@page { size: ${pageSize}; margin: 12mm; }`}</style>
      <div className={`${SCT_CSS.PRINT_CONTROLS} mg-v2-sct-no-print`} role="toolbar" aria-label={SCT_UI.PRINT_PREVIEW}>
        <div className="mg-v2-sct-print-controls__field">
          <label htmlFor="sct-print-paper">{SCT_UI.PRINT_PAPER}</label>
          <select
            id="sct-print-paper"
            data-testid={SCT_TEST_ID.PRINT_PAPER}
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
          >
            <option value={SCT_PRINT_PAPER.A4}>A4</option>
            <option value={SCT_PRINT_PAPER.B5}>B5</option>
            <option value={SCT_PRINT_PAPER.LETTER}>Letter</option>
          </select>
        </div>
        <div className="mg-v2-sct-print-controls__field">
          <label htmlFor="sct-print-orient">{SCT_UI.PRINT_ORIENTATION}</label>
          <select
            id="sct-print-orient"
            data-testid={SCT_TEST_ID.PRINT_ORIENT}
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
          >
            <option value={SCT_PRINT_ORIENTATION.PORTRAIT}>{SCT_UI.PRINT_PORTRAIT}</option>
            <option value={SCT_PRINT_ORIENTATION.LANDSCAPE}>{SCT_UI.PRINT_LANDSCAPE}</option>
          </select>
        </div>
        <div className="mg-v2-sct-print-controls__field">
          <label htmlFor="sct-print-scale">{SCT_UI.PRINT_SCALE}</label>
          <select
            id="sct-print-scale"
            data-testid={SCT_TEST_ID.PRINT_SCALE}
            value={scaleKey}
            onChange={(e) => setScaleKey(e.target.value)}
          >
            <option value={SCT_PRINT_SCALE.FIT}>{SCT_UI.PRINT_SCALE_FIT}</option>
            <option value={SCT_PRINT_SCALE.S90}>90%</option>
            <option value={SCT_PRINT_SCALE.S100}>100%</option>
            <option value={SCT_PRINT_SCALE.S110}>110%</option>
          </select>
        </div>
        <div className="mg-v2-sct-print-controls__actions">
          <MGButton
            type="button"
            variant="primary"
            size="small"
            preventDoubleClick
            data-testid={SCT_TEST_ID.PRINT_DO}
            onClick={handlePrint}
          >
            {SCT_UI.PRINT_DO}
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            preventDoubleClick={false}
            onClick={() => navigate(-1)}
          >
            {SCT_UI.PRINT_CLOSE}
          </MGButton>
        </div>
      </div>
      <div ref={sheetRef}>
        <SctPrintDocument
          answers={data.answers || []}
          formType={data.formType}
          clientName={clientName}
          submittedAt={data.submittedAt}
          managementNo={data.managementNo}
        />
      </div>
    </main>
  );
};

export default SctPrintPreviewPage;
