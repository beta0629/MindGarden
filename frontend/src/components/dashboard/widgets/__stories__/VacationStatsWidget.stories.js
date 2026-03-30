import React from 'react';
import VacationStatsWidget from './VacationStatsWidget.js';

export default {
  title: 'Widgets/admin/VacationStats',
  component: VacationStatsWidget,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    widget: {
      control: 'object',
    },
    user: {
      control: 'object',
    },
  },
};

const Template = (args) => <VacationStatsWidget {...args} />;

export const Default = Template.bind({});
Default.args = {
  widget: {
    config: {
      title: '휴가 통계를 보여주는 위젯',
      subtitle: '기본 설정'
    }
  },
  user: {
    id: 1,
    name: 'Test User',
    role: 'ADMIN'
  }
};

export const Loading = Template.bind({});
Loading.args = {
  ...Default.args,
  // 로딩 상태는 컴포넌트 내부에서 처리
};

export const Error = Template.bind({});
Error.args = {
  ...Default.args,
  // 에러 상태는 컴포넌트 내부에서 처리
};

export const CustomTitle = Template.bind({});
CustomTitle.args = {
  ...Default.args,
  widget: {
    config: {
      title: '커스텀 제목',
      subtitle: '커스텀 부제목'
    }
  }
};
