/**
 * MindGarden 위젯 표준화 ESLint 규칙
 * 
 * 모든 위젯이 표준화된 BaseWidget과 useWidget을 사용하도록 강제
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-28
 */

module.exports = {
  rules: {
    // 위젯 파일에서 BaseWidget import 강제
    'widget-must-use-base-widget': {
      meta: {
        type: 'error',
        docs: {
          description: '모든 위젯은 BaseWidget을 사용해야 합니다',
          category: 'MindGarden Standards',
          recommended: true
        },
        fixable: 'code',
        schema: []
      },
      create(context) {
        const filename = context.getFilename();
        
        // 위젯 파일인지 확인
        if (!filename.includes('/widgets/') || !filename.endsWith('Widget.js')) {
          return {};
        }

        let hasBaseWidgetImport = false;
        let hasBaseWidgetUsage = false;

        return {
          ImportDeclaration(node) {
            if (node.source.value.includes('BaseWidget')) {
              hasBaseWidgetImport = true;
            }
          },
          JSXElement(node) {
            if (node.openingElement.name.name === 'BaseWidget') {
              hasBaseWidgetUsage = true;
            }
          },
          'Program:exit'() {
            if (!hasBaseWidgetImport) {
              context.report({
                node: context.getSourceCode().ast,
                message: '위젯은 BaseWidget을 import해야 합니다: import BaseWidget from "../BaseWidget"'
              });
            }
            if (!hasBaseWidgetUsage) {
              context.report({
                node: context.getSourceCode().ast,
                message: '위젯은 BaseWidget을 사용해야 합니다: <BaseWidget>...</BaseWidget>'
              });
            }
          }
        };
      }
    },

    // 위젯 파일에서 useWidget 훅 사용 강제
    'widget-must-use-hook': {
      meta: {
        type: 'error',
        docs: {
          description: '모든 위젯은 useWidget 훅을 사용해야 합니다',
          category: 'MindGarden Standards',
          recommended: true
        },
        fixable: 'code',
        schema: []
      },
      create(context) {
        const filename = context.getFilename();
        
        // 위젯 파일인지 확인 (BaseWidget 제외)
        if (!filename.includes('/widgets/') || 
            !filename.endsWith('Widget.js') || 
            filename.includes('BaseWidget.js')) {
          return {};
        }

        let hasUseWidgetImport = false;
        let hasUseWidgetUsage = false;

        return {
          ImportDeclaration(node) {
            if (node.specifiers.some(spec => spec.imported?.name === 'useWidget')) {
              hasUseWidgetImport = true;
            }
          },
          CallExpression(node) {
            if (node.callee.name === 'useWidget') {
              hasUseWidgetUsage = true;
            }
          },
          'Program:exit'() {
            if (!hasUseWidgetImport) {
              context.report({
                node: context.getSourceCode().ast,
                message: '위젯은 useWidget을 import해야 합니다: import { useWidget } from "../../../../hooks/useWidget"'
              });
            }
            if (!hasUseWidgetUsage) {
              context.report({
                node: context.getSourceCode().ast,
                message: '위젯은 useWidget 훅을 사용해야 합니다: const { data, loading, error } = useWidget(widget, user)'
              });
            }
          }
        };
      }
    },

    // 위젯에서 직접 DOM 생성 금지
    'widget-no-direct-dom': {
      meta: {
        type: 'error',
        docs: {
          description: '위젯에서 직접 DOM을 생성하지 말고 BaseWidget을 사용하세요',
          category: 'MindGarden Standards',
          recommended: true
        },
        schema: []
      },
      create(context) {
        const filename = context.getFilename();
        
        if (!filename.includes('/widgets/') || !filename.endsWith('Widget.js')) {
          return {};
        }

        return {
          JSXElement(node) {
            const elementName = node.openingElement.name.name;
            
            // 위젯에서 직접 div.widget 생성 금지
            if (elementName === 'div') {
              const classNameAttr = node.openingElement.attributes.find(
                attr => attr.name?.name === 'className'
              );
              
              if (classNameAttr && 
                  classNameAttr.value?.value?.includes('widget')) {
                context.report({
                  node,
                  message: '위젯에서 직접 div.widget을 생성하지 말고 BaseWidget을 사용하세요'
                });
              }
            }
          }
        };
      }
    },

    // 위젯에서 WIDGET_CONSTANTS 사용 강제
    'widget-must-use-constants': {
      meta: {
        type: 'warning',
        docs: {
          description: '위젯은 WIDGET_CONSTANTS를 사용해야 합니다',
          category: 'MindGarden Standards',
          recommended: true
        },
        schema: []
      },
      create(context) {
        const filename = context.getFilename();
        
        if (!filename.includes('/widgets/') || !filename.endsWith('Widget.js')) {
          return {};
        }

        let hasConstantsImport = false;

        return {
          ImportDeclaration(node) {
            if (node.specifiers.some(spec => spec.imported?.name === 'WIDGET_CONSTANTS')) {
              hasConstantsImport = true;
            }
          },
          'Program:exit'() {
            if (!hasConstantsImport) {
              context.report({
                node: context.getSourceCode().ast,
                message: '위젯은 WIDGET_CONSTANTS를 import하여 사용하세요: import { WIDGET_CONSTANTS } from "../../../../constants/widgetConstants"'
              });
            }
          }
        };
      }
    }
  }
};
