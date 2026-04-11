import { Calendar } from 'lucide-react';

import Card from './Card';

/**
 * Card 컴포넌트 사용 예시 (참고용)
 */

const ICON_SIZE_EXAMPLE = 24;

const BasicCardExample = () => (
  <Card>
    <p>카드 내용이 여기에 들어갑니다.</p>
  </Card>
);

const IconCardExample = () => (
  <Card variant="glass">
    <p>
      <Calendar size={ICON_SIZE_EXAMPLE} aria-hidden />
      {' '}
      회기 관리 — 상담 회기를 관리합니다
    </p>
  </Card>
);

const ActionCardExample = () => (
  <Card variant="floating">
    <p>이름: 홍길동</p>
    <p>이메일: hong@example.com</p>
  </Card>
);

const ClickableCardExample = () => (
  <Card variant="border" onClick={() => alert('카드 클릭!')}>
    <h4>클릭해보세요</h4>
    <p>이 카드는 클릭 가능합니다.</p>
  </Card>
);

export {
  BasicCardExample,
  IconCardExample,
  ActionCardExample,
  ClickableCardExample
};
