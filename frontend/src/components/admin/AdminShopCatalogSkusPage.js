/**
 * 테넌트 어드민 — 패키지 요금 행의 온라인 노출
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
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import {
  buildAdminShopCatalogVisiblePath,
  buildAdminShopPackageContentRoute,
  buildCatalogVisiblePatchBody
} from '../../constants/adminShopApi';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import {
  ADMIN_SHOP_PACKAGE_FEE_COLUMN_ACTIONS,
  ADMIN_SHOP_PACKAGE_FEE_COLUMN_EXPOSE,
  ADMIN_SHOP_PACKAGE_FEE_COLUMN_NAME,
  ADMIN_SHOP_PACKAGE_FEE_COLUMN_PRICE,
  ADMIN_SHOP_PACKAGE_FEE_CONTENT_ACTION,
  ADMIN_SHOP_PACKAGE_FEE_EMPTY,
  ADMIN_SHOP_PACKAGE_FEE_EXPOSE_OFF,
  ADMIN_SHOP_PACKAGE_FEE_EXPOSE_ON,
  ADMIN_SHOP_PACKAGE_FEE_LEGACY_DESCRIPTION,
  ADMIN_SHOP_PACKAGE_FEE_LEGACY_TITLE,
  ADMIN_SHOP_PACKAGE_FEE_PAGE_DESCRIPTION,
  ADMIN_SHOP_PACKAGE_FEE_PAGE_TITLE,
  ADMIN_SHOP_SKU_LIST_SESSION_COUNT_COLUMN,
  ADMIN_SHOP_SKU_TEST_IDS
} from '../../constants/adminShopCatalog';
import {
  listAdminShopPackageFees,
  patchAdminShopPackageFeeVisible
} from '../../services/adminShopCatalogService';
import { formatShopMoney } from '../../utils/clientShopFormat';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import StandardizedApi from '../../utils/standardizedApi';
import { toDisplayString } from '../../utils/safeDisplay';
import { runResourceLoad, softRefresh } from '../../utils/softRefresh';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/shop/AdminShopClinicOs.css';
import './AdminShopCatalogSkuEditorPage.css';

const PAGE_TITLE_ID = 'admin-shop-catalog-skus-title';
const LEGACY_TITLE_ID = 'admin-shop-legacy-sku-title';

const AdminShopCatalogSkusPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [unlinkedSkus, setUnlinkedSkus] = useState([]);
  const [togglingKey, setTogglingKey] = useState(null);

  /**
   * @param {{ silent?: boolean }} [options] silent=true 이면 AdminCommonLayout loading 미사용
   */
  const loadSkus = useCallback(async(options = {}) => {
    try {
      await runResourceLoad(options, setLoading, async() => {
        const payload = await listAdminShopPackageFees();
        setPackages(payload.packages);
        setUnlinkedSkus(payload.unlinkedSkus);
      });
    } catch (e) {
      setPackages([]);
      setUnlinkedSkus([]);
      notificationManager.error(
        e?.message != null ? String(e.message) : '패키지 요금 목록을 불러오지 못했습니다.'
      );
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
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, loadSkus]);

  const tableRows = useMemo(() => {
    return (Array.isArray(packages) ? packages : []).map((row, idx) => ({
      __rowKey: row.packageCode ? `pkg-${String(row.packageCode)}` : `pkg-idx-${idx}`,
      colName: toDisplayString(row.packageName, ''),
      colPrice: row.unitPriceMinor != null ? formatShopMoney(row.unitPriceMinor) : '',
      colSessions: row.sessionCount != null ? String(row.sessionCount) : '',
      colExpose: row.catalogVisible === true
        ? ADMIN_SHOP_PACKAGE_FEE_EXPOSE_ON
        : ADMIN_SHOP_PACKAGE_FEE_EXPOSE_OFF,
      __raw: row
    }));
  }, [packages]);

  const legacyRows = useMemo(() => {
    return (Array.isArray(unlinkedSkus) ? unlinkedSkus : []).map((row, idx) => ({
      __rowKey: row.id != null ? `legacy-${String(row.id)}` : `legacy-idx-${idx}`,
      colName: toDisplayString(row.title, ''),
      colCode: toDisplayString(row.skuCode, ''),
      colPrice: row.unitPriceMinor != null ? formatShopMoney(row.unitPriceMinor) : '',
      colExpose: row.catalogVisible === true
        ? ADMIN_SHOP_PACKAGE_FEE_EXPOSE_ON
        : ADMIN_SHOP_PACKAGE_FEE_EXPOSE_OFF,
      __raw: row
    }));
  }, [unlinkedSkus]);

  const openContent = (row) => {
    const code = row?.packageCode ?? row?.__raw?.packageCode;
    if (!code) {
      return;
    }
    navigate(buildAdminShopPackageContentRoute(code));
  };

  const toggleVisible = async(row) => {
    const raw = row?.__raw ?? row;
    const code = raw?.packageCode;
    if (!code || togglingKey != null) {
      return;
    }
    const next = raw.catalogVisible !== true;
    setTogglingKey(code);
    try {
      await patchAdminShopPackageFeeVisible(code, next);
      await softRefresh(loadSkus);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '노출 설정 변경에 실패했습니다.'
      );
    } finally {
      setTogglingKey(null);
    }
  };

  const hideLegacy = async(row) => {
    const raw = row?.__raw ?? row;
    const id = raw?.id;
    if (id == null || raw.catalogVisible !== true || togglingKey != null) {
      return;
    }
    const key = `legacy-${String(id)}`;
    setTogglingKey(key);
    try {
      await StandardizedApi.patch(
        buildAdminShopCatalogVisiblePath(id),
        buildCatalogVisiblePatchBody(false)
      );
      await softRefresh(loadSkus);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '노출 설정 변경에 실패했습니다.'
      );
    } finally {
      setTogglingKey(null);
    }
  };

  const columns = [
    { key: 'colName', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_NAME },
    { key: 'colPrice', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_PRICE },
    { key: 'colSessions', label: ADMIN_SHOP_SKU_LIST_SESSION_COUNT_COLUMN },
    { key: 'colExpose', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_EXPOSE },
    { key: 'colActions', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_ACTIONS, hideOnMobile: true }
  ];

  const renderCell = (columnKey, item) => {
    if (columnKey !== 'colActions') {
      const value = item[columnKey];
      return value != null && value !== '' ? String(value) : '-';
    }
    const raw = item.__raw ?? item;
    const visible = raw.catalogVisible === true;
    const busy = togglingKey === raw.packageCode;
    return (
      <div className="mg-mapping-actions">
        <MGButton
          type="button"
          className={buildErpMgButtonClassName('secondary')}
          disabled={busy}
          data-testid={ADMIN_SHOP_SKU_TEST_IDS.PACKAGE_FEE_EXPOSE}
          onClick={(ev) => {
            ev.stopPropagation();
            toggleVisible(raw);
          }}
        >
          {visible ? ADMIN_SHOP_PACKAGE_FEE_EXPOSE_OFF : ADMIN_SHOP_PACKAGE_FEE_EXPOSE_ON}
        </MGButton>
        <MGButton
          type="button"
          className={buildErpMgButtonClassName('secondary')}
          data-testid={ADMIN_SHOP_SKU_TEST_IDS.PACKAGE_FEE_CONTENT}
          onClick={(ev) => {
            ev.stopPropagation();
            openContent(raw);
          }}
        >
          {ADMIN_SHOP_PACKAGE_FEE_CONTENT_ACTION}
        </MGButton>
      </div>
    );
  };

  const legacyColumns = [
    { key: 'colCode', label: 'SKU 코드' },
    { key: 'colName', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_NAME },
    { key: 'colPrice', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_PRICE },
    { key: 'colExpose', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_EXPOSE },
    { key: 'colActions', label: ADMIN_SHOP_PACKAGE_FEE_COLUMN_ACTIONS, hideOnMobile: true }
  ];

  const renderLegacyCell = (columnKey, item) => {
    if (columnKey !== 'colActions') {
      const value = item[columnKey];
      return value != null && value !== '' ? String(value) : '-';
    }
    const raw = item.__raw ?? item;
    if (raw.catalogVisible !== true) {
      return ADMIN_SHOP_PACKAGE_FEE_EXPOSE_OFF;
    }
    return (
      <MGButton
        type="button"
        className={buildErpMgButtonClassName('secondary')}
        disabled={togglingKey === `legacy-${String(raw.id)}`}
        onClick={(ev) => {
          ev.stopPropagation();
          hideLegacy(raw);
        }}
      >
        {ADMIN_SHOP_PACKAGE_FEE_EXPOSE_OFF}
      </MGButton>
    );
  };

  return (
    <AdminCommonLayout
      title={ADMIN_SHOP_PACKAGE_FEE_PAGE_TITLE}
      loading={loading && packages.length === 0 && unlinkedSkus.length === 0}
    >
      <div className="mg-v2-ad-b0kla" data-testid="admin-shop-catalog-page">
        <ContentArea>
          <ContentHeader
            titleId={PAGE_TITLE_ID}
            title={ADMIN_SHOP_PACKAGE_FEE_PAGE_TITLE}
            subtitle={ADMIN_SHOP_PACKAGE_FEE_PAGE_DESCRIPTION}
            actions={(
              <MGButton
                type="button"
                className={buildErpMgButtonClassName('secondary')}
                onClick={() => navigate(ADMIN_ROUTES.PACKAGE_PRICING)}
              >
                패키지 요금 관리
              </MGButton>
            )}
          />
          <ContentSection>
            {tableRows.length === 0 ? (
              <EmptyState description={ADMIN_SHOP_PACKAGE_FEE_EMPTY} />
            ) : (
              <div data-testid={ADMIN_SHOP_SKU_TEST_IDS.PACKAGE_FEE_LIST}>
                <ListTableView
                  columns={columns}
                  data={tableRows}
                  rowKeyField="__rowKey"
                  renderCell={renderCell}
                  onRowClick={(row) => openContent(row.__raw ?? row)}
                />
              </div>
            )}
          </ContentSection>
          {legacyRows.length > 0 ? (
            <ContentSection>
              <h2 id={LEGACY_TITLE_ID}>{ADMIN_SHOP_PACKAGE_FEE_LEGACY_TITLE}</h2>
              <p>{ADMIN_SHOP_PACKAGE_FEE_LEGACY_DESCRIPTION}</p>
              <ListTableView
                columns={legacyColumns}
                data={legacyRows}
                rowKeyField="__rowKey"
                renderCell={renderLegacyCell}
              />
            </ContentSection>
          ) : null}
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminShopCatalogSkusPage;
