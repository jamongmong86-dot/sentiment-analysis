@echo off
chcp 65001 > nul
title SENTIMENT ANALYZER LOCAL SERVER
echo ====================================================
echo   SENTIMENT / AI CORE 로컬 개발 서버 기동 중...
echo ====================================================
set "PATH=%PATH%;C:\Program Files\nodejs"
node server.js
pause

