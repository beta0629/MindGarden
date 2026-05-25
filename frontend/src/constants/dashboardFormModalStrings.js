/**
 * DashboardFormModal — i18n 키 매핑 (PR-E)
 *
 * D5 P4 i18n Phase 2 PR-E 흡수:
 * - 모든 한국어 문자열은 frontend/src/locales/ko/admin.json#dashboard.form 로 이관.
 * - 본 파일은 i18n 키 문자열(namespace prefix 포함)만 export.
 * - 호출 측: useTranslation() + t(KEYS.NO_CREATABLE_ROLES) 패턴.
 *
 * @author Core Solution
 * @since 2026-04-21 (원본), 2026-05-26 (i18n 흡수)
 */

export const DASHBOARD_FORM_NAME_KO_SUFFIX_KEY = 'admin:dashboard.form.nameKoSuffix';
export const DASHBOARD_FORM_NAME_EN_SUFFIX_KEY = 'admin:dashboard.form.nameEnSuffix';

export const DASHBOARD_FORM_MSG = {
  NO_CREATABLE_ROLES: 'admin:dashboard.form.msg.noCreatableRoles',
  ERR_LOAD_ROLES: 'admin:dashboard.form.msg.errLoadRoles',
  ERR_LOAD_ROLE_TEMPLATES: 'admin:dashboard.form.msg.errLoadRoleTemplates',
  WARN_SELECT_TEMPLATE: 'admin:dashboard.form.msg.warnSelectTemplate',
  WARN_ENTER_ROLE_NAME: 'admin:dashboard.form.msg.warnEnterRoleName',
  TOAST_ROLE_ADDED: 'admin:dashboard.form.msg.toastRoleAdded',
  ERR_ROLE_ADD_FALLBACK: 'admin:dashboard.form.msg.errRoleAddFallback',
  ERR_ROLE_ADD_PROCESS: 'admin:dashboard.form.msg.errRoleAddProcess',
  TOAST_ROLE_DELETED: 'admin:dashboard.form.msg.toastRoleDeleted',
  ERR_ROLE_DELETE_FALLBACK: 'admin:dashboard.form.msg.errRoleDeleteFallback',
  ERR_ROLE_DELETE_PROCESS: 'admin:dashboard.form.msg.errRoleDeleteProcess',
  VAL_CHECK_INPUT: 'admin:dashboard.form.msg.valCheckInput',
  TOAST_CREATED_WITH_ROLE: 'admin:dashboard.form.msg.toastCreatedWithRole',
  TOAST_CREATED_ROLE_ASSIGN_FAILED: 'admin:dashboard.form.msg.toastCreatedRoleAssignFailed',
  TOAST_CREATED_ROLE_ASSIGN_NO_SESSION: 'admin:dashboard.form.msg.toastCreatedRoleAssignNoSession',
  TOAST_CREATED_ROLE_ASSIGN_ERROR: 'admin:dashboard.form.msg.toastCreatedRoleAssignError',
  TOAST_DASHBOARD_UPDATED: 'admin:dashboard.form.msg.toastDashboardUpdated',
  TOAST_DASHBOARD_CREATED: 'admin:dashboard.form.msg.toastDashboardCreated',
  ERR_SAVE_FALLBACK: 'admin:dashboard.form.msg.errSaveFallback',
  ERR_SAVE_PROCESS: 'admin:dashboard.form.msg.errSaveProcess',
  ERR_CONFLICT_DASHBOARD: 'admin:dashboard.form.msg.errConflictDashboard',
  ERR_FORBIDDEN: 'admin:dashboard.form.msg.errForbidden',
  ERR_NOT_FOUND_DASHBOARD: 'admin:dashboard.form.msg.errNotFoundDashboard'
};

export const DASHBOARD_FORM_CONFIRM_DELETE_ROLE_KEY = 'admin:dashboard.form.msg.confirmDeleteRole';

export const DASHBOARD_FORM_ERR_THROW = {
  TENANT_ID_MISSING: 'admin:dashboard.form.errThrow.tenantIdMissing'
};

export const DASHBOARD_FORM_ASSIGNMENT_REASON_AUTO_KEY = 'admin:dashboard.form.assignmentReasonAuto';

