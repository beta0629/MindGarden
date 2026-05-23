# 🎨 하드코딩된 색상값 상세 리포트

> **생성일**: 2026-05-23T02:09:19.744Z  
> **총 검사 파일**: 1522개  
> **하드코딩 발견 파일**: 234개  
> **총 하드코딩 색상**: 3170개

---

## 📊 요약 통계

| 구분 | 수량 | 비율 |
|------|------|------|
| 총 파일 | 1522개 | 100% |
| 영향받는 파일 | 234개 | 15.4% |
| 중요 파일 | 12개 | 0.8% |

### 색상 유형별 분포
- **HEX_3**: 110개
- **HEX_6**: 1712개
- **RGBA**: 1343개
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
- `frontend/src/themes/defaultTheme.js`
- `frontend/src/hooks/useTheme.js`
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

**하드코딩 색상**: 10개 - **즉시 수정 필요**

1. **HEX_6**: `#f2f2f7` (라인 89)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f2f2f7 -> var(--mg-custom-f2f2f7)
   ```

2. **HEX_6**: `#f2f2f7` (라인 90)
   ```
   root.style.setProperty('--theme-bg-secondary', '#f2f2f7');
   ```

3. **HEX_6**: `#86868b` (라인 94)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #86868b -> var(--mg-custom-86868b)
   ```

4. **HEX_6**: `#86868b` (라인 95)
   ```
   root.style.setProperty('--theme-text-secondary', '#86868b');
   ```

5. **HEX_6**: `#c7c7cc` (라인 96)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #c7c7cc -> var(--mg-custom-c7c7cc)
   ```

6. **HEX_6**: `#c7c7cc` (라인 97)
   ```
   root.style.setProperty('--theme-text-tertiary', '#c7c7cc');
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 83)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 255, 255, 0.1) -> var(--mg-custom-color)
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 84)
   ```
   root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.1)');
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 98)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.05) -> var(--mg-custom-color)
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 99)
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

### 📁 `frontend/src/styles/unified-design-tokens.css` (CSS)

**하드코딩 색상**: 982개

1. **HEX_3**: `#666` (라인 12853)
   ```
   color: #666;
   ```

2. **HEX_3**: `#666` (라인 17646)
   ```
   color: #666;
   ```

3. **HEX_3**: `#ddd` (라인 18398)
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

9. **HEX_6**: `#3b82f6` (라인 25)
   ```
   --cs-primary-500: #3b82f6;
   ```

10. **HEX_6**: `#2563eb` (라인 26)
   ```
   --cs-primary-600: #2563eb;
   ```

11. **HEX_6**: `#1d4ed8` (라인 27)
   ```
   --cs-primary-700: #1d4ed8;
   ```

12. **HEX_6**: `#1e40af` (라인 28)
   ```
   --cs-primary-800: #1e40af;
   ```

13. **HEX_6**: `#1e3a8a` (라인 29)
   ```
   --cs-primary-900: #1e3a8a;
   ```

14. **HEX_6**: `#f9fafb` (라인 31)
   ```
   --cs-secondary-50: #f9fafb;
   ```

15. **HEX_6**: `#f3f4f6` (라인 32)
   ```
   --cs-secondary-100: #f3f4f6;
   ```

16. **HEX_6**: `#e5e7eb` (라인 33)
   ```
   --cs-secondary-200: #e5e7eb;
   ```

17. **HEX_6**: `#d1d5db` (라인 34)
   ```
   --cs-secondary-300: #d1d5db;
   ```

18. **HEX_6**: `#9ca3af` (라인 35)
   ```
   --cs-secondary-400: #9ca3af;
   ```

19. **HEX_6**: `#6b7280` (라인 36)
   ```
   --cs-secondary-500: #6b7280;
   ```

20. **HEX_6**: `#4b5563` (라인 37)
   ```
   --cs-secondary-600: #4b5563;
   ```

21. **HEX_6**: `#374151` (라인 38)
   ```
   --cs-secondary-700: #374151;
   ```

22. **HEX_6**: `#1f2937` (라인 39)
   ```
   --cs-secondary-800: #1f2937;
   ```

23. **HEX_6**: `#111827` (라인 40)
   ```
   --cs-secondary-900: #111827;
   ```

24. **HEX_6**: `#ecfdf5` (라인 43)
   ```
   --cs-success-50: #ecfdf5;
   ```

25. **HEX_6**: `#d1fae5` (라인 44)
   ```
   --cs-success-100: #d1fae5;
   ```

26. **HEX_6**: `#a7f3d0` (라인 45)
   ```
   --cs-success-200: #a7f3d0;
   ```

27. **HEX_6**: `#6ee7b7` (라인 46)
   ```
   --cs-success-300: #6ee7b7;
   ```

28. **HEX_6**: `#34d399` (라인 47)
   ```
   --cs-success-400: #34d399;
   ```

29. **HEX_6**: `#10b981` (라인 49)
   ```
   --cs-success-500: #10b981;
   ```

30. **HEX_6**: `#059669` (라인 50)
   ```
   --cs-success-600: #059669;
   ```

31. **HEX_6**: `#047857` (라인 51)
   ```
   --cs-success-700: #047857;
   ```

32. **HEX_6**: `#065f46` (라인 52)
   ```
   --cs-success-800: #065f46;
   ```

33. **HEX_6**: `#064e3b` (라인 53)
   ```
   --cs-success-900: #064e3b;
   ```

34. **HEX_6**: `#fef2f2` (라인 56)
   ```
   --cs-error-50: #fef2f2;
   ```

35. **HEX_6**: `#fee2e2` (라인 57)
   ```
   --cs-error-100: #fee2e2;
   ```

36. **HEX_6**: `#fecaca` (라인 58)
   ```
   --cs-error-200: #fecaca;
   ```

37. **HEX_6**: `#fca5a5` (라인 59)
   ```
   --cs-error-300: #fca5a5;
   ```

38. **HEX_6**: `#f87171` (라인 60)
   ```
   --cs-error-400: #f87171;
   ```

39. **HEX_6**: `#ef4444` (라인 61)
   ```
   --cs-error-500: #ef4444;
   ```

40. **HEX_6**: `#dc2626` (라인 62)
   ```
   --cs-error-600: #dc2626;
   ```

41. **HEX_6**: `#b91c1c` (라인 63)
   ```
   --cs-error-700: #b91c1c;
   ```

42. **HEX_6**: `#991b1b` (라인 64)
   ```
   --cs-error-800: #991b1b;
   ```

43. **HEX_6**: `#7f1d1d` (라인 65)
   ```
   --cs-error-900: #7f1d1d;
   ```

44. **HEX_6**: `#fffbeb` (라인 68)
   ```
   --cs-warning-50: #fffbeb;
   ```

45. **HEX_6**: `#fef3c7` (라인 69)
   ```
   --cs-warning-100: #fef3c7;
   ```

46. **HEX_6**: `#fde68a` (라인 70)
   ```
   --cs-warning-200: #fde68a;
   ```

47. **HEX_6**: `#fcd34d` (라인 71)
   ```
   --cs-warning-300: #fcd34d;
   ```

48. **HEX_6**: `#fbbf24` (라인 72)
   ```
   --cs-warning-400: #fbbf24;
   ```

49. **HEX_6**: `#f59e0b` (라인 74)
   ```
   --cs-warning-500: #f59e0b;
   ```

50. **HEX_6**: `#d97706` (라인 75)
   ```
   --cs-warning-600: #d97706;
   ```

51. **HEX_6**: `#b45309` (라인 76)
   ```
   --cs-warning-700: #b45309;
   ```

52. **HEX_6**: `#92400e` (라인 77)
   ```
   --cs-warning-800: #92400e;
   ```

53. **HEX_6**: `#78350f` (라인 78)
   ```
   --cs-warning-900: #78350f;
   ```

54. **HEX_6**: `#fdf2f8` (라인 81)
   ```
   --cs-pink-50: #fdf2f8;
   ```

55. **HEX_6**: `#fce7f3` (라인 82)
   ```
   --cs-pink-100: #fce7f3;
   ```

56. **HEX_6**: `#fbcfe8` (라인 83)
   ```
   --cs-pink-200: #fbcfe8;
   ```

57. **HEX_6**: `#f9a8d4` (라인 84)
   ```
   --cs-pink-300: #f9a8d4;
   ```

58. **HEX_6**: `#f472b6` (라인 85)
   ```
   --cs-pink-400: #f472b6;
   ```

59. **HEX_6**: `#ff2d92` (라인 86)
   ```
   --cs-pink-500: #ff2d92;
   ```

60. **HEX_6**: `#ec4899` (라인 87)
   ```
   --cs-pink-600: #ec4899;
   ```

61. **HEX_6**: `#be185d` (라인 88)
   ```
   --cs-pink-700: #be185d;
   ```

62. **HEX_6**: `#9d174d` (라인 89)
   ```
   --cs-pink-800: #9d174d;
   ```

63. **HEX_6**: `#831843` (라인 90)
   ```
   --cs-pink-900: #831843;
   ```

64. **HEX_6**: `#fffbeb` (라인 93)
   ```
   --cs-yellow-50: #fffbeb;
   ```

65. **HEX_6**: `#fef3c7` (라인 94)
   ```
   --cs-yellow-100: #fef3c7;
   ```

66. **HEX_6**: `#fde68a` (라인 95)
   ```
   --cs-yellow-200: #fde68a;
   ```

67. **HEX_6**: `#fcd34d` (라인 96)
   ```
   --cs-yellow-300: #fcd34d;
   ```

68. **HEX_6**: `#ffcc00` (라인 97)
   ```
   --cs-yellow-400: #ffcc00;
   ```

69. **HEX_6**: `#d97706` (라인 99)
   ```
   --cs-yellow-600: #d97706;
   ```

70. **HEX_6**: `#b45309` (라인 100)
   ```
   --cs-yellow-700: #b45309;
   ```

71. **HEX_6**: `#92400e` (라인 101)
   ```
   --cs-yellow-800: #92400e;
   ```

72. **HEX_6**: `#78350f` (라인 102)
   ```
   --cs-yellow-900: #78350f;
   ```

73. **HEX_6**: `#fff7ed` (라인 105)
   ```
   --cs-orange-50: #fff7ed;
   ```

74. **HEX_6**: `#ffedd5` (라인 106)
   ```
   --cs-orange-100: #ffedd5;
   ```

75. **HEX_6**: `#fed7aa` (라인 107)
   ```
   --cs-orange-200: #fed7aa;
   ```

76. **HEX_6**: `#fdba74` (라인 108)
   ```
   --cs-orange-300: #fdba74;
   ```

77. **HEX_6**: `#fb923c` (라인 109)
   ```
   --cs-orange-400: #fb923c;
   ```

78. **HEX_6**: `#ff6b35` (라인 110)
   ```
   --cs-orange-500: #ff6b35;
   ```

79. **HEX_6**: `#e55a2b` (라인 111)
   ```
   --cs-orange-600: #e55a2b;
   ```

80. **HEX_6**: `#c2410c` (라인 112)
   ```
   --cs-orange-700: #c2410c;
   ```

81. **HEX_6**: `#9a3412` (라인 113)
   ```
   --cs-orange-800: #9a3412;
   ```

82. **HEX_6**: `#7c2d12` (라인 114)
   ```
   --cs-orange-900: #7c2d12;
   ```

83. **HEX_6**: `#fdf8f6` (라인 117)
   ```
   --cs-brown-50: #fdf8f6;
   ```

84. **HEX_6**: `#f2e8e5` (라인 118)
   ```
   --cs-brown-100: #f2e8e5;
   ```

85. **HEX_6**: `#eaddd7` (라인 119)
   ```
   --cs-brown-200: #eaddd7;
   ```

86. **HEX_6**: `#e0cfc4` (라인 120)
   ```
   --cs-brown-300: #e0cfc4;
   ```

87. **HEX_6**: `#d2bab0` (라인 121)
   ```
   --cs-brown-400: #d2bab0;
   ```

88. **HEX_6**: `#bfa094` (라인 122)
   ```
   --cs-brown-500: #bfa094;
   ```

89. **HEX_6**: `#a18072` (라인 123)
   ```
   --cs-brown-600: #a18072;
   ```

90. **HEX_6**: `#8b6f47` (라인 124)
   ```
   --cs-brown-700: #8b6f47;
   ```

91. **HEX_6**: `#6f4f28` (라인 125)
   ```
   --cs-brown-800: #6f4f28;
   ```

92. **HEX_6**: `#2d1810` (라인 126)
   ```
   --cs-brown-900: #2d1810;
   ```

93. **HEX_6**: `#f0fdfa` (라인 129)
   ```
   --cs-teal-50: #f0fdfa;
   ```

94. **HEX_6**: `#ccfbf1` (라인 130)
   ```
   --cs-teal-100: #ccfbf1;
   ```

95. **HEX_6**: `#99f6e4` (라인 131)
   ```
   --cs-teal-200: #99f6e4;
   ```

96. **HEX_6**: `#5eead4` (라인 132)
   ```
   --cs-teal-300: #5eead4;
   ```

97. **HEX_6**: `#38f9d7` (라인 133)
   ```
   --cs-teal-400: #38f9d7;
   ```

98. **HEX_6**: `#14b8a6` (라인 134)
   ```
   --cs-teal-500: #14b8a6;
   ```

99. **HEX_6**: `#0d9488` (라인 135)
   ```
   --cs-teal-600: #0d9488;
   ```

100. **HEX_6**: `#0f766e` (라인 136)
   ```
   --cs-teal-700: #0f766e;
   ```

101. **HEX_6**: `#115e59` (라인 137)
   ```
   --cs-teal-800: #115e59;
   ```

102. **HEX_6**: `#134e4a` (라인 138)
   ```
   --cs-teal-900: #134e4a;
   ```

103. **HEX_6**: `#5a4fcf` (라인 141)
   ```
   --cs-brand-primary-hover: #5a4fcf;
   ```

104. **HEX_6**: `#fd79a8` (라인 142)
   ```
   --cs-brand-accent: #fd79a8;
   ```

105. **HEX_6**: `#dee2e6` (라인 148)
   ```
   --cs-border-secondary: #dee2e6;
   ```

106. **HEX_6**: `#f0f0f0` (라인 149)
   ```
   --cs-border-light: #f0f0f0;
   ```

107. **HEX_6**: `#2d3748` (라인 152)
   ```
   --cs-bg-dark: #2d3748;
   ```

108. **HEX_6**: `#FFFEF7` (라인 154)
   ```
   --cs-cream: #FFFEF7;
   ```

109. **HEX_6**: `#E3F2FD` (라인 157)
   ```
   --cs-blue-50: #E3F2FD;
   ```

110. **HEX_6**: `#dbeafe` (라인 158)
   ```
   --cs-blue-100: #dbeafe;
   ```

111. **HEX_6**: `#bfdbfe` (라인 159)
   ```
   --cs-blue-200: #bfdbfe;
   ```

112. **HEX_6**: `#93c5fd` (라인 160)
   ```
   --cs-blue-300: #93c5fd;
   ```

113. **HEX_6**: `#60a5fa` (라인 161)
   ```
   --cs-blue-400: #60a5fa;
   ```

114. **HEX_6**: `#2563eb` (라인 163)
   ```
   --cs-blue-600: #2563eb;
   ```

115. **HEX_6**: `#0056CC` (라인 164)
   ```
   --cs-blue-700: #0056CC;
   ```

116. **HEX_6**: `#004499` (라인 165)
   ```
   --cs-blue-800: #004499;
   ```

117. **HEX_6**: `#003366` (라인 166)
   ```
   --cs-blue-900: #003366;
   ```

118. **HEX_6**: `#f8fafc` (라인 169)
   ```
   --cs-slate-50: #f8fafc;
   ```

119. **HEX_6**: `#f1f5f9` (라인 170)
   ```
   --cs-slate-100: #f1f5f9;
   ```

120. **HEX_6**: `#e2e8f0` (라인 171)
   ```
   --cs-slate-200: #e2e8f0;
   ```

121. **HEX_6**: `#cbd5e1` (라인 172)
   ```
   --cs-slate-300: #cbd5e1;
   ```

122. **HEX_6**: `#94a3b8` (라인 173)
   ```
   --cs-slate-400: #94a3b8;
   ```

123. **HEX_6**: `#64748b` (라인 174)
   ```
   --cs-slate-500: #64748b;
   ```

124. **HEX_6**: `#475569` (라인 175)
   ```
   --cs-slate-600: #475569;
   ```

125. **HEX_6**: `#334155` (라인 176)
   ```
   --cs-slate-700: #334155;
   ```

126. **HEX_6**: `#1e293b` (라인 177)
   ```
   --cs-slate-800: #1e293b;
   ```

127. **HEX_6**: `#0f172a` (라인 178)
   ```
   --cs-slate-900: #0f172a;
   ```

128. **HEX_6**: `#faf5ff` (라인 181)
   ```
   --cs-purple-50: #faf5ff;
   ```

129. **HEX_6**: `#f3e8ff` (라인 182)
   ```
   --cs-purple-100: #f3e8ff;
   ```

130. **HEX_6**: `#e9d5ff` (라인 183)
   ```
   --cs-purple-200: #e9d5ff;
   ```

131. **HEX_6**: `#d8b4fe` (라인 184)
   ```
   --cs-purple-300: #d8b4fe;
   ```

132. **HEX_6**: `#c084fc` (라인 185)
   ```
   --cs-purple-400: #c084fc;
   ```

133. **HEX_6**: `#a855f7` (라인 186)
   ```
   --cs-purple-500: #a855f7;
   ```

134. **HEX_6**: `#9333ea` (라인 187)
   ```
   --cs-purple-600: #9333ea;
   ```

135. **HEX_6**: `#7c3aed` (라인 188)
   ```
   --cs-purple-700: #7c3aed;
   ```

136. **HEX_6**: `#6b21a8` (라인 189)
   ```
   --cs-purple-800: #6b21a8;
   ```

137. **HEX_6**: `#581c87` (라인 190)
   ```
   --cs-purple-900: #581c87;
   ```

138. **HEX_6**: `#0056b3` (라인 451)
   ```
   --color-primary-dark: #0056b3;
   ```

139. **HEX_6**: `#66b3ff` (라인 452)
   ```
   --color-primary-light: #66b3ff;
   ```

140. **HEX_6**: `#1d1d1f` (라인 457)
   ```
   --ios-text-primary: #1d1d1f;
   ```

141. **HEX_6**: `#1d1d1f` (라인 460)
   ```
   --ipad-text-primary: #1d1d1f;
   ```

142. **HEX_6**: `#764ba2` (라인 466)
   ```
   --mg-primary_dark: #764ba2;
   ```

143. **HEX_6**: `#2c3e50` (라인 467)
   ```
   --mg-text_primary: #2c3e50;
   ```

144. **HEX_6**: `#f2f2f7` (라인 472)
   ```
   --bg-secondary: #f2f2f7;
   ```

145. **HEX_6**: `#FAFAFA` (라인 474)
   ```
   --color-bg-secondary: #FAFAFA;
   ```

146. **HEX_6**: `#495057` (라인 476)
   ```
   --color-secondary-dark: #495057;
   ```

147. **HEX_6**: `#9ca3af` (라인 477)
   ```
   --color-secondary-light: #9ca3af;
   ```

148. **HEX_6**: `#6b7280` (라인 479)
   ```
   --color-text-secondary: #6b7280;
   ```

149. **HEX_6**: `#f2f2f7` (라인 480)
   ```
   --ios-bg-secondary: #f2f2f7;
   ```

150. **HEX_6**: `#86868b` (라인 481)
   ```
   --ios-text-secondary: #86868b;
   ```

151. **HEX_6**: `#f2f2f7` (라인 482)
   ```
   --ipad-bg-secondary: #f2f2f7;
   ```

152. **HEX_6**: `#86868b` (라인 484)
   ```
   --ipad-text-secondary: #86868b;
   ```

153. **HEX_6**: `#dee2e6` (라인 486)
   ```
   --mg-border_secondary: #dee2e6;
   ```

154. **HEX_6**: `#e9ecef` (라인 489)
   ```
   --mg-secondary_light: #e9ecef;
   ```

155. **HEX_6**: `#00a085` (라인 500)
   ```
   --mg-success_dark: #00a085;
   ```

156. **HEX_6**: `#d4edda` (라인 501)
   ```
   --mg-success_light: #d4edda;
   ```

157. **HEX_6**: `#d1fae5` (라인 505)
   ```
   --status-success-bg: #d1fae5;
   ```

158. **HEX_6**: `#c3e6cb` (라인 506)
   ```
   --status-success-border: #c3e6cb;
   ```

159. **HEX_6**: `#1e7e34` (라인 507)
   ```
   --status-success-dark: #1e7e34;
   ```

160. **HEX_6**: `#6cbb6d` (라인 508)
   ```
   --status-success-light: #6cbb6d;
   ```

161. **HEX_6**: `#ee5a24` (라인 519)
   ```
   --mg-danger_dark: #ee5a24;
   ```

162. **HEX_6**: `#f8d7da` (라인 520)
   ```
   --mg-danger_light: #f8d7da;
   ```

163. **HEX_6**: `#f8d7da` (라인 522)
   ```
   --mg-error_light: #f8d7da;
   ```

164. **HEX_6**: `#fee2e2` (라인 524)
   ```
   --status-error-bg: #fee2e2;
   ```

165. **HEX_6**: `#fecaca` (라인 525)
   ```
   --status-error-border: #fecaca;
   ```

166. **HEX_6**: `#c82333` (라인 526)
   ```
   --status-error-dark: #c82333;
   ```

167. **HEX_6**: `#f56565` (라인 527)
   ```
   --status-error-light: #f56565;
   ```

168. **HEX_6**: `#e65100` (라인 531)
   ```
   --color-orange: #e65100;
   ```

169. **HEX_6**: `#fff3e0` (라인 533)
   ```
   --color-orange-light: #fff3e0;
   ```

170. **HEX_6**: `#856404` (라인 535)
   ```
   --color-warning-dark: #856404;
   ```

171. **HEX_6**: `#ffcc00` (라인 538)
   ```
   --ios-yellow: #ffcc00;
   ```

172. **HEX_6**: `#ffcc00` (라인 540)
   ```
   --ipad-yellow: #ffcc00;
   ```

173. **HEX_6**: `#f5576c` (라인 543)
   ```
   --mg-warning_dark: #f5576c;
   ```

174. **HEX_6**: `#fff3cd` (라인 544)
   ```
   --mg-warning_light: #fff3cd;
   ```

175. **HEX_6**: `#fef3c7` (라인 546)
   ```
   --status-warning-bg: #fef3c7;
   ```

176. **HEX_6**: `#e0a800` (라인 547)
   ```
   --status-warning-dark: #e0a800;
   ```

177. **HEX_6**: `#ffeaa7` (라인 548)
   ```
   --status-warning-light: #ffeaa7;
   ```

178. **HEX_6**: `#0984e3` (라인 558)
   ```
   --mg-info_dark: #0984e3;
   ```

179. **HEX_6**: `#d1ecf1` (라인 559)
   ```
   --mg-info_light: #d1ecf1;
   ```

180. **HEX_6**: `#dbeafe` (라인 561)
   ```
   --status-info-bg: #dbeafe;
   ```

181. **HEX_6**: `#138496` (라인 562)
   ```
   --status-info-dark: #138496;
   ```

182. **HEX_6**: `#bbdefb` (라인 563)
   ```
   --status-info-light: #bbdefb;
   ```

183. **HEX_6**: `#9e9e9e` (라인 567)
   ```
   --color-gray: #9e9e9e;
   ```

184. **HEX_6**: `#7f8c8d` (라인 568)
   ```
   --color-gray-dark: #7f8c8d;
   ```

185. **HEX_6**: `#95a5a6` (라인 569)
   ```
   --color-gray-light: #95a5a6;
   ```

186. **HEX_6**: `#2F2F2F` (라인 570)
   ```
   --dark-gray: #2F2F2F;
   ```

187. **HEX_6**: `#D0D0E8` (라인 572)
   ```
   --gradient-gray-end: #D0D0E8;
   ```

188. **HEX_6**: `#B8B8D0` (라인 573)
   ```
   --gradient-gray-start: #B8B8D0;
   ```

189. **HEX_6**: `#8e8e93` (라인 574)
   ```
   --ios-gray: #8e8e93;
   ```

190. **HEX_6**: `#8e8e93` (라인 575)
   ```
   --ipad-gray: #8e8e93;
   ```

191. **HEX_6**: `#6B6B6B` (라인 576)
   ```
   --medium-gray: #6B6B6B;
   ```

192. **HEX_6**: `#495057` (라인 577)
   ```
   --mg-gray_dark: #495057;
   ```

193. **HEX_6**: `#c7c7cc` (라인 585)
   ```
   --ios-text-tertiary: #c7c7cc;
   ```

194. **HEX_6**: `#c7c7cc` (라인 586)
   ```
   --ipad-text-tertiary: #c7c7cc;
   ```

195. **HEX_6**: `#c7c7cc` (라인 592)
   ```
   --text-tertiary: #c7c7cc;
   ```

196. **HEX_6**: `#1d1d1f` (라인 595)
   ```
   --bg-dark: #1d1d1f;
   ```

197. **HEX_6**: `#343a40` (라인 601)
   ```
   --color-background-dark: #343a40;
   ```

198. **HEX_6**: `#2d3748` (라인 618)
   ```
   --mg-bg_dark: #2d3748;
   ```

199. **HEX_6**: `#a8a8a8` (라인 654)
   ```
   --color-border-dark: #a8a8a8;
   ```

200. **HEX_6**: `#e9ecef` (라인 657)
   ```
   --color-border-light: #e9ecef;
   ```

201. **HEX_6**: `#e9ecef` (라인 667)
   ```
   --mg-border: #e9ecef;
   ```

202. **HEX_6**: `#d1d5db` (라인 668)
   ```
   --mg-border_dark: #d1d5db;
   ```

203. **HEX_6**: `#f0f0f0` (라인 669)
   ```
   --mg-border_light: #f0f0f0;
   ```

204. **HEX_6**: `#e91e63` (라인 859)
   ```
   --color-accent: #e91e63;
   ```

205. **HEX_6**: `#795548` (라인 860)
   ```
   --color-brown: #795548;
   ```

206. **HEX_6**: `#6d3410` (라인 861)
   ```
   --color-brown-dark: #6d3410;
   ```

207. **HEX_6**: `#212529` (라인 862)
   ```
   --color-dark: #212529;
   ```

208. **HEX_6**: `#D32F2F` (라인 865)
   ```
   --color-performance-critical: #D32F2F;
   ```

209. **HEX_6**: `#8BC34A` (라인 867)
   ```
   --color-performance-good: #8BC34A;
   ```

210. **HEX_6**: `#c2185b` (라인 869)
   ```
   --color-pink: #c2185b;
   ```

211. **HEX_6**: `#fce4ec` (라인 870)
   ```
   --color-pink-light: #fce4ec;
   ```

212. **HEX_6**: `#7b1fa2` (라인 871)
   ```
   --color-purple: #7b1fa2;
   ```

213. **HEX_6**: `#f3e5f5` (라인 872)
   ```
   --color-purple-light: #f3e5f5;
   ```

214. **HEX_6**: `#9E9E9E` (라인 876)
   ```
   --color-status-inactive: #9E9E9E;
   ```

215. **HEX_6**: `#6366f1` (라인 880)
   ```
   --consultant-color-10: #6366f1;
   ```

216. **HEX_6**: `#06b6d4` (라인 885)
   ```
   --consultant-color-6: #06b6d4;
   ```

217. **HEX_6**: `#84cc16` (라인 886)
   ```
   --consultant-color-7: #84cc16;
   ```

218. **HEX_6**: `#f97316` (라인 887)
   ```
   --consultant-color-8: #f97316;
   ```

219. **HEX_6**: `#ec4899` (라인 888)
   ```
   --consultant-color-9: #ec4899;
   ```

220. **HEX_6**: `#ffd700` (라인 924)
   ```
   --grade-expert: #ffd700;
   ```

221. **HEX_6**: `#cd7f32` (라인 925)
   ```
   --grade-junior: #cd7f32;
   ```

222. **HEX_6**: `#e5e4e2` (라인 926)
   ```
   --grade-master: #e5e4e2;
   ```

223. **HEX_6**: `#c0c0c0` (라인 927)
   ```
   --grade-senior: #c0c0c0;
   ```

224. **HEX_6**: `#FFA500` (라인 929)
   ```
   --gradient-gold-end: #FFA500;
   ```

225. **HEX_6**: `#FFD700` (라인 930)
   ```
   --gradient-gold-start: #FFD700;
   ```

226. **HEX_6**: `#B4E7CE` (라인 932)
   ```
   --gradient-mint-end: #B4E7CE;
   ```

227. **HEX_6**: `#98D8C8` (라인 933)
   ```
   --gradient-mint-start: #98D8C8;
   ```

228. **HEX_6**: `#FFA5C0` (라인 935)
   ```
   --gradient-peach-end: #FFA5C0;
   ```

229. **HEX_6**: `#FF6B9D` (라인 936)
   ```
   --gradient-peach-start: #FF6B9D;
   ```

230. **HEX_6**: `#FFC0CB` (라인 938)
   ```
   --gradient-pink-end: #FFC0CB;
   ```

231. **HEX_6**: `#FFB6C1` (라인 939)
   ```
   --gradient-pink-start: #FFB6C1;
   ```

