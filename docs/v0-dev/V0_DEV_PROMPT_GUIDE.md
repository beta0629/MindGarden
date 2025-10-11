# v0.dev 디자인 시스템 구축 프롬프트 가이드

## 📋 개요

이 문서는 MindGarden 상담 관리 시스템의 모든 UI 컴포넌트와 페이지를 v0.dev로 생성하기 위한 상세 프롬프트 리스트입니다. 현재 시스템 구조를 분석하여 각 컴포넌트별로 최적화된 프롬프트를 제공합니다.

---

## 🎯 시스템 구조 분석

### 사용자 역할 (User Roles)
- **CLIENT**: 내담자 (상담 받는 고객)
- **CONSULTANT**: 상담사 (상담 제공자)
- **ADMIN**: 지점 관리자
- **BRANCH_SUPER_ADMIN**: 지점 수퍼 관리자
- **HQ_ADMIN**: 본사 관리자
- **SUPER_HQ_ADMIN**: 본사 고급 관리자
- **HQ_MASTER**: 본사 총관리자

### 디자인 시스템 특징
- **iOS 스타일**: Apple 디자인 가이드라인 기반
- **글래스모피즘**: 반투명 배경과 블러 효과
- **반응형 디자인**: 모바일 우선 접근법
- **다크모드 지원**: 시스템 테마 연동
- **접근성**: WCAG 2.1 AA 준수

---

## 🎨 핵심 디자인 토큰

### 색상 시스템
```css
/* iOS 시스템 색상 */
--ios-blue: #007aff;
--ios-green: #34c759;
--ios-orange: #ff9500;
--ios-red: #ff3b30;
--ios-purple: #5856d6;
--ios-pink: #ff2d92;
--ios-yellow: #ffcc00;
--ios-gray: #8e8e93;

/* 상담사별 색상 */
--consultant-color-1: #3b82f6;
--consultant-color-2: #10b981;
--consultant-color-3: #f59e0b;
--consultant-color-4: #ef4444;
--consultant-color-5: #8b5cf6;
```

### 타이포그래피
```css
/* 폰트 패밀리 */
--font-family-ios: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* 폰트 크기 */
--font-size-xs: 10px;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-xxl: 20px;
```

### 간격 시스템
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
```

---

## 📱 컴포넌트별 프롬프트

### 1. 대시보드 컴포넌트

#### 1.1 통합 대시보드 (CommonDashboard)
```
Create a comprehensive dashboard layout for a counseling management system with the following features:

**Layout Structure:**
- iOS-style design with glassmorphism effects
- Responsive grid layout (4 columns desktop, 2 tablet, 1 mobile)
- Clean, minimal aesthetic with subtle shadows

**Required Sections:**
1. Welcome Section: User greeting with current time and consultation count
2. Role-specific sections based on user role (CLIENT/CONSULTANT/ADMIN)
3. Quick Actions: 4-6 action buttons with icons
4. Recent Activities: Timeline view of recent actions
5. Statistics Cards: Key metrics with sparkline charts
6. Motivation Cards: Inspirational quotes and tips

**User Role Variations:**
- CLIENT: Payment history, consultation ratings, personalized messages
- CONSULTANT: Client list, consultation records, rating display
- ADMIN: User management, system statistics, financial overview

