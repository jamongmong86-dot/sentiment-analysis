# docs/02_ui_design.md - UI/UX 구현 지침 (첨부 디자인 기준)

## 1. 디자인 컨셉 (첨부 이미지 반영)
제시된 레퍼런스 이미지(High-contrast Swiss Typography, Bold Monochrome Style)를 충실히 반영합니다.

- **핵심 특징**:
  1. **초대형 타이포그래피**: 메인 타이틀 및 굵고 직관적인 대형 타이포그래피 적용.
  2. **극명한 흑백 대비**: 흰색 배경(#FFFFFF 또는 #F9F9F9)과 진한 블랙(#000000) 범주 레이아웃.
  3. **좌측 상단 브랜딩 로고 박스**: 검은색 사각형 박스 내 흰색 텍스트/뱃지 아이콘 배치.
  4. **좌측 하단 텍스트 구조**: 본문 설명글은 좌측 하단에 정갈한 고딕 폰트로 배치.
  5. **우측 상단 텍스트 탭**: 상단 메뉴(WORKS, STYLES, PRICE 등) 인터페이스 구조 계승.

---

## 2. 컬러 파렛트 및 타이포그래피

```css
:root {
  --bg-primary: #FFFFFF;
  --text-primary: #000000;
  --text-muted: #666666;
  --border-color: #000000;
  --accent-positive: #10B981; /* 긍정 하이라이트 */
  --accent-negative: #EF4444; /* 부정 하이라이트 */
  --accent-neutral: #6B7280;  /* 중립 하이라이트 */
  --font-family: 'Helvetica Neue', Arial, sans-serif, 'Noto Sans KR';
}
```

---

## 3. UI 레이아웃 구조

### 3.1 Header (상단 영역)
- **좌측**: 검은색 사각형 뱃지 브랜드 로고 (`SENTIMENT / AI PRIZE` 형태)
- **우측**: 우측 상단 메타 메뉴 (`ANALYZER`, `HISTORY`, `ABOUT`)

### 3.2 Hero & Input Area (중앙 영역)
- **대형 타이포그래피**: `emotional / cooooool` 스타일의 굵고 커다란 타이틀 텍스트 (`font-size: 5rem ~ 8rem`).
- **입력 폼**: 
  - 최소한의 선으로 이루어진 텍스트 에어리어 (`textarea`).
  - 굵은 화살표와 함께 배치된 실행 버튼 (`→ 감성 분석 시작`).

### 3.3 Result Display Area (결과 표시 영역)
- **감성 상태 뱃지**: 긍정(POSITIVE), 부정(NEGATIVE), 중립(NEUTRAL)을 커다란 볼드 폰트로 표시.
- **신뢰도 게이지/텍스트**: 예: `98.5% CONFIDENCE` (대문자 타이포그래피).
- **분석 이유 상자**: 굵은 좌측 테두리가 적용된 텍스트 박스.
- **오류 메시지 표시 영역**: 레드 컬러 테두리 및 에러 아이콘을 포함한 알림 상자 (`display: none` 상태에서 에러 시 활성화).

### 3.4 History List Area (하단 영역)
- 좌측 하단 텍스트 구조를 응용하여 최근 5개 분석 기록을 타임라인 카드로 미니멀하게 열거.