232. **HEX_6**: `#B0E0E6` (라인 941)
   ```
   --gradient-sky-end: #B0E0E6;
   ```

233. **HEX_6**: `#87CEEB` (라인 942)
   ```
   --gradient-sky-start: #87CEEB;
   ```

234. **HEX_6**: `#ff2d92` (라인 960)
   ```
   --ios-pink: #ff2d92;
   ```

235. **HEX_6**: `#ff2d92` (라인 963)
   ```
   --ipad-pink: #ff2d92;
   ```

236. **HEX_6**: `#FFFEF7` (라인 966)
   ```
   --light-cream: #FFFEF7;
   ```

237. **HEX_6**: `#2c3e50` (라인 975)
   ```
   --mg-black: #2c3e50;
   ```

238. **HEX_6**: `#fd79a8` (라인 977)
   ```
   --mg-brand_accent: #fd79a8;
   ```

239. **HEX_6**: `#00a085` (라인 980)
   ```
   --mg-client_dark: #00a085;
   ```

240. **HEX_6**: `#FEE500` (라인 981)
   ```
   --mg-color: #FEE500;
   ```

241. **HEX_6**: `#D32F2F` (라인 985)
   ```
   --mg-critical: #D32F2F;
   ```

242. **HEX_6**: `#343a40` (라인 986)
   ```
   --mg-dark: #343a40;
   ```

243. **HEX_6**: `#e74c3c` (라인 989)
   ```
   --mg-expense: #e74c3c;
   ```

244. **HEX_6**: `#c0392b` (라인 990)
   ```
   --mg-expense_dark: #c0392b;
   ```

245. **HEX_6**: `#8BC34A` (라인 995)
   ```
   --mg-good: #8BC34A;
   ```

246. **HEX_6**: `#9E9E9E` (라인 996)
   ```
   --mg-inactive: #9E9E9E;
   ```

247. **HEX_6**: `#9b59b6` (라인 1002)
   ```
   --mg-payment: #9b59b6;
   ```

248. **HEX_6**: `#8e44ad` (라인 1003)
   ```
   --mg-payment_dark: #8e44ad;
   ```

249. **HEX_6**: `#34495e` (라인 1007)
   ```
   --mg-report: #34495e;
   ```

250. **HEX_6**: `#2c3e50` (라인 1008)
   ```
   --mg-report_dark: #2c3e50;
   ```

251. **HEX_6**: `#27ae60` (라인 1009)
   ```
   --mg-revenue: #27ae60;
   ```

252. **HEX_6**: `#229954` (라인 1010)
   ```
   --mg-revenue_dark: #229954;
   ```

253. **HEX_6**: `#95a5a6` (라인 1012)
   ```
   --mg-settings: #95a5a6;
   ```

254. **HEX_6**: `#7f8c8d` (라인 1013)
   ```
   --mg-settings_dark: #7f8c8d;
   ```

255. **HEX_6**: `#fbbf24` (라인 1027)
   ```
   --payment-pending: #fbbf24;
   ```

256. **HEX_6**: `#6b7280` (라인 1028)
   ```
   --payment-refunded: #6b7280;
   ```

257. **HEX_6**: `#6b7280` (라인 1031)
   ```
   --role-client: #6b7280;
   ```

258. **HEX_6**: `#6b7280` (라인 1058)
   ```
   --status-completed: #6b7280;
   ```

259. **HEX_6**: `#f97316` (라인 1061)
   ```
   --status-no-show: #f97316;
   ```

260. **HEX_6**: `#fd7e14` (라인 1062)
   ```
   --status-pending: #fd7e14;
   ```

261. **HEX_6**: `#e55a00` (라인 1063)
   ```
   --status-pending-dark: #e55a00;
   ```

262. **HEX_6**: `#ffa94d` (라인 1064)
   ```
   --status-pending-light: #ffa94d;
   ```

263. **HEX_6**: `#fbbf24` (라인 1066)
   ```
   --status-requested: #fbbf24;
   ```

264. **HEX_6**: `#6b7280` (라인 1080)
   ```
   --user-inactive: #6b7280;
   ```

265. **HEX_6**: `#fbbf24` (라인 1081)
   ```
   --user-pending: #fbbf24;
   ```

266. **HEX_6**: `#ec4899` (라인 1084)
   ```
   --vacation-maternity: #ec4899;
   ```

267. **HEX_6**: `#6b7280` (라인 1085)
   ```
   --vacation-other: #6b7280;
   ```

268. **HEX_6**: `#06b6d4` (라인 1086)
   ```
   --vacation-paternity: #06b6d4;
   ```

269. **HEX_6**: `#FAF9F7` (라인 1099)
   ```
   --mg-client-bg-main: #FAF9F7;
   ```

270. **HEX_6**: `#E07A5F` (라인 1101)
   ```
   --mg-client-primary: #E07A5F;
   ```

271. **HEX_6**: `#F2CC8F` (라인 1102)
   ```
   --mg-client-primary-light: #F2CC8F;
   ```

272. **HEX_6**: `#C06A50` (라인 1103)
   ```
   --mg-client-primary-dark: #C06A50;
   ```

273. **HEX_6**: `#E07A5F` (라인 1104)
   ```
   --mg-client-gradient: linear-gradient(to right, #E07A5F, #F2CC8F);
   ```

274. **HEX_6**: `#F2CC8F` (라인 1104)
   ```
   --mg-client-gradient: linear-gradient(to right, #E07A5F, #F2CC8F);
   ```

275. **HEX_6**: `#FAF9F7` (라인 1107)
   ```
   --mg-consultant-bg-main: #FAF9F7;
   ```

276. **HEX_6**: `#F5F3EF` (라인 1108)
   ```
   --mg-consultant-surface: #F5F3EF;
   ```

277. **HEX_6**: `#3D5246` (라인 1109)
   ```
   --mg-consultant-primary: #3D5246;
   ```

278. **HEX_6**: `#6B7F72` (라인 1110)
   ```
   --mg-consultant-primary-light: #6B7F72;
   ```

279. **HEX_6**: `#2A3A31` (라인 1111)
   ```
   --mg-consultant-primary-dark: #2A3A31;
   ```

280. **HEX_6**: `#3D5246` (라인 1112)
   ```
   --mg-consultant-gradient: linear-gradient(to right, #3D5246, #6B7F72);
   ```

281. **HEX_6**: `#6B7F72` (라인 1112)
   ```
   --mg-consultant-gradient: linear-gradient(to right, #3D5246, #6B7F72);
   ```

282. **HEX_6**: `#6b7c32` (라인 1121)
   ```
   --mg-color-brand-olive: #6b7c32;
   ```

283. **HEX_6**: `#2C2C2C` (라인 1124)
   ```
   --mg-color-text-main: #2C2C2C;
   ```

284. **HEX_6**: `#5C6B61` (라인 1125)
   ```
   --mg-color-text-secondary: #5C6B61;
   ```

285. **HEX_6**: `#D4CFC8` (라인 1127)
   ```
   --mg-color-border-main: #D4CFC8;
   ```

286. **HEX_6**: `#E57373` (라인 1128)
   ```
   --mg-color-error: #E57373;
   ```

287. **HEX_6**: `#059669` (라인 1129)
   ```
   /* 성공 — D5 §4 옵션 A: emerald-600 통합 (#059669, success-600 폐기 흡수, WCAG AA) */
   ```

288. **HEX_6**: `#059669` (라인 1130)
   ```
   --mg-color-success: #059669;
   ```

289. **HEX_6**: `#3B82F6` (라인 1131)
   ```
   --mg-color-info: #3B82F6;
   ```

290. **HEX_6**: `#059669` (라인 1139)
   ```
   /* 성공 RGB — D5 §4 통합 후 emerald-600 (#059669) 채널 (5, 150, 105) */
   ```

291. **HEX_6**: `#2C2C2C` (라인 1145)
   ```
   --mg-warm-gray-900: #2C2C2C;
   ```

292. **HEX_6**: `#4A4A4A` (라인 1146)
   ```
   --mg-warm-gray-700: #4A4A4A;
   ```

293. **HEX_6**: `#7A7A7A` (라인 1147)
   ```
   --mg-warm-gray-500: #7A7A7A;
   ```

294. **HEX_6**: `#9E9E9E` (라인 1148)
   ```
   --mg-warm-gray-400: #9E9E9E;
   ```

295. **HEX_6**: `#D4CFC8` (라인 1149)
   ```
   --mg-warm-gray-300: #D4CFC8;
   ```

296. **HEX_6**: `#F0EDE8` (라인 1150)
   ```
   --mg-warm-gray-100: #F0EDE8;
   ```

297. **HEX_6**: `#FAF9F7` (라인 1151)
   ```
   --mg-warm-gray-50: #FAF9F7;
   ```

298. **HEX_6**: `#2c2c2c` (라인 1206)
   ```
   --mg-dark-bg-800: #2c2c2c;
   ```

299. **HEX_6**: `#1a1a1a` (라인 1207)
   ```
   --mg-dark-bg-900: #1a1a1a;
   ```

300. **HEX_6**: `#764ba2` (라인 1210)
   ```
   --mg-gradient-primary-end: #764ba2;
   ```

301. **HEX_6**: `#2c2c2c` (라인 1216)
   ```
   --mg-dark-bg-800: #2c2c2c; /* 다크모드에서는 본연의 색 유지 */
   ```

302. **HEX_6**: `#1a1a1a` (라인 1217)
   ```
   --mg-dark-bg-900: #1a1a1a;
   ```

303. **HEX_6**: `#8e63b8` (라인 1219)
   ```
   --mg-gradient-primary-end: #8e63b8; /* 다크모드 환경에서 가시성 확보를 위해 약간 더 밝게 보정 */
   ```

304. **HEX_6**: `#374151` (라인 1230)
   ```
   --mg-color-text-secondary-dark: #374151;
   ```

305. **HEX_6**: `#4b5563` (라인 1232)
   ```
   --mg-color-text-tertiary: #4b5563;
   ```

306. **HEX_6**: `#d1d5db` (라인 1236)
   ```
   --mg-color-text-secondary-dark: #d1d5db; /* Tailwind gray-300 대응 */
   ```

307. **HEX_6**: `#9ca3af` (라인 1237)
   ```
   --mg-color-text-tertiary: #9ca3af; /* Tailwind gray-400 대응 */
   ```

308. **HEX_6**: `#fef3c7` (라인 1247)
   ```
   --mg-color-warning-bg: #fef3c7;
   ```

309. **HEX_6**: `#fee2e2` (라인 1249)
   ```
   --mg-color-error-bg: #fee2e2;
   ```

310. **HEX_6**: `#453303` (라인 1253)
   ```
   --mg-color-warning-bg: #453303; /* 다크모드 경고 배경 (대비 조정) */
   ```

311. **HEX_6**: `#450a0a` (라인 1254)
   ```
   --mg-color-error-bg: #450a0a; /* 다크모드 에러 배경 (대비 조정) */
   ```

312. **HEX_6**: `#faf9f7` (라인 1260)
   ```
   배경: D1·D2·D3 codemod가 #faf9f7·#f9fafb·#f3f4f6·#f8fafc 등을
   ```

313. **HEX_6**: `#f9fafb` (라인 1260)
   ```
   배경: D1·D2·D3 codemod가 #faf9f7·#f9fafb·#f3f4f6·#f8fafc 등을
   ```

314. **HEX_6**: `#f3f4f6` (라인 1260)
   ```
   배경: D1·D2·D3 codemod가 #faf9f7·#f9fafb·#f3f4f6·#f8fafc 등을
   ```

315. **HEX_6**: `#f8fafc` (라인 1260)
   ```
   배경: D1·D2·D3 codemod가 #faf9f7·#f9fafb·#f3f4f6·#f8fafc 등을
   ```

316. **HEX_6**: `#faf9f7` (라인 1268)
   ```
   /* 메인 배경 — D1 합의서 §A 매핑값 (#faf9f7, 시스템 베이지 배경) */
   ```

317. **HEX_6**: `#faf9f7` (라인 1269)
   ```
   --mg-color-background-main: #faf9f7;
   ```

318. **HEX_6**: `#1a1a1a` (라인 1273)
   ```
   /* 다크 메인 배경 — D1 합의서 §B 정착값(--mg-dark-bg-900)과 동일 (#1a1a1a) */
   ```

319. **HEX_6**: `#1a1a1a` (라인 1274)
   ```
   --mg-color-background-main: #1a1a1a;
   ```

320. **HEX_6**: `#3D5246` (라인 1298)
   ```
   값 근거: --mg-color-primary-main = #3D5246
   ```

321. **HEX_6**: `#4A6354` (라인 1301)
   ```
   --mg-primary-light = #4A6354
   ```

322. **HEX_6**: `#3D5246` (라인 1304)
   ```
   --mg-primary-color = #3D5246 (alias, 동일 값)
   ```

323. **HEX_6**: `#3D5246` (라인 1308)
   ```
   /* 브랜드 primary 메인 — #3D5246 (마인드가든 그린 베이스, --mg-consultant-primary 동일) */
   ```

324. **HEX_6**: `#3D5246` (라인 1309)
   ```
   --mg-color-primary-main: #3D5246;
   ```

325. **HEX_6**: `#4A6354` (라인 1310)
   ```
   /* 브랜드 primary 라이트 — #4A6354 (UnifiedLogin.css L18 그라데이션 fallback 값 승격) */
   ```

326. **HEX_6**: `#4A6354` (라인 1311)
   ```
   --mg-color-primary-light: #4A6354;
   ```

327. **HEX_6**: `#2A3B30` (라인 1312)
   ```
   /* 브랜드 primary 다크 — #2A3B30 (T-D 가드 6c4f727e9 발견 SSOT 누락 보강,
   ```

328. **HEX_6**: `#2A3A31` (라인 1313)
   ```
   primary-main 한 단계 어두운 톤, --mg-consultant-primary-dark `#2A3A31` 인접) */
   ```

329. **HEX_6**: `#2A3B30` (라인 1314)
   ```
   --mg-color-primary-dark: #2A3B30;
   ```

330. **HEX_6**: `#3D5246` (라인 1318)
   ```
   --mg-primary-color: #3D5246;
   ```

331. **HEX_6**: `#4A6354` (라인 1320)
   ```
   --mg-primary-light: #4A6354;
   ```

332. **HEX_6**: `#6B7F72` (라인 1324)
   ```
   /* 다크 브랜드 primary — #6B7F72 (--mg-consultant-primary-light L1110 톤, 대비 조정) */
   ```

333. **HEX_6**: `#6B7F72` (라인 1325)
   ```
   --mg-color-primary-main: #6B7F72;
   ```

334. **HEX_6**: `#8AA08F` (라인 1326)
   ```
   /* 다크 브랜드 primary 라이트 — #8AA08F (한 단계 더 밝은 톤, UAT 권장) */
   ```

335. **HEX_6**: `#8AA08F` (라인 1327)
   ```
   --mg-color-primary-light: #8AA08F;
   ```

336. **HEX_6**: `#4F6B5A` (라인 1328)
   ```
   /* 다크 브랜드 primary 다크 — #4F6B5A (T-D 가드 SSOT 보강, --mg-primary-light `#4A6354` 인접 톤) */
   ```

337. **HEX_6**: `#4A6354` (라인 1328)
   ```
   /* 다크 브랜드 primary 다크 — #4F6B5A (T-D 가드 SSOT 보강, --mg-primary-light `#4A6354` 인접 톤) */
   ```

338. **HEX_6**: `#4F6B5A` (라인 1329)
   ```
   --mg-color-primary-dark: #4F6B5A;
   ```

339. **HEX_6**: `#f5f5f5` (라인 1330)
   ```
   /* 다크 화이트 — #f5f5f5 (다크 베이스에서 가독성 유지) */
   ```

340. **HEX_6**: `#f5f5f5` (라인 1331)
   ```
   --mg-color-white: #f5f5f5;
   ```

341. **HEX_6**: `#6B7F72` (라인 1332)
   ```
   --mg-primary-color: #6B7F72;
   ```

342. **HEX_6**: `#8AA08F` (라인 1333)
   ```
   --mg-primary-light: #8AA08F;
   ```

343. **HEX_6**: `#6b7c32` (라인 1340)
   ```
   블록) 에서 라이트(#6b7c32) 정의로 이동했으며, 다크 톤(#d9f99d,
   ```

344. **HEX_6**: `#d9f99d` (라인 1340)
   ```
   블록) 에서 라이트(#6b7c32) 정의로 이동했으며, 다크 톤(#d9f99d,
   ```

345. **HEX_6**: `#059669` (라인 1342)
   ```
   결정으로 `--mg-color-success` 라이트 (#059669, L1124 본 PR 재정의)
   ```

346. **HEX_6**: `#6ee7b7` (라인 1343)
   ```
   에 대응되는 다크 톤 (#6ee7b7, emerald-300) 을 본 블록에서 신규
   ```

347. **HEX_6**: `#d9f99d` (라인 1349)
   ```
   /* 다크 브랜드 olive — #d9f99d (lime-200 톤, D5 §3 채택, 다크 배경 위 포인트 컬러 대비비 충족) */
   ```

348. **HEX_6**: `#d9f99d` (라인 1350)
   ```
   --mg-color-brand-olive: #d9f99d;
   ```

349. **HEX_6**: `#6ee7b7` (라인 1351)
   ```
   /* 다크 성공 — #6ee7b7 (emerald-300 톤, D5 §4 옵션 A 통합 다크 매핑, WCAG AA) */
   ```

350. **HEX_6**: `#6ee7b7` (라인 1352)
   ```
   --mg-color-success: #6ee7b7;
   ```

351. **HEX_6**: `#f0f9ff` (라인 1373)
   ```
   --mg-color-info-bg: #f0f9ff;        /* Tailwind sky-50 — 정보 배경 (D5 §2 채택) */
   ```

352. **HEX_6**: `#1e40af` (라인 1374)
   ```
   --mg-color-info-dark: #1e40af;      /* Tailwind blue-800 — 정보 다크 텍스트/보더 (D5 §2 채택) */
   ```

353. **HEX_6**: `#fef2f2` (라인 1375)
   ```
   --mg-color-error-50: #fef2f2;       /* Tailwind red-50 — 에러 가장 밝은 배경 (D5 §2 채택) */
   ```

354. **HEX_6**: `#991b1b` (라인 1376)
   ```
   --mg-color-error-dark: #991b1b;     /* Tailwind red-800 — 에러 다크 텍스트/보더 (D5 §2 채택) */
   ```

355. **HEX_6**: `#082f49` (라인 1380)
   ```
   --mg-color-info-bg: #082f49;        /* sky-950 톤 — 다크 모드 정보 배경 (D5 §2 채택, WCAG AA) */
   ```

356. **HEX_6**: `#bae6fd` (라인 1381)
   ```
   --mg-color-info-dark: #bae6fd;      /* sky-200 톤 — 다크 모드 정보 다크 텍스트 (D5 §2 채택, 대비 반전) */
   ```

357. **HEX_6**: `#450a0a` (라인 1382)
   ```
   --mg-color-error-50: #450a0a;       /* red-950 톤 — 다크 모드 에러 가장 밝은 배경 (D5 §2 채택) */
   ```

358. **HEX_6**: `#fca5a5` (라인 1383)
   ```
   --mg-color-error-dark: #fca5a5;     /* red-300 톤 — 다크 모드 에러 다크 텍스트 (D5 §2 채택, 대비 반전) */
   ```

359. **HEX_6**: `#F5F3EF` (라인 1401)
   ```
   `#F5F3EF`)으로 회복되어 카드 경계가 약간 더 어두워짐 (의도된
   ```

360. **HEX_6**: `#F5F3EF` (라인 1406)
   ```
   /* surface 메인 — 카드/모달/리스트 아이템/칩 배경 (#F5F3EF, --mg-consultant-surface L1108 톤 통일) */
   ```

361. **HEX_6**: `#F5F3EF` (라인 1407)
   ```
   --mg-color-surface-main: #F5F3EF;
   ```

362. **HEX_6**: `#FAF9F7` (라인 1408)
   ```
   /* --mg-color-background-base — D6 §9.1 C5 결정으로 폐기, --mg-color-background-main 으로 통합 (값 동일 #FAF9F7) */
   ```

363. **HEX_6**: `#F2EDE8` (라인 1409)
   ```
   /* 한 단계 음영 — LNB(사이드바)/푸터/비활성 탭 (#F2EDE8) */
   ```

364. **HEX_6**: `#F2EDE8` (라인 1410)
   ```
   --mg-color-background-muted: #F2EDE8;
   ```

365. **HEX_6**: `#EBE6E0` (라인 1411)
   ```
   /* 보조/분할 영역 — Split layout 보조 패널/우측 사이드바 (#EBE6E0) */
   ```

366. **HEX_6**: `#EBE6E0` (라인 1412)
   ```
   --mg-color-background-secondary: #EBE6E0;
   ```

367. **HEX_6**: `#E0DBD5` (라인 1413)
   ```
   /* 하위 그룹 음영 — 카드 내 중첩 블록/테이블 헤더 영역 (#E0DBD5) */
   ```

368. **HEX_6**: `#E0DBD5` (라인 1414)
   ```
   --mg-color-background-sub: #E0DBD5;
   ```

369. **HEX_6**: `#262626` (라인 1418)
   ```
   /* 다크 surface 메인 — 카드/모달/리스트 아이템/칩 배경 (#262626, --mg-dark-bg-800 톤 인접) */
   ```

370. **HEX_6**: `#262626` (라인 1419)
   ```
   --mg-color-surface-main: #262626;
   ```

371. **HEX_6**: `#2C2C2C` (라인 1420)
   ```
   /* 다크 한 단계 음영 — LNB/푸터/비활성 탭 (#2C2C2C) */
   ```

372. **HEX_6**: `#2C2C2C` (라인 1421)
   ```
   --mg-color-background-muted: #2C2C2C;
   ```

373. **HEX_6**: `#232323` (라인 1422)
   ```
   /* 다크 보조/분할 영역 — Split layout 보조 패널 (#232323) */
   ```

374. **HEX_6**: `#232323` (라인 1423)
   ```
   --mg-color-background-secondary: #232323;
   ```

375. **HEX_6**: `#333333` (라인 1424)
   ```
   /* 다크 하위 그룹 음영 — 카드 내 중첩 블록/테이블 헤더 (#333333) */
   ```

376. **HEX_6**: `#333333` (라인 1425)
   ```
   --mg-color-background-sub: #333333;
   ```

377. **HEX_6**: `#ff6b9d` (라인 1433)
   ```
   C1 Pink accent (#ff6b9d) 는 §9.1 컨펌 결과 사용처 비한정
   ```

378. **HEX_6**: `#6b7c32` (라인 1437)
   ```
   - brand-olive-light : 마케팅 배너 보조 (D5 §3 brand-olive `#6b7c32`
   ```

379. **HEX_6**: `#03c75a` (라인 1440)
   ```
   다크 동일 hex — 라이트·다크 모두 `#03c75a`)
   ```

380. **HEX_6**: `#d1fae5` (라인 1442)
   ```
   (텍스트 on `#d1fae5` 6.6:1 / on `#064e3b` 6.3:1 PASS)
   ```

381. **HEX_6**: `#064e3b` (라인 1442)
   ```
   (텍스트 on `#d1fae5` 6.6:1 / on `#064e3b` 6.3:1 PASS)
   ```

382. **HEX_6**: `#9caf88` (라인 1452)
   ```
   /* 브랜드 olive 라이트 — #9caf88 (마케팅 배너/넓은 보조 표면, brand-olive 본체 #6b7c32 보다 채도 낮춤) */
   ```

383. **HEX_6**: `#6b7c32` (라인 1452)
   ```
   /* 브랜드 olive 라이트 — #9caf88 (마케팅 배너/넓은 보조 표면, brand-olive 본체 #6b7c32 보다 채도 낮춤) */
   ```

384. **HEX_6**: `#9caf88` (라인 1453)
   ```
   --mg-color-brand-olive-light: #9caf88;
   ```

385. **HEX_6**: `#03c75a` (라인 1454)
   ```
   /* NAVER OAuth 브랜드 그린 — #03c75a (외부 브랜드 가이드, 라이트·다크 동일) */
   ```

386. **HEX_6**: `#03c75a` (라인 1455)
   ```
   --mg-color-naver-green: #03c75a;
   ```

387. **HEX_6**: `#d1fae5` (라인 1456)
   ```
   /* success light surface — #d1fae5 (Tailwind emerald-100 톤, success-800 텍스트 6.6:1 PASS) */
   ```

388. **HEX_6**: `#d1fae5` (라인 1457)
   ```
   --mg-color-success-100: #d1fae5;
   ```

389. **HEX_6**: `#065f46` (라인 1458)
   ```
   /* success dark text — #065f46 (Tailwind emerald-800 톤, on success-100 6.6:1 PASS) */
   ```

390. **HEX_6**: `#065f46` (라인 1459)
   ```
   --mg-color-success-800: #065f46;
   ```

391. **HEX_6**: `#fecaca` (라인 1460)
   ```
   /* error light surface — #fecaca (Tailwind red-200 톤, 표면용) */
   ```

392. **HEX_6**: `#fecaca` (라인 1461)
   ```
   --mg-color-error-100: #fecaca;
   ```

393. **HEX_6**: `#dbeafe` (라인 1462)
   ```
   /* info light surface — #dbeafe (Tailwind blue-100 톤, 표면용) */
   ```

394. **HEX_6**: `#dbeafe` (라인 1463)
   ```
   --mg-color-info-100: #dbeafe;
   ```

395. **HEX_6**: `#856404` (라인 1464)
   ```
   /* warning dark text — #856404 (D4 warning-800 톤 통합, on warning-bg #fef3c7 4.7:1 PASS) */
   ```

396. **HEX_6**: `#fef3c7` (라인 1464)
   ```
   /* warning dark text — #856404 (D4 warning-800 톤 통합, on warning-bg #fef3c7 4.7:1 PASS) */
   ```

397. **HEX_6**: `#856404` (라인 1465)
   ```
   --mg-color-warning-dark: #856404;
   ```

398. **HEX_6**: `#b5c5a4` (라인 1469)
   ```
   /* 다크 브랜드 olive 라이트 — #b5c5a4 (다크 배경 위 가독성 한 단계 밝힘) */
   ```

399. **HEX_6**: `#b5c5a4` (라인 1470)
   ```
   --mg-color-brand-olive-light: #b5c5a4;
   ```

400. **HEX_6**: `#03c75a` (라인 1471)
   ```
   /* 다크 NAVER OAuth — #03c75a (외부 브랜드 가이드 준수, 라이트와 동일 hex) */
   ```

401. **HEX_6**: `#03c75a` (라인 1472)
   ```
   --mg-color-naver-green: #03c75a;
   ```

402. **HEX_6**: `#064e3b` (라인 1473)
   ```
   /* 다크 success light surface — #064e3b (emerald-900 톤, 다크 표면 대비 반전) */
   ```

403. **HEX_6**: `#064e3b` (라인 1474)
   ```
   --mg-color-success-100: #064e3b;
   ```

404. **HEX_6**: `#6ee7b7` (라인 1475)
   ```
   /* 다크 success dark text — #6ee7b7 (emerald-300 톤, on success-100 다크 6.3:1 PASS) */
   ```

405. **HEX_6**: `#6ee7b7` (라인 1476)
   ```
   --mg-color-success-800: #6ee7b7;
   ```

406. **HEX_6**: `#7f1d1d` (라인 1477)
   ```
   /* 다크 error light surface — #7f1d1d (red-900 톤, 다크 표면 대비 반전) */
   ```

407. **HEX_6**: `#7f1d1d` (라인 1478)
   ```
   --mg-color-error-100: #7f1d1d;
   ```

408. **HEX_6**: `#1e3a8a` (라인 1479)
   ```
   /* 다크 info light surface — #1e3a8a (blue-900 톤, 다크 표면 대비 반전) */
   ```

409. **HEX_6**: `#1e3a8a` (라인 1480)
   ```
   --mg-color-info-100: #1e3a8a;
   ```

410. **HEX_6**: `#fde68a` (라인 1481)
   ```
   /* 다크 warning dark text — #fde68a (amber-200 톤, on warning-bg 다크 6.6:1 PASS) */
   ```

411. **HEX_6**: `#fde68a` (라인 1482)
   ```
   --mg-color-warning-dark: #fde68a;
   ```

412. **HEX_6**: `#1e3a8a` (라인 1489)
   ```
   배경: T-Top 50 잔존 hex `#1e3a8a` (Tailwind blue-900, 5건) 흡수용 신설.
   ```

413. **HEX_6**: `#1e3a8a` (라인 1496)
   ```
   - Light: #1e3a8a on #dbeafe (info-100) → 8.9:1 PASS
   ```

414. **HEX_6**: `#dbeafe` (라인 1496)
   ```
   - Light: #1e3a8a on #dbeafe (info-100) → 8.9:1 PASS
   ```

415. **HEX_6**: `#bfdbfe` (라인 1497)
   ```
   - Dark : #bfdbfe on #1e3a8a (info-100 다크) → 7.9:1 PASS
   ```

416. **HEX_6**: `#1e3a8a` (라인 1497)
   ```
   - Dark : #bfdbfe on #1e3a8a (info-100 다크) → 7.9:1 PASS
   ```

417. **HEX_6**: `#1e3a8a` (라인 1501)
   ```
   /* info dark text — #1e3a8a (Tailwind blue-900, on info-100 라이트 8.9:1 PASS) */
   ```

418. **HEX_6**: `#1e3a8a` (라인 1502)
   ```
   --mg-color-info-800: #1e3a8a;
   ```

