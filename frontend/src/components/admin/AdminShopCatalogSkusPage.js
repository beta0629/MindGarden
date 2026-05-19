/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU 관리 (P2-admin)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import { ListTableView } from '../common';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import {
  ADMIN_SHOP_API,
  buildAdminShopCatalogSkuPath,
  buildAdminShopCatalogVisiblePath,
  buildCatalogVisiblePatchBody
} from '../../constants/adminShopApi';
import {
  ADMIN_SHOP_PRICE_HISTORY_ACTION_LABEL,
  ADMIN_SHOP_PRICE_HISTORY_COLUMN_LABELS,
  ADMIN_SHOP_PRICE_HISTORY_EMPTY_MESSAGE,
  ADMIN_SHOP_PRICE_HISTORY_MODAL_TITLE
} from '../../constants/adminShopCatalog';
import { listAdminShopCatalogSkuPriceHistory } from '../../services/adminShopCatalogService';
import { formatShopDateTime, formatShopMoney } from '../../utils/clientShopFormat';
import { USER_ROLES } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-shop-catalog-skus-title';
const SKU_CODE_MAX = 64;
const TITLE_MAX = 200;

const emptyForm = () => ({
  skuCode: '',
  title: '',
  descriptionText: '',
  unitPriceMinor: '',
  currency: 'KRW',
  catalogVisible: true,
  active: true,
  sortOrder: '0'
});

function normalizeListPayload(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && raw.success === true && Array.isArray(raw.data)) {
    return raw.data;
  }
  if (raw && Array.isArray(raw.data)) {
    return raw.data;
  }
  return [];
}

function mapRowToForm(row) {
  if (!row || typeof row !== 'object') {
    return emptyForm();
  }
  return {
    skuCode: toDisplayString(row.skuCode, ''),
    title: toDisplayString(row.title, ''),
    descriptionText: toDisplayString(row.descriptionText, ''),
    unitPriceMinor: row.unitPriceMinor != null ? String(row.unitPriceMinor) : '',
    currency: toDisplayString(row.currency, 'KRW'),
    catalogVisible: row.catalogVisible !== false,
    active: row.active !== false,
    sortOrder: row.sortOrder != null ? String(row.sortOrder) : '0'
  };
}

function buildUpsertBody(form) {
  const price = Number.parseInt(String(form.unitPriceMinor).replace(/\D/g, ''), 10);
  const sortOrder = Number.parseInt(String(form.sortOrder), 10);
  return {
    skuCode: form.skuCode.trim(),
    title: form.title.trim(),
    descriptionText: form.descriptionText.trim() || null,
    unitPriceMinor: Number.isFinite(price) ? price : 0,
    currency: (form.currency || 'KRW').trim().toUpperCase(),
    catalogVisible: Boolean(form.catalogVisible),
    active: Boolean(form.active),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
  };
}

