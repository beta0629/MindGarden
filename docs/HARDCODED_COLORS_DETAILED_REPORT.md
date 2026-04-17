# 🎨 하드코딩된 색상값 상세 리포트

> **생성일**: 2026-04-17T05:41:31.067Z  
> **총 검사 파일**: 1280개  
> **하드코딩 발견 파일**: 283개  
> **총 하드코딩 색상**: 4926개

---

## 📊 요약 통계

| 구분 | 수량 | 비율 |
|------|------|------|
| 총 파일 | 1280개 | 100% |
| 영향받는 파일 | 283개 | 22.1% |
| 중요 파일 | 15개 | 1.2% |

### 색상 유형별 분포
- **HEX_3**: 189개
- **HEX_6**: 3318개
- **RGBA**: 1414개
- **RGB**: 5개

---

## 🔥 중요 파일 (즉시 수정 필요)

- `frontend/src/styles/mindgarden-design-system.css`
- `frontend/src/styles/themes/mobile-theme.css`
- `frontend/src/styles/themes/light-theme.css`
- `frontend/src/styles/themes/ios-theme.css`
- `frontend/src/styles/themes/high-contrast-theme.css`
- `frontend/src/styles/themes/dark-theme.css`
- `frontend/src/styles/01-settings/_theme-variables.css`
- `frontend/src/styles/01-settings/_colors.css`
- `frontend/src/utils/resolveCssColorVarToHex.js`
- `frontend/src/utils/cssThemeHelper.js`
- `frontend/src/themes/defaultTheme.js`
- `frontend/src/hooks/useTheme.js`
- `frontend/src/hooks/useTenantBranding.js`
- `frontend/src/constants/css-variables.js`
- `frontend/src/components/ui/ThemeSelector/ThemeSelector.test.js`

---

## 📋 파일별 상세 내역

### 🔥 `frontend/src/styles/themes/ios-theme.css` (CSS)

**하드코딩 색상**: 84개 - **즉시 수정 필요**

1. **HEX_6**: `#F5F5F7` (라인 20)
   ```
   --color-bg-secondary: #F5F5F7;
   ```

2. **HEX_6**: `#E8E8ED` (라인 22)
   ```
   --color-bg-accent: #E8E8ED;
   ```

3. **HEX_6**: `#1D1D1F` (라인 27)
   ```
   --color-text-primary: #1D1D1F;
   ```

4. **HEX_6**: `#424245` (라인 28)
   ```
   --color-text-secondary: #424245;
   ```

5. **HEX_6**: `#636366` (라인 29)
   ```
   --color-text-tertiary: #636366;
   ```

6. **HEX_6**: `#8E8E93` (라인 30)
   ```
   --color-text-muted: #8E8E93;
   ```

7. **HEX_6**: `#D1D1D6` (라인 34)
   ```
   --color-border-primary: #D1D1D6;
   ```

8. **HEX_6**: `#E8E8ED` (라인 35)
   ```
   --color-border-secondary: #E8E8ED;
   ```

9. **HEX_6**: `#A1A1A6` (라인 36)
   ```
   --color-border-accent: #A1A1A6;
   ```

10. **HEX_6**: `#D4F4DD` (라인 41)
   ```
   --color-success-light: #D4F4DD;
   ```

11. **HEX_6**: `#2AB346` (라인 42)
   ```
   --color-success-dark: #2AB346;
   ```

12. **HEX_6**: `#FFE5CC` (라인 45)
   ```
   --color-warning-light: #FFE5CC;
   ```

13. **HEX_6**: `#E6850E` (라인 46)
   ```
   --color-warning-dark: #E6850E;
   ```

14. **HEX_6**: `#FFE5E5` (라인 49)
   ```
   --color-error-light: #FFE5E5;
   ```

15. **HEX_6**: `#E63429` (라인 50)
   ```
   --color-error-dark: #E63429;
   ```

16. **HEX_6**: `#5AC8FA` (라인 52)
   ```
   --color-info: #5AC8FA;
   ```

17. **HEX_6**: `#E5F7FE` (라인 53)
   ```
   --color-info-light: #E5F7FE;
   ```

18. **HEX_6**: `#4BB5E6` (라인 54)
   ```
   --color-info-dark: #4BB5E6;
   ```

19. **HEX_6**: `#1D1D1F` (라인 74)
   ```
   --ios-text-primary: #1D1D1F;
   ```

20. **HEX_6**: `#424245` (라인 75)
   ```
   --ios-text-secondary: #424245;
   ```

21. **HEX_6**: `#1D1D1F` (라인 80)
   ```
   --header-text: #1D1D1F;
   ```

22. **HEX_6**: `#8E8E93` (라인 81)
   ```
   --header-text-muted: #8E8E93;
   ```

23. **HEX_6**: `#1D1D1F` (라인 107)
   ```
   --glass-text: #1D1D1F;
   ```

24. **HEX_6**: `#FAFAFA` (라인 124)
   ```
   --color-bg-primary: #FAFAFA !important;
   ```

25. **HEX_6**: `#F5F5F7` (라인 125)
   ```
   --color-bg-secondary: #F5F5F7 !important;
   ```

26. **HEX_6**: `#E8E8ED` (라인 127)
   ```
   --color-bg-accent: #E8E8ED !important;
   ```

27. **HEX_6**: `#1D1D1F` (라인 131)
   ```
   --color-text-primary: #1D1D1F !important;
   ```

28. **HEX_6**: `#424245` (라인 132)
   ```
   --color-text-secondary: #424245 !important;
   ```

29. **HEX_6**: `#636366` (라인 133)
   ```
   --color-text-tertiary: #636366 !important;
   ```

30. **HEX_6**: `#8E8E93` (라인 134)
   ```
   --color-text-muted: #8E8E93 !important;
   ```

31. **HEX_6**: `#D1D1D6` (라인 137)
   ```
   --color-border-primary: #D1D1D6 !important;
   ```

32. **HEX_6**: `#E8E8ED` (라인 138)
   ```
   --color-border-secondary: #E8E8ED !important;
   ```

33. **HEX_6**: `#A1A1A6` (라인 139)
   ```
   --color-border-accent: #A1A1A6 !important;
   ```

34. **HEX_6**: `#1D1D1F` (라인 144)
   ```
   --ios-text-primary: #1D1D1F !important;
   ```

35. **HEX_6**: `#424245` (라인 145)
   ```
   --ios-text-secondary: #424245 !important;
   ```

36. **HEX_6**: `#1D1D1F` (라인 149)
   ```
   --header-text: #1D1D1F !important;
   ```

37. **HEX_6**: `#8E8E93` (라인 150)
   ```
   --header-text-muted: #8E8E93 !important;
   ```

38. **HEX_6**: `#1D1D1F` (라인 164)
   ```
   --glass-text: #1D1D1F !important;
   ```

39. **HEX_6**: `#1D1D1F` (라인 167)
   ```
   --text-primary: #1D1D1F !important;
   ```

40. **HEX_6**: `#424245` (라인 168)
   ```
   --text-secondary: #424245 !important;
   ```

41. **HEX_6**: `#636366` (라인 169)
   ```
   --text-tertiary: #636366 !important;
   ```

42. **HEX_6**: `#FAFAFA` (라인 170)
   ```
   --bg-primary: #FAFAFA !important;
   ```

43. **HEX_6**: `#F5F5F7` (라인 171)
   ```
   --bg-secondary: #F5F5F7 !important;
   ```

44. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 23)
   ```
   --color-bg-glass: rgba(250, 250, 250, 0.8);
   ```

45. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 24)
   ```
   --color-bg-glass-strong: rgba(250, 250, 250, 0.95);
   ```

46. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 63)
   ```
   --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
   ```

47. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 64)
   ```
   --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.12);
   ```

48. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 65)
   ```
   --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.12);
   ```

49. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 66)
   ```
   --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.12);
   ```

50. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 67)
   ```
   --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.12);
   ```

51. **RGBA**: `rgba(0, 0, 0, 0.24)` (라인 68)
   ```
   --shadow-glass-strong: 0 8px 32px rgba(0, 0, 0, 0.24);
   ```

52. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 71)
   ```
   --ios-bg-primary: rgba(250, 250, 250, 0.95);
   ```

53. **RGBA**: `rgba(245, 245, 247, 0.95)` (라인 72)
   ```
   --ios-bg-secondary: rgba(245, 245, 247, 0.95);
   ```

54. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 73)
   ```
   --ios-border: rgba(209, 209, 214, 0.8);
   ```

55. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 78)
   ```
   --header-bg: rgba(250, 250, 250, 0.95);
   ```

56. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 79)
   ```
   --header-border: rgba(209, 209, 214, 0.8);
   ```

57. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 84)
   ```
   --modal-bg: rgba(250, 250, 250, 0.98);
   ```

58. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 85)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.3);
   ```

59. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 86)
   ```
   --modal-border: rgba(209, 209, 214, 0.8);
   ```

60. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 90)
   ```
   --dropdown-bg: rgba(250, 250, 250, 0.98);
   ```

61. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 91)
   ```
   --dropdown-border: rgba(209, 209, 214, 0.8);
   ```

62. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 92)
   ```
   --dropdown-shadow: 0 10px 15px rgba(0, 0, 0, 0.08);
   ```

63. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 102)
   ```
   --glass-bg-light: rgba(250, 250, 250, 0.8);
   ```

64. **RGBA**: `rgba(250, 250, 250, 0.9)` (라인 103)
   ```
   --glass-bg-medium: rgba(250, 250, 250, 0.9);
   ```

65. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 104)
   ```
   --glass-bg-strong: rgba(250, 250, 250, 0.95);
   ```

66. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 105)
   ```
   --glass-border: rgba(255, 255, 255, 0.3);
   ```

67. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 106)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.4);
   ```

68. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 128)
   ```
   --color-bg-glass: rgba(250, 250, 250, 0.8) !important;
   ```

69. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 129)
   ```
   --color-bg-glass-strong: rgba(250, 250, 250, 0.95) !important;
   ```

70. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 141)
   ```
   --ios-bg-primary: rgba(250, 250, 250, 0.95) !important;
   ```

71. **RGBA**: `rgba(245, 245, 247, 0.95)` (라인 142)
   ```
   --ios-bg-secondary: rgba(245, 245, 247, 0.95) !important;
   ```

72. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 143)
   ```
   --ios-border: rgba(209, 209, 214, 0.8) !important;
   ```

73. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 147)
   ```
   --header-bg: rgba(250, 250, 250, 0.95) !important;
   ```

74. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 148)
   ```
   --header-border: rgba(209, 209, 214, 0.8) !important;
   ```

75. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 152)
   ```
   --modal-bg: rgba(250, 250, 250, 0.98) !important;
   ```

76. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 153)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.3) !important;
   ```

77. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 154)
   ```
   --modal-border: rgba(209, 209, 214, 0.8) !important;
   ```

78. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 156)
   ```
   --dropdown-bg: rgba(250, 250, 250, 0.98) !important;
   ```

79. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 157)
   ```
   --dropdown-border: rgba(209, 209, 214, 0.8) !important;
   ```

80. **RGBA**: `rgba(250, 250, 250, 0.8)` (라인 159)
   ```
   --glass-bg-light: rgba(250, 250, 250, 0.8) !important;
   ```

81. **RGBA**: `rgba(250, 250, 250, 0.9)` (라인 160)
   ```
   --glass-bg-medium: rgba(250, 250, 250, 0.9) !important;
   ```

82. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 161)
   ```
   --glass-bg-strong: rgba(250, 250, 250, 0.95) !important;
   ```

83. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 162)
   ```
   --glass-border: rgba(255, 255, 255, 0.3) !important;
   ```

84. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 163)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.4) !important;
   ```

---

### 🔥 `frontend/src/constants/css-variables.js` (JS)

**하드코딩 색상**: 64개 - **즉시 수정 필요**

1. **HEX_6**: `#00a085` (라인 24)
   ```
   SUCCESS_DARK: '#00a085',
   ```

2. **HEX_6**: `#43e97b` (라인 25)
   ```
   SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

3. **HEX_6**: `#38f9d7` (라인 25)
   ```
   SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

4. **HEX_6**: `#f8d7da` (라인 28)
   ```
   DANGER_LIGHT: '#f8d7da',
   ```

5. **HEX_6**: `#ee5a24` (라인 29)
   ```
   DANGER_DARK: '#ee5a24',
   ```

6. **HEX_6**: `#ee5a24` (라인 30)
   ```
   DANGER_GRADIENT: 'linear-gradient(135deg, var(--mg-error-500) 0%, #ee5a24 100%)',
   ```

7. **HEX_6**: `#d1ecf1` (라인 33)
   ```
   INFO_LIGHT: '#d1ecf1',
   ```

8. **HEX_6**: `#0984e3` (라인 34)
   ```
   INFO_DARK: '#0984e3',
   ```

9. **HEX_6**: `#4facfe` (라인 35)
   ```
   INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

10. **HEX_6**: `#00f2fe` (라인 35)
   ```
   INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

11. **HEX_6**: `#fff3cd` (라인 38)
   ```
   WARNING_LIGHT: '#fff3cd',
   ```

12. **HEX_6**: `#f5576c` (라인 39)
   ```
   WARNING_DARK: '#f5576c',
   ```

13. **HEX_6**: `#f5576c` (라인 40)
   ```
   WARNING_GRADIENT: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)',
   ```

14. **HEX_6**: `#00a085` (라인 47)
   ```
   CLIENT_DARK: '#00a085',
   ```

15. **HEX_6**: `#00a085` (라인 48)
   ```
   CLIENT_GRADIENT: 'linear-gradient(135deg, var(--mg-success-500) 0%, #00a085 100%)',
   ```

16. **HEX_6**: `#27ae60` (라인 54)
   ```
   REVENUE: '#27ae60',
   ```

17. **HEX_6**: `#229954` (라인 55)
   ```
   REVENUE_DARK: '#229954',
   ```

18. **HEX_6**: `#27ae60` (라인 56)
   ```
   REVENUE_GRADIENT: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

19. **HEX_6**: `#229954` (라인 56)
   ```
   REVENUE_GRADIENT: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

20. **HEX_6**: `#e74c3c` (라인 58)
   ```
   EXPENSE: '#e74c3c',
   ```

21. **HEX_6**: `#c0392b` (라인 59)
   ```
   EXPENSE_DARK: '#c0392b',
   ```

22. **HEX_6**: `#e74c3c` (라인 60)
   ```
   EXPENSE_GRADIENT: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

23. **HEX_6**: `#c0392b` (라인 60)
   ```
   EXPENSE_GRADIENT: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

24. **HEX_6**: `#9b59b6` (라인 62)
   ```
   PAYMENT: '#9b59b6',
   ```

25. **HEX_6**: `#8e44ad` (라인 63)
   ```
   PAYMENT_DARK: '#8e44ad',
   ```

26. **HEX_6**: `#9b59b6` (라인 64)
   ```
   PAYMENT_GRADIENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

27. **HEX_6**: `#8e44ad` (라인 64)
   ```
   PAYMENT_GRADIENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

28. **HEX_6**: `#34495e` (라인 66)
   ```
   REPORT: '#34495e',
   ```

29. **HEX_6**: `#2c3e50` (라인 67)
   ```
   REPORT_DARK: '#2c3e50',
   ```

30. **HEX_6**: `#34495e` (라인 68)
   ```
   REPORT_GRADIENT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

31. **HEX_6**: `#2c3e50` (라인 68)
   ```
   REPORT_GRADIENT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

32. **HEX_6**: `#95a5a6` (라인 70)
   ```
   SETTINGS: '#95a5a6',
   ```

33. **HEX_6**: `#7f8c8d` (라인 71)
   ```
   SETTINGS_DARK: '#7f8c8d',
   ```

34. **HEX_6**: `#95a5a6` (라인 72)
   ```
   SETTINGS_GRADIENT: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
   ```

35. **HEX_6**: `#7f8c8d` (라인 72)
   ```
   SETTINGS_GRADIENT: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
   ```

36. **HEX_6**: `#2c3e50` (라인 75)
   ```
   BLACK: '#2c3e50',
   ```

37. **HEX_6**: `#495057` (라인 78)
   ```
   GRAY_DARK: '#495057',
   ```

38. **HEX_6**: `#e9ecef` (라인 79)
   ```
   BORDER: '#e9ecef',
   ```

39. **HEX_6**: `#2c3e50` (라인 80)
   ```
   TEXT_PRIMARY: '#2c3e50',
   ```

40. **HEX_6**: `#764ba2` (라인 291)
   ```
   PRIMARY: 'linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%)',
   ```

41. **HEX_6**: `#43e97b` (라인 292)
   ```
   SUCCESS: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

42. **HEX_6**: `#38f9d7` (라인 292)
   ```
   SUCCESS: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
   ```

43. **HEX_6**: `#ee5a24` (라인 293)
   ```
   DANGER: 'linear-gradient(135deg, var(--mg-error-500) 0%, #ee5a24 100%)',
   ```

44. **HEX_6**: `#4facfe` (라인 294)
   ```
   INFO: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

45. **HEX_6**: `#00f2fe` (라인 294)
   ```
   INFO: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
   ```

46. **HEX_6**: `#f5576c` (라인 295)
   ```
   WARNING: 'linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%)',
   ```

47. **HEX_6**: `#00a085` (라인 297)
   ```
   CLIENT: 'linear-gradient(135deg, var(--mg-success-500) 0%, #00a085 100%)',
   ```

48. **HEX_6**: `#27ae60` (라인 299)
   ```
   REVENUE: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

49. **HEX_6**: `#229954` (라인 299)
   ```
   REVENUE: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
   ```

50. **HEX_6**: `#e74c3c` (라인 300)
   ```
   EXPENSE: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

51. **HEX_6**: `#c0392b` (라인 300)
   ```
   EXPENSE: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
   ```

52. **HEX_6**: `#9b59b6` (라인 301)
   ```
   PAYMENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

53. **HEX_6**: `#8e44ad` (라인 301)
   ```
   PAYMENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
   ```

54. **HEX_6**: `#34495e` (라인 302)
   ```
   REPORT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

55. **HEX_6**: `#2c3e50` (라인 302)
   ```
   REPORT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
   ```

56. **HEX_6**: `#95a5a6` (라인 303)
   ```
   SETTINGS: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
   ```

57. **HEX_6**: `#7f8c8d` (라인 303)
   ```
   SETTINGS: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
   ```

58. **HEX_6**: `#FEE500` (라인 415)
   ```
   COLOR: '#FEE500',
   ```

59. **HEX_6**: `#03C75A` (라인 420)
   ```
   COLOR: '#03C75A',
   ```

60. **HEX_6**: `#6b7280` (라인 663)
   ```
   return CSS_VARIABLES.COLORS[colorKey] || '#6b7280';
   ```

61. **HEX_6**: `#6b7280` (라인 674)
   ```
   return CSS_VARIABLES.COLORS[colorKey] || '#6b7280';
   ```

62. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 127)
   ```
   LG: '0 4px 20px rgba(0, 0, 0, 0.08)',
   ```

63. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 128)
   ```
   XL: '0 8px 30px rgba(0, 0, 0, 0.12)',
   ```

64. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 130)
   ```
   MODAL: '0 10px 30px rgba(0, 0, 0, 0.2)'
   ```

---

### 🔥 `frontend/src/styles/mindgarden-design-system.css` (CSS)

**하드코딩 색상**: 58개 - **즉시 수정 필요**

1. **HEX_6**: `#2563eb` (라인 101)
   ```
   background-color: var(--cs-primary-600, #2563eb);
   ```

2. **HEX_6**: `#1d4ed8` (라인 107)
   ```
   background-color: var(--cs-primary-700, #1d4ed8);
   ```

3. **HEX_6**: `#6b7280` (라인 113)
   ```
   background-color: var(--cs-secondary-500, #6b7280);
   ```

4. **HEX_6**: `#d1d5db` (라인 115)
   ```
   border: 1px solid var(--cs-secondary-300, #d1d5db);
   ```

5. **HEX_6**: `#4b5563` (라인 119)
   ```
   background-color: var(--cs-secondary-600, #4b5563);
   ```

6. **HEX_6**: `#059669` (라인 129)
   ```
   background-color: var(--cs-success-600, #059669);
   ```

7. **HEX_6**: `#dc2626` (라인 140)
   ```
   background-color: var(--cs-error-600, #dc2626);
   ```

8. **HEX_6**: `#e5e7eb` (라인 209)
   ```
   border-bottom: 1px solid var(--cs-secondary-200, #e5e7eb);
   ```

9. **HEX_6**: `#111827` (라인 216)
   ```
   color: var(--cs-secondary-900, #111827);
   ```

10. **HEX_6**: `#6b7280` (라인 224)
   ```
   color: var(--cs-secondary-500, #6b7280);
   ```

11. **HEX_6**: `#f3f4f6` (라인 234)
   ```
   background-color: var(--cs-secondary-100, #f3f4f6);
   ```

12. **HEX_6**: `#374151` (라인 235)
   ```
   color: var(--cs-secondary-700, #374151);
   ```

13. **HEX_6**: `#e5e7eb` (라인 244)
   ```
   border-top: 1px solid var(--cs-secondary-200, #e5e7eb);
   ```

14. **HEX_6**: `#e5e7eb` (라인 255)
   ```
   border: 1px solid var(--cs-secondary-200, #e5e7eb);
   ```

15. **HEX_6**: `#e5e7eb` (라인 265)
   ```
   border-color: var(--cs-secondary-200, #e5e7eb);
   ```

16. **HEX_6**: `#d1d5db` (라인 277)
   ```
   border-color: var(--cs-secondary-300, #d1d5db);
   ```

17. **HEX_6**: `#e5e7eb` (라인 308)
   ```
   border-bottom: 1px solid var(--cs-secondary-200, #e5e7eb);
   ```

18. **HEX_6**: `#e5e7eb` (라인 339)
   ```
   border-top: 1px solid var(--cs-secondary-200, #e5e7eb);
   ```

19. **HEX_6**: `#e5e7eb` (라인 360)
   ```
   border-bottom: 1px solid var(--cs-secondary-200, #e5e7eb);
   ```

20. **HEX_6**: `#374151` (라인 373)
   ```
   color: var(--cs-secondary-700, #374151);
   ```

21. **HEX_6**: `#111827` (라인 379)
   ```
   color: var(--cs-secondary-900, #111827);
   ```

22. **HEX_6**: `#e5e7eb` (라인 653)
   ```
   border: 3px solid var(--cs-secondary-200, #e5e7eb);
   ```

23. **HEX_6**: `#e5e7eb` (라인 698)
   ```
   background-color: var(--cs-secondary-200, #e5e7eb);
   ```

24. **HEX_6**: `#d1fae5` (라인 738)
   ```
   background-color: var(--cs-success-100, #d1fae5);
   ```

25. **HEX_6**: `#047857` (라인 739)
   ```
   color: var(--cs-success-700, #047857);
   ```

26. **HEX_6**: `#f3f4f6` (라인 743)
   ```
   background-color: var(--cs-secondary-100, #f3f4f6);
   ```

27. **HEX_6**: `#374151` (라인 744)
   ```
   color: var(--cs-secondary-700, #374151);
   ```

28. **HEX_6**: `#fef3c7` (라인 748)
   ```
   background-color: var(--cs-warning-100, #fef3c7);
   ```

29. **HEX_6**: `#b45309` (라인 749)
   ```
   color: var(--cs-warning-700, #b45309);
   ```

30. **HEX_6**: `#fee2e2` (라인 753)
   ```
   background-color: var(--cs-error-100, #fee2e2);
   ```

31. **HEX_6**: `#b91c1c` (라인 754)
   ```
   color: var(--cs-error-700, #b91c1c);
   ```

32. **HEX_6**: `#6b7280` (라인 778)
   ```
   background-color: var(--cs-secondary-500, #6b7280);
   ```

33. **HEX_6**: `#FAF9F7` (라인 783)
   ```
   background: var(--color-bg-primary, #FAF9F7);
   ```

34. **HEX_6**: `#e5e7eb` (라인 897)
   ```
   background-color: var(--cs-secondary-200, #e5e7eb);
   ```

35. **HEX_6**: `#d1d5db` (라인 959)
   ```
   border: 1px solid var(--cs-secondary-300, #d1d5db);
   ```

36. **HEX_6**: `#111827` (라인 964)
   ```
   color: var(--cs-secondary-900, #111827);
   ```

37. **HEX_6**: `#f3f4f6` (라인 980)
   ```
   background-color: var(--cs-secondary-100, #f3f4f6);
   ```

38. **HEX_6**: `#6b7280` (라인 981)
   ```
   color: var(--cs-secondary-500, #6b7280);
   ```

39. **HEX_6**: `#d1d5db` (라인 989)
   ```
   border: 1px solid var(--cs-secondary-300, #d1d5db);
   ```

40. **HEX_6**: `#111827` (라인 994)
   ```
   color: var(--cs-secondary-900, #111827);
   ```

41. **HEX_6**: `#f3f4f6` (라인 1009)
   ```
   background-color: var(--cs-secondary-100, #f3f4f6);
   ```

42. **HEX_6**: `#6b7280` (라인 1010)
   ```
   color: var(--cs-secondary-500, #6b7280);
   ```

43. **HEX_6**: `#374151` (라인 1033)
   ```
   color: var(--cs-secondary-700, #374151);
   ```

44. **HEX_6**: `#6b7280` (라인 1049)
   ```
   color: var(--cs-secondary-500, #6b7280);
   ```

45. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 103)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

46. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 109)
   ```
   box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
   ```

47. **RGBA**: `rgba(107, 114, 128, 0.2)` (라인 120)
   ```
   box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2);
   ```

48. **RGBA**: `rgba(16, 185, 129, 0.3)` (라인 131)
   ```
   box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
   ```

49. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 142)
   ```
   box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
   ```

50. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 257)
   ```
   box-shadow: 0 1px 3px var(--mg-shadow-light), 0 1px 2px rgba(0, 0, 0, 0.06);
   ```

51. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 271)
   ```
   box-shadow: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

52. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 282)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

53. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 284)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

54. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 631)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

55. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 976)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

56. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 1005)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

57. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 1019)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

58. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 1347)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 🔥 `frontend/src/styles/themes/dark-theme.css` (CSS)

**하드코딩 색상**: 48개 - **즉시 수정 필요**

1. **HEX_6**: `#0f172a` (라인 17)
   ```
   --color-bg-primary: #0f172a;
   ```

2. **HEX_6**: `#1e293b` (라인 18)
   ```
   --color-bg-secondary: #1e293b;
   ```

3. **HEX_6**: `#334155` (라인 19)
   ```
   --color-bg-tertiary: #334155;
   ```

4. **HEX_6**: `#475569` (라인 20)
   ```
   --color-bg-accent: #475569;
   ```

5. **HEX_6**: `#f8fafc` (라인 25)
   ```
   --color-text-primary: #f8fafc;
   ```

6. **HEX_6**: `#e2e8f0` (라인 26)
   ```
   --color-text-secondary: #e2e8f0;
   ```

7. **HEX_6**: `#cbd5e1` (라인 27)
   ```
   --color-text-tertiary: #cbd5e1;
   ```

8. **HEX_6**: `#94a3b8` (라인 28)
   ```
   --color-text-muted: #94a3b8;
   ```

9. **HEX_6**: `#0f172a` (라인 29)
   ```
   --color-text-inverse: #0f172a;
   ```

10. **HEX_6**: `#334155` (라인 32)
   ```
   --color-border-primary: #334155;
   ```

11. **HEX_6**: `#475569` (라인 33)
   ```
   --color-border-secondary: #475569;
   ```

12. **HEX_6**: `#64748b` (라인 34)
   ```
   --color-border-accent: #64748b;
   ```

13. **HEX_6**: `#60a5fa` (라인 35)
   ```
   --color-border-focus: #60a5fa;
   ```

14. **HEX_6**: `#34d399` (라인 38)
   ```
   --color-success: #34d399;
   ```

15. **HEX_6**: `#064e3b` (라인 39)
   ```
   --color-success-light: #064e3b;
   ```

16. **HEX_6**: `#fbbf24` (라인 42)
   ```
   --color-warning: #fbbf24;
   ```

17. **HEX_6**: `#78350f` (라인 43)
   ```
   --color-warning-light: #78350f;
   ```

18. **HEX_6**: `#f87171` (라인 46)
   ```
   --color-error: #f87171;
   ```

19. **HEX_6**: `#7f1d1d` (라인 47)
   ```
   --color-error-light: #7f1d1d;
   ```

20. **HEX_6**: `#22d3ee` (라인 50)
   ```
   --color-info: #22d3ee;
   ```

21. **HEX_6**: `#083344` (라인 51)
   ```
   --color-info-light: #083344;
   ```

22. **HEX_6**: `#06b6d4` (라인 52)
   ```
   --color-info-dark: #06b6d4;
   ```

23. **HEX_6**: `#f8fafc` (라인 66)
   ```
   --ios-text-primary: #f8fafc;
   ```

24. **HEX_6**: `#e2e8f0` (라인 67)
   ```
   --ios-text-secondary: #e2e8f0;
   ```

25. **HEX_6**: `#f8fafc` (라인 72)
   ```
   --header-text: #f8fafc;
   ```

26. **HEX_6**: `#cbd5e1` (라인 73)
   ```
   --header-text-muted: #cbd5e1;
   ```

27. **RGBA**: `rgba(15, 23, 42, 0.8)` (라인 21)
   ```
   --color-bg-glass: rgba(15, 23, 42, 0.8);
   ```

28. **RGBA**: `rgba(15, 23, 42, 0.95)` (라인 22)
   ```
   --color-bg-glass-strong: rgba(15, 23, 42, 0.95);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 55)
   ```
   --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 56)
   ```
   --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 56)
   ```
   --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 57)
   ```
   --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 57)
   ```
   --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
   ```

34. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 58)
   ```
   --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 58)
   ```
   --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
   ```

36. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 59)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
   ```

37. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 60)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
   ```

38. **RGBA**: `rgba(15, 23, 42, 0.95)` (라인 63)
   ```
   --ios-bg-primary: rgba(15, 23, 42, 0.95);
   ```

39. **RGBA**: `rgba(30, 41, 59, 0.95)` (라인 64)
   ```
   --ios-bg-secondary: rgba(30, 41, 59, 0.95);
   ```

40. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 65)
   ```
   --ios-border: rgba(51, 65, 85, 0.8);
   ```

41. **RGBA**: `rgba(15, 23, 42, 0.95)` (라인 70)
   ```
   --header-bg: rgba(15, 23, 42, 0.95);
   ```

42. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 71)
   ```
   --header-border: rgba(51, 65, 85, 0.8);
   ```

43. **RGBA**: `rgba(15, 23, 42, 0.98)` (라인 76)
   ```
   --modal-bg: rgba(15, 23, 42, 0.98);
   ```

44. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 77)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.6);
   ```

45. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 78)
   ```
   --modal-border: rgba(51, 65, 85, 0.8);
   ```

46. **RGBA**: `rgba(15, 23, 42, 0.98)` (라인 82)
   ```
   --dropdown-bg: rgba(15, 23, 42, 0.98);
   ```

47. **RGBA**: `rgba(51, 65, 85, 0.8)` (라인 83)
   ```
   --dropdown-border: rgba(51, 65, 85, 0.8);
   ```

48. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 84)
   ```
   --dropdown-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
   ```

---

### 🔥 `frontend/src/styles/themes/light-theme.css` (CSS)

**하드코딩 색상**: 37개 - **즉시 수정 필요**

1. **HEX_6**: `#0f172a` (라인 25)
   ```
   --color-text-primary: #0f172a;
   ```

2. **HEX_6**: `#475569` (라인 26)
   ```
   --color-text-secondary: #475569;
   ```

3. **HEX_6**: `#64748b` (라인 27)
   ```
   --color-text-tertiary: #64748b;
   ```

4. **HEX_6**: `#94a3b8` (라인 28)
   ```
   --color-text-muted: #94a3b8;
   ```

5. **HEX_6**: `#e2e8f0` (라인 32)
   ```
   --color-border-primary: #e2e8f0;
   ```

6. **HEX_6**: `#cbd5e1` (라인 33)
   ```
   --color-border-secondary: #cbd5e1;
   ```

7. **HEX_6**: `#94a3b8` (라인 34)
   ```
   --color-border-accent: #94a3b8;
   ```

8. **HEX_6**: `#d1fae5` (라인 39)
   ```
   --color-success-light: #d1fae5;
   ```

9. **HEX_6**: `#059669` (라인 40)
   ```
   --color-success-dark: #059669;
   ```

10. **HEX_6**: `#fef3c7` (라인 43)
   ```
   --color-warning-light: #fef3c7;
   ```

11. **HEX_6**: `#d97706` (라인 44)
   ```
   --color-warning-dark: #d97706;
   ```

12. **HEX_6**: `#fee2e2` (라인 47)
   ```
   --color-error-light: #fee2e2;
   ```

13. **HEX_6**: `#dc2626` (라인 48)
   ```
   --color-error-dark: #dc2626;
   ```

14. **HEX_6**: `#06b6d4` (라인 50)
   ```
   --color-info: #06b6d4;
   ```

15. **HEX_6**: `#cffafe` (라인 51)
   ```
   --color-info-light: #cffafe;
   ```

16. **HEX_6**: `#0891b2` (라인 52)
   ```
   --color-info-dark: #0891b2;
   ```

17. **HEX_6**: `#1e293b` (라인 66)
   ```
   --ios-text-primary: #1e293b;
   ```

18. **HEX_6**: `#475569` (라인 67)
   ```
   --ios-text-secondary: #475569;
   ```

19. **HEX_6**: `#1e293b` (라인 72)
   ```
   --header-text: #1e293b;
   ```

20. **HEX_6**: `#64748b` (라인 73)
   ```
   --header-text-muted: #64748b;
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 55)
   ```
   --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 56)
   ```
   --shadow-md: 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 57)
   ```
   --shadow-lg: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 58)
   ```
   --shadow-xl: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

25. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 59)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

26. **RGBA**: `rgba(31, 38, 135, 0.6)` (라인 60)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(31, 38, 135, 0.6);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 63)
   ```
   --ios-bg-primary: rgba(255, 255, 255, 0.95);
   ```

28. **RGBA**: `rgba(248, 250, 252, 0.95)` (라인 64)
   ```
   --ios-bg-secondary: rgba(248, 250, 252, 0.95);
   ```

29. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 65)
   ```
   --ios-border: rgba(226, 232, 240, 0.8);
   ```

30. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 70)
   ```
   --header-bg: rgba(255, 255, 255, 0.95);
   ```

31. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 71)
   ```
   --header-border: rgba(226, 232, 240, 0.8);
   ```

32. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 76)
   ```
   --modal-bg: rgba(255, 255, 255, 0.98);
   ```

33. **RGBA**: `rgba(15, 23, 42, 0.3)` (라인 77)
   ```
   --modal-backdrop: rgba(15, 23, 42, 0.3);
   ```

34. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 78)
   ```
   --modal-border: rgba(226, 232, 240, 0.8);
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 79)
   ```
   --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

36. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 82)
   ```
   --dropdown-bg: rgba(255, 255, 255, 0.98);
   ```

37. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 83)
   ```
   --dropdown-border: rgba(226, 232, 240, 0.8);
   ```

---

### 🔥 `frontend/src/styles/themes/high-contrast-theme.css` (CSS)

**하드코딩 색상**: 35개 - **즉시 수정 필요**

1. **HEX_6**: `#0000ff` (라인 35)
   ```
   --color-border-focus: #0000ff;
   ```

2. **HEX_6**: `#006600` (라인 38)
   ```
   --color-success: #006600;
   ```

3. **HEX_6**: `#e6ffe6` (라인 39)
   ```
   --color-success-light: #e6ffe6;
   ```

4. **HEX_6**: `#004400` (라인 40)
   ```
   --color-success-dark: #004400;
   ```

5. **HEX_6**: `#cc6600` (라인 42)
   ```
   --color-warning: #cc6600;
   ```

6. **HEX_6**: `#fff2e6` (라인 43)
   ```
   --color-warning-light: #fff2e6;
   ```

7. **HEX_6**: `#994400` (라인 44)
   ```
   --color-warning-dark: #994400;
   ```

8. **HEX_6**: `#cc0000` (라인 46)
   ```
   --color-error: #cc0000;
   ```

9. **HEX_6**: `#ffe6e6` (라인 47)
   ```
   --color-error-light: #ffe6e6;
   ```

10. **HEX_6**: `#990000` (라인 48)
   ```
   --color-error-dark: #990000;
   ```

11. **HEX_6**: `#0066cc` (라인 50)
   ```
   --color-info: #0066cc;
   ```

12. **HEX_6**: `#e6f2ff` (라인 51)
   ```
   --color-info-light: #e6f2ff;
   ```

13. **HEX_6**: `#004499` (라인 52)
   ```
   --color-info-dark: #004499;
   ```

14. **HEX_6**: `#0000ff` (라인 89)
   ```
   --focus-ring-color: #0000ff;
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 21)
   ```
   --color-bg-glass: rgba(255, 255, 255, 0.95);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 22)
   ```
   --color-bg-glass-strong: rgba(255, 255, 255, 0.98);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 55)
   ```
   --shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 56)
   ```
   --shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 56)
   ```
   --shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 57)
   ```
   --shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.4), 0 4px 8px 0 rgba(0, 0, 0, 0.3);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 57)
   ```
   --shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.4), 0 4px 8px 0 rgba(0, 0, 0, 0.3);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 58)
   ```
   --shadow-xl: 0 12px 24px 0 var(--mg-overlay), 0 6px 12px 0 rgba(0, 0, 0, 0.4);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 59)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.6);
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 60)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 63)
   ```
   --ios-bg-primary: rgba(255, 255, 255, 0.98);
   ```

26. **RGBA**: `rgba(248, 248, 248, 0.98)` (라인 64)
   ```
   --ios-bg-secondary: rgba(248, 248, 248, 0.98);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 65)
   ```
   --ios-border: rgba(0, 0, 0, 0.9);
   ```

28. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 70)
   ```
   --header-bg: rgba(255, 255, 255, 0.98);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 71)
   ```
   --header-border: rgba(0, 0, 0, 0.9);
   ```

30. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 76)
   ```
   --modal-bg: rgba(255, 255, 255, 0.98);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 77)
   ```
   --modal-backdrop: rgba(0, 0, 0, 0.8);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 78)
   ```
   --modal-border: rgba(0, 0, 0, 0.9);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 79)
   ```
   --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
   ```

34. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 82)
   ```
   --dropdown-bg: rgba(255, 255, 255, 0.98);
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.9)` (라인 83)
   ```
   --dropdown-border: rgba(0, 0, 0, 0.9);
   ```

---

### 🔥 `frontend/src/themes/defaultTheme.js` (JS)

**하드코딩 색상**: 22개 - **즉시 수정 필요**

1. **HEX_6**: `#fef3c7` (라인 54)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef3c7 -> var(--mg-custom-fef3c7)
   ```

2. **HEX_6**: `#fef3c7` (라인 55)
   ```
   warningBg: '#fef3c7',
   ```

3. **HEX_6**: `#fee2e2` (라인 57)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fee2e2 -> var(--mg-custom-fee2e2)
   ```

4. **HEX_6**: `#fee2e2` (라인 58)
   ```
   errorBg: '#fee2e2',
   ```

5. **HEX_6**: `#dbeafe` (라인 60)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #dbeafe -> var(--mg-custom-dbeafe)
   ```

6. **HEX_6**: `#dbeafe` (라인 61)
   ```
   infoBg: '#dbeafe'
   ```

7. **HEX_6**: `#E5E5E7` (라인 69)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #E5E5E7 -> var(--mg-custom-E5E5E7)
   ```

8. **HEX_6**: `#E5E5E7` (라인 70)
   ```
   disabled: '#E5E5E7',
   ```

9. **HEX_6**: `#9CA3AF` (라인 71)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9CA3AF -> var(--mg-custom-9CA3AF)
   ```

10. **HEX_6**: `#9CA3AF` (라인 72)
   ```
   disabledText: '#9CA3AF'
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 66)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.05) -> var(--mg-custom-color)
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 67)
   ```
   hover: 'rgba(0, 0, 0, 0.05)',
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 77)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 255, 255, 0.6) -> var(--mg-custom-color)
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 78)
   ```
   background: 'rgba(255, 255, 255, 0.6)',
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 79)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 255, 255, 0.5) -> var(--mg-custom-color)
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 80)
   ```
   border: 'rgba(255, 255, 255, 0.5)',
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 139)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.05) -> var(--mg-custom-color)
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 140)
   ```
   sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 144)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.25) -> var(--mg-custom-color)
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 145)
   ```
   '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 146)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.06) -> var(--mg-custom-color)
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 147)
   ```
   inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
   ```

---

### 🔥 `frontend/src/styles/01-settings/_theme-variables.css` (CSS)

**하드코딩 색상**: 21개 - **즉시 수정 필요**

1. **HEX_6**: `#1a3d1a` (라인 55)
   ```
   --mood-text-primary: #1a3d1a;
   ```

2. **HEX_6**: `#2d5a2d` (라인 56)
   ```
   --mood-text-secondary: #2d5a2d;
   ```

3. **HEX_6**: `#4a47a3` (라인 64)
   ```
   --mood-accent-dark: #4a47a3;
   ```

4. **HEX_6**: `#2d2d3a` (라인 70)
   ```
   --mood-text-primary: #2d2d3a;
   ```

5. **HEX_6**: `#6b6b7a` (라인 71)
   ```
   --mood-text-secondary: #6b6b7a;
   ```

6. **HEX_6**: `#ff2d92` (라인 77)
   ```
   --mood-accent: #ff2d92;
   ```

7. **HEX_6**: `#e0267d` (라인 79)
   ```
   --mood-accent-dark: #e0267d;
   ```

8. **HEX_6**: `#3a1a2d` (라인 85)
   ```
   --mood-text-primary: #3a1a2d;
   ```

9. **HEX_6**: `#7a3d5a` (라인 86)
   ```
   --mood-text-secondary: #7a3d5a;
   ```

10. **RGBA**: `rgba(52, 199, 89, 0.1)` (라인 48)
   ```
   --mood-accent-light: rgba(52, 199, 89, 0.1);
   ```

11. **RGBA**: `rgba(245, 255, 248, 0.95)` (라인 51)
   ```
   --mood-card-bg: rgba(245, 255, 248, 0.95);
   ```

12. **RGBA**: `rgba(52, 199, 89, 0.08)` (라인 52)
   ```
   --mood-card-border: rgba(52, 199, 89, 0.08);
   ```

13. **RGBA**: `rgba(52, 199, 89, 0.12)` (라인 53)
   ```
   --mood-shadow: 0 2px 8px rgba(52, 199, 89, 0.12);
   ```

14. **RGBA**: `rgba(88, 86, 214, 0.1)` (라인 63)
   ```
   --mood-accent-light: rgba(88, 86, 214, 0.1);
   ```

15. **RGBA**: `rgba(248, 247, 255, 0.95)` (라인 66)
   ```
   --mood-card-bg: rgba(248, 247, 255, 0.95);
   ```

16. **RGBA**: `rgba(88, 86, 214, 0.08)` (라인 67)
   ```
   --mood-card-border: rgba(88, 86, 214, 0.08);
   ```

17. **RGBA**: `rgba(88, 86, 214, 0.12)` (라인 68)
   ```
   --mood-shadow: 0 2px 8px rgba(88, 86, 214, 0.12);
   ```

18. **RGBA**: `rgba(255, 45, 146, 0.1)` (라인 78)
   ```
   --mood-accent-light: rgba(255, 45, 146, 0.1);
   ```

19. **RGBA**: `rgba(255, 245, 252, 0.95)` (라인 81)
   ```
   --mood-card-bg: rgba(255, 245, 252, 0.95);
   ```

20. **RGBA**: `rgba(255, 45, 146, 0.08)` (라인 82)
   ```
   --mood-card-border: rgba(255, 45, 146, 0.08);
   ```

21. **RGBA**: `rgba(255, 45, 146, 0.12)` (라인 83)
   ```
   --mood-shadow: 0 2px 8px rgba(255, 45, 146, 0.12);
   ```

---

### 🔥 `frontend/src/hooks/useTheme.js` (JS)

**하드코딩 색상**: 12개 - **즉시 수정 필요**

1. **HEX_6**: `#f2f2f7` (라인 89)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f2f2f7 -> var(--mg-custom-f2f2f7)
   ```

2. **HEX_6**: `#f2f2f7` (라인 90)
   ```
   root.style.setProperty('--theme-bg-secondary', '#f2f2f7');
   ```

3. **HEX_6**: `#1d1d1f` (라인 92)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1d1d1f -> var(--mg-custom-1d1d1f)
   ```

4. **HEX_6**: `#1d1d1f` (라인 93)
   ```
   root.style.setProperty('--theme-text-primary', '#1d1d1f');
   ```

5. **HEX_6**: `#86868b` (라인 94)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #86868b -> var(--mg-custom-86868b)
   ```

6. **HEX_6**: `#86868b` (라인 95)
   ```
   root.style.setProperty('--theme-text-secondary', '#86868b');
   ```

7. **HEX_6**: `#c7c7cc` (라인 96)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #c7c7cc -> var(--mg-custom-c7c7cc)
   ```

8. **HEX_6**: `#c7c7cc` (라인 97)
   ```
   root.style.setProperty('--theme-text-tertiary', '#c7c7cc');
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 83)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 255, 255, 0.1) -> var(--mg-custom-color)
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 84)
   ```
   root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.1)');
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 98)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.05) -> var(--mg-custom-color)
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 99)
   ```
   root.style.setProperty('--theme-border', 'rgba(0, 0, 0, 0.05)');
   ```

---

### 🔥 `frontend/src/styles/01-settings/_colors.css` (CSS)

**하드코딩 색상**: 7개 - **즉시 수정 필요**

1. **HEX_6**: `#f2f2f7` (라인 52)
   ```
   --ipad-bg-secondary: #f2f2f7;
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 59)
   ```
   --glass-border: rgba(255, 255, 255, 0.18);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 60)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.3);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 63)
   ```
   --ipad-card-bg: rgba(255, 255, 255, 0.9);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 64)
   ```
   --ipad-card-border: rgba(0, 0, 0, 0.05);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 65)
   ```
   --ipad-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

7. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 69)
   ```
   --ipad-btn-secondary: rgba(142, 142, 147, 0.12);
   ```

---

### 🔥 `frontend/src/components/ui/ThemeSelector/ThemeSelector.test.js` (JS)

**하드코딩 색상**: 4개 - **즉시 수정 필요**

1. **HEX_6**: `#F0F8FF` (라인 29)
   ```
   secondary: '#F0F8FF',
   ```

2. **HEX_6**: `#191970` (라인 31)
   ```
   text: '#191970'
   ```

3. **HEX_6**: `#FFB6C1` (라인 39)
   ```
   preview: '#FFB6C1'
   ```

4. **HEX_6**: `#87CEEB` (라인 51)
   ```
   preview: '#87CEEB'
   ```

---

### 🔥 `frontend/src/styles/themes/mobile-theme.css` (CSS)

**하드코딩 색상**: 3개 - **즉시 수정 필요**

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 28)
   ```
   --mobile-bg-primary: rgba(255, 255, 255, 0.95);
   ```

2. **RGBA**: `rgba(248, 250, 252, 0.95)` (라인 29)
   ```
   --mobile-bg-secondary: rgba(248, 250, 252, 0.95);
   ```

3. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 30)
   ```
   --mobile-border: rgba(226, 232, 240, 0.8);
   ```

---

### 🔥 `frontend/src/utils/resolveCssColorVarToHex.js` (JS)

**하드코딩 색상**: 2개 - **즉시 수정 필요**

1. **HEX_6**: `#6B7280` (라인 12)
   ```
   const MG_SECONDARY_500_SSR_FALLBACK_HEX = '#6B7280';
   ```

2. **HEX_6**: `#2563EB` (라인 18)
   ```
   const MG_PRIMARY_500_SSR_FALLBACK_HEX = '#2563EB';
   ```

---

### 🔥 `frontend/src/utils/cssThemeHelper.js` (JS)

**하드코딩 색상**: 2개 - **즉시 수정 필요**

1. **HEX_6**: `#764ba2` (라인 277)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #764ba2 -> var(--mg-custom-764ba2)
   ```

2. **HEX_6**: `#764ba2` (라인 278)
   ```
   PRIMARY_DARK: '#764ba2',
   ```

---

### 🔥 `frontend/src/hooks/useTenantBranding.js` (JS)

**하드코딩 색상**: 2개 - **즉시 수정 필요**

1. **HEX_6**: `#6b7280` (라인 59)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

2. **HEX_6**: `#6b7280` (라인 60)
   ```
   secondaryColor: '#6b7280',
   ```

---

### 📁 `frontend/src/styles/unified-design-tokens.css` (CSS)

**하드코딩 색상**: 768개

1. **HEX_3**: `#666` (라인 12066)
   ```
   color: #666;
   ```

2. **HEX_3**: `#666` (라인 16853)
   ```
   color: #666;
   ```

3. **HEX_3**: `#ddd` (라인 17605)
   ```
   border: 1px solid #ddd;
   ```

4. **HEX_6**: `#eff6ff` (라인 19)
   ```
   --cs-primary-50: #eff6ff;
   ```

5. **HEX_6**: `#dbeafe` (라인 20)
   ```
   --cs-primary-100: #dbeafe;
   ```

6. **HEX_6**: `#bfdbfe` (라인 21)
   ```
   --cs-primary-200: #bfdbfe;
   ```

7. **HEX_6**: `#93c5fd` (라인 22)
   ```
   --cs-primary-300: #93c5fd;
   ```

8. **HEX_6**: `#60a5fa` (라인 23)
   ```
   --cs-primary-400: #60a5fa;
   ```

9. **HEX_6**: `#2563eb` (라인 25)
   ```
   --cs-primary-600: #2563eb;
   ```

10. **HEX_6**: `#1d4ed8` (라인 26)
   ```
   --cs-primary-700: #1d4ed8;
   ```

11. **HEX_6**: `#1e40af` (라인 27)
   ```
   --cs-primary-800: #1e40af;
   ```

12. **HEX_6**: `#1e3a8a` (라인 28)
   ```
   --cs-primary-900: #1e3a8a;
   ```

13. **HEX_6**: `#f9fafb` (라인 30)
   ```
   --cs-secondary-50: #f9fafb;
   ```

14. **HEX_6**: `#f3f4f6` (라인 31)
   ```
   --cs-secondary-100: #f3f4f6;
   ```

15. **HEX_6**: `#e5e7eb` (라인 32)
   ```
   --cs-secondary-200: #e5e7eb;
   ```

16. **HEX_6**: `#d1d5db` (라인 33)
   ```
   --cs-secondary-300: #d1d5db;
   ```

17. **HEX_6**: `#9ca3af` (라인 34)
   ```
   --cs-secondary-400: #9ca3af;
   ```

18. **HEX_6**: `#6b7280` (라인 35)
   ```
   --cs-secondary-500: #6b7280;
   ```

19. **HEX_6**: `#4b5563` (라인 36)
   ```
   --cs-secondary-600: #4b5563;
   ```

20. **HEX_6**: `#374151` (라인 37)
   ```
   --cs-secondary-700: #374151;
   ```

21. **HEX_6**: `#1f2937` (라인 38)
   ```
   --cs-secondary-800: #1f2937;
   ```

22. **HEX_6**: `#111827` (라인 39)
   ```
   --cs-secondary-900: #111827;
   ```

23. **HEX_6**: `#ecfdf5` (라인 42)
   ```
   --cs-success-50: #ecfdf5;
   ```

24. **HEX_6**: `#d1fae5` (라인 43)
   ```
   --cs-success-100: #d1fae5;
   ```

25. **HEX_6**: `#a7f3d0` (라인 44)
   ```
   --cs-success-200: #a7f3d0;
   ```

26. **HEX_6**: `#6ee7b7` (라인 45)
   ```
   --cs-success-300: #6ee7b7;
   ```

27. **HEX_6**: `#34d399` (라인 46)
   ```
   --cs-success-400: #34d399;
   ```

28. **HEX_6**: `#10b981` (라인 48)
   ```
   --cs-success-500: #10b981;
   ```

29. **HEX_6**: `#059669` (라인 49)
   ```
   --cs-success-600: #059669;
   ```

30. **HEX_6**: `#047857` (라인 50)
   ```
   --cs-success-700: #047857;
   ```

31. **HEX_6**: `#065f46` (라인 51)
   ```
   --cs-success-800: #065f46;
   ```

32. **HEX_6**: `#064e3b` (라인 52)
   ```
   --cs-success-900: #064e3b;
   ```

33. **HEX_6**: `#fef2f2` (라인 55)
   ```
   --cs-error-50: #fef2f2;
   ```

34. **HEX_6**: `#fee2e2` (라인 56)
   ```
   --cs-error-100: #fee2e2;
   ```

35. **HEX_6**: `#fecaca` (라인 57)
   ```
   --cs-error-200: #fecaca;
   ```

36. **HEX_6**: `#fca5a5` (라인 58)
   ```
   --cs-error-300: #fca5a5;
   ```

37. **HEX_6**: `#f87171` (라인 59)
   ```
   --cs-error-400: #f87171;
   ```

38. **HEX_6**: `#ef4444` (라인 60)
   ```
   --cs-error-500: #ef4444;
   ```

39. **HEX_6**: `#dc2626` (라인 61)
   ```
   --cs-error-600: #dc2626;
   ```

40. **HEX_6**: `#b91c1c` (라인 62)
   ```
   --cs-error-700: #b91c1c;
   ```

41. **HEX_6**: `#991b1b` (라인 63)
   ```
   --cs-error-800: #991b1b;
   ```

42. **HEX_6**: `#7f1d1d` (라인 64)
   ```
   --cs-error-900: #7f1d1d;
   ```

43. **HEX_6**: `#fffbeb` (라인 67)
   ```
   --cs-warning-50: #fffbeb;
   ```

44. **HEX_6**: `#fef3c7` (라인 68)
   ```
   --cs-warning-100: #fef3c7;
   ```

45. **HEX_6**: `#fde68a` (라인 69)
   ```
   --cs-warning-200: #fde68a;
   ```

46. **HEX_6**: `#fcd34d` (라인 70)
   ```
   --cs-warning-300: #fcd34d;
   ```

47. **HEX_6**: `#fbbf24` (라인 71)
   ```
   --cs-warning-400: #fbbf24;
   ```

48. **HEX_6**: `#d97706` (라인 73)
   ```
   --cs-warning-600: #d97706;
   ```

49. **HEX_6**: `#b45309` (라인 74)
   ```
   --cs-warning-700: #b45309;
   ```

50. **HEX_6**: `#92400e` (라인 75)
   ```
   --cs-warning-800: #92400e;
   ```

51. **HEX_6**: `#78350f` (라인 76)
   ```
   --cs-warning-900: #78350f;
   ```

52. **HEX_6**: `#fdf2f8` (라인 79)
   ```
   --cs-pink-50: #fdf2f8;
   ```

53. **HEX_6**: `#fce7f3` (라인 80)
   ```
   --cs-pink-100: #fce7f3;
   ```

54. **HEX_6**: `#fbcfe8` (라인 81)
   ```
   --cs-pink-200: #fbcfe8;
   ```

55. **HEX_6**: `#f9a8d4` (라인 82)
   ```
   --cs-pink-300: #f9a8d4;
   ```

56. **HEX_6**: `#f472b6` (라인 83)
   ```
   --cs-pink-400: #f472b6;
   ```

57. **HEX_6**: `#ff2d92` (라인 84)
   ```
   --cs-pink-500: #ff2d92;
   ```

58. **HEX_6**: `#ec4899` (라인 85)
   ```
   --cs-pink-600: #ec4899;
   ```

59. **HEX_6**: `#be185d` (라인 86)
   ```
   --cs-pink-700: #be185d;
   ```

60. **HEX_6**: `#9d174d` (라인 87)
   ```
   --cs-pink-800: #9d174d;
   ```

61. **HEX_6**: `#831843` (라인 88)
   ```
   --cs-pink-900: #831843;
   ```

62. **HEX_6**: `#fffbeb` (라인 91)
   ```
   --cs-yellow-50: #fffbeb;
   ```

63. **HEX_6**: `#fef3c7` (라인 92)
   ```
   --cs-yellow-100: #fef3c7;
   ```

64. **HEX_6**: `#fde68a` (라인 93)
   ```
   --cs-yellow-200: #fde68a;
   ```

65. **HEX_6**: `#fcd34d` (라인 94)
   ```
   --cs-yellow-300: #fcd34d;
   ```

66. **HEX_6**: `#ffcc00` (라인 95)
   ```
   --cs-yellow-400: #ffcc00;
   ```

67. **HEX_6**: `#d97706` (라인 97)
   ```
   --cs-yellow-600: #d97706;
   ```

68. **HEX_6**: `#b45309` (라인 98)
   ```
   --cs-yellow-700: #b45309;
   ```

69. **HEX_6**: `#92400e` (라인 99)
   ```
   --cs-yellow-800: #92400e;
   ```

70. **HEX_6**: `#78350f` (라인 100)
   ```
   --cs-yellow-900: #78350f;
   ```

71. **HEX_6**: `#fff7ed` (라인 103)
   ```
   --cs-orange-50: #fff7ed;
   ```

72. **HEX_6**: `#ffedd5` (라인 104)
   ```
   --cs-orange-100: #ffedd5;
   ```

73. **HEX_6**: `#fed7aa` (라인 105)
   ```
   --cs-orange-200: #fed7aa;
   ```

74. **HEX_6**: `#fdba74` (라인 106)
   ```
   --cs-orange-300: #fdba74;
   ```

75. **HEX_6**: `#fb923c` (라인 107)
   ```
   --cs-orange-400: #fb923c;
   ```

76. **HEX_6**: `#ff6b35` (라인 108)
   ```
   --cs-orange-500: #ff6b35;
   ```

77. **HEX_6**: `#e55a2b` (라인 109)
   ```
   --cs-orange-600: #e55a2b;
   ```

78. **HEX_6**: `#c2410c` (라인 110)
   ```
   --cs-orange-700: #c2410c;
   ```

79. **HEX_6**: `#9a3412` (라인 111)
   ```
   --cs-orange-800: #9a3412;
   ```

80. **HEX_6**: `#7c2d12` (라인 112)
   ```
   --cs-orange-900: #7c2d12;
   ```

81. **HEX_6**: `#fdf8f6` (라인 115)
   ```
   --cs-brown-50: #fdf8f6;
   ```

82. **HEX_6**: `#f2e8e5` (라인 116)
   ```
   --cs-brown-100: #f2e8e5;
   ```

83. **HEX_6**: `#eaddd7` (라인 117)
   ```
   --cs-brown-200: #eaddd7;
   ```

84. **HEX_6**: `#e0cfc4` (라인 118)
   ```
   --cs-brown-300: #e0cfc4;
   ```

85. **HEX_6**: `#d2bab0` (라인 119)
   ```
   --cs-brown-400: #d2bab0;
   ```

86. **HEX_6**: `#bfa094` (라인 120)
   ```
   --cs-brown-500: #bfa094;
   ```

87. **HEX_6**: `#a18072` (라인 121)
   ```
   --cs-brown-600: #a18072;
   ```

88. **HEX_6**: `#8b6f47` (라인 122)
   ```
   --cs-brown-700: #8b6f47;
   ```

89. **HEX_6**: `#6f4f28` (라인 123)
   ```
   --cs-brown-800: #6f4f28;
   ```

90. **HEX_6**: `#2d1810` (라인 124)
   ```
   --cs-brown-900: #2d1810;
   ```

91. **HEX_6**: `#f0fdfa` (라인 127)
   ```
   --cs-teal-50: #f0fdfa;
   ```

92. **HEX_6**: `#ccfbf1` (라인 128)
   ```
   --cs-teal-100: #ccfbf1;
   ```

93. **HEX_6**: `#99f6e4` (라인 129)
   ```
   --cs-teal-200: #99f6e4;
   ```

94. **HEX_6**: `#5eead4` (라인 130)
   ```
   --cs-teal-300: #5eead4;
   ```

95. **HEX_6**: `#38f9d7` (라인 131)
   ```
   --cs-teal-400: #38f9d7;
   ```

96. **HEX_6**: `#14b8a6` (라인 132)
   ```
   --cs-teal-500: #14b8a6;
   ```

97. **HEX_6**: `#0d9488` (라인 133)
   ```
   --cs-teal-600: #0d9488;
   ```

98. **HEX_6**: `#0f766e` (라인 134)
   ```
   --cs-teal-700: #0f766e;
   ```

99. **HEX_6**: `#115e59` (라인 135)
   ```
   --cs-teal-800: #115e59;
   ```

100. **HEX_6**: `#134e4a` (라인 136)
   ```
   --cs-teal-900: #134e4a;
   ```

101. **HEX_6**: `#5a4fcf` (라인 139)
   ```
   --cs-brand-primary-hover: #5a4fcf;
   ```

102. **HEX_6**: `#fd79a8` (라인 140)
   ```
   --cs-brand-accent: #fd79a8;
   ```

103. **HEX_6**: `#dee2e6` (라인 146)
   ```
   --cs-border-secondary: #dee2e6;
   ```

104. **HEX_6**: `#f0f0f0` (라인 147)
   ```
   --cs-border-light: #f0f0f0;
   ```

105. **HEX_6**: `#2d3748` (라인 150)
   ```
   --cs-bg-dark: #2d3748;
   ```

106. **HEX_6**: `#FFFEF7` (라인 152)
   ```
   --cs-cream: #FFFEF7;
   ```

107. **HEX_6**: `#E3F2FD` (라인 155)
   ```
   --cs-blue-50: #E3F2FD;
   ```

108. **HEX_6**: `#dbeafe` (라인 156)
   ```
   --cs-blue-100: #dbeafe;
   ```

109. **HEX_6**: `#bfdbfe` (라인 157)
   ```
   --cs-blue-200: #bfdbfe;
   ```

110. **HEX_6**: `#93c5fd` (라인 158)
   ```
   --cs-blue-300: #93c5fd;
   ```

111. **HEX_6**: `#60a5fa` (라인 159)
   ```
   --cs-blue-400: #60a5fa;
   ```

112. **HEX_6**: `#2563eb` (라인 161)
   ```
   --cs-blue-600: #2563eb;
   ```

113. **HEX_6**: `#0056CC` (라인 162)
   ```
   --cs-blue-700: #0056CC;
   ```

114. **HEX_6**: `#004499` (라인 163)
   ```
   --cs-blue-800: #004499;
   ```

115. **HEX_6**: `#003366` (라인 164)
   ```
   --cs-blue-900: #003366;
   ```

116. **HEX_6**: `#f8fafc` (라인 167)
   ```
   --cs-slate-50: #f8fafc;
   ```

117. **HEX_6**: `#f1f5f9` (라인 168)
   ```
   --cs-slate-100: #f1f5f9;
   ```

118. **HEX_6**: `#e2e8f0` (라인 169)
   ```
   --cs-slate-200: #e2e8f0;
   ```

119. **HEX_6**: `#cbd5e1` (라인 170)
   ```
   --cs-slate-300: #cbd5e1;
   ```

120. **HEX_6**: `#94a3b8` (라인 171)
   ```
   --cs-slate-400: #94a3b8;
   ```

121. **HEX_6**: `#64748b` (라인 172)
   ```
   --cs-slate-500: #64748b;
   ```

122. **HEX_6**: `#475569` (라인 173)
   ```
   --cs-slate-600: #475569;
   ```

123. **HEX_6**: `#334155` (라인 174)
   ```
   --cs-slate-700: #334155;
   ```

124. **HEX_6**: `#1e293b` (라인 175)
   ```
   --cs-slate-800: #1e293b;
   ```

125. **HEX_6**: `#0f172a` (라인 176)
   ```
   --cs-slate-900: #0f172a;
   ```

126. **HEX_6**: `#faf5ff` (라인 179)
   ```
   --cs-purple-50: #faf5ff;
   ```

127. **HEX_6**: `#f3e8ff` (라인 180)
   ```
   --cs-purple-100: #f3e8ff;
   ```

128. **HEX_6**: `#e9d5ff` (라인 181)
   ```
   --cs-purple-200: #e9d5ff;
   ```

129. **HEX_6**: `#d8b4fe` (라인 182)
   ```
   --cs-purple-300: #d8b4fe;
   ```

130. **HEX_6**: `#c084fc` (라인 183)
   ```
   --cs-purple-400: #c084fc;
   ```

131. **HEX_6**: `#a855f7` (라인 184)
   ```
   --cs-purple-500: #a855f7;
   ```

132. **HEX_6**: `#9333ea` (라인 185)
   ```
   --cs-purple-600: #9333ea;
   ```

133. **HEX_6**: `#7c3aed` (라인 186)
   ```
   --cs-purple-700: #7c3aed;
   ```

134. **HEX_6**: `#6b21a8` (라인 187)
   ```
   --cs-purple-800: #6b21a8;
   ```

135. **HEX_6**: `#581c87` (라인 188)
   ```
   --cs-purple-900: #581c87;
   ```

136. **HEX_6**: `#0056b3` (라인 449)
   ```
   --color-primary-dark: #0056b3;
   ```

137. **HEX_6**: `#66b3ff` (라인 450)
   ```
   --color-primary-light: #66b3ff;
   ```

138. **HEX_6**: `#1d1d1f` (라인 455)
   ```
   --ios-text-primary: #1d1d1f;
   ```

139. **HEX_6**: `#1d1d1f` (라인 458)
   ```
   --ipad-text-primary: #1d1d1f;
   ```

140. **HEX_6**: `#764ba2` (라인 464)
   ```
   --mg-primary_dark: #764ba2;
   ```

141. **HEX_6**: `#2c3e50` (라인 465)
   ```
   --mg-text_primary: #2c3e50;
   ```

142. **HEX_6**: `#f2f2f7` (라인 470)
   ```
   --bg-secondary: #f2f2f7;
   ```

143. **HEX_6**: `#FAFAFA` (라인 472)
   ```
   --color-bg-secondary: #FAFAFA;
   ```

144. **HEX_6**: `#495057` (라인 474)
   ```
   --color-secondary-dark: #495057;
   ```

145. **HEX_6**: `#9ca3af` (라인 475)
   ```
   --color-secondary-light: #9ca3af;
   ```

146. **HEX_6**: `#6b7280` (라인 477)
   ```
   --color-text-secondary: #6b7280;
   ```

147. **HEX_6**: `#f2f2f7` (라인 478)
   ```
   --ios-bg-secondary: #f2f2f7;
   ```

148. **HEX_6**: `#86868b` (라인 479)
   ```
   --ios-text-secondary: #86868b;
   ```

149. **HEX_6**: `#f2f2f7` (라인 480)
   ```
   --ipad-bg-secondary: #f2f2f7;
   ```

150. **HEX_6**: `#86868b` (라인 482)
   ```
   --ipad-text-secondary: #86868b;
   ```

151. **HEX_6**: `#dee2e6` (라인 484)
   ```
   --mg-border_secondary: #dee2e6;
   ```

152. **HEX_6**: `#e9ecef` (라인 487)
   ```
   --mg-secondary_light: #e9ecef;
   ```

153. **HEX_6**: `#00a085` (라인 498)
   ```
   --mg-success_dark: #00a085;
   ```

154. **HEX_6**: `#d4edda` (라인 499)
   ```
   --mg-success_light: #d4edda;
   ```

155. **HEX_6**: `#d1fae5` (라인 503)
   ```
   --status-success-bg: #d1fae5;
   ```

156. **HEX_6**: `#c3e6cb` (라인 504)
   ```
   --status-success-border: #c3e6cb;
   ```

157. **HEX_6**: `#1e7e34` (라인 505)
   ```
   --status-success-dark: #1e7e34;
   ```

158. **HEX_6**: `#6cbb6d` (라인 506)
   ```
   --status-success-light: #6cbb6d;
   ```

159. **HEX_6**: `#ee5a24` (라인 517)
   ```
   --mg-danger_dark: #ee5a24;
   ```

160. **HEX_6**: `#f8d7da` (라인 518)
   ```
   --mg-danger_light: #f8d7da;
   ```

161. **HEX_6**: `#f8d7da` (라인 520)
   ```
   --mg-error_light: #f8d7da;
   ```

162. **HEX_6**: `#fee2e2` (라인 522)
   ```
   --status-error-bg: #fee2e2;
   ```

163. **HEX_6**: `#fecaca` (라인 523)
   ```
   --status-error-border: #fecaca;
   ```

164. **HEX_6**: `#c82333` (라인 524)
   ```
   --status-error-dark: #c82333;
   ```

165. **HEX_6**: `#f56565` (라인 525)
   ```
   --status-error-light: #f56565;
   ```

166. **HEX_6**: `#e65100` (라인 529)
   ```
   --color-orange: #e65100;
   ```

167. **HEX_6**: `#fff3e0` (라인 531)
   ```
   --color-orange-light: #fff3e0;
   ```

168. **HEX_6**: `#856404` (라인 533)
   ```
   --color-warning-dark: #856404;
   ```

169. **HEX_6**: `#ffcc00` (라인 536)
   ```
   --ios-yellow: #ffcc00;
   ```

170. **HEX_6**: `#ffcc00` (라인 538)
   ```
   --ipad-yellow: #ffcc00;
   ```

171. **HEX_6**: `#f5576c` (라인 541)
   ```
   --mg-warning_dark: #f5576c;
   ```

172. **HEX_6**: `#fff3cd` (라인 542)
   ```
   --mg-warning_light: #fff3cd;
   ```

173. **HEX_6**: `#fef3c7` (라인 544)
   ```
   --status-warning-bg: #fef3c7;
   ```

174. **HEX_6**: `#e0a800` (라인 545)
   ```
   --status-warning-dark: #e0a800;
   ```

175. **HEX_6**: `#ffeaa7` (라인 546)
   ```
   --status-warning-light: #ffeaa7;
   ```

176. **HEX_6**: `#0984e3` (라인 556)
   ```
   --mg-info_dark: #0984e3;
   ```

177. **HEX_6**: `#d1ecf1` (라인 557)
   ```
   --mg-info_light: #d1ecf1;
   ```

178. **HEX_6**: `#dbeafe` (라인 559)
   ```
   --status-info-bg: #dbeafe;
   ```

179. **HEX_6**: `#138496` (라인 560)
   ```
   --status-info-dark: #138496;
   ```

180. **HEX_6**: `#bbdefb` (라인 561)
   ```
   --status-info-light: #bbdefb;
   ```

181. **HEX_6**: `#9e9e9e` (라인 565)
   ```
   --color-gray: #9e9e9e;
   ```

182. **HEX_6**: `#7f8c8d` (라인 566)
   ```
   --color-gray-dark: #7f8c8d;
   ```

183. **HEX_6**: `#95a5a6` (라인 567)
   ```
   --color-gray-light: #95a5a6;
   ```

184. **HEX_6**: `#2F2F2F` (라인 568)
   ```
   --dark-gray: #2F2F2F;
   ```

185. **HEX_6**: `#D0D0E8` (라인 570)
   ```
   --gradient-gray-end: #D0D0E8;
   ```

186. **HEX_6**: `#B8B8D0` (라인 571)
   ```
   --gradient-gray-start: #B8B8D0;
   ```

187. **HEX_6**: `#8e8e93` (라인 572)
   ```
   --ios-gray: #8e8e93;
   ```

188. **HEX_6**: `#8e8e93` (라인 573)
   ```
   --ipad-gray: #8e8e93;
   ```

189. **HEX_6**: `#6B6B6B` (라인 574)
   ```
   --medium-gray: #6B6B6B;
   ```

190. **HEX_6**: `#495057` (라인 575)
   ```
   --mg-gray_dark: #495057;
   ```

191. **HEX_6**: `#c7c7cc` (라인 583)
   ```
   --ios-text-tertiary: #c7c7cc;
   ```

192. **HEX_6**: `#c7c7cc` (라인 584)
   ```
   --ipad-text-tertiary: #c7c7cc;
   ```

193. **HEX_6**: `#c7c7cc` (라인 590)
   ```
   --text-tertiary: #c7c7cc;
   ```

194. **HEX_6**: `#1d1d1f` (라인 593)
   ```
   --bg-dark: #1d1d1f;
   ```

195. **HEX_6**: `#343a40` (라인 599)
   ```
   --color-background-dark: #343a40;
   ```

196. **HEX_6**: `#2d3748` (라인 616)
   ```
   --mg-bg_dark: #2d3748;
   ```

197. **HEX_6**: `#a8a8a8` (라인 652)
   ```
   --color-border-dark: #a8a8a8;
   ```

198. **HEX_6**: `#e9ecef` (라인 655)
   ```
   --color-border-light: #e9ecef;
   ```

199. **HEX_6**: `#e9ecef` (라인 665)
   ```
   --mg-border: #e9ecef;
   ```

200. **HEX_6**: `#d1d5db` (라인 666)
   ```
   --mg-border_dark: #d1d5db;
   ```

201. **HEX_6**: `#f0f0f0` (라인 667)
   ```
   --mg-border_light: #f0f0f0;
   ```

202. **HEX_6**: `#e91e63` (라인 857)
   ```
   --color-accent: #e91e63;
   ```

203. **HEX_6**: `#795548` (라인 858)
   ```
   --color-brown: #795548;
   ```

204. **HEX_6**: `#6d3410` (라인 859)
   ```
   --color-brown-dark: #6d3410;
   ```

205. **HEX_6**: `#212529` (라인 860)
   ```
   --color-dark: #212529;
   ```

206. **HEX_6**: `#D32F2F` (라인 863)
   ```
   --color-performance-critical: #D32F2F;
   ```

207. **HEX_6**: `#8BC34A` (라인 865)
   ```
   --color-performance-good: #8BC34A;
   ```

208. **HEX_6**: `#c2185b` (라인 867)
   ```
   --color-pink: #c2185b;
   ```

209. **HEX_6**: `#fce4ec` (라인 868)
   ```
   --color-pink-light: #fce4ec;
   ```

210. **HEX_6**: `#7b1fa2` (라인 869)
   ```
   --color-purple: #7b1fa2;
   ```

211. **HEX_6**: `#f3e5f5` (라인 870)
   ```
   --color-purple-light: #f3e5f5;
   ```

212. **HEX_6**: `#9E9E9E` (라인 874)
   ```
   --color-status-inactive: #9E9E9E;
   ```

213. **HEX_6**: `#6366f1` (라인 878)
   ```
   --consultant-color-10: #6366f1;
   ```

214. **HEX_6**: `#06b6d4` (라인 883)
   ```
   --consultant-color-6: #06b6d4;
   ```

215. **HEX_6**: `#84cc16` (라인 884)
   ```
   --consultant-color-7: #84cc16;
   ```

216. **HEX_6**: `#f97316` (라인 885)
   ```
   --consultant-color-8: #f97316;
   ```

217. **HEX_6**: `#ec4899` (라인 886)
   ```
   --consultant-color-9: #ec4899;
   ```

218. **HEX_6**: `#ffd700` (라인 922)
   ```
   --grade-expert: #ffd700;
   ```

219. **HEX_6**: `#cd7f32` (라인 923)
   ```
   --grade-junior: #cd7f32;
   ```

220. **HEX_6**: `#e5e4e2` (라인 924)
   ```
   --grade-master: #e5e4e2;
   ```

221. **HEX_6**: `#c0c0c0` (라인 925)
   ```
   --grade-senior: #c0c0c0;
   ```

222. **HEX_6**: `#FFA500` (라인 927)
   ```
   --gradient-gold-end: #FFA500;
   ```

223. **HEX_6**: `#FFD700` (라인 928)
   ```
   --gradient-gold-start: #FFD700;
   ```

224. **HEX_6**: `#B4E7CE` (라인 930)
   ```
   --gradient-mint-end: #B4E7CE;
   ```

225. **HEX_6**: `#98D8C8` (라인 931)
   ```
   --gradient-mint-start: #98D8C8;
   ```

226. **HEX_6**: `#FFA5C0` (라인 933)
   ```
   --gradient-peach-end: #FFA5C0;
   ```

227. **HEX_6**: `#FF6B9D` (라인 934)
   ```
   --gradient-peach-start: #FF6B9D;
   ```

228. **HEX_6**: `#FFC0CB` (라인 936)
   ```
   --gradient-pink-end: #FFC0CB;
   ```

229. **HEX_6**: `#FFB6C1` (라인 937)
   ```
   --gradient-pink-start: #FFB6C1;
   ```

230. **HEX_6**: `#B0E0E6` (라인 939)
   ```
   --gradient-sky-end: #B0E0E6;
   ```

231. **HEX_6**: `#87CEEB` (라인 940)
   ```
   --gradient-sky-start: #87CEEB;
   ```

232. **HEX_6**: `#ff2d92` (라인 958)
   ```
   --ios-pink: #ff2d92;
   ```

233. **HEX_6**: `#ff2d92` (라인 961)
   ```
   --ipad-pink: #ff2d92;
   ```

234. **HEX_6**: `#FFFEF7` (라인 964)
   ```
   --light-cream: #FFFEF7;
   ```

235. **HEX_6**: `#2c3e50` (라인 973)
   ```
   --mg-black: #2c3e50;
   ```

236. **HEX_6**: `#fd79a8` (라인 975)
   ```
   --mg-brand_accent: #fd79a8;
   ```

237. **HEX_6**: `#00a085` (라인 978)
   ```
   --mg-client_dark: #00a085;
   ```

238. **HEX_6**: `#FEE500` (라인 979)
   ```
   --mg-color: #FEE500;
   ```

239. **HEX_6**: `#D32F2F` (라인 983)
   ```
   --mg-critical: #D32F2F;
   ```

240. **HEX_6**: `#343a40` (라인 984)
   ```
   --mg-dark: #343a40;
   ```

241. **HEX_6**: `#e74c3c` (라인 987)
   ```
   --mg-expense: #e74c3c;
   ```

242. **HEX_6**: `#c0392b` (라인 988)
   ```
   --mg-expense_dark: #c0392b;
   ```

243. **HEX_6**: `#8BC34A` (라인 993)
   ```
   --mg-good: #8BC34A;
   ```

244. **HEX_6**: `#9E9E9E` (라인 994)
   ```
   --mg-inactive: #9E9E9E;
   ```

245. **HEX_6**: `#9b59b6` (라인 1000)
   ```
   --mg-payment: #9b59b6;
   ```

246. **HEX_6**: `#8e44ad` (라인 1001)
   ```
   --mg-payment_dark: #8e44ad;
   ```

247. **HEX_6**: `#34495e` (라인 1005)
   ```
   --mg-report: #34495e;
   ```

248. **HEX_6**: `#2c3e50` (라인 1006)
   ```
   --mg-report_dark: #2c3e50;
   ```

249. **HEX_6**: `#27ae60` (라인 1007)
   ```
   --mg-revenue: #27ae60;
   ```

250. **HEX_6**: `#229954` (라인 1008)
   ```
   --mg-revenue_dark: #229954;
   ```

251. **HEX_6**: `#95a5a6` (라인 1010)
   ```
   --mg-settings: #95a5a6;
   ```

252. **HEX_6**: `#7f8c8d` (라인 1011)
   ```
   --mg-settings_dark: #7f8c8d;
   ```

253. **HEX_6**: `#fbbf24` (라인 1025)
   ```
   --payment-pending: #fbbf24;
   ```

254. **HEX_6**: `#6b7280` (라인 1026)
   ```
   --payment-refunded: #6b7280;
   ```

255. **HEX_6**: `#6b7280` (라인 1029)
   ```
   --role-client: #6b7280;
   ```

256. **HEX_6**: `#6b7280` (라인 1056)
   ```
   --status-completed: #6b7280;
   ```

257. **HEX_6**: `#f97316` (라인 1059)
   ```
   --status-no-show: #f97316;
   ```

258. **HEX_6**: `#fd7e14` (라인 1060)
   ```
   --status-pending: #fd7e14;
   ```

259. **HEX_6**: `#e55a00` (라인 1061)
   ```
   --status-pending-dark: #e55a00;
   ```

260. **HEX_6**: `#ffa94d` (라인 1062)
   ```
   --status-pending-light: #ffa94d;
   ```

261. **HEX_6**: `#fbbf24` (라인 1064)
   ```
   --status-requested: #fbbf24;
   ```

262. **HEX_6**: `#6b7280` (라인 1078)
   ```
   --user-inactive: #6b7280;
   ```

263. **HEX_6**: `#fbbf24` (라인 1079)
   ```
   --user-pending: #fbbf24;
   ```

264. **HEX_6**: `#ec4899` (라인 1082)
   ```
   --vacation-maternity: #ec4899;
   ```

265. **HEX_6**: `#6b7280` (라인 1083)
   ```
   --vacation-other: #6b7280;
   ```

266. **HEX_6**: `#06b6d4` (라인 1084)
   ```
   --vacation-paternity: #06b6d4;
   ```

267. **HEX_6**: `#764ba2` (라인 1100)
   ```
   --tenant-secondary: #764ba2;
   ```

268. **HEX_6**: `#6b46c1` (라인 1108)
   ```
   --tenant-secondary: #6b46c1;
   ```

269. **HEX_6**: `#059669` (라인 1114)
   ```
   --tenant-secondary: #059669;
   ```

270. **HEX_6**: `#d97706` (라인 1120)
   ```
   --tenant-secondary: #d97706;
   ```

271. **HEX_6**: `#66b3ff` (라인 1193)
   ```
   --color-primary-light: #66b3ff;
   ```

272. **HEX_6**: `#0056b3` (라인 1194)
   ```
   --color-primary-dark: #0056b3;
   ```

273. **HEX_6**: `#9ca3af` (라인 1199)
   ```
   --color-secondary-light: #9ca3af;
   ```

274. **HEX_6**: `#495057` (라인 1200)
   ```
   --color-secondary-dark: #495057;
   ```

275. **HEX_6**: `#6cbb6d` (라인 1205)
   ```
   --status-success-light: #6cbb6d;
   ```

276. **HEX_6**: `#1e7e34` (라인 1206)
   ```
   --status-success-dark: #1e7e34;
   ```

277. **HEX_6**: `#f56565` (라인 1210)
   ```
   --status-error-light: #f56565;
   ```

278. **HEX_6**: `#c82333` (라인 1211)
   ```
   --status-error-dark: #c82333;
   ```

279. **HEX_6**: `#ffeaa7` (라인 1215)
   ```
   --status-warning-light: #ffeaa7;
   ```

280. **HEX_6**: `#e0a800` (라인 1216)
   ```
   --status-warning-dark: #e0a800;
   ```

281. **HEX_6**: `#856404` (라인 1218)
   ```
   --color-warning-dark: #856404;
   ```

282. **HEX_6**: `#bbdefb` (라인 1221)
   ```
   --status-info-light: #bbdefb;
   ```

283. **HEX_6**: `#138496` (라인 1222)
   ```
   --status-info-dark: #138496;
   ```

284. **HEX_6**: `#fd7e14` (라인 1225)
   ```
   --status-pending: #fd7e14;
   ```

285. **HEX_6**: `#ffa94d` (라인 1226)
   ```
   --status-pending-light: #ffa94d;
   ```

286. **HEX_6**: `#e55a00` (라인 1227)
   ```
   --status-pending-dark: #e55a00;
   ```

287. **HEX_6**: `#d1fae5` (라인 1231)
   ```
   --status-success-bg: #d1fae5;
   ```

288. **HEX_6**: `#fee2e2` (라인 1232)
   ```
   --status-error-bg: #fee2e2;
   ```

289. **HEX_6**: `#fef3c7` (라인 1233)
   ```
   --status-warning-bg: #fef3c7;
   ```

290. **HEX_6**: `#dbeafe` (라인 1234)
   ```
   --status-info-bg: #dbeafe;
   ```

291. **HEX_6**: `#fecaca` (라인 1237)
   ```
   --status-error-border: #fecaca;
   ```

292. **HEX_6**: `#c3e6cb` (라인 1238)
   ```
   --status-success-border: #c3e6cb;
   ```

293. **HEX_6**: `#e91e63` (라인 1241)
   ```
   --color-accent: #e91e63;
   ```

294. **HEX_6**: `#795548` (라인 1242)
   ```
   --color-brown: #795548;
   ```

295. **HEX_6**: `#6d3410` (라인 1243)
   ```
   --color-brown-dark: #6d3410;
   ```

296. **HEX_6**: `#9e9e9e` (라인 1244)
   ```
   --color-gray: #9e9e9e;
   ```

297. **HEX_6**: `#95a5a6` (라인 1245)
   ```
   --color-gray-light: #95a5a6;
   ```

298. **HEX_6**: `#7f8c8d` (라인 1246)
   ```
   --color-gray-dark: #7f8c8d;
   ```

299. **HEX_6**: `#7b1fa2` (라인 1247)
   ```
   --color-purple: #7b1fa2;
   ```

300. **HEX_6**: `#f3e5f5` (라인 1248)
   ```
   --color-purple-light: #f3e5f5;
   ```

301. **HEX_6**: `#e65100` (라인 1249)
   ```
   --color-orange: #e65100;
   ```

302. **HEX_6**: `#fff3e0` (라인 1250)
   ```
   --color-orange-light: #fff3e0;
   ```

303. **HEX_6**: `#c2185b` (라인 1252)
   ```
   --color-pink: #c2185b;
   ```

304. **HEX_6**: `#fce4ec` (라인 1253)
   ```
   --color-pink-light: #fce4ec;
   ```

305. **HEX_6**: `#a8a8a8` (라인 1254)
   ```
   --color-border-dark: #a8a8a8;
   ```

306. **HEX_6**: `#212529` (라인 1258)
   ```
   --color-dark: #212529;
   ```

307. **HEX_6**: `#2F2F2F` (라인 1261)
   ```
   --dark-gray: #2F2F2F;
   ```

308. **HEX_6**: `#6B6B6B` (라인 1262)
   ```
   --medium-gray: #6B6B6B;
   ```

309. **HEX_6**: `#FFFEF7` (라인 1263)
   ```
   --light-cream: #FFFEF7;
   ```

310. **HEX_6**: `#6b7280` (라인 1427)
   ```
   --status-completed: #6b7280;
   ```

311. **HEX_6**: `#FAFAFA` (라인 1443)
   ```
   --color-bg-secondary: #FAFAFA;
   ```

312. **HEX_6**: `#e9ecef` (라인 1447)
   ```
   --color-border-light: #e9ecef;
   ```

313. **HEX_6**: `#2F2F2F` (라인 1469)
   ```
   --dark-gray: #2F2F2F;
   ```

314. **HEX_6**: `#6B6B6B` (라인 1470)
   ```
   --medium-gray: #6B6B6B;
   ```

315. **HEX_6**: `#FFFEF7` (라인 1471)
   ```
   --light-cream: #FFFEF7;
   ```

316. **HEX_6**: `#FFF5EE` (라인 1527)
   ```
   #FFF5EE 0%,      /* 연한 베이지 */
   ```

317. **HEX_6**: `#FFE4E1` (라인 1528)
   ```
   #FFE4E1 30%,     /* 연분홍 */
   ```

318. **HEX_6**: `#FFFACD` (라인 1529)
   ```
   #FFFACD 60%,     /* 레몬 시폰 (연노랑) */
   ```

319. **HEX_6**: `#FFE4E1` (라인 1530)
   ```
   #FFE4E1 100%     /* 연분홍 */
   ```

320. **HEX_6**: `#6b7280` (라인 5183)
   ```
   --color-text-secondary: #6b7280; /* 회색 - 비활성 */
   ```

321. **HEX_6**: `#764ba2` (라인 7456)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

322. **HEX_6**: `#f5576c` (라인 7461)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

323. **HEX_6**: `#4facfe` (라인 7466)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

324. **HEX_6**: `#00f2fe` (라인 7466)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

325. **HEX_6**: `#fa709a` (라인 7471)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

326. **HEX_6**: `#fee140` (라인 7471)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

327. **HEX_6**: `#a8edea` (라인 7476)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

328. **HEX_6**: `#fed6e3` (라인 7476)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

329. **HEX_6**: `#ffecd2` (라인 7481)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

330. **HEX_6**: `#fcb69f` (라인 7481)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

331. **HEX_6**: `#764ba2` (라인 7486)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

332. **HEX_6**: `#4facfe` (라인 7491)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

333. **HEX_6**: `#00f2fe` (라인 7491)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

334. **HEX_6**: `#fa709a` (라인 7496)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

335. **HEX_6**: `#fee140` (라인 7496)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

336. **HEX_6**: `#764ba2` (라인 7501)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

337. **HEX_6**: `#ffecd2` (라인 7506)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

338. **HEX_6**: `#fcb69f` (라인 7506)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

339. **HEX_6**: `#a8edea` (라인 7511)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

340. **HEX_6**: `#fed6e3` (라인 7511)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

341. **HEX_6**: `#764ba2` (라인 9598)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

342. **HEX_6**: `#3f51b5` (라인 9650)
   ```
   background: linear-gradient(135deg, #3f51b5 0%, #1e3a8a 100%);
   ```

343. **HEX_6**: `#1e3a8a` (라인 9650)
   ```
   background: linear-gradient(135deg, #3f51b5 0%, #1e3a8a 100%);
   ```

344. **HEX_6**: `#a8e6a3` (라인 10686)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

345. **HEX_6**: `#7dd87a` (라인 10686)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

346. **HEX_6**: `#a8e6a3` (라인 10923)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

347. **HEX_6**: `#7dd87a` (라인 10923)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

348. **HEX_6**: `#c82333` (라인 11242)
   ```
   background-color: var(--mg-error-600, #c82333);
   ```

349. **HEX_6**: `#e5e7eb` (라인 11289)
   ```
   border-bottom: 1px solid var(--cs-gray-200, #e5e7eb);
   ```

350. **HEX_6**: `#111827` (라인 11296)
   ```
   color: var(--cs-gray-900, #111827);
   ```

351. **HEX_6**: `#6b7280` (라인 11304)
   ```
   color: var(--cs-gray-500, #6b7280);
   ```

352. **HEX_6**: `#f3f4f6` (라인 11313)
   ```
   background-color: var(--cs-gray-100, #f3f4f6);
   ```

353. **HEX_6**: `#374151` (라인 11314)
   ```
   color: var(--cs-gray-700, #374151);
   ```

354. **HEX_6**: `#e5e7eb` (라인 11323)
   ```
   border-top: 1px solid var(--cs-gray-200, #e5e7eb);
   ```

355. **HEX_6**: `#495057` (라인 11409)
   ```
   color: #495057;
   ```

356. **HEX_6**: `#495057` (라인 11442)
   ```
   color: #495057;
   ```

357. **HEX_6**: `#495057` (라인 11562)
   ```
   color: #495057;
   ```

358. **HEX_6**: `#e1e5e9` (라인 11855)
   ```
   border: 2px solid #e1e5e9;
   ```

359. **HEX_6**: `#495057` (라인 11859)
   ```
   color: #495057;
   ```

360. **HEX_6**: `#e9ecef` (라인 11950)
   ```
   border: 2px solid #e9ecef;
   ```

361. **HEX_6**: `#e9ecef` (라인 11963)
   ```
   border: 1px solid #e9ecef;
   ```

362. **HEX_6**: `#e9ecef` (라인 11987)
   ```
   background: #e9ecef;
   ```

363. **HEX_6**: `#e9ecef` (라인 12072)
   ```
   border: 1px solid #e9ecef;
   ```

364. **HEX_6**: `#495057` (라인 12093)
   ```
   color: #495057;
   ```

365. **HEX_6**: `#e5e7eb` (라인 12104)
   ```
   border: 1px solid #e5e7eb;
   ```

366. **HEX_6**: `#a8e6a3` (라인 12127)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

367. **HEX_6**: `#7dd87a` (라인 12127)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

368. **HEX_6**: `#1f2937` (라인 12145)
   ```
   color: #1f2937;
   ```

369. **HEX_6**: `#6B6B6B` (라인 12150)
   ```
   color: #6B6B6B;
   ```

370. **HEX_6**: `#f3f4f6` (라인 12172)
   ```
   border-top: 1px solid #f3f4f6;
   ```

371. **HEX_6**: `#6B6B6B` (라인 12174)
   ```
   color: #6B6B6B;
   ```

372. **HEX_6**: `#a8e6a3` (라인 12298)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

373. **HEX_6**: `#7dd87a` (라인 12298)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

374. **HEX_6**: `#a8e6a3` (라인 12671)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

375. **HEX_6**: `#7dd87a` (라인 12671)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

376. **HEX_6**: `#a8e6a3` (라인 12905)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

377. **HEX_6**: `#7dd87a` (라인 12905)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

378. **HEX_6**: `#a8e6a3` (라인 13026)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

379. **HEX_6**: `#7dd87a` (라인 13026)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

380. **HEX_6**: `#6b7280` (라인 13950)
   ```
   color: var(--color-text-secondary, #6b7280);
   ```

381. **HEX_6**: `#1f2937` (라인 13964)
   ```
   color: var(--color-text-primary, #1f2937);
   ```

382. **HEX_6**: `#a8e6a3` (라인 14267)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

383. **HEX_6**: `#7dd87a` (라인 14267)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

384. **HEX_6**: `#764ba2` (라인 15485)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

385. **HEX_6**: `#0056b3` (라인 15811)
   ```
   background-color: #0056b3;
   ```

386. **HEX_6**: `#0056b3` (라인 15812)
   ```
   border-color: #0056b3;
   ```

387. **HEX_6**: `#FFE5E5` (라인 16236)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

388. **HEX_6**: `#FFF8E1` (라인 16236)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

389. **HEX_6**: `#FFE5E5` (라인 16270)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

390. **HEX_6**: `#FFF8E1` (라인 16270)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

391. **HEX_6**: `#FFB6C1` (라인 16337)
   ```
   background: #FFB6C1;
   ```

392. **HEX_6**: `#98E4D8` (라인 16341)
   ```
   background: #98E4D8;
   ```

393. **HEX_6**: `#A8D8EA` (라인 16345)
   ```
   background: #A8D8EA;
   ```

394. **HEX_6**: `#FFE5B4` (라인 16349)
   ```
   background: #FFE5B4;
   ```

395. **HEX_6**: `#FF69B4` (라인 16382)
   ```
   color: #FF69B4;
   ```

396. **HEX_6**: `#fbbf24` (라인 16760)
   ```
   .mg-v2-radio-color[data-color="#fbbf24"] {
   ```

397. **HEX_6**: `#fbbf24` (라인 16761)
   ```
   background-color: #fbbf24;
   ```

398. **HEX_6**: `#e9ecef` (라인 16859)
   ```
   border: 1px solid #e9ecef;
   ```

399. **HEX_6**: `#e9ecef` (라인 16885)
   ```
   border: 1px solid #e9ecef;
   ```

400. **HEX_6**: `#e9ecef` (라인 16897)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

401. **HEX_6**: `#e9ecef` (라인 16898)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

402. **HEX_6**: `#2c3e50` (라인 16927)
   ```
   color: #2c3e50;
   ```

403. **HEX_6**: `#e9ecef` (라인 16953)
   ```
   border: 1px solid #e9ecef;
   ```

404. **HEX_6**: `#2c3e50` (라인 16960)
   ```
   color: #2c3e50;
   ```

405. **HEX_6**: `#e9ecef` (라인 16988)
   ```
   border-top: 1px solid #e9ecef;
   ```

406. **HEX_6**: `#3498db` (라인 17004)
   ```
   border: 1px solid #3498db;
   ```

407. **HEX_6**: `#3498db` (라인 17006)
   ```
   color: #3498db;
   ```

408. **HEX_6**: `#3498db` (라인 17011)
   ```
   background: #3498db;
   ```

409. **HEX_6**: `#3498db` (라인 17024)
   ```
   border: 1px solid #3498db;
   ```

410. **HEX_6**: `#3498db` (라인 17026)
   ```
   color: #3498db;
   ```

411. **HEX_6**: `#3498db` (라인 17032)
   ```
   background: #3498db;
   ```

412. **HEX_6**: `#3498db` (라인 17038)
   ```
   color: #3498db;
   ```

413. **HEX_6**: `#495057` (라인 17052)
   ```
   color: #495057;
   ```

414. **HEX_6**: `#495057` (라인 17083)
   ```
   color: #495057;
   ```

415. **HEX_6**: `#e9ecef` (라인 17085)
   ```
   background-color: #e9ecef;
   ```

416. **HEX_6**: `#495057` (라인 17113)
   ```
   color: #495057;
   ```

417. **HEX_6**: `#e9ecef` (라인 17149)
   ```
   border: 1px solid #e9ecef;
   ```

418. **HEX_6**: `#495057` (라인 17154)
   ```
   color: #495057;
   ```

419. **HEX_6**: `#e9ecef` (라인 17170)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

420. **HEX_6**: `#495057` (라인 17172)
   ```
   color: #495057;
   ```

421. **HEX_6**: `#495057` (라인 17186)
   ```
   color: #495057;
   ```

422. **HEX_6**: `#495057` (라인 17191)
   ```
   color: #495057;
   ```

423. **HEX_6**: `#e5e7eb` (라인 17208)
   ```
   border: 1px solid #e5e7eb;
   ```

424. **HEX_6**: `#0056b3` (라인 17224)
   ```
   color: #0056b3;
   ```

425. **HEX_6**: `#2c3e50` (라인 17279)
   ```
   color: #2c3e50;
   ```

426. **HEX_6**: `#e2e8f0` (라인 17362)
   ```
   border: 2px solid #e2e8f0;
   ```

427. **HEX_6**: `#f7fafc` (라인 17376)
   ```
   background-color: #f7fafc;
   ```

428. **HEX_6**: `#718096` (라인 17386)
   ```
   color: #718096;
   ```

429. **HEX_6**: `#f7fafc` (라인 17392)
   ```
   background-color: #f7fafc;
   ```

430. **HEX_6**: `#e2e8f0` (라인 17396)
   ```
   border: 1px solid #e2e8f0;
   ```

431. **HEX_6**: `#4a5568` (라인 17401)
   ```
   color: #4a5568;
   ```

432. **HEX_6**: `#764ba2` (라인 17412)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

433. **HEX_6**: `#cbd5e0` (라인 17426)
   ```
   background: #cbd5e0;
   ```

434. **HEX_6**: `#48bb78` (라인 17433)
   ```
   background-color: #48bb78;
   ```

435. **HEX_6**: `#2d3748` (라인 17473)
   ```
   color: #2d3748;
   ```

436. **HEX_6**: `#2d3748` (라인 17480)
   ```
   color: #2d3748;
   ```

437. **HEX_6**: `#718096` (라인 17486)
   ```
   color: #718096;
   ```

438. **HEX_6**: `#764ba2` (라인 17498)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

439. **HEX_6**: `#e1e5e9` (라인 17514)
   ```
   border: 2px solid #e1e5e9;
   ```

440. **HEX_6**: `#5a6268` (라인 17540)
   ```
   background-color: #5a6268;
   ```

441. **HEX_6**: `#2c3e50` (라인 17558)
   ```
   color: #2c3e50;
   ```

442. **HEX_6**: `#0056b3` (라인 17581)
   ```
   background-color: #0056b3;
   ```

443. **HEX_6**: `#e8f4fd` (라인 17632)
   ```
   background: #e8f4fd;
   ```

444. **HEX_6**: `#bee5eb` (라인 17633)
   ```
   border: 1px solid #bee5eb;
   ```

445. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 141)
   ```
   --cs-brand-primary-light: rgba(108, 92, 231, 0.1);
   ```

446. **RGBA**: `rgba(108, 92, 231, 0.2)` (라인 142)
   ```
   --cs-brand-primary-hover-bg: rgba(108, 92, 231, 0.2);
   ```

447. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 143)
   ```
   --cs-brand-outline: rgba(108, 92, 231, 0.1);
   ```

448. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 151)
   ```
   --cs-bg-hover: rgba(0, 0, 0, 0.05);
   ```

449. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 196)
   ```
   --cs-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

450. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 200)
   ```
   --cs-shadow-dark: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
   ```

451. **RGBA**: `rgba(59, 130, 246, 0.12)` (라인 201)
   ```
   --cs-shadow-primary: 0 8px 20px rgba(59, 130, 246, 0.12);
   ```

452. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 202)
   ```
   --cs-shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

453. **RGBA**: `rgba(255, 107, 53, 0.12)` (라인 203)
   ```
   --cs-shadow-orange: 0 2px 8px rgba(255, 107, 53, 0.12);
   ```

454. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 204)
   ```
   --cs-shadow-error: 0 4px 15px rgba(220, 53, 69, 0.4);
   ```

455. **RGBA**: `rgba(220, 53, 69, 0.6)` (라인 205)
   ```
   --cs-shadow-error-strong: 0 6px 20px rgba(220, 53, 69, 0.6);
   ```

456. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 206)
   ```
   --cs-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

457. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 207)
   ```
   --cs-shadow-sm-multi: 0 1px 3px var(--mg-shadow-light), 0 1px 2px rgba(0, 0, 0, 0.06);
   ```

458. **RGBA**: `rgba(0, 0, 0, 0.07)` (라인 208)
   ```
   --cs-shadow-md-multi: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

459. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 208)
   ```
   --cs-shadow-md-multi: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

460. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 209)
   ```
   --cs-shadow-lg-multi: 0 10px 15px var(--mg-shadow-light), 0 4px 6px rgba(0, 0, 0, 0.05);
   ```

461. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 210)
   ```
   --cs-shadow-xl-multi: 0 20px 25px var(--mg-shadow-light), 0 10px 10px rgba(0, 0, 0, 0.04);
   ```

462. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 211)
   ```
   --cs-shadow-xxl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

463. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 212)
   ```
   --cs-shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

464. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 213)
   ```
   --cs-shadow-outline: 0 0 0 3px rgba(108, 92, 231, 0.1);
   ```

465. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 216)
   ```
   --cs-glass-light: rgba(255, 255, 255, 0.8);
   ```

466. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 217)
   ```
   --cs-glass-strong: rgba(255, 255, 255, 0.95);
   ```

467. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 219)
   ```
   --cs-glass-medium: rgba(255, 255, 255, 0.6);
   ```

468. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 220)
   ```
   --cs-glass-light-subtle: rgba(255, 255, 255, 0.1);
   ```

469. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 221)
   ```
   --cs-glass-dark-subtle: rgba(0, 0, 0, 0.04);
   ```

470. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 222)
   ```
   --cs-glass-blue-light: rgba(0, 122, 255, 0.1);
   ```

471. **RGBA**: `rgba(255, 107, 53, 0.1)` (라인 223)
   ```
   --cs-glass-orange-light: rgba(255, 107, 53, 0.1);
   ```

472. **RGBA**: `rgba(255, 248, 245, 0.95)` (라인 224)
   ```
   --cs-glass-orange-bg: rgba(255, 248, 245, 0.95);
   ```

473. **RGBA**: `rgba(255, 107, 53, 0.08)` (라인 225)
   ```
   --cs-glass-orange-border: rgba(255, 107, 53, 0.08);
   ```

474. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 226)
   ```
   --cs-glass-gray-light: rgba(107, 114, 128, 0.1);
   ```

475. **RGBA**: `rgba(226, 232, 240, 0.5)` (라인 227)
   ```
   --cs-glass-slate-border: rgba(226, 232, 240, 0.5);
   ```

476. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 228)
   ```
   --cs-glass-dark-strong: rgba(0, 0, 0, 0.3);
   ```

477. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 229)
   ```
   --cs-glass-light-strong: rgba(250, 250, 250, 0.98);
   ```

478. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 230)
   ```
   --cs-glass-gray-border: rgba(209, 209, 214, 0.8);
   ```

479. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 231)
   ```
   --cs-glass-white-90: rgba(255, 255, 255, 0.9);
   ```

480. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 232)
   ```
   --cs-glass-white-80: rgba(255, 255, 255, 0.8);
   ```

481. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 233)
   ```
   --cs-glass-primary-40: rgba(102, 126, 234, 0.4);
   ```

482. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 234)
   ```
   --cs-glass-primary-30: rgba(102, 126, 234, 0.3);
   ```

483. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 235)
   ```
   --cs-glass-primary-20: rgba(102, 126, 234, 0.2);
   ```

484. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 236)
   ```
   --cs-glass-primary-10: rgba(102, 126, 234, 0.1);
   ```

485. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 237)
   ```
   --cs-glass-slate-border-60: rgba(226, 232, 240, 0.6);
   ```

486. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 238)
   ```
   --cs-glass-dark-60: rgba(0, 0, 0, 0.6);
   ```

487. **RGBA**: `rgba(0, 0, 0, 0.1)` (라인 384)
   ```
   --mg-shadow-light: rgba(0, 0, 0, 0.1);
   ```

488. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 409)
   ```
   --tenant-primary-light: rgba(59, 130, 246, 0.2);
   ```

489. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 466)
   ```
   --shadow-hover-primary: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

490. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 481)
   ```
   --ipad-btn-secondary: rgba(142, 142, 147, 0.12);
   ```

491. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 493)
   ```
   --color-success-light: rgba(16, 185, 129, 0.1);
   ```

492. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 511)
   ```
   --color-danger-light: rgba(239, 68, 68, 0.1);
   ```

493. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 534)
   ```
   --color-warning-light: rgba(245, 158, 11, 0.1);
   ```

494. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 551)
   ```
   --color-info-light: rgba(59, 130, 246, 0.1);
   ```

495. **RGBA**: `rgba(230, 245, 255, 0.5)` (라인 594)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

496. **RGBA**: `rgba(240, 250, 255, 0.5)` (라인 594)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

497. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 595)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

498. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 595)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

499. **RGBA**: `rgba(255, 250, 240, 0.5)` (라인 596)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

500. **RGBA**: `rgba(255, 255, 250, 0.5)` (라인 596)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

501. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 597)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

502. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 597)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

503. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 602)
   ```
   --droplet-bg: rgba(255, 255, 255, 0.7);
   ```

504. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 603)
   ```
   --droplet-bg-dark: rgba(0, 0, 0, 0.4);
   ```

505. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 605)
   ```
   --glass-bg: rgba(255, 255, 255, 0.2);
   ```

506. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 606)
   ```
   --glass-bg-light: rgba(0, 0, 0, 0.25);
   ```

507. **RGBA**: `rgba(0, 0, 0, 0.35)` (라인 607)
   ```
   --glass-bg-medium: rgba(0, 0, 0, 0.35);
   ```

508. **RGBA**: `rgba(0, 0, 0, 0.45)` (라인 608)
   ```
   --glass-bg-strong: rgba(0, 0, 0, 0.45);
   ```

509. **RGBA**: `rgba(255, 215, 0, 0.1)` (라인 609)
   ```
   --grade-expert-bg: rgba(255, 215, 0, 0.1);
   ```

510. **RGBA**: `rgba(205, 127, 50, 0.1)` (라인 610)
   ```
   --grade-junior-bg: rgba(205, 127, 50, 0.1);
   ```

511. **RGBA**: `rgba(229, 228, 226, 0.1)` (라인 611)
   ```
   --grade-master-bg: rgba(229, 228, 226, 0.1);
   ```

512. **RGBA**: `rgba(192, 192, 192, 0.1)` (라인 612)
   ```
   --grade-senior-bg: rgba(192, 192, 192, 0.1);
   ```

513. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 615)
   ```
   --ipad-card-bg: rgba(255, 255, 255, 0.9);
   ```

514. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 618)
   ```
   --role-admin-bg: rgba(59, 130, 246, 0.1);
   ```

515. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 619)
   ```
   --role-client-bg: rgba(107, 114, 128, 0.1);
   ```

516. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 620)
   ```
   --role-consultant-bg: rgba(139, 92, 246, 0.1);
   ```

517. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 621)
   ```
   --status-assigned-bg: rgba(139, 92, 246, 0.1);
   ```

518. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 622)
   ```
   --status-cancelled-bg: rgba(239, 68, 68, 0.1);
   ```

519. **RGBA**: `rgba(5, 150, 105, 0.1)` (라인 623)
   ```
   --status-completed-bg: rgba(5, 150, 105, 0.1);
   ```

520. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 624)
   ```
   --status-confirmed-bg: rgba(59, 130, 246, 0.1);
   ```

521. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 625)
   ```
   --status-in-progress-bg: rgba(16, 185, 129, 0.1);
   ```

522. **RGBA**: `rgba(251, 191, 36, 0.1)` (라인 626)
   ```
   --status-requested-bg: rgba(251, 191, 36, 0.1);
   ```

523. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 627)
   ```
   --vacation-annual-bg: rgba(59, 130, 246, 0.1);
   ```

524. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 628)
   ```
   --vacation-personal-bg: rgba(139, 92, 246, 0.1);
   ```

525. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 629)
   ```
   --vacation-sick-bg: rgba(239, 68, 68, 0.1);
   ```

526. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 632)
   ```
   --border-pink-light: rgba(255, 182, 193, 0.2);
   ```

527. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 633)
   ```
   --border-pink-medium: rgba(255, 182, 193, 0.4);
   ```

528. **RGBA**: `rgba(135, 206, 235, 0.2)` (라인 644)
   ```
   --border-sky-light: rgba(135, 206, 235, 0.2);
   ```

529. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 656)
   ```
   --droplet-border: rgba(255, 255, 255, 0.3);
   ```

530. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 657)
   ```
   --glass-border: rgba(255, 255, 255, 0.2);
   ```

531. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 658)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.2);
   ```

532. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 664)
   ```
   --ipad-card-border: rgba(0, 0, 0, 0.05);
   ```

533. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 676)
   ```
   --ipad-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

534. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 677)
   ```
   --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

535. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 680)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

536. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 681)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(31, 38, 135, 0.5);
   ```

537. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 682)
   ```
   --shadow-gold: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

538. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 683)
   ```
   --shadow-gold-sm: 0 2px 8px rgba(255, 215, 0, 0.3);
   ```

539. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 687)
   ```
   --shadow-mint-sm: 0 2px 8px rgba(152, 216, 200, 0.3);
   ```

540. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 689)
   ```
   --shadow-peach: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

541. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 690)
   ```
   --shadow-pink-sm: 0 2px 8px rgba(255, 182, 193, 0.3);
   ```

542. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 691)
   ```
   --shadow-sky: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

543. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 692)
   ```
   --shadow-sky-sm: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

544. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 694)
   ```
   --shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

545. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 695)
   ```
   --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

546. **RGBA**: `rgba(147, 197, 253, 0.15)` (라인 903)
   ```
   --droplet-pattern-1: radial-gradient(ellipse at 23% 47%, rgba(147, 197, 253, 0.15), transparent 65%);
   ```

547. **RGBA**: `rgba(251, 191, 36, 0.12)` (라인 904)
   ```
   --droplet-pattern-2: radial-gradient(ellipse at 78% 23%, rgba(251, 191, 36, 0.12), transparent 58%);
   ```

548. **RGBA**: `rgba(239, 68, 68, 0.18)` (라인 905)
   ```
   --droplet-pattern-3: radial-gradient(ellipse at 42% 81%, rgba(239, 68, 68, 0.18), transparent 62%);
   ```

549. **RGBA**: `rgba(139, 92, 246, 0.14)` (라인 906)
   ```
   --droplet-pattern-4: radial-gradient(ellipse at 61% 38%, rgba(139, 92, 246, 0.14), transparent 60%);
   ```

550. **RGBA**: `rgba(34, 197, 94, 0.12)` (라인 907)
   ```
   --droplet-pattern-5: radial-gradient(ellipse at 35% 15%, rgba(34, 197, 94, 0.12), transparent 55%);
   ```

551. **RGBA**: `rgba(236, 72, 153, 0.16)` (라인 908)
   ```
   --droplet-pattern-6: radial-gradient(ellipse at 15% 65%, rgba(236, 72, 153, 0.16), transparent 68%);
   ```

552. **RGBA**: `rgba(99, 102, 241, 0.13)` (라인 909)
   ```
   --droplet-pattern-7: radial-gradient(ellipse at 85% 72%, rgba(99, 102, 241, 0.13), transparent 64%);
   ```

553. **RGBA**: `rgba(99, 102, 241, 0.08)` (라인 910)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

554. **RGBA**: `rgba(236, 72, 153, 0.12)` (라인 910)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

555. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 1266)
   ```
   --glass-bg: rgba(255, 255, 255, 0.2);
   ```

556. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 1267)
   ```
   --glass-border: rgba(255, 255, 255, 0.2);
   ```

557. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 1275)
   ```
   --droplet-bg: rgba(255, 255, 255, 0.7);
   ```

558. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 1276)
   ```
   --droplet-bg-dark: rgba(0, 0, 0, 0.4);
   ```

559. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 1277)
   ```
   --droplet-border: rgba(255, 255, 255, 0.3);
   ```

560. **RGBA**: `rgba(147, 197, 253, 0.15)` (라인 1283)
   ```
   --droplet-pattern-1: radial-gradient(ellipse at 23% 47%, rgba(147, 197, 253, 0.15), transparent 65%);
   ```

561. **RGBA**: `rgba(251, 191, 36, 0.12)` (라인 1284)
   ```
   --droplet-pattern-2: radial-gradient(ellipse at 78% 23%, rgba(251, 191, 36, 0.12), transparent 58%);
   ```

562. **RGBA**: `rgba(239, 68, 68, 0.18)` (라인 1285)
   ```
   --droplet-pattern-3: radial-gradient(ellipse at 42% 81%, rgba(239, 68, 68, 0.18), transparent 62%);
   ```

563. **RGBA**: `rgba(139, 92, 246, 0.14)` (라인 1286)
   ```
   --droplet-pattern-4: radial-gradient(ellipse at 61% 38%, rgba(139, 92, 246, 0.14), transparent 60%);
   ```

564. **RGBA**: `rgba(34, 197, 94, 0.12)` (라인 1287)
   ```
   --droplet-pattern-5: radial-gradient(ellipse at 35% 15%, rgba(34, 197, 94, 0.12), transparent 55%);
   ```

565. **RGBA**: `rgba(236, 72, 153, 0.16)` (라인 1288)
   ```
   --droplet-pattern-6: radial-gradient(ellipse at 15% 65%, rgba(236, 72, 153, 0.16), transparent 68%);
   ```

566. **RGBA**: `rgba(99, 102, 241, 0.13)` (라인 1289)
   ```
   --droplet-pattern-7: radial-gradient(ellipse at 85% 72%, rgba(99, 102, 241, 0.13), transparent 64%);
   ```

567. **RGBA**: `rgba(99, 102, 241, 0.08)` (라인 1290)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

568. **RGBA**: `rgba(236, 72, 153, 0.12)` (라인 1290)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

569. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 1483)
   ```
   --shadow-hover-primary: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

570. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 1495)
   ```
   --shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

571. **RGBA**: `rgba(255, 192, 203, 0.15)` (라인 1541)
   ```
   rgba(255, 192, 203, 0.15),  /* 연분홍 - 더 연하게 */
   ```

572. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 1542)
   ```
   rgba(255, 223, 186, 0.12), /* 복숭아 - 더 연하게 */
   ```

573. **RGBA**: `rgba(255, 192, 203, 0.15)` (라인 1543)
   ```
   rgba(255, 192, 203, 0.15)   /* 연분홍 - 더 연하게 */
   ```

574. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 1566)
   ```
   rgba(255, 223, 186, 0.12), /* 복숭아 - 더 연하게 */
   ```

575. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 1567)
   ```
   rgba(255, 239, 213, 0.1),  /* 연한 복숭아 - 더 연하게 */
   ```

576. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 1568)
   ```
   rgba(255, 223, 186, 0.12)  /* 복숭아 - 더 연하게 */
   ```

577. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 1579)
   ```
   rgba(255, 239, 213, 0.1),  /* 연한 복숭아 - 더 연하게 */
   ```

578. **RGBA**: `rgba(255, 250, 205, 0.08)` (라인 1580)
   ```
   rgba(255, 250, 205, 0.08), /* 연노랑 - 더 연하게 */
   ```

579. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 1581)
   ```
   rgba(255, 239, 213, 0.1)   /* 연한 복숭아 - 더 연하게 */
   ```

580. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 1606)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

581. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 1608)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

582. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 1655)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

583. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 1824)
   ```
   background: rgba(128, 128, 0, 0.1);
   ```

584. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 1873)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

585. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 1875)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

586. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 1880)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

587. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 1957)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

588. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 1981)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

589. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 2000)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

590. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 2029)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

591. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 2031)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

592. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2037)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

593. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 2056)
   ```
   rgba(255, 255, 255, 0.1) 0%,
   ```

594. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 2057)
   ```
   rgba(255, 255, 255, 0.05) 100%);
   ```

595. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 2064)
   ```
   border-color: rgba(255, 255, 255, 0.4);
   ```

596. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 2067)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

597. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 2074)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

598. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2076)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

599. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2095)
   ```
   rgba(255, 255, 255, 0.3) 0%,
   ```

600. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 2096)
   ```
   rgba(255, 255, 255, 0.1) 100%);
   ```

601. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2102)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

602. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2103)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

603. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 2164)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

604. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2166)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

605. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 2202)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

606. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2204)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

607. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 2218)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

608. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 2682)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

609. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2690)
   ```
   border-color: rgba(255, 255, 255, 0.3);
   ```

610. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4178)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

611. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 4180)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

612. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 4190)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

613. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4192)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

614. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4423)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

615. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 4449)
   ```
   background: rgba(152, 251, 152, 0.1);
   ```

616. **RGBA**: `rgba(152, 251, 152, 0.3)` (라인 4450)
   ```
   box-shadow: 0 8px 25px rgba(152, 251, 152, 0.3);
   ```

617. **RGBA**: `rgba(239, 68, 68, 0.05)` (라인 4456)
   ```
   background: rgba(239, 68, 68, 0.05);
   ```

618. **RGBA**: `rgba(255, 149, 0, 0.1)` (라인 4464)
   ```
   background: rgba(255, 149, 0, 0.1);
   ```

619. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 4470)
   ```
   border: 1px solid rgba(255, 149, 0, 0.3);
   ```

620. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 4474)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

621. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 4476)
   ```
   border: 1px solid rgba(239, 68, 68, 0.3);
   ```

622. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4482)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

623. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4484)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

624. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4527)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

625. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4549)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

626. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4551)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

627. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 4586)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

628. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4587)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

629. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 4593)
   ```
   background: rgba(152, 251, 152, 0.1);
   ```

630. **RGBA**: `rgba(152, 251, 152, 0.3)` (라인 4594)
   ```
   box-shadow: 0 8px 25px rgba(152, 251, 152, 0.3);
   ```

631. **RGBA**: `rgba(239, 68, 68, 0.05)` (라인 4600)
   ```
   background: rgba(239, 68, 68, 0.05);
   ```

632. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4626)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

633. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4631)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

634. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4645)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

635. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 4647)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

636. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 4658)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

637. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4660)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

638. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 4868)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

639. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 4895)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

640. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4897)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

641. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 4900)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
   ```

642. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 4907)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

643. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 4908)
   ```
   box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
   ```

644. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 4971)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

645. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5010)
   ```
   box-shadow: var(--ad-b0kla-shadow-hover, 0 4px 12px rgba(0, 0, 0, 0.08));
   ```

646. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 5089)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

647. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5091)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

648. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5094)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
   ```

649. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 5101)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

650. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 5102)
   ```
   box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
   ```

651. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 5186)
   ```
   --color-success-light: rgba(16, 185, 129, 0.1);
   ```

652. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 5187)
   ```
   --color-warning-light: rgba(245, 158, 11, 0.1);
   ```

653. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 5188)
   ```
   --color-info-light: rgba(59, 130, 246, 0.1);
   ```

654. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 5189)
   ```
   --color-danger-light: rgba(239, 68, 68, 0.1);
   ```

655. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5271)
   ```
   background: var(--card-bg, rgba(255, 255, 255, 0.6));
   ```

656. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 5272)
   ```
   border: 1px solid var(--card-border, rgba(255, 255, 255, 0.5));
   ```

657. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 5296)
   ```
   border-bottom: 1px solid var(--border-color, rgba(139, 69, 19, 0.1));
   ```

658. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 5339)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

659. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 5737)
   ```
   border-top: 1px solid var(--border-color, rgba(139, 69, 19, 0.1));
   ```

660. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 6194)
   ```
   background: var(--mint-green-light, rgba(152, 251, 152, 0.2));
   ```

661. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 6315)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

662. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 6357)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

663. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 6375)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

664. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 6402)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

665. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 6514)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

666. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 6516)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

667. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 6528)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

668. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 6746)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

669. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 6784)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

670. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 6804)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

671. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 6806)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

672. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 6818)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

673. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 6857)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

674. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 6899)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

675. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 7285)
   ```
   box-shadow: 0 2px 4px rgba(152, 251, 152, 0.1);
   ```

676. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 7609)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

677. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 7611)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

678. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 7618)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

679. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 7625)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

680. **RGBA**: `rgba(182, 229, 216, 0.3)` (라인 7627)
   ```
   box-shadow: 0 0 0 2px rgba(182, 229, 216, 0.3);
   ```

681. **RGBA**: `rgba(182, 229, 216, 0.4)` (라인 7690)
   ```
   box-shadow: 0 4px 12px rgba(182, 229, 216, 0.4);
   ```

682. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 7698)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

683. **RGBA**: `rgba(182, 229, 216, 0.1)` (라인 7754)
   ```
   background: rgba(182, 229, 216, 0.1);
   ```

684. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 7775)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

685. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 7809)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

686. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 7810)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

687. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 7817)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

688. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 7884)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

689. **RGBA**: `rgba(255, 235, 205, 0.3)` (라인 7890)
   ```
   background: rgba(255, 235, 205, 0.3);
   ```

690. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 7892)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

691. **RGBA**: `rgba(182, 229, 216, 0.3)` (라인 7896)
   ```
   background: rgba(182, 229, 216, 0.3);
   ```

692. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 7902)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

693. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 7904)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

694. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 7908)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

695. **RGBA**: `rgba(107, 107, 107, 0.3)` (라인 7910)
   ```
   border: 1px solid rgba(107, 107, 107, 0.3);
   ```

696. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 7914)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

697. **RGBA**: `rgba(107, 107, 107, 0.2)` (라인 7916)
   ```
   border: 1px solid rgba(107, 107, 107, 0.2);
   ```

698. **RGBA**: `rgba(255, 235, 205, 0.3)` (라인 7921)
   ```
   background: rgba(255, 235, 205, 0.3);
   ```

699. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 7923)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

700. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 7927)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

701. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 7933)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

702. **RGBA**: `rgba(139, 69, 19, 0.4)` (라인 7935)
   ```
   border: 1px solid rgba(139, 69, 19, 0.4);
   ```

703. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 7939)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

704. **RGBA**: `rgba(107, 107, 107, 0.2)` (라인 7941)
   ```
   border: 1px solid rgba(107, 107, 107, 0.2);
   ```

705. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 7948)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

706. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 7950)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

707. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 7961)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

708. **RGBA**: `rgba(182, 229, 216, 0.1)` (라인 7969)
   ```
   background: rgba(182, 229, 216, 0.1);
   ```

709. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 8044)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
   ```

710. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 8086)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

711. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 8292)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
   ```

712. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 8333)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

713. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 8735)
   ```
   box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
   ```

714. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 8854)
   ```
   box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
   ```

715. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 9606)
   ```
   text-shadow: 0 1px 2px rgba(0, 123, 255, 0.3);
   ```

716. **RGBA**: `rgba(59, 130, 246, 0.05)` (라인 10029)
   ```
   background: rgba(59, 130, 246, 0.05) !important;
   ```

717. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 11221)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

718. **RGBA**: `rgba(0, 0, 0, 0.98)` (라인 11265)
   ```
   background-color: rgba(0, 0, 0, 0.98);
   ```

719. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 11335)
   ```
   box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
   ```

720. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 11348)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

721. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 11360)
   ```
   box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
   ```

722. **RGBA**: `rgba(0,0,0,0.1)` (라인 11543)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

723. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 11621)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

724. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 11623)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

725. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 11639)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

726. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 11640)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

727. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 11755)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

728. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 11792)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

729. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 11793)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

730. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 11818)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

731. **RGBA**: `rgba(0,0,0,0.1)` (라인 11893)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

732. **RGBA**: `rgba(16, 185, 129, 0.15)` (라인 12114)
   ```
   box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
   ```

733. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 12597)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

734. **RGBA**: `rgba(23, 162, 184, 0.1)` (라인 12616)
   ```
   background-color: rgba(23, 162, 184, 0.1);
   ```

735. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 12621)
   ```
   background-color: rgba(220, 53, 69, 0.1);
   ```

736. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 12626)
   ```
   background-color: rgba(40, 167, 69, 0.1);
   ```

737. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 12637)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

738. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 12732)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

739. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 12734)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

740. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 13914)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

741. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 13963)
   ```
   background-color: var(--color-bg-hover, rgba(0, 0, 0, 0.05));
   ```

742. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 13986)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

743. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 14251)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

744. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 14292)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
   ```

745. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 14961)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

746. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 15192)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

747. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 15380)
   ```
   box-shadow: 0 0 0 2px rgba(128, 128, 0, 0.1);
   ```

748. **RGBA**: `rgba(227, 242, 253, 0.5)` (라인 15506)
   ```
   background: rgba(227, 242, 253, 0.5);
   ```

749. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 15593)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
   ```

750. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 15608)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

751. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 15800)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

752. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 16130)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

753. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 16249)
   ```
   background: radial-gradient(circle, rgba(255, 182, 193, 0.2) 0%, transparent 70%);
   ```

754. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 16262)
   ```
   background: radial-gradient(circle, rgba(182, 229, 216, 0.2) 0%, transparent 70%);
   ```

755. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 16274)
   ```
   box-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
   ```

756. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 16296)
   ```
   background: radial-gradient(circle, rgba(255, 182, 193, 0.1) 0%, transparent 70%);
   ```

757. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 16309)
   ```
   box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
   ```

758. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 16354)
   ```
   box-shadow: 0 8px 30px rgba(255, 182, 193, 0.25);
   ```

759. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 16362)
   ```
   box-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
   ```

760. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 16376)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.2);
   ```

761. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 16413)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.15);
   ```

762. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 16418)
   ```
   box-shadow: 0 8px 30px rgba(255, 182, 193, 0.25);
   ```

763. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 16540)
   ```
   background-color: rgba(255, 255, 255, 0.8);
   ```

764. **RGBA**: `rgba(220, 53, 69, 0.25)` (라인 16654)
   ```
   box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
   ```

765. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 16882)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

766. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 17372)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

767. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 17422)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
   ```

768. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 17583)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/test/IntegrationTest.js` (JS)

**하드코딩 색상**: 127개

1. **HEX_6**: `#1f2937` (라인 216)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

2. **HEX_6**: `#1f2937` (라인 217)
   ```
   color: '#1f2937',
   ```

3. **HEX_6**: `#e5e7eb` (라인 253)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

4. **HEX_6**: `#e5e7eb` (라인 254)
   ```
   border: '1px solid #e5e7eb'
   ```

5. **HEX_6**: `#1f2937` (라인 260)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

6. **HEX_6**: `#1f2937` (라인 261)
   ```
   color: '#1f2937',
   ```

7. **HEX_6**: `#e5e7eb` (라인 332)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

8. **HEX_6**: `#e5e7eb` (라인 333)
   ```
   border: '1px solid #e5e7eb',
   ```

9. **HEX_6**: `#e5e7eb` (라인 339)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

10. **HEX_6**: `#e5e7eb` (라인 340)
   ```
   border: '4px solid #e5e7eb',
   ```

11. **HEX_6**: `#6b7280` (라인 350)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

12. **HEX_6**: `#6b7280` (라인 351)
   ```
   color: '#6b7280'
   ```

13. **HEX_6**: `#e5e7eb` (라인 364)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

14. **HEX_6**: `#e5e7eb` (라인 365)
   ```
   border: '1px solid #e5e7eb'
   ```

15. **HEX_6**: `#1f2937` (라인 371)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

16. **HEX_6**: `#1f2937` (라인 372)
   ```
   color: '#1f2937',
   ```

17. **HEX_6**: `#fef2f2` (라인 382)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
   ```

18. **HEX_6**: `#f0f9ff` (라인 383)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
   ```

19. **HEX_6**: `#f0f9ff` (라인 384)
   ```
   backgroundColor: testResults.success ? '#f0f9ff' : '#fef2f2',
   ```

20. **HEX_6**: `#fef2f2` (라인 384)
   ```
   backgroundColor: testResults.success ? '#f0f9ff' : '#fef2f2',
   ```

21. **HEX_6**: `#1f2937` (라인 399)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

22. **HEX_6**: `#1f2937` (라인 400)
   ```
   color: '#1f2937'
   ```

23. **HEX_6**: `#6b7280` (라인 419)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

24. **HEX_6**: `#374151` (라인 420)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

25. **HEX_6**: `#374151` (라인 421)
   ```
   <strong style={{ color: '#374151' }}>시작 시간:</strong> {formatDateTime(testResults.startTime)}
   ```

26. **HEX_6**: `#6b7280` (라인 423)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

27. **HEX_6**: `#374151` (라인 424)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

28. **HEX_6**: `#374151` (라인 425)
   ```
   <strong style={{ color: '#374151' }}>종료 시간:</strong> {formatDateTime(testResults.endTime)}
   ```

29. **HEX_6**: `#6b7280` (라인 427)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

30. **HEX_6**: `#374151` (라인 428)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

31. **HEX_6**: `#374151` (라인 429)
   ```
   <strong style={{ color: '#374151' }}>실행 시간:</strong> {testResults.executionTimeMs}ms
   ```

32. **HEX_6**: `#6b7280` (라인 431)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280', gridColumn: '1 / -1' }}>
   ```

33. **HEX_6**: `#374151` (라인 432)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

34. **HEX_6**: `#374151` (라인 433)
   ```
   <strong style={{ color: '#374151' }}>메시지:</strong> {testResults.message || testResults.errorMessage}
   ```

35. **HEX_6**: `#e5e7eb` (라인 443)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

36. **HEX_6**: `#e5e7eb` (라인 444)
   ```
   border: '1px solid #e5e7eb'
   ```

37. **HEX_6**: `#1f2937` (라인 450)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

38. **HEX_6**: `#1f2937` (라인 451)
   ```
   color: '#1f2937'
   ```

39. **HEX_6**: `#fef2f2` (라인 461)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
   ```

40. **HEX_6**: `#f0f9ff` (라인 462)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
   ```

41. **HEX_6**: `#f0f9ff` (라인 463)
   ```
   backgroundColor: result.success ? '#f0f9ff' : '#fef2f2',
   ```

42. **HEX_6**: `#fef2f2` (라인 463)
   ```
   backgroundColor: result.success ? '#f0f9ff' : '#fef2f2',
   ```

43. **HEX_6**: `#1f2937` (라인 477)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

44. **HEX_6**: `#1f2937` (라인 478)
   ```
   color: '#1f2937'
   ```

45. **HEX_6**: `#6b7280` (라인 495)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

46. **HEX_6**: `#6b7280` (라인 496)
   ```
   color: '#6b7280'
   ```

47. **HEX_6**: `#9ca3af` (라인 500)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9ca3af -> var(--mg-custom-9ca3af)
   ```

48. **HEX_6**: `#9ca3af` (라인 501)
   ```
   color: '#9ca3af'
   ```

49. **HEX_6**: `#e5e7eb` (라인 521)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

50. **HEX_6**: `#e5e7eb` (라인 522)
   ```
   border: '1px solid #e5e7eb'
   ```

51. **HEX_6**: `#1f2937` (라인 528)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

52. **HEX_6**: `#1f2937` (라인 529)
   ```
   color: '#1f2937',
   ```

53. **HEX_6**: `#fef2f2` (라인 539)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
   ```

54. **HEX_6**: `#f0f9ff` (라인 540)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
   ```

55. **HEX_6**: `#f0f9ff` (라인 541)
   ```
   backgroundColor: healthStatus.overallStatus === 'HEALTHY' ? '#f0f9ff' : '#fef2f2',
   ```

56. **HEX_6**: `#fef2f2` (라인 541)
   ```
   backgroundColor: healthStatus.overallStatus === 'HEALTHY' ? '#f0f9ff' : '#fef2f2',
   ```

57. **HEX_6**: `#1f2937` (라인 556)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

58. **HEX_6**: `#1f2937` (라인 557)
   ```
   color: '#1f2937'
   ```

59. **HEX_6**: `#6b7280` (라인 576)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

60. **HEX_6**: `#374151` (라인 577)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

61. **HEX_6**: `#374151` (라인 578)
   ```
   <strong style={{ color: '#374151' }}>확인 시간:</strong> {formatDateTime(healthStatus.timestamp)}
   ```

62. **HEX_6**: `#6b7280` (라인 580)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

63. **HEX_6**: `#374151` (라인 581)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

64. **HEX_6**: `#374151` (라인 582)
   ```
   <strong style={{ color: '#374151' }}>사용자 수:</strong> {healthStatus.userCount}
   ```

65. **HEX_6**: `#6b7280` (라인 584)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280', gridColumn: '1 / -1' }}>
   ```

66. **HEX_6**: `#374151` (라인 585)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

67. **HEX_6**: `#374151` (라인 586)
   ```
   <strong style={{ color: '#374151' }}>메시지:</strong>{' '}
   ```

68. **HEX_6**: `#e5e7eb` (라인 596)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

69. **HEX_6**: `#e5e7eb` (라인 597)
   ```
   border: '1px solid #e5e7eb'
   ```

70. **HEX_6**: `#1f2937` (라인 603)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

71. **HEX_6**: `#1f2937` (라인 604)
   ```
   color: '#1f2937'
   ```

72. **HEX_6**: `#e5e7eb` (라인 627)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

73. **HEX_6**: `#e5e7eb` (라인 628)
   ```
   border: '1px solid #e5e7eb'
   ```

74. **HEX_6**: `#374151` (라인 633)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

75. **HEX_6**: `#374151` (라인 634)
   ```
   color: '#374151'
   ```

76. **HEX_6**: `#e5e7eb` (라인 662)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

77. **HEX_6**: `#e5e7eb` (라인 663)
   ```
   border: '1px solid #e5e7eb'
   ```

78. **HEX_6**: `#1f2937` (라인 669)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

79. **HEX_6**: `#1f2937` (라인 670)
   ```
   color: '#1f2937',
   ```

80. **HEX_6**: `#fef2f2` (라인 680)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
   ```

81. **HEX_6**: `#f0f9ff` (라인 681)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
   ```

82. **HEX_6**: `#f0f9ff` (라인 682)
   ```
   backgroundColor: performanceResults.success ? '#f0f9ff' : '#fef2f2',
   ```

83. **HEX_6**: `#fef2f2` (라인 682)
   ```
   backgroundColor: performanceResults.success ? '#f0f9ff' : '#fef2f2',
   ```

84. **HEX_6**: `#1f2937` (라인 697)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

85. **HEX_6**: `#1f2937` (라인 698)
   ```
   color: '#1f2937'
   ```

86. **HEX_6**: `#6b7280` (라인 719)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

87. **HEX_6**: `#374151` (라인 720)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

88. **HEX_6**: `#374151` (라인 721)
   ```
   <strong style={{ color: '#374151' }}>평균 응답 시간:</strong> {performanceResults.averageResponseTime?.toFixed(2)}ms
   ```

89. **HEX_6**: `#6b7280` (라인 723)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

90. **HEX_6**: `#374151` (라인 724)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

91. **HEX_6**: `#374151` (라인 725)
   ```
   <strong style={{ color: '#374151' }}>최대 응답 시간:</strong> {performanceResults.maxResponseTime}ms
   ```

92. **HEX_6**: `#6b7280` (라인 727)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

93. **HEX_6**: `#374151` (라인 728)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

94. **HEX_6**: `#374151` (라인 729)
   ```
   <strong style={{ color: '#374151' }}>최소 응답 시간:</strong> {performanceResults.minResponseTime}ms
   ```

95. **HEX_6**: `#e5e7eb` (라인 737)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

96. **HEX_6**: `#e5e7eb` (라인 738)
   ```
   border: '1px solid #e5e7eb'
   ```

97. **HEX_6**: `#1f2937` (라인 744)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

98. **HEX_6**: `#1f2937` (라인 745)
   ```
   color: '#1f2937'
   ```

99. **HEX_6**: `#e5e7eb` (라인 757)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

100. **HEX_6**: `#e5e7eb` (라인 758)
   ```
   border: '1px solid #e5e7eb',
   ```

101. **HEX_6**: `#374151` (라인 760)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

102. **HEX_6**: `#374151` (라인 761)
   ```
   color: '#374151',
   ```

103. **HEX_6**: `#6b7280` (라인 772)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

104. **HEX_6**: `#374151` (라인 773)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

105. **HEX_6**: `#374151` (라인 774)
   ```
   <strong style={{ color: '#374151' }}>오류:</strong> {performanceResults.error}
   ```

106. **HEX_6**: `#e5e7eb` (라인 790)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

107. **HEX_6**: `#e5e7eb` (라인 791)
   ```
   border: '1px solid #e5e7eb'
   ```

108. **HEX_6**: `#1f2937` (라인 797)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

109. **HEX_6**: `#1f2937` (라인 798)
   ```
   color: '#1f2937',
   ```

110. **HEX_6**: `#fef2f2` (라인 808)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
   ```

111. **HEX_6**: `#f0f9ff` (라인 809)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f9ff -> var(--mg-custom-f0f9ff)
   ```

112. **HEX_6**: `#f0f9ff` (라인 810)
   ```
   backgroundColor: securityResults.success ? '#f0f9ff' : '#fef2f2',
   ```

113. **HEX_6**: `#fef2f2` (라인 810)
   ```
   backgroundColor: securityResults.success ? '#f0f9ff' : '#fef2f2',
   ```

114. **HEX_6**: `#1f2937` (라인 825)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

115. **HEX_6**: `#1f2937` (라인 826)
   ```
   color: '#1f2937'
   ```

116. **HEX_6**: `#e5e7eb` (라인 852)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

117. **HEX_6**: `#e5e7eb` (라인 853)
   ```
   border: '1px solid #e5e7eb'
   ```

118. **HEX_6**: `#374151` (라인 855)
   ```
   <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
   ```

119. **HEX_6**: `#e5e7eb` (라인 876)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

120. **HEX_6**: `#e5e7eb` (라인 877)
   ```
   border: '1px solid #e5e7eb'
   ```

121. **HEX_6**: `#374151` (라인 879)
   ```
   <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
   ```

122. **HEX_6**: `#e5e7eb` (라인 900)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

123. **HEX_6**: `#e5e7eb` (라인 901)
   ```
   border: '1px solid #e5e7eb',
   ```

124. **HEX_6**: `#374151` (라인 904)
   ```
   <span style={{ fontSize: 'var(--font-size-sm)', color: '#374151', fontWeight: '500' }}>
   ```

125. **HEX_6**: `#6b7280` (라인 921)
   ```
   <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
   ```

126. **HEX_6**: `#374151` (라인 922)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

127. **HEX_6**: `#374151` (라인 923)
   ```
   <strong style={{ color: '#374151' }}>오류:</strong> {securityResults.error}
   ```

---

### 📁 `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css` (CSS)

**하드코딩 색상**: 98개

1. **HEX_6**: `#fffbeb` (라인 16)
   ```
   background-color: var(--mg-v2-color-warning-50, #fffbeb);
   ```

2. **HEX_6**: `#fde68a` (라인 17)
   ```
   border: 1px solid var(--mg-v2-color-warning-200, #fde68a);
   ```

3. **HEX_6**: `#111827` (라인 19)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

4. **HEX_6**: `#e5e7eb` (라인 32)
   ```
   border: 1px solid var(--mg-v2-color-border, #e5e7eb);
   ```

5. **HEX_6**: `#eff6ff` (라인 57)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

6. **HEX_6**: `#2563eb` (라인 58)
   ```
   color: var(--mg-v2-color-primary-600, #2563eb);
   ```

7. **HEX_6**: `#f0fdf4` (라인 62)
   ```
   background-color: var(--mg-v2-color-success-50, #f0fdf4);
   ```

8. **HEX_6**: `#16a34a` (라인 63)
   ```
   color: var(--mg-v2-color-success-600, #16a34a);
   ```

9. **HEX_6**: `#fffbeb` (라인 67)
   ```
   background-color: var(--mg-v2-color-warning-50, #fffbeb);
   ```

10. **HEX_6**: `#d97706` (라인 68)
   ```
   color: var(--mg-v2-color-warning-600, #d97706);
   ```

11. **HEX_6**: `#f0f9ff` (라인 72)
   ```
   background-color: var(--mg-v2-color-info-50, #f0f9ff);
   ```

12. **HEX_6**: `#0284c7` (라인 73)
   ```
   color: var(--mg-v2-color-info-600, #0284c7);
   ```

13. **HEX_6**: `#6b7280` (라인 83)
   ```
   color: var(--mg-v2-color-text-secondary, #6b7280);
   ```

14. **HEX_6**: `#111827` (라인 89)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

15. **HEX_6**: `#9ca3af` (라인 96)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

16. **HEX_6**: `#e5e7eb` (라인 124)
   ```
   border: 1px solid var(--mg-v2-color-border, #e5e7eb);
   ```

17. **HEX_6**: `#e5e7eb` (라인 134)
   ```
   border-bottom: 1px solid var(--mg-v2-color-border, #e5e7eb);
   ```

18. **HEX_6**: `#111827` (라인 142)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

19. **HEX_6**: `#6b7280` (라인 151)
   ```
   color: var(--mg-v2-color-text-secondary, #6b7280);
   ```

20. **HEX_6**: `#f9fafb` (라인 173)
   ```
   background-color: var(--mg-v2-color-background, #f9fafb);
   ```

21. **HEX_6**: `#f3f4f6` (라인 174)
   ```
   border: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

22. **HEX_6**: `#2563eb` (라인 182)
   ```
   color: var(--mg-v2-color-primary-600, #2563eb);
   ```

23. **HEX_6**: `#9ca3af` (라인 189)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

24. **HEX_6**: `#111827` (라인 199)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

25. **HEX_6**: `#6b7280` (라인 206)
   ```
   color: var(--mg-v2-color-text-secondary, #6b7280);
   ```

26. **HEX_6**: `#f0fdf4` (라인 220)
   ```
   background-color: var(--mg-v2-color-success-50, #f0fdf4);
   ```

27. **HEX_6**: `#15803d` (라인 221)
   ```
   color: var(--mg-v2-color-success-700, #15803d);
   ```

28. **HEX_6**: `#fffbeb` (라인 225)
   ```
   background-color: var(--mg-v2-color-warning-50, #fffbeb);
   ```

29. **HEX_6**: `#b45309` (라인 226)
   ```
   color: var(--mg-v2-color-warning-700, #b45309);
   ```

30. **HEX_6**: `#f3f4f6` (라인 240)
   ```
   border-bottom: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

31. **HEX_6**: `#eff6ff` (라인 254)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

32. **HEX_6**: `#2563eb` (라인 255)
   ```
   color: var(--mg-v2-color-primary-600, #2563eb);
   ```

33. **HEX_6**: `#111827` (라인 265)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

34. **HEX_6**: `#9ca3af` (라인 272)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

35. **HEX_6**: `#6b7280` (라인 282)
   ```
   color: var(--mg-v2-color-text-secondary, #6b7280);
   ```

36. **HEX_6**: `#9ca3af` (라인 287)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

37. **HEX_6**: `#dbeafe` (라인 320)
   ```
   background-color: var(--mg-v2-color-primary-100, #dbeafe);
   ```

38. **HEX_6**: `#93c5fd` (라인 327)
   ```
   background-color: var(--mg-v2-color-primary-300, #93c5fd);
   ```

39. **HEX_6**: `#3b82f6` (라인 331)
   ```
   background-color: var(--mg-v2-color-primary-500, #3b82f6);
   ```

40. **HEX_6**: `#6b7280` (라인 336)
   ```
   color: var(--mg-v2-color-text-secondary, #6b7280);
   ```

41. **HEX_6**: `#f9fafb` (라인 360)
   ```
   background-color: var(--mg-v2-color-background, #f9fafb);
   ```

42. **HEX_6**: `#f3f4f6` (라인 361)
   ```
   border: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

43. **HEX_6**: `#eff6ff` (라인 377)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

44. **HEX_6**: `#bfdbfe` (라인 378)
   ```
   border: 2px solid var(--mg-v2-color-primary-200, #bfdbfe);
   ```

45. **HEX_6**: `#2563eb` (라인 390)
   ```
   background-color: var(--mg-v2-color-primary-600, #2563eb);
   ```

46. **HEX_6**: `#dbeafe` (라인 395)
   ```
   background-color: var(--mg-v2-color-primary-100, #dbeafe);
   ```

47. **HEX_6**: `#f9fafb` (라인 419)
   ```
   background-color: var(--mg-v2-color-background, #f9fafb);
   ```

48. **HEX_6**: `#f3f4f6` (라인 420)
   ```
   border: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

49. **HEX_6**: `#eff6ff` (라인 425)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

50. **HEX_6**: `#bfdbfe` (라인 426)
   ```
   border: 2px solid var(--mg-v2-color-primary-200, #bfdbfe);
   ```

51. **HEX_6**: `#dbeafe` (라인 431)
   ```
   background-color: var(--mg-v2-color-primary-100, #dbeafe);
   ```

52. **HEX_6**: `#2563eb` (라인 446)
   ```
   color: var(--mg-v2-color-primary-600, #2563eb);
   ```

53. **HEX_6**: `#9ca3af` (라인 452)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

54. **HEX_6**: `#6b7280` (라인 458)
   ```
   color: var(--mg-v2-color-text-secondary, #6b7280);
   ```

55. **HEX_6**: `#111827` (라인 472)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

56. **HEX_6**: `#6b7280` (라인 479)
   ```
   color: var(--mg-v2-color-text-secondary, #6b7280);
   ```

57. **HEX_6**: `#F5F3EF` (라인 522)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

58. **HEX_6**: `#D4CFC8` (라인 523)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

59. **HEX_6**: `#2C2C2C` (라인 537)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

60. **HEX_6**: `#8B7355` (라인 546)
   ```
   color: var(--mg-color-accent-main, #8B7355);
   ```

61. **HEX_6**: `#FEF3C7` (라인 608)
   ```
   background: var(--mg-color-warning-light, #FEF3C7);
   ```

62. **HEX_6**: `#F59E0B` (라인 609)
   ```
   border: 1px solid var(--mg-color-warning-main, #F59E0B);
   ```

63. **HEX_6**: `#F59E0B` (라인 613)
   ```
   background: var(--mg-color-warning-main, #F59E0B);
   ```

64. **HEX_6**: `#F59E0B` (라인 626)
   ```
   color: var(--mg-color-warning-main, #F59E0B);
   ```

65. **HEX_6**: `#2C2C2C` (라인 640)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

66. **HEX_6**: `#5C6B61` (라인 647)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

67. **HEX_6**: `#F5F3EF` (라인 671)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

68. **HEX_6**: `#D4CFC8` (라인 672)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

69. **HEX_6**: `#3D5246` (라인 687)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

70. **HEX_6**: `#3D5246` (라인 692)
   ```
   border-color: var(--mg-color-primary-main, #3D5246);
   ```

71. **HEX_6**: `#2C2C2C` (라인 706)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

72. **HEX_6**: `#3D5246` (라인 715)
   ```
   color: var(--mg-color-primary-main, #3D5246);
   ```

73. **HEX_6**: `#3D5246` (라인 729)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

74. **HEX_6**: `#FAF9F7` (라인 730)
   ```
   color: var(--mg-color-background-main, #FAF9F7);
   ```

75. **HEX_6**: `#EF4444` (라인 734)
   ```
   background: var(--mg-color-error-main, #EF4444);
   ```

76. **HEX_6**: `#fd7e14` (라인 739)
   ```
   background: #fd7e14;
   ```

77. **HEX_6**: `#F59E0B` (라인 744)
   ```
   background: var(--mg-color-warning-main, #F59E0B);
   ```

78. **HEX_6**: `#5C6B61` (라인 765)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

79. **HEX_6**: `#2C2C2C` (라인 772)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

80. **HEX_6**: `#F5F3EF` (라인 803)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

81. **HEX_6**: `#D4CFC8` (라인 804)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

82. **HEX_6**: `#EF4444` (라인 818)
   ```
   background: var(--mg-color-error-main, #EF4444);
   ```

83. **HEX_6**: `#2C2C2C` (라인 833)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

84. **HEX_6**: `#EF4444` (라인 842)
   ```
   color: var(--mg-color-error-main, #EF4444);
   ```

85. **HEX_6**: `#FAF9F7` (라인 852)
   ```
   background: var(--mg-color-background-main, #FAF9F7);
   ```

86. **HEX_6**: `#D4CFC8` (라인 853)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

87. **HEX_6**: `#EF4444` (라인 868)
   ```
   border-color: var(--mg-color-error-main, #EF4444);
   ```

88. **HEX_6**: `#FAF9F7` (라인 887)
   ```
   background: var(--mg-color-background-main, #FAF9F7);
   ```

89. **HEX_6**: `#D4CFC8` (라인 888)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

90. **HEX_6**: `#2C2C2C` (라인 910)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

91. **HEX_6**: `#5C6B61` (라인 917)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

92. **HEX_6**: `#5C6B61` (라인 932)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

93. **HEX_6**: `#5C6B61` (라인 941)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

94. **RGBA**: `rgba(0,0,0,0.05)` (라인 38)
   ```
   box-shadow: var(--mg-v2-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
   ```

95. **RGBA**: `rgba(0,0,0,0.1)` (라인 44)
   ```
   box-shadow: var(--mg-v2-shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1));
   ```

96. **RGBA**: `rgba(0,0,0,0.05)` (라인 128)
   ```
   box-shadow: var(--mg-v2-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
   ```

97. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 371)
   ```
   background-color: var(--mg-v2-color-background-hover, rgba(0, 0, 0, 0.02));
   ```

98. **RGBA**: `rgba(239, 68, 68, 0.02)` (라인 869)
   ```
   background: rgba(239, 68, 68, 0.02);
   ```

---

### 📁 `frontend/src/styles/00-core/_variables.css` (CSS)

**하드코딩 색상**: 70개

1. **HEX_6**: `#FFD700` (라인 148)
   ```
   --gradient-gold-start: #FFD700;
   ```

2. **HEX_6**: `#FFA500` (라인 149)
   ```
   --gradient-gold-end: #FFA500;
   ```

3. **HEX_6**: `#87CEEB` (라인 153)
   ```
   --gradient-sky-start: #87CEEB;
   ```

4. **HEX_6**: `#B0E0E6` (라인 154)
   ```
   --gradient-sky-end: #B0E0E6;
   ```

5. **HEX_6**: `#98D8C8` (라인 158)
   ```
   --gradient-mint-start: #98D8C8;
   ```

6. **HEX_6**: `#B4E7CE` (라인 159)
   ```
   --gradient-mint-end: #B4E7CE;
   ```

7. **HEX_6**: `#FFB6C1` (라인 163)
   ```
   --gradient-pink-start: #FFB6C1;
   ```

8. **HEX_6**: `#FFC0CB` (라인 164)
   ```
   --gradient-pink-end: #FFC0CB;
   ```

9. **HEX_6**: `#FF6B9D` (라인 168)
   ```
   --gradient-peach-start: #FF6B9D;
   ```

10. **HEX_6**: `#FFA5C0` (라인 169)
   ```
   --gradient-peach-end: #FFA5C0;
   ```

11. **HEX_6**: `#B8B8D0` (라인 173)
   ```
   --gradient-gray-start: #B8B8D0;
   ```

12. **HEX_6**: `#D0D0E8` (라인 174)
   ```
   --gradient-gray-end: #D0D0E8;
   ```

13. **HEX_6**: `#fbbf24` (라인 200)
   ```
   --status-requested: #fbbf24;      /* 상담 요청 - 노란색 */
   ```

14. **HEX_6**: `#059669` (라인 204)
   ```
   --status-completed: #059669;      /* 완료 - 진한 초록 */
   ```

15. **HEX_6**: `#f97316` (라인 206)
   ```
   --status-no-show: #f97316;        /* 노쇼 - 주황색 */
   ```

16. **HEX_6**: `#fbbf24` (라인 209)
   ```
   --payment-pending: #fbbf24;       /* 대기 - 노란색 */
   ```

17. **HEX_6**: `#6b7280` (라인 212)
   ```
   --payment-refunded: #6b7280;      /* 환불 - 회색 */
   ```

18. **HEX_6**: `#6b7280` (라인 216)
   ```
   --user-inactive: #6b7280;         /* 비활성 - 회색 */
   ```

19. **HEX_6**: `#fbbf24` (라인 218)
   ```
   --user-pending: #fbbf24;          /* 대기 - 노란색 */
   ```

20. **HEX_6**: `#cd7f32` (라인 221)
   ```
   --grade-junior: #cd7f32;          /* 주니어 - 브론즈 */
   ```

21. **HEX_6**: `#c0c0c0` (라인 222)
   ```
   --grade-senior: #c0c0c0;          /* 시니어 - 실버 */
   ```

22. **HEX_6**: `#ffd700` (라인 223)
   ```
   --grade-expert: #ffd700;          /* 전문가 - 골드 */
   ```

23. **HEX_6**: `#e5e4e2` (라인 224)
   ```
   --grade-master: #e5e4e2;          /* 마스터 - 플래티넘 */
   ```

24. **HEX_6**: `#6b7280` (라인 227)
   ```
   --role-client: #6b7280;           /* 내담자 - 회색 */
   ```

25. **HEX_6**: `#ec4899` (라인 238)
   ```
   --vacation-maternity: #ec4899;    /* 출산 - 핑크 */
   ```

26. **HEX_6**: `#06b6d4` (라인 239)
   ```
   --vacation-paternity: #06b6d4;    /* 육아 - 청록색 */
   ```

27. **HEX_6**: `#6b7280` (라인 240)
   ```
   --vacation-other: #6b7280;        /* 기타 - 회색 */
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 106)
   ```
   --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 107)
   ```
   --shadow-sm: 0 1px 3px 0 var(--mg-shadow-light), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 108)
   ```
   --shadow-md: 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 109)
   ```
   --shadow-lg: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 110)
   ```
   --shadow-xl: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 111)
   ```
   --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

34. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 112)
   ```
   --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
   ```

35. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 115)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

36. **RGBA**: `rgba(31, 38, 135, 0.6)` (라인 116)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(31, 38, 135, 0.6);
   ```

37. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 178)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

38. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 178)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

39. **RGBA**: `rgba(255, 250, 240, 0.5)` (라인 179)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

40. **RGBA**: `rgba(255, 255, 250, 0.5)` (라인 179)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

41. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 180)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

42. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 180)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

43. **RGBA**: `rgba(230, 245, 255, 0.5)` (라인 181)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

44. **RGBA**: `rgba(240, 250, 255, 0.5)` (라인 181)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

45. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 184)
   ```
   --border-pink-light: rgba(255, 182, 193, 0.2);
   ```

46. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 185)
   ```
   --border-pink-medium: rgba(255, 182, 193, 0.4);
   ```

47. **RGBA**: `rgba(135, 206, 235, 0.2)` (라인 186)
   ```
   --border-sky-light: rgba(135, 206, 235, 0.2);
   ```

48. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 189)
   ```
   --shadow-gold: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

49. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 190)
   ```
   --shadow-gold-sm: 0 2px 8px rgba(255, 215, 0, 0.3);
   ```

50. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 191)
   ```
   --shadow-sky: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

51. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 192)
   ```
   --shadow-sky-sm: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

52. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 193)
   ```
   --shadow-mint-sm: 0 2px 8px rgba(152, 216, 200, 0.3);
   ```

53. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 194)
   ```
   --shadow-pink-sm: 0 2px 8px rgba(255, 182, 193, 0.3);
   ```

54. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 195)
   ```
   --shadow-peach: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

55. **RGBA**: `rgba(251, 191, 36, 0.1)` (라인 243)
   ```
   --status-requested-bg: rgba(251, 191, 36, 0.1);
   ```

56. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 244)
   ```
   --status-assigned-bg: rgba(139, 92, 246, 0.1);
   ```

57. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 245)
   ```
   --status-confirmed-bg: rgba(59, 130, 246, 0.1);
   ```

58. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 246)
   ```
   --status-in-progress-bg: rgba(16, 185, 129, 0.1);
   ```

59. **RGBA**: `rgba(5, 150, 105, 0.1)` (라인 247)
   ```
   --status-completed-bg: rgba(5, 150, 105, 0.1);
   ```

60. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 248)
   ```
   --status-cancelled-bg: rgba(239, 68, 68, 0.1);
   ```

61. **RGBA**: `rgba(205, 127, 50, 0.1)` (라인 250)
   ```
   --grade-junior-bg: rgba(205, 127, 50, 0.1);
   ```

62. **RGBA**: `rgba(192, 192, 192, 0.1)` (라인 251)
   ```
   --grade-senior-bg: rgba(192, 192, 192, 0.1);
   ```

63. **RGBA**: `rgba(255, 215, 0, 0.1)` (라인 252)
   ```
   --grade-expert-bg: rgba(255, 215, 0, 0.1);
   ```

64. **RGBA**: `rgba(229, 228, 226, 0.1)` (라인 253)
   ```
   --grade-master-bg: rgba(229, 228, 226, 0.1);
   ```

65. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 255)
   ```
   --role-client-bg: rgba(107, 114, 128, 0.1);
   ```

66. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 256)
   ```
   --role-consultant-bg: rgba(139, 92, 246, 0.1);
   ```

67. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 257)
   ```
   --role-admin-bg: rgba(59, 130, 246, 0.1);
   ```

68. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 259)
   ```
   --vacation-annual-bg: rgba(59, 130, 246, 0.1);
   ```

69. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 260)
   ```
   --vacation-sick-bg: rgba(239, 68, 68, 0.1);
   ```

70. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 261)
   ```
   --vacation-personal-bg: rgba(139, 92, 246, 0.1);
   ```

---

### 📁 `frontend/src/styles/common/variables.css` (CSS)

**하드코딩 색상**: 69개

1. **HEX_6**: `#FFE5B3` (라인 41)
   ```
   --color-tertiary: #FFE5B3;       /* 부드러운 파스텔 옐로우 */
   ```

2. **HEX_6**: `#FFF0D4` (라인 42)
   ```
   --color-tertiary-light: #FFF0D4; /* 밝은 파스텔 옐로우 */
   ```

3. **HEX_6**: `#FFD699` (라인 43)
   ```
   --color-tertiary-dark: #FFD699;  /* 진한 파스텔 옐로우 */
   ```

4. **HEX_6**: `#F0F0F0` (라인 46)
   ```
   --color-neutral: #F0F0F0;        /* 매우 연한 그레이 */
   ```

5. **HEX_6**: `#F8F8F8` (라인 47)
   ```
   --color-neutral-light: #F8F8F8;  /* 거의 흰색 */
   ```

6. **HEX_6**: `#FAFAFA` (라인 51)
   ```
   --color-background: #FAFAFA;     /* 매우 연한 크림 */
   ```

7. **HEX_6**: `#4A4A4A` (라인 56)
   ```
   --color-text-primary: #4A4A4A;   /* 진한 그레이 */
   ```

8. **HEX_6**: `#6B6B6B` (라인 57)
   ```
   --color-text-secondary: #6B6B6B; /* 중간 그레이 */
   ```

9. **HEX_6**: `#9B9B9B` (라인 58)
   ```
   --color-text-muted: #9B9B9B;     /* 연한 그레이 */
   ```

10. **HEX_6**: `#C8E6C9` (라인 62)
   ```
   --color-success: #C8E6C9;        /* 부드러운 그린 */
   ```

11. **HEX_6**: `#FFE0B2` (라인 63)
   ```
   --color-warning: #FFE0B2;        /* 부드러운 오렌지 */
   ```

12. **HEX_6**: `#FFCDD2` (라인 64)
   ```
   --color-error: #FFCDD2;          /* 부드러운 레드 */
   ```

13. **HEX_6**: `#BBDEFB` (라인 65)
   ```
   --color-info: #BBDEFB;           /* 부드러운 블루 */
   ```

14. **HEX_6**: `#FEF2F2` (라인 68)
   ```
   --color-red-50: #FEF2F2;
   ```

15. **HEX_6**: `#FECACA` (라인 69)
   ```
   --color-red-200: #FECACA;
   ```

16. **HEX_6**: `#DC2626` (라인 71)
   ```
   --color-red-600: #DC2626;
   ```

17. **HEX_6**: `#B91C1C` (라인 72)
   ```
   --color-red-700: #B91C1C;
   ```

18. **HEX_6**: `#2d3748` (라인 90)
   ```
   --toast-dark-bg: #2d3748;
   ```

19. **HEX_6**: `#e2e8f0` (라인 91)
   ```
   --toast-dark-color: #e2e8f0;
   ```

20. **HEX_6**: `#e2e8f0` (라인 92)
   ```
   --toast-dark-message-color: #e2e8f0;
   ```

21. **HEX_6**: `#a0aec0` (라인 93)
   ```
   --toast-dark-close-color: #a0aec0;
   ```

22. **HEX_6**: `#4a5568` (라인 94)
   ```
   --toast-dark-close-hover-bg: #4a5568;
   ```

23. **HEX_6**: `#e2e8f0` (라인 95)
   ```
   --toast-dark-close-hover-color: #e2e8f0;
   ```

24. **HEX_6**: `#6B7280` (라인 172)
   ```
   --toast-message-color: #6B7280;  /* 회색 글자색상으로 통일 */
   ```

25. **HEX_6**: `#0056b3` (라인 190)
   ```
   --toast-progress-bar-bg: linear-gradient(90deg, var(--mg-primary-500), #0056b3);
   ```

26. **HEX_6**: `#1e7e34` (라인 191)
   ```
   --toast-success-progress-bg: linear-gradient(90deg, var(--mg-success-500), #1e7e34);
   ```

27. **HEX_6**: `#c82333` (라인 192)
   ```
   --toast-error-progress-bg: linear-gradient(90deg, var(--mg-error-500), #c82333);
   ```

28. **HEX_6**: `#e0a800` (라인 193)
   ```
   --toast-warning-progress-bg: linear-gradient(90deg, var(--mg-warning-500), #e0a800);
   ```

29. **HEX_6**: `#138496` (라인 194)
   ```
   --toast-info-progress-bg: linear-gradient(90deg, var(--mg-info-500), #138496);
   ```

30. **HEX_6**: `#059669` (라인 195)
   ```
   --toast-system-progress-bg: linear-gradient(90deg, var(--mg-success-500), #059669);  /* 시스템은 녹색 사용 */
   ```

31. **HEX_6**: `#2d3748` (라인 211)
   ```
   --toast-dark-bg: #2d3748;
   ```

32. **HEX_6**: `#e2e8f0` (라인 212)
   ```
   --toast-dark-color: #e2e8f0;
   ```

33. **HEX_6**: `#e2e8f0` (라인 213)
   ```
   --toast-dark-message-color: #e2e8f0;
   ```

34. **HEX_6**: `#a0aec0` (라인 214)
   ```
   --toast-dark-close-color: #a0aec0;
   ```

35. **HEX_6**: `#4a5568` (라인 215)
   ```
   --toast-dark-close-hover-bg: #4a5568;
   ```

36. **HEX_6**: `#e2e8f0` (라인 216)
   ```
   --toast-dark-close-hover-color: #e2e8f0;
   ```

37. **HEX_6**: `#ff8a80` (라인 251)
   ```
   --transfer-btn-danger-hover-bg: #ff8a80;
   ```

38. **HEX_6**: `#e9ecef` (라인 452)
   ```
   --chart-container-border: #e9ecef;
   ```

39. **HEX_6**: `#2c3e50` (라인 461)
   ```
   --chart-title-color: #2c3e50;
   ```

40. **HEX_6**: `#343a40` (라인 478)
   ```
   --chart-color-dark: #343a40;
   ```

41. **HEX_6**: `#e9ecef` (라인 487)
   ```
   --dashboard-card-border: #e9ecef;
   ```

42. **HEX_6**: `#e9ecef` (라인 495)
   ```
   --dashboard-header-border: #e9ecef;
   ```

43. **HEX_6**: `#2c3e50` (라인 503)
   ```
   --dashboard-title-color: #2c3e50;
   ```

44. **HEX_6**: `#e9ecef` (라인 514)
   ```
   --filter-section-border: #e9ecef;
   ```

45. **HEX_6**: `#495057` (라인 526)
   ```
   --filter-label-color: #495057;
   ```

46. **HEX_6**: `#ced4da` (라인 531)
   ```
   --filter-input-border: #ced4da;
   ```

47. **HEX_6**: `#80bdff` (라인 532)
   ```
   --filter-input-focus-border: #80bdff;
   ```

48. **HEX_6**: `#0056b3` (라인 541)
   ```
   --filter-btn-hover-bg: #0056b3;
   ```

49. **HEX_6**: `#0056b3` (라인 542)
   ```
   --filter-btn-hover-border: #0056b3;
   ```

50. **HEX_6**: `#e9ecef` (라인 549)
   ```
   --table-border: #e9ecef;
   ```

51. **HEX_6**: `#495057` (라인 556)
   ```
   --table-header-color: #495057;
   ```

52. **HEX_6**: `#dee2e6` (라인 559)
   ```
   --table-header-border: #dee2e6;
   ```

53. **HEX_6**: `#dee2e6` (라인 563)
   ```
   --table-cell-border: #dee2e6;
   ```

54. **HEX_6**: `#495057` (라인 564)
   ```
   --table-cell-color: #495057;
   ```

55. **HEX_6**: `#dee2e6` (라인 568)
   ```
   --table-row-border: #dee2e6;
   ```

56. **HEX_6**: `#f8d7da` (라인 576)
   ```
   --error-message-bg: #f8d7da;
   ```

57. **HEX_6**: `#721c24` (라인 577)
   ```
   --error-message-color: #721c24;
   ```

58. **HEX_6**: `#f5c6cb` (라인 578)
   ```
   --error-message-border: #f5c6cb;
   ```

59. **HEX_6**: `#e3f2fd` (라인 603)
   ```
   --card-color-primary-light: #e3f2fd;
   ```

60. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 96)
   ```
   --toast-dark-progress-bg: rgba(255, 255, 255, 0.1);
   ```

61. **RGBA**: `rgba(184, 230, 184, 0.15)` (라인 103)
   ```
   --shadow-soft: 0 2px 8px rgba(184, 230, 184, 0.15);
   ```

62. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 104)
   ```
   --shadow-medium: 0 4px 16px rgba(184, 230, 184, 0.2);
   ```

63. **RGBA**: `rgba(184, 230, 184, 0.25)` (라인 105)
   ```
   --shadow-large: 0 8px 32px rgba(184, 230, 184, 0.25);
   ```

64. **RGBA**: `rgba(184, 230, 184, 0.3)` (라인 106)
   ```
   --shadow-hover: 0 6px 20px rgba(184, 230, 184, 0.3);
   ```

65. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 158)
   ```
   --toast-hover-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
   ```

66. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 217)
   ```
   --toast-dark-progress-bg: rgba(255, 255, 255, 0.1);
   ```

67. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 271)
   ```
   --transfer-form-input-focus-shadow: 0 0 0 2px rgba(184, 230, 184, 0.2);
   ```

68. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 283)
   ```
   --transfer-select-focus-shadow: 0 0 0 2px rgba(184, 230, 184, 0.2);
   ```

69. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 406)
   ```
   --schedule-search-input-focus-shadow: 0 0 0 2px rgba(184, 230, 184, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/TenantCodeManagement.css` (CSS)

**하드코딩 색상**: 64개

1. **HEX_6**: `#d1fae5` (라인 21)
   ```
   --tenant-light: var(--mg-color-success-100, #d1fae5);
   ```

2. **HEX_6**: `#a7f3d0` (라인 22)
   ```
   --tenant-border: var(--mg-color-success-300, #a7f3d0);
   ```

3. **HEX_6**: `#065f46` (라인 23)
   ```
   --tenant-text: var(--mg-color-success-800, #065f46);
   ```

4. **HEX_6**: `#fef3c7` (라인 27)
   ```
   --core-light: var(--mg-color-warning-100, #fef3c7);
   ```

5. **HEX_6**: `#fde68a` (라인 28)
   ```
   --core-border: var(--mg-color-warning-300, #fde68a);
   ```

6. **HEX_6**: `#92400e` (라인 29)
   ```
   --core-text: var(--mg-color-warning-800, #92400e);
   ```

7. **HEX_6**: `#d1fae5` (라인 32)
   ```
   --status-active-bg: var(--mg-color-success-100, #d1fae5);
   ```

8. **HEX_6**: `#065f46` (라인 33)
   ```
   --status-active-text: var(--mg-color-success-800, #065f46);
   ```

9. **HEX_6**: `#fee2e2` (라인 34)
   ```
   --status-inactive-bg: var(--mg-color-error-100, #fee2e2);
   ```

10. **HEX_6**: `#991b1b` (라인 35)
   ```
   --status-inactive-text: var(--mg-color-error-800, #991b1b);
   ```

11. **HEX_6**: `#f9fafb` (라인 39)
   ```
   --tenant-surface: var(--mg-color-gray-50, #f9fafb);
   ```

12. **HEX_6**: `#e5e7eb` (라인 40)
   ```
   --tenant-border-default: var(--mg-color-gray-200, #e5e7eb);
   ```

13. **HEX_6**: `#d1d5db` (라인 41)
   ```
   --tenant-border-hover: var(--mg-color-gray-300, #d1d5db);
   ```

14. **HEX_6**: `#1f2937` (라인 42)
   ```
   --tenant-text-primary: var(--mg-color-gray-900, #1f2937);
   ```

15. **HEX_6**: `#6b7280` (라인 43)
   ```
   --tenant-text-secondary: var(--mg-color-gray-600, #6b7280);
   ```

16. **HEX_6**: `#9ca3af` (라인 44)
   ```
   --tenant-text-muted: var(--mg-color-gray-500, #9ca3af);
   ```

17. **HEX_6**: `#eff6ff` (라인 194)
   ```
   background: #eff6ff;
   ```

18. **HEX_6**: `#f3f4f6` (라인 220)
   ```
   background: #f3f4f6;
   ```

19. **HEX_6**: `#f3f4f6` (라인 266)
   ```
   border-top: 1px solid #f3f4f6;
   ```

20. **HEX_6**: `#e5e7eb` (라인 279)
   ```
   border: 1px solid #e5e7eb;
   ```

21. **HEX_6**: `#6b7280` (라인 289)
   ```
   color: #6b7280;
   ```

22. **HEX_6**: `#6b7280` (라인 310)
   ```
   color: #6b7280;
   ```

23. **HEX_6**: `#e5e7eb` (라인 316)
   ```
   border: 2px solid #e5e7eb;
   ```

24. **HEX_6**: `#e5e7eb` (라인 330)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

25. **HEX_6**: `#f9fafb` (라인 331)
   ```
   background: #f9fafb;
   ```

26. **HEX_6**: `#1f2937` (라인 347)
   ```
   color: #1f2937;
   ```

27. **HEX_6**: `#d1fae5` (라인 365)
   ```
   background: #d1fae5;
   ```

28. **HEX_6**: `#a7f3d0` (라인 367)
   ```
   border: 1px solid #a7f3d0;
   ```

29. **HEX_6**: `#fef3c7` (라인 371)
   ```
   background: #fef3c7;
   ```

30. **HEX_6**: `#fde68a` (라인 373)
   ```
   border: 1px solid #fde68a;
   ```

31. **HEX_6**: `#6b7280` (라인 391)
   ```
   color: #6b7280;
   ```

32. **HEX_6**: `#d1d5db` (라인 397)
   ```
   border: 1px solid #d1d5db;
   ```

33. **HEX_6**: `#6b7280` (라인 426)
   ```
   color: #6b7280;
   ```

34. **HEX_6**: `#e5e7eb` (라인 441)
   ```
   border: 1px solid #e5e7eb;
   ```

35. **HEX_6**: `#d1d5db` (라인 449)
   ```
   border-color: #d1d5db;
   ```

36. **HEX_6**: `#f9fafb` (라인 455)
   ```
   background: #f9fafb;
   ```

37. **HEX_6**: `#f3f4f6` (라인 476)
   ```
   background: #f3f4f6;
   ```

38. **HEX_6**: `#374151` (라인 481)
   ```
   color: #374151;
   ```

39. **HEX_6**: `#d1fae5` (라인 494)
   ```
   background: #d1fae5;
   ```

40. **HEX_6**: `#065f46` (라인 495)
   ```
   color: #065f46;
   ```

41. **HEX_6**: `#fee2e2` (라인 499)
   ```
   background: #fee2e2;
   ```

42. **HEX_6**: `#991b1b` (라인 500)
   ```
   color: #991b1b;
   ```

43. **HEX_6**: `#1f2937` (라인 506)
   ```
   color: #1f2937;
   ```

44. **HEX_6**: `#6b7280` (라인 512)
   ```
   color: #6b7280;
   ```

45. **HEX_6**: `#f3f4f6` (라인 523)
   ```
   border-top: 1px solid #f3f4f6;
   ```

46. **HEX_6**: `#6b7280` (라인 531)
   ```
   color: #6b7280;
   ```

47. **HEX_6**: `#e5e7eb` (라인 545)
   ```
   border: 1px solid #e5e7eb;
   ```

48. **HEX_6**: `#6b7280` (라인 548)
   ```
   color: #6b7280;
   ```

49. **HEX_6**: `#d1d5db` (라인 554)
   ```
   border-color: #d1d5db;
   ```

50. **HEX_6**: `#f9fafb` (라인 555)
   ```
   background: #f9fafb;
   ```

51. **HEX_6**: `#e5e7eb` (라인 646)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

52. **HEX_6**: `#1f2937` (라인 655)
   ```
   color: #1f2937;
   ```

53. **HEX_6**: `#6b7280` (라인 664)
   ```
   color: #6b7280;
   ```

54. **HEX_6**: `#f3f4f6` (라인 670)
   ```
   background: #f3f4f6;
   ```

55. **HEX_6**: `#374151` (라인 671)
   ```
   color: #374151;
   ```

56. **HEX_6**: `#374151` (라인 696)
   ```
   color: #374151;
   ```

57. **HEX_6**: `#d1d5db` (라인 703)
   ```
   border: 1px solid #d1d5db;
   ```

58. **HEX_6**: `#e5e7eb` (라인 733)
   ```
   border-top: 1px solid #e5e7eb;
   ```

59. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 122)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

60. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 129)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

61. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 189)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

62. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 195)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

63. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 406)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

64. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 712)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/styles/auth/UnifiedLogin.css` (CSS)

**하드코딩 색상**: 62개

1. **HEX_6**: `#FAF9F7` (라인 10)
   ```
   background-color: var(--mg-bg-primary, #FAF9F7);
   ```

2. **HEX_6**: `#3D5246` (라인 17)
   ```
   background-color: var(--mg-primary-color, #3D5246);
   ```

3. **HEX_6**: `#3D5246` (라인 18)
   ```
   background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'), linear-gradient(135deg, var(--mg-primary-color, #3D5246) 0%, var(--mg-primary-light, #4A6354) 100%);
   ```

4. **HEX_6**: `#4A6354` (라인 18)
   ```
   background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'), linear-gradient(135deg, var(--mg-primary-color, #3D5246) 0%, var(--mg-primary-light, #4A6354) 100%);
   ```

5. **HEX_6**: `#1A1A1A` (라인 44)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

6. **HEX_6**: `#3D5246` (라인 47)
   ```
   border-left: 4px solid var(--mg-primary-color, #3D5246);
   ```

7. **HEX_6**: `#3D5246` (라인 63)
   ```
   color: var(--mg-primary-color, #3D5246);
   ```

8. **HEX_6**: `#555555` (라인 73)
   ```
   color: var(--mg-text-secondary, #555555);
   ```

9. **HEX_6**: `#FAF9F7` (라인 83)
   ```
   background-color: var(--mg-bg-primary, #FAF9F7);
   ```

10. **HEX_6**: `#1A1A1A` (라인 98)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

11. **HEX_6**: `#666666` (라인 104)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

12. **HEX_6**: `#3d5246` (라인 122)
   ```
   background-color: var(--mg-primary-color, #3d5246);
   ```

13. **HEX_6**: `#3d5246` (라인 123)
   ```
   background: var(--mg-primary-color, #3d5246);
   ```

14. **HEX_6**: `#4f6b5a` (라인 130)
   ```
   background-color: var(--mg-primary-light, #4f6b5a);
   ```

15. **HEX_6**: `#4f6b5a` (라인 131)
   ```
   background: var(--mg-primary-light, #4f6b5a);
   ```

16. **HEX_6**: `#3d5246` (라인 141)
   ```
   background-color: var(--mg-primary-color, #3d5246) !important;
   ```

17. **HEX_6**: `#1A1A1A` (라인 153)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

18. **HEX_6**: `#F5F3EF` (라인 159)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

19. **HEX_6**: `#D4CFC8` (라인 160)
   ```
   border: 1px solid var(--mg-border-color, #D4CFC8);
   ```

20. **HEX_6**: `#1A1A1A` (라인 163)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

21. **HEX_6**: `#3D5246` (라인 172)
   ```
   border-color: var(--mg-primary-color, #3D5246);
   ```

22. **HEX_6**: `#666666` (라인 190)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

23. **HEX_6**: `#3D5246` (라인 195)
   ```
   background-color: var(--mg-primary-color, #3D5246);
   ```

24. **HEX_6**: `#4F6B5A` (라인 212)
   ```
   background-color: var(--mg-primary-light, #4F6B5A);
   ```

25. **HEX_6**: `#D4CFC8` (라인 232)
   ```
   border-bottom: 1px solid var(--mg-border-color, #D4CFC8);
   ```

26. **HEX_6**: `#666666` (라인 237)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

27. **HEX_6**: `#fee500` (라인 277)
   ```
   --oauth-kakao-bg: #fee500;
   ```

28. **HEX_6**: `#e6cf00` (라인 278)
   ```
   --oauth-kakao-bg-hover: #e6cf00;
   ```

29. **HEX_6**: `#03c75a` (라인 280)
   ```
   --oauth-naver-bg: #03c75a;
   ```

30. **HEX_6**: `#02a84e` (라인 281)
   ```
   --oauth-naver-bg-hover: #02a84e;
   ```

31. **HEX_6**: `#f5f5f5` (라인 284)
   ```
   --oauth-google-bg-hover: #f5f5f5;
   ```

32. **HEX_6**: `#d4cfc8` (라인 285)
   ```
   --oauth-google-border: var(--mg-border-color, #d4cfc8);
   ```

33. **HEX_6**: `#666666` (라인 381)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

34. **HEX_6**: `#3D5246` (라인 388)
   ```
   color: var(--mg-primary-color, #3D5246);
   ```

35. **HEX_6**: `#D4CFC8` (라인 394)
   ```
   background-color: var(--mg-border-color, #D4CFC8);
   ```

36. **HEX_6**: `#fee2e2` (라인 406)
   ```
   background-color: #fee2e2;
   ```

37. **HEX_6**: `#991b1b` (라인 407)
   ```
   color: #991b1b;
   ```

38. **HEX_6**: `#fecaca` (라인 408)
   ```
   border: 1px solid #fecaca;
   ```

39. **HEX_6**: `#d1fae5` (라인 412)
   ```
   background-color: #d1fae5;
   ```

40. **HEX_6**: `#065f46` (라인 413)
   ```
   color: #065f46;
   ```

41. **HEX_6**: `#6ee7b7` (라인 414)
   ```
   border: 1px solid #6ee7b7;
   ```

42. **HEX_6**: `#fef3c7` (라인 418)
   ```
   background-color: #fef3c7;
   ```

43. **HEX_6**: `#92400e` (라인 419)
   ```
   color: #92400e;
   ```

44. **HEX_6**: `#fde68a` (라인 420)
   ```
   border: 1px solid #fde68a;
   ```

45. **HEX_6**: `#3D5246` (라인 449)
   ```
   border-top: 3px solid var(--mg-primary-color, #3D5246);
   ```

46. **RGBA**: `rgba(44, 44, 44, 0.4)` (라인 36)
   ```
   background: rgba(44, 44, 44, 0.4);
   ```

47. **RGBA**: `rgba(250, 249, 247, 0.94)` (라인 45)
   ```
   background: rgba(250, 249, 247, 0.94);
   ```

48. **RGBA**: `rgba(61, 82, 70, 0.12)` (라인 46)
   ```
   border: 1px solid rgba(61, 82, 70, 0.12);
   ```

49. **RGBA**: `rgba(255, 255, 255, 0.65)` (라인 53)
   ```
   0 1px 0 rgba(255, 255, 255, 0.65) inset,
   ```

50. **RGBA**: `rgba(20, 28, 24, 0.15)` (라인 54)
   ```
   0 10px 40px rgba(20, 28, 24, 0.15);
   ```

51. **RGBA**: `rgba(61, 82, 70, 0.12)` (라인 69)
   ```
   border-top: 1px solid rgba(61, 82, 70, 0.12);
   ```

52. **RGBA**: `rgba(61, 82, 70, 0.1)` (라인 173)
   ```
   box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1);
   ```

53. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 279)
   ```
   --oauth-kakao-text: rgba(0, 0, 0, 0.85);
   ```

54. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 297)
   ```
   box-shadow: var(--cs-shadow-soft, 0 4px 12px rgba(0, 0, 0, 0.08));
   ```

55. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 304)
   ```
   box-shadow: var(--cs-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.06));
   ```

56. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 316)
   ```
   box-shadow: var(--cs-shadow-soft, 0 4px 12px rgba(0, 0, 0, 0.12));
   ```

57. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 323)
   ```
   box-shadow: var(--cs-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.08));
   ```

58. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 328)
   ```
   color: rgba(0, 0, 0, 0.85);
   ```

59. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 334)
   ```
   color: rgba(0, 0, 0, 0.85);
   ```

60. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 336)
   ```
   box-shadow: var(--cs-shadow-soft, 0 4px 12px rgba(0, 0, 0, 0.06));
   ```

61. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 343)
   ```
   box-shadow: var(--cs-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.06));
   ```

62. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 366)
   ```
   color: rgba(0, 0, 0, 0.85) !important;
   ```

---

### 📁 `frontend/src/components/admin/ConsultantComprehensiveManagement.css` (CSS)

**하드코딩 색상**: 59개

1. **HEX_6**: `#f8fafc` (라인 59)
   ```
   background: #f8fafc;
   ```

2. **HEX_6**: `#1f2937` (라인 84)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#6b7280` (라인 93)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#6b7280` (라인 102)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#374151` (라인 111)
   ```
   color: #374151;
   ```

6. **HEX_6**: `#9ca3af` (라인 120)
   ```
   color: #9ca3af;
   ```

7. **HEX_6**: `#6b7280` (라인 126)
   ```
   color: #6b7280;
   ```

8. **HEX_6**: `#2563eb` (라인 158)
   ```
   background: #2563eb;
   ```

9. **HEX_6**: `#dc2626` (라인 168)
   ```
   background: #dc2626;
   ```

10. **HEX_6**: `#f0f9ff` (라인 205)
   ```
   background: #f0f9ff;
   ```

11. **HEX_6**: `#1e40af` (라인 206)
   ```
   color: #1e40af;
   ```

12. **HEX_6**: `#374151` (라인 220)
   ```
   color: #374151;
   ```

13. **HEX_6**: `#9ca3af` (라인 240)
   ```
   color: #9ca3af;
   ```

14. **HEX_6**: `#1f2937` (라인 272)
   ```
   color: #1f2937;
   ```

15. **HEX_6**: `#6b7280` (라인 295)
   ```
   color: #6b7280;
   ```

16. **HEX_6**: `#1f2937` (라인 302)
   ```
   color: #1f2937;
   ```

17. **HEX_6**: `#2563eb` (라인 333)
   ```
   background: #2563eb;
   ```

18. **HEX_6**: `#6b7280` (라인 337)
   ```
   background: #6b7280;
   ```

19. **HEX_6**: `#4b5563` (라인 342)
   ```
   background: #4b5563;
   ```

20. **HEX_6**: `#f8fafc` (라인 350)
   ```
   background: #f8fafc;
   ```

21. **HEX_6**: `#f0f9ff` (라인 386)
   ```
   background: #f0f9ff;
   ```

22. **HEX_6**: `#1f2937` (라인 399)
   ```
   color: #1f2937;
   ```

23. **HEX_6**: `#6b7280` (라인 406)
   ```
   color: #6b7280;
   ```

24. **HEX_6**: `#1f2937` (라인 419)
   ```
   color: #1f2937;
   ```

25. **HEX_6**: `#d1d5db` (라인 431)
   ```
   border: 1px solid #d1d5db;
   ```

26. **HEX_6**: `#9ca3af` (라인 445)
   ```
   color: #9ca3af;
   ```

27. **HEX_6**: `#1f2937` (라인 460)
   ```
   color: #1f2937;
   ```

28. **HEX_6**: `#6b7280` (라인 468)
   ```
   color: #6b7280;
   ```

29. **HEX_6**: `#f3f4f6` (라인 488)
   ```
   background: #f3f4f6;
   ```

30. **HEX_6**: `#6b7280` (라인 489)
   ```
   color: #6b7280;
   ```

31. **HEX_6**: `#2563eb` (라인 502)
   ```
   background: #2563eb;
   ```

32. **HEX_6**: `#1f2937` (라인 514)
   ```
   color: #1f2937;
   ```

33. **HEX_6**: `#6b7280` (라인 521)
   ```
   color: #6b7280;
   ```

34. **HEX_6**: `#2563eb` (라인 551)
   ```
   background: #2563eb;
   ```

35. **HEX_6**: `#6b7280` (라인 555)
   ```
   background: #6b7280;
   ```

36. **HEX_6**: `#4b5563` (라인 560)
   ```
   background: #4b5563;
   ```

37. **HEX_6**: `#1f2937` (라인 634)
   ```
   color: #1f2937;
   ```

38. **HEX_6**: `#6b7280` (라인 644)
   ```
   color: #6b7280;
   ```

39. **HEX_6**: `#374151` (라인 675)
   ```
   color: #374151;
   ```

40. **HEX_6**: `#f0f9ff` (라인 677)
   ```
   background: #f0f9ff;
   ```

41. **HEX_6**: `#e0f2fe` (라인 680)
   ```
   border: 1px solid #e0f2fe;
   ```

42. **HEX_6**: `#374151` (라인 720)
   ```
   color: #374151;
   ```

43. **HEX_6**: `#f0f9ff` (라인 722)
   ```
   background: #f0f9ff;
   ```

44. **HEX_6**: `#e0f2fe` (라인 725)
   ```
   border: 1px solid #e0f2fe;
   ```

45. **HEX_6**: `#9ca3af` (라인 760)
   ```
   color: #9ca3af;
   ```

46. **HEX_6**: `#6b7280` (라인 776)
   ```
   color: #6b7280;
   ```

47. **HEX_6**: `#374151` (라인 782)
   ```
   color: #374151;
   ```

48. **HEX_6**: `#2563eb` (라인 814)
   ```
   background: #2563eb;
   ```

49. **HEX_6**: `#dc2626` (라인 825)
   ```
   background: #dc2626;
   ```

50. **HEX_6**: `#dc2626` (라인 831)
   ```
   background: #dc2626;
   ```

51. **HEX_6**: `#6b7280` (라인 838)
   ```
   color: #6b7280;
   ```

52. **HEX_6**: `#3D5246` (라인 1153)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

53. **HEX_6**: `#2C2C2C` (라인 1159)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

54. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 191)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

55. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 233)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

56. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 441)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

57. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 623)
   ```
   box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
   ```

58. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 816)
   ```
   box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
   ```

59. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 827)
   ```
   box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantClientList.css` (CSS)

**하드코딩 색상**: 56개

1. **HEX_6**: `#f0f9ff` (라인 21)
   ```
   background: var(--mg-v2-color-info-50, #f0f9ff);
   ```

2. **HEX_6**: `#bae6fd` (라인 22)
   ```
   border: 1px solid var(--mg-v2-color-info-200, #bae6fd);
   ```

3. **HEX_6**: `#0369a1` (라인 23)
   ```
   color: var(--mg-v2-color-info-700, #0369a1);
   ```

4. **HEX_6**: `#5C6B61` (라인 53)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

5. **HEX_6**: `#F5F3EF` (라인 61)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

6. **HEX_6**: `#D4CFC8` (라인 62)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

7. **HEX_6**: `#2C2C2C` (라인 66)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

8. **HEX_6**: `#5C6B61` (라인 71)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

9. **HEX_6**: `#3D5246` (라인 76)
   ```
   border-color: var(--mg-color-primary-main, #3D5246);
   ```

10. **HEX_6**: `#5C6B61` (라인 92)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

11. **HEX_6**: `#D4CFC8` (라인 109)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

12. **HEX_6**: `#F5F3EF` (라인 110)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

13. **HEX_6**: `#2C2C2C` (라인 111)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

14. **HEX_6**: `#FAF9F7` (라인 121)
   ```
   background: var(--mg-color-background-main, #FAF9F7);
   ```

15. **HEX_6**: `#3D5246` (라인 122)
   ```
   border-color: var(--mg-color-primary-main, #3D5246);
   ```

16. **HEX_6**: `#F5F3EF` (라인 171)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

17. **HEX_6**: `#D4CFC8` (라인 172)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

18. **HEX_6**: `#3D5246` (라인 190)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

19. **HEX_6**: `#3D5246` (라인 195)
   ```
   border-color: var(--mg-color-primary-main, #3D5246);
   ```

20. **HEX_6**: `#D4CFC8` (라인 207)
   ```
   border-bottom: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

21. **HEX_6**: `#3D5246` (라인 221)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

22. **HEX_6**: `#FAF9F7` (라인 222)
   ```
   color: var(--mg-color-background-main, #FAF9F7);
   ```

23. **HEX_6**: `#2C2C2C` (라인 235)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

24. **HEX_6**: `#2C2C2C` (라인 265)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

25. **HEX_6**: `#5C6B61` (라인 271)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

26. **HEX_6**: `#FAF9F7` (라인 277)
   ```
   background: var(--mg-color-background-main, #FAF9F7);
   ```

27. **HEX_6**: `#D4CFC8` (라인 278)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

28. **HEX_6**: `#2C2C2C` (라인 287)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

29. **HEX_6**: `#3D5246` (라인 297)
   ```
   color: var(--mg-color-primary-main, #3D5246);
   ```

30. **HEX_6**: `#2C2C2C` (라인 313)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

31. **HEX_6**: `#5C6B61` (라인 320)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

32. **HEX_6**: `#3D5246` (라인 324)
   ```
   color: var(--mg-color-primary-main, #3D5246);
   ```

33. **HEX_6**: `#16a34a` (라인 328)
   ```
   color: var(--mg-v2-color-success-600, #16a34a);
   ```

34. **HEX_6**: `#d97706` (라인 332)
   ```
   color: var(--mg-v2-color-warning-600, #d97706);
   ```

35. **HEX_6**: `#D4CFC8` (라인 338)
   ```
   border-top: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

36. **HEX_6**: `#FAF9F7` (라인 342)
   ```
   background: var(--mg-color-background-main, #FAF9F7);
   ```

37. **HEX_6**: `#3D5246` (라인 348)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

38. **HEX_6**: `#FAF9F7` (라인 349)
   ```
   color: var(--mg-color-background-main, #FAF9F7);
   ```

39. **HEX_6**: `#4A6354` (라인 363)
   ```
   background: var(--mg-color-primary-light, #4A6354);
   ```

40. **HEX_6**: `#d1d5db` (라인 367)
   ```
   background: var(--mg-v2-color-secondary-300, #d1d5db);
   ```

41. **HEX_6**: `#6b7280` (라인 368)
   ```
   color: var(--mg-v2-color-secondary-500, #6b7280);
   ```

42. **HEX_6**: `#3D5246` (라인 378)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

43. **HEX_6**: `#FAF9F7` (라인 379)
   ```
   color: var(--mg-color-background-main, #FAF9F7);
   ```

44. **HEX_6**: `#4A6354` (라인 390)
   ```
   background: var(--mg-color-primary-light, #4A6354);
   ```

45. **HEX_6**: `#d1d5db` (라인 394)
   ```
   background: var(--mg-v2-color-secondary-300, #d1d5db);
   ```

46. **HEX_6**: `#6b7280` (라인 395)
   ```
   color: var(--mg-v2-color-secondary-500, #6b7280);
   ```

47. **HEX_6**: `#9ca3af` (라인 417)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

48. **HEX_6**: `#2C2C2C` (라인 425)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

49. **HEX_6**: `#5C6B61` (라인 433)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

50. **HEX_6**: `#fef2f2` (라인 439)
   ```
   background: var(--mg-v2-color-error-50, #fef2f2);
   ```

51. **HEX_6**: `#fecaca` (라인 440)
   ```
   border: 1px solid var(--mg-v2-color-error-200, #fecaca);
   ```

52. **HEX_6**: `#dc2626` (라인 449)
   ```
   color: var(--mg-v2-color-error-600, #dc2626);
   ```

53. **HEX_6**: `#b91c1c` (라인 456)
   ```
   color: var(--mg-v2-color-error-700, #b91c1c);
   ```

54. **RGBA**: `rgba(61, 82, 70, 0.1)` (라인 77)
   ```
   box-shadow: 0 0 0 3px rgba(61, 82, 70, 0.1);
   ```

55. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 177)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

56. **RGBA**: `rgba(0, 0, 0, 0.1)` (라인 196)
   ```
   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
   ```

---

### 📁 `frontend/src/components/ops/PgApprovalManagement.css` (CSS)

**하드코딩 색상**: 54개

1. **HEX_3**: `#666` (라인 30)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#999` (라인 54)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

3. **HEX_3**: `#999` (라인 67)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

4. **HEX_3**: `#666` (라인 129)
   ```
   color: var(--mg-text-secondary, #666);
   ```

5. **HEX_3**: `#999` (라인 151)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

6. **HEX_3**: `#666` (라인 164)
   ```
   color: var(--mg-text-secondary, #666);
   ```

7. **HEX_3**: `#666` (라인 257)
   ```
   color: var(--mg-text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 361)
   ```
   color: var(--mg-text-secondary, #666);
   ```

9. **HEX_3**: `#666` (라인 426)
   ```
   color: var(--mg-text-secondary, #666);
   ```

10. **HEX_3**: `#999` (라인 442)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

11. **HEX_3**: `#999` (라인 534)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

12. **HEX_3**: `#666` (라인 586)
   ```
   color: var(--mg-text-secondary, #666);
   ```

13. **HEX_3**: `#666` (라인 639)
   ```
   color: var(--mg-text-secondary, #666);
   ```

14. **HEX_3**: `#666` (라인 662)
   ```
   color: var(--mg-text-secondary, #666);
   ```

15. **HEX_6**: `#1a1a1a` (라인 25)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

16. **HEX_6**: `#1a1a1a` (라인 63)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

17. **HEX_6**: `#1a1a1a` (라인 82)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

18. **HEX_6**: `#4a90e2` (라인 88)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

19. **HEX_6**: `#1a1a1a` (라인 98)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

20. **HEX_6**: `#4a90e2` (라인 105)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

21. **HEX_6**: `#fff3cd` (라인 114)
   ```
   background: #fff3cd;
   ```

22. **HEX_6**: `#856404` (라인 117)
   ```
   color: #856404;
   ```

23. **HEX_6**: `#1a1a1a` (라인 159)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

24. **HEX_6**: `#4a90e2` (라인 187)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

25. **HEX_6**: `#1a1a1a` (라인 207)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

26. **HEX_6**: `#fff3cd` (라인 229)
   ```
   background: #fff3cd;
   ```

27. **HEX_6**: `#856404` (라인 230)
   ```
   color: #856404;
   ```

28. **HEX_6**: `#d1ecf1` (라인 234)
   ```
   background: #d1ecf1;
   ```

29. **HEX_6**: `#0c5460` (라인 235)
   ```
   color: #0c5460;
   ```

30. **HEX_6**: `#1a1a1a` (라인 262)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

31. **HEX_6**: `#d4edda` (라인 290)
   ```
   background: #d4edda;
   ```

32. **HEX_6**: `#155724` (라인 291)
   ```
   color: #155724;
   ```

33. **HEX_6**: `#f8d7da` (라인 295)
   ```
   background: #f8d7da;
   ```

34. **HEX_6**: `#721c24` (라인 296)
   ```
   color: #721c24;
   ```

35. **HEX_6**: `#1a1a1a` (라인 395)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

36. **HEX_6**: `#1a1a1a` (라인 431)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

37. **HEX_6**: `#d4edda` (라인 457)
   ```
   background: #d4edda;
   ```

38. **HEX_6**: `#155724` (라인 458)
   ```
   color: #155724;
   ```

39. **HEX_6**: `#f8d7da` (라인 462)
   ```
   background: #f8d7da;
   ```

40. **HEX_6**: `#721c24` (라인 463)
   ```
   color: #721c24;
   ```

41. **HEX_6**: `#4a90e2` (라인 485)
   ```
   accent-color: var(--mg-primary, #4a90e2);
   ```

42. **HEX_6**: `#1a1a1a` (라인 498)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

43. **HEX_6**: `#1a1a1a` (라인 521)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

44. **HEX_6**: `#4a90e2` (라인 528)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

45. **HEX_6**: `#1a1a1a` (라인 564)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

46. **HEX_6**: `#1a1a1a` (라인 593)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

47. **HEX_6**: `#4a90e2` (라인 604)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

48. **HEX_6**: `#1a1a1a` (라인 620)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

49. **HEX_6**: `#1a1a1a` (라인 681)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

50. **HEX_6**: `#4a90e2` (라인 687)
   ```
   background: var(--mg-primary, #4a90e2);
   ```

51. **HEX_6**: `#357abd` (라인 697)
   ```
   background: #357abd;
   ```

52. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 89)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

53. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 331)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

54. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 529)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

---

### 📁 `frontend/src/components/test/UnifiedHeaderTest.js` (JS)

**하드코딩 색상**: 46개

1. **HEX_3**: `#ddd` (라인 52)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

2. **HEX_3**: `#ddd` (라인 53)
   ```
   style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
   ```

3. **HEX_3**: `#ddd` (라인 68)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

4. **HEX_3**: `#ddd` (라인 69)
   ```
   style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
   ```

5. **HEX_6**: `#1f2937` (라인 126)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

6. **HEX_6**: `#1f2937` (라인 127)
   ```
   <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
   ```

7. **HEX_6**: `#374151` (라인 132)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

8. **HEX_6**: `#374151` (라인 133)
   ```
   <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

9. **HEX_6**: `#6b7280` (라인 136)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

10. **HEX_6**: `#6b7280` (라인 137)
   ```
   <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', marginBottom: '16px' }}>
   ```

11. **HEX_6**: `#6b7280` (라인 140)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

12. **HEX_6**: `#6b7280` (라인 141)
   ```
   <ul style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', paddingLeft: '20px' }}>
   ```

13. **HEX_6**: `#374151` (라인 151)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

14. **HEX_6**: `#374151` (라인 152)
   ```
   <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

15. **HEX_6**: `#e5e7eb` (라인 156)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

16. **HEX_6**: `#f9fafb` (라인 157)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f9fafb -> var(--mg-custom-f9fafb)
   ```

17. **HEX_6**: `#f9fafb` (라인 158)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

18. **HEX_6**: `#e5e7eb` (라인 158)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

19. **HEX_6**: `#6b7280` (라인 160)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

20. **HEX_6**: `#6b7280` (라인 161)
   ```
   <p style={{ fontSize: '14px', color: '#6b7280' }}>표준 높이와 패딩</p>
   ```

21. **HEX_6**: `#e5e7eb` (라인 163)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

22. **HEX_6**: `#f9fafb` (라인 164)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f9fafb -> var(--mg-custom-f9fafb)
   ```

23. **HEX_6**: `#f9fafb` (라인 165)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

24. **HEX_6**: `#e5e7eb` (라인 165)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

25. **HEX_6**: `#6b7280` (라인 167)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

26. **HEX_6**: `#6b7280` (라인 168)
   ```
   <p style={{ fontSize: '14px', color: '#6b7280' }}>작은 높이와 패딩</p>
   ```

27. **HEX_6**: `#e5e7eb` (라인 170)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

28. **HEX_6**: `#f9fafb` (라인 171)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f9fafb -> var(--mg-custom-f9fafb)
   ```

29. **HEX_6**: `#f9fafb` (라인 172)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

30. **HEX_6**: `#e5e7eb` (라인 172)
   ```
   <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
   ```

31. **HEX_6**: `#6b7280` (라인 174)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

32. **HEX_6**: `#6b7280` (라인 175)
   ```
   <p style={{ fontSize: '14px', color: '#6b7280' }}>투명 배경과 테두리</p>
   ```

33. **HEX_6**: `#374151` (라인 181)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

34. **HEX_6**: `#374151` (라인 182)
   ```
   <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

35. **HEX_6**: `#6b7280` (라인 185)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

36. **HEX_6**: `#6b7280` (라인 186)
   ```
   <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6b7280', marginBottom: '16px' }}>
   ```

37. **HEX_6**: `#e5e7eb` (라인 192)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e5e7eb -> var(--mg-custom-e5e7eb)
   ```

38. **HEX_6**: `#f3f4f6` (라인 193)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f3f4f6 -> var(--mg-custom-f3f4f6)
   ```

39. **HEX_6**: `#f3f4f6` (라인 194)
   ```
   <div style={{ height: '200vh', background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)', margin: '0 -20px', padding: '40px 20px' }}>
   ```

40. **HEX_6**: `#e5e7eb` (라인 194)
   ```
   <div style={{ height: '200vh', background: 'linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)', margin: '0 -20px', padding: '40px 20px' }}>
   ```

41. **HEX_6**: `#374151` (라인 196)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #374151 -> var(--mg-custom-374151)
   ```

42. **HEX_6**: `#374151` (라인 197)
   ```
   <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
   ```

43. **HEX_6**: `#6b7280` (라인 200)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

44. **HEX_6**: `#6b7280` (라인 201)
   ```
   <p style={{ fontSize: '18px', color: '#6b7280' }}>
   ```

45. **RGBA**: `rgba(0,0,0,0.1)` (라인 39)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
   ```

46. **RGBA**: `rgba(0,0,0,0.1)` (라인 40)
   ```
   boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
   ```

---

### 📁 `frontend/src/components/tenant/PgConfigurationDetail.css` (CSS)

**하드코딩 색상**: 43개

1. **HEX_3**: `#666` (라인 146)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#666` (라인 203)
   ```
   color: var(--mg-text-secondary, #666);
   ```

3. **HEX_3**: `#666` (라인 226)
   ```
   color: var(--mg-text-secondary, #666);
   ```

4. **HEX_3**: `#999` (라인 269)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

5. **HEX_3**: `#666` (라인 317)
   ```
   color: var(--mg-text-secondary, #666);
   ```

6. **HEX_3**: `#666` (라인 358)
   ```
   color: var(--mg-text-secondary, #666);
   ```

7. **HEX_3**: `#666` (라인 363)
   ```
   color: var(--mg-text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 382)
   ```
   color: var(--mg-text-secondary, #666);
   ```

9. **HEX_3**: `#666` (라인 432)
   ```
   color: var(--mg-text-secondary, #666);
   ```

10. **HEX_6**: `#1a1a1a` (라인 56)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

11. **HEX_6**: `#d4edda` (라인 83)
   ```
   background: #d4edda;
   ```

12. **HEX_6**: `#155724` (라인 84)
   ```
   color: #155724;
   ```

13. **HEX_6**: `#fff3cd` (라인 88)
   ```
   background: #fff3cd;
   ```

14. **HEX_6**: `#856404` (라인 89)
   ```
   color: #856404;
   ```

15. **HEX_6**: `#f8d7da` (라인 93)
   ```
   background: #f8d7da;
   ```

16. **HEX_6**: `#721c24` (라인 94)
   ```
   color: #721c24;
   ```

17. **HEX_6**: `#e2e3e5` (라인 98)
   ```
   background: #e2e3e5;
   ```

18. **HEX_6**: `#383d41` (라인 99)
   ```
   color: #383d41;
   ```

19. **HEX_6**: `#d1ecf1` (라인 103)
   ```
   background: #d1ecf1;
   ```

20. **HEX_6**: `#0c5460` (라인 104)
   ```
   color: #0c5460;
   ```

21. **HEX_6**: `#1a1a1a` (라인 120)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

22. **HEX_6**: `#1a1a1a` (라인 153)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

23. **HEX_6**: `#4a90e2` (라인 164)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

24. **HEX_6**: `#1a1a1a` (라인 185)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

25. **HEX_6**: `#1a1a1a` (라인 245)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

26. **HEX_6**: `#4a90e2` (라인 251)
   ```
   background: var(--mg-primary, #4a90e2);
   ```

27. **HEX_6**: `#357abd` (라인 261)
   ```
   background: #357abd;
   ```

28. **HEX_6**: `#1a1a1a` (라인 325)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

29. **HEX_6**: `#4a90e2` (라인 340)
   ```
   border-left: 3px solid var(--mg-primary, #4a90e2);
   ```

30. **HEX_6**: `#1a1a1a` (라인 352)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

31. **HEX_6**: `#1a1a1a` (라인 369)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

32. **HEX_6**: `#1a1a1a` (라인 453)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

33. **HEX_6**: `#fff3cd` (라인 485)
   ```
   background: #fff3cd;
   ```

34. **HEX_6**: `#856404` (라인 490)
   ```
   color: #856404;
   ```

35. **HEX_6**: `#d4edda` (라인 495)
   ```
   background: #d4edda;
   ```

36. **HEX_6**: `#155724` (라인 500)
   ```
   color: #155724;
   ```

37. **HEX_6**: `#f8d7da` (라인 505)
   ```
   background: #f8d7da;
   ```

38. **HEX_6**: `#721c24` (라인 510)
   ```
   color: #721c24;
   ```

39. **HEX_6**: `#856404` (라인 524)
   ```
   color: #856404;
   ```

40. **HEX_6**: `#856404` (라인 534)
   ```
   color: #856404;
   ```

41. **HEX_6**: `#4a90e2` (라인 544)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

42. **HEX_6**: `#4a90e2` (라인 549)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

43. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 410)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/clinical/RiskAlertBadge.css` (CSS)

**하드코딩 색상**: 43개

1. **HEX_6**: `#e5e7eb` (라인 9)
   ```
   border: 2px solid #e5e7eb;
   ```

2. **HEX_6**: `#e5e7eb` (라인 88)
   ```
   border-bottom: 2px solid #e5e7eb;
   ```

3. **HEX_6**: `#fee2e2` (라인 89)
   ```
   background: linear-gradient(135deg, #fee2e2, #fef3c7);
   ```

4. **HEX_6**: `#fef3c7` (라인 89)
   ```
   background: linear-gradient(135deg, #fee2e2, #fef3c7);
   ```

5. **HEX_6**: `#991b1b` (라인 96)
   ```
   color: #991b1b;
   ```

6. **HEX_6**: `#e5e7eb` (라인 133)
   ```
   border: 3px solid #e5e7eb;
   ```

7. **HEX_6**: `#2563eb` (라인 134)
   ```
   border-top-color: #2563eb;
   ```

8. **HEX_6**: `#6b7280` (라인 147)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#e5e7eb` (라인 162)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

10. **HEX_6**: `#f9fafb` (라인 168)
   ```
   background: #f9fafb;
   ```

11. **HEX_6**: `#fef3c7` (라인 172)
   ```
   background: #fef3c7;
   ```

12. **HEX_6**: `#fde68a` (라인 176)
   ```
   background: #fde68a;
   ```

13. **HEX_6**: `#fee2e2` (라인 194)
   ```
   background: #fee2e2;
   ```

14. **HEX_6**: `#991b1b` (라인 195)
   ```
   color: #991b1b;
   ```

15. **HEX_6**: `#fed7aa` (라인 199)
   ```
   background: #fed7aa;
   ```

16. **HEX_6**: `#9a3412` (라인 200)
   ```
   color: #9a3412;
   ```

17. **HEX_6**: `#fef3c7` (라인 204)
   ```
   background: #fef3c7;
   ```

18. **HEX_6**: `#92400e` (라인 205)
   ```
   color: #92400e;
   ```

19. **HEX_6**: `#dbeafe` (라인 209)
   ```
   background: #dbeafe;
   ```

20. **HEX_6**: `#1e40af` (라인 210)
   ```
   color: #1e40af;
   ```

21. **HEX_6**: `#6b7280` (라인 215)
   ```
   color: #6b7280;
   ```

22. **HEX_6**: `#1f2937` (라인 225)
   ```
   color: #1f2937;
   ```

23. **HEX_6**: `#4b5563` (라인 231)
   ```
   color: #4b5563;
   ```

24. **HEX_6**: `#991b1b` (라인 236)
   ```
   color: #991b1b;
   ```

25. **HEX_6**: `#dc2626` (라인 241)
   ```
   color: #dc2626;
   ```

26. **HEX_6**: `#f0f9ff` (라인 246)
   ```
   background: #f0f9ff;
   ```

27. **HEX_6**: `#2563eb` (라인 247)
   ```
   border-left: 3px solid #2563eb;
   ```

28. **HEX_6**: `#1e40af` (라인 256)
   ```
   color: #1e40af;
   ```

29. **HEX_6**: `#1e3a8a` (라인 263)
   ```
   color: #1e3a8a;
   ```

30. **HEX_6**: `#6b7280` (라인 272)
   ```
   color: #6b7280;
   ```

31. **HEX_6**: `#059669` (라인 280)
   ```
   color: #059669;
   ```

32. **HEX_6**: `#e5e7eb` (라인 285)
   ```
   border-top: 1px solid #e5e7eb;
   ```

33. **HEX_6**: `#f9fafb` (라인 286)
   ```
   background: #f9fafb;
   ```

34. **HEX_6**: `#d1d5db` (라인 293)
   ```
   border: 1px solid #d1d5db;
   ```

35. **HEX_6**: `#374151` (라인 297)
   ```
   color: #374151;
   ```

36. **HEX_6**: `#2563eb` (라인 304)
   ```
   border-color: #2563eb;
   ```

37. **HEX_6**: `#2563eb` (라인 305)
   ```
   color: #2563eb;
   ```

38. **RGBA**: `rgba(245, 158, 11, 0.3)` (라인 22)
   ```
   box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
   ```

39. **RGBA**: `rgba(239, 68, 68, 0.4)` (라인 32)
   ```
   box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
   ```

40. **RGBA**: `rgba(239, 68, 68, 0)` (라인 35)
   ```
   box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
   ```

41. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 55)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

42. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 64)
   ```
   background: rgba(0, 0, 0, 0.3);
   ```

43. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 76)
   ```
   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/auth/AuthPageCommon.css` (CSS)

**하드코딩 색상**: 42개

1. **HEX_6**: `#FAF9F7` (라인 10)
   ```
   background-color: var(--mg-bg-primary, #FAF9F7);
   ```

2. **HEX_6**: `#FAF9F7` (라인 59)
   ```
   background-color: var(--mg-bg-primary, #FAF9F7);
   ```

3. **HEX_6**: `#1A1A1A` (라인 75)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

4. **HEX_6**: `#666666` (라인 81)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

5. **HEX_6**: `#E53E3E` (라인 126)
   ```
   color: #E53E3E;
   ```

6. **HEX_6**: `#3D5246` (라인 132)
   ```
   color: var(--mg-primary-color, #3D5246);
   ```

7. **HEX_6**: `#1A1A1A` (라인 141)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

8. **HEX_6**: `#1A1A1A` (라인 149)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

9. **HEX_6**: `#6B7280` (라인 156)
   ```
   color: var(--mg-text-secondary, #6B7280);
   ```

10. **HEX_6**: `#F5F3EF` (라인 163)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

11. **HEX_6**: `#D4CFC8` (라인 164)
   ```
   border: 1px solid var(--mg-border-color, #D4CFC8);
   ```

12. **HEX_6**: `#1A1A1A` (라인 167)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

13. **HEX_6**: `#3D5246` (라인 177)
   ```
   border-color: var(--mg-primary-color, #3D5246);
   ```

14. **HEX_6**: `#E53E3E` (라인 183)
   ```
   border-color: #E53E3E;
   ```

15. **HEX_6**: `#EBE9E4` (라인 188)
   ```
   background-color: var(--mg-surface-secondary, #EBE9E4);
   ```

16. **HEX_6**: `#F5F3EF` (라인 193)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

17. **HEX_6**: `#D4CFC8` (라인 194)
   ```
   border: 1px solid var(--mg-border-color, #D4CFC8);
   ```

18. **HEX_6**: `#1A1A1A` (라인 197)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

19. **HEX_6**: `#3D5246` (라인 207)
   ```
   border-color: var(--mg-primary-color, #3D5246);
   ```

20. **HEX_6**: `#EBE9E4` (라인 212)
   ```
   background-color: var(--mg-surface-secondary, #EBE9E4);
   ```

21. **HEX_6**: `#E53E3E` (라인 218)
   ```
   color: #E53E3E;
   ```

22. **HEX_6**: `#666666` (라인 237)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

23. **HEX_6**: `#3D5246` (라인 249)
   ```
   accent-color: var(--mg-primary-color, #3D5246);
   ```

24. **HEX_6**: `#1A1A1A` (라인 258)
   ```
   color: var(--mg-text-primary, #1A1A1A);
   ```

25. **HEX_6**: `#3D5246` (라인 263)
   ```
   color: var(--mg-primary-color, #3D5246);
   ```

26. **HEX_6**: `#3D5246` (라인 269)
   ```
   background-color: var(--mg-primary-color, #3D5246);
   ```

27. **HEX_6**: `#4F6B5A` (라인 287)
   ```
   background-color: var(--mg-primary-light, #4F6B5A);
   ```

28. **HEX_6**: `#3D5246` (라인 297)
   ```
   color: var(--mg-primary-color, #3D5246);
   ```

29. **HEX_6**: `#3D5246` (라인 298)
   ```
   border: 1px solid var(--mg-primary-color, #3D5246);
   ```

30. **HEX_6**: `#666666` (라인 319)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

31. **HEX_6**: `#3D5246` (라인 328)
   ```
   color: var(--mg-primary-color, #3D5246);
   ```

32. **HEX_6**: `#3D5246` (라인 338)
   ```
   color: var(--mg-primary-color, #3D5246);
   ```

33. **HEX_6**: `#48bb78` (라인 381)
   ```
   background-color: #48bb78;
   ```

34. **HEX_6**: `#666666` (라인 392)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

35. **HEX_6**: `#F5F3EF` (라인 397)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

36. **HEX_6**: `#D4CFC8` (라인 398)
   ```
   border: 1px solid var(--mg-border-color, #D4CFC8);
   ```

37. **HEX_6**: `#666666` (라인 403)
   ```
   color: var(--mg-text-secondary, #666666);
   ```

38. **RGBA**: `rgba(44, 44, 44, 0.5)` (라인 30)
   ```
   background: rgba(44, 44, 44, 0.5);
   ```

39. **RGBA**: `rgba(61, 82, 70, 0.1)` (라인 178)
   ```
   box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1);
   ```

40. **RGBA**: `rgba(61, 82, 70, 0.1)` (라인 208)
   ```
   box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1);
   ```

41. **RGBA**: `rgba(61, 82, 70, 0.05)` (라인 314)
   ```
   background-color: rgba(61, 82, 70, 0.05);
   ```

42. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 357)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantMessageScreen.js` (JS)

**하드코딩 색상**: 42개

1. **HEX_6**: `#e9ecef` (라인 64)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

2. **HEX_6**: `#e9ecef` (라인 65)
   ```
   border: '1px solid #e9ecef'
   ```

3. **HEX_6**: `#2c3e50` (라인 70)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
   ```

4. **HEX_6**: `#2c3e50` (라인 71)
   ```
   color: '#2c3e50',
   ```

5. **HEX_6**: `#e9ecef` (라인 90)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

6. **HEX_6**: `#e9ecef` (라인 91)
   ```
   border: '1px solid #e9ecef'
   ```

7. **HEX_6**: `#2c3e50` (라인 96)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
   ```

8. **HEX_6**: `#2c3e50` (라인 97)
   ```
   color: '#2c3e50',
   ```

9. **HEX_6**: `#2c3e50` (라인 122)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
   ```

10. **HEX_6**: `#2c3e50` (라인 123)
   ```
   color: '#2c3e50',
   ```

11. **HEX_6**: `#e9ecef` (라인 133)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

12. **HEX_6**: `#e9ecef` (라인 134)
   ```
   border: '1px solid #e9ecef'
   ```

13. **HEX_6**: `#2c3e50` (라인 139)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
   ```

14. **HEX_6**: `#2c3e50` (라인 140)
   ```
   color: '#2c3e50',
   ```

15. **HEX_6**: `#495057` (라인 159)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

16. **HEX_6**: `#495057` (라인 160)
   ```
   color: '#495057',
   ```

17. **HEX_6**: `#e9ecef` (라인 165)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

18. **HEX_6**: `#e9ecef` (라인 166)
   ```
   border: '2px solid #e9ecef',
   ```

19. **HEX_6**: `#e9ecef` (라인 175)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

20. **HEX_6**: `#e9ecef` (라인 176)
   ```
   border: '2px solid #e9ecef',
   ```

21. **HEX_6**: `#e9ecef` (라인 188)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

22. **HEX_6**: `#e9ecef` (라인 189)
   ```
   border: '2px solid #e9ecef',
   ```

23. **HEX_6**: `#495057` (라인 221)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

24. **HEX_6**: `#495057` (라인 222)
   ```
   color: '#495057',
   ```

25. **HEX_6**: `#e9ecef` (라인 232)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

26. **HEX_6**: `#e9ecef` (라인 233)
   ```
   border: '2px solid #e9ecef',
   ```

27. **HEX_6**: `#f8f9ff` (라인 243)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8f9ff -> var(--mg-custom-f8f9ff)
   ```

28. **HEX_6**: `#f8f9ff` (라인 244)
   ```
   backgroundColor: '#f8f9ff'
   ```

29. **HEX_6**: `#495057` (라인 253)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

30. **HEX_6**: `#495057` (라인 254)
   ```
   color: '#495057'
   ```

31. **HEX_6**: `#e9ecef` (라인 262)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

32. **HEX_6**: `#e9ecef` (라인 263)
   ```
   borderTop: '1px solid #e9ecef'
   ```

33. **RGBA**: `rgba(0,0,0,0.1)` (라인 62)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
   ```

34. **RGBA**: `rgba(0,0,0,0.1)` (라인 63)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

35. **RGBA**: `rgba(0,0,0,0.1)` (라인 88)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
   ```

36. **RGBA**: `rgba(0,0,0,0.1)` (라인 89)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

37. **RGBA**: `rgba(0,0,0,0.1)` (라인 131)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
   ```

38. **RGBA**: `rgba(0,0,0,0.1)` (라인 132)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

39. **RGBA**: `rgba(0,123,255,0.1)` (라인 199)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,123,255,0.1) -> var(--mg-custom-color)
   ```

40. **RGBA**: `rgba(0,123,255,0.1)` (라인 200)
   ```
   boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
   ```

41. **RGBA**: `rgba(0,0,0,0.5)` (라인 298)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.5) -> var(--mg-custom-color)
   ```

42. **RGBA**: `rgba(0,0,0,0.5)` (라인 299)
   ```
   backgroundColor: 'rgba(0,0,0,0.5)',
   ```

---

### 📁 `frontend/src/components/homepage/Homepage.css` (CSS)

**하드코딩 색상**: 41개

1. **HEX_6**: `#FAF9F7` (라인 6)
   ```
   background-color: var(--mg-color-background-base, #FAF9F7);
   ```

2. **HEX_6**: `#2C2C2C` (라인 29)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

3. **HEX_6**: `#2C2C2C` (라인 33)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

4. **HEX_6**: `#3D5246` (라인 70)
   ```
   background-color: var(--mg-color-primary-base, #3D5246);
   ```

5. **HEX_6**: `#2C2C2C` (라인 81)
   ```
   background-color: var(--mg-color-primary-dark, #2C2C2C);
   ```

6. **HEX_6**: `#3D5246` (라인 85)
   ```
   background-color: var(--mg-color-primary-base, #3D5246);
   ```

7. **HEX_6**: `#2C2C2C` (라인 96)
   ```
   background-color: var(--mg-color-primary-dark, #2C2C2C);
   ```

8. **HEX_6**: `#2C2C2C` (라인 102)
   ```
   color: var(--mg-color-primary-dark, #2C2C2C);
   ```

9. **HEX_6**: `#F0F0F0` (라인 112)
   ```
   background-color: #F0F0F0;
   ```

10. **HEX_6**: `#3D5246` (라인 119)
   ```
   color: var(--mg-color-primary-base, #3D5246);
   ```

11. **HEX_6**: `#2C2C2C` (라인 230)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

12. **HEX_6**: `#2C2C2C` (라인 286)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

13. **HEX_6**: `#5C6B61` (라인 292)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

14. **HEX_6**: `#7A9082` (라인 319)
   ```
   color: var(--mg-color-primary-light, #7A9082);
   ```

15. **HEX_6**: `#2C2C2C` (라인 327)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

16. **HEX_6**: `#5C6B61` (라인 335)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

17. **HEX_6**: `#2C2C2C` (라인 342)
   ```
   background-color: var(--mg-color-primary-dark, #2C2C2C);
   ```

18. **HEX_6**: `#FAF9F7` (라인 355)
   ```
   background-color: var(--mg-color-background-base, #FAF9F7);
   ```

19. **HEX_6**: `#8A9A90` (라인 365)
   ```
   color: var(--mg-color-text-tertiary, #8A9A90);
   ```

20. **HEX_6**: `#8A9A90` (라인 372)
   ```
   color: var(--mg-color-text-tertiary, #8A9A90);
   ```

21. **HEX_6**: `#2C2C2C` (라인 434)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

22. **HEX_6**: `#2C2C2C` (라인 480)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

23. **HEX_6**: `#FAF9F7` (라인 486)
   ```
   background-color: var(--mg-color-background-base, #FAF9F7);
   ```

24. **HEX_6**: `#2C2C2C` (라인 498)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

25. **HEX_6**: `#5C6B61` (라인 504)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

26. **HEX_6**: `#D32F2F` (라인 508)
   ```
   color: #D32F2F;
   ```

27. **HEX_6**: `#2C2C2C` (라인 524)
   ```
   color: var(--mg-color-text-primary, #2C2C2C);
   ```

28. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 23)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

29. **RGBA**: `rgba(0,0,0,0.05)` (라인 25)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
   ```

30. **RGBA**: `rgba(72, 104, 86, 0.35)` (라인 149)
   ```
   radial-gradient(circle at 20% 20%, rgba(72, 104, 86, 0.35) 0%, rgba(0, 0, 0, 0) 45%),
   ```

31. **RGBA**: `rgba(8, 12, 10, 0.45)` (라인 150)
   ```
   linear-gradient(to bottom, rgba(8, 12, 10, 0.45) 0%, rgba(8, 12, 10, 0.62) 100%);
   ```

32. **RGBA**: `rgba(8, 12, 10, 0.62)` (라인 150)
   ```
   linear-gradient(to bottom, rgba(8, 12, 10, 0.45) 0%, rgba(8, 12, 10, 0.62) 100%);
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 170)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

34. **RGBA**: `rgba(0, 0, 0, 0.35)` (라인 171)
   ```
   text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
   ```

35. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 183)
   ```
   border: 2px solid rgba(255, 255, 255, 0.85);
   ```

36. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 195)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

37. **RGBA**: `rgba(0,0,0,0.1)` (라인 247)
   ```
   box-shadow: var(--mg-shadow-md, 0 4px 6px rgba(0,0,0,0.1));
   ```

38. **RGBA**: `rgba(0,0,0,0.1)` (라인 253)
   ```
   box-shadow: var(--mg-shadow-lg, 0 10px 15px rgba(0,0,0,0.1));
   ```

39. **RGBA**: `rgba(0,0,0,0.05)` (라인 361)
   ```
   border-top: 1px solid rgba(0,0,0,0.05);
   ```

40. **RGBA**: `rgba(0,0,0,0.5)` (라인 442)
   ```
   background: rgba(0,0,0,0.5);
   ```

41. **RGBA**: `rgba(0,0,0,0.1)` (라인 453)
   ```
   box-shadow: -2px 0 8px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/styles/common/tablet-profile-edit.css` (CSS)

**하드코딩 색상**: 39개

1. **HEX_6**: `#f5f7fa` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#DCFCE7` (라인 25)
   ```
   background: #DCFCE7;
   ```

4. **HEX_6**: `#16A34A` (라인 26)
   ```
   color: #16A34A;
   ```

5. **HEX_6**: `#A7F3D0` (라인 30)
   ```
   border: 1px solid #A7F3D0;
   ```

6. **HEX_6**: `#E5E7EB` (라인 42)
   ```
   border-top: 1px solid #E5E7EB;
   ```

7. **HEX_6**: `#7C3AED` (라인 58)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500) 0%, #7C3AED 100%);
   ```

8. **HEX_6**: `#7C3AED` (라인 63)
   ```
   background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
   ```

9. **HEX_6**: `#6D28D9` (라인 63)
   ```
   background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
   ```

10. **HEX_6**: `#6B7280` (라인 69)
   ```
   background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
   ```

11. **HEX_6**: `#4B5563` (라인 69)
   ```
   background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
   ```

12. **HEX_6**: `#4B5563` (라인 74)
   ```
   background: linear-gradient(135deg, #4B5563 0%, #374151 100%);
   ```

13. **HEX_6**: `#374151` (라인 74)
   ```
   background: linear-gradient(135deg, #4B5563 0%, #374151 100%);
   ```

14. **HEX_6**: `#F3F4F6` (라인 79)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

15. **HEX_6**: `#E5E7EB` (라인 79)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

16. **HEX_6**: `#374151` (라인 80)
   ```
   color: #374151;
   ```

17. **HEX_6**: `#D1D5DB` (라인 81)
   ```
   border: 1px solid #D1D5DB;
   ```

18. **HEX_6**: `#E5E7EB` (라인 85)
   ```
   background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
   ```

19. **HEX_6**: `#D1D5DB` (라인 85)
   ```
   background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
   ```

20. **HEX_6**: `#374151` (라인 109)
   ```
   color: #374151;
   ```

21. **HEX_6**: `#E5E7EB` (라인 116)
   ```
   border: 2px solid #E5E7EB;
   ```

22. **HEX_6**: `#F9FAFB` (라인 120)
   ```
   background: #F9FAFB;
   ```

23. **HEX_6**: `#D1D5DB` (라인 153)
   ```
   border: 3px dashed #D1D5DB;
   ```

24. **HEX_6**: `#F9FAFB` (라인 159)
   ```
   background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
   ```

25. **HEX_6**: `#F3F4F6` (라인 159)
   ```
   background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
   ```

26. **HEX_6**: `#F3F4F6` (라인 169)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

27. **HEX_6**: `#E5E7EB` (라인 169)
   ```
   background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
   ```

28. **HEX_6**: `#9CA3AF` (라인 183)
   ```
   color: #9CA3AF;
   ```

29. **HEX_6**: `#DC2626` (라인 196)
   ```
   background: linear-gradient(135deg, var(--mg-error-500) 0%, #DC2626 100%);
   ```

30. **HEX_6**: `#6B7280` (라인 225)
   ```
   color: #6B7280;
   ```

31. **HEX_6**: `#6B7280` (라인 247)
   ```
   color: #6B7280;
   ```

32. **RGBA**: `rgba(139, 92, 246, 0.3)` (라인 65)
   ```
   box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 97)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

34. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 126)
   ```
   box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
   ```

35. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 133)
   ```
   box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
   ```

36. **RGBA**: `rgba(139, 92, 246, 0.2)` (라인 171)
   ```
   box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
   ```

37. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 207)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

38. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 213)
   ```
   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
   ```

39. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 243)
   ```
   text-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/common/MGStats.css` (CSS)

**하드코딩 색상**: 39개

1. **HEX_6**: `#2563eb` (라인 47)
   ```
   color: #2563eb;
   ```

2. **HEX_6**: `#ea580c` (라인 52)
   ```
   color: #ea580c;
   ```

3. **HEX_6**: `#16a34a` (라인 57)
   ```
   color: #16a34a;
   ```

4. **HEX_6**: `#9333ea` (라인 62)
   ```
   color: #9333ea;
   ```

5. **HEX_6**: `#15803d` (라인 78)
   ```
   color: #15803d;
   ```

6. **HEX_6**: `#dc2626` (라인 83)
   ```
   color: #dc2626;
   ```

7. **HEX_6**: `#111827` (라인 105)
   ```
   color: #111827;
   ```

8. **HEX_6**: `#6b7280` (라인 111)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#2563eb` (라인 137)
   ```
   stroke: #2563eb;
   ```

10. **HEX_6**: `#ea580c` (라인 142)
   ```
   stroke: #ea580c;
   ```

11. **HEX_6**: `#16a34a` (라인 147)
   ```
   stroke: #16a34a;
   ```

12. **HEX_6**: `#9333ea` (라인 152)
   ```
   stroke: #9333ea;
   ```

13. **HEX_6**: `#60a5fa` (라인 267)
   ```
   color: #60a5fa;
   ```

14. **HEX_6**: `#fb923c` (라인 272)
   ```
   color: #fb923c;
   ```

15. **HEX_6**: `#4ade80` (라인 277)
   ```
   color: #4ade80;
   ```

16. **HEX_6**: `#a78bfa` (라인 282)
   ```
   color: #a78bfa;
   ```

17. **HEX_6**: `#4ade80` (라인 287)
   ```
   color: #4ade80;
   ```

18. **HEX_6**: `#f87171` (라인 292)
   ```
   color: #f87171;
   ```

19. **HEX_6**: `#f9fafb` (라인 296)
   ```
   color: #f9fafb;
   ```

20. **HEX_6**: `#9ca3af` (라인 300)
   ```
   color: #9ca3af;
   ```

21. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 8)
   ```
   border: 1px solid rgba(226, 232, 240, 0.8);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 10)
   ```
   box-shadow: 0 1px 3px 0 var(--mg-shadow-light), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 15)
   ```
   box-shadow: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

24. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 46)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

25. **RGBA**: `rgba(249, 115, 22, 0.1)` (라인 51)
   ```
   background: rgba(249, 115, 22, 0.1);
   ```

26. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 56)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

27. **RGBA**: `rgba(147, 51, 234, 0.1)` (라인 61)
   ```
   background: rgba(147, 51, 234, 0.1);
   ```

28. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 77)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

29. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 82)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

30. **RGBA**: `rgba(26, 32, 44, 0.95)` (라인 256)
   ```
   background: rgba(26, 32, 44, 0.95);
   ```

31. **RGBA**: `rgba(74, 85, 104, 0.6)` (라인 257)
   ```
   border-color: rgba(74, 85, 104, 0.6);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 258)
   ```
   box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 var(--mg-shadow-medium);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 262)
   ```
   box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px var(--mg-shadow-medium);
   ```

34. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 266)
   ```
   background: rgba(59, 130, 246, 0.2);
   ```

35. **RGBA**: `rgba(249, 115, 22, 0.2)` (라인 271)
   ```
   background: rgba(249, 115, 22, 0.2);
   ```

36. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 276)
   ```
   background: rgba(34, 197, 94, 0.2);
   ```

37. **RGBA**: `rgba(147, 51, 234, 0.2)` (라인 281)
   ```
   background: rgba(147, 51, 234, 0.2);
   ```

38. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 286)
   ```
   background: rgba(34, 197, 94, 0.2);
   ```

39. **RGBA**: `rgba(239, 68, 68, 0.2)` (라인 291)
   ```
   background: rgba(239, 68, 68, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/ModernDashboardEditor.css` (CSS)

**하드코딩 색상**: 38개

1. **HEX_6**: `#dbeafe` (라인 15)
   ```
   --widget-category-common-bg: var(--mg-primary-light, #dbeafe);
   ```

2. **HEX_6**: `#ede9fe` (라인 17)
   ```
   --widget-category-admin-bg: var(--mg-purple-light, #ede9fe);
   ```

3. **HEX_6**: `#fef3c7` (라인 19)
   ```
   --widget-category-consultation-bg: var(--mg-amber-light, #fef3c7);
   ```

4. **HEX_6**: `#d1fae5` (라인 21)
   ```
   --widget-category-academy-bg: var(--mg-emerald-light, #d1fae5);
   ```

5. **HEX_6**: `#fee2e2` (라인 23)
   ```
   --widget-category-erp-bg: var(--mg-red-light, #fee2e2);
   ```

6. **HEX_6**: `#f8fafc` (라인 45)
   ```
   background: var(--mg-bg-gradient-light, linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%));
   ```

7. **HEX_6**: `#f1f5f9` (라인 45)
   ```
   background: var(--mg-bg-gradient-light, linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%));
   ```

8. **HEX_6**: `#764ba2` (라인 61)
   ```
   background: var(--mg-gradient-primary, linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%));
   ```

9. **HEX_6**: `#e5e7eb` (라인 182)
   ```
   border: 1px solid var(--mg-border-color, #e5e7eb); /* 테두리 얇게 */
   ```

10. **HEX_6**: `#f8fafc` (라인 224)
   ```
   background: var(--mg-icon-bg-gradient, linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%));
   ```

11. **HEX_6**: `#e2e8f0` (라인 224)
   ```
   background: var(--mg-icon-bg-gradient, linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%));
   ```

12. **HEX_6**: `#1f2937` (라인 243)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

13. **HEX_6**: `#22c55e` (라인 262)
   ```
   background: linear-gradient(135deg, var(--mg-success, #22c55e), var(--mg-success-dark, #16a34a));
   ```

14. **HEX_6**: `#16a34a` (라인 262)
   ```
   background: linear-gradient(135deg, var(--mg-success, #22c55e), var(--mg-success-dark, #16a34a));
   ```

15. **HEX_6**: `#4ade80` (라인 290)
   ```
   background: var(--mg-gradient-success, linear-gradient(135deg, #4ade80 0%, #22c55e 100%));
   ```

16. **HEX_6**: `#22c55e` (라인 290)
   ```
   background: var(--mg-gradient-success, linear-gradient(135deg, #4ade80 0%, #22c55e 100%));
   ```

17. **HEX_6**: `#fafbfc` (라인 324)
   ```
   background: linear-gradient(135deg, #fafbfc 0%, #f4f6f8 100%);
   ```

18. **HEX_6**: `#f4f6f8` (라인 324)
   ```
   background: linear-gradient(135deg, #fafbfc 0%, #f4f6f8 100%);
   ```

19. **HEX_6**: `#dbeafe` (라인 331)
   ```
   background: var(--mg-drop-zone-bg, linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%));
   ```

20. **HEX_6**: `#bfdbfe` (라인 331)
   ```
   background: var(--mg-drop-zone-bg, linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%));
   ```

21. **HEX_6**: `#6b7280` (라인 358)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

22. **HEX_6**: `#1f2937` (라인 371)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

23. **HEX_6**: `#e5e7eb` (라인 394)
   ```
   border: 2px solid var(--mg-border-color, #e5e7eb);
   ```

24. **HEX_6**: `#6b7280` (라인 431)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

25. **HEX_6**: `#f9fafb` (라인 461)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

26. **HEX_6**: `#1f2937` (라인 476)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

27. **HEX_6**: `#f9fafb` (라인 489)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

28. **HEX_6**: `#9ca3af` (라인 505)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

29. **HEX_6**: `#2563eb` (라인 541)
   ```
   background: var(--mg-info-dark, #2563eb);
   ```

30. **HEX_6**: `#dc2626` (라인 551)
   ```
   background: var(--mg-danger-dark, #dc2626);
   ```

31. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 81)
   ```
   background: var(--mg-input-overlay-bg, rgba(255, 255, 255, 0.2));
   ```

32. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 88)
   ```
   color: var(--mg-placeholder-on-dark, rgba(255, 255, 255, 0.8));
   ```

33. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 99)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-overlay-light, rgba(255, 255, 255, 0.3));
   ```

34. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 111)
   ```
   background: var(--mg-hover-overlay-light, rgba(255, 255, 255, 0.2));
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 217)
   ```
   box-shadow: var(--mg-shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
   ```

36. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 311)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

37. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 341)
   ```
   background: var(--mg-drop-zone-overlay, rgba(59, 130, 246, 0.1));
   ```

38. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 412)
   ```
   box-shadow: var(--mg-shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
   ```

---

### 📁 `frontend/src/components/dashboard-v2/content/ContentKpiRow.css` (CSS)

**하드코딩 색상**: 37개

1. **HEX_6**: `#e2e8f0` (라인 22)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

2. **HEX_6**: `#4b745c` (라인 30)
   ```
   border-left: 4px solid var(--ad-b0kla-green, #4b745c);
   ```

3. **HEX_6**: `#e8a87c` (라인 34)
   ```
   border-left: 4px solid var(--ad-b0kla-orange, #e8a87c);
   ```

4. **HEX_6**: `#6d9dc5` (라인 38)
   ```
   border-left: 4px solid var(--ad-b0kla-blue, #6d9dc5);
   ```

5. **HEX_6**: `#4a5568` (라인 42)
   ```
   border-left: 4px solid var(--ad-b0kla-text-secondary, #4a5568);
   ```

6. **HEX_6**: `#e2e8f0` (라인 56)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

7. **HEX_6**: `#e2e8f0` (라인 71)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

8. **HEX_6**: `#ebf2ee` (라인 97)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

9. **HEX_6**: `#4b745c` (라인 98)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

10. **HEX_6**: `#fcf3ed` (라인 102)
   ```
   background: var(--ad-b0kla-orange-bg, #fcf3ed);
   ```

11. **HEX_6**: `#e8a87c` (라인 103)
   ```
   color: var(--ad-b0kla-orange, #e8a87c);
   ```

12. **HEX_6**: `#f0f5f9` (라인 107)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

13. **HEX_6**: `#6d9dc5` (라인 108)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

14. **HEX_6**: `#edf2f7` (라인 112)
   ```
   background: #edf2f7;
   ```

15. **HEX_6**: `#4a5568` (라인 113)
   ```
   color: #4a5568;
   ```

16. **HEX_6**: `#64748b` (라인 137)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

17. **HEX_6**: `#ebf2ee` (라인 150)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

18. **HEX_6**: `#4b745c` (라인 151)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

19. **HEX_6**: `#fcf3ed` (라인 155)
   ```
   background: var(--ad-b0kla-orange-bg, #fcf3ed);
   ```

20. **HEX_6**: `#e8a87c` (라인 156)
   ```
   color: var(--ad-b0kla-orange, #e8a87c);
   ```

21. **HEX_6**: `#f0f5f9` (라인 160)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

22. **HEX_6**: `#6d9dc5` (라인 161)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

23. **HEX_6**: `#2d3748` (라인 167)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

24. **HEX_6**: `#64748b` (라인 182)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

25. **HEX_6**: `#ebf2ee` (라인 194)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

26. **HEX_6**: `#4b745c` (라인 195)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

27. **HEX_6**: `#fcf3ed` (라인 199)
   ```
   background: var(--ad-b0kla-orange-bg, #fcf3ed);
   ```

28. **HEX_6**: `#e8a87c` (라인 200)
   ```
   color: var(--ad-b0kla-orange, #e8a87c);
   ```

29. **HEX_6**: `#f0f5f9` (라인 204)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

30. **HEX_6**: `#6d9dc5` (라인 205)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

31. **HEX_6**: `#edf2f7` (라인 209)
   ```
   background: #edf2f7;
   ```

32. **HEX_6**: `#4a5568` (라인 210)
   ```
   color: #4a5568;
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 24)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 8px 24px rgba(0, 0, 0, 0.05));
   ```

34. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 46)
   ```
   box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 61)
   ```
   box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
   ```

36. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 72)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 8px 24px rgba(0, 0, 0, 0.05));
   ```

37. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 78)
   ```
   box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
   ```

---

### 📁 `frontend/src/components/clinical/SOAPNoteEditor.css` (CSS)

**하드코딩 색상**: 37개

1. **HEX_6**: `#e5e7eb` (라인 14)
   ```
   border-bottom: 2px solid #e5e7eb;
   ```

2. **HEX_6**: `#1a202c` (라인 21)
   ```
   color: #1a202c;
   ```

3. **HEX_6**: `#dbeafe` (라인 41)
   ```
   background: #dbeafe;
   ```

4. **HEX_6**: `#1e40af` (라인 42)
   ```
   color: #1e40af;
   ```

5. **HEX_6**: `#e0e7ff` (라인 46)
   ```
   background: #e0e7ff;
   ```

6. **HEX_6**: `#4338ca` (라인 47)
   ```
   color: #4338ca;
   ```

7. **HEX_6**: `#d1fae5` (라인 51)
   ```
   background: #d1fae5;
   ```

8. **HEX_6**: `#065f46` (라인 52)
   ```
   color: #065f46;
   ```

9. **HEX_6**: `#fef3c7` (라인 56)
   ```
   background: #fef3c7;
   ```

10. **HEX_6**: `#92400e` (라인 57)
   ```
   color: #92400e;
   ```

11. **HEX_6**: `#d1fae5` (라인 61)
   ```
   background: #d1fae5;
   ```

12. **HEX_6**: `#6ee7b7` (라인 62)
   ```
   border: 1px solid #6ee7b7;
   ```

13. **HEX_6**: `#065f46` (라인 63)
   ```
   color: #065f46;
   ```

14. **HEX_6**: `#e5e7eb` (라인 73)
   ```
   border: 1px solid #e5e7eb;
   ```

15. **HEX_6**: `#2563eb` (라인 80)
   ```
   border-color: #2563eb;
   ```

16. **HEX_6**: `#2563eb` (라인 97)
   ```
   background: linear-gradient(135deg, #2563eb, var(--mg-primary-500));
   ```

17. **HEX_6**: `#1f2937` (라인 107)
   ```
   color: #1f2937;
   ```

18. **HEX_6**: `#6b7280` (라인 112)
   ```
   color: #6b7280;
   ```

19. **HEX_6**: `#d1d5db` (라인 119)
   ```
   border: 1px solid #d1d5db;
   ```

20. **HEX_6**: `#2563eb` (라인 130)
   ```
   border-color: #2563eb;
   ```

21. **HEX_6**: `#9ca3af` (라인 135)
   ```
   color: #9ca3af;
   ```

22. **HEX_6**: `#d1fae5` (라인 148)
   ```
   background: #d1fae5;
   ```

23. **HEX_6**: `#6ee7b7` (라인 149)
   ```
   border: 1px solid #6ee7b7;
   ```

24. **HEX_6**: `#065f46` (라인 150)
   ```
   color: #065f46;
   ```

25. **HEX_6**: `#fee2e2` (라인 154)
   ```
   background: #fee2e2;
   ```

26. **HEX_6**: `#fecaca` (라인 155)
   ```
   border: 1px solid #fecaca;
   ```

27. **HEX_6**: `#991b1b` (라인 156)
   ```
   color: #991b1b;
   ```

28. **HEX_6**: `#e5e7eb` (라인 166)
   ```
   border-top: 1px solid #e5e7eb;
   ```

29. **HEX_6**: `#6b7280` (라인 194)
   ```
   background: #6b7280;
   ```

30. **HEX_6**: `#4b5563` (라인 199)
   ```
   background: #4b5563;
   ```

31. **HEX_6**: `#059669` (라인 208)
   ```
   background: #059669;
   ```

32. **HEX_6**: `#059669` (라인 212)
   ```
   color: #059669;
   ```

33. **HEX_6**: `#34d399` (라인 219)
   ```
   background: linear-gradient(135deg, var(--mg-success-500), #34d399);
   ```

34. **HEX_6**: `#fbbf24` (라인 223)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500), #fbbf24);
   ```

35. **HEX_6**: `#a78bfa` (라인 227)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500), #a78bfa);
   ```

36. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 81)
   ```
   box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
   ```

37. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 131)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

---

### 📁 `frontend/src/components/common/MGForm.js` (JS)

**하드코딩 색상**: 36개

1. **HEX_6**: `#D2B48C` (라인 29)
   ```
   card: "bg-[var(--mg-cream)] p-6 rounded-xl border border-[#D2B48C]/20 shadow-sm space-y-4",
   ```

2. **HEX_6**: `#D2B48C` (라인 56)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D2B48C -> var(--mg-custom-D2B48C)
   ```

3. **HEX_6**: `#D2B48C` (라인 57)
   ```
   <div className="animate-spin text-[#D2B48C]">⟳</div>
   ```

4. **HEX_6**: `#6B7C32` (라인 80)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6B7C32 -> var(--mg-custom-6B7C32)
   ```

5. **HEX_6**: `#6B7C32` (라인 81)
   ```
   <label className="block text-sm font-medium text-[#6B7C32]">
   ```

6. **HEX_6**: `#9CAF88` (라인 90)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9CAF88 -> var(--mg-custom-9CAF88)
   ```

7. **HEX_6**: `#9CAF88` (라인 91)
   ```
   <div className="text-xs text-[#9CAF88]">
   ```

8. **HEX_6**: `#9CAF88` (라인 135)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9CAF88 -> var(--mg-custom-9CAF88)
   ```

9. **HEX_6**: `#9CAF88` (라인 136)
   ```
   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CAF88]">
   ```

10. **HEX_6**: `#D2B48C` (라인 150)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D2B48C -> var(--mg-custom-D2B48C)
   ```

11. **HEX_6**: `#D2B48C` (라인 151)
   ```
   w-full px-3 py-2 rounded-lg border border-[#D2B48C]
   ```

12. **HEX_6**: `#6B7C32` (라인 152)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6B7C32 -> var(--mg-custom-6B7C32)
   ```

13. **HEX_6**: `#6B7C32` (라인 153)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6B7C32 -> var(--mg-custom-6B7C32)
   ```

14. **HEX_6**: `#6B7C32` (라인 154)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

15. **HEX_6**: `#6B7C32` (라인 154)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

16. **HEX_6**: `#6B7C32` (라인 155)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

17. **HEX_6**: `#9CAF88` (라인 155)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

18. **HEX_6**: `#9CAF88` (라인 166)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9CAF88 -> var(--mg-custom-9CAF88)
   ```

19. **HEX_6**: `#9CAF88` (라인 167)
   ```
   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CAF88]">
   ```

20. **HEX_6**: `#D2B48C` (라인 212)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D2B48C -> var(--mg-custom-D2B48C)
   ```

21. **HEX_6**: `#D2B48C` (라인 213)
   ```
   w-full px-3 py-2 rounded-lg border border-[#D2B48C]
   ```

22. **HEX_6**: `#6B7C32` (라인 214)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6B7C32 -> var(--mg-custom-6B7C32)
   ```

23. **HEX_6**: `#6B7C32` (라인 215)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6B7C32 -> var(--mg-custom-6B7C32)
   ```

24. **HEX_6**: `#6B7C32` (라인 216)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

25. **HEX_6**: `#6B7C32` (라인 216)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

26. **HEX_6**: `#6B7C32` (라인 217)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

27. **HEX_6**: `#9CAF88` (라인 217)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32] placeholder-[#9CAF88]
   ```

28. **HEX_6**: `#D2B48C` (라인 264)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D2B48C -> var(--mg-custom-D2B48C)
   ```

29. **HEX_6**: `#D2B48C` (라인 265)
   ```
   w-full px-3 py-2 pr-10 rounded-lg border border-[#D2B48C]
   ```

30. **HEX_6**: `#6B7C32` (라인 266)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6B7C32 -> var(--mg-custom-6B7C32)
   ```

31. **HEX_6**: `#6B7C32` (라인 267)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6B7C32 -> var(--mg-custom-6B7C32)
   ```

32. **HEX_6**: `#6B7C32` (라인 268)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

33. **HEX_6**: `#6B7C32` (라인 268)
   ```
   focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20
   ```

34. **HEX_6**: `#6B7C32` (라인 269)
   ```
   bg-[var(--mg-cream)] text-[#6B7C32]
   ```

35. **HEX_6**: `#9CAF88` (라인 284)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9CAF88 -> var(--mg-custom-9CAF88)
   ```

36. **HEX_6**: `#9CAF88` (라인 285)
   ```
   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CAF88] pointer-events-none">▼</div>
   ```

---

### 📁 `frontend/src/components/tenant/PgConfigurationList.css` (CSS)

**하드코딩 색상**: 35개

1. **HEX_3**: `#666` (라인 33)
   ```
   color: var(--mg-text-secondary, #666);
   ```

2. **HEX_3**: `#999` (라인 57)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

3. **HEX_3**: `#999` (라인 70)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

4. **HEX_3**: `#666` (라인 116)
   ```
   color: var(--mg-text-secondary, #666);
   ```

5. **HEX_3**: `#999` (라인 138)
   ```
   color: var(--mg-text-tertiary, #999);
   ```

6. **HEX_3**: `#666` (라인 151)
   ```
   color: var(--mg-text-secondary, #666);
   ```

7. **HEX_3**: `#666` (라인 259)
   ```
   color: var(--mg-text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 321)
   ```
   color: var(--mg-text-secondary, #666);
   ```

9. **HEX_6**: `#1a1a1a` (라인 28)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

10. **HEX_6**: `#1a1a1a` (라인 66)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

11. **HEX_6**: `#1a1a1a` (라인 85)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

12. **HEX_6**: `#4a90e2` (라인 92)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

13. **HEX_6**: `#fff3cd` (라인 101)
   ```
   background: #fff3cd;
   ```

14. **HEX_6**: `#856404` (라인 104)
   ```
   color: #856404;
   ```

15. **HEX_6**: `#1a1a1a` (라인 146)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

16. **HEX_6**: `#4a90e2` (라인 174)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

17. **HEX_6**: `#1a1a1a` (라인 194)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

18. **HEX_6**: `#d4edda` (라인 216)
   ```
   background: #d4edda;
   ```

19. **HEX_6**: `#155724` (라인 217)
   ```
   color: #155724;
   ```

20. **HEX_6**: `#fff3cd` (라인 221)
   ```
   background: #fff3cd;
   ```

21. **HEX_6**: `#856404` (라인 222)
   ```
   color: #856404;
   ```

22. **HEX_6**: `#f8d7da` (라인 226)
   ```
   background: #f8d7da;
   ```

23. **HEX_6**: `#721c24` (라인 227)
   ```
   color: #721c24;
   ```

24. **HEX_6**: `#e2e3e5` (라인 231)
   ```
   background: #e2e3e5;
   ```

25. **HEX_6**: `#383d41` (라인 232)
   ```
   color: #383d41;
   ```

26. **HEX_6**: `#d1ecf1` (라인 236)
   ```
   background: #d1ecf1;
   ```

27. **HEX_6**: `#0c5460` (라인 237)
   ```
   color: #0c5460;
   ```

28. **HEX_6**: `#1a1a1a` (라인 264)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

29. **HEX_6**: `#1a1a1a` (라인 342)
   ```
   color: var(--mg-text-primary, #1a1a1a);
   ```

30. **HEX_6**: `#4a90e2` (라인 365)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

31. **HEX_6**: `#fff3cd` (라인 462)
   ```
   background: #fff3cd;
   ```

32. **HEX_6**: `#856404` (라인 463)
   ```
   color: #856404;
   ```

33. **HEX_6**: `#f8d7da` (라인 468)
   ```
   background: #f8d7da;
   ```

34. **HEX_6**: `#721c24` (라인 469)
   ```
   color: #721c24;
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 299)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/styles/dashboard/dashboard.css` (CSS)

**하드코딩 색상**: 34개

1. **HEX_6**: `#e9ecef` (라인 91)
   ```
   border: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#2d3748` (라인 121)
   ```
   color: #2d3748;
   ```

3. **HEX_6**: `#4a5568` (라인 126)
   ```
   color: #4a5568;
   ```

4. **HEX_6**: `#e9ecef` (라인 143)
   ```
   border: 1px solid #e9ecef;
   ```

5. **HEX_6**: `#e9ecef` (라인 188)
   ```
   background: #e9ecef;
   ```

6. **HEX_6**: `#495057` (라인 226)
   ```
   color: #495057;
   ```

7. **HEX_6**: `#e9ecef` (라인 235)
   ```
   border: 1px solid #e9ecef;
   ```

8. **HEX_6**: `#495057` (라인 242)
   ```
   color: #495057;
   ```

9. **HEX_6**: `#e9ecef` (라인 271)
   ```
   border: 1px solid #e9ecef;
   ```

10. **HEX_6**: `#495057` (라인 276)
   ```
   color: #495057;
   ```

11. **HEX_6**: `#e9ecef` (라인 282)
   ```
   background: #e9ecef;
   ```

12. **HEX_6**: `#495057` (라인 286)
   ```
   color: #495057;
   ```

13. **HEX_6**: `#5a67d8` (라인 302)
   ```
   color: #5a67d8;
   ```

14. **HEX_6**: `#e9ecef` (라인 318)
   ```
   border: 1px solid #e9ecef;
   ```

15. **HEX_6**: `#495057` (라인 325)
   ```
   color: #495057;
   ```

16. **HEX_6**: `#e9ecef` (라인 351)
   ```
   border: 1px solid #e9ecef;
   ```

17. **HEX_6**: `#e9ecef` (라인 355)
   ```
   background: #e9ecef;
   ```

18. **HEX_6**: `#495057` (라인 385)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#adb5bd` (라인 404)
   ```
   color: #adb5bd;
   ```

20. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 20)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 34)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 39)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 90)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 97)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

25. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 109)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 142)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 150)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

28. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 204)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 234)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

30. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 285)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
   ```

31. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 292)
   ```
   box-shadow: 0 1px 4px rgba(102, 126, 234, 0.15);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 317)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

33. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 358)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
   ```

34. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 370)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

---

### 📁 `frontend/src/components/clinical/DiagnosticReportEditor.css` (CSS)

**하드코딩 색상**: 34개

1. **HEX_6**: `#e5e7eb` (라인 19)
   ```
   border: 4px solid #e5e7eb;
   ```

2. **HEX_6**: `#2563eb` (라인 20)
   ```
   border-top-color: #2563eb;
   ```

3. **HEX_6**: `#1a202c` (라인 40)
   ```
   color: #1a202c;
   ```

4. **HEX_6**: `#2563eb` (라인 69)
   ```
   background: #2563eb;
   ```

5. **HEX_6**: `#1d4ed8` (라인 74)
   ```
   background: #1d4ed8;
   ```

6. **HEX_6**: `#6b7280` (라인 78)
   ```
   background: #6b7280;
   ```

7. **HEX_6**: `#4b5563` (라인 83)
   ```
   background: #4b5563;
   ```

8. **HEX_6**: `#059669` (라인 92)
   ```
   background: #059669;
   ```

9. **HEX_6**: `#fee2e2` (라인 101)
   ```
   background: #fee2e2;
   ```

10. **HEX_6**: `#fecaca` (라인 102)
   ```
   border: 1px solid #fecaca;
   ```

11. **HEX_6**: `#991b1b` (라인 103)
   ```
   color: #991b1b;
   ```

12. **HEX_6**: `#1f2937` (라인 126)
   ```
   color: #1f2937;
   ```

13. **HEX_6**: `#6b7280` (라인 131)
   ```
   color: #6b7280;
   ```

14. **HEX_6**: `#4b5563` (라인 154)
   ```
   color: #4b5563;
   ```

15. **HEX_6**: `#059669` (라인 158)
   ```
   color: #059669;
   ```

16. **HEX_6**: `#e5e7eb` (라인 165)
   ```
   border: 2px solid #e5e7eb;
   ```

17. **HEX_6**: `#2563eb` (라인 171)
   ```
   border-color: #2563eb;
   ```

18. **HEX_6**: `#1f2937` (라인 179)
   ```
   color: #1f2937;
   ```

19. **HEX_6**: `#6b7280` (라인 185)
   ```
   color: #6b7280;
   ```

20. **HEX_6**: `#d1d5db` (라인 192)
   ```
   border: 1px solid #d1d5db;
   ```

21. **HEX_6**: `#2563eb` (라인 203)
   ```
   border-color: #2563eb;
   ```

22. **HEX_6**: `#f3f4f6` (라인 208)
   ```
   background: #f3f4f6;
   ```

23. **HEX_6**: `#d1fae5` (라인 221)
   ```
   background: #d1fae5;
   ```

24. **HEX_6**: `#6ee7b7` (라인 222)
   ```
   border: 1px solid #6ee7b7;
   ```

25. **HEX_6**: `#065f46` (라인 223)
   ```
   color: #065f46;
   ```

26. **HEX_6**: `#fee2e2` (라인 227)
   ```
   background: #fee2e2;
   ```

27. **HEX_6**: `#fecaca` (라인 228)
   ```
   border: 1px solid #fecaca;
   ```

28. **HEX_6**: `#991b1b` (라인 229)
   ```
   color: #991b1b;
   ```

29. **HEX_6**: `#e5e7eb` (라인 238)
   ```
   border-top: 2px solid #e5e7eb;
   ```

30. **HEX_6**: `#fef3c7` (라인 244)
   ```
   background: #fef3c7;
   ```

31. **HEX_6**: `#92400e` (라인 252)
   ```
   color: #92400e;
   ```

32. **HEX_6**: `#78350f` (라인 258)
   ```
   color: #78350f;
   ```

33. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 172)
   ```
   box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
   ```

34. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 204)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/system/SystemTools.css` (CSS)

**하드코딩 색상**: 34개

1. **HEX_6**: `#FAFBFF` (라인 13)
   ```
   background: linear-gradient(135deg, var(--mg-white) 0%, #FAFBFF 100%);
   ```

2. **HEX_6**: `#E8EBFF` (라인 14)
   ```
   border: 1px solid #E8EBFF;
   ```

3. **HEX_6**: `#B8BCFF` (라인 25)
   ```
   border-color: #B8BCFF;
   ```

4. **HEX_6**: `#6B73FF` (라인 73)
   ```
   color: #6B73FF;
   ```

5. **HEX_6**: `#6B73FF` (라인 82)
   ```
   color: #6B73FF;
   ```

6. **HEX_6**: `#B8BCFF` (라인 83)
   ```
   border-color: #B8BCFF;
   ```

7. **HEX_6**: `#F0F2FF` (라인 84)
   ```
   background: linear-gradient(135deg, #F0F2FF 0%, #E8EBFF 100%);
   ```

8. **HEX_6**: `#E8EBFF` (라인 84)
   ```
   background: linear-gradient(135deg, #F0F2FF 0%, #E8EBFF 100%);
   ```

9. **HEX_6**: `#6B73FF` (라인 88)
   ```
   background: linear-gradient(135deg, #6B73FF 0%, #5A63E8 100%);
   ```

10. **HEX_6**: `#5A63E8` (라인 88)
   ```
   background: linear-gradient(135deg, #6B73FF 0%, #5A63E8 100%);
   ```

11. **HEX_6**: `#6B73FF` (라인 90)
   ```
   border-color: #6B73FF;
   ```

12. **HEX_6**: `#FF9F43` (라인 94)
   ```
   color: #FF9F43;
   ```

13. **HEX_6**: `#FFD4A3` (라인 95)
   ```
   border-color: #FFD4A3;
   ```

14. **HEX_6**: `#FFF5E6` (라인 96)
   ```
   background: linear-gradient(135deg, #FFF5E6 0%, #FFE8CC 100%);
   ```

15. **HEX_6**: `#FFE8CC` (라인 96)
   ```
   background: linear-gradient(135deg, #FFF5E6 0%, #FFE8CC 100%);
   ```

16. **HEX_6**: `#FF9F43` (라인 100)
   ```
   background: linear-gradient(135deg, #FF9F43 0%, #FF8C2B 100%);
   ```

17. **HEX_6**: `#FF8C2B` (라인 100)
   ```
   background: linear-gradient(135deg, #FF9F43 0%, #FF8C2B 100%);
   ```

18. **HEX_6**: `#FF9F43` (라인 102)
   ```
   border-color: #FF9F43;
   ```

19. **HEX_6**: `#FF6B9D` (라인 106)
   ```
   color: #FF6B9D;
   ```

20. **HEX_6**: `#FFB3D1` (라인 107)
   ```
   border-color: #FFB3D1;
   ```

21. **HEX_6**: `#FFE8F0` (라인 108)
   ```
   background: linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 100%);
   ```

22. **HEX_6**: `#FFD6E8` (라인 108)
   ```
   background: linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 100%);
   ```

23. **HEX_6**: `#FF6B9D` (라인 112)
   ```
   background: linear-gradient(135deg, #FF6B9D 0%, #FF5A8A 100%);
   ```

24. **HEX_6**: `#FF5A8A` (라인 112)
   ```
   background: linear-gradient(135deg, #FF6B9D 0%, #FF5A8A 100%);
   ```

25. **HEX_6**: `#FF6B9D` (라인 114)
   ```
   border-color: #FF6B9D;
   ```

26. **HEX_6**: `#4ECDC4` (라인 118)
   ```
   color: #4ECDC4;
   ```

27. **HEX_6**: `#A6E6E1` (라인 119)
   ```
   border-color: #A6E6E1;
   ```

28. **HEX_6**: `#E8F8F7` (라인 120)
   ```
   background: linear-gradient(135deg, #E8F8F7 0%, #D6F2F0 100%);
   ```

29. **HEX_6**: `#D6F2F0` (라인 120)
   ```
   background: linear-gradient(135deg, #E8F8F7 0%, #D6F2F0 100%);
   ```

30. **HEX_6**: `#4ECDC4` (라인 124)
   ```
   background: linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%);
   ```

31. **HEX_6**: `#3BB5AC` (라인 124)
   ```
   background: linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%);
   ```

32. **HEX_6**: `#4ECDC4` (라인 126)
   ```
   border-color: #4ECDC4;
   ```

33. **RGBA**: `rgba(107, 115, 255, 0.08)` (라인 17)
   ```
   box-shadow: 0 2px 8px rgba(107, 115, 255, 0.08);
   ```

34. **RGBA**: `rgba(107, 115, 255, 0.15)` (라인 24)
   ```
   box-shadow: 0 4px 16px rgba(107, 115, 255, 0.15);
   ```

---

### 📁 `frontend/src/styles/01-settings/_iphone17-tokens.css` (CSS)

**하드코딩 색상**: 33개

1. **HEX_6**: `#F2F2F7` (라인 12)
   ```
   --ios-bg-secondary: #F2F2F7;
   ```

2. **HEX_6**: `#6D6D70` (라인 17)
   ```
   --ios-text-secondary: #6D6D70;
   ```

3. **HEX_6**: `#8E8E93` (라인 18)
   ```
   --ios-text-tertiary: #8E8E93;
   ```

4. **HEX_6**: `#8E8E93` (라인 21)
   ```
   --ios-system-gray: #8E8E93;
   ```

5. **HEX_6**: `#AEAEB2` (라인 22)
   ```
   --ios-system-gray2: #AEAEB2;
   ```

6. **HEX_6**: `#C7C7CC` (라인 23)
   ```
   --ios-system-gray3: #C7C7CC;
   ```

7. **HEX_6**: `#D1D1D6` (라인 24)
   ```
   --ios-system-gray4: #D1D1D6;
   ```

8. **HEX_6**: `#E5E5EA` (라인 25)
   ```
   --ios-system-gray5: #E5E5EA;
   ```

9. **HEX_6**: `#F2F2F7` (라인 26)
   ```
   --ios-system-gray6: #F2F2F7;
   ```

10. **HEX_6**: `#1C1C1E` (라인 89)
   ```
   --ios-bg-secondary: #1C1C1E;
   ```

11. **HEX_6**: `#2C2C2E` (라인 90)
   ```
   --ios-bg-tertiary: #2C2C2E;
   ```

12. **HEX_6**: `#8E8E93` (라인 94)
   ```
   --ios-text-secondary: #8E8E93;
   ```

13. **HEX_6**: `#6D6D70` (라인 95)
   ```
   --ios-text-tertiary: #6D6D70;
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.12)` (라인 29)
   ```
   --glass-bg-primary: rgba(255, 255, 255, 0.12);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 30)
   ```
   --glass-bg-secondary: rgba(255, 255, 255, 0.08);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.04)` (라인 31)
   ```
   --glass-bg-tertiary: rgba(255, 255, 255, 0.04);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 32)
   ```
   --glass-border: rgba(255, 255, 255, 0.18);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 74)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.12);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 74)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.12);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.07)` (라인 75)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 75)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 76)
   ```
   --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.12);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.16)` (라인 77)
   ```
   --shadow-floating: 0 16px 48px rgba(0, 0, 0, 0.16);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.06)` (라인 98)
   ```
   --glass-bg-primary: rgba(255, 255, 255, 0.06);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.04)` (라인 99)
   ```
   --glass-bg-secondary: rgba(255, 255, 255, 0.04);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.02)` (라인 100)
   ```
   --glass-bg-tertiary: rgba(255, 255, 255, 0.02);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.12)` (라인 101)
   ```
   --glass-border: rgba(255, 255, 255, 0.12);
   ```

28. **RGBA**: `rgba(255, 255, 255, 0.16)` (라인 102)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.16);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 105)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 105)
   ```
   --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 106)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.3);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 106)
   ```
   --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.3);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 107)
   ```
   --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.4);
   ```

---

### 📁 `frontend/src/components/erd/ErdDetailPage.css` (CSS)

**하드코딩 색상**: 33개

1. **HEX_3**: `#333` (라인 29)
   ```
   color: var(--text-primary, #333);
   ```

2. **HEX_3**: `#333` (라인 52)
   ```
   color: var(--text-primary, #333);
   ```

3. **HEX_3**: `#666` (라인 65)
   ```
   color: var(--text-secondary, #666);
   ```

4. **HEX_3**: `#999` (라인 84)
   ```
   background: var(--text-secondary, #999);
   ```

5. **HEX_3**: `#666` (라인 90)
   ```
   color: var(--text-secondary, #666);
   ```

6. **HEX_3**: `#333` (라인 156)
   ```
   color: var(--text-primary, #333);
   ```

7. **HEX_3**: `#666` (라인 188)
   ```
   color: var(--text-secondary, #666);
   ```

8. **HEX_3**: `#333` (라인 279)
   ```
   color: var(--text-primary, #333);
   ```

9. **HEX_3**: `#666` (라인 289)
   ```
   background: var(--text-secondary, #666);
   ```

10. **HEX_3**: `#333` (라인 302)
   ```
   background: var(--text-primary, #333);
   ```

11. **HEX_3**: `#666` (라인 306)
   ```
   background: var(--text-secondary, #666);
   ```

12. **HEX_3**: `#333` (라인 329)
   ```
   color: var(--text-primary, #333);
   ```

13. **HEX_3**: `#333` (라인 375)
   ```
   color: var(--text-primary, #333);
   ```

14. **HEX_3**: `#666` (라인 413)
   ```
   color: var(--text-secondary, #666);
   ```

15. **HEX_3**: `#333` (라인 419)
   ```
   color: var(--text-primary, #333);
   ```

16. **HEX_3**: `#666` (라인 523)
   ```
   color: var(--text-secondary, #666);
   ```

17. **HEX_3**: `#333` (라인 549)
   ```
   color: var(--text-primary, #333);
   ```

18. **HEX_3**: `#333` (라인 576)
   ```
   color: var(--text-primary, #333);
   ```

19. **HEX_3**: `#666` (라인 583)
   ```
   color: var(--text-secondary, #666);
   ```

20. **HEX_3**: `#666` (라인 596)
   ```
   color: var(--text-secondary, #666);
   ```

21. **HEX_3**: `#999` (라인 604)
   ```
   color: var(--text-secondary, #999);
   ```

22. **HEX_3**: `#333` (라인 617)
   ```
   color: var(--text-primary, #333);
   ```

23. **HEX_6**: `#f0f0f0` (라인 40)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

24. **HEX_6**: `#f0f0f0` (라인 64)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

25. **HEX_6**: `#0056b3` (라인 124)
   ```
   background: var(--primary-hover, #0056b3);
   ```

26. **HEX_6**: `#f0f0f0` (라인 162)
   ```
   background-color: var(--bg-hover, #f0f0f0);
   ```

27. **HEX_6**: `#0056b3` (라인 271)
   ```
   background: var(--primary-hover, #0056b3);
   ```

28. **HEX_6**: `#f0f0f0` (라인 342)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

29. **HEX_6**: `#c82333` (라인 438)
   ```
   background: var(--error-hover, #c82333);
   ```

30. **HEX_6**: `#0056b3` (라인 684)
   ```
   background: var(--primary-hover, #0056b3);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 15)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 222)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 393)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantAvailability.css` (CSS)

**하드코딩 색상**: 33개

1. **HEX_6**: `#2c3e50` (라인 27)
   ```
   color: #2c3e50;
   ```

2. **HEX_6**: `#3498db` (라인 36)
   ```
   color: #3498db;
   ```

3. **HEX_6**: `#7f8c8d` (라인 40)
   ```
   color: #7f8c8d;
   ```

4. **HEX_6**: `#3498db` (라인 67)
   ```
   background: #3498db;
   ```

5. **HEX_6**: `#2980b9` (라인 72)
   ```
   background: #2980b9;
   ```

6. **HEX_6**: `#7f8c8d` (라인 100)
   ```
   color: #7f8c8d;
   ```

7. **HEX_6**: `#7f8c8d` (라인 125)
   ```
   color: #7f8c8d;
   ```

8. **HEX_6**: `#2c3e50` (라인 136)
   ```
   color: #2c3e50;
   ```

9. **HEX_6**: `#e9ecef` (라인 159)
   ```
   border: 1px solid #e9ecef;
   ```

10. **HEX_6**: `#e9ecef` (라인 172)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

11. **HEX_6**: `#e9ecef` (라인 173)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

12. **HEX_6**: `#2c3e50` (라인 179)
   ```
   color: #2c3e50;
   ```

13. **HEX_6**: `#3498db` (라인 184)
   ```
   background: #3498db;
   ```

14. **HEX_6**: `#e9ecef` (라인 207)
   ```
   border: 1px solid #e9ecef;
   ```

15. **HEX_6**: `#e9ecef` (라인 212)
   ```
   background: #e9ecef;
   ```

16. **HEX_6**: `#2c3e50` (라인 228)
   ```
   color: #2c3e50;
   ```

17. **HEX_6**: `#3498db` (라인 257)
   ```
   color: #3498db;
   ```

18. **HEX_6**: `#3498db` (라인 258)
   ```
   border: 1px solid #3498db;
   ```

19. **HEX_6**: `#3498db` (라인 262)
   ```
   background: #3498db;
   ```

20. **HEX_6**: `#e9ecef` (라인 328)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

21. **HEX_6**: `#e9ecef` (라인 329)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

22. **HEX_6**: `#3498db` (라인 344)
   ```
   color: #3498db;
   ```

23. **HEX_6**: `#e9ecef` (라인 364)
   ```
   background: #e9ecef;
   ```

24. **HEX_6**: `#2c3e50` (라인 365)
   ```
   color: #2c3e50;
   ```

25. **HEX_6**: `#e9ecef` (라인 394)
   ```
   border: 2px solid #e9ecef;
   ```

26. **HEX_6**: `#3498db` (라인 404)
   ```
   border-color: #3498db;
   ```

27. **HEX_6**: `#e9ecef` (라인 446)
   ```
   border-top: 1px solid #e9ecef;
   ```

28. **HEX_6**: `#3498db` (라인 464)
   ```
   background: #3498db;
   ```

29. **HEX_6**: `#2980b9` (라인 469)
   ```
   background: #2980b9;
   ```

30. **HEX_6**: `#5a6268` (라인 479)
   ```
   background: #5a6268;
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 156)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 315)
   ```
   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
   ```

33. **RGBA**: `rgba(52, 152, 219, 0.1)` (라인 405)
   ```
   box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
   ```

---

### 📁 `frontend/src/components/consultation/ConsultationHistory.css` (CSS)

**하드코딩 색상**: 32개

1. **HEX_6**: `#e9ecef` (라인 9)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 38)
   ```
   background: #e9ecef;
   ```

3. **HEX_6**: `#495057` (라인 39)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#495057` (라인 46)
   ```
   color: #495057;
   ```

5. **HEX_6**: `#f0f0f0` (라인 68)
   ```
   border: 1px solid #f0f0f0;
   ```

6. **HEX_6**: `#2c3e50` (라인 85)
   ```
   color: #2c3e50;
   ```

7. **HEX_6**: `#e9ecef` (라인 92)
   ```
   border: 2px solid #e9ecef;
   ```

8. **HEX_6**: `#fafbfc` (라인 95)
   ```
   background: #fafbfc;
   ```

9. **HEX_6**: `#495057` (라인 97)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#f0f0f0` (라인 141)
   ```
   border: 1px solid #f0f0f0;
   ```

11. **HEX_6**: `#0056b3` (라인 154)
   ```
   background: linear-gradient(90deg, var(--mg-primary-500), #0056b3);
   ```

12. **HEX_6**: `#495057` (라인 181)
   ```
   color: #495057;
   ```

13. **HEX_6**: `#d4edda` (라인 194)
   ```
   background: #d4edda;
   ```

14. **HEX_6**: `#155724` (라인 195)
   ```
   color: #155724;
   ```

15. **HEX_6**: `#cce5ff` (라인 199)
   ```
   background: #cce5ff;
   ```

16. **HEX_6**: `#004085` (라인 200)
   ```
   color: #004085;
   ```

17. **HEX_6**: `#d1ecf1` (라인 204)
   ```
   background: #d1ecf1;
   ```

18. **HEX_6**: `#0c5460` (라인 205)
   ```
   color: #0c5460;
   ```

19. **HEX_6**: `#f8d7da` (라인 209)
   ```
   background: #f8d7da;
   ```

20. **HEX_6**: `#721c24` (라인 210)
   ```
   color: #721c24;
   ```

21. **HEX_6**: `#fff3cd` (라인 214)
   ```
   background: #fff3cd;
   ```

22. **HEX_6**: `#856404` (라인 215)
   ```
   color: #856404;
   ```

23. **HEX_6**: `#e9ecef` (라인 219)
   ```
   background: #e9ecef;
   ```

24. **HEX_6**: `#495057` (라인 220)
   ```
   color: #495057;
   ```

25. **HEX_6**: `#e9ecef` (라인 252)
   ```
   border-top: 1px solid #e9ecef;
   ```

26. **HEX_6**: `#495057` (라인 283)
   ```
   color: #495057;
   ```

27. **HEX_6**: `#0056b3` (라인 304)
   ```
   background: #0056b3;
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 67)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

29. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 105)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

30. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 126)
   ```
   box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 140)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 161)
   ```
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
   ```

---

### 📁 `frontend/src/components/common/DetailedStatsGrid.js` (JS)

**하드코딩 색상**: 32개

1. **HEX_6**: `#7B68EE` (라인 60)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
   ```

2. **HEX_6**: `#7B68EE` (라인 61)
   ```
   backgroundColor: '#7B68EE',
   ```

3. **HEX_6**: `#495057` (라인 74)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

4. **HEX_6**: `#495057` (라인 75)
   ```
   color: '#495057'
   ```

5. **HEX_6**: `#7B68EE` (라인 80)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
   ```

6. **HEX_6**: `#7B68EE` (라인 81)
   ```
   color: '#7B68EE',
   ```

7. **HEX_6**: `#7B68EE` (라인 126)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
   ```

8. **HEX_6**: `#7B68EE` (라인 127)
   ```
   backgroundColor: '#7B68EE',
   ```

9. **HEX_6**: `#495057` (라인 140)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

10. **HEX_6**: `#495057` (라인 141)
   ```
   color: '#495057'
   ```

11. **HEX_6**: `#7B68EE` (라인 146)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
   ```

12. **HEX_6**: `#7B68EE` (라인 147)
   ```
   color: '#7B68EE',
   ```

13. **HEX_6**: `#495057` (라인 205)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

14. **HEX_6**: `#495057` (라인 206)
   ```
   color: '#495057'
   ```

15. **HEX_6**: `#FFE0DB` (라인 235)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFE0DB -> var(--mg-custom-FFE0DB)
   ```

16. **HEX_6**: `#FFE0DB` (라인 236)
   ```
   backgroundColor: '#FFE0DB',
   ```

17. **HEX_6**: `#FFCDD2` (라인 240)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFCDD2 -> var(--mg-custom-FFCDD2)
   ```

18. **HEX_6**: `#FFCDD2` (라인 241)
   ```
   border: '1px solid #FFCDD2',
   ```

19. **HEX_6**: `#495057` (라인 264)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

20. **HEX_6**: `#495057` (라인 265)
   ```
   color: '#495057'
   ```

21. **HEX_6**: `#FFE8D1` (라인 294)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFE8D1 -> var(--mg-custom-FFE8D1)
   ```

22. **HEX_6**: `#FFE8D1` (라인 295)
   ```
   backgroundColor: '#FFE8D1',
   ```

23. **HEX_6**: `#FFCCBC` (라인 299)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFCCBC -> var(--mg-custom-FFCCBC)
   ```

24. **HEX_6**: `#FFCCBC` (라인 300)
   ```
   border: '1px solid #FFCCBC',
   ```

25. **HEX_6**: `#495057` (라인 323)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

26. **HEX_6**: `#495057` (라인 324)
   ```
   color: '#495057'
   ```

27. **HEX_6**: `#E3F2FD` (라인 353)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #E3F2FD -> var(--mg-custom-E3F2FD)
   ```

28. **HEX_6**: `#E3F2FD` (라인 354)
   ```
   backgroundColor: '#E3F2FD',
   ```

29. **HEX_6**: `#BBDEFB` (라인 358)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #BBDEFB -> var(--mg-custom-BBDEFB)
   ```

30. **HEX_6**: `#BBDEFB` (라인 359)
   ```
   border: '1px solid #BBDEFB',
   ```

31. **HEX_6**: `#495057` (라인 382)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
   ```

32. **HEX_6**: `#495057` (라인 383)
   ```
   color: '#495057'
   ```

---

### 📁 `frontend/src/components/layout/SimpleHamburgerMenu.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_3**: `#333` (라인 266)
   ```
   color: #333;
   ```

2. **HEX_3**: `#333` (라인 340)
   ```
   color: #333;
   ```

3. **HEX_6**: `#e9ecef` (라인 43)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

4. **HEX_6**: `#764ba2` (라인 44)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

5. **HEX_6**: `#2c3e50` (라인 98)
   ```
   color: #2c3e50;
   ```

6. **HEX_6**: `#e9ecef` (라인 108)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

7. **HEX_6**: `#764ba2` (라인 116)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

8. **HEX_6**: `#e9ecef` (라인 140)
   ```
   border-left: 3px solid #e9ecef;
   ```

9. **HEX_6**: `#495057` (라인 146)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#e9ecef` (라인 170)
   ```
   background: linear-gradient(90deg, transparent, #e9ecef, transparent);
   ```

11. **HEX_6**: `#f8d7da` (라인 180)
   ```
   border: 1px solid #f8d7da;
   ```

12. **HEX_6**: `#c82333` (라인 187)
   ```
   background: linear-gradient(135deg, var(--mg-error-500) 0%, #c82333 100%);
   ```

13. **HEX_6**: `#e9ecef` (라인 316)
   ```
   border-color: #e9ecef;
   ```

14. **HEX_6**: `#e3f2fd` (라인 320)
   ```
   background: #e3f2fd;
   ```

15. **HEX_6**: `#bbdefb` (라인 321)
   ```
   border-color: #bbdefb;
   ```

16. **HEX_6**: `#e9ecef` (라인 352)
   ```
   border-left: 2px solid #e9ecef;
   ```

17. **HEX_6**: `#f1f3f5` (라인 367)
   ```
   background: #f1f3f5;
   ```

18. **HEX_6**: `#495057` (라인 386)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#dee2e6` (라인 393)
   ```
   border-top: 2px solid #dee2e6;
   ```

20. **HEX_6**: `#c82333` (라인 429)
   ```
   background: #c82333;
   ```

21. **HEX_6**: `#0056b3` (라인 471)
   ```
   background: #0056b3;
   ```

22. **HEX_6**: `#212529` (라인 477)
   ```
   color: #212529;
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 58)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 75)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 111)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

26. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 119)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 141)
   ```
   box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 183)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

29. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 190)
   ```
   box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
   ```

30. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 289)
   ```
   box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
   ```

31. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 295)
   ```
   box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
   ```

---

### 📁 `frontend/src/components/billing/SubscriptionManagement.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#e5e7eb` (라인 17)
   ```
   border-bottom: 2px solid #e5e7eb;
   ```

2. **HEX_6**: `#1f2937` (라인 24)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#1f2937` (라인 46)
   ```
   color: #1f2937;
   ```

4. **HEX_6**: `#6b7280` (라인 52)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#f9fafb` (라인 66)
   ```
   background: #f9fafb;
   ```

6. **HEX_6**: `#e5e7eb` (라인 67)
   ```
   border: 1px solid #e5e7eb;
   ```

7. **HEX_6**: `#1f2937` (라인 76)
   ```
   color: #1f2937;
   ```

8. **HEX_6**: `#6b7280` (라인 82)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#1f2937` (라인 103)
   ```
   color: #1f2937;
   ```

10. **HEX_6**: `#f9fafb` (라인 115)
   ```
   background: #f9fafb;
   ```

11. **HEX_6**: `#e5e7eb` (라인 116)
   ```
   border: 2px solid #e5e7eb;
   ```

12. **HEX_6**: `#eff6ff` (라인 129)
   ```
   background: #eff6ff;
   ```

13. **HEX_6**: `#1f2937` (라인 135)
   ```
   color: #1f2937;
   ```

14. **HEX_6**: `#6b7280` (라인 148)
   ```
   color: #6b7280;
   ```

15. **HEX_6**: `#fef3c7` (라인 157)
   ```
   background: #fef3c7;
   ```

16. **HEX_6**: `#fcd34d` (라인 158)
   ```
   border: 1px solid #fcd34d;
   ```

17. **HEX_6**: `#92400e` (라인 160)
   ```
   color: #92400e;
   ```

18. **HEX_6**: `#f9fafb` (라인 172)
   ```
   background: #f9fafb;
   ```

19. **HEX_6**: `#e5e7eb` (라인 173)
   ```
   border: 1px solid #e5e7eb;
   ```

20. **HEX_6**: `#1f2937` (라인 187)
   ```
   color: #1f2937;
   ```

21. **HEX_6**: `#d1fae5` (라인 201)
   ```
   background: #d1fae5;
   ```

22. **HEX_6**: `#065f46` (라인 202)
   ```
   color: #065f46;
   ```

23. **HEX_6**: `#fef3c7` (라인 206)
   ```
   background: #fef3c7;
   ```

24. **HEX_6**: `#92400e` (라인 207)
   ```
   color: #92400e;
   ```

25. **HEX_6**: `#fee2e2` (라인 211)
   ```
   background: #fee2e2;
   ```

26. **HEX_6**: `#991b1b` (라인 212)
   ```
   color: #991b1b;
   ```

27. **HEX_6**: `#6b7280` (라인 221)
   ```
   color: #6b7280;
   ```

28. **HEX_6**: `#fef2f2` (라인 241)
   ```
   background: #fef2f2;
   ```

29. **HEX_6**: `#fecaca` (라인 242)
   ```
   border: 1px solid #fecaca;
   ```

30. **HEX_6**: `#dc2626` (라인 244)
   ```
   color: #dc2626;
   ```

31. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 124)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/auth/AccountIntegrationModal.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#e5e7eb` (라인 30)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

2. **HEX_6**: `#1f2937` (라인 37)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#6b7280` (라인 44)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#f3f4f6` (라인 52)
   ```
   background-color: #f3f4f6;
   ```

5. **HEX_6**: `#374151` (라인 53)
   ```
   color: #374151;
   ```

6. **HEX_6**: `#f8fafc` (라인 69)
   ```
   background-color: #f8fafc;
   ```

7. **HEX_6**: `#e2e8f0` (라인 71)
   ```
   border: 1px solid #e2e8f0;
   ```

8. **HEX_6**: `#374151` (라인 76)
   ```
   color: #374151;
   ```

9. **HEX_6**: `#6b7280` (라인 82)
   ```
   color: #6b7280;
   ```

10. **HEX_6**: `#f0f9ff` (라인 98)
   ```
   background-color: #f0f9ff;
   ```

11. **HEX_6**: `#bae6fd` (라인 99)
   ```
   border: 1px solid #bae6fd;
   ```

12. **HEX_6**: `#0369a1` (라인 107)
   ```
   color: #0369a1;
   ```

13. **HEX_6**: `#374151` (라인 118)
   ```
   color: #374151;
   ```

14. **HEX_6**: `#6b7280` (라인 122)
   ```
   color: #6b7280;
   ```

15. **HEX_6**: `#374151` (라인 136)
   ```
   color: #374151;
   ```

16. **HEX_6**: `#d1d5db` (라인 142)
   ```
   border: 1px solid #d1d5db;
   ```

17. **HEX_6**: `#6b7280` (라인 155)
   ```
   color: #6b7280;
   ```

18. **HEX_6**: `#f0fdf4` (라인 165)
   ```
   background-color: #f0fdf4;
   ```

19. **HEX_6**: `#bbf7d0` (라인 166)
   ```
   border: 1px solid #bbf7d0;
   ```

20. **HEX_6**: `#166534` (라인 174)
   ```
   color: #166534;
   ```

21. **HEX_6**: `#dcfce7` (라인 185)
   ```
   background-color: #dcfce7;
   ```

22. **HEX_6**: `#16a34a` (라인 194)
   ```
   color: #16a34a;
   ```

23. **HEX_6**: `#16a34a` (라인 201)
   ```
   color: #16a34a;
   ```

24. **HEX_6**: `#374151` (라인 206)
   ```
   color: #374151;
   ```

25. **HEX_6**: `#2563eb` (라인 243)
   ```
   background-color: #2563eb;
   ```

26. **HEX_6**: `#f3f4f6` (라인 247)
   ```
   background-color: #f3f4f6;
   ```

27. **HEX_6**: `#374151` (라인 248)
   ```
   color: #374151;
   ```

28. **HEX_6**: `#d1d5db` (라인 249)
   ```
   border: 1px solid #d1d5db;
   ```

29. **HEX_6**: `#e5e7eb` (라인 253)
   ```
   background-color: #e5e7eb;
   ```

30. **HEX_6**: `#2563eb` (라인 264)
   ```
   color: #2563eb;
   ```

31. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 151)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/WellnessManagement.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#87CEEB` (라인 18)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

2. **HEX_6**: `#B0E0E6` (라인 18)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

3. **HEX_6**: `#FFB6C1` (라인 91)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

4. **HEX_6**: `#FFC0CB` (라인 91)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

5. **HEX_6**: `#FFA0B0` (라인 96)
   ```
   background: linear-gradient(135deg, #FFA0B0, #FFB0C0);
   ```

6. **HEX_6**: `#FFB0C0` (라인 96)
   ```
   background: linear-gradient(135deg, #FFA0B0, #FFB0C0);
   ```

7. **HEX_6**: `#FFD700` (라인 146)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

8. **HEX_6**: `#FFA500` (라인 146)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

9. **HEX_6**: `#87CEEB` (라인 151)
   ```
   background: linear-gradient(135deg, #87CEEB, #4682B4);
   ```

10. **HEX_6**: `#4682B4` (라인 151)
   ```
   background: linear-gradient(135deg, #87CEEB, #4682B4);
   ```

11. **HEX_6**: `#98D8C8` (라인 156)
   ```
   background: linear-gradient(135deg, #98D8C8, #6BCF7F);
   ```

12. **HEX_6**: `#6BCF7F` (라인 156)
   ```
   background: linear-gradient(135deg, #98D8C8, #6BCF7F);
   ```

13. **HEX_6**: `#DDA0DD` (라인 161)
   ```
   background: linear-gradient(135deg, #DDA0DD, #BA55D3);
   ```

14. **HEX_6**: `#BA55D3` (라인 161)
   ```
   background: linear-gradient(135deg, #DDA0DD, #BA55D3);
   ```

15. **HEX_6**: `#87CEEB` (라인 226)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

16. **HEX_6**: `#B0E0E6` (라인 226)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

17. **HEX_6**: `#FFB6C1` (라인 393)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

18. **HEX_6**: `#FFC0CB` (라인 393)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

20. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 147)
   ```
   box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

21. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 152)
   ```
   box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

22. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 157)
   ```
   box-shadow: 0 4px 12px rgba(152, 216, 200, 0.3);
   ```

23. **RGBA**: `rgba(221, 160, 221, 0.3)` (라인 162)
   ```
   box-shadow: 0 4px 12px rgba(221, 160, 221, 0.3);
   ```

24. **RGBA**: `rgba(135, 206, 235, 0.05)` (라인 279)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

25. **RGBA**: `rgba(176, 224, 230, 0.05)` (라인 279)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

26. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 286)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

27. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 286)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

28. **RGBA**: `rgba(255, 182, 193, 0.05)` (라인 354)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.05), rgba(255, 192, 203, 0.05));
   ```

29. **RGBA**: `rgba(255, 192, 203, 0.05)` (라인 354)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.05), rgba(255, 192, 203, 0.05));
   ```

30. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 366)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(255, 192, 203, 0.1));
   ```

31. **RGBA**: `rgba(255, 192, 203, 0.1)` (라인 366)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(255, 192, 203, 0.1));
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeList.css` (CSS)

**하드코딩 색상**: 31개

1. **HEX_6**: `#d1d5db` (라인 24)
   ```
   border: 1px solid #d1d5db;
   ```

2. **HEX_6**: `#6b7280` (라인 31)
   ```
   color: #6b7280;
   ```

3. **HEX_6**: `#f9fafb` (라인 43)
   ```
   background: #f9fafb;
   ```

4. **HEX_6**: `#1f2937` (라인 49)
   ```
   color: #1f2937;
   ```

5. **HEX_6**: `#fef2f2` (라인 78)
   ```
   background-color: #fef2f2;
   ```

6. **HEX_6**: `#f3f4f6` (라인 88)
   ```
   border-bottom: 1px solid #f3f4f6;
   ```

7. **HEX_6**: `#f8fafc` (라인 89)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
   ```

8. **HEX_6**: `#f1f5f9` (라인 89)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
   ```

9. **HEX_6**: `#1f2937` (라인 100)
   ```
   color: #1f2937;
   ```

10. **HEX_6**: `#6b7280` (라인 134)
   ```
   color: #6b7280;
   ```

11. **HEX_6**: `#1f2937` (라인 143)
   ```
   color: #1f2937;
   ```

12. **HEX_6**: `#1d4ed8` (라인 147)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

13. **HEX_6**: `#f3f4f6` (라인 158)
   ```
   background: #f3f4f6;
   ```

14. **HEX_6**: `#1f2937` (라인 159)
   ```
   color: #1f2937;
   ```

15. **HEX_6**: `#6b7280` (라인 169)
   ```
   color: #6b7280;
   ```

16. **HEX_6**: `#f3f4f6` (라인 176)
   ```
   background: #f3f4f6;
   ```

17. **HEX_6**: `#6b7280` (라인 177)
   ```
   color: #6b7280;
   ```

18. **HEX_6**: `#065f46` (라인 200)
   ```
   color: #065f46;
   ```

19. **HEX_6**: `#991b1b` (라인 205)
   ```
   color: #991b1b;
   ```

20. **HEX_6**: `#6b7280` (라인 215)
   ```
   color: #6b7280;
   ```

21. **HEX_6**: `#6b7280` (라인 223)
   ```
   color: #6b7280;
   ```

22. **HEX_6**: `#f9fafb` (라인 225)
   ```
   background: #f9fafb;
   ```

23. **HEX_6**: `#f3f4f6` (라인 234)
   ```
   border-top: 1px solid #f3f4f6;
   ```

24. **HEX_6**: `#fafbfc` (라인 235)
   ```
   background: #fafbfc;
   ```

25. **HEX_6**: `#f3f4f6` (라인 294)
   ```
   border: 4px solid #f3f4f6;
   ```

26. **HEX_6**: `#6b7280` (라인 307)
   ```
   color: #6b7280;
   ```

27. **HEX_6**: `#374151` (라인 327)
   ```
   color: #374151;
   ```

28. **HEX_6**: `#6b7280` (라인 332)
   ```
   color: #6b7280;
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 66)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

30. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 269)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

31. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 282)
   ```
   box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
   ```

---

### 📁 `frontend/src/styles/06-components/_buttons.css` (CSS)

**하드코딩 색상**: 30개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 38)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 51)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.8)` (라인 56)
   ```
   background: rgba(0, 123, 255, 0.8);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 58)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 59)
   ```
   box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 123, 255, 0.9)` (라인 63)
   ```
   background: rgba(0, 123, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.4)` (라인 65)
   ```
   box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
   ```

8. **RGBA**: `rgba(248, 249, 250, 0.6)` (라인 69)
   ```
   background: rgba(248, 249, 250, 0.6);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 71)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(248, 249, 250, 0.8)` (라인 76)
   ```
   background: rgba(248, 249, 250, 0.8);
   ```

11. **RGBA**: `rgba(52, 199, 89, 0.8)` (라인 83)
   ```
   background: rgba(52, 199, 89, 0.8);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 85)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 86)
   ```
   box-shadow: 0 4px 15px rgba(52, 199, 89, 0.3);
   ```

14. **RGBA**: `rgba(52, 199, 89, 0.9)` (라인 90)
   ```
   background: rgba(52, 199, 89, 0.9);
   ```

15. **RGBA**: `rgba(52, 199, 89, 0.4)` (라인 92)
   ```
   box-shadow: 0 8px 25px rgba(52, 199, 89, 0.4);
   ```

16. **RGBA**: `rgba(255, 149, 0, 0.8)` (라인 96)
   ```
   background: rgba(255, 149, 0, 0.8);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 98)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

18. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 99)
   ```
   box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
   ```

19. **RGBA**: `rgba(255, 149, 0, 0.9)` (라인 103)
   ```
   background: rgba(255, 149, 0, 0.9);
   ```

20. **RGBA**: `rgba(255, 149, 0, 0.4)` (라인 105)
   ```
   box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4);
   ```

21. **RGBA**: `rgba(255, 59, 48, 0.8)` (라인 109)
   ```
   background: rgba(255, 59, 48, 0.8);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 111)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

23. **RGBA**: `rgba(255, 59, 48, 0.3)` (라인 112)
   ```
   box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
   ```

24. **RGBA**: `rgba(255, 59, 48, 0.9)` (라인 116)
   ```
   background: rgba(255, 59, 48, 0.9);
   ```

25. **RGBA**: `rgba(255, 59, 48, 0.4)` (라인 118)
   ```
   box-shadow: 0 8px 25px rgba(255, 59, 48, 0.4);
   ```

26. **RGBA**: `rgba(88, 86, 214, 0.8)` (라인 122)
   ```
   background: rgba(88, 86, 214, 0.8);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 124)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

28. **RGBA**: `rgba(88, 86, 214, 0.3)` (라인 125)
   ```
   box-shadow: 0 4px 15px rgba(88, 86, 214, 0.3);
   ```

29. **RGBA**: `rgba(88, 86, 214, 0.9)` (라인 129)
   ```
   background: rgba(88, 86, 214, 0.9);
   ```

30. **RGBA**: `rgba(88, 86, 214, 0.4)` (라인 131)
   ```
   box-shadow: 0 8px 25px rgba(88, 86, 214, 0.4);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_buttons.css` (CSS)

**하드코딩 색상**: 30개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 33)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 46)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.8)` (라인 51)
   ```
   background: rgba(0, 123, 255, 0.8);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 53)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 54)
   ```
   box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 123, 255, 0.9)` (라인 58)
   ```
   background: rgba(0, 123, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.4)` (라인 60)
   ```
   box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
   ```

8. **RGBA**: `rgba(248, 249, 250, 0.6)` (라인 64)
   ```
   background: rgba(248, 249, 250, 0.6);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 66)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(248, 249, 250, 0.8)` (라인 71)
   ```
   background: rgba(248, 249, 250, 0.8);
   ```

11. **RGBA**: `rgba(52, 199, 89, 0.8)` (라인 78)
   ```
   background: rgba(52, 199, 89, 0.8);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 80)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 81)
   ```
   box-shadow: 0 4px 15px rgba(52, 199, 89, 0.3);
   ```

14. **RGBA**: `rgba(52, 199, 89, 0.9)` (라인 85)
   ```
   background: rgba(52, 199, 89, 0.9);
   ```

15. **RGBA**: `rgba(52, 199, 89, 0.4)` (라인 87)
   ```
   box-shadow: 0 8px 25px rgba(52, 199, 89, 0.4);
   ```

16. **RGBA**: `rgba(255, 149, 0, 0.8)` (라인 91)
   ```
   background: rgba(255, 149, 0, 0.8);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 93)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

18. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 94)
   ```
   box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
   ```

19. **RGBA**: `rgba(255, 149, 0, 0.9)` (라인 98)
   ```
   background: rgba(255, 149, 0, 0.9);
   ```

20. **RGBA**: `rgba(255, 149, 0, 0.4)` (라인 100)
   ```
   box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4);
   ```

21. **RGBA**: `rgba(255, 59, 48, 0.8)` (라인 104)
   ```
   background: rgba(255, 59, 48, 0.8);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 106)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

23. **RGBA**: `rgba(255, 59, 48, 0.3)` (라인 107)
   ```
   box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
   ```

24. **RGBA**: `rgba(255, 59, 48, 0.9)` (라인 111)
   ```
   background: rgba(255, 59, 48, 0.9);
   ```

25. **RGBA**: `rgba(255, 59, 48, 0.4)` (라인 113)
   ```
   box-shadow: 0 8px 25px rgba(255, 59, 48, 0.4);
   ```

26. **RGBA**: `rgba(88, 86, 214, 0.8)` (라인 117)
   ```
   background: rgba(88, 86, 214, 0.8);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 119)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

28. **RGBA**: `rgba(88, 86, 214, 0.3)` (라인 120)
   ```
   box-shadow: 0 4px 15px rgba(88, 86, 214, 0.3);
   ```

29. **RGBA**: `rgba(88, 86, 214, 0.9)` (라인 124)
   ```
   background: rgba(88, 86, 214, 0.9);
   ```

30. **RGBA**: `rgba(88, 86, 214, 0.4)` (라인 126)
   ```
   box-shadow: 0 8px 25px rgba(88, 86, 214, 0.4);
   ```

---

### 📁 `frontend/src/components/wellness/WellnessNotificationDetail.css` (CSS)

**하드코딩 색상**: 30개

1. **HEX_6**: `#87CEEB` (라인 45)
   ```
   border-color: #87CEEB;
   ```

2. **HEX_6**: `#87CEEB` (라인 65)
   ```
   border-color: #87CEEB;
   ```

3. **HEX_6**: `#FF6B9D` (라인 89)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

4. **HEX_6**: `#FFA5C0` (라인 89)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

5. **HEX_6**: `#FF8E8E` (라인 95)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

6. **HEX_6**: `#98D8C8` (라인 106)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

7. **HEX_6**: `#B4E7CE` (라인 106)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

8. **HEX_6**: `#FF8E8E` (라인 111)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

9. **HEX_6**: `#FFD700` (라인 116)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

10. **HEX_6**: `#FFA500` (라인 116)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

11. **HEX_6**: `#87CEEB` (라인 121)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

12. **HEX_6**: `#B0E0E6` (라인 121)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

13. **HEX_6**: `#87CEEB` (라인 158)
   ```
   color: #87CEEB;
   ```

14. **HEX_6**: `#87CEEB` (라인 202)
   ```
   border-left: 4px solid #87CEEB;
   ```

15. **HEX_6**: `#87CEEB` (라인 265)
   ```
   color: #87CEEB;
   ```

16. **HEX_6**: `#6BB6D8` (라인 271)
   ```
   color: #6BB6D8;
   ```

17. **HEX_6**: `#87CEEB` (라인 284)
   ```
   border-left: 4px solid #87CEEB;
   ```

18. **HEX_6**: `#FF6B9D` (라인 337)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

19. **HEX_6**: `#FFA5C0` (라인 337)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

20. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 44)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

21. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 44)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

22. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 64)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

23. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 64)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

24. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 91)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
   ```

25. **RGBA**: `rgba(255, 107, 107, 0.3)` (라인 97)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
   ```

26. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 201)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

27. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 201)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

28. **RGBA**: `rgba(135, 206, 235, 0.05)` (라인 285)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

29. **RGBA**: `rgba(176, 224, 230, 0.05)` (라인 285)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

30. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 342)
   ```
   box-shadow: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

---

### 📁 `frontend/src/styles/00-core/_component-variables.css` (CSS)

**하드코딩 색상**: 29개

1. **HEX_6**: `#FEE500` (라인 278)
   ```
   --mypage-kakao-bg: #FEE500;
   ```

2. **HEX_6**: `#FDD835` (라인 279)
   ```
   --mypage-kakao-bg-hover: #FDD835;
   ```

3. **HEX_6**: `#03C75A` (라인 281)
   ```
   --mypage-naver-bg: #03C75A;
   ```

4. **HEX_6**: `#02B351` (라인 282)
   ```
   --mypage-naver-bg-hover: #02B351;
   ```

5. **HEX_6**: `#4285F4` (라인 284)
   ```
   --mypage-google-color: #4285F4;
   ```

6. **HEX_6**: `#d1fae5` (라인 390)
   ```
   --notification-success-icon-bg-start: #d1fae5;
   ```

7. **HEX_6**: `#a7f3d0` (라인 391)
   ```
   --notification-success-icon-bg-end: #a7f3d0;
   ```

8. **HEX_6**: `#059669` (라인 392)
   ```
   --notification-success-icon-color: #059669;
   ```

9. **HEX_6**: `#fecaca` (라인 397)
   ```
   --notification-error-icon-bg-start: #fecaca;
   ```

10. **HEX_6**: `#fca5a5` (라인 398)
   ```
   --notification-error-icon-bg-end: #fca5a5;
   ```

11. **HEX_6**: `#dc2626` (라인 399)
   ```
   --notification-error-icon-color: #dc2626;
   ```

12. **HEX_6**: `#fef3c7` (라인 404)
   ```
   --notification-warning-icon-bg-start: #fef3c7;
   ```

13. **HEX_6**: `#fde68a` (라인 405)
   ```
   --notification-warning-icon-bg-end: #fde68a;
   ```

14. **HEX_6**: `#dbeafe` (라인 411)
   ```
   --notification-info-icon-bg-start: #dbeafe;
   ```

15. **HEX_6**: `#bfdbfe` (라인 412)
   ```
   --notification-info-icon-bg-end: #bfdbfe;
   ```

16. **HEX_6**: `#2563eb` (라인 413)
   ```
   --notification-info-icon-color: #2563eb;
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 308)
   ```
   --notification-toast-bg: rgba(255, 255, 255, 0.95);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 309)
   ```
   --notification-toast-border-color: rgba(255, 255, 255, 0.3);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 345)
   ```
   --notification-modal-bg: rgba(255, 255, 255, 0.95);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 346)
   ```
   --notification-modal-border-color: rgba(255, 255, 255, 0.3);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 353)
   ```
   --notification-header-border-color: rgba(0, 0, 0, 0.08);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 354)
   ```
   --notification-header-bg: rgba(255, 255, 255, 0.9);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 371)
   ```
   --notification-actions-border-color: rgba(0, 0, 0, 0.08);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 372)
   ```
   --notification-actions-bg: rgba(255, 255, 255, 0.9);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 378)
   ```
   --notification-banner-border-color: rgba(255, 255, 255, 0.3);
   ```

26. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 416)
   ```
   --notification-banner-success-bg: rgba(34, 197, 94, 0.1);
   ```

27. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 417)
   ```
   --notification-banner-error-bg: rgba(239, 68, 68, 0.1);
   ```

28. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 418)
   ```
   --notification-banner-warning-bg: rgba(245, 158, 11, 0.1);
   ```

29. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 419)
   ```
   --notification-banner-info-bg: rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/super-admin/PaymentManagement.css` (CSS)

**하드코딩 색상**: 29개

1. **HEX_6**: `#e9ecef` (라인 21)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

2. **HEX_6**: `#2c3e50` (라인 26)
   ```
   color: #2c3e50;
   ```

3. **HEX_6**: `#764ba2` (라인 45)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

4. **HEX_6**: `#f5576c` (라인 58)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

5. **HEX_6**: `#4facfe` (라인 62)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

6. **HEX_6**: `#00f2fe` (라인 62)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

7. **HEX_6**: `#43e97b` (라인 66)
   ```
   background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
   ```

8. **HEX_6**: `#38f9d7` (라인 66)
   ```
   background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
   ```

9. **HEX_6**: `#495057` (라인 102)
   ```
   color: #495057;
   ```

10. **HEX_6**: `#ced4da` (라인 109)
   ```
   border: 1px solid #ced4da;
   ```

11. **HEX_6**: `#495057` (라인 275)
   ```
   color: #495057;
   ```

12. **HEX_6**: `#dee2e6` (라인 276)
   ```
   border-bottom: 2px solid #dee2e6;
   ```

13. **HEX_6**: `#dee2e6` (라인 282)
   ```
   border-bottom: 1px solid #dee2e6;
   ```

14. **HEX_6**: `#212529` (라인 303)
   ```
   color: #212529;
   ```

15. **HEX_6**: `#343a40` (라인 327)
   ```
   background-color: #343a40;
   ```

16. **HEX_6**: `#495057` (라인 333)
   ```
   color: #495057;
   ```

17. **HEX_6**: `#0056b3` (라인 367)
   ```
   background-color: #0056b3;
   ```

18. **HEX_6**: `#1e7e34` (라인 376)
   ```
   background-color: #1e7e34;
   ```

19. **HEX_6**: `#c82333` (라인 385)
   ```
   background-color: #c82333;
   ```

20. **HEX_6**: `#212529` (라인 390)
   ```
   color: #212529;
   ```

21. **HEX_6**: `#e0a800` (라인 394)
   ```
   background-color: #e0a800;
   ```

22. **HEX_6**: `#dee2e6` (라인 410)
   ```
   border-top: 1px solid #dee2e6;
   ```

23. **HEX_6**: `#495057` (라인 415)
   ```
   color: #495057;
   ```

24. **HEX_6**: `#721c24` (라인 435)
   ```
   color: #721c24;
   ```

25. **HEX_6**: `#f8d7da` (라인 436)
   ```
   background-color: #f8d7da;
   ```

26. **HEX_6**: `#f5c6cb` (라인 437)
   ```
   border-color: #f5c6cb;
   ```

27. **HEX_6**: `#dee2e6` (라인 449)
   ```
   border: 1px solid #dee2e6;
   ```

28. **HEX_6**: `#495057` (라인 454)
   ```
   color: #495057;
   ```

29. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 119)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_modals.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#e5e7eb` (라인 311)
   ```
   border: 3px solid var(--color-border-light, #e5e7eb);
   ```

2. **HEX_6**: `#0d9488` (라인 312)
   ```
   border-top-color: var(--color-primary, var(--ad-b0kla-green, #0d9488));
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 31)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 35)
   ```
   border: 1px solid rgba(255, 255, 255, 0.4);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 38)
   ```
   0 0 0 1px rgba(255, 255, 255, 0.2),
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 39)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 82)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 83)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 123)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 131)
   ```
   border-top: 1px solid rgba(0, 0, 0, 0.08);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 132)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 139)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 144)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 148)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 152)
   ```
   background: rgba(255, 255, 255, 0.98);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 157)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 257)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 347)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

19. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 392)
   ```
   background: rgba(255, 193, 7, 0.1);
   ```

20. **RGBA**: `rgba(255, 193, 7, 0.2)` (라인 394)
   ```
   border: 1px solid rgba(255, 193, 7, 0.2);
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 430)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 432)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 437)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 439)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

25. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 454)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

26. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 455)
   ```
   box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
   ```

27. **RGBA**: `rgba(248, 249, 250, 0.9)` (라인 461)
   ```
   background: rgba(248, 249, 250, 0.9);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 467)
   ```
   border-color: rgba(0, 0, 0, 0.08);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_cards.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#af52de` (라인 231)
   ```
   .card__icon--mappings { background: #af52de; }
   ```

2. **HEX_6**: `#30d158` (라인 233)
   ```
   .card__icon--revenue { background: #30d158; }
   ```

3. **HEX_6**: `#64d2ff` (라인 235)
   ```
   .card__icon--payment { background: #64d2ff; }
   ```

4. **HEX_6**: `#bf5af2` (라인 236)
   ```
   .card__icon--reports { background: #bf5af2; }
   ```

5. **HEX_6**: `#32d74b` (라인 238)
   ```
   .card__icon--recurring-expense { background: #32d74b; }
   ```

6. **HEX_6**: `#2e7d32` (라인 326)
   ```
   color: #2e7d32;
   ```

7. **HEX_6**: `#c62828` (라인 332)
   ```
   color: #c62828;
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 111)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 139)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 160)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 172)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 177)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 203)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 271)
   ```
   rgba(102, 126, 234, 0.8),
   ```

15. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 272)
   ```
   rgba(118, 75, 162, 0.8));
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 305)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

17. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 325)
   ```
   background: rgba(40, 167, 69, 0.2);
   ```

18. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 327)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

19. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 331)
   ```
   background: rgba(220, 53, 69, 0.2);
   ```

20. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 333)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
   ```

21. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 360)
   ```
   rgba(102, 126, 234, 0.8),
   ```

22. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 361)
   ```
   rgba(118, 75, 162, 0.8));
   ```

23. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 385)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

24. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 386)
   ```
   border-color: rgba(0, 122, 255, 0.3);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 405)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 592)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 594)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

28. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 617)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/common/DuplicateLoginAlert.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#fef3c7` (라인 46)
   ```
   background: linear-gradient(135deg, #fef3c7, #fde68a);
   ```

2. **HEX_6**: `#fde68a` (라인 46)
   ```
   background: linear-gradient(135deg, #fef3c7, #fde68a);
   ```

3. **HEX_6**: `#1f2937` (라인 58)
   ```
   color: #1f2937;
   ```

4. **HEX_6**: `#374151` (라인 68)
   ```
   color: #374151;
   ```

5. **HEX_6**: `#6b7280` (라인 75)
   ```
   color: #6b7280;
   ```

6. **HEX_6**: `#f3f4f6` (라인 100)
   ```
   background-color: #f3f4f6;
   ```

7. **HEX_6**: `#374151` (라인 101)
   ```
   color: #374151;
   ```

8. **HEX_6**: `#d1d5db` (라인 102)
   ```
   border: 1px solid #d1d5db;
   ```

9. **HEX_6**: `#9ca3af` (라인 107)
   ```
   border-color: #9ca3af;
   ```

10. **HEX_6**: `#dc2626` (라인 116)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #dc2626);
   ```

11. **HEX_6**: `#dc2626` (라인 118)
   ```
   border: 1px solid #dc2626;
   ```

12. **HEX_6**: `#dc2626` (라인 122)
   ```
   background: linear-gradient(135deg, #dc2626, #b91c1c);
   ```

13. **HEX_6**: `#b91c1c` (라인 122)
   ```
   background: linear-gradient(135deg, #dc2626, #b91c1c);
   ```

14. **HEX_6**: `#b91c1c` (라인 123)
   ```
   border-color: #b91c1c;
   ```

15. **HEX_6**: `#dc2626` (라인 142)
   ```
   background: linear-gradient(90deg, var(--mg-error-500), #dc2626);
   ```

16. **HEX_6**: `#1f2937` (라인 238)
   ```
   background: #1f2937;
   ```

17. **HEX_6**: `#f9fafb` (라인 239)
   ```
   color: #f9fafb;
   ```

18. **HEX_6**: `#374151` (라인 243)
   ```
   border-bottom-color: #374151;
   ```

19. **HEX_6**: `#f9fafb` (라인 247)
   ```
   color: #f9fafb;
   ```

20. **HEX_6**: `#9ca3af` (라인 255)
   ```
   color: #9ca3af;
   ```

21. **HEX_6**: `#374151` (라인 259)
   ```
   background-color: #374151;
   ```

22. **HEX_6**: `#f9fafb` (라인 260)
   ```
   color: #f9fafb;
   ```

23. **HEX_6**: `#4b5563` (라인 261)
   ```
   border-color: #4b5563;
   ```

24. **HEX_6**: `#4b5563` (라인 265)
   ```
   background-color: #4b5563;
   ```

25. **HEX_6**: `#6b7280` (라인 266)
   ```
   border-color: #6b7280;
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 9)
   ```
   background-color: rgba(0, 0, 0, 0.6);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 24)
   ```
   box-shadow: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

28. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 155)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
   ```

---

### 📁 `frontend/src/components/auth/BranchLogin.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#2563eb` (라인 5)
   ```
   --branch-login-primary: #2563eb;
   ```

2. **HEX_6**: `#16a34a` (라인 6)
   ```
   --branch-login-success: #16a34a;
   ```

3. **HEX_6**: `#d97706` (라인 7)
   ```
   --branch-login-warning: #d97706;
   ```

4. **HEX_6**: `#dc2626` (라인 8)
   ```
   --branch-login-error: #dc2626;
   ```

5. **HEX_6**: `#f3f4f6` (라인 9)
   ```
   --branch-login-gray-100: #f3f4f6;
   ```

6. **HEX_6**: `#e5e7eb` (라인 10)
   ```
   --branch-login-gray-200: #e5e7eb;
   ```

7. **HEX_6**: `#d1d5db` (라인 11)
   ```
   --branch-login-gray-300: #d1d5db;
   ```

8. **HEX_6**: `#6b7280` (라인 12)
   ```
   --branch-login-gray-500: #6b7280;
   ```

9. **HEX_6**: `#4b5563` (라인 13)
   ```
   --branch-login-gray-600: #4b5563;
   ```

10. **HEX_6**: `#374151` (라인 14)
   ```
   --branch-login-gray-700: #374151;
   ```

11. **HEX_6**: `#1f2937` (라인 15)
   ```
   --branch-login-gray-800: #1f2937;
   ```

12. **HEX_6**: `#111827` (라인 16)
   ```
   --branch-login-gray-900: #111827;
   ```

13. **HEX_6**: `#764ba2` (라인 25)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

14. **HEX_6**: `#1d4ed8` (라인 174)
   ```
   background: #1d4ed8;
   ```

15. **HEX_6**: `#1d4ed8` (라인 240)
   ```
   color: #1d4ed8;
   ```

16. **HEX_6**: `#f8fafc` (라인 346)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

17. **HEX_6**: `#e2e8f0` (라인 346)
   ```
   background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
   ```

18. **HEX_6**: `#dbeafe` (라인 388)
   ```
   background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
   ```

19. **HEX_6**: `#bfdbfe` (라인 388)
   ```
   background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
   ```

20. **HEX_6**: `#1d4ed8` (라인 458)
   ```
   background: #1d4ed8;
   ```

21. **HEX_6**: `#374151` (라인 526)
   ```
   background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
   ```

22. **HEX_6**: `#4b5563` (라인 526)
   ```
   background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
   ```

23. **HEX_6**: `#1e3a8a` (라인 549)
   ```
   background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
   ```

24. **HEX_6**: `#1e40af` (라인 549)
   ```
   background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
   ```

25. **HEX_6**: `#fca5a5` (라인 557)
   ```
   color: #fca5a5;
   ```

26. **RGBA**: `rgba(37, 99, 235, 0.2)` (라인 93)
   ```
   box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
   ```

27. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 129)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

28. **RGBA**: `rgba(37, 99, 235, 0.3)` (라인 176)
   ```
   box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
   ```

---

### 📁 `frontend/src/components/admin/VacationStatistics.js` (JS)

**하드코딩 색상**: 28개

1. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 176)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(52, 199, 89, 0.2) -> var(--mg-custom-color)
   ```

2. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 177)
   ```
   '연차': 'rgba(52, 199, 89, 0.2)',        // 연한 초록 (연차)
   ```

3. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 178)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
   ```

4. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 179)
   ```
   '반차': 'rgba(255, 149, 0, 0.2)',         // 연한 노랑 (반차)
   ```

5. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 180)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

6. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 181)
   ```
   '반반차': 'rgba(0, 122, 255, 0.2)',       // 연한 파랑 (반반차)
   ```

7. **RGBA**: `rgba(88, 86, 214, 0.2)` (라인 182)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(88, 86, 214, 0.2) -> var(--mg-custom-color)
   ```

8. **RGBA**: `rgba(88, 86, 214, 0.2)` (라인 183)
   ```
   '개인사정': 'rgba(88, 86, 214, 0.2)',     // 연한 보라 (개인사정)
   ```

9. **RGBA**: `rgba(255, 59, 48, 0.2)` (라인 184)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 59, 48, 0.2) -> var(--mg-custom-color)
   ```

10. **RGBA**: `rgba(255, 59, 48, 0.2)` (라인 185)
   ```
   '병가': 'rgba(255, 59, 48, 0.2)',         // 연한 빨강 (병가)
   ```

11. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 186)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(52, 199, 89, 0.2) -> var(--mg-custom-color)
   ```

12. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 187)
   ```
   '하루 종일 휴가': 'rgba(52, 199, 89, 0.2)',  // 연한 초록 (종일 휴가)
   ```

13. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 188)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.15) -> var(--mg-custom-color)
   ```

14. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 189)
   ```
   '사용자 정의 휴가': 'rgba(0, 122, 255, 0.15)', // 연한 하늘색 (사용자 정의)
   ```

15. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 191)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

16. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 192)
   ```
   '오전 반반차 1 (09:00-11:00)': 'rgba(0, 122, 255, 0.2)',
   ```

17. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 193)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

18. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 194)
   ```
   '오전 반반차 2 (11:00-13:00)': 'rgba(0, 122, 255, 0.2)',
   ```

19. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 195)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

20. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 196)
   ```
   '오후 반반차 1 (14:00-16:00)': 'rgba(0, 122, 255, 0.2)',
   ```

21. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 197)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

22. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 198)
   ```
   '오후 반반차 2 (16:00-18:00)': 'rgba(0, 122, 255, 0.2)',
   ```

23. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 199)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
   ```

24. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 200)
   ```
   '오전반차': 'rgba(255, 149, 0, 0.2)',
   ```

25. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 201)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
   ```

26. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 202)
   ```
   '오후반차': 'rgba(255, 149, 0, 0.2)'
   ```

27. **RGBA**: `rgba(248, 249, 250, 0.5)` (라인 204)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(248, 249, 250, 0.5) -> var(--mg-custom-color)
   ```

28. **RGBA**: `rgba(248, 249, 250, 0.5)` (라인 205)
   ```
   return colors[type] || 'rgba(248, 249, 250, 0.5)'; // 기본 연한 회색
   ```

---

### 📁 `frontend/src/styles/homepage/index.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#764ba2` (라인 225)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

2. **HEX_6**: `#f8f9ff` (라인 248)
   ```
   background: linear-gradient(135deg, var(--mg-white) 0%, #f8f9ff 100%);
   ```

3. **HEX_6**: `#2d3748` (라인 284)
   ```
   color: #2d3748;
   ```

4. **HEX_6**: `#718096` (라인 292)
   ```
   color: #718096;
   ```

5. **HEX_6**: `#764ba2` (라인 496)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

6. **HEX_6**: `#f5576c` (라인 500)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

7. **HEX_6**: `#4facfe` (라인 504)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

8. **HEX_6**: `#00f2fe` (라인 504)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

9. **HEX_6**: `#fa709a` (라인 508)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

10. **HEX_6**: `#fee140` (라인 508)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 19)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 26)
   ```
   background: rgba(255, 255, 255, 0.98);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 128)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 134)
   ```
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 259)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 485)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 492)
   ```
   box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 514)
   ```
   background-color: rgba(255, 255, 255, 0.2);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 534)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 646)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 648)
   ```
   box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
   ```

22. **RGBA**: `rgba(255, 255, 255, 1)` (라인 652)
   ```
   background: rgba(255, 255, 255, 1);
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 654)
   ```
   box-shadow: 0 8px 30px rgba(255, 255, 255, 0.4);
   ```

24. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 658)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 660)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 665)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

27. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 666)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

---

### 📁 `frontend/src/components/wellness/WellnessNotificationList.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#FF6B9D` (라인 26)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

2. **HEX_6**: `#FFA5C0` (라인 26)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

3. **HEX_6**: `#87CEEB` (라인 81)
   ```
   background: linear-gradient(180deg, #87CEEB, #B0E0E6);
   ```

4. **HEX_6**: `#B0E0E6` (라인 81)
   ```
   background: linear-gradient(180deg, #87CEEB, #B0E0E6);
   ```

5. **HEX_6**: `#87CEEB` (라인 89)
   ```
   border-color: #87CEEB;
   ```

6. **HEX_6**: `#FF6B9D` (라인 101)
   ```
   background: linear-gradient(180deg, #FF6B9D, #FFA5C0);
   ```

7. **HEX_6**: `#FFA5C0` (라인 101)
   ```
   background: linear-gradient(180deg, #FF6B9D, #FFA5C0);
   ```

8. **HEX_6**: `#FF8E8E` (라인 105)
   ```
   background: linear-gradient(180deg, var(--mg-error-500), #FF8E8E);
   ```

9. **HEX_6**: `#FF6B9D` (라인 128)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

10. **HEX_6**: `#FFA5C0` (라인 128)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

11. **HEX_6**: `#FF8E8E` (라인 133)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

12. **HEX_6**: `#FFD700` (라인 138)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

13. **HEX_6**: `#FFA500` (라인 138)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

14. **HEX_6**: `#87CEEB` (라인 151)
   ```
   color: #87CEEB;
   ```

15. **HEX_6**: `#87CEEB` (라인 203)
   ```
   color: #87CEEB;
   ```

16. **HEX_6**: `#87CEEB` (라인 211)
   ```
   color: #87CEEB;
   ```

17. **HEX_6**: `#87CEEB` (라인 242)
   ```
   color: #87CEEB;
   ```

18. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 15)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

19. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 15)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

20. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 16)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

21. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 32)
   ```
   box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
   ```

22. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 97)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

23. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 97)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

24. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 147)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

25. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 147)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

26. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 238)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

27. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 238)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

---

### 📁 `frontend/src/components/clinical/SmartNoteTab.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#1a202c` (라인 24)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#fef3c7` (라인 35)
   ```
   background: #fef3c7;
   ```

3. **HEX_6**: `#92400e` (라인 36)
   ```
   color: #92400e;
   ```

4. **HEX_6**: `#dbeafe` (라인 40)
   ```
   background: #dbeafe;
   ```

5. **HEX_6**: `#1e40af` (라인 41)
   ```
   color: #1e40af;
   ```

6. **HEX_6**: `#d1fae5` (라인 45)
   ```
   background: #d1fae5;
   ```

7. **HEX_6**: `#065f46` (라인 46)
   ```
   color: #065f46;
   ```

8. **HEX_6**: `#fee2e2` (라인 50)
   ```
   background: #fee2e2;
   ```

9. **HEX_6**: `#991b1b` (라인 51)
   ```
   color: #991b1b;
   ```

10. **HEX_6**: `#e5e7eb` (라인 65)
   ```
   border: 4px solid #e5e7eb;
   ```

11. **HEX_6**: `#2563eb` (라인 66)
   ```
   border-top-color: #2563eb;
   ```

12. **HEX_6**: `#f0f9ff` (라인 87)
   ```
   background: #f0f9ff;
   ```

13. **HEX_6**: `#1e40af` (라인 94)
   ```
   color: #1e40af;
   ```

14. **HEX_6**: `#d1d5db` (라인 100)
   ```
   border: 1px solid #d1d5db;
   ```

15. **HEX_6**: `#d97706` (라인 116)
   ```
   background: #d97706;
   ```

16. **HEX_6**: `#374151` (라인 134)
   ```
   color: #374151;
   ```

17. **HEX_6**: `#1f2937` (라인 169)
   ```
   color: #1f2937;
   ```

18. **HEX_6**: `#d1d5db` (라인 175)
   ```
   border: 1px solid #d1d5db;
   ```

19. **HEX_6**: `#2563eb` (라인 186)
   ```
   border-color: #2563eb;
   ```

20. **HEX_6**: `#fee2e2` (라인 191)
   ```
   background: #fee2e2;
   ```

21. **HEX_6**: `#fecaca` (라인 192)
   ```
   border: 1px solid #fecaca;
   ```

22. **HEX_6**: `#991b1b` (라인 193)
   ```
   color: #991b1b;
   ```

23. **HEX_6**: `#f0f9ff` (라인 201)
   ```
   background: #f0f9ff;
   ```

24. **HEX_6**: `#bfdbfe` (라인 202)
   ```
   border: 1px solid #bfdbfe;
   ```

25. **HEX_6**: `#1e40af` (라인 210)
   ```
   color: #1e40af;
   ```

26. **HEX_6**: `#1e3a8a` (라인 217)
   ```
   color: #1e3a8a;
   ```

27. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 187)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/DashboardManagement.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#e5e7eb` (라인 19)
   ```
   border-bottom: var(--mg-border-width-thick, 2px) solid var(--mg-border-color, #e5e7eb);
   ```

2. **HEX_6**: `#1f2937` (라인 32)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

3. **HEX_6**: `#6b7280` (라인 68)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

4. **HEX_6**: `#e5e7eb` (라인 76)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

5. **HEX_6**: `#6b7280` (라인 95)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

6. **HEX_6**: `#1f2937` (라인 104)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

7. **HEX_6**: `#6b7280` (라인 133)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

8. **HEX_6**: `#9ca3af` (라인 140)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

9. **HEX_6**: `#e5e7eb` (라인 158)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

10. **HEX_6**: `#f9fafb` (라인 172)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

11. **HEX_6**: `#e5e7eb` (라인 186)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

12. **HEX_6**: `#1f2937` (라인 205)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

13. **HEX_6**: `#6b7280` (라인 211)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

14. **HEX_6**: `#dbeafe` (라인 231)
   ```
   background: var(--mg-primary-light, #dbeafe);
   ```

15. **HEX_6**: `#d1fae5` (라인 236)
   ```
   background: var(--mg-success-light, #d1fae5);
   ```

16. **HEX_6**: `#f3f4f6` (라인 241)
   ```
   background: var(--mg-gray-light, #f3f4f6);
   ```

17. **HEX_6**: `#6b7280` (라인 242)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

18. **HEX_6**: `#6b7280` (라인 262)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

19. **HEX_6**: `#1f2937` (라인 267)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

20. **HEX_6**: `#6b7280` (라인 272)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

21. **HEX_6**: `#e5e7eb` (라인 281)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

22. **HEX_6**: `#f9fafb` (라인 302)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

23. **HEX_6**: `#e5e7eb` (라인 304)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

24. **HEX_6**: `#6b7280` (라인 316)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

25. **HEX_6**: `#1f2937` (라인 323)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

26. **HEX_6**: `#6b7280` (라인 331)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

27. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 85)
   ```
   box-shadow: var(--mg-shadow-focus, 0 0 0 3px rgba(59, 130, 246, 0.1));
   ```

---

### 📁 `frontend/src/styles/auth/TabletLogin.css` (CSS)

**하드코딩 색상**: 26개

1. **HEX_6**: `#9ca3af` (라인 145)
   ```
   color: #9ca3af;
   ```

2. **HEX_6**: `#f3f4f6` (라인 164)
   ```
   background: #f3f4f6;
   ```

3. **HEX_6**: `#2563eb` (라인 203)
   ```
   background: #2563eb;
   ```

4. **HEX_6**: `#059669` (라인 212)
   ```
   background: #059669;
   ```

5. **HEX_6**: `#4b5563` (라인 234)
   ```
   background: #4b5563;
   ```

6. **HEX_6**: `#9ca3af` (라인 240)
   ```
   color: #9ca3af;
   ```

7. **HEX_6**: `#059669` (라인 283)
   ```
   background: #059669;
   ```

8. **HEX_6**: `#e5e7eb` (라인 302)
   ```
   background: #e5e7eb;
   ```

9. **HEX_6**: `#e5e7eb` (라인 322)
   ```
   border: 1px solid #e5e7eb;
   ```

10. **HEX_6**: `#fef01b` (라인 347)
   ```
   background: #fef01b;
   ```

11. **HEX_6**: `#fef01b` (라인 349)
   ```
   border-color: #fef01b;
   ```

12. **HEX_6**: `#f4e800` (라인 353)
   ```
   background: #f4e800;
   ```

13. **HEX_6**: `#f4e800` (라인 354)
   ```
   border-color: #f4e800;
   ```

14. **HEX_6**: `#03c75a` (라인 358)
   ```
   background: #03c75a;
   ```

15. **HEX_6**: `#03c75a` (라인 360)
   ```
   border-color: #03c75a;
   ```

16. **HEX_6**: `#02b351` (라인 364)
   ```
   background: #02b351;
   ```

17. **HEX_6**: `#02b351` (라인 365)
   ```
   border-color: #02b351;
   ```

18. **HEX_6**: `#2563eb` (라인 398)
   ```
   color: #2563eb;
   ```

19. **HEX_6**: `#dc2626` (라인 416)
   ```
   background: #dc2626;
   ```

20. **HEX_6**: `#9ca3af` (라인 422)
   ```
   color: #9ca3af;
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 135)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

22. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 141)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 183)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

24. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 267)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

25. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 399)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

26. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 432)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/consultation/ConsultationReport.css` (CSS)

**하드코딩 색상**: 26개

1. **HEX_6**: `#e9ecef` (라인 9)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

2. **HEX_6**: `#e9ecef` (라인 53)
   ```
   background: #e9ecef;
   ```

3. **HEX_6**: `#495057` (라인 54)
   ```
   color: #495057;
   ```

4. **HEX_6**: `#e9ecef` (라인 58)
   ```
   background: #e9ecef;
   ```

5. **HEX_6**: `#495057` (라인 59)
   ```
   color: #495057;
   ```

6. **HEX_6**: `#495057` (라인 66)
   ```
   color: #495057;
   ```

7. **HEX_6**: `#f0f0f0` (라인 88)
   ```
   border: 1px solid #f0f0f0;
   ```

8. **HEX_6**: `#2c3e50` (라인 105)
   ```
   color: #2c3e50;
   ```

9. **HEX_6**: `#e9ecef` (라인 111)
   ```
   border: 2px solid #e9ecef;
   ```

10. **HEX_6**: `#fafbfc` (라인 114)
   ```
   background: #fafbfc;
   ```

11. **HEX_6**: `#495057` (라인 116)
   ```
   color: #495057;
   ```

12. **HEX_6**: `#e9ecef` (라인 146)
   ```
   border: 1px solid #e9ecef;
   ```

13. **HEX_6**: `#0056b3` (라인 162)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #0056b3);
   ```

14. **HEX_6**: `#495057` (라인 185)
   ```
   color: #495057;
   ```

15. **HEX_6**: `#e9ecef` (라인 200)
   ```
   border: 1px solid #e9ecef;
   ```

16. **HEX_6**: `#495057` (라인 207)
   ```
   color: #495057;
   ```

17. **HEX_6**: `#e9ecef` (라인 208)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

18. **HEX_6**: `#495057` (라인 228)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#495057` (라인 247)
   ```
   color: #495057;
   ```

20. **HEX_6**: `#495057` (라인 275)
   ```
   color: #495057;
   ```

21. **HEX_6**: `#495057` (라인 310)
   ```
   color: #495057;
   ```

22. **HEX_6**: `#0056b3` (라인 337)
   ```
   background: #0056b3;
   ```

23. **HEX_6**: `#0056b3` (라인 341)
   ```
   background: #0056b3;
   ```

24. **HEX_6**: `#e9ecef` (라인 381)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 87)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

26. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 123)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/academy/Academy.css` (CSS)

**하드코딩 색상**: 26개

1. **HEX_3**: `#ddd` (라인 30)
   ```
   border: 1px solid var(--color-border, #ddd);
   ```

2. **HEX_3**: `#333` (라인 34)
   ```
   color: var(--color-text, #333);
   ```

3. **HEX_3**: `#666` (라인 63)
   ```
   color: var(--color-text-secondary, #666);
   ```

4. **HEX_3**: `#333` (라인 95)
   ```
   color: var(--color-text, #333);
   ```

5. **HEX_3**: `#666` (라인 117)
   ```
   color: var(--color-text-secondary, #666);
   ```

6. **HEX_3**: `#ddd` (라인 129)
   ```
   border: 1px solid var(--color-border, #ddd);
   ```

7. **HEX_3**: `#333` (라인 133)
   ```
   color: var(--color-text, #333);
   ```

8. **HEX_3**: `#333` (라인 171)
   ```
   color: var(--color-text, #333);
   ```

9. **HEX_3**: `#ddd` (라인 178)
   ```
   border-bottom: 2px solid var(--color-border, #ddd);
   ```

10. **HEX_3**: `#666` (라인 188)
   ```
   color: var(--color-text-secondary, #666);
   ```

11. **HEX_3**: `#333` (라인 220)
   ```
   color: var(--color-text, #333);
   ```

12. **HEX_3**: `#666` (라인 227)
   ```
   color: var(--color-text-secondary, #666);
   ```

13. **HEX_3**: `#333` (라인 276)
   ```
   color: #333;
   ```

14. **HEX_3**: `#ddd` (라인 277)
   ```
   border: 1px solid var(--color-border, #ddd);
   ```

15. **HEX_3**: `#666` (라인 294)
   ```
   color: var(--color-text-secondary, #666);
   ```

16. **HEX_3**: `#ddd` (라인 302)
   ```
   border-bottom: 1px solid var(--color-border, #ddd);
   ```

17. **HEX_6**: `#FEE500` (라인 253)
   ```
   background-color: #FEE500;
   ```

18. **HEX_6**: `#FEE500` (라인 255)
   ```
   border: 1px solid #FEE500;
   ```

19. **HEX_6**: `#FDD835` (라인 259)
   ```
   background-color: #FDD835;
   ```

20. **HEX_6**: `#FDD835` (라인 260)
   ```
   border-color: #FDD835;
   ```

21. **HEX_6**: `#03C75A` (라인 264)
   ```
   background-color: #03C75A;
   ```

22. **HEX_6**: `#03C75A` (라인 266)
   ```
   border: 1px solid #03C75A;
   ```

23. **HEX_6**: `#02B350` (라인 270)
   ```
   background-color: #02B350;
   ```

24. **HEX_6**: `#02B350` (라인 271)
   ```
   border-color: #02B350;
   ```

25. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 46)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

26. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 142)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/test/PaymentTest.css` (CSS)

**하드코딩 색상**: 25개

1. **HEX_6**: `#e9ecef` (라인 13)
   ```
   border-bottom: 2px solid #e9ecef;
   ```

2. **HEX_6**: `#2c3e50` (라인 18)
   ```
   color: #2c3e50;
   ```

3. **HEX_6**: `#fef7f0` (라인 30)
   ```
   background: #fef7f0;
   ```

4. **HEX_6**: `#f5e6d3` (라인 34)
   ```
   border: 1px solid #f5e6d3;
   ```

5. **HEX_6**: `#495057` (라인 39)
   ```
   color: #495057;
   ```

6. **HEX_6**: `#495057` (라인 57)
   ```
   color: #495057;
   ```

7. **HEX_6**: `#ced4da` (라인 64)
   ```
   border: 1px solid #ced4da;
   ```

8. **HEX_6**: `#495057` (라인 84)
   ```
   color: #495057;
   ```

9. **HEX_6**: `#0056b3` (라인 118)
   ```
   background-color: #0056b3;
   ```

10. **HEX_6**: `#545b62` (라인 127)
   ```
   background-color: #545b62;
   ```

11. **HEX_6**: `#1e7e34` (라인 136)
   ```
   background-color: #1e7e34;
   ```

12. **HEX_6**: `#138496` (라인 145)
   ```
   background-color: #138496;
   ```

13. **HEX_6**: `#212529` (라인 150)
   ```
   color: #212529;
   ```

14. **HEX_6**: `#e0a800` (라인 154)
   ```
   background-color: #e0a800;
   ```

15. **HEX_6**: `#c82333` (라인 163)
   ```
   background-color: #c82333;
   ```

16. **HEX_6**: `#f3f3f3` (라인 181)
   ```
   border: 2px solid #f3f3f3;
   ```

17. **HEX_6**: `#dee2e6` (라인 204)
   ```
   border-bottom: 1px solid #dee2e6;
   ```

18. **HEX_6**: `#495057` (라인 205)
   ```
   color: #495057;
   ```

19. **HEX_6**: `#dee2e6` (라인 223)
   ```
   border-bottom: 1px solid #dee2e6;
   ```

20. **HEX_6**: `#2c3e50` (라인 250)
   ```
   color: #2c3e50;
   ```

21. **HEX_6**: `#495057` (라인 275)
   ```
   color: #495057;
   ```

22. **HEX_6**: `#f8d7da` (라인 281)
   ```
   background: #f8d7da;
   ```

23. **HEX_6**: `#721c24` (라인 282)
   ```
   color: #721c24;
   ```

24. **HEX_6**: `#f5c6cb` (라인 286)
   ```
   border: 1px solid #f5c6cb;
   ```

25. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 74)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantSchedule.css` (CSS)

**하드코딩 색상**: 25개

1. **HEX_6**: `#45a049` (라인 36)
   ```
   background: linear-gradient(135deg, var(--color-success), #45a049);
   ```

2. **HEX_6**: `#764ba2` (라인 54)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #764ba2);
   ```

3. **HEX_6**: `#F57C00` (라인 72)
   ```
   background: linear-gradient(135deg, var(--color-warning), #F57C00);
   ```

4. **HEX_6**: `#ffb300` (라인 183)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #ffb300 100%);
   ```

5. **HEX_6**: `#ffb300` (라인 194)
   ```
   background: linear-gradient(135deg, #ffb300 0%, #ffa000 100%);
   ```

6. **HEX_6**: `#ffa000` (라인 194)
   ```
   background: linear-gradient(135deg, #ffb300 0%, #ffa000 100%);
   ```

7. **HEX_6**: `#764ba2` (라인 286)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

8. **HEX_6**: `#45a049` (라인 387)
   ```
   background: linear-gradient(135deg, var(--color-success), #45a049);
   ```

9. **RGB**: `rgb(76, 175, 80)` (라인 156)
   ```
   .fc-event[style*="background-color: rgb(76, 175, 80)"] {
   ```

10. **RGB**: `rgb(33, 150, 243)` (라인 162)
   ```
   .fc-event[style*="background-color: rgb(33, 150, 243)"] {
   ```

11. **RGB**: `rgb(255, 152, 0)` (라인 168)
   ```
   .fc-event[style*="background-color: rgb(255, 152, 0)"] {
   ```

12. **RGB**: `rgb(244, 67, 54)` (라인 174)
   ```
   .fc-event[style*="background-color: rgb(244, 67, 54)"] {
   ```

13. **RGBA**: `rgba(76, 175, 80, 0.3)` (라인 45)
   ```
   box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
   ```

14. **RGBA**: `rgba(76, 175, 80, 0.4)` (라인 50)
   ```
   box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
   ```

15. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 63)
   ```
   box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
   ```

16. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 68)
   ```
   box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
   ```

17. **RGBA**: `rgba(255, 152, 0, 0.3)` (라인 81)
   ```
   box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
   ```

18. **RGBA**: `rgba(255, 152, 0, 0.4)` (라인 86)
   ```
   box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
   ```

19. **RGBA**: `rgba(255, 193, 7, 0.4)` (라인 185)
   ```
   box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 188)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
   ```

21. **RGBA**: `rgba(255, 193, 7, 0.5)` (라인 196)
   ```
   box-shadow: 0 4px 12px rgba(255, 193, 7, 0.5);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 318)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

23. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 358)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

24. **RGBA**: `rgba(76, 175, 80, 0.3)` (라인 389)
   ```
   box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
   ```

25. **RGBA**: `rgba(76, 175, 80, 0.4)` (라인 394)
   ```
   box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
   ```

---

### 📁 `frontend/src/components/admin/Dashboard3DPreview.css` (CSS)

**하드코딩 색상**: 25개

1. **HEX_6**: `#f9fafb` (라인 11)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

2. **HEX_6**: `#e5e7eb` (라인 13)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

3. **HEX_6**: `#e5e7eb` (라인 38)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

4. **HEX_6**: `#1f2937` (라인 51)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

5. **HEX_6**: `#f9fafb` (라인 68)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

6. **HEX_6**: `#e5e7eb` (라인 69)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

7. **HEX_6**: `#6b7280` (라인 73)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

8. **HEX_6**: `#f3f4f6` (라인 78)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

9. **HEX_6**: `#6b7280` (라인 85)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

10. **HEX_6**: `#764ba2` (라인 97)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

11. **HEX_6**: `#f9fafb` (라인 142)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

12. **HEX_6**: `#e5e7eb` (라인 143)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

13. **HEX_6**: `#e5e7eb` (라인 162)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

14. **HEX_6**: `#1f2937` (라인 172)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

15. **HEX_6**: `#9ca3af` (라인 185)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

16. **HEX_6**: `#6b7280` (라인 196)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

17. **HEX_6**: `#f9fafb` (라인 197)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

18. **HEX_6**: `#e5e7eb` (라인 199)
   ```
   border: var(--mg-border-width, 2px) dashed var(--mg-border-color, #e5e7eb);
   ```

19. **HEX_6**: `#e5e7eb` (라인 212)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

20. **HEX_6**: `#6b7280` (라인 218)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 113)
   ```
   radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 114)
   ```
   radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 132)
   ```
   0 20px 25px -5px rgba(0, 0, 0, 0.3),
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 133)
   ```
   0 10px 10px -5px rgba(0, 0, 0, 0.2),
   ```

25. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 134)
   ```
   0 0 0 1px rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/common/StatsCardGrid.js` (JS)

**하드코딩 색상**: 25개

1. **HEX_6**: `#e9ecef` (라인 89)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
   ```

2. **HEX_6**: `#e9ecef` (라인 90)
   ```
   border: '1px solid #e9ecef',
   ```

3. **HEX_6**: `#E8E0FF` (라인 120)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #E8E0FF -> var(--mg-custom-E8E0FF)
   ```

4. **HEX_6**: `#E8E0FF` (라인 121)
   ```
   backgroundColor: '#E8E0FF',
   ```

5. **HEX_6**: `#D1C4E9` (라인 125)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D1C4E9 -> var(--mg-custom-D1C4E9)
   ```

6. **HEX_6**: `#D1C4E9` (라인 126)
   ```
   border: '1px solid #D1C4E9',
   ```

7. **HEX_6**: `#7B68EE` (라인 136)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7B68EE -> var(--mg-custom-7B68EE)
   ```

8. **HEX_6**: `#7B68EE` (라인 137)
   ```
   backgroundColor: '#7B68EE',
   ```

9. **HEX_6**: `#495057` (라인 147)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

10. **HEX_6**: `#7B68EE` (라인 150)
   ```
   <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: '700', color: '#7B68EE', margin: '0 0 4px 0' }}>
   ```

11. **HEX_6**: `#FFE8D1` (라인 161)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFE8D1 -> var(--mg-custom-FFE8D1)
   ```

12. **HEX_6**: `#FFE8D1` (라인 162)
   ```
   backgroundColor: '#FFE8D1',
   ```

13. **HEX_6**: `#FFCCBC` (라인 166)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFCCBC -> var(--mg-custom-FFCCBC)
   ```

14. **HEX_6**: `#FFCCBC` (라인 167)
   ```
   border: '1px solid #FFCCBC',
   ```

15. **HEX_6**: `#495057` (라인 187)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

16. **HEX_6**: `#D4F1E0` (라인 201)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D4F1E0 -> var(--mg-custom-D4F1E0)
   ```

17. **HEX_6**: `#D4F1E0` (라인 202)
   ```
   backgroundColor: '#D4F1E0',
   ```

18. **HEX_6**: `#C8E6C9` (라인 206)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #C8E6C9 -> var(--mg-custom-C8E6C9)
   ```

19. **HEX_6**: `#C8E6C9` (라인 207)
   ```
   border: '1px solid #C8E6C9',
   ```

20. **HEX_6**: `#495057` (라인 227)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

21. **HEX_6**: `#FFE0DB` (라인 241)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFE0DB -> var(--mg-custom-FFE0DB)
   ```

22. **HEX_6**: `#FFE0DB` (라인 242)
   ```
   backgroundColor: '#FFE0DB',
   ```

23. **HEX_6**: `#FFCDD2` (라인 246)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FFCDD2 -> var(--mg-custom-FFCDD2)
   ```

24. **HEX_6**: `#FFCDD2` (라인 247)
   ```
   border: '1px solid #FFCDD2',
   ```

25. **HEX_6**: `#495057` (라인 267)
   ```
   <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: '#495057' }}>
   ```

---

### 📁 `frontend/src/constants/charts.js` (JS)

**하드코딩 색상**: 22개

1. **HEX_6**: `#343a40` (라인 32)
   ```
   DARK: '#343a40',
   ```

2. **HEX_6**: `#059669` (라인 43)
   ```
   FILL: '#059669',
   ```

3. **HEX_6**: `#2563eb` (라인 44)
   ```
   BORDER: '#2563eb'
   ```

4. **HEX_6**: `#34d399` (라인 53)
   ```
   INCOME_FILL: '#34d399',
   ```

5. **HEX_6**: `#059669` (라인 54)
   ```
   INCOME_BORDER: '#059669',
   ```

6. **HEX_6**: `#ef4444` (라인 55)
   ```
   EXPENSE_FILL: '#ef4444',
   ```

7. **HEX_6**: `#dc2626` (라인 56)
   ```
   EXPENSE_BORDER: '#dc2626'
   ```

8. **HEX_6**: `#0d9488` (라인 64)
   ```
   '#0d9488',
   ```

9. **HEX_6**: `#fb923c` (라인 65)
   ```
   '#fb923c',
   ```

10. **HEX_6**: `#7c3aed` (라인 66)
   ```
   '#7c3aed',
   ```

11. **HEX_6**: `#2563eb` (라인 67)
   ```
   '#2563eb',
   ```

12. **HEX_6**: `#64748b` (라인 68)
   ```
   '#64748b'
   ```

13. **HEX_6**: `#0056b3` (라인 72)
   ```
   PRIMARY: ['var(--mg-primary-500)', '#0056b3'],
   ```

14. **HEX_6**: `#1e7e34` (라인 73)
   ```
   SUCCESS: ['var(--mg-success-500)', '#1e7e34'],
   ```

15. **HEX_6**: `#e0a800` (라인 74)
   ```
   WARNING: ['var(--mg-warning-500)', '#e0a800'],
   ```

16. **HEX_6**: `#c82333` (라인 75)
   ```
   DANGER: ['var(--mg-error-500)', '#c82333'],
   ```

17. **HEX_6**: `#138496` (라인 76)
   ```
   INFO: ['var(--mg-info-500)', '#138496'],
   ```

18. **HEX_6**: `#545b62` (라인 77)
   ```
   SECONDARY: ['var(--mg-secondary-500)', '#545b62']
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 106)
   ```
   BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 109)
   ```
   BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 161)
   ```
   BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 164)
   ```
   BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
   ```

---

### 📁 `frontend/src/styles/modules/schedule-modal.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#F5F5F7` (라인 198)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

2. **HEX_6**: `#A1A1A6` (라인 204)
   ```
   background: var(--color-border-accent, #A1A1A6);
   ```

3. **HEX_6**: `#FAFAFA` (라인 216)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

4. **HEX_6**: `#E3F2FD` (라인 237)
   ```
   background: var(--color-primary-light, #E3F2FD);
   ```

5. **HEX_6**: `#F5F5F7` (라인 243)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

6. **HEX_6**: `#D1D1D6` (라인 254)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

7. **HEX_6**: `#FAFAFA` (라인 257)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

8. **HEX_6**: `#D1D1D6` (라인 270)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

9. **HEX_6**: `#FAFAFA` (라인 273)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

10. **HEX_6**: `#D1D1D6` (라인 287)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

11. **HEX_6**: `#FAFAFA` (라인 289)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

12. **HEX_6**: `#A1A1A6` (라인 298)
   ```
   border-color: var(--color-border-accent, #A1A1A6);
   ```

13. **HEX_6**: `#FAFAFA` (라인 311)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

14. **HEX_6**: `#FFFEF7` (라인 329)
   ```
   background: var(--light-cream, #FFFEF7);
   ```

15. **HEX_6**: `#0056CC` (라인 404)
   ```
   background: var(--color-primary-hover, #0056CC);
   ```

16. **HEX_6**: `#D1D1D6` (라인 419)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

17. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 230)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
   ```

18. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 238)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
   ```

19. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 265)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 334)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

21. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 406)
   ```
   box-shadow: var(--shadow-hover-primary, 0 4px 12px rgba(0, 122, 255, 0.3));
   ```

---

### 📁 `frontend/src/styles/06-components/_cards.css` (CSS)

**하드코딩 색상**: 21개

1. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 111)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 139)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 160)
   ```
   background: rgba(255, 255, 255, 0.05);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 172)
   ```
   text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 177)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 203)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 271)
   ```
   rgba(102, 126, 234, 0.8),
   ```

8. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 272)
   ```
   rgba(118, 75, 162, 0.8));
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 305)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

10. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 325)
   ```
   background: rgba(40, 167, 69, 0.2);
   ```

11. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 327)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

12. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 331)
   ```
   background: rgba(220, 53, 69, 0.2);
   ```

13. **RGBA**: `rgba(220, 53, 69, 0.2)` (라인 333)
   ```
   box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.8)` (라인 360)
   ```
   rgba(102, 126, 234, 0.8),
   ```

15. **RGBA**: `rgba(118, 75, 162, 0.8)` (라인 361)
   ```
   rgba(118, 75, 162, 0.8));
   ```

16. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 385)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

17. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 386)
   ```
   border-color: rgba(0, 122, 255, 0.3);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 405)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 592)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 594)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

21. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 617)
   ```
   box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/emotion/FacialEmotionTimeline.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#374151` (라인 10)
   ```
   color: #374151;
   ```

2. **HEX_6**: `#4b5563` (라인 28)
   ```
   color: #4b5563;
   ```

3. **HEX_6**: `#e5e7eb` (라인 34)
   ```
   background: #e5e7eb;
   ```

4. **HEX_6**: `#fbbf24` (라인 44)
   ```
   .emotion-joy .bar { background: linear-gradient(90deg, #fbbf24, var(--mg-warning-500)); }
   ```

5. **HEX_6**: `#60a5fa` (라인 45)
   ```
   .emotion-sorrow .bar { background: linear-gradient(90deg, #60a5fa, var(--mg-primary-500)); }
   ```

6. **HEX_6**: `#f87171` (라인 46)
   ```
   .emotion-anger .bar { background: linear-gradient(90deg, #f87171, #dc2626); }
   ```

7. **HEX_6**: `#dc2626` (라인 46)
   ```
   .emotion-anger .bar { background: linear-gradient(90deg, #f87171, #dc2626); }
   ```

8. **HEX_6**: `#a78bfa` (라인 47)
   ```
   .emotion-fear .bar { background: linear-gradient(90deg, #a78bfa, var(--mg-purple-500)); }
   ```

9. **HEX_6**: `#34d399` (라인 48)
   ```
   .emotion-surprise .bar { background: linear-gradient(90deg, #34d399, var(--mg-success-500)); }
   ```

10. **HEX_6**: `#1f2937` (라인 54)
   ```
   color: #1f2937;
   ```

11. **HEX_6**: `#e5e7eb` (라인 59)
   ```
   border-top: 1px solid #e5e7eb;
   ```

12. **HEX_6**: `#374151` (라인 65)
   ```
   color: #374151;
   ```

13. **HEX_6**: `#f9fafb` (라인 74)
   ```
   background: #f9fafb;
   ```

14. **HEX_6**: `#fbbf24` (라인 96)
   ```
   .mini-bar.joy { background: #fbbf24; }
   ```

15. **HEX_6**: `#60a5fa` (라인 97)
   ```
   .mini-bar.sorrow { background: #60a5fa; }
   ```

16. **HEX_6**: `#f87171` (라인 98)
   ```
   .mini-bar.anger { background: #f87171; }
   ```

17. **HEX_6**: `#a78bfa` (라인 99)
   ```
   .mini-bar.fear { background: #a78bfa; }
   ```

18. **HEX_6**: `#6b7280` (라인 103)
   ```
   color: #6b7280;
   ```

19. **HEX_6**: `#dbeafe` (라인 108)
   ```
   background: #dbeafe;
   ```

20. **HEX_6**: `#1e40af` (라인 112)
   ```
   color: #1e40af;
   ```

21. **HEX_6**: `#1e3a8a` (라인 116)
   ```
   color: #1e3a8a;
   ```

---

### 📁 `frontend/src/components/emotion/EmotionDashboard.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#f9fafb` (라인 3)
   ```
   background: #f9fafb;
   ```

2. **HEX_6**: `#1f2937` (라인 21)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#6b7280` (라인 32)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#4b5563` (라인 60)
   ```
   color: #4b5563;
   ```

5. **HEX_6**: `#1f2937` (라인 66)
   ```
   color: #1f2937;
   ```

6. **HEX_6**: `#e5e7eb` (라인 72)
   ```
   background: #e5e7eb;
   ```

7. **HEX_6**: `#dc2626` (라인 82)
   ```
   .metric-bar-fill.anxiety { background: linear-gradient(90deg, var(--mg-warning-500), #dc2626); }
   ```

8. **HEX_6**: `#6366f1` (라인 83)
   ```
   .metric-bar-fill.depression { background: linear-gradient(90deg, #6366f1, var(--mg-primary-500)); }
   ```

9. **HEX_6**: `#f97316` (라인 84)
   ```
   .metric-bar-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

10. **HEX_6**: `#ea580c` (라인 84)
   ```
   .metric-bar-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

11. **HEX_6**: `#34d399` (라인 85)
   ```
   .metric-bar-fill.energy { background: linear-gradient(90deg, var(--mg-success-500), #34d399); }
   ```

12. **HEX_6**: `#1f2937` (라인 103)
   ```
   color: #1f2937;
   ```

13. **HEX_6**: `#f3f4f6` (라인 116)
   ```
   background: #f3f4f6;
   ```

14. **HEX_6**: `#374151` (라인 119)
   ```
   color: #374151;
   ```

15. **HEX_6**: `#dbeafe` (라인 125)
   ```
   background: #dbeafe;
   ```

16. **HEX_6**: `#1e40af` (라인 132)
   ```
   color: #1e40af;
   ```

17. **HEX_6**: `#e5e7eb` (라인 143)
   ```
   border: 4px solid #e5e7eb;
   ```

18. **RGBA**: `rgba(0,0,0,0.1)` (라인 15)
   ```
   box-shadow: 0 1px 3px rgba(0,0,0,0.1);
   ```

19. **RGBA**: `rgba(0,0,0,0.1)` (라인 54)
   ```
   box-shadow: 0 1px 3px rgba(0,0,0,0.1);
   ```

20. **RGBA**: `rgba(0,0,0,0.1)` (라인 97)
   ```
   box-shadow: 0 1px 3px rgba(0,0,0,0.1);
   ```

21. **RGBA**: `rgba(0,0,0,0.1)` (라인 110)
   ```
   box-shadow: 0 1px 3px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#3D5246` (라인 30)
   ```
   color: var(--mg-color-primary-main, #3D5246);
   ```

2. **HEX_6**: `#D4CFC8` (라인 50)
   ```
   border-bottom: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

3. **HEX_6**: `#5C6B61` (라인 60)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

4. **HEX_6**: `#2C2C2C` (라인 71)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

5. **HEX_6**: `#2C2C2C` (라인 76)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

6. **HEX_6**: `#3D5246` (라인 77)
   ```
   border-bottom-color: var(--mg-color-primary-main, #3D5246);
   ```

7. **HEX_6**: `#D4CFC8` (라인 112)
   ```
   background: var(--mg-color-border-main, #D4CFC8);
   ```

8. **HEX_6**: `#3D5246` (라인 116)
   ```
   background: var(--mg-color-primary-main, #3D5246);
   ```

9. **HEX_6**: `#4A6354` (라인 121)
   ```
   background: var(--mg-color-primary-light, #4A6354);
   ```

10. **HEX_6**: `#D4CFC8` (라인 127)
   ```
   border-bottom: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

11. **HEX_6**: `#FAF9F7` (라인 142)
   ```
   background-color: var(--mg-color-background-main, #FAF9F7);
   ```

12. **HEX_6**: `#3D5246` (라인 155)
   ```
   background-color: var(--mg-color-primary-main, #3D5246);
   ```

13. **HEX_6**: `#4A6354` (라인 163)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

14. **HEX_6**: `#2C2C2C` (라인 188)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

15. **HEX_6**: `#5C6B61` (라인 198)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

16. **HEX_6**: `#5C6B61` (라인 205)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

17. **HEX_6**: `#5C6B61` (라인 218)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

18. **HEX_6**: `#D4CFC8` (라인 223)
   ```
   border-top: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

19. **HEX_6**: `#3D5246` (라인 231)
   ```
   color: var(--mg-color-primary-main, #3D5246);
   ```

20. **HEX_6**: `#2C2C2C` (라인 266)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

21. **RGBA**: `rgba(61, 82, 70, 0.05)` (라인 146)
   ```
   background-color: rgba(61, 82, 70, 0.05);
   ```

---

### 📁 `frontend/src/components/common/SimpleHeader.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#1f2937` (라인 59)
   ```
   color: var(--mg-color-text, #1f2937);
   ```

2. **HEX_6**: `#dc2626` (라인 284)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #dc2626);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 3)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 4)
   ```
   border-bottom: 1px solid var(--cs-secondary-200, rgba(0, 0, 0, 0.08));
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5)
   ```
   box-shadow: 0 1px 20px rgba(0, 0, 0, 0.08),
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 6)
   ```
   0 1px 3px rgba(0, 0, 0, 0.05);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 24)
   ```
   background: rgba(255, 255, 255, 0.85);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 27)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 28)
   ```
   box-shadow: 0 1px 10px rgba(0, 0, 0, 0.05);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 56)
   ```
   background: rgba(0, 0, 0, 0.05);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 128)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 129)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 142)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 166)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 170)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 182)
   ```
   border-color: rgba(255, 255, 255, 0.6);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 216)
   ```
   color: rgba(255, 255, 255, 0.8);
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 229)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 261)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

20. **RGBA**: `rgba(239, 68, 68, 0.4)` (라인 295)
   ```
   box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 296)
   ```
   border: 2px solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/common/CustomSelect.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_3**: `#666` (라인 56)
   ```
   color: #666;
   ```

2. **HEX_3**: `#666` (라인 151)
   ```
   color: #666;
   ```

3. **HEX_6**: `#cbd5e0` (라인 16)
   ```
   border: 1px solid #cbd5e0;
   ```

4. **HEX_6**: `#f8fafc` (라인 18)
   ```
   background: #f8fafc;
   ```

5. **HEX_6**: `#3182ce` (라인 26)
   ```
   border-color: #3182ce;
   ```

6. **HEX_6**: `#3182ce` (라인 31)
   ```
   border: 2px solid #3182ce;
   ```

7. **HEX_6**: `#3182ce` (라인 36)
   ```
   border: 2px solid #3182ce;
   ```

8. **HEX_6**: `#fff5f5` (라인 41)
   ```
   background: #fff5f5;
   ```

9. **HEX_6**: `#e53e3e` (라인 42)
   ```
   border: 1px solid #e53e3e;
   ```

10. **HEX_6**: `#2d3748` (라인 47)
   ```
   color: #2d3748;
   ```

11. **HEX_6**: `#E8E8ED` (라인 102)
   ```
   border-bottom: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

12. **HEX_6**: `#F5F5F7` (라인 163)
   ```
   background-color: var(--color-bg-secondary, #F5F5F7);
   ```

13. **HEX_6**: `#E8E8ED` (라인 172)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

14. **RGBA**: `rgba(49, 130, 206, 0.2)` (라인 32)
   ```
   box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
   ```

15. **RGBA**: `rgba(49, 130, 206, 0.2)` (라인 37)
   ```
   box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 70)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 75)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

18. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 116)
   ```
   box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 130)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

20. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 138)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

21. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 143)
   ```
   background-color: rgba(0, 123, 255, 0.15);
   ```

---

### 📁 `frontend/src/components/admin/DashboardLayoutEditor.css` (CSS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#f9fafb` (라인 16)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

2. **HEX_6**: `#e5e7eb` (라인 18)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

3. **HEX_6**: `#e5e7eb` (라인 26)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

4. **HEX_6**: `#1f2937` (라인 33)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

5. **HEX_6**: `#6b7280` (라인 40)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

6. **HEX_6**: `#e5e7eb` (라인 139)
   ```
   border: var(--mg-border-width, 2px) solid var(--mg-border-color, #e5e7eb);
   ```

7. **HEX_6**: `#f9fafb` (라인 156)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

8. **HEX_6**: `#f9fafb` (라인 176)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

9. **HEX_6**: `#e5e7eb` (라인 177)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

10. **HEX_6**: `#9ca3af` (라인 182)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

11. **HEX_6**: `#1f2937` (라인 197)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

12. **HEX_6**: `#6b7280` (라인 209)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

13. **HEX_6**: `#f3f4f6` (라인 220)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

14. **HEX_6**: `#1f2937` (라인 221)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

15. **HEX_6**: `#1f2937` (라인 249)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

16. **HEX_6**: `#9ca3af` (라인 254)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

17. **HEX_6**: `#6b7280` (라인 261)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

18. **HEX_6**: `#e5e7eb` (라인 264)
   ```
   border: var(--mg-border-width, 2px) dashed var(--mg-border-color, #e5e7eb);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 150)
   ```
   box-shadow: var(--mg-shadow-md, 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 162)
   ```
   box-shadow: var(--mg-shadow-lg, 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
   ```

21. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 225)
   ```
   background: var(--mg-danger-alpha, rgba(239, 68, 68, 0.1));
   ```

---

### 📁 `frontend/src/components/consultant/ConsultationRecordScreen.js` (JS)

**하드코딩 색상**: 21개

1. **HEX_6**: `#fd7e14` (라인 59)
   ```
   { value: 'HIGH', label: '높음', icon: '🟠', color: 'var(--mg-warning-500, #fd7e14)', description: '높은 우선순위' },
   ```

2. **HEX_6**: `#6f42c1` (라인 61)
   ```
   { value: 'CRITICAL', label: '위험', icon: '🚨', color: 'var(--mg-purple-500, #6f42c1)', description: '위험 우선순위' }
   ```

3. **HEX_6**: `#e9ecef` (라인 122)
   ```
   border: '1px solid var(--mg-gray-200, #e9ecef)'
   ```

4. **HEX_6**: `#2c3e50` (라인 127)
   ```
   color: 'var(--mg-gray-800, #2c3e50)',
   ```

5. **HEX_6**: `#e9ecef` (라인 144)
   ```
   border: '1px solid var(--mg-gray-200, #e9ecef)'
   ```

6. **HEX_6**: `#2c3e50` (라인 149)
   ```
   color: 'var(--mg-gray-800, #2c3e50)',
   ```

7. **HEX_6**: `#2c3e50` (라인 174)
   ```
   color: 'var(--mg-gray-800, #2c3e50)',
   ```

8. **HEX_6**: `#e9ecef` (라인 182)
   ```
   border: '1px solid var(--mg-gray-200, #e9ecef)'
   ```

9. **HEX_6**: `#2c3e50` (라인 187)
   ```
   color: 'var(--mg-gray-800, #2c3e50)',
   ```

10. **HEX_6**: `#495057` (라인 206)
   ```
   color: '#495057',
   ```

11. **HEX_6**: `#e9ecef` (라인 211)
   ```
   border: '2px solid #e9ecef',
   ```

12. **HEX_6**: `#e9ecef` (라인 219)
   ```
   border: '2px solid #e9ecef',
   ```

13. **HEX_6**: `#e9ecef` (라인 230)
   ```
   border: '2px solid #e9ecef',
   ```

14. **HEX_6**: `#e9ecef` (라인 247)
   ```
   borderTop: '1px solid #e9ecef'
   ```

15. **HEX_6**: `#e9ecef` (라인 284)
   ```
   backgroundColor: '#e9ecef',
   ```

16. **HEX_6**: `#5C6B61` (라인 631)
   ```
   <div className="mg-v2-card mg-mb-lg" style={{ borderLeft: '4px solid var(--mg-color-secondary-main, #5C6B61)' }}>
   ```

17. **RGBA**: `rgba(0,0,0,0.1)` (라인 121)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

18. **RGBA**: `rgba(0,0,0,0.1)` (라인 143)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

19. **RGBA**: `rgba(0,0,0,0.1)` (라인 181)
   ```
   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
   ```

20. **RGBA**: `rgba(0,123,255,0.1)` (라인 239)
   ```
   boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
   ```

21. **RGBA**: `rgba(0,0,0,0.5)` (라인 300)
   ```
   backgroundColor: 'rgba(0,0,0,0.5)',
   ```

---

### 📁 `frontend/src/components/test/IntegrationTest.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_3**: `#eee` (라인 29)
   ```
   border-bottom: 1px solid #eee;
   ```

2. **HEX_3**: `#333` (라인 34)
   ```
   color: #333;
   ```

3. **HEX_3**: `#666` (라인 43)
   ```
   color: #666;
   ```

4. **HEX_3**: `#eee` (라인 80)
   ```
   border-top: 1px solid #eee;
   ```

5. **HEX_3**: `#333` (라인 85)
   ```
   color: #333;
   ```

6. **HEX_3**: `#333` (라인 118)
   ```
   color: #333;
   ```

7. **HEX_3**: `#666` (라인 123)
   ```
   color: #666;
   ```

8. **HEX_3**: `#999` (라인 128)
   ```
   color: #999;
   ```

9. **HEX_3**: `#eee` (라인 135)
   ```
   border-top: 1px solid #eee;
   ```

10. **HEX_3**: `#333` (라인 140)
   ```
   color: #333;
   ```

11. **HEX_3**: `#333` (라인 161)
   ```
   color: #333;
   ```

12. **HEX_3**: `#333` (라인 170)
   ```
   color: #333;
   ```

13. **HEX_3**: `#666` (라인 180)
   ```
   color: #666;
   ```

14. **HEX_3**: `#666` (라인 187)
   ```
   color: #666;
   ```

15. **HEX_6**: `#dee2e6` (라인 8)
   ```
   border: 1px solid #dee2e6;
   ```

16. **HEX_6**: `#212529` (라인 68)
   ```
   color: #212529;
   ```

17. **HEX_6**: `#e9ecef` (라인 95)
   ```
   border: 1px solid #e9ecef;
   ```

18. **HEX_6**: `#e9ecef` (라인 156)
   ```
   border: 1px solid #e9ecef;
   ```

19. **HEX_6**: `#f3f3f3` (라인 193)
   ```
   border: 4px solid #f3f3f3;
   ```

20. **RGBA**: `rgba(0,0,0,0.1)` (라인 12)
   ```
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/common/MGLoading.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#718096` (라인 16)
   ```
   color: #718096;
   ```

2. **HEX_6**: `#48cae4` (라인 56)
   ```
   border-top-color: #48cae4;
   ```

3. **HEX_6**: `#ff9ff3` (라인 61)
   ```
   border-top-color: #ff9ff3;
   ```

4. **HEX_6**: `#48cae4` (라인 102)
   ```
   background: #48cae4;
   ```

5. **HEX_6**: `#ff9ff3` (라인 106)
   ```
   background: #ff9ff3;
   ```

6. **HEX_6**: `#48cae4` (라인 146)
   ```
   background: #48cae4;
   ```

7. **HEX_6**: `#ff9ff3` (라인 150)
   ```
   background: #ff9ff3;
   ```

8. **HEX_6**: `#f0f0f0` (라인 166)
   ```
   background: linear-gradient(90deg, #f0f0f0 25%, var(--mg-gray-300) 50%, #f0f0f0 75%);
   ```

9. **HEX_6**: `#f0f0f0` (라인 166)
   ```
   background: linear-gradient(90deg, #f0f0f0 25%, var(--mg-gray-300) 50%, #f0f0f0 75%);
   ```

10. **HEX_6**: `#f0f0f0` (라인 203)
   ```
   background: #f0f0f0;
   ```

11. **HEX_6**: `#764ba2` (라인 220)
   ```
   background: linear-gradient(90deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

12. **HEX_6**: `#4a5568` (라인 240)
   ```
   color: #4a5568;
   ```

13. **HEX_6**: `#718096` (라인 246)
   ```
   color: #718096;
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 26)
   ```
   border: 3px solid rgba(102, 126, 234, 0.2);
   ```

15. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 52)
   ```
   border-color: rgba(102, 126, 234, 0.2);
   ```

16. **RGBA**: `rgba(72, 202, 228, 0.2)` (라인 57)
   ```
   border-color: rgba(72, 202, 228, 0.2);
   ```

17. **RGBA**: `rgba(255, 159, 243, 0.2)` (라인 62)
   ```
   border-color: rgba(255, 159, 243, 0.2);
   ```

18. **RGBA**: `rgba(255, 107, 107, 0.2)` (라인 67)
   ```
   border-color: rgba(255, 107, 107, 0.2);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 234)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 258)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/admin/MappingManagement.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#FAFAFA` (라인 15)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

2. **HEX_6**: `#1D1D1F` (라인 25)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

3. **HEX_6**: `#0056CC` (라인 26)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)) 0%, var(--color-primary-hover, #0056CC) 100%);
   ```

4. **HEX_6**: `#424245` (라인 35)
   ```
   color: var(--color-text-secondary, #424245);
   ```

5. **HEX_6**: `#FAFAFA` (라인 40)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

6. **HEX_6**: `#424245` (라인 59)
   ```
   color: var(--color-text-secondary, #424245);
   ```

7. **HEX_6**: `#1D1D1F` (라인 72)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

8. **HEX_6**: `#FAFAFA` (라인 86)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

9. **HEX_6**: `#F5F5F7` (라인 94)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

10. **HEX_6**: `#1D1D1F` (라인 98)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

11. **HEX_6**: `#0056CC` (라인 130)
   ```
   background-color: var(--color-primary-hover, #0056CC);
   ```

12. **HEX_6**: `#5a6268` (라인 141)
   ```
   background-color: var(--color-gray-dark, #5a6268);
   ```

13. **HEX_6**: `#218838` (라인 151)
   ```
   background-color: var(--color-success-dark, #218838);
   ```

14. **HEX_6**: `#c82333` (라인 161)
   ```
   background-color: var(--color-danger-dark, #c82333);
   ```

15. **HEX_6**: `#1D1D1F` (라인 167)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

16. **HEX_6**: `#e0a800` (라인 171)
   ```
   background-color: var(--color-warning-dark, #e0a800);
   ```

17. **HEX_6**: `#138496` (라인 181)
   ```
   background-color: var(--color-info-dark, #138496);
   ```

18. **HEX_6**: `#F5F5F7` (라인 280)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

19. **HEX_6**: `#F5F5F7` (라인 293)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

20. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 132)
   ```
   box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 123, 255, 0.3));
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeForm.css` (CSS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#d1d5db` (라인 14)
   ```
   border: 1px solid #d1d5db;
   ```

2. **HEX_6**: `#1f2937` (라인 68)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#6b7280` (라인 76)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#f3f4f6` (라인 84)
   ```
   background: #f3f4f6;
   ```

5. **HEX_6**: `#374151` (라인 85)
   ```
   color: #374151;
   ```

6. **HEX_6**: `#374151` (라인 108)
   ```
   color: #374151;
   ```

7. **HEX_6**: `#f9fafb` (라인 123)
   ```
   background-color: #f9fafb;
   ```

8. **HEX_6**: `#fef2f2` (라인 137)
   ```
   background-color: #fef2f2;
   ```

9. **HEX_6**: `#374151` (라인 152)
   ```
   color: #374151;
   ```

10. **HEX_6**: `#6b7280` (라인 192)
   ```
   color: #6b7280;
   ```

11. **HEX_6**: `#f9fafb` (라인 197)
   ```
   background: #f9fafb;
   ```

12. **HEX_6**: `#d1d5db` (라인 198)
   ```
   border-color: #d1d5db;
   ```

13. **HEX_6**: `#374151` (라인 199)
   ```
   color: #374151;
   ```

14. **HEX_6**: `#1d4ed8` (라인 203)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

15. **HEX_6**: `#1d4ed8` (라인 208)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

16. **HEX_6**: `#1e40af` (라인 208)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

17. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 30)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 53)
   ```
   box-shadow: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

19. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 131)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

20. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 210)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

---

### 📁 `frontend/src/components/common/SalaryExportModal.js` (JS)

**하드코딩 색상**: 20개

1. **HEX_6**: `#6b7280` (라인 184)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

2. **HEX_6**: `#6b7280` (라인 185)
   ```
   color: '#6b7280',
   ```

3. **HEX_6**: `#1f2937` (라인 191)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

4. **HEX_6**: `#1f2937` (라인 192)
   ```
   color: '#1f2937',
   ```

5. **HEX_6**: `#6b7280` (라인 202)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

6. **HEX_6**: `#6b7280` (라인 203)
   ```
   color: '#6b7280',
   ```

7. **HEX_6**: `#1f2937` (라인 209)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1f2937 -> var(--mg-custom-1f2937)
   ```

8. **HEX_6**: `#1f2937` (라인 210)
   ```
   color: '#1f2937',
   ```

9. **HEX_6**: `#6b7280` (라인 220)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

10. **HEX_6**: `#6b7280` (라인 221)
   ```
   color: '#6b7280',
   ```

11. **HEX_6**: `#059669` (라인 227)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #059669 -> var(--mg-custom-059669)
   ```

12. **HEX_6**: `#059669` (라인 228)
   ```
   color: '#059669',
   ```

13. **HEX_6**: `#d1d5db` (라인 309)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #d1d5db -> var(--mg-custom-d1d5db)
   ```

14. **HEX_6**: `#d1d5db` (라인 310)
   ```
   border: '1px solid #d1d5db',
   ```

15. **HEX_6**: `#dc2626` (라인 317)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #dc2626 -> var(--mg-custom-dc2626)
   ```

16. **HEX_6**: `#dc2626` (라인 318)
   ```
   color: '#dc2626',
   ```

17. **HEX_6**: `#dc2626` (라인 333)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #dc2626 -> var(--mg-custom-dc2626)
   ```

18. **HEX_6**: `#dc2626` (라인 334)
   ```
   color: '#dc2626',
   ```

19. **HEX_6**: `#fef2f2` (라인 335)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fef2f2 -> var(--mg-custom-fef2f2)
   ```

20. **HEX_6**: `#fef2f2` (라인 336)
   ```
   backgroundColor: '#fef2f2',
   ```

---

### 📁 `frontend/src/components/common/MGForm.css` (CSS)

**하드코딩 색상**: 19개

1. **HEX_6**: `#4a5568` (라인 86)
   ```
   color: #4a5568;
   ```

2. **HEX_6**: `#718096` (라인 129)
   ```
   color: #718096;
   ```

3. **HEX_6**: `#e2e8f0` (라인 143)
   ```
   border: 2px solid #e2e8f0;
   ```

4. **HEX_6**: `#1a202c` (라인 148)
   ```
   color: #1a202c;
   ```

5. **HEX_6**: `#e2e8f0` (라인 195)
   ```
   border: 2px solid #e2e8f0;
   ```

6. **HEX_6**: `#1a202c` (라인 200)
   ```
   color: #1a202c;
   ```

7. **HEX_6**: `#e2e8f0` (라인 238)
   ```
   border: 2px solid #e2e8f0;
   ```

8. **HEX_6**: `#1a202c` (라인 243)
   ```
   color: #1a202c;
   ```

9. **HEX_6**: `#718096` (라인 277)
   ```
   color: #718096;
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 13)
   ```
   box-shadow: 0 8px 32px var(--mg-shadow-light), 0 4px 16px rgba(0, 0, 0, 0.05);
   ```

11. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 14)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 49)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

13. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 156)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

14. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 174)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

15. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 210)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

16. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 220)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

17. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 253)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

18. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 263)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

19. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 308)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/clinical/AudioRecorder.css` (CSS)

**하드코딩 색상**: 19개

1. **HEX_6**: `#1a202c` (라인 20)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#2563eb` (라인 30)
   ```
   color: #2563eb;
   ```

3. **HEX_6**: `#6b7280` (라인 72)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#2563eb` (라인 105)
   ```
   background: #2563eb;
   ```

5. **HEX_6**: `#1d4ed8` (라인 110)
   ```
   background: #1d4ed8;
   ```

6. **HEX_6**: `#059669` (라인 119)
   ```
   background: #059669;
   ```

7. **HEX_6**: `#dc2626` (라인 128)
   ```
   background: #dc2626;
   ```

8. **HEX_6**: `#6b7280` (라인 132)
   ```
   background: #6b7280;
   ```

9. **HEX_6**: `#4b5563` (라인 137)
   ```
   background: #4b5563;
   ```

10. **HEX_6**: `#e5e7eb` (라인 154)
   ```
   background: #e5e7eb;
   ```

11. **HEX_6**: `#2563eb` (라인 162)
   ```
   background: linear-gradient(90deg, #2563eb, var(--mg-primary-500));
   ```

12. **HEX_6**: `#4b5563` (라인 170)
   ```
   color: #4b5563;
   ```

13. **HEX_6**: `#fee2e2` (라인 174)
   ```
   background: #fee2e2;
   ```

14. **HEX_6**: `#fecaca` (라인 175)
   ```
   border: 1px solid #fecaca;
   ```

15. **HEX_6**: `#991b1b` (라인 176)
   ```
   color: #991b1b;
   ```

16. **HEX_6**: `#f0f9ff` (라인 186)
   ```
   background: #f0f9ff;
   ```

17. **HEX_6**: `#2563eb` (라인 187)
   ```
   border-left: 4px solid #2563eb;
   ```

18. **HEX_6**: `#1e40af` (라인 194)
   ```
   color: #1e40af;
   ```

19. **HEX_6**: `#1e3a8a` (라인 203)
   ```
   color: #1e3a8a;
   ```

---

### 📁 `frontend/src/components/admin/mapping-management/organisms/MappingTableView.css` (CSS)

**하드코딩 색상**: 19개

1. **HEX_6**: `#e2e8f0` (라인 11)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

2. **HEX_6**: `#e2e8f0` (라인 25)
   ```
   border-bottom: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

3. **HEX_6**: `#fcfbfa` (라인 30)
   ```
   background: var(--ad-b0kla-bg, #fcfbfa);
   ```

4. **HEX_6**: `#64748b` (라인 31)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

5. **HEX_6**: `#fcfbfa` (라인 36)
   ```
   background: var(--ad-b0kla-bg, #fcfbfa);
   ```

6. **HEX_6**: `#2d3748` (라인 44)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

7. **HEX_6**: `#f0f5f9` (라인 68)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

8. **HEX_6**: `#6d9dc5` (라인 69)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

9. **HEX_6**: `#4b745c` (라인 106)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

10. **HEX_6**: `#4b745c` (라인 118)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

11. **HEX_6**: `#4b745c` (라인 123)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

12. **HEX_6**: `#4b745c` (라인 128)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

13. **HEX_6**: `#dc2626` (라인 136)
   ```
   background: var(--mg-error-600, #dc2626);
   ```

14. **HEX_6**: `#b91c1c` (라인 138)
   ```
   border: 1px solid var(--mg-error-700, #b91c1c);
   ```

15. **HEX_6**: `#b91c1c` (라인 145)
   ```
   background: var(--mg-error-700, #b91c1c);
   ```

16. **RGBA**: `rgba(75, 116, 92, 0.1)` (라인 122)
   ```
   background: rgba(75, 116, 92, 0.1);
   ```

17. **RGBA**: `rgba(75, 116, 92, 0.1)` (라인 127)
   ```
   background: rgba(75, 116, 92, 0.1) !important;
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 140)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
   ```

19. **RGBA**: `rgba(220, 38, 38, 0.25)` (라인 146)
   ```
   box-shadow: 0 2px 4px rgba(220, 38, 38, 0.25);
   ```

---

### 📁 `frontend/src/components/ui/Schedule/ScheduleCalendarView.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#FAF9F7` (라인 26)
   ```
   background-color: #FAF9F7;
   ```

2. **HEX_6**: `#D4CFC8` (라인 28)
   ```
   border: 1px solid #D4CFC8;
   ```

3. **HEX_6**: `#dc3545` (라인 65)
   ```
   border-left-color: var(--mg-error-500, #dc3545) !important;
   ```

4. **HEX_6**: `#f5f5f5` (라인 66)
   ```
   background-color: var(--mg-gray-100, #f5f5f5);
   ```

5. **HEX_6**: `#6b7280` (라인 70)
   ```
   color: var(--mg-gray-600, #6b7280);
   ```

6. **HEX_6**: `#dc3545` (라인 78)
   ```
   background-color: var(--mg-error-500, #dc3545);
   ```

7. **HEX_6**: `#2C2C2C` (라인 109)
   ```
   color: #2C2C2C;
   ```

8. **HEX_6**: `#5C6B61` (라인 125)
   ```
   color: #5C6B61;
   ```

9. **HEX_6**: `#8B7355` (라인 131)
   ```
   color: #8B7355;
   ```

10. **HEX_6**: `#2C2C2C` (라인 155)
   ```
   color: #2C2C2C;
   ```

11. **HEX_6**: `#6B7F72` (라인 160)
   ```
   color: #6B7F72;
   ```

12. **HEX_6**: `#D4CFC8` (라인 166)
   ```
   border: 1px dashed #D4CFC8;
   ```

13. **HEX_6**: `#495057` (라인 189)
   ```
   color: #495057;
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 41)
   ```
   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 54)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 60)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 97)
   ```
   box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 177)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/emotion/VoiceBiomarkerChart.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#f9fafb` (라인 15)
   ```
   background: #f9fafb;
   ```

2. **HEX_6**: `#e5e7eb` (라인 17)
   ```
   border: 1px solid #e5e7eb;
   ```

3. **HEX_6**: `#6b7280` (라인 22)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#dc2626` (라인 37)
   ```
   color: #dc2626;
   ```

5. **HEX_6**: `#9ca3af` (라인 42)
   ```
   color: #9ca3af;
   ```

6. **HEX_6**: `#f9fafb` (라인 47)
   ```
   background: var(--cs-secondary-50, #f9fafb);
   ```

7. **HEX_6**: `#374151` (라인 54)
   ```
   color: var(--cs-secondary-700, #374151);
   ```

8. **HEX_6**: `#4b5563` (라인 67)
   ```
   color: #4b5563;
   ```

9. **HEX_6**: `#e5e7eb` (라인 73)
   ```
   background: #e5e7eb;
   ```

10. **HEX_6**: `#fbbf24` (라인 83)
   ```
   .indicator-fill.anxiety { background: linear-gradient(90deg, #fbbf24, var(--mg-warning-500)); }
   ```

11. **HEX_6**: `#6366f1` (라인 84)
   ```
   .indicator-fill.depression { background: linear-gradient(90deg, #6366f1, #4f46e5); }
   ```

12. **HEX_6**: `#4f46e5` (라인 84)
   ```
   .indicator-fill.depression { background: linear-gradient(90deg, #6366f1, #4f46e5); }
   ```

13. **HEX_6**: `#f97316` (라인 85)
   ```
   .indicator-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

14. **HEX_6**: `#ea580c` (라인 85)
   ```
   .indicator-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

15. **HEX_6**: `#1f2937` (라인 91)
   ```
   color: #1f2937;
   ```

16. **HEX_6**: `#fef3c7` (라인 96)
   ```
   background: #fef3c7;
   ```

17. **HEX_6**: `#fbbf24` (라인 97)
   ```
   border: 1px solid #fbbf24;
   ```

18. **HEX_6**: `#92400e` (라인 99)
   ```
   color: #92400e;
   ```

---

### 📁 `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#F5F3EF` (라인 32)
   ```
   background-color: var(--mg-color-surface-main, #F5F3EF);
   ```

2. **HEX_6**: `#2C2C2C` (라인 39)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

3. **HEX_6**: `#5C6B61` (라인 49)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

4. **HEX_6**: `#D4CFC8` (라인 82)
   ```
   border-bottom: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

5. **HEX_6**: `#2C2C2C` (라인 107)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

6. **HEX_6**: `#5C6B61` (라인 120)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

7. **HEX_6**: `#3D5246` (라인 143)
   ```
   background-color: #3D5246;
   ```

8. **HEX_6**: `#6B7F72` (라인 148)
   ```
   background-color: #6B7F72;
   ```

9. **HEX_6**: `#8B7355` (라인 153)
   ```
   background-color: #8B7355;
   ```

10. **HEX_6**: `#D4CFC8` (라인 158)
   ```
   background-color: #D4CFC8;
   ```

11. **HEX_6**: `#2C2C2C` (라인 159)
   ```
   color: #2C2C2C;
   ```

12. **HEX_6**: `#2C2C2C` (라인 178)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

13. **HEX_6**: `#FAF9F7` (라인 186)
   ```
   background-color: var(--mg-color-background-main, #FAF9F7);
   ```

14. **HEX_6**: `#2C2C2C` (라인 190)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

15. **HEX_6**: `#EF4444` (라인 195)
   ```
   color: var(--mg-color-error-500, #EF4444);
   ```

16. **HEX_6**: `#EF4444` (라인 199)
   ```
   color: var(--mg-color-error-500, #EF4444);
   ```

17. **HEX_6**: `#F5F3EF` (라인 212)
   ```
   background-color: var(--mg-color-surface-main, #F5F3EF);
   ```

18. **HEX_6**: `#FAF9F7` (라인 234)
   ```
   background-color: var(--mg-color-background-main, #FAF9F7);
   ```

---

### 📁 `frontend/src/components/common/FormInput.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#2d3748` (라인 12)
   ```
   color: #2d3748;
   ```

2. **HEX_6**: `#c53030` (라인 17)
   ```
   color: #c53030;
   ```

3. **HEX_6**: `#e53e3e` (라인 21)
   ```
   color: #e53e3e;
   ```

4. **HEX_6**: `#2d3748` (라인 33)
   ```
   color: #2d3748;
   ```

5. **HEX_6**: `#cbd5e0` (라인 35)
   ```
   border: 1px solid #cbd5e0;
   ```

6. **HEX_6**: `#a0aec0` (라인 44)
   ```
   color: #a0aec0;
   ```

7. **HEX_6**: `#3182ce` (라인 53)
   ```
   border: 2px solid #3182ce;
   ```

8. **HEX_6**: `#fff5f5` (라인 65)
   ```
   background-color: #fff5f5;
   ```

9. **HEX_6**: `#e53e3e` (라인 66)
   ```
   border: 1px solid #e53e3e;
   ```

10. **HEX_6**: `#2d3748` (라인 67)
   ```
   color: #2d3748;
   ```

11. **HEX_6**: `#e53e3e` (라인 70)
   ```
   border: 2px solid #e53e3e;
   ```

12. **HEX_6**: `#edf2f7` (라인 77)
   ```
   background-color: #edf2f7;
   ```

13. **HEX_6**: `#a0aec0` (라인 78)
   ```
   color: #a0aec0;
   ```

14. **HEX_6**: `#cbd5e0` (라인 79)
   ```
   border: 1px solid #cbd5e0;
   ```

15. **HEX_6**: `#718096` (라인 97)
   ```
   color: #718096;
   ```

16. **HEX_6**: `#c53030` (라인 106)
   ```
   color: #c53030;
   ```

17. **RGBA**: `rgba(49, 130, 206, 0.2)` (라인 54)
   ```
   box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
   ```

18. **RGBA**: `rgba(229, 62, 62, 0.2)` (라인 71)
   ```
   box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.2);
   ```

---

### 📁 `frontend/src/constants/stats.js` (JS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#8B7ED8` (라인 63)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #8B7ED8 -> var(--mg-custom-8B7ED8)
   ```

2. **HEX_6**: `#8B7ED8` (라인 64)
   ```
   [STATS_TYPES.TOTAL_SCHEDULES]: '#8B7ED8',        // 부드러운 보라색
   ```

3. **HEX_6**: `#F4A261` (라인 65)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #F4A261 -> var(--mg-custom-F4A261)
   ```

4. **HEX_6**: `#F4A261` (라인 66)
   ```
   [STATS_TYPES.BOOKED_SCHEDULES]: '#F4A261',       // 부드러운 오렌지색
   ```

5. **HEX_6**: `#7BC4A4` (라인 68)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7BC4A4 -> var(--mg-custom-7BC4A4)
   ```

6. **HEX_6**: `#7BC4A4` (라인 69)
   ```
   [STATS_TYPES.COMPLETED_SCHEDULES]: '#7BC4A4',    // 부드러운 민트색
   ```

7. **HEX_6**: `#E76F51` (라인 70)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #E76F51 -> var(--mg-custom-E76F51)
   ```

8. **HEX_6**: `#E76F51` (라인 71)
   ```
   [STATS_TYPES.CANCELLED_SCHEDULES]: '#E76F51',    // 부드러운 코랄색
   ```

9. **HEX_6**: `#8B7ED8` (라인 72)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #8B7ED8 -> var(--mg-custom-8B7ED8)
   ```

10. **HEX_6**: `#8B7ED8` (라인 73)
   ```
   [STATS_TYPES.IN_PROGRESS_SCHEDULES]: '#8B7ED8',  // 부드러운 보라색
   ```

11. **HEX_6**: `#8B7ED8` (라인 74)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #8B7ED8 -> var(--mg-custom-8B7ED8)
   ```

12. **HEX_6**: `#8B7ED8` (라인 75)
   ```
   [STATS_TYPES.TODAY_TOTAL]: '#8B7ED8',            // 부드러운 보라색
   ```

13. **HEX_6**: `#7BC4A4` (라인 76)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #7BC4A4 -> var(--mg-custom-7BC4A4)
   ```

14. **HEX_6**: `#7BC4A4` (라인 77)
   ```
   [STATS_TYPES.TODAY_COMPLETED]: '#7BC4A4',        // 부드러운 민트색
   ```

15. **HEX_6**: `#E76F51` (라인 79)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #E76F51 -> var(--mg-custom-E76F51)
   ```

16. **HEX_6**: `#E76F51` (라인 80)
   ```
   [STATS_TYPES.TODAY_CANCELLED]: '#E76F51',        // 부드러운 코랄색
   ```

17. **HEX_6**: `#F4A261` (라인 81)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #F4A261 -> var(--mg-custom-F4A261)
   ```

18. **HEX_6**: `#F4A261` (라인 82)
   ```
   [STATS_TYPES.TODAY_BOOKED]: '#F4A261',           // 부드러운 오렌지색
   ```

---

### 📁 `frontend/src/components/admin/ClientCard.css` (CSS)

**하드코딩 색상**: 17개

1. **HEX_6**: `#1a1a1a` (라인 73)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 7)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 14)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 22)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 25)
   ```
   0 8px 24px rgba(0, 122, 255, 0.15),
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 26)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 30)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

9. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 33)
   ```
   0 8px 24px rgba(0, 122, 255, 0.2),
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 34)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

11. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 63)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

12. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 109)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 115)
   ```
   border-top: 1px solid rgba(255, 255, 255, 0.2);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 131)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 133)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

16. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 147)
   ```
   background: rgba(52, 199, 89, 0.2);
   ```

17. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 150)
   ```
   border: 1px solid rgba(52, 199, 89, 0.3);
   ```

---

### 📁 `frontend/src/components/admin/mapping-management/organisms/MappingListRow.css` (CSS)

**하드코딩 색상**: 17개

1. **HEX_6**: `#6d9dc5` (라인 68)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

2. **HEX_6**: `#2d3748` (라인 87)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

3. **HEX_6**: `#64748b` (라인 92)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

4. **HEX_6**: `#a0aec0` (라인 96)
   ```
   color: var(--ad-b0kla-placeholder, #a0aec0);
   ```

5. **HEX_6**: `#64748b` (라인 105)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

6. **HEX_6**: `#2d3748` (라인 111)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

7. **HEX_6**: `#64748b` (라인 119)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

8. **HEX_6**: `#4b745c` (라인 129)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

9. **HEX_6**: `#4b745c` (라인 137)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

10. **HEX_6**: `#64748b` (라인 158)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

11. **HEX_6**: `#dc2626` (라인 173)
   ```
   background: var(--mg-error-600, #dc2626);
   ```

12. **HEX_6**: `#b91c1c` (라인 175)
   ```
   border: 1px solid var(--mg-error-700, #b91c1c);
   ```

13. **HEX_6**: `#b91c1c` (라인 180)
   ```
   background: var(--mg-error-700, #b91c1c);
   ```

14. **RGBA**: `rgba(75, 116, 92, 0.1)` (라인 136)
   ```
   background: rgba(75, 116, 92, 0.1);
   ```

15. **RGBA**: `rgba(75, 116, 92, 0.1)` (라인 150)
   ```
   background: rgba(75, 116, 92, 0.1);
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 177)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
   ```

17. **RGBA**: `rgba(220, 38, 38, 0.25)` (라인 181)
   ```
   box-shadow: 0 2px 4px rgba(220, 38, 38, 0.25);
   ```

---

### 📁 `frontend/src/components/erd/ErdDetailPage.js` (JS)

**하드코딩 색상**: 17개

1. **HEX_3**: `#333` (라인 109)
   ```
   primaryTextColor: '#333',
   ```

2. **HEX_3**: `#666` (라인 111)
   ```
   lineColor: '#666',
   ```

3. **HEX_3**: `#333` (라인 117)
   ```
   textColor: '#333',
   ```

4. **HEX_3**: `#ccc` (라인 120)
   ```
   clusterBorder: '#ccc',
   ```

5. **HEX_3**: `#666` (라인 121)
   ```
   defaultLinkColor: '#666',
   ```

6. **HEX_3**: `#333` (라인 122)
   ```
   titleColor: '#333',
   ```

7. **HEX_3**: `#333` (라인 125)
   ```
   actorTextColor: '#333',
   ```

8. **HEX_3**: `#333` (라인 127)
   ```
   signalColor: '#333',
   ```

9. **HEX_3**: `#333` (라인 128)
   ```
   signalTextColor: '#333',
   ```

10. **HEX_3**: `#333` (라인 131)
   ```
   labelTextColor: '#333',
   ```

11. **HEX_3**: `#333` (라인 132)
   ```
   loopTextColor: '#333',
   ```

12. **HEX_3**: `#333` (라인 135)
   ```
   noteTextColor: '#333',
   ```

13. **HEX_6**: `#f0f0f0` (라인 112)
   ```
   secondaryColor: '#f0f0f0',
   ```

14. **HEX_6**: `#e3f2fd` (라인 124)
   ```
   actorBkg: '#e3f2fd',
   ```

15. **HEX_6**: `#fff3cd` (라인 134)
   ```
   noteBkgColor: '#fff3cd',
   ```

16. **HEX_6**: `#e3f2fd` (라인 137)
   ```
   activationBkgColor: '#e3f2fd',
   ```

17. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 240)
   ```
   table.style.filter = 'drop-shadow(0 4px 8px rgba(0, 123, 255, 0.3))';
   ```

---

### 📁 `frontend/src/components/training/VirtualClientSimulator.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#1f2937` (라인 18)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#6b7280` (라인 22)
   ```
   color: #6b7280;
   ```

3. **HEX_6**: `#374151` (라인 42)
   ```
   color: #374151;
   ```

4. **HEX_6**: `#d1d5db` (라인 48)
   ```
   border: 1px solid #d1d5db;
   ```

5. **HEX_6**: `#f3f4f6` (라인 65)
   ```
   background: #f3f4f6;
   ```

6. **HEX_6**: `#e5e7eb` (라인 66)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

7. **HEX_6**: `#1f2937` (라인 75)
   ```
   color: #1f2937;
   ```

8. **HEX_6**: `#6b7280` (라인 80)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#f3f4f6` (라인 107)
   ```
   background: #f3f4f6;
   ```

10. **HEX_6**: `#1f2937` (라인 108)
   ```
   color: #1f2937;
   ```

11. **HEX_6**: `#9ca3af` (라인 141)
   ```
   background: var(--cs-secondary-400, #9ca3af);
   ```

12. **HEX_6**: `#e5e7eb` (라인 156)
   ```
   border-top: 1px solid #e5e7eb;
   ```

13. **HEX_6**: `#d1d5db` (라인 164)
   ```
   border: 1px solid #d1d5db;
   ```

14. **RGBA**: `rgba(0,0,0,0.1)` (라인 11)
   ```
   box-shadow: 0 4px 6px rgba(0,0,0,0.1);
   ```

15. **RGBA**: `rgba(0,0,0,0.1)` (라인 56)
   ```
   box-shadow: 0 4px 6px rgba(0,0,0,0.1);
   ```

16. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 174)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/prediction/SimilarCasesPanel.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#1f2937` (라인 4)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#6b7280` (라인 8)
   ```
   color: #6b7280;
   ```

3. **HEX_6**: `#f9fafb` (라인 21)
   ```
   background: #f9fafb;
   ```

4. **HEX_6**: `#e5e7eb` (라인 22)
   ```
   border: 1px solid #e5e7eb;
   ```

5. **HEX_6**: `#1f2937` (라인 40)
   ```
   color: #1f2937;
   ```

6. **HEX_6**: `#dbeafe` (라인 45)
   ```
   background: #dbeafe;
   ```

7. **HEX_6**: `#1e40af` (라인 48)
   ```
   color: #1e40af;
   ```

8. **HEX_6**: `#4b5563` (라인 69)
   ```
   color: #4b5563;
   ```

9. **HEX_6**: `#4b5563` (라인 82)
   ```
   color: #4b5563;
   ```

10. **HEX_6**: `#e0e7ff` (라인 99)
   ```
   background: #e0e7ff;
   ```

11. **HEX_6**: `#3730a3` (라인 102)
   ```
   color: #3730a3;
   ```

12. **HEX_6**: `#f0fdf4` (라인 107)
   ```
   background: #f0fdf4;
   ```

13. **HEX_6**: `#047857` (라인 116)
   ```
   color: #047857;
   ```

14. **HEX_6**: `#065f46` (라인 121)
   ```
   color: #065f46;
   ```

15. **HEX_6**: `#9ca3af` (라인 128)
   ```
   color: #9ca3af;
   ```

16. **RGBA**: `rgba(0,0,0,0.1)` (라인 28)
   ```
   box-shadow: 0 4px 8px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/admin/SearchFilterSection.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#1a1a1a` (라인 39)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

2. **HEX_6**: `#1a1a1a` (라인 74)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

3. **HEX_6**: `#1a1a1a` (라인 100)
   ```
   color: var(--text-primary, #1a1a1a);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 33)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 43)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 49)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 51)
   ```
   0 0 0 3px rgba(0, 122, 255, 0.1),
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 53)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 68)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 71)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 79)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 91)
   ```
   background-color: rgba(255, 255, 255, 0.3);
   ```

14. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 93)
   ```
   0 0 0 3px rgba(0, 122, 255, 0.1),
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 95)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 99)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/admin/DashboardFormModal.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_3**: `#666` (라인 364)
   ```
   color: var(--mg-text-tertiary, #666);
   ```

2. **HEX_3**: `#666` (라인 368)
   ```
   color: var(--mg-text-secondary, #666);
   ```

3. **HEX_3**: `#666` (라인 501)
   ```
   color: var(--mg-text-tertiary, #666);
   ```

4. **HEX_3**: `#666` (라인 535)
   ```
   color: var(--mg-text-tertiary, #666);
   ```

5. **HEX_6**: `#764ba2` (라인 219)
   ```
   background: var(--mg-gradient-primary, linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%));
   ```

6. **HEX_6**: `#e5e7eb` (라인 229)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

7. **HEX_6**: `#764ba2` (라인 271)
   ```
   background: var(--mg-gradient-primary, linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%));
   ```

8. **HEX_6**: `#e5e7eb` (라인 323)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

9. **HEX_6**: `#0056b3` (라인 463)
   ```
   background-color: var(--mg-color-primary-dark, #0056b3);
   ```

10. **HEX_6**: `#0056b3` (라인 464)
   ```
   border-color: var(--mg-color-primary-dark, #0056b3);
   ```

11. **HEX_6**: `#c82333` (라인 488)
   ```
   background-color: var(--mg-color-danger-dark, #c82333);
   ```

12. **HEX_6**: `#c82333` (라인 489)
   ```
   border-color: var(--mg-color-danger-dark, #c82333);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 9)
   ```
   background: var(--mg-modal-overlay-dark, rgba(0, 0, 0, 0.7)) !important;
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 241)
   ```
   background: var(--mg-modal-overlay-dark, rgba(0, 0, 0, 0.7));
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 259)
   ```
   box-shadow: var(--mg-shadow-xl, 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 305)
   ```
   background: var(--mg-hover-overlay-light, rgba(255, 255, 255, 0.1));
   ```

---

### 📁 `frontend/src/components/admin/AdminNotificationsPage.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#D4CFC8` (라인 12)
   ```
   border-bottom: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

2. **HEX_6**: `#5C6B61` (라인 21)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

3. **HEX_6**: `#2C2C2C` (라인 32)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

4. **HEX_6**: `#2C2C2C` (라인 37)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

5. **HEX_6**: `#3D5246` (라인 38)
   ```
   border-bottom-color: var(--mg-color-primary-main, #3D5246);
   ```

6. **HEX_6**: `#F5F3EF` (라인 43)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

7. **HEX_6**: `#D4CFC8` (라인 44)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

8. **HEX_6**: `#2C2C2C` (라인 52)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

9. **HEX_6**: `#3D5246` (라인 55)
   ```
   border-left: 4px solid var(--mg-color-primary-main, #3D5246);
   ```

10. **HEX_6**: `#5C6B61` (라인 84)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

11. **HEX_6**: `#F5F3EF` (라인 113)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

12. **HEX_6**: `#D4CFC8` (라인 114)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

13. **HEX_6**: `#2C2C2C` (라인 138)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

14. **HEX_6**: `#5C6B61` (라인 147)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

15. **HEX_6**: `#5C6B61` (라인 173)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

16. **HEX_6**: `#3D5246` (라인 186)
   ```
   .mg-v2-status-badge.mg-v2-badge--success { background: var(--mg-color-success, #3D5246); color: #fff; }
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeFilters.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#1f2937` (라인 20)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#374151` (라인 43)
   ```
   color: #374151;
   ```

3. **HEX_6**: `#f9fafb` (라인 54)
   ```
   background-color: #f9fafb;
   ```

4. **HEX_6**: `#6b7280` (라인 78)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#6b7280` (라인 93)
   ```
   color: #6b7280;
   ```

6. **HEX_6**: `#f3f4f6` (라인 102)
   ```
   background-color: #f3f4f6;
   ```

7. **HEX_6**: `#374151` (라인 103)
   ```
   color: #374151;
   ```

8. **HEX_6**: `#1d4ed8` (라인 125)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

9. **HEX_6**: `#1d4ed8` (라인 130)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

10. **HEX_6**: `#1e40af` (라인 130)
   ```
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   ```

11. **HEX_6**: `#6b7280` (라인 137)
   ```
   color: #6b7280;
   ```

12. **HEX_6**: `#f9fafb` (라인 142)
   ```
   background: #f9fafb;
   ```

13. **HEX_6**: `#d1d5db` (라인 143)
   ```
   border-color: #d1d5db;
   ```

14. **HEX_6**: `#374151` (라인 144)
   ```
   color: #374151;
   ```

15. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 62)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

16. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 132)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

---

### 📁 `frontend/src/constants/mapping.js` (JS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#fd7e14` (라인 49)
   ```
   [MAPPING_STATUS.SUSPENDED]: '#fd7e14',
   ```

2. **HEX_6**: `#6f42c1` (라인 51)
   ```
   [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#6f42c1'
   ```

3. **HEX_6**: `#fff3cd` (라인 55)
   ```
   [MAPPING_STATUS.PENDING_PAYMENT]: '#fff3cd',
   ```

4. **HEX_6**: `#d1ecf1` (라인 56)
   ```
   [MAPPING_STATUS.PAYMENT_CONFIRMED]: '#d1ecf1',
   ```

5. **HEX_6**: `#d4edda` (라인 58)
   ```
   [MAPPING_STATUS.ACTIVE]: '#d4edda',
   ```

6. **HEX_6**: `#ffeaa7` (라인 62)
   ```
   [MAPPING_STATUS.SUSPENDED]: '#ffeaa7',
   ```

7. **HEX_6**: `#f8d7da` (라인 63)
   ```
   [MAPPING_STATUS.TERMINATED]: '#f8d7da',
   ```

8. **HEX_6**: `#e2e3f1` (라인 64)
   ```
   [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#e2e3f1'
   ```

9. **HEX_6**: `#6f42c1` (라인 196)
   ```
   TOTAL: '#6f42c1',
   ```

10. **HEX_6**: `#fd7e14` (라인 198)
   ```
   SESSIONS_EXHAUSTED: '#fd7e14'
   ```

11. **HEX_6**: `#fff3cd` (라인 203)
   ```
   PENDING: '#fff3cd',
   ```

12. **HEX_6**: `#d4edda` (라인 205)
   ```
   ACTIVE: '#d4edda',
   ```

13. **HEX_6**: `#d1ecf1` (라인 206)
   ```
   PAYMENT_CONFIRMED: '#d1ecf1',
   ```

14. **HEX_6**: `#e2e3f1` (라인 207)
   ```
   TOTAL: '#e2e3f1',
   ```

15. **HEX_6**: `#f8d7da` (라인 208)
   ```
   TERMINATED: '#f8d7da',
   ```

16. **HEX_6**: `#ffeaa7` (라인 209)
   ```
   SESSIONS_EXHAUSTED: '#ffeaa7'
   ```

---

### 📁 `frontend/src/components/admin/DashboardWidgetEditor.css` (CSS)

**하드코딩 색상**: 15개

1. **HEX_6**: `#1f2937` (라인 23)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

2. **HEX_6**: `#e5e7eb` (라인 25)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

3. **HEX_6**: `#f9fafb` (라인 43)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

4. **HEX_6**: `#e5e7eb` (라인 44)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

5. **HEX_6**: `#f3f4f6` (라인 66)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

6. **HEX_6**: `#6b7280` (라인 83)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

7. **HEX_6**: `#e5e7eb` (라인 101)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

8. **HEX_6**: `#9ca3af` (라인 115)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

9. **HEX_6**: `#1f2937` (라인 144)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

10. **HEX_6**: `#6b7280` (라인 149)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

11. **HEX_6**: `#6b7280` (라인 167)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

12. **HEX_6**: `#f9fafb` (라인 168)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

13. **HEX_6**: `#e5e7eb` (라인 170)
   ```
   border: var(--mg-border-width, 2px) dashed var(--mg-border-color, #e5e7eb);
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 69)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 108)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

---

### 📁 `frontend/src/components/admin/psych-assessment/organisms/PsychKpiSection.css` (CSS)

**하드코딩 색상**: 15개

1. **HEX_6**: `#e2e8f0` (라인 24)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

2. **HEX_6**: `#4b745c` (라인 53)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

3. **HEX_6**: `#4b745c` (라인 58)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

4. **HEX_6**: `#ebf2ee` (라인 75)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

5. **HEX_6**: `#4b745c` (라인 76)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

6. **HEX_6**: `#fcf3ed` (라인 80)
   ```
   background: var(--ad-b0kla-orange-bg, #fcf3ed);
   ```

7. **HEX_6**: `#e8a87c` (라인 81)
   ```
   color: var(--ad-b0kla-orange, #e8a87c);
   ```

8. **HEX_6**: `#f0f5f9` (라인 85)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

9. **HEX_6**: `#6d9dc5` (라인 86)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

10. **HEX_6**: `#64748b` (라인 97)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

11. **HEX_6**: `#2d3748` (라인 103)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 26)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 4px 12px rgba(0, 0, 0, 0.04));
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 37)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 4px 12px rgba(0, 0, 0, 0.04));
   ```

14. **RGBA**: `rgba(75, 116, 92, 0.12)` (라인 54)
   ```
   box-shadow: 0 6px 20px rgba(75, 116, 92, 0.12);
   ```

15. **RGBA**: `rgba(75, 116, 92, 0.12)` (라인 59)
   ```
   box-shadow: 0 6px 20px rgba(75, 116, 92, 0.12);
   ```

---

### 📁 `frontend/src/components/schedule/ConsultantStatus.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#E8E8ED` (라인 19)
   ```
   border: 2px solid var(--color-border-secondary, #E8E8ED);
   ```

2. **HEX_6**: `#FAFAFA` (라인 24)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

3. **HEX_6**: `#0056CC` (라인 43)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

4. **HEX_6**: `#1D1D1F` (라인 86)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

5. **HEX_6**: `#424245` (라인 92)
   ```
   color: var(--color-text-secondary, #424245);
   ```

6. **HEX_6**: `#424245` (라인 98)
   ```
   color: var(--color-text-secondary, #424245);
   ```

7. **HEX_6**: `#424245` (라인 104)
   ```
   color: var(--color-text-secondary, #424245);
   ```

8. **HEX_6**: `#065f46` (라인 123)
   ```
   color: #065f46;
   ```

9. **HEX_6**: `#92400e` (라인 128)
   ```
   color: #92400e;
   ```

10. **HEX_6**: `#991b1b` (라인 133)
   ```
   color: #991b1b;
   ```

11. **HEX_6**: `#9ca3af` (라인 138)
   ```
   color: #9ca3af;
   ```

12. **HEX_6**: `#424245` (라인 152)
   ```
   color: var(--color-text-secondary, #424245);
   ```

13. **HEX_6**: `#9ca3af` (라인 161)
   ```
   color: #9ca3af;
   ```

14. **RGBA**: `rgba(40, 167, 69, 0.2)` (라인 30)
   ```
   box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
   ```

---

### 📁 `frontend/src/components/prediction/DropoutRiskIndicator.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#1f2937` (라인 4)
   ```
   color: var(--cs-secondary-800, #1f2937);
   ```

2. **HEX_6**: `#4b5563` (라인 47)
   ```
   color: var(--mg-gray-600, var(--cs-secondary-600, #4b5563));
   ```

3. **HEX_6**: `#374151` (라인 53)
   ```
   color: var(--cs-secondary-700, #374151);
   ```

4. **HEX_6**: `#4b5563` (라인 66)
   ```
   color: #4b5563;
   ```

5. **HEX_6**: `#e5e7eb` (라인 72)
   ```
   background: #e5e7eb;
   ```

6. **HEX_6**: `#1f2937` (라인 86)
   ```
   color: #1f2937;
   ```

7. **HEX_6**: `#fef3c7` (라인 91)
   ```
   background: #fef3c7;
   ```

8. **HEX_6**: `#fbbf24` (라인 92)
   ```
   border: 1px solid #fbbf24;
   ```

9. **HEX_6**: `#92400e` (라인 99)
   ```
   color: #92400e;
   ```

10. **HEX_6**: `#78350f` (라인 109)
   ```
   color: #78350f;
   ```

11. **HEX_6**: `#fee2e2` (라인 115)
   ```
   background: #fee2e2;
   ```

12. **HEX_6**: `#fca5a5` (라인 116)
   ```
   border: 1px solid #fca5a5;
   ```

13. **HEX_6**: `#991b1b` (라인 123)
   ```
   color: #991b1b;
   ```

14. **HEX_6**: `#7f1d1d` (라인 133)
   ```
   color: #7f1d1d;
   ```

---

### 📁 `frontend/src/components/admin/mapping-management/organisms/MappingSearchSection.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#64748b` (라인 46)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

2. **HEX_6**: `#e2e8f0` (라인 48)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

3. **HEX_6**: `#4b745c` (라인 55)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

4. **HEX_6**: `#4b745c` (라인 56)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

5. **HEX_6**: `#ebf2ee` (라인 60)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

6. **HEX_6**: `#4b745c` (라인 61)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

7. **HEX_6**: `#4b745c` (라인 62)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

8. **HEX_6**: `#64748b` (라인 77)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

9. **HEX_6**: `#e2e8f0` (라인 79)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

10. **HEX_6**: `#ebf2ee` (라인 83)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

11. **HEX_6**: `#4b745c` (라인 84)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

12. **HEX_6**: `#4b745c` (라인 85)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

13. **HEX_6**: `#4b745c` (라인 89)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

14. **HEX_6**: `#4b745c` (라인 90)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

---

### 📁 `frontend/src/components/admin/mapping-management/organisms/MappingKpiSection.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#e2e8f0` (라인 23)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

2. **HEX_6**: `#4b745c` (라인 33)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

3. **HEX_6**: `#ebf2ee` (라인 82)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

4. **HEX_6**: `#4b745c` (라인 83)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

5. **HEX_6**: `#fcf3ed` (라인 87)
   ```
   background: var(--ad-b0kla-orange-bg, #fcf3ed);
   ```

6. **HEX_6**: `#e8a87c` (라인 88)
   ```
   color: var(--ad-b0kla-orange, #e8a87c);
   ```

7. **HEX_6**: `#f0f5f9` (라인 92)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

8. **HEX_6**: `#6d9dc5` (라인 93)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

9. **HEX_6**: `#edf2f7` (라인 97)
   ```
   background: #edf2f7;
   ```

10. **HEX_6**: `#4a5568` (라인 98)
   ```
   color: #4a5568;
   ```

11. **HEX_6**: `#64748b` (라인 109)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

12. **HEX_6**: `#2d3748` (라인 115)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 25)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 4px 12px rgba(0, 0, 0, 0.04));
   ```

14. **RGBA**: `rgba(75, 116, 92, 0.12)` (라인 34)
   ```
   box-shadow: 0 6px 20px rgba(75, 116, 92, 0.12);
   ```

---

### 📁 `frontend/src/components/admin/mapping/MappingFilters.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#FAFAFA` (라인 4)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

2. **HEX_6**: `#E8E8ED` (라인 8)
   ```
   border: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

3. **HEX_6**: `#E8E8ED` (라인 20)
   ```
   border-bottom: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

4. **HEX_6**: `#1D1D1F` (라인 26)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

5. **HEX_6**: `#1D1D1F` (라인 47)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

6. **HEX_6**: `#424245` (라인 57)
   ```
   color: var(--color-text-secondary, #424245);
   ```

7. **HEX_6**: `#D1D1D6` (라인 66)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

8. **HEX_6**: `#FAFAFA` (라인 68)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

9. **HEX_6**: `#1D1D1F` (라인 69)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

10. **HEX_6**: `#A1A1A6` (라인 82)
   ```
   border-color: var(--color-border-accent, #A1A1A6);
   ```

11. **HEX_6**: `#424245` (라인 103)
   ```
   color: var(--color-text-secondary, #424245);
   ```

12. **HEX_6**: `#F5F5F7` (라인 120)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

13. **HEX_6**: `#5a6268` (라인 162)
   ```
   background-color: var(--color-gray-dark, #5a6268);
   ```

14. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 77)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

---

### 📁 `frontend/src/styles/dashboard-tokens-extension.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#cd7f32` (라인 37)
   ```
   --mg-grade-client-bronze: #cd7f32;
   ```

2. **HEX_6**: `#daa66a` (라인 38)
   ```
   --mg-grade-client-bronze-light: #daa66a;
   ```

3. **HEX_6**: `#a06218` (라인 39)
   ```
   --mg-grade-client-bronze-dark: #a06218;
   ```

4. **HEX_6**: `#c0c0c0` (라인 41)
   ```
   --mg-grade-client-silver: #c0c0c0;
   ```

5. **HEX_6**: `#e5e5e5` (라인 42)
   ```
   --mg-grade-client-silver-light: #e5e5e5;
   ```

6. **HEX_6**: `#a8a8a8` (라인 43)
   ```
   --mg-grade-client-silver-dark: #a8a8a8;
   ```

7. **HEX_6**: `#ffd700` (라인 45)
   ```
   --mg-grade-client-gold: #ffd700;
   ```

8. **HEX_6**: `#ffed4e` (라인 46)
   ```
   --mg-grade-client-gold-light: #ffed4e;
   ```

9. **HEX_6**: `#ccaa00` (라인 47)
   ```
   --mg-grade-client-gold-dark: #ccaa00;
   ```

10. **HEX_6**: `#e5e4e2` (라인 49)
   ```
   --mg-grade-client-platinum: #e5e4e2;
   ```

11. **HEX_6**: `#f5f4f2` (라인 50)
   ```
   --mg-grade-client-platinum-light: #f5f4f2;
   ```

12. **HEX_6**: `#c4c2c0` (라인 51)
   ```
   --mg-grade-client-platinum-dark: #c4c2c0;
   ```

13. **HEX_6**: `#0f1b3a` (라인 85)
   ```
   --mg-grade-admin-super-dark: #0f1b3a;
   ```

---

### 📁 `frontend/src/styles/auth/TenantSelection.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#f5f7fa` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#e5e7eb` (라인 59)
   ```
   border: 2px solid #e5e7eb;
   ```

4. **HEX_6**: `#eff6ff` (라인 73)
   ```
   background-color: #eff6ff;
   ```

5. **HEX_6**: `#eff6ff` (라인 78)
   ```
   background-color: #eff6ff;
   ```

6. **HEX_6**: `#f3f4f6` (라인 101)
   ```
   background-color: #f3f4f6;
   ```

7. **HEX_6**: `#d1fae5` (라인 112)
   ```
   background-color: #d1fae5;
   ```

8. **HEX_6**: `#065f46` (라인 113)
   ```
   color: #065f46;
   ```

9. **HEX_6**: `#fee2e2` (라인 117)
   ```
   background-color: #fee2e2;
   ```

10. **HEX_6**: `#991b1b` (라인 118)
   ```
   color: #991b1b;
   ```

11. **HEX_6**: `#e5e7eb` (라인 135)
   ```
   border: 2px solid #e5e7eb;
   ```

12. **HEX_6**: `#d1d5db` (라인 145)
   ```
   border-color: #d1d5db;
   ```

13. **HEX_6**: `#f9fafb` (라인 146)
   ```
   background-color: #f9fafb;
   ```

---

### 📁 `frontend/src/styles/06-components/_session-management.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_3**: `#ccc` (라인 422)
   ```
   border: 1px solid #ccc;
   ```

2. **RGBA**: `rgba(52, 199, 89, 0.15)` (라인 217)
   ```
   background: rgba(52, 199, 89, 0.15);
   ```

3. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 222)
   ```
   border: 0.5px solid rgba(52, 199, 89, 0.3);
   ```

4. **RGBA**: `rgba(142, 142, 147, 0.15)` (라인 227)
   ```
   background: rgba(142, 142, 147, 0.15);
   ```

5. **RGBA**: `rgba(142, 142, 147, 0.3)` (라인 232)
   ```
   border: 0.5px solid rgba(142, 142, 147, 0.3);
   ```

6. **RGBA**: `rgba(255, 149, 0, 0.15)` (라인 237)
   ```
   background: rgba(255, 149, 0, 0.15);
   ```

7. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 242)
   ```
   border: 0.5px solid rgba(255, 149, 0, 0.3);
   ```

8. **RGBA**: `rgba(45, 45, 50, 0.8)` (라인 378)
   ```
   background: rgba(45, 45, 50, 0.8);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 379)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

10. **RGBA**: `rgba(45, 45, 50, 0.6)` (라인 383)
   ```
   background: rgba(45, 45, 50, 0.6);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 384)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

12. **RGBA**: `rgba(45, 45, 50, 0.8)` (라인 388)
   ```
   background: rgba(45, 45, 50, 0.8);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 389)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/styles/01-settings/_glassmorphism.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#ff2d92` (라인 34)
   ```
   --ios-pink: #ff2d92;
   ```

2. **HEX_6**: `#ffcc00` (라인 35)
   ```
   --ios-yellow: #ffcc00;
   ```

3. **HEX_6**: `#8e8e93` (라인 36)
   ```
   --ios-gray: #8e8e93;
   ```

4. **HEX_6**: `#1d1d1f` (라인 39)
   ```
   --ios-text-primary: #1d1d1f;
   ```

5. **HEX_6**: `#86868b` (라인 40)
   ```
   --ios-text-secondary: #86868b;
   ```

6. **HEX_6**: `#c7c7cc` (라인 41)
   ```
   --ios-text-tertiary: #c7c7cc;
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 9)
   ```
   --glass-bg-tertiary: rgba(255, 255, 255, 0.15);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 15)
   ```
   --glass-border: rgba(255, 255, 255, 0.18);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 16)
   ```
   --glass-border-light: rgba(255, 255, 255, 0.1);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 17)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.3);
   ```

11. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 19)
   ```
   --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 20)
   ```
   --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

13. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 21)
   ```
   --glass-shadow-hover: 0 20px 40px rgba(31, 38, 135, 0.5);
   ```

---

### 📁 `frontend/src/components/schedule/steps/ClientSelectionStep.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#1D1D1F` (라인 152)
   ```
   color: var(--color-text-primary, #1D1D1F);
   ```

2. **HEX_6**: `#424245` (라인 159)
   ```
   color: var(--color-text-secondary, #424245);
   ```

3. **HEX_6**: `#FFF3CD` (라인 224)
   ```
   background: var(--color-warning-light, #FFF3CD);
   ```

4. **HEX_6**: `#856404` (라인 241)
   ```
   color: var(--color-warning-dark, #856404);
   ```

5. **HEX_6**: `#856404` (라인 248)
   ```
   color: var(--color-warning-dark, #856404);
   ```

6. **HEX_6**: `#0056CC` (라인 287)
   ```
   background-color: var(--color-primary-hover, #0056CC);
   ```

7. **HEX_6**: `#E8E8ED` (라인 298)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

8. **HEX_6**: `#A1A1A6` (라인 303)
   ```
   background: var(--color-border-accent, #A1A1A6);
   ```

9. **HEX_6**: `#8E8E93` (라인 308)
   ```
   background: var(--color-text-muted, #8E8E93);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 44)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 1px 3px rgba(0, 0, 0, 0.06));
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 227)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 275)
   ```
   box-shadow: var(--shadow-glass, 0 2px 8px rgba(0, 0, 0, 0.08));
   ```

13. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 289)
   ```
   box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 122, 255, 0.3));
   ```

---

### 📁 `frontend/src/components/erd/ErdListPage.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_3**: `#333` (라인 16)
   ```
   color: var(--text-primary, #333);
   ```

2. **HEX_3**: `#666` (라인 22)
   ```
   color: var(--text-secondary, #666);
   ```

3. **HEX_3**: `#666` (라인 39)
   ```
   color: var(--text-secondary, #666);
   ```

4. **HEX_3**: `#666` (라인 127)
   ```
   color: var(--text-secondary, #666);
   ```

5. **HEX_3**: `#333` (라인 165)
   ```
   color: var(--text-primary, #333);
   ```

6. **HEX_3**: `#999` (라인 184)
   ```
   background: var(--text-secondary, #999);
   ```

7. **HEX_3**: `#666` (라인 194)
   ```
   color: var(--text-secondary, #666);
   ```

8. **HEX_3**: `#666` (라인 216)
   ```
   color: var(--text-secondary, #666);
   ```

9. **HEX_3**: `#333` (라인 222)
   ```
   color: var(--text-primary, #333);
   ```

10. **HEX_6**: `#f0f0f0` (라인 47)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

11. **HEX_6**: `#0056b3` (라인 115)
   ```
   background: var(--primary-hover, #0056b3);
   ```

12. **HEX_6**: `#0056b3` (라인 244)
   ```
   background: var(--primary-hover, #0056b3);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 146)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/common/MGLayout.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#f8fafc` (라인 14)
   ```
   background: #f8fafc;
   ```

2. **HEX_6**: `#1a202c` (라인 18)
   ```
   background: #1a202c;
   ```

3. **HEX_6**: `#764ba2` (라인 23)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

4. **HEX_6**: `#f8fafc` (라인 63)
   ```
   .mg-section--bg-gray { background: #f8fafc; }
   ```

5. **HEX_6**: `#764ba2` (라인 64)
   ```
   .mg-section--bg-primary { background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%); }
   ```

6. **HEX_6**: `#f5576c` (라인 65)
   ```
   .mg-section--bg-secondary { background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%); }
   ```

7. **HEX_6**: `#e2e8f0` (라인 153)
   ```
   background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
   ```

8. **HEX_6**: `#e2e8f0` (라인 158)
   ```
   background: repeating-linear-gradient(90deg, #e2e8f0 0px, #e2e8f0 8px, transparent 8px, transparent 16px);
   ```

9. **HEX_6**: `#e2e8f0` (라인 158)
   ```
   background: repeating-linear-gradient(90deg, #e2e8f0 0px, #e2e8f0 8px, transparent 8px, transparent 16px);
   ```

10. **HEX_6**: `#764ba2` (라인 163)
   ```
   background: linear-gradient(90deg, var(--mg-primary-500), #764ba2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 38)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 46)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 48)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/WidgetConfigModal.css` (CSS)

**하드코딩 색상**: 13개

1. **HEX_6**: `#e5e7eb` (라인 59)
   ```
   border-bottom: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

2. **HEX_6**: `#1f2937` (라인 66)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

3. **HEX_6**: `#6b7280` (라인 73)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

4. **HEX_6**: `#f3f4f6` (라인 84)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

5. **HEX_6**: `#1f2937` (라인 85)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

6. **HEX_6**: `#1f2937` (라인 107)
   ```
   color: var(--mg-text-primary, #1f2937);
   ```

7. **HEX_6**: `#e5e7eb` (라인 116)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

8. **HEX_6**: `#f9fafb` (라인 134)
   ```
   background: var(--mg-bg-secondary, #f9fafb);
   ```

9. **HEX_6**: `#9ca3af` (라인 145)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

10. **HEX_6**: `#6b7280` (라인 164)
   ```
   color: var(--mg-text-secondary, #6b7280);
   ```

11. **HEX_6**: `#e5e7eb` (라인 174)
   ```
   border-top: var(--mg-border-width, 1px) solid var(--mg-border-color, #e5e7eb);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 33)
   ```
   box-shadow: var(--mg-shadow-lg, 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
   ```

13. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 126)
   ```
   box-shadow: 0 0 0 3px var(--mg-primary-alpha, rgba(59, 130, 246, 0.1));
   ```

---

### 📁 `frontend/src/components/admin/SecurityMonitoringDashboard.css` (CSS)

**하드코딩 색상**: 13개

1. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 56)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 57)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 63)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 91)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 113)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 135)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 143)
   ```
   color: rgba(255, 255, 255, 0.8);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 168)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 169)
   ```
   border-color: rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 174)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 178)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 179)
   ```
   border-color: rgba(255, 255, 255, 0.4);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 184)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/pages/billing/BillingCallback.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#1f2937` (라인 40)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#6b7280` (라인 45)
   ```
   color: #6b7280;
   ```

3. **HEX_6**: `#1f2937` (라인 73)
   ```
   color: #1f2937;
   ```

4. **HEX_6**: `#6b7280` (라인 79)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#f9fafb` (라인 87)
   ```
   background: #f9fafb;
   ```

6. **HEX_6**: `#e5e7eb` (라인 97)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

7. **HEX_6**: `#374151` (라인 106)
   ```
   color: #374151;
   ```

8. **HEX_6**: `#6b7280` (라인 110)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#fef2f2` (라인 118)
   ```
   background: #fef2f2;
   ```

10. **HEX_6**: `#fecaca` (라인 119)
   ```
   border: 1px solid #fecaca;
   ```

11. **HEX_6**: `#dc2626` (라인 129)
   ```
   color: #dc2626;
   ```

12. **HEX_6**: `#991b1b` (라인 133)
   ```
   color: #991b1b;
   ```

---

### 📁 `frontend/src/components/prediction/TreatmentOutcomeChart.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#1f2937` (라인 4)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#f9fafb` (라인 24)
   ```
   background: #f9fafb;
   ```

3. **HEX_6**: `#6b7280` (라인 30)
   ```
   color: #6b7280;
   ```

4. **HEX_6**: `#1f2937` (라인 37)
   ```
   color: #1f2937;
   ```

5. **HEX_6**: `#e5e7eb` (라인 43)
   ```
   background: #e5e7eb;
   ```

6. **HEX_6**: `#4b5563` (라인 59)
   ```
   color: #4b5563;
   ```

7. **HEX_6**: `#1f2937` (라인 64)
   ```
   color: #1f2937;
   ```

8. **HEX_6**: `#e5e7eb` (라인 70)
   ```
   border-top: 1px solid #e5e7eb;
   ```

9. **HEX_6**: `#374151` (라인 76)
   ```
   color: #374151;
   ```

10. **HEX_6**: `#4b5563` (라인 86)
   ```
   color: #4b5563;
   ```

11. **HEX_6**: `#e5e7eb` (라인 95)
   ```
   border-top: 1px solid #e5e7eb;
   ```

12. **HEX_6**: `#6b7280` (라인 97)
   ```
   color: #6b7280;
   ```

---

### 📁 `frontend/src/components/emotion/CognitiveDistortionPanel.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#f9fafb` (라인 11)
   ```
   background: #f9fafb;
   ```

2. **HEX_6**: `#6b7280` (라인 31)
   ```
   color: #6b7280;
   ```

3. **HEX_6**: `#4b5563` (라인 38)
   ```
   color: #4b5563;
   ```

4. **HEX_6**: `#374151` (라인 44)
   ```
   color: #374151;
   ```

5. **HEX_6**: `#dc2626` (라인 58)
   ```
   .count-badge.risk-high { background: #dc2626; }
   ```

6. **HEX_6**: `#1f2937` (라인 85)
   ```
   color: #1f2937;
   ```

7. **HEX_6**: `#4b5563` (라인 99)
   ```
   color: #4b5563;
   ```

8. **HEX_6**: `#6b7280` (라인 105)
   ```
   color: #6b7280;
   ```

9. **HEX_6**: `#fee2e2` (라인 123)
   ```
   background: #fee2e2;
   ```

10. **HEX_6**: `#fca5a5` (라인 124)
   ```
   border: 1px solid #fca5a5;
   ```

11. **HEX_6**: `#991b1b` (라인 125)
   ```
   color: #991b1b;
   ```

12. **RGBA**: `rgba(0,0,0,0.05)` (라인 73)
   ```
   box-shadow: 0 1px 2px rgba(0,0,0,0.05);
   ```

---

### 📁 `frontend/src/components/admin/ProfileCard.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#e5e7eb` (라인 5)
   ```
   border: 1px solid var(--color-border-light, #e5e7eb);
   ```

2. **HEX_6**: `#3b82f6` (라인 18)
   ```
   border-color: var(--color-border-focus, #3b82f6);
   ```

3. **HEX_6**: `#f3f4f6` (라인 31)
   ```
   background: var(--color-background-alt, #f3f4f6);
   ```

4. **HEX_6**: `#3b82f6` (라인 32)
   ```
   color: var(--color-primary, #3b82f6);
   ```

5. **HEX_6**: `#111827` (라인 85)
   ```
   color: var(--color-text-primary, #111827);
   ```

6. **HEX_6**: `#4b5563` (라인 93)
   ```
   color: var(--color-text-secondary, #4b5563);
   ```

7. **HEX_6**: `#4b5563` (라인 168)
   ```
   color: var(--color-text-secondary, #4b5563);
   ```

8. **HEX_6**: `#111827` (라인 174)
   ```
   color: var(--color-text-primary, #111827);
   ```

9. **HEX_6**: `#e5e7eb` (라인 180)
   ```
   border-top: 1px dashed var(--color-border-light, #e5e7eb);
   ```

10. **HEX_6**: `#4b5563` (라인 183)
   ```
   color: var(--color-text-secondary, #4b5563);
   ```

11. **HEX_6**: `#dc2626` (라인 268)
   ```
   background: var(--mg-error-600, #dc2626);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 17)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
   ```

---

### 📁 `frontend/src/components/test/UnifiedLoadingTest.js` (JS)

**하드코딩 색상**: 12개

1. **HEX_3**: `#ddd` (라인 104)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

2. **HEX_3**: `#ddd` (라인 105)
   ```
   <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
   ```

3. **HEX_3**: `#ddd` (라인 113)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

4. **HEX_3**: `#ddd` (라인 114)
   ```
   <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '200px' }}>
   ```

5. **HEX_3**: `#ddd` (라인 122)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

6. **HEX_3**: `#ddd` (라인 123)
   ```
   <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
   ```

7. **HEX_3**: `#ddd` (라인 140)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

8. **HEX_3**: `#ddd` (라인 141)
   ```
   <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
   ```

9. **HEX_3**: `#ddd` (라인 148)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

10. **HEX_3**: `#ddd` (라인 149)
   ```
   <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
   ```

11. **HEX_3**: `#ddd` (라인 156)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

12. **HEX_3**: `#ddd` (라인 157)
   ```
   <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
   ```

---

### 📁 `frontend/src/components/admin/DashboardWidgetEditor.js` (JS)

**하드코딩 색상**: 12개

1. **HEX_3**: `#ddd` (라인 339)
   ```
   border: '1px solid #ddd',
   ```

2. **HEX_3**: `#666` (라인 347)
   ```
   color: '#666'
   ```

3. **HEX_6**: `#e3f2fd` (라인 165)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e3f2fd -> var(--mg-custom-e3f2fd)
   ```

4. **HEX_6**: `#e3f2fd` (라인 166)
   ```
   backgroundColor: '#e3f2fd',
   ```

5. **HEX_6**: `#9ca3af` (라인 204)
   ```
   color: 'var(--mg-text-tertiary, #9ca3af)'
   ```

6. **HEX_6**: `#fff3e0` (라인 225)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff3e0 -> var(--mg-custom-fff3e0)
   ```

7. **HEX_6**: `#fff3e0` (라인 226)
   ```
   backgroundColor: '#fff3e0',
   ```

8. **HEX_6**: `#e65100` (라인 227)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e65100 -> var(--mg-custom-e65100)
   ```

9. **HEX_6**: `#e65100` (라인 228)
   ```
   color: '#e65100',
   ```

10. **HEX_6**: `#fff8f0` (라인 260)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff8f0 -> var(--mg-custom-fff8f0)
   ```

11. **HEX_6**: `#fff8f0` (라인 261)
   ```
   backgroundColor: '#fff8f0',
   ```

12. **HEX_6**: `#9ca3af` (라인 271)
   ```
   color: 'var(--mg-text-tertiary, #9ca3af)'
   ```

---

### 📁 `frontend/src/components/emotion/EmotionTrendChart.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#f9fafb` (라인 9)
   ```
   background: #f9fafb;
   ```

2. **HEX_6**: `#d1fae5` (라인 27)
   ```
   .trend-badge.trend-improving { color: var(--mg-success-500); background: #d1fae5; }
   ```

3. **HEX_6**: `#fef3c7` (라인 28)
   ```
   .trend-badge.trend-stable { color: var(--mg-warning-500); background: #fef3c7; }
   ```

4. **HEX_6**: `#dc2626` (라인 29)
   ```
   .trend-badge.trend-worsening { color: #dc2626; background: #fee2e2; }
   ```

5. **HEX_6**: `#fee2e2` (라인 29)
   ```
   .trend-badge.trend-worsening { color: #dc2626; background: #fee2e2; }
   ```

6. **HEX_6**: `#e5e7eb` (라인 32)
   ```
   border: 1px solid #e5e7eb;
   ```

7. **HEX_6**: `#f3f4f6` (라인 48)
   ```
   background: #f3f4f6;
   ```

8. **HEX_6**: `#4b5563` (라인 55)
   ```
   color: #4b5563;
   ```

9. **HEX_6**: `#e5e7eb` (라인 61)
   ```
   border-top: 1px solid #e5e7eb;
   ```

10. **HEX_6**: `#1f2937` (라인 63)
   ```
   color: #1f2937;
   ```

11. **HEX_6**: `#f9fafb` (라인 67)
   ```
   background: #f9fafb;
   ```

---

### 📁 `frontend/src/components/dashboard/WelcomeSection.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#87CEEB` (라인 244)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

2. **HEX_6**: `#B0E0E6` (라인 244)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

3. **HEX_6**: `#FF6B9D` (라인 249)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

4. **HEX_6**: `#FFA5C0` (라인 249)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 99)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 108)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

7. **RGBA**: `rgba(128, 128, 0, 0.2)` (라인 240)
   ```
   box-shadow: 0 2px 8px rgba(128, 128, 0, 0.2);
   ```

8. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 245)
   ```
   box-shadow: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

9. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 250)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
   ```

10. **RGBA**: `rgba(139, 69, 19, 0.2)` (라인 255)
   ```
   box-shadow: 0 2px 8px rgba(139, 69, 19, 0.2);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 266)
   ```
   box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
   ```

---

### 📁 `frontend/src/components/dashboard/RecentActivities.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#8b9dc3` (라인 38)
   ```
   color: #8b9dc3;
   ```

2. **HEX_6**: `#5a6c7d` (라인 44)
   ```
   color: #5a6c7d;
   ```

3. **HEX_6**: `#f8f9ff` (라인 45)
   ```
   background: #f8f9ff;
   ```

4. **HEX_6**: `#8b9dc3` (라인 49)
   ```
   color: #8b9dc3;
   ```

5. **HEX_6**: `#e9ecef` (라인 66)
   ```
   border: 1px solid #e9ecef;
   ```

6. **HEX_6**: `#e9ecef` (라인 70)
   ```
   background: #e9ecef;
   ```

7. **HEX_6**: `#495057` (라인 106)
   ```
   color: #495057;
   ```

8. **HEX_6**: `#adb5bd` (라인 125)
   ```
   color: #adb5bd;
   ```

9. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 73)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
   ```

10. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 85)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

11. **RGBA**: `rgba(168, 230, 168, 0.2)` (라인 91)
   ```
   box-shadow: 0 2px 4px rgba(168, 230, 168, 0.2);
   ```

---

### 📁 `frontend/src/components/common/NotificationBadge.css` (CSS)

**하드코딩 색상**: 11개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 80)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 148)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 171)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 195)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.1);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 233)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.1);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 237)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 250)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 270)
   ```
   color: rgba(255, 255, 255, 0.7);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 274)
   ```
   color: rgba(255, 255, 255, 0.5);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 288)
   ```
   color: rgba(255, 255, 255, 0.5);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 293)
   ```
   color: rgba(255, 255, 255, 0.7);
   ```

---

### 📁 `frontend/src/components/common/MGChart.css` (CSS)

**하드코딩 색상**: 11개

1. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 9)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px var(--mg-shadow-light);
   ```

2. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 10)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

3. **RGBA**: `rgba(102, 126, 234, 0.05)` (라인 29)
   ```
   rgba(102, 126, 234, 0.05) 0%,
   ```

4. **RGBA**: `rgba(118, 75, 162, 0.05)` (라인 30)
   ```
   rgba(118, 75, 162, 0.05) 100%);
   ```

5. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 31)
   ```
   border: 1px solid rgba(102, 126, 234, 0.2);
   ```

6. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 32)
   ```
   box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15), 0 4px 16px var(--mg-shadow-light);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 46)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

8. **RGBA**: `rgba(26, 32, 44, 0.9)` (라인 122)
   ```
   background: rgba(26, 32, 44, 0.9);
   ```

9. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 127)
   ```
   rgba(102, 126, 234, 0.1) 0%,
   ```

10. **RGBA**: `rgba(118, 75, 162, 0.1)` (라인 128)
   ```
   rgba(118, 75, 162, 0.1) 100%);
   ```

11. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 129)
   ```
   border-color: rgba(102, 126, 234, 0.2);
   ```

---

### 📁 `frontend/src/components/common/LoadingSpinnerDemo.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#1f2937` (라인 9)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#374151` (라인 17)
   ```
   color: #374151;
   ```

3. **HEX_6**: `#e5e7eb` (라인 21)
   ```
   border-bottom: 2px solid #e5e7eb;
   ```

4. **HEX_6**: `#4b5563` (라인 26)
   ```
   color: #4b5563;
   ```

5. **HEX_6**: `#2563eb` (라인 72)
   ```
   background: linear-gradient(135deg, #2563eb, #7c3aed);
   ```

6. **HEX_6**: `#7c3aed` (라인 72)
   ```
   background: linear-gradient(135deg, #2563eb, #7c3aed);
   ```

7. **HEX_6**: `#f8fafc` (라인 78)
   ```
   background: #f8fafc;
   ```

8. **HEX_6**: `#e2e8f0` (라인 79)
   ```
   border: 1px solid #e2e8f0;
   ```

9. **HEX_6**: `#374151` (라인 91)
   ```
   color: #374151;
   ```

10. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 68)
   ```
   box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
   ```

11. **RGBA**: `rgba(59, 130, 246, 0.4)` (라인 74)
   ```
   box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
   ```

---

### 📁 `frontend/src/components/client/ClientSessionManagement.css` (CSS)

**하드코딩 색상**: 11개

1. **RGBA**: `rgba(248, 249, 250, 0.3)` (라인 6)
   ```
   background: rgba(248, 249, 250, 0.3);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 19)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 23)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 34)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 43)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 68)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 72)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 141)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 144)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 204)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 207)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/prediction/PredictionDashboard.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#1f2937` (라인 17)
   ```
   color: #1f2937;
   ```

2. **HEX_6**: `#1f2937` (라인 45)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#eff6ff` (라인 56)
   ```
   background: #eff6ff;
   ```

4. **HEX_6**: `#1e40af` (라인 64)
   ```
   color: #1e40af;
   ```

5. **HEX_6**: `#6b7280` (라인 69)
   ```
   color: #6b7280;
   ```

6. **HEX_6**: `#4b5563` (라인 76)
   ```
   color: #4b5563;
   ```

7. **HEX_6**: `#e5e7eb` (라인 94)
   ```
   border: 4px solid #e5e7eb;
   ```

8. **RGBA**: `rgba(0,0,0,0.1)` (라인 31)
   ```
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   ```

9. **RGBA**: `rgba(0,0,0,0.1)` (라인 38)
   ```
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   ```

10. **RGBA**: `rgba(0,0,0,0.1)` (라인 83)
   ```
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   ```

---

### 📁 `frontend/src/components/common/BadgeSelect.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#5C6B61` (라인 20)
   ```
   color: var(--mg-color-text-secondary, var(--mg-layout-sidebar-text, #5C6B61));
   ```

2. **HEX_6**: `#2C2C2C` (라인 38)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

3. **HEX_6**: `#FAF9F7` (라인 53)
   ```
   color: var(--mg-color-background-main, #FAF9F7);
   ```

4. **HEX_6**: `#4A6354` (라인 58)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

5. **HEX_6**: `#4A6354` (라인 59)
   ```
   border-color: var(--mg-color-primary-light, #4A6354);
   ```

6. **HEX_6**: `#5C6B61` (라인 74)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

7. **HEX_6**: `#dc2626` (라인 88)
   ```
   border-color: var(--mg-error-500, #dc2626);
   ```

8. **HEX_6**: `#2c2c2c` (라인 117)
   ```
   color: var(--mg-color-text-main, #2c2c2c);
   ```

9. **HEX_6**: `#4a6354` (라인 129)
   ```
   background-color: var(--mg-color-primary-light, #4a6354);
   ```

10. **HEX_6**: `#4a6354` (라인 130)
   ```
   border-color: var(--mg-color-primary-light, #4a6354);
   ```

---

### 📁 `frontend/src/components/billing/PaymentMethodRegistration.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#e5e7eb` (라인 20)
   ```
   border-bottom: 1px solid #e5e7eb;
   ```

2. **HEX_6**: `#1f2937` (라인 27)
   ```
   color: #1f2937;
   ```

3. **HEX_6**: `#4b5563` (라인 36)
   ```
   color: #4b5563;
   ```

4. **HEX_6**: `#6b7280` (라인 41)
   ```
   color: #6b7280;
   ```

5. **HEX_6**: `#fef2f2` (라인 51)
   ```
   background: #fef2f2;
   ```

6. **HEX_6**: `#fecaca` (라인 52)
   ```
   border: 1px solid #fecaca;
   ```

7. **HEX_6**: `#dc2626` (라인 54)
   ```
   color: #dc2626;
   ```

8. **HEX_6**: `#f9fafb` (라인 63)
   ```
   background: #f9fafb;
   ```

9. **HEX_6**: `#374151` (라인 75)
   ```
   color: #374151;
   ```

10. **HEX_6**: `#6b7280` (라인 79)
   ```
   color: #6b7280;
   ```

---

### 📁 `frontend/src/components/admin/TodayStatistics.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#f0f0f0` (라인 109)
   ```
   border: 1px solid #f0f0f0;
   ```

2. **HEX_6**: `#E8E0FF` (라인 132)
   ```
   background: #E8E0FF; /* 파스텔 보라색 */
   ```

3. **HEX_6**: `#D1C4E9` (라인 133)
   ```
   border-color: #D1C4E9;
   ```

4. **HEX_6**: `#7B68EE` (라인 137)
   ```
   color: #7B68EE; /* 진한 보라색 */
   ```

5. **HEX_6**: `#D4F1E0` (라인 141)
   ```
   background: #D4F1E0; /* 파스텔 민트색 */
   ```

6. **HEX_6**: `#C8E6C9` (라인 142)
   ```
   border-color: #C8E6C9;
   ```

7. **HEX_6**: `#FFE8D1` (라인 150)
   ```
   background: #FFE8D1; /* 파스텔 오렌지색 */
   ```

8. **HEX_6**: `#FFCCBC` (라인 151)
   ```
   border-color: #FFCCBC;
   ```

9. **HEX_6**: `#FFE0DB` (라인 159)
   ```
   background: #FFE0DB; /* 파스텔 코랄색 */
   ```

10. **HEX_6**: `#FFCDD2` (라인 160)
   ```
   border-color: #FFCDD2;
   ```

---

### 📁 `frontend/src/hooks/usePrint.js` (JS)

**하드코딩 색상**: 10개

1. **HEX_3**: `#333` (라인 56)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
   ```

2. **HEX_3**: `#333` (라인 57)
   ```
   borderBottom: '2px solid #333',
   ```

3. **HEX_3**: `#666` (라인 67)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
   ```

4. **HEX_3**: `#666` (라인 68)
   ```
   color: '#666',
   ```

5. **HEX_3**: `#666` (라인 78)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
   ```

6. **HEX_3**: `#666` (라인 79)
   ```
   color: '#666',
   ```

7. **HEX_3**: `#ccc` (라인 80)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ccc -> var(--mg-custom-ccc)
   ```

8. **HEX_3**: `#ccc` (라인 81)
   ```
   borderTop: '1px solid #ccc',
   ```

9. **HEX_3**: `#333` (라인 96)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
   ```

10. **HEX_3**: `#333` (라인 97)
   ```
   border: '1px solid #333',
   ```

---

### 📁 `frontend/src/components/common/PrintComponent.js` (JS)

**하드코딩 색상**: 10개

1. **HEX_3**: `#333` (라인 61)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
   ```

2. **HEX_3**: `#333` (라인 62)
   ```
   borderBottom: '2px solid #333',
   ```

3. **HEX_3**: `#666` (라인 72)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
   ```

4. **HEX_3**: `#666` (라인 73)
   ```
   color: '#666',
   ```

5. **HEX_3**: `#666` (라인 83)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
   ```

6. **HEX_3**: `#666` (라인 84)
   ```
   color: '#666',
   ```

7. **HEX_3**: `#ccc` (라인 85)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ccc -> var(--mg-custom-ccc)
   ```

8. **HEX_3**: `#ccc` (라인 86)
   ```
   borderTop: '1px solid #ccc',
   ```

9. **HEX_3**: `#333` (라인 101)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
   ```

10. **HEX_3**: `#333` (라인 102)
   ```
   border: '1px solid #333',
   ```

---

### 📁 `frontend/src/styles/responsive-layout-tokens.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#2C2C2C` (라인 66)
   ```
   --mg-layout-sidebar-bg: #2C2C2C;
   ```

2. **HEX_6**: `#3D5246` (라인 67)
   ```
   --mg-layout-sidebar-active-bg: #3D5246;
   ```

3. **HEX_6**: `#FAF9F7` (라인 69)
   ```
   --mg-layout-header-bg: #FAF9F7;
   ```

4. **HEX_6**: `#D4CFC8` (라인 70)
   ```
   --mg-layout-header-border: #D4CFC8;
   ```

5. **HEX_6**: `#FAF9F7` (라인 71)
   ```
   --mg-layout-main-bg-start: #FAF9F7;
   ```

6. **HEX_6**: `#F2EDE8` (라인 72)
   ```
   --mg-layout-main-bg-end: #F2EDE8;
   ```

7. **HEX_6**: `#F5F3EF` (라인 73)
   ```
   --mg-layout-section-bg: #F5F3EF;
   ```

8. **HEX_6**: `#D4CFC8` (라인 74)
   ```
   --mg-layout-section-border: #D4CFC8;
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 68)
   ```
   --mg-layout-sidebar-text: rgba(255, 255, 255, 0.7);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_header.css` (CSS)

**하드코딩 색상**: 9개

1. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 5)
   ```
   background: var(--header-bg, rgba(250, 250, 250, 0.95)) !important;
   ```

2. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 8)
   ```
   border-bottom: 1px solid var(--header-border, rgba(209, 209, 214, 0.8));
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 9)
   ```
   box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 59)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

5. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 82)
   ```
   box-shadow: 0 2px 6px rgba(0, 123, 255, 0.2);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 309)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 326)
   ```
   box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
   ```

8. **RGBA**: `rgba(20, 20, 20, 0.95)` (라인 364)
   ```
   background: rgba(20, 20, 20, 0.95);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 365)
   ```
   border-bottom-color: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/landing/CounselingServices.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#1a202c` (라인 26)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#4a5568` (라인 45)
   ```
   color: #4a5568;
   ```

3. **HEX_6**: `#1a202c` (라인 109)
   ```
   color: #1a202c;
   ```

4. **HEX_6**: `#4a5568` (라인 120)
   ```
   color: #4a5568;
   ```

5. **RGBA**: `rgba(200, 220, 240, 0.1)` (라인 8)
   ```
   background: rgba(200, 220, 240, 0.1);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 78)
   ```
   0 10px 10px -5px rgba(0, 0, 0, 0.04),
   ```

7. **RGBA**: `rgba(200, 220, 255, 0.4)` (라인 79)
   ```
   0 4px 12px rgba(200, 220, 255, 0.4);
   ```

8. **RGBA**: `rgba(200, 220, 255, 0.3)` (라인 93)
   ```
   background: rgba(200, 220, 255, 0.3);
   ```

9. **RGBA**: `rgba(200, 220, 255, 0.5)` (라인 102)
   ```
   background: rgba(200, 220, 255, 0.5);
   ```

---

### 📁 `frontend/src/components/landing/CounselingHero.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#1a202c` (라인 83)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#4a5568` (라인 101)
   ```
   color: #4a5568;
   ```

3. **RGBA**: `rgba(180, 200, 240, 0.6)` (라인 19)
   ```
   radial-gradient(ellipse at 30% 20%, rgba(180, 200, 240, 0.6) 0%, transparent 60%),
   ```

4. **RGBA**: `rgba(190, 210, 245, 0.5)` (라인 20)
   ```
   radial-gradient(ellipse at 70% 80%, rgba(190, 210, 245, 0.5) 0%, transparent 50%),
   ```

5. **RGBA**: `rgba(200, 220, 250, 0.4)` (라인 21)
   ```
   radial-gradient(ellipse at 20% 70%, rgba(200, 220, 250, 0.4) 0%, transparent 40%),
   ```

6. **RGBA**: `rgba(175, 195, 235, 0.55)` (라인 22)
   ```
   radial-gradient(ellipse at 80% 30%, rgba(175, 195, 235, 0.55) 0%, transparent 45%);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 156)
   ```
   box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

8. **RGBA**: `rgba(200, 220, 255, 0.3)` (라인 177)
   ```
   background: rgba(200, 220, 255, 0.3);
   ```

9. **RGBA**: `rgba(175, 195, 235, 0.3)` (라인 185)
   ```
   background: rgba(175, 195, 235, 0.3);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/DesktopLnb.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#2C2C2C` (라인 3)
   ```
   * RESPONSIVE_LAYOUT_SPEC: #2C2C2C, 메뉴 항목 44px
   ```

2. **HEX_6**: `#2C2C2C` (라인 13)
   ```
   background: var(--mg-layout-sidebar-bg, #2C2C2C);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 20)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.1);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 26)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 70)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

6. **RGBA**: `rgba(255, 255, 255, 1)` (라인 76)
   ```
   color: rgba(255, 255, 255, 1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 77)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 83)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 118)
   ```
   border-left: 1px solid rgba(255, 255, 255, 0.15);
   ```

---

### 📁 `frontend/src/styles/08-utilities/_responsive.css` (CSS)

**하드코딩 색상**: 8개

1. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 13)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 20)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

3. **RGBA**: `rgba(248, 248, 248, 0.8)` (라인 24)
   ```
   background: rgba(248, 248, 248, 0.8);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 36)
   ```
   background: rgba(0, 0, 0, 0.02);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 65)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

6. **RGBA**: `rgba(248, 248, 248, 0.8)` (라인 77)
   ```
   background: rgba(248, 248, 248, 0.8);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 78)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 285)
   ```
   background: rgba(0, 0, 0, 0.02);
   ```

---

### 📁 `frontend/src/styles/06-components/_glass-components.css` (CSS)

**하드코딩 색상**: 8개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 75)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 81)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 134)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
   ```

4. **RGBA**: `rgba(0, 122, 255, 0.8)` (라인 143)
   ```
   background: rgba(0, 122, 255, 0.8);
   ```

5. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 146)
   ```
   box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 122, 255, 0.9)` (라인 150)
   ```
   background: rgba(0, 122, 255, 0.9);
   ```

7. **RGBA**: `rgba(0, 122, 255, 0.4)` (라인 152)
   ```
   box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 207)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/styles/06-components/_dropdowns.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#2c2c2e` (라인 258)
   ```
   background: var(--ios-bg-secondary-dark, #2c2c2e);
   ```

2. **HEX_6**: `#38383a` (라인 259)
   ```
   border-color: var(--ios-border-dark, #38383a);
   ```

3. **HEX_6**: `#3a3a3c` (라인 264)
   ```
   background: var(--ios-bg-tertiary-dark, #3a3a3c);
   ```

4. **HEX_6**: `#48484a` (라인 265)
   ```
   border-color: var(--ios-border-hover-dark, #48484a);
   ```

5. **HEX_6**: `#1c1c1e` (라인 269)
   ```
   background: var(--ios-bg-primary-dark, #1c1c1e);
   ```

6. **HEX_6**: `#38383a` (라인 270)
   ```
   border-color: var(--ios-border-dark, #38383a);
   ```

7. **HEX_6**: `#2c2c2e` (라인 278)
   ```
   background: var(--ios-bg-secondary-dark, #2c2c2e);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 75)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/schedule/TodayStats.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#374151` (라인 24)
   ```
   color: #374151;
   ```

2. **HEX_6**: `#f3f4f6` (라인 38)
   ```
   background-color: #f3f4f6;
   ```

3. **HEX_6**: `#f8fafc` (라인 53)
   ```
   background-color: #f8fafc;
   ```

4. **HEX_6**: `#e2e8f0` (라인 55)
   ```
   border: 1px solid #e2e8f0;
   ```

5. **HEX_6**: `#f1f5f9` (라인 60)
   ```
   background-color: #f1f5f9;
   ```

6. **HEX_6**: `#cbd5e1` (라인 61)
   ```
   border-color: #cbd5e1;
   ```

7. **HEX_6**: `#1e40af` (라인 67)
   ```
   color: #1e40af;
   ```

8. **HEX_6**: `#64748b` (라인 74)
   ```
   color: #64748b;
   ```

---

### 📁 `frontend/src/components/dashboard-v2/styles/dropdown-common.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#F5F3EF` (라인 39)
   ```
   background-color: var(--mg-color-surface-main, #F5F3EF);
   ```

2. **HEX_6**: `#D4CFC8` (라인 40)
   ```
   border: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

3. **HEX_6**: `#D4CFC8` (라인 67)
   ```
   border-bottom: 1px solid var(--mg-color-border-main, #D4CFC8);
   ```

4. **HEX_6**: `#2C2C2C` (라인 78)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 17)
   ```
   background-color: rgba(0, 0, 0, 0.4);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 42)
   ```
   box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 97)
   ```
   background-color: rgba(0, 0, 0, 0.4);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 112)
   ```
   background-color: rgba(0, 0, 0, 0.4);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/atoms/NavLink.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#3D5246` (라인 33)
   ```
   background: var(--mg-layout-sidebar-active-bg, #3D5246);
   ```

2. **HEX_6**: `#3D5246` (라인 79)
   ```
   background: var(--mg-layout-sidebar-active-bg, #3D5246);
   ```

3. **HEX_6**: `#3D5246` (라인 84)
   ```
   background: var(--mg-layout-sidebar-active-bg, #3D5246);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 19)
   ```
   color: var(--mg-layout-sidebar-text, rgba(255, 255, 255, 0.7));
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 28)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 29)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 74)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 75)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/common/HeaderWidget.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_3**: `#333` (라인 32)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

2. **HEX_3**: `#333` (라인 55)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

3. **HEX_3**: `#666` (라인 75)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

4. **HEX_3**: `#666` (라인 112)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

5. **HEX_3**: `#333` (라인 124)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

6. **HEX_3**: `#666` (라인 129)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

7. **HEX_6**: `#0056b3` (라인 160)
   ```
   background-color: var(--mg-color-primary-dark, #0056b3);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 7)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/AdminDashboardPipeline.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#4b745c` (라인 17)
   ```
   --mg-pipeline-primary: #4b745c;
   ```

2. **HEX_6**: `#2d3748` (라인 18)
   ```
   --mg-pipeline-text: #2d3748;
   ```

3. **HEX_6**: `#f8fafc` (라인 21)
   ```
   --mg-pipeline-card-bg-neutral: #f8fafc;
   ```

4. **HEX_6**: `#fff5f5` (라인 22)
   ```
   --mg-pipeline-card-bg-warning: #fff5f5;
   ```

5. **HEX_6**: `#ebf2ee` (라인 23)
   ```
   --mg-pipeline-card-bg-success: #ebf2ee;
   ```

6. **HEX_6**: `#fcf3ed` (라인 24)
   ```
   --mg-pipeline-card-bg-info: #fcf3ed;
   ```

7. **HEX_6**: `#f8fafc` (라인 25)
   ```
   --mg-pipeline-card-bg-auto: #f8fafc;
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 20)
   ```
   --mg-pipeline-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/molecules/PipelineStepCard.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#f8fafc` (라인 9)
   ```
   background: var(--mg-pipeline-card-bg, #f8fafc);
   ```

2. **HEX_6**: `#4b745c` (라인 17)
   ```
   color: var(--mg-pipeline-primary, #4b745c);
   ```

3. **HEX_6**: `#2d3748` (라인 29)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

4. **HEX_6**: `#fff5f5` (라인 35)
   ```
   background: #fff5f5;
   ```

5. **HEX_6**: `#ebf2ee` (라인 39)
   ```
   background: #ebf2ee;
   ```

6. **HEX_6**: `#fcf3ed` (라인 43)
   ```
   background: #fcf3ed;
   ```

7. **HEX_6**: `#f8fafc` (라인 47)
   ```
   background: #f8fafc;
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 11)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/constants/adminDashboard.js` (JS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#5ac8fa` (라인 158)
   ```
   INFO: '#5ac8fa',
   ```

2. **HEX_6**: `#f2f2f7` (라인 159)
   ```
   LIGHT: '#f2f2f7',
   ```

3. **HEX_6**: `#1c1c1e` (라인 160)
   ```
   DARK: '#1c1c1e',
   ```

4. **HEX_6**: `#1d1d1f` (라인 162)
   ```
   TEXT_PRIMARY: '#1d1d1f',
   ```

5. **HEX_6**: `#86868b` (라인 163)
   ```
   TEXT_SECONDARY: '#86868b',
   ```

6. **HEX_6**: `#c7c7cc` (라인 164)
   ```
   TEXT_TERTIARY: '#c7c7cc',
   ```

7. **HEX_6**: `#f2f2f7` (라인 167)
   ```
   BG_SECONDARY: '#f2f2f7',
   ```

8. **HEX_6**: `#e5e5ea` (라인 168)
   ```
   BG_TERTIARY: '#e5e5ea'
   ```

---

### 📁 `frontend/src/styles/tablet/index.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#1877F2` (라인 19)
   ```
   --tablet-social-facebook-bg: #1877F2;
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 169)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 785)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 1287)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 1317)
   ```
   border: 3px solid rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(184, 230, 184, 0.1)` (라인 1696)
   ```
   box-shadow: 0 0 0 3px rgba(184, 230, 184, 0.1);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 1830)
   ```
   border: 3px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/dashboard/SummaryPanels.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#495057` (라인 107)
   ```
   color: #495057;
   ```

2. **HEX_6**: `#e9ecef` (라인 124)
   ```
   border: 1px solid #e9ecef;
   ```

3. **HEX_6**: `#e9ecef` (라인 129)
   ```
   background: #e9ecef;
   ```

4. **HEX_6**: `#e9ecef` (라인 140)
   ```
   border: 2px solid #e9ecef;
   ```

5. **HEX_6**: `#495057` (라인 150)
   ```
   color: #495057;
   ```

6. **HEX_6**: `#e9ecef` (라인 188)
   ```
   border-top: 1px solid #e9ecef;
   ```

7. **RGBA**: `rgba(168, 230, 168, 0.2)` (라인 85)
   ```
   box-shadow: 0 2px 4px rgba(168, 230, 168, 0.2);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/WidgetCardWrapper.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#dee2e6` (라인 46)
   ```
   border: 1px solid #dee2e6;
   ```

2. **HEX_6**: `#dee2e6` (라인 63)
   ```
   border: 1px solid #dee2e6;
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 22)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 24)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 29)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 126)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 138)
   ```
   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/common/Chart.css` (CSS)

**하드코딩 색상**: 7개

1. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 207)
   ```
   background: rgba(0, 0, 0, 0.8);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 208)
   ```
   border: 1px solid rgba(255, 255, 255, 0.1);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 261)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

4. **RGBA**: `rgba(248, 215, 218, 0.9)` (라인 275)
   ```
   background: rgba(248, 215, 218, 0.9);
   ```

5. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 285)
   ```
   box-shadow: 0 2px 8px rgba(40, 167, 69, 0.1);
   ```

6. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 291)
   ```
   box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
   ```

7. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 297)
   ```
   box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
   ```

---

### 📁 `frontend/src/components/client/ClientSchedule.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#87CEEB` (라인 40)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

2. **HEX_6**: `#B0E0E6` (라인 40)
   ```
   background: linear-gradient(135deg, #87CEEB, #B0E0E6);
   ```

3. **HEX_6**: `#FF6B9D` (라인 109)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

4. **HEX_6**: `#FFA5C0` (라인 109)
   ```
   background: linear-gradient(135deg, #FF6B9D, #FFA5C0);
   ```

5. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 30)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

6. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 30)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

7. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 31)
   ```
   border: var(--border-width) solid rgba(255, 182, 193, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/PaymentConfirmationModal.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#e5e7eb` (라인 12)
   ```
   border-top: 1px solid var(--color-border-light, #e5e7eb);
   ```

2. **HEX_6**: `#f9fafb` (라인 13)
   ```
   background: var(--color-bg-secondary, #f9fafb);
   ```

3. **HEX_6**: `#059669` (라인 48)
   ```
   background-color: #059669 !important;
   ```

4. **HEX_6**: `#dc2626` (라인 57)
   ```
   background-color: #dc2626 !important;
   ```

5. **HEX_6**: `#6b7280` (라인 61)
   ```
   background-color: #6b7280 !important;
   ```

6. **HEX_6**: `#d1d5db` (라인 63)
   ```
   border: 1px solid #d1d5db !important;
   ```

7. **HEX_6**: `#4b5563` (라인 67)
   ```
   background-color: #4b5563 !important;
   ```

---

### 📁 `frontend/src/constants/onboarding.js` (JS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#9e9e9e` (라인 32)
   ```
   ON_HOLD: '#9e9e9e',
   ```

2. **HEX_6**: `#2e7d32` (라인 33)
   ```
   LOW: '#2e7d32',
   ```

3. **HEX_6**: `#e65100` (라인 34)
   ```
   MEDIUM: '#e65100',
   ```

4. **HEX_6**: `#c62828` (라인 35)
   ```
   HIGH: '#c62828'
   ```

5. **HEX_6**: `#e8f5e9` (라인 39)
   ```
   LOW: '#e8f5e9',
   ```

6. **HEX_6**: `#fff3e0` (라인 40)
   ```
   MEDIUM: '#fff3e0',
   ```

7. **HEX_6**: `#ffebee` (라인 41)
   ```
   HIGH: '#ffebee'
   ```

---

### 📁 `frontend/src/components/common/SalaryPrintComponent.js` (JS)

**하드코딩 색상**: 7개

1. **HEX_3**: `#333` (라인 56)
   ```
   border: '2px solid #333'
   ```

2. **HEX_3**: `#333` (라인 73)
   ```
   border: '1px solid #333',
   ```

3. **HEX_3**: `#333` (라인 78)
   ```
   border: '1px solid #333',
   ```

4. **HEX_6**: `#e9ecef` (라인 70)
   ```
   backgroundColor: '#e9ecef',
   ```

5. **HEX_6**: `#e8f5e8` (라인 87)
   ```
   backgroundColor: '#e8f5e8',
   ```

6. **HEX_6**: `#fff3cd` (라인 91)
   ```
   backgroundColor: '#fff3cd'
   ```

7. **HEX_6**: `#d4edda` (라인 94)
   ```
   backgroundColor: '#d4edda',
   ```

---

### 📁 `frontend/src/styles/06-components/_notifications.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#1f2937` (라인 84)
   ```
   color: var(--color-text-primary, #1f2937);
   ```

2. **HEX_6**: `#6b7280` (라인 95)
   ```
   color: var(--color-text-secondary, #6b7280);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 36)
   ```
   background: var(--notification-toast-bg, rgba(255, 255, 255, 0.95));
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 236)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 248)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 274)
   ```
   background: rgba(0, 0, 0, 0.6);
   ```

---

### 📁 `frontend/src/pages/CounselingCenterLanding.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#2d3748` (라인 16)
   ```
   color: #2d3748;
   ```

2. **RGBA**: `rgba(240, 248, 255, 0.8)` (라인 9)
   ```
   rgba(240, 248, 255, 0.8) 0%,
   ```

3. **RGBA**: `rgba(245, 245, 250, 0.9)` (라인 10)
   ```
   rgba(245, 245, 250, 0.9) 25%,
   ```

4. **RGBA**: `rgba(250, 248, 255, 0.8)` (라인 11)
   ```
   rgba(250, 248, 255, 0.8) 50%,
   ```

5. **RGBA**: `rgba(240, 248, 255, 0.9)` (라인 12)
   ```
   rgba(240, 248, 255, 0.9) 75%,
   ```

6. **RGBA**: `rgba(245, 250, 255, 0.8)` (라인 13)
   ```
   rgba(245, 250, 255, 0.8) 100%);
   ```

---

### 📁 `frontend/src/components/test/NotificationTest.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#374151` (라인 257)
   ```
   background: #374151;
   ```

2. **HEX_6**: `#4a5568` (라인 258)
   ```
   border-color: #4a5568;
   ```

3. **HEX_6**: `#2d3748` (라인 274)
   ```
   background: #2d3748;
   ```

4. **HEX_6**: `#4a5568` (라인 275)
   ```
   border-color: #4a5568;
   ```

5. **HEX_6**: `#2d3748` (라인 285)
   ```
   background: #2d3748;
   ```

6. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 190)
   ```
   box-shadow: 0 0 0 3px rgba(184, 230, 184, 0.2);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/MobileLnbDrawer.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#2C2C2C` (라인 31)
   ```
   background: var(--mg-layout-sidebar-bg, #2C2C2C);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 95)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

3. **RGBA**: `rgba(255, 255, 255, 1)` (라인 101)
   ```
   color: rgba(255, 255, 255, 1);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 102)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 108)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 143)
   ```
   border-left: 1px solid rgba(255, 255, 255, 0.15);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/DesktopGnb.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#FAF9F7` (라인 3)
   ```
   * RESPONSIVE_LAYOUT_SPEC: 배경 #FAF9F7, 하단 1px #D4CFC8
   ```

2. **HEX_6**: `#D4CFC8` (라인 3)
   ```
   * RESPONSIVE_LAYOUT_SPEC: 배경 #FAF9F7, 하단 1px #D4CFC8
   ```

3. **HEX_6**: `#FAF9F7` (라인 15)
   ```
   background: var(--mg-layout-header-bg, #FAF9F7);
   ```

4. **HEX_6**: `#D4CFC8` (라인 16)
   ```
   border-bottom: 1px solid var(--mg-layout-header-border, #D4CFC8);
   ```

5. **HEX_6**: `#2d3748` (라인 41)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

6. **HEX_6**: `#2d3748` (라인 47)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/atoms/NavIcon.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#e2e8f0` (라인 19)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

2. **HEX_6**: `#4a5568` (라인 21)
   ```
   color: var(--ad-b0kla-icon-color, #4a5568);
   ```

3. **HEX_6**: `#fcfbfa` (라인 27)
   ```
   background: var(--ad-b0kla-bg, #fcfbfa);
   ```

4. **HEX_6**: `#e2e8f0` (라인 43)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

5. **HEX_6**: `#fcfbfa` (라인 50)
   ```
   background: var(--ad-b0kla-bg, #fcfbfa);
   ```

6. **HEX_6**: `#4a5568` (라인 68)
   ```
   color: var(--ad-b0kla-icon-color, #4a5568);
   ```

---

### 📁 `frontend/src/components/common/MgEmailFieldWithAutocomplete.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#F5F3EF` (라인 14)
   ```
   background: var(--mg-color-surface-main, var(--mg-surface-primary, #F5F3EF));
   ```

2. **HEX_6**: `#D4CFC8` (라인 15)
   ```
   border: 1px solid var(--mg-color-border-main, var(--mg-border-color, #D4CFC8));
   ```

3. **HEX_6**: `#1A1A1A` (라인 26)
   ```
   color: var(--mg-color-text-main, var(--mg-text-primary, #1A1A1A));
   ```

4. **HEX_6**: `#D4CFC8` (라인 28)
   ```
   border-bottom: 1px solid var(--mg-color-border-main, var(--mg-border-color, #D4CFC8));
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 17)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
   ```

6. **RGBA**: `rgba(61, 82, 70, 0.08)` (라인 38)
   ```
   background: rgba(61, 82, 70, 0.08);
   ```

---

### 📁 `frontend/src/components/common/MGCard.css` (CSS)

**하드코딩 색상**: 6개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 9)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

2. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 10)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 21)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px var(--mg-shadow-light);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 53)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 55)
   ```
   0 4px 16px rgba(0, 0, 0, 0.05),
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 56)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/common/HelpPage.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#f8f9ff` (라인 5)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

2. **HEX_6**: `#e8f2ff` (라인 5)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 51)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 91)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 137)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/client/ClientMessageScreen.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#f8f9ff` (라인 146)
   ```
   background: #f8f9ff;
   ```

2. **HEX_6**: `#fff3cd` (라인 151)
   ```
   background: #fff3cd;
   ```

3. **HEX_6**: `#f8d7da` (라인 156)
   ```
   background: #f8d7da;
   ```

4. **HEX_6**: `#f8f9ff` (라인 504)
   ```
   background: #f8f9ff;
   ```

5. **HEX_6**: `#fff3cd` (라인 509)
   ```
   background: #fff3cd;
   ```

6. **HEX_6**: `#f8d7da` (라인 514)
   ```
   background: #f8d7da;
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeStats.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#1d4ed8` (라인 40)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500), #1d4ed8);
   ```

2. **HEX_6**: `#059669` (라인 44)
   ```
   background: linear-gradient(135deg, var(--mg-success-500), #059669);
   ```

3. **HEX_6**: `#dc2626` (라인 48)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #dc2626);
   ```

4. **HEX_6**: `#7c3aed` (라인 52)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500), #7c3aed);
   ```

5. **HEX_6**: `#1f2937` (라인 62)
   ```
   color: #1f2937;
   ```

6. **HEX_6**: `#6b7280` (라인 69)
   ```
   color: #6b7280;
   ```

---

### 📁 `frontend/src/constants/vacation.js` (JS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#FF5722` (라인 31)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FF5722 -> var(--mg-custom-FF5722)
   ```

2. **HEX_6**: `#FF5722` (라인 32)
   ```
   [VACATION_TYPES.AFTERNOON]: '#FF5722',    // 딥오렌지
   ```

3. **HEX_6**: `#FF7043` (라인 35)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #FF7043 -> var(--mg-custom-FF7043)
   ```

4. **HEX_6**: `#FF7043` (라인 36)
   ```
   [VACATION_TYPES.AFTERNOON_HALF]: '#FF7043', // 딥오렌지
   ```

5. **HEX_6**: `#9C27B0` (라인 37)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9C27B0 -> var(--mg-custom-9C27B0)
   ```

6. **HEX_6**: `#9C27B0` (라인 38)
   ```
   [VACATION_TYPES.CUSTOM_TIME]: '#9C27B0'   // 퍼플
   ```

---

### 📁 `frontend/src/components/test/UnifiedModalTest.js` (JS)

**하드코딩 색상**: 6개

1. **HEX_3**: `#ddd` (라인 175)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

2. **HEX_3**: `#ddd` (라인 176)
   ```
   style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
   ```

3. **HEX_3**: `#ddd` (라인 184)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

4. **HEX_3**: `#ddd` (라인 185)
   ```
   style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
   ```

5. **HEX_3**: `#ddd` (라인 192)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
   ```

6. **HEX_3**: `#ddd` (라인 193)
   ```
   style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '80px' }}
   ```

---

### 📁 `frontend/src/components/common/PrivacyPolicy.js` (JS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#fff3cd` (라인 101)
   ```
   background: 'var(--mg-custom-fff3cd, #fff3cd)',
   ```

2. **HEX_6**: `#ffeaa7` (라인 102)
   ```
   border: '1px solid var(--mg-custom-ffeaa7, #ffeaa7)',
   ```

3. **HEX_6**: `#856404` (라인 107)
   ```
   <p className="mg-v2-text-sm mg-v2-m-0" style={{ color: 'var(--mg-custom-856404, #856404)' }}>
   ```

4. **HEX_6**: `#e8f4fd` (라인 190)
   ```
   background: 'var(--mg-custom-e8f4fd, #e8f4fd)',
   ```

5. **HEX_6**: `#bee5eb` (라인 191)
   ```
   border: '1px solid var(--mg-custom-bee5eb, #bee5eb)',
   ```

6. **HEX_6**: `#0c5460` (라인 196)
   ```
   <p style={{ margin: '0', fontSize: 'var(--font-size-sm)', color: 'var(--mg-custom-0c5460, #0c5460)' }}>
   ```

---

### 📁 `frontend/src/components/landing/CounselingAbout.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#1a202c` (라인 23)
   ```
   color: #1a202c;
   ```

2. **HEX_6**: `#4a5568` (라인 30)
   ```
   color: #4a5568;
   ```

3. **HEX_6**: `#1a202c` (라인 60)
   ```
   color: #1a202c;
   ```

4. **HEX_6**: `#4a5568` (라인 66)
   ```
   color: #4a5568;
   ```

5. **RGBA**: `rgba(245, 250, 255, 0.3)` (라인 7)
   ```
   background: rgba(245, 250, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/atoms/SearchInput.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#e2e8f0` (라인 17)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

2. **HEX_6**: `#2d3748` (라인 19)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

3. **HEX_6**: `#4b745c` (라인 23)
   ```
   border-color: var(--ad-b0kla-green, #4b745c);
   ```

4. **HEX_6**: `#a0aec0` (라인 32)
   ```
   color: var(--ad-b0kla-placeholder, #a0aec0);
   ```

5. **HEX_6**: `#a0aec0` (라인 50)
   ```
   color: var(--ad-b0kla-placeholder, #a0aec0);
   ```

---

### 📁 `frontend/src/components/admin/SystemConfigManagement.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#2563eb` (라인 249)
   ```
   color: var(--mg-color-primary-main, #2563eb);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 24)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 156)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 299)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 333)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/widgets/SecurityMonitoringWidget.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 126)
   ```
   background: rgba(76, 175, 80, 0.1);
   ```

2. **RGBA**: `rgba(139, 195, 74, 0.1)` (라인 131)
   ```
   background: rgba(139, 195, 74, 0.1);
   ```

3. **RGBA**: `rgba(255, 152, 0, 0.1)` (라인 136)
   ```
   background: rgba(255, 152, 0, 0.1);
   ```

4. **RGBA**: `rgba(244, 67, 54, 0.1)` (라인 141)
   ```
   background: rgba(244, 67, 54, 0.1);
   ```

5. **RGBA**: `rgba(255, 152, 0, 0.1)` (라인 314)
   ```
   background: rgba(255, 152, 0, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/mapping/MappingActions.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#e1e8ed` (라인 9)
   ```
   border-top: 1px solid #e1e8ed;
   ```

2. **HEX_6**: `#218838` (라인 73)
   ```
   background-color: #218838;
   ```

3. **HEX_6**: `#212529` (라인 89)
   ```
   color: #212529;
   ```

4. **HEX_6**: `#e0a800` (라인 93)
   ```
   background-color: #e0a800;
   ```

5. **HEX_6**: `#5a6268` (라인 113)
   ```
   background-color: #5a6268;
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/SchedulePendingList.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#2d3748` (라인 19)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

2. **HEX_6**: `#e5e7eb` (라인 34)
   ```
   border-bottom: 1px solid var(--mg-border-light, #e5e7eb);
   ```

3. **HEX_6**: `#2d3748` (라인 49)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

4. **HEX_6**: `#64748b` (라인 54)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 7)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/DepositPendingList.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#2d3748` (라인 19)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

2. **HEX_6**: `#e5e7eb` (라인 34)
   ```
   border-bottom: 1px solid var(--mg-border-light, #e5e7eb);
   ```

3. **HEX_6**: `#2d3748` (라인 55)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

4. **HEX_6**: `#64748b` (라인 60)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 7)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/AdminMetricsVisualization.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#dc3545` (라인 16)
   ```
   color: var(--mg-text-error, var(--ad-b0kla-red, #dc3545));
   ```

2. **HEX_6**: `#64748b` (라인 22)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

3. **HEX_6**: `#e2e8f0` (라인 52)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 56)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 8px 24px rgba(0, 0, 0, 0.05));
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 61)
   ```
   box-shadow: var(--ad-b0kla-shadow-hover, 0 12px 32px rgba(0, 0, 0, 0.08));
   ```

---

### 📁 `frontend/src/components/emotion/CognitiveDistortionPanel.js` (JS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#84cc16` (라인 52)
   ```
   if (score > 0.2) return '#84cc16';
   ```

2. **HEX_6**: `#f97316` (라인 54)
   ```
   if (score > -0.5) return '#f97316';
   ```

3. **HEX_6**: `#dc2626` (라인 55)
   ```
   return '#dc2626';
   ```

4. **HEX_6**: `#dc2626` (라인 60)
   ```
   'HIGH': '#dc2626',
   ```

5. **HEX_6**: `#6b7280` (라인 64)
   ```
   return colors[severity] || '#6b7280';
   ```

---

### 📁 `frontend/src/components/admin/PaymentConfirmationModal.js` (JS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#fee500` (라인 111)
   ```
   { value: 'KAKAO_PAY', label: '카카오페이', icon: '💛', color: '#fee500', description: '카카오페이 간편결제' },
   ```

2. **HEX_6**: `#03c75a` (라인 112)
   ```
   { value: 'NAVER_PAY', label: '네이버페이', icon: '💚', color: '#03c75a', description: '네이버페이 간편결제' },
   ```

3. **HEX_6**: `#0064ff` (라인 113)
   ```
   { value: 'TOSS', label: '토스', icon: '🔷', color: '#0064ff', description: '토스 간편결제' },
   ```

4. **HEX_6**: `#0070ba` (라인 114)
   ```
   { value: 'PAYPAL', label: '페이팔', icon: '🔵', color: '#0070ba', description: '페이팔 결제' },
   ```

5. **HEX_6**: `#6b7280` (라인 115)
   ```
   { value: 'OTHER', label: '기타', icon: '💱', color: '#6b7280', description: '기타 결제 방법' }
   ```

---

### 📁 `frontend/src/styles/index.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 48)
   ```
   background: var(--modal-backdrop, rgba(0, 0, 0, 0.3));
   ```

2. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 58)
   ```
   background: var(--modal-bg, rgba(250, 250, 250, 0.98));
   ```

3. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 65)
   ```
   border: 1px solid var(--modal-border, rgba(209, 209, 214, 0.8));
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 125)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_iphone17-buttons.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 30)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
   ```

2. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 85)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

3. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 90)
   ```
   background: rgba(0, 122, 255, 0.2);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 189)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
   ```

---

### 📁 `frontend/src/components/wellness/MindfulnessGuide.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(152, 216, 200, 0.2)` (라인 182)
   ```
   border: 1px solid rgba(152, 216, 200, 0.2);
   ```

2. **RGBA**: `rgba(152, 216, 200, 0.15)` (라인 211)
   ```
   border-bottom: 1px solid rgba(152, 216, 200, 0.15);
   ```

3. **RGBA**: `rgba(152, 216, 200, 0.1)` (라인 514)
   ```
   border-color: rgba(152, 216, 200, 0.1);
   ```

4. **RGBA**: `rgba(152, 216, 200, 0.08)` (라인 523)
   ```
   border-bottom-color: rgba(152, 216, 200, 0.08);
   ```

---

### 📁 `frontend/src/components/ui/MultiSelectCheckbox.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 27)
   ```
   box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
   ```

2. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 32)
   ```
   box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
   ```

3. **RGBA**: `rgba(76, 175, 80, 0.1)` (라인 107)
   ```
   box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
   ```

4. **RGBA**: `rgba(76, 175, 80, 0.2)` (라인 219)
   ```
   box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
   ```

---

### 📁 `frontend/src/components/ui/AdminMenuSidebarUI.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#2C2C2C` (라인 18)
   ```
   background: var(--mg-layout-sidebar-bg, #2C2C2C);
   ```

2. **HEX_6**: `#3D5246` (라인 124)
   ```
   background: var(--mg-layout-sidebar-active-bg, #3D5246);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 82)
   ```
   color: var(--mg-layout-sidebar-text, rgba(255, 255, 255, 0.7));
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 112)
   ```
   color: var(--mg-layout-sidebar-text, rgba(255, 255, 255, 0.7));
   ```

---

### 📁 `frontend/src/components/dashboard-v2/templates/MobileLayout.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#FAF9F7` (라인 15)
   ```
   var(--mg-layout-main-bg-start, #FAF9F7) 0%,
   ```

2. **HEX_6**: `#F2EDE8` (라인 16)
   ```
   var(--mg-layout-main-bg-end, #F2EDE8) 100%
   ```

3. **HEX_6**: `#FAF9F7` (라인 43)
   ```
   background: var(--mg-layout-header-bg, #FAF9F7);
   ```

4. **HEX_6**: `#D4CFC8` (라인 44)
   ```
   border-top: 1px solid var(--mg-layout-header-border, #D4CFC8);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/MobileGnb.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#FAF9F7` (라인 15)
   ```
   background: var(--mg-layout-header-bg, #FAF9F7);
   ```

2. **HEX_6**: `#D4CFC8` (라인 16)
   ```
   border-bottom: 1px solid var(--mg-layout-header-border, #D4CFC8);
   ```

3. **HEX_6**: `#2d3748` (라인 41)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

4. **HEX_6**: `#2d3748` (라인 47)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#FAF9F7` (라인 53)
   ```
   background-color: var(--mg-color-background-main, #FAF9F7);
   ```

2. **HEX_6**: `#3D5246` (라인 57)
   ```
   color: var(--mg-color-primary-main, #3D5246);
   ```

3. **HEX_6**: `#2C2C2C` (라인 65)
   ```
   color: var(--mg-color-text-main, #2C2C2C);
   ```

4. **HEX_6**: `#5C6B61` (라인 70)
   ```
   color: var(--mg-color-text-secondary, #5C6B61);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantRecords.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 101)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
   ```

2. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 124)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 245)
   ```
   background: rgba(0, 123, 255, 0.1);
   ```

4. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 248)
   ```
   border: var(--border-width) solid rgba(0, 123, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/common/MGStatistics.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 75)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 247)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 308)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

4. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 376)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/common/MGFilter.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

2. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 103)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

3. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 132)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

4. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 273)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/common/MGButton.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#3D5246` (라인 72)
   ```
   /* Variants — B0KlA primary #3D5246, radius 10px */
   ```

2. **HEX_6**: `#4A6354` (라인 80)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

3. **HEX_6**: `#4A6354` (라인 170)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

4. **RGBA**: `rgba(61, 82, 70, 0.15)` (라인 200)
   ```
   background-color: var(--mg-color-primary-light, rgba(61, 82, 70, 0.15));
   ```

---

### 📁 `frontend/src/components/common/LoadingSpinner.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#0056CC` (라인 62)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

2. **HEX_6**: `#0056CC` (라인 86)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

3. **HEX_6**: `#0056CC` (라인 114)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)), var(--color-primary-hover, #0056CC));
   ```

4. **RGBA**: `rgba(250, 250, 250, 0.95)` (라인 231)
   ```
   background: var(--color-bg-glass-strong, rgba(250, 250, 250, 0.95));
   ```

---

### 📁 `frontend/src/components/common/CommonLoading.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 18)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 30)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 92)
   ```
   background: rgba(0, 0, 0, 0.8);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 96)
   ```
   background: rgba(0, 0, 0, 0.6);
   ```

---

### 📁 `frontend/src/components/common/AutoResponsiveWrapper.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 39)
   ```
   border: 1px solid rgba(0, 0, 0, 0.04);
   ```

2. **RGBA**: `rgba(248, 248, 248, 0.8)` (라인 52)
   ```
   background: rgba(248, 248, 248, 0.8);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 53)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 110)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/client/ClientSettings.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#f8f9ff` (라인 7)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

2. **HEX_6**: `#e8f2ff` (라인 7)
   ```
   background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 19)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#3D5246` (라인 315)
   ```
   background-color: var(--mg-color-primary-main, #3D5246);
   ```

2. **HEX_6**: `#FAF9F7` (라인 316)
   ```
   color: var(--mg-color-primary-inverse, #FAF9F7);
   ```

3. **HEX_6**: `#2d3d34` (라인 322)
   ```
   background-color: var(--mg-color-primary-dark, #2d3d34);
   ```

4. **HEX_6**: `#FAF9F7` (라인 323)
   ```
   color: var(--mg-color-primary-inverse, #FAF9F7);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/ManualMatchingQueue.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#2d3748` (라인 19)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

2. **HEX_6**: `#64748b` (라인 25)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

3. **HEX_6**: `#64748b` (라인 37)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 7)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/molecules/MatchQueueRow.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#e5e7eb` (라인 11)
   ```
   border: 1px solid var(--mg-border-light, #e5e7eb);
   ```

2. **HEX_6**: `#2d3748` (라인 26)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

3. **HEX_6**: `#64748b` (라인 32)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

4. **HEX_6**: `#4b745c` (라인 37)
   ```
   color: var(--mg-pipeline-primary, #4b745c);
   ```

---

### 📁 `frontend/src/constants/magicNumbers.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6f42c1` (라인 224)
   ```
   PRIMARY_COLORS: ['var(--mg-primary-500)', 'var(--mg-success-500)', 'var(--mg-warning-500)', 'var(--mg-error-500)', '#6f42c1'],
   ```

2. **HEX_6**: `#fd7e14` (라인 225)
   ```
   SECONDARY_COLORS: ['var(--mg-secondary-500)', 'var(--mg-info-500)', '#fd7e14', '#20c997', '#e83e8c'],
   ```

3. **HEX_6**: `#20c997` (라인 225)
   ```
   SECONDARY_COLORS: ['var(--mg-secondary-500)', 'var(--mg-info-500)', '#fd7e14', '#20c997', '#e83e8c'],
   ```

4. **HEX_6**: `#e83e8c` (라인 225)
   ```
   SECONDARY_COLORS: ['var(--mg-secondary-500)', 'var(--mg-info-500)', '#fd7e14', '#20c997', '#e83e8c'],
   ```

---

### 📁 `frontend/src/components/auth/UnifiedLogin.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#4285F4` (라인 868)
   ```
   <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
   ```

2. **HEX_6**: `#34A853` (라인 869)
   ```
   <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
   ```

3. **HEX_6**: `#FBBC05` (라인 870)
   ```
   <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
   ```

4. **HEX_6**: `#EA4335` (라인 871)
   ```
   <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
   ```

---

### 📁 `frontend/src/components/admin/VacationManagementModal.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#fbbf24` (라인 110)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fbbf24 -> var(--mg-custom-fbbf24)
   ```

2. **HEX_6**: `#fbbf24` (라인 111)
   ```
   { value: 'MORNING_HALF_1', label: '오전 반반차 1 (09:00-11:00)', icon: '☀️', color: '#fbbf24', description: '오전 첫 번째 반반차 (09:00-11:00)' },
   ```

3. **HEX_6**: `#60a5fa` (라인 113)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #60a5fa -> var(--mg-custom-60a5fa)
   ```

4. **HEX_6**: `#60a5fa` (라인 114)
   ```
   { value: 'AFTERNOON_HALF_1', label: '오후 반반차 1 (14:00-16:00)', icon: '🌤️', color: '#60a5fa', description: '오후 첫 번째 반반차 (14:00-16:00)' },
   ```

---

### 📁 `frontend/src/components/admin/TenantCodeManagement.js` (JS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6b7280` (라인 351)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

2. **HEX_6**: `#6b7280` (라인 352)
   ```
   style={{ color: code.colorCode || '#6b7280' }}
   ```

3. **HEX_6**: `#6b7280` (라인 636)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

4. **HEX_6**: `#6b7280` (라인 637)
   ```
   value={formData.colorCode || '#6b7280'}
   ```

---

### 📁 `frontend/src/styles/06-components/_complex-data/_data-card.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(0, 122, 255, 0.05)` (라인 91)
   ```
   background: rgba(0, 122, 255, 0.05);
   ```

2. **RGBA**: `rgba(255, 59, 48, 0.05)` (라인 96)
   ```
   background: rgba(255, 59, 48, 0.05);
   ```

3. **RGBA**: `rgba(52, 199, 89, 0.05)` (라인 101)
   ```
   background: rgba(52, 199, 89, 0.05);
   ```

---

### 📁 `frontend/src/styles/01-settings/_shadows.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 5)
   ```
   --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
   ```

2. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 11)
   ```
   --shadow-glass: 0 8px 32px rgba(31, 38, 135, 0.37);
   ```

3. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 12)
   ```
   --shadow-glass-strong: 0 12px 40px rgba(31, 38, 135, 0.5);
   ```

---

### 📁 `frontend/src/components/ui/Button/Button.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 169)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 271)
   ```
   background-color: rgba(255, 255, 255, 0.8);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 380)
   ```
   background-color: rgba(0, 123, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/NavigationMenuWidget.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#333` (라인 37)
   ```
   color: #333;
   ```

2. **HEX_6**: `#e7f3ff` (라인 51)
   ```
   background-color: #e7f3ff;
   ```

3. **HEX_6**: `#e5e5e5` (라인 93)
   ```
   border-left: 2px solid #e5e5e5;
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/erp/ErpWidget.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#333` (라인 103)
   ```
   color: var(--mg-color-text-primary, #333);
   ```

2. **HEX_3**: `#666` (라인 108)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

3. **HEX_6**: `#e3f2fd` (라인 94)
   ```
   background: var(--mg-color-primary-light, #e3f2fd);
   ```

---

### 📁 `frontend/src/components/common/StatsCardGrid.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(0, 123, 255, 0.02)` (라인 146)
   ```
   rgba(0, 123, 255, 0.02) 0%,
   ```

2. **RGBA**: `rgba(40, 167, 69, 0.02)` (라인 147)
   ```
   rgba(40, 167, 69, 0.02) 50%,
   ```

3. **RGBA**: `rgba(255, 193, 7, 0.02)` (라인 148)
   ```
   rgba(255, 193, 7, 0.02) 100%);
   ```

---

### 📁 `frontend/src/components/common/StatsCard.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 96)
   ```
   background: rgba(40, 167, 69, 0.1);
   ```

2. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 101)
   ```
   background: rgba(220, 53, 69, 0.1);
   ```

3. **RGBA**: `rgba(220, 53, 69, 0.05)` (라인 203)
   ```
   background: rgba(220, 53, 69, 0.05);
   ```

---

### 📁 `frontend/src/components/common/SalaryPrintComponent.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_3**: `#666` (라인 169)
   ```
   color: #666;
   ```

2. **HEX_3**: `#666` (라인 191)
   ```
   color: #666;
   ```

3. **HEX_6**: `#f9f9f9` (라인 186)
   ```
   background: #f9f9f9;
   ```

---

### 📁 `frontend/src/components/common/MGPagination.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 40)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

2. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 205)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

3. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 272)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/admin/CommonCodeManagementB0KlA.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#dc2626` (라인 290)
   ```
   border: 1px solid var(--mg-error-500, #dc2626);
   ```

2. **HEX_6**: `#dc2626` (라인 291)
   ```
   color: var(--mg-error-500, #dc2626);
   ```

3. **HEX_6**: `#fef2f2` (라인 295)
   ```
   background: var(--mg-error-50, #fef2f2);
   ```

---

### 📁 `frontend/src/components/admin/psych-assessment/molecules/PsychReportMarkdownBlock.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#F5F3EF` (라인 10)
   ```
   background: var(--mg-color-surface-main, var(--ad-b0kla-card-bg, #F5F3EF));
   ```

2. **HEX_6**: `#D4CFC8` (라인 11)
   ```
   border: 1px solid var(--mg-color-border-main, var(--ad-b0kla-border, #D4CFC8));
   ```

3. **HEX_6**: `#2C2C2C` (라인 23)
   ```
   color: var(--mg-color-text-main, var(--ad-b0kla-title-color, #2C2C2C));
   ```

---

### 📁 `frontend/src/components/admin/mapping-management/MappingManagementPage.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#4b745c` (라인 22)
   ```
   background: var(--ad-b0kla-green, #4b745c);
   ```

2. **HEX_6**: `#3d5f4c` (라인 27)
   ```
   background: #3d5f4c;
   ```

3. **HEX_6**: `#4b745c` (라인 33)
   ```
   background: var(--ad-b0kla-green, #4b745c);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/CoreFlowPipeline.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#64748b` (라인 26)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

2. **HEX_6**: `#cbd5e1` (라인 41)
   ```
   border-top: 2px dashed var(--mg-border-default, #cbd5e1);
   ```

3. **HEX_6**: `#059669` (라인 47)
   ```
   outline: 2px solid var(--ad-b0kla-green, var(--mg-focus-ring-color, #059669));
   ```

---

### 📁 `frontend/src/components/prediction/TreatmentOutcomeChart.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#84cc16` (라인 14)
   ```
   'GOOD': '#84cc16',
   ```

2. **HEX_6**: `#dc2626` (라인 16)
   ```
   'POOR': '#dc2626'
   ```

3. **HEX_6**: `#6b7280` (라인 18)
   ```
   return colors[outcome] || '#6b7280';
   ```

---

### 📁 `frontend/src/components/prediction/SimilarCasesPanel.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#84cc16` (라인 14)
   ```
   'GOOD': '#84cc16',
   ```

2. **HEX_6**: `#dc2626` (라인 16)
   ```
   'POOR': '#dc2626'
   ```

3. **HEX_6**: `#6b7280` (라인 18)
   ```
   return colors[outcome] || '#6b7280';
   ```

---

### 📁 `frontend/src/components/emotion/EmotionDashboard.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#dc2626` (라인 80)
   ```
   'CRITICAL': '#dc2626',
   ```

2. **HEX_6**: `#ea580c` (라인 81)
   ```
   'HIGH': '#ea580c',
   ```

3. **HEX_6**: `#6b7280` (라인 85)
   ```
   return colors[riskLevel] || '#6b7280';
   ```

---

### 📁 `frontend/src/components/common/ScheduleList.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#6b7280` (라인 78)
   ```
   { value: 'ALL', label: '전체', icon: '📋', color: '#6b7280', description: '모든 일정' },
   ```

2. **HEX_6**: `#059669` (라인 84)
   ```
   { value: 'COMPLETED', label: '완료된 일정', icon: '✅', color: '#059669', description: '완료된 일정' }
   ```

3. **HEX_6**: `#06b6d4` (라인 112)
   ```
   { value: 'STATUS_DESC', label: '상태 내림차순', icon: '🔄', color: '#06b6d4', description: '상태 내림차순 정렬' }
   ```

---

### 📁 `frontend/src/components/clinical/AudioRecorder.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#4a90e2` (라인 263)
   ```
   gradient.addColorStop(0, '#4a90e2');
   ```

2. **HEX_6**: `#2563eb` (라인 264)
   ```
   gradient.addColorStop(1, '#2563eb');
   ```

3. **RGB**: `rgb(240, 240, 240)` (라인 252)
   ```
   canvasCtx.fillStyle = 'rgb(240, 240, 240)';
   ```

---

### 📁 `frontend/src/styles/components/common.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 277)
   ```
   background-color: rgba(255, 255, 255, 0.9);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 596)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

---

### 📁 `frontend/src/styles/common/components.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 491)
   ```
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
   ```

2. **RGBA**: `rgba(124, 58, 237, 0.1)` (라인 625)
   ```
   box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
   ```

---

### 📁 `frontend/src/styles/06-components/_loading.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#FAF9F7` (라인 31)
   ```
   background: var(--color-bg-primary, var(--mg-layout-main-bg-start, #FAF9F7));
   ```

2. **HEX_6**: `#FAF9F7` (라인 40)
   ```
   background: var(--color-bg-primary, var(--mg-layout-main-bg-start, #FAF9F7));
   ```

---

### 📁 `frontend/src/components/schedule/TimeSlotGrid.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(16, 185, 129, 0.25)` (라인 45)
   ```
   box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
   ```

2. **RGBA**: `rgba(59, 130, 246, 0.15)` (라인 66)
   ```
   box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleB0KlA.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#4a6354` (라인 1014)
   ```
   background-color: var(--mg-color-primary-light, #4a6354);
   ```

2. **HEX_6**: `#4a6354` (라인 1015)
   ```
   border-color: var(--mg-color-primary-light, #4a6354);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/templates/DesktopLayout.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#FAF9F7` (라인 15)
   ```
   var(--mg-layout-main-bg-start, #FAF9F7) 0%,
   ```

2. **HEX_6**: `#F2EDE8` (라인 16)
   ```
   var(--mg-layout-main-bg-end, #F2EDE8) 100%
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/Widget.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#f8fafc` (라인 92)
   ```
   background: linear-gradient(135deg, var(--mg-white) 0%, #f8fafc 100%);
   ```

2. **HEX_6**: `#f8fafc` (라인 490)
   ```
   background: linear-gradient(135deg, var(--mg-white) 0%, #f8fafc 100%);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/SystemNotificationWidget.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(239, 68, 68, 0)` (라인 299)
   ```
   box-shadow: 0 0 0 rgba(239, 68, 68, 0);
   ```

2. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 302)
   ```
   box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantMessages.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 82)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

2. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 98)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/common/MGTable.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 124)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

2. **RGBA**: `rgba(26, 32, 44, 0.9)` (라인 208)
   ```
   background: rgba(26, 32, 44, 0.9);
   ```

---

### 📁 `frontend/src/components/common/ActionButton.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 50)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 63)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

---

### 📁 `frontend/src/components/admin/PsychAssessmentManagementPage.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#4b745c` (라인 23)
   ```
   background: var(--ad-b0kla-green, #4b745c);
   ```

2. **HEX_6**: `#3d5f4c` (라인 28)
   ```
   background: #3d5f4c;
   ```

---

### 📁 `frontend/src/components/admin/PermissionManagement.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 6)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

2. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 183)
   ```
   box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/CacheMonitoringDashboard.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#ccc` (라인 89)
   ```
   background: #ccc;
   ```

2. **HEX_6**: `#D32F2F` (라인 104)
   ```
   background: #D32F2F;
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 128)
   ```
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 130)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/package-pricing/PackagePricingPage.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#4b745c` (라인 32)
   ```
   background: var(--ad-b0kla-green, #4b745c);
   ```

2. **HEX_6**: `#3d5f4c` (라인 37)
   ```
   background: #3d5f4c;
   ```

---

### 📁 `frontend/src/components/academy/shared/EmptyState.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#666` (라인 21)
   ```
   color: var(--color-text-secondary, #666);
   ```

2. **HEX_6**: `#0056b3` (라인 39)
   ```
   background: var(--color-primary-dark, #0056b3);
   ```

---

### 📁 `frontend/src/utils/safeDisplay.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#130` (라인 2)
   ```
   * JSX에 넣기 안전한 표시 문자열로 정규화 (React #130: 객체를 자식으로 렌더 방지)
   ```

2. **HEX_3**: `#130` (라인 52)
   ```
   * (React #130: completedCount·completionRate 등이 객체인 경우 방지)
   ```

---

### 📁 `frontend/src/components/layout/SimpleHeader.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#666` (라인 171)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
   ```

2. **HEX_3**: `#666` (라인 172)
   ```
   <div style={{ fontSize: '10px', color: '#666', marginRight: '10px' }}>
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/DesktopLnb.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#2C2C2C` (라인 2)
   ```
   * DesktopLnb - LNB 260px: 다크(#2C2C2C), 메뉴 리스트 (메인/서브 트리 지원)
   ```

2. **HEX_6**: `#2C2C2C` (라인 3)
   ```
   * RESPONSIVE_LAYOUT_SPEC: 사이드바 260px, 배경 #2C2C2C
   ```

---

### 📁 `frontend/src/components/common/SafeText.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#130` (라인 2)
   ```
   * 예: <SafeText className="mg-muted">{row.label}</SafeText> — 객체/null 시 '—'로 표시 (React #130 방지)
   ```

2. **HEX_3**: `#130` (라인 9)
   ```
   * JSX에 안전한 문자열만 렌더 (React #130: 객체 자식 방지)
   ```

---

### 📁 `frontend/src/components/common/MGChart.js` (JS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 55)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.8) -> var(--mg-custom-color)
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 56)
   ```
   backgroundColor: 'rgba(0, 0, 0, 0.8)',
   ```

---

### 📁 `frontend/src/components/common/Chart.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#2c3e50` (라인 106)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
   ```

2. **HEX_6**: `#2c3e50` (라인 107)
   ```
   color: '#2c3e50'
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_loading.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 31)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_iphone17-page-header.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#ccc` (라인 179)
   ```
   border: 1px solid #ccc;
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_iphone17-modals.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 13)
   ```
   background: rgba(0, 0, 0, 0.4);
   ```

---

### 📁 `frontend/src/components/settings/UserSettings.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 153)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleCalendar.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#212529` (라인 209)
   ```
   color: #212529;
   ```

---

### 📁 `frontend/src/components/dashboard-v2/atoms/ProfileAvatar.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#3D5246` (라인 12)
   ```
   background-color: var(--mg-color-primary-main, #3D5246);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/atoms/NotificationBadge.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#EF4444` (라인 17)
   ```
   background-color: var(--mg-color-error-500, #EF4444);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/ScheduleWidget.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 38)
   ```
   rgba(255, 255, 255, 0.3),
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/common/ErpCardWidget.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#666` (라인 16)
   ```
   color: var(--mg-color-text-secondary, #666);
   ```

---

### 📁 `frontend/src/components/common/StatCard.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#e9ecef` (라인 10)
   ```
   border: var(--border-width-thin) solid #e9ecef;
   ```

---

### 📁 `frontend/src/components/common/ComingSoon.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/common/CardContainer.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 10)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

---

### 📁 `frontend/src/components/common/Badge.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#EF4444` (라인 67)
   ```
   background-color: var(--mg-badge-count-bg, var(--mg-color-error-500, #EF4444));
   ```

---

### 📁 `frontend/src/components/admin/MappingEditModal.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 33)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/admin/CommonCodeManagement.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#e9ecef` (라인 54)
   ```
   border: 2px solid #e9ecef;
   ```

---

### 📁 `frontend/src/components/admin/psych-assessment/organisms/PsychUploadSection.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#dc2626` (라인 443)
   ```
   color: var(--mg-error-500, var(--cs-error-500, #dc2626));
   ```

---

### 📁 `frontend/src/components/admin/psych-assessment/molecules/PsychReportMeta.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#5C6B61` (라인 11)
   ```
   color: var(--mg-color-text-secondary, var(--ad-b0kla-text-secondary, #5C6B61));
   ```

---

### 📁 `frontend/src/components/admin/ClientComprehensiveManagement/ClientMappingTab.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#3D5246` (라인 34)
   ```
   background: var(--ad-b0kla-green, #3D5246);
   ```

---

### 📁 `frontend/src/components/admin/ClientComprehensiveManagement/ClientConsultationTab.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#3D5246` (라인 35)
   ```
   background: var(--ad-b0kla-green, #3D5246);
   ```

---

### 📁 `frontend/src/components/academy/shared/LoadingState.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#666` (라인 16)
   ```
   color: var(--color-text-secondary, #666);
   ```

---

### 📁 `frontend/src/components/academy/shared/FormField.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#333` (라인 13)
   ```
   color: var(--color-text-primary, #333);
   ```

---

### 📁 `frontend/src/components/academy/shared/ErrorState.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#0056b3` (라인 38)
   ```
   background: var(--color-primary-dark, #0056b3);
   ```

---

### 📁 `frontend/src/components/academy/shared/DataTable.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 16)
   ```
   background-color: var(--color-hover, rgba(0, 123, 255, 0.1));
   ```

---

### 📁 `frontend/src/utils/codeHelper.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6b7280` (라인 892)
   ```
   color = '#6b7280';
   ```

---

### 📁 `frontend/src/constants/schedule.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#b8b8b8` (라인 47)
   ```
   [STATUS.COMPLETED]: '#b8b8b8',    // 연한 회색 (완료된 상태)
   ```

---

### 📁 `frontend/src/components/dashboard-v2/content/ContentKpiRow.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 15)
   ```
   /** KPI 텍스트/숫자·객체 혼재 시 React #130 방지 */
   ```

---

### 📁 `frontend/src/components/common/SafeNumeric.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 11)
   ```
   * 숫자·문자 혼합 값을 안전한 표시 문자열로 렌더 (React #130 방지)
   ```

---

### 📁 `frontend/src/components/admin/ApiPerformanceMonitoring.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#ef4444` (라인 244)
   ```
   <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--mg-color-error-main, #ef4444)' }}>{stats.averageDuration}ms</div>
   ```

---

### 📁 `frontend/src/components/admin/organisms/AdminMessageListBlock.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#5C6B61` (라인 23)
   ```
   GENERAL: { label: '일반', color: 'var(--mg-color-info, #5C6B61)' },
   ```

---

### 📁 `frontend/src/components/admin/mapping-management/organisms/MappingCalendarView.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6d9dc5` (라인 23)
   ```
   const statusColor = getStatusColor ? getStatusColor(mapping.status) : 'var(--ad-b0kla-blue, #6d9dc5)';
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeFilters.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#6b7280` (라인 62)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
   ```

---

### 📁 `frontend/src/components/erp/common/atoms/ErpSafeText.jsx` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 2)
   ```
   * ERP 표시 경계 Atom — API/스칼라 외 값을 JSX 자식으로 두기 전에 정규화 (React #130 방지)
   ```

---

