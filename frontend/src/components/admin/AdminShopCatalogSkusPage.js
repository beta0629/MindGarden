/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU 목록 (P2-admin, MVP+)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import { ListTableView } from '../common';
import EmptyState from '../common/EmptyState';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import {
  ADMIN_SHOP_API,
  buildAdminShopCatalogSkuEditRoute,
  buildAdminShopCatalogSkuNewRoute,
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
import { resolveShopCatalogDisplayImageUrl } from '../../utils/shopCatalogThumbnail';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AdminShopCatalogSkuEditorPage.css';

const PAGE_TITLE_ID = 'admin-shop-catalog-skus-title';

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

const AdminShopCatalogSkusPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
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
      const thumb = resolveShopCatalogDisplayImageUrl(row);
      return {
        __rowKey: row.id != null ? `sku-${String(row.id)}` : `sku-idx-${idx}`,
        colThumb: thumb,
        colCode: toDisplayString(row.skuCode, ''),
        colTitle: toDisplayString(row.title, ''),
        colPrice: price ? `${price}원` : '',
        colMeta: `노출:${visible ? 'Y' : 'N'} · 판매:${row.active !== false ? 'Y' : 'N'}`,
        __raw: row
      };
    });
  }, [rows]);

  const openCreate = () => {
    navigate(buildAdminShopCatalogSkuNewRoute());
  };

  const openEdit = (row) => {
    const id = row?.id ?? row?.__raw?.id;
    if (id == null) {
      return;
    }
    navigate(buildAdminShopCatalogSkuEditRoute(id));
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
    { key: 'colThumb', label: '이미지', hideOnMobile: true },
    { key: 'colCode', label: 'SKU 코드' },
    { key: 'colTitle', label: '상품명' },
    { key: 'colPrice', label: '단가(원)' },
    { key: 'colMeta', label: '상태' },
    { key: 'colActions', label: '동작', hideOnMobile: true }
  ];

  const renderCell = (columnKey, item) => {
    if (columnKey === 'colThumb') {
      const url = item.colThumb;
      if (!url) {
        return '—';
      }
      return (
        <img
          src={url}
          alt=""
          className="admin-shop-catalog-list__thumb"
          loading="lazy"
        />
      );
    }
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