419. **HEX_6**: `#bfdbfe` (라인 1506)
   ```
   /* 다크 info dark text — #bfdbfe (Tailwind blue-200, on info-100 다크 7.9:1 PASS) */
   ```

420. **HEX_6**: `#bfdbfe` (라인 1507)
   ```
   --mg-color-info-800: #bfdbfe;
   ```

421. **HEX_6**: `#f472b6` (라인 1525)
   ```
   - pink-400  light #f472b6 / dark #f9a8d4 (다크 7.2:1 AAA PASS)
   ```

422. **HEX_6**: `#f9a8d4` (라인 1525)
   ```
   - pink-400  light #f472b6 / dark #f9a8d4 (다크 7.2:1 AAA PASS)
   ```

423. **HEX_6**: `#fbcfe8` (라인 1526)
   ```
   - pink-200  light #fbcfe8 / dark #fce7f3 (배경 보조)
   ```

424. **HEX_6**: `#fce7f3` (라인 1526)
   ```
   - pink-200  light #fbcfe8 / dark #fce7f3 (배경 보조)
   ```

425. **HEX_6**: `#fb7185` (라인 1527)
   ```
   - rose-400  light #fb7185 / dark #fda4af (다크 7.1:1 AAA PASS)
   ```

426. **HEX_6**: `#fda4af` (라인 1527)
   ```
   - rose-400  light #fb7185 / dark #fda4af (다크 7.1:1 AAA PASS)
   ```

427. **HEX_6**: `#f0f0f0` (라인 1528)
   ```
   - surface-light light #f0f0f0 / dark #262626 (배경용)
   ```

428. **HEX_6**: `#262626` (라인 1528)
   ```
   - surface-light light #f0f0f0 / dark #262626 (배경용)
   ```

429. **HEX_6**: `#e3f2fd` (라인 1529)
   ```
   - info-soft  light #e3f2fd / dark #1e3a8a (배경용)
   ```

430. **HEX_6**: `#1e3a8a` (라인 1529)
   ```
   - info-soft  light #e3f2fd / dark #1e3a8a (배경용)
   ```

431. **HEX_6**: `#7b68ee` (라인 1530)
   ```
   - accent-violet light #7b68ee / dark #a78bfa (Large 4.3:1)
   ```

432. **HEX_6**: `#a78bfa` (라인 1530)
   ```
   - accent-violet light #7b68ee / dark #a78bfa (Large 4.3:1)
   ```

433. **HEX_6**: `#b0e0e6` (라인 1531)
   ```
   - surface-blue-soft light #b0e0e6 / dark #164e63 (배경용)
   ```

434. **HEX_6**: `#164e63` (라인 1531)
   ```
   - surface-blue-soft light #b0e0e6 / dark #164e63 (배경용)
   ```

435. **HEX_6**: `#f0fdf4` (라인 1532)
   ```
   - success-50 light #f0fdf4 / dark #064e3b (배경용)
   ```

436. **HEX_6**: `#064e3b` (라인 1532)
   ```
   - success-50 light #f0fdf4 / dark #064e3b (배경용)
   ```

437. **HEX_6**: `#2C2C2C` (라인 1533)
   ```
   - text-main  light #2C2C2C / dark #E5E5E5 (다크 12.3:1 AAA PASS)
   ```

438. **HEX_6**: `#E5E5E5` (라인 1533)
   ```
   - text-main  light #2C2C2C / dark #E5E5E5 (다크 12.3:1 AAA PASS)
   ```

439. **HEX_6**: `#f472b6` (라인 1539)
   ```
   --mg-color-pink-400: #f472b6;
   ```

440. **HEX_6**: `#fbcfe8` (라인 1540)
   ```
   --mg-color-pink-200: #fbcfe8;
   ```

441. **HEX_6**: `#fb7185` (라인 1541)
   ```
   --mg-color-rose-400: #fb7185;
   ```

442. **HEX_6**: `#f0f0f0` (라인 1544)
   ```
   --mg-color-surface-light: #f0f0f0;
   ```

443. **HEX_6**: `#e3f2fd` (라인 1545)
   ```
   --mg-color-info-soft: #e3f2fd;
   ```

444. **HEX_6**: `#7b68ee` (라인 1546)
   ```
   --mg-color-accent-violet: #7b68ee;
   ```

445. **HEX_6**: `#b0e0e6` (라인 1547)
   ```
   --mg-color-surface-blue-soft: #b0e0e6;
   ```

446. **HEX_6**: `#f0fdf4` (라인 1548)
   ```
   --mg-color-success-50: #f0fdf4;
   ```

447. **HEX_6**: `#f59e0b` (라인 1551)
   ```
   `--cs-warning-500` (#f59e0b) / `--cs-error-500` (#ef4444) 의 hex 를 그대로
   ```

448. **HEX_6**: `#ef4444` (라인 1551)
   ```
   `--cs-warning-500` (#f59e0b) / `--cs-error-500` (#ef4444) 의 hex 를 그대로
   ```

449. **HEX_6**: `#f59e0b` (라인 1557)
   ```
   --mg-color-warning-500: #f59e0b;
   ```

450. **HEX_6**: `#ef4444` (라인 1558)
   ```
   --mg-color-error-500: #ef4444;
   ```

451. **HEX_6**: `#f9a8d4` (라인 1563)
   ```
   --mg-color-pink-400: #f9a8d4;
   ```

452. **HEX_6**: `#fce7f3` (라인 1564)
   ```
   --mg-color-pink-200: #fce7f3;
   ```

453. **HEX_6**: `#fda4af` (라인 1565)
   ```
   --mg-color-rose-400: #fda4af;
   ```

454. **HEX_6**: `#262626` (라인 1568)
   ```
   --mg-color-surface-light: #262626;
   ```

455. **HEX_6**: `#1e3a8a` (라인 1569)
   ```
   --mg-color-info-soft: #1e3a8a;
   ```

456. **HEX_6**: `#a78bfa` (라인 1570)
   ```
   --mg-color-accent-violet: #a78bfa;
   ```

457. **HEX_6**: `#164e63` (라인 1571)
   ```
   --mg-color-surface-blue-soft: #164e63;
   ```

458. **HEX_6**: `#064e3b` (라인 1572)
   ```
   --mg-color-success-50: #064e3b;
   ```

459. **HEX_6**: `#E5E5E5` (라인 1574)
   ```
   /* D8 T-TextMain-Dark — text-main 다크 cascade 분리 (#E5E5E5, AAA 12.3:1) */
   ```

460. **HEX_6**: `#E5E5E5` (라인 1575)
   ```
   --mg-color-text-main: #E5E5E5;
   ```

461. **HEX_6**: `#f59e0b` (라인 1578)
   ```
   --mg-color-warning-500: #f59e0b;
   ```

462. **HEX_6**: `#ef4444` (라인 1579)
   ```
   --mg-color-error-500: #ef4444;
   ```

463. **HEX_6**: `#764ba2` (라인 1588)
   ```
   --tenant-secondary: #764ba2;
   ```

464. **HEX_6**: `#6b46c1` (라인 1596)
   ```
   --tenant-secondary: #6b46c1;
   ```

465. **HEX_6**: `#059669` (라인 1602)
   ```
   --tenant-secondary: #059669;
   ```

466. **HEX_6**: `#d97706` (라인 1608)
   ```
   --tenant-secondary: #d97706;
   ```

467. **HEX_6**: `#66b3ff` (라인 1681)
   ```
   --color-primary-light: #66b3ff;
   ```

468. **HEX_6**: `#0056b3` (라인 1682)
   ```
   --color-primary-dark: #0056b3;
   ```

469. **HEX_6**: `#9ca3af` (라인 1687)
   ```
   --color-secondary-light: #9ca3af;
   ```

470. **HEX_6**: `#495057` (라인 1688)
   ```
   --color-secondary-dark: #495057;
   ```

471. **HEX_6**: `#6cbb6d` (라인 1693)
   ```
   --status-success-light: #6cbb6d;
   ```

472. **HEX_6**: `#1e7e34` (라인 1694)
   ```
   --status-success-dark: #1e7e34;
   ```

473. **HEX_6**: `#f56565` (라인 1698)
   ```
   --status-error-light: #f56565;
   ```

474. **HEX_6**: `#c82333` (라인 1699)
   ```
   --status-error-dark: #c82333;
   ```

475. **HEX_6**: `#ffeaa7` (라인 1703)
   ```
   --status-warning-light: #ffeaa7;
   ```

476. **HEX_6**: `#e0a800` (라인 1704)
   ```
   --status-warning-dark: #e0a800;
   ```

477. **HEX_6**: `#856404` (라인 1706)
   ```
   --color-warning-dark: #856404;
   ```

478. **HEX_6**: `#bbdefb` (라인 1709)
   ```
   --status-info-light: #bbdefb;
   ```

479. **HEX_6**: `#138496` (라인 1710)
   ```
   --status-info-dark: #138496;
   ```

480. **HEX_6**: `#fd7e14` (라인 1713)
   ```
   --status-pending: #fd7e14;
   ```

481. **HEX_6**: `#ffa94d` (라인 1714)
   ```
   --status-pending-light: #ffa94d;
   ```

482. **HEX_6**: `#e55a00` (라인 1715)
   ```
   --status-pending-dark: #e55a00;
   ```

483. **HEX_6**: `#d1fae5` (라인 1719)
   ```
   --status-success-bg: #d1fae5;
   ```

484. **HEX_6**: `#fee2e2` (라인 1720)
   ```
   --status-error-bg: #fee2e2;
   ```

485. **HEX_6**: `#fef3c7` (라인 1721)
   ```
   --status-warning-bg: #fef3c7;
   ```

486. **HEX_6**: `#dbeafe` (라인 1722)
   ```
   --status-info-bg: #dbeafe;
   ```

487. **HEX_6**: `#fecaca` (라인 1725)
   ```
   --status-error-border: #fecaca;
   ```

488. **HEX_6**: `#c3e6cb` (라인 1726)
   ```
   --status-success-border: #c3e6cb;
   ```

489. **HEX_6**: `#e91e63` (라인 1729)
   ```
   --color-accent: #e91e63;
   ```

490. **HEX_6**: `#795548` (라인 1730)
   ```
   --color-brown: #795548;
   ```

491. **HEX_6**: `#6d3410` (라인 1731)
   ```
   --color-brown-dark: #6d3410;
   ```

492. **HEX_6**: `#9e9e9e` (라인 1732)
   ```
   --color-gray: #9e9e9e;
   ```

493. **HEX_6**: `#95a5a6` (라인 1733)
   ```
   --color-gray-light: #95a5a6;
   ```

494. **HEX_6**: `#7f8c8d` (라인 1734)
   ```
   --color-gray-dark: #7f8c8d;
   ```

495. **HEX_6**: `#7b1fa2` (라인 1735)
   ```
   --color-purple: #7b1fa2;
   ```

496. **HEX_6**: `#f3e5f5` (라인 1736)
   ```
   --color-purple-light: #f3e5f5;
   ```

497. **HEX_6**: `#e65100` (라인 1737)
   ```
   --color-orange: #e65100;
   ```

498. **HEX_6**: `#fff3e0` (라인 1738)
   ```
   --color-orange-light: #fff3e0;
   ```

499. **HEX_6**: `#c2185b` (라인 1740)
   ```
   --color-pink: #c2185b;
   ```

500. **HEX_6**: `#fce4ec` (라인 1741)
   ```
   --color-pink-light: #fce4ec;
   ```

501. **HEX_6**: `#a8a8a8` (라인 1742)
   ```
   --color-border-dark: #a8a8a8;
   ```

502. **HEX_6**: `#212529` (라인 1746)
   ```
   --color-dark: #212529;
   ```

503. **HEX_6**: `#2F2F2F` (라인 1749)
   ```
   --dark-gray: #2F2F2F;
   ```

504. **HEX_6**: `#6B6B6B` (라인 1750)
   ```
   --medium-gray: #6B6B6B;
   ```

505. **HEX_6**: `#FFFEF7` (라인 1751)
   ```
   --light-cream: #FFFEF7;
   ```

506. **HEX_6**: `#6b7280` (라인 1915)
   ```
   --status-completed: #6b7280;
   ```

507. **HEX_6**: `#FAFAFA` (라인 1931)
   ```
   --color-bg-secondary: #FAFAFA;
   ```

508. **HEX_6**: `#e9ecef` (라인 1935)
   ```
   --color-border-light: #e9ecef;
   ```

509. **HEX_6**: `#2F2F2F` (라인 1957)
   ```
   --dark-gray: #2F2F2F;
   ```

510. **HEX_6**: `#6B6B6B` (라인 1958)
   ```
   --medium-gray: #6B6B6B;
   ```

511. **HEX_6**: `#FFFEF7` (라인 1959)
   ```
   --light-cream: #FFFEF7;
   ```

512. **HEX_6**: `#FFF5EE` (라인 2015)
   ```
   #FFF5EE 0%,      /* 연한 베이지 */
   ```

513. **HEX_6**: `#FFE4E1` (라인 2016)
   ```
   #FFE4E1 30%,     /* 연분홍 */
   ```

514. **HEX_6**: `#FFFACD` (라인 2017)
   ```
   #FFFACD 60%,     /* 레몬 시폰 (연노랑) */
   ```

515. **HEX_6**: `#FFE4E1` (라인 2018)
   ```
   #FFE4E1 100%     /* 연분홍 */
   ```

516. **HEX_6**: `#e5e7eb` (라인 5593)
   ```
   border: 1px solid var(--color-border-light, #e5e7eb);
   ```

517. **HEX_6**: `#3b82f6` (라인 5610)
   ```
   border-color: var(--color-border-focus, #3b82f6);
   ```

518. **HEX_6**: `#111827` (라인 5638)
   ```
   color: var(--color-text-primary, #111827);
   ```

519. **HEX_6**: `#4b5563` (라인 5646)
   ```
   color: var(--color-text-secondary, #4b5563);
   ```

520. **HEX_6**: `#4b5563` (라인 5684)
   ```
   color: var(--color-text-secondary, #4b5563);
   ```

521. **HEX_6**: `#111827` (라인 5690)
   ```
   color: var(--color-text-primary, #111827);
   ```

522. **HEX_6**: `#e5e7eb` (라인 5696)
   ```
   border-top: 1px dashed var(--color-border-light, #e5e7eb);
   ```

523. **HEX_6**: `#4b5563` (라인 5699)
   ```
   color: var(--color-text-secondary, #4b5563);
   ```

524. **HEX_6**: `#dc2626` (라인 5771)
   ```
   background: var(--mg-error-600, #dc2626);
   ```

525. **HEX_6**: `#e5e7eb` (라인 5781)
   ```
   border: 1px solid var(--color-border-light, #e5e7eb);
   ```

526. **HEX_6**: `#3b82f6` (라인 5799)
   ```
   border-color: var(--color-border-focus, #3b82f6);
   ```

527. **HEX_6**: `#111827` (라인 5828)
   ```
   color: var(--color-text-primary, #111827);
   ```

528. **HEX_6**: `#4b5563` (라인 5836)
   ```
   color: var(--color-text-secondary, #4b5563);
   ```

529. **HEX_6**: `#6b7280` (라인 5969)
   ```
   --color-text-secondary: #6b7280; /* 회색 - 비활성 */
   ```

530. **HEX_6**: `#764ba2` (라인 8242)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

531. **HEX_6**: `#f5576c` (라인 8247)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

532. **HEX_6**: `#4facfe` (라인 8252)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

533. **HEX_6**: `#00f2fe` (라인 8252)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

534. **HEX_6**: `#fa709a` (라인 8257)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

535. **HEX_6**: `#fee140` (라인 8257)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

536. **HEX_6**: `#a8edea` (라인 8262)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

537. **HEX_6**: `#fed6e3` (라인 8262)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

538. **HEX_6**: `#ffecd2` (라인 8267)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

539. **HEX_6**: `#fcb69f` (라인 8267)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

540. **HEX_6**: `#764ba2` (라인 8272)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

541. **HEX_6**: `#4facfe` (라인 8277)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

542. **HEX_6**: `#00f2fe` (라인 8277)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

543. **HEX_6**: `#fa709a` (라인 8282)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

544. **HEX_6**: `#fee140` (라인 8282)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

545. **HEX_6**: `#764ba2` (라인 8287)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

546. **HEX_6**: `#ffecd2` (라인 8292)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

547. **HEX_6**: `#fcb69f` (라인 8292)
   ```
   background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
   ```

548. **HEX_6**: `#a8edea` (라인 8297)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

549. **HEX_6**: `#fed6e3` (라인 8297)
   ```
   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
   ```

550. **HEX_6**: `#764ba2` (라인 10384)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

551. **HEX_6**: `#3f51b5` (라인 10436)
   ```
   background: linear-gradient(135deg, #3f51b5 0%, #1e3a8a 100%);
   ```

552. **HEX_6**: `#1e3a8a` (라인 10436)
   ```
   background: linear-gradient(135deg, #3f51b5 0%, #1e3a8a 100%);
   ```

553. **HEX_6**: `#a8e6a3` (라인 11472)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

554. **HEX_6**: `#7dd87a` (라인 11472)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

555. **HEX_6**: `#a8e6a3` (라인 11709)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

556. **HEX_6**: `#7dd87a` (라인 11709)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

557. **HEX_6**: `#c82333` (라인 12029)
   ```
   background-color: var(--mg-error-600, #c82333);
   ```

558. **HEX_6**: `#e5e7eb` (라인 12076)
   ```
   border-bottom: 1px solid var(--cs-gray-200, #e5e7eb);
   ```

559. **HEX_6**: `#111827` (라인 12083)
   ```
   color: var(--cs-gray-900, #111827);
   ```

560. **HEX_6**: `#6b7280` (라인 12091)
   ```
   color: var(--cs-gray-500, #6b7280);
   ```

561. **HEX_6**: `#f3f4f6` (라인 12100)
   ```
   background-color: var(--cs-gray-100, #f3f4f6);
   ```

562. **HEX_6**: `#374151` (라인 12101)
   ```
   color: var(--cs-gray-700, #374151);
   ```

563. **HEX_6**: `#e5e7eb` (라인 12110)
   ```
   border-top: 1px solid var(--cs-gray-200, #e5e7eb);
   ```

564. **HEX_6**: `#495057` (라인 12196)
   ```
   color: #495057;
   ```

565. **HEX_6**: `#495057` (라인 12229)
   ```
   color: #495057;
   ```

566. **HEX_6**: `#495057` (라인 12349)
   ```
   color: #495057;
   ```

567. **HEX_6**: `#e1e5e9` (라인 12642)
   ```
   border: 2px solid #e1e5e9;
   ```

568. **HEX_6**: `#495057` (라인 12646)
   ```
   color: #495057;
   ```

569. **HEX_6**: `#e9ecef` (라인 12737)
   ```
   border: 2px solid #e9ecef;
   ```

570. **HEX_6**: `#e9ecef` (라인 12750)
   ```
   border: 1px solid #e9ecef;
   ```

571. **HEX_6**: `#e9ecef` (라인 12774)
   ```
   background: #e9ecef;
   ```

572. **HEX_6**: `#e9ecef` (라인 12859)
   ```
   border: 1px solid #e9ecef;
   ```

573. **HEX_6**: `#495057` (라인 12880)
   ```
   color: #495057;
   ```

574. **HEX_6**: `#e5e7eb` (라인 12891)
   ```
   border: 1px solid #e5e7eb;
   ```

575. **HEX_6**: `#a8e6a3` (라인 12914)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

576. **HEX_6**: `#7dd87a` (라인 12914)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

577. **HEX_6**: `#1f2937` (라인 12932)
   ```
   color: #1f2937;
   ```

578. **HEX_6**: `#6B6B6B` (라인 12937)
   ```
   color: #6B6B6B;
   ```

579. **HEX_6**: `#f3f4f6` (라인 12959)
   ```
   border-top: 1px solid #f3f4f6;
   ```

580. **HEX_6**: `#6B6B6B` (라인 12961)
   ```
   color: #6B6B6B;
   ```

581. **HEX_6**: `#a8e6a3` (라인 13085)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

582. **HEX_6**: `#7dd87a` (라인 13085)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

583. **HEX_6**: `#a8e6a3` (라인 13458)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

584. **HEX_6**: `#7dd87a` (라인 13458)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

585. **HEX_6**: `#a8e6a3` (라인 13692)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

586. **HEX_6**: `#7dd87a` (라인 13692)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

587. **HEX_6**: `#a8e6a3` (라인 13813)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

588. **HEX_6**: `#7dd87a` (라인 13813)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

589. **HEX_6**: `#6b7280` (라인 14737)
   ```
   color: var(--color-text-secondary, #6b7280);
   ```

590. **HEX_6**: `#1f2937` (라인 14751)
   ```
   color: var(--color-text-primary, #1f2937);
   ```

591. **HEX_6**: `#a8e6a3` (라인 15054)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

592. **HEX_6**: `#7dd87a` (라인 15054)
   ```
   background: linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%);
   ```

593. **HEX_6**: `#764ba2` (라인 16272)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

594. **HEX_6**: `#0056b3` (라인 16604)
   ```
   background-color: #0056b3;
   ```

595. **HEX_6**: `#0056b3` (라인 16605)
   ```
   border-color: #0056b3;
   ```

596. **HEX_6**: `#FFE5E5` (라인 17029)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

597. **HEX_6**: `#FFF8E1` (라인 17029)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

598. **HEX_6**: `#FFE5E5` (라인 17063)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

599. **HEX_6**: `#FFF8E1` (라인 17063)
   ```
   background: linear-gradient(135deg, #FFE5E5 0%, #FFF8E1 100%);
   ```

600. **HEX_6**: `#FFB6C1` (라인 17130)
   ```
   background: #FFB6C1;
   ```

601. **HEX_6**: `#98E4D8` (라인 17134)
   ```
   background: #98E4D8;
   ```

602. **HEX_6**: `#A8D8EA` (라인 17138)
   ```
   background: #A8D8EA;
   ```

603. **HEX_6**: `#FFE5B4` (라인 17142)
   ```
   background: #FFE5B4;
   ```

604. **HEX_6**: `#FF69B4` (라인 17175)
   ```
   color: #FF69B4;
   ```

605. **HEX_6**: `#fbbf24` (라인 17553)
   ```
   .mg-v2-radio-color[data-color="#fbbf24"] {
   ```

606. **HEX_6**: `#fbbf24` (라인 17554)
   ```
   background-color: #fbbf24;
   ```

607. **HEX_6**: `#e9ecef` (라인 17652)
   ```
   border: 1px solid #e9ecef;
   ```

608. **HEX_6**: `#e9ecef` (라인 17678)
   ```
   border: 1px solid #e9ecef;
   ```

609. **HEX_6**: `#e9ecef` (라인 17690)
   ```
   background: linear-gradient(135deg, var(--mg-gray-100) 0%, #e9ecef 100%);
   ```

610. **HEX_6**: `#e9ecef` (라인 17691)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

611. **HEX_6**: `#2c3e50` (라인 17720)
   ```
   color: #2c3e50;
   ```

612. **HEX_6**: `#e9ecef` (라인 17746)
   ```
   border: 1px solid #e9ecef;
   ```

613. **HEX_6**: `#2c3e50` (라인 17753)
   ```
   color: #2c3e50;
   ```

614. **HEX_6**: `#e9ecef` (라인 17781)
   ```
   border-top: 1px solid #e9ecef;
   ```

615. **HEX_6**: `#3498db` (라인 17797)
   ```
   border: 1px solid #3498db;
   ```

616. **HEX_6**: `#3498db` (라인 17799)
   ```
   color: #3498db;
   ```

617. **HEX_6**: `#3498db` (라인 17804)
   ```
   background: #3498db;
   ```

618. **HEX_6**: `#3498db` (라인 17817)
   ```
   border: 1px solid #3498db;
   ```

619. **HEX_6**: `#3498db` (라인 17819)
   ```
   color: #3498db;
   ```

620. **HEX_6**: `#3498db` (라인 17825)
   ```
   background: #3498db;
   ```

621. **HEX_6**: `#3498db` (라인 17831)
   ```
   color: #3498db;
   ```

622. **HEX_6**: `#495057` (라인 17845)
   ```
   color: #495057;
   ```

623. **HEX_6**: `#495057` (라인 17876)
   ```
   color: #495057;
   ```

624. **HEX_6**: `#e9ecef` (라인 17878)
   ```
   background-color: #e9ecef;
   ```

625. **HEX_6**: `#495057` (라인 17906)
   ```
   color: #495057;
   ```

626. **HEX_6**: `#e9ecef` (라인 17942)
   ```
   border: 1px solid #e9ecef;
   ```

627. **HEX_6**: `#495057` (라인 17947)
   ```
   color: #495057;
   ```

628. **HEX_6**: `#e9ecef` (라인 17963)
   ```
   border-bottom: 1px solid #e9ecef;
   ```

629. **HEX_6**: `#495057` (라인 17965)
   ```
   color: #495057;
   ```

630. **HEX_6**: `#495057` (라인 17979)
   ```
   color: #495057;
   ```

631. **HEX_6**: `#495057` (라인 17984)
   ```
   color: #495057;
   ```

632. **HEX_6**: `#e5e7eb` (라인 18001)
   ```
   border: 1px solid #e5e7eb;
   ```

633. **HEX_6**: `#0056b3` (라인 18017)
   ```
   color: #0056b3;
   ```

634. **HEX_6**: `#2c3e50` (라인 18072)
   ```
   color: #2c3e50;
   ```

635. **HEX_6**: `#e2e8f0` (라인 18155)
   ```
   border: 2px solid #e2e8f0;
   ```

636. **HEX_6**: `#f7fafc` (라인 18169)
   ```
   background-color: #f7fafc;
   ```

637. **HEX_6**: `#718096` (라인 18179)
   ```
   color: #718096;
   ```

638. **HEX_6**: `#f7fafc` (라인 18185)
   ```
   background-color: #f7fafc;
   ```

639. **HEX_6**: `#e2e8f0` (라인 18189)
   ```
   border: 1px solid #e2e8f0;
   ```

640. **HEX_6**: `#4a5568` (라인 18194)
   ```
   color: #4a5568;
   ```

641. **HEX_6**: `#764ba2` (라인 18205)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

642. **HEX_6**: `#cbd5e0` (라인 18219)
   ```
   background: #cbd5e0;
   ```

643. **HEX_6**: `#48bb78` (라인 18226)
   ```
   background-color: #48bb78;
   ```

644. **HEX_6**: `#2d3748` (라인 18266)
   ```
   color: #2d3748;
   ```

645. **HEX_6**: `#2d3748` (라인 18273)
   ```
   color: #2d3748;
   ```

646. **HEX_6**: `#718096` (라인 18279)
   ```
   color: #718096;
   ```

647. **HEX_6**: `#764ba2` (라인 18291)
   ```
   background: linear-gradient(135deg, var(--mg-primary-500) 0%, #764ba2 100%);
   ```

648. **HEX_6**: `#e1e5e9` (라인 18307)
   ```
   border: 2px solid #e1e5e9;
   ```

649. **HEX_6**: `#5a6268` (라인 18333)
   ```
   background-color: #5a6268;
   ```

650. **HEX_6**: `#2c3e50` (라인 18351)
   ```
   color: #2c3e50;
   ```

651. **HEX_6**: `#0056b3` (라인 18374)
   ```
   background-color: #0056b3;
   ```

652. **HEX_6**: `#e8f4fd` (라인 18425)
   ```
   background: #e8f4fd;
   ```

653. **HEX_6**: `#bee5eb` (라인 18426)
   ```
   border: 1px solid #bee5eb;
   ```

654. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 143)
   ```
   --cs-brand-primary-light: rgba(108, 92, 231, 0.1);
   ```

655. **RGBA**: `rgba(108, 92, 231, 0.2)` (라인 144)
   ```
   --cs-brand-primary-hover-bg: rgba(108, 92, 231, 0.2);
   ```

656. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 145)
   ```
   --cs-brand-outline: rgba(108, 92, 231, 0.1);
   ```

657. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 153)
   ```
   --cs-bg-hover: rgba(0, 0, 0, 0.05);
   ```

658. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 198)
   ```
   --cs-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

659. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 202)
   ```
   --cs-shadow-dark: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
   ```

660. **RGBA**: `rgba(59, 130, 246, 0.12)` (라인 203)
   ```
   --cs-shadow-primary: 0 8px 20px rgba(59, 130, 246, 0.12);
   ```

661. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 204)
   ```
   --cs-shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

662. **RGBA**: `rgba(255, 107, 53, 0.12)` (라인 205)
   ```
   --cs-shadow-orange: 0 2px 8px rgba(255, 107, 53, 0.12);
   ```

663. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 206)
   ```
   --cs-shadow-error: 0 4px 15px rgba(220, 53, 69, 0.4);
   ```

664. **RGBA**: `rgba(220, 53, 69, 0.6)` (라인 207)
   ```
   --cs-shadow-error-strong: 0 6px 20px rgba(220, 53, 69, 0.6);
   ```

665. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 208)
   ```
   --cs-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

666. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 209)
   ```
   --cs-shadow-sm-multi: 0 1px 3px var(--mg-shadow-light), 0 1px 2px rgba(0, 0, 0, 0.06);
   ```

667. **RGBA**: `rgba(0, 0, 0, 0.07)` (라인 210)
   ```
   --cs-shadow-md-multi: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

668. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 210)
   ```
   --cs-shadow-md-multi: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

669. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 211)
   ```
   --cs-shadow-lg-multi: 0 10px 15px var(--mg-shadow-light), 0 4px 6px rgba(0, 0, 0, 0.05);
   ```

670. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 212)
   ```
   --cs-shadow-xl-multi: 0 20px 25px var(--mg-shadow-light), 0 10px 10px rgba(0, 0, 0, 0.04);
   ```

671. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 213)
   ```
   --cs-shadow-xxl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

672. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 214)
   ```
   --cs-shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
   ```

673. **RGBA**: `rgba(108, 92, 231, 0.1)` (라인 215)
   ```
   --cs-shadow-outline: 0 0 0 3px rgba(108, 92, 231, 0.1);
   ```

674. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 218)
   ```
   --cs-glass-light: rgba(255, 255, 255, 0.8);
   ```

675. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 219)
   ```
   --cs-glass-strong: rgba(255, 255, 255, 0.95);
   ```

676. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 221)
   ```
   --cs-glass-medium: rgba(255, 255, 255, 0.6);
   ```

677. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 222)
   ```
   --cs-glass-light-subtle: rgba(255, 255, 255, 0.1);
   ```

678. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 223)
   ```
   --cs-glass-dark-subtle: rgba(0, 0, 0, 0.04);
   ```

679. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 224)
   ```
   --cs-glass-blue-light: rgba(0, 122, 255, 0.1);
   ```

680. **RGBA**: `rgba(255, 107, 53, 0.1)` (라인 225)
   ```
   --cs-glass-orange-light: rgba(255, 107, 53, 0.1);
   ```

681. **RGBA**: `rgba(255, 248, 245, 0.95)` (라인 226)
   ```
   --cs-glass-orange-bg: rgba(255, 248, 245, 0.95);
   ```

682. **RGBA**: `rgba(255, 107, 53, 0.08)` (라인 227)
   ```
   --cs-glass-orange-border: rgba(255, 107, 53, 0.08);
   ```

683. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 228)
   ```
   --cs-glass-gray-light: rgba(107, 114, 128, 0.1);
   ```

684. **RGBA**: `rgba(226, 232, 240, 0.5)` (라인 229)
   ```
   --cs-glass-slate-border: rgba(226, 232, 240, 0.5);
   ```

685. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 230)
   ```
   --cs-glass-dark-strong: rgba(0, 0, 0, 0.3);
   ```

686. **RGBA**: `rgba(250, 250, 250, 0.98)` (라인 231)
   ```
   --cs-glass-light-strong: rgba(250, 250, 250, 0.98);
   ```

687. **RGBA**: `rgba(209, 209, 214, 0.8)` (라인 232)
   ```
   --cs-glass-gray-border: rgba(209, 209, 214, 0.8);
   ```

688. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 233)
   ```
   --cs-glass-white-90: rgba(255, 255, 255, 0.9);
   ```

689. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 234)
   ```
   --cs-glass-white-80: rgba(255, 255, 255, 0.8);
   ```

690. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 235)
   ```
   --cs-glass-primary-40: rgba(102, 126, 234, 0.4);
   ```

691. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 236)
   ```
   --cs-glass-primary-30: rgba(102, 126, 234, 0.3);
   ```

692. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 237)
   ```
   --cs-glass-primary-20: rgba(102, 126, 234, 0.2);
   ```

693. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 238)
   ```
   --cs-glass-primary-10: rgba(102, 126, 234, 0.1);
   ```

694. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 239)
   ```
   --cs-glass-slate-border-60: rgba(226, 232, 240, 0.6);
   ```

695. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 240)
   ```
   --cs-glass-dark-60: rgba(0, 0, 0, 0.6);
   ```

696. **RGBA**: `rgba(0, 0, 0, 0.1)` (라인 386)
   ```
   --mg-shadow-light: rgba(0, 0, 0, 0.1);
   ```

697. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 411)
   ```
   --tenant-primary-light: rgba(59, 130, 246, 0.2);
   ```

698. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 468)
   ```
   --shadow-hover-primary: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

699. **RGBA**: `rgba(142, 142, 147, 0.12)` (라인 483)
   ```
   --ipad-btn-secondary: rgba(142, 142, 147, 0.12);
   ```

700. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 495)
   ```
   --color-success-light: rgba(16, 185, 129, 0.1);
   ```

701. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 513)
   ```
   --color-danger-light: rgba(239, 68, 68, 0.1);
   ```

702. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 536)
   ```
   --color-warning-light: rgba(245, 158, 11, 0.1);
   ```

703. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 553)
   ```
   --color-info-light: rgba(59, 130, 246, 0.1);
   ```

704. **RGBA**: `rgba(230, 245, 255, 0.5)` (라인 596)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

705. **RGBA**: `rgba(240, 250, 255, 0.5)` (라인 596)
   ```
   --bg-gradient-cool: linear-gradient(135deg, rgba(230, 245, 255, 0.5), rgba(240, 250, 255, 0.5));
   ```

706. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 597)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

707. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 597)
   ```
   --bg-gradient-warm: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

708. **RGBA**: `rgba(255, 250, 240, 0.5)` (라인 598)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

709. **RGBA**: `rgba(255, 255, 250, 0.5)` (라인 598)
   ```
   --bg-gradient-warm-light: linear-gradient(135deg, rgba(255, 250, 240, 0.5), rgba(255, 255, 250, 0.5));
   ```

710. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 599)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

711. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 599)
   ```
   --bg-gradient-warm-subtle: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

712. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 604)
   ```
   --droplet-bg: rgba(255, 255, 255, 0.7);
   ```

713. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 605)
   ```
   --droplet-bg-dark: rgba(0, 0, 0, 0.4);
   ```

714. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 607)
   ```
   --glass-bg: rgba(255, 255, 255, 0.2);
   ```

715. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 608)
   ```
   --glass-bg-light: rgba(0, 0, 0, 0.25);
   ```

716. **RGBA**: `rgba(0, 0, 0, 0.35)` (라인 609)
   ```
   --glass-bg-medium: rgba(0, 0, 0, 0.35);
   ```

717. **RGBA**: `rgba(0, 0, 0, 0.45)` (라인 610)
   ```
   --glass-bg-strong: rgba(0, 0, 0, 0.45);
   ```

718. **RGBA**: `rgba(255, 215, 0, 0.1)` (라인 611)
   ```
   --grade-expert-bg: rgba(255, 215, 0, 0.1);
   ```

719. **RGBA**: `rgba(205, 127, 50, 0.1)` (라인 612)
   ```
   --grade-junior-bg: rgba(205, 127, 50, 0.1);
   ```

720. **RGBA**: `rgba(229, 228, 226, 0.1)` (라인 613)
   ```
   --grade-master-bg: rgba(229, 228, 226, 0.1);
   ```

721. **RGBA**: `rgba(192, 192, 192, 0.1)` (라인 614)
   ```
   --grade-senior-bg: rgba(192, 192, 192, 0.1);
   ```

722. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 617)
   ```
   --ipad-card-bg: rgba(255, 255, 255, 0.9);
   ```

723. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 620)
   ```
   --role-admin-bg: rgba(59, 130, 246, 0.1);
   ```

724. **RGBA**: `rgba(107, 114, 128, 0.1)` (라인 621)
   ```
   --role-client-bg: rgba(107, 114, 128, 0.1);
   ```

725. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 622)
   ```
   --role-consultant-bg: rgba(139, 92, 246, 0.1);
   ```

726. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 623)
   ```
   --status-assigned-bg: rgba(139, 92, 246, 0.1);
   ```

727. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 624)
   ```
   --status-cancelled-bg: rgba(239, 68, 68, 0.1);
   ```

728. **RGBA**: `rgba(5, 150, 105, 0.1)` (라인 625)
   ```
   --status-completed-bg: rgba(5, 150, 105, 0.1);
   ```

729. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 626)
   ```
   --status-confirmed-bg: rgba(59, 130, 246, 0.1);
   ```

730. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 627)
   ```
   --status-in-progress-bg: rgba(16, 185, 129, 0.1);
   ```

731. **RGBA**: `rgba(251, 191, 36, 0.1)` (라인 628)
   ```
   --status-requested-bg: rgba(251, 191, 36, 0.1);
   ```

732. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 629)
   ```
   --vacation-annual-bg: rgba(59, 130, 246, 0.1);
   ```

733. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 630)
   ```
   --vacation-personal-bg: rgba(139, 92, 246, 0.1);
   ```

734. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 631)
   ```
   --vacation-sick-bg: rgba(239, 68, 68, 0.1);
   ```

735. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 634)
   ```
   --border-pink-light: rgba(255, 182, 193, 0.2);
   ```

736. **RGBA**: `rgba(255, 182, 193, 0.4)` (라인 635)
   ```
   --border-pink-medium: rgba(255, 182, 193, 0.4);
   ```

737. **RGBA**: `rgba(135, 206, 235, 0.2)` (라인 646)
   ```
   --border-sky-light: rgba(135, 206, 235, 0.2);
   ```

738. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 658)
   ```
   --droplet-border: rgba(255, 255, 255, 0.3);
   ```

739. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 659)
   ```
   --glass-border: rgba(255, 255, 255, 0.2);
   ```

740. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 660)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.2);
   ```

741. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 666)
   ```
   --ipad-card-border: rgba(0, 0, 0, 0.05);
   ```

742. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 678)
   ```
   --ipad-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

743. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 679)
   ```
   --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

744. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 682)
   ```
   --shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   ```

745. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 683)
   ```
   --shadow-glass-strong: 0 8px 32px 0 rgba(31, 38, 135, 0.5);
   ```

746. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 684)
   ```
   --shadow-gold: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

747. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 685)
   ```
   --shadow-gold-sm: 0 2px 8px rgba(255, 215, 0, 0.3);
   ```

748. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 689)
   ```
   --shadow-mint-sm: 0 2px 8px rgba(152, 216, 200, 0.3);
   ```

749. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 691)
   ```
   --shadow-peach: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

750. **RGBA**: `rgba(255, 182, 193, 0.3)` (라인 692)
   ```
   --shadow-pink-sm: 0 2px 8px rgba(255, 182, 193, 0.3);
   ```

751. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 693)
   ```
   --shadow-sky: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

752. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 694)
   ```
   --shadow-sky-sm: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

753. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 696)
   ```
   --shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

754. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 697)
   ```
   --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```

755. **RGBA**: `rgba(147, 197, 253, 0.15)` (라인 905)
   ```
   --droplet-pattern-1: radial-gradient(ellipse at 23% 47%, rgba(147, 197, 253, 0.15), transparent 65%);
   ```

756. **RGBA**: `rgba(251, 191, 36, 0.12)` (라인 906)
   ```
   --droplet-pattern-2: radial-gradient(ellipse at 78% 23%, rgba(251, 191, 36, 0.12), transparent 58%);
   ```

757. **RGBA**: `rgba(239, 68, 68, 0.18)` (라인 907)
   ```
   --droplet-pattern-3: radial-gradient(ellipse at 42% 81%, rgba(239, 68, 68, 0.18), transparent 62%);
   ```

758. **RGBA**: `rgba(139, 92, 246, 0.14)` (라인 908)
   ```
   --droplet-pattern-4: radial-gradient(ellipse at 61% 38%, rgba(139, 92, 246, 0.14), transparent 60%);
   ```

759. **RGBA**: `rgba(34, 197, 94, 0.12)` (라인 909)
   ```
   --droplet-pattern-5: radial-gradient(ellipse at 35% 15%, rgba(34, 197, 94, 0.12), transparent 55%);
   ```

760. **RGBA**: `rgba(236, 72, 153, 0.16)` (라인 910)
   ```
   --droplet-pattern-6: radial-gradient(ellipse at 15% 65%, rgba(236, 72, 153, 0.16), transparent 68%);
   ```

761. **RGBA**: `rgba(99, 102, 241, 0.13)` (라인 911)
   ```
   --droplet-pattern-7: radial-gradient(ellipse at 85% 72%, rgba(99, 102, 241, 0.13), transparent 64%);
   ```

762. **RGBA**: `rgba(99, 102, 241, 0.08)` (라인 912)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

763. **RGBA**: `rgba(236, 72, 153, 0.12)` (라인 912)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

764. **RGBA**: `rgba(0,0,0,0.05)` (라인 1169)
   ```
   --mg-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
   ```

765. **RGBA**: `rgba(0,0,0,0.07)` (라인 1170)
   ```
   --mg-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
   ```

766. **RGBA**: `rgba(0,0,0,0.1)` (라인 1171)
   ```
   --mg-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
   ```

767. **RGBA**: `rgba(0,0,0,0.12)` (라인 1172)
   ```
   --mg-shadow-xl: 0 20px 25px rgba(0,0,0,0.12);
   ```

768. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 1754)
   ```
   --glass-bg: rgba(255, 255, 255, 0.2);
   ```

769. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 1755)
   ```
   --glass-border: rgba(255, 255, 255, 0.2);
   ```

770. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 1763)
   ```
   --droplet-bg: rgba(255, 255, 255, 0.7);
   ```

771. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 1764)
   ```
   --droplet-bg-dark: rgba(0, 0, 0, 0.4);
   ```

772. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 1765)
   ```
   --droplet-border: rgba(255, 255, 255, 0.3);
   ```

773. **RGBA**: `rgba(147, 197, 253, 0.15)` (라인 1771)
   ```
   --droplet-pattern-1: radial-gradient(ellipse at 23% 47%, rgba(147, 197, 253, 0.15), transparent 65%);
   ```

774. **RGBA**: `rgba(251, 191, 36, 0.12)` (라인 1772)
   ```
   --droplet-pattern-2: radial-gradient(ellipse at 78% 23%, rgba(251, 191, 36, 0.12), transparent 58%);
   ```

775. **RGBA**: `rgba(239, 68, 68, 0.18)` (라인 1773)
   ```
   --droplet-pattern-3: radial-gradient(ellipse at 42% 81%, rgba(239, 68, 68, 0.18), transparent 62%);
   ```

776. **RGBA**: `rgba(139, 92, 246, 0.14)` (라인 1774)
   ```
   --droplet-pattern-4: radial-gradient(ellipse at 61% 38%, rgba(139, 92, 246, 0.14), transparent 60%);
   ```

777. **RGBA**: `rgba(34, 197, 94, 0.12)` (라인 1775)
   ```
   --droplet-pattern-5: radial-gradient(ellipse at 35% 15%, rgba(34, 197, 94, 0.12), transparent 55%);
   ```

778. **RGBA**: `rgba(236, 72, 153, 0.16)` (라인 1776)
   ```
   --droplet-pattern-6: radial-gradient(ellipse at 15% 65%, rgba(236, 72, 153, 0.16), transparent 68%);
   ```

779. **RGBA**: `rgba(99, 102, 241, 0.13)` (라인 1777)
   ```
   --droplet-pattern-7: radial-gradient(ellipse at 85% 72%, rgba(99, 102, 241, 0.13), transparent 64%);
   ```

780. **RGBA**: `rgba(99, 102, 241, 0.08)` (라인 1778)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

781. **RGBA**: `rgba(236, 72, 153, 0.12)` (라인 1778)
   ```
   --droplet-pattern-blend: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.12));
   ```

782. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 1971)
   ```
   --shadow-hover-primary: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

783. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 1983)
   ```
   --shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.25);
   ```

784. **RGBA**: `rgba(255, 192, 203, 0.15)` (라인 2029)
   ```
   rgba(255, 192, 203, 0.15),  /* 연분홍 - 더 연하게 */
   ```

785. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 2030)
   ```
   rgba(255, 223, 186, 0.12), /* 복숭아 - 더 연하게 */
   ```

786. **RGBA**: `rgba(255, 192, 203, 0.15)` (라인 2031)
   ```
   rgba(255, 192, 203, 0.15)   /* 연분홍 - 더 연하게 */
   ```

787. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 2054)
   ```
   rgba(255, 223, 186, 0.12), /* 복숭아 - 더 연하게 */
   ```

788. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 2055)
   ```
   rgba(255, 239, 213, 0.1),  /* 연한 복숭아 - 더 연하게 */
   ```

789. **RGBA**: `rgba(255, 223, 186, 0.12)` (라인 2056)
   ```
   rgba(255, 223, 186, 0.12)  /* 복숭아 - 더 연하게 */
   ```

790. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 2067)
   ```
   rgba(255, 239, 213, 0.1),  /* 연한 복숭아 - 더 연하게 */
   ```

791. **RGBA**: `rgba(255, 250, 205, 0.08)` (라인 2068)
   ```
   rgba(255, 250, 205, 0.08), /* 연노랑 - 더 연하게 */
   ```

792. **RGBA**: `rgba(255, 239, 213, 0.1)` (라인 2069)
   ```
   rgba(255, 239, 213, 0.1)   /* 연한 복숭아 - 더 연하게 */
   ```

793. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 2094)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

794. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2096)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

795. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 2143)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

796. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 2312)
   ```
   background: rgba(128, 128, 0, 0.1);
   ```

797. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 2361)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

798. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2363)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

799. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 2368)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

800. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 2445)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

801. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 2469)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

802. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 2488)
   ```
   box-shadow: 0 0 0 3px rgba(152, 251, 152, 0.2);
   ```

803. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 2517)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

804. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 2519)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

805. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2525)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

806. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 2544)
   ```
   rgba(255, 255, 255, 0.1) 0%,
   ```

807. **RGBA**: `rgba(255, 255, 255, 0.05)` (라인 2545)
   ```
   rgba(255, 255, 255, 0.05) 100%);
   ```

808. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 2552)
   ```
   border-color: rgba(255, 255, 255, 0.4);
   ```

809. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 2555)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

810. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 2562)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

811. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2564)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

812. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2583)
   ```
   rgba(255, 255, 255, 0.3) 0%,
   ```

813. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 2584)
   ```
   rgba(255, 255, 255, 0.1) 100%);
   ```

814. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 2590)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

815. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2591)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

816. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 2652)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

817. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2654)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

818. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 2690)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

819. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 2692)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

820. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 2706)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

821. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 3170)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

822. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 3178)
   ```
   border-color: rgba(255, 255, 255, 0.3);
   ```

823. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4666)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

824. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 4668)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

825. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 4678)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

826. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 4680)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

827. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4911)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

828. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 4937)
   ```
   background: rgba(152, 251, 152, 0.1);
   ```

829. **RGBA**: `rgba(152, 251, 152, 0.3)` (라인 4938)
   ```
   box-shadow: 0 8px 25px rgba(152, 251, 152, 0.3);
   ```

830. **RGBA**: `rgba(239, 68, 68, 0.05)` (라인 4944)
   ```
   background: rgba(239, 68, 68, 0.05);
   ```

831. **RGBA**: `rgba(255, 149, 0, 0.1)` (라인 4952)
   ```
   background: rgba(255, 149, 0, 0.1);
   ```

832. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 4958)
   ```
   border: 1px solid rgba(255, 149, 0, 0.3);
   ```

833. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 4962)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

834. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 4964)
   ```
   border: 1px solid rgba(239, 68, 68, 0.3);
   ```

835. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 4970)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

836. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4972)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

837. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 5015)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

838. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 5037)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

839. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 5039)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

840. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 5074)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

841. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 5075)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

842. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 5081)
   ```
   background: rgba(152, 251, 152, 0.1);
   ```

843. **RGBA**: `rgba(152, 251, 152, 0.3)` (라인 5082)
   ```
   box-shadow: 0 8px 25px rgba(152, 251, 152, 0.3);
   ```

844. **RGBA**: `rgba(239, 68, 68, 0.05)` (라인 5088)
   ```
   background: rgba(239, 68, 68, 0.05);
   ```

845. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 5114)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

846. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 5119)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

847. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5133)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

848. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 5135)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

849. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 5146)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

850. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5148)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

851. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 5356)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

852. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 5383)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

853. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5385)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

854. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5388)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
   ```

855. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 5395)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

856. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 5396)
   ```
   box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
   ```

857. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 5459)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

858. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5498)
   ```
   box-shadow: var(--ad-b0kla-shadow-hover, 0 4px 12px rgba(0, 0, 0, 0.08));
   ```

859. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5609)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
   ```

860. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5798)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
   ```

861. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 5875)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

862. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 5877)
   ```
   border: 1px solid rgba(255, 255, 255, 0.6);
   ```

863. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5880)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
   ```

864. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 5887)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

865. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 5888)
   ```
   box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
   ```

866. **RGBA**: `rgba(16, 185, 129, 0.1)` (라인 5972)
   ```
   --color-success-light: rgba(16, 185, 129, 0.1);
   ```

867. **RGBA**: `rgba(245, 158, 11, 0.1)` (라인 5973)
   ```
   --color-warning-light: rgba(245, 158, 11, 0.1);
   ```

868. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 5974)
   ```
   --color-info-light: rgba(59, 130, 246, 0.1);
   ```

869. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 5975)
   ```
   --color-danger-light: rgba(239, 68, 68, 0.1);
   ```

870. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 6057)
   ```
   background: var(--card-bg, rgba(255, 255, 255, 0.6));
   ```

871. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 6058)
   ```
   border: 1px solid var(--card-border, rgba(255, 255, 255, 0.5));
   ```

872. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6082)
   ```
   border-bottom: 1px solid var(--border-color, rgba(139, 69, 19, 0.1));
   ```

873. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6125)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

874. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 6523)
   ```
   border-top: 1px solid var(--border-color, rgba(139, 69, 19, 0.1));
   ```

875. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 6980)
   ```
   background: var(--mint-green-light, rgba(152, 251, 152, 0.2));
   ```

876. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 7101)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

877. **RGBA**: `rgba(152, 251, 152, 0.2)` (라인 7143)
   ```
   background: rgba(152, 251, 152, 0.2);
   ```

878. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 7161)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

879. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 7188)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

880. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 7300)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

881. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 7302)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

882. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 7314)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

883. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 7532)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

884. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 7570)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

885. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 7590)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

886. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 7592)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

887. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 7604)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

888. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 7643)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

889. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 7685)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

890. **RGBA**: `rgba(152, 251, 152, 0.1)` (라인 8071)
   ```
   box-shadow: 0 2px 4px rgba(152, 251, 152, 0.1);
   ```

891. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 8395)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

892. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 8397)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

893. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 8404)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

894. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 8411)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

895. **RGBA**: `rgba(182, 229, 216, 0.3)` (라인 8413)
   ```
   box-shadow: 0 0 0 2px rgba(182, 229, 216, 0.3);
   ```

896. **RGBA**: `rgba(182, 229, 216, 0.4)` (라인 8476)
   ```
   box-shadow: 0 4px 12px rgba(182, 229, 216, 0.4);
   ```

897. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 8484)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

898. **RGBA**: `rgba(182, 229, 216, 0.1)` (라인 8540)
   ```
   background: rgba(182, 229, 216, 0.1);
   ```

899. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 8561)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

900. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 8595)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

901. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 8596)
   ```
   border: 1px solid rgba(139, 69, 19, 0.1);
   ```

902. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 8603)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

903. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 8670)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

904. **RGBA**: `rgba(255, 235, 205, 0.3)` (라인 8676)
   ```
   background: rgba(255, 235, 205, 0.3);
   ```

905. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 8678)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

906. **RGBA**: `rgba(182, 229, 216, 0.3)` (라인 8682)
   ```
   background: rgba(182, 229, 216, 0.3);
   ```

907. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 8688)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

908. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 8690)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

909. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 8694)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

910. **RGBA**: `rgba(107, 107, 107, 0.3)` (라인 8696)
   ```
   border: 1px solid rgba(107, 107, 107, 0.3);
   ```

911. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 8700)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

912. **RGBA**: `rgba(107, 107, 107, 0.2)` (라인 8702)
   ```
   border: 1px solid rgba(107, 107, 107, 0.2);
   ```

913. **RGBA**: `rgba(255, 235, 205, 0.3)` (라인 8707)
   ```
   background: rgba(255, 235, 205, 0.3);
   ```

914. **RGBA**: `rgba(139, 69, 19, 0.3)` (라인 8709)
   ```
   border: 1px solid rgba(139, 69, 19, 0.3);
   ```

915. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 8713)
   ```
   background: rgba(182, 229, 216, 0.2);
   ```

916. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 8719)
   ```
   background: rgba(139, 69, 19, 0.1);
   ```

917. **RGBA**: `rgba(139, 69, 19, 0.4)` (라인 8721)
   ```
   border: 1px solid rgba(139, 69, 19, 0.4);
   ```

918. **RGBA**: `rgba(107, 107, 107, 0.1)` (라인 8725)
   ```
   background: rgba(107, 107, 107, 0.1);
   ```

919. **RGBA**: `rgba(107, 107, 107, 0.2)` (라인 8727)
   ```
   border: 1px solid rgba(107, 107, 107, 0.2);
   ```

920. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 8734)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

921. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 8736)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

922. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 8747)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

923. **RGBA**: `rgba(182, 229, 216, 0.1)` (라인 8755)
   ```
   background: rgba(182, 229, 216, 0.1);
   ```

924. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 8830)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
   ```

925. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 8872)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

926. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 9078)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
   ```

927. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 9119)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

928. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 9521)
   ```
   box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
   ```

929. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 9640)
   ```
   box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
   ```

930. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 10392)
   ```
   text-shadow: 0 1px 2px rgba(0, 123, 255, 0.3);
   ```

931. **RGBA**: `rgba(59, 130, 246, 0.05)` (라인 10815)
   ```
   background: rgba(59, 130, 246, 0.05) !important;
   ```

932. **RGBA**: `rgba(0, 0, 0, 0.98)` (라인 12052)
   ```
   background-color: rgba(0, 0, 0, 0.98);
   ```

933. **RGBA**: `rgba(40, 167, 69, 0.3)` (라인 12122)
   ```
   box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
   ```

934. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 12135)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

935. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 12147)
   ```
   box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
   ```

936. **RGBA**: `rgba(0,0,0,0.1)` (라인 12330)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

937. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 12408)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

938. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 12410)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

939. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 12426)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

940. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 12427)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

941. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 12542)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

942. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 12579)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

943. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 12580)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

944. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 12605)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

945. **RGBA**: `rgba(0,0,0,0.1)` (라인 12680)
   ```
   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   ```

946. **RGBA**: `rgba(16, 185, 129, 0.15)` (라인 12901)
   ```
   box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
   ```

947. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 13384)
   ```
   border-bottom: 1px solid rgba(139, 69, 19, 0.1);
   ```

948. **RGBA**: `rgba(23, 162, 184, 0.1)` (라인 13403)
   ```
   background-color: rgba(23, 162, 184, 0.1);
   ```

949. **RGBA**: `rgba(220, 53, 69, 0.1)` (라인 13408)
   ```
   background-color: rgba(220, 53, 69, 0.1);
   ```

950. **RGBA**: `rgba(40, 167, 69, 0.1)` (라인 13413)
   ```
   background-color: rgba(40, 167, 69, 0.1);
   ```

951. **RGBA**: `rgba(139, 69, 19, 0.1)` (라인 13424)
   ```
   border-top: 1px solid rgba(139, 69, 19, 0.1);
   ```

952. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 13519)
   ```
   background: rgba(255, 255, 255, 0.6);
   ```

953. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 13521)
   ```
   border: 1px solid rgba(255, 255, 255, 0.5);
   ```

954. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 14701)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

955. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 14750)
   ```
   background-color: var(--color-bg-hover, rgba(0, 0, 0, 0.05));
   ```

956. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 14773)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

957. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 15038)
   ```
   box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
   ```

958. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 15079)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
   ```

959. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 15748)
   ```
   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
   ```

960. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 15979)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

961. **RGBA**: `rgba(128, 128, 0, 0.1)` (라인 16167)
   ```
   box-shadow: 0 0 0 2px rgba(128, 128, 0, 0.1);
   ```

962. **RGBA**: `rgba(227, 242, 253, 0.5)` (라인 16293)
   ```
   background: rgba(227, 242, 253, 0.5);
   ```

963. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 16380)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
   ```

964. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 16395)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

965. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 16593)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

966. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 16923)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

967. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 17042)
   ```
   background: radial-gradient(circle, rgba(255, 182, 193, 0.2) 0%, transparent 70%);
   ```

968. **RGBA**: `rgba(182, 229, 216, 0.2)` (라인 17055)
   ```
   background: radial-gradient(circle, rgba(182, 229, 216, 0.2) 0%, transparent 70%);
   ```

969. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 17067)
   ```
   box-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
   ```

970. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 17089)
   ```
   background: radial-gradient(circle, rgba(255, 182, 193, 0.1) 0%, transparent 70%);
   ```

971. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 17102)
   ```
   box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
   ```

972. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 17147)
   ```
   box-shadow: 0 8px 30px rgba(255, 182, 193, 0.25);
   ```

973. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 17155)
   ```
   box-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
   ```

974. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 17169)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.2);
   ```

975. **RGBA**: `rgba(255, 182, 193, 0.15)` (라인 17206)
   ```
   box-shadow: 0 2px 8px rgba(255, 182, 193, 0.15);
   ```

976. **RGBA**: `rgba(255, 182, 193, 0.25)` (라인 17211)
   ```
   box-shadow: 0 8px 30px rgba(255, 182, 193, 0.25);
   ```

977. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 17333)
   ```
   background-color: rgba(255, 255, 255, 0.8);
   ```

978. **RGBA**: `rgba(220, 53, 69, 0.25)` (라인 17447)
   ```
   box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
   ```

979. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 17675)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

980. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 18165)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

981. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 18215)
   ```
   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
   ```

982. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 18376)
   ```
   box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
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

