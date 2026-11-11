# docs/06_deployment.md - Vercel 배포 및 환경 설정 지침서

## 1. 환경 변수 (Environment Variables) 설정

Vercel 대시보드 -> `Settings` -> `Environment Variables`에 다음 변수 추가:

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI API Secret Key | `sk-proj-xxxx...` |
| `SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (또는 Anon Key) | `eyJhY...` |

---

## 2. Vercel 설정 파일 (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

---

## 3. 배포 순서 및 최종 검증
1. GitHub 저장소에 전체 소스코드 푸시.
2. Vercel 프로젝트 생성 및 저장소 연동.
3. 환경 변수 입력 후 `Deploy` 버튼 클릭.
4. 배포 완료 후 제공된 Vercel Live URL 접속하여 감성 분석 기능 동작 테스트.