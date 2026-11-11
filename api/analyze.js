/**
 * ==============================================================================
 * 파일명: api/analyze.js
 * 설명: Vercel Serverless Function - 감성 분석 요청 처리 및 Supabase DB 연동 API
 * 엔드포인트:
 *   - POST /api/analyze : 입력 텍스트 감성 분석(OpenAI) 및 Supabase DB 저장
 *   - GET  /api/analyze : 최근 분석 이력 목록(최대 5건) Supabase DB 조회
 * ==============================================================================
 */

// 로컬 환경 개발 시 .env 파일 로드를 위해 dotenv 설정
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

/**
 * 환경 변수 검증 및 외부 서비스 인스턴스 초기화
 */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// OpenAI 클라이언트 초기화
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

// Supabase 클라이언트 초기화
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/**
 * Vercel Serverless Function 메인 핸들러 함수
 * 
 * @param {import('http').IncomingMessage & { body?: any, query?: any, method?: string }} req - HTTP 요청 객체
 * @param {import('http').ServerResponse & { status: (code: number) => any, json: (data: any) => any, setHeader: (k: string, v: string) => any }} res - HTTP 응답 객체
 */
module.exports = async function handler(req, res) {
  // CORS 및 응답 헤더 설정 (모든 도메인에서의 호출 허용 및 JSON 응답 명시)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 브라우저의 Preflight(사전) 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET 요청: 최근 분석 이력 5건 조회
  if (req.method === 'GET') {
    return handleGetHistory(req, res);
  }

  // 2. POST 요청: 감성 분석 및 결과 저장
  if (req.method === 'POST') {
    return handlePostAnalyze(req, res);
  }

  // 허용되지 않은 HTTP 메소드 응답
  return res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: `${req.method} 메소드는 지원하지 않습니다. (POST 또는 GET 사용)`
    }
  });
};

/**
 * 최근 분석 이력 목록(최대 5건)을 Supabase에서 조회하는 핸들러
 * 
 * @param {object} req - HTTP 요청 객체
 * @param {object} res - HTTP 응답 객체
 */
async function handleGetHistory(req, res) {
  try {
    // Supabase 설정 여부 확인
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Supabase 연결 설정(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)이 누락되었습니다.'
        }
      });
    }

    // sentiment_logs 테이블에서 생성일시 내림차순으로 최근 5건 조회
    const { data: historyList, error: dbError } = await supabase
      .from('sentiment_logs')
      .select('id, input_text, sentiment, confidence, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (dbError) {
      console.error('[Supabase 조회 에러]:', dbError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '분석 이력을 불러오는 중 데이터베이스 오류가 발생했습니다.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: historyList || []
    });
  } catch (err) {
    console.error('[이력 조회 예외 발생]:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류로 이력을 불러오지 못했습니다.'
      }
    });
  }
}

/**
 * 사용자 입력 텍스트를 분석하고 Supabase에 저장하는 POST 핸들러
 * 
 * @param {object} req - HTTP 요청 객체
 * @param {object} res - HTTP 응답 객체
 */
async function handlePostAnalyze(req, res) {
  try {
    // 요청 바디 파싱 (문자열인 경우 JSON 파싱 처리)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: '요청 본문이 올바른 JSON 형식이 아닙니다.'
          }
        });
      }
    }

    const text = body && typeof body.text === 'string' ? body.text.trim() : '';

    // -------------------------------------------------------------
    // [유효성 검사]
    // 1. 공백 전용 또는 최소 2자 미만
    // 2. 최대 1,000자 초과 검사
    // -------------------------------------------------------------
    if (!text || text.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '입력 텍스트는 공백 제외 최소 2자 이상이어야 합니다.'
        }
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INPUT_TOO_LONG',
          message: '입력 텍스트는 최대 1,000자 이하로 입력해주세요.'
        }
      });
    }

    // -------------------------------------------------------------
    // [환경 변수 검사]
    // OpenAI 및 Supabase 설정 누락 시 적절한 500 에러 반환
    // -------------------------------------------------------------
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your_openai_api_key_here')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'API_KEY_MISSING',
          message: 'OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.'
        }
      });
    }

    if (!supabase || SUPABASE_URL.includes('your-project-id')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SUPABASE_CONFIG_MISSING',
          message: 'Supabase 접속 정보가 올바르게 설정되지 않았습니다. .env 파일을 확인해주세요.'
        }
      });
    }

    // -------------------------------------------------------------
    // [OpenAI API 호출]
    // gpt-4o-mini 모델 및 JSON Mode(response_format) 사용
    // -------------------------------------------------------------
    const systemPrompt = `You are an expert AI Sentiment Analyzer. Analyze the sentiment of the user's input text in Korean.
Return ONLY a valid JSON object matching this schema:
{
  "sentiment": "긍정" | "부정" | "중립",
  "confidence": number (between 0.0 and 100.0),
  "reason": "Detailed explanation in Korean why this sentiment was chosen (1-3 sentences)."
}
Do not include markdown codeblocks or any additional text.`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });
    } catch (aiErr) {
      console.error('[OpenAI 호출 에러]:', aiErr);
      return res.status(500).json({
        success: false,
        error: {
          code: 'OPENAI_API_ERROR',
          message: `AI 분석 요청 중 오류가 발생했습니다: ${aiErr.message || 'API 호출 실패'}`
        }
      });
    }

    // AI 응답 내용 파싱
    const rawContent = completion.choices[0]?.message?.content;
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawContent);
    } catch (jsonErr) {
      console.error('[AI 응답 JSON 파싱 실패]:', rawContent);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_RESPONSE_PARSE_ERROR',
          message: 'AI 응답 데이터를 파싱하지 못했습니다.'
        }
      });
    }

    // 응답 값 안전 검증 및 기본값 보정
    const validSentiments = ['긍정', '부정', '중립'];
    const finalSentiment = validSentiments.includes(parsedResult.sentiment)
      ? parsedResult.sentiment
      : '중립';

    let finalConfidence = Number(parsedResult.confidence);
    if (isNaN(finalConfidence) || finalConfidence < 0 || finalConfidence > 100) {
      finalConfidence = 50.0;
    }
    // 소수점 둘째 자리까지 반올림
    finalConfidence = Math.round(finalConfidence * 100) / 100;

    const finalReason = parsedResult.reason || '입력된 텍스트의 맥락을 분석하여 도출된 결과입니다.';

    // -------------------------------------------------------------
    // [Supabase DB 이력 저장]
    // -------------------------------------------------------------
    const insertPayload = {
      input_text: text,
      sentiment: finalSentiment,
      confidence: finalConfidence,
      reason: finalReason
    };

    const { data: insertedData, error: dbInsertError } = await supabase
      .from('sentiment_logs')
      .insert([insertPayload])
      .select('id, created_at')
      .single();

    if (dbInsertError) {
      console.error('[Supabase 저장 에러]:', dbInsertError);
      // DB 저장이 실패하더라도 사용자에게 분석 결과는 제공하되 로그를 남김
    }

    const createdAt = insertedData?.created_at || new Date().toISOString();

    // -------------------------------------------------------------
    // [성공 응답 반환]
    // -------------------------------------------------------------
    return res.status(200).json({
      success: true,
      data: {
        id: insertedData?.id || null,
        sentiment: finalSentiment,
        confidence: finalConfidence,
        reason: finalReason,
        created_at: createdAt
      }
    });

  } catch (err) {
    console.error('[분석 처리 중 예외 발생]:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
    });
  }
}