### 📁 `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css` (CSS)

**하드코딩 색상**: 47개

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

4. **HEX_6**: `#eff6ff` (라인 57)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

5. **HEX_6**: `#f0fdf4` (라인 62)
   ```
   background-color: var(--mg-v2-color-success-50, #f0fdf4);
   ```

6. **HEX_6**: `#16a34a` (라인 63)
   ```
   color: var(--mg-v2-color-success-600, #16a34a);
   ```

7. **HEX_6**: `#fffbeb` (라인 67)
   ```
   background-color: var(--mg-v2-color-warning-50, #fffbeb);
   ```

8. **HEX_6**: `#d97706` (라인 68)
   ```
   color: var(--mg-v2-color-warning-600, #d97706);
   ```

9. **HEX_6**: `#f0f9ff` (라인 72)
   ```
   background-color: var(--mg-v2-color-info-50, #f0f9ff);
   ```

10. **HEX_6**: `#0284c7` (라인 73)
   ```
   color: var(--mg-v2-color-info-600, #0284c7);
   ```

11. **HEX_6**: `#111827` (라인 89)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

12. **HEX_6**: `#9ca3af` (라인 96)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

13. **HEX_6**: `#111827` (라인 142)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

14. **HEX_6**: `#f3f4f6` (라인 174)
   ```
   border: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

15. **HEX_6**: `#9ca3af` (라인 189)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

16. **HEX_6**: `#111827` (라인 199)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

17. **HEX_6**: `#f0fdf4` (라인 220)
   ```
   background-color: var(--mg-v2-color-success-50, #f0fdf4);
   ```

18. **HEX_6**: `#15803d` (라인 221)
   ```
   color: var(--mg-v2-color-success-700, #15803d);
   ```

19. **HEX_6**: `#fffbeb` (라인 225)
   ```
   background-color: var(--mg-v2-color-warning-50, #fffbeb);
   ```

20. **HEX_6**: `#b45309` (라인 226)
   ```
   color: var(--mg-v2-color-warning-700, #b45309);
   ```

21. **HEX_6**: `#f3f4f6` (라인 240)
   ```
   border-bottom: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

22. **HEX_6**: `#eff6ff` (라인 254)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

23. **HEX_6**: `#111827` (라인 265)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

24. **HEX_6**: `#9ca3af` (라인 272)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

25. **HEX_6**: `#9ca3af` (라인 287)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

26. **HEX_6**: `#dbeafe` (라인 320)
   ```
   background-color: var(--mg-v2-color-primary-100, #dbeafe);
   ```

27. **HEX_6**: `#93c5fd` (라인 327)
   ```
   background-color: var(--mg-v2-color-primary-300, #93c5fd);
   ```

28. **HEX_6**: `#f3f4f6` (라인 361)
   ```
   border: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

29. **HEX_6**: `#eff6ff` (라인 377)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

30. **HEX_6**: `#bfdbfe` (라인 378)
   ```
   border: 2px solid var(--mg-v2-color-primary-200, #bfdbfe);
   ```

31. **HEX_6**: `#dbeafe` (라인 395)
   ```
   background-color: var(--mg-v2-color-primary-100, #dbeafe);
   ```

32. **HEX_6**: `#f3f4f6` (라인 420)
   ```
   border: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
   ```

33. **HEX_6**: `#eff6ff` (라인 425)
   ```
   background-color: var(--mg-v2-color-primary-50, #eff6ff);
   ```

34. **HEX_6**: `#bfdbfe` (라인 426)
   ```
   border: 2px solid var(--mg-v2-color-primary-200, #bfdbfe);
   ```

35. **HEX_6**: `#dbeafe` (라인 431)
   ```
   background-color: var(--mg-v2-color-primary-100, #dbeafe);
   ```

36. **HEX_6**: `#9ca3af` (라인 452)
   ```
   color: var(--mg-v2-color-text-tertiary, #9ca3af);
   ```

37. **HEX_6**: `#111827` (라인 472)
   ```
   color: var(--mg-v2-color-text-primary, #111827);
   ```

38. **HEX_6**: `#F5F3EF` (라인 522)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

39. **HEX_6**: `#8B7355` (라인 546)
   ```
   color: var(--mg-color-accent-main, #8B7355);
   ```

40. **HEX_6**: `#FEF3C7` (라인 608)
   ```
   background: var(--mg-color-warning-light, #FEF3C7);
   ```

41. **HEX_6**: `#F5F3EF` (라인 671)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

42. **HEX_6**: `#fd7e14` (라인 739)
   ```
   background: #fd7e14;
   ```

43. **HEX_6**: `#F5F3EF` (라인 803)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

44. **RGBA**: `rgba(0,0,0,0.05)` (라인 38)
   ```
   box-shadow: var(--mg-v2-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
   ```

45. **RGBA**: `rgba(0,0,0,0.05)` (라인 128)
   ```
   box-shadow: var(--mg-v2-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
   ```

46. **RGBA**: `rgba(0, 0, 0, 0.02)` (라인 371)
   ```
   background-color: var(--mg-v2-color-background-hover, rgba(0, 0, 0, 0.02));
   ```

47. **RGBA**: `rgba(239, 68, 68, 0.02)` (라인 869)
   ```
   background: rgba(239, 68, 68, 0.02);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/content/ContentKpiRow.css` (CSS)

**하드코딩 색상**: 35개

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

15. **HEX_6**: `#64748b` (라인 137)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

16. **HEX_6**: `#ebf2ee` (라인 150)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

17. **HEX_6**: `#4b745c` (라인 151)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

18. **HEX_6**: `#fcf3ed` (라인 155)
   ```
   background: var(--ad-b0kla-orange-bg, #fcf3ed);
   ```

19. **HEX_6**: `#e8a87c` (라인 156)
   ```
   color: var(--ad-b0kla-orange, #e8a87c);
   ```

20. **HEX_6**: `#f0f5f9` (라인 160)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

21. **HEX_6**: `#6d9dc5` (라인 161)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

22. **HEX_6**: `#2d3748` (라인 167)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

23. **HEX_6**: `#64748b` (라인 182)
   ```
   color: var(--ad-b0kla-text-secondary, #64748b);
   ```

24. **HEX_6**: `#ebf2ee` (라인 194)
   ```
   background: var(--ad-b0kla-green-bg, #ebf2ee);
   ```

25. **HEX_6**: `#4b745c` (라인 195)
   ```
   color: var(--ad-b0kla-green, #4b745c);
   ```

26. **HEX_6**: `#fcf3ed` (라인 199)
   ```
   background: var(--ad-b0kla-orange-bg, #fcf3ed);
   ```

27. **HEX_6**: `#e8a87c` (라인 200)
   ```
   color: var(--ad-b0kla-orange, #e8a87c);
   ```

28. **HEX_6**: `#f0f5f9` (라인 204)
   ```
   background: var(--ad-b0kla-blue-bg, #f0f5f9);
   ```

29. **HEX_6**: `#6d9dc5` (라인 205)
   ```
   color: var(--ad-b0kla-blue, #6d9dc5);
   ```

30. **HEX_6**: `#edf2f7` (라인 209)
   ```
   background: #edf2f7;
   ```

31. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 24)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 8px 24px rgba(0, 0, 0, 0.05));
   ```

32. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 46)
   ```
   box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
   ```

33. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 61)
   ```
   box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
   ```

34. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 72)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 8px 24px rgba(0, 0, 0, 0.05));
   ```

35. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 78)
   ```
   box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
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

### 📁 `frontend/src/components/common/MGStats.css` (CSS)

**하드코딩 색상**: 33개

1. **HEX_6**: `#ea580c` (라인 52)
   ```
   color: #ea580c;
   ```

2. **HEX_6**: `#16a34a` (라인 57)
   ```
   color: #16a34a;
   ```

3. **HEX_6**: `#9333ea` (라인 62)
   ```
   color: #9333ea;
   ```

4. **HEX_6**: `#15803d` (라인 78)
   ```
   color: #15803d;
   ```

5. **HEX_6**: `#111827` (라인 105)
   ```
   color: #111827;
   ```

6. **HEX_6**: `#ea580c` (라인 142)
   ```
   stroke: #ea580c;
   ```

7. **HEX_6**: `#16a34a` (라인 147)
   ```
   stroke: #16a34a;
   ```

8. **HEX_6**: `#9333ea` (라인 152)
   ```
   stroke: #9333ea;
   ```

9. **HEX_6**: `#60a5fa` (라인 267)
   ```
   color: #60a5fa;
   ```

10. **HEX_6**: `#fb923c` (라인 272)
   ```
   color: #fb923c;
   ```

11. **HEX_6**: `#4ade80` (라인 277)
   ```
   color: #4ade80;
   ```

12. **HEX_6**: `#a78bfa` (라인 282)
   ```
   color: #a78bfa;
   ```

13. **HEX_6**: `#4ade80` (라인 287)
   ```
   color: #4ade80;
   ```

14. **HEX_6**: `#f87171` (라인 292)
   ```
   color: #f87171;
   ```

15. **RGBA**: `rgba(226, 232, 240, 0.8)` (라인 8)
   ```
   border: 1px solid rgba(226, 232, 240, 0.8);
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 10)
   ```
   box-shadow: 0 1px 3px 0 var(--mg-shadow-light), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 15)
   ```
   box-shadow: 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   ```

18. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 46)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

19. **RGBA**: `rgba(249, 115, 22, 0.1)` (라인 51)
   ```
   background: rgba(249, 115, 22, 0.1);
   ```

20. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 56)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

21. **RGBA**: `rgba(147, 51, 234, 0.1)` (라인 61)
   ```
   background: rgba(147, 51, 234, 0.1);
   ```

22. **RGBA**: `rgba(34, 197, 94, 0.1)` (라인 77)
   ```
   background: rgba(34, 197, 94, 0.1);
   ```

23. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 82)
   ```
   background: rgba(239, 68, 68, 0.1);
   ```

24. **RGBA**: `rgba(26, 32, 44, 0.95)` (라인 256)
   ```
   background: rgba(26, 32, 44, 0.95);
   ```

25. **RGBA**: `rgba(74, 85, 104, 0.6)` (라인 257)
   ```
   border-color: rgba(74, 85, 104, 0.6);
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 258)
   ```
   box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 var(--mg-shadow-medium);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 262)
   ```
   box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px var(--mg-shadow-medium);
   ```

28. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 266)
   ```
   background: rgba(59, 130, 246, 0.2);
   ```

29. **RGBA**: `rgba(249, 115, 22, 0.2)` (라인 271)
   ```
   background: rgba(249, 115, 22, 0.2);
   ```

30. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 276)
   ```
   background: rgba(34, 197, 94, 0.2);
   ```

31. **RGBA**: `rgba(147, 51, 234, 0.2)` (라인 281)
   ```
   background: rgba(147, 51, 234, 0.2);
   ```

32. **RGBA**: `rgba(34, 197, 94, 0.2)` (라인 286)
   ```
   background: rgba(34, 197, 94, 0.2);
   ```

33. **RGBA**: `rgba(239, 68, 68, 0.2)` (라인 291)
   ```
   background: rgba(239, 68, 68, 0.2);
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

### 📁 `frontend/src/components/erd/ErdDetailPage.css` (CSS)

**하드코딩 색상**: 30개

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

25. **HEX_6**: `#f0f0f0` (라인 162)
   ```
   background-color: var(--bg-hover, #f0f0f0);
   ```

26. **HEX_6**: `#f0f0f0` (라인 342)
   ```
   background: var(--bg-hover, #f0f0f0);
   ```

27. **HEX_6**: `#c82333` (라인 438)
   ```
   background: var(--error-hover, #c82333);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 15)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

29. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 222)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

30. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 393)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/admin/system/SystemTools.css` (CSS)

**하드코딩 색상**: 30개

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

19. **HEX_6**: `#FFB3D1` (라인 107)
   ```
   border-color: #FFB3D1;
   ```

20. **HEX_6**: `#FFE8F0` (라인 108)
   ```
   background: linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 100%);
   ```

21. **HEX_6**: `#FFD6E8` (라인 108)
   ```
   background: linear-gradient(135deg, #FFE8F0 0%, #FFD6E8 100%);
   ```

22. **HEX_6**: `#4ECDC4` (라인 118)
   ```
   color: #4ECDC4;
   ```

23. **HEX_6**: `#A6E6E1` (라인 119)
   ```
   border-color: #A6E6E1;
   ```

24. **HEX_6**: `#E8F8F7` (라인 120)
   ```
   background: linear-gradient(135deg, #E8F8F7 0%, #D6F2F0 100%);
   ```

25. **HEX_6**: `#D6F2F0` (라인 120)
   ```
   background: linear-gradient(135deg, #E8F8F7 0%, #D6F2F0 100%);
   ```

26. **HEX_6**: `#4ECDC4` (라인 124)
   ```
   background: linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%);
   ```

27. **HEX_6**: `#3BB5AC` (라인 124)
   ```
   background: linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%);
   ```

28. **HEX_6**: `#4ECDC4` (라인 126)
   ```
   border-color: #4ECDC4;
   ```

29. **RGBA**: `rgba(107, 115, 255, 0.08)` (라인 17)
   ```
   box-shadow: 0 2px 8px rgba(107, 115, 255, 0.08);
   ```

30. **RGBA**: `rgba(107, 115, 255, 0.15)` (라인 24)
   ```
   box-shadow: 0 4px 16px rgba(107, 115, 255, 0.15);
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

### 📁 `frontend/src/components/ops/PgApprovalManagement.css` (CSS)

**하드코딩 색상**: 29개

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

15. **HEX_6**: `#4a90e2` (라인 88)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

16. **HEX_6**: `#4a90e2` (라인 105)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

17. **HEX_6**: `#4a90e2` (라인 187)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

18. **HEX_6**: `#d1ecf1` (라인 234)
   ```
   background: #d1ecf1;
   ```

19. **HEX_6**: `#0c5460` (라인 235)
   ```
   color: #0c5460;
   ```

20. **HEX_6**: `#155724` (라인 291)
   ```
   color: #155724;
   ```

21. **HEX_6**: `#155724` (라인 458)
   ```
   color: #155724;
   ```

22. **HEX_6**: `#4a90e2` (라인 485)
   ```
   accent-color: var(--mg-primary, #4a90e2);
   ```

23. **HEX_6**: `#4a90e2` (라인 528)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

24. **HEX_6**: `#4a90e2` (라인 604)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

25. **HEX_6**: `#4a90e2` (라인 687)
   ```
   background: var(--mg-primary, #4a90e2);
   ```

26. **HEX_6**: `#357abd` (라인 697)
   ```
   background: #357abd;
   ```

27. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 89)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 331)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

29. **RGBA**: `rgba(74, 144, 226, 0.1)` (라인 529)
   ```
   box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
   ```

---

### 📁 `frontend/src/styles/auth/UnifiedLogin.css` (CSS)

**하드코딩 색상**: 28개

1. **HEX_6**: `#4A6354` (라인 18)
   ```
   background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'), linear-gradient(135deg, var(--mg-primary-color, var(--mg-color-primary-main)) 0%, var(--mg-primary-light, #4A6354) 100%);
   ```

2. **HEX_6**: `#555555` (라인 73)
   ```
   color: var(--mg-text-secondary, #555555);
   ```

3. **HEX_6**: `#4f6b5a` (라인 136)
   ```
   background-color: var(--mg-primary-light, #4f6b5a);
   ```

4. **HEX_6**: `#4f6b5a` (라인 137)
   ```
   background: var(--mg-primary-light, #4f6b5a);
   ```

5. **HEX_6**: `#F5F3EF` (라인 165)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

6. **HEX_6**: `#4F6B5A` (라인 218)
   ```
   background-color: var(--mg-primary-light, #4F6B5A);
   ```

7. **HEX_6**: `#fee500` (라인 283)
   ```
   --oauth-kakao-bg: #fee500;
   ```

8. **HEX_6**: `#e6cf00` (라인 284)
   ```
   --oauth-kakao-bg-hover: #e6cf00;
   ```

9. **HEX_6**: `#02a84e` (라인 287)
   ```
   --oauth-naver-bg-hover: #02a84e;
   ```

10. **HEX_6**: `#6ee7b7` (라인 420)
   ```
   border: 1px solid #6ee7b7;
   ```

11. **HEX_6**: `#fde68a` (라인 426)
   ```
   border: 1px solid #fde68a;
   ```

12. **RGBA**: `rgba(44, 44, 44, 0.4)` (라인 36)
   ```
   background: rgba(44, 44, 44, 0.4);
   ```

13. **RGBA**: `rgba(250, 249, 247, 0.94)` (라인 45)
   ```
   background: rgba(250, 249, 247, 0.94);
   ```

14. **RGBA**: `rgba(61, 82, 70, 0.12)` (라인 46)
   ```
   border: 1px solid rgba(61, 82, 70, 0.12);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.65)` (라인 53)
   ```
   0 1px 0 rgba(255, 255, 255, 0.65) inset,
   ```

16. **RGBA**: `rgba(20, 28, 24, 0.15)` (라인 54)
   ```
   0 10px 40px rgba(20, 28, 24, 0.15);
   ```

17. **RGBA**: `rgba(61, 82, 70, 0.12)` (라인 69)
   ```
   border-top: 1px solid rgba(61, 82, 70, 0.12);
   ```

18. **RGBA**: `rgba(61, 82, 70, 0.1)` (라인 179)
   ```
   box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1);
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 285)
   ```
   --oauth-kakao-text: rgba(0, 0, 0, 0.85);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 303)
   ```
   box-shadow: var(--cs-shadow-soft, 0 4px 12px rgba(0, 0, 0, 0.08));
   ```

21. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 310)
   ```
   box-shadow: var(--cs-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.06));
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 322)
   ```
   box-shadow: var(--cs-shadow-soft, 0 4px 12px rgba(0, 0, 0, 0.12));
   ```

23. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 329)
   ```
   box-shadow: var(--cs-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.08));
   ```

24. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 334)
   ```
   color: rgba(0, 0, 0, 0.85);
   ```

25. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 340)
   ```
   color: rgba(0, 0, 0, 0.85);
   ```

26. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 342)
   ```
   box-shadow: var(--cs-shadow-soft, 0 4px 12px rgba(0, 0, 0, 0.06));
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 349)
   ```
   box-shadow: var(--cs-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.06));
   ```

28. **RGBA**: `rgba(0, 0, 0, 0.85)` (라인 372)
   ```
   color: rgba(0, 0, 0, 0.85) !important;
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

### 📁 `frontend/src/components/admin/VacationStatistics.js` (JS)

**하드코딩 색상**: 28개

1. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 178)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(52, 199, 89, 0.2) -> var(--mg-custom-color)
   ```

2. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 179)
   ```
   '연차': 'rgba(52, 199, 89, 0.2)',        // 연한 초록 (연차)
   ```

3. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 180)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
   ```

4. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 181)
   ```
   '반차': 'rgba(255, 149, 0, 0.2)',         // 연한 노랑 (반차)
   ```

5. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 182)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

6. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 183)
   ```
   '반반차': 'rgba(0, 122, 255, 0.2)',       // 연한 파랑 (반반차)
   ```

7. **RGBA**: `rgba(88, 86, 214, 0.2)` (라인 184)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(88, 86, 214, 0.2) -> var(--mg-custom-color)
   ```

8. **RGBA**: `rgba(88, 86, 214, 0.2)` (라인 185)
   ```
   '개인사정': 'rgba(88, 86, 214, 0.2)',     // 연한 보라 (개인사정)
   ```

9. **RGBA**: `rgba(255, 59, 48, 0.2)` (라인 186)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 59, 48, 0.2) -> var(--mg-custom-color)
   ```

10. **RGBA**: `rgba(255, 59, 48, 0.2)` (라인 187)
   ```
   '병가': 'rgba(255, 59, 48, 0.2)',         // 연한 빨강 (병가)
   ```

11. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 188)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(52, 199, 89, 0.2) -> var(--mg-custom-color)
   ```

12. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 189)
   ```
   '하루 종일 휴가': 'rgba(52, 199, 89, 0.2)',  // 연한 초록 (종일 휴가)
   ```

13. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 190)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.15) -> var(--mg-custom-color)
   ```

14. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 191)
   ```
   '사용자 정의 휴가': 'rgba(0, 122, 255, 0.15)', // 연한 하늘색 (사용자 정의)
   ```

15. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 193)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

16. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 194)
   ```
   '오전 반반차 1 (09:00-11:00)': 'rgba(0, 122, 255, 0.2)',
   ```

17. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 195)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

18. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 196)
   ```
   '오전 반반차 2 (11:00-13:00)': 'rgba(0, 122, 255, 0.2)',
   ```

19. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 197)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

20. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 198)
   ```
   '오후 반반차 1 (14:00-16:00)': 'rgba(0, 122, 255, 0.2)',
   ```

21. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 199)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 122, 255, 0.2) -> var(--mg-custom-color)
   ```

22. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 200)
   ```
   '오후 반반차 2 (16:00-18:00)': 'rgba(0, 122, 255, 0.2)',
   ```

23. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 201)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
   ```

24. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 202)
   ```
   '오전반차': 'rgba(255, 149, 0, 0.2)',
   ```

25. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 203)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 149, 0, 0.2) -> var(--mg-custom-color)
   ```

26. **RGBA**: `rgba(255, 149, 0, 0.2)` (라인 204)
   ```
   '오후반차': 'rgba(255, 149, 0, 0.2)'
   ```

27. **RGBA**: `rgba(248, 249, 250, 0.5)` (라인 206)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(248, 249, 250, 0.5) -> var(--mg-custom-color)
   ```

28. **RGBA**: `rgba(248, 249, 250, 0.5)` (라인 207)
   ```
   return colors[type] || 'rgba(248, 249, 250, 0.5)'; // 기본 연한 회색
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_modals.css` (CSS)

**하드코딩 색상**: 27개

1. **HEX_6**: `#0d9488` (라인 312)
   ```
   border-top-color: var(--color-primary, var(--ad-b0kla-green, #0d9488));
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 31)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 35)
   ```
   border: 1px solid rgba(255, 255, 255, 0.4);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 38)
   ```
   0 0 0 1px rgba(255, 255, 255, 0.2),
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 39)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 82)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 83)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 123)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 131)
   ```
   border-top: 1px solid rgba(0, 0, 0, 0.08);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 132)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 139)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 144)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 148)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 152)
   ```
   background: rgba(255, 255, 255, 0.98);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 157)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 257)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 347)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

18. **RGBA**: `rgba(255, 193, 7, 0.1)` (라인 392)
   ```
   background: rgba(255, 193, 7, 0.1);
   ```

19. **RGBA**: `rgba(255, 193, 7, 0.2)` (라인 394)
   ```
   border: 1px solid rgba(255, 193, 7, 0.2);
   ```

20. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 430)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 432)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 437)
   ```
   border: 1px solid rgba(0, 0, 0, 0.08);
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 439)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

24. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 454)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

25. **RGBA**: `rgba(59, 130, 246, 0.2)` (라인 455)
   ```
   box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
   ```

26. **RGBA**: `rgba(248, 249, 250, 0.9)` (라인 461)
   ```
   background: rgba(248, 249, 250, 0.9);
   ```

27. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 467)
   ```
   border-color: rgba(0, 0, 0, 0.08);
   ```

---

### 📁 `frontend/src/components/admin/WellnessManagement.css` (CSS)

**하드코딩 색상**: 26개

1. **HEX_6**: `#FFB6C1` (라인 91)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

2. **HEX_6**: `#FFC0CB` (라인 91)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

3. **HEX_6**: `#FFA0B0` (라인 96)
   ```
   background: linear-gradient(135deg, #FFA0B0, #FFB0C0);
   ```

4. **HEX_6**: `#FFB0C0` (라인 96)
   ```
   background: linear-gradient(135deg, #FFA0B0, #FFB0C0);
   ```

5. **HEX_6**: `#FFD700` (라인 146)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

6. **HEX_6**: `#FFA500` (라인 146)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

7. **HEX_6**: `#4682B4` (라인 151)
   ```
   background: linear-gradient(135deg, var(--mg-info-500), #4682B4);
   ```

8. **HEX_6**: `#98D8C8` (라인 156)
   ```
   background: linear-gradient(135deg, #98D8C8, #6BCF7F);
   ```

9. **HEX_6**: `#6BCF7F` (라인 156)
   ```
   background: linear-gradient(135deg, #98D8C8, #6BCF7F);
   ```

10. **HEX_6**: `#DDA0DD` (라인 161)
   ```
   background: linear-gradient(135deg, #DDA0DD, #BA55D3);
   ```

11. **HEX_6**: `#BA55D3` (라인 161)
   ```
   background: linear-gradient(135deg, #DDA0DD, #BA55D3);
   ```

12. **HEX_6**: `#FFB6C1` (라인 393)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

13. **HEX_6**: `#FFC0CB` (라인 393)
   ```
   background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

15. **RGBA**: `rgba(255, 215, 0, 0.3)` (라인 147)
   ```
   box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
   ```

16. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 152)
   ```
   box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
   ```

17. **RGBA**: `rgba(152, 216, 200, 0.3)` (라인 157)
   ```
   box-shadow: 0 4px 12px rgba(152, 216, 200, 0.3);
   ```

18. **RGBA**: `rgba(221, 160, 221, 0.3)` (라인 162)
   ```
   box-shadow: 0 4px 12px rgba(221, 160, 221, 0.3);
   ```

19. **RGBA**: `rgba(135, 206, 235, 0.05)` (라인 279)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

20. **RGBA**: `rgba(176, 224, 230, 0.05)` (라인 279)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

21. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 286)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

22. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 286)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

23. **RGBA**: `rgba(255, 182, 193, 0.05)` (라인 354)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.05), rgba(255, 192, 203, 0.05));
   ```

24. **RGBA**: `rgba(255, 192, 203, 0.05)` (라인 354)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.05), rgba(255, 192, 203, 0.05));
   ```

25. **RGBA**: `rgba(255, 182, 193, 0.1)` (라인 366)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(255, 192, 203, 0.1));
   ```

26. **RGBA**: `rgba(255, 192, 203, 0.1)` (라인 366)
   ```
   background: linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(255, 192, 203, 0.1));
   ```

---

### 📁 `frontend/src/styles/homepage/index.css` (CSS)

**하드코딩 색상**: 23개

1. **HEX_6**: `#718096` (라인 292)
   ```
   color: #718096;
   ```

2. **HEX_6**: `#f5576c` (라인 500)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

3. **HEX_6**: `#4facfe` (라인 504)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

4. **HEX_6**: `#00f2fe` (라인 504)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

5. **HEX_6**: `#fa709a` (라인 508)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

6. **HEX_6**: `#fee140` (라인 508)
   ```
   background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 19)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.98)` (라인 26)
   ```
   background: rgba(255, 255, 255, 0.98);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 128)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 134)
   ```
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 259)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 485)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

13. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 492)
   ```
   box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 514)
   ```
   background-color: rgba(255, 255, 255, 0.2);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 534)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 646)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 648)
   ```
   box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
   ```

18. **RGBA**: `rgba(255, 255, 255, 1)` (라인 652)
   ```
   background: rgba(255, 255, 255, 1);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 654)
   ```
   box-shadow: 0 8px 30px rgba(255, 255, 255, 0.4);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 658)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

21. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 660)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

22. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 665)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

23. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 666)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantSchedule.css` (CSS)

**하드코딩 색상**: 23개

1. **HEX_6**: `#45a049` (라인 36)
   ```
   background: linear-gradient(135deg, var(--color-success), #45a049);
   ```

2. **HEX_6**: `#F57C00` (라인 72)
   ```
   background: linear-gradient(135deg, var(--color-warning), #F57C00);
   ```

3. **HEX_6**: `#ffb300` (라인 183)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #ffb300 100%);
   ```

4. **HEX_6**: `#ffb300` (라인 194)
   ```
   background: linear-gradient(135deg, #ffb300 0%, #ffa000 100%);
   ```

5. **HEX_6**: `#ffa000` (라인 194)
   ```
   background: linear-gradient(135deg, #ffb300 0%, #ffa000 100%);
   ```

6. **HEX_6**: `#45a049` (라인 387)
   ```
   background: linear-gradient(135deg, var(--color-success), #45a049);
   ```

7. **RGB**: `rgb(76, 175, 80)` (라인 156)
   ```
   .fc-event[style*="background-color: rgb(76, 175, 80)"] {
   ```

8. **RGB**: `rgb(33, 150, 243)` (라인 162)
   ```
   .fc-event[style*="background-color: rgb(33, 150, 243)"] {
   ```

9. **RGB**: `rgb(255, 152, 0)` (라인 168)
   ```
   .fc-event[style*="background-color: rgb(255, 152, 0)"] {
   ```

10. **RGB**: `rgb(244, 67, 54)` (라인 174)
   ```
   .fc-event[style*="background-color: rgb(244, 67, 54)"] {
   ```

11. **RGBA**: `rgba(76, 175, 80, 0.3)` (라인 45)
   ```
   box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
   ```

12. **RGBA**: `rgba(76, 175, 80, 0.4)` (라인 50)
   ```
   box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
   ```

13. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 63)
   ```
   box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.4)` (라인 68)
   ```
   box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
   ```

15. **RGBA**: `rgba(255, 152, 0, 0.3)` (라인 81)
   ```
   box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
   ```

16. **RGBA**: `rgba(255, 152, 0, 0.4)` (라인 86)
   ```
   box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
   ```

17. **RGBA**: `rgba(255, 193, 7, 0.4)` (라인 185)
   ```
   box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
   ```

18. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 188)
   ```
   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
   ```

19. **RGBA**: `rgba(255, 193, 7, 0.5)` (라인 196)
   ```
   box-shadow: 0 4px 12px rgba(255, 193, 7, 0.5);
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 318)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

21. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 358)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   ```

22. **RGBA**: `rgba(76, 175, 80, 0.3)` (라인 389)
   ```
   box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
   ```

23. **RGBA**: `rgba(76, 175, 80, 0.4)` (라인 394)
   ```
   box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
   ```

---

### 📁 `frontend/src/components/academy/Academy.css` (CSS)

**하드코딩 색상**: 23개

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

13. **HEX_3**: `#ddd` (라인 277)
   ```
   border: 1px solid var(--color-border, #ddd);
   ```

14. **HEX_3**: `#666` (라인 294)
   ```
   color: var(--color-text-secondary, #666);
   ```

15. **HEX_3**: `#ddd` (라인 302)
   ```
   border-bottom: 1px solid var(--color-border, #ddd);
   ```

16. **HEX_6**: `#FEE500` (라인 253)
   ```
   background-color: #FEE500;
   ```

17. **HEX_6**: `#FEE500` (라인 255)
   ```
   border: 1px solid #FEE500;
   ```

18. **HEX_6**: `#FDD835` (라인 259)
   ```
   background-color: #FDD835;
   ```

19. **HEX_6**: `#FDD835` (라인 260)
   ```
   border-color: #FDD835;
   ```

20. **HEX_6**: `#02B350` (라인 270)
   ```
   background-color: #02B350;
   ```

21. **HEX_6**: `#02B350` (라인 271)
   ```
   border-color: #02B350;
   ```

22. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 46)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

23. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 142)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/tenant/PgConfigurationDetail.css` (CSS)

**하드코딩 색상**: 22개

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

10. **HEX_6**: `#155724` (라인 84)
   ```
   color: #155724;
   ```

11. **HEX_6**: `#e2e3e5` (라인 98)
   ```
   background: #e2e3e5;
   ```

12. **HEX_6**: `#383d41` (라인 99)
   ```
   color: #383d41;
   ```

13. **HEX_6**: `#d1ecf1` (라인 103)
   ```
   background: #d1ecf1;
   ```

14. **HEX_6**: `#0c5460` (라인 104)
   ```
   color: #0c5460;
   ```

15. **HEX_6**: `#4a90e2` (라인 164)
   ```
   color: var(--mg-primary, #4a90e2);
   ```

16. **HEX_6**: `#4a90e2` (라인 251)
   ```
   background: var(--mg-primary, #4a90e2);
   ```

17. **HEX_6**: `#357abd` (라인 261)
   ```
   background: #357abd;
   ```

18. **HEX_6**: `#4a90e2` (라인 340)
   ```
   border-left: 3px solid var(--mg-primary, #4a90e2);
   ```

19. **HEX_6**: `#155724` (라인 500)
   ```
   color: #155724;
   ```

20. **HEX_6**: `#4a90e2` (라인 544)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

21. **HEX_6**: `#4a90e2` (라인 549)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 410)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/admin/ModernDashboardEditor.css` (CSS)

**하드코딩 색상**: 22개

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

6. **HEX_6**: `#f1f5f9` (라인 45)
   ```
   background: var(--mg-bg-gradient-light, linear-gradient(135deg, var(--mg-color-background-main) 0%, #f1f5f9 100%));
   ```

7. **HEX_6**: `#22c55e` (라인 262)
   ```
   background: linear-gradient(135deg, var(--mg-success, #22c55e), var(--mg-success-dark, #16a34a));
   ```

8. **HEX_6**: `#16a34a` (라인 262)
   ```
   background: linear-gradient(135deg, var(--mg-success, #22c55e), var(--mg-success-dark, #16a34a));
   ```

9. **HEX_6**: `#4ade80` (라인 290)
   ```
   background: var(--mg-gradient-success, linear-gradient(135deg, #4ade80 0%, #22c55e 100%));
   ```

10. **HEX_6**: `#22c55e` (라인 290)
   ```
   background: var(--mg-gradient-success, linear-gradient(135deg, #4ade80 0%, #22c55e 100%));
   ```

11. **HEX_6**: `#fafbfc` (라인 324)
   ```
   background: linear-gradient(135deg, #fafbfc 0%, #f4f6f8 100%);
   ```

12. **HEX_6**: `#f4f6f8` (라인 324)
   ```
   background: linear-gradient(135deg, #fafbfc 0%, #f4f6f8 100%);
   ```

13. **HEX_6**: `#bfdbfe` (라인 331)
   ```
   background: var(--mg-drop-zone-bg, linear-gradient(135deg, var(--mg-color-info-100) 0%, #bfdbfe 100%));
   ```

14. **HEX_6**: `#9ca3af` (라인 505)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 81)
   ```
   background: var(--mg-input-overlay-bg, rgba(255, 255, 255, 0.2));
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 88)
   ```
   color: var(--mg-placeholder-on-dark, rgba(255, 255, 255, 0.8));
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 99)
   ```
   border: var(--mg-border-width, 1px) solid var(--mg-border-overlay-light, rgba(255, 255, 255, 0.3));
   ```

18. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 111)
   ```
   background: var(--mg-hover-overlay-light, rgba(255, 255, 255, 0.2));
   ```

19. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 217)
   ```
   box-shadow: var(--mg-shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
   ```

20. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 311)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

21. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 341)
   ```
   background: var(--mg-drop-zone-overlay, rgba(59, 130, 246, 0.1));
   ```

22. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 412)
   ```
   box-shadow: var(--mg-shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
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

### 📁 `frontend/src/components/common/SimpleHeader.css` (CSS)

**하드코딩 색상**: 19개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 3)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 4)
   ```
   border-bottom: 1px solid var(--cs-secondary-200, rgba(0, 0, 0, 0.08));
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 5)
   ```
   box-shadow: 0 1px 20px rgba(0, 0, 0, 0.08),
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 6)
   ```
   0 1px 3px rgba(0, 0, 0, 0.05);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 24)
   ```
   background: rgba(255, 255, 255, 0.85);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 27)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 28)
   ```
   box-shadow: 0 1px 10px rgba(0, 0, 0, 0.05);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 56)
   ```
   background: rgba(0, 0, 0, 0.05);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 128)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 129)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 142)
   ```
   border-color: rgba(255, 255, 255, 0.5);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 166)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 170)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.6)` (라인 182)
   ```
   border-color: rgba(255, 255, 255, 0.6);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 216)
   ```
   color: rgba(255, 255, 255, 0.8);
   ```

16. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 229)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

17. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 261)
   ```
   background: rgba(255, 255, 255, 0.15);
   ```

18. **RGBA**: `rgba(239, 68, 68, 0.4)` (라인 295)
   ```
   box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
   ```

19. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 296)
   ```
   border: 2px solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/wellness/WellnessNotificationDetail.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#FF8E8E` (라인 95)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

2. **HEX_6**: `#98D8C8` (라인 106)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

3. **HEX_6**: `#B4E7CE` (라인 106)
   ```
   background: linear-gradient(135deg, #98D8C8, #B4E7CE);
   ```

4. **HEX_6**: `#FF8E8E` (라인 111)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

5. **HEX_6**: `#FFD700` (라인 116)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

6. **HEX_6**: `#FFA500` (라인 116)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

7. **HEX_6**: `#6BB6D8` (라인 271)
   ```
   color: #6BB6D8;
   ```

8. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 44)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

9. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 44)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

10. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 64)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

11. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 64)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

12. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 91)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
   ```

13. **RGBA**: `rgba(255, 107, 107, 0.3)` (라인 97)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
   ```

14. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 201)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

15. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 201)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

16. **RGBA**: `rgba(135, 206, 235, 0.05)` (라인 285)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

17. **RGBA**: `rgba(176, 224, 230, 0.05)` (라인 285)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(176, 224, 230, 0.05));
   ```

18. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 342)
   ```
   box-shadow: 0 4px 16px rgba(255, 107, 157, 0.3);
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantAvailability.css` (CSS)

**하드코딩 색상**: 18개

1. **HEX_6**: `#3498db` (라인 36)
   ```
   color: #3498db;
   ```

2. **HEX_6**: `#7f8c8d` (라인 40)
   ```
   color: #7f8c8d;
   ```

3. **HEX_6**: `#3498db` (라인 67)
   ```
   background: #3498db;
   ```

4. **HEX_6**: `#2980b9` (라인 72)
   ```
   background: #2980b9;
   ```

5. **HEX_6**: `#7f8c8d` (라인 100)
   ```
   color: #7f8c8d;
   ```

6. **HEX_6**: `#7f8c8d` (라인 125)
   ```
   color: #7f8c8d;
   ```

7. **HEX_6**: `#3498db` (라인 184)
   ```
   background: #3498db;
   ```

8. **HEX_6**: `#3498db` (라인 257)
   ```
   color: #3498db;
   ```

9. **HEX_6**: `#3498db` (라인 258)
   ```
   border: 1px solid #3498db;
   ```

10. **HEX_6**: `#3498db` (라인 262)
   ```
   background: #3498db;
   ```

11. **HEX_6**: `#3498db` (라인 344)
   ```
   color: #3498db;
   ```

12. **HEX_6**: `#3498db` (라인 404)
   ```
   border-color: #3498db;
   ```

13. **HEX_6**: `#3498db` (라인 464)
   ```
   background: #3498db;
   ```

14. **HEX_6**: `#2980b9` (라인 469)
   ```
   background: #2980b9;
   ```

15. **HEX_6**: `#5a6268` (라인 479)
   ```
   background: #5a6268;
   ```

16. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 156)
   ```
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 315)
   ```
   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
   ```

18. **RGBA**: `rgba(52, 152, 219, 0.1)` (라인 405)
   ```
   box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
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

### 📁 `frontend/src/styles/dashboard/dashboard.css` (CSS)

**하드코딩 색상**: 17개

1. **HEX_6**: `#5a67d8` (라인 302)
   ```
   color: #5a67d8;
   ```

2. **HEX_6**: `#adb5bd` (라인 404)
   ```
   color: #adb5bd;
   ```

3. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 20)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 34)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 39)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 90)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 97)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

8. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 109)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 142)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 150)
   ```
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
   ```

11. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 204)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 234)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

13. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 285)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
   ```

14. **RGBA**: `rgba(102, 126, 234, 0.15)` (라인 292)
   ```
   box-shadow: 0 1px 4px rgba(102, 126, 234, 0.15);
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 317)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

16. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 358)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
   ```

17. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 370)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

---

### 📁 `frontend/src/components/tenant/PgConfigurationList.css` (CSS)

**하드코딩 색상**: 17개

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

9. **HEX_6**: `#4a90e2` (라인 92)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

10. **HEX_6**: `#4a90e2` (라인 174)
   ```
   border-color: var(--mg-primary, #4a90e2);
   ```

11. **HEX_6**: `#155724` (라인 217)
   ```
   color: #155724;
   ```

12. **HEX_6**: `#e2e3e5` (라인 231)
   ```
   background: #e2e3e5;
   ```

13. **HEX_6**: `#383d41` (라인 232)
   ```
   color: #383d41;
   ```

14. **HEX_6**: `#d1ecf1` (라인 236)
   ```
   background: #d1ecf1;
   ```

15. **HEX_6**: `#0c5460` (라인 237)
   ```
   color: #0c5460;
   ```

16. **HEX_6**: `#4a90e2` (라인 365)
   ```
   outline: 2px solid var(--mg-primary, #4a90e2);
   ```

17. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 299)
   ```
   box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/styles/common/tablet-profile-edit.css` (CSS)

**하드코딩 색상**: 16개

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

6. **HEX_6**: `#7C3AED` (라인 58)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500) 0%, #7C3AED 100%);
   ```

7. **HEX_6**: `#7C3AED` (라인 63)
   ```
   background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
   ```

8. **HEX_6**: `#6D28D9` (라인 63)
   ```
   background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
   ```

9. **RGBA**: `rgba(139, 92, 246, 0.3)` (라인 65)
   ```
   box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 97)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

11. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 126)
   ```
   box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
   ```

12. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 133)
   ```
   box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
   ```

13. **RGBA**: `rgba(139, 92, 246, 0.2)` (라인 171)
   ```
   box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 207)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

15. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 213)
   ```
   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
   ```

16. **RGBA**: `rgba(139, 92, 246, 0.1)` (라인 243)
   ```
   text-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/common/CustomSelect.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#cbd5e0` (라인 16)
   ```
   border: 1px solid #cbd5e0;
   ```

2. **HEX_6**: `#3182ce` (라인 26)
   ```
   border-color: #3182ce;
   ```

3. **HEX_6**: `#3182ce` (라인 31)
   ```
   border: 2px solid #3182ce;
   ```

4. **HEX_6**: `#3182ce` (라인 36)
   ```
   border: 2px solid #3182ce;
   ```

5. **HEX_6**: `#fff5f5` (라인 41)
   ```
   background: #fff5f5;
   ```

6. **HEX_6**: `#E8E8ED` (라인 102)
   ```
   border-bottom: 1px solid var(--color-border-secondary, #E8E8ED);
   ```

7. **HEX_6**: `#F5F5F7` (라인 163)
   ```
   background-color: var(--color-bg-secondary, #F5F5F7);
   ```

8. **HEX_6**: `#E8E8ED` (라인 172)
   ```
   background: var(--color-bg-accent, #E8E8ED);
   ```

9. **RGBA**: `rgba(49, 130, 206, 0.2)` (라인 32)
   ```
   box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
   ```

10. **RGBA**: `rgba(49, 130, 206, 0.2)` (라인 37)
   ```
   box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 70)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 75)
   ```
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   ```

13. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 116)
   ```
   box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 130)
   ```
   border-bottom: 1px solid rgba(0, 0, 0, 0.05);
   ```

15. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 138)
   ```
   background-color: rgba(0, 123, 255, 0.1);
   ```

16. **RGBA**: `rgba(0, 123, 255, 0.15)` (라인 143)
   ```
   background-color: rgba(0, 123, 255, 0.15);
   ```

---

### 📁 `frontend/src/components/admin/MappingManagement.css` (CSS)

**하드코딩 색상**: 16개

1. **HEX_6**: `#FAFAFA` (라인 15)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

2. **HEX_6**: `#0056CC` (라인 26)
   ```
   background: linear-gradient(135deg, var(--color-primary, var(--mg-primary-500)) 0%, var(--color-primary-hover, #0056CC) 100%);
   ```

3. **HEX_6**: `#424245` (라인 35)
   ```
   color: var(--color-text-secondary, #424245);
   ```

4. **HEX_6**: `#FAFAFA` (라인 40)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

5. **HEX_6**: `#424245` (라인 59)
   ```
   color: var(--color-text-secondary, #424245);
   ```

6. **HEX_6**: `#FAFAFA` (라인 86)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

7. **HEX_6**: `#F5F5F7` (라인 94)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

8. **HEX_6**: `#0056CC` (라인 130)
   ```
   background-color: var(--color-primary-hover, #0056CC);
   ```

9. **HEX_6**: `#5a6268` (라인 141)
   ```
   background-color: var(--color-gray-dark, #5a6268);
   ```

10. **HEX_6**: `#218838` (라인 151)
   ```
   background-color: var(--color-success-dark, #218838);
   ```

11. **HEX_6**: `#c82333` (라인 161)
   ```
   background-color: var(--color-danger-dark, #c82333);
   ```

12. **HEX_6**: `#e0a800` (라인 171)
   ```
   background-color: var(--color-warning-dark, #e0a800);
   ```

13. **HEX_6**: `#138496` (라인 181)
   ```
   background-color: var(--color-info-dark, #138496);
   ```

14. **HEX_6**: `#F5F5F7` (라인 280)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

15. **HEX_6**: `#F5F5F7` (라인 293)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

16. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 132)
   ```
   box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 123, 255, 0.3));
   ```

---

### 📁 `frontend/src/components/admin/ClientCard.css` (CSS)

**하드코딩 색상**: 16개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 4)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 7)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 14)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 22)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(0, 122, 255, 0.15)` (라인 25)
   ```
   0 8px 24px rgba(0, 122, 255, 0.15),
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 26)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

7. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 30)
   ```
   background: rgba(0, 122, 255, 0.1);
   ```

8. **RGBA**: `rgba(0, 122, 255, 0.2)` (라인 33)
   ```
   0 8px 24px rgba(0, 122, 255, 0.2),
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 34)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 63)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

11. **RGBA**: `rgba(0, 122, 255, 0.3)` (라인 109)
   ```
   box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 115)
   ```
   border-top: 1px solid rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 131)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 133)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
   ```

15. **RGBA**: `rgba(52, 199, 89, 0.2)` (라인 147)
   ```
   background: rgba(52, 199, 89, 0.2);
   ```

16. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 150)
   ```
   border: 1px solid rgba(52, 199, 89, 0.3);
   ```

---

### 📁 `frontend/src/components/common/MGLoading.css` (CSS)

**하드코딩 색상**: 15개

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

8. **HEX_6**: `#718096` (라인 246)
   ```
   color: #718096;
   ```

9. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 26)
   ```
   border: 3px solid rgba(102, 126, 234, 0.2);
   ```

10. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 52)
   ```
   border-color: rgba(102, 126, 234, 0.2);
   ```

11. **RGBA**: `rgba(72, 202, 228, 0.2)` (라인 57)
   ```
   border-color: rgba(72, 202, 228, 0.2);
   ```

12. **RGBA**: `rgba(255, 159, 243, 0.2)` (라인 62)
   ```
   border-color: rgba(255, 159, 243, 0.2);
   ```

13. **RGBA**: `rgba(255, 107, 107, 0.2)` (라인 67)
   ```
   border-color: rgba(255, 107, 107, 0.2);
   ```

14. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 234)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 258)
   ```
   background: rgba(255, 255, 255, 0.95);
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

### 📁 `frontend/src/constants/charts.js` (JS)

**하드코딩 색상**: 15개

1. **HEX_6**: `#343a40` (라인 32)
   ```
   DARK: '#343a40',
   ```

2. **HEX_6**: `#34d399` (라인 53)
   ```
   INCOME_FILL: '#34d399',
   ```

3. **HEX_6**: `#0d9488` (라인 64)
   ```
   '#0d9488',
   ```

4. **HEX_6**: `#fb923c` (라인 65)
   ```
   '#fb923c',
   ```

5. **HEX_6**: `#7c3aed` (라인 66)
   ```
   '#7c3aed',
   ```

6. **HEX_6**: `#64748b` (라인 68)
   ```
   '#64748b'
   ```

7. **HEX_6**: `#1e7e34` (라인 73)
   ```
   SUCCESS: ['var(--mg-success-500)', '#1e7e34'],
   ```

8. **HEX_6**: `#e0a800` (라인 74)
   ```
   WARNING: ['var(--mg-warning-500)', '#e0a800'],
   ```

9. **HEX_6**: `#c82333` (라인 75)
   ```
   DANGER: ['var(--mg-error-500)', '#c82333'],
   ```

10. **HEX_6**: `#138496` (라인 76)
   ```
   INFO: ['var(--mg-info-500)', '#138496'],
   ```

11. **HEX_6**: `#545b62` (라인 77)
   ```
   SECONDARY: ['var(--mg-secondary-500)', '#545b62']
   ```

12. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 106)
   ```
   BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 109)
   ```
   BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
   ```

14. **RGBA**: `rgba(0, 0, 0, 0.8)` (라인 161)
   ```
   BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
   ```

15. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 164)
   ```
   BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
   ```

---

### 📁 `frontend/src/components/wellness/WellnessNotificationList.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#FF8E8E` (라인 105)
   ```
   background: linear-gradient(180deg, var(--mg-error-500), #FF8E8E);
   ```

2. **HEX_6**: `#FF8E8E` (라인 133)
   ```
   background: linear-gradient(135deg, var(--mg-error-500), #FF8E8E);
   ```

3. **HEX_6**: `#FFD700` (라인 138)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

4. **HEX_6**: `#FFA500` (라인 138)
   ```
   background: linear-gradient(135deg, #FFD700, #FFA500);
   ```

5. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 15)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

6. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 15)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

7. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 16)
   ```
   border: var(--border-width-thin) solid rgba(255, 182, 193, 0.2);
   ```

8. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 32)
   ```
   box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
   ```

9. **RGBA**: `rgba(255, 250, 240, 0.3)` (라인 97)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

10. **RGBA**: `rgba(255, 255, 250, 0.3)` (라인 97)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.3), rgba(255, 255, 250, 0.3));
   ```

11. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 147)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

12. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 147)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

13. **RGBA**: `rgba(135, 206, 235, 0.1)` (라인 238)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

14. **RGBA**: `rgba(176, 224, 230, 0.1)` (라인 238)
   ```
   background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(176, 224, 230, 0.1));
   ```

---

### 📁 `frontend/src/components/super-admin/PaymentManagement.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#f5576c` (라인 58)
   ```
   background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%);
   ```

2. **HEX_6**: `#4facfe` (라인 62)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

3. **HEX_6**: `#00f2fe` (라인 62)
   ```
   background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
   ```

4. **HEX_6**: `#43e97b` (라인 66)
   ```
   background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
   ```

5. **HEX_6**: `#38f9d7` (라인 66)
   ```
   background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
   ```

6. **HEX_6**: `#ced4da` (라인 109)
   ```
   border: 1px solid #ced4da;
   ```

7. **HEX_6**: `#212529` (라인 303)
   ```
   color: #212529;
   ```

8. **HEX_6**: `#343a40` (라인 327)
   ```
   background-color: #343a40;
   ```

9. **HEX_6**: `#1e7e34` (라인 376)
   ```
   background-color: #1e7e34;
   ```

10. **HEX_6**: `#c82333` (라인 385)
   ```
   background-color: #c82333;
   ```

11. **HEX_6**: `#212529` (라인 390)
   ```
   color: #212529;
   ```

12. **HEX_6**: `#e0a800` (라인 394)
   ```
   background-color: #e0a800;
   ```

13. **HEX_6**: `#f5c6cb` (라인 437)
   ```
   border-color: #f5c6cb;
   ```

14. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 119)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/layout/SimpleHamburgerMenu.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#c82333` (라인 187)
   ```
   background: linear-gradient(135deg, var(--mg-error-500) 0%, #c82333 100%);
   ```

2. **HEX_6**: `#bbdefb` (라인 321)
   ```
   border-color: #bbdefb;
   ```

3. **HEX_6**: `#f1f3f5` (라인 367)
   ```
   background: #f1f3f5;
   ```

4. **HEX_6**: `#c82333` (라인 429)
   ```
   background: #c82333;
   ```

5. **HEX_6**: `#212529` (라인 477)
   ```
   color: #212529;
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 58)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 75)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 111)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

9. **RGBA**: `rgba(102, 126, 234, 0.3)` (라인 119)
   ```
   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 141)
   ```
   box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 183)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
   ```

12. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 190)
   ```
   box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
   ```

13. **RGBA**: `rgba(220, 53, 69, 0.3)` (라인 289)
   ```
   box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
   ```

14. **RGBA**: `rgba(220, 53, 69, 0.4)` (라인 295)
   ```
   box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
   ```

---

### 📁 `frontend/src/components/homepage/Homepage.css` (CSS)

**하드코딩 색상**: 14개

1. **HEX_6**: `#7A9082` (라인 406)
   ```
   color: var(--mg-color-primary-light, #7A9082);
   ```

2. **HEX_6**: `#8A9A90` (라인 452)
   ```
   color: var(--mg-color-text-tertiary, #8A9A90);
   ```

3. **HEX_6**: `#8A9A90` (라인 459)
   ```
   color: var(--mg-color-text-tertiary, #8A9A90);
   ```

4. **HEX_6**: `#D32F2F` (라인 595)
   ```
   color: #D32F2F;
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 23)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

6. **RGBA**: `rgba(0,0,0,0.05)` (라인 25)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
   ```

7. **RGBA**: `rgba(72, 104, 86, 0.35)` (라인 236)
   ```
   radial-gradient(circle at 20% 20%, rgba(72, 104, 86, 0.35) 0%, rgba(0, 0, 0, 0) 45%),
   ```

8. **RGBA**: `rgba(8, 12, 10, 0.45)` (라인 237)
   ```
   linear-gradient(to bottom, rgba(8, 12, 10, 0.45) 0%, rgba(8, 12, 10, 0.62) 100%);
   ```

9. **RGBA**: `rgba(8, 12, 10, 0.62)` (라인 237)
   ```
   linear-gradient(to bottom, rgba(8, 12, 10, 0.45) 0%, rgba(8, 12, 10, 0.62) 100%);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 257)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.35)` (라인 258)
   ```
   text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 270)
   ```
   border: 2px solid rgba(255, 255, 255, 0.85);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 282)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

14. **RGBA**: `rgba(0,0,0,0.05)` (라인 448)
   ```
   border-top: 1px solid rgba(0,0,0,0.05);
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

### 📁 `frontend/src/components/admin/SearchFilterSection.css` (CSS)

**하드코딩 색상**: 13개

1. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 33)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 36)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 43)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 49)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

5. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 51)
   ```
   0 0 0 3px rgba(0, 122, 255, 0.1),
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 53)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 68)
   ```
   border: 2px solid rgba(255, 255, 255, 0.18);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 71)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 79)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 91)
   ```
   background-color: rgba(255, 255, 255, 0.3);
   ```

11. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 93)
   ```
   0 0 0 3px rgba(0, 122, 255, 0.1),
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 95)
   ```
   inset 0 1px 0 rgba(255, 255, 255, 0.2);
   ```

13. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 99)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/styles/auth/TabletLogin.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#fef01b` (라인 347)
   ```
   background: #fef01b;
   ```

2. **HEX_6**: `#fef01b` (라인 349)
   ```
   border-color: #fef01b;
   ```

3. **HEX_6**: `#f4e800` (라인 353)
   ```
   background: #f4e800;
   ```

4. **HEX_6**: `#f4e800` (라인 354)
   ```
   border-color: #f4e800;
   ```

5. **HEX_6**: `#02b351` (라인 364)
   ```
   background: #02b351;
   ```

6. **HEX_6**: `#02b351` (라인 365)
   ```
   border-color: #02b351;
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 135)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

8. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 141)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 183)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

10. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 267)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

11. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 399)
   ```
   background: rgba(59, 130, 246, 0.1);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 432)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/styles/06-components/_session-management.css` (CSS)

**하드코딩 색상**: 12개

1. **RGBA**: `rgba(52, 199, 89, 0.15)` (라인 217)
   ```
   background: rgba(52, 199, 89, 0.15);
   ```

2. **RGBA**: `rgba(52, 199, 89, 0.3)` (라인 222)
   ```
   border: 0.5px solid rgba(52, 199, 89, 0.3);
   ```

3. **RGBA**: `rgba(142, 142, 147, 0.15)` (라인 227)
   ```
   background: rgba(142, 142, 147, 0.15);
   ```

4. **RGBA**: `rgba(142, 142, 147, 0.3)` (라인 232)
   ```
   border: 0.5px solid rgba(142, 142, 147, 0.3);
   ```

5. **RGBA**: `rgba(255, 149, 0, 0.15)` (라인 237)
   ```
   background: rgba(255, 149, 0, 0.15);
   ```

6. **RGBA**: `rgba(255, 149, 0, 0.3)` (라인 242)
   ```
   border: 0.5px solid rgba(255, 149, 0, 0.3);
   ```

7. **RGBA**: `rgba(45, 45, 50, 0.8)` (라인 378)
   ```
   background: rgba(45, 45, 50, 0.8);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 379)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(45, 45, 50, 0.6)` (라인 383)
   ```
   background: rgba(45, 45, 50, 0.6);
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 384)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

11. **RGBA**: `rgba(45, 45, 50, 0.8)` (라인 388)
   ```
   background: rgba(45, 45, 50, 0.8);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 389)
   ```
   border-color: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/styles/01-settings/_glassmorphism.css` (CSS)

**하드코딩 색상**: 12개

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

4. **HEX_6**: `#86868b` (라인 40)
   ```
   --ios-text-secondary: #86868b;
   ```

5. **HEX_6**: `#c7c7cc` (라인 41)
   ```
   --ios-text-tertiary: #c7c7cc;
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 9)
   ```
   --glass-bg-tertiary: rgba(255, 255, 255, 0.15);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.18)` (라인 15)
   ```
   --glass-border: rgba(255, 255, 255, 0.18);
   ```

8. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 16)
   ```
   --glass-border-light: rgba(255, 255, 255, 0.1);
   ```

9. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 17)
   ```
   --glass-border-strong: rgba(255, 255, 255, 0.3);
   ```

10. **RGBA**: `rgba(31, 38, 135, 0.37)` (라인 19)
   ```
   --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
   ```

11. **RGBA**: `rgba(255, 255, 255, 0.4)` (라인 20)
   ```
   --glass-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.4);
   ```

12. **RGBA**: `rgba(31, 38, 135, 0.5)` (라인 21)
   ```
   --glass-shadow-hover: 0 20px 40px rgba(31, 38, 135, 0.5);
   ```

---

### 📁 `frontend/src/components/test/PaymentTest.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#fef7f0` (라인 30)
   ```
   background: #fef7f0;
   ```

2. **HEX_6**: `#f5e6d3` (라인 34)
   ```
   border: 1px solid #f5e6d3;
   ```

3. **HEX_6**: `#ced4da` (라인 64)
   ```
   border: 1px solid #ced4da;
   ```

