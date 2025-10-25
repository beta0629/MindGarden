import React from 'react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { withRouter } from 'storybook-addon-react-router-v6';

// MindGarden 디자인 시스템 CSS
import '../src/styles/mindgarden-design-system.css';

// Storybook 전용 CSS
import './storybook.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i
    }
  },
  docs: {
    toc: true,
    source: {
      state: 'open'
    }
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px'
        }
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px'
        }
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1024px',
          height: '768px'
        }
      },
      large: {
        name: 'Large Desktop',
        styles: {
          width: '1280px',
          height: '800px'
        }
      }
    }
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#ffffff'
      },
      {
        name: 'dark',
        value: '#1a1a1a'
      },
      {
        name: 'client',
        value: '#FFF0F5'
      },
      {
        name: 'consultant',
        value: '#F5FFFA'
      },
      {
        name: 'admin',
        value: '#F8F9FA'
      }
    ]
  },
  themes: {
    default: 'light',
    list: [
      { name: 'light', class: 'light-theme', color: '#ffffff' },
      { name: 'dark', class: 'dark-theme', color: '#1a1a1a' },
      { name: 'client', class: 'client-theme', color: '#FFF0F5' },
      { name: 'consultant', class: 'consultant-theme', color: '#F5FFFA' },
      { name: 'admin', class: 'admin-theme', color: '#F8F9FA' }
    ]
  }
};

export const decorators = [
  withThemeByClassName({
    themes: {
      light: 'light-theme',
      dark: 'dark-theme',
      client: 'client-theme',
      consultant: 'consultant-theme',
      admin: 'admin-theme'
    },
    defaultTheme: 'light'
  }),
  withRouter,
  (Story) => (
    <div className="mg-v2-storybook-wrapper">
      <Story />
    </div>
  )
];

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'light', title: 'Light Theme' },
        { value: 'dark', title: 'Dark Theme' },
        { value: 'client', title: 'Client Theme' },
        { value: 'consultant', title: 'Consultant Theme' },
        { value: 'admin', title: 'Admin Theme' }
      ],
      showName: true,
      dynamicTitle: true
    }
  },
  role: {
    name: 'User Role',
    description: 'User role for theme application',
    defaultValue: 'ADMIN',
    toolbar: {
      icon: 'user',
      items: [
        { value: 'CLIENT', title: 'Client' },
        { value: 'CONSULTANT', title: 'Consultant' },
        { value: 'ADMIN', title: 'Admin' }
      ],
      showName: true,
      dynamicTitle: true
    }
  }
};