const AdminShopCatalogSkusPage = () => {
  const navigate = useNavigate();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [priceHistoryRows, setPriceHistoryRows] = useState([]);
  const [priceHistorySkuLabel, setPriceHistorySkuLabel] = useState('');

  const loadSkus = useCallback(async() => {
    setLoading(true);
    try {
      const raw = await StandardizedApi.get(ADMIN_SHOP_API.CATALOG_SKUS);
      setRows(normalizeListPayload(raw));
    } catch (e) {
      setRows([]);
      notificationManager.error(
        e?.message != null ? String(e.message) : '상품 목록을 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowed) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/', { replace: true });
      return;
    }
    loadSkus();
  }, [sessionLoading, isLoggedIn, user, allowed, navigate, loadSkus]);

  const tableRows = useMemo(() => {
    return (Array.isArray(rows) ? rows : []).map((row, idx) => {
      const price = row.unitPriceMinor != null ? Number(row.unitPriceMinor).toLocaleString('ko-KR') : '';
      const visible = row.catalogVisible !== false;
      return {
        __rowKey: row.id != null ? `sku-${String(row.id)}` : `sku-idx-${idx}`,
        colCode: toDisplayString(row.skuCode, ''),
        colTitle: toDisplayString(row.title, ''),
        colPrice: price ? `${price}원` : '',
        colMeta: `노출:${visible ? 'Y' : 'N'} · 판매:${row.active !== false ? 'Y' : 'N'}`,
        __raw: row
      };
    });
  }, [rows]);

  const openCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = async(row) => {
    const id = row?.id ?? row?.__raw?.id;
    if (id == null) {
      return;
    }
    setFormMode('edit');
    setEditingId(id);
    try {
      const raw = await StandardizedApi.get(buildAdminShopCatalogSkuPath(id));
      const data = raw?.data ?? raw;
      setForm(mapRowToForm(data));
      setModalOpen(true);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '상품 상세를 불러오지 못했습니다.'
      );
    }
  };

  const closeModal = () => {
    if (saving) {
      return;
    }
    setModalOpen(false);
  };

  const handleSave = async() => {
    if (!form.skuCode.trim() || !form.title.trim()) {
      notificationManager.show('SKU 코드와 상품명은 필수입니다.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const body = buildUpsertBody(form);
      if (formMode === 'create') {
        await StandardizedApi.post(ADMIN_SHOP_API.CATALOG_SKUS, body);
        notificationManager.show('상품이 등록되었습니다.', 'success');
      } else if (editingId != null) {
        await StandardizedApi.put(buildAdminShopCatalogSkuPath(editingId), body);
        notificationManager.show('상품이 수정되었습니다.', 'success');
      }
      setModalOpen(false);
      await loadSkus();
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async(row) => {
    const id = row?.id ?? row?.__raw?.id;
    if (id == null || togglingId != null) {
      return;
    }
    const next = !(row?.catalogVisible ?? row?.__raw?.catalogVisible);
    setTogglingId(id);
    try {
      await StandardizedApi.patch(
        buildAdminShopCatalogVisiblePath(id),
        buildCatalogVisiblePatchBody(next)
      );
      await loadSkus();
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '노출 설정 변경에 실패했습니다.'
      );
    } finally {
      setTogglingId(null);
    }
  };

  const closePriceHistory = () => {
    if (priceHistoryLoading) {
      return;
    }
    setPriceHistoryOpen(false);
  };

  const openPriceHistory = async(row, ev) => {
    ev?.stopPropagation?.();
    const raw = row?.__raw ?? row;
    const id = raw?.id;
    if (id == null) {
      return;
    }
    const label = toDisplayString(raw.title, toDisplayString(raw.skuCode, String(id)));
    setPriceHistorySkuLabel(label);
    setPriceHistoryRows([]);
    setPriceHistoryOpen(true);
    setPriceHistoryLoading(true);
    try {
      const items = await listAdminShopCatalogSkuPriceHistory(id);
      setPriceHistoryRows(Array.isArray(items) ? items : []);
    } catch (e) {
      setPriceHistoryRows([]);
      notificationManager.error(
        e?.message != null ? String(e.message) : '가격 이력을 불러오지 못했습니다.'
      );
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  const priceHistoryTableRows = useMemo(() => {
    return (Array.isArray(priceHistoryRows) ? priceHistoryRows : []).map((item, idx) => ({
      __rowKey: item.id != null ? `ph-${String(item.id)}` : `ph-idx-${idx}`,
      colChangedAt: formatShopDateTime(item.changedAt) || '-',
      colUnitPrice: item.unitPriceMinor != null ? formatShopMoney(item.unitPriceMinor, item.currency) : '-',
      colCurrency: toDisplayString(item.currency, '-'),
      colChangedBy: toDisplayString(item.changedBy, '-')
    }));
  }, [priceHistoryRows]);

  const priceHistoryColumns = [
    { key: 'colChangedAt', label: ADMIN_SHOP_PRICE_HISTORY_COLUMN_LABELS.changedAt },
    { key: 'colUnitPrice', label: ADMIN_SHOP_PRICE_HISTORY_COLUMN_LABELS.unitPrice },
    { key: 'colCurrency', label: ADMIN_SHOP_PRICE_HISTORY_COLUMN_LABELS.currency },
    { key: 'colChangedBy', label: ADMIN_SHOP_PRICE_HISTORY_COLUMN_LABELS.changedBy }
  ];

  const columns = [
    { key: 'colCode', label: 'SKU 코드' },
    { key: 'colTitle', label: '상품명' },
    { key: 'colPrice', label: '단가(원)' },
    { key: 'colMeta', label: '상태' },
    { key: 'colActions', label: '동작', hideOnMobile: true }
  ];

  const renderCell = (columnKey, item) => {
    if (columnKey !== 'colActions') {
      const value = item[columnKey];
      return value != null && value !== '' ? String(value) : '-';
    }
    const raw = item.__raw ?? item;
    const visible = raw.catalogVisible !== false;
    return (
      <div className="mg-mapping-actions">
        <MGButton
          type="button"
          className={buildErpMgButtonClassName('secondary')}
          onClick={(ev) => openPriceHistory(raw, ev)}
        >
          {ADMIN_SHOP_PRICE_HISTORY_ACTION_LABEL}
        </MGButton>
        <MGButton
          type="button"
          className={buildErpMgButtonClassName('secondary')}
          disabled={togglingId === raw.id}
          onClick={(ev) => {
            ev.stopPropagation();
            toggleVisible(raw);
          }}
        >
          {visible ? '노출 끄기' : '노출 켜기'}
        </MGButton>
      </div>
    );
  };

  return (
    <AdminCommonLayout title="상품(SKU) 관리">
      <div className="mg-v2-ad-b0kla" data-testid="admin-shop-catalog-page">
      <ContentArea>
        <ContentHeader
          titleId={PAGE_TITLE_ID}
          title="상품(SKU) 관리"
          description="온라인 카탈로그 SKU·단가·노출을 관리합니다."
          actions={(
            <MGButton
              type="button"
              className={buildErpMgButtonClassName('primary')}
              onClick={openCreate}
            >
              상품 등록
            </MGButton>
          )}
        />
        <ContentSection>
          {loading ? (
            <UnifiedLoading message="목록을 불러오는 중…" />
          ) : tableRows.length === 0 ? (
            <EmptyState message="등록된 상품이 없습니다." />
          ) : (
            <ListTableView
              columns={columns}
              data={tableRows}
              rowKeyField="__rowKey"
              renderCell={renderCell}
              onRowClick={(row) => openEdit(row.__raw ?? row)}
            />
          )}
        </ContentSection>
      </ContentArea>
      </div>

      <UnifiedModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={formMode === 'create' ? '상품 등록' : '상품 수정'}
        size="medium"
        footer={(
          <>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName('secondary')}
              onClick={closeModal}
              disabled={saving}
            >
              취소
            </MGButton>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName('primary')}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? ERP_MG_BUTTON_LOADING_TEXT : '저장'}
            </MGButton>
          </>
        )}
      >
        <div className="mg-v2-form-stack">
          <label className="mg-v2-label" htmlFor={`${baseId}-sku-code`}>
            SKU 코드
          </label>
          <input
            id={`${baseId}-sku-code`}
            className="mg-v2-input"
            maxLength={SKU_CODE_MAX}
            value={form.skuCode}
            onChange={(e) => setForm((f) => ({ ...f, skuCode: e.target.value }))}
          />
          <label className="mg-v2-label" htmlFor={`${baseId}-title`}>
            상품명
          </label>
          <input
            id={`${baseId}-title`}
            className="mg-v2-input"
            maxLength={TITLE_MAX}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <label className="mg-v2-label" htmlFor={`${baseId}-price`}>
            단가(원, 정수)
          </label>
          <input
            id={`${baseId}-price`}
            className="mg-v2-input"
            inputMode="numeric"
            value={form.unitPriceMinor}
            onChange={(e) => setForm((f) => ({ ...f, unitPriceMinor: e.target.value }))}
          />
          <label className="mg-v2-label" htmlFor={`${baseId}-desc`}>
            설명(선택)
          </label>
          <textarea
            id={`${baseId}-desc`}
            className="mg-v2-input"
            rows={4}
            value={form.descriptionText}
            onChange={(e) => setForm((f) => ({ ...f, descriptionText: e.target.value }))}
          />
          <label className="mg-v2-label" htmlFor={`${baseId}-sort`}>
            정렬 순서
          </label>
          <input
            id={`${baseId}-sort`}
            className="mg-v2-input"
            inputMode="numeric"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
          <label className="mg-v2-checkbox-row">
            <input
              type="checkbox"
              checked={form.catalogVisible}
              onChange={(e) => setForm((f) => ({ ...f, catalogVisible: e.target.checked }))}
            />
            <SafeText>카탈로그 노출</SafeText>
          </label>
          <label className="mg-v2-checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <SafeText>판매 활성</SafeText>
          </label>
        </div>
      </UnifiedModal>

      <UnifiedModal
        isOpen={priceHistoryOpen}
        onClose={closePriceHistory}
        title={`${ADMIN_SHOP_PRICE_HISTORY_MODAL_TITLE}${priceHistorySkuLabel ? ` — ${priceHistorySkuLabel}` : ''}`}
        size="large"
        footer={(
          <MGButton
            type="button"
            className={buildErpMgButtonClassName('secondary')}
            onClick={closePriceHistory}
            disabled={priceHistoryLoading}
          >
            닫기
          </MGButton>
        )}
      >
        {priceHistoryLoading ? (
          <UnifiedLoading message="가격 이력을 불러오는 중…" />
        ) : priceHistoryTableRows.length === 0 ? (
          <EmptyState message={ADMIN_SHOP_PRICE_HISTORY_EMPTY_MESSAGE} />
        ) : (
          <ListTableView
            columns={priceHistoryColumns}
            data={priceHistoryTableRows}
            rowKeyField="__rowKey"
          />
        )}
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default AdminShopCatalogSkusPage;