4. **HEX_6**: `#545b62` (라인 127)
   ```
   background-color: #545b62;
   ```

5. **HEX_6**: `#1e7e34` (라인 136)
   ```
   background-color: #1e7e34;
   ```

6. **HEX_6**: `#138496` (라인 145)
   ```
   background-color: #138496;
   ```

7. **HEX_6**: `#212529` (라인 150)
   ```
   color: #212529;
   ```

8. **HEX_6**: `#e0a800` (라인 154)
   ```
   background-color: #e0a800;
   ```

9. **HEX_6**: `#c82333` (라인 163)
   ```
   background-color: #c82333;
   ```

10. **HEX_6**: `#f3f3f3` (라인 181)
   ```
   border: 2px solid #f3f3f3;
   ```

11. **HEX_6**: `#f5c6cb` (라인 286)
   ```
   border: 1px solid #f5c6cb;
   ```

12. **RGBA**: `rgba(0, 123, 255, 0.25)` (라인 74)
   ```
   box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
   ```

---

### 📁 `frontend/src/components/common/MGForm.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#718096` (라인 129)
   ```
   color: #718096;
   ```

2. **HEX_6**: `#718096` (라인 277)
   ```
   color: #718096;
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 13)
   ```
   box-shadow: 0 8px 32px var(--mg-shadow-light), 0 4px 16px rgba(0, 0, 0, 0.05);
   ```

4. **RGBA**: `rgba(226, 232, 240, 0.6)` (라인 14)
   ```
   border: 1px solid rgba(226, 232, 240, 0.6);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 49)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

6. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 156)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

7. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 174)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

8. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 210)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

9. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 220)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

10. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 253)
   ```
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px var(--mg-shadow-medium);
   ```

11. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 263)
   ```
   box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
   ```

12. **RGBA**: `rgba(26, 32, 44, 0.8)` (라인 308)
   ```
   background: rgba(26, 32, 44, 0.8);
   ```

---

### 📁 `frontend/src/components/common/FormInput.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#c53030` (라인 17)
   ```
   color: #c53030;
   ```

2. **HEX_6**: `#cbd5e0` (라인 35)
   ```
   border: 1px solid #cbd5e0;
   ```

3. **HEX_6**: `#a0aec0` (라인 44)
   ```
   color: #a0aec0;
   ```

4. **HEX_6**: `#3182ce` (라인 53)
   ```
   border: 2px solid #3182ce;
   ```

5. **HEX_6**: `#fff5f5` (라인 65)
   ```
   background-color: #fff5f5;
   ```

6. **HEX_6**: `#edf2f7` (라인 77)
   ```
   background-color: #edf2f7;
   ```

7. **HEX_6**: `#a0aec0` (라인 78)
   ```
   color: #a0aec0;
   ```

8. **HEX_6**: `#cbd5e0` (라인 79)
   ```
   border: 1px solid #cbd5e0;
   ```

9. **HEX_6**: `#718096` (라인 97)
   ```
   color: #718096;
   ```

10. **HEX_6**: `#c53030` (라인 106)
   ```
   color: #c53030;
   ```

11. **RGBA**: `rgba(49, 130, 206, 0.2)` (라인 54)
   ```
   box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
   ```

12. **RGBA**: `rgba(229, 62, 62, 0.2)` (라인 71)
   ```
   box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.2);
   ```

---

### 📁 `frontend/src/components/auth/AuthPageCommon.css` (CSS)

**하드코딩 색상**: 12개

1. **HEX_6**: `#F5F3EF` (라인 163)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

2. **HEX_6**: `#EBE9E4` (라인 188)
   ```
   background-color: var(--mg-surface-secondary, #EBE9E4);
   ```

3. **HEX_6**: `#F5F3EF` (라인 193)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

4. **HEX_6**: `#EBE9E4` (라인 212)
   ```
   background-color: var(--mg-surface-secondary, #EBE9E4);
   ```

5. **HEX_6**: `#4F6B5A` (라인 287)
   ```
   background-color: var(--mg-primary-light, #4F6B5A);
   ```

6. **HEX_6**: `#48bb78` (라인 381)
   ```
   background-color: #48bb78;
   ```

7. **HEX_6**: `#F5F3EF` (라인 397)
   ```
   background-color: var(--mg-surface-primary, #F5F3EF);
   ```

8. **RGBA**: `rgba(44, 44, 44, 0.5)` (라인 30)
   ```
   background: rgba(44, 44, 44, 0.5);
   ```

9. **RGBA**: `rgba(61, 82, 70, 0.1)` (라인 178)
   ```
   box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1);
   ```

10. **RGBA**: `rgba(61, 82, 70, 0.1)` (라인 208)
   ```
   box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1);
   ```

11. **RGBA**: `rgba(61, 82, 70, 0.05)` (라인 314)
   ```
   background-color: rgba(61, 82, 70, 0.05);
   ```

12. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 357)
   ```
   border: 2px solid rgba(255, 255, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/erd/ErdListPage.css` (CSS)

**하드코딩 색상**: 11개

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

11. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 146)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

---

### 📁 `frontend/src/components/consultation/ConsultationHistory.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#fafbfc` (라인 95)
   ```
   background: #fafbfc;
   ```

2. **HEX_6**: `#155724` (라인 195)
   ```
   color: #155724;
   ```

3. **HEX_6**: `#cce5ff` (라인 199)
   ```
   background: #cce5ff;
   ```

4. **HEX_6**: `#004085` (라인 200)
   ```
   color: #004085;
   ```

5. **HEX_6**: `#d1ecf1` (라인 204)
   ```
   background: #d1ecf1;
   ```

6. **HEX_6**: `#0c5460` (라인 205)
   ```
   color: #0c5460;
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 67)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

8. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 105)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
   ```

9. **RGBA**: `rgba(108, 117, 125, 0.3)` (라인 126)
   ```
   box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 140)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 161)
   ```
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
   ```

---

### 📁 `frontend/src/components/common/StatsCardGrid.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#E8E0FF` (라인 63)
   ```
   background-color: #E8E0FF;
   ```

2. **HEX_6**: `#D1C4E9` (라인 64)
   ```
   border: 1px solid #D1C4E9;
   ```

3. **HEX_6**: `#FFE8D1` (라인 68)
   ```
   background-color: #FFE8D1;
   ```

4. **HEX_6**: `#FFCCBC` (라인 69)
   ```
   border: 1px solid #FFCCBC;
   ```

5. **HEX_6**: `#D4F1E0` (라인 73)
   ```
   background-color: #D4F1E0;
   ```

6. **HEX_6**: `#C8E6C9` (라인 74)
   ```
   border: 1px solid #C8E6C9;
   ```

7. **HEX_6**: `#FFE0DB` (라인 78)
   ```
   background-color: #FFE0DB;
   ```

8. **HEX_6**: `#FFCDD2` (라인 79)
   ```
   border: 1px solid #FFCDD2;
   ```

9. **RGBA**: `rgba(0, 123, 255, 0.02)` (라인 285)
   ```
   rgba(0, 123, 255, 0.02) 0%,
   ```

10. **RGBA**: `rgba(40, 167, 69, 0.02)` (라인 286)
   ```
   rgba(40, 167, 69, 0.02) 50%,
   ```

11. **RGBA**: `rgba(255, 193, 7, 0.02)` (라인 287)
   ```
   rgba(255, 193, 7, 0.02) 100%);
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

### 📁 `frontend/src/components/admin/DashboardWidgetEditor.css` (CSS)

**하드코딩 색상**: 11개

1. **HEX_6**: `#f3f4f6` (라인 66)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

2. **HEX_6**: `#9ca3af` (라인 115)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

3. **HEX_6**: `#fff3e0` (라인 208)
   ```
   /* ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff3e0/#e65100 -> 토큰 매핑 부재 */
   ```

4. **HEX_6**: `#e65100` (라인 208)
   ```
   /* ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff3e0/#e65100 -> 토큰 매핑 부재 */
   ```

5. **HEX_6**: `#fff3e0` (라인 212)
   ```
   background-color: #fff3e0;
   ```

6. **HEX_6**: `#e65100` (라인 213)
   ```
   color: #e65100;
   ```

7. **HEX_6**: `#9ca3af` (라인 234)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

8. **HEX_6**: `#fff8f0` (라인 238)
   ```
   /* ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff8f0 -> 토큰 매핑 부재 */
   ```

9. **HEX_6**: `#fff8f0` (라인 241)
   ```
   background-color: #fff8f0;
   ```

10. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 69)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

11. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 108)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

---

### 📁 `frontend/src/components/admin/mapping/MappingFilters.css` (CSS)

**하드코딩 색상**: 11개

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

4. **HEX_6**: `#424245` (라인 57)
   ```
   color: var(--color-text-secondary, #424245);
   ```

5. **HEX_6**: `#D1D1D6` (라인 66)
   ```
   border: 1px solid var(--color-border-primary, #D1D1D6);
   ```

6. **HEX_6**: `#FAFAFA` (라인 68)
   ```
   background: var(--color-bg-primary, #FAFAFA);
   ```

7. **HEX_6**: `#A1A1A6` (라인 82)
   ```
   border-color: var(--color-border-accent, #A1A1A6);
   ```

8. **HEX_6**: `#424245` (라인 103)
   ```
   color: var(--color-text-secondary, #424245);
   ```

9. **HEX_6**: `#F5F5F7` (라인 120)
   ```
   background: var(--color-bg-secondary, #F5F5F7);
   ```

10. **HEX_6**: `#5a6268` (라인 162)
   ```
   background-color: var(--color-gray-dark, #5a6268);
   ```

11. **RGBA**: `rgba(0, 122, 255, 0.1)` (라인 77)
   ```
   box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/common/AppToast.css` (CSS)

**하드코딩 색상**: 10개

1. **HEX_3**: `#888` (라인 137)
   ```
   color: var(--mg-color-text-secondary, #888);
   ```

2. **HEX_6**: `#81C784` (라인 83)
   ```
   background: var(--mg-color-success, #81C784);
   ```

3. **HEX_6**: `#E57373` (라인 87)
   ```
   background: var(--mg-color-error, #E57373);
   ```

4. **HEX_6**: `#6B7F72` (라인 91)
   ```
   background: var(--mg-consultant-primary-light, #6B7F72);
   ```

5. **HEX_6**: `#81C784` (라인 108)
   ```
   color: var(--mg-color-success, #81C784);
   ```

6. **HEX_6**: `#E57373` (라인 112)
   ```
   color: var(--mg-color-error, #E57373);
   ```

7. **HEX_6**: `#6B7F72` (라인 116)
   ```
   color: var(--mg-consultant-primary-light, #6B7F72);
   ```

8. **HEX_6**: `#81C784` (라인 158)
   ```
   background: var(--mg-color-success, #81C784);
   ```

9. **HEX_6**: `#E57373` (라인 162)
   ```
   background: var(--mg-color-error, #E57373);
   ```

10. **HEX_6**: `#6B7F72` (라인 166)
   ```
   background: var(--mg-consultant-primary-light, #6B7F72);
   ```

---

### 📁 `frontend/src/components/admin/DashboardFormModal.css` (CSS)

**하드코딩 색상**: 10개

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

5. **HEX_6**: `#c82333` (라인 488)
   ```
   background-color: var(--mg-color-danger-dark, #c82333);
   ```

6. **HEX_6**: `#c82333` (라인 489)
   ```
   border-color: var(--mg-color-danger-dark, #c82333);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 9)
   ```
   background: var(--mg-modal-overlay-dark, rgba(0, 0, 0, 0.7)) !important;
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.7)` (라인 241)
   ```
   background: var(--mg-modal-overlay-dark, rgba(0, 0, 0, 0.7));
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 259)
   ```
   box-shadow: var(--mg-shadow-xl, 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
   ```

10. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 305)
   ```
   background: var(--mg-hover-overlay-light, rgba(255, 255, 255, 0.1));
   ```

---

### 📁 `frontend/src/constants/mapping.js` (JS)

**하드코딩 색상**: 10개

1. **HEX_6**: `#fd7e14` (라인 49)
   ```
   [MAPPING_STATUS.SUSPENDED]: '#fd7e14',
   ```

2. **HEX_6**: `#6f42c1` (라인 51)
   ```
   [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#6f42c1'
   ```

3. **HEX_6**: `#d1ecf1` (라인 56)
   ```
   [MAPPING_STATUS.PAYMENT_CONFIRMED]: '#d1ecf1',
   ```

4. **HEX_6**: `#ffeaa7` (라인 62)
   ```
   [MAPPING_STATUS.SUSPENDED]: '#ffeaa7',
   ```

5. **HEX_6**: `#e2e3f1` (라인 64)
   ```
   [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#e2e3f1'
   ```

6. **HEX_6**: `#6f42c1` (라인 196)
   ```
   TOTAL: '#6f42c1',
   ```

7. **HEX_6**: `#fd7e14` (라인 198)
   ```
   SESSIONS_EXHAUSTED: '#fd7e14'
   ```

8. **HEX_6**: `#d1ecf1` (라인 206)
   ```
   PAYMENT_CONFIRMED: '#d1ecf1',
   ```

9. **HEX_6**: `#e2e3f1` (라인 207)
   ```
   TOTAL: '#e2e3f1',
   ```

10. **HEX_6**: `#ffeaa7` (라인 209)
   ```
   SESSIONS_EXHAUSTED: '#ffeaa7'
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

### 📁 `frontend/src/components/common/DetailedStatsGrid.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#E8E0FF` (라인 251)
   ```
   background-color: #E8E0FF;
   ```

2. **HEX_6**: `#D1C4E9` (라인 252)
   ```
   border: 1px solid #D1C4E9;
   ```

3. **HEX_6**: `#D4F1E0` (라인 260)
   ```
   background-color: #D4F1E0;
   ```

4. **HEX_6**: `#C8E6C9` (라인 261)
   ```
   border: 1px solid #C8E6C9;
   ```

5. **HEX_6**: `#FFE0DB` (라인 269)
   ```
   background-color: #FFE0DB;
   ```

6. **HEX_6**: `#FFCDD2` (라인 270)
   ```
   border: 1px solid #FFCDD2;
   ```

7. **HEX_6**: `#FFE8D1` (라인 278)
   ```
   background-color: #FFE8D1;
   ```

8. **HEX_6**: `#FFCCBC` (라인 279)
   ```
   border: 1px solid #FFCCBC;
   ```

9. **HEX_6**: `#BBDEFB` (라인 288)
   ```
   border: 1px solid #BBDEFB;
   ```

---

### 📁 `frontend/src/components/clinical/RiskAlertBadge.css` (CSS)

**하드코딩 색상**: 9개

1. **HEX_6**: `#fde68a` (라인 176)
   ```
   background: #fde68a;
   ```

2. **HEX_6**: `#fed7aa` (라인 199)
   ```
   background: #fed7aa;
   ```

3. **HEX_6**: `#9a3412` (라인 200)
   ```
   color: #9a3412;
   ```

4. **RGBA**: `rgba(245, 158, 11, 0.3)` (라인 22)
   ```
   box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
   ```

5. **RGBA**: `rgba(239, 68, 68, 0.4)` (라인 32)
   ```
   box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
   ```

6. **RGBA**: `rgba(239, 68, 68, 0)` (라인 35)
   ```
   box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 55)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

8. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 64)
   ```
   background: rgba(0, 0, 0, 0.3);
   ```

9. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 76)
   ```
   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/common/MGForm.js` (JS)

**하드코딩 색상**: 9개

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

4. **HEX_6**: `#D2B48C` (라인 150)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D2B48C -> var(--mg-custom-D2B48C)
   ```

5. **HEX_6**: `#D2B48C` (라인 151)
   ```
   w-full px-3 py-2 rounded-lg border border-[#D2B48C]
   ```

6. **HEX_6**: `#D2B48C` (라인 212)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D2B48C -> var(--mg-custom-D2B48C)
   ```

7. **HEX_6**: `#D2B48C` (라인 213)
   ```
   w-full px-3 py-2 rounded-lg border border-[#D2B48C]
   ```

8. **HEX_6**: `#D2B48C` (라인 264)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #D2B48C -> var(--mg-custom-D2B48C)
   ```

9. **HEX_6**: `#D2B48C` (라인 265)
   ```
   w-full px-3 py-2 pr-10 rounded-lg border border-[#D2B48C]
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

### 📁 `frontend/src/components/clinical/SOAPNoteEditor.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#e0e7ff` (라인 46)
   ```
   background: #e0e7ff;
   ```

2. **HEX_6**: `#4338ca` (라인 47)
   ```
   color: #4338ca;
   ```

3. **HEX_6**: `#6ee7b7` (라인 62)
   ```
   border: 1px solid #6ee7b7;
   ```

4. **HEX_6**: `#6ee7b7` (라인 149)
   ```
   border: 1px solid #6ee7b7;
   ```

5. **HEX_6**: `#34d399` (라인 219)
   ```
   background: linear-gradient(135deg, var(--mg-success-500), #34d399);
   ```

6. **HEX_6**: `#a78bfa` (라인 227)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500), #a78bfa);
   ```

7. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 81)
   ```
   box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
   ```

8. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 131)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

---

### 📁 `frontend/src/components/auth/BranchLogin.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#16a34a` (라인 6)
   ```
   --branch-login-success: #16a34a;
   ```

2. **HEX_6**: `#d97706` (라인 7)
   ```
   --branch-login-warning: #d97706;
   ```

3. **HEX_6**: `#111827` (라인 16)
   ```
   --branch-login-gray-900: #111827;
   ```

4. **HEX_6**: `#bfdbfe` (라인 388)
   ```
   background: linear-gradient(135deg, var(--mg-color-info-100) 0%, #bfdbfe 100%);
   ```

5. **HEX_6**: `#fca5a5` (라인 557)
   ```
   color: #fca5a5;
   ```

6. **RGBA**: `rgba(37, 99, 235, 0.2)` (라인 93)
   ```
   box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
   ```

7. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 129)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

8. **RGBA**: `rgba(37, 99, 235, 0.3)` (라인 176)
   ```
   box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
   ```

---

### 📁 `frontend/src/components/auth/AccountIntegrationModal.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#bae6fd` (라인 99)
   ```
   border: 1px solid #bae6fd;
   ```

2. **HEX_6**: `#0369a1` (라인 107)
   ```
   color: #0369a1;
   ```

3. **HEX_6**: `#bbf7d0` (라인 166)
   ```
   border: 1px solid #bbf7d0;
   ```

4. **HEX_6**: `#166534` (라인 174)
   ```
   color: #166534;
   ```

5. **HEX_6**: `#dcfce7` (라인 185)
   ```
   background-color: #dcfce7;
   ```

6. **HEX_6**: `#16a34a` (라인 194)
   ```
   color: #16a34a;
   ```

7. **HEX_6**: `#16a34a` (라인 201)
   ```
   color: #16a34a;
   ```

8. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 151)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/TodayStatistics.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#E8E0FF` (라인 132)
   ```
   background: #E8E0FF; /* 파스텔 보라색 */
   ```

2. **HEX_6**: `#D1C4E9` (라인 133)
   ```
   border-color: #D1C4E9;
   ```

3. **HEX_6**: `#D4F1E0` (라인 141)
   ```
   background: #D4F1E0; /* 파스텔 민트색 */
   ```

4. **HEX_6**: `#C8E6C9` (라인 142)
   ```
   border-color: #C8E6C9;
   ```

5. **HEX_6**: `#FFE8D1` (라인 150)
   ```
   background: #FFE8D1; /* 파스텔 오렌지색 */
   ```

6. **HEX_6**: `#FFCCBC` (라인 151)
   ```
   border-color: #FFCCBC;
   ```

7. **HEX_6**: `#FFE0DB` (라인 159)
   ```
   background: #FFE0DB; /* 파스텔 코랄색 */
   ```

8. **HEX_6**: `#FFCDD2` (라인 160)
   ```
   border-color: #FFCDD2;
   ```

---

### 📁 `frontend/src/components/admin/ConsultantComprehensiveManagement.css` (CSS)

**하드코딩 색상**: 8개

1. **HEX_6**: `#e0f2fe` (라인 680)
   ```
   border: 1px solid #e0f2fe;
   ```

2. **HEX_6**: `#e0f2fe` (라인 725)
   ```
   border: 1px solid #e0f2fe;
   ```

3. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 191)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

4. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 233)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

5. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 441)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

6. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 623)
   ```
   box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
   ```

7. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 816)
   ```
   box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
   ```

8. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 827)
   ```
   box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
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

### 📁 `frontend/src/components/landing/CounselingHero.css` (CSS)

**하드코딩 색상**: 7개

1. **RGBA**: `rgba(180, 200, 240, 0.6)` (라인 29)
   ```
   radial-gradient(ellipse at 30% 20%, rgba(180, 200, 240, 0.6) 0%, transparent 60%),
   ```

2. **RGBA**: `rgba(190, 210, 245, 0.5)` (라인 30)
   ```
   radial-gradient(ellipse at 70% 80%, rgba(190, 210, 245, 0.5) 0%, transparent 50%),
   ```

3. **RGBA**: `rgba(200, 220, 250, 0.4)` (라인 31)
   ```
   radial-gradient(ellipse at 20% 70%, rgba(200, 220, 250, 0.4) 0%, transparent 40%),
   ```

4. **RGBA**: `rgba(175, 195, 235, 0.55)` (라인 32)
   ```
   radial-gradient(ellipse at 80% 30%, rgba(175, 195, 235, 0.55) 0%, transparent 45%);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.25)` (라인 169)
   ```
   box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
   ```

6. **RGBA**: `rgba(200, 220, 255, 0.3)` (라인 190)
   ```
   background: rgba(200, 220, 255, 0.3);
   ```

7. **RGBA**: `rgba(175, 195, 235, 0.3)` (라인 198)
   ```
   background: rgba(175, 195, 235, 0.3);
   ```

---

### 📁 `frontend/src/components/emotion/FacialEmotionTimeline.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#60a5fa` (라인 45)
   ```
   .emotion-sorrow .bar { background: linear-gradient(90deg, #60a5fa, var(--mg-primary-500)); }
   ```

2. **HEX_6**: `#f87171` (라인 46)
   ```
   .emotion-anger .bar { background: linear-gradient(90deg, #f87171, var(--mg-color-error)); }
   ```

3. **HEX_6**: `#a78bfa` (라인 47)
   ```
   .emotion-fear .bar { background: linear-gradient(90deg, #a78bfa, var(--mg-purple-500)); }
   ```

4. **HEX_6**: `#34d399` (라인 48)
   ```
   .emotion-surprise .bar { background: linear-gradient(90deg, #34d399, var(--mg-success-500)); }
   ```

5. **HEX_6**: `#60a5fa` (라인 97)
   ```
   .mini-bar.sorrow { background: #60a5fa; }
   ```

6. **HEX_6**: `#f87171` (라인 98)
   ```
   .mini-bar.anger { background: #f87171; }
   ```

7. **HEX_6**: `#a78bfa` (라인 99)
   ```
   .mini-bar.fear { background: #a78bfa; }
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/DesktopLnb.css` (CSS)

**하드코딩 색상**: 7개

1. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 20)
   ```
   border-bottom: 1px solid rgba(255, 255, 255, 0.1);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 26)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 70)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

4. **RGBA**: `rgba(255, 255, 255, 1)` (라인 76)
   ```
   color: rgba(255, 255, 255, 1);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 77)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 83)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 118)
   ```
   border-left: 1px solid rgba(255, 255, 255, 0.15);
   ```

---

### 📁 `frontend/src/components/dashboard/WelcomeSection.css` (CSS)

**하드코딩 색상**: 7개

1. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 99)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 108)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

3. **RGBA**: `rgba(128, 128, 0, 0.2)` (라인 240)
   ```
   box-shadow: 0 2px 8px rgba(128, 128, 0, 0.2);
   ```

4. **RGBA**: `rgba(135, 206, 235, 0.3)` (라인 245)
   ```
   box-shadow: 0 2px 8px rgba(135, 206, 235, 0.3);
   ```

5. **RGBA**: `rgba(255, 107, 157, 0.3)` (라인 250)
   ```
   box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
   ```

6. **RGBA**: `rgba(139, 69, 19, 0.2)` (라인 255)
   ```
   box-shadow: 0 2px 8px rgba(139, 69, 19, 0.2);
   ```

7. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 266)
   ```
   box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
   ```

---

### 📁 `frontend/src/components/dashboard/RecentActivities.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#8b9dc3` (라인 38)
   ```
   color: #8b9dc3;
   ```

2. **HEX_6**: `#5a6c7d` (라인 44)
   ```
   color: #5a6c7d;
   ```

3. **HEX_6**: `#8b9dc3` (라인 49)
   ```
   color: #8b9dc3;
   ```

4. **HEX_6**: `#adb5bd` (라인 125)
   ```
   color: #adb5bd;
   ```

5. **RGBA**: `rgba(102, 126, 234, 0.1)` (라인 73)
   ```
   box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
   ```

6. **RGBA**: `rgba(102, 126, 234, 0.2)` (라인 85)
   ```
   box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
   ```

7. **RGBA**: `rgba(168, 230, 168, 0.2)` (라인 91)
   ```
   box-shadow: 0 2px 4px rgba(168, 230, 168, 0.2);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/common/HeaderWidget.css` (CSS)

**하드코딩 색상**: 7개

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

7. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 7)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

### 📁 `frontend/src/components/admin/Dashboard3DPreview.css` (CSS)

**하드코딩 색상**: 7개

1. **HEX_6**: `#f3f4f6` (라인 78)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

2. **HEX_6**: `#9ca3af` (라인 190)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 118)
   ```
   radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 119)
   ```
   radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.3)` (라인 137)
   ```
   0 20px 25px -5px rgba(0, 0, 0, 0.3),
   ```

6. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 138)
   ```
   0 10px 10px -5px rgba(0, 0, 0, 0.2),
   ```

7. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 139)
   ```
   0 0 0 1px rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/molecules/PipelineStepCard.css` (CSS)

**하드코딩 색상**: 7개

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

7. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 11)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

### 📁 `frontend/src/constants/adminDashboard.js` (JS)

**하드코딩 색상**: 7개

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

4. **HEX_6**: `#86868b` (라인 163)
   ```
   TEXT_SECONDARY: '#86868b',
   ```

5. **HEX_6**: `#c7c7cc` (라인 164)
   ```
   TEXT_TERTIARY: '#c7c7cc',
   ```

6. **HEX_6**: `#f2f2f7` (라인 167)
   ```
   BG_SECONDARY: '#f2f2f7',
   ```

7. **HEX_6**: `#e5e5ea` (라인 168)
   ```
   BG_TERTIARY: '#e5e5ea'
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

### 📁 `frontend/src/components/common/PrivacyPolicy.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#fff3cd` (라인 179)
   ```
   background: var(--mg-custom-fff3cd, #fff3cd);
   ```

2. **HEX_6**: `#ffeaa7` (라인 180)
   ```
   border: 1px solid var(--mg-custom-ffeaa7, #ffeaa7);
   ```

3. **HEX_6**: `#856404` (라인 187)
   ```
   color: var(--mg-custom-856404, #856404);
   ```

4. **HEX_6**: `#e8f4fd` (라인 195)
   ```
   background: var(--mg-custom-e8f4fd, #e8f4fd);
   ```

5. **HEX_6**: `#bee5eb` (라인 196)
   ```
   border: 1px solid var(--mg-custom-bee5eb, #bee5eb);
   ```

6. **HEX_6**: `#0c5460` (라인 205)
   ```
   color: var(--mg-custom-0c5460, #0c5460);
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

### 📁 `frontend/src/components/common/DuplicateLoginAlert.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#fde68a` (라인 46)
   ```
   background: linear-gradient(135deg, var(--mg-color-warning-bg), #fde68a);
   ```

2. **HEX_6**: `#b91c1c` (라인 122)
   ```
   background: linear-gradient(135deg, var(--mg-color-error), #b91c1c);
   ```

3. **HEX_6**: `#b91c1c` (라인 123)
   ```
   border-color: #b91c1c;
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 9)
   ```
   background-color: rgba(0, 0, 0, 0.6);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 24)
   ```
   box-shadow: 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   ```

6. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 155)
   ```
   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
   ```

---

### 📁 `frontend/src/components/admin/DashboardLayoutEditor.css` (CSS)

**하드코딩 색상**: 6개

1. **HEX_6**: `#9ca3af` (라인 182)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

2. **HEX_6**: `#f3f4f6` (라인 220)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

