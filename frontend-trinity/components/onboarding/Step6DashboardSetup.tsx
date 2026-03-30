/**
 * Step 6: 대시보드 설정 컴포넌트
 * 온보딩 중 대시보드 템플릿 선택 및 위젯 설정
 */

import { useState } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import type { OnboardingFormData } from "../../hooks/useOnboarding";

interface Step6DashboardSetupProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)) => void;
  businessType: string;
}

interface DashboardTemplate {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  role: string;
  widgets: string[];
}

// 업종별/역할별 템플릿 정의
const DASHBOARD_TEMPLATES: Record<string, DashboardTemplate[]> = {
  consultation: [
    {
      id: "consultation-admin",
      name: "Consultation Admin",
      nameKo: "상담소 관리자",
      description: "통계, 활동 목록, 환영 메시지",
      role: "관리자",
      widgets: ["welcome", "summary-statistics", "activity-list"],
    },
    {
      id: "consultation-consultant",
      name: "Consultation Consultant",
      nameKo: "상담사",
      description: "일정, 상담 기록, 통계",
      role: "상담사",
      widgets: ["schedule", "consultation-record", "consultation-stats"],
    },
    {
      id: "consultation-client",
      name: "Consultation Client",
      nameKo: "내담자",
      description: "일정, 알림, 상담 기록",
      role: "내담자",
      widgets: ["schedule", "notification", "consultation-record"],
    },
  ],
  academy: [
    {
      id: "academy-admin",
      name: "Academy Admin",
      nameKo: "학원 관리자",
      description: "통계, 일정, 환영 메시지",
      role: "관리자",
      widgets: ["welcome", "summary-statistics", "schedule"],
    },
    {
      id: "academy-teacher",
      name: "Academy Teacher",
      nameKo: "선생님",
      description: "일정, 통계",
      role: "선생님",
      widgets: ["schedule", "summary-statistics"],
    },
    {
      id: "academy-student",
      name: "Academy Student",
      nameKo: "학생",
      description: "일정, 알림",
      role: "학생",
      widgets: ["schedule", "notification"],
    },
  ],
};

// 위젯 타입 한글 이름 매핑
const WIDGET_TYPE_NAMES: Record<string, string> = {
  'welcome': '환영 위젯',
  'summary-statistics': '요약 통계',
  'activity-list': '활동 목록',
  'schedule': '일정 위젯',
  'consultation-record': '상담 기록',
  'consultation-stats': '상담 통계',
  'notification': '알림 위젯',
  'statistics': '통계 위젯',
  'chart': '차트 위젯',
  'table': '테이블 위젯',
  'calendar': '캘린더 위젯',
};

// 업종별 사용 가능한 위젯 타입
const AVAILABLE_WIDGETS: Record<string, string[]> = {
  consultation: ['welcome', 'summary-statistics', 'activity-list', 'schedule', 'consultation-record', 'consultation-stats', 'notification', 'statistics', 'chart'],
  academy: ['welcome', 'summary-statistics', 'schedule', 'notification', 'statistics', 'chart', 'table', 'calendar'],
};