export const DASHBOARD_FORM_VAL = {
  SELECT_ROLE: 'admin:dashboard.form.val.selectRole',
  DASHBOARD_ROLE_MISSING: 'admin:dashboard.form.val.dashboardRoleMissing',
  ROLE_INVALID_REOPEN: 'admin:dashboard.form.val.roleInvalidReopen',
  ENTER_DASHBOARD_NAME: 'admin:dashboard.form.val.enterDashboardName',
  SELECT_ROLE_FIRST: 'admin:dashboard.form.val.selectRoleFirst',
  INVALID_JSON: 'admin:dashboard.form.val.invalidJson'
};

export const DASHBOARD_FORM_MODAL = {
  TITLE_EDIT: 'admin:dashboard.form.modal.titleEdit',
  TITLE_CREATE: 'admin:dashboard.form.modal.titleCreate',
  TITLE_ADD_ROLE: 'admin:dashboard.form.modal.titleAddRole',
  LOADING: 'admin:dashboard.form.modal.loading'
};

export const DASHBOARD_FORM_BUTTON = {
  CANCEL: 'admin:dashboard.form.button.cancel',
  SAVE_EDIT: 'admin:dashboard.form.button.saveEdit',
  SAVE_CREATE: 'admin:dashboard.form.button.saveCreate',
  ADD_ROLE: 'admin:dashboard.form.button.addRole',
  ADD_ROLE_SUBMIT: 'admin:dashboard.form.button.addRoleSubmit',
  ADD_ROLE_LOADING: 'admin:dashboard.form.button.addRoleLoading',
  DELETE: 'admin:dashboard.form.button.delete'
};

export const DASHBOARD_FORM_FORM = {
  ROLE_LABEL: 'admin:dashboard.form.formFields.roleLabel',
  ROLE_PLACEHOLDER: 'admin:dashboard.form.formFields.rolePlaceholder',
  ROLE_EMPTY_NO_DASHBOARD: 'admin:dashboard.form.formFields.roleEmptyNoDashboard',
  ROLE_LOADING: 'admin:dashboard.form.formFields.roleLoading',
  ASSIGN_ROLE_AFTER_CREATE: 'admin:dashboard.form.formFields.assignRoleAfterCreate',
  ASSIGN_ROLE_HELP: 'admin:dashboard.form.formFields.assignRoleHelp',
  ROLE_MANAGE: 'admin:dashboard.form.formFields.roleManage',
  DELETE_ROLE_TITLE: 'admin:dashboard.form.formFields.deleteRoleTitle',
  DASHBOARD_NAME: 'admin:dashboard.form.formFields.dashboardName',
  DASHBOARD_NAME_AUTO_HINT: 'admin:dashboard.form.formFields.dashboardNameAutoHint',
  DASHBOARD_NAME_PH_AUTO: 'admin:dashboard.form.formFields.dashboardNamePhAuto',
  DASHBOARD_NAME_PH_SELECT_ROLE_FIRST: 'admin:dashboard.form.formFields.dashboardNamePhSelectRoleFirst',
  DASHBOARD_NAME_AUTO_SUCCESS: 'admin:dashboard.form.formFields.dashboardNameAutoSuccess',
  DASHBOARD_NAME_EN: 'admin:dashboard.form.formFields.dashboardNameEn',
  DASHBOARD_TYPE: 'admin:dashboard.form.formFields.dashboardType',
  TYPE_PLACEHOLDER: 'admin:dashboard.form.formFields.typePlaceholder',
  ADVANCED_SUMMARY: 'admin:dashboard.form.formFields.advancedSummary',
  DESCRIPTION: 'admin:dashboard.form.formFields.description',
  DESCRIPTION_PLACEHOLDER: 'admin:dashboard.form.formFields.descriptionPlaceholder',
  DISPLAY_ORDER: 'admin:dashboard.form.formFields.displayOrder',
  DISPLAY_ORDER_HELP: 'admin:dashboard.form.formFields.displayOrderHelp',
  IS_ACTIVE: 'admin:dashboard.form.formFields.isActive',
  IS_DEFAULT: 'admin:dashboard.form.formFields.isDefault',
  IS_DEFAULT_EDIT_HELP: 'admin:dashboard.form.formFields.isDefaultEditHelp',
  WIDGET_SETTINGS: 'admin:dashboard.form.formFields.widgetSettings',
  WIDGET_SETTINGS_HELP: 'admin:dashboard.form.formFields.widgetSettingsHelp',
  WIDGET_EDIT_TITLE: 'admin:dashboard.form.formFields.widgetEditTitle',
  WIDGET_EDIT_SUBTITLE: 'admin:dashboard.form.formFields.widgetEditSubtitle',
  WIDGET_GUIDE_TITLE: 'admin:dashboard.form.formFields.widgetGuideTitle',
  WIDGET_GUIDE_LOADING: 'admin:dashboard.form.formFields.widgetGuideLoading',
  ROLE_TEMPLATE_LABEL: 'admin:dashboard.form.formFields.roleTemplateLabel',
  TEMPLATE_PLACEHOLDER: 'admin:dashboard.form.formFields.templatePlaceholder',
  TEMPLATE_EMPTY: 'admin:dashboard.form.formFields.templateEmpty',
  TEMPLATE_HELP: 'admin:dashboard.form.formFields.templateHelp',
  NEW_ROLE_NAME_KO: 'admin:dashboard.form.formFields.newRoleNameKo',
  NEW_ROLE_NAME_KO_PLACEHOLDER: 'admin:dashboard.form.formFields.newRoleNameKoPlaceholder',
  NEW_ROLE_NAME_KO_HELP: 'admin:dashboard.form.formFields.newRoleNameKoHelp',
  NEW_ROLE_NAME_EN: 'admin:dashboard.form.formFields.newRoleNameEn',
  ROLE_DESC_PLACEHOLDER: 'admin:dashboard.form.formFields.roleDescPlaceholder'
};