3. **HEX_6**: `#9ca3af` (라인 254)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 150)
   ```
   box-shadow: var(--mg-shadow-md, 0 4px 6px -1px var(--mg-shadow-light), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 162)
   ```
   box-shadow: var(--mg-shadow-lg, 0 10px 15px -3px var(--mg-shadow-light), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
   ```

6. **RGBA**: `rgba(239, 68, 68, 0.1)` (라인 225)
   ```
   background: var(--mg-danger-alpha, rgba(239, 68, 68, 0.1));
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

### 📁 `frontend/src/pages/CounselingCenterLanding.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(240, 248, 255, 0.8)` (라인 9)
   ```
   rgba(240, 248, 255, 0.8) 0%,
   ```

2. **RGBA**: `rgba(245, 245, 250, 0.9)` (라인 10)
   ```
   rgba(245, 245, 250, 0.9) 25%,
   ```

3. **RGBA**: `rgba(250, 248, 255, 0.8)` (라인 11)
   ```
   rgba(250, 248, 255, 0.8) 50%,
   ```

4. **RGBA**: `rgba(240, 248, 255, 0.9)` (라인 12)
   ```
   rgba(240, 248, 255, 0.9) 75%,
   ```

5. **RGBA**: `rgba(245, 250, 255, 0.8)` (라인 13)
   ```
   rgba(245, 250, 255, 0.8) 100%);
   ```

---

### 📁 `frontend/src/components/landing/CounselingServices.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(200, 220, 240, 0.1)` (라인 8)
   ```
   background: rgba(200, 220, 240, 0.1);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 78)
   ```
   0 10px 10px -5px rgba(0, 0, 0, 0.04),
   ```

3. **RGBA**: `rgba(200, 220, 255, 0.4)` (라인 79)
   ```
   0 4px 12px rgba(200, 220, 255, 0.4);
   ```

4. **RGBA**: `rgba(200, 220, 255, 0.3)` (라인 93)
   ```
   background: rgba(200, 220, 255, 0.3);
   ```

5. **RGBA**: `rgba(200, 220, 255, 0.5)` (라인 102)
   ```
   background: rgba(200, 220, 255, 0.5);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/styles/dropdown-common.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#F5F3EF` (라인 39)
   ```
   background-color: var(--mg-color-surface-main, #F5F3EF);
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 17)
   ```
   background-color: rgba(0, 0, 0, 0.4);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.12)` (라인 42)
   ```
   box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 97)
   ```
   background-color: rgba(0, 0, 0, 0.4);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 112)
   ```
   background-color: rgba(0, 0, 0, 0.4);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/MobileLnbDrawer.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 95)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

2. **RGBA**: `rgba(255, 255, 255, 1)` (라인 101)
   ```
   color: rgba(255, 255, 255, 1);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 102)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.85)` (라인 108)
   ```
   color: rgba(255, 255, 255, 0.85);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.15)` (라인 143)
   ```
   border-left: 1px solid rgba(255, 255, 255, 0.15);
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

### 📁 `frontend/src/components/dashboard-v2/atoms/NavLink.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 19)
   ```
   color: var(--mg-layout-sidebar-text, rgba(255, 255, 255, 0.7));
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 28)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 29)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.08)` (라인 74)
   ```
   background: rgba(255, 255, 255, 0.08);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 75)
   ```
   color: rgba(255, 255, 255, 0.9);
   ```

---

### 📁 `frontend/src/components/dashboard/widgets/WidgetCardWrapper.css` (CSS)

**하드코딩 색상**: 5개

1. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 22)
   ```
   background: rgba(255, 255, 255, 0.7);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 24)
   ```
   border: 1px solid rgba(255, 255, 255, 0.3);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.8)` (라인 29)
   ```
   background: rgba(255, 255, 255, 0.8);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 126)
   ```
   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 138)
   ```
   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/common/HelpPage.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#e8f2ff` (라인 5)
   ```
   background: linear-gradient(135deg, var(--mg-color-info-bg) 0%, #e8f2ff 100%);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 51)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 91)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

5. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 137)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/components/admin/DashboardManagement.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#9ca3af` (라인 140)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

2. **HEX_6**: `#dbeafe` (라인 231)
   ```
   background: var(--mg-primary-light, #dbeafe);
   ```

3. **HEX_6**: `#d1fae5` (라인 236)
   ```
   background: var(--mg-success-light, #d1fae5);
   ```

4. **HEX_6**: `#f3f4f6` (라인 241)
   ```
   background: var(--mg-gray-light, #f3f4f6);
   ```

5. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 85)
   ```
   box-shadow: var(--mg-shadow-focus, 0 0 0 3px rgba(59, 130, 246, 0.1));
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

### 📁 `frontend/src/components/admin/commoncode/CommonCodeList.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#f1f5f9` (라인 89)
   ```
   background: linear-gradient(135deg, var(--mg-color-background-main) 0%, #f1f5f9 100%);
   ```

2. **HEX_6**: `#fafbfc` (라인 235)
   ```
   background: #fafbfc;
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 66)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   ```

4. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 269)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

5. **RGBA**: `rgba(239, 68, 68, 0.3)` (라인 282)
   ```
   box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/AdminDashboardPipeline.css` (CSS)

**하드코딩 색상**: 5개

1. **HEX_6**: `#4b745c` (라인 25)
   ```
   --mg-pipeline-primary: #4b745c;
   ```

2. **HEX_6**: `#fff5f5` (라인 30)
   ```
   --mg-pipeline-card-bg-warning: #fff5f5;
   ```

3. **HEX_6**: `#ebf2ee` (라인 31)
   ```
   --mg-pipeline-card-bg-success: #ebf2ee;
   ```

4. **HEX_6**: `#fcf3ed` (라인 32)
   ```
   --mg-pipeline-card-bg-info: #fcf3ed;
   ```

5. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 28)
   ```
   --mg-pipeline-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

### 📁 `frontend/src/styles/auth/TenantSelection.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#f5f7fa` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

2. **HEX_6**: `#c3cfe2` (라인 11)
   ```
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   ```

3. **HEX_6**: `#eff6ff` (라인 73)
   ```
   background-color: #eff6ff;
   ```

4. **HEX_6**: `#eff6ff` (라인 78)
   ```
   background-color: #eff6ff;
   ```

---

### 📁 `frontend/src/styles/06-components/_notifications.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 36)
   ```
   background: var(--notification-toast-bg, rgba(255, 255, 255, 0.95));
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 236)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.3)` (라인 248)
   ```
   background: rgba(255, 255, 255, 0.3);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.6)` (라인 274)
   ```
   background: rgba(0, 0, 0, 0.6);
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

### 📁 `frontend/src/components/emotion/VoiceBiomarkerChart.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6366f1` (라인 84)
   ```
   .indicator-fill.depression { background: linear-gradient(90deg, #6366f1, #4f46e5); }
   ```

2. **HEX_6**: `#4f46e5` (라인 84)
   ```
   .indicator-fill.depression { background: linear-gradient(90deg, #6366f1, #4f46e5); }
   ```

3. **HEX_6**: `#f97316` (라인 85)
   ```
   .indicator-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

4. **HEX_6**: `#ea580c` (라인 85)
   ```
   .indicator-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

---

### 📁 `frontend/src/components/emotion/EmotionDashboard.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6366f1` (라인 83)
   ```
   .metric-bar-fill.depression { background: linear-gradient(90deg, #6366f1, var(--mg-primary-500)); }
   ```

2. **HEX_6**: `#f97316` (라인 84)
   ```
   .metric-bar-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

3. **HEX_6**: `#ea580c` (라인 84)
   ```
   .metric-bar-fill.stress { background: linear-gradient(90deg, #f97316, #ea580c); }
   ```

4. **HEX_6**: `#34d399` (라인 85)
   ```
   .metric-bar-fill.energy { background: linear-gradient(90deg, var(--mg-success-500), #34d399); }
   ```

---

### 📁 `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#F5F3EF` (라인 32)
   ```
   background-color: var(--mg-color-surface-main, #F5F3EF);
   ```

2. **HEX_6**: `#6B7F72` (라인 148)
   ```
   background-color: #6B7F72;
   ```

3. **HEX_6**: `#8B7355` (라인 153)
   ```
   background-color: #8B7355;
   ```

4. **HEX_6**: `#F5F3EF` (라인 212)
   ```
   background-color: var(--mg-color-surface-main, #F5F3EF);
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

### 📁 `frontend/src/components/common/MGLayout.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#f5576c` (라인 65)
   ```
   .mg-section--bg-secondary { background: linear-gradient(135deg, var(--mg-warning-500) 0%, #f5576c 100%); }
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 38)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 46)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 48)
   ```
   border: 1px solid rgba(255, 255, 255, 0.2);
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

### 📁 `frontend/src/components/common/BadgeSelect.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#4A6354` (라인 58)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

2. **HEX_6**: `#4A6354` (라인 59)
   ```
   border-color: var(--mg-color-primary-light, #4A6354);
   ```

3. **HEX_6**: `#4a6354` (라인 129)
   ```
   background-color: var(--mg-color-primary-light, #4a6354);
   ```

4. **HEX_6**: `#4a6354` (라인 130)
   ```
   border-color: var(--mg-color-primary-light, #4a6354);
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

### 📁 `frontend/src/components/clinical/DiagnosticReportEditor.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#6ee7b7` (라인 222)
   ```
   border: 1px solid #6ee7b7;
   ```

2. **HEX_6**: `#78350f` (라인 258)
   ```
   color: #78350f;
   ```

3. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 172)
   ```
   box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
   ```

4. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 204)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/WidgetConfigModal.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#f3f4f6` (라인 84)
   ```
   background: var(--mg-bg-hover, #f3f4f6);
   ```

2. **HEX_6**: `#9ca3af` (라인 145)
   ```
   color: var(--mg-text-tertiary, #9ca3af);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.04)` (라인 33)
   ```
   box-shadow: var(--mg-shadow-lg, 0 20px 25px -5px var(--mg-shadow-light), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
   ```

4. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 126)
   ```
   box-shadow: 0 0 0 3px var(--mg-primary-alpha, rgba(59, 130, 246, 0.1));
   ```

---

### 📁 `frontend/src/components/admin/SystemConfigManagement.css` (CSS)

**하드코딩 색상**: 4개

1. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 24)
   ```
   background: rgba(255, 255, 255, 0.2);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.5)` (라인 156)
   ```
   background: rgba(255, 255, 255, 0.5);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 299)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

4. **RGBA**: `rgba(255, 255, 255, 0.1)` (라인 333)
   ```
   background: rgba(255, 255, 255, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/ProfileCard.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#f3f4f6` (라인 33)
   ```
   background: var(--color-background-alt, #f3f4f6);
   ```

2. **HEX_6**: `#111827` (라인 87)
   ```
   color: var(--color-text-primary, #111827);
   ```

3. **HEX_6**: `#111827` (라인 176)
   ```
   color: var(--color-text-primary, #111827);
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 19)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/AdminMetricsVisualization.css` (CSS)

**하드코딩 색상**: 4개

1. **HEX_6**: `#64748b` (라인 22)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

2. **HEX_6**: `#e2e8f0` (라인 52)
   ```
   border: 1px solid var(--ad-b0kla-border, #e2e8f0);
   ```

3. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 56)
   ```
   box-shadow: var(--ad-b0kla-shadow, 0 8px 24px rgba(0, 0, 0, 0.05));
   ```

4. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 61)
   ```
   box-shadow: var(--ad-b0kla-shadow-hover, 0 12px 32px rgba(0, 0, 0, 0.08));
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

1. **HEX_6**: `#4285F4` (라인 928)
   ```
   <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
   ```

2. **HEX_6**: `#34A853` (라인 929)
   ```
   <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
   ```

3. **HEX_6**: `#FBBC05` (라인 930)
   ```
   <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
   ```

4. **HEX_6**: `#EA4335` (라인 931)
   ```
   <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
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

3. **RGBA**: `rgba(0, 123, 255, 0.2)` (라인 381)
   ```
   background-color: rgba(0, 123, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/prediction/SimilarCasesPanel.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#e0e7ff` (라인 99)
   ```
   background: #e0e7ff;
   ```

2. **HEX_6**: `#3730a3` (라인 102)
   ```
   color: #3730a3;
   ```

3. **HEX_6**: `#047857` (라인 116)
   ```
   color: #047857;
   ```

---

### 📁 `frontend/src/components/prediction/DropoutRiskIndicator.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#78350f` (라인 118)
   ```
   color: #78350f;
   ```

2. **HEX_6**: `#fca5a5` (라인 125)
   ```
   border: 1px solid #fca5a5;
   ```

3. **HEX_6**: `#7f1d1d` (라인 142)
   ```
   color: #7f1d1d;
   ```

---

### 📁 `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#4A6354` (라인 121)
   ```
   background: var(--mg-color-primary-light, #4A6354);
   ```

2. **HEX_6**: `#4A6354` (라인 163)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

3. **RGBA**: `rgba(61, 82, 70, 0.05)` (라인 146)
   ```
   background-color: rgba(61, 82, 70, 0.05);
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

### 📁 `frontend/src/components/consultation/ConsultationReport.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#fafbfc` (라인 114)
   ```
   background: #fafbfc;
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 87)
   ```
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   ```

3. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 123)
   ```
   box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
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

### 📁 `frontend/src/components/common/MgEmailFieldWithAutocomplete.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#F5F3EF` (라인 14)
   ```
   background: var(--mg-color-surface-main, var(--mg-surface-primary, #F5F3EF));
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.08)` (라인 17)
   ```
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
   ```

3. **RGBA**: `rgba(61, 82, 70, 0.08)` (라인 38)
   ```
   background: rgba(61, 82, 70, 0.08);
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

### 📁 `frontend/src/components/common/MGButton.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#4A6354` (라인 80)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

2. **HEX_6**: `#4A6354` (라인 170)
   ```
   background-color: var(--mg-color-primary-light, #4A6354);
   ```

3. **RGBA**: `rgba(61, 82, 70, 0.15)` (라인 200)
   ```
   background-color: var(--mg-color-primary-light, rgba(61, 82, 70, 0.15));
   ```

---

### 📁 `frontend/src/components/common/LoadingSpinnerDemo.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#7c3aed` (라인 72)
   ```
   background: linear-gradient(135deg, var(--mg-color-info), #7c3aed);
   ```

2. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 68)
   ```
   box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
   ```

3. **RGBA**: `rgba(59, 130, 246, 0.4)` (라인 74)
   ```
   box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
   ```

---

### 📁 `frontend/src/components/clinical/SmartNoteTab.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#d97706` (라인 116)
   ```
   background: #d97706;
   ```

2. **HEX_6**: `#bfdbfe` (라인 202)
   ```
   border: 1px solid #bfdbfe;
   ```

3. **RGBA**: `rgba(37, 99, 235, 0.1)` (라인 187)
   ```
   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
   ```

---

### 📁 `frontend/src/components/client/ClientSettings.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#e8f2ff` (라인 7)
   ```
   background: linear-gradient(135deg, var(--mg-color-info-bg) 0%, #e8f2ff 100%);
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 14)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

3. **RGBA**: `rgba(255, 255, 255, 0.2)` (라인 19)
   ```
   border: var(--border-width) solid rgba(255, 255, 255, 0.2);
   ```

---

### 📁 `frontend/src/components/client/ClientSchedule.css` (CSS)

**하드코딩 색상**: 3개

1. **RGBA**: `rgba(255, 250, 240, 0.6)` (라인 30)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

2. **RGBA**: `rgba(255, 255, 250, 0.6)` (라인 30)
   ```
   background: linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(255, 255, 250, 0.6));
   ```

3. **RGBA**: `rgba(255, 182, 193, 0.2)` (라인 31)
   ```
   border: var(--border-width) solid rgba(255, 182, 193, 0.2);
   ```

---

### 📁 `frontend/src/components/billing/SubscriptionManagement.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#eff6ff` (라인 129)
   ```
   background: #eff6ff;
   ```

2. **HEX_6**: `#fcd34d` (라인 158)
   ```
   border: 1px solid #fcd34d;
   ```

3. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 124)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/molecules/MatchQueueRow.css` (CSS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#2d3748` (라인 26)
   ```
   color: var(--mg-text-primary, #2d3748);
   ```

2. **HEX_6**: `#64748b` (라인 32)
   ```
   color: var(--mg-text-secondary, #64748b);
   ```

3. **HEX_6**: `#4b745c` (라인 37)
   ```
   color: var(--mg-pipeline-primary, #4b745c);
   ```

---

### 📁 `frontend/src/constants/clientShopConstants.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#F5F3EF` (라인 137)
   ```
   background: '#F5F3EF',
   ```

2. **HEX_6**: `#EEF4F1` (라인 142)
   ```
   background: '#EEF4F1',
   ```

3. **HEX_6**: `#5C7A6B` (라인 143)
   ```
   accent: '#5C7A6B',
   ```

---

### 📁 `frontend/src/components/consultant/ConsultationRecordScreen.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#fd7e14` (라인 65)
   ```
   { value: 'HIGH', label: '높음', icon: '🟠', color: 'var(--mg-warning-500, #fd7e14)', description: '높은 우선순위' },
   ```

2. **HEX_6**: `#6f42c1` (라인 67)
   ```
   { value: 'CRITICAL', label: '위험', icon: '🚨', color: 'var(--mg-purple-500, #6f42c1)', description: '위험 우선순위' }
   ```

3. **RGBA**: `rgba(0,123,255,0.1)` (라인 245)
   ```
   boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
   ```

---

### 📁 `frontend/src/components/admin/PaymentConfirmationModal.js` (JS)

**하드코딩 색상**: 3개

1. **HEX_6**: `#fee500` (라인 118)
   ```
   { value: 'KAKAO_PAY', label: '카카오페이', icon: '💛', color: '#fee500', description: '카카오페이 간편결제' },
   ```

2. **HEX_6**: `#0064ff` (라인 120)
   ```
   { value: 'TOSS', label: '토스', icon: '🔷', color: '#0064ff', description: '토스 간편결제' },
   ```

3. **HEX_6**: `#0070ba` (라인 121)
   ```
   { value: 'PAYPAL', label: '페이팔', icon: '🔵', color: '#0070ba', description: '페이팔 결제' },
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

### 📁 `frontend/src/components/ui/AdminMenuSidebarUI.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 82)
   ```
   color: var(--mg-layout-sidebar-text, rgba(255, 255, 255, 0.7));
   ```

2. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 112)
   ```
   color: var(--mg-layout-sidebar-text, rgba(255, 255, 255, 0.7));
   ```

---

### 📁 `frontend/src/components/training/VirtualClientSimulator.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#9ca3af` (라인 141)
   ```
   background: var(--cs-secondary-400, #9ca3af);
   ```

2. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 174)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

---

### 📁 `frontend/src/components/test/IntegrationTest.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#212529` (라인 68)
   ```
   color: #212529;
   ```

2. **HEX_6**: `#f3f3f3` (라인 193)
   ```
   border: 4px solid #f3f3f3;
   ```

---

### 📁 `frontend/src/components/emotion/CognitiveDistortionPanel.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#fca5a5` (라인 124)
   ```
   border: 1px solid #fca5a5;
   ```

2. **RGBA**: `rgba(0,0,0,0.05)` (라인 73)
   ```
   box-shadow: 0 1px 2px rgba(0,0,0,0.05);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/MobileGnb.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#2d3748` (라인 41)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

2. **HEX_6**: `#2d3748` (라인 47)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/organisms/DesktopGnb.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#2d3748` (라인 41)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
   ```

2. **HEX_6**: `#2d3748` (라인 47)
   ```
   color: var(--ad-b0kla-title-color, #2d3748);
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

### 📁 `frontend/src/components/dashboard/widgets/NavigationMenuWidget.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#e7f3ff` (라인 51)
   ```
   background-color: #e7f3ff;
   ```

2. **HEX_6**: `#e5e5e5` (라인 93)
   ```
   border-left: 2px solid #e5e5e5;
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

1. **RGBA**: `rgba(255, 255, 255, 0.9)` (라인 129)
   ```
   background: rgba(255, 255, 255, 0.9);
   ```

2. **RGBA**: `rgba(26, 32, 44, 0.9)` (라인 213)
   ```
   background: rgba(26, 32, 44, 0.9);
   ```

---

### 📁 `frontend/src/components/common/ActionButton.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 55)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

2. **RGBA**: `rgba(0, 0, 0, 0.05)` (라인 68)
   ```
   box-shadow: var(--mg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
   ```

---

### 📁 `frontend/src/components/auth/MobileLogin.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#FEE500` (라인 102)
   ```
   background-color: #FEE500;
   ```

2. **HEX_6**: `#191919` (라인 103)
   ```
   color: #191919;
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

### 📁 `frontend/src/components/admin/AdminNotificationsPage.css` (CSS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#F5F3EF` (라인 43)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
   ```

2. **HEX_6**: `#F5F3EF` (라인 113)
   ```
   background: var(--mg-color-surface-main, #F5F3EF);
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

### 📁 `frontend/src/components/admin/commoncode/CommonCodeFilters.css` (CSS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(59, 130, 246, 0.1)` (라인 62)
   ```
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   ```

2. **RGBA**: `rgba(59, 130, 246, 0.3)` (라인 132)
   ```
   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
   ```

---

### 📁 `frontend/src/utils/safeDisplay.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_3**: `#130` (라인 2)
   ```
   * JSX에 넣기 안전한 표시 문자열로 정규화 (React #130: 객체를 자식으로 렌더 방지)
   ```

2. **HEX_3**: `#130` (라인 82)
   ```
   * (React #130: completedCount·completionRate 등이 객체인 경우 방지)
   ```

---

### 📁 `frontend/src/components/emotion/CognitiveDistortionPanel.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#84cc16` (라인 54)
   ```
   if (score > 0.2) return '#84cc16';
   ```

2. **HEX_6**: `#f97316` (라인 56)
   ```
   if (score > -0.5) return '#f97316';
   ```

---

### 📁 `frontend/src/components/consultant/ConsultantMessageScreen.js` (JS)

**하드코딩 색상**: 2개

1. **RGBA**: `rgba(0,123,255,0.1)` (라인 206)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,123,255,0.1) -> var(--mg-custom-color)
   ```

2. **RGBA**: `rgba(0,123,255,0.1)` (라인 207)
   ```
   boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
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

### 📁 `frontend/src/components/clinical/AudioRecorder.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#4a90e2` (라인 263)
   ```
   gradient.addColorStop(0, '#4a90e2');
   ```

2. **RGB**: `rgb(240, 240, 240)` (라인 252)
   ```
   canvasCtx.fillStyle = 'rgb(240, 240, 240)';
   ```

---

### 📁 `frontend/src/components/admin/VacationManagementModal.js` (JS)

**하드코딩 색상**: 2개

1. **HEX_6**: `#60a5fa` (라인 120)
   ```
   // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #60a5fa -> var(--mg-custom-60a5fa)
   ```

2. **HEX_6**: `#60a5fa` (라인 121)
   ```
   { value: 'AFTERNOON_HALF_1', label: '오후 반반차 1 (14:00-16:00)', icon: '🌤️', color: '#60a5fa', description: '오후 첫 번째 반반차 (14:00-16:00)' },
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_loading.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.95)` (라인 31)
   ```
   background: rgba(255, 255, 255, 0.95);
   ```

---

### 📁 `frontend/src/styles/06-components/_base/_iphone17-modals.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.4)` (라인 13)
   ```
   background: rgba(0, 0, 0, 0.4);
   ```

---

### 📁 `frontend/src/components/wellness/PsychoEducation.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.7)` (라인 279)
   ```
   color: rgba(255, 255, 255, 0.7);
   ```

---

### 📁 `frontend/src/components/test/NotificationTest.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(184, 230, 184, 0.2)` (라인 190)
   ```
   box-shadow: 0 0 0 3px rgba(184, 230, 184, 0.2);
   ```

---

### 📁 `frontend/src/components/super-admin/SuperAdminTenantComponentPage.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(61, 82, 70, 0.08)` (라인 106)
   ```
   background: var(--mg-primary-50, var(--mg-color-primary-surface, rgba(61, 82, 70, 0.08)));
   ```

---

### 📁 `frontend/src/components/settings/UserSettings.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.2)` (라인 153)
   ```
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   ```

---

### 📁 `frontend/src/components/schedule/ScheduleB0KlA.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#f3f4f6` (라인 2538)
   ```
   background: var(--mg-gray-100, #f3f4f6);
   ```

---

### 📁 `frontend/src/components/prediction/PredictionDashboard.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#eff6ff` (라인 56)
   ```
   background: #eff6ff;
   ```

---

### 📁 `frontend/src/components/landing/CounselingAbout.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(245, 250, 255, 0.3)` (라인 7)
   ```
   background: rgba(245, 250, 255, 0.3);
   ```

---

### 📁 `frontend/src/components/dashboard-v2/templates/MobileLayout.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#F2EDE8` (라인 16)
   ```
   var(--mg-layout-main-bg-end, #F2EDE8) 100%
   ```

---

### 📁 `frontend/src/components/dashboard-v2/templates/DesktopLayout.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#F2EDE8` (라인 16)
   ```
   var(--mg-layout-main-bg-end, #F2EDE8) 100%
   ```

---

### 📁 `frontend/src/components/dashboard/SummaryPanels.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(168, 230, 168, 0.2)` (라인 85)
   ```
   box-shadow: 0 2px 4px rgba(168, 230, 168, 0.2);
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

### 📁 `frontend/src/components/common/SalaryPrintComponent.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#f9f9f9` (라인 186)
   ```
   background: #f9f9f9;
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

### 📁 `frontend/src/components/admin/MappingEditModal.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 33)
   ```
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/admin/CommonCodeManagementB0KlA.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#fef2f2` (라인 295)
   ```
   background: var(--mg-error-50, #fef2f2);
   ```

---

### 📁 `frontend/src/components/admin/CacheMonitoringDashboard.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#D32F2F` (라인 104)
   ```
   background: #D32F2F;
   ```

---

### 📁 `frontend/src/components/admin/psych-assessment/molecules/PsychReportMarkdownBlock.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#F5F3EF` (라인 10)
   ```
   background: var(--mg-color-surface-main, var(--ad-b0kla-card-bg, #F5F3EF));
   ```

---

### 📁 `frontend/src/components/admin/commoncode/CommonCodeStats.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#7c3aed` (라인 52)
   ```
   background: linear-gradient(135deg, var(--mg-purple-500), #7c3aed);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(255, 255, 255, 0.92)` (라인 1408)
   ```
   color: rgba(255, 255, 255, 0.92);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/SchedulePendingList.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 7)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
   ```

---

### 📁 `frontend/src/components/admin/AdminDashboard/organisms/DepositPendingList.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 0, 0, 0.06)` (라인 7)
   ```
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

### 📁 `frontend/src/components/academy/shared/EmptyState.css` (CSS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#666` (라인 21)
   ```
   color: var(--color-text-secondary, #666);
   ```

---

### 📁 `frontend/src/components/academy/shared/DataTable.css` (CSS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 123, 255, 0.1)` (라인 16)
   ```
   background-color: var(--color-hover, rgba(0, 123, 255, 0.1));
   ```

---

### 📁 `frontend/src/components/prediction/TreatmentOutcomeChart.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#84cc16` (라인 14)
   ```
   'GOOD': '#84cc16',
   ```

---

### 📁 `frontend/src/components/prediction/SimilarCasesPanel.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#84cc16` (라인 14)
   ```
   'GOOD': '#84cc16',
   ```

---

### 📁 `frontend/src/components/erd/ErdDetailPage.js` (JS)

**하드코딩 색상**: 1개

1. **RGBA**: `rgba(0, 123, 255, 0.3)` (라인 242)
   ```
   table.style.filter = 'drop-shadow(0 4px 8px rgba(0, 123, 255, 0.3))';
   ```

---

### 📁 `frontend/src/components/emotion/EmotionDashboard.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#ea580c` (라인 83)
   ```
   'HIGH': '#ea580c',
   ```

---

### 📁 `frontend/src/components/dashboard-v2/content/ContentKpiRow.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 15)
   ```
   /** KPI 텍스트/숫자·객체 혼재 시 React #130 방지 */
   ```

---

### 📁 `frontend/src/components/common/ScheduleList.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#06b6d4` (라인 122)
   ```
   { value: 'STATUS_DESC', label: '상태 내림차순', icon: '🔄', color: '#06b6d4', description: '상태 내림차순 정렬' }
   ```

---

### 📁 `frontend/src/components/common/SalaryPrintComponent.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_6**: `#e8f5e8` (라인 107)
   ```
   backgroundColor: '#e8f5e8',
   ```

---

### 📁 `frontend/src/components/common/SafeNumeric.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 11)
   ```
   * 숫자·문자 혼합 값을 안전한 표시 문자열로 렌더 (React #130 방지)
   ```

---

### 📁 `frontend/src/components/admin/system/TestNotificationForm.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#123` (라인 510)
   ```
   placeholder={t('testNotification.reason.placeholder', '예: 사용자 #123 매핑 확정 알림 변수 매칭 검증')}
   ```

---

### 📁 `frontend/src/components/admin/manual-notification/RecipientPicker.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 8)
   ```
   * - 모든 표시 값은 `toDisplayString` 으로 React #130(객체 자식 렌더) 방어.
   ```

---

### 📁 `frontend/src/components/admin/manual-notification/ManualNotificationForm.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 16)
   ```
   * React #130 방어: `toDisplayString` 적용.
   ```

---

### 📁 `frontend/src/components/admin/manual-notification/ManualNotificationBatchHistory.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 9)
   ```
   * - React #130 방어: 모든 표시 값 `toDisplayString` 변환
   ```

---

### 📁 `frontend/src/components/admin/manual-notification/BatchResultModal.js` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 13)
   ```
   * React #130 방어: 모든 표시 값은 `toDisplayString` 으로 변환.
   ```

---

### 📁 `frontend/src/components/erp/common/atoms/ErpSafeText.jsx` (JS)

**하드코딩 색상**: 1개

1. **HEX_3**: `#130` (라인 2)
   ```
   * ERP 표시 경계 Atom — API/스칼라 외 값을 JSX 자식으로 두기 전에 정규화 (React #130 방지)
   ```

---

### 📁 `frontend/src/locales/ko/admin.json` (JSON)

**하드코딩 색상**: 1개

1. **HEX_3**: `#123` (라인 110)
   ```
   "placeholder": "예: 사용자 #123 매핑 확정 알림 변수 매칭 검증",
   ```

---

