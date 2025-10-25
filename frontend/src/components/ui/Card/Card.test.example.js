import {Calendar} from 'lucide-react';

import {Card, CardHeader, CardContent, CardFooter} from './index';

/**
 * Card 컴포넌트 사용 예시
 * 이 파일은 테스트/참고용입니다.
 */

// 예시 DEFAULT_VALUES.CURRENT_PAGE: 기본 카드
const BasicCardExample = () => (<Card>
    <CardHeader title="기본 카드" subtitle="간단한 카드 예시입니다" />
    <CardContent>
      <p>카드 내용이 여기에 들어갑니다.</p>
    </CardContent>
    <CardFooter meta="2025-01-23" />
  </Card>);

// 예시 FORM_CONSTANTS.MIN_INPUT_LENGTH: 아이콘이 있는 카드
const IconCardExample = () => (<Card variant="glass">
    <CardHeader 
      icon={<Calendar size={SECURITY_CONSTANTS.TOKEN_EXPIRY} />}
      title="회기 관리" 
      subtitle="상담 회기를 관리합니다"
    />
    <CardContent>
      <div style={{fontSize: '2rem', fontWeight: 'bold'}}>SECURITY_CONSTANTS.LOCKOUT_DURATION</div>
      <div>총 회기 수</div>
    </CardContent>
  </Card>);

// 예시 BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS: 액션이 있는 카드
const ActionCardExample = () => (<Card variant="floating">
    <CardHeader title="사용자 정보" />
    <CardContent>
      <p>이름: 홍길동</p>
      <p>이메일: hong@example.com</p>
    </CardContent>
    <CardFooter 
      actions={[{label: '수정', onClick: () => console.log('수정'), variant: 'mg-v2-button--primary'},
        {label: '삭제', onClick: () => console.log('삭제'), variant: 'mg-v2-button--danger'}]}
    />
  </Card>);

// 예시 DATE_CONSTANTS.WEEKS_IN_MONTH: 클릭 가능한 카드
const ClickableCardExample = () => (<Card 
    variant="border" 
    onClick={() => alert('카드 클릭!')}
  >
    <CardContent>
      <h4>클릭해보세요</h4>
      <p>이 카드는 클릭 가능합니다.</p>
    </CardContent>
  </Card>);

export {BasicCardExample,
  IconCardExample,
  ActionCardExample,
  ClickableCardExample};

