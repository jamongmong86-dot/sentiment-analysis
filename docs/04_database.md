# docs/04_database.md - Supabase 데이터베이스 설계 및 스키마 명세

## 1. Supabase 테이블 설계

- **테이블명**: `sentiment_logs`

### 1.1 컬럼 구조 (Schema)

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, `default: gen_random_uuid()` | 고유 식별자 |
| `input_text` | `text` | NOT NULL | 사용자가 입력한 원본 텍스트 |
| `sentiment` | `varchar(10)` | NOT NULL | 분석 결과 (`긍정`, `부정`, `중립`) |
| `confidence` | `numeric(5,2)` | NOT NULL | 신뢰도 백분율 (0.00 ~ 100.00) |
| `reason` | `text` | NOT NULL | AI 분석 이유 |
| `created_at` | `timestamptz` | DEFAULT `now()` | 생성 일시 |

---

## 2. SQL DDL 스크립트 (Supabase SQL Editor 실행용)

```sql
-- 1. 테이블 생성
CREATE TABLE public.sentiment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_text TEXT NOT NULL,
    sentiment VARCHAR(10) NOT NULL CHECK (sentiment IN ('긍정', '부정', '중립')),
    confidence NUMERIC(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS (Row Level Security) 설정 (공동 읽기/쓰기 허용)
ALTER TABLE public.sentiment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.sentiment_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.sentiment_logs
    FOR SELECT USING (true);
```