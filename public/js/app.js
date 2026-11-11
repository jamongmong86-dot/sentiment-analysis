/**
 * ==============================================================================
 * 파일명: public/js/app.js
 * 설명: 감성 분석 웹 서비스 프론트엔드 메인 스크립트
 * 기능:
 *   1. 실시간 입력 글자 수 카운팅 및 유효성 검증
 *   2. 백엔드 API (POST /api/analyze) 호출 및 로딩 처리
 *   3. 감성 분석 결과 렌더링 (뱃지, 신뢰도 게이지, 분석 근거)
 *   4. Supabase 연동 최근 분석 이력(최대 5건) 조회 및 표시
 * ==============================================================================
 */

// DOM(Document Object Model) 요소가 모두 준비되면 실행
document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 1. 주요 DOM 엘리먼트 참조
  // -------------------------------------------------------------
  const sentimentForm = document.getElementById('sentiment-form');
  const textInput = document.getElementById('text-input');
  const charCounter = document.getElementById('char-counter');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  // 에러 메시지 박스
  const errorBox = document.getElementById('error-box');
  const errorMessage = document.getElementById('error-message');

  // 결과 표시 영역
  const resultSection = document.getElementById('result-section');
  const resultTime = document.getElementById('result-time');
  const sentimentBadge = document.getElementById('sentiment-badge');
  const confidenceValue = document.getElementById('confidence-value');
  const confidenceBarFill = document.getElementById('confidence-bar-fill');
  const reasonText = document.getElementById('reason-text');

  // 최근 이력 영역
  const historyList = document.getElementById('history-list');

  // -------------------------------------------------------------
  // 2. 초기화 작업: 첫 페이지 로드 시 최근 분석 이력 불러오기
  // -------------------------------------------------------------
  fetchRecentHistory();

  // -------------------------------------------------------------
  // 3. 입력 텍스트 실시간 글자수 카운터 이벤트 리스너
  // -------------------------------------------------------------
  textInput.addEventListener('input', () => {
    const textLength = textInput.value.length;
    charCounter.textContent = `${textLength} / 1000자 (최소 2자)`;

    // 1000자에 도달하면 경고 색상 표시
    if (textLength >= 1000) {
      charCounter.classList.add('error');
    } else {
      charCounter.classList.remove('error');
    }

    // 입력 중에는 기존 에러 메시지 박스 숨김
    hideError();
  });

  // -------------------------------------------------------------
  // 4. 감성 분석 폼 제출(Submit) 이벤트 처리
  // -------------------------------------------------------------
  sentimentForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 기본 폼 제출 동작(새로고침) 방지

    const rawText = textInput.value;
    const trimmedText = rawText.trim();

    // [유효성 검증 TC-01] 공백 전용 또는 최소 2자 미만
    if (!trimmedText || trimmedText.length < 2) {
      showError('입력 텍스트는 공백 제외 최소 2자 이상이어야 합니다.');
      textInput.focus();
      return;
    }

    // [유효성 검증 TC-05] 1,000자 초과 검증
    if (trimmedText.length > 1000) {
      showError('입력 텍스트는 최대 1,000자 이하로 입력해주세요.');
      return;
    }

    // 분석 진행 상태로 UI 전환
    setLoadingState(true);
    hideError();

    try {
      // 백엔드 Serverless API 호출
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: trimmedText })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // 백엔드에서 반환된 에러 메시지 표시
        const errMsg = result.error?.message || '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        showError(errMsg);
        return;
      }

      // 분석 성공 시 결과 렌더링
      renderAnalysisResult(result.data);

      // 입력창 비우기 및 카운터 초기화
      textInput.value = '';
      charCounter.textContent = '0 / 1000자 (최소 2자)';

      // 최근 분석 이력 목록 새로고침
      await fetchRecentHistory();

      // 결과 영역으로 부드럽게 스크롤 이동
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (networkError) {
      console.error('[네트워크 오류]:', networkError);
      showError('네트워크 연결 상태를 확인해주세요. 서버와 통신할 수 없습니다.');
    } finally {
      // 로딩 상태 해제
      setLoadingState(false);
    }
  });

  // -------------------------------------------------------------
  // 5. 분석 결과 화면 렌더링 함수
  // -------------------------------------------------------------
  function renderAnalysisResult(data) {
    if (!data) return;

    // 1) 결과 섹션 노출
    resultSection.style.display = 'block';

    // 2) 생성 시각 포맷팅 (한국 시간 표기)
    const formattedDate = formatDateTime(data.created_at || new Date().toISOString());
    resultTime.textContent = formattedDate;

    // 3) 감성 상태 뱃지 스타일 및 텍스트 적용 (긍정/부정/중립)
    sentimentBadge.className = 'sentiment-badge'; // 클래스 초기화
    if (data.sentiment === '긍정') {
      sentimentBadge.classList.add('badge-positive');
      sentimentBadge.textContent = 'POSITIVE / 긍정';
    } else if (data.sentiment === '부정') {
      sentimentBadge.classList.add('badge-negative');
      sentimentBadge.textContent = 'NEGATIVE / 부정';
    } else {
      sentimentBadge.classList.add('badge-neutral');
      sentimentBadge.textContent = 'NEUTRAL / 중립';
    }

    // 4) 신뢰도 백분율 및 프로그레스 바 적용
    const confidenceNum = Number(data.confidence) || 0;
    confidenceValue.textContent = `${confidenceNum.toFixed(1)}%`;
    // 약간의 딜레이를 주어 프로그레스 바 채워지는 애니메이션 연출
    confidenceBarFill.style.width = '0%';
    setTimeout(() => {
      confidenceBarFill.style.width = `${Math.min(100, Math.max(0, confidenceNum))}%`;
    }, 50);

    // 5) AI 분석 사유 텍스트
    reasonText.textContent = data.reason || '입력된 문맥을 기반으로 도출된 감성 결과입니다.';
  }

  // -------------------------------------------------------------
  // 6. 최근 분석 이력(최대 5건) 조회 및 표시 함수
  // -------------------------------------------------------------
  async function fetchRecentHistory() {
    try {
      const response = await fetch('/api/analyze', {
        method: 'GET'
      });

      if (!response.ok) {
        return;
      }

      const resData = await response.json();
      if (!resData.success || !Array.isArray(resData.data)) {
        return;
      }

      renderHistoryList(resData.data);
    } catch (err) {
      console.warn('[이력 조회 실패]:', err);
    }
  }

  // 이력 리스트 HTML 생성 함수
  function renderHistoryList(items) {
    if (!items || items.length === 0) {
      historyList.innerHTML = '<p class="history-empty">기록된 최근 분석 이력이 없습니다.</p>';
      return;
    }

    historyList.innerHTML = items.map(item => {
      let badgeClass = 'badge-neutral';
      if (item.sentiment === '긍정') badgeClass = 'badge-positive';
      else if (item.sentiment === '부정') badgeClass = 'badge-negative';

      const itemDate = formatDateTime(item.created_at);
      const safeText = escapeHtml(item.input_text);
      const safeReason = escapeHtml(item.reason);
      const confidence = Number(item.confidence || 0).toFixed(1);

      return `
        <article class="history-card">
          <div class="history-card-header">
            <span class="history-tag ${badgeClass}">${item.sentiment} (${confidence}%)</span>
            <time class="history-date">${itemDate}</time>
          </div>
          <p class="history-text">"${safeText}"</p>
          <div class="history-meta">
            <span><strong>이유:</strong> ${safeReason}</span>
          </div>
        </article>
      `;
    }).join('');
  }

  // -------------------------------------------------------------
  // 7. 유틸리티 함수: 로딩 상태, 에러 표시, 날짜 변환 등
  // -------------------------------------------------------------
  
  // 버튼 로딩 상태 토글
  function setLoadingState(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-block';
    } else {
      submitBtn.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoader.style.display = 'none';
    }
  }

  // 에러 메시지 노출
  function showError(msg) {
    errorMessage.textContent = msg;
    errorBox.style.display = 'flex';
  }

  // 에러 메시지 숨김
  function hideError() {
    errorBox.style.display = 'none';
    errorMessage.textContent = '';
  }

  // XSS 방지를 위한 HTML 특수문자 이스케이프 함수
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ISO 날짜 문자열을 한국 시각 형식으로 포맷팅
  function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
});