/** 위젯 사용 안내 — i18n 키 매핑 (strong 구간 before/strong/after 분리) */
export const DASHBOARD_FORM_WIDGET_GUIDE = {
  CLICK: {
    before: 'admin:dashboard.form.widgetGuide.click.before',
    strong: 'admin:dashboard.form.widgetGuide.click.strong',
    after: 'admin:dashboard.form.widgetGuide.click.after'
  },
  DRAG: {
    before: 'admin:dashboard.form.widgetGuide.drag.before',
    strong: 'admin:dashboard.form.widgetGuide.drag.strong',
    after: 'admin:dashboard.form.widgetGuide.drag.after'
  },
  DELETE: {
    before: 'admin:dashboard.form.widgetGuide.delete.before',
    strong: 'admin:dashboard.form.widgetGuide.delete.strong',
    after: 'admin:dashboard.form.widgetGuide.delete.after'
  },
  CONFIG: {
    before: 'admin:dashboard.form.widgetGuide.config.before',
    strong: 'admin:dashboard.form.widgetGuide.config.strong',
    after: 'admin:dashboard.form.widgetGuide.config.after'
  }
};

export const DASHBOARD_FORM_TYPE_OPTION = {
  STUDENT: 'admin:dashboard.form.typeOption.STUDENT',
  TEACHER: 'admin:dashboard.form.typeOption.TEACHER',
  ADMIN: 'admin:dashboard.form.typeOption.ADMIN',
  CLIENT: 'admin:dashboard.form.typeOption.CLIENT',
  CONSULTANT: 'admin:dashboard.form.typeOption.CONSULTANT',
  PRINCIPAL: 'admin:dashboard.form.typeOption.PRINCIPAL',
  DEFAULT: 'admin:dashboard.form.typeOption.DEFAULT'
};

/** Fallback 위젯 제목 (역할 메타 없을 때) — i18n 키 */
export const DASHBOARD_FORM_WIDGET_TITLE = {
  MY_SCHEDULE: 'admin:dashboard.form.widgetTitle.mySchedule',
  NOTIFICATION: 'admin:dashboard.form.widgetTitle.notification',
  SCHEDULE: 'admin:dashboard.form.widgetTitle.schedule',
  STATS: 'admin:dashboard.form.widgetTitle.stats',
  WELCOME: 'admin:dashboard.form.widgetTitle.welcome',
  STATS_SUMMARY: 'admin:dashboard.form.widgetTitle.statsSummary',
  RECENT_ACTIVITY: 'admin:dashboard.form.widgetTitle.recentActivity'
};

/** 역할 키워드 매칭 (한글) — i18n 키 (Fallback 위젯 분기) */
export const DASHBOARD_FORM_ROLE_KEY = {
  STUDENT: 'admin:dashboard.form.roleKey.STUDENT',
  TEACHER_ALT1: 'admin:dashboard.form.roleKey.TEACHER_ALT1',
  TEACHER_ALT2: 'admin:dashboard.form.roleKey.TEACHER_ALT2',
  ADMIN: 'admin:dashboard.form.roleKey.ADMIN'
};
