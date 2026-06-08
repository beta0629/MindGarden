/**
 * Apple T2 (1.2 UGC) — 차단 목록 페이지.
 *
 * <p>디자이너 핸드오프 §5.2 — 사용자가 차단한 사용자 목록을 표시하고 해제 가능. 모든
 * 데이터는 {@code GET /api/v1/community/users/blocked} 에서 받아오며 해제는
 * {@code DELETE /api/v1/community/users/{userId}/block} 호출 후 즉시 목록에서 제거된다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StandardizedApi from '../../utils/standardizedApi';
import { COMMUNITY_API } from '../../constants/communityApi';
import { useToast } from '../../contexts/ToastContext';

const PAGE_SIZE = 50;

const formatBlockedAt = (iso) => {
  if (!iso) {
    return '';
  }
  const datePart = iso.slice(0, 10);
  return datePart || iso;
};

const BlockListPage = () => {
  const { t } = useTranslation('community');
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [unblockingId, setUnblockingId] = useState(null);

  const loadBlocked = useCallback(async() => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await StandardizedApi.get(COMMUNITY_API.USERS_BLOCKED, {
        page: 0,
        size: PAGE_SIZE
      });
      const data = response?.data ?? response ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err?.message || '차단 목록을 불러오지 못했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlocked();
  }, [loadBlocked]);

  const handleUnblock = async(blockedUserId) => {
    if (unblockingId !== null) {
      return;
    }
    setUnblockingId(blockedUserId);
    try {
      await StandardizedApi.delete(COMMUNITY_API.USERS_BLOCK(blockedUserId));
      setItems((prev) => prev.filter((item) => item.blockedUserId !== blockedUserId));
      showToast?.({ message: '차단을 해제했습니다.', type: 'success' });
    } catch (err) {
      const message = err?.message || '차단 해제에 실패했습니다.';
      showToast?.({ message, type: 'error' });
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="block-list">
        <header className="block-list__header">
          <h1 className="block-list__title">차단 목록</h1>
        </header>
        <div className="block-list__loading" role="status">
          불러오는 중입니다...
        </div>
      </div>
    );
  }

  return (
    <div className="block-list">
      <header className="block-list__header">
        <h1 className="block-list__title">차단 목록</h1>
        <p className="block-list__hint">
          차단한 사용자의 게시글과 댓글은 보이지 않습니다.
        </p>
      </header>

      {errorMessage && (
        <div role="alert" className="block-list__error">
          {errorMessage}
        </div>
      )}

      {items.length === 0 ? (
        <div className="block-list__empty">
          차단한 사용자가 없습니다.
        </div>
      ) : (
        <ul className="block-list__items">
          {items.map((item) => (
            <li key={item.id ?? item.blockedUserId} className="block-list__item">
              <div className="block-list__item-info">
                <div className="block-list__item-name">
                  {item.blockedDisplayName || '사용자'}
                </div>
                <div className="block-list__item-date">
                  {formatBlockedAt(item.blockedAt)}
                </div>
              </div>
              <button
                type="button"
                className="block-list__item-action"
                onClick={() => handleUnblock(item.blockedUserId)}
                disabled={unblockingId === item.blockedUserId}
                data-testid={`block-list-unblock-${item.blockedUserId}`}
              >
                {unblockingId === item.blockedUserId ? '해제 중...' : '해제'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlockListPage;
