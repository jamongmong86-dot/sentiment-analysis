# AGENTS.md - Antigravity AI 코딩 에이전트 작업 지침서

## 1. 개요 및 역할
본 문서는 Antigravity AI 코딩 에이전트가 본 프로젝트(감성 분석 웹 서비스) 개발 시 준수해야 하는 행동 수칙, 기술 제약, 개발 워크플로우를 정의합니다. 에이전트는 본 지침을 절대 임의로 변형하지 않으며, 지정된 범위를 이탈하여 추측성 코드를 작성하지 않습니다.

---

## 2. 작업 원칙
1. **명시적 구현 원칙**: 요구사항 및 서브 문서(`docs/`)에 작성된 내용만 구현합니다. 불필요한 기능(회원가입 확장, 소셜 로그인 등)을 자의적으로 추가하지 않습니다.
2. **모듈화 및 문서화**: 작성되는 모든 코드 파일에는 상단에 역할 설명 주석을 작성하고, 각 함수의 파라미터와 반환값 타입을 명시합니다.
3. **오류 예방 우선**: 모든 외부 API 호출(OpenAI, Supabase) 및 사용자 입력 처리에는 예외 처리(`try-catch`)와 유효성 검증을 필수로 적용합니다.

---

## 3. 기술 스택 및 환경 제약
- **Front-End**: Vanilla HTML5, CSS3, JavaScript (ES6+)
  - 프레임워크(React, Vue, Tailwind 등) 사용 금지 (Pure CSS / Flexbox / Grid 활용)
- **Back-End**: Node.js (Express 또는 Vercel Serverless Functions)
- **AI Engine**: OpenAI API (`gpt-4o-mini` 또는 `gpt-3.5-turbo`, JSON Mode 활용)
- **Database**: Supabase (PostgreSQL - JavaScript Client Library `@supabase/supabase-js`)
- **Deployment**: Vercel (환경변수 설정 포함)

---

## 4. 디렉터리 구조 및 파일 조작 규칙
프로젝트 파일 구조는 반드시 아래 형식을 엄격히 유지해야 합니다:

```
sentiment-analysis-app/
├── AGENTS.md
├── PRD.md
├── package.json
├── vercel.json
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── api/
│   └── analyze.js
└── docs/
    ├── 01_architecture.md
    ├── 02_ui_design.md
    ├── 03_api_spec.md
    ├── 04_database.md
    ├── 05_testing_validation.md
    └── 06_deployment.md
```

---

## 5. 단계별 작업 절차 (Workflow)
1. **[1단계] 문서 숙지**: `PRD.md` 및 `docs/` 내 6개 상세 문서를 완전하게 파악합니다.
2. **[2단계] 환경 설정**: Node.js 패키지 초기화 및 필요 의존성 (`@supabase/supabase-js`, `dotenv`, `openai` 등) 정의.
3. **[3단계] DB & API 서버 구축**: Supabase 테이블 작성 및 `/api/analyze` 백엔드 엔드포인트 작성.
4. **[4단계] UI 및 프론트엔드 연동**: 첨부된 디자인 가이드를 반영한 HTML/CSS 작성 및 Fetch API 연동.
5. **[5단계] 검증 및 Vercel 배포**: `docs/05_testing_validation.md` 항목을 준수하여 테스트 후 배포.