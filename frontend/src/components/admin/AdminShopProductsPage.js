/**
 * 테넌트 어드민 — 「상품」 (패키지 요금 + 온라인 SKU 통합)
 * 판매 중 행이 위, 판매 중지(active=false) 행은 그룹 행 아래. 목록·건수는 서버 page/size.
 * 판매 상태는 관리자가 행마다 토글 — 중지하면 홈 공개·몰 노출이 꺼지고 잠긴다 (기존 구매분 유지).
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import {
  SettingsButton,
  SettingsNotice,
  SettingsPageShell,
  SettingsRowControl,
  SettingsSectionPanel
} from './settings-shell';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import MGPagination from '../common/MGPagination';
import TabChipRow from '../common/TabChipRow';
import ListTableView from '../common/ListTableView';
import StatusBadge from '../common/StatusBadge';
import UnifiedLoading from '../common/UnifiedLoading';
import Switch from '../common/Switch';
import EntityRowActions from '../common/molecules/EntityRowActions';
import {
  ADMIN_SHOP_PRODUCT_ROUTES,
  ADMIN_SHOP_PRODUCT_SEGMENT,
  ADMIN_SHOP_PRODUCT_SEGMENTS,
  ADMIN_SHOP_PRODUCTS_COPY,
  ADMIN_SHOP_SEARCH_DEBOUNCE_MS,
  ADMIN_SHOP_SUITE_PAGE_SIZE,
  ADMIN_SHOP_SUITE_TEST_IDS,
  buildAdminShopProductEditRoute,
  formatAdminShopCopy
} from '../../constants/adminShopSuite';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { formatShopMoney } from '../../utils/clientShopFormat';
import {
  ADMIN_SHOP_PRODUCT_KIND,
  isAdminShopProductSessionUnset
} from '../../utils/adminShopSuite';
import {
  listAdminShopProducts,
  setAdminShopProductHomePublic,
  setAdminShopProductMallVisible,
  setAdminShopProductSaleStatus
} from '../../services/adminShopProductService';
import { runResourceLoad, softRefresh } from '../../utils/softRefresh';
import { AdminShopSuiteToast, useAdminShopSuiteToast } from './shop/AdminShopSuiteParts';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import '../../styles/shop/AdminShopSuite.css';
import './AdminShopProductsPage.css';
import { useTranslation } from 'react-i18next';

const PAGE_TITLE_ID = 'admin-shop-products-title';
const TOGGLE = Object.freeze({ HOME: 'home', MALL: 'mall' });

const PRODUCT_COLUMNS = [
  { key: 'name', label: ADMIN_SHOP_PRODUCTS_COPY.COL_NAME },
  { key: 'status', label: ADMIN_SHOP_PRODUCTS_COPY.COL_STATUS },
  { key: 'sessions', label: ADMIN_SHOP_PRODUCTS_COPY.COL_SESSIONS },
  { key: 'price', label: ADMIN_SHOP_PRODUCTS_COPY.COL_PRICE },
  { key: 'perSession', label: ADMIN_SHOP_PRODUCTS_COPY.COL_PER_SESSION, hideOnMobile: true },
  { key: 'validity', label: ADMIN_SHOP_PRODUCTS_COPY.COL_VALIDITY, hideOnMobile: true },
  { key: 'home', label: ADMIN_SHOP_PRODUCTS_COPY.COL_HOME, hideOnMobile: true },
  { key: 'mall', label: ADMIN_SHOP_PRODUCTS_COPY.COL_MALL, hideOnMobile: true },
  { key: 'content', label: ADMIN_SHOP_PRODUCTS_COPY.COL_CONTENT, hideOnMobile: true },
  { key: 'menu', label: ADMIN_SHOP_PRODUCTS_COPY.COL_MENU }
];

/**
 * @param {object} product
 * @returns {string|null}
 */
function resolveEditId(product) {
  if (product.kind !== ADMIN_SHOP_PRODUCT_KIND.PACKAGE) {
    return null;
  }
  return product.code || (product.codeId != null ? String(product.codeId) : null);
}

const AdminShopProductsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);
  const { toast, showToast, hideToast } = useAdminShopSuiteToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [counts, setCounts] = useState({});
  const [pendingKey, setPendingKey] = useState('');
  const [segment, setSegment] = useState(ADMIN_SHOP_PRODUCT_SEGMENT.ALL);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const productsRef = useRef(products);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), ADMIN_SHOP_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  /**
   * @param {{ silent?: boolean }} [options]
   */
  const loadProducts = useCallback(async(options = {}) => {
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    try {
      await runResourceLoad(options, setLoading, async() => {
        const result = await listAdminShopProducts({
          page: page - 1,
          size: ADMIN_SHOP_SUITE_PAGE_SIZE,
          segment: segment === ADMIN_SHOP_PRODUCT_SEGMENT.ALL ? null : segment,
          q: debouncedQuery || null
        });
        if (seq !== requestSeqRef.current) {
          return;
        }
        setProducts(Array.isArray(result?.products) ? result.products : []);
        setTotalElements(Number(result?.totalElements) || 0);
        setCounts(result?.counts || {});
        setLoadError(false);
      });
    } catch {
      if (seq === requestSeqRef.current) {
        setLoadError(true);
      }
    }
  }, [page, segment, debouncedQuery]);

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
    loadProducts();
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, loadProducts]);

  useEffect(() => {
    setPage(1);
  }, [segment, debouncedQuery]);

  const segmentItems = useMemo(() => ADMIN_SHOP_PRODUCT_SEGMENTS.map((seg) => ({
    key: seg.value,
    label: `${seg.label} ${Number(counts?.[seg.value]) || 0}`
  })), [counts]);
  const stoppedCount = Number(counts?.[ADMIN_SHOP_PRODUCT_SEGMENT.STOPPED]) || 0;
  const catalogEmpty = (Number(counts?.[ADMIN_SHOP_PRODUCT_SEGMENT.ALL]) || 0) === 0 && !debouncedQuery;
  const totalPages = Math.max(1, Math.ceil(totalElements / ADMIN_SHOP_SUITE_PAGE_SIZE));
  const rangeFrom = totalElements === 0 ? 0 : (page - 1) * ADMIN_SHOP_SUITE_PAGE_SIZE + 1;
  const rangeTo = Math.min(page * ADMIN_SHOP_SUITE_PAGE_SIZE, totalElements);

  const patchProduct = useCallback((key, patch) => {
    setProducts((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }, []);

  /**
   * 토글 1회 — 로컬 즉시 반영, 실패 시 복원. withUndo=true 면 되돌리기 토스트.
   */
  const applyToggle = useCallback(async(product, kind, next, withUndo) => {
    const pending = `${product.key}:${kind}`;
    setPendingKey(pending);
    const isHome = kind === TOGGLE.HOME;
    patchProduct(product.key, isHome ? { homePublic: next } : { mallVisible: next });
    try {
      if (isHome) {
        const codeRow = await setAdminShopProductHomePublic(product, next);
        patchProduct(product.key, { codeRow });
      } else {
        await setAdminShopProductMallVisible(product, next);
      }
      const message = isHome
        ? (next ? ADMIN_SHOP_PRODUCTS_COPY.HOME_ON_TOAST : ADMIN_SHOP_PRODUCTS_COPY.HOME_OFF_TOAST)
        : (next ? ADMIN_SHOP_PRODUCTS_COPY.MALL_ON_TOAST : ADMIN_SHOP_PRODUCTS_COPY.MALL_OFF_TOAST);
      showToast(message, withUndo ? {
        label: ADMIN_SHOP_PRODUCTS_COPY.UNDO,
        onClick: () => {
          const current = productsRef.current.find((p) => p.key === product.key);
          if (current) {
            applyToggle(current, kind, !next, false);
          }
        }
      } : null);
    } catch (e) {
      patchProduct(product.key, isHome ? { homePublic: !next } : { mallVisible: !next });
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_SHOP_PRODUCTS_COPY.TOGGLE_FAILED
      );
    } finally {
      setPendingKey('');
    }
  }, [patchProduct, showToast]);

  /**
   * 되돌리기 — 판매 재개 후 중지 직전의 홈 공개·몰 노출 값을 복원한다.
   */
  const undoStop = useCallback(async(product, previous) => {
    setPendingKey(`${product.key}:sale`);
    try {
      let current = await setAdminShopProductSaleStatus(product, true);
      if (previous.homePublic && current?.codeRow) {
        const codeRow = await setAdminShopProductHomePublic(current, true);
        current = { ...current, homePublic: true, codeRow };
      }
      if (previous.mallVisible) {
        await setAdminShopProductMallVisible(current, true);
      }
      await softRefresh(loadProducts);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_SHOP_PRODUCTS_COPY.STATUS_FAILED
      );
    } finally {
      setPendingKey('');
    }
  }, [loadProducts]);

  /**
   * 판매 상태 토글. 중지 → 홈·몰 off + 잠금, 토스트 「기존 구매분은 유지돼요」 + 되돌리기.
   * 재개 → 잠금만 해제 (홈·몰은 꺼진 채).
   */
  const handleSaleStatus = async(product, onSale) => {
    const previous = { homePublic: product.homePublic, mallVisible: product.mallVisible };
    setPendingKey(`${product.key}:sale`);
    try {
      const updated = await setAdminShopProductSaleStatus(product, onSale);
      patchProduct(product.key, updated
        ? { ...updated, key: product.key }
        : { active: onSale, ...(onSale ? {} : { homePublic: false, mallVisible: false }) });
      if (onSale) {
        showToast(ADMIN_SHOP_PRODUCTS_COPY.RESUME_DONE);
      } else {
        showToast(ADMIN_SHOP_PRODUCTS_COPY.STOP_KEPT_TOAST, {
          label: ADMIN_SHOP_PRODUCTS_COPY.UNDO,
          onClick: () => undoStop(product, previous)
        });
      }
      await softRefresh(loadProducts);
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_SHOP_PRODUCTS_COPY.STATUS_FAILED
      );
    } finally {
      setPendingKey('');
    }
  };

  const goCreate = () => navigate(ADMIN_SHOP_PRODUCT_ROUTES.NEW);

  /**
   * 판매 중지 상품은 홈·몰 토글 잠금. 몰 노출은 회기 미설정일 때 켜기 막힘.
   */
  const renderToggle = (product, kind) => {
    const isHome = kind === TOGGLE.HOME;
    const checked = isHome ? product.homePublic : product.mallVisible;
    const stopped = product.active === false;
    const unset = !isHome && isAdminShopProductSessionUnset(product.sessions);
    const blocked = stopped || (!checked && unset);
    const toggle = (
      <Switch
        checked={checked}
        disabled={blocked}
        isPending={pendingKey === `${product.key}:${kind}`}
        ariaLabel={`${product.name} ${isHome ? ADMIN_SHOP_PRODUCTS_COPY.COL_HOME : ADMIN_SHOP_PRODUCTS_COPY.COL_MALL}`}
        data-testid={isHome
          ? ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_HOME_TOGGLE
          : ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_MALL_TOGGLE}
        onCheckedChange={(next) => applyToggle(product, kind, next, true)}
      />
    );
    if (!blocked) {
      return toggle;
    }
    return (
      <span
        className="admin-shop-products-page__toggle-blocked"
        title={stopped ? ADMIN_SHOP_PRODUCTS_COPY.STOPPED_BLOCKED_HINT : ADMIN_SHOP_PRODUCTS_COPY.MALL_BLOCKED_HINT}
      >
        {toggle}
      </span>
    );
  };

  const openEdit = (product) => {
    const editId = resolveEditId(product);
    if (editId) {
      navigate(buildAdminShopProductEditRoute(editId));
    }
  };

  const renderCell = (key, product) => {
    const unset = isAdminShopProductSessionUnset(product.sessions);
    const stopped = product.active === false;
    const editId = resolveEditId(product);
    switch (key) {
      case 'name':
        return (
          <span className="mg-v2-settings-table__cell-stack" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_ROW}>
            <strong><SafeText>{product.name}</SafeText></strong>
            <SafeText className="mg-v2-settings-mono mg-v2-settings-muted">{product.code || '—'}</SafeText>
          </span>
        );
      case 'status':
        return (
          <SettingsRowControl className="mg-v2-settings-table__cell-stack">
            <span className="admin-shop-products-page__sale-status">
              <Switch
                checked={!stopped}
                disabled={Boolean(pendingKey) && pendingKey !== `${product.key}:sale`}
                isPending={pendingKey === `${product.key}:sale`}
                ariaLabel={`${product.name} ${ADMIN_SHOP_PRODUCTS_COPY.STATUS_TOGGLE_ARIA}`}
                data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_SALE_TOGGLE}
                onCheckedChange={(next) => handleSaleStatus(product, next)}
              />
              <StatusBadge
                variant={stopped ? 'neutral' : 'success'}
                data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_STATUS_CHIP}
              >
                {stopped ? ADMIN_SHOP_PRODUCTS_COPY.STATUS_STOPPED : ADMIN_SHOP_PRODUCTS_COPY.STATUS_ON_SALE}
              </StatusBadge>
            </span>
            {unset ? (
              <span className="mg-v2-settings-text--warning" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_UNSET_CHIP}>
                {ADMIN_SHOP_PRODUCTS_COPY.SESSION_UNSET}
              </span>
            ) : null}
          </SettingsRowControl>
        );
      case 'sessions':
        return unset ? '—' : <SafeText>{`${product.sessions}${ADMIN_SHOP_PRODUCTS_COPY.SESSION_UNIT}`}</SafeText>;
      case 'price':
        return <SafeText>{product.price != null ? formatShopMoney(product.price) : '—'}</SafeText>;
      case 'perSession':
        return (
          <SafeText className="mg-v2-settings-muted">
            {product.perSession != null ? formatShopMoney(product.perSession) : '—'}
          </SafeText>
        );
      case 'validity':
        return (
          <SafeText className="mg-v2-settings-muted">
            {product.validityMonths != null
              ? formatAdminShopCopy(ADMIN_SHOP_PRODUCTS_COPY.VALIDITY_VALUE, { months: product.validityMonths })
              : ADMIN_SHOP_PRODUCTS_COPY.VALIDITY_NONE}
          </SafeText>
        );
      case 'home':
        return (
          <SettingsRowControl>
            {product.codeRow ? renderToggle(product, TOGGLE.HOME) : '—'}
          </SettingsRowControl>
        );
      case 'mall':
        return <SettingsRowControl>{renderToggle(product, TOGGLE.MALL)}</SettingsRowControl>;
      case 'content':
        if (stopped) {
          return '—';
        }
        if (product.contentReady) {
          return ADMIN_SHOP_PRODUCTS_COPY.CONTENT_READY;
        }
        return editId ? (
          <SettingsRowControl>
            <SettingsButton type="button" variant="ghost" onClick={() => openEdit(product)}>
              {ADMIN_SHOP_PRODUCTS_COPY.CONTENT_EDIT}
            </SettingsButton>
          </SettingsRowControl>
        ) : '—';
      case 'menu':
        return (
          <SettingsRowControl>
            <EntityRowActions
              ariaLabel={ADMIN_SHOP_PRODUCTS_COPY.COL_MENU}
              items={[
                {
                  id: 'edit',
                  label: ADMIN_SHOP_PRODUCTS_COPY.MENU_EDIT,
                  hidden: !editId,
                  onClick: () => openEdit(product)
                }
              ]}
            />
          </SettingsRowControl>
        );
      default:
        return null;
    }
  };

  const renderTable = (rows, stoppedRows) => (
    <ListTableView
      columns={PRODUCT_COLUMNS}
      data={rows}
      renderCell={renderCell}
      onRowClick={openEdit}
      rowKeyField="key"
      className={stoppedRows ? 'admin-shop-products-page__table--stopped' : ''}
    />
  );

  const renderBody = () => {
    if (loading && products.length === 0) {
      return <UnifiedLoading type="inline" text={ADMIN_SHOP_PRODUCTS_COPY.TITLE} />;
    }
    if (products.length === 0) {
      return catalogEmpty ? (
        <EmptyState
          title={ADMIN_SHOP_PRODUCTS_COPY.EMPTY_TITLE}
          description={ADMIN_SHOP_PRODUCTS_COPY.EMPTY_DESC}
          action={(
            <SettingsButton
              type="button"
              variant="secondary"
              onClick={goCreate}
              preventDoubleClick
            >
              {ADMIN_SHOP_PRODUCTS_COPY.CREATE_FIRST}
            </SettingsButton>
          )}
        />
      ) : (
        <EmptyState title={ADMIN_SHOP_PRODUCTS_COPY.EMPTY_FILTERED} />
      );
    }
    const onSaleRows = products.filter((product) => product.active !== false);
    const stoppedRows = products.filter((product) => product.active === false);
    return (
      <>
        {onSaleRows.length > 0 ? renderTable(onSaleRows, false) : null}
        {stoppedRows.length > 0 && segment === ADMIN_SHOP_PRODUCT_SEGMENT.ALL ? (
          <p className="mg-v2-settings-subheading">
            <strong>{formatAdminShopCopy(ADMIN_SHOP_PRODUCTS_COPY.STOPPED_GROUP, { stoppedCount })}</strong>
            {' '}
            <span className="mg-v2-settings-muted">{ADMIN_SHOP_PRODUCTS_COPY.STOPPED_GROUP_TAIL}</span>
          </p>
        ) : null}
        {stoppedRows.length > 0 ? renderTable(stoppedRows, true) : null}
      </>
    );
  };

  return (
    <AdminCommonLayout title={ADMIN_SHOP_PRODUCTS_COPY.TITLE}>
      <SettingsPageShell
        title={ADMIN_SHOP_PRODUCTS_COPY.TITLE}
        titleId={PAGE_TITLE_ID}
        ariaLabel={ADMIN_SHOP_PRODUCTS_COPY.TITLE}
        className="admin-shop-products-page"
        actions={(
          <SettingsButton
            type="button"
            variant="primary"
            onClick={goCreate}
            preventDoubleClick
          >
            {ADMIN_SHOP_PRODUCTS_COPY.CREATE}
          </SettingsButton>
        )}
        tabs={loadError ? null : (
          <TabChipRow
            items={segmentItems}
            activeKey={segment}
            onChange={setSegment}
            ariaLabel={ADMIN_SHOP_PRODUCTS_COPY.SEGMENT_ARIA}
          />
        )}
      >
        <div className="admin-shop-products-page__body" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_PAGE}>
          {loadError ? (
            <SettingsSectionPanel body="form">
              <EmptyState
                title={ADMIN_SHOP_PRODUCTS_COPY.LOAD_FAILED_TITLE}
                action={(
                  <SettingsButton
                    type="button"
                    variant="secondary"
                    onClick={() => loadProducts()}
                    preventDoubleClick
                  >
                    {t('admin.actions.refresh')}
                  </SettingsButton>
                )}
              />
            </SettingsSectionPanel>
          ) : (
            <>
              <SettingsNotice tone="info" testId={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_USAGE_NOTICE}>
                <p>{ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_NOTICE}</p>
                <p className="mg-v2-settings-muted">{ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_EXPIRY_NOTE}</p>
              </SettingsNotice>

              <SettingsSectionPanel body="plain" ariaLabel={ADMIN_SHOP_PRODUCTS_COPY.TITLE}>
                <div className="mg-v2-settings-toolbar">
                  <span className="mg-v2-settings-toolbar__spacer" />
                  <input
                    type="search"
                    className="mg-v2-form-input"
                    placeholder={ADMIN_SHOP_PRODUCTS_COPY.SEARCH_PLACEHOLDER}
                    aria-label={ADMIN_SHOP_PRODUCTS_COPY.SEARCH_ARIA}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="mg-v2-settings-table admin-shop-products-page__tables" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_TABLE}>
                  {renderBody()}
                </div>

                {totalElements > 0 ? (
                  <div className="admin-shop-products-page__pagination">
                    <span className="mg-v2-settings-muted">
                      <SafeText>
                        {`${rangeFrom}–${rangeTo} / ${totalElements}${ADMIN_SHOP_PRODUCTS_COPY.PAGINATION_UNIT}`}
                      </SafeText>
                    </span>
                    {totalPages > 1 ? (
                      <MGPagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalElements}
                        itemsPerPage={ADMIN_SHOP_SUITE_PAGE_SIZE}
                        onPageChange={setPage}
                        showInfo={false}
                        showItemsPerPage={false}
                        variant="compact"
                      />
                    ) : null}
                  </div>
                ) : null}
              </SettingsSectionPanel>
            </>
          )}
        </div>
      </SettingsPageShell>
      <AdminShopSuiteToast toast={toast} onDismiss={hideToast} />
    </AdminCommonLayout>
  );
};

export default AdminShopProductsPage;
