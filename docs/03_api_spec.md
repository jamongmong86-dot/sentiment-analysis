# docs/03_api_spec.md - 백엔드 API 및 OpenAI 연동 명세서

## 1. API 엔드포인트: POST `/api/analyze`

### 1.1 요청 (Request)
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "text": "오늘 날씨도 좋고 프로젝트도 너무 잘 진행되어서 기분이 정말 좋습니다!"
}
```

---

### 1.2 응답 (Response - 성공 시 200 OK)
```json
{
  "success": true,
  "data": {
    "sentiment": "긍정",
    "confidence": 95.5,
    "reason": "날씨와 프로젝트 진행 상황에 대해 만족감을 표하고 있으며 '기분이 정말 좋습니다'라는 명시적 긍정 표현이 사용되었습니다.",
    "created_at": "2026-11-10T15:00:00Z"
  }
}
```

---

### 1.3 응답 (Response - 실패 시 400 / 500 Error)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "입력 텍스트는 최소 2자 이상이어야 합니다."
  }
}
```

---

## 2. OpenAI API 프롬프트 구성 지침

백엔드는 OpenAI `https://api.openai.com/v1/chat/completions`를 호출하며, 아래 System Prompt 및 Response Format을 적용해야 합니다.

### System Prompt:
```text
You are an expert AI Sentiment Analyzer. Analyze the sentiment of the user's input text in Korean.
Return ONLY a valid JSON object matching this schema:
{
  "sentiment": "긍정" | "부정" | "중립",
  "confidence": number (between 0.0 and 100.0),
  "reason": "Detailed explanation in Korean why this sentiment was chosen (1-3 sentences)."
}
Do not include markdown codeblocks or any additional text.
```