export default function Step6DashboardSetup({
  formData,
  setFormData,
  businessType,
}: Step6DashboardSetupProps) {
  // formData에서 기존 선택된 템플릿 가져오기
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>(
    formData.dashboardTemplates || {}
  );
  
  // 편집 중인 템플릿 (역할별 위젯 수정)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  
  // 역할별 위젯 목록 (템플릿에서 가져오거나 수정된 것)
  const [roleWidgets, setRoleWidgets] = useState<Record<string, string[]>>({});

  // 업종별 템플릿 가져오기
  const templates = DASHBOARD_TEMPLATES[businessType?.toLowerCase()] || [];
  const availableWidgets = AVAILABLE_WIDGETS[businessType?.toLowerCase()] || [];

  const handleTemplateSelect = (role: string, templateId: string) => {
    const newTemplates = {
      ...selectedTemplates,
      [role]: templateId,
    };
    setSelectedTemplates(newTemplates);
    
    // 템플릿의 기본 위젯 목록 가져오기
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setRoleWidgets(prev => ({
        ...prev,
        [role]: [...template.widgets],
      }));
    }
    
    // formData에 저장
    setFormData({
      ...formData,
      dashboardTemplates: newTemplates,
    });
  };
  
  // 위젯 편집 시작
  const handleEditWidgets = (role: string) => {
    setEditingTemplate(role);
    // 기존 위젯 목록이 없으면 템플릿에서 가져오기
    if (!roleWidgets[role]) {
      const templateId = selectedTemplates[role];
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setRoleWidgets(prev => ({
          ...prev,
          [role]: [...template.widgets],
        }));
      }
    }
  };
  
  // 위젯 편집 완료
  const handleSaveWidgets = (role: string) => {
    setEditingTemplate(null);
    // formData에 위젯 정보 저장 (템플릿 ID와 함께)
    const templateId = selectedTemplates[role];
    const widgets = roleWidgets[role] || [];
    
    // dashboardTemplates에 위젯 정보도 함께 저장
    const updatedTemplates = {
      ...selectedTemplates,
      [role]: templateId,
    };
    
    setFormData({
      ...formData,
      dashboardTemplates: updatedTemplates,
      dashboardWidgets: {
        ...(formData.dashboardWidgets || {}),
        [role]: widgets,
      },
    });
  };
  
  // 위젯 추가
  const handleAddWidget = (role: string, widgetType: string) => {
    const currentWidgets = roleWidgets[role] || [];
    if (!currentWidgets.includes(widgetType)) {
      setRoleWidgets(prev => ({
        ...prev,
        [role]: [...currentWidgets, widgetType],
      }));
    }
  };
  
  // 위젯 삭제
  const handleRemoveWidget = (role: string, widgetType: string) => {
    const currentWidgets = roleWidgets[role] || [];
    setRoleWidgets(prev => ({
      ...prev,
      [role]: currentWidgets.filter(w => w !== widgetType),
    }));
  };


  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__step-title">대시보드 템플릿 선택</h3>
      <p className="trinity-onboarding__step-description">
        역할별 대시보드 템플릿을 선택해주세요.
        <br />
        각 역할에 맞는 위젯이 자동으로 구성됩니다.
      </p>

      {templates.length === 0 ? (
        <div className={COMPONENT_CSS.ONBOARDING.MESSAGE}>
          {businessType ? `${businessType} 업종에 대한 템플릿이 없습니다. 기본 템플릿이 적용됩니다.` : "업종을 먼저 선택해주세요."}
        </div>
      ) : (
        <>
          <div className="trinity-onboarding__template-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`trinity-onboarding__template-card ${
                  selectedTemplates[template.role] === template.id
                    ? "trinity-onboarding__template-card--selected"
                    : ""
                }`}
                onClick={() => handleTemplateSelect(template.role, template.id)}
              >
                <div className="trinity-onboarding__template-card-header">
                  <h4 className="trinity-onboarding__template-card-title">
                    {template.nameKo}
                  </h4>
                  <span className="trinity-onboarding__template-card-role">
                    {template.role}
                  </span>
                </div>
                <p className="trinity-onboarding__template-card-description">
                  {template.description}
                </p>
                <div className="trinity-onboarding__template-card-widgets">
                  <span className="trinity-onboarding__text-secondary">
                    위젯: {template.widgets.length}개
                  </span>
                </div>
                {selectedTemplates[template.role] === template.id && (
                  <div className="trinity-onboarding__template-card-check">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {Object.keys(selectedTemplates).length > 0 && (
            <div className="trinity-onboarding__dashboard-preview">
              <h4 className="trinity-onboarding__label">선택된 템플릿</h4>
              <div className="trinity-onboarding__selected-templates">
                {Object.entries(selectedTemplates).map(([role, templateId]) => {
                  const template = templates.find((t) => t.id === templateId);
                  const widgets = roleWidgets[role] || template?.widgets || [];
                  const isEditing = editingTemplate === role;
                  
                  return template ? (
                    <div key={role} className="trinity-onboarding__template-summary">
                      <div className="trinity-onboarding__template-summary-header">
                        <div>
                          <strong>{template.nameKo}</strong>
                          <span className="trinity-onboarding__text-secondary"> ({role})</span>
                        </div>
                        {!isEditing && (
                          <button
                            type="button"
                            className="trinity-onboarding__button-secondary"
                            onClick={() => handleEditWidgets(role)}
                          >
                            위젯 편집
                          </button>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="trinity-onboarding__widget-editor">
                          <div className="trinity-onboarding__widget-list">
                            <h5 className="trinity-onboarding__label-small">현재 위젯</h5>
                            {widgets.length > 0 ? (
                              <div className="trinity-onboarding__widget-tags">
                                {widgets.map((widgetType) => (
                                  <span key={widgetType} className="trinity-onboarding__widget-tag">
                                    {WIDGET_TYPE_NAMES[widgetType] || widgetType}
                                    <button
                                      type="button"
                                      className="trinity-onboarding__widget-tag-remove"
                                      onClick={() => handleRemoveWidget(role, widgetType)}
                                      aria-label="위젯 제거"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="trinity-onboarding__text-secondary">위젯이 없습니다.</p>
                            )}
                          </div>
                          
                          <div className="trinity-onboarding__widget-available">
                            <h5 className="trinity-onboarding__label-small">위젯 추가</h5>
                            <div className="trinity-onboarding__widget-options">
                              {availableWidgets
                                .filter(w => !widgets.includes(w))
                                .map((widgetType) => (
                                  <button
                                    key={widgetType}
                                    type="button"
                                    className="trinity-onboarding__widget-option"
                                    onClick={() => handleAddWidget(role, widgetType)}
                                  >
                                    + {WIDGET_TYPE_NAMES[widgetType] || widgetType}
                                  </button>
                                ))}
                            </div>
                          </div>
                          
                          <div className="trinity-onboarding__widget-editor-actions">
                            <button
                              type="button"
                              className="trinity-onboarding__button-secondary"
                              onClick={() => setEditingTemplate(null)}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className="trinity-onboarding__button-primary"
                              onClick={() => handleSaveWidgets(role)}
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="trinity-onboarding__widget-preview">
                          <span className="trinity-onboarding__text-secondary">
                            위젯: {widgets.map(w => WIDGET_TYPE_NAMES[w] || w).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