**Design Requirements:**
- Use iOS blue (#007aff) as primary color
- Implement glassmorphism with backdrop-filter: blur(10px)
- Cards should have subtle borders and rounded corners (12px)
- Include hover effects with gentle scale transforms
- Use Lucide React icons throughout
- Ensure accessibility with proper ARIA labels

**Data Display:**
- Statistics cards should show trend indicators (up/down arrows)
- Include sparkline charts for data visualization
- Use consistent color coding for different metrics
- Implement loading states with skeleton animations
```

#### 1.2 관리자 대시보드 (AdminDashboard)
```
Create an advanced admin dashboard for counseling center management with:

**Core Features:**
- System status monitoring with real-time indicators
- User management interface with role-based permissions
- Financial overview with revenue charts
- Consultation statistics with completion rates
- Performance metrics with consultant ratings
- System tools for maintenance and configuration

**Layout:**
- Sidebar navigation with collapsible sections
- Main content area with tabbed interface
- Modal dialogs for detailed views
- Responsive design for tablet/desktop

**Key Components:**
1. System Health Panel: Server status, database health, API status
2. User Statistics: Active users, new registrations, role distribution
3. Financial Dashboard: Revenue, expenses, profit margins
4. Consultation Analytics: Completion rates, average duration, satisfaction scores
5. Consultant Performance: Ratings, availability, specialization areas
6. System Tools: Database backup, cache management, log viewing

**Design Style:**
- Professional business interface
- Dark theme option with light theme default
- Consistent spacing using CSS custom properties
- Interactive charts using Chart.js or similar
- Export functionality for reports
- Search and filter capabilities
```

### 2. 스케줄 관리 컴포넌트

#### 2.1 통합 스케줄 컴포넌트 (UnifiedScheduleComponent)
```
Create a comprehensive scheduling interface for counseling appointments with:

**Core Functionality:**
- Calendar view with month/week/day options
- Drag-and-drop appointment scheduling
- Time slot management with availability indicators
- Recurring appointment support
- Conflict detection and resolution
- Role-based access control

**Calendar Features:**
- Multiple view modes (month, week, day, agenda)
- Color-coded appointments by consultant
- Visual availability indicators
- Quick add/edit appointment modals
- Bulk operations for recurring appointments
- Export to external calendar formats

**Appointment Management:**
- Detailed appointment cards with client/consultant info
- Status indicators (scheduled, completed, cancelled, rescheduled)
- Notes and special requirements fields
- Automatic reminder system integration
- Waitlist management for fully booked slots

**Design Requirements:**
- iOS calendar aesthetic with subtle animations
- Consultant-specific color coding
- Responsive design for mobile scheduling
- Accessibility features for screen readers
- Loading states for async operations
- Error handling with user-friendly messages

**Integration Points:**
- User authentication and role checking
- Real-time updates via WebSocket
- Conflict resolution with smart suggestions
- Integration with notification system
```

#### 2.2 상담사 상태 관리 (ConsultantStatus)
```
Create a consultant availability and status management component with:

**Status Types:**
- Available (green indicator)
- Busy/In Session (red indicator)
- Break (yellow indicator)
- Offline (gray indicator)
- On Vacation (purple indicator)

**Features:**
- Real-time status updates
- Custom status messages
- Break time management
- Vacation request integration
- Status history tracking
- Team overview with all consultant statuses

**Visual Design:**
- Clean status indicators with icons
- Smooth transitions between states
- Color-coded system for quick recognition
- Compact design for dashboard integration
- Hover effects for additional information
- Mobile-friendly touch interactions

**Functionality:**
- Quick status change buttons
- Automatic status updates based on schedule
- Integration with notification system
- Admin override capabilities
- Status reporting and analytics
```

### 3. 사용자 관리 컴포넌트

#### 3.1 사용자 관리 (UserManagement)
```
Create a comprehensive user management interface with:

**User Types:**
- Clients (상담 받는 고객)
- Consultants (상담 제공자)
- Admins (관리자)
- Branch Super Admins (지점 수퍼 관리자)

**Management Features:**
- User listing with search and filters
- Role assignment and permission management
- User profile editing with validation
- Account activation/deactivation
- Bulk operations (import/export)
- Audit trail for user actions

**User Profile Management:**
- Personal information editing
- Contact details management
- Profile picture upload
- Password reset functionality
- Two-factor authentication setup
- Account security settings

**Design Elements:**
- Table view with sortable columns
- Card view for user profiles
- Modal dialogs for editing
- Confirmation dialogs for destructive actions
- Loading states and error handling
- Responsive design for mobile access

**Security Features:**
- Permission-based access control
- Audit logging for all changes
- Secure data handling
- Input validation and sanitization
- Role-based UI element visibility
```

#### 3.2 클라이언트 종합 관리 (ClientComprehensiveManagement)
```
Create an advanced client management system with:

**Client Information:**
- Personal details and contact information
- Consultation history and progress tracking
- Payment history and billing information
- Appointment scheduling and management
- Communication logs and notes
- Document storage and management

**Consultation Management:**
- Session history with detailed records
- Progress tracking with visual indicators
- Goal setting and achievement monitoring
- Therapist assignment and changes
- Session notes and observations
- Follow-up scheduling

**Communication Features:**
- Secure messaging system
- Appointment reminders and notifications
- Progress reports and updates
- Document sharing and collaboration
- Emergency contact management
- Privacy and confidentiality controls

**Analytics and Reporting:**
- Client progress visualization
- Session completion rates
- Satisfaction surveys and feedback
- Custom report generation
- Data export capabilities
- Trend analysis and insights

**Design Requirements:**
- Clean, professional interface
- Easy navigation between sections
- Data visualization with charts
- Mobile-responsive design
- Accessibility compliance
- Fast loading and smooth interactions
```

### 4. 재무 관리 컴포넌트

#### 4.1 통합 재무 대시보드 (IntegratedFinanceDashboard)
```
Create a comprehensive financial management dashboard with:

**Financial Overview:**
- Revenue tracking with monthly/quarterly views
- Expense management and categorization
- Profit and loss statements
- Cash flow analysis
- Budget planning and monitoring
- Financial forecasting

**Revenue Management:**
- Session-based revenue tracking
- Payment processing and reconciliation
- Outstanding payments and collections
- Revenue by consultant/type
- Seasonal trend analysis
- Revenue optimization insights

**Expense Tracking:**
- Operational expense categories
- Recurring expense management
- Expense approval workflows
- Budget vs actual comparisons
- Cost center allocation
- Expense reporting and analytics

**Visual Elements:**
- Interactive charts and graphs
- Color-coded financial indicators
- Trend lines and projections
- Comparative analysis views
- Export functionality for reports
- Real-time data updates

**User Interface:**
- Dashboard with key metrics cards
- Detailed views with drill-down capability
- Filter and search functionality
- Date range selectors
- Custom report builders
- Mobile-responsive design
```

#### 4.2 반복 지출 관리 (RecurringExpenseModal)
```
Create a recurring expense management modal with:

**Expense Types:**
- Monthly rent and utilities
- Insurance payments
- Software subscriptions
- Equipment maintenance
- Staff salaries and benefits
- Marketing and advertising

**Management Features:**
- Create/edit/delete recurring expenses
- Automatic expense generation
- Payment schedule management
- Expense categorization
- Approval workflow integration
- Notification system for due dates

**Financial Tracking:**
- Budget allocation and monitoring
- Cost center assignment
- Tax category classification
- Vendor management
- Payment method selection
- Receipt and document storage

**Design Elements:**
- Clean modal interface
- Form validation and error handling
- Calendar integration for scheduling
- Search and filter capabilities
- Bulk operation support
- Export functionality

**Integration:**
- Connect with main financial dashboard
- Sync with accounting systems
- Integration with approval workflows
- Notification system integration
- Audit trail maintenance
```

### 5. 통계 및 분석 컴포넌트

#### 5.1 성과 지표 모달 (PerformanceMetricsModal)
```
Create a performance metrics and analytics modal with:

**Key Metrics:**
- Consultation completion rates
- Client satisfaction scores
- Consultant performance ratings
- Revenue per session
- Average session duration
- Client retention rates

**Visual Analytics:**
- Interactive charts and graphs
- Trend analysis with time series
- Comparative performance views
- Goal tracking and progress indicators
- Benchmark comparisons
- Predictive analytics

**Reporting Features:**
- Custom date range selection
- Filter by consultant/client/type
- Export to PDF/Excel formats
- Scheduled report generation
- Email delivery options
- Data visualization options

**Performance Tracking:**
- Individual consultant metrics
- Team performance comparisons
- Goal setting and monitoring
- Achievement recognition
- Improvement recommendations
- Historical trend analysis

**Design Requirements:**
- Clean, data-focused interface
- Responsive charts and graphs
- Intuitive navigation
- Fast loading with data caching
- Accessibility compliance
- Mobile-friendly design
```

#### 5.2 상담 완료 통계 (ConsultationCompletionStats)
```
Create a consultation completion statistics component with:

**Completion Tracking:**
- Overall completion rates
- Completion by consultant
- Completion by session type
- Completion by time period
- Cancellation analysis
- Rescheduling patterns

**Data Visualization:**
- Completion rate charts
- Trend analysis over time
- Comparative performance views
- Geographic distribution
- Client demographic analysis
- Session type breakdown

**Analytics Features:**
- Real-time completion tracking
- Predictive completion modeling
- Risk assessment for incomplete sessions
- Optimization recommendations
- Performance benchmarking
- Custom report generation

**Interactive Elements:**
- Drill-down capability for detailed views
- Filter and search functionality
- Date range selection
- Export options
- Comparison tools
- Alert system for anomalies

**Design Style:**
- Clean statistical interface
- Color-coded performance indicators
- Intuitive data presentation
- Mobile-responsive design
- Accessibility features
- Fast loading with optimized charts
```

### 6. 랜딩 페이지 컴포넌트

#### 6.1 상담센터 랜딩 (CounselingCenterLanding)
```
Create a professional counseling center landing page with:

**Hero Section:**
- Compelling headline about mental health support
- Subheading explaining the service value
- Call-to-action buttons (Book Consultation, Learn More)
- Professional counseling office image
- Trust indicators (licenses, certifications)

**Services Section:**
- Individual counseling with icon and description
- Couples counseling with benefits listed
- Family therapy with approach explanation
- Group counseling with community focus
- Online counseling with technology benefits
- Flexible scheduling options highlighted

**About Section:**
- Licensed professionals emphasis
- Evidence-based treatment methods
- Confidentiality and privacy assurance
- Years of experience and expertise
- Client success stories and testimonials
- Professional credentials and certifications

**Process Section:**
- Step-by-step consultation process
- Initial consultation explanation
- Personalized treatment planning
- Regular session scheduling
- Progress tracking and adjustment
- Ongoing support and development

**Contact Section:**
- Contact form with validation
- Phone, email, and address information
- Operating hours and availability
- Location map and directions
- Emergency contact information
- Social media links

**Design Requirements:**
- Calm, professional aesthetic
- Soft color palette (blues, greens, neutrals)
- Clean typography with good readability
- Mobile-first responsive design
- Fast loading with optimized images
- SEO-optimized structure
- Accessibility compliance
- Trust-building elements throughout
```

#### 6.2 상담 히어로 섹션 (CounselingHero)
```
Create an engaging hero section for counseling services with:

**Visual Elements:**
- Warm, welcoming background image
- Overlay with subtle transparency
- Professional counselor or peaceful setting
- Calming color scheme
- Smooth animations and transitions

**Content Structure:**
- Powerful headline about healing and growth
- Supportive subheading with service overview
- Primary CTA button for consultation booking
- Secondary CTA for more information
- Trust indicators (years in business, clients served)

**Design Features:**
- Full-screen or large section layout
- Centered content with good hierarchy
- Responsive design for all devices
- Subtle animations on scroll
- High-quality imagery
- Professional typography

**Call-to-Actions:**
- "Book Your Consultation" - primary button
- "Learn More About Our Services" - secondary button
- Contact information prominently displayed
- Social proof elements
- Urgency indicators (limited availability)

**Technical Requirements:**
- Fast loading with optimized images
- Mobile-responsive design
- Accessibility compliance
- SEO-optimized content
- A/B testing capabilities
- Analytics tracking integration
```

### 7. 공통 컴포넌트

#### 7.1 통합 헤더 (UnifiedHeader)
```
Create a unified header component for the counseling management system with:

**Header Elements:**
- Logo/brand name with navigation
- Primary navigation menu
- User profile dropdown
- Notification bell with badge
- Search functionality
- Mobile hamburger menu

**Navigation Structure:**
- Dashboard (role-based)
- Schedule Management
- User Management (admin only)
- Financial Reports (admin only)
- Settings and Profile
- Help and Support

**User Profile Dropdown:**
- Profile picture and name
- Role indicator
- Quick actions menu
- Settings and preferences
- Logout functionality
- Account status indicator

**Design Features:**
- Clean, minimal design
- Consistent with iOS aesthetic
- Sticky header with scroll behavior
- Mobile-responsive navigation
- Accessibility features
- Loading states and animations

**Technical Requirements:**
- Role-based menu visibility
- Real-time notification updates
- Search with autocomplete
- Keyboard navigation support
- Screen reader compatibility
- Performance optimization
```

#### 7.2 통합 로딩 (UnifiedLoading)
```
Create a unified loading component system with:

**Loading Types:**
- Page loading (full screen)
- Component loading (inline)
- Button loading (with spinner)
- Modal loading (overlay)
- List loading (skeleton)
- Chart loading (placeholder)

**Loading States:**
- Initial loading with spinner
- Skeleton screens for content
- Progress bars for operations
- Pulse animations for cards
- Shimmer effects for lists
- Custom animations for specific content

**Design Elements:**
- Consistent spinner design
- Smooth animations and transitions
- Appropriate sizing for context
- Color coordination with theme
- Accessibility features
- Performance optimization

**Technical Features:**
- Configurable duration and behavior
- Cancel functionality where appropriate
- Error state handling
- Retry mechanisms
- Progress tracking for long operations
- Memory-efficient animations
```

#### 7.3 통합 알림 (UnifiedNotification)
```
Create a comprehensive notification system with:

**Notification Types:**
- Success notifications (green)
- Error notifications (red)
- Warning notifications (yellow)
- Info notifications (blue)
- Custom notifications (brand colors)

**Display Options:**
- Toast notifications (top-right)
- Banner notifications (top)
- Modal notifications (centered)
- Inline notifications (contextual)
- Push notifications (system)
- Email notifications (external)

**Features:**
- Auto-dismiss with configurable timing
- Manual dismiss with close button
- Action buttons for user interaction
- Rich content support (images, links)
- Sound and vibration options
- Notification history and management

**Design Requirements:**
- Consistent with system design
- Smooth animations and transitions
- Mobile-responsive design
- Accessibility compliance
- High contrast for readability
- Customizable positioning and styling

**Technical Implementation:**
- Real-time delivery system
- Notification queuing and prioritization
- User preference management
- Analytics and tracking
- Integration with external services
- Performance optimization
```

---

## 🔧 통합 가이드라인

### CSS 변수 활용
모든 컴포넌트는 기존 CSS 변수 시스템을 활용해야 합니다:

```css
/* 색상 */
color: var(--ios-blue);
background: var(--bg-primary);
border: 1px solid var(--glass-border);

/* 간격 */
padding: var(--spacing-md);
margin: var(--spacing-lg) 0;

/* 타이포그래피 */
font-family: var(--font-family-ios);
font-size: var(--font-size-base);

/* 효과 */
border-radius: var(--border-radius-lg);
box-shadow: var(--shadow-subtle);
backdrop-filter: blur(10px);
```

### 컴포넌트 네이밍 규칙
- **접두사**: MG (MindGarden)
- **형식**: MG + 컴포넌트명 + 타입
- **예시**: MGButton, MGCard, MGForm, MGChart

### 반응형 디자인
- **Mobile First**: 320px부터 시작
- **Breakpoints**: 768px (tablet), 1024px (desktop)
- **Grid System**: CSS Grid와 Flexbox 활용

### 접근성 요구사항
- **ARIA Labels**: 모든 인터랙티브 요소
- **Keyboard Navigation**: Tab 순서 정의
- **Color Contrast**: WCAG 2.1 AA 준수
- **Screen Reader**: 의미있는 구조

---

## 📋 프롬프트 사용 가이드

### 1. 기본 프롬프트 구조
```
Create a [컴포넌트명] for [용도] with:

**Core Features:**
- [기능 1]
- [기능 2]
- [기능 3]

**Design Requirements:**
- [디자인 요구사항 1]
- [디자인 요구사항 2]

**Technical Requirements:**
- [기술 요구사항 1]
- [기술 요구사항 2]
```

### 2. 커스터마이징 가이드
- **색상 변경**: CSS 변수 참조 추가
- **기능 추가**: 역할별 권한 고려
- **레이아웃 수정**: 반응형 요구사항 유지
- **성능 최적화**: 로딩 상태 및 에러 처리

### 3. 통합 체크리스트
- [ ] CSS 변수 시스템 활용
- [ ] 반응형 디자인 구현
- [ ] 접근성 요구사항 충족
- [ ] 역할별 권한 처리
- [ ] 에러 상태 및 로딩 상태
- [ ] 한국어 텍스트 적용
- [ ] 기존 컴포넌트와 일관성

---

## 🚀 다음 단계

1. **우선순위 설정**: 핵심 컴포넌트부터 시작
2. **프롬프트 테스트**: 각 프롬프트로 v0.dev에서 생성
3. **통합 검증**: 기존 시스템과 호환성 확인
4. **사용자 테스트**: 실제 사용자 피드백 수집
5. **반복 개선**: 지속적인 디자인 개선

이 가이드를 통해 v0.dev를 활용하여 MindGarden 시스템의 모든 UI 컴포넌트를 효율적으로 생성하고 통합할 수 있습니다.
