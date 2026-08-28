/**
 * Operator ledger — 카드 수수료 설정 quiet panel
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { ERP_API } from '../../../../constants/api';
import { FM_CARD_FEE } from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

const DEFAULT_ISSUER_LABELS = [
  '신한',
  '삼성',
  'KB국민',
  '현대',
  '농협',
  '우리',
  '하나',
  'BC',
  '기타'
];

const buildDefaultIssuerRows = () => DEFAULT_ISSUER_LABELS.map((label, index) => ({
  key: `default-${index}`,
  issuerLabel: label,
  ratePercent: ''
}));

const parseSettingsEnvelope = (envelope) => {
  if (!envelope || envelope.success === false) {
    return null;
  }
  return envelope.data ?? envelope;
};

const mapIssuerRowsFromSettings = (settings) => {
  const list = Array.isArray(settings?.issuerRates) ? settings.issuerRates : [];
  if (list.length === 0) {
    return buildDefaultIssuerRows();
  }
  return list.map((row, index) => ({
    key: row.id != null ? String(row.id) : `row-${index}`,
    issuerLabel: row.issuerLabel || '',
    ratePercent: row.ratePercent != null && row.ratePercent !== '' ? String(row.ratePercent) : ''
  }));
};

const parseRateInput = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return null;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : null;
};

const CardMerchantFeeSettingsPanel = ({ panelRef }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [averageRate, setAverageRate] = useState('');
  const [issuerRows, setIssuerRows] = useState(buildDefaultIssuerRows);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const envelope = await StandardizedApi.get(
        ERP_API.CARD_MERCHANT_FEE_SETTINGS,
        {},
        { unwrapApiEnvelope: false }
      );
      const settings = parseSettingsEnvelope(envelope);
      setAverageRate(
        settings?.averageRatePercent != null && settings.averageRatePercent !== ''
          ? String(settings.averageRatePercent)
          : ''
      );
      setIssuerRows(mapIssuerRowsFromSettings(settings));
    } catch {
      notificationManager.error(FM_CARD_FEE.LOAD_FAIL);
      setAverageRate('');
      setIssuerRows(buildDefaultIssuerRows());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleAddIssuer = () => {
    setIssuerRows((prev) => [
      ...prev,
      { key: `new-${Date.now()}`, issuerLabel: '', ratePercent: '' }
    ]);
  };

  const handleRemoveIssuer = (key) => {
    setIssuerRows((prev) => prev.filter((row) => row.key !== key));
  };

  const handleIssuerChange = (key, field, value) => {
    setIssuerRows((prev) => prev.map((row) => (
      row.key === key ? { ...row, [field]: value } : row
    )));
  };

  const payloadIssuerRates = useMemo(() => issuerRows
    .map((row) => ({
      issuerLabel: (row.issuerLabel || '').trim(),
      ratePercent: parseRateInput(row.ratePercent)
    }))
    .filter((row) => row.issuerLabel && row.ratePercent != null), [issuerRows]);

  const handleSave = async () => {
    const averageParsed = parseRateInput(averageRate);
    setSaving(true);
    try {
      await StandardizedApi.put(ERP_API.CARD_MERCHANT_FEE_SETTINGS, {
        averageRatePercent: averageParsed,
        issuerRates: payloadIssuerRates
      });
      notificationManager.success(FM_CARD_FEE.SAVE_OK);
      await loadSettings();
    } catch (err) {
      notificationManager.error(err?.message || FM_CARD_FEE.SAVE_FAIL);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      ref={panelRef}
      className="operator-ledger-recurring"
      data-testid="operator-ledger-card-fee"
      aria-labelledby="operator-ledger-card-fee-title"
    >
      <div className="operator-ledger-recurring__head">
        <div>
          <h2 id="operator-ledger-card-fee-title" className="operator-ledger-recurring__title">
            {FM_CARD_FEE.TITLE}
          </h2>
          <p className="operator-ledger-recurring__caption">{FM_CARD_FEE.CAPTION}</p>
        </div>
      </div>

      {loading ? (
        <p className="operator-ledger-recurring__muted">불러오는 중...</p>
      ) : (
        <div className="operator-ledger-recurring__form">
          <label className="operator-ledger-recurring__field">
            <span>{FM_CARD_FEE.AVERAGE_RATE_LABEL}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={averageRate}
              onChange={(e) => setAverageRate(e.target.value)}
              placeholder={FM_CARD_FEE.AVERAGE_RATE_PLACEHOLDER}
              disabled={saving}
              aria-describedby="card-fee-average-caption"
            />
            <small id="card-fee-average-caption" className="operator-ledger-recurring__hint">
              {FM_CARD_FEE.AVERAGE_RATE_CAPTION}
            </small>
          </label>

          <div className="operator-ledger-recurring__missing">
            <div className="operator-ledger-recurring__head">
              <h3 className="operator-ledger-recurring__missing-title">
                {FM_CARD_FEE.ISSUER_SECTION_TITLE}
              </h3>
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleAddIssuer}
                disabled={saving}
                preventDoubleClick={false}
              >
                {FM_CARD_FEE.ADD_ISSUER}
              </MGButton>
            </div>

            {issuerRows.length === 0 ? (
              <p className="operator-ledger-recurring__empty">{FM_CARD_FEE.EMPTY_ISSUERS}</p>
            ) : (
              <ul className="operator-ledger-recurring__list">
                {issuerRows.map((row) => (
                  <li key={row.key} className="operator-ledger-recurring__item">
                    <div className="operator-ledger-recurring__missing-actions">
                      <input
                        type="text"
                        className="operator-ledger-recurring__missing-input"
                        value={row.issuerLabel}
                        onChange={(e) => handleIssuerChange(row.key, 'issuerLabel', e.target.value)}
                        placeholder={FM_CARD_FEE.ISSUER_LABEL}
                        aria-label={FM_CARD_FEE.ISSUER_LABEL}
                        disabled={saving}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="operator-ledger-recurring__missing-input"
                        value={row.ratePercent}
                        onChange={(e) => handleIssuerChange(row.key, 'ratePercent', e.target.value)}
                        placeholder={FM_CARD_FEE.ISSUER_RATE}
                        aria-label={FM_CARD_FEE.ISSUER_RATE}
                        disabled={saving}
                      />
                      <MGButton
                        type="button"
                        variant="ghost"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => handleRemoveIssuer(row.key)}
                        disabled={saving}
                        preventDoubleClick={false}
                      >
                        {FM_CARD_FEE.REMOVE_ISSUER}
                      </MGButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="financial-transaction-form-actions">
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: saving })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleSave}
              loading={saving}
              preventDoubleClick
            >
              {FM_CARD_FEE.SAVE}
            </MGButton>
          </div>
        </div>
      )}
    </section>
  );
};

CardMerchantFeeSettingsPanel.propTypes = {
  panelRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ])
};

export default CardMerchantFeeSettingsPanel;
