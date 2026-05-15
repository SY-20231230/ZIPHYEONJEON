@echo off
chcp 65001 >nul
echo ========================================================
echo        집현전 통합 AI 서비스 (MolitAI + LegalAI) 시작
echo ========================================================
echo.

echo [1/3] Ollama 서비스 상태 확인 중...
tasklist | find /I "ollama.exe" >nul
if %errorlevel% neq 0 (
    echo [알림] Ollama 서비스가 꺼져 있습니다. 백그라운드에서 실행을 시작합니다...
    start /b ollama serve
    timeout /t 5 >nul
) else (
    echo [알림] Ollama 서비스가 이미 실행 중입니다.
)
echo.

echo [2/3] 필수 AI 모델(qwen2.5:3b) 확인 및 무결성 확보...
echo (이미 다운로드 되어있다면 1~2초 내에 완료됩니다.)
ollama pull qwen2.5:3b
echo.

echo [3/3] 파이썬 패키지 무결성 점검 중...
pip install -r requirements.txt >nul
echo.

echo ========================================================
echo        FastAPI 통합 AI 서버 구동 (포트 8000)
echo ========================================================
python main.py

pause
