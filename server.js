/**
 * ==============================================================================
 * 파일명: server.js
 * 설명: 로컬 개발 환경용 경량 HTTP 서버
 * 기능:
 *   1. public/ 폴더 내 정적 파일 (HTML, CSS, JS) 서빙
 *   2. api/analyze.js 서버리스 함수 라우팅 연동 (/api/analyze)
 * 실행 방법:
 *   1) npm install
 *   2) npm start 또는 node server.js
 * ==============================================================================
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

// api/analyze.js 핸들러 불러오기
const analyzeHandler = require('./api/analyze.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME 타입 매핑 표
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. API 라우팅 처리 (/api/analyze)
  if (pathname === '/api/analyze') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      // Vercel Serverless Function 호환을 위한 req.body 파싱
      if (bodyData) {
        try {
          req.body = JSON.parse(bodyData);
        } catch (e) {
          req.body = bodyData;
        }
      } else {
        req.body = {};
      }

      // res 객체에 status() 및 json() 헬퍼 함수 부착 (Vercel 환경과 동일하게 동작)
      res.status = function (statusCode) {
        this.statusCode = statusCode;
        return this;
      };

      res.json = function (data) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(data));
        return this;
      };

      try {
        await analyzeHandler(req, res);
      } catch (handlerErr) {
        console.error('[API 핸들러 에러]:', handlerErr);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: '로컬 서버 처리 중 에러가 발생했습니다.'
            }
          }));
        }
      }
    });
    return;
  }

  // 2. 정적 파일 서빙 (public/ 디렉터리)
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // 디렉터리 접근 시도 방지 (보안 검사)
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: 잘못된 접근입니다.');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 파일이 없을 경우 index.html 반환 (SPA 라우팅 대비)
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error: 파일을 읽을 수 없습니다.');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// 서버 기동
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`[감성 분석 웹 서비스 로컬 서버가 시작되었습니다]`);
  console.log(`- 접속 주소: http://localhost:${PORT}`);
  console.log(`- 종료 방법: 터미널에서 Ctrl + C 를 누르세요`);
  console.log('====================================================');
});

