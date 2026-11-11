-- ==============================================================================
-- 파일명: 001_create_sentiment_logs.sql
-- 설명: 감성 분석 결과 이력 저장을 위한 sentiment_logs 테이블 생성 및 RLS 보안 정책 설정
-- 실행 위치: Supabase 대시보드 -> SQL Editor
-- ==============================================================================

-- 1. 감성 분석 이력 테이블 생성
-- 사용자가 입력한 원본 텍스트, 분석 결과(긍정/부정/중립), 신뢰도(0~100), AI 분석 이유, 생성 시간을 저장합니다.
CREATE TABLE IF NOT EXISTS public.sentiment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_text TEXT NOT NULL,
    sentiment VARCHAR(10) NOT NULL CHECK (sentiment IN ('긍정', '부정', '중립')),
    confidence NUMERIC(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 테이블 주석 및 설명 추가
COMMENT ON TABLE public.sentiment_logs IS 'AI 감성 분석 요청 및 결과 이력 테이블';
COMMENT ON COLUMN public.sentiment_logs.id IS '고유 식별자 (UUID)';
COMMENT ON COLUMN public.sentiment_logs.input_text IS '사용자가 입력한 원본 텍스트';
COMMENT ON COLUMN public.sentiment_logs.sentiment IS '감성 분석 결과 (긍정, 부정, 중립)';
COMMENT ON COLUMN public.sentiment_logs.confidence IS '분석 결과 신뢰도 백분율 (0.00 ~ 100.00)';
COMMENT ON COLUMN public.sentiment_logs.reason IS 'AI가 판단한 구체적인 분석 사유';
COMMENT ON COLUMN public.sentiment_logs.created_at IS '생성 일시 (UTC 기준)';

-- 3. 빠른 이력 조회를 위한 인덱스 생성
-- 최근 5건의 이력을 빠르게 정렬하여 조회하기 위해 created_at 컬럼에 내림차순(DESC) 인덱스를 생성합니다.
CREATE INDEX IF NOT EXISTS idx_sentiment_logs_created_at ON public.sentiment_logs (created_at DESC);

-- 4. RLS (Row Level Security) 설정
-- 익명 사용자도 분석 결과를 삽입하고 최근 이력을 조회할 수 있도록 권한 정책을 부여합니다.
ALTER TABLE public.sentiment_logs ENABLE ROW LEVEL SECURITY;

-- (1) 누구나 분석 결과를 저장(INSERT)할 수 있도록 허용하는 정책
CREATE POLICY "Allow public insert" ON public.sentiment_logs
    FOR INSERT WITH CHECK (true);

-- (2) 누구나 분석 이력을 조회(SELECT)할 수 있도록 허용하는 정책
CREATE POLICY "Allow public read" ON public.sentiment_logs
    FOR SELECT USING (true);

