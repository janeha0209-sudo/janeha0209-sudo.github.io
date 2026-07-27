# 하지은 학술 홈페이지

내용은 **전부 노션에서 관리**됩니다. HTML은 열지 않아도 됩니다.

---

## 1. 파일 구조

폴더 구조를 그대로 유지해 주세요.

```
index.html            홈
publications.html     연구실적
books.html            저서
teaching.html         강의실적
press.html            언론보도
data/
  site-data.js        ← 자동 생성. 직접 고치지 마세요 (동기화 때 덮어씁니다)
  site-data.json
scripts/
  sync-notion.mjs     노션 → 데이터 변환
.github/workflows/
  sync-notion.yml     매일 06:00(KST) 자동 실행 + 수동 실행
```

---

## 2. 노션 — 🌐 Homepage Data

| DB | 무엇을 바꾸나 |
|---|---|
| **홈 콘텐츠 Site** | 소개 문구, 약력 3문단, 관심 분야, 학력·경력, 문의 링크, 진단 앱 주소, 챗봇 답변 |
| **연구실적 Research** | 논문 · 학회 발표 · 학위논문 · **저서** · 수상 |
| **강의실적 Teaching** | 강의 |
| **언론보도 Press** | 방송 · 기사 |

공통 규칙 세 가지.

- **`게시` 체크가 켜진 항목만** 사이트에 나옵니다. 끄면 노션 기록은 남고 사이트에서만 사라집니다.
- **`English` 칸을 비우면** 영문 모드에서도 한국어가 그대로 나옵니다.
- **속성 이름을 바꾸지 마세요.** 동기화 스크립트가 이름으로 찾습니다.

### 자주 하는 일

| 하고 싶은 것 | 어디서 |
|---|---|
| 논문 추가 | 연구실적 DB → 새 행, `유형`을 국내학술지/국제학술지 등으로 |
| 저서 추가 | 연구실적 DB → 새 행, `유형 = 저서` |
| 강의 추가 | 강의실적 DB → 새 행 |
| 약력 문구 수정 | 홈 콘텐츠 DB → `구분 = 소개문` |
| **진단 앱 연결** | 홈 콘텐츠 DB → `AI 역량 진단` 행의 `링크`에 주소 입력 + `게시` 체크 |
| 챗봇 답변 추가 | 홈 콘텐츠 DB → `구분 = 챗봇`, `항목`에 키워드를 쉼표로 |

강조는 `<b>이렇게</b>` 감싸면 녹색 밑줄이 들어갑니다.

---

## 3. 최초 설정 (한 번만)

**① 노션 통합 만들기**
notion.so/my-integrations → New integration → 토큰 복사 (`ntn_...`)
노션에서 **🌐 Homepage Data** 페이지 → 우측 상단 `···` → **연결 추가** → 방금 만든 통합 선택.
상위 페이지에 연결하면 DB 네 개에 자동 적용됩니다. **이 단계를 빠뜨리면 동기화가 실패합니다.**

**② GitHub 저장소에 올리기**
저장소 이름을 `<계정명>.github.io` 로 하면 주소가 깔끔해집니다. Public으로 만드세요.

**③ Secrets 5개 등록**
Settings → Secrets and variables → Actions → New repository secret

| 이름 | 값 |
|---|---|
| `NOTION_TOKEN` | ①에서 복사한 토큰 |
| `NOTION_DB_SITE` | `f408d2389bd54960a497bbfbba5fd283` |
| `NOTION_DB_RESEARCH` | `44adcc79b7984cbea7b304a3b9f3c246` |
| `NOTION_DB_TEACHING` | `0ffe3fbc1623465e9c5cd0960321d10e` |
| `NOTION_DB_PRESS` | `07b2118bce0f47ccb16d87edc5c63ea5` |

토큰은 절대 파일에 직접 쓰지 마세요. Secrets에 넣으면 로그에도 가려집니다.

**④ 동기화 한 번 돌리기**
Actions 탭 → `Sync Notion → Site` → **Run workflow**.
초록 체크가 뜨고 `data/site-data.js`가 새로 커밋되면 성공입니다.

**⑤ GitHub Pages 켜기**
Settings → Pages → Source: `Deploy from a branch` → `main / (root)` → Save.
몇 분 뒤 `https://<계정명>.github.io/` 에서 사이트가 열립니다.

---

## 4. 이후 업데이트

노션에서 행을 추가하거나 고치기만 하면 됩니다.

- **자동**: 매일 06:00(KST)
- **즉시**: Actions → `Sync Notion → Site` → Run workflow (1분 소요)

---

## 5. 문제가 생기면

| 증상 | 원인 |
|---|---|
| Actions가 빨간 X, `object_not_found` | 노션 통합을 Homepage Data 페이지에 **연결 추가** 안 함 |
| Actions는 성공인데 화면이 그대로 | 브라우저 캐시. 새로고침(Ctrl+Shift+R) |
| 특정 항목만 안 보임 | 그 행의 `게시` 체크가 꺼져 있음 |
| 링크가 안 열림 | `링크` 값에 `https://` 가 빠졌는지 확인 |
