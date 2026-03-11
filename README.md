# 🔥 Hot Android Apps

Google Play Store의 인기 무료 앱 순위(광고 포함, 게임/쇼핑 제외)를 수집하여 보여주는 대시보드 애플리케이션입니다.

## ✨ 주요 기능
- **실시간 순위 수집**: Google Play Store에서 최신 100위 권의 앱 정보를 추출합니다.
- **스마트 필터링**: '광고 포함' 앱만 선별하며, 게임 및 쇼핑 카테고리는 제외합니다.
- **성능 최적화**: 병렬 배치 처리 및 조기 종료 로직을 통해 수집 속도를 획기적으로 개선했습니다 (기존 대비 약 12배 향상).
- **랭킹 변화 추적**: 전일 데이터와 비교하여 순위 상승(🚀 급등), 하락(⚠️ 급락), 신규 진입(NEW) 등을 표시합니다.
- **프리미엄 UI**: 현대적이고 깔끔한 다크/라이트 모드 대응 디자인을 제공합니다.

## 🚀 시작하기

### 설치
```bash
npm install
```

### 실행
```bash
npm start
```
서버 실행 후 `http://localhost:3000`에서 확인하실 수 있습니다.

### 기술 스택
- **Backend**: Node.js, Express
- **Scraper**: google-play-scraper (Optimized)
- **Frontend**: Vanilla JS, Modern CSS (Glassmorphism & Micro-animations)
- **Scheduling**: node-cron (매일 KST 00:00 자동 업데이트)

## 📁 프로젝트 구조
- `server.js`: API 엔드포인트 및 스케줄링 관리
- `scraper.js`: 고성능 앱 상세 정보 수집 로직
- `public/`: 프론트엔드 정적 파일 (HTML, CSS)
- `data/`: 일별 히스토리 JSON 데이터 저장소
