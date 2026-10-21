import React from 'react';
import { render, screen } from '@testing-library/react';
import NotificationListCard, { NotificationUrgentBadge } from '../NotificationListCard';
import { formatPersonalOrderNumber } from '../../../constants/personalNotificationRoutes';

const renderCard = (props) => render(
  <ul>
    <NotificationListCard title="제목" onClick={() => {}} {...props} />
  </ul>
);

describe('NotificationListCard r2', () => {
  test('안 읽음은 점과 sr-only 문구만 보이고 가시 글자는 없다', () => {
    renderCard({ unread: true, unreadSr: '읽지 않은 알림' });
    const card = screen.getByRole('button');
    expect(card.querySelector('.notif-card__dot')).not.toBeNull();
    expect(card.querySelector('.sr-only')).toHaveTextContent('읽지 않은 알림');
    expect(card.querySelector('.notif-card__unread')).toBeNull();
  });

  test('아이콘 타일에는 톤 클래스가 붙지 않는다', () => {
    renderCard({ icon: () => <svg /> });
    expect(screen.getByRole('button').querySelector('.notif-card__icon').className).toBe('notif-card__icon');
  });

  test('긴급은 mg-badge-danger 글자 배지로만 표시한다', () => {
    renderCard({ badge: <NotificationUrgentBadge label="긴급" /> });
    expect(screen.getByText('긴급').className).toBe('mg-badge mg-badge-danger');
  });

  test('시각은 제목 줄과 meta 줄(출처 · 시각)에 함께 렌더되고 CSS 가 폭에 따라 고른다', () => {
    renderCard({ timeLabel: '2026. 10. 21.', meta: '상담사 · 김하늘', timeIso: '2026-10-21' });
    const card = screen.getByRole('button');
    expect(card.querySelector('.notif-card__head .notif-card__time')).toHaveTextContent('2026. 10. 21.');
    expect(card.querySelector('.notif-card__meta')).toHaveTextContent('상담사 · 김하늘 · 2026. 10. 21.');
  });

  test('출처가 없으면 meta 는 시각만 담는 모바일 전용 줄이다', () => {
    renderCard({ timeLabel: '2026. 10. 21.' });
    expect(screen.getByRole('button').querySelector('.notif-card__meta--time-only')).not.toBeNull();
  });
});

describe('formatPersonalOrderNumber', () => {
  test('UUID 는 앞 8자만 4-4 로 보여 준다', () => {
    expect(formatPersonalOrderNumber('6793a1f0-1111-2222-3333-444455556666')).toBe('6793-A1F0');
  });

  test('UUID 가 아니면 그대로, 비어 있으면 빈 문자열', () => {
    expect(formatPersonalOrderNumber('929')).toBe('929');
    expect(formatPersonalOrderNumber(null)).toBe('');
  });
});
