# docs/01_architecture.md - 시스템 아키텍처 및 시스템 흐름도

## 1. 시스템 전체 구성도

```
[User Browser (Front-End)]
    │
    │  1. HTTP POST /api/analyze (입력 텍스트)
    ▼
[Vercel Serverless Function / Node.js (Back-End)]
    ├── 2. OpenAI API 요청 (gpt-4o-mini / JSON Mode)
    │      ◄── 3. 감성/신뢰도/이유 JSON 응답
    │
    ├── 4. Supabase DB Insert (이력 저장)
    │      ◄── 5. 저장 완료 응답
    │
    ▼
[User Browser (Front-End)] ── 6. UI 업데이트 (결과 및 이력 리로드)
```

---

## 2. 모듈별 역할 및 제약사항

### 2.1 Front-End (`public/index.html`, `public/css/style.css`, `public/js/app.js`)
- **역할**: 사용자 입력 접수, 유효성 검사, API 호출, 결과 애니메이션 및 UI 렌더링.
- **제약**: 외부 라이브러리(Bootstrap, jQuery 등) 금지. 순수 JavaScript `fetch()` 사용.

### 2.2 Back-End Serverless API (`api/analyze.js`)
- **역할**: OpenAI API 연동, JSON 프롬프트 제어, Supabase 데이터베이스 저장, CORS 및 에러 처리.
- **제약**: OpenAI API Key는 클라이언트에 절대 노출하지 않으며 Node.js 환경변수(`process.env`)로 관리.

### 2.3 External Services
- **OpenAI API**: Structured Outputs (JSON Mode)를 통해 규격화된 분석 데이터 추출.
- **Supabase**: PostgreSQL 기반 실시간 이력 저장 및 조회를 위한 DB REST API 이용.