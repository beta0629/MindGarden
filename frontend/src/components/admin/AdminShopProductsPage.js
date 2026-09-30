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
import { Info } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import MGPagination from '../common/MGPagination';
import SegmentedTabs from '../common/SegmentedTabs';
import Switch from '../common/Switch';
import EntityRowActions from '../common/molecules/EntityRowActions';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
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
import {
  AdminShopNotice,
  AdminShopSuiteToast,
  AdminShopTableSkeleton,
  useAdminShopSuiteToast
} from './shop/AdminShopSuiteParts';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import '../../styles/shop/AdminShopSuite.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import { useTranslation } from 'react-i18next';

const PAGE_TITLE_ID = 'admin-shop-products-title';
const TABLE_COLUMN_COUNT = 10;
const TOGGLE = Object.freeze({ HOME: 'home', MALL: 'mall' });

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
    value: seg.value,
    label: seg.label,
    badge: Number(counts?.[seg.value]) || 0
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
        className="admin-shop-suite__toggle-blocked"
        title={stopped ? ADMIN_SHOP_PRODUCTS_COPY.STOPPED_BLOCKED_HINT : ADMIN_SHOP_PRODUCTS_COPY.MALL_BLOCKED_HINT}
      >
        {toggle}
      </span>
    );
  };

  const renderGroupRow = () => (
    <tr key="stopped-group" className="admin-shop-suite__row--group admin-shop-suite__row--static">
      <td colSpan={TABLE_COLUMN_COUNT}>
        <strong>{formatAdminShopCopy(ADMIN_SHOP_PRODUCTS_COPY.STOPPED_GROUP, { stoppedCount })}</strong>
        {ADMIN_SHOP_PRODUCTS_COPY.STOPPED_GROUP_TAIL}
      </td>
    </tr>
  );

  const renderRow = (product) => {
    const unset = isAdminShopProductSessionUnset(product.sessions);
    const stopped = product.active === false;
    const editId = resolveEditId(product);
    const openEdit = () => {
      if (editId) {
        navigate(buildAdminShopProductEditRoute(editId));
      }
    };
    const rowClass = [
      !product.active ? 'admin-shop-suite__row--dim' : '',
      !editId ? 'admin-shop-suite__row--static' : ''
    ].filter(Boolean).join(' ');
    return (
      <tr
        key={product.key}
        className={rowClass || undefined}
        data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_ROW}
        onClick={openEdit}
      >
        <td>
          <div className="admin-shop-suite__cell-stack">
            <span className="admin-shop-suite__cell-title"><SafeText>{product.name}</SafeText></span>
            <span className="admin-shop-suite__cell-sub admin-shop-suite__mono">
              <SafeText>{product.code || '—'}</SafeText>
            </span>
          </div>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="admin-shop-suite__cell-stack">
            <span className="admin-shop-suite__sale-status">
              <Switch
                checked={!stopped}
                disabled={Boolean(pendingKey) && pendingKey !== `${product.key}:sale`}
                isPending={pendingKey === `${product.key}:sale`}
                ariaLabel={`${product.name} ${ADMIN_SHOP_PRODUCTS_COPY.STATUS_TOGGLE_ARIA}`}
                data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_SALE_TOGGLE}
                onCheckedChange={(next) => handleSaleStatus(product, next)}
              />
              <span
                className={`admin-shop-suite__chip ${stopped ? 'admin-shop-suite__chip--stopped' : 'admin-shop-suite__chip--on-sale'}`}
                data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_STATUS_CHIP}
              >
                {stopped ? ADMIN_SHOP_PRODUCTS_COPY.STATUS_STOPPED : ADMIN_SHOP_PRODUCTS_COPY.STATUS_ON_SALE}
              </span>
            </span>
            {unset ? (
              <span
                className="admin-shop-suite__cell-sub"
                data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_UNSET_CHIP}
              >
                {ADMIN_SHOP_PRODUCTS_COPY.SESSION_UNSET}
              </span>
            ) : null}
          </div>
        </td>
        <td className="admin-shop-suite__cell--right">
          {unset ? (
            <span className="admin-shop-suite__faint">—</span>
          ) : (
            <span className="admin-shop-suite__delta">
              <SafeText>{`${product.sessions}${ADMIN_SHOP_PRODUCTS_COPY.SESSION_UNIT}`}</SafeText>
            </span>
          )}
        </td>
        <td className="admin-shop-suite__cell--right admin-shop-suite__cell--band admin-shop-suite__num">
          <SafeText>{product.price != null ? formatShopMoney(product.price) : '—'}</SafeText>
        </td>
        <td className="admin-shop-suite__cell--right admin-shop-suite__num admin-shop-suite__muted">
          <SafeText>{product.perSession != null ? formatShopMoney(product.perSession) : '—'}</SafeText>
        </td>
        <td className="admin-shop-suite__muted">
          <SafeText>
            {product.validityMonths != null
              ? formatAdminShopCopy(ADMIN_SHOP_PRODUCTS_COPY.VALIDITY_VALUE, { months: product.validityMonths })
              : ADMIN_SHOP_PRODUCTS_COPY.VALIDITY_NONE}
          </SafeText>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          {product.codeRow ? renderToggle(product, TOGGLE.HOME) : <span className="admin-shop-suite__faint">—</span>}
        </td>
        <td onClick={(e) => e.stopPropagation()}>{renderToggle(product, TOGGLE.MALL)}</td>
        <td onClick={(e) => e.stopPropagation()}>
          {stopped ? (
            <span className="admin-shop-suite__faint">—</span>
          ) : product.contentReady ? (
            <span>{ADMIN_SHOP_PRODUCTS_COPY.CONTENT_READY}</span>
          ) : editId ? (
            <button type="button" className="admin-shop-suite__link-btn" onClick={openEdit}>
              {ADMIN_SHOP_PRODUCTS_COPY.CONTENT_EDIT}
            </button>
          ) : <span className="admin-shop-suite__faint">—</span>}
        </td>
        <td>
          <EntityRowActions
            ariaLabel={ADMIN_SHOP_PRODUCTS_COPY.COL_MENU}
            items={[
              {
                id: 'edit',
                label: ADMIN_SHOP_PRODUCTS_COPY.MENU_EDIT,
                hidden: !editId,
                onClick: openEdit
              }
            ]}
          />
        </td>
      </tr>
    );
  };

  const renderBody = () => {
    if (loading && products.length === 0) {
      return <AdminShopTableSkeleton columnCount={TABLE_COLUMN_COUNT} />;
    }
    if (products.length === 0) {
      return (
        <tbody>
          <tr className="admin-shop-suite__row--static">
            <td colSpan={TABLE_COLUMN_COUNT}>
              {catalogEmpty ? (
                <EmptyState
                  title={ADMIN_SHOP_PRODUCTS_COPY.EMPTY_TITLE}
                  description={ADMIN_SHOP_PRODUCTS_COPY.EMPTY_DESC}
                  action={(
                    <MGButton
                      type="button"
                      variant="secondary"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                      onClick={goCreate}
                    >
                      {ADMIN_SHOP_PRODUCTS_COPY.CREATE_FIRST}
                    </MGButton>
                  )}
                />
              ) : (
                <EmptyState title={ADMIN_SHOP_PRODUCTS_COPY.EMPTY_FILTERED} />
              )}
            </td>
          </tr>
        </tbody>
      );
    }
    const rows = [];
    products.forEach((product, index) => {
      const prev = index > 0 ? products[index - 1] : null;
      const startsStopped = product.active === false && (prev == null || prev.active !== false);
      if (startsStopped && segment === ADMIN_SHOP_PRODUCT_SEGMENT.ALL) {
        rows.push(renderGroupRow());
      }
      rows.push(renderRow(product));
    });
    return <tbody>{rows}</tbody>;
  };

  return (
    <AdminCommonLayout title={ADMIN_SHOP_PRODUCTS_COPY.TITLE}>
      <ContentArea className="admin-shop-clinic-os admin-shop-suite" ariaLabel={ADMIN_SHOP_PRODUCTS_COPY.TITLE}>
        <div className="admin-shop-suite" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_PAGE}>
          <ContentHeader
            titleId={PAGE_TITLE_ID}
            title={ADMIN_SHOP_PRODUCTS_COPY.TITLE}
            subtitle={ADMIN_SHOP_PRODUCTS_COPY.SUBTITLE}
            actions={(
              <MGButton
                type="button"
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md' })}
                onClick={goCreate}
              >
                {ADMIN_SHOP_PRODUCTS_COPY.CREATE}
              </MGButton>
            )}
          />

          {loadError ? (
            <EmptyState
              title={ADMIN_SHOP_PRODUCTS_COPY.LOAD_FAILED_TITLE}
              action={(
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                  onClick={() => loadProducts()}
                >
                  {t('admin.actions.refresh')}
                </MGButton>
              )}
            />
          ) : (
            <>
              <AdminShopNotice
                tone="info"
                icon={<Info size={14} aria-hidden="true" />}
                testId={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_USAGE_NOTICE}
              >
                <p>{ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_NOTICE}</p>
                <p className="admin-shop-suite__muted">{ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_EXPIRY_NOTE}</p>
              </AdminShopNotice>

              <div className="admin-shop-suite__toolbar">
                <SegmentedTabs
                  items={segmentItems}
                  activeValue={segment}
                  onChange={setSegment}
                  ariaLabel={ADMIN_SHOP_PRODUCTS_COPY.SEGMENT_ARIA}
                  size="sm"
                />
                <span className="admin-shop-suite__toolbar-spacer" />
                <input
                  type="search"
                  className="admin-shop-suite__search"
                  placeholder={ADMIN_SHOP_PRODUCTS_COPY.SEARCH_PLACEHOLDER}
                  aria-label={ADMIN_SHOP_PRODUCTS_COPY.SEARCH_ARIA}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="admin-shop-suite__table-wrap">
                <table className="admin-shop-suite__table" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_TABLE}>
                  <colgroup>
                    <col />
                    <col className="admin-shop-suite__col-status" />
                    <col className="admin-shop-suite__col-sessions" />
                    <col className="admin-shop-suite__col-price" />
                    <col className="admin-shop-suite__col-price" />
                    <col className="admin-shop-suite__col-validity" />
                    <col className="admin-shop-suite__col-toggle" />
                    <col className="admin-shop-suite__col-toggle" />
                    <col className="admin-shop-suite__col-content" />
                    <col className="admin-shop-suite__col-menu" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">{ADMIN_SHOP_PRODUCTS_COPY.COL_NAME}</th>
                      <th scope="col">{ADMIN_SHOP_PRODUCTS_COPY.COL_STATUS}</th>
                      <th scope="col" className="admin-shop-suite__cell--right">
                        {ADMIN_SHOP_PRODUCTS_COPY.COL_SESSIONS}
                        <span className="admin-shop-suite__arrow" aria-hidden="true">▸</span>
                      </th>
                      <th scope="col" className="admin-shop-suite__cell--right admin-shop-suite__cell--band">
                        {ADMIN_SHOP_PRODUCTS_COPY.COL_PRICE}
                        <span className="admin-shop-suite__arrow" aria-hidden="true">▸</span>
                      </th>
                      <th scope="col" className="admin-shop-suite__cell--right">{ADMIN_SHOP_PRODUCTS_COPY.COL_PER_SESSION}</th>
                      <th scope="col">{ADMIN_SHOP_PRODUCTS_COPY.COL_VALIDITY}</th>
                      <th scope="col">{ADMIN_SHOP_PRODUCTS_COPY.COL_HOME}</th>
                      <th scope="col">{ADMIN_SHOP_PRODUCTS_COPY.COL_MALL}</th>
                      <th scope="col">{ADMIN_SHOP_PRODUCTS_COPY.COL_CONTENT}</th>
                      <th scope="col"><span className="sr-only">{ADMIN_SHOP_PRODUCTS_COPY.COL_MENU}</span></th>
                    </tr>
                  </thead>
                  {renderBody()}
                </table>
              </div>

              {totalElements > 0 ? (
                <div className="admin-shop-suite__pagination">
                  <span>
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
            </>
          )}
        </div>
      </ContentArea>
      <AdminShopSuiteToast toast={toast} onDismiss={hideToast} />
    </AdminCommonLayout>
  );
};

export default AdminShopProductsPage